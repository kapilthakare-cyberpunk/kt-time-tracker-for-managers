import { auth, db } from './firebase-config.js';
import { 
    collection, addDoc, query, where, 
    orderBy, getDocs, Timestamp 
} from "firebase/firestore";
import { 
    signInWithPopup,
    GoogleAuthProvider // Changed from GithubAuthProvider
} from "firebase/auth";

// Telegram bot configuration
const TELEGRAM_BOT_TOKEN = '7701499260:AAEUM83mvCEvcXVsxwjX9R6iV03Lv0evUDI';
const TELEGRAM_CHAT_ID = '731410004';

// Team configuration
const TEAM_CONFIG = {
    "Sales Team": ["Samiir Shaikh", "Prakash Prasad", "Sujata Virkar"],
    "Registration Team": ["Shiwani Gade", "Rupali Yawatkar"],
    "Trainee Sales": ["Dipti Pawar"]
};

// Authentication state observer
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('timeTrackerSection').style.display = 'block';
        // loadUserData(user); // Function not defined in current scope, updateUI is called later
    } else {
        // User is signed out
        document.getElementById('loginSection').style.display = 'block';
        document.getElementById('timeTrackerSection').style.display = 'none';
    }
});

// Google Authentication
async function signInWithGoogle() { // Renamed function
    const provider = new GoogleAuthProvider(); // Changed provider
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        // Check if user is part of the team
        const isTeamMember = Object.values(TEAM_CONFIG)
            .flat()
            .includes(user.displayName);
        
        if (!isTeamMember) {
            await auth.signOut();
            alert('Access denied. Only team members can log in.');
            return;
        }
    } catch (error) {
        console.error("Error during Google sign-in:", error); // Updated error message
        alert('Failed to sign in with Google'); // Updated alert
    }
}

// Log activity to Firestore and send Telegram notification
async function logActivity(activity) {
    try {
        const user = auth.currentUser;
        if (!user) {
            alert('Please sign in first');
            return;
        }

        // Add activity to Firestore
        const activityRef = await addDoc(collection(db, "activities"), {
            userId: user.uid,
            userName: user.displayName,
            activity: activity,
            timestamp: Timestamp.now()
        });

        // Send Telegram notification
        const message = `👤 ${user.displayName}\n📝 ${activity}\n⏰ ${new Date().toISOString()}`;
        await sendTelegramNotification(message);

        updateUI();
    } catch (error) {
        console.error("Error logging activity:", error);
        alert('Failed to log activity');
    }
}

// Send Telegram notification
async function sendTelegramNotification(message) {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    try {
        await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            })
        });
    } catch (error) {
        console.error("Error sending Telegram notification:", error);
    }
}

// Update UI with today's activities
async function updateUI() {
    const user = auth.currentUser;
    if (!user) return;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const activitiesQuery = query(
        collection(db, "activities"),
        where("timestamp", ">=", Timestamp.fromDate(startOfDay)),
        orderBy("timestamp", "desc")
    );

    try {
        const querySnapshot = await getDocs(activitiesQuery);
        const activityLog = document.getElementById('activityLog');
        activityLog.innerHTML = '';

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const activityDiv = document.createElement('div');
            activityDiv.className = 'mb-2';
            activityDiv.innerHTML = `
                <strong>${data.timestamp.toDate().toISOString().replace('T', ' ').substr(0, 19)}</strong>
                - ${data.userName}: ${data.activity}
            `;
            activityLog.appendChild(activityDiv);
        });
    } catch (error) {
        console.error("Error updating UI:", error);
    }
}

// Make functions globally available for HTML event handlers
window.signInWithGoogle = signInWithGoogle; // Updated global assignment
window.logActivity = logActivity;

// Initial UI update and load user data if already signed in
auth.onAuthStateChanged((user) => {
    if (user) {
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('timeTrackerSection').style.display = 'block';
        // Ensure loadUserData is defined or called appropriately
        // For now, we'll call updateUI directly as loadUserData is not defined in the provided snippet
        updateUI(); 
    } else {
        document.getElementById('loginSection').style.display = 'block';
        document.getElementById('timeTrackerSection').style.display = 'none';
    }
});

// Event listeners for buttons - these need to be adapted as per the new HTML structure
// The old event listeners might not work directly with the new HTML.
// We'll rely on the onAuthStateChanged to show/hide sections and inline onclick for signInWithGoogle.
// The activity logging buttons (Login, Logout, Break Start/End) will call logActivity.

// Example of how to attach event listeners if needed for the new buttons:
document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) loginBtn.addEventListener('click', () => logActivity('Login'));

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', () => logActivity('Logout'));
    
    const lunchStartBtn = document.getElementById('lunchStartBtn');
    if (lunchStartBtn) lunchStartBtn.addEventListener('click', () => logActivity('Lunch Break Start'));

    const lunchEndBtn = document.getElementById('lunchEndBtn');
    if (lunchEndBtn) lunchEndBtn.addEventListener('click', () => logActivity('Lunch Break End'));

    const shortBreakStartBtn = document.getElementById('shortBreakStartBtn');
    if (shortBreakStartBtn) shortBreakStartBtn.addEventListener('click', () => logActivity('Short Break Start'));
    
    const shortBreakEndBtn = document.getElementById('shortBreakEndBtn');
    if (shortBreakEndBtn) shortBreakEndBtn.addEventListener('click', () => logActivity('Short Break End'));
});