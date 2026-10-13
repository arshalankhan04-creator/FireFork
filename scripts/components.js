/**
 * FireFork - Load navbar and footer components
 * Fetches components/navbar.html and components/footer.html and injects them
 * into #navbar-placeholder and #footer-placeholder. Sets active nav link based on current page.
 */
(function () {
    'use strict';

    function getBasePath() {
        const script = document.currentScript;
        if (script && script.src) {
            const match = script.src.match(/^(.+\/)scripts\/components\.js/);
            if (match) return match[1];
        }
        return '';
    }

    function setActiveNav() {
        const path = window.location.pathname || '';
        const page = path.split('/').pop() || 'index.html';
        if (page === '' || page === 'index.html' || page === 'index') {
            document.querySelector('.nav-home')?.classList.add('active');
        } else if (page === 'menu.html') {
            document.querySelector('.nav-menu')?.classList.add('active');
        } else if (page === 'story.html') {
            document.querySelector('.nav-story')?.classList.add('active');
        } else if (page === 'experience.html') {
            document.querySelector('.nav-experience')?.classList.add('active');
        }
    }

    async function loadComponents() {
        const base = getBasePath();
        const navbarPlaceholder = document.getElementById('navbar-placeholder');
        const footerPlaceholder = document.getElementById('footer-placeholder');

        try {
            if (navbarPlaceholder) {
                const navRes = await fetch(base + 'components/navbar.html');
                if (navRes.ok) {
                    navbarPlaceholder.innerHTML = await navRes.text();
                    setActiveNav();
                    if (typeof window.initializeMode === 'function') {
                        setTimeout(window.initializeMode, 0);
                    }
                } else {
                    console.warn('FireFork: Could not load navbar.html (fetch failed). Use a local server for component loading.');
                }
            }
        } catch (e) {
            console.warn('FireFork: Could not load navbar (use a local server for component loading):', e.message);
        }

        try {
            if (footerPlaceholder) {
                const footRes = await fetch(base + 'components/footer.html');
                if (footRes.ok) {
                    footerPlaceholder.innerHTML = await footRes.text();
                    if (typeof window.updateFooterYear === 'function') {
                        window.updateFooterYear();
                    } else {
                        const span = document.getElementById('currentYear');
                        if (span) span.textContent = new Date().getFullYear();
                    }
                } else {
                    console.warn('FireFork: Could not load footer.html (fetch failed).');
                }
            }
        } catch (e) {
            console.warn('FireFork: Could not load footer (use a local server for component loading):', e.message);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadComponents);
    } else {
        loadComponents();
    }
})();
