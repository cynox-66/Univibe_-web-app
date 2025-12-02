/* ============================================================
   APPLY SAVED THEME BEFORE ANYTHING ELSE (Prevents Flash)
============================================================ */
const savedTheme = localStorage.getItem("uni_theme");
if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
}

/**
 * ui.js
 * Handles shared UI logic: Navigation (Top & Mobile), Theme Toggle,
 * and Global Interactions across all UniVibe pages.
 */

document.addEventListener("DOMContentLoaded", () => {
    injectNavigation();
    injectThemeToggle();
});

/* ============================================================
   NAVIGATION CONFIG
============================================================ */
const navItems = [
    { name: "Feed", icon: "fa-house", link: "feed.html" },
    { name: "Discover", icon: "fa-layer-group", link: "discover.html" },
    { name: "Analytics", icon: "fa-chart-pie", link: "analytics.html" },
    { name: "Leaderboard", icon: "fa-trophy", link: "leaderboard.html" },
    { name: "Chat", icon: "fa-comment-dots", link: "chat.html" },
    { name: "Profile", icon: "fa-user", link: "profile.html" }
];

function injectNavigation() {
    const topContainer = document.getElementById("top-nav-container");
    const mobileContainer = document.getElementById("mobile-nav-strip");

    // Skip if page has no nav containers (like login.html)
    if (!topContainer && !mobileContainer) return;

    const currentPath = window.location.pathname;

    const navHTML = navItems.map(item => {
        const isActive = currentPath.includes(item.link);
        return `
            <a href="${item.link}" class="nav-tab ${isActive ? "active" : ""}">
                <i class="fa-solid ${item.icon}"></i>
                <span>${item.name}</span>
            </a>
        `;
    }).join("");

    if (topContainer) topContainer.innerHTML = navHTML;

    if (mobileContainer) {
        mobileContainer.innerHTML = navHTML;

        // Show mobile navigation only on mobile width
        if (window.innerWidth <= 900) {
            mobileContainer.classList.remove("hidden");
        }

        window.addEventListener("resize", () => {
            if (window.innerWidth <= 900) mobileContainer.classList.remove("hidden");
            else mobileContainer.classList.add("hidden");
        });
    }
}

/* ============================================================
   DARK MODE
============================================================ */

function injectThemeToggle() {
    const container = document.getElementById("theme-toggle-container");
    if (!container) return;

    const isDark = document.body.classList.contains("dark-mode");
    const icon = isDark ? "fa-sun" : "fa-moon";

    container.innerHTML = `
        <div class="theme-toggle" onclick="toggleTheme()" title="Toggle Dark Mode">
            <i class="fa-solid ${icon}" id="theme-icon"></i>
        </div>
    `;
}

window.toggleTheme = function () {
    const body = document.body;
    const icon = document.getElementById("theme-icon");

    const isDark = body.classList.toggle("dark-mode");
    localStorage.setItem("uni_theme", isDark ? "dark" : "light");

    // Swap icon smoothly
    if (isDark) {
        icon.classList.replace("fa-moon", "fa-sun");
    } else {
        icon.classList.replace("fa-sun", "fa-moon");
    }
};
