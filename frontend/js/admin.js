/* RentEase — admin vehicle management */

let adminPage = 1;
const ADMIN_LIMIT = 10;
const vehicleCache = new Map();

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireAdmin()) return;
  renderNav('admin');
  bindModals();
  bindForm();
  document.getElementById('add-vehicle-btn')?.addEventListener('click', () => openVehicleModal());
  loadAdminVehicles();
});

function bindModals() {
  document.querySelectorAll('[data-close]').forEach((btn) => {
    btn.addEventListener('click', () => closeModal(btn.dataset.close));
  });
  document.getElementById('vehicle-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'vehicle-modal') closeModal('vehicle-modal');
  });
}

async function loadAdminVehicles() {
  const tbody = document.getElementById('admin-table-body');
  tbody.innerHTML = `<tr><td colspan="8" class="muted">Loading…</td></tr>`;

  try {
    const res = await Vehicles_API.getAll({ page: adminPage, limit: ADMIN_LIMIT });
    const vehicles = res.data || [];

    if (!vehicles.length) {
      tbody.innerHTML = `<tr><td colspan="8" class="muted">No vehicles yet. Add your first one.</td></tr>`;
      document.getElementById('admin-pagination').innerHTML = '';
      return;
    }

    vehicleCache.clear();
    tbody.innerHTML = vehicles
      .map((v) => {
        vehicleCache.set(v._id, v);
        const available = v.availabilityStatus !== false;
        return `
          <tr>
            <td><strong>${escapeHtml(v.vehicleName)}</strong></td>
            <td>${escapeHtml(v.vehicleType)}</td>
            <td>${escapeHtml(v.registrationNumber)}</td>
            <td>${v.seatingCapacity}</td>
            <td>${formatCurrency(v.pricePerDay)}</td>
            <td>${escapeHtml(v.location)}</td>
            <td><span class="badge ${available ? 'badge-ok' : 'badge-off'}">${available ? 'Available' : 'Off'}</span></td>
            <td>
              <div class="row-actions">
                <button class="btn btn-secondary btn-sm" type="button" data-edit="${v._id}">Edit</button>
                <button class="btn btn-danger btn-sm" type="button" data-delete="${v._id}">Delete</button>
              </div>
            </td>
          </tr>`;
      })
      .join('');

    tbody.querySelectorAll('[data-edit]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const vehicle = vehicleCache.get(btn.dataset.edit);
        if (vehicle) openVehicleModal(vehicle);
        else showToast('Could not open editor.', 'error');
      });
    });

    tbody.querySelectorAll('[data-delete]').forEach((btn) => {
      btn.addEventListener('click', () => deleteVehicle(btn.dataset.delete));
    });

    const pag = document.getElementById('admin-pagination');
    if (res.totalPages > 1) {
      pag.innerHTML = `
        <button class="pg-btn" type="button" id="admin-prev" ${adminPage <= 1 ? 'disabled' : ''}>‹</button>
        <span class="pg-info">Page ${res.page} of ${res.totalPages}</span>
        <button class="pg-btn" type="button" id="admin-next" ${adminPage >= res.totalPages ? 'disabled' : ''}>›</button>
      `;
      document.getElementById('admin-prev')?.addEventListener('click', () => {
        adminPage -= 1;
        loadAdminVehicles();
      });
      document.getElementById('admin-next')?.addEventListener('click', () => {
        adminPage += 1;
        loadAdminVehicles();
      });
    } else {
      pag.innerHTML = '';
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8">${escapeHtml(err.message || 'Failed to load')}</td></tr>`;
  }
}

function openVehicleModal(vehicle = null) {
  const editing = Boolean(vehicle);
  document.getElementById('vehicle-modal-title').textContent = editing ? 'Edit vehicle' : 'Add vehicle';
  document.getElementById('vehicle-id').value = vehicle?._id || '';
  document.getElementById('v-name').value = vehicle?.vehicleName || '';
  document.getElementById('v-type').value = vehicle?.vehicleType || 'SUV';
  document.getElementById('v-reg').value = vehicle?.registrationNumber || '';
  document.getElementById('v-seats').value = vehicle?.seatingCapacity || '';
  document.getElementById('v-price').value = vehicle?.pricePerDay || '';
  document.getElementById('v-location').value = vehicle?.location || '';
  document.getElementById('v-status').value = String(vehicle?.availabilityStatus !== false);
  openModal('vehicle-modal');
}

function bindForm() {
  document.getElementById('vehicle-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('vehicle-submit');
    const id = document.getElementById('vehicle-id').value;
    const body = {
      vehicleName: document.getElementById('v-name').value.trim(),
      vehicleType: document.getElementById('v-type').value,
      registrationNumber: document.getElementById('v-reg').value.trim(),
      seatingCapacity: Number(document.getElementById('v-seats').value),
      pricePerDay: Number(document.getElementById('v-price').value),
      location: document.getElementById('v-location').value.trim(),
      availabilityStatus: document.getElementById('v-status').value === 'true',
    };

    setLoading(btn, true, 'Saving...');
    try {
      const res = id
        ? await Vehicles_API.update(id, body)
        : await Vehicles_API.add(body);
      showToast(res.message || 'Saved.');
      closeModal('vehicle-modal');
      loadAdminVehicles();
    } catch (err) {
      showToast(err.message || 'Save failed.', 'error');
    } finally {
      setLoading(btn, false);
    }
  });
}

async function deleteVehicle(id) {
  if (!confirmAction('Delete this vehicle permanently?')) return;
  try {
    const res = await Vehicles_API.delete(id);
    showToast(res.message || 'Vehicle deleted.');
    loadAdminVehicles();
  } catch (err) {
    showToast(err.message || 'Delete failed.', 'error');
  }
}
