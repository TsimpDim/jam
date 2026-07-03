// Mobile Navigation Toggle
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');

if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
        navMenu.classList.toggle('nav-links--open');
        hamburger.classList.toggle('hamburger--open');
    });

    const navLinks = navMenu.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('nav-links--open');
            hamburger.classList.remove('hamburger--open');
        });
    });

    document.addEventListener('click', (e) => {
        if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
            navMenu.classList.remove('nav-links--open');
            hamburger.classList.remove('hamburger--open');
        }
    });
}

// Navbar scroll shadow
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (!navbar) return;

    if (currentScroll > 100) {
        navbar.style.boxShadow = '0 4px 16px rgba(50, 0, 71, 0.12)';
    } else {
        navbar.style.boxShadow = '0 1px 0 rgba(50, 0, 71, 0.08)';
    }
});

// Intersection observer for scroll-entrance animations
if ('IntersectionObserver' in window) {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('.feature-item, .step-item, .feature-ai-card').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(16px)';
            el.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
            observer.observe(el);
        });
    });
}
