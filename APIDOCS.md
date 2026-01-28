# MindFlow API Documentation

## Authentication Endpoints

Base URL: `/api/auth`

---

### 1. Request Verification Code

Send a verification code to user's email.

**Endpoint:** `POST /auth/request-code`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Verification code sent to your email",
  "isNewUser": true,
  "role": "patient"
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Valid email is required"
}
```

**Notes:**
- Sends 6-digit code valid for 10 minutes
- Creates new user record if email doesn't exist
- Determines role based on approved doctor emails list
- Rate limited to 5 requests per 15 minutes per IP

---

### 2. Verify Code and Login

Verify the code and authenticate user.

**Endpoint:** `POST /auth/verify-code`

**Request Body:**
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Response (200 OK) - Existing User:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "role": "patient",
    "isVerified": true
  },
  "isNewUser": false,
  "profileCompleted": true,
  "profileData": { ... },
  "requiresOnboarding": false
}
```

**Response (200 OK) - New User:**
```json
{
  "success": true,
  "message": "Account created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "newuser@example.com",
    "role": "patient",
    "isVerified": true
  },
  "isNewUser": true,
  "profileCompleted": false,
  "profileData": null,
  "requiresOnboarding": true
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Invalid or expired verification code"
}
```

**Notes:**
- Code is single-use and expires after 10 minutes
- Returns JWT token for subsequent authenticated requests
- Creates patient/doctor profile skeleton for new users
- Token expires in 7 days by default

---

### 3. Resend Verification Code

Request a new verification code.

**Endpoint:** `POST /auth/resend-code`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
Same as `/auth/request-code`

**Notes:**
- Previous codes remain valid until expiration
- Subject to same rate limiting as request-code

---

### 4. Complete Patient Profile

Complete profile after initial signup (requires authentication).

**Endpoint:** `POST /auth/complete-patient-profile`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-01-15",
  "gender": "male",
  "phoneNumber": "+1234567890",
  "emergencyContact": {
    "name": "Jane Doe",
    "relationship": "Spouse",
    "phoneNumber": "+1234567891"
  },
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "primaryConditions": ["Anxiety", "Stress"]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile completed successfully",
  "patient": {
    "userId": "507f1f77bcf86cd799439011",
    "patientId": "P-2847",
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "1990-01-15T00:00:00.000Z",
    "gender": "male",
    "phoneNumber": "+1234567890",
    "profileCompleted": true,
    "onboardingCompleted": true,
    ...
  }
}
```

**Error Response (403 Forbidden):**
```json
{
  "success": false,
  "message": "Access denied"
}
```

**Required Fields:**
- firstName
- lastName
- dateOfBirth

**Optional Fields:**
- gender
- phoneNumber
- emergencyContact
- address
- primaryConditions

---

### 5. Complete Doctor Profile

Complete profile after initial signup (requires authentication).

**Endpoint:** `POST /auth/complete-doctor-profile`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "firstName": "Sarah",
  "lastName": "Mitchell",
  "title": "Dr.",
  "specialty": "Clinical Psychology",
  "subSpecialties": ["Anxiety Disorders", "CBT"],
  "licenseNumber": "PSY12345",
  "licenseState": "CA",
  "licenseExpiryDate": "2025-12-31",
  "phoneNumber": "+1234567890",
  "bio": "Experienced psychologist specializing in anxiety and stress management...",
  "yearsOfExperience": 10,
  "education": [
    {
      "degree": "Ph.D. in Clinical Psychology",
      "institution": "Stanford University",
      "year": 2013
    }
  ],
  "certifications": [
    {
      "name": "Board Certified in Clinical Psychology",
      "issuingOrganization": "ABPP",
      "issueDate": "2014-06-15",
      "expiryDate": "2024-06-15"
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile completed successfully. Awaiting admin approval.",
  "doctor": {
    "userId": "507f1f77bcf86cd799439012",
    "doctorId": "D-1847",
    "firstName": "Sarah",
    "lastName": "Mitchell",
    "title": "Dr.",
    "specialty": "Clinical Psychology",
    "licenseNumber": "PSY12345",
    "profileCompleted": true,
    "isApproved": false,
    ...
  }
}
```

**Required Fields:**
- firstName
- lastName
- specialty
- licenseNumber

**Optional Fields:**
- title
- subSpecialties
- licenseState
- licenseExpiryDate
- phoneNumber
- bio
- yearsOfExperience
- education
- certifications

**Notes:**
- Doctor accounts require admin approval before activation
- Email notification sent to admin upon profile completion
- Doctor receives email when approved

---

### 6. Logout

Invalidate current session.

**Endpoint:** `POST /auth/logout`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Notes:**
- In production, add token to blacklist or invalidate in Redis
- Client should clear local storage

---

## Patient Endpoints

Base URL: `/api/patient`

### Get Patient Profile

**Endpoint:** `GET /patient/profile`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "patient": {
    "userId": "507f1f77bcf86cd799439011",
    "patientId": "P-2847",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "dateOfBirth": "1990-01-15T00:00:00.000Z",
    "gender": "male",
    "phoneNumber": "+1234567890",
    "assignedDoctor": {
      "doctorId": "D-1847",
      "name": "Dr. Sarah Mitchell",
      "specialty": "Clinical Psychology"
    },
    ...
  }
}
```

---

### Update Patient Profile

**Endpoint:** `PUT /patient/profile`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "phoneNumber": "+1234567899",
  "address": {
    "city": "Los Angeles",
    "state": "CA"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "patient": { ... }
}
```

---

### Get Upcoming Sessions

**Endpoint:** `GET /patient/sessions?status=scheduled`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `status`: Filter by status (scheduled, completed, cancelled)
- `limit`: Number of results (default: 10)
- `skip`: Pagination offset (default: 0)

**Response (200 OK):**
```json
{
  "success": true,
  "sessions": [
    {
      "sessionId": "SES-123",
      "doctorId": "D-1847",
      "doctorName": "Dr. Sarah Mitchell",
      "scheduledDate": "2026-02-01T14:00:00.000Z",
      "duration": 50,
      "type": "follow-up",
      "mode": "video",
      "status": "scheduled",
      "checkInCompleted": true,
      "videoRoomUrl": "https://meet.jit.si/mindflow-p-2847"
    }
  ],
  "total": 5,
  "page": 1
}
```

---

## Doctor Endpoints

Base URL: `/api/doctor`

### Get Doctor Profile

**Endpoint:** `GET /doctor/profile`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "doctor": {
    "userId": "507f1f77bcf86cd799439012",
    "doctorId": "D-1847",
    "firstName": "Sarah",
    "lastName": "Mitchell",
    "email": "dr.mitchell@example.com",
    "specialty": "Clinical Psychology",
    "licenseNumber": "PSY12345",
    "bio": "...",
    "isApproved": true,
    ...
  }
}
```

---

### Get Assigned Patients

**Endpoint:** `GET /doctor/patients`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "patients": [
    {
      "patientId": "P-2847",
      "name": "Alex Morgan",
      "condition": "Anxiety & Stress",
      "nextSession": "2026-02-01T14:00:00.000Z",
      "lastSession": "2026-01-25T14:00:00.000Z",
      "totalSessions": 8,
      "progress": "improving"
    }
  ]
}
```

---

### Get Today's Schedule

**Endpoint:** `GET /doctor/schedule?date=2026-02-01`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `date`: Date in YYYY-MM-DD format (default: today)

**Response (200 OK):**
```json
{
  "success": true,
  "sessions": [
    {
      "sessionId": "SES-123",
      "patientId": "P-2847",
      "patientName": "Alex Morgan",
      "scheduledDate": "2026-02-01T14:00:00.000Z",
      "duration": 50,
      "type": "follow-up",
      "status": "scheduled",
      "checkInStatus": "completed",
      "checkInData": {
        "mood": 6,
        "concern": "Work/School",
        "severity": 3
      }
    }
  ]
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| `/auth/request-code` | 5 per 15 minutes |
| `/auth/verify-code` | 10 per 15 minutes |
| All other endpoints | 100 per 15 minutes |

---

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

Tokens are obtained through the `/auth/verify-code` endpoint and are valid for 7 days.

---

## Data Models

### User
```typescript
{
  _id: ObjectId,
  email: string,
  role: 'patient' | 'doctor' | 'admin',
  isVerified: boolean,
  isActive: boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Patient
```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  patientId: string, // e.g., "P-2847"
  firstName: string,
  lastName: string,
  dateOfBirth: Date,
  gender: string,
  phoneNumber: string,
  address: {
    street: string,
    city: string,
    state: string,
    zipCode: string,
    country: string
  },
  emergencyContact: {
    name: string,
    relationship: string,
    phoneNumber: string
  },
  primaryConditions: string[],
  assignedDoctor: ObjectId,
  profileCompleted: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Doctor
```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  doctorId: string, // e.g., "D-1847"
  firstName: string,
  lastName: string,
  title: string,
  specialty: string,
  subSpecialties: string[],
  licenseNumber: string,
  licenseState: string,
  phoneNumber: string,
  bio: string,
  yearsOfExperience: number,
  isApproved: boolean,
  profileCompleted: boolean,
  createdAt: Date,
  updatedAt: Date
}
```