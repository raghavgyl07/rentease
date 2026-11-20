/* RentEase — home / browse vehicles */

let currentPage = 1;
const PAGE_LIMIT = 9;
let filters = {};

document.addEventListener('DOMContentLoaded', () => {
  renderNav('vehicles');
  bindModals();
  bindFilters();
  bindBookingForm();
  loadVehicles();
});

function bindModals() {
  document.querySelectorAll('[data-close]').forEach((btn) => {
    btn.addEventListener('click', () => closeModal(btn.dataset.close));
  });
  document.getElementById('book-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'book-modal') closeModal('book-modal');
  });
}

function bindFilters() {
  document.getElementById('filter-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    filters = {
      vehicleName: fd.get('vehicleName')?.trim() || '',
      vehicleType: fd.get('vehicleType') || '',
      location: fd.get('location')?.trim() || '',
    };
    currentPage = 1;
    loadVehicles();
  });
}

async function loadVehicles() {
  const grid = document.getElementById('vehicles-grid');
  const pagination = document.getElementById('pagination');
  grid.innerHTML = `<div class="empty" style="grid-column:1/-1">Loading vehicles…</div>`;

  try {
    const res = await Vehicles_API.getAll({
      ...filters,
      page: currentPage,
      limit: PAGE_LIMIT,
    });
    const vehicles = res.data || [];

    if (!vehicles.length) {
      grid.innerHTML = `
        <div class="empty" style="grid-column:1/-1">
          <strong>No vehicles found</strong>
          Try a different search, or check back later.
        </div>`;
      pagination.innerHTML = '';
      return;
    }

    grid.innerHTML = vehicles.map(vehicleCard).join('');
    grid.querySelectorAll('[data-book]').forEach((btn) => {
      btn.addEventListener('click', () => openBookModal(btn.dataset.book, btn.dataset.name));
    });

    renderPagination(pagination, res.page, res.totalPages, (page) => {
      currentPage = page;
      loadVehicles();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  } catch (err) {
    grid.innerHTML = `
      <div class="empty" style="grid-column:1/-1">
        <strong>Could not load vehicles</strong>
        ${escapeHtml(err.message || 'Server error')}
      </div>`;
    pagination.innerHTML = '';
  }
}

function vehicleCard(v) {
  const available = v.availabilityStatus !== false;
  return `
    <article class="v-card panel">
      <div class="v-card-top">
        <div>
          <div class="v-name">${escapeHtml(v.vehicleName)}</div>
          <div class="v-type">${escapeHtml(v.vehicleType)}</div>
        </div>
        <span class="badge ${available ? 'badge-ok' : 'badge-off'}">
          ${available ? 'Available' : 'Unavailable'}
        </span>
      </div>
      <div class="v-meta">
        <span>${escapeHtml(v.location)}</span>
        <span>${v.seatingCapacity} seats</span>
        <span>${escapeHtml(v.registrationNumber)}</span>
      </div>
      <div class="v-price">${formatCurrency(v.pricePerDay)} <span>/ day</span></div>
      <div class="v-actions">
        <button
          class="btn btn-primary btn-sm"
          type="button"
          data-book="${v._id}"
          data-name="${escapeHtml(v.vehicleName)}"
          ${available ? '' : 'disabled'}
        >Book</button>
      </div>
    </article>`;
}

function openBookModal(id, name) {
  if (!Auth.isLoggedIn()) {
    window.location.href = '/auth.html';
    return;
  }
  document.getElementById('book-vehicle-id').value = id;
  document.getElementById('book-vehicle-name').textContent = name;
  document.getElementById('pickupDate').value = '';
  document.getElementById('returnDate').value = '';
  document.getElementById('pickupDate').min = todayISO();
  document.getElementById('returnDate').min = todayISO();
  openModal('book-modal');
}

function bindBookingForm() {
  const pickup = document.getElementById('pickupDate');
  const ret = document.getElementById('returnDate');
  pickup?.addEventListener('change', () => {
    if (pickup.value) {
      ret.min = pickup.value;
      if (ret.value && ret.value <= pickup.value) ret.value = '';
    }
  });

  document.getElementById('book-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('book-submit');
    const body = {
      vehicleId: document.getElementById('book-vehicle-id').value,
      pickupDate: document.getElementById('pickupDate').value,
      returnDate: document.getElementById('returnDate').value,
    };

    setLoading(btn, true, 'Booking...');
    try {
      const res = await Bookings_API.create(body);
      showToast(res.message || 'Booking confirmed.');
      closeModal('book-modal');
      setTimeout(() => {
        window.location.href = '/bookings.html';
      }, 600);
    } catch (err) {
      showToast(err.message || 'Booking failed.', 'error');
    } finally {
      setLoading(btn, false);
    }
  });
}

function renderPagination(el, page, totalPages, onPage) {
  if (!el) return;
  if (!totalPages || totalPages <= 1) {
    el.innerHTML = '';
    return;
  }
  el.innerHTML = `
    <button class="pg-btn" type="button" data-pg="${page - 1}" ${page <= 1 ? 'disabled' : ''}>‹</button>
    <span class="pg-info">Page ${page} of ${totalPages}</span>
    <button class="pg-btn" type="button" data-pg="${page + 1}" ${page >= totalPages ? 'disabled' : ''}>›</button>
  `;
  el.querySelectorAll('[data-pg]').forEach((btn) => {
    btn.addEventListener('click', () => onPage(Number(btn.dataset.pg)));
  });
}
