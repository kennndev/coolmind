# 🚀 MindFlow - Quick Start Guide

## ⚡ Get Started in 3 Minutes!

### Step 1: Install Dependencies ✅ (Already Done!)
```bash
npm install
```

### Step 2: Start the Development Server
```bash
npm run dev
```

This command starts:
- ✅ **Frontend:** http://localhost:5173
- ✅ **Backend:** http://localhost:5000

---

## 🎯 What You'll See

### Terminal Output:
```
[Frontend] VITE v5.4.2  ready in 1234 ms
[Frontend] ➜  Local:   http://localhost:5173/
[Backend]
[Backend]  ╔═══════════════════════════════════════════════════╗
[Backend]  ║                                                   ║
[Backend]  ║   🧠 MindFlow API Server                         ║
[Backend]  ║                                                   ║
[Backend]  ║   Status:      ✓ Running                         ║
[Backend]  ║   Port:        5000                              ║
[Backend]  ║                                                   ║
[Backend]  ╚═══════════════════════════════════════════════════╝
```

---

## 🔍 Test the Setup

### 1. Open Your Browser
Visit: http://localhost:5173

### 2. Test Backend API
Visit: http://localhost:5000/api/health

Should see:
```json
{
  "success": true,
  "message": "MindFlow API is running",
  "timestamp": "2026-01-27T...",
  "environment": "development"
}
```

---

## 📧 Test Login Flow

1. Go to http://localhost:5173
2. Enter email: `kainatalikhosa@gmail.com` (pre-approved doctor)
3. Check terminal for the 6-digit code (since we're in dev mode)
4. Enter the code
5. Complete profile
6. You're in! 🎉

---

## 🎨 Project Structure at a Glance

```
mindflow-preview/
├── src/                    # Frontend React code
│   ├── App.jsx            # Main app
│   ├── AuthFlow.jsx       # Login screens
│   └── WellnessApp.jsx    # Dashboard
│
├── server/                 # Backend Node.js code
│   ├── index.js           # Main server
│   ├── routes/            # API endpoints
│   ├── models/            # Database schemas
│   └── middleware/        # Auth & security
│
├── .env                    # Secret settings
└── KAINAT.md              # 📖 Read this for details!
```

---

## 📚 Available Documentation

| File | What's Inside |
|------|---------------|
| `KAINAT.md` | 🌟 **Start here!** Easy guide with everything |
| `PROJECT-STRUCTURE.md` | Detailed folder structure |
| `SETUP.md` | Full setup instructions |
| `APIDOCS.md` | API documentation |

---

## 🔧 npm Scripts

```bash
npm run dev        # Start both frontend & backend (recommended)
npm run client     # Start only frontend
npm run server     # Start only backend
npm run build      # Build for production
npm run start      # Run production server
```

---

## ⚠️ Common Issues

### Issue: Port Already in Use
```bash
# Kill process on port 5173 (frontend)
npx kill-port 5173

# Kill process on port 5000 (backend)
npx kill-port 5000
```

### Issue: MongoDB Connection Error
Check your `.env` file has correct `MONGODB_URI`

### Issue: Email Not Sending
In development mode, codes are logged to terminal instead of emailed

---

## 🎯 What's Next?

1. ✅ Read `KAINAT.md` for full understanding
2. ✅ Explore the code
3. ✅ Test the API endpoints
4. ✅ Build something awesome!

---

## 💡 Pro Tips

- Check terminal for backend logs
- Check browser console for frontend logs
- Use MongoDB Compass to view database
- Use Postman to test API routes

---

<div align="center">

### 🧠 MindFlow

**Mental Wellness Platform**

Made with 💜 by Kainat

---

*Happy Coding!* ✨

</div>
