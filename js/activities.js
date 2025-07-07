/**
 * Activities Module - Optimized Activity Management
 * Handles activity logging, querying, and UI updates with performance optimizations
 */

import { db } from '../firebase-config.js';
import { 
    collection, addDoc, query, where, orderBy, getDocs, 
    Timestamp, updateDoc, doc, limit 
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";
import { calculateDuration } from '../utils/duration.js';
import { getCurrentUser } from './auth.js';
import { 
    EMAIL_TO_NAME_MAPPING, ADMIN_EMAILS, TELEGRAM_CONFIG, 
    ACTIVITY_TYPES, PERFORMANCE_CONFIG, STORAGE_KEYS 
} from './config.js';

// Activity cache for performance
const activityCache = new Map();
let lastCacheUpdate = 0;

/**
 * Log activity with optimized error handling and performance
 * @param {string} activityType - Type of activity (login, lunch, break)
 * @param {boolean} isStart - Whether this is a start or end action
 */
export async function logActivity(activityType, isStart = true) {
    try {
        const user = getCurrentUser();
        if (!user) {
            alert('Please sign in first');
            return;
        }

        const now = new Date();
        
        if (isStart) {
            await handleActivityStart(user, activityType, now);
        } else {
            await handleActivityEnd(user, activityType, now);
        }

        // Update UI with debouncing
        debounceUIUpdate();
    } catch (error) {
        console.error("Error logging activity:", error);
        handleActivityError(error, activityType, isStart);
    }
}

/**
 * Handle activity start with optimized data structure
 */
async function handleActivityStart(user, activityType, timestamp) {
    const userName = user.isTemporary ? 
        user.displayName : 
        (EMAIL_TO_NAME_MAPPING[user.email] || user.displayName);
    
    const activityDoc = {
        startTime: user.isTemporary ? timestamp : Timestamp.fromDate(timestamp),
        activityType: activityType,
        userId: user.uid,
        userName: userName
    };

    if (user.isTemporary) {
        // Handle temporary user - use sessionStorage
        const tempActivities = JSON.parse(sessionStorage.getItem(STORAGE_KEYS.TEMP_ACTIVITIES) || '[]');
        tempActivities.push({
            ...activityDoc,
            id: `temp_${Date.now()}`,
            startTime: timestamp // Store as Date for temp activities
        });
        sessionStorage.setItem(STORAGE_KEYS.TEMP_ACTIVITIES, JSON.stringify(tempActivities));
    } else {
        // Handle authenticated user - use Firestore
        await addDoc(collection(db, "activities"), activityDoc);
    }
    
    // Send optimized Telegram notification
    await sendOptimizedTelegramNotification(
        `🔔 <b>Activity Started</b>\n👤 ${userName}\n📝 ${capitalize(activityType)}\n⏰ ${timestamp.toLocaleString()}`,
        false // Not high priority
    );
}

/**
 * Handle activity end with optimized query
 */
async function handleActivityEnd(user, activityType, endTime) {
    if (user.isTemporary) {
        await handleTempActivityEnd(user, activityType, endTime);
    } else {
        await handleFirestoreActivityEnd(user, activityType, endTime);
    }
}

/**
 * Handle temporary user activity completion
 */
async function handleTempActivityEnd(user, activityType, endTime) {
    const tempActivities = JSON.parse(sessionStorage.getItem(STORAGE_KEYS.TEMP_ACTIVITIES) || '[]');
    
    // Find the most recent uncompleted activity of this type
    let startActivityIndex = -1;
    let startActivity = null;
    
    for (let i = tempActivities.length - 1; i >= 0; i--) {
        const activity = tempActivities[i];
        if (activity.activityType === activityType && 
            activity.userId === user.uid && 
            !activity.endTime) {
            startActivityIndex = i;
            startActivity = activity;
            break;
        }
    }
    
    if (!startActivity) {
        throw new Error(`No active ${activityType} found to end. Please start a ${activityType} first.`);
    }
    
    const startTime = new Date(startActivity.startTime);
    const duration = calculateDuration(startTime, endTime);
    
    // Update the activity
    tempActivities[startActivityIndex] = {
        ...startActivity,
        endTime: endTime,
        duration: duration
    };
    
    sessionStorage.setItem(STORAGE_KEYS.TEMP_ACTIVITIES, JSON.stringify(tempActivities));
    
    // Send completion notification
    await sendOptimizedTelegramNotification(
        `✅ <b>Activity Completed</b>\n👤 ${user.displayName}\n📝 ${capitalize(activityType)}\n⏰ <b>Duration:</b> ${duration}\n🕐 ${startTime.toLocaleString()} → ${endTime.toLocaleString()}`,
        true // High priority
    );
}

/**
 * Handle Firestore activity completion with optimized query
 */
async function handleFirestoreActivityEnd(user, activityType, endTime) {
    // Use optimized query with limit for better performance
    const activitiesQuery = query(
        collection(db, "activities"),
        where("userId", "==", user.uid),
        where("activityType", "==", activityType),
        orderBy("startTime", "desc"),
        limit(10) // Limit to recent activities for better performance
    );

    const snapshot = await getDocs(activitiesQuery);
    
    if (snapshot.empty) {
        throw new Error(`No ${activityType} activities found. Please start a ${activityType} first.`);
    }
    
    // Find the most recent activity without an endTime
    let startDoc = null;
    let mostRecentStart = null;
    
    for (const docSnapshot of snapshot.docs) {
        const data = docSnapshot.data();
        
        if (!data.endTime) {
            const startTime = data.startTime.toDate();
            if (!mostRecentStart || startTime > mostRecentStart) {
                startDoc = docSnapshot;
                mostRecentStart = startTime;
            }
        }
    }
    
    if (!startDoc) {
        throw new Error(`No active ${activityType} found to end. Please start a ${activityType} first.`);
    }
    
    const startData = startDoc.data();
    const startTime = startData.startTime.toDate();
    const duration = calculateDuration(startTime, endTime);
    
    // Update the document
    await updateDoc(doc(db, "activities", startDoc.id), {
        endTime: Timestamp.fromDate(endTime),
        duration: duration
    });
    
    // Send completion notification
    const userName = EMAIL_TO_NAME_MAPPING[user.email] || user.displayName;
    await sendOptimizedTelegramNotification(
        `✅ <b>Activity Completed</b>\n👤 ${userName}\n📝 ${capitalize(activityType)}\n⏰ <b>Duration:</b> ${duration}\n🕐 ${startTime.toLocaleString()} → ${endTime.toLocaleString()}`,
        true // High priority
    );
}

/**
 * Optimized Telegram notification with rate limiting
 */
const telegramQueue = [];
let isSendingTelegram = false;

async function sendOptimizedTelegramNotification(message, isHighPriority = false) {
    if (!TELEGRAM_CONFIG.BOT_TOKEN || !TELEGRAM_CONFIG.CHANNEL_ID) {
        console.warn('Telegram not configured');
        return;
    }
    
    const notification = { message, isHighPriority, timestamp: Date.now() };
    
    if (isHighPriority) {
        telegramQueue.unshift(notification); // High priority goes first
    } else {
        telegramQueue.push(notification);
    }
    
    if (!isSendingTelegram) {
        processTelegramQueue();
    }
}

async function processTelegramQueue() {
    if (telegramQueue.length === 0) {
        isSendingTelegram = false;
        return;
    }
    
    isSendingTelegram = true;
    const notification = telegramQueue.shift();
    
    try {
        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_CONFIG.BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CONFIG.CHANNEL_ID,
                text: notification.message,
                parse_mode: 'HTML'
            })
        });
        
        if (response.ok) {
            console.log('Telegram notification sent successfully');
        } else {
            console.error('Failed to send Telegram notification:', response.status);
        }
    } catch (error) {
        console.error('Telegram notification error:', error);
    }
    
    // Rate limiting - wait 1 second between messages
    setTimeout(() => {
        processTelegramQueue();
    }, 1000);
}

/**
 * Get today's activities with caching
 */
export async function getTodaysActivities(useCache = true) {
    const cacheKey = 'todays_activities';
    const now = Date.now();
    
    // Check cache first
    if (useCache && activityCache.has(cacheKey) && 
        (now - lastCacheUpdate) < PERFORMANCE_CONFIG.CACHE_DURATION) {
        return activityCache.get(cacheKey);
    }
    
    const user = getCurrentUser();
    if (!user) return [];
    
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    if (user.isTemporary) {
        // Handle temporary user
        const tempActivities = JSON.parse(sessionStorage.getItem(STORAGE_KEYS.TEMP_ACTIVITIES) || '[]');
        const todayActivities = tempActivities.filter(activity => {
            const activityDate = new Date(activity.startTime);
            return activityDate >= startOfDay && activity.userId === user.uid;
        });
        
        activityCache.set(cacheKey, todayActivities);
        lastCacheUpdate = now;
        return todayActivities;
    }
    
    // Handle authenticated user
    const isAdmin = ADMIN_EMAILS.includes(user.email);
    
    let activitiesQuery;
    if (isAdmin) {
        activitiesQuery = query(
            collection(db, "activities"),
            where("startTime", ">=", Timestamp.fromDate(startOfDay)),
            orderBy("startTime", "desc"),
            limit(PERFORMANCE_CONFIG.MAX_ACTIVITIES_PER_LOAD)
        );
    } else {
        activitiesQuery = query(
            collection(db, "activities"),
            where("userId", "==", user.uid),
            where("startTime", ">=", Timestamp.fromDate(startOfDay)),
            orderBy("startTime", "desc"),
            limit(PERFORMANCE_CONFIG.MAX_ACTIVITIES_PER_LOAD)
        );
    }
    
    const querySnapshot = await getDocs(activitiesQuery);
    const activities = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startTime: doc.data().startTime.toDate(),
        endTime: doc.data().endTime ? doc.data().endTime.toDate() : null
    }));
    
    // Cache the results
    activityCache.set(cacheKey, activities);
    lastCacheUpdate = now;
    
    return activities;
}

/**
 * Debounced UI update for better performance
 */
let uiUpdateTimeout = null;
function debounceUIUpdate() {
    if (uiUpdateTimeout) {
        clearTimeout(uiUpdateTimeout);
    }
    
    uiUpdateTimeout = setTimeout(() => {
        if (window.updateUI) {
            window.updateUI();
        }
    }, 100);
}

/**
 * Clear activity cache
 */
export function clearActivityCache() {
    activityCache.clear();
    lastCacheUpdate = 0;
}

/**
 * Handle activity errors with user-friendly messages
 */
function handleActivityError(error, activityType, isStart) {
    const action = isStart ? 'start' : 'end';
    
    if (error.message.includes('No active')) {
        alert(`Error: ${error.message}`);
    } else if (error.message.includes('No') && error.message.includes('activities found')) {
        alert(`Error: ${error.message}`);
    } else if (error.message.includes('permission-denied')) {
        alert('Permission denied. Please check your account access.');
    } else if (error.message.includes('network')) {
        alert('Network error. Please check your connection and try again.');
    } else {
        alert(`Failed to ${action} ${activityType}. Please try again.`);
    }
}

/**
 * Utility function to capitalize strings
 */
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Make functions globally available
window.logActivity = logActivity;