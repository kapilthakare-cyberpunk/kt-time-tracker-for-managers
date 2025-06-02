import { auth, db } from './firebase-config.js';
import {
    collection, addDoc, query, where,
    orderBy, getDocs, Timestamp, updateDoc, doc, limit
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";
import {
    signInWithPopup, signOut,
    GoogleAuthProvider, RecaptchaVerifier // Changed from GithubAuthProvider
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { calculateDuration } from './utils/duration.js';

// Telegram bot configuration
const TELEGRAM_BOT_TOKEN = '7701499260:AAEUM83mvCEvcXVsxwjX9R6iV03Lv0evUDI';
const TELEGRAM_CHANNEL_ID = '-1002679175910'; // Team Daily: Sales & Reg channel


// Email to name mapping for team members
const EMAIL_TO_NAME_MAPPING = {
    'samiirshaiikh24@gmail.com': 'Samiir Shaikh',
    'omprakashprasad8087@gmail.com': 'Prakash Prasad', 
    'sujata9293.vv@gmail.com': 'Sujata Virkar',
    'shiwanigade31@gmail.com': 'Shiwani Gade',
    'shiwani.gade@primesandzooms.com': 'Shiwani Gade',
    'rupaliyawatkar@gmail.com': 'Rupali Yawatkar',
    'diptipawar02003@gmail.com': 'Dipti Pawar',
    'kapilsthakare@gmail.com': 'Kapil Thakare',
    'kapil.thakare@primesandzooms.com': 'Kapil Thakare'
};

// Admin users who can see all activities
const ADMIN_EMAILS = ['kapilsthakare@gmail.com', 'kapil.thakare@primesandzooms.com'];

// Unified authentication UI update function
function updateAuthUI(user) {
    // If no Firebase user, check for temp user
    if (!user) {
        const tempUserData = sessionStorage.getItem('tempUser');
        if (tempUserData) {
            user = JSON.parse(tempUserData);
        }
    }
    const loginSection = document.getElementById('loginSection');
    const timeTrackerSection = document.getElementById('timeTrackerSection');
    if (!loginSection || !timeTrackerSection) {
        console.error('Required DOM elements not found');
        return;
    }
    // Remove any existing temp user indicator
    const existingIndicator = document.getElementById('tempUserIndicator');
    if (existingIndicator) existingIndicator.remove();
    if (user) {
        loginSection.style.display = 'none';
        timeTrackerSection.style.display = 'block';
        // If temp user, show indicator
        if (user.isTemporary) {
            const tempIndicator = document.createElement('div');
            tempIndicator.id = 'tempUserIndicator';
            tempIndicator.className = 'alert alert-info d-flex align-items-center mt-2 mb-3';
            tempIndicator.innerHTML = `
                <i class="fas fa-user-clock me-2"></i>
                <div>
                    <strong>Quick Access Mode</strong><br>
                    <small>Temporary session for ${user.displayName}. Data stored locally.</small>
                </div>
                <button onclick="endTempSession()" class="btn btn-sm btn-outline-danger ms-auto">
                    <i class="fas fa-sign-out-alt"></i> End Session
                </button>
            `;
            timeTrackerSection.insertBefore(tempIndicator, timeTrackerSection.firstChild);
        }
        updateUI();
    } else {
        loginSection.style.display = 'block';
        timeTrackerSection.style.display = 'none';
    }
}

// Authentication state observer
// Only call updateAuthUI, do not redefine it
auth.onAuthStateChanged((user) => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => updateAuthUI(user));
    } else {
        updateAuthUI(user);
    }
});

// Google Authentication
async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        // Check if user email is in our team mapping
        const userDisplayName = EMAIL_TO_NAME_MAPPING[user.email];
        
        if (!userDisplayName) {
            await auth.signOut();
            alert(`Access denied. Only team members can log in. Your email: ${user.email}`);
            return;
        }
        
        console.log(`Welcome ${userDisplayName} (${user.email})`);
    } catch (error) {
        console.error("Error during Google sign-in:", error);
        alert('Failed to sign in with Google');
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
        const user = getCurrentUser(); // Use enhanced function to get current user
        if (!user) {
            alert('Please sign in first');
            return;
        }

        const now = new Date();
        
        if (isStart) {
            // Create start activity
            const userName = user.isTemporary ? user.displayName : (EMAIL_TO_NAME_MAPPING[user.email] || user.displayName);
            const activityDoc = {
                startTime: Timestamp.fromDate(now),
                activityType: activityType,
                userId: user.uid,
                userName: userName
            };

            // Only save to Firestore for authenticated users
            if (!user.isTemporary) {
                await addDoc(collection(db, "activities"), activityDoc);
            } else {
                // For temporary users, store in sessionStorage
                const tempActivities = JSON.parse(sessionStorage.getItem('tempActivities') || '[]');
                tempActivities.push({
                    ...activityDoc,
                    id: `temp_${Date.now()}`,
                    startTime: now // Store as Date object for temp activities
                });
                sessionStorage.setItem('tempActivities', JSON.stringify(tempActivities));
            }
            
            // Send Telegram notification for start
            const message = `🔔 <b>Activity Started</b>\n👤 ${userName}\n📝 ${activityType.charAt(0).toUpperCase() + activityType.slice(1)}\n⏰ ${now.toLocaleString()}`;
            await sendTelegramNotification(message);
        } else {
            // Find matching start activity and complete it
            if (user.isTemporary) {
                // Handle temporary user activities
                const tempActivities = JSON.parse(sessionStorage.getItem('tempActivities') || '[]');
                const userName = user.displayName;
                
                // Find the most recent uncompleted activity of this type
                let startActivityIndex = -1;
                let startActivity = null;
                
                for (let i = tempActivities.length - 1; i >= 0; i--) {
                    const activity = tempActivities[i];
                    if (activity.activityType === activityType && activity.userId === user.uid && !activity.endTime) {
                        startActivityIndex = i;
                        startActivity = activity;
                        break;
                    }
                }
                
                if (startActivity) {
                    const startTime = new Date(startActivity.startTime);
                    const endTime = now;
                    const duration = calculateDuration(startTime, endTime);
                    
                    // Update the activity
                    tempActivities[startActivityIndex] = {
                        ...startActivity,
                        endTime: endTime,
                        duration: duration
                    };
                    
                    sessionStorage.setItem('tempActivities', JSON.stringify(tempActivities));
                    
                    // Send Telegram notification for completion
                    const message = `✅ <b>Activity Completed</b>\n👤 ${userName}\n📝 ${activityType.charAt(0).toUpperCase() + activityType.slice(1)}\n⏰ <b>Duration:</b> ${duration}\n🕐 ${startTime.toLocaleString()} → ${endTime.toLocaleString()}`;
                    await sendTelegramNotification(message);
                } else {
                    throw new Error(`No active ${activityType} found to end. Please start a ${activityType} first.`);
                }
            } else {
                // Handle authenticated user activities (existing Firestore logic)
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
                    const userName = EMAIL_TO_NAME_MAPPING[user.email] || user.displayName;
                    const message = `✅ <b>Activity Completed</b>\n👤 ${userName}\n📝 ${activityType.charAt(0).toUpperCase() + activityType.slice(1)}\n⏰ <b>Duration:</b> ${duration}\n🕐 ${startTime.toLocaleString()} → ${endTime.toLocaleString()}`;
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

// Send Telegram notification to both private and group chats
async function sendTelegramNotification(message) {
    if (!TELEGRAM_BOT_TOKEN) {
        console.warn('Telegram bot not configured');
        return;
    }
    
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    // Send only to the new channel ID
    const chatId = TELEGRAM_CHANNEL_ID;

    if (chatId) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: message,
                    parse_mode: 'HTML'
                })
            });
            
            if (response.ok) {
                console.log(`Telegram notification sent successfully to channel ${chatId}`);
            } else {
                console.error(`Failed to send Telegram notification to channel ${chatId}:`, response.status);
            }
        } catch (error) {
            console.error(`Error sending Telegram notification to channel ${chatId}:`, error);
        }
    } else {
        console.warn('Telegram channel ID not configured.');
    }
}

// Update UI with today's activities (with privacy controls)
async function updateUI() {
    const user = getCurrentUser(); // Use enhanced function to get current user
    if (!user) return;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    if (user.isTemporary) {
        // Handle temporary user - load from sessionStorage
        const tempActivities = JSON.parse(sessionStorage.getItem('tempActivities') || '[]');
        
        // Filter activities for today
        const todayActivities = tempActivities.filter(activity => {
            const activityDate = new Date(activity.startTime);
            return activityDate >= startOfDay && activity.userId === user.uid;
        });
        
        // Create a mock snapshot-like object for renderActivities
        const mockSnapshot = {
            docs: todayActivities.map(activity => ({
                id: activity.id,
                data: () => ({
                    ...activity,
                    startTime: { toDate: () => new Date(activity.startTime) },
                    endTime: activity.endTime ? { toDate: () => new Date(activity.endTime) } : null
                })
            }))
        };
        
        console.log(`Found ${todayActivities.length} temporary activities`);
        renderActivities(mockSnapshot, false);
        return;
    }

    // Check if user is admin
    const isAdmin = ADMIN_EMAILS.includes(user.email);
    
    let activitiesQuery;
    if (isAdmin) {
        // Admin can see all team activities for today
        activitiesQuery = query(
            collection(db, "activities"),
            where("startTime", ">=", Timestamp.fromDate(startOfDay)),
            orderBy("startTime", "desc")
        );
    } else {
        // Regular users can only see their own activities
        activitiesQuery = query(
            collection(db, "activities"),
            where("userId", "==", user.uid),
            where("startTime", ">=", Timestamp.fromDate(startOfDay)),
            orderBy("startTime", "desc")
        );
    }

    try {
        console.log('Fetching activities for today...');
        const querySnapshot = await getDocs(activitiesQuery);
        console.log(`Found ${querySnapshot.docs.length} activities`);
        renderActivities(querySnapshot, isAdmin);
        
        // Update employee status table (only for admin users)
        if (isAdmin) {
            await updateEmployeeStatusTable();
        }
    } catch (error) {
        console.error("Error updating UI:", error);
        // Show error in the activity log
        const activityLog = document.getElementById('activityLog');
        if (activityLog) {
            activityLog.innerHTML = '<p class="text-danger text-center">Error loading activities. Please refresh the page.</p>';
        }
    }
}

// Enhanced activity rendering function with privacy controls
function renderActivities(snapshot, isAdmin = false) {
    const activityLog = document.getElementById('activityLog');
    if (!activityLog) return;
    
    // Add header to show what data is being displayed
    const headerText = isAdmin ? "All Team Activities (Admin View)" : "Your Activities";
    
    activityLog.innerHTML = `<h6 class="mb-3 text-muted"><i class="fas fa-eye"></i> ${headerText}</h6>`;
    
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
        const noActivityDiv = document.createElement('p');
        noActivityDiv.className = 'text-muted text-center mt-3';
        noActivityDiv.textContent = 'No activities logged today.';
        activityLog.appendChild(noActivityDiv);
    }
}

// Update Employee Status Table (Admin only)
async function updateEmployeeStatusTable() {
    const statusTable = document.getElementById('statusTable');
    if (!statusTable) return;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    try {
        // Get all activities for today
        const activitiesQuery = query(
            collection(db, "activities"),
            where("startTime", ">=", Timestamp.fromDate(startOfDay)),
            orderBy("startTime", "desc")
        );

        const querySnapshot = await getDocs(activitiesQuery);
        const employeeStatus = {};

        // Initialize all employees (excluding managers/admins)
        Object.entries(EMAIL_TO_NAME_MAPPING).forEach(([email, name]) => {
            // Skip admin/manager users from employee status tracking
            if (!ADMIN_EMAILS.includes(email)) {
                employeeStatus[name] = {
                    status: 'Not Logged In',
                    lastActivity: 'No activity today',
                    totalWorkTime: 0,
                    totalBreakTime: 0,
                    isLoggedIn: false,
                    statusClass: 'text-danger'
                };
            }
        });

        // Process activities
        querySnapshot.docs.forEach(doc => {
            const data = doc.data();
            const activity = {
                ...data,
                startTime: data.startTime.toDate(),
                endTime: data.endTime ? data.endTime.toDate() : null
            };

            const userName = activity.userName;
            if (!employeeStatus[userName]) return;

            const lastActivityTime = activity.startTime.toLocaleTimeString();

            // Determine current status based on most recent activity
            if (!activity.endTime) {
                // Activity is in progress
                if (activity.activityType === 'login') {
                    employeeStatus[userName].status = 'Working';
                    employeeStatus[userName].isLoggedIn = true;
                    employeeStatus[userName].statusClass = 'text-success';
                } else if (activity.activityType === 'lunch') {
                    employeeStatus[userName].status = 'On Lunch Break';
                    employeeStatus[userName].statusClass = 'text-warning';
                } else if (activity.activityType === 'break') {
                    employeeStatus[userName].status = 'On Short Break';
                    employeeStatus[userName].statusClass = 'text-info';
                }
                employeeStatus[userName].lastActivity = `${activity.activityType} started at ${lastActivityTime}`;
            } else {
                // Completed activity
                employeeStatus[userName].lastActivity = `${activity.activityType} ended at ${activity.endTime.toLocaleTimeString()}`;
                
                // Calculate durations
                if (activity.duration) {
                    const durationMs = calculateDurationInMs(activity.startTime, activity.endTime);
                    if (activity.activityType === 'login') {
                        employeeStatus[userName].totalWorkTime += durationMs;
                    } else if (activity.activityType === 'lunch' || activity.activityType === 'break') {
                        employeeStatus[userName].totalBreakTime += durationMs;
                    }
                }

                // If this is the most recent completed activity, update status
                if (activity.activityType === 'login') {
                    employeeStatus[userName].status = 'Logged Out';
                    employeeStatus[userName].statusClass = 'text-secondary';
                }
            }
        });

        // Render the table
        statusTable.innerHTML = '';
        Object.entries(employeeStatus).forEach(([name, status]) => {
            const row = document.createElement('tr');
            row.className = status.isLoggedIn ? 'table-success' : '';
            
            const workTimeStr = formatDuration(status.totalWorkTime);
            const breakTimeStr = formatDuration(status.totalBreakTime);
            
            row.innerHTML = `
                <td><strong>${name}</strong></td>
                <td><span class="${status.statusClass}">${status.status}</span></td>
                <td>${status.lastActivity}</td>
                <td><small>Work: ${workTimeStr}<br>Break: ${breakTimeStr}</small></td>
            `;
            
            statusTable.appendChild(row);
        });

    } catch (error) {
        console.error("Error updating employee status table:", error);
        statusTable.innerHTML = '<tr><td colspan="4" class="text-danger text-center">Error loading employee status</td></tr>';
    }
}

// Helper function to calculate duration in milliseconds
function calculateDurationInMs(startTime, endTime) {
    return endTime.getTime() - startTime.getTime();
}

// Helper function to format duration from milliseconds
function formatDuration(durationMs) {
    if (durationMs === 0) return '0m';
    
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
}

// Make functions globally available for HTML event handlers
window.signInWithGoogle = signInWithGoogle; // Updated global assignment
window.logActivity = logActivity;

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

// Phone Authentication for quick access
const TEMP_ACCESS_PASSCODE = '123456'; // 6-digit passcode for temporary access
const TEMP_ACCESS_PHONE_NUMBERS = [
    '+919503275757', // Add valid phone numbers here
    '9503275757',
    '919503275757',
    '+91 9503275757'
];

// Initialize invisible reCAPTCHA for phone login
function setupRecaptcha() {
    if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier('phoneLoginBtn', {
            'size': 'invisible',
            'callback': (response) => {
                // reCAPTCHA solved, allow signInWithPhone
                doPhoneLogin();
            }
        }, auth);
        window.recaptchaVerifier.render();
    }
}

document.addEventListener('DOMContentLoaded', setupRecaptcha);

// Refactor signInWithPhone to use reCAPTCHA
async function signInWithPhone() {
    if (window.recaptchaVerifier) {
        window.recaptchaVerifier.verify().then(() => {
            // doPhoneLogin will be called by the callback
        });
    } else {
        // Fallback if reCAPTCHA not ready
        doPhoneLogin();
    }
}

function doPhoneLogin() {
    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    const passcode = document.getElementById('passcode').value.trim();
    
    // Validate inputs
    if (!phoneNumber) {
        alert('Please enter a phone number');
        return;
    }
    
    if (!passcode) {
        alert('Please enter the 6-digit passcode');
        return;
    }
    
    if (passcode.length !== 6 || !/^\d{6}$/.test(passcode)) {
        alert('Passcode must be exactly 6 digits');
        return;
    }
    
    // Check if passcode is correct
    if (passcode !== TEMP_ACCESS_PASSCODE) {
        alert('Invalid passcode. Please try again.');
        return;
    }
    
    // Normalize phone number for comparison
    const normalizedPhone = phoneNumber.replace(/\D/g, ''); // Remove non-digits
    const isValidPhone = TEMP_ACCESS_PHONE_NUMBERS.some(validNumber => {
        const normalizedValid = validNumber.replace(/\D/g, '');
        return normalizedValid === normalizedPhone || 
               normalizedValid.endsWith(normalizedPhone) || 
               normalizedPhone.endsWith(normalizedValid);
    });
    
    if (!isValidPhone) {
        alert('Phone number not authorized for quick access');
        return;
    }
    
    // Create a temporary user session
    const tempUser = {
        uid: `temp_${normalizedPhone}`,
        email: `temp_${normalizedPhone}@phone.access`,
        displayName: `Quick Access User (${phoneNumber})`,
        phoneNumber: phoneNumber,
        isTemporary: true
    };
    
    // Store temp user in sessionStorage
    sessionStorage.setItem('tempUser', JSON.stringify(tempUser));
    // Update UI for temp user
    updateAuthUI(tempUser);
    
    console.log(`Quick access granted for phone: ${phoneNumber}`);
    alert(`Welcome! Quick access granted for ${phoneNumber}`);
}

// Function to end temporary session
function endTempSession() {
    sessionStorage.removeItem('tempUser');
    updateAuthUI(null);
    
    // Clear form
    const phoneInput = document.getElementById('phoneNumber');
    const passcodeInput = document.getElementById('passcode');
    if (phoneInput) phoneInput.value = '';
    if (passcodeInput) passcodeInput.value = '';
    
    alert('Quick access session ended');
}

// Enhanced getCurrentUser function to handle temp users
function getCurrentUser() {
    // First check Firebase auth
    const firebaseUser = auth.currentUser;
    if (firebaseUser) return firebaseUser;
    
    // Then check for temp user
    const tempUserData = sessionStorage.getItem('tempUser');
    if (tempUserData) {
        return JSON.parse(tempUserData);
    }
    
    return null;
}

// Make functions globally available
window.signInWithPhone = signInWithPhone;
window.endTempSession = endTempSession;