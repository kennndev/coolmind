# MindFlow - Next.js Migration

This project has been converted from React + Vite + Express to Next.js.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- MongoDB account (or local MongoDB)
- Resend account for emails (optional for development)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file in the root directory:
```env
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/

# JWT Secret
JWT_SECRET=your-secret-key-here

# Email Service (Resend)
RESEND_API_KEY=re_your_api_key
FROM_EMAIL=onboarding@resend.dev
EMAIL_SERVICE=resend

# Pre-approved Doctor Emails
APPROVED_DOCTOR_EMAILS=doctor1@example.com,doctor2@example.com
```

3. Run the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## 📁 Project Structure

```
mindflow-preview/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   └── auth/         # Authentication endpoints
│   ├── layout.js          # Root layout
│   ├── page.js            # Home page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── AuthFlow.jsx       # Authentication flow
│   └── WellnessApp.jsx    # Doctor dashboard
├── lib/                   # Utility libraries
│   ├── api.js            # API client functions
│   ├── auth.js           # Auth middleware
│   ├── db.js             # Database connection
│   ├── emailService.js   # Email service
│   ├── helpers.js        # Helper functions
│   └── models.js         # Mongoose models
├── next.config.js        # Next.js configuration
├── package.json          # Dependencies
└── tailwind.config.js    # Tailwind CSS config
```

## 🔄 Migration Changes

### Frontend
- ✅ Converted from Vite to Next.js App Router
- ✅ Components moved to `components/` directory
- ✅ API calls updated to use Next.js API routes
- ✅ Client-side code marked with `'use client'` directive

### Backend
- ✅ Express routes converted to Next.js API routes (`app/api/`)
- ✅ Database connection uses Next.js caching pattern
- ✅ Models converted to ES modules
- ✅ Middleware adapted for Next.js Request/Response

### Configuration
- ✅ `package.json` updated with Next.js dependencies
- ✅ `next.config.js` created
- ✅ `tailwind.config.js` updated for Next.js
- ✅ `tsconfig.json` added (optional TypeScript support)

## 📝 API Routes

All API routes are now in `app/api/`:

- `POST /api/auth/request-code` - Request login code
- `POST /api/auth/verify-code` - Verify code and login
- `POST /api/auth/verify-token` - Verify JWT token
- `POST /api/auth/complete-patient-profile` - Complete patient profile
- `POST /api/auth/complete-doctor-profile` - Complete doctor profile
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/resend-code` - Resend verification code
- `GET /api/doctor/profile` - Get doctor profile
- `PUT /api/doctor/profile` - Update doctor profile
- `GET /api/doctor/patients` - Get assigned patients
- `GET /api/doctor/schedule` - Get doctor schedule

## 🛠️ Development

### Build for Production
```bash
npm run build
npm start
```

### Environment Variables
Make sure all environment variables are set in `.env.local` for local development or in your deployment platform's environment settings.

## 📚 Next Steps

1. Complete remaining API routes (patient routes, session routes, etc.)
2. Add TypeScript support (optional)
3. Set up deployment (Vercel, Netlify, etc.)
4. Add error boundaries and loading states
5. Implement server-side rendering where beneficial

## ⚠️ Notes

- The old `server/` directory is kept for reference but is no longer used
- The old `src/` directory is kept for reference but components have been moved
- All API routes now use Next.js App Router conventions
- Database connection uses Next.js caching to prevent multiple connections



