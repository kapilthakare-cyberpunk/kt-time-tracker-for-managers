/**
 * Authentication Module - Optimized for Performance
 * Handles Google authentication and phone-based quick access
 */

import { auth } from '../firebase-config.js';
import { signInWithPopup, signOut, GoogleAuthProvider, RecaptchaVerifier } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { EMAIL_TO_NAME_MAPPING, ADMIN_EMAILS } from './config.js';

// Phone Authentication Configuration
const TEMP_ACCESS_PASSCODE = '123456';
const TEMP_ACCESS_PHONE_NUMBERS = [
    '+919503275757',
    '9503275757', 
    '919503275757',
    '+91 9503275757'
];

/**
 * Enhanced getCurrentUser function supporting both Firebase and temporary users
 * @returns {Object|null} Current user object or null
 */
export function getCurrentUser() {
    // Check Firebase auth first (most common case)
    const firebaseUser = auth.currentUser;
    if (firebaseUser) return firebaseUser;
    
    // Check for temporary user
    const tempUserData = sessionStorage.getItem('tempUser');
    return tempUserData ? JSON.parse(tempUserData) : null;
}

/**
 * Unified authentication UI update with debouncing
 * @param {Object|null} user - User object
 */
let updateUITimeout = null;
export function updateAuthUI(user) {
    // Debounce UI updates for better performance
    if (updateUITimeout) {
        clearTimeout(updateUITimeout);
    }
    
    updateUITimeout = setTimeout(() => {
        performAuthUIUpdate(user);
    }, 50);
}

function performAuthUIUpdate(user) {
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
        
        // Trigger UI update
        window.updateUI?.();
    } else {
        loginSection.style.display = 'block';
        timeTrackerSection.style.display = 'none';
    }
}

/**
 * Google Authentication with error handling
 */
export async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        // Validate user email against team mapping
        const userDisplayName = EMAIL_TO_NAME_MAPPING[user.email];
        
        if (!userDisplayName) {
            await auth.signOut();
            throw new Error(`Access denied. Only team members can log in. Your email: ${user.email}`);
        }
        
        console.log(`Welcome ${userDisplayName} (${user.email})`);
        return user;
    } catch (error) {
        console.error("Google sign-in error:", error);
        alert(error.message || 'Failed to sign in with Google');
        throw error;
    }
}

/**
 * Enhanced logout function with proper cleanup
 */
export async function logout() {
    try {
        const user = auth.currentUser;
        if (user) {
            console.log('Starting logout process for user:', user.displayName);
            
            // Log logout activity if logActivity is available
            if (window.logActivity) {
                await window.logActivity('login', false);
            }
            
            // Sign out from Firebase
            await signOut(auth);
            console.log('User logged out successfully');
            alert('Logged out successfully!');
        } else {
            console.log('No user currently signed in');
            alert('No user currently signed in');
        }
    } catch (error) {
        console.error('Logout error:', error);
        alert(`Failed to logout: ${error.message}`);
        throw error;
    }
}

/**
 * Initialize reCAPTCHA for phone authentication
 */
export function setupRecaptcha() {
    if (!window.recaptchaVerifier) {
        try {
            window.recaptchaVerifier = new RecaptchaVerifier('phoneLoginBtn', {
                'size': 'invisible',
                'callback': () => doPhoneLogin()
            }, auth);
            window.recaptchaVerifier.render();
        } catch (error) {
            console.error('reCAPTCHA setup error:', error);
        }
    }
}

/**
 * Phone-based quick access authentication
 */
export async function signInWithPhone() {
    if (window.recaptchaVerifier) {
        try {
            await window.recaptchaVerifier.verify();
        } catch (error) {
            console.error('reCAPTCHA verification error:', error);
            doPhoneLogin(); // Fallback
        }
    } else {
        doPhoneLogin();
    }
}

function doPhoneLogin() {
    const phoneNumber = document.getElementById('phoneNumber')?.value.trim();
    const passcode = document.getElementById('passcode')?.value.trim();
    
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
    updateAuthUI(tempUser);
    
    console.log(`Quick access granted for phone: ${phoneNumber}`);
    alert(`Welcome! Quick access granted for ${phoneNumber}`);
}

/**
 * End temporary session with cleanup
 */
export function endTempSession() {
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
 * Authentication state observer with optimized handling
 */
export function initializeAuth() {
    auth.onAuthStateChanged((user) => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => updateAuthUI(user));
        } else {
            updateAuthUI(user);
        }
    });
    
    // Set device language for Firebase Auth
    auth.useDeviceLanguage();
    
    // Setup global error handling
    window.addEventListener('unhandledrejection', event => {
        console.error("Auth Promise Rejection:", event.reason);
    });
}

// Make functions globally available for HTML event handlers
window.signInWithGoogle = signInWithGoogle;
window.logout = logout;
window.signInWithPhone = signInWithPhone;
window.endTempSession = endTempSession;