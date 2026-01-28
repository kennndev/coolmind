# PatientDashboard Updates - Integration Guide

## Changes Made

### 1. API Routes Created
- ✅ `/api/patient/journal` - GET/POST journal entries
- ✅ `/api/patient/messages` - GET/POST messages  
- ✅ `/api/patient/mood` - GET/POST mood tracking
- ✅ `/api/patient/check-in` - GET/POST check-ins
- ✅ `/api/patient/doctors` - GET available doctors with stats
- ✅ `/api/patient/appointments` - GET/POST/DELETE appointments
- ✅ `/api/patient/profile` - GET/PUT profile

### 2. lib/api.js Updated
Added patient API methods:
- `getDoctors()` - Fetch available doctors
- `getAppointments(upcoming)` - Fetch appointments
- `scheduleAppointment(data)` - Schedule new appointment
- `cancelAppointment(sessionId)` - Cancel appointment
- `getJournalEntries()` - Fetch journal entries
- `createJournalEntry(data)` - Create journal entry
- `getMessages()` - Fetch conversation
- `sendMessage(data)` - Send message
- `getMoodEntries(days)` - Fetch mood data
- `logMood(data)` - Log mood
- `getCheckIns()` - Fetch check-ins
- `submitCheckIn(data)` - Submit check-in

### 3. New Components Created
- `JitsiVideoCall.jsx` - Video call integration

### 4. PatientDashboard State Updates Needed

Add these states:
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

### 5. Update loadPatientData()

Load all data in parallel (already updated in your file)

### 6. Add New Nav Item

```javascript
{ id: 'find-doctor', icon: Users, label: 'Find Doctor' }
```

### 7. Video Call Integration

When user clicks "Join Video Session":
```javascript
setVideoCall({ roomId: session.videoRoomId })
```

Render in your dashboard:
```javascript
{videoCall && (
  <JitsiVideoCall 
    roomId={videoCall.roomId} 
    displayName={user.name} 
    onClose={() => setVideoCall(null)} 
  />
)}
```

## Next Steps

1. I'll create the updated view components as separate files
2. You can copy them into your PatientDashboard
3. Test each feature individually

