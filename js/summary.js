// Summary Management Module
import { db, auth } from './config.js';
import { collection, query, where, getDocs, orderBy, startOf, endOf, Timestamp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';
import { TELEGRAM_CONFIG, getEmployeeChatId, isNotificationEnabled, getMessageTemplate, validateTelegramConfig } from './telegram-config.js';

class SummaryManager {
    constructor() {
        this.todaySummary = [];
        this.pastSummary = [];
        this.telegramConfig = validateTelegramConfig();
    }

    // Initialize summary functionality
    async init() {
        await this.loadTodaySummary();
        this.setupEventListeners();
    }

    // Setup event listeners for summary features
    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('[data-bs-toggle="tab"]').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const target = e.target.getAttribute('data-bs-target');
                if (target === '#past') {
                    this.loadPastSummary();
                }
            });
        });

        // Date range inputs
        const startDate = document.getElementById('startDate');
        const endDate = document.getElementById('endDate');
        
        if (startDate && endDate) {
            // Set default dates (last 30 days)
            const today = new Date();
            const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
            
            startDate.value = thirtyDaysAgo.toISOString().split('T')[0];
            endDate.value = today.toISOString().split('T')[0];
        }
    }

    // Load today's summary for all employees
    async loadTodaySummary() {
        try {
            const today = new Date();
            const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

            const activitiesRef = collection(db, 'activities');
            const q = query(
                activitiesRef,
                where('timestamp', '>=', Timestamp.fromDate(startOfDay)),
                where('timestamp', '<=', Timestamp.fromDate(endOfDay)),
                orderBy('timestamp', 'desc')
            );

            const querySnapshot = await getDocs(q);
            const activities = [];
            
            querySnapshot.forEach((doc) => {
                activities.push({ id: doc.id, ...doc.data() });
            });

            this.todaySummary = this.processTodaySummary(activities);
            this.renderTodaySummary();
        } catch (error) {
            console.error('Error loading today summary:', error);
            this.showError('Failed to load today\'s summary');
        }
    }

    // Process today's activities into summary format
    processTodaySummary(activities) {
        const employeeSummary = {};

        activities.forEach(activity => {
            const employeeId = activity.userId || activity.userEmail;
            if (!employeeSummary[employeeId]) {
                employeeSummary[employeeId] = {
                    name: activity.userName || 'Unknown User',
                    email: activity.userEmail || employeeId,
                    activities: [],
                    loginTime: null,
                    logoutTime: null,
                    totalWorkTime: 0,
                    totalBreakTime: 0,
                    totalLunchTime: 0,
                    comments: []
                };
            }

            employeeSummary[employeeId].activities.push(activity);

            // Process different activity types
            switch (activity.type) {
                case 'login':
                case 'session_start':
                    if (!employeeSummary[employeeId].loginTime) {
                        employeeSummary[employeeId].loginTime = activity.timestamp;
                    }
                    break;
                case 'logout':
                case 'session_end':
                    employeeSummary[employeeId].logoutTime = activity.timestamp;
                    break;
                case 'lunch_start':
                    employeeSummary[employeeId].lunchStart = activity.timestamp;
                    break;
                case 'lunch_end':
                    if (employeeSummary[employeeId].lunchStart) {
                        const lunchDuration = activity.timestamp.toDate() - employeeSummary[employeeId].lunchStart.toDate();
                        employeeSummary[employeeId].totalLunchTime += lunchDuration;
                    }
                    break;
                case 'break_start':
                    employeeSummary[employeeId].breakStart = activity.timestamp;
                    break;
                case 'break_end':
                    if (employeeSummary[employeeId].breakStart) {
                        const breakDuration = activity.timestamp.toDate() - employeeSummary[employeeId].breakStart.toDate();
                        employeeSummary[employeeId].totalBreakTime += breakDuration;
                    }
                    break;
            }
        });

        // Calculate totals and generate comments
        Object.values(employeeSummary).forEach(employee => {
            if (employee.loginTime && employee.logoutTime) {
                const workDuration = employee.logoutTime.toDate() - employee.loginTime.toDate();
                employee.totalWorkTime = workDuration - employee.totalBreakTime - employee.totalLunchTime;
            }

            // Generate comments based on activity patterns
            this.generateComments(employee);
        });

        return Object.values(employeeSummary);
    }

    // Generate comments for employee summary
    generateComments(employee) {
        const comments = [];
        const loginTime = employee.loginTime?.toDate();
        const logoutTime = employee.logoutTime?.toDate();

        // Check for late arrival (after 9:00 AM)
        if (loginTime) {
            const loginHour = loginTime.getHours();
            const loginMinute = loginTime.getMinutes();
            if (loginHour > 9 || (loginHour === 9 && loginMinute > 0)) {
                comments.push({
                    type: 'warning',
                    message: `Came in late at ${loginTime.toLocaleTimeString()}`
                });
            }
        }

        // Check for early departure (before 5:00 PM)
        if (logoutTime) {
            const logoutHour = logoutTime.getHours();
            const logoutMinute = logoutTime.getMinutes();
            if (logoutHour < 17) {
                comments.push({
                    type: 'warning',
                    message: `Left early at ${logoutTime.toLocaleTimeString()}`
                });
            }
        }

        // Check for excessive break time (more than 1 hour total)
        const totalBreakMinutes = employee.totalBreakTime / (1000 * 60);
        if (totalBreakMinutes > 60) {
            comments.push({
                type: 'warning',
                message: `Exceeded break time limit (${Math.round(totalBreakMinutes)} minutes)`
            });
        }

        // Check for excessive lunch time (more than 1 hour)
        const totalLunchMinutes = employee.totalLunchTime / (1000 * 60);
        if (totalLunchMinutes > 60) {
            comments.push({
                type: 'warning',
                message: `Exceeded lunch time limit (${Math.round(totalLunchMinutes)} minutes)`
            });
        }

        // Check for no logout (still working)
        if (loginTime && !logoutTime) {
            comments.push({
                type: 'info',
                message: 'Still logged in - session active'
            });
        }

        employee.comments = comments;
    }

    // Render today's summary in the UI
    renderTodaySummary() {
        const container = document.getElementById('todaySummary');
        if (!container) return;

        if (this.todaySummary.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="fas fa-inbox fa-3x mb-3"></i>
                    <p>No activity data available for today</p>
                </div>
            `;
            return;
        }

        const summaryHTML = this.todaySummary.map(employee => {
            const statusClass = this.getStatusClass(employee);
            const statusText = this.getStatusText(employee);
            
            const workHours = Math.round(employee.totalWorkTime / (1000 * 60 * 60) * 10) / 10;
            const breakMinutes = Math.round(employee.totalBreakTime / (1000 * 60));
            const lunchMinutes = Math.round(employee.totalLunchTime / (1000 * 60));

            const commentsHTML = employee.comments.length > 0 ? `
                <div class="summary-comments">
                    ${employee.comments.map(comment => `
                        <div class="summary-comment">
                            <i class="fas fa-${comment.type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
                            ${comment.message}
                        </div>
                    `).join('')}
                </div>
            ` : '';

            return `
                <div class="summary-item ${statusClass}">
                    <div class="summary-header">
                        <div class="summary-name">${employee.name}</div>
                        <div class="summary-status ${statusClass}">${statusText}</div>
                    </div>
                    <div class="summary-details">
                        <div class="summary-detail">
                            <div class="summary-detail-label">Work Hours</div>
                            <div class="summary-detail-value">${workHours}h</div>
                        </div>
                        <div class="summary-detail">
                            <div class="summary-detail-label">Break Time</div>
                            <div class="summary-detail-value">${breakMinutes}m</div>
                        </div>
                        <div class="summary-detail">
                            <div class="summary-detail-label">Lunch Time</div>
                            <div class="summary-detail-value">${lunchMinutes}m</div>
                        </div>
                        <div class="summary-detail">
                            <div class="summary-detail-label">Login Time</div>
                            <div class="summary-detail-value">${employee.loginTime ? employee.loginTime.toDate().toLocaleTimeString() : 'N/A'}</div>
                        </div>
                    </div>
                    ${commentsHTML}
                </div>
            `;
        }).join('');

        container.innerHTML = summaryHTML;
    }

    // Get status class for employee
    getStatusClass(employee) {
        if (!employee.loginTime) return 'absent';
        if (!employee.logoutTime) return 'success';
        
        const loginTime = employee.loginTime.toDate();
        const loginHour = loginTime.getHours();
        const loginMinute = loginTime.getMinutes();
        
        if (loginHour > 9 || (loginHour === 9 && loginMinute > 0)) {
            return 'warning';
        }
        
        return 'success';
    }

    // Get status text for employee
    getStatusText(employee) {
        if (!employee.loginTime) return 'Absent';
        if (!employee.logoutTime) return 'Active';
        
        const loginTime = employee.loginTime.toDate();
        const loginHour = loginTime.getHours();
        const loginMinute = loginTime.getMinutes();
        
        if (loginHour > 9 || (loginHour === 9 && loginMinute > 0)) {
            return 'Late';
        }
        
        return 'On Time';
    }

    // Load past summary for date range
    async loadPastSummary() {
        try {
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;
            
            if (!startDate || !endDate) {
                this.showError('Please select both start and end dates');
                return;
            }

            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59);

            const activitiesRef = collection(db, 'activities');
            const q = query(
                activitiesRef,
                where('timestamp', '>=', Timestamp.fromDate(start)),
                where('timestamp', '<=', Timestamp.fromDate(end)),
                orderBy('timestamp', 'desc')
            );

            const querySnapshot = await getDocs(q);
            const activities = [];
            
            querySnapshot.forEach((doc) => {
                activities.push({ id: doc.id, ...doc.data() });
            });

            this.pastSummary = this.processPastSummary(activities, start, end);
            this.renderPastSummary();
        } catch (error) {
            console.error('Error loading past summary:', error);
            this.showError('Failed to load past summary');
        }
    }

    // Process past activities into summary format
    processPastSummary(activities, startDate, endDate) {
        const employeeSummary = {};
        const daysInRange = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

        // Group activities by employee and date
        activities.forEach(activity => {
            const employeeId = activity.userId || activity.userEmail;
            const activityDate = activity.timestamp.toDate().toDateString();
            
            if (!employeeSummary[employeeId]) {
                employeeSummary[employeeId] = {
                    name: activity.userName || 'Unknown User',
                    email: activity.userEmail || employeeId,
                    days: {},
                    totalDays: 0,
                    totalWorkHours: 0,
                    averageWorkHours: 0,
                    lateDays: 0,
                    absentDays: 0
                };
            }

            if (!employeeSummary[employeeId].days[activityDate]) {
                employeeSummary[employeeId].days[activityDate] = {
                    activities: [],
                    loginTime: null,
                    logoutTime: null,
                    totalWorkTime: 0,
                    totalBreakTime: 0,
                    totalLunchTime: 0,
                    isLate: false,
                    isAbsent: false
                };
            }

            employeeSummary[employeeId].days[activityDate].activities.push(activity);
        });

        // Process each day for each employee
        Object.values(employeeSummary).forEach(employee => {
            Object.values(employee.days).forEach(day => {
                // Process day activities (similar to today's summary)
                day.activities.forEach(activity => {
                    switch (activity.type) {
                        case 'login':
                        case 'session_start':
                            if (!day.loginTime) {
                                day.loginTime = activity.timestamp;
                                // Check if late
                                const loginTime = activity.timestamp.toDate();
                                if (loginTime.getHours() > 9 || (loginTime.getHours() === 9 && loginTime.getMinutes() > 0)) {
                                    day.isLate = true;
                                    employee.lateDays++;
                                }
                            }
                            break;
                        case 'logout':
                        case 'session_end':
                            day.logoutTime = activity.timestamp;
                            break;
                        // Add other activity types as needed
                    }
                });

                // Calculate day totals
                if (day.loginTime && day.logoutTime) {
                    day.totalWorkTime = day.logoutTime.toDate() - day.loginTime.toDate();
                    employee.totalWorkHours += day.totalWorkTime / (1000 * 60 * 60);
                } else if (!day.loginTime) {
                    day.isAbsent = true;
                    employee.absentDays++;
                }

                employee.totalDays++;
            });

            // Calculate averages
            if (employee.totalDays > 0) {
                employee.averageWorkHours = employee.totalWorkHours / employee.totalDays;
            }
        });

        return Object.values(employeeSummary);
    }

    // Render past summary in the UI
    renderPastSummary() {
        const container = document.getElementById('pastSummary');
        if (!container) return;

        if (this.pastSummary.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="fas fa-inbox fa-3x mb-3"></i>
                    <p>No activity data available for the selected date range</p>
                </div>
            `;
            return;
        }

        const summaryHTML = this.pastSummary.map(employee => {
            const totalWorkHours = Math.round(employee.totalWorkHours * 10) / 10;
            const averageWorkHours = Math.round(employee.averageWorkHours * 10) / 10;
            const attendanceRate = Math.round(((employee.totalDays - employee.absentDays) / employee.totalDays) * 100);

            return `
                <div class="summary-item">
                    <div class="summary-header">
                        <div class="summary-name">${employee.name}</div>
                        <div class="summary-status ${attendanceRate >= 90 ? 'success' : attendanceRate >= 80 ? 'warning' : 'danger'}">
                            ${attendanceRate}% Attendance
                        </div>
                    </div>
                    <div class="summary-details">
                        <div class="summary-detail">
                            <div class="summary-detail-label">Total Days</div>
                            <div class="summary-detail-value">${employee.totalDays}</div>
                        </div>
                        <div class="summary-detail">
                            <div class="summary-detail-label">Total Hours</div>
                            <div class="summary-detail-value">${totalWorkHours}h</div>
                        </div>
                        <div class="summary-detail">
                            <div class="summary-detail-label">Avg Hours/Day</div>
                            <div class="summary-detail-value">${averageWorkHours}h</div>
                        </div>
                        <div class="summary-detail">
                            <div class="summary-detail-label">Late Days</div>
                            <div class="summary-detail-value">${employee.lateDays}</div>
                        </div>
                        <div class="summary-detail">
                            <div class="summary-detail-label">Absent Days</div>
                            <div class="summary-detail-value">${employee.absentDays}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = summaryHTML;
    }

    // Send Telegram notification when employee logs out
    async sendTelegramNotification(employee, summary) {
        try {
            // Check if Telegram is configured
            if (!this.telegramConfig.isValid) {
                console.log('Telegram not configured:', this.telegramConfig.errors);
                return;
            }

            // Check if logout notifications are enabled
            if (!isNotificationEnabled('LOGOUT_NOTIFICATION')) {
                console.log('Logout notifications disabled');
                return;
            }

            const chatId = getEmployeeChatId(employee.email);
            if (!chatId) {
                console.log('No Telegram chat ID found for employee:', employee.email);
                return;
            }

            const workHours = Math.round(summary.totalWorkTime / (1000 * 60 * 60) * 10) / 10;
            const breakMinutes = Math.round(summary.totalBreakTime / (1000 * 60));
            const lunchMinutes = Math.round(summary.totalLunchTime / (1000 * 60));

            const messageData = {
                workHours,
                breakMinutes,
                lunchMinutes,
                comments: summary.comments
            };

            const message = getMessageTemplate('LOGOUT', employee, messageData);
            const url = `https://api.telegram.org/bot${TELEGRAM_CONFIG.BOT_TOKEN}/sendMessage`;
            
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

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Telegram API error: ${errorData.description || response.statusText}`);
            }

            console.log('Telegram notification sent successfully to:', employee.email);
        } catch (error) {
            console.error('Error sending Telegram notification:', error);
        }
    }

    // Send additional Telegram notifications based on activity patterns
    async sendActivityNotifications(employee, activity) {
        try {
            if (!this.telegramConfig.isValid || !isNotificationEnabled('LOGOUT_NOTIFICATION')) {
                return;
            }

            const chatId = getEmployeeChatId(employee.email);
            if (!chatId) return;

            let message = null;
            let messageType = null;

            // Check for late arrival
            if (activity.type === 'login' || activity.type === 'session_start') {
                const loginTime = activity.timestamp.toDate();
                if (loginTime.getHours() > 9 || (loginTime.getHours() === 9 && loginTime.getMinutes() > 0)) {
                    if (isNotificationEnabled('LATE_ARRIVAL_ALERT')) {
                        message = getMessageTemplate('LATE_ARRIVAL', employee, loginTime.toLocaleTimeString());
                        messageType = 'LATE_ARRIVAL';
                    }
                }
            }

            // Check for early departure
            if (activity.type === 'logout' || activity.type === 'session_end') {
                const logoutTime = activity.timestamp.toDate();
                if (logoutTime.getHours() < 17) {
                    if (isNotificationEnabled('EARLY_DEPARTURE_ALERT')) {
                        message = getMessageTemplate('EARLY_DEPARTURE', employee, logoutTime.toLocaleTimeString());
                        messageType = 'EARLY_DEPARTURE';
                    }
                }
            }

            // Send notification if message exists
            if (message) {
                const url = `https://api.telegram.org/bot${TELEGRAM_CONFIG.BOT_TOKEN}/sendMessage`;
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
                    console.log(`${messageType} notification sent to:`, employee.email);
                }
            }
        } catch (error) {
            console.error('Error sending activity notification:', error);
        }
    }

    // Show error message
    showError(message) {
        const container = document.getElementById('todaySummary') || document.getElementById('pastSummary');
        if (container) {
            container.innerHTML = `
                <div class="text-center text-danger py-4">
                    <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
                    <p>${message}</p>
                </div>
            `;
        }
    }

    // Refresh today's summary
    async refreshTodaySummary() {
        await this.loadTodaySummary();
    }
}

// Export the SummaryManager class
export default SummaryManager; 