/**
 * feed.js
 * Handles post generation, animations, infinite scroll, and Side Panel Stats.
 */

import { getUserProfile, updateUserProfile } from './services/firestore.js';

window.addEventListener("load", () => ScrollTrigger.refresh());

const feedContainer = document.getElementById('feed-container');
const loader = document.getElementById('feed-loader');
let postCount = 0;
let loading = false;
let currentUser = null;

// --- 1. INITIALIZATION & SIDE PANEL ---

// --- 1. INITIALIZATION & SIDE PANEL ---

async function initFeed() {
    try {
        // Wait for auth and profile
        currentUser = await getUserProfile();
        
        if (currentUser) {
            initSidePanel(currentUser);
        } else {
            console.log("Guest view or profile not loaded.");
        }

        // Load Feed Content
        loadMorePosts();
        if(loader) observer.observe(loader);

    } catch (error) {
        console.error("Error initializing feed:", error);
    }
}

document.addEventListener("DOMContentLoaded", initFeed);

function initSidePanel(user) {
    // 1. EI Circle
    const eiVal = user.ei || 0;
    const eiRing = document.getElementById('mini-ei-ring');
    const eiText = document.getElementById('mini-ei-val');
    
    if(eiRing && eiText) {
        eiText.innerText = eiVal;
        // 283 is circumference (2 * pi * 45)
        const offset = 283 - ((eiVal / 1000) * 283);
        gsap.to(eiRing, { strokeDashoffset: offset, duration: 1.5, ease: "power3.out" });
    }

    // 2. Consistency & Streak
    // Mock calculations if fields missing
    const consistency = Math.round((user.attendance || 85) * 0.8 + (user.ei || 850) / 100); 
    const streak = user.streak || 12;

    const conEl = document.getElementById('qs-consistency');
    const strEl = document.getElementById('qs-streak');

    if(conEl) animateCounter(conEl, consistency, "%");
    if(strEl) animateCounter(strEl, streak, "");
}

function animateCounter(el, target, suffix) {
    let obj = { val: 0 };
    gsap.to(obj, {
        val: target,
        duration: 1.5,
        ease: "power3.out",
        onUpdate: () => el.innerText = Math.round(obj.val) + suffix
    });
}

// --- 2. QUICK ACTIONS ---

window.logAttendance = async function() {
    if(!currentUser) return;
    
    const btn = document.querySelector('.panel-btn i.fa-calendar-check');
    
    // 1. UI Animation
    gsap.to(btn, { rotation: 360, duration: 0.5 });
    
    // 2. Calculate New Values
    const currentAtt = currentUser.attendance || 0;
    const newAtt = Math.min(100, currentAtt + 1); // Cap at 100
    
    // 3. Update Firestore
    const success = await updateUserProfile({ attendance: newAtt });
    
    if (success) {
        // 4. Update Local State & UI
        currentUser.attendance = newAtt;
        initSidePanel(currentUser); // Refresh panel stats
        alert(`Attendance Logged! \nNew Attendance: ${newAtt}%`);
    } else {
        alert("Failed to log attendance. Please try again.");
    }
};

window.uploadCert = function() {
    // Redirect to Analytics where upload lives, or open modal
    window.location.href = 'analytics.html';
};

window.logProject = function() {
    // Redirect to Profile to add project
    window.location.href = 'profile.html';
};


// --- 3. FEED DATA & LOGIC ---
const mockUsers = [
    { name: "Sarah Jenkins", role: "Design • NIFT", img: "https://randomuser.me/api/portraits/women/44.jpg" },
    { name: "Arjun Patel", role: "CS • IIT Bombay", img: "https://randomuser.me/api/portraits/men/32.jpg" },
    { name: "Priya Sharma", role: "MBA • IIM", img: "https://randomuser.me/api/portraits/women/65.jpg" },
    { name: "David Kim", role: "Dev • MIT", img: "https://randomuser.me/api/portraits/men/86.jpg" },
    { name: "Meera Reddy", role: "Arch • CEPT", img: "https://randomuser.me/api/portraits/women/22.jpg" },
    { name: "Rohan Das", role: "Film • FTII", img: "https://randomuser.me/api/portraits/men/54.jpg" },
    { name: "Aisha Khan", role: "Bio • VIT", img: "https://randomuser.me/api/portraits/women/12.jpg" },
    { name: "Vikram S", role: "Robotics • IITM", img: "https://randomuser.me/api/portraits/men/11.jpg" }
];

const postTemplates = [
    { 
        type: 'project', 
        content: "Just shipped my new portfolio! Used React, ThreeJS and GSAP. The glassmorphism took forever to get right but I love it! 🚀", 
        img: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80", 
        tags: ["#React", "#Portfolio", "#WebDev"] 
    },
    { 
        type: 'project', 
        content: "Built a drone navigation system using Python and ROS. Check out the flight path simulation below!", 
        img: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=800&q=80", 
        tags: ["#Robotics", "#Python", "#Engineering"] 
    },
    { 
        type: 'certificate', 
        content: "Officially certified in Advanced Data Analytics! Thanks to the professors for the mentorship.", 
        title: "Google Data Analytics Professional", 
        tags: ["#Certified", "#Data", "#Learning"] 
    },
    { 
        type: 'certificate', 
        content: "Just passed the AWS Solutions Architect exam! It was tough but totally worth the grind.", 
        title: "AWS Certified Solutions Architect", 
        tags: ["#AWS", "#Cloud", "#Milestone"] 
    },
    { 
        type: 'streak', 
        content: "Consistency is key! Just hit a 30-day coding streak on UniVibe. Who else is grinding today?", 
        streak: 30 
    },
    { 
        type: 'achievement', 
        content: "We won 1st place at the Hackathon! 🏆 48 hours of no sleep but worth it. Teamwork makes the dream work.", 
        img: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=800&q=80", 
        tags: ["#Hackathon", "#Winner", "#Coding"] 
    }
];

function getTimeAgo(minusMinutes) {
    if (minusMinutes < 60) return `${minusMinutes}m ago`;
    if (minusMinutes < 1440) return `${Math.floor(minusMinutes / 60)}h ago`;
    return `${Math.floor(minusMinutes / 1440)}d ago`;
}

function fetchPosts(count = 4) {
    return new Promise(resolve => {
        setTimeout(() => {
            const newPosts = [];
            for (let i = 0; i < count; i++) {
                const user = mockUsers[Math.floor(Math.random() * mockUsers.length)];
                const template = postTemplates[Math.floor(Math.random() * postTemplates.length)];
                const timeOffset = (postCount * 60) + (Math.random() * 60); 
                
                newPosts.push({
                    id: `post-${Date.now()}-${i}`,
                    user: user,
                    ...template,
                    time: getTimeAgo(Math.floor(timeOffset)),
                    likes: Math.floor(Math.random() * 200) + 5
                });
            }
            postCount += count;
            resolve(newPosts);
        }, 500); 
    });
}

function createPostHTML(post) {
    let mediaHTML = '';
    let extraClass = '';

    if (post.type === 'project' || post.type === 'achievement') {
        mediaHTML = `<div class="card-image-wrapper"><img src="${post.img}" class="card-image parallax-target" alt="Project"></div>`;
    } else if (post.type === 'certificate') {
        extraClass = 'card-type-cert';
        mediaHTML = `<div class="cert-badge"><i class="fa-solid fa-certificate"></i> Verified</div><h3 style="margin-bottom:10px;">${post.title}</h3>`;
    } else if (post.type === 'streak') {
        extraClass = 'card-type-streak';
        mediaHTML = `<div class="streak-visual"><span class="fire-anim">🔥</span><h2 style="display:inline;">${post.streak} Day Streak!</h2></div>`;
    }

    const tagsHTML = post.tags ? `<div class="tags-row">${post.tags.map(t => `<span class="tech-tag">${t}</span>`).join('')}</div>` : '';

    return `
        <article class="feed-card ${extraClass}" data-id="${post.id}" style="opacity:0; transform:translateY(30px);">
            <div class="card-header">
                <img src="${post.user.img}" class="card-avatar" alt="User">
                <div class="card-meta"><h4>${post.user.name}</h4><span>${post.user.role} • ${post.time}</span></div>
            </div>
            <div class="card-body">${mediaHTML}<p>${post.content}</p>${tagsHTML}</div>
            <div class="card-actions">
                <button class="action-btn like-btn" onclick="toggleLike(this)"><i class="fa-regular fa-heart"></i> <span class="like-count">${post.likes}</span></button>
                <button class="action-btn"><i class="fa-regular fa-comment"></i> Comment</button>
                <button class="action-btn"><i class="fa-solid fa-share-nodes"></i> Share</button>
            </div>
        </article>
    `;
}

// --- 4. ANIMATION & SCROLL ---

function animateNewPosts(elements) {
    gsap.to(elements, {
        y: 0, opacity: 1, duration: 0.6, stagger: 0.15, ease: "power2.out",
        clearProps: "transform" 
    });

    elements.forEach(el => {
        const img = el.querySelector('.parallax-target');
        if (img) {
            gsap.fromTo(img, { y: -20 }, {
                y: 20, ease: "none",
                scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true }
            });
        }
    });
}

window.toggleLike = function(btn) {
    const icon = btn.querySelector('i');
    const countSpan = btn.querySelector('.like-count');
    let count = parseInt(countSpan.innerText);

    btn.classList.toggle('liked');
    if (btn.classList.contains('liked')) {
        icon.classList.remove('fa-regular');
        icon.classList.add('fa-solid');
        countSpan.innerText = count + 1;
        gsap.fromTo(icon, { scale: 0.5 }, { scale: 1.2, duration: 0.2, yoyo: true, repeat: 1 });
    } else {
        icon.classList.remove('fa-solid');
        icon.classList.add('fa-regular');
        countSpan.innerText = count - 1;
    }
};

async function loadMorePosts() {
    if (loading) return;
    loading = true;
    loader.style.opacity = 1;

    const posts = await fetchPosts(3);
    const tempDiv = document.createElement('div');
    posts.forEach(p => tempDiv.innerHTML += createPostHTML(p));

    const newElements = Array.from(tempDiv.children);
    newElements.forEach(el => feedContainer.appendChild(el));

    animateNewPosts(newElements);
    
    loading = false;
    loader.style.opacity = 0;
    ScrollTrigger.refresh();
}

const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) loadMorePosts();
}, { rootMargin: '100px' });