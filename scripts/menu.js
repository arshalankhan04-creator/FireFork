/**
 * FireFork - Menu Page JavaScript
 */

(function () {
    'use strict';

    window.fireforkOnModeChange = function (isVeg) {
        const pageTitle = document.getElementById('page-title');
        const nonVegContainers = document.querySelectorAll('.non-veg-container');
        const vegContainers = document.querySelectorAll('.veg-container');
        if (isVeg) {
            if (pageTitle) pageTitle.innerHTML = 'EMBERED <br>EARTH';
            nonVegContainers.forEach(el => el.style.display = 'none');
            vegContainers.forEach(el => el.style.display = 'block');
        } else {
            if (pageTitle) pageTitle.innerHTML = 'FORGED IN <br>FLAME';
            nonVegContainers.forEach(el => el.style.display = 'block');
            vegContainers.forEach(el => el.style.display = 'none');
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
            title.addEventListener('mouseleave', () => cursorPreview.classList.remove('visible'));
        });
    }

    window.scrollToSection = function (id, clickedPill) {
        const el = document.getElementById(id);
        const navbar = document.querySelector('.navbar');
        const subNav = document.querySelector('.menu-sub-nav');
        if (el && navbar && subNav) {
            const y = el.getBoundingClientRect().top + window.pageYOffset - navbar.offsetHeight - subNav.offsetHeight - 20;
            window.scrollTo({ top: y, behavior: 'smooth' });
            document.querySelectorAll('.category-pill').forEach(pill => pill.classList.remove('active'));
            if (clickedPill) clickedPill.classList.add('active');
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCursorFollower);
    } else {
        initCursorFollower();
    }
})();
