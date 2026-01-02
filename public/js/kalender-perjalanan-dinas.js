let currentUserName = ''; 
let currentUserRole = ''; 
let allData = [];
let filteredData = [];
let calendar;
let eventDetailModal;
let liveToast;
let currentEvent = null;

document.addEventListener("DOMContentLoaded", function() {
    checkAuth();
});

function checkAuth() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = '/index.html';
        return;
    }

    fetch('/api/auth/verify', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            currentUserName = data.user.nama;
            currentUserRole = data.user.role;
            document.getElementById('welcomeMessage').innerText = 'Selamat datang, ' + data.user.nama;
            loadPageContent();
        } else {
            localStorage.removeItem('authToken');
            window.location.href = '/index.html';
        }
    })
    .catch(error => {
        console.error('Auth error:', error);
        localStorage.removeItem('authToken');
        window.location.href = '/index.html';
    });
}

function loadPageContent() {
    showLoader();
    eventDetailModal = new bootstrap.Modal(document.getElementById('eventDetailModal'));
    liveToast = new bootstrap.Toast(document.getElementById('liveToast'));

    initializeCalendar();
    loadCalendarData();
    loadDropdownData();
    populateMonthFilter();
    
    // Event listeners
    document.getElementById('applyFilters').addEventListener('click', applyFilters);
    document.getElementById('todayBtn').addEventListener('click', goToToday);
    document.getElementById('monthViewBtn').addEventListener('click', () => changeView('dayGridMonth'));
    document.getElementById('listViewBtn').addEventListener('click', () => changeView('listWeek'));
    document.getElementById('editEventBtn').addEventListener('click', editCurrentEvent);
    document.getElementById('logoutButton').addEventListener('click', handleLogout);
}

function initializeCalendar() {
    const calendarEl = document.getElementById('calendar');
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'id',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,listWeek'
        },
        height: 'auto',
        eventClick: handleEventClick,
        eventDidMount: function(info) {
            // Add status class to event element
            const status = info.event.extendedProps.status;
            if (status) {
                info.el.classList.add(`event-status-${status.toLowerCase().replace(/\s+/g, '-')}`);
            }
        },
        loading: function(loading) {
            if (loading) {
                showLoader();
            } else {
                hideLoader();
            }
        }
    });
    calendar.render();
}

function loadCalendarData() {
    const token = localStorage.getItem('authToken');
    
    fetch('/api/perjalanan-dinas/table-data', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            allData = data.data || [];
            filteredData = allData;
            updateSummaryStats();
            renderCalendarEvents();
        } else {
            showNotification(data.message || 'Gagal memuat data', 'error');
        }
        hideLoader();
    })
    .catch(error => {
        console.error('Error loading calendar data:', error);
        showNotification('Terjadi kesalahan saat memuat data: ' + error.message, 'error');
        hideLoader();
    });
}

function loadDropdownData() {
    const token = localStorage.getItem('authToken');
    
    // Load users for dropdown
    fetch('/api/perjalanan-dinas/data', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const filterNamaSelect = document.getElementById('filterNama');
            
            data.users.forEach(user => {
                filterNamaSelect.innerHTML += `<option value="${user.nama}">${user.nama}</option>`;
            });
        }
    })
    .catch(error => {
        console.error('Error loading dropdown data:', error);
    });
}

function populateMonthFilter() {
    const filterBulanSelect = document.getElementById('filterBulan');
    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    
    months.forEach((month, index) => {
        filterBulanSelect.innerHTML += `<option value="${index + 1}">${month}</option>`;
    });
}

function renderCalendarEvents() {
    // Clear existing events
    calendar.removeAllEvents();
    
    // Add filtered events to calendar
    filteredData.forEach(item => {
        const startDate = new Date(item.tanggal_berangkat);
        const endDate = new Date(item.tanggal_kembali);
        
        // Add one day to end date to include it in the event
        endDate.setDate(endDate.getDate() + 1);
        
        const event = {
            id: item.id,
            title: `${item.nama} - ${item.tujuan}`,
            start: startDate,
            end: endDate,
            extendedProps: {
                nama: item.nama,
                tujuan: item.tujuan,
                status: item.status,
                biaya: item.biaya,
                tanggal_berangkat: item.tanggal_berangkat,
                tanggal_kembali: item.tanggal_kembali
            }
        };
        
        calendar.addEvent(event);
    });
}

function updateSummaryStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const total = filteredData.length;
    const sedangBerlangsung = filteredData.filter(item => {
        const startDate = new Date(item.tanggal_berangkat);
        const endDate = new Date(item.tanggal_kembali);
        return startDate <= today && endDate >= today && item.status === 'Disetujui';
    }).length;
    
    const akanDatang = filteredData.filter(item => {
        const startDate = new Date(item.tanggal_berangkat);
        return startDate > today && (item.status === 'Disetujui' || item.status === 'Diajukan');
    }).length;
    
    const selesai = filteredData.filter(item => {
        const endDate = new Date(item.tanggal_kembali);
        return endDate < today || item.status === 'Selesai';
    }).length;
    
    document.getElementById('totalPerjalanan').innerText = total;
    document.getElementById('sedangBerlangsung').innerText = sedangBerlangsung;
    document.getElementById('akanDatang').innerText = akanDatang;
    document.getElementById('selesai').innerText = selesai;
}

function applyFilters() {
    const namaFilter = document.getElementById('filterNama').value;
    const statusFilter = document.getElementById('filterStatus').value;
    const bulanFilter = document.getElementById('filterBulan').value;
    
    filteredData = allData.filter(item => {
        const namaMatch = namaFilter ? item.nama === namaFilter : true;
        const statusMatch = statusFilter ? item.status === statusFilter : true;
        
        let bulanMatch = true;
        if (bulanFilter) {
            const startDate = new Date(item.tanggal_berangkat);
            bulanMatch = (startDate.getMonth() + 1) === parseInt(bulanFilter);
        }
        
        return namaMatch && statusMatch && bulanMatch;
    });
    
    updateSummaryStats();
    renderCalendarEvents();
    showNotification('Filter berhasil diterapkan');
}

function handleEventClick(info) {
    currentEvent = info.event;
    const props = info.event.extendedProps;
    
    const content = `
        <div class="row">
            <div class="col-md-6">
                <p><strong>Nama Pegawai:</strong> ${props.nama}</p>
                <p><strong>Tujuan:</strong> ${props.tujuan}</p>
                <p><strong>Status:</strong> <span class="badge ${getStatusColor(props.status)}">${props.status}</span></p>
            </div>
            <div class="col-md-6">
                <p><strong>Tanggal Berangkat:</strong> ${formatDate(props.tanggal_berangkat)}</p>
                <p><strong>Tanggal Kembali:</strong> ${formatDate(props.tanggal_kembali)}</p>
                <p><strong>DIPA yang Ditanggung:</strong> ${props.biaya || '-'}</p>
            </div>
        </div>
    `;
    
    document.getElementById('eventDetailContent').innerHTML = content;
    
    // Show/hide edit button based on user role and ownership
    const editBtn = document.getElementById('editEventBtn');
    if (currentUserRole === 'Admin' || props.nama === currentUserName) {
        editBtn.style.display = 'block';
    } else {
        editBtn.style.display = 'none';
    }
    
    eventDetailModal.show();
}

function editCurrentEvent() {
    if (!currentEvent) return;
    
    // Redirect to edit page with event ID
    window.location.href = `/perjalanan-dinas.html?edit=${currentEvent.id}`;
}

function goToToday() {
    calendar.today();
}

function changeView(viewType) {
    calendar.changeView(viewType);
}

function handleLogout(e) {
    e.preventDefault();
    const token = localStorage.getItem('authToken');
    
    fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        localStorage.removeItem('authToken');
        window.location.href = '/index.html';
    })
    .catch(error => {
        console.error('Logout error:', error);
        localStorage.removeItem('authToken');
        window.location.href = '/index.html';
    });
}

function showLoader() { 
    document.getElementById('loader').style.display = 'block'; 
}

function hideLoader() { 
    document.getElementById('loader').style.display = 'none'; 
}

function showNotification(message, type = 'success') {
    const toastHeader = document.getElementById('toastHeader');
    const toastBody = document.getElementById('toastBody');
    toastHeader.classList.remove('bg-danger', 'bg-success', 'text-white');
    if (type === 'success') {
        toastHeader.classList.add('bg-success', 'text-white');
        toastHeader.querySelector('i').className = 'bi bi-check-circle-fill me-2';
    } else {
        toastHeader.classList.add('bg-danger', 'text-white');
        toastHeader.querySelector('i').className = 'bi bi-exclamation-triangle-fill me-2';
    }
    toastBody.innerText = message;
    liveToast.show();
}

function formatDate(dateStr) { 
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID');
}

function getStatusColor(status) {
    switch(status) {
        case 'Disetujui': return 'bg-success';
        case 'Diajukan': return 'bg-info';
        case 'Ditolak': return 'bg-danger';
        case 'Selesai': return 'bg-warning text-dark';
        default: return 'bg-secondary';
    }
}