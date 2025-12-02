/**
 * router.js
 * Handles authentication checks and active navigation states.
 * Runs on every page load.
 */

(function initRouter() {
    const path = window.location.pathname;
    const user = localStorage.getItem('uni_user');

    // 1. Auth Guard
    // If we are NOT on login page and NO user exists -> Redirect to login
    if (!path.includes('login.html') && !user) {
        console.warn("No user found. Redirecting to login.");
        window.location.href = 'login.html';
        return; 
    }

    // 2. Active Nav Highlighter
    // Waits for the DOM to load the UI (nav bar), then highlights the current icon
    document.addEventListener("DOMContentLoaded", () => {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            // Remove previous active classes (safety)
            item.classList.remove('active');
            
            // Add active class if href matches current path
            if (path.includes(item.getAttribute('href'))) {
                item.classList.add('active');
            }
        });
    });

})();