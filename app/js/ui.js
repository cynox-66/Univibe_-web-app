/**
 * ui.js
 * Handles shared UI logic: Navigation (Top & Mobile), Theme Toggle, and Global Interactions.
 */

document.addEventListener("DOMContentLoaded", () => {
    injectNavigation();
    injectThemeToggle();
    checkTheme();
});

// --- NAVIGATION CONFIG ---
const navItems = [
    { name: "Feed", icon: "fa-house", link: "feed.html" },
    { name: "Discover", icon: "fa-layer-group", link: "discover.html" },
    { name: "Analytics", icon: "fa-chart-pie", link: "analytics.html" },
    { name: "Leaderboard", icon: "fa-trophy", link: "leaderboard.html" },
    { name: "Chat", icon: "fa-comment-dots", link: "chat.html" },
    { name: "Profile", icon: "fa-user", link: "profile.html" }
];

function injectNavigation() {
    const topContainer = document.getElementById('top-nav-container');
    const mobileContainer = document.getElementById('mobile-nav-strip');
    
    // Skip if containers don't exist (e.g. login page)
    if (!topContainer && !mobileContainer) return;

    const currentPath = window.location.pathname;

    // Generate HTML
    const navHTML = navItems.map(item => {
        const isActive = currentPath.includes(item.link);
        return `
            <a href="${item.link}" class="nav-tab ${isActive ? 'active' : ''}">
                <i class="fa-solid ${item.icon}"></i>
                <span>${item.name}</span>
            </a>
        `;
    }).join('');

    // Inject Desktop
    if (topContainer) topContainer.innerHTML = navHTML;

    // Inject Mobile (Clone)
    if (mobileContainer) {
        mobileContainer.innerHTML = navHTML;
        // Show/Hide logic is handled by CSS media queries (.hidden class on desktop)
        // But we need to ensure the container is visible on mobile
        if (window.innerWidth <= 900) {
            mobileContainer.classList.remove('hidden');
        }
        
        window.addEventListener('resize', () => {
            if (window.innerWidth <= 900) mobileContainer.classList.remove('hidden');
            else mobileContainer.classList.add('hidden');
        });
    }
}

// --- DARK MODE ---

function injectThemeToggle() {
    const container = document.getElementById('theme-toggle-container');
    if (!container) return;

    const isDark = localStorage.getItem('uni_theme') === 'dark';
    const icon = isDark ? 'fa-sun' : 'fa-moon';

    container.innerHTML = `
        <div class="theme-toggle" onclick="toggleTheme()" title="Toggle Dark Mode">
            <i class="fa-solid ${icon}" id="theme-icon"></i>
        </div>
    `;
}

window.toggleTheme = function() {
    const body = document.body;
    const icon = document.getElementById('theme-icon');
    
    body.classList.toggle('dark-mode');
    
    if (body.classList.contains('dark-mode')) {
        localStorage.setItem('uni_theme', 'dark');
        icon.classList.replace('fa-moon', 'fa-sun');
    } else {
        localStorage.setItem('uni_theme', 'light');
        icon.classList.replace('fa-sun', 'fa-moon');
    }
};

function checkTheme() {
    const savedTheme = localStorage.getItem('uni_theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    }
}