/* RentEase — login / register page */

document.addEventListener('DOMContentLoaded', () => {
  if (Auth.isLoggedIn()) {
    window.location.href = '/';
    return;
  }

  renderNav();
  setupTabs();
  bindForms();
});

function setupTabs() {
  const params = new URLSearchParams(window.location.search);
  const initial = params.get('tab') === 'register' ? 'register' : 'login';
  switchTab(initial);

  document.querySelectorAll('.auth-tab').forEach((tab) => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });
}

function switchTab(name) {
  document.querySelectorAll('.auth-tab').forEach((t) => {
    t.classList.toggle('active', t.dataset.tab === name);
  });
  document.querySelectorAll('.auth-panel').forEach((p) => {
    p.classList.toggle('active', p.id === `panel-${name}`);
  });
  clearAlert();
  const title = document.querySelector('.auth-card h1');
  if (title) title.textContent = name === 'register' ? 'Create account' : 'Welcome back';
}

function setAlert(message, type = 'error') {
  const el = document.getElementById('auth-alert');
  if (!el) return;
  el.innerHTML = `<div class="alert alert-${type === 'ok' ? 'ok' : 'error'}">${escapeHtml(message)}</div>`;
}

function clearAlert() {
  const el = document.getElementById('auth-alert');
  if (el) el.innerHTML = '';
}

function bindForms() {
  document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert();
    const btn = document.getElementById('login-btn');
    setLoading(btn, true, 'Logging in...');
    try {
      const res = await Auth_API.login({
        email: document.getElementById('login-email').value.trim(),
        password: document.getElementById('login-password').value,
      });
      Auth.save(res.data);
      showToast(res.message || 'Login successful.');
      window.location.href = '/';
    } catch (err) {
      setAlert(err.message || 'Login failed.');
    } finally {
      setLoading(btn, false);
    }
  });

  document.getElementById('register-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert();
    const btn = document.getElementById('register-btn');
    setLoading(btn, true, 'Creating...');
    try {
      const res = await Auth_API.register({
        name: document.getElementById('reg-name').value.trim(),
        email: document.getElementById('reg-email').value.trim(),
        password: document.getElementById('reg-password').value,
        role: document.getElementById('reg-role').value,
      });
      Auth.save(res.data);
      showToast(res.message || 'Account created.');
      window.location.href = Auth.isAdmin() ? '/admin.html' : '/';
    } catch (err) {
      setAlert(err.message || 'Registration failed.');
    } finally {
      setLoading(btn, false);
    }
  });
}
