import { auth, db } from './firebase-config.js';
import {
    collection, addDoc, query, where,
    orderBy, getDocs, Timestamp, updateDoc, doc, limit
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";
import {
    signInWithPopup, signOut,
    GoogleAuthProvider // Changed from GithubAuthProvider
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { calculateDuration } from './utils/duration.js';

// Telegram bot configuration
const TELEGRAM_BOT_TOKEN = '7701499260:AAEUM83mvCEvcXVsxwjX9R6iV03Lv0evUDI';
const TELEGRAM_CHAT_ID = '731410004';

// Team configuration
const TEAM_CONFIG = {
    "Sales Team": ["Samiir Shaikh", "Prakash Prasad", "Sujata Virkar"],
    "Registration Team": ["Shiwani Gade", "Rupali Yawatkar"],
    "Trainee Sales": ["Dipti Pawar"],
    "Manager": ["Kapil Thakare"]
};

// Authentication state observer
auth.onAuthStateChanged((user) => {
    console.log("Auth State:", user ? user.email : "No user");
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => updateAuthUI(user));
    } else {
        updateAuthUI(user);
    }
});

// Update authentication UI
function updateAuthUI(user) {
    const loginSection = document.getElementById('loginSection');
    const timeTrackerSection = document.getElementById('timeTrackerSection');
    
    if (!loginSection || !timeTrackerSection) {
        console.error('Required DOM elements not found');
        return;
    }
    
    if (user) {
        // User is signed in
        loginSection.style.display = 'none';
        timeTrackerSection.style.display = 'block';
        updateUI(); // Load user's activities
    } else {
        // User is signed out
        loginSection.style.display = 'block';
        timeTrackerSection.style.display = 'none';
    }
}

// Google Authentication
async function signInWithGoogle() { // Renamed function
    const provider = new GoogleAuthProvider(); // Changed provider
    provider.setCustomParameters({ prompt: 'select_account' }); // Forces account selection
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

// Make signInWithGoogle globally available
window.signInWithGoogle = signInWithGoogle;

// Logout function
async function logout() {
    try {
        const user = auth.currentUser;
        if (user) {
            console.log('Starting logout process for user:', user.displayName);
            // Log logout activity
            await logActivity('login', false);
            // Sign out from Firebase
            await signOut(auth);
            console.log('User logged out successfully');
            alert('Logged out successfully!');
        } else {
            console.log('No user currently signed in');
            alert('No user currently signed in');
        }
    } catch (error) {
        console.error('Error during logout:', error);
        alert(`Failed to logout: ${error.message}`);
    }
}

// Make logout globally available
window.logout = logout;

// Log activity to Firestore with enhanced duration tracking
async function logActivity(activityType, isStart = true) {
    try {
        const user = auth.currentUser;
        if (!user) {
            alert('Please sign in first');
            return;
        }

        const now = new Date();
        
        if (isStart) {
            // Create start activity
            const activityDoc = {
                startTime: Timestamp.fromDate(now),
                activityType: activityType,
                userId: user.uid,
                userName: user.displayName
            };

            await addDoc(collection(db, "activities"), activityDoc);
            
            // Send Telegram notification for start
            const message = `🔔 <b>Activity Started</b>\n👤 ${user.displayName}\n📝 ${activityType.charAt(0).toUpperCase() + activityType.slice(1)}\n⏰ ${now.toLocaleString()}`;
            await sendTelegramNotification(message);
        } else {
            // Find matching start activity and complete it
            // Simple query to get user's activities of this type
            const activitiesQuery = query(
                collection(db, "activities"),
                where("userId", "==", user.uid),
                where("activityType", "==", activityType)
            );

            const snapshot = await getDocs(activitiesQuery);
            
            console.log(`Found ${snapshot.docs.length} ${activityType} activities for user`);
            
            if (!snapshot.empty) {
                // Find the most recent activity without an endTime
                let startDoc = null;
                let mostRecentStart = null;
                
                for (const docSnapshot of snapshot.docs) {
                    const data = docSnapshot.data();
                    console.log(`Checking activity ${docSnapshot.id}:`, {
                        activityType: data.activityType,
                        hasEndTime: !!data.endTime,
                        startTime: data.startTime.toDate()
                    });
                    
                    if (!data.endTime) {
                        const startTime = data.startTime.toDate();
                        if (!mostRecentStart || startTime > mostRecentStart) {
                            startDoc = docSnapshot;
                            mostRecentStart = startTime;
                        }
                    }
                }
                
                if (startDoc) {
                    const startData = startDoc.data();
                    const startTime = startData.startTime.toDate();
                    const endTime = now;
                    
                    // Calculate duration
                    const duration = calculateDuration(startTime, endTime);
                    console.log(`Calculated duration: ${duration}`);
                    
                    // Update the document with end time and duration
                    await updateDoc(doc(db, "activities", startDoc.id), {
                        endTime: Timestamp.fromDate(endTime),
                        duration: duration
                    });
                    
                    console.log(`Updated activity ${startDoc.id} with endTime and duration`);
                    
                    // Send Telegram notification for completion
                    const message = `✅ <b>Activity Completed</b>\n👤 ${user.displayName}\n📝 ${activityType.charAt(0).toUpperCase() + activityType.slice(1)}\n⏰ <b>Duration:</b> ${duration}\n🕐 ${startTime.toLocaleString()} → ${endTime.toLocaleString()}`;
                    await sendTelegramNotification(message);
                } else {
                    console.error(`No active ${activityType} found to end`);
                    throw new Error(`No active ${activityType} found to end. Please start a ${activityType} first.`);
                }
            } else {
                console.error(`No ${activityType} activities found for this user`);
                throw new Error(`No ${activityType} activities found. Please start a ${activityType} first.`);
            }
        }

        updateUI();
    } catch (error) {
        console.error("Error logging activity:", error);
        
        // Provide more specific error messages
        if (error.message.includes('No active')) {
            alert(`Error: ${error.message}`);
        } else if (error.message.includes('No') && error.message.includes('activities found')) {
            alert(`Error: ${error.message}`);
        } else {
            alert('Failed to log activity. Please try again.');
        }
    }
}

// Legacy function for backward compatibility
async function logSimpleActivity(activity) {
    return logActivity(activity, true);
}

// Send Telegram notification
async function sendTelegramNotification(message) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        console.warn('Telegram bot not configured');
        return;
    }
    
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    try {
        const response = await fetch(url, {
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
        
        if (response.ok) {
            console.log('Telegram notification sent successfully');
        } else {
            console.error('Failed to send Telegram notification:', response.status);
        }
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

    // Show all team activities for today (not just current user)
    const activitiesQuery = query(
        collection(db, "activities"),
        where("startTime", ">=", Timestamp.fromDate(startOfDay)),
        orderBy("startTime", "desc")
    );

    try {
        console.log('Fetching activities for today...');
        const querySnapshot = await getDocs(activitiesQuery);
        console.log(`Found ${querySnapshot.docs.length} activities`);
        renderActivities(querySnapshot);
    } catch (error) {
        console.error("Error updating UI:", error);
        // Show error in the activity log
        const activityLog = document.getElementById('activityLog');
        if (activityLog) {
            activityLog.innerHTML = '<p class="text-danger text-center">Error loading activities. Please refresh the page.</p>';
        }
    }
}

// Enhanced activity rendering function
function renderActivities(snapshot) {
    const activityLog = document.getElementById('activityLog');
    if (!activityLog) return;
    
    activityLog.innerHTML = '';
    
    const activities = [];
    const pendingStarts = {};

    snapshot.docs.forEach(doc => {
        const data = doc.data();
        const activity = {
            id: doc.id,
            ...data,
            startTime: data.startTime.toDate(),
            endTime: data.endTime ? data.endTime.toDate() : null
        };
        activities.push(activity);
    });

    // Sort activities by start time (latest first)
    activities.sort((a, b) => b.startTime - a.startTime);

    activities.forEach(activity => {
        const activityDiv = document.createElement('div');
        activityDiv.className = 'mb-3 p-3 border rounded';
        
        const startTimeStr = activity.startTime.toLocaleString();
        const endTimeStr = activity.endTime ? activity.endTime.toLocaleString() : 'In Progress';
        
        if (activity.endTime && activity.duration) {
            // Completed activity with duration
            activityDiv.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${activity.activityType}</strong>
                        <span class="badge bg-success ms-2">${activity.duration}</span>
                    </div>
                    <small class="text-muted">${activity.userName}</small>
                </div>
                <div class="mt-1">
                    <small class="text-muted">
                        ${startTimeStr} → ${endTimeStr}
                    </small>
                </div>
            `;
            activityDiv.classList.add('border-success');
        } else {
            // In-progress activity
            activityDiv.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${activity.activityType}</strong>
                        <span class="badge bg-warning ms-2">In Progress</span>
                    </div>
                    <small class="text-muted">${activity.userName}</small>
                </div>
                <div class="mt-1">
                    <small class="text-muted">Started: ${startTimeStr}</small>
                </div>
            `;
            activityDiv.classList.add('border-warning');
        }
        
        activityLog.appendChild(activityDiv);
    });

    // Show message if no activities
    if (activities.length === 0) {
        activityLog.innerHTML = '<p class="text-muted text-center">No activities logged today.</p>';
    }
}

// Make functions globally available for HTML event handlers
window.signInWithGoogle = signInWithGoogle; // Updated global assignment
window.logActivity = logActivity;

// Temporary test function for debugging auth
window.testAuth = () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    signInWithPopup(auth, provider)
        .then(res => console.log("Success:", res.user.uid))
        .catch(err => console.error("Auth Error:", err.code, err.message));
};

// Error capture for unhandled rejections
window.addEventListener('unhandledrejection', event => {
    console.error("Auth Promise Rejection:", event.reason);
});

// Set device language for Firebase Auth
auth.useDeviceLanguage();

// Event listeners for buttons - these need to be adapted as per the new HTML structure
// The old event listeners might not work directly with the new HTML.
// We'll rely on the onAuthStateChanged to show/hide sections and inline onclick for signInWithGoogle.
// The activity logging buttons (Login, Logout, Break Start/End) will call logActivity.

// Example of how to attach event listeners if needed for the new buttons:
document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) loginBtn.addEventListener('click', () => logActivity('login', true));

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout); // Use logout function instead
    
    const lunchStartBtn = document.getElementById('lunchStartBtn');
    if (lunchStartBtn) lunchStartBtn.addEventListener('click', () => logActivity('lunch', true));

    const lunchEndBtn = document.getElementById('lunchEndBtn');
    if (lunchEndBtn) lunchEndBtn.addEventListener('click', () => logActivity('lunch', false));

    const shortBreakStartBtn = document.getElementById('shortBreakStartBtn');
    if (shortBreakStartBtn) shortBreakStartBtn.addEventListener('click', () => logActivity('break', true));
    
    const shortBreakEndBtn = document.getElementById('shortBreakEndBtn');
    if (shortBreakEndBtn) shortBreakEndBtn.addEventListener('click', () => logActivity('break', false));
});