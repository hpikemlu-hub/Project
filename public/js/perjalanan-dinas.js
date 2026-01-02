let currentUserName = ''; 
let currentUserRole = ''; 
let allData = [];
let filteredData = [];
let currentPage = 1;
let rowsPerPage = 10;
let editModal, deleteConfirmModal, liveToast;
let currentEditingItem = null;
let rowToDelete = null;

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
            adjustUIForRole();
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

function adjustUIForRole() {
    if (currentUserRole !== 'Admin') {
        const addNamaSelect = document.getElementById('addNama');
        addNamaSelect.innerHTML = `<option value="${currentUserName}">${currentUserName}</option>`;
        addNamaSelect.value = currentUserName;
        addNamaSelect.disabled = true;
    }
}

function loadPageContent() {
    showLoader();
    editModal = new bootstrap.Modal(document.getElementById('editModal'));
    deleteConfirmModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
    liveToast = new bootstrap.Toast(document.getElementById('liveToast'));

    loadTableData();
    loadDropdownData();
    
    document.getElementById('addDataForm').addEventListener('submit', handleAdd);
    document.getElementById('saveEditBtn').addEventListener('click', handleUpdate);
    document.getElementById('confirmDeleteBtn').addEventListener('click', executeDelete);
    document.getElementById('searchInput').addEventListener('keyup', handleSearch);
    document.getElementById('rowsPerPage').addEventListener('change', (e) => {
        rowsPerPage = parseInt(e.target.value);
        currentPage = 1;
        setupPagination();
        displayData();
    });
    
    document.getElementById('logoutButton').addEventListener('click', handleLogout);
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
            const addNamaSelect = document.getElementById('addNama');
            const editNamaSelect = document.getElementById('editNama');
            const filterNamaSelect = document.getElementById('filterNama');
            
            if (currentUserRole === 'Admin') {
                addNamaSelect.innerHTML = '<option value="" disabled selected>Pilih Nama...</option>';
                data.users.forEach(user => {
                    addNamaSelect.innerHTML += `<option value="${user.nama}">${user.nama}</option>`;
                    filterNamaSelect.innerHTML += `<option value="${user.nama}">${user.nama}</option>`;
                });
            }
            
            // Populate status dropdowns
            const statusOptions = ['Diajukan', 'Disetujui', 'Ditolak', 'Selesai'];
            const addStatusSelect = document.getElementById('addStatus');
            const editStatusSelect = document.getElementById('editStatus');
            const filterStatusSelect = document.getElementById('filterStatus');
            
            statusOptions.forEach(status => {
                filterStatusSelect.innerHTML += `<option value="${status}">${status}</option>`;
                editStatusSelect.innerHTML += `<option value="${status}">${status}</option>`;
            });
        }
    })
    .catch(error => {
        console.error('Error loading dropdown data:', error);
        hideLoader();
    });
}

function loadTableData() {
    const token = localStorage.getItem('authToken');
    
    fetch('/api/perjalanan-dinas/table-data', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            allData = data.data;
            filteredData = allData;
            updateSummaryStats();
            setupPagination();
            displayData();
        } else {
            showNotification('Gagal memuat data', 'error');
        }
        hideLoader();
    })
    .catch(error => {
        console.error('Error loading table data:', error);
        showNotification('Terjadi kesalahan saat memuat data', 'error');
        hideLoader();
    });
}

function updateSummaryStats() {
    const total = filteredData.length;
    document.getElementById('totalPerjalanan').innerText = total;
}

function displayData() {
    const tableBody = document.getElementById('dataTableBody');
    tableBody.innerHTML = '';
    
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const paginatedItems = filteredData.slice(start, end);

    paginatedItems.forEach(item => {
        let tr = document.createElement('tr');
        
        let aksiHtml = '';
        if (currentUserRole === 'Admin' || item.nama === currentUserName) {
            aksiHtml = `
                <button class="btn btn-primary btn-sm" onclick='handleEdit(${JSON.stringify(item)})'><i class="bi bi-pencil-square"></i></button>
                <button class="btn btn-danger btn-sm ms-1" onclick='handleDelete("${item.id}")'><i class="bi bi-trash"></i></button>
            `;
        } else {
            aksiHtml = ''; 
        }

        tr.innerHTML = `
            <td>${item.nama}</td>
            <td>${item.tujuan || item.perihal_perjalanan_dinas}</td>
            <td class="text-center">${formatDate(item.tanggal_berangkat)}</td>
            <td class="text-center">${formatDate(item.tanggal_kembali)}</td>
            <td class="text-center">${item.biaya || '-'}</td>
            <td class="text-center"><span class="badge ${getStatusColor(item.status)}">${item.status}</span></td>
            <td class="text-center">
                ${aksiHtml}
            </td>`;
        tableBody.appendChild(tr);
    });
}

function handleAdd(e) {
    e.preventDefault();
    showLoader();
    
    const token = localStorage.getItem('authToken');
    const formData = {
        nama: document.getElementById('addNama').value,
        tujuan: document.getElementById('addTujuan').value,
        perihal_perjalanan_dinas: document.getElementById('addKeperluan').value,
        status: document.getElementById('addStatus').value,
        tanggal_berangkat: document.getElementById('addTanggalBerangkat').value,
        tanggal_kembali: document.getElementById('addTanggalKembali').value,
        biaya: document.getElementById('addBiaya').value || null
    };

    fetch('/api/perjalanan-dinas/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        hideLoader();
        if(data.success){
            document.getElementById('addDataForm').reset();
            if (currentUserRole === 'User') {
                document.getElementById('addNama').value = currentUserName;
            }
            showNotification(data.message || "Data berhasil ditambahkan!");
            loadTableData();
        } else {
            showNotification(data.message || "Gagal menambahkan data.", 'error');
        }
    })
    .catch(error => {
        hideLoader();
        console.error('Error adding data:', error);
        showNotification("Terjadi kesalahan: " + error.message, 'error');
    });
}

function handleEdit(item) {
    currentEditingItem = item;
    document.getElementById('editId').value = item.id;
    document.getElementById('editNama').value = item.nama;
    document.getElementById('editTujuan').value = item.tujuan || item.perihal_perjalanan_dinas;
    document.getElementById('editStatus').value = item.status;
    document.getElementById('editTanggalBerangkat').value = item.tanggal_berangkat;
    document.getElementById('editTanggalKembali').value = item.tanggal_kembali;
    document.getElementById('editBiaya').value = item.biaya || '';
    editModal.show();
}

function handleUpdate() {
    showLoader();
    const token = localStorage.getItem('authToken');
    const id = document.getElementById('editId').value;
    
    const formData = {
        tujuan: document.getElementById('editTujuan').value,
        perihal_perjalanan_dinas: document.getElementById('editTujuan').value,
        status: document.getElementById('editStatus').value,
        tanggal_berangkat: document.getElementById('editTanggalBerangkat').value,
        tanggal_kembali: document.getElementById('editTanggalKembali').value,
        biaya: document.getElementById('editBiaya').value || null
    };

    fetch(`/api/perjalanan-dinas/update/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        hideLoader();
        if(data.success){
            editModal.hide();
            showNotification(data.message || "Data berhasil diperbarui!");
            loadTableData();
        } else {
            showNotification(data.message || "Gagal memperbarui data.", 'error');
        }
    })
    .catch(error => {
        hideLoader();
        console.error('Error updating data:', error);
        showNotification("Terjadi kesalahan: " + error.message, 'error');
    });
}

function handleDelete(id) {
    rowToDelete = id;
    deleteConfirmModal.show();
}

function executeDelete() {
    if (rowToDelete === null) return;
    
    deleteConfirmModal.hide();
    showLoader();
    const token = localStorage.getItem('authToken');
    
    fetch(`/api/perjalanan-dinas/delete/${rowToDelete}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        hideLoader();
        if (data.success) {
            showNotification(data.message || 'Data berhasil dihapus!'); 
            loadTableData();
        } else {
            showNotification(data.message || 'Gagal menghapus data.', 'error');
        }
    })
    .catch(error => {
        hideLoader();
        console.error('Error deleting data:', error);
        showNotification('Terjadi kesalahan pada server: ' + error.message, 'error');
    });
    rowToDelete = null; 
}

function handleSearch() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    applyFiltersAndSearch(query);
}

function applyTableFilters(){
    applyFiltersAndSearch(document.getElementById('searchInput').value.toLowerCase());
    bootstrap.Modal.getInstance(document.getElementById('filterModal'))?.hide();
}

function resetTableFilters(){
     document.getElementById('filterStatus').selectedIndex = 0;
     document.getElementById('filterNama').selectedIndex = 0;
     applyFiltersAndSearch(document.getElementById('searchInput').value.toLowerCase());
}

function applyFiltersAndSearch(searchQuery) {
    const statusFilter = document.getElementById('filterStatus').value;
    const namaFilter = document.getElementById('filterNama').value;
    
    filteredData = allData.filter(item => {
        const statusMatch = statusFilter ? item.status === statusFilter : true;
        const namaMatch = namaFilter ? item.nama === namaFilter : true;
        const searchMatch = searchQuery ? 
            Object.values(item).some(value => 
                value && value.toString().toLowerCase().includes(searchQuery)
            ) : true;
        return statusMatch && namaMatch && searchMatch;
    });
    
    currentPage = 1;
    updateSummaryStats();
    setupPagination();
    displayData();
}

function setupPagination() {
    const paginationEl = document.getElementById('pagination');
    paginationEl.innerHTML = ''; 
    const pageCount = Math.ceil(filteredData.length / rowsPerPage);
    
    for (let i = 1; i <= pageCount; i++) {
        let li = document.createElement('li');
        li.className = 'page-item' + (i === currentPage ? ' active' : '');
        let a = document.createElement('a'); 
        a.className = 'page-link'; 
        a.href = '#'; 
        a.innerText = i;
        a.addEventListener('click', (e) => { 
            e.preventDefault(); 
            currentPage = i; 
            displayData();
            document.querySelectorAll('#pagination .page-item').forEach(item => item.classList.remove('active'));
            li.classList.add('active');
        });
        li.appendChild(a); 
        paginationEl.appendChild(li);
    }
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