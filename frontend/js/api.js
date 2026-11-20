/* RentEase — API helpers */

async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('rentease_token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(endpoint, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw { status: res.status, message: data.message || 'Something went wrong.' };
  }
  return data;
}

const Auth_API = {
  register: (body) => apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
};

const Vehicles_API = {
  getAll: (params = {}) => {
    const q = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))
    ).toString();
    return apiFetch(`/api/vehicles${q ? `?${q}` : ''}`);
  },
  getOne: (id) => apiFetch(`/api/vehicles/${id}`),
  add: (body) => apiFetch('/api/vehicles', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => apiFetch(`/api/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id) => apiFetch(`/api/vehicles/${id}`, { method: 'DELETE' }),
};

const Bookings_API = {
  create: (body) => apiFetch('/api/bookings', { method: 'POST', body: JSON.stringify(body) }),
  getMy: () => apiFetch('/api/bookings/my'),
  getOne: (id) => apiFetch(`/api/bookings/${id}`),
  cancel: (id) => apiFetch(`/api/bookings/${id}/cancel`, { method: 'PATCH' }),
};

function showToast(message, type = 'ok') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast-${type === 'error' ? 'error' : 'ok'}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('out');
    setTimeout(() => toast.remove(), 220);
  }, 3200);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatCurrency(amount) {
  return '₹' + Number(amount || 0).toLocaleString('en-IN');
}

function setLoading(btn, loading, text = '') {
  if (!btn) return;
  if (loading) {
    btn.disabled = true;
    btn.dataset.originalText = btn.innerHTML;
    btn.innerHTML = `<span class="spinner"></span> ${text || 'Please wait...'}`;
  } else {
    btn.disabled = false;
    btn.innerHTML = btn.dataset.originalText || text;
  }
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
