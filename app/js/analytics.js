/**
 * analytics.js
 * Handles KPIs, Attendance Graphs, Heatmaps, and File Uploads.
 * Status: Refactored to use Firestore for user data and certificate saving.
 */

import { getUserProfile, updateUserProfile, recordSwipe } from './services/firestore.js';

let currentUser = null;

document.addEventListener("DOMContentLoaded", () => {
    initAnalytics();
    initAnimations();
    // No async needed here, just initialization
    initHeatmap('uni'); 
});

async function initAnalytics() {
    currentUser = await getUserProfile();
    if (!currentUser) {
        console.error("Analytics failed to load user profile.");
        return;
    }
    
    // Use data from the user profile for KPIs and attendance
    const currentEI = currentUser.ei || 850;
    const certCount = currentUser.certificates ? currentUser.certificates.length : 0;
    
    initKPIs(currentEI, certCount);
    initAttendance(currentUser.attendance || 85); // Assuming 'attendance' field exists
    loadCertificates(currentUser.certificates);
    
    // Attach listener to the certificate input after user is loaded
    document.getElementById('cert-input').addEventListener('change', verifyCertificate);
}

// --- 1. KPIs & ATTENDANCE ---

function initKPIs(ei, certCount) {
    // Mock Data based on fetched EI
    const consistency = Math.min(100, Math.round(ei / 10)); // EI / 10 roughly
    const streak = Math.floor(Math.random() * 30) + 7; // Mock streak 7-37
    const commits = Math.floor(Math.random() * 500) + 100; // Mock commits
    
    animateCounter('kpi-consistency', consistency, "%");
    animateCounter('kpi-streak', streak, "");
    animateCounter('kpi-commits', commits, "");
}

function initAttendance(percentage) {
    const target = 75;
    const totalClasses = 40;
    const attended = Math.round((percentage / 100) * totalClasses);
    
    // Formula: Safe Skips = (Total Classes * Target %) - Classes Attended
    const requiredAttendance = Math.ceil(totalClasses * (target / 100));
    const canSkip = Math.max(0, totalClasses - requiredAttendance - (totalClasses - attended));
    const safeSkips = Math.floor(canSkip / 2); // Divide by 2 for safety factor

    const ring = document.getElementById('att-ring');
    const text = document.getElementById('att-text');
    const skipEl = document.getElementById('safe-skips');
    
    // 1. Ring Animation: 251 is circumference
    const offset = 251 - ((percentage / 100) * 251);
    
    gsap.fromTo(ring, 
        { strokeDashoffset: 251 }, 
        { strokeDashoffset: offset, duration: 1.5, ease: "power3.inOut", delay: 0.2 }
    );
    
    // 2. Counter Animation
    let countObj = { val: 0 };
    gsap.to(countObj, {
        val: percentage,
        duration: 1.5,
        ease: "power3.out",
        onUpdate: () => { text.innerText = `${Math.round(countObj.val)}%`; }
    });

    // 3. Safe Skips Counter
    gsap.from(skipEl, { innerText: 0, duration: 1, snap: { innerText: 1 } });
    skipEl.innerText = safeSkips;

    // 4. Weekly Graph (Bars)
    const weekData = [40, 60, 80, 50, 90, 100, 30]; 
    const graphContainer = document.getElementById('week-graph');
    graphContainer.innerHTML = '';

    weekData.forEach((h, i) => {
        const bar = document.createElement('div');
        bar.className = `graph-bar ${i === 6 ? 'today' : ''}`;
        bar.style.height = '0%'; 
        graphContainer.appendChild(bar);
        
        gsap.to(bar, { height: `${h}%`, duration: 0.8, delay: i * 0.1, ease: "elastic.out(1, 0.8)" });
    });
}

// --- 2. HEATMAP LOGIC (No Firestore dependency here) ---

window.switchHeatmap = function(type) {
    document.querySelectorAll('.hm-toggle').forEach(b => b.classList.remove('active'));
    document.querySelector(`.hm-toggle[onclick*="${type}"]`).classList.add('active');
    initHeatmap(type);
}

function initHeatmap(type) {
    const grid = document.getElementById('heatmap-grid');
    grid.innerHTML = '';
    const totalCells = 112; 
    const today = new Date();
    
    let intensityThreshold = 0.6; 
    if (type === 'git') intensityThreshold = 0.8; 
    if (type === 'leet') intensityThreshold = 0.4; 

    for (let i = 0; i < totalCells; i++) {
        const div = document.createElement('div');
        const rand = Math.random();
        let level = 0;
        if (rand > intensityThreshold) level = Math.ceil(Math.random() * 4);
        
        div.className = `hm-cell hm-l${level}`;
        const date = new Date();
        date.setDate(today.getDate() - (totalCells - i));
        div.setAttribute('data-date', date.toLocaleDateString(undefined, {month:'short', day:'numeric'}));
        div.setAttribute('data-val', level * 2 + 1);

        grid.appendChild(div);
    }
    // Heatmap Stagger Animation
    gsap.from(".hm-cell", { scale: 0, opacity: 0, duration: 0.4, stagger: { amount: 1, grid: [7, 16], from: "start" }, ease: "back.out(2)" });
}

// --- 3. CERTIFICATE VERIFICATION (ASYNC WRITE) ---

async function verifyCertificate() {
    const input = document.getElementById('cert-input');
    if (!input.files || input.files.length === 0) return;

    const status = document.getElementById('upload-status');
    
    // 1. Loading State
    status.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin" style="color:var(--text-secondary)"></i> AI is analyzing document structure...`;
    
    // 2. Simulated Delay (3s)
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 3. Success State
    status.innerHTML = `<span style="color:#5cb85c"><i class="fa-solid fa-check-circle"></i> <b>Verified!</b> Certificate added to profile.</span>`;
    
    // Data preparation
    const newCert = {
        title: input.files[0].name.replace(/\.[^/.]+$/, "") || "New Verified Certificate",
        org: "AI Verified",
        date: new Date().toLocaleDateString()
    };

    // 4. ASYNC WRITE: Update profile in Firestore
    const newCertList = currentUser.certificates || [];
    newCertList.push(newCert);
    
    // Assuming 10 EI points per certificate for demo calculation
    const newEI = (currentUser.ei || 850) + 10; 
    
    await updateUserProfile({
        certificates: newCertList,
        ei: newEI // Update EI score live
    });

    // 5. Update UI locally
    currentUser.certificates = newCertList;
    loadCertificates(newCertList);
    initKPIs(newEI, newCertList.length); // Refresh KPIs

    // Reset input
    input.value = '';
    setTimeout(() => status.innerHTML = '', 4000);
}

function loadCertificates(certs) {
    const list = document.getElementById('cert-list');
    list.innerHTML = '';

    if (certs && certs.length > 0) {
        certs.forEach(c => addCertToList(c.title, c.org));
    } else {
        list.innerHTML = '<small style="opacity:0.6">No certificates yet.</small>';
    }
}

function addCertToList(title, org) {
    const list = document.getElementById('cert-list');
    
    const div = document.createElement('div');
    div.className = 'cert-item';
    div.innerHTML = `
        <div class="cert-icon"><i class="fa-solid fa-file-pdf"></i></div>
        <div>
            <div style="font-weight:600; font-size:0.9rem;">${title}</div>
            <div style="font-size:0.75rem; color:var(--text-secondary);">${org}</div>
        </div>
    `;
    list.prepend(div);
    gsap.from(div, { x: -20, opacity: 0, duration: 0.5 });
}

// --- 4. UTILS ---

function animateCounter(id, target, suffix) {
    const el = document.getElementById(id);
    const obj = { val: 0 };
    gsap.to(obj, {
        val: target,
        duration: 1.5,
        ease: "power3.out",
        onUpdate: () => {
            el.innerText = Math.round(obj.val) + suffix;
        }
    });
}

function initAnimations() {
    gsap.from(".gs-fade", {
        y: 30, opacity: 0, duration: 0.8, stagger: 0.15, ease: "power2.out", delay: 0.1
    });
}