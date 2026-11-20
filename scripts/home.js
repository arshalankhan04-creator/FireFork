/**
 * FireFork - Home Page JavaScript
 */

(function () {
    'use strict';

    window.fireforkOnModeChange = function (isVeg) {
        const heroTagline = document.getElementById('hero-tagline');
        const nonVegItems = document.querySelectorAll('.non-veg-item');
        const vegItems = document.querySelectorAll('.veg-item');
        const nonVegMenu = document.getElementById('non-veg-menu');
        const vegMenu = document.getElementById('veg-menu');
        const heroBgNonVeg = document.getElementById('hero-bg-nonveg');
        const heroBgVeg = document.getElementById('hero-bg-veg');

        if (isVeg) {
            if (heroTagline) heroTagline.innerHTML = 'WHERE FIRE <br> MEETS GREEN';
            nonVegItems.forEach(item => item.classList.add('hidden'));
            vegItems.forEach(item => item.classList.remove('hidden'));
            if (nonVegMenu) nonVegMenu.classList.remove('active');
            if (vegMenu) vegMenu.classList.add('active');
            if (heroBgNonVeg && heroBgVeg) {
                heroBgNonVeg.style.opacity = '0';
                heroBgVeg.style.opacity = '1';
            }
        } else {
            if (heroTagline) heroTagline.innerHTML = 'WHERE FIRE <br> MEETS MEAT';
            nonVegItems.forEach(item => item.classList.remove('hidden'));
            vegItems.forEach(item => item.classList.add('hidden'));
            if (vegMenu) vegMenu.classList.remove('active');
            if (nonVegMenu) nonVegMenu.classList.add('active');
            if (heroBgNonVeg && heroBgVeg) {
                heroBgNonVeg.style.opacity = '1';
                heroBgVeg.style.opacity = '0';
            }
        }
    };

    function initCursorFollower() {
        const cursorPreview = document.getElementById('cursor-image-preview');
        const menuTitles = document.querySelectorAll('.menu-item-title');
        if (!cursorPreview || !menuTitles.length) return;

        document.addEventListener('mousemove', (e) => {
            window.requestAnimationFrame(() => {
                cursorPreview.style.left = `${e.clientX}px`;
                cursorPreview.style.top = `${e.clientY}px`;
            });
        });

        menuTitles.forEach(title => {
            title.addEventListener('mouseenter', () => {
                const imgUrl = title.getAttribute('data-img');
                cursorPreview.style.backgroundImage = `url('${imgUrl}')`;
                cursorPreview.classList.add('visible');
            });
            title.addEventListener('mouseleave', () => {
                cursorPreview.classList.remove('visible');
            });
        });
    }

    function initBookingForm() {
        const API_BASE_URL = (window.FIREFORK_CONFIG && window.FIREFORK_CONFIG.apiBase) || 'http://localhost:3000/api';
        const bookingForm = document.getElementById('booking-form');
        const successMessage = document.getElementById('success-message');
        const errorMessage = document.getElementById('error-message');
        const errorText = document.getElementById('error-text');
        const availabilityIndicator = document.getElementById('availability-indicator');
        const submitBtn = document.getElementById('submit-btn');
        const dateInput = document.getElementById('booking-date');
        const timeInput = document.getElementById('booking-time');
        const partySizeInput = document.getElementById('party-size');

        if (!bookingForm || !dateInput || !timeInput || !partySizeInput) return;

        dateInput.setAttribute('min', new Date().toISOString().split('T')[0]);

        function debounce(func, wait) {
            let timeout;
            return function (...args) {
                clearTimeout(timeout);
                timeout = setTimeout(() => func(...args), wait);
            };
        }

        async function checkAvailability() {
            const date = dateInput.value;
            const time = timeInput.value;
            const partySize = partySizeInput.value;
            if (!date || !time || !partySize) {
                availabilityIndicator.style.display = 'none';
                return;
            }
            try {
                const response = await fetch(`${API_BASE_URL}/availability/check?date=${date}&time=${time}&partySize=${partySize}`);
                const data = await response.json();
                availabilityIndicator.style.display = 'block';
                availabilityIndicator.className = 'availability-indicator';
                if (data.canAccommodate) {
                    if (data.availableTables >= 10) {
                        availabilityIndicator.classList.add('available');
                        availabilityIndicator.querySelector('.availability-text').textContent =
                            `✓ Available (${data.availableTables} tables free)`;
                    } else {
                        availabilityIndicator.classList.add('limited');
                        availabilityIndicator.querySelector('.availability-text').textContent =
                            `⚠ Limited availability (${data.availableTables} tables left)`;
                    }
                    submitBtn.disabled = false;
                } else {
                    availabilityIndicator.classList.add('unavailable');
                    availabilityIndicator.querySelector('.availability-text').textContent = '✗ Fully booked - Please select another time';
                    submitBtn.disabled = true;
                }
            } catch (error) {
                console.error('Availability check failed:', error);
                availabilityIndicator.style.display = 'none';
            }
        }

        dateInput.addEventListener('change', debounce(checkAvailability, 500));
        timeInput.addEventListener('change', debounce(checkAvailability, 500));
        partySizeInput.addEventListener('change', debounce(checkAvailability, 500));

        bookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const guestName = document.getElementById('guest-name').value.trim();
            const partySize = parseInt(document.getElementById('party-size').value);
            const mobileNumber = document.getElementById('mobile-number').value.trim();
            const bookingDate = document.getElementById('booking-date').value;
            const bookingTime = document.getElementById('booking-time').value;
            const reservationData = {
                guestName, partySize, mobileNumber, bookingDate, bookingTime,
                dietaryPreference: (typeof window.fireforkIsVeg === 'function' && window.fireforkIsVeg()) ? 'Vegetarian' : 'Non-Vegetarian',
                specialRequests: ''
            };
            submitBtn.disabled = true;
            submitBtn.textContent = 'PROCESSING...';
            try {
                const response = await fetch(`${API_BASE_URL}/reservations`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(reservationData)
                });
                const data = await response.json();
                if (response.ok) {
                    successMessage.style.display = 'block';
                    errorMessage.style.display = 'none';
                    bookingForm.reset();
                    availabilityIndicator.style.display = 'none';
                    setTimeout(() => { successMessage.style.display = 'none'; }, 5000);
                    document.getElementById('book').scrollIntoView({ behavior: 'smooth' });
                } else {
                    throw new Error(data.error || 'Reservation failed');
                }
            } catch (error) {
                console.error('Reservation error:', error);
                errorText.textContent = error.message || 'Failed to create reservation. Please try again.';
                errorMessage.style.display = 'block';
                successMessage.style.display = 'none';
                setTimeout(() => { errorMessage.style.display = 'none'; }, 5000);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'CONFIRM RESERVATION';
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initCursorFollower();
            initBookingForm();
        });
    } else {
        initCursorFollower();
        initBookingForm();
    }
})();
