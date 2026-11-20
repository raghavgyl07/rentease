/* RentEase — my bookings */

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireAuth()) return;
  renderNav('bookings');
  loadBookings();
});

async function loadBookings() {
  const list = document.getElementById('bookings-list');
  list.innerHTML = `<div class="empty">Loading bookings…</div>`;

  try {
    const res = await Bookings_API.getMy();
    const bookings = res.data || [];

    if (!bookings.length) {
      list.innerHTML = `
        <div class="empty panel">
          <strong>No bookings yet</strong>
          Browse vehicles and book your first ride.
          <div style="margin-top:1rem"><a class="btn btn-primary" href="/">Find a vehicle</a></div>
        </div>`;
      return;
    }

    list.innerHTML = bookings.map(bookingCard).join('');
    list.querySelectorAll('[data-cancel]').forEach((btn) => {
      btn.addEventListener('click', () => cancelBooking(btn.dataset.cancel, btn));
    });
  } catch (err) {
    list.innerHTML = `
      <div class="empty panel">
        <strong>Could not load bookings</strong>
        ${escapeHtml(err.message || 'Server error')}
      </div>`;
  }
}

function bookingCard(b) {
  const vehicle = b.vehicleId || {};
  const cancelled = b.bookingStatus === 'Cancelled';
  return `
    <article class="booking-card panel">
      <div class="booking-top">
        <div>
          <div class="v-name">${escapeHtml(vehicle.vehicleName || 'Vehicle')}</div>
          <div class="muted" style="font-size:0.82rem;margin-top:0.2rem">
            ${escapeHtml(vehicle.registrationNumber || '')}
            ${vehicle.location ? ' · ' + escapeHtml(vehicle.location) : ''}
          </div>
        </div>
        <span class="badge ${cancelled ? 'badge-danger' : 'badge-ok'}">${escapeHtml(b.bookingStatus)}</span>
      </div>
      <div class="booking-grid">
        <div>
          <div class="bd-label">Pickup</div>
          <div class="bd-value">${formatDate(b.pickupDate)}</div>
        </div>
        <div>
          <div class="bd-label">Return</div>
          <div class="bd-value">${formatDate(b.returnDate)}</div>
        </div>
        <div>
          <div class="bd-label">Days</div>
          <div class="bd-value">${b.numberOfDays}</div>
        </div>
        <div>
          <div class="bd-label">Total</div>
          <div class="bd-value">${formatCurrency(b.totalAmount)}</div>
        </div>
      </div>
      ${
        cancelled
          ? ''
          : `<div class="booking-actions">
              <button class="btn btn-danger btn-sm" type="button" data-cancel="${b._id}">Cancel booking</button>
            </div>`
      }
    </article>`;
}

async function cancelBooking(id, btn) {
  if (!confirmAction('Cancel this booking? This cannot be undone.')) return;
  setLoading(btn, true, 'Cancelling...');
  try {
    const res = await Bookings_API.cancel(id);
    showToast(res.message || 'Booking cancelled.');
    loadBookings();
  } catch (err) {
    showToast(err.message || 'Cancel failed.', 'error');
    setLoading(btn, false);
  }
}
