/**
 * Fallback Authentication for environments where Firebase SDK is blocked
 * This provides phone-based authentication without relying on Firebase
 */

// Phone Authentication Configuration
const TEMP_ACCESS_PASSCODE = '123456';
const TEMP_ACCESS_PHONE_NUMBERS = [
    '+919503275757',
    '9503275757', 
    '919503275757',
    '+91 9503275757'
];

// Team member email to name mapping
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

/**
 * Fallback Google Sign-in (shows helpful message)
 */
function signInWithGoogle() {
    console.log('signInWithGoogle called');
    alert('Google Sign-in is currently unavailable due to network restrictions. Please use the Quick Access option below with your phone number and passcode.');
}

/**
 * Phone-based authentication (works without Firebase)
 */
function signInWithPhone() {
    console.log('signInWithPhone called');
    doPhoneLogin();
}

function doPhoneLogin() {
    const phoneNumber = document.getElementById('phoneNumber')?.value.trim();
    const passcode = document.getElementById('passcode')?.value.trim();
    
    console.log('doPhoneLogin called with:', phoneNumber, passcode);
    
    // Input validation
    if (!phoneNumber) {
        alert('Please enter a phone number');
        return;
    }
    
    if (!passcode || passcode.length !== 6 || !/^\d{6}$/.test(passcode)) {
        alert('Please enter a valid 6-digit passcode');
        return;
    }
    
    // Passcode validation
    if (passcode !== TEMP_ACCESS_PASSCODE) {
        alert('Invalid passcode. Please try again.');
        return;
    }
    
    // Phone number validation
    const normalizedPhone = phoneNumber.replace(/\D/g, '');
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
    
    // Create temporary user session
    const tempUser = {
        uid: `temp_${normalizedPhone}`,
        email: `temp_${normalizedPhone}@phone.access`,
        displayName: `Quick Access User (${phoneNumber})`,
        phoneNumber: phoneNumber,
        isTemporary: true
    };
    
    // Store in sessionStorage
    sessionStorage.setItem('tempUser', JSON.stringify(tempUser));
    
    // Update UI to show authenticated state
    updateAuthUI(tempUser);
    
    console.log(`Quick access granted for phone: ${phoneNumber}`);
    alert(`Welcome! Quick access granted for ${phoneNumber}`);
}

/**
 * Update authentication UI
 */
function updateAuthUI(user) {
    console.log('updateAuthUI called with user:', user);
    
    const loginSection = document.getElementById('loginSection');
    const timeTrackerSection = document.getElementById('timeTrackerSection');
    
    if (!loginSection || !timeTrackerSection) {
        console.error('Required DOM elements not found');
        return;
    }
    
    // Remove existing temp user indicator
    const existingIndicator = document.getElementById('tempUserIndicator');
    if (existingIndicator) existingIndicator.remove();
    
    if (user) {
        loginSection.style.display = 'none';
        timeTrackerSection.style.display = 'block';
        
        // Show temp user indicator if applicable
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
    } else {
        loginSection.style.display = 'block';
        timeTrackerSection.style.display = 'none';
    }
}

/**
 * End temporary session
 */
function endTempSession() {
    // Clear temporary data
    sessionStorage.removeItem('tempUser');
    sessionStorage.removeItem('tempActivities');
    
    // Reset form
    const phoneInput = document.getElementById('phoneNumber');
    const passcodeInput = document.getElementById('passcode');
    if (phoneInput) phoneInput.value = '';
    if (passcodeInput) passcodeInput.value = '';
    
    updateAuthUI(null);
    alert('Quick access session ended');
}

/**
 * Get current user (check sessionStorage for temp user)
 */
function getCurrentUser() {
    const tempUserData = sessionStorage.getItem('tempUser');
    return tempUserData ? JSON.parse(tempUserData) : null;
}

/**
 * Mock logout function
 */
function logout() {
    const user = getCurrentUser();
    if (user && user.isTemporary) {
        endTempSession();
    } else {
        alert('No user currently signed in');
    }
}

/**
 * Initialize the fallback authentication
 */
function initializeFallbackAuth() {
    console.log('Initializing fallback authentication...');
    
    // Check if user is already logged in
    const currentUser = getCurrentUser();
    if (currentUser) {
        updateAuthUI(currentUser);
    }
    
    // Make functions globally available
    window.signInWithGoogle = signInWithGoogle;
    window.signInWithPhone = signInWithPhone;
    window.endTempSession = endTempSession;
    window.logout = logout;
    window.getCurrentUser = getCurrentUser;
    
    console.log('Fallback authentication initialized');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFallbackAuth);
} else {
    initializeFallbackAuth();
}