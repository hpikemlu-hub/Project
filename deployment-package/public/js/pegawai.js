let currentUserName = '';
let currentUserRole = '';
let allData = [];
let filteredData = [];
let currentPage = 1;
let rowsPerPage = 10;
let addModal, editModal, deleteConfirmModal, liveToast;
let rowToDelete = null;

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
    const historyLink = document.querySelector('a[href*="history"]');
    const aksiHeader = document.getElementById('aksiHeader'); // Header Aksi
    
    if (currentUserRole !== 'Admin') {
        // Sembunyikan tombol tambah untuk non-admin
        document.getElementById('addButtonContainer').style.display = 'none';
        
        // Non-admin bisa melihat aksi, jadi tampilkan header Aksi
        if (aksiHeader) aksiHeader.style.display = 'table-cell';
    } else {
        // Admin bisa melihat tombol tambah
        document.getElementById('addButtonContainer').style.display = 'block';
        
        // Admin bisa melihat aksi, jadi tampilkan header Aksi
        if (aksiHeader) aksiHeader.style.display = 'table-cell'; 
    }
}

function loadPageContent() {
    showLoader();
    
    addModal = new bootstrap.Modal(document.getElementById('addPegawaiModal'));
    editModal = new bootstrap.Modal(document.getElementById('editPegawaiModal'));
    deleteConfirmModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
    liveToast = new bootstrap.Toast(document.getElementById('liveToast'));

    loadTableData();
    
    // Event listeners
    document.getElementById('saveAddBtn').addEventListener('click', handleAdd);
    document.getElementById('saveEditBtn').addEventListener('click', handleUpdate);
    document.getElementById('confirmDeleteBtn').addEventListener('click', executeDelete);
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

function loadTableData() {
    showLoader();
    fetch('/api/pegawai/', {
        headers: auth.getAuthHeaders()
    })
    .then(response => response.json())
    .then(data => {
        allData = data.data;
        filteredData = allData;
        displayPegawai(allData);
        hideLoader();
    })
    .catch(err => {
        console.error('Error loading data:', err);
        showNotification("Gagal memuat data: " + err.message, 'error');
        hideLoader();
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

function displayPegawai(data) {
    const tableBody = document.getElementById('dataTableBody');
    tableBody.innerHTML = '';
    
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted p-4">Tidak ada data pegawai untuk ditampilkan.</td></tr>';
        return;
    }

    data.forEach((pegawai, index) => {
        const rowIndex = index + 1;
        
        // Tentukan apakah user bisa mengedit/hapus data ini
        const canModify = (currentUserRole === 'Admin' || pegawai.nama === currentUserName);
        
        let aksiHtml = '';
        if (currentUserRole === 'Admin') {
            // Admin bisa Edit dan Hapus semua
            aksiHtml = `
                <button class="btn btn-primary btn-sm" onclick='handleEdit(${JSON.stringify(pegawai)})' title="Edit"><i class="bi bi-pencil-square"></i></button>
                <button class="btn btn-danger btn-sm ms-1" onclick='handleDelete("${pegawai.id}")' title="Hapus"><i class="bi bi-trash"></i></button>
            `;
        } else if (pegawai.nama === currentUserName) {
            // User hanya bisa Edit data diri sendiri
            aksiHtml = `<button class="btn btn-outline-primary btn-sm" onclick='handleEdit(${JSON.stringify(pegawai)})' title="Edit"><i class="bi bi-pencil-square"></i></button>`;
        } else {
            // Jika User dan bukan datanya, aksiHtml tetap kosong ''
            aksiHtml = '<span class="text-muted">-</span>';
        }

        let tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="text-center fw-bold">${rowIndex}</td>
            <td class="wrap-text fw-medium">${pegawai.nama || '-'}</td>
            <td class="text-center">${pegawai.nip || '-'}</td>
            <td class="text-center">${pegawai.golongan || '-'}</td>
            <td class="wrap-text">${pegawai.jabatan || '-'}</td>
            <td class="text-center">${aksiHtml}</td>
        `;
        tableBody.appendChild(tr);
    });
}

function handleAdd(e) {
    e.preventDefault();
    showLoader();
    
    const pegawaiData = {
        nama: document.getElementById('addNama').value,
        nip: document.getElementById('addNIP').value,
        golongan: document.getElementById('addGolongan').value,
        jabatan: document.getElementById('addJabatan').value,
        username: document.getElementById('addUsername').value,
        password: document.getElementById('addPassword').value,
        role: document.getElementById('addRole').value 
    };

    if (!pegawaiData.nama || !pegawaiData.nip || !pegawaiData.username || !pegawaiData.password) {
        showNotification("Nama, NIP, Username, dan Password wajib diisi.", 'error');
        hideLoader();
        return;
    }

    fetch('/api/pegawai/', {
        method: 'POST',
        headers: auth.getAuthHeaders(),
        body: JSON.stringify(pegawaiData)
    })
    .then(response => response.json())
    .then(result => {
        hideLoader();
        if(result.success){
            document.getElementById('addPegawaiForm').reset();
            addModal.hide();
            showNotification(result.message || "Pegawai berhasil ditambahkan!");
            loadTableData();
        } else {
            showNotification(result.message || "Gagal menambahkan pegawai.", 'error');
        }
    })
    .catch(err => {
        hideLoader();
        showNotification("Terjadi kesalahan: " + err.message, 'error');
    });
}

function handleEdit(pegawai) {
    // Isi form edit dengan data pegawai
    document.getElementById('editPegawaiID').value = pegawai.id;
    document.getElementById('editNama').value = pegawai.nama;
    document.getElementById('editNIP').value = pegawai.nip;
    document.getElementById('editGolongan').value = pegawai.golongan;
    document.getElementById('editJabatan').value = pegawai.jabatan;
    document.getElementById('editUsername').value = pegawai.username; // Tetap diisi untuk dikirim
    document.getElementById('editRole').value = pegawai.role; 
    document.getElementById('editPassword').value = ""; 

    // Kunci field jika yang login adalah 'User'
    const isUser = (currentUserRole !== 'Admin');
    if (isUser) {
        // Hanya nama dan password yang bisa diedit oleh user biasa
        document.getElementById('editNIP').disabled = true;
        document.getElementById('editGolongan').disabled = true;
        document.getElementById('editJabatan').disabled = true;
        document.getElementById('editRole').disabled = true;
    } else {
        // Admin bisa mengedit semua field
        document.getElementById('editNIP').disabled = false;
        document.getElementById('editGolongan').disabled = false;
        document.getElementById('editJabatan').disabled = false;
        document.getElementById('editRole').disabled = false;
    }

    // User bisa mengedit Nama dan Password
    document.getElementById('editNama').disabled = false;
    document.getElementById('editPassword').disabled = false;

    editModal.show();
}

function handleUpdate() {
    const pegawaiData = {
        id: document.getElementById('editPegawaiID').value,
        nama: document.getElementById('editNama').value,
        nip: document.getElementById('editNIP').value,
        golongan: document.getElementById('editGolongan').value,
        jabatan: document.getElementById('editJabatan').value,
        username: document.getElementById('editUsername').value, // Dibaca dari field yg disembunyikan
        password: document.getElementById('editPassword').value, 
        role: document.getElementById('editRole').value 
    };

    if (!pegawaiData.nama || !pegawaiData.nip || !pegawaiData.username) {
        showNotification("Nama, NIP, dan Username wajib diisi.", 'error');
        return;
    }

    showLoader();
    fetch(`/api/pegawai/${pegawaiData.id}`, {
        method: 'PUT',
        headers: auth.getAuthHeaders(),
        body: JSON.stringify({
            nama: pegawaiData.nama,
            nip: pegawaiData.nip,
            golongan: pegawaiData.golongan,
            jabatan: pegawaiData.jabatan,
            username: pegawaiData.username,
            password: pegawaiData.password,
            role: pegawaiData.role
        })
    })
    .then(response => response.json())
    .then(result => {
        hideLoader();
        if(result.success){
            editModal.hide();
            showNotification(result.message || "Data berhasil diperbarui!");
            loadTableData();
        } else {
            showNotification(result.message || "Gagal memperbarui data.", 'error');
        }
    })
    .catch(err => {
        hideLoader();
        showNotification("Terjadi kesalahan: " + err.message, 'error');
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
    
    fetch(`/api/pegawai/${rowToDelete}`, {
        method: 'DELETE',
        headers: auth.getAuthHeaders()
    })
    .then(response => response.json())
    .then(result => {
        hideLoader();
        if (result.success) {
            showNotification(result.message || 'Data berhasil dihapus!'); 
            loadTableData();
        } else {
            showNotification(result.message || 'Gagal menghapus data.', 'error');
        }
    })
    .catch(err => {
        hideLoader();
        showNotification('Terjadi kesalahan pada server: ' + err.message, 'error');
    });
    
    rowToDelete = null; 
}