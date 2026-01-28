# MindFlow Wellness App - Authentication Setup Guide

## Overview

This guide will help you set up the complete authentication system for the MindFlow wellness app with email-based passwordless login, MongoDB integration, and role-based access.

## Architecture

### Authentication Flow

1. **Email Request**: User enters email → System sends 6-digit verification code
2. **Code Verification**: User enters code → System creates/authenticates user
3. **Profile Completion**: New users complete their profile (Patient or Doctor)
4. **Dashboard Access**: Authenticated users access role-specific dashboards

### User Roles

- **Patient**: Regular users seeking therapy
- **Doctor**: Healthcare providers (requires approval)
- **Admin**: System administrators (manual setup)

## Setup Instructions

### 1. Prerequisites

```bash
# Required software
- Node.js 18+ 
- MongoDB 6+
- npm or yarn
```

### 2. Install Dependencies

```bash
npm install express mongoose jsonwebtoken bcrypt
npm install @sendgrid/mail nodemailer
npm install cors dotenv helmet
npm install react react-dom lucide-react
```

### 3. Environment Variables

Create a `.env` file in your project root:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/mindflow
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mindflow

# JWT Secret (generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Email Service (SendGrid)
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=noreply@mindflow.app

# Alternative: Use Nodemailer with Gmail/SMTP
# EMAIL_SERVICE=gmail
# EMAIL_USER=your-email@gmail.com
# EMAIL_PASSWORD=your-app-password

# Pre-approved Doctor Emails (comma-separated)
APPROVED_DOCTOR_EMAILS=doctor1@example.com,doctor2@example.com,dr.smith@clinic.com

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Session Configuration
SESSION_EXPIRY=7d

# Rate Limiting
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION=15
```

### 4. Project Structure

```
wellness-app/
├── server/
│   ├── models/
│   │   ├── User.js
│   │   ├── Patient.js
│   │   ├── Doctor.js
│   │   ├── VerificationCode.js
│   │   ├── Session.js
│   │   └── index.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── patient.js
│   │   ├── doctor.js
│   │   └── admin.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── validation.js
│   │   └── rateLimit.js
│   ├── services/
│   │   ├── emailService.js
│   │   ├── tokenService.js
│   │   └── userService.js
│   ├── config/
│   │   └── database.js
│   └── server.js
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   │   ├── AuthFlow.jsx
│   │   │   │   ├── EmailStep.jsx
│   │   │   │   ├── CodeStep.jsx
│   │   │   │   └── ProfileStep.jsx
│   │   │   ├── Dashboard/
│   │   │   │   ├── PatientDashboard.jsx
│   │   │   │   └── DoctorDashboard.jsx
│   │   │   └── Shared/
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   └── App.jsx
│   └── package.json
├── .env
├── .gitignore
└── README.md
```

### 5. Database Setup

#### MongoDB Connection

```javascript
// server/config/database.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✓ MongoDB connected successfully');
  } catch (error) {
    console.error('✗ MongoDB connection failed:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
```

#### Initialize Database Indexes

```javascript
// Run once to create indexes
const { User, Patient, Doctor, VerificationCode } = require('./models');

async function setupIndexes() {
  await User.createIndexes();
  await Patient.createIndexes();
  await Doctor.createIndexes();
  await VerificationCode.createIndexes();
  console.log('✓ Database indexes created');
}
```

### 6. Server Setup

```javascript
// server/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const connectDB = require('./config/database');
const authRoutes = require('./routes/auth');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
});
```

### 7. Email Service Setup

#### Option A: SendGrid (Recommended for Production)

1. Sign up at https://sendgrid.com
2. Create an API key
3. Add to `.env`: `SENDGRID_API_KEY=your-key`
4. Verify sender email in SendGrid dashboard

#### Option B: Gmail with Nodemailer (Development)

```javascript
// Alternative email service using Gmail
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD // Use App Password, not regular password
  }
});

async function sendEmail({ to, subject, html }) {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html
  });
}
```

### 8. Frontend Integration

```javascript
// client/src/App.jsx
import React, { useState, useEffect } from 'react';
import AuthFlow from './components/Auth/AuthFlow';
import PatientDashboard from './components/Dashboard/PatientDashboard';
import DoctorDashboard from './components/Dashboard/DoctorDashboard';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('userRole');
    
    if (token && role) {
      // Verify token with backend
      verifyToken(token).then(valid => {
        if (valid) {
          setIsAuthenticated(true);
          setUserRole(role);
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const handleAuthComplete = (data) => {
    setIsAuthenticated(true);
    setUserRole(data.user.role);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    setIsAuthenticated(false);
    setUserRole(null);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <AuthFlow onAuthComplete={handleAuthComplete} />;
  }

  return (
    <>
      {userRole === 'patient' && <PatientDashboard onLogout={handleLogout} />}
      {userRole === 'doctor' && <DoctorDashboard onLogout={handleLogout} />}
    </>
  );
}

async function verifyToken(token) {
  try {
    const response = await fetch('/api/auth/verify', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.ok;
  } catch {
    return false;
  }
}

export default App;
```

## Security Best Practices

### 1. JWT Token Security

```javascript
// Use strong secret (32+ characters, random)
// Rotate secrets periodically
// Store securely (environment variables, not in code)

// Add token expiration
const token = jwt.sign(payload, secret, { 
  expiresIn: '7d',
  issuer: 'mindflow',
  audience: 'mindflow-users'
});
```

### 2. Rate Limiting

```javascript
// server/middleware/rateLimit.js
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many attempts, please try again later'
});

// Apply to auth routes
app.use('/api/auth/request-code', authLimiter);
```

### 3. Input Validation

```javascript
// server/middleware/validation.js
const { body, validationResult } = require('express-validator');

const validateEmail = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .toLowerCase(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];
```

### 4. HTTPS Only (Production)

```javascript
// Force HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

## Testing

### Manual Testing Checklist

- [ ] Email delivery works
- [ ] Verification codes expire after 10 minutes
- [ ] Used codes cannot be reused
- [ ] New patient accounts created correctly
- [ ] Doctor accounts require approval
- [ ] JWT tokens are valid
- [ ] Protected routes reject invalid tokens
- [ ] Profile completion works
- [ ] Role-based routing works

### Automated Tests

```javascript
// tests/auth.test.js
const request = require('supertest');
const app = require('../server/server');

describe('Authentication', () => {
  test('POST /api/auth/request-code - valid email', async () => {
    const res = await request(app)
      .post('/api/auth/request-code')
      .send({ email: 'test@example.com' });
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('POST /api/auth/verify-code - valid code', async () => {
    // Test implementation
  });
});
```

## Deployment

### Environment Setup

1. **Production Database**: Use MongoDB Atlas or managed MongoDB
2. **Email Service**: Configure SendGrid with proper sender domain
3. **Environment Variables**: Set all production values
4. **SSL Certificate**: Use Let's Encrypt or cloud provider SSL
5. **Domain**: Configure DNS and CORS settings

### Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong `JWT_SECRET`
- [ ] Configure production MongoDB URI
- [ ] Set up SendGrid with verified domain
- [ ] Enable HTTPS
- [ ] Configure CORS for production domain
- [ ] Set up monitoring/logging
- [ ] Configure backup strategy
- [ ] Test email delivery
- [ ] Test authentication flow end-to-end

## Troubleshooting

### Common Issues

**1. Emails not sending**
- Check SendGrid API key
- Verify sender email is verified in SendGrid
- Check spam folder
- Review SendGrid dashboard for errors

**2. MongoDB connection fails**
- Verify MongoDB is running
- Check connection string
- Ensure network access (firewall, IP whitelist for Atlas)

**3. JWT tokens invalid**
- Ensure JWT_SECRET is consistent
- Check token expiration
- Verify token format (Bearer <token>)

**4. CORS errors**
- Configure CORS middleware correctly
- Set proper `FRONTEND_URL`
- Enable credentials if needed

## Next Steps

1. Implement password reset flow (if needed)
2. Add two-factor authentication (optional)
3. Set up session management with Redis
4. Implement admin dashboard for doctor approvals
5. Add audit logging
6. Set up monitoring and alerts
7. Configure automated backups

## Support

For questions or issues:
- Email: dev@mindflow.app
- Documentation: https://docs.mindflow.app
- GitHub: https://github.com/mindflow/wellness-app