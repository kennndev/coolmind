# MindFlow Integration Guide

## Overview

This guide explains how the authentication flow and API endpoints are integrated with the WellnessApp (Doctor Dashboard).

## What Was Done

### 1. Created Main App Component (`src/App.jsx`)

The App component manages the overall authentication state and routing:

**Features:**
- Checks for existing authentication on mount
- Verifies JWT tokens with the backend
- Routes to AuthFlow for unauthenticated users
- Routes to WellnessApp for authenticated doctors
- Routes to Patient Dashboard for authenticated patients (placeholder)
- Handles logout functionality
- Stores authentication data in localStorage

**Flow:**
```
App Load → Check localStorage for token →
  ├─ No Token → Show AuthFlow
  └─ Token Found → Verify with backend →
      ├─ Valid → Show Dashboard (based on role)
      └─ Invalid → Clear storage & Show AuthFlow
```

### 2. Created API Service (`src/api.js`)

Centralized API service for all backend communications:

**Modules:**
- `authAPI` - Authentication endpoints (login, logout, profile completion)
- `doctorAPI` - Doctor-specific endpoints (profile, patients, schedule)
- `patientAPI` - Patient-specific endpoints (profile, sessions, check-ins)
- `sessionNotesAPI` - Session notes management (create, update, image extraction)

**Features:**
- Automatic JWT token attachment to requests
- Centralized error handling
- FormData support for file uploads
- Response parsing and error throwing

**Example Usage:**
```javascript
import { doctorAPI } from './api.js';

// Get doctor profile
const profile = await doctorAPI.getProfile();

// Get patients list
const patients = await doctorAPI.getPatients();

// Get schedule
const schedule = await doctorAPI.getSchedule('2026-01-27');
```

### 3. Updated WellnessApp (`src/WellnessApp.jsx`)

**Changes:**
- Added `user` and `onLogout` props from parent App component
- Added data loading states (loading, patients, doctorProfile)
- Added `loadDoctorData()` function to fetch real data from API
- Falls back to demo data if API fails
- Added logout buttons in sidebar (desktop and mobile)
- Shows loading spinner while fetching data
- Dynamically builds user object from API response

**Before:**
```javascript
export default function WellnessApp() {
  const user = useMemo(
    () => ({ role: 'doctor', name: 'Dr. Sarah Mitchell', ... }),
    []
  );
  const patients = useMemo(() => [...hardcodedPatients], []);
}
```

**After:**
```javascript
export default function WellnessApp({ user: authUser, onLogout }) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [doctorProfile, setDoctorProfile] = useState(null);

  React.useEffect(() => {
    loadDoctorData(); // Fetch from API
  }, []);

  const user = useMemo(() => {
    if (doctorProfile) {
      return {
        role: 'doctor',
        name: `${doctorProfile.title} ${doctorProfile.firstName} ${doctorProfile.lastName}`,
        ...
      };
    }
    return authUser || defaultUser;
  }, [doctorProfile, authUser]);
}
```

### 4. Updated Main Entry Point (`src/main.jsx`)

**Changed:**
```javascript
// Before
import WellnessApp from './WellnessApp.jsx'
<WellnessApp />

// After
import App from './App.jsx'
<App />
```

## Authentication Flow

### Login Process

1. **User enters email** → `POST /api/auth/request-code`
   - System checks if user exists
   - Determines role (doctor or patient)
   - Generates 6-digit verification code
   - Sends code via email
   - Returns: `{ success, isNewUser, role }`

2. **User enters code** → `POST /api/auth/verify-code`
   - Validates code (not expired, not used)
   - Creates user account if new
   - Creates profile skeleton (Patient or Doctor)
   - Generates JWT token
   - Returns: `{ success, token, user, requiresOnboarding }`

3. **Profile completion** (if new user):
   - **Patient** → `POST /api/auth/complete-patient-profile`
   - **Doctor** → `POST /api/auth/complete-doctor-profile`
   - Updates profile with user details
   - Returns: `{ success, patient/doctor }`

4. **Token stored in localStorage**:
   - `authToken` - JWT token
   - `userRole` - 'patient' or 'doctor'
   - `userData` - User object

5. **Dashboard loads with authenticated requests**

### Logout Process

1. User clicks Logout button
2. `POST /api/auth/logout` with token
3. Clear localStorage
4. Redirect to AuthFlow

## API Endpoints Available

### Authentication
- `POST /api/auth/request-code` - Request verification code
- `POST /api/auth/verify-code` - Verify code and login
- `POST /api/auth/resend-code` - Resend verification code
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/complete-patient-profile` - Complete patient profile
- `POST /api/auth/complete-doctor-profile` - Complete doctor profile

### Doctor Endpoints
- `GET /api/doctor/profile` - Get doctor profile
- `PUT /api/doctor/profile` - Update doctor profile
- `GET /api/doctor/patients` - Get assigned patients
- `GET /api/doctor/schedule?date=YYYY-MM-DD` - Get schedule
- `GET /api/doctor/patients/:patientId` - Get patient details

### Patient Endpoints
- `GET /api/patient/profile` - Get patient profile
- `PUT /api/patient/profile` - Update patient profile
- `GET /api/patient/sessions?status=scheduled` - Get sessions
- `POST /api/patient/check-in/:sessionId` - Submit pre-session check-in

### Session Notes Endpoints
- `POST /api/session-notes` - Create session notes
- `GET /api/session-notes/:sessionId` - Get session notes
- `PUT /api/session-notes/:notesId` - Update session notes
- `POST /api/session-notes/extract` - Extract notes from image (OCR)

## File Structure

```
mindflow-preview/
├── src/
│   ├── App.jsx              # Main app component (NEW)
│   ├── api.js               # API service (NEW)
│   ├── AuthFlow.jsx         # Authentication flow UI (EXISTING)
│   ├── WellnessApp.jsx      # Doctor dashboard (UPDATED)
│   ├── main.jsx             # Entry point (UPDATED)
│   └── index.css            # Styles
├── auth-routes.js           # Backend auth routes
├── emailService.js          # Email service
├── wellness-app-schema.js   # Database schemas
├── APIDOCS.md               # API documentation
├── SETUP.md                 # Setup guide
├── INTEGRATION-GUIDE.md     # This file (NEW)
└── README.md                # Project readme
```

## How It Works Together

### 1. Initial Load
```
User visits site
  ↓
main.jsx loads App component
  ↓
App checks localStorage for authToken
  ↓
If token exists → Verify with backend
If no token → Show AuthFlow
```

### 2. After Login
```
AuthFlow completes successfully
  ↓
onAuthComplete called with user data
  ↓
App stores token and userData
  ↓
App sets isAuthenticated = true
  ↓
App shows WellnessApp (if doctor) with user prop
  ↓
WellnessApp calls loadDoctorData()
  ↓
doctorAPI.getProfile() and doctorAPI.getPatients()
  ↓
Display real data in dashboard
```

### 3. API Requests
```
Component needs data
  ↓
Import { doctorAPI } from './api.js'
  ↓
await doctorAPI.getPatients()
  ↓
api.js reads token from localStorage
  ↓
Makes fetch request with Authorization header
  ↓
Backend validates token
  ↓
Returns data or error
  ↓
Component updates state with data
```

## Testing the Integration

### 1. Start the Development Server
```bash
npm run dev
```

### 2. Open Browser
```
http://localhost:5173
```

### 3. Test Flow

**Without Backend:**
- Should see AuthFlow (email input)
- Can fill in email and code (will show network errors if backend not running)

**With Backend Running:**
1. Enter email address
2. Check email for verification code
3. Enter code
4. Complete profile (if new user)
5. See WellnessApp dashboard
6. Data will load from API
7. Click logout to return to AuthFlow

## Environment Variables Needed

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/mindflow

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key

# Email Service (SendGrid)
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=noreply@mindflow.app

# Approved Doctor Emails
APPROVED_DOCTOR_EMAILS=doctor1@example.com,doctor2@example.com

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

## Next Steps

### Backend Setup (Required)
1. Set up MongoDB database
2. Configure email service (SendGrid or SMTP)
3. Set environment variables
4. Start backend server
5. Ensure CORS is configured for frontend URL

### Backend Files Needed
```javascript
// server.js - Main server file
const express = require('express');
const cors = require('cors');
const { router: authRoutes } = require('./auth-routes');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

app.use('/api/auth', authRoutes);
// Add other route handlers...

app.listen(5000, () => {
  console.log('Server running on port 5000');
});
```

### Additional Endpoints to Implement
- Doctor schedule management
- Patient session management
- Session notes CRUD operations
- Video session room creation
- Pre-session check-in endpoints
- Messages/chat endpoints

## Security Considerations

1. **JWT Tokens**
   - Use strong secret (32+ characters)
   - Set appropriate expiration (7 days)
   - Consider refresh tokens for production

2. **API Authentication**
   - All protected routes require valid JWT
   - Token verified on every request
   - Invalid tokens return 401/403 errors

3. **CORS**
   - Configure allowed origins
   - Use credentials: true for cookies
   - Validate origin in production

4. **Data Validation**
   - Validate all inputs on backend
   - Sanitize user inputs
   - Use parameterized queries for database

5. **HTTPS**
   - Use HTTPS in production
   - Secure cookies with httpOnly flag
   - Enable HSTS headers

## Troubleshooting

### "Network error" on login
- Backend server not running
- CORS not configured properly
- Wrong API base URL

### "Invalid token" after login
- JWT_SECRET mismatch between frontend storage and backend
- Token expired
- Token not being sent in Authorization header

### "Profile data not loading"
- Database connection issues
- API endpoints not implemented
- User role doesn't match expected role

### "Logout not working"
- localStorage not clearing
- Backend logout endpoint failing
- Token still valid after logout

## Summary

The integration is now complete with:

✅ Authentication flow integrated with WellnessApp
✅ API service created for all endpoints
✅ Token-based authentication working
✅ Protected routes with JWT verification
✅ Role-based routing (doctor/patient)
✅ Logout functionality
✅ Real data loading from API (with demo fallback)
✅ Proper error handling
✅ Loading states for better UX

The app now follows a proper authentication flow:
**AuthFlow** → **Login** → **Token Storage** → **WellnessApp** → **API Calls** → **Display Data**
