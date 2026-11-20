/**
 * FireFork - Reservation Form JavaScript
 * Integrated with backend API
 */

(function () {
  'use strict';

  const API_BASE = (window.FIREFORK_CONFIG && window.FIREFORK_CONFIG.apiBase) || 'http://localhost:3000/api';

  const els = {
    form: document.getElementById('booking-form'),
    guestName: document.getElementById('guest-name'),
    mobileNumber: document.getElementById('mobile-number'),
    bookingDate: document.getElementById('booking-date'),
    bookingTime: document.getElementById('booking-time'),
    partySize: document.getElementById('party-size'),
    dietaryPreference: document.getElementById('dietary-preference'),
    specialRequests: document.getElementById('special-requests'),
    submitBtn: document.getElementById('submit-btn'),
    btnText: document.querySelector('.btn-text'),
    btnLoader: document.querySelector('.btn-loader'),
    availabilityIndicator: document.getElementById('availability-indicator'),
    successMessage: document.getElementById('success-message'),
    errorMessage: document.getElementById('error-message'),
    errorText: document.getElementById('error-text')
  };

  // Generate time slots (2:00 PM to 8:00 PM, 30-min intervals)
  // Last booking at 8:00 PM ensures 10:00 PM close (2-hour dining)
  function generateTimeSlots() {
    const slots = [];
    for (let hour = 14; hour <= 20; hour++) {
      for (let min = 0; min < 60; min += 30) {
        if (hour === 20 && min > 0) break; // Stop at 8:00 PM
        const h = hour.toString().padStart(2, '0');
        const m = min.toString().padStart(2, '0');
        const time24 = `${h}:${m}`;
        const hour12 = hour > 12 ? hour - 12 : hour;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const time12 = `${hour12}:${m} ${ampm}`;
        slots.push({ value: time24, label: time12 });
      }
    }
    return slots;
  }

  function populateTimeSlots() {
    const slots = generateTimeSlots();
    els.bookingTime.innerHTML = '<option value="">Select time slot</option>';
    slots.forEach(slot => {
      const option = document.createElement('option');
      option.value = slot.value;
      option.textContent = slot.label;
      els.bookingTime.appendChild(option);
    });
  }

  function setMinDate() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    els.bookingDate.min = `${yyyy}-${mm}-${dd}`;
    
    // Set max date to 3 months from now
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    const maxYyyy = maxDate.getFullYear();
    const maxMm = String(maxDate.getMonth() + 1).padStart(2, '0');
    const maxDd = String(maxDate.getDate()).padStart(2, '0');
    els.bookingDate.max = `${maxYyyy}-${maxMm}-${maxDd}`;
  }

  function showSuccess(message) {
    els.successMessage.classList.remove('d-none');
    els.errorMessage.classList.add('d-none');
    els.availabilityIndicator.classList.add('d-none');
    
    const msgEl = els.successMessage.querySelector('.alert');
    if (msgEl && message) {
      msgEl.textContent = message;
    }
    
    els.form.reset();
    
    // Scroll to success message
    els.successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Hide after 5 seconds
    setTimeout(() => {
      els.successMessage.classList.add('d-none');
    }, 5000);
  }

  function showError(message) {
    els.errorMessage.classList.remove('d-none');
    els.successMessage.classList.add('d-none');
    els.errorText.textContent = message || 'An error occurred. Please try again.';
    
    // Scroll to error message
    els.errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function setLoading(isLoading) {
    if (isLoading) {
      els.submitBtn.disabled = true;
      els.btnText.classList.add('d-none');
      els.btnLoader.classList.remove('d-none');
    } else {
      els.submitBtn.disabled = false;
      els.btnText.classList.remove('d-none');
      els.btnLoader.classList.add('d-none');
    }
  }

  // Check availability (debounced)
  let availabilityTimeout;
  function checkAvailability() {
    clearTimeout(availabilityTimeout);
    
    const date = els.bookingDate.value;
    const time = els.bookingTime.value;
    const partySize = els.partySize.value;

    if (!date || !time || !partySize) {
      els.availabilityIndicator.classList.add('d-none');
      return;
    }

    availabilityTimeout = setTimeout(async () => {
      try {
        const url = `${API_BASE}/availability/check?date=${date}&time=${time}&partySize=${partySize}`;
        const response = await fetch(url);
        const data = await response.json();

        els.availabilityIndicator.classList.remove('d-none');
        const indicator = els.availabilityIndicator.querySelector('.availability-status');
        const text = els.availabilityIndicator.querySelector('.availability-text');

        if (data.available) {
          indicator.className = 'availability-status available';
          indicator.innerHTML = '<i class="bi bi-check-circle-fill"></i>';
          text.textContent = data.message || 'Table available!';
          text.className = 'availability-text text-success';
        } else {
          indicator.className = 'availability-status unavailable';
          indicator.innerHTML = '<i class="bi bi-x-circle-fill"></i>';
          text.textContent = data.message || 'No tables available';
          text.className = 'availability-text text-danger';
        }
      } catch (err) {
        console.error('Availability check failed:', err);
        els.availabilityIndicator.classList.add('d-none');
      }
    }, 500);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    els.errorMessage.classList.add('d-none');
    setLoading(true);

    try {
      const formData = {
        name: els.guestName.value.trim(),
        phone: els.mobileNumber.value.trim(),
        bookingDate: els.bookingDate.value,
        bookingTime: els.bookingTime.value,
        partySize: parseInt(els.partySize.value, 10),
        dietaryPreference: els.dietaryPreference.value || null,
        specialRequests: els.specialRequests.value.trim() || null
      };

      const response = await fetch(`${API_BASE}/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showSuccess(data.message);
      } else {
        showError(data.error || 'Failed to create reservation');
      }
    } catch (err) {
      console.error('Reservation submission failed:', err);
      showError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  function init() {
    setMinDate();
    populateTimeSlots();

    // Event listeners
    els.form.addEventListener('submit', handleSubmit);

    // Real-time availability checking
    els.bookingDate.addEventListener('change', checkAvailability);
    els.bookingTime.addEventListener('change', checkAvailability);
    els.partySize.addEventListener('change', checkAvailability);

    // Phone number formatting
    els.mobileNumber.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length > 15) value = value.slice(0, 15);
      e.target.value = value;
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
