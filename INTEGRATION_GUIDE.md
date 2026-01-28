# Patient Dashboard Integration Guide

## What's Been Done

### ✅ Backend API Routes Created
All these routes are ready and connected to MongoDB:
- `/api/patient/journal` - Journal entries (GET, POST)
- `/api/patient/messages` - Secure messaging (GET, POST)
- `/api/patient/mood` - Mood tracking (GET, POST)
- `/api/patient/check-in` - Pre-session check-ins (GET, POST)
- `/api/patient/doctors` - Find available doctors (GET)
- `/api/patient/appointments` - Schedule/manage appointments (GET, POST, DELETE)
- `/api/patient/profile` - Patient profile (GET, PUT)

### ✅ API Helper Functions Added
File: `lib/api.js`
All patient API methods are ready to use

### ✅ Components Created
1. **JitsiVideoCall.jsx** - Video call integration using Jitsi Meet
2. **PatientDashboardComponents.jsx** - All updated view components:
   - `JournalView` - With real database integration
   - `MessagesView` - With real-time messaging
   - `FindDoctorView` - Doctor selection with stats
   - `DoctorCard` - Individual doctor display
   - `ScheduleAppointmentModal` - Appointment booking
   - `JournalEntryModal` - Create/edit journal entries

## How to Integrate

### Step 1: Update PatientDashboard.jsx Imports

Add these imports at the top:
```javascript
import JitsiVideoCall from './JitsiVideoCall'
import {
  JournalView,
  MessagesView,
  FindDoctorView,
  ScheduleAppointmentModal
} from './PatientDashboardComponents'
```

### Step 2: Update State Variables

Your state has already been updated with:
```javascript
const [journalEntries, setJournalEntries] = useState([])
const [messages, setMessages] = useState([])
const [doctorInfo, setDoctorInfo] = useState(null)
const [conversationId, setConversationId] = useState(null)
const [moodEntries, setMoodEntries] = useState([])
const [moodStats, setMoodStats] = useState(null)
const [doctors, setDoctors] = useState([])
const [scheduleModal, setScheduleModal] = useState(false)
const [selectedDoctor, setSelectedDoctor] = useState(null)
const [videoCall, setVideoCall] = useState(null)
```

### Step 3: Update Navigation Items

Find the `navItems` array and add:
```javascript
{ id: 'find-doctor', icon: Users, label: 'Find Doctor' },
```

Make sure to import Users icon:
```javascript
import { ..., Users } from 'lucide-react'
```

### Step 4: Update renderView() Function

Replace the journal, messages, and sessions view cases:

```javascript
const renderView = () => {
  switch (currentView) {
    case 'home':
      return <HomeView ... />

    case 'sessions':
      return (
        <SessionsView
          upcoming={upcomingSessions}
          past={pastSessions}
          setCheckInModal={setCheckInModal}
          setVideoCall={setVideoCall} // ADD THIS
          user={user}
        />
      )

    case 'find-doctor': // ADD THIS CASE
      return (
        <FindDoctorView
          doctors={doctors}
          onSelectDoctor={(doc) => {
            setSelectedDoctor(doc)
            setScheduleModal(true)
          }}
        />
      )

    case 'messages':
      return (
        <MessagesView
          messages={messages}
          doctorInfo={doctorInfo}
          conversationId={conversationId}
          onMessagesUpdate={loadPatientData}
        />
      )

    case 'journal':
      return (
        <JournalView
          entries={journalEntries}
          onJournalUpdate={loadPatientData}
        />
      )

    // ... rest of cases
  }
}
```

### Step 5: Update SessionCard for Video Calls

Find your `SessionCard` component and add a "Join Video" button for upcoming video sessions:

```javascript
function SessionCard({ session, isPast, onCheckIn, onJoinVideo }) {
  const isUpcoming = !isPast && new Date(session.scheduledDate) > new Date()
  const isToday = new Date(session.scheduledDate).toDateString() === new Date().toDateString()
  const canJoinVideo = session.mode === 'video' && isToday && session.videoRoomUrl

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-violet-100">
      {/* ... existing session info ... */}

      {canJoinVideo && onJoinVideo && (
        <button
          onClick={onJoinVideo}
          className="mt-4 w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all inline-flex items-center justify-center gap-2"
        >
          <Video className="w-4 h-4" />
          Join Video Session
        </button>
      )}
    </div>
  )
}
```

### Step 6: Add Modals to Render

At the end of your main return statement, add the schedule modal and video call:

```javascript
return (
  <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50">
    {/* ... existing header, sidebar, main content ... */}

    {/* Modals */}
    {checkInModal && <CheckInModal ... />}

    {/* ADD THESE: */}
    {scheduleModal && selectedDoctor && (
      <ScheduleAppointmentModal
        doctor={selectedDoctor}
        onClose={() => {
          setScheduleModal(false)
          setSelectedDoctor(null)
        }}
        onScheduled={loadPatientData}
      />
    )}

    {videoCall && (
      <JitsiVideoCall
        roomId={videoCall.roomId}
        displayName={user.name}
        onClose={() => setVideoCall(null)}
      />
    )}
  </div>
)
```

## Features Now Available

### 1. Journal with Real Database
- Create new journal entries with mood and tags
- View all past entries
- Edit existing entries
- All data saved to MongoDB

### 2. Real-Time Messaging
- Send messages to assigned doctor
- View conversation history
- Secure, private communication
- Auto-assigns conversation ID

### 3. Doctor Selection
- Browse available doctors
- See doctor stats (experience, sessions, patients)
- View availability schedule
- Book appointments

### 4. Appointment Scheduling
- Choose date and time
- Select session type (initial, follow-up, emergency)
- Choose mode (video, in-person, phone)
- Add notes/concerns
- Automatically generates Jitsi video room for video sessions

### 5. Video Calls with Jitsi
- One-click join for scheduled video sessions
- Full-featured video conferencing
- No additional setup needed
- Secure meeting rooms

## Testing Checklist

- [ ] Login and see your profile load
- [ ] Navigate to "Find Doctor" and see available doctors
- [ ] Schedule an appointment with a doctor
- [ ] View appointments page - see your scheduled appointment
- [ ] Create a journal entry
- [ ] View journal page - see your entries
- [ ] Send a message (if you have an assigned doctor)
- [ ] View messages page - see conversation
- [ ] Join a video call (for today's video appointments)

## Troubleshooting

### "No doctor assigned" for messages
- You need to schedule an appointment first
- The doctor from your first appointment becomes your assigned doctor

### Video call button not showing
- Only shows for TODAY's video appointments
- Check that session.mode === 'video'
- Check that session has videoRoomUrl

### Data not loading
- Check browser console for errors
- Verify MongoDB connection in .env
- Ensure auth token is in localStorage
- Check API route responses in Network tab

## Next Steps

Want to add more features? Consider:
1. Mood tracking charts/visualization
2. Session notes from doctor (view only)
3. Appointment reminders
4. Export journal entries as PDF
5. Search/filter journal entries by mood or tags

All the backend is ready - just add the frontend components!
