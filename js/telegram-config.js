// Telegram Configuration
// Replace these values with your actual Telegram bot token and employee chat IDs

export const TELEGRAM_CONFIG = {
    // Your Telegram bot token (get this from @BotFather)
    BOT_TOKEN: 'YOUR_TELEGRAM_BOT_TOKEN_HERE',
    
    // Employee chat IDs - map employee emails to their Telegram chat IDs
    // To get a chat ID, send a message to your bot and check the chat_id in the response
    EMPLOYEE_CHAT_IDS: {
        // Example mappings - replace with actual employee data
        'john.doe@company.com': '123456789',
        'jane.smith@company.com': '987654321',
        'bob.wilson@company.com': '555666777',
        // Add more employees as needed
    },
    
    // Notification settings
    NOTIFICATIONS: {
        // Send notification when employee logs out
        LOGOUT_NOTIFICATION: true,
        
        // Send daily summary at end of day
        DAILY_SUMMARY: true,
        
        // Send weekly summary
        WEEKLY_SUMMARY: true,
        
        // Send alerts for late arrivals
        LATE_ARRIVAL_ALERT: true,
        
        // Send alerts for early departures
        EARLY_DEPARTURE_ALERT: true,
        
        // Send alerts for excessive break time
        EXCESSIVE_BREAK_ALERT: true
    },
    
    // Message templates
    MESSAGES: {
        LOGOUT: (employee, summary) => `
🕐 <b>Daily Summary - ${employee.name}</b>

📅 Date: ${new Date().toLocaleDateString()}
⏰ Work Hours: ${summary.workHours}h
☕ Break Time: ${summary.breakMinutes}m
🍽️ Lunch Time: ${summary.lunchMinutes}m

${summary.comments.length > 0 ? `
⚠️ <b>Comments:</b>
${summary.comments.map(comment => `• ${comment.message}`).join('\n')}
` : ''}

✅ Logout completed at ${new Date().toLocaleTimeString()}
        `,
        
        LATE_ARRIVAL: (employee, time) => `
⚠️ <b>Late Arrival Alert</b>

👤 Employee: ${employee.name}
⏰ Arrival Time: ${time}
📅 Date: ${new Date().toLocaleDateString()}
        `,
        
        EARLY_DEPARTURE: (employee, time) => `
⚠️ <b>Early Departure Alert</b>

👤 Employee: ${employee.name}
⏰ Departure Time: ${time}
📅 Date: ${new Date().toLocaleDateString()}
        `,
        
        EXCESSIVE_BREAK: (employee, duration) => `
⚠️ <b>Excessive Break Time Alert</b>

👤 Employee: ${employee.name}
⏰ Break Duration: ${duration} minutes
📅 Date: ${new Date().toLocaleDateString()}
        `,
        
        DAILY_SUMMARY: (summary) => `
📊 <b>Daily Team Summary</b>

📅 Date: ${new Date().toLocaleDateString()}
👥 Total Employees: ${summary.totalEmployees}
✅ Present: ${summary.present}
❌ Absent: ${summary.absent}
⚠️ Late: ${summary.late}

⏰ Average Work Hours: ${summary.averageWorkHours}h
        `
    }
};

// Helper function to get chat ID for employee
export function getEmployeeChatId(email) {
    return TELEGRAM_CONFIG.EMPLOYEE_CHAT_IDS[email] || null;
}

// Helper function to check if notifications are enabled
export function isNotificationEnabled(type) {
    return TELEGRAM_CONFIG.NOTIFICATIONS[type] || false;
}

// Helper function to get message template
export function getMessageTemplate(type, ...args) {
    const template = TELEGRAM_CONFIG.MESSAGES[type];
    if (typeof template === 'function') {
        return template(...args);
    }
    return template;
}

// Validate configuration
export function validateTelegramConfig() {
    const errors = [];
    
    if (!TELEGRAM_CONFIG.BOT_TOKEN || TELEGRAM_CONFIG.BOT_TOKEN === 'YOUR_TELEGRAM_BOT_TOKEN_HERE') {
        errors.push('Telegram bot token not configured');
    }
    
    if (Object.keys(TELEGRAM_CONFIG.EMPLOYEE_CHAT_IDS).length === 0) {
        errors.push('No employee chat IDs configured');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

// Instructions for setting up Telegram bot
export const TELEGRAM_SETUP_INSTRUCTIONS = `
📱 <b>Telegram Bot Setup Instructions:</b>

1. <b>Create a Bot:</b>
   - Message @BotFather on Telegram
   - Send /newbot command
   - Follow the instructions to create your bot
   - Save the bot token

2. <b>Get Employee Chat IDs:</b>
   - Have each employee start a chat with your bot
   - Send a message to the bot
   - Use the Telegram API to get the chat_id
   - Or use a service like @userinfobot

3. <b>Configure the App:</b>
   - Replace 'YOUR_TELEGRAM_BOT_TOKEN_HERE' with your actual bot token
   - Add employee email to chat ID mappings in EMPLOYEE_CHAT_IDS
   - Test the notifications

4. <b>Optional:</b>
   - Create a group chat for team notifications
   - Add the bot to the group
   - Use the group chat ID for team-wide notifications
`; 