class Dashboard {
  constructor() {
    this.baseURL = '/api';
    this.currentFilter = 'all';
    this.allData = [];
    this.statusChartInstance = null;
    this.typeChartInstance = null;
    this.init();
  }

  async init() {
    if (!auth.isAuthenticated()) {
      window.location.href = '/';
      return;
    }

    this.updateWelcomeMessage();
    await this.loadData();
    this.setupEventListeners();
  }

  updateWelcomeMessage() {
    const welcomeEl = document.getElementById('welcomeMessage');
    if (welcomeEl && auth.user) {
      welcomeEl.textContent = `Selamat datang, ${auth.user.nama}`;
    }
  }

  async loadData() {
    try {
      const response = await fetch(`${this.baseURL}/dashboard/data?name=${this.currentFilter}`, {
        headers: auth.getAuthHeaders()
      });
      
      const result = await response.json();
      
      if (result.data) {
        this.allData = result.data;
        this.renderDashboard(this.allData);
        this.updateSummaryStats(this.allData);
        this.renderCharts(this.allData);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  }

  renderDashboard(data) {
    // Group data by nama
    const grouped = data.reduce((acc, item) => {
      if (!acc[item.nama]) acc[item.nama] = [];
      acc[item.nama].push(item);
      return acc;
    }, {});

    // Render cards (similar to original logic)
    const container = document.getElementById('dashboard-content');
    container.innerHTML = '';

    Object.entries(grouped).forEach(([nama, items]) => {
      if (items.length > 0) {
        container.innerHTML += this.generateCardHTML(nama, items);
      }
    });
  }

  updateSummaryStats(data) {
    const total = data.length;
    const done = data.filter(row => row.status === 'Done').length;
    const progress = data.filter(row => row.status === 'ON - Progress').length;
    const pending = data.filter(row => row.status === 'Pending').length;

    document.getElementById('totalJobs').innerText = total;
    document.getElementById('doneJobs').innerText = done;
    document.getElementById('progressJobs').innerText = progress;
    document.getElementById('pendingJobs').innerText = pending;
  }
  
  renderCharts(data) {
    // Destroy existing chart instances if they exist
    if(this.statusChartInstance) {
      this.statusChartInstance.destroy();
    }
    if(this.typeChartInstance) {
      this.typeChartInstance.destroy();
    }

    // Status chart
    const statusCtx = document.getElementById('statusChart').getContext('2d');
    const statusCounts = data.reduce((acc, row) => {
      const status = row.status || 'Tidak Diketahui';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    this.statusChartInstance = new Chart(statusCtx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(statusCounts),
        datasets: [{
          data: Object.values(statusCounts),
          backgroundColor: ['#198754', '#0dcaf0', '#ffc107', '#0d6efd', '#6c757d', '#dc3545'],
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });

    // Type chart
    const typeCtx = document.getElementById('typeChart').getContext('2d');
    const typeCounts = data.reduce((acc, row) => {
      const type = row.type || 'Tidak Diketahui';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    this.typeChartInstance = new Chart(typeCtx, {
      type: 'bar',
      data: {
        labels: Object.keys(typeCounts),
        datasets: [{
          label: 'Jumlah Pekerjaan',
          data: Object.values(typeCounts),
          backgroundColor: 'rgba(0, 123, 255, 0.5)',
          borderColor: 'rgba(0, 123, 255, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  generateCardHTML(nama, items) {
    // Same HTML structure as original Dashboard.html
    return `
      <div class="col-md-6 col-lg-4">
        <div class="card h-100">
          <div class="card-header bg-dark text-white">
            <h5 class="mb-0">${nama}</h5>
          </div>
          <div class="card-body">
            <ul class="list-group list-group-flush list-scrollable">
              ${items.map(item => `
                <li class="list-group-item">
                  <div class="d-flex justify-content-between align-items-start">
                    <div>
                      <span>${item.deskripsi || 'Tidak ada deskripsi.'}</span>
                      <small class="d-block text-muted">
                        <i class="bi bi-tag"></i> ${item.type}
                        <i class="bi bi-person-badge"></i> ${item.fungsi}
                        <i class="bi bi-calendar-event"></i> ${item.tgl_diterima}
                      </small>
                    </div>
                    <span class="badge ${this.getStatusColor(item.status)}">${item.status}</span>
                  </div>
                </li>
              `).join('')}
            </ul>
          </div>
          <div class="card-footer">Total: ${items.length}</div>
        </div>
      </div>
    `;
  }

  getStatusColor(status) {
    const colors = {
      'ON - Progress': 'bg-primary',
      'New': 'bg-info text-dark',
      'Pending': 'bg-warning text-dark',
      'Done': 'bg-success'
    };
    return colors[status] || 'bg-secondary';
  }

  setupEventListeners() {
    // Logout button
    const logoutBtn = document.getElementById('logoutButton');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        auth.logout();
      });
    }

    // Name filter button
    const nameFilterBtn = document.getElementById('nameFilterButton');
    if (nameFilterBtn) {
      nameFilterBtn.addEventListener('click', () => {
        const modal = new bootstrap.Modal(document.getElementById('nameFilterModal'));
        modal.show();
      });
    }

    // Name filter modal buttons
    const applyFilterBtn = document.getElementById('applyFilterBtn');
    const resetFilterBtn = document.getElementById('resetFilterBtn');
    const nameFilterSelect = document.getElementById('nameFilterSelect');

    if (applyFilterBtn) {
      applyFilterBtn.addEventListener('click', () => {
        this.currentFilter = Array.from(nameFilterSelect.selectedOptions).map(option => option.value).join(',');
        this.loadData();
        bootstrap.Modal.getInstance(document.getElementById('nameFilterModal')).hide();
      });
    }

    if (resetFilterBtn) {
      resetFilterBtn.addEventListener('click', () => {
        this.currentFilter = 'all';
        Array.from(nameFilterSelect.options).forEach(option => option.selected = false);
        this.loadData();
        bootstrap.Modal.getInstance(document.getElementById('nameFilterModal')).hide();
      });
    }
    
    // Refresh data button
    const refreshBtn = document.getElementById('refreshDataBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.loadData();
      });
    }
  }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
  new Dashboard();
});