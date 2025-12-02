/**
 * chat.js
 * Handles messaging logic, fetching matches from Firestore, and message history.
 * FIX: Uses real-time onSnapshot listener (via subscribeToChat) for instant updates.
 */

import { 
    getUserProfile, 
    sendMessage as sendFirestoreMessage, 
    subscribeToChat 
} from './services/firestore.js';

// Global state variables
let activeChatId = null;
let currentUser = null;
let currentMatches = []; 
let unsubscribeFromChat = null; // Store the listener function

// DOM Elements
const layout = document.getElementById('chat-layout');
const matchListEl = document.getElementById('match-list');
const msgContainer = document.getElementById('msg-container');
const msgInput = document.getElementById('msg-input');
const noChatView = document.getElementById('no-chat');
const chatView = document.getElementById('active-chat-view');
const typingInd = document.getElementById('typing-indicator');

document.addEventListener("DOMContentLoaded", () => {
    initChatModule();

    // Search Listener
    document.getElementById('search-matches').addEventListener('keyup', (e) => {
        loadMatches(e.target.value);
    });

    // Enter Key Send
    msgInput.addEventListener('keypress', (e) => {
        if(e.key === 'Enter') sendMessage();
    });
});

// --- 1. INITIALIZATION (ASYNC DATA LOAD) ---

async function initChatModule() {
    currentUser = await getUserProfile();
    if (!currentUser) return;

    // Fetch the match UIDs from the user's profile and populate currentMatches
    const matchUids = currentUser.matches || [];
    
    // NOTE: This logic is still simulated using placeholders to keep the front-end functional 
    // without requiring complex database queries for every user profile object.
    currentMatches = matchUids.map(uid => ({ 
        uid: uid, 
        name: `User ${uid.slice(0, 4)}`, // Placeholder name
        img: `https://randomuser.me/api/portraits/thumb/${uid.startsWith('f') ? 'women' : 'men'}/${Math.floor(Math.random() * 99)}.jpg`,
        color: uid.startsWith('f') ? '#a18cd1' : '#84fab0'
    }));

    loadMatches();
}


// --- 2. SIDEBAR LOGIC ---

function loadMatches(filter = "") {
    matchListEl.innerHTML = '';
    
    if (currentMatches.length === 0) {
        matchListEl.innerHTML = '<div style="padding:30px; text-align:center; font-size:0.9rem; color:var(--text-secondary)"><i class="fa-solid fa-heart-crack" style="font-size:2rem; margin-bottom:10px;"></i><br>No matches yet.</div>';
        return;
    }

    const filtered = currentMatches.filter(m => m.name.toLowerCase().includes(filter.toLowerCase()));

    filtered.forEach(m => {
        const div = document.createElement('div');
        div.className = `match-item ${activeChatId === m.uid ? 'active' : ''} online`; 
        div.onclick = () => openChat(m);
        
        const avatarHTML = m.img 
            ? `<img src="${m.img}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">` 
            : m.name[0];

        div.innerHTML = `
            <div class="m-avatar" style="background:${m.color || '#ccc'}">
                ${m.img ? avatarHTML : m.name[0]}
                <div class="online-dot"></div>
            </div>
            <div class="m-info">
                <div class="m-name">${m.name}</div>
                <div class="m-last">Start a conversation</div>
            </div>
        `;
        
        gsap.fromTo(div, 
            { x: -20, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.3, delay: 0.05 * filtered.indexOf(m) }
        );
        matchListEl.appendChild(div);
    });
}

// --- 3. CHAT WINDOW LOGIC (onSnapshot IMPLEMENTATION) ---

function getChatDocumentId(matchId) {
    // Ensures the document ID is consistent: [my_uid]_[match_uid]
    return [currentUser.uid, matchId].sort().join('_');
}

async function openChat(match) {
    if (unsubscribeFromChat) {
        unsubscribeFromChat(); // Close previous listener stream
    }
    
    activeChatId = match.uid;
    const chatDocId = getChatDocumentId(match.uid);
    
    // UI Toggles
    noChatView.classList.add('hidden');
    chatView.classList.remove('hidden');
    layout.classList.add('active-chat');
    
    // Header Update 
    document.getElementById('header-name').innerText = match.name;
    const av = document.getElementById('header-avatar');
    if(match.img) {
        av.innerHTML = `<img src="${match.img}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
        av.style.background = 'transparent';
    } else {
        av.innerText = match.name[0];
        av.style.background = match.color;
    }

    loadMatches(); // Refresh sidebar highlight
    msgContainer.innerHTML = ''; // Clear container immediately

    // START REAL-TIME LISTENER: Data will be passed to renderMessages function
    unsubscribeFromChat = await subscribeToChat(chatDocId, (messages) => {
        renderMessages(messages);
    });
}

function renderMessages(history) {
    msgContainer.innerHTML = '';
    
    if (history.length === 0) {
        msgContainer.innerHTML = `<div style="text-align:center; padding:40px; opacity:0.6; display:flex; flex-direction:column; align-items:center;"><div style="background:rgba(255,255,255,0.5); padding:20px; border-radius:50%; margin-bottom:10px;"><i class="fa-solid fa-hand-sparkles" style="font-size:2rem;"></i></div>Say Hi! 👋</div>`;
        return;
    }

    let lastSender = null;

    history.forEach((msg) => {
        const isMe = msg.senderId === currentUser.uid;
        const isGroupStart = msg.senderId !== lastSender;

        const row = document.createElement('div');
        row.className = `msg-row ${isMe ? 'me' : 'them'} ${isGroupStart ? 'group-start' : ''}`;
        
        let avatarHTML = '';
        if(!isMe && isGroupStart) {
            const match = currentMatches.find(m => m.uid === activeChatId);
            const imgContent = match && match.img ? `<img src="${match.img}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">` : (match ? match.name[0] : '?');
            avatarHTML = `<div class="m-avatar" style="width:30px; height:30px; font-size:0.7rem; background:${match ? match.color : '#ccc'}">${imgContent}</div>`;
        } else if (!isMe) {
            avatarHTML = `<div style="width:30px;"></div>`; 
        }

        row.innerHTML = `
            ${!isMe ? avatarHTML : ''}
            <div>
                <div class="msg-bubble">${msg.text}</div>
                <div class="msg-meta">
                    ${formatTime(msg.timestamp)}
                    ${isMe ? '<i class="fa-solid fa-check"></i>' : ''}
                </div>
            </div>
        `;

        msgContainer.appendChild(row);
        lastSender = msg.senderId;
    });

    // Animate only the most recent messages smoothly
    gsap.fromTo(".msg-row", 
        { y: 10, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.3, stagger: 0.05, ease: "power2.out" }
    );
    
    scrollToBottom();
}

// --- 4. SENDING & BOT LOGIC (ASYNC WRITE) ---

function sendMessage() {
    const text = msgInput.value.trim();
    if (!text || !activeChatId || !currentUser) return;

    const messageData = {
        senderId: currentUser.uid,
        text: text,
        timestamp: Date.now()
    };
    
    const chatDocId = getChatDocumentId(activeChatId);

    // ASYNC WRITE: Send message to Firestore (The real-time listener handles the display)
    sendFirestoreMessage(chatDocId, messageData);

    msgInput.value = '';
    
    // Simulate Typing & Reply
    showTyping();
    const delay = 1500 + Math.random() * 1500;
    setTimeout(() => {
        hideTyping();
        const reply = getBotReply();
        const botMessageData = {
            senderId: activeChatId, // Bot sends on behalf of the match
            text: reply,
            timestamp: Date.now()
        };
        // ASYNC WRITE: Send bot message to Firestore
        sendFirestoreMessage(chatDocId, botMessageData);
    }, delay);
}


// --- 5. UTILS ---

function getBotReply() {
    const responses = [
        "That sounds awesome! Tell me more.",
        "I've been working on something similar in React.",
        "Haha, totally agree! 😂",
        "Are you going to the hackathon this weekend?",
        "Just saw your profile, impressive stats!",
        "Let's connect on LinkedIn too.",
        "That is super cool."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
}

function scrollToBottom() {
    gsap.to(msgContainer, { 
        scrollTop: msgContainer.scrollHeight, 
        duration: 0.5, 
        ease: "power2.out" 
    });
}

function formatTime(ts) {
    // Handle Firestore Timestamp objects which might not have toTimeString()
    const date = new Date(ts.seconds ? ts.seconds * 1000 : ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}