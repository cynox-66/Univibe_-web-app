/**
 * firestore.js
 * Central Service Layer for all asynchronous database interactions (CRUD).
 * Uses modules exported from api_config.js.
 */

import { 
    db, auth, doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove,
    collection, query, where, getDocs, onAuthStateChanged, // Added for Leaderboard
    onSnapshot // For Real-time Chat
} from './api_config.js';

// --- CONFIGURATION ---
const USERS_COLLECTION = 'univibe_users';
const CHATS_COLLECTION = 'univibe_chats';
const DISCOVERY_COLLECTION = 'univibe_discovery_profiles';

let currentUserId = null;

// Ensure we have the UID before performing any action
function waitForAuth() {
    return new Promise(resolve => {
        const unsubscribe = onAuthStateChanged(auth, user => {
            if (user) {
                currentUserId = user.uid;
                unsubscribe();
                resolve(currentUserId);
            }
        });
    });
}

// --- 1. USER PROFILE MANAGEMENT (CRUD) ---

/**
 * Creates a new user profile document upon successful login.
 */
export async function createNewUser(uid, userData) {
    const userRef = doc(db, USERS_COLLECTION, uid);
    
    // Default structure, merging in initial form data
    const initialProfile = {
        uid: uid,
        createdAt: Date.now(),
        // Form Data
        name: userData.name,
        gender: userData.gender,
        uni: userData.uni,
        major: userData.major,
        // Default Stats
        ei: 850,
        social: 420,
        attendance: 85,
        projects: [],
        certificates: [],
        swipes: [],
        matches: [],
        bio: `Hello! I'm ${userData.name} and I just joined UniVibe.`
    };

    await setDoc(userRef, initialProfile, { merge: false });
    return initialProfile;
}

/**
 * Retrieves the current user's profile data.
 */
export async function getUserProfile() {
    const uid = await waitForAuth();
    if (!uid) return null;

    const userRef = doc(db, USERS_COLLECTION, uid);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
        return docSnap.data();
    } else {
        // If profile doesn't exist but user is signed in (shouldn't happen after login flow)
        console.warn("No user profile found in Firestore for UID:", uid);
        return null; 
    }
}

/**
 * Updates specific fields on the current user's profile (e.g., bio, skills, certs).
 */
export async function updateUserProfile(data) {
    const uid = await waitForAuth();
    if (!uid) return false;
    
    const userRef = doc(db, USERS_COLLECTION, uid);
    
    try {
        await updateDoc(userRef, data);
        return true;
    } catch (e) {
        console.error("Error updating user profile:", e);
        return false;
    }
}

// --- 2. DISCOVERY & MATCHING ---

/**
 * Retrieves a list of all possible profiles from a master collection for the Discover page.
 */
export async function getDiscoveryProfiles() {
    const profilesCol = collection(db, DISCOVERY_COLLECTION);
    const snapshot = await getDocs(profilesCol);
    
    if (!snapshot.empty) {
        // Map the snapshot to an array of profile objects
        return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
    }
    return [];
}

/**
 * Records a swipe (pass or like) in the current user's 'swipes' array.
 */
export async function recordSwipe(targetUid) {
    const uid = await waitForAuth();
    if (!uid) return false;
    
    const userRef = doc(db, USERS_COLLECTION, uid);
    
    try {
        await updateDoc(userRef, {
            swipes: arrayUnion(targetUid)
        });
        return true;
    } catch (e) {
        console.error("Error recording swipe:", e);
        return false;
    }
}

/**
 * Adds a target user to the current user's 'matches' array.
 */
export async function addMatch(targetUid) {
    const uid = await waitForAuth();
    if (!uid) return false;
    
    const userRef = doc(db, USERS_COLLECTION, uid);
    
    try {
        await updateDoc(userRef, {
            matches: arrayUnion(targetUid)
        });
        return true;
    } catch (e) {
        console.error("Error adding match:", e);
        return false;
    }
}

// --- 3. CHAT OPERATIONS ---

/**
 * Starts a real-time listener on a specific chat document.
 * The document ID must be constructed as [UID_A]_[UID_B] (sorted).
 */
export async function subscribeToChat(matchId, callback) {
    const uid = await waitForAuth();
    if (!uid || !matchId) return () => {}; 
    
    const chatRef = doc(db, CHATS_COLLECTION, matchId);
    
    // onSnapshot sets up the real-time connection.
    const unsubscribe = onSnapshot(chatRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
            callback(docSnapshot.data().messages || []);
        } else {
            callback([]);
        }
    }, (error) => {
        console.error("Chat subscription error:", error);
    });
    
    return unsubscribe;
}

/**
 * Sends a new message to the chat history array in the specified match document.
 */
export async function sendMessage(matchId, messageData) {
    const chatRef = doc(db, CHATS_COLLECTION, matchId);
    
    try {
        // Try to update existing document (append message)
        await updateDoc(chatRef, {
            messages: arrayUnion(messageData),
            lastUpdated: Date.now()
        });
        return true;
    } catch (e) {
        // Document likely does not exist yet (first message); create it.
        await setDoc(chatRef, {
            messages: [messageData],
            userA: messageData.senderId,
            userB: matchId, // Note: This mapping depends on how the docId was created
            createdAt: Date.now()
        }, { merge: false });
        return true;
    }
}

// --- 4. LEADERBOARD ---

/**
 * Fetches user data sorted by a specified field (e.g., 'ei').
 * @param {string} sortBy The field to sort by ('ei', 'projects', 'social').
 * @returns {Array} List of user profiles.
 */
export async function getLeaderboardData(sortBy = 'ei') {
    // Firestore requires an index for sorting
    const usersCol = collection(db, USERS_COLLECTION);
    
    // Construct the query: Order by the requested field descending, and limit to 50
    const q = query(usersCol, orderBy(sortBy, "desc"), limit(50));
    
    try {
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
    } catch (e) {
        console.error("Error fetching leaderboard data:", e);
        // Fallback or detailed error based on missing index
        return [];
    }
}