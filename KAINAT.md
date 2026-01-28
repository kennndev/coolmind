# 🧠 MindFlow - Next.js Project Documentation

> **Made with 💜 by Kainat** | Last Updated: January 27, 2026
> **Framework:** Next.js 14 (App Router) 🚀

---

## 📚 Table of Contents

1. [What is MindFlow?](#what-is-mindflow)
2. [Why Next.js?](#why-nextjs)
3. [Project Structure](#project-structure)
4. [Technologies Used](#technologies-used)
5. [How Authentication Works](#how-authentication-works)
6. [API Routes Explained](#api-routes-explained)
7. [Database Models](#database-models)
8. [Components](#components)
9. [How to Run the Project](#how-to-run-the-project)
10. [Important Files](#important-files)
11. [Environment Variables](#environment-variables)

---

## 🎯 What is MindFlow?

**MindFlow** is a **mental wellness platform** built with **Next.js 14** that connects **patients** with **doctors** (therapists/counselors) for online therapy sessions.

### Key Features:
- 🔐 **Passwordless Login** - Email + verification code (no passwords!)
- 👥 **Two User Types** - Patients and Doctors
- 📹 **Video Therapy Sessions** - Virtual appointments
- ✅ **Pre-Session Check-ins** - Patients share mood before sessions
- 📝 **Session Notes** - Doctors track therapy progress
- 🎯 **Wellness Resources** - Breathing exercises, positive messages

---

## 🚀 Why Next.js?

### **Before (React + Vite + Express):**
```
❌ Two separate servers (frontend + backend)
❌ Complex proxy configuration
❌ More deployment steps
❌ Manual route setup
```

### **After (Next.js 14):**
```
✅ One server for everything!
✅ API routes built-in (app/api/)
✅ File-based routing
✅ Simpler deployment
✅ Better SEO with SSR
✅ Faster development
```

### **The Magic of Next.js:**
- **No separate Express server needed!** API routes live in `app/api/`
- **File = Route:** `app/api/auth/login/route.js` → `/api/auth/login`
- **One command:** `npm run dev` starts everything
- **One port:** Everything runs on `localhost:3000`

---

## 📁 Project Structure

```
mindflow-preview/
│
├── 🎨 APP DIRECTORY (Next.js App Router)
│   ├── app/
│   │   ├── api/                      # 🌟 Backend API Routes
│   │   │   ├── auth/                 # Authentication endpoints
│   │   │   │   ├── request-code/
│   │   │   │   │   └── route.js     # POST /api/auth/request-code
│   │   │   │   ├── verify-code/
│   │   │   │   │   └── route.js     # POST /api/auth/verify-code
│   │   │   │   ├── verify-token/
│   │   │   │   │   └── route.js     # POST /api/auth/verify-token
│   │   │   │   ├── complete-patient-profile/
│   │   │   │   │   └── route.js     # POST /api/auth/complete-patient-profile
│   │   │   │   ├── complete-doctor-profile/
│   │   │   │   │   └── route.js     # POST /api/auth/complete-doctor-profile
│   │   │   │   ├── logout/
│   │   │   │   │   └── route.js     # POST /api/auth/logout
│   │   │   │   └── resend-code/
│   │   │   │       └── route.js     # POST /api/auth/resend-code
│   │   │   │
│   │   │   ├── doctor/               # Doctor endpoints
│   │   │   │   ├── profile/
│   │   │   │   │   └── route.js     # GET/PUT /api/doctor/profile
│   │   │   │   ├── patients/
│   │   │   │   │   └── route.js     # GET /api/doctor/patients
│   │   │   │   └── schedule/
│   │   │   │       └── route.js     # GET /api/doctor/schedule
│   │   │   │
│   │   │   └── patient/              # Patient endpoints (coming soon)
│   │   │       ├── profile/
│   │   │       ├── sessions/
│   │   │       └── check-in/
│   │   │
│   │   ├── layout.js                 # Root layout (wraps all pages)
│   │   ├── page.js                   # Home page (/)
│   │   └── globals.css               # Global styles
│   │
│
├── 🧩 COMPONENTS (React Components)
│   └── components/
│       ├── AuthFlow.jsx              # Email/code/profile screens
│       ├── WellnessApp.jsx           # Doctor dashboard
│       └── ... (other components)
│
├── 📚 LIB (Utility Functions)
│   └── lib/
│       ├── db.js                     # MongoDB connection
│       ├── models.js                 # Mongoose schemas
│       ├── auth.js                   # JWT helpers
│       ├── emailService.js           # Email sending (Resend)
│       ├── helpers.js                # Helper functions
│       └── api.js                    # API client functions
│
├── 📦 CONFIGURATION
│   ├── next.config.js                # Next.js configuration
│   ├── tailwind.config.js            # Tailwind CSS config
│   ├── postcss.config.js             # PostCSS config
│   ├── package.json                  # Dependencies
│   └── .env.local                    # Environment variables
│
└── 📚 DOCUMENTATION
    ├── KAINAT.md                     # This file! 📖
    ├── QUICK-START.md
    └── PROJECT-STRUCTURE.md
```

---

## 🛠️ Technologies Used

### **Framework & Core**

| Technology | Version | Purpose | Why We Use It |
|------------|---------|---------|---------------|
| **Next.js** | 14.2 | Full-stack framework | ⭐ API routes + React in one! |
| **React** | 18.3 | UI Library | Interactive components |
| **Node.js** | Latest | Runtime | Runs JavaScript everywhere |

### **Styling**

| Technology | Purpose |
|------------|---------|
| **Tailwind CSS** | Utility-first CSS framework |
| **PostCSS** | CSS processing |
| **Autoprefixer** | Browser compatibility |

### **Database & Auth**

| Technology | Purpose |
|------------|---------|
| **MongoDB** | NoSQL database (cloud) |
| **Mongoose** | MongoDB object modeling |
| **JWT** | Token-based authentication |

### **Services**

| Technology | Purpose |
|------------|---------|
| **Resend** | Email service (verification codes) |
| **Lucide React** | Icon library |

---

## 🔐 How Authentication Works

MindFlow uses **passwordless authentication** - no passwords needed!

### Step-by-Step Process:

```
1️⃣ User enters email on home page
   ↓
2️⃣ Next.js API: app/api/auth/request-code/route.js
   ↓
3️⃣ Generate 6-digit code (123456)
   ↓
4️⃣ Save code to MongoDB (expires in 10 minutes)
   ↓
5️⃣ Send email via Resend
   ↓
6️⃣ User enters code
   ↓
7️⃣ Next.js API: app/api/auth/verify-code/route.js
   ↓
8️⃣ Verify code from database
   ↓
9️⃣ Create/find user in MongoDB
   ↓
🔟 Generate JWT token (expires in 7 days)
   ↓
1️⃣1️⃣ Return token to frontend
   ↓
1️⃣2️⃣ Store in localStorage
   ↓
1️⃣3️⃣ User logged in! 🎉
```

### Authentication Files:

```javascript
// lib/auth.js
export function generateToken(user) {
  // Creates JWT token
}

export function verifyToken(token) {
  // Verifies JWT token
}

// app/api/auth/request-code/route.js
export async function POST(request) {
  // Send verification code
}

// app/api/auth/verify-code/route.js
export async function POST(request) {
  // Verify code and login
}
```

---

## 🛣️ API Routes Explained

### **How Next.js API Routes Work:**

In Next.js, **folders = routes**!

```
app/api/auth/request-code/route.js
           ↓         ↓
    /api/auth/request-code
```

**File structure = URL structure!** 🎯

---

### 🔑 **Authentication Routes** (`/api/auth`)

| File Path | HTTP Method | Endpoint | What It Does |
|-----------|-------------|----------|--------------|
| `app/api/auth/request-code/route.js` | POST | `/api/auth/request-code` | Send verification code to email |
| `app/api/auth/verify-code/route.js` | POST | `/api/auth/verify-code` | Verify code and login user |
| `app/api/auth/verify-token/route.js` | POST | `/api/auth/verify-token` | Check if JWT token is valid |
| `app/api/auth/complete-patient-profile/route.js` | POST | `/api/auth/complete-patient-profile` | Complete patient profile |
| `app/api/auth/complete-doctor-profile/route.js` | POST | `/api/auth/complete-doctor-profile` | Complete doctor profile |
| `app/api/auth/logout/route.js` | POST | `/api/auth/logout` | Logout user |
| `app/api/auth/resend-code/route.js` | POST | `/api/auth/resend-code` | Resend verification code |

#### **Example: Request Code Endpoint**

```javascript
// app/api/auth/request-code/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { generateCode } from '@/lib/helpers';
import { sendEmail } from '@/lib/emailService';

export async function POST(request) {
  try {
    const { email } = await request.json();

    // Connect to database
    await connectDB();

    // Generate 6-digit code
    const code = generateCode();

    // Save to database
    await VerificationCode.create({
      email,
      code,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    // Send email
    await sendEmail(email, code);

    return NextResponse.json({
      success: true,
      message: 'Verification code sent'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
```

**How to call it from frontend:**
```javascript
const response = await fetch('/api/auth/request-code', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com' })
});

const data = await response.json();
```

---

### 👨‍⚕️ **Doctor Routes** (`/api/doctor`)

| File Path | HTTP Method | Endpoint | Access |
|-----------|-------------|----------|--------|
| `app/api/doctor/profile/route.js` | GET | `/api/doctor/profile` | Doctors only |
| `app/api/doctor/profile/route.js` | PUT | `/api/doctor/profile` | Doctors only |
| `app/api/doctor/patients/route.js` | GET | `/api/doctor/patients` | Doctors only |
| `app/api/doctor/schedule/route.js` | GET | `/api/doctor/schedule` | Doctors only |

#### **Example: Get Doctor Profile**

```javascript
// app/api/doctor/profile/route.js
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { Doctor } from '@/lib/models';

export async function GET(request) {
  try {
    // Get token from header
    const token = request.headers.get('authorization')?.split(' ')[1];

    // Verify token
    const decoded = verifyToken(token);

    if (!decoded || decoded.role !== 'doctor') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get doctor profile
    const doctor = await Doctor.findOne({ userId: decoded.id });

    return NextResponse.json({
      success: true,
      doctor
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  // Update doctor profile
}
```

---

### 🧑‍🦰 **Patient Routes** (`/api/patient`)

| Endpoint | Method | What It Does |
|----------|--------|--------------|
| `/api/patient/profile` | GET | Get patient profile |
| `/api/patient/profile` | PUT | Update profile |
| `/api/patient/sessions` | GET | Get therapy sessions |
| `/api/patient/check-in/:id` | POST | Submit check-in |

**Note:** Patient routes follow the same pattern as doctor routes!

---

## 💾 Database Models

### **Database Structure:**

```
MongoDB (Cloud Database)
│
├── 👤 users                 # Basic authentication
│   └── email, role, verified, lastLogin
│
├── 🔢 verificationcodes     # Login codes (10 min expiry)
│   └── email, code, expiresAt, used
│
├── 🧑‍🦰 patients              # Patient profiles
│   └── name, DOB, conditions, assignedDoctor
│
├── 👨‍⚕️ doctors                # Doctor profiles
│   └── name, specialty, license, approved
│
├── 📅 sessions              # Therapy appointments
│   └── patient, doctor, date, status, videoUrl
│
├── ✅ checkins              # Pre-session mood data
│   └── mood, concern, severity, note
│
└── 📝 sessionnotes          # Clinical notes
    └── SOAP format, risk assessment
```

---

### **1️⃣ User Model** (👤 Basic Auth)

```javascript
// lib/models.js
const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  role: {
    type: String,
    enum: ['patient', 'doctor', 'admin'],
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});
```

**Example data:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "email": "kainat@example.com",
  "role": "patient",
  "isVerified": true,
  "lastLogin": "2026-01-27T10:30:00Z",
  "createdAt": "2026-01-15T08:00:00Z"
}
```

---

### **2️⃣ Patient Model** (🧑‍🦰 Patient Profile)

```javascript
const PatientSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  patientId: {
    type: String,    // P-1234
    required: true,
    unique: true
  },
  firstName: String,
  lastName: String,
  dateOfBirth: Date,
  gender: String,
  primaryConditions: [String],  // ['Anxiety', 'Stress']
  assignedDoctor: {
    type: Schema.Types.ObjectId,
    ref: 'Doctor'
  },
  profileCompleted: {
    type: Boolean,
    default: false
  }
});
```

---

### **3️⃣ Doctor Model** (👨‍⚕️ Doctor Profile)

```javascript
const DoctorSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorId: {
    type: String,    // D-5678
    required: true,
    unique: true
  },
  firstName: String,
  lastName: String,
  specialty: String,
  licenseNumber: String,
  yearsOfExperience: Number,
  bio: String,
  isApproved: {
    type: Boolean,
    default: false
  },
  profileCompleted: {
    type: Boolean,
    default: false
  }
});
```

---

### **Database Connection:**

```javascript
// lib/db.js
import mongoose from 'mongoose';

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose
      .connect(process.env.MONGODB_URI, opts)
      .then((mongoose) => mongoose);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
```

**Why this pattern?**
- ✅ Reuses connection across API routes
- ✅ Prevents connection limit errors
- ✅ Faster API responses
- ✅ Next.js serverless-friendly

---

## 🧩 Components

### **Main Components:**

```
components/
├── AuthFlow.jsx           # Email → Code → Profile screens
├── WellnessApp.jsx        # Doctor dashboard
└── ... (other components)
```

### **AuthFlow Component:**

Handles the 3-step authentication:

1. **Step 1:** Email input
2. **Step 2:** Code verification
3. **Step 3:** Profile completion

```javascript
// components/AuthFlow.jsx
export default function AuthFlow({ onLogin }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');

  // Step 1: Request code
  const handleRequestCode = async () => {
    const response = await fetch('/api/auth/request-code', {
      method: 'POST',
      body: JSON.stringify({ email })
    });

    if (response.ok) {
      setStep(2); // Move to code input
    }
  };

  // Step 2: Verify code
  const handleVerifyCode = async (code) => {
    const response = await fetch('/api/auth/verify-code', {
      method: 'POST',
      body: JSON.stringify({ email, code })
    });

    const data = await response.json();

    if (data.requiresOnboarding) {
      setStep(3); // Move to profile completion
    } else {
      onLogin(data.token, data.user);
    }
  };

  return (
    <div>
      {step === 1 && <EmailInput onSubmit={handleRequestCode} />}
      {step === 2 && <CodeInput onSubmit={handleVerifyCode} />}
      {step === 3 && <ProfileForm />}
    </div>
  );
}
```

---

## 🚀 How to Run the Project

### **Prerequisites:**
- Node.js 18+ installed
- MongoDB account (Atlas recommended)
- Resend account for emails

---

### **Step 1: Install Dependencies**
```bash
npm install
```

This installs:
- Next.js 14
- React 18
- MongoDB (Mongoose)
- JWT, Resend, Tailwind CSS, etc.

---

### **Step 2: Setup Environment Variables**

Create `.env.local` file:

```env
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mindflow

# JWT Secret
JWT_SECRET=your-super-secret-key-change-this-in-production

# Email Service (Resend)
RESEND_API_KEY=re_your_resend_api_key
FROM_EMAIL=onboarding@resend.dev
EMAIL_SERVICE=resend

# Pre-approved Doctor Emails
APPROVED_DOCTOR_EMAILS=kainatalikhosa@gmail.com,doctor2@example.com

# Next.js
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**Important:** Never commit `.env.local` to Git!

---

### **Step 3: Run Development Server**
```bash
npm run dev
```

This starts:
- ✅ Next.js server on **http://localhost:3000**
- ✅ Frontend pages
- ✅ API routes
- ✅ Hot reload for changes

**That's it! Everything runs on ONE port!** 🎉

---

### **Step 4: Test the App**

1. **Open browser:** http://localhost:3000
2. **Enter email:** kainatalikhosa@gmail.com
3. **Check email** for 6-digit code
4. **Enter code** to login
5. **Complete profile** if new user
6. **Access dashboard!** 🎉

---

### **Step 5: Test API Endpoints**

Using Postman or curl:

```bash
# Test health check
curl http://localhost:3000/api/health

# Request verification code
curl -X POST http://localhost:3000/api/auth/request-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Verify code
curl -X POST http://localhost:3000/api/auth/verify-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","code":"123456"}'
```

---

## 📄 Important Files

### **Next.js Configuration:**

| File | Purpose |
|------|---------|
| `next.config.js` | Next.js configuration, environment variables |
| `app/layout.js` | Root layout (wraps all pages) |
| `app/page.js` | Home page (/) |
| `app/globals.css` | Global CSS styles |

### **Library Files:**

| File | Purpose |
|------|---------|
| `lib/db.js` | MongoDB connection |
| `lib/models.js` | Mongoose schemas (User, Patient, Doctor, etc.) |
| `lib/auth.js` | JWT token generation and verification |
| `lib/emailService.js` | Email sending via Resend |
| `lib/helpers.js` | Helper functions (generateCode, generateId, etc.) |
| `lib/api.js` | API client functions for frontend |

### **API Routes:**

| File | Endpoint |
|------|----------|
| `app/api/auth/request-code/route.js` | `/api/auth/request-code` |
| `app/api/auth/verify-code/route.js` | `/api/auth/verify-code` |
| `app/api/doctor/profile/route.js` | `/api/doctor/profile` |
| And more... | (see structure above) |

---

## 🔧 Environment Variables

### **What are Environment Variables?**
Secret settings that should NOT be shared publicly (like passwords for your app).

### **Variables Explained:**

| Variable | What It Is | Example |
|----------|------------|---------|
| `MONGODB_URI` | Database connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Secret key for JWT tokens | `kainatisgreat` |
| `RESEND_API_KEY` | Email service API key | `re_abc123...` |
| `FROM_EMAIL` | Email sender address | `onboarding@resend.dev` |
| `APPROVED_DOCTOR_EMAILS` | Pre-approved doctor emails | `doc1@ex.com,doc2@ex.com` |
| `NEXT_PUBLIC_API_URL` | Frontend API URL | `http://localhost:3000` |

**⚠️ Important:**
- Never commit `.env.local` to Git!
- Use different values for production
- Keep secrets secret!

---

## 🔄 How Requests Flow in Next.js

### **Example: User Login Flow**

```
1. User enters email on homepage
   ↓ (app/page.js)

2. Frontend calls API route
   fetch('/api/auth/request-code', {...})
   ↓

3. Next.js routes to API handler
   app/api/auth/request-code/route.js
   ↓

4. API handler processes request
   - Connects to MongoDB (lib/db.js)
   - Generates code (lib/helpers.js)
   - Saves to database (lib/models.js)
   - Sends email (lib/emailService.js)
   ↓

5. Returns response to frontend
   NextResponse.json({ success: true })
   ↓

6. Frontend updates UI
   Show "Code sent!" message
```

**All in ONE server!** No separate backend! 🎉

---

## 🎯 Key Differences from Express

### **Express (Old Way):**
```javascript
// server/index.js
const express = require('express');
const app = express();

app.post('/api/auth/request-code', async (req, res) => {
  // Handle request
  res.json({ success: true });
});

app.listen(5000); // Separate server on port 5000
```

### **Next.js (New Way):**
```javascript
// app/api/auth/request-code/route.js
export async function POST(request) {
  // Handle request
  return NextResponse.json({ success: true });
}

// No server setup needed!
// Runs on same port as frontend (3000)
```

---

## 💡 Next.js Advantages

### **1. File-Based Routing**
```
Folder structure = URL structure
app/api/auth/login/route.js → /api/auth/login
```

### **2. No Proxy Configuration**
```
React + Vite: Need proxy in vite.config.js
Next.js: Frontend and API on same server! ✅
```

### **3. One Command to Run**
```
React + Vite: npm run dev (runs 2 servers)
Next.js: npm run dev (runs 1 server) ✅
```

### **4. Simpler Deployment**
```
React + Vite: Deploy frontend and backend separately
Next.js: Deploy once to Vercel/Netlify ✅
```

### **5. Built-in Features**
```
✅ Server-side rendering (SSR)
✅ Static site generation (SSG)
✅ API routes
✅ Image optimization
✅ Font optimization
✅ And more!
```

---

## 🐛 Common Issues & Solutions

### **Issue 1: MongoDB Connection Error**
```
Error: Could not connect to MongoDB
```
**Solution:** Check your `MONGODB_URI` in `.env.local`

---

### **Issue 2: Email Not Sending**
```
Error: Invalid Resend API key
```
**Solution:** Get a valid API key from resend.com and add to `.env.local`

---

### **Issue 3: Token Expired**
```
Error: JWT token expired
```
**Solution:** Logout and login again (tokens expire after 7 days)

---

### **Issue 4: Port Already in Use**
```
Error: Port 3000 is already in use
```
**Solution:**
```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
npm run dev -- -p 3001
```

---

## 📚 Learning Resources

### **Next.js:**
- Official Docs: https://nextjs.org/docs
- Learn Next.js: https://nextjs.org/learn
- App Router: https://nextjs.org/docs/app

### **MongoDB:**
- MongoDB Docs: https://www.mongodb.com/docs
- Mongoose Guide: https://mongoosejs.com/docs/guide.html

### **Authentication:**
- JWT Introduction: https://jwt.io/introduction
- Next.js Auth: https://nextjs.org/docs/authentication

---

## 🎉 Project Features Summary

✅ **Next.js 14** - Modern full-stack framework
✅ **App Router** - File-based routing for API and pages
✅ **Passwordless Auth** - Email + verification code
✅ **Role-Based Access** - Patients and Doctors
✅ **MongoDB Atlas** - Cloud database
✅ **JWT Tokens** - Secure authentication
✅ **Resend Email** - Professional email delivery
✅ **Tailwind CSS** - Beautiful, responsive design
✅ **One Server** - Frontend + Backend together!

---

## 🎯 npm Scripts

```bash
# Development
npm run dev         # Start dev server (localhost:3000)

# Production
npm run build       # Build for production
npm run start       # Start production server

# Linting
npm run lint        # Check code quality
```

---

## 🚀 Deployment

### **Deploy to Vercel (Recommended):**

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_GITHUB_REPO
git push -u origin main
```

2. **Connect to Vercel**
- Go to vercel.com
- Click "Import Project"
- Select your GitHub repo
- Add environment variables
- Deploy! 🎉

3. **Add Environment Variables in Vercel:**
- `MONGODB_URI`
- `JWT_SECRET`
- `RESEND_API_KEY`
- `FROM_EMAIL`
- `APPROVED_DOCTOR_EMAILS`

**That's it!** Your app is live! 🌐

---

## 💡 Pro Tips

1. **Use Next.js Server Actions** for forms (even simpler than API routes!)
2. **Use `use client`** directive for client-side components
3. **Use `use server`** directive for server actions
4. **Check Next.js DevTools** in browser for debugging
5. **Read console logs** - Both client and server logs visible
6. **Use React DevTools** - Inspect React components
7. **Use MongoDB Compass** - View database visually

---

## 🎨 Project Structure Visual

```
Next.js App
│
├── Frontend (Client Components)
│   ├── app/page.js
│   ├── components/AuthFlow.jsx
│   └── components/WellnessApp.jsx
│
├── Backend (API Routes)
│   ├── app/api/auth/*.js
│   ├── app/api/doctor/*.js
│   └── app/api/patient/*.js
│
├── Utilities (Server-Side)
│   ├── lib/db.js
│   ├── lib/models.js
│   └── lib/auth.js
│
└── Configuration
    ├── next.config.js
    ├── tailwind.config.js
    └── .env.local
```

---

## 🌟 Why This Structure is Great

### **1. Organized**
- ✅ Clear separation of concerns
- ✅ Easy to find files
- ✅ Logical grouping

### **2. Scalable**
- ✅ Easy to add new routes
- ✅ Modular design
- ✅ Reusable utilities

### **3. Maintainable**
- ✅ Well-documented
- ✅ Consistent patterns
- ✅ Easy to understand

### **4. Professional**
- ✅ Industry best practices
- ✅ Next.js conventions
- ✅ Production-ready

---

## 📊 Project Stats

- **Framework:** Next.js 14 (App Router)
- **API Routes:** 10+ endpoints
- **Database Models:** 7 collections
- **Components:** 10+ React components
- **Lines of Code:** 3000+
- **Documentation:** Comprehensive!
- **Deployment:** One-click to Vercel

---

## 🎓 What You've Learned

By reading this guide, you now understand:
- ✅ How Next.js combines frontend and backend
- ✅ How API routes work (file = endpoint)
- ✅ How authentication flows work
- ✅ How MongoDB stores data
- ✅ How JWT tokens secure APIs
- ✅ How to structure a Next.js app
- ✅ How to deploy to production

---

## 🎯 Next Steps

1. ✅ Run `npm run dev` and test the app
2. ✅ Read through the API route files
3. ✅ Understand the component structure
4. ✅ Test authentication flow
5. ✅ Add new features!
6. ✅ Deploy to Vercel

---

## 🤝 Contributing

Want to add features?

1. Create a new branch
2. Add your features
3. Test thoroughly
4. Create pull request
5. Celebrate! 🎉

---

<div align="center">

## 💜 Made with Love by Kainat

### **MindFlow - Next.js Mental Wellness Platform**

**Everything in one place. Simple. Clean. Powerful.** ✨

---

### 🚀 **Start building with:**
```bash
npm run dev
```

---

*Happy Coding!* 🎉

**Last Updated:** January 27, 2026
**Version:** 1.0.0 (Next.js Migration Complete!)
**Status:** ✅ Production Ready

</div>
