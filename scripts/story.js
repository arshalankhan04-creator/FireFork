/**
 * FireFork - Story Page JavaScript
 */

(function () {
    'use strict';

    window.fireforkOnModeChange = function (isVeg) {
        const nonVegGrid = document.querySelector('.non-veg-grid');
        const vegGrid = document.querySelector('.veg-grid');
        if (nonVegGrid && vegGrid) {
            nonVegGrid.style.display = isVeg ? 'none' : 'grid';
            vegGrid.style.display = isVeg ? 'grid' : 'none';
        }
    };
})();
