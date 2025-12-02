/**
 * ui.js
 * Handles shared UI logic like Navigation and Theme.
 */

// Inject Navigation
const navHTML = `
<nav class="bottom-nav">
  <a href="feed.html" class="nav-item" aria-label="Feed"><i class="fa-solid fa-house"></i></a>
  <a href="discover.html" class="nav-item" aria-label="Discover"><i class="fa-solid fa-layer-group"></i></a>
  <a href="analytics.html" class="nav-item" aria-label="Analytics"><i class="fa-solid fa-chart-pie"></i></a>
  <a href="chat.html" class="nav-item" aria-label="Chat"><i class="fa-solid fa-comment-dots"></i></a>
  <a href="profile.html" class="nav-item" aria-label="Profile"><i class="fa-solid fa-user"></i></a>
</nav>`;

if (!window.location.pathname.includes('login.html')) {
    document.body.insertAdjacentHTML('beforeend', navHTML);
    highlightActiveNav();
}

function highlightActiveNav() {
    const path = window.location.pathname;
    const items = document.querySelectorAll('.nav-item');
    
    items.forEach(item => {
        item.classList.remove('active');
        if (path.includes(item.getAttribute('href'))) {
            item.classList.add('active');
        }
    });
}

// Check Dark Mode
if (localStorage.getItem('uni_theme') === 'dark') {
    document.body.classList.add('dark-mode');
}