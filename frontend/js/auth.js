/* RentEase — session helpers */

const Auth = {
  getUser() {
    try {
      return JSON.parse(localStorage.getItem('rentease_user') || 'null');
    } catch {
      return null;
    }
  },

  getToken() {
    return localStorage.getItem('rentease_token');
  },

  isLoggedIn() {
    return Boolean(this.getToken() && this.getUser());
  },

  isAdmin() {
    const user = this.getUser();
    return user && user.role === 'Admin';
  },

  save(data) {
    localStorage.setItem('rentease_token', data.token);
    localStorage.setItem(
      'rentease_user',
      JSON.stringify({
        _id: data._id,
        name: data.name,
        email: data.email,
        role: data.role,
      })
    );
  },

  logout() {
    localStorage.removeItem('rentease_token');
    localStorage.removeItem('rentease_user');
    window.location.href = '/';
  },

  requireAuth(redirect = '/auth.html') {
    if (!this.isLoggedIn()) {
      window.location.href = redirect;
      return false;
    }
    return true;
  },

  requireAdmin() {
    if (!this.requireAuth()) return false;
    if (!this.isAdmin()) {
      window.location.href = '/';
      return false;
    }
    return true;
  },
};

function renderNav(active = '') {
  const user = Auth.getUser();
  const nav = document.getElementById('nav');
  if (!nav) return;

  const links = [
    { href: '/', label: 'Vehicles', key: 'vehicles' },
    ...(user ? [{ href: '/bookings.html', label: 'My Bookings', key: 'bookings' }] : []),
    ...(Auth.isAdmin() ? [{ href: '/admin.html', label: 'Admin', key: 'admin' }] : []),
  ];

  nav.innerHTML = `
    <div class="container nav-inner">
      <a class="brand" href="/">
        <span class="brand-mark">RE</span>
        RentEase
      </a>
      <div class="nav-links">
        ${links
          .map(
            (l) =>
              `<a href="${l.href}" class="${active === l.key ? 'active' : ''}">${l.label}</a>`
          )
          .join('')}
      </div>
      <div class="nav-actions">
        ${
          user
            ? `<span class="nav-user">Hi, <strong>${escapeHtml(user.name)}</strong></span>
               <button class="btn btn-ghost btn-sm" type="button" id="logout-btn">Log out</button>`
            : `<a class="btn btn-secondary btn-sm" href="/auth.html">Log in</a>
               <a class="btn btn-primary btn-sm" href="/auth.html?tab=register">Sign up</a>`
        }
      </div>
    </div>
  `;

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', () => Auth.logout());
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function openModal(id) {
  document.getElementById(id)?.classList.add('open');
}

function closeModal(id) {
  document.getElementById(id)?.classList.remove('open');
}

function confirmAction(message) {
  return window.confirm(message);
}
