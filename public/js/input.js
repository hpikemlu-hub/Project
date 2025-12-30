let currentUserName = '';
let currentUserRole = '';
let allData = [];
let filteredData = [];
let currentPage = 1;
let rowsPerPage = 10;
let editModal, deleteConfirmModal, liveToast;
let rowToDelete = null;
let choicesNama, choicesType, choicesFungsi;

document.addEventListener("DOMContentLoaded", function() {
    if (!auth.isAuthenticated()) {
        window.location.href = '/';
        return;
    }
    
    currentUserName = auth.user.nama;
    currentUserRole = auth.user.role;
    document.getElementById('welcomeMessage').textContent = 'Selamat datang, ' + currentUserName;
    
    loadPageContent();
    adjustUIForRole();
});

function adjustUIForRole() {
    const historyLink = document.querySelector('a[href*="page=history"]');
    const aksiHeader = document.getElementById('aksiHeader');
    
    if (currentUserRole !== 'Admin') {
        if (historyLink) historyLink.closest('li').style.display = 'none';
        if (aksiHeader) aksiHeader.style.display = 'none';
    }
}

function loadPageContent() {
    showLoader();
    
    editModal = new bootstrap.Modal(document.getElementById('editModal'));
    deleteConfirmModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
    liveToast = new bootstrap.Toast(document.getElementById('liveToast'));
    
    // Initialize Choices.js
    choicesNama = new Choices(document.getElementById('addNama'), {
        removeItemButton: true,
        placeholder: true,
        placeholderValue: 'Pilih nama...'
    });
    
    choicesType = new Choices(document.getElementById('addType'), {
        removeItemButton: true,
        placeholder: true,
        placeholderValue: 'Pilih type...'
    });
    
    choicesFungsi = new Choices(document.getElementById('addFungsi'), {
        removeItemButton: true,
        placeholder: true,
        placeholderValue: 'Pilih fungsi...'
    });
    
    // Load initial data
    loadFormData();
    loadData();
    
    // Event listeners
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

/**
 * **** PERBAIKAN BUG LOGOUT V.1.3 ****
 * Fungsi ini diperbarui untuk mengarahkan ke URL utama, bukan logout_action
 */
function handleLogout(e) {
    e.preventDefault();
    showLoader();
    fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth.token}`
        }
    })
    .then(() => {
        auth.logout();
    })
    .catch(err => {
        console.error('Logout error:', err);
        auth.logout();
    });
}

function showLoader() { document.getElementById('loader').style.display = 'block'; }
function hideLoader() { document.getElementById('loader').style.display = 'none'; }

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
    toastBody.textContent = message;
    liveToast.show();
}

function loadFormData() {
    fetch('/api/input/data', {
        headers: auth.getAuthHeaders()
    })
    .then(response => response.json())
    .then(data => {
        // Populate nama dropdown
        const namaSelect = document.getElementById('addNama');
        namaSelect.innerHTML = '<option value="" disabled selected>Pilih Nama...</option>';
        
        if (currentUserRole === 'Admin') {
            data.users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.nama;
                option.textContent = user.nama;
                namaSelect.appendChild(option);
            });
        } else {
            // For regular users, only show their own name
            const option = document.createElement('option');
            option.value = currentUserName;
            option.textContent = currentUserName;
            namaSelect.appendChild(option);
            namaSelect.value = currentUserName;
            namaSelect.disabled = true; // Disable for non-admins
        }
        
        // Populate type and fungsi dropdowns
        const typeSelect = document.getElementById('addType');
        const fungsiSelect = document.getElementById('addFungsi');
        
        typeSelect.innerHTML = '<option value="" disabled selected>Pilih Type...</option>';
        fungsiSelect.innerHTML = '<option value="" disabled selected>Pilih Fungsi...</option>';
        
        if (data.dropdownOptions.Type) {
            data.dropdownOptions.Type.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt;
                option.textContent = opt;
                typeSelect.appendChild(option);
            });
        }
        
        if (data.dropdownOptions.Fungsi) {
            data.dropdownOptions.Fungsi.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt;
                option.textContent = opt;
                fungsiSelect.appendChild(option);
            });
        }
        
        // Update Choices instances
        choicesNama.setChoiceByValue('');
        choicesType.setChoiceByValue('');
        choicesFungsi.setChoiceByValue('');
    })
    .catch(error => {
        console.error('Error loading form data:', error);
        showNotification('Gagal memuat data formulir: ' + error.message, 'error');
    });
}

function loadData() {
    const params = new URLSearchParams({
        page: currentPage,
        limit: rowsPerPage
    });
    
    // Add filter parameters if applicable
    const searchQuery = document.getElementById('searchInput').value;
    if (searchQuery) params.append('search', searchQuery);
    
    const filterType = document.getElementById('filterType').value;
    if (filterType) params.append('type', filterType);
    
    const filterStatus = document.getElementById('filterStatus').value;
    if (filterStatus) params.append('status', filterStatus);
    
    fetch(`/api/input/table-data?${params}`, {
        headers: auth.getAuthHeaders()
    })
    .then(response => response.json())
    .then(result => {
        allData = result.data;
        filteredData = allData;
        setupPagination(result.pagination);
        displayData();
        hideLoader();
    })
    .catch(error => {
        console.error('Error loading data:', error);
        showNotification('Gagal memuat data: ' + error.message, 'error');
        hideLoader();
    });
}

function displayData() {
    const tableBody = document.getElementById('dataTableBody');
    tableBody.innerHTML = '';
    
    if (filteredData.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-muted p-4">Tidak ada data ditemukan.</td></tr>`;
        return;
    }
    
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const paginatedItems = filteredData.slice(start, end);
    
    paginatedItems.forEach((row, index) => {
        const rowIndex = start + index;
        let tr = document.createElement('tr');
        
        // Determine if user can edit/delete this row
        const canModify = (currentUserRole === 'Admin' || row.nama === currentUserName);
        
        let aksiHtml = '';
        if (canModify) {
            aksiHtml = `
                <button class="btn btn-primary btn-sm" onclick='handleEdit(${JSON.stringify(row)})' title="Edit"><i class="bi bi-pencil-square"></i></button>
                <button class="btn btn-danger btn-sm ms-1" onclick='handleDelete("${row.id}")' title="Hapus"><i class="bi bi-trash"></i></button>
            `;
        } else {
            aksiHtml = '<span class="text-muted">-</span>';
        }
        
        tr.innerHTML = `
            <td>${row.nama}</td>
            <td class="text-center">${row.type}</td>
            <td class="wrap-text">${row.deskripsi || ''}</td>
            <td class="text-center"><span class="badge ${getStatusColor(row.status)}">${row.status}</span></td>
            <td class="text-center">${row.tgl_diterima}</td>
            <td class="text-center">${row.fungsi}</td>
            <td class="text-center">${aksiHtml}</td>
        `;
        tableBody.appendChild(tr);
    });
}

function setupPagination(paginationData = {}) {
    const paginationEl = document.getElementById('pagination');
    paginationEl.innerHTML = '';
    
    const totalPages = paginationData.totalPages || Math.ceil(filteredData.length / rowsPerPage);
    const currentPage = paginationData.page || this.currentPage;
    
    // Previous button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" onclick="changePage(${currentPage - 1})">Previous</a>`;
    paginationEl.appendChild(prevLi);
    
    // Page numbers (show max 5 pages with current page centered)
    const startPage = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
    const endPage = Math.min(totalPages, startPage + 4);
    
    for (let i = startPage; i <= endPage; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentPage ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#" onclick="changePage(${i})">${i}</a>`;
        paginationEl.appendChild(li);
    }
    
    // Next button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" onclick="changePage(${currentPage + 1})">Next</a>`;
    paginationEl.appendChild(nextLi);
}

function changePage(page) {
    if (page < 1) return;
    
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    if (page > totalPages) return;
    
    currentPage = page;
    displayData();
    
    // Update active class in pagination
    document.querySelectorAll('#pagination .page-item').forEach(item => item.classList.remove('active'));
    const pageItems = document.querySelectorAll('#pagination .page-link');
    for (let item of pageItems) {
        const pageNum = parseInt(item.textContent);
        if (pageNum === page) {
            item.parentElement.classList.add('active');
            break;
        }
    }
}

function handleAdd(e) {
    e.preventDefault();
    showLoader();
    
    const formData = {
        nama: document.getElementById('addNama').value,
        type: document.getElementById('addType').value,
        deskripsi: document.getElementById('addDeskripsi').value,
        status: document.getElementById('addStatus').value,
        tgl_diterima: document.getElementById('addTglDiterima').value,
        fungsi: document.getElementById('addFungsi').value
    };
    
    if (!formData.nama || !formData.type || !formData.status || !formData.tgl_diterima || !formData.fungsi) {
        showNotification("Harap isi semua kolom wajib.", 'error');
        hideLoader();
        return;
    }
    
    fetch('/api/input/add', {
        method: 'POST',
        headers: auth.getAuthHeaders(),
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(result => {
        hideLoader();
        if (result.success) {
            document.getElementById('addDataForm').reset();
            // Reset choices selections
            choicesNama.setChoiceByValue('');
            choicesType.setChoiceByValue('');
            choicesFungsi.setChoiceByValue('');
            showNotification(result.message || "Data berhasil ditambahkan!");
            loadData();
        } else {
            showNotification(result.message || "Gagal menambahkan data.", 'error');
        }
    })
    .catch(error => {
        hideLoader();
        showNotification("Terjadi kesalahan: " + error.message, 'error');
    });
}

function handleEdit(row) {
    document.getElementById('editId').value = row.id;
    document.getElementById('editNama').value = row.nama;
    document.getElementById('editType').value = row.type;
    document.getElementById('editDeskripsi').value = row.deskripsi;
    document.getElementById('editStatus').value = row.status;
    document.getElementById('editTglDiterima').value = row.tgl_diterima;
    document.getElementById('editFungsi').value = row.fungsi;
    
    editModal.show();
}

function handleUpdate() {
    showLoader();
    
    const formData = {
        type: document.getElementById('editType').value,
        deskripsi: document.getElementById('editDeskripsi').value,
        status: document.getElementById('editStatus').value,
        tgl_diterima: document.getElementById('editTglDiterima').value,
        fungsi: document.getElementById('editFungsi').value
    };
    
    const id = document.getElementById('editId').value;
    
    fetch(`/api/input/update/${id}`, {
        method: 'PUT',
        headers: auth.getAuthHeaders(),
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(result => {
        hideLoader();
        if (result.success) {
            editModal.hide();
            showNotification(result.message || "Data berhasil diperbarui!");
            loadData();
        } else {
            showNotification(result.message || "Gagal memperbarui data.", 'error');
        }
    })
    .catch(error => {
        hideLoader();
        showNotification("Terjadi kesalahan: " + error.message, 'error');
    });
}

function handleDelete(id) {
    rowToDelete = id;
    deleteConfirmModal.show();
}

function executeDelete() {
    if (!rowToDelete) return;
    
    deleteConfirmModal.hide();
    showLoader();
    
    fetch(`/api/input/delete/${rowToDelete}`, {
        method: 'DELETE',
        headers: auth.getAuthHeaders()
    })
    .then(response => response.json())
    .then(result => {
        hideLoader();
        if (result.success) {
            showNotification(result.message || "Data berhasil dihapus!");
            loadData();
        } else {
            showNotification(result.message || "Gagal menghapus data.", 'error');
        }
    })
    .catch(error => {
        hideLoader();
        showNotification("Terjadi kesalahan: " + error.message, 'error');
    });
    
    rowToDelete = null;
}

function handleSearch() {
    // This would typically trigger a new API call with search parameters
    // For now, we'll implement client-side search
    const query = document.getElementById('searchInput').value.toLowerCase();
    filteredData = allData.filter(row => {
        return Object.values(row).some(val => 
            String(val).toLowerCase().includes(query)
        );
    });
    
    currentPage = 1;
    setupPagination();
    displayData();
}

function applyTableFilters(){
    loadData();
    bootstrap.Modal.getInstance(document.getElementById('filterModal'))?.hide();
}

function resetTableFilters(){
    document.getElementById('filterType').selectedIndex = 0;
    document.getElementById('filterStatus').selectedIndex = 0;
    document.getElementById('searchInput').value = '';
    loadData();
}

function getStatusColor(status) {
    switch(status) {
        case 'ON - Progress': return 'bg-primary';
        case 'New': return 'bg-info text-dark';
        case 'Pending': return 'bg-warning text-dark';
        case 'Done': return 'bg-success';
        case 'Cancel': return 'bg-danger';
        default: return 'bg-secondary';
    }
}