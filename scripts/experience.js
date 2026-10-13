/**
 * FireFork - Experience Page JavaScript
 */

(function () {
    'use strict';

    function swapFeatureImages(vegActive) {
        const img1 = document.getElementById('feat-img-1');
        const img3 = document.getElementById('feat-img-3');
        if (vegActive) {
            if (img1) img1.src = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=800&auto=format&fit=crop';
            if (img3) img3.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop';
        } else {
            if (img1) img1.src = 'https://images.unsplash.com/photo-1558030006-450675393462?q=80&w=800&auto=format&fit=crop';
            if (img3) img3.src = 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?q=80&w=800&auto=format&fit=crop';
        }
    }

    window.fireforkOnModeChange = function (isVeg) {
        swapFeatureImages(isVeg);
    };

    function initRevealUp() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        document.querySelectorAll('.reveal-up').forEach(el => observer.observe(el));
    }

    function initStatCounter() {
        const statsSection = document.querySelector('.stats-section');
        let counted = false;
        const statsObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !counted) {
                document.querySelectorAll('.stat-number').forEach(counter => {
                    const target = +counter.getAttribute('data-target');
                    const duration = 2000;
                    const increment = target / (duration / 16);
                    let current = 0;
                    const update = () => {
                        current += increment;
                        if (current < target) {
                            counter.innerText = Math.ceil(current);
                            requestAnimationFrame(update);
                        } else {
                            counter.innerText = target;
                        }
                    };
                    update();
                });
                counted = true;
            }
        }, { threshold: 0.5 });
        if (statsSection) statsObserver.observe(statsSection);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initRevealUp();
            initStatCounter();
        });
    } else {
        initRevealUp();
        initStatCounter();
    }
})();
