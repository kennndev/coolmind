# 🗂️ MindFlow - Project Structure

## 📁 Complete File Structure

```
mindflow-preview/
│
├── 🎨 FRONTEND (React + Vite)
│   │
│   ├── src/                           # Source code
│   │   ├── main.jsx                   # React entry point
│   │   ├── App.jsx                    # Main app component
│   │   ├── AuthFlow.jsx               # Authentication screens
│   │   ├── WellnessApp.jsx            # Doctor dashboard
│   │   ├── api.js                     # API service layer
│   │   └── index.css                  # Global styles
│   │
│   ├── index.html                     # HTML template
│   ├── vite.config.js                 # Vite configuration (with proxy)
│   ├── tailwind.config.cjs            # Tailwind CSS config
│   └── postcss.config.cjs             # PostCSS config
│
├── 🚀 BACKEND (Node.js + Express)
│   │
│   ├── server/                        # Backend root
│   │   │
│   │   ├── index.js                   # ⭐ Main server file
│   │   │
│   │   ├── config/                    # Configuration
│   │   │   └── db.js                  # MongoDB connection
│   │   │
│   │   ├── models/                    # Database schemas
│   │   │   └── index.js               # All Mongoose models
│   │   │
│   │   ├── routes/                    # API endpoints
│   │   │   ├── auth.js                # /api/auth/*
│   │   │   ├── doctor.js              # /api/doctor/*
│   │   │   ├── patient.js             # /api/patient/*
│   │   │   ├── session.js             # /api/sessions/*
│   │   │   └── session-notes.js       # /api/session-notes/*
│   │   │
│   │   ├── middleware/                # Express middleware
│   │   │   └── auth.js                # JWT authentication
│   │   │
│   │   └── services/                  # Business logic
│   │       └── emailService.js        # Email sending (Resend)
│   │
│
├── 📦 CONFIGURATION
│   │
│   ├── package.json                   # Dependencies & scripts
│   ├── .env                           # Environment variables
│   ├── .gitignore                     # Git ignore rules
│   │
│   ├── tailwind.config.cjs            # Tailwind settings
│   ├── postcss.config.cjs             # PostCSS settings
│   └── vite.config.js                 # Vite settings
│
├── 📚 DOCUMENTATION
│   │
│   ├── README.md                      # Main documentation
│   ├── KAINAT.md                      # 🌟 Easy-to-read guide
│   ├── PROJECT-STRUCTURE.md           # This file
│   ├── SETUP.md                       # Setup instructions
│   ├── APIDOCS.md                     # API documentation
│   ├── INTEGRATION-GUIDE.md           # Integration guide
│   └── EMAIL-SERVICES-GUIDE.md        # Email setup guide
│
└── 📦 DEPENDENCIES
    └── node_modules/                  # Installed packages

```

---

## 🔄 Request Flow

### How a Request Travels Through the App:

```
1. User Action (Frontend)
   Browser → src/App.jsx or src/WellnessApp.jsx
   ↓
2. API Call (Frontend)
   src/api.js → Makes HTTP request
   ↓
3. Vite Proxy (Development)
   vite.config.js → Forwards /api/* to localhost:5000
   ↓
4. Express Server (Backend)
   server/index.js → Receives request
   ↓
5. Middleware Check
   server/middleware/auth.js → Verifies JWT token (if needed)
   ↓
6. Route Handler
   server/routes/*.js → Processes request
   ↓
7. Database Query
   server/models/index.js → Mongoose queries MongoDB
   ↓
8. Response
   server/routes/*.js → Sends JSON response
   ↓
9. Frontend Update
   src/api.js → Receives response
   ↓
10. UI Update
    React components → Update display
```

---

## 📂 Folder Purposes

### Frontend Folders:

| Folder | Purpose |
|--------|---------|
| `src/` | All React source code |
| `public/` | Static assets (if any) |

### Backend Folders:

| Folder | Purpose |
|--------|---------|
| `server/` | Backend root directory |
| `server/config/` | Configuration files (DB, etc.) |
| `server/models/` | Database schemas |
| `server/routes/` | API route handlers |
| `server/middleware/` | Express middleware functions |
| `server/services/` | Business logic and external services |

### Configuration Folders:

| Folder | Purpose |
|--------|---------|
| `node_modules/` | Installed npm packages |
| Root `.js` files | Configuration for tools (Vite, Tailwind, etc.) |

---

## 🗺️ Route Structure (Like Next.js)

The backend follows a clean route structure similar to Next.js:

```
/api
├── /auth
│   ├── POST /request-code
│   ├── POST /verify-code
│   ├── POST /verify-token
│   ├── POST /complete-patient-profile
│   ├── POST /complete-doctor-profile
│   └── POST /logout
│
├── /doctor
│   ├── GET /profile
│   ├── PUT /profile
│   ├── GET /patients
│   ├── GET /patients/:id
│   └── GET /schedule
│
├── /patient
│   ├── GET /profile
│   ├── PUT /profile
│   ├── GET /sessions
│   └── POST /check-in/:sessionId
│
├── /sessions
│   ├── GET /
│   ├── GET /:id
│   ├── POST /
│   └── PUT /:id
│
└── /session-notes
    ├── POST /
    ├── GET /:sessionId
    └── PUT /:id
```

---

## 🔧 Configuration Files

### package.json
```json
{
  "scripts": {
    "dev": "concurrently \"npm run server\" \"npm run client\"",
    "client": "vite",
    "server": "nodemon server/index.js",
    "start": "node server/index.js"
  }
}
```

### vite.config.js
```javascript
export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:5000'  // Forwards API calls to backend
    }
  }
})
```

### .env
```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret
RESEND_API_KEY=re_...
PORT=5000
```

---

## 🎯 Key Files Explained

### Frontend Key Files:

| File | Lines | Purpose |
|------|-------|---------|
| `src/main.jsx` | ~15 | React entry point |
| `src/App.jsx` | ~100 | Main app wrapper with auth |
| `src/AuthFlow.jsx` | ~500 | Login/signup screens |
| `src/WellnessApp.jsx` | ~1000 | Doctor dashboard |
| `src/api.js` | ~200 | API service functions |

### Backend Key Files:

| File | Lines | Purpose |
|------|-------|---------|
| `server/index.js` | ~100 | Main server setup |
| `server/config/db.js` | ~30 | MongoDB connection |
| `server/models/index.js` | ~600 | All database schemas |
| `server/routes/auth.js` | ~500 | Authentication logic |
| `server/middleware/auth.js` | ~50 | JWT verification |

---

## 🚦 Startup Order

When you run `npm run dev`:

```
1. Concurrently starts 2 processes:
   │
   ├── Process 1: Frontend (Vite)
   │   └── Runs on http://localhost:5173
   │
   └── Process 2: Backend (Node.js)
       └── Runs on http://localhost:5000

2. Frontend makes API calls to /api/*

3. Vite proxy forwards to localhost:5000/api/*

4. Backend processes and responds

5. Frontend updates UI
```

---

## 📊 Database Collections

MongoDB organizes data into collections (like tables):

```
mindflow Database
│
├── users                    # Basic authentication
├── verificationcodes       # Login codes
├── patients                # Patient profiles
├── doctors                 # Doctor profiles
├── sessions                # Therapy appointments
├── checkins                # Pre-session data
└── sessionnotes            # Clinical notes
```

---

## 🎨 Styling Structure

```
Global Styles
├── index.css (Tailwind directives)
│
Component Styles
└── Inline Tailwind classes in JSX

Example:
<div className="bg-purple-500 text-white p-4 rounded-lg">
  ...
</div>
```

---

## 🔐 Authentication Flow Structure

```
1. User enters email
   → AuthFlow.jsx (Step 1)

2. Call POST /api/auth/request-code
   → api.js → server/routes/auth.js

3. Generate code
   → server/routes/auth.js

4. Save to database
   → server/models/index.js → MongoDB

5. Send email
   → server/services/emailService.js

6. User enters code
   → AuthFlow.jsx (Step 2)

7. Call POST /api/auth/verify-code
   → api.js → server/routes/auth.js

8. Verify code
   → Check database → Create/find user

9. Generate JWT token
   → server/middleware/auth.js

10. Save token to localStorage
    → AuthFlow.jsx

11. Redirect to dashboard
    → App.jsx → WellnessApp.jsx
```

---

## 📝 File Naming Conventions

### Frontend:
- React components: `PascalCase.jsx` (e.g., `AuthFlow.jsx`)
- Utilities: `camelCase.js` (e.g., `api.js`)
- Styles: `kebab-case.css` (e.g., `index.css`)

### Backend:
- Routes: `kebab-case.js` (e.g., `auth-routes.js` → now `auth.js`)
- Models: `PascalCase` or `index.js`
- Config: `camelCase.js` or `kebab-case.js`

---

## 🎯 Important Paths

### Development URLs:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000/api`
- Health Check: `http://localhost:5000/api/health`

### API Base:
- Local: `http://localhost:5173/api` (proxied to :5000)
- Production: `https://yourdomain.com/api`

---

## 🔍 Where to Find Things

### Need to...

**Change a route handler?**
→ `server/routes/*.js`

**Add a database field?**
→ `server/models/index.js`

**Modify authentication?**
→ `server/routes/auth.js` or `server/middleware/auth.js`

**Change UI?**
→ `src/*.jsx`

**Update API calls?**
→ `src/api.js`

**Configure environment?**
→ `.env`

**Change styling?**
→ Tailwind classes in JSX components

**Add email templates?**
→ `server/services/emailService.js` or `server/routes/auth.js`

---

## 📦 Dependencies by Category

### Frontend Dependencies:
```json
{
  "react": "UI library",
  "react-dom": "React DOM bindings",
  "lucide-react": "Icons",
  "vite": "Build tool",
  "tailwindcss": "CSS framework",
  "postcss": "CSS processing",
  "autoprefixer": "CSS vendor prefixes"
}
```

### Backend Dependencies:
```json
{
  "express": "Web framework",
  "mongoose": "MongoDB ODM",
  "jsonwebtoken": "JWT auth",
  "cors": "CORS middleware",
  "dotenv": "Environment variables",
  "resend": "Email service",
  "bcryptjs": "Password hashing (future use)"
}
```

### Development Dependencies:
```json
{
  "nodemon": "Auto-restart server",
  "concurrently": "Run multiple scripts"
}
```

---

## 🎯 Next Steps

After understanding the structure:

1. ✅ Read `KAINAT.md` for detailed explanations
2. ✅ Check `.env` file for configuration
3. ✅ Run `npm run dev` to start both servers
4. ✅ Test API with Postman
5. ✅ Explore the code!

---

<div align="center">

**Made with 💜 by Kainat**

*Clean code, clear structure, happy developers!* ✨

</div>
