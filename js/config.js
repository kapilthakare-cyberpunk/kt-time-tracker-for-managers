/**
 * Configuration Module - Centralized Settings
 * Contains all configuration constants and mappings
 */

// Team member email to name mapping
export const EMAIL_TO_NAME_MAPPING = {
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
export const ADMIN_EMAILS = [
    'kapilsthakare@gmail.com', 
    'kapil.thakare@primesandzooms.com'
];

// Telegram bot configuration
export const TELEGRAM_CONFIG = {
    BOT_TOKEN: '7701499260:AAEUM83mvCEvcXVsxwjX9R6iV03Lv0evUDI',
    CHANNEL_ID: '-1002679175910' // Team Daily: Sales & Reg channel
};

// Valid activity types
export const ACTIVITY_TYPES = {
    LOGIN: 'login',
    LUNCH: 'lunch',
    BREAK: 'break'
};

// UI Configuration
export const UI_CONFIG = {
    DEBOUNCE_DELAY: 50,
    MAX_ACTIVITY_LOG_HEIGHT: 400,
    ANIMATION_DURATION: 300,
    SCROLL_THRESHOLD: 100
};

// Performance thresholds
export const PERFORMANCE_CONFIG = {
    MAX_ACTIVITIES_PER_LOAD: 50,
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
    QUERY_TIMEOUT: 10000, // 10 seconds
    RETRY_ATTEMPTS: 3
};

// Storage keys
export const STORAGE_KEYS = {
    TEMP_USER: 'tempUser',
    TEMP_ACTIVITIES: 'tempActivities',
    CACHE_PREFIX: 'tt_cache_',
    SETTINGS: 'userSettings'
};

// Date/Time formatting options
export const DATE_FORMAT_OPTIONS = {
    FULL: {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    },
    TIME_ONLY: {
        hour: '2-digit',
        minute: '2-digit'
    },
    DATE_ONLY: {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }
};

// Error messages
export const ERROR_MESSAGES = {
    AUTH_FAILED: 'Authentication failed. Please try again.',
    NO_PERMISSION: 'You do not have permission to perform this action.',
    NETWORK_ERROR: 'Network error. Please check your connection.',
    INVALID_DATA: 'Invalid data format.',
    SESSION_EXPIRED: 'Your session has expired. Please log in again.',
    ACTIVITY_NOT_FOUND: 'No active activity found to end.',
    FIREBASE_ERROR: 'Database error. Please try again later.'
};

// Success messages
export const SUCCESS_MESSAGES = {
    ACTIVITY_STARTED: 'Activity started successfully',
    ACTIVITY_COMPLETED: 'Activity completed successfully',
    LOGIN_SUCCESS: 'Logged in successfully',
    LOGOUT_SUCCESS: 'Logged out successfully'
};

// Check if user is admin
export function isAdmin(email) {
    return ADMIN_EMAILS.includes(email);
}

// Get user display name
export function getUserDisplayName(email) {
    return EMAIL_TO_NAME_MAPPING[email] || email;
}

// Validate activity type
export function isValidActivityType(activityType) {
    return Object.values(ACTIVITY_TYPES).includes(activityType);
}