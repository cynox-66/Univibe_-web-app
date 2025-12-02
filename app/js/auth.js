/**
 * auth.js
 * Handles login and session management.
 */

// Auth Guard
if (!window.location.pathname.includes('login.html')) {
    const user = localStorage.getItem('uni_user');
    if (!user) window.location.href = 'login.html';
}

function login(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const gender = document.getElementById('gender').value;
    const uni = document.getElementById('uni').value;
    const major = document.getElementById('major').value;

    if (!gender) {
        alert("Please select a gender to continue.");
        return;
    }

    // Default User Object
    const userObj = {
        name: name,
        gender: gender,
        uni: uni || "University",
        major: major || "Student",
        ei: 850,
        social: 420,
        matches: [],
        chats: {}
    };

    localStorage.setItem('uni_user', JSON.stringify(userObj));
    
    // Animation out
    gsap.to('.login-card', {
        y: -50, opacity: 0, duration: 0.5,
        onComplete: () => window.location.href = 'feed.html'
    });
}