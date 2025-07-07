/**
 * UI Module - Optimized DOM Manipulation and Rendering
 * Handles efficient UI updates with virtual DOM concepts and performance optimizations
 */

import { getTodaysActivities, clearActivityCache } from './activities.js';
import { getCurrentUser } from './auth.js';
import { ADMIN_EMAILS, EMAIL_TO_NAME_MAPPING, UI_CONFIG, DATE_FORMAT_OPTIONS } from './config.js';

// Virtual DOM cache for efficient updates
const uiCache = new Map();
let lastUIUpdate = 0;

/**
 * Main UI update function with debouncing and optimization
 */
export async function updateUI() {
    const now = Date.now();
    
    // Debounce rapid updates
    if (now - lastUIUpdate < UI_CONFIG.DEBOUNCE_DELAY) {
        return;
    }
    
    lastUIUpdate = now;
    
    try {
        const user = getCurrentUser();
        if (!user) return;
        
        // Show loading state
        setLoadingState(true);
        
        // Get activities with caching
        const activities = await getTodaysActivities();
        
        // Render activities efficiently
        await renderActivitiesOptimized(activities);
        
        // Update employee status for admin users
        const isAdmin = ADMIN_EMAILS.includes(user.email);
        if (isAdmin && !user.isTemporary) {
            await updateEmployeeStatusTable();
        }
        
    } catch (error) {
        console.error("UI update error:", error);
        showErrorMessage('Failed to update interface. Please refresh the page.');
    } finally {
        setLoadingState(false);
    }
}

/**
 * Optimized activity rendering with virtual DOM concepts
 */
async function renderActivitiesOptimized(activities) {
    const activityLog = document.getElementById('activityLog');
    if (!activityLog) return;
    
    const user = getCurrentUser();
    const isAdmin = ADMIN_EMAILS.includes(user.email);
    
    // Create virtual DOM structure
    const virtualDOM = createActivityVirtualDOM(activities, isAdmin);
    
    // Check if we need to update (compare with cache)
    const cacheKey = 'activity_list';
    const cachedDOM = uiCache.get(cacheKey);
    
    if (cachedDOM && JSON.stringify(virtualDOM) === JSON.stringify(cachedDOM)) {
        return; // No changes needed
    }
    
    // Update cache
    uiCache.set(cacheKey, virtualDOM);
    
    // Efficient DOM update using DocumentFragment
    const fragment = document.createDocumentFragment();
    
    // Add header
    const header = document.createElement('h6');
    header.className = 'mb-3 text-muted';
    header.innerHTML = `<i class="fas fa-eye"></i> ${isAdmin ? "All Team Activities (Admin View)" : "Your Activities"}`;
    fragment.appendChild(header);
    
    // Add activities
    if (virtualDOM.activities.length === 0) {
        const noActivity = document.createElement('p');
        noActivity.className = 'text-muted text-center mt-3';
        noActivity.textContent = 'No activities logged today.';
        fragment.appendChild(noActivity);
    } else {
        virtualDOM.activities.forEach(activityData => {
            fragment.appendChild(createActivityElement(activityData));
        });
    }
    
    // Replace content efficiently
    activityLog.innerHTML = '';
    activityLog.appendChild(fragment);
}

/**
 * Create virtual DOM representation of activities
 */
function createActivityVirtualDOM(activities, isAdmin) {
    const processedActivities = activities
        .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
        .map(activity => ({
            id: activity.id,
            type: activity.activityType,
            userName: activity.userName,
            startTime: activity.startTime,
            endTime: activity.endTime,
            duration: activity.duration,
            isCompleted: !!activity.endTime && !!activity.duration
        }));
    
    return {
        isAdmin,
        activities: processedActivities,
        timestamp: Date.now()
    };
}

/**
 * Create optimized activity element
 */
function createActivityElement(activityData) {
    const activityDiv = document.createElement('div');
    activityDiv.className = `activity-item mb-2 ${activityData.isCompleted ? 'completed' : 'in-progress'}`;
    
    const startTimeStr = formatTime(activityData.startTime);
    const endTimeStr = activityData.endTime ? formatTime(activityData.endTime) : 'In Progress';
    
    if (activityData.isCompleted) {
        activityDiv.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <strong>${activityData.type}</strong>
                    <span class="badge bg-success ms-2">${activityData.duration}</span>
                </div>
                <small class="text-muted">${activityData.userName}</small>
            </div>
            <div class="mt-1">
                <small class="text-muted">
                    ${startTimeStr} → ${endTimeStr}
                </small>
            </div>
        `;
    } else {
        activityDiv.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <strong>${activityData.type}</strong>
                    <span class="badge bg-warning ms-2">In Progress</span>
                </div>
                <small class="text-muted">${activityData.userName}</small>
            </div>
            <div class="mt-1">
                <small class="text-muted">Started: ${startTimeStr}</small>
            </div>
        `;
    }
    
    return activityDiv;
}

/**
 * Optimized employee status table update (Admin only)
 */
async function updateEmployeeStatusTable() {
    const statusTable = document.getElementById('statusTable');
    if (!statusTable) return;
    
    try {
        // Get all activities for today (cached)
        const activities = await getTodaysActivities();
        
        // Process employee status efficiently
        const employeeStatus = processEmployeeStatus(activities);
        
        // Render table efficiently using DocumentFragment
        renderEmployeeStatusTable(statusTable, employeeStatus);
        
    } catch (error) {
        console.error("Employee status update error:", error);
        statusTable.innerHTML = '<tr><td colspan="4" class="text-danger text-center">Error loading employee status</td></tr>';
    }
}

/**
 * Process employee status data efficiently
 */
function processEmployeeStatus(activities) {
    const employeeStatus = {};
    
    // Initialize employee status (excluding admins)
    Object.entries(EMAIL_TO_NAME_MAPPING).forEach(([email, name]) => {
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
    
    // Process activities in reverse chronological order for efficiency
    const sortedActivities = activities.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
    
    sortedActivities.forEach(activity => {
        const userName = activity.userName;
        if (!employeeStatus[userName]) return;
        
        const status = employeeStatus[userName];
        const lastActivityTime = formatTime(activity.startTime, 'timeOnly');
        
        // Update status based on most recent activity
        if (!activity.endTime) {
            // Activity in progress
            switch (activity.activityType) {
                case 'login':
                    status.status = 'Working';
                    status.isLoggedIn = true;
                    status.statusClass = 'text-success';
                    break;
                case 'lunch':
                    status.status = 'On Lunch Break';
                    status.statusClass = 'text-warning';
                    break;
                case 'break':
                    status.status = 'On Short Break';
                    status.statusClass = 'text-info';
                    break;
            }
            status.lastActivity = `${activity.activityType} started at ${lastActivityTime}`;
        } else {
            // Completed activity
            status.lastActivity = `${activity.activityType} ended at ${formatTime(activity.endTime, 'timeOnly')}`;
            
            // Calculate durations
            if (activity.duration) {
                const durationMs = calculateDurationInMs(activity.startTime, activity.endTime);
                if (activity.activityType === 'login') {
                    status.totalWorkTime += durationMs;
                } else if (['lunch', 'break'].includes(activity.activityType)) {
                    status.totalBreakTime += durationMs;
                }
            }
            
            // Update status for completed activities
            if (activity.activityType === 'login') {
                status.status = 'Logged Out';
                status.statusClass = 'text-secondary';
            }
        }
    });
    
    return employeeStatus;
}

/**
 * Render employee status table efficiently
 */
function renderEmployeeStatusTable(table, employeeStatus) {
    const fragment = document.createDocumentFragment();
    
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
        
        fragment.appendChild(row);
    });
    
    table.innerHTML = '';
    table.appendChild(fragment);
}

/**
 * Optimized time formatting with caching
 */
const timeFormatCache = new Map();
function formatTime(date, format = 'full') {
    const timestamp = date instanceof Date ? date.getTime() : new Date(date).getTime();
    const cacheKey = `${timestamp}-${format}`;
    
    if (timeFormatCache.has(cacheKey)) {
        return timeFormatCache.get(cacheKey);
    }
    
    const dateObj = new Date(timestamp);
    let formatted;
    
    switch (format) {
        case 'timeOnly':
            formatted = dateObj.toLocaleTimeString([], DATE_FORMAT_OPTIONS.TIME_ONLY);
            break;
        case 'dateOnly':
            formatted = dateObj.toLocaleDateString([], DATE_FORMAT_OPTIONS.DATE_ONLY);
            break;
        default:
            formatted = dateObj.toLocaleString([], DATE_FORMAT_OPTIONS.FULL);
    }
    
    timeFormatCache.set(cacheKey, formatted);
    
    // Clear cache if it gets too large
    if (timeFormatCache.size > 1000) {
        timeFormatCache.clear();
    }
    
    return formatted;
}

/**
 * Calculate duration in milliseconds
 */
function calculateDurationInMs(startTime, endTime) {
    const start = startTime instanceof Date ? startTime : new Date(startTime);
    const end = endTime instanceof Date ? endTime : new Date(endTime);
    return end.getTime() - start.getTime();
}

/**
 * Format duration from milliseconds to human-readable format
 */
function formatDuration(durationMs) {
    if (durationMs === 0) return '0m';
    
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
}

/**
 * Set loading state for UI elements
 */
function setLoadingState(isLoading) {
    const activityLog = document.getElementById('activityLog');
    const statusTable = document.getElementById('statusTable');
    
    if (isLoading) {
        activityLog?.classList.add('loading');
        statusTable?.classList.add('loading');
    } else {
        activityLog?.classList.remove('loading');
        statusTable?.classList.remove('loading');
    }
}

/**
 * Show error message to user
 */
function showErrorMessage(message) {
    const activityLog = document.getElementById('activityLog');
    if (activityLog) {
        activityLog.innerHTML = `<p class="text-danger text-center">${message}</p>`;
    }
}

/**
 * Initialize UI event listeners with optimization
 */
export function initializeUI() {
    // Event delegation for better performance
    document.addEventListener('click', handleButtonClicks);
    
    // Initialize button event listeners
    setupButtonEventListeners();
    
    // Setup periodic UI refresh (every 30 seconds)
    setInterval(() => {
        clearActivityCache();
        updateUI();
    }, 30000);
}

/**
 * Handle button clicks with event delegation
 */
function handleButtonClicks(event) {
    const target = event.target;
    
    if (target.matches('.break-btn, .google-btn')) {
        // Add click feedback
        target.style.transform = 'scale(0.95)';
        setTimeout(() => {
            target.style.transform = '';
        }, 150);
    }
}

/**
 * Setup button event listeners
 */
function setupButtonEventListeners() {
    const buttonMappings = [
        { id: 'loginBtn', action: () => window.logActivity('login', true) },
        { id: 'logoutBtn', action: () => window.logout() },
        { id: 'lunchStartBtn', action: () => window.logActivity('lunch', true) },
        { id: 'lunchEndBtn', action: () => window.logActivity('lunch', false) },
        { id: 'shortBreakStartBtn', action: () => window.logActivity('break', true) },
        { id: 'shortBreakEndBtn', action: () => window.logActivity('break', false) }
    ];
    
    buttonMappings.forEach(({ id, action }) => {
        const button = document.getElementById(id);
        if (button) {
            button.addEventListener('click', action);
        }
    });
}

/**
 * Clear UI cache for fresh updates
 */
export function clearUICache() {
    uiCache.clear();
    timeFormatCache.clear();
    lastUIUpdate = 0;
}

// Make updateUI globally available
window.updateUI = updateUI;