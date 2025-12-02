/**
 * profile.js
 * Handles data loading, editing, and GSAP animations for the profile page.
 * Status: Refactored to use Firestore for reading and updating profile data.
 */

import { getUserProfile, updateUserProfile } from './services/firestore.js';

// Default Data (Fallback for first load)
const defaultUser = {
    name: "New UniVibe User",
    major: "Undeclared",
    uni: "The Internet",
    bio: "I'm a passionate learner ready to explore new opportunities on UniVibe.",
    ei: 850,
    social: 420,
    skills: ["Learning", "Curiosity", "Coding"],
    badges: ["🏆 Newcomer"],
    timeline: [{ date: "Today", title: "Joined UniVibe" }],
    projects: [
        { title: "UniVibe App", img: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=300&q=80" },
    ],
    certificates: [{ title: "Firebase Setup", org: "Google Cloud" }]
};

document.addEventListener("DOMContentLoaded", () => {
    initProfile();
    initAnimations();
});

let currentUserData = {}; // Store the live profile data

// --- DATA LOGIC ---

async function initProfile() {
    const fetchedUser = await getUserProfile();
    // Merge fetched data with defaults to ensure all fields exist
    currentUserData = { ...defaultUser, ...fetchedUser };
    
    renderProfile(currentUserData);
}

function renderProfile(user) {
    // 1. Text Fields
    document.getElementById('p-name').innerText = user.name;
    document.getElementById('p-role').innerText = `${user.major} • ${user.uni}`;
    document.getElementById('p-bio').innerText = user.bio;
    document.getElementById('p-avatar-display').innerText = user.name.charAt(0).toUpperCase();

    // 2. Stats
    animateCounter('score-social', user.social);
    animateCounter('score-projects', user.projects ? user.projects.length : 0);
    
    // EI Ring
    const eiRing = document.getElementById('ei-ring');
    const eiVal = user.ei || 0;
    const offset = 251 - ((eiVal / 1000) * 251);
    
    gsap.to(eiRing, { strokeDashoffset: offset, duration: 2, ease: "power3.out", delay: 0.5 });
    animateCounter('score-ei', eiVal);

    // 3. Skills
    const skillBox = document.getElementById('p-skills');
    skillBox.innerHTML = user.skills.map(s => `<span class="skill-chip">${s}</span>`).join('');

    // 4. Projects (Only render if structure exists)
    const projBox = document.getElementById('p-projects');
    if (user.projects && user.projects.length > 0) {
        projBox.innerHTML = user.projects.map(p => `
            <div class="project-card">
                <img src="${p.img}" class="project-img" alt="${p.title}">
                <div class="project-overlay">
                    <span class="project-title">${p.title}</span>
                </div>
            </div>
        `).join('');
    } else {
        projBox.innerHTML = '<p style="color:var(--text-secondary); font-size:0.9rem;">No projects added yet.</p>';
    }

    // 5. Certificates & Timeline (Simplified rendering)
    const certBox = document.getElementById('p-certs');
    certBox.innerHTML = user.certificates.length > 0 ? user.certificates.map(c => `
        <div class="cert-item"><div class="cert-icon"><i class="fa-solid fa-check"></i></div><div><div style="font-weight:600; font-size:0.9rem;">${c.title}</div><div style="font-size:0.75rem; color:var(--text-secondary);">${c.org}</div></div></div>
    `).join('') : '<p style="color:var(--text-secondary); font-size:0.9rem;">No certificates yet.</p>';

    const timeBox = document.getElementById('p-timeline');
    timeBox.innerHTML = user.timeline.length > 0 ? user.timeline.map(t => `
        <div class="timeline-item"><div class="t-date">${t.date}</div><div class="t-title">${t.title}</div></div>
    `).join('') : '<p style="color:var(--text-secondary); font-size:0.9rem;">No history yet.</p>';

    // 6. Badges
    const badgeBox = document.getElementById('p-badges');
    badgeBox.innerHTML = user.badges.map(b => 
        `<span class="chip-glass" style="padding:8px 16px; background:#fff; font-size:0.8rem;">${b}</span>`
    ).join('');
}

// --- EDIT MODAL LOGIC (ASYNC WRITE) ---

window.openEditModal = function() {
    const user = currentUserData;
    const modal = document.getElementById('edit-modal');
    
    // Fill Inputs
    document.getElementById('edit-name').value = user.name;
    document.getElementById('edit-major').value = user.major;
    document.getElementById('edit-uni').value = user.uni;
    document.getElementById('edit-bio').value = user.bio;
    document.getElementById('edit-skills').value = user.skills.join(', ');

    modal.classList.add('active');
    gsap.fromTo(".modal-content", { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: "power2.out" });
};

window.saveProfile = async function(e) {
    e.preventDefault();
    
    const skillInput = document.getElementById('edit-skills').value;

    const updatedData = {
        name: document.getElementById('edit-name').value,
        major: document.getElementById('edit-major').value,
        uni: document.getElementById('edit-uni').value,
        bio: document.getElementById('edit-bio').value,
        skills: skillInput.split(',').map(s => s.trim()).filter(s => s.length > 0)
    };

    // ASYNC WRITE: Update profile in Firestore
    const success = await updateUserProfile(updatedData);

    if (success) {
        // Update local data store and re-render the profile using the new data
        currentUserData = { ...currentUserData, ...updatedData };
        renderProfile(currentUserData);
        closeEditModal();
    } else {
        alert("Failed to save profile. Check connection.");
    }
};

// ... (closeEditModal, animateCounter, initAnimations remain the same) ...