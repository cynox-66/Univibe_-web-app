import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import { 
    getFirestore, doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove,
    collection, query, where, getDocs 
} from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';
import { 
    getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken 
} from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';


const firebaseConfig = {
    // You should get these specific values from your project settings (univibe-c8d9f)
    apiKey: "AIzaSyADxorFEZ1xu2e6YvaUfWLgAU_rxh6xdjs", 
    authDomain: "univibe-c8d9f.firebaseapp.com",
    projectId: "univibe-c8d9f",
    storageBucket: "univibe-c8d9f.firebasestorage.app",
    messagingSenderId: "677091956892",
    appId: "1:677091956892:web:27274b4d43a1c9224b7559"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let userId = null;

// --- Authentication Setup (Executed immediately to get a UID) ---
// This ensures that even before a full login, the app has a unique ID to perform reads/writes.
auth.onAuthStateChanged(user => {
    if (user) {
        userId = user.uid;
        console.log("Firebase: User status established:", userId);
    } else {
        // Sign in anonymously if no user is found (necessary for Firestore rules and initial data fetching)
        signInAnonymously(auth).then(userCredential => {
            userId = userCredential.user.uid;
            console.log("Firebase: Signed in anonymously.");
        });
    }
});

// Export necessary Firebase modules for use in the firestore.js service layer
export { 
    db, auth, userId, 
    doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove, 
    collection, query, where, getDocs, onAuthStateChanged 
};