# P&Z Bookings and Registration Team Time Tracker

A modern, feature-rich time tracking application for the P&Z Bookings and Registration Team (Surashree/Back Office) with real-time monitoring, summary reports, and Telegram notifications.

## 🚀 Features

### Core Time Tracking
- **Automatic Session Management**: Start/stop work sessions with one click
- **Break Tracking**: Monitor lunch breaks and short breaks separately
- **Real-time Activity Log**: Live updates of all employee activities
- **Team Status Dashboard**: View all team members' current status

### 📊 Summary Reports

#### Today's Summary Tab
- **Real-time Employee Status**: See who's present, late, or absent
- **Work Hours Tracking**: Monitor actual work time vs. break time
- **Smart Comments**: Automatic detection of:
  - Late arrivals (after 9:00 AM)
  - Early departures (before 5:00 PM)
  - Excessive break time (over 1 hour total)
  - Excessive lunch time (over 1 hour)
  - Active sessions (still logged in)

#### Past Summary Tab
- **Date Range Selection**: Choose custom date ranges for historical data
- **Employee Performance**: Track attendance rates, work hours, and patterns
- **Statistical Analysis**: Average work hours, late days, absent days
- **Trend Analysis**: Identify patterns in employee behavior

### 📱 Telegram Integration

#### Automatic Notifications
- **Logout Summaries**: Daily work summary sent when employee logs out
- **Late Arrival Alerts**: Instant notification for late arrivals
- **Early Departure Alerts**: Notifications for early departures
- **Excessive Break Alerts**: Warnings for extended break times

#### Message Templates
- Rich HTML formatting with emojis
- Detailed work statistics
- Customizable alert thresholds
- Configurable notification types

## 🛠️ Technical Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Firebase (Firestore, Authentication, Hosting)
- **Styling**: Bootstrap 5, Custom CSS with Glassmorphism
- **Notifications**: Telegram Bot API
- **Performance**: Optimized loading, caching, and real-time updates

## 📋 Prerequisites

1. **Firebase Project**: Set up a Firebase project with Firestore and Authentication
2. **Telegram Bot**: Create a Telegram bot via @BotFather
3. **Employee Chat IDs**: Collect Telegram chat IDs for all employees

## 🚀 Installation & Setup

### 1. Firebase Setup

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize project
firebase init

# Deploy to Firebase
firebase deploy
```

### 2. Telegram Bot Setup

#### Create Bot
1. Message @BotFather on Telegram
2. Send `/newbot` command
3. Follow instructions to create your bot
4. Save the bot token

#### Get Employee Chat IDs
1. Have each employee start a chat with your bot
2. Send a message to the bot
3. Use the Telegram API or @userinfobot to get chat_id
4. Add mappings to `js/telegram-config.js`

### 3. Configuration

#### Update Telegram Configuration
Edit `js/telegram-config.js`:

```javascript
export const TELEGRAM_CONFIG = {
    BOT_TOKEN: 'YOUR_ACTUAL_BOT_TOKEN',
    EMPLOYEE_CHAT_IDS: {
        'employee1@company.com': '123456789',
        'employee2@company.com': '987654321',
        // Add more employees
    },
    NOTIFICATIONS: {
        LOGOUT_NOTIFICATION: true,
        LATE_ARRIVAL_ALERT: true,
        EARLY_DEPARTURE_ALERT: true,
        EXCESSIVE_BREAK_ALERT: true
    }
};
```

#### Firebase Configuration
Update `firebase-config.js` with your Firebase project settings.

## 📱 Usage

### For Employees

1. **Login**: Use Google Sign-in or phone/passcode
2. **Start Session**: Click "Start Session" to begin work tracking
3. **Manage Breaks**: Use lunch and break buttons as needed
4. **End Session**: Click "End Session" when done for the day

### For Managers

1. **Today's Summary**: View real-time status of all employees
2. **Past Summary**: Analyze historical data with date range selection
3. **Telegram Notifications**: Receive instant alerts and daily summaries
4. **Activity Monitoring**: Track all employee activities in real-time

## 🔧 Configuration Options

### Notification Settings

```javascript
NOTIFICATIONS: {
    LOGOUT_NOTIFICATION: true,      // Daily summary on logout
    DAILY_SUMMARY: true,           // End-of-day team summary
    WEEKLY_SUMMARY: true,          // Weekly team summary
    LATE_ARRIVAL_ALERT: true,      // Late arrival notifications
    EARLY_DEPARTURE_ALERT: true,   // Early departure notifications
    EXCESSIVE_BREAK_ALERT: true    // Excessive break notifications
}
```

### Time Thresholds

- **Late Arrival**: After 9:00 AM
- **Early Departure**: Before 5:00 PM
- **Excessive Break**: Over 1 hour total
- **Excessive Lunch**: Over 1 hour

### Customization

- Modify time thresholds in `js/summary.js`
- Customize message templates in `js/telegram-config.js`
- Adjust UI styling in `styles.css`

## 📊 Data Structure

### Firestore Collections

#### activities
```javascript
{
    userId: "string",
    userEmail: "string",
    userName: "string",
    type: "login|logout|lunch_start|lunch_end|break_start|break_end|session_start|session_end",
    message: "string",
    timestamp: "timestamp",
    sessionId: "number"
}
```

### Summary Data
```javascript
{
    name: "string",
    email: "string",
    loginTime: "timestamp",
    logoutTime: "timestamp",
    totalWorkTime: "number",
    totalBreakTime: "number",
    totalLunchTime: "number",
    comments: ["array of comment objects"]
}
```

## 🔒 Security

- **Authentication**: Google Sign-in and secure passcode system
- **Firestore Rules**: Configured for user-based access control
- **Telegram Security**: Bot token and chat ID validation
- **Data Privacy**: Employee data is encrypted and secure

## 🚀 Deployment

### Firebase Hosting
```bash
firebase deploy
```

### Custom Domain
1. Add custom domain in Firebase Console
2. Update DNS records
3. Deploy with custom domain

## 📈 Monitoring & Analytics

### Performance Metrics
- Page load times
- Real-time update latency
- Firebase usage statistics
- Error tracking and logging

### Usage Analytics
- Daily active users
- Session duration patterns
- Break time analysis
- Attendance trends

## 🐛 Troubleshooting

### Common Issues

1. **Telegram Notifications Not Working**
   - Check bot token configuration
   - Verify employee chat IDs
   - Ensure bot has permission to send messages

2. **Firebase Connection Issues**
   - Verify Firebase configuration
   - Check Firestore rules
   - Ensure proper authentication setup

3. **Summary Data Not Loading**
   - Check Firestore indexes
   - Verify date range selection
   - Ensure proper data structure

### Debug Mode
Enable debug logging by setting:
```javascript
localStorage.setItem('debug', 'true');
```

## 🔄 Updates & Maintenance

### Regular Maintenance
- Monitor Firebase usage and costs
- Update Telegram bot configurations
- Review and optimize Firestore queries
- Update employee chat ID mappings

### Feature Updates
- New notification types
- Enhanced reporting features
- Mobile app development
- API integrations

## 📞 Support

For technical support or feature requests:
- Check the troubleshooting section
- Review Firebase and Telegram documentation
- Contact the development team

## 📄 License

This project is proprietary software for P&Z Bookings and Registration Team use only.

---

**Version**: 2.0.0  
**Last Updated**: December 2024  
**Maintained By**: Development Team