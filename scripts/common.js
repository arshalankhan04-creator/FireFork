/**
 * FireFork - Shared JavaScript
 * Veg/Non-Veg toggle, footer year, mode persistence
 */

(function () {
    'use strict';

    let isVeg = false;

    /**
     * Toggle veg/non-veg mode. Persists to localStorage and invokes page callback.
     */
    function toggleMode() {
        isVeg = !isVeg;
        const slider = document.getElementById('toggle-slider');
        const isMobile = window.innerWidth <= 768;

        localStorage.setItem('firefork_mode', isVeg ? 'veg' : 'non-veg');

        if (slider) {
            if (isVeg) {
                slider.style.transform = isMobile ? 'translateX(22px)' : 'translateX(64px)';
                slider.style.backgroundColor = '#22C55E';
            } else {
                slider.style.transform = 'translateX(0)';
                slider.style.backgroundColor = '#FF3500';
            }
        }

        if (isVeg) {
            document.body.classList.add('veg-mode');
        } else {
            document.body.classList.remove('veg-mode');
        }

        if (typeof window.fireforkOnModeChange === 'function') {
            window.fireforkOnModeChange(isVeg);
        }
    }

    /**
     * Initialize mode from localStorage on page load.
     */
    function initializeMode() {
        const storedMode = localStorage.getItem('firefork_mode');
        if (storedMode === 'veg') {
            isVeg = false;
            toggleMode();
        }
    }

    /**
     * Set current year in footer.
     */
    function setFooterYear() {
        const el = document.getElementById('currentYear');
        if (el) {
            el.textContent = new Date().getFullYear();
        }
    }

    function init() {
        setFooterYear();
        /* Defer mode init so page scripts can register fireforkOnModeChange first */
        setTimeout(initializeMode, 0);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.toggleMode = toggleMode;
    window.initializeMode = initializeMode;
    window.fireforkIsVeg = function () { return isVeg; };
})();
