/**
 * discover.js
 * Handles Card Stack, Physics Swipes, and Gender-Based Matching using Firestore Services.
 * Status: Refactored to fetch master profile list from Firestore.
 */

import { 
    getUserProfile, 
    recordSwipe, 
    addMatch, 
    getDiscoveryProfiles, // New function import
    sendMessage as sendFirestoreMessage
} from './services/firestore.js'; // Assuming you added getDiscoveryProfiles

// Removed the static 'masterProfiles' array from here

const stackContainer = document.getElementById('card-stack');
const modal = document.getElementById('match-modal');
let isAnimating = false;
let currentUser = null; 
let profilesDeck = []; 
let masterProfiles = []; // Will hold the live data from the cloud
window.currentMatchProfile = null;

document.addEventListener("DOMContentLoaded", () => {
    initDiscovery();
});

// --- 1. INITIALIZATION (ASYNC DATA LOAD) ---

async function initDiscovery() {
    currentUser = await getUserProfile();
    if (!currentUser) {
        console.error("User profile failed to load. Check Firebase connection/Auth.");
        return;
    }

    // 2. Get ALL Discovery Profiles (Fetched from the cloud)
    // This is asynchronous and pulls the data we need to filter against.
    masterProfiles = await getDiscoveryProfiles();

    // 3. Filter Deck based on live user data
    filterProfiles();
    
    // 4. Render Stack
    renderStack();
}

function filterProfiles() {
    // ... (rest of filtering logic remains the same, using masterProfiles) ...
    const userGender = currentUser.gender;
    const targetGender = userGender === "Male" ? "Female" : "Male";
    const swipedIds = currentUser.swipes || [];

    profilesDeck = masterProfiles.filter(p => 
        p.gender === targetGender && !swipedIds.includes(p.uid)
    );

    profilesDeck.sort(() => Math.random() - 0.5);
}

// (The rest of renderStack, triggerSwipe, adjustStack, checkForMatch functions remain the same)