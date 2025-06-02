# Team Time Tracker for Managers

## 🚀 **LIVE DEPLOYMENT STATUS**

### ✅ **Successfully Deployed** 
- **Live URL**: [https://kt-time-tracker.web.app](https://kt-time-tracker.web.app)
- **GitHub Repository**: [https://github.com/kapilthakare-cyberpunk/kt-time-tracker-for-managers](https://github.com/kapilthakare-cyberpunk/kt-time-tracker-for-managers)
- **Firebase Project**: `kt-time-tracker`
- **Deployment Date**: June 2, 2025

### 🔧 **Current Configuration**
- **Phone Authentication**: Ready with 6-digit passcode system (`123456`)
- **Authorized Phone**: `+919503275757` 
- **Telegram Integration**: Channel ID `-1002679175910` (Team Daily: Sales & Reg)
- **reCAPTCHA**: Invisible reCAPTCHA integrated for security
- **Firebase Hosting**: Fully deployed and operational

### ⚠️ **Manual Setup Required**
To complete the authentication setup, enable these in [Firebase Console](https://console.firebase.google.com/project/kt-time-tracker):

1. **Enable Authentication Providers**:
   - Go to Authentication > Sign-in method
   - Enable **Google** provider
   - Enable **Phone** provider

2. **Setup Firestore Security Rules**:
   - Go to Firestore Database > Rules
   - Copy rules from `firestore.rules` file in this repository

## 📱 **Features**

### ✨ Enhanced Data Structure
- **startTime**: Required timestamp for all activities
- **endTime**: Optional timestamp for completed activities
- **activityType**: Standardized activity types (`login`, `lunch`, `break`)
- **duration**: Auto-calculated duration in `HH:MM` format
- **userId**: User reference for security

### 🔒 Security Rules
- Field validation enforcing required fields
- User-based access control
- Duration format validation (HH:MM)

### ⏱️ Duration Calculation
- Precise time tracking between start and end events
- Automatic duration calculation in `HH:MM` format
- Input validation and error handling

### 📊 Enhanced UI
- Visual distinction between completed and in-progress activities
- Duration badges for completed activities
- Chronological sorting with latest activities first
- Real-time activity status updates

## Project Structure

```
time-tracker/
├── utils/
│   └── duration.js          # Duration calculation utilities
├── tests/
│   └── activityLog.test.js  # Test suite for activity logging
├── firestore.rules          # Firestore security rules
├── firestore.indexes.json   # Firestore database indexes
├── firebase.json            # Firebase configuration
├── script.js               # Enhanced activity logging logic
├── index.html              # Main application interface
├── firebase-config.js      # Firebase initialization
└── package.json            # Project dependencies and scripts
```

## Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd time-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Update `firebase-config.js` with your Firebase project credentials
   - Deploy Firestore rules: `firebase deploy --only firestore:rules`

4. **Start the development server**
   ```bash
   npm start
   ```

## Usage

### Activity Types

The application supports three main activity types:

- **`login`**: Work session start/end tracking
- **`lunch`**: Lunch break duration tracking  
- **`break`**: Short break duration tracking

### Activity Flow

1. **Start Activity**: Click a "Start" button to begin tracking
   - Creates a document with `startTime`, `activityType`, and `userId`
   - Shows as "In Progress" in the activity log

2. **End Activity**: Click the corresponding "End" button
   - Finds the matching start activity
   - Calculates duration using the duration utility
   - Updates the document with `endTime` and `duration`
   - Shows completed activity with duration badge

### Data Structure Example

```javascript
// Start Activity Document
{
  startTime: Timestamp,
  activityType: "lunch",
  userId: "user123",
  userName: "John Doe"
}

// Completed Activity Document
{
  startTime: Timestamp,
  endTime: Timestamp,
  activityType: "lunch", 
  userId: "user123",
  userName: "John Doe",
  duration: "00:45"
}
```

## API Reference

### Duration Utilities (`utils/duration.js`)

#### `calculateDuration(start, end)`
Calculates duration between two Date objects.

```javascript
import { calculateDuration } from './utils/duration.js';

const start = new Date(2025, 0, 1, 10, 0);  // 10:00 AM
const end = new Date(2025, 0, 1, 10, 30);    // 10:30 AM
const duration = calculateDuration(start, end); // "00:30"
```

#### `isValidDate(date)`
Validates if a value is a valid Date object.

#### `parseDurationToMinutes(duration)`
Converts HH:MM format to total minutes.

#### `minutesToDuration(totalMinutes)`
Converts total minutes to HH:MM format.

### Activity Logging (`script.js`)

#### `logActivity(activityType, isStart)`
Enhanced activity logging with start/end pairing.

```javascript
// Start a lunch break
logActivity('lunch', true);

// End a lunch break  
logActivity('lunch', false);
```

## Testing

### Available Test Commands

```bash
# Test duration calculation
npm run test:duration

# Test Firestore rules (requires Firebase emulator)
npm run test:rules

# Run Jest test suite
npm run test:activities
```

### Test Coverage

- Duration calculation accuracy
- Input validation and error handling
- Activity data structure validation
- Start/end activity pairing logic
- Firestore security rules

## Firestore Security Rules

The application enforces strict security rules:

```javascript
service cloud.firestore {
  match /databases/{database}/documents {
    match /activities/{activity} {
      // Create: Requires auth + required fields + user ownership
      allow create: if request.auth != null && 
        request.resource.data.keys().hasAll(['startTime', 'activityType']) &&
        request.resource.data.userId == request.auth.uid;
        
      // Update: Requires auth + user ownership + duration format validation
      allow update: if request.auth != null && 
        request.resource.data.userId == request.auth.uid &&
        request.resource.data.duration.size() <= 5;
        
      // Read/Delete: Requires auth + user ownership
      allow read, delete: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
  }
}
```

## Database Indexes

Optimized indexes for efficient querying:

1. **User Activities by Time**: `userId` (ASC) + `startTime` (DESC)
2. **Activity Pairing**: `userId` (ASC) + `activityType` (ASC) + `endTime` (ASC) + `startTime` (DESC)

## Development

### Adding New Activity Types

1. Update the `activityType` validation in `firestore.rules`
2. Add corresponding UI buttons in `index.html`
3. Update event listeners in `script.js`
4. Add test cases in `tests/activityLog.test.js`

### Extending Duration Utilities

The duration utility module is designed for extensibility:

```javascript
// Add new duration-related functions
export function formatDurationLong(duration) {
  const [hours, minutes] = duration.split(':');
  return `${hours} hours and ${minutes} minutes`;
}
```

## Troubleshooting

### Common Issues

1. **ES Module Errors**: Ensure `"type": "module"` is set in `package.json`
2. **Firebase Auth Issues**: Check Firebase configuration and authentication setup
3. **Duration Calculation Errors**: Verify Date objects are valid before calculation
4. **Firestore Permission Errors**: Ensure security rules are properly deployed

### Debug Mode

Enable debug logging by adding to `script.js`:

```javascript
// Enable debug logging
const DEBUG = true;
if (DEBUG) console.log('Activity logged:', activityData);
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

This project is licensed under the MIT License.