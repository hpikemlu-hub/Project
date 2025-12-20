class AuthManager {
  constructor() {
    this.baseURL = '/api';
    this.token = localStorage.getItem('authToken');
    this.user = JSON.parse(localStorage.getItem('currentUser') || 'null');
  }

  async login(username, password) {
    try {
      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const result = await response.json();
      
      if (result.success) {
        this.token = result.token;
        this.user = result.user;
        localStorage.setItem('authToken', result.token);
        localStorage.setItem('currentUser', JSON.stringify(result.user));
        return { success: true };
      } else {
        return { success: false, message: result.message };
      }
    } catch (error) {
      return { success: false, message: 'Terjadi kesalahan server' };
    }
  }

  async logout() {
    try {
      await fetch(`${this.baseURL}/auth/logout`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        }
      });
    } finally {
      this.token = null;
      this.user = null;
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      window.location.href = '/';
    }
  }

  isAuthenticated() {
    return this.token && this.user;
  }

  getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    };
  }
}

// Initialize
const auth = new AuthManager();

// Login form handler
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const messageEl = document.getElementById('loginMessage');
  
  const result = await auth.login(username, password);
  
  if (result.success) {
    window.location.href = '/dashboard.html';
  } else {
    messageEl.className = 'alert alert-danger';
    messageEl.textContent = result.message;
  }
});

// Password toggle functionality
document.getElementById('togglePassword').addEventListener('click', function() {
  const passwordInput = document.getElementById('password');
  const passwordIcon = document.getElementById('passwordIcon');

  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    passwordIcon.classList.remove('bi-eye-slash-fill');
    passwordIcon.classList.add('bi-eye-fill');
  } else {
    passwordInput.type = 'password';
    passwordIcon.classList.remove('bi-eye-fill');
    passwordIcon.classList.add('bi-eye-slash-fill');
  }
});