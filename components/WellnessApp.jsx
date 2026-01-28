import React, { useMemo, useState } from 'react';
import {
  Calendar,
  MessageCircle,
  FileText,
  AlertCircle,
  Users,
  BarChart3,
  TrendingUp,
  Bell,
  Menu,
  X,
  MoreVertical,
  Search,
  ChevronRight,
  Eye,
  Download,
  Upload,
  Sparkles,
  PlayCircle,
  PauseCircle,
  RotateCcw,
  Video,
  Mic,
  MicOff,
  VideoOff,
  Shield,
  Clock,
} from 'lucide-react';
import AgoraVideoCall from './AgoraVideoCall';
import SessionNotesModal from './SessionNotesModal';

/**
 * Wellness App (Doctor Portal) — v2
 * Adds:
 *  - Pre-session check-in (already present)
 *  - "Notes from Image" modal (upload -> auto draft -> doctor can edit)
 *  - Resources: breathing exercises + daily positivity message
 *  - Video call preview using Jitsi iFrame API (no API key for basic testing)
 */

const COLOR = {
  violet: { bg: 'bg-violet-100', text: 'text-violet-600', ring: 'ring-violet-200' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-600', ring: 'ring-blue-200' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-600', ring: 'ring-amber-200' },
  red: { bg: 'bg-red-100', text: 'text-red-600', ring: 'ring-red-200' },
};

function clsx(...args) {
  return args.filter(Boolean).join(' ');
}

export default function WellnessApp({ user: authUser, onLogout }) {
  const [currentView, setCurrentView] = useState('doctor-dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Notes-from-image flow
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');

  // Video session
  const [videoRoom, setVideoRoom] = useState(null);
  const [videoSession, setVideoSession] = useState(null);

  // Session notes
  const [notesSession, setNotesSession] = useState(null);

  // Data loading states
  const [patients, setPatients] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [doctorProfile, setDoctorProfile] = useState(null);

  // User data from props or default
  const user = useMemo(() => {
    if (doctorProfile) {
      const firstName = doctorProfile.firstName || '';
      const lastName = doctorProfile.lastName || '';
      const title = doctorProfile.title || 'Dr.';
      return {
        role: 'doctor',
        name: `${title} ${firstName} ${lastName}`.trim() || 'Doctor',
        id: doctorProfile.doctorId || 'D-0000',
        specialty: doctorProfile.specialty || 'Provider'
      };
    }
    // Ensure authUser has a name, or use default
    if (authUser && authUser.name) {
      return {
        role: 'doctor',
        name: authUser.name,
        id: authUser.id || 'D-0000',
        specialty: authUser.specialty || 'Provider'
      };
    }
    return { role: 'doctor', name: 'Doctor', id: 'D-0000', specialty: 'Provider' };
  }, [doctorProfile, authUser]);

  // Load doctor profile and patients on mount
  React.useEffect(() => {
    loadDoctorData();
  }, []);

  const loadDoctorData = async () => {
    try {
      setLoading(true);

      // Import API functions
      const { doctorAPI } = await import('@/lib/api.js');

      // Load doctor profile
      const profileData = await doctorAPI.getProfile();
      if (profileData.success) {
        setDoctorProfile(profileData.doctor);
      }

      // Load patients
      const patientsData = await doctorAPI.getPatients();
      if (patientsData.success) {
        // Transform patients to match component expectations
        const transformedPatients = (patientsData.patients || []).map((p) => ({
          ...p,
          id: p._id || p.id,
          name: p.name || (p.firstName && p.lastName ? `${p.firstName} ${p.lastName}` : p.firstName || p.lastName || 'Unknown Patient'),
          patientId: p.patientId || p.id || 'N/A',
          condition: p.condition || (p.primaryConditions && p.primaryConditions[0]) || 'General',
          progress: p.progress || 'stable',
          checkInStatus: p.checkInStatus || 'pending',
          sessions: p.sessions || 0,
          nextSession: p.nextSession || 'Not scheduled',
        }));
        setPatients(transformedPatients);
      }

      // Load upcoming schedule (all future sessions, not just today)
      const scheduleData = await doctorAPI.getSchedule(null, true);
      if (scheduleData.success) {
        setSessions(scheduleData.sessions || []);
      }

      // Load messages
      const messagesData = await doctorAPI.getMessages();
      if (messagesData.success) {
        setConversations(messagesData.conversations || []);
      }
    } catch (error) {
      console.error('Failed to load doctor data:', error);
      // Fallback to demo data if API fails
      setPatients(getDemoPatients());
      setSessions([]);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  // Demo data fallback
  const getDemoPatients = () => [
    {
      id: 1,
      name: 'Alex Morgan',
      patientId: 'P-2847',
      nextSession: 'Today, 2:00 PM',
      lastSession: '3 days ago',
      condition: 'Anxiety & Stress',
      checkInStatus: 'completed',
      checkInData: {
        mood: 6,
        concern: 'Work/School',
        severity: 3,
        note: 'Feeling overwhelmed with upcoming deadlines. Sleep has been inconsistent.',
      },
      sessions: 8,
      progress: 'improving',
    },
    {
      id: 2,
      name: 'Jordan Smith',
      patientId: 'P-3921',
      nextSession: 'Tomorrow, 10:00 AM',
      lastSession: '1 week ago',
      condition: 'Low Mood',
      checkInStatus: 'pending',
      sessions: 12,
      progress: 'stable',
    },
    {
      id: 3,
      name: 'Sam Taylor',
      patientId: 'P-4156',
      nextSession: 'Today, 4:30 PM',
      lastSession: '5 days ago',
      condition: 'Trauma & Triggers',
      checkInStatus: 'completed',
      checkInData: {
        mood: 4,
        concern: 'Anxiety',
        severity: 4,
        note: 'Having nightmares again. Triggers seem to be increasing.',
      },
      sessions: 15,
      progress: 'needs-attention',
    },
    {
      id: 4,
      name: 'Casey Williams',
      patientId: 'P-5203',
      nextSession: 'Wed, 3:00 PM',
      lastSession: '2 days ago',
      condition: 'Social Anxiety',
      checkInStatus: 'completed',
      checkInData: {
        mood: 7,
        concern: 'Relationships',
        severity: 2,
        note: 'Had a positive interaction at work. Feeling more confident.',
      },
      sessions: 6,
      progress: 'improving',
    }
  ];

  // Get today's sessions from the sessions array
  const todaysSchedule = useMemo(() => {
    if (sessions.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return sessions.filter((s) => {
        const sessionDate = new Date(s.scheduledDate);
        return sessionDate >= today && sessionDate < tomorrow;
      });
    }
    // Fallback to demo data if no sessions loaded
    return patients.filter((p) => p.nextSession && p.nextSession.includes('Today'));
  }, [sessions, patients]);

  // Get all upcoming sessions (including today)
  const upcomingSessions = useMemo(() => {
    if (sessions.length > 0) {
      return sessions;
    }
    return [];
  }, [sessions]);

  const navItems = useMemo(
    () => [
      { id: 'doctor-dashboard', icon: BarChart3, label: 'Dashboard' },
      { id: 'schedule', icon: Calendar, label: 'Schedule' },
      { id: 'patients', icon: Users, label: 'My Patients' },
      { id: 'messages', icon: MessageCircle, label: 'Messages' },
      { id: 'resources', icon: FileText, label: 'Resources' },
    ],
    []
  );

  const openPatient = (p) => {
    setSelectedPatient(p);
    setCurrentView('patient-detail');
  };

  const joinVideo = ({ patient, session }) => {
    // Use the exact videoRoomId from the session (must match patient's room)
    let room = null;
    
    // Debug: log the session object to see what we have
    console.log('joinVideo called with:', { session, patient });
    
    if (session) {
      // Session object - use its videoRoomId (EXACT match with patient)
      if (session.videoRoomId) {
        room = session.videoRoomId;
      } 
      // Extract from videoRoomUrl if needed
      else if (session.videoRoomUrl) {
        const url = session.videoRoomUrl;
        if (url.includes('meet.jit.si/')) {
          room = url.split('meet.jit.si/')[1].split('?')[0].split('#')[0];
        } else {
          room = url;
        }
      }
      // Use sessionId to generate (must match what patient uses)
      else if (session.sessionId) {
        // Generate room ID the same way as when appointment is created
        room = `mindflow-${session.sessionId}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      }
      // Use _id as last resort (must match what patient uses)
      else if (session._id) {
        room = `mindflow-${session._id}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      }
    } else if (patient) {
      // Patient object - check if it has session data
      if (patient.videoRoomId) {
        room = patient.videoRoomId;
      } else if (patient.session?.videoRoomId) {
        room = patient.session.videoRoomId;
      } else if (patient.session?.videoRoomUrl) {
        const url = patient.session.videoRoomUrl;
        if (url.includes('meet.jit.si/')) {
          room = url.split('meet.jit.si/')[1].split('?')[0].split('#')[0];
        }
      } else if (patient.session?.sessionId) {
        room = `mindflow-${patient.session.sessionId}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      } else if (patient.patientId) {
        // This should not happen if session exists, but fallback
        room = `mindflow-${String(patient.patientId).toLowerCase().replace(/[^a-z0-9-]/g, '')}`;
      }
    }
    
    if (!room) {
      console.error('No room ID found in session/patient:', { session, patient });
      alert('Unable to join session: Room ID not found. Please contact support.');
      return;
    }
    
    // Sanitize but preserve the exact room ID structure
    room = room.toString().replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
    console.log('Doctor joining room:', room, 'from session:', session);
    
    setVideoRoom(room);
    setCurrentView('video-session');
  };

  const openNotesModal = ({ patient }) => {
    // Prefill a clean structure so doctors edit, not type from scratch
    const base = [
      `Session Notes — ${patient.name} (${patient.patientId})`,
      '',
      'Presenting concern:',
      `- ${patient.condition}`,
      '',
      'Key points (auto-drafted from uploaded image):',
      '- ',
      '',
      'Interventions / techniques used:',
      '- ',
      '',
      'Plan / homework:',
      '- ',
      '',
      'Risk flags:',
      '- None noted',
    ].join('\n');
    setNotesDraft(base);
    setNotesModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&family=Inter:wght@300;400;500;600&display=swap');
        * { font-family: 'Inter', sans-serif; }
        h1,h2,h3,h4,h5,h6,.font-display { font-family: 'Sora', sans-serif; }
        .mobile-nav-enter { animation: slideIn 0.3s ease-out; }
        @keyframes slideIn { from { transform: translateX(-100%);} to { transform: translateX(0);} }
        .fade-in { animation: fadeIn 0.35s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px);} to { opacity: 1; transform: translateY(0);} }
        .card-hover { transition: all 0.25s cubic-bezier(0.4,0,0.2,1); }
        .card-hover:hover { transform: translateY(-3px); box-shadow: 0 18px 24px -8px rgb(0 0 0 / 0.12); }
        .btn-primary { background: linear-gradient(135deg,#667eea 0%,#764ba2 100%); transition: all 0.2s ease; }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 10px 18px rgba(102,126,234,0.28); }
      `}</style>

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between px-4 py-4">
          <button aria-label="Open menu" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 -ml-2">
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <h1 className="font-display font-bold text-xl">CoolMind</h1>
          <button aria-label="Notifications" className="p-2 -mr-2 relative">
            <Bell className="w-6 h-6" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-violet-600 rounded-full" />
          </button>
        </div>
      </header>

      <div className="flex min-h-screen">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h1 className="font-display font-bold text-2xl text-slate-900 mb-1">CoolMind</h1>
            <p className="text-sm text-slate-500">Provider Portal</p>
          </div>

          <nav className="flex-1 p-4">
            <div className="space-y-1">
              {navItems.map(({ id, icon: Icon, label, badge }) => (
                <button
                  key={id}
                  onClick={() => setCurrentView(id)}
                  className={clsx(
                    'w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                    currentView === id ? 'bg-violet-50 text-violet-700' : 'text-slate-600 hover:bg-slate-50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <span>{label}</span>
                  </div>
                  {badge ? (
                    <span className="bg-violet-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{badge}</span>
                  ) : null}
                </button>
              ))}
            </div>
          </nav>

          <div className="p-4 border-t border-slate-200">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                {user.name && typeof user.name === 'string' 
                  ? user.name.split(' ').slice(1).map((n) => n[0]).join('').toUpperCase() || user.name[0]?.toUpperCase() || 'D'
                  : 'D'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-900 truncate">{user.name || 'Doctor'}</div>
                <div className="text-xs text-slate-500">{user.specialty || 'Provider'}</div>
              </div>
              <button
                onClick={onLogout}
                className="text-xs text-violet-600 hover:text-violet-700 font-medium"
                title="Logout"
              >
                Logout
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Sidebar */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-30 bg-black/20" onClick={() => setMobileMenuOpen(false)}>
            <aside className="mobile-nav-enter w-72 h-full bg-white" onClick={(e) => e.stopPropagation()}>
              <nav className="p-4 pt-6">
                <div className="space-y-1">
                  {navItems.map(({ id, icon: Icon, label, badge }) => (
                    <button
                      key={id}
                      onClick={() => {
                        setCurrentView(id);
                        setMobileMenuOpen(false);
                      }}
                      className={clsx(
                        'w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                        currentView === id ? 'bg-violet-50 text-violet-700' : 'text-slate-600 hover:bg-slate-50'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5" />
                        <span>{label}</span>
                      </div>
                      {badge ? (
                        <span className="bg-violet-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{badge}</span>
                      ) : null}
                    </button>
                  ))}
                </div>
              </nav>
              <div className="p-4 absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                    {user.name
                      .split(' ')
                      .slice(1)
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-slate-900">{user.name}</div>
                    <div className="text-xs text-slate-500">{user.specialty}</div>
                  </div>
                  <button
                    onClick={onLogout}
                    className="text-xs text-violet-600 hover:text-violet-700 font-medium"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 lg:py-8">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-slate-600">Loading...</p>
                </div>
              </div>
            ) : (
              <>
            {currentView === 'doctor-dashboard' && (
              <DoctorDashboard
                patients={patients}
                todaysSchedule={todaysSchedule}
                upcomingSessions={upcomingSessions}
                onOpenPatient={openPatient}
                onJoinVideo={(sessionObj) => joinVideo({ session: sessionObj })}
                onOpenNotes={(session) => setNotesSession(session)}
                onRefresh={loadDoctorData}
                user={user}
              />
            )}
            {currentView === 'patients' && <PatientsView patients={patients} onOpenPatient={openPatient} />}
            {currentView === 'patient-detail' && selectedPatient && (
              <PatientDetailView
                patient={selectedPatient}
                onBack={() => setCurrentView('patients')}
                onJoinVideo={() => joinVideo({ session: selectedPatient.session || selectedPatient, patient: selectedPatient })}
                onOpenNotesModal={() => openNotesModal({ patient: selectedPatient })}
              />
            )}
            {currentView === 'schedule' && (
              <ScheduleView
                todaysSchedule={upcomingSessions}
                onJoin={(session) => joinVideo({ session })}
                onOpenPatient={openPatient}
                onOpenNotes={(session) => setNotesSession(session)}
              />
            )}
            {currentView === 'resources' && <ResourcesView />}
            {currentView === 'video-session' && videoRoom && (
              <AgoraVideoCall
                channelName={videoRoom}
                userName={user.name || 'Doctor'}
                userRole="doctor"
                onClose={() => {
                  setVideoRoom(null);
                  setCurrentView('doctor-dashboard');
                }}
              />
            )}
            {currentView === 'messages' && <DoctorMessagesView conversations={conversations} onMessagesUpdate={loadDoctorData} />}
            </>
            )}
          </div>
        </main>
      </div>

      <NotesFromImageModal
        open={notesModalOpen}
        value={notesDraft}
        onChange={setNotesDraft}
        onClose={() => setNotesModalOpen(false)}
        onSave={() => setNotesModalOpen(false)}
      />

      {/* Session Notes Modal */}
      {notesSession && (
        <SessionNotesModal
          session={notesSession}
          onClose={() => setNotesSession(null)}
          onSaved={() => {
            loadDoctorData();
          }}
        />
      )}
    </div>
  );
}

function DoctorDashboard({ patients, todaysSchedule, upcomingSessions, onOpenPatient, onJoinVideo, onOpenNotes, onRefresh, user }) {
  const totalPatients = patients.length;
  const pendingCheckIns = patients.filter((p) => p.checkInStatus === 'pending').length;
  const needsAttention = patients.filter((p) => p.progress === 'needs-attention').length;
  const sessionsToday = todaysSchedule.length;

  const stats = [
    { label: "Today's Sessions", value: sessionsToday, icon: Calendar, color: 'violet' },
    { label: 'Active Patients', value: totalPatients, icon: Users, color: 'blue' },
    { label: 'Pending Check-ins', value: pendingCheckIns, icon: AlertCircle, color: 'amber' },
    { label: 'Needs Attention', value: needsAttention, icon: TrendingUp, color: 'red' },
  ];

  return (
    <div className="fade-in space-y-6">
      <div className="flex items-start justify-between">
      <div>
        <h2 className="font-display text-2xl lg:text-3xl font-bold text-slate-900 mb-1">Good morning, {user.name || 'Doctor'}</h2>
          <p className="text-slate-600">You have {sessionsToday} sessions scheduled for today, {upcomingSessions.length} upcoming total</p>
        </div>
        <button
          onClick={onRefresh}
          className="px-4 py-2 text-sm font-medium text-violet-600 hover:text-violet-700 border border-violet-200 rounded-lg hover:bg-violet-50 transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const c = COLOR[stat.color];
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white rounded-xl p-4 lg:p-6 border border-slate-200">
              <div className="flex items-start justify-between mb-3">
                <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center', c.bg)}>
                  <Icon className={clsx('w-5 h-5', c.text)} />
                </div>
              </div>
              <div className="text-2xl lg:text-3xl font-display font-bold text-slate-900 mb-1">{stat.value}</div>
              <div className="text-xs lg:text-sm text-slate-600">{stat.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display font-semibold text-lg text-slate-900">Today's Schedule</h3>
            <button 
              onClick={() => setCurrentView('schedule')}
              className="text-sm text-violet-600 font-medium hover:text-violet-700"
            >
              View All ({upcomingSessions.length})
            </button>
          </div>

          {todaysSchedule.length > 0 ? (
            <div className="space-y-4">
              {todaysSchedule.map((item) => {
                // Helper to check if session can be joined
                const getJoinStatus = (session) => {
                  if (!session?.scheduledDate) return { canJoin: true, status: 'available', text: 'Join' };

                  const now = new Date();
                  const sessionStart = new Date(session.scheduledDate);
                  const sessionDuration = session.duration || 50;
                  const sessionEnd = new Date(sessionStart.getTime() + sessionDuration * 60 * 1000);
                  const joinWindowStart = new Date(sessionStart.getTime() - 15 * 60 * 1000);
                  const joinWindowEnd = new Date(sessionEnd.getTime() + 15 * 60 * 1000);

                  const canJoin = now >= joinWindowStart && now <= joinWindowEnd;
                  const hasEnded = now > joinWindowEnd;
                  const timeDiff = sessionStart.getTime() - now.getTime();
                  const minutesUntil = Math.floor(timeDiff / (1000 * 60));
                  const hoursUntil = Math.floor(minutesUntil / 60);

                  if (hasEnded) return { canJoin: false, status: 'ended', text: 'Ended' };
                  if (canJoin) return { canJoin: true, status: 'available', text: 'Join' };
                  if (minutesUntil < 60) return { canJoin: false, status: 'soon', text: `In ${minutesUntil}m` };
                  return { canJoin: false, status: 'waiting', text: `In ${hoursUntil}h ${minutesUntil % 60}m` };
                };

                // Format session data (handles both API sessions and demo patient data)
                let sessionData;
                if (item.scheduledDate && item.patientId) {
                  // Real session from API
                  const date = new Date(item.scheduledDate);
                  const patient = item.patientId;
                  sessionData = {
                    id: item._id || item.sessionId,
                    name: patient.firstName && patient.lastName ? `${patient.firstName} ${patient.lastName}` : 'Patient',
                    initials: patient.firstName && patient.lastName
                      ? `${patient.firstName[0]}${patient.lastName[0]}`.toUpperCase()
                      : 'P',
                    time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
                    condition: patient.primaryConditions?.[0] || 'General',
                    session: item,
                    joinStatus: getJoinStatus(item)
                  };
                } else {
                  // Demo data format
                  sessionData = {
                    id: item.id,
                    name: item.name,
                    initials: item.name.split(' ').map((n) => n[0]).join(''),
                    time: item.nextSession?.split(', ')[1] || '',
                    condition: item.condition || 'General',
                    session: item,
                    joinStatus: { canJoin: true, status: 'available', text: 'Join' }
                  };
                }
                
                return (
                  <div
                    key={sessionData.id}
                    className="flex items-start gap-4 p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center text-violet-700 font-semibold flex-shrink-0">
                      {sessionData.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <div className="font-semibold text-slate-900">{sessionData.name}</div>
                          <div className="text-sm text-slate-600">{sessionData.condition}</div>
                        </div>
                        <span className="text-sm font-medium text-slate-900 whitespace-nowrap">
                          {sessionData.time}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span
                          className={clsx(
                            'px-2 py-1 rounded-full text-xs font-medium',
                            sessionData.session.checkInCompleted || sessionData.session.checkInStatus === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-amber-100 text-amber-700'
                          )}
                        >
                          {sessionData.session.checkInCompleted || sessionData.session.checkInStatus === 'completed' ? 'Check-in Complete' : 'Check-in Pending'}
                        </span>

                        <button
                          onClick={() => onOpenPatient(sessionData.session)}
                          className="text-xs text-violet-600 font-medium hover:text-violet-700"
                        >
                          View Details →
                        </button>

                        <button
                          onClick={() => onOpenNotes(sessionData.session)}
                          className="inline-flex items-center gap-1 text-xs text-slate-600 font-medium hover:text-slate-800 px-2 py-1 rounded border border-slate-200 hover:bg-slate-50"
                        >
                          <FileText className="w-3 h-3" />
                          Notes
                        </button>

                        {sessionData.joinStatus?.canJoin ? (
                          <button
                            onClick={() => onJoinVideo(sessionData.session)}
                            className="ml-auto inline-flex items-center gap-2 text-xs font-semibold text-white btn-primary px-3 py-2 rounded-lg"
                          >
                            <Video className="w-4 h-4" />
                            Join
                          </button>
                        ) : sessionData.joinStatus?.status === 'ended' ? (
                          <span className="ml-auto text-xs text-slate-500 bg-slate-100 px-3 py-2 rounded-lg">
                            Session Ended
                          </span>
                        ) : (
                          <span className="ml-auto inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
                            <Clock className="w-3 h-3" />
                            {sessionData.joinStatus?.text || 'Not started'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600">No sessions scheduled for today</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {needsAttention > 0 && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5">
              <div className="flex items-start gap-3 mb-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-900 mb-1">Attention Required</h4>
                  <p className="text-sm text-red-800">
                    {needsAttention} patient{needsAttention > 1 ? 's' : ''} showing concerning patterns
                  </p>
                </div>
              </div>
              <button className="w-full py-2 bg-red-600 text-white rounded-lg font-medium text-sm hover:bg-red-700 transition-colors">
                Review Patients
              </button>
            </div>
          )}

          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <h3 className="font-display font-semibold text-lg text-slate-900 mb-4">This Week</h3>
            <div className="space-y-4">
              <Row label="Sessions Completed" value="18" />
              <Row label="Avg. Session Duration" value="52m" />
              <Row label="Patient Satisfaction" value="4.9★" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <h3 className="font-display font-semibold text-lg text-slate-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <ActionBtn icon={FileText} label="Session Notes" />
              <ActionBtn icon={MessageCircle} label="Message Patient" />
              <ActionBtn icon={Download} label="Export Reports" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="text-lg font-bold text-slate-900">{value}</span>
    </div>
  );
}

function ActionBtn({ icon: Icon, label }) {
  return (
    <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors text-left">
      <Icon className="w-5 h-5 text-slate-600" />
      <span className="text-sm font-medium text-slate-900">{label}</span>
    </button>
  );
}

function PatientsView({ patients, onOpenPatient }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      // Safely handle undefined/null values
      const name = (p.name || '').toLowerCase();
      const patientId = (p.patientId || '').toLowerCase();
      const searchLower = searchTerm.toLowerCase();
      
      const matchesSearch =
        name.includes(searchLower) ||
        patientId.includes(searchLower);
      const matchesFilter =
        filterStatus === 'all' ||
        (filterStatus === 'attention' && p.progress === 'needs-attention') ||
        (filterStatus === 'pending' && p.checkInStatus === 'pending');
      return matchesSearch && matchesFilter;
    });
  }, [patients, searchTerm, filterStatus]);

  return (
    <div className="fade-in space-y-6">
      <div>
        <h2 className="font-display text-2xl lg:text-3xl font-bold text-slate-900 mb-1">My Patients</h2>
        <p className="text-slate-600">Manage and monitor patient progress</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'attention', 'pending'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={clsx(
                'px-4 py-3 rounded-lg font-medium text-sm transition-colors',
                filterStatus === status
                  ? 'bg-violet-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              )}
            >
              {status === 'all' ? 'All' : status === 'attention' ? 'Needs Attention' : 'Pending Check-in'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {filteredPatients.map((patient) => (
          <div
            key={patient.id}
            className="bg-white rounded-xl p-6 border border-slate-200 card-hover cursor-pointer"
            onClick={() => onOpenPatient(patient)}
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center text-violet-700 font-semibold flex-shrink-0">
                {(patient.name || 'Unknown')
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div>
                    <h3 className="font-semibold text-slate-900">{patient.name || 'Unknown Patient'}</h3>
                    <p className="text-sm text-slate-600">{patient.patientId || 'N/A'}</p>
                  </div>
                  <span
                    className={clsx(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      patient.progress === 'improving'
                        ? 'bg-green-100 text-green-700'
                        : patient.progress === 'stable'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-red-100 text-red-700'
                    )}
                  >
                    {patient.progress === 'improving'
                      ? 'Improving'
                      : patient.progress === 'stable'
                        ? 'Stable'
                        : 'Needs Attention'}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mb-2">{patient.condition}</p>
              </div>
            </div>

            <div className="space-y-2 mb-4 pb-4 border-b border-slate-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Next Session:</span>
                <span className="font-medium text-slate-900">{patient.nextSession}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Total Sessions:</span>
                <span className="font-medium text-slate-900">{patient.sessions}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span
                className={clsx(
                  'px-3 py-1 rounded-full text-xs font-medium',
                  patient.checkInStatus === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                )}
              >
                {patient.checkInStatus === 'completed' ? '✓ Check-in Complete' : 'Check-in Pending'}
              </span>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PatientDetailView({ patient, onBack, onJoinVideo, onOpenNotesModal }) {
  return (
    <div className="fade-in space-y-6">
      <button onClick={onBack} className="text-slate-600 hover:text-slate-900 font-medium flex items-center gap-2 text-sm">
        ← Back to Patients
      </button>

      <div className="bg-white rounded-xl p-6 lg:p-8 border border-slate-200">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center text-violet-700 font-bold text-2xl flex-shrink-0">
            {(patient.name || 'Unknown')
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <h2 className="font-display text-2xl font-bold text-slate-900">{patient.name || 'Unknown Patient'}</h2>
                <p className="text-slate-600">{patient.patientId || 'N/A'}</p>
              </div>
              <span
                className={clsx(
                  'px-3 py-1 rounded-full text-sm font-medium',
                  patient.progress === 'improving'
                    ? 'bg-green-100 text-green-700'
                    : patient.progress === 'stable'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-red-100 text-red-700'
                )}
              >
                {patient.progress === 'improving' ? 'Improving' : patient.progress === 'stable' ? 'Stable' : 'Needs Attention'}
              </span>
            </div>
            <div className="grid sm:grid-cols-3 gap-4 mt-4">
              <Meta label="Primary Condition" value={patient.condition} />
              <Meta label="Next Session" value={patient.nextSession} />
              <Meta label="Total Sessions" value={`${patient.sessions} completed`} />
            </div>
          </div>
        </div>
      </div>

      {patient.checkInData ? <CheckInCard checkIn={patient.checkInData} /> : <PendingCheckInCard />}

      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <h3 className="font-display font-semibold text-lg text-slate-900 mb-4">Recent Session Notes</h3>
        <div className="space-y-4">
          {[
            {
              date: '3 days ago',
              type: 'Video Session',
              duration: '50 min',
              notes: 'Good progress on coping strategies. Patient reports improved sleep quality.',
            },
            {
              date: '1 week ago',
              type: 'Video Session',
              duration: '52 min',
              notes: 'Discussed workplace stressors. Introduced new relaxation techniques.',
            },
            { date: '2 weeks ago', type: 'In-Person', duration: '60 min', notes: 'Initial assessment. Established treatment goals and plan.' },
          ].map((session, idx) => (
            <div key={idx} className="p-4 border border-slate-200 rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-semibold text-slate-900">{session.type}</div>
                  <div className="text-sm text-slate-600">
                    {session.date} • {session.duration}
                  </div>
                </div>
                <button aria-label="View session" className="text-violet-600 hover:text-violet-700">
                  <Eye className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-slate-700">{session.notes}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button onClick={onJoinVideo} className="flex-1 btn-primary text-white py-3 rounded-lg font-semibold inline-flex items-center justify-center gap-2">
          <Video className="w-5 h-5" />
          Start / Join Session
        </button>
        <button onClick={onOpenNotesModal} className="flex-1 sm:flex-none px-6 py-3 border border-slate-200 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 inline-flex items-center justify-center gap-2">
          <Upload className="w-5 h-5" />
          Notes from Image
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 flex items-start gap-3">
        <Shield className="w-5 h-5 text-slate-600 mt-0.5" />
        <div>
          <div className="font-semibold text-slate-900">Implementation note</div>
          <div className="mt-1">
            In production, the “Notes from Image” draft should be generated server-side (OCR/vision) and stored as a session draft linked to the appointment.
          </div>
        </div>
      </div>
    </div>
  );
}

function Meta({ label, value }) {
  return (
    <div>
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="font-medium text-slate-900">{value}</div>
    </div>
  );
}

function CheckInCard({ checkIn }) {
  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display font-semibold text-lg text-slate-900">Latest Pre-Session Check-in</h3>
        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Completed</span>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <Metric title="Mood Level" value={`${checkIn.mood}/10`} sub={checkIn.mood <= 3 ? 'Low' : checkIn.mood <= 6 ? 'Moderate' : 'Good'} accent="text-violet-600" />
        <Metric title="Primary Concern" value={checkIn.concern} sub="" />
        <Metric title="Severity" value={`${checkIn.severity}/5`} sub={checkIn.severity <= 2 ? 'Mild' : checkIn.severity <= 3 ? 'Moderate' : 'Severe'} />
      </div>

      {checkIn.note ? (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm font-semibold text-slate-900 mb-2">Patient Notes:</div>
          <p className="text-sm text-slate-700 italic">“{checkIn.note}”</p>
        </div>
      ) : null}
    </div>
  );
}

function PendingCheckInCard() {
  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-lg text-slate-900">Latest Pre-Session Check-in</h3>
        <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">Pending</span>
      </div>
      <div className="mt-4 text-sm text-slate-600">
        Patient has not completed the check-in yet. You’ll see their mood/concern summary here once submitted.
      </div>
    </div>
  );
}

function Metric({ title, value, sub, accent }) {
  return (
    <div className="p-4 bg-slate-50 rounded-lg">
      <div className="text-xs text-slate-500 mb-2">{title}</div>
      <div className={clsx('text-2xl md:text-3xl font-bold mb-1', accent || 'text-slate-900')}>{value}</div>
      {sub ? <div className="text-sm text-slate-600">{sub}</div> : null}
    </div>
  );
}

function ScheduleView({ todaysSchedule, onJoin, onOpenPatient, onOpenNotes }) {
  // Helper to check if session can be joined (15 min before to 15 min after session end)
  const getSessionJoinStatus = (session) => {
    if (!session?.scheduledDate) return { canJoin: true, status: 'available' }; // Demo data

    const now = new Date();
    const sessionStart = new Date(session.scheduledDate);
    const sessionDuration = session.duration || 50;
    const sessionEnd = new Date(sessionStart.getTime() + sessionDuration * 60 * 1000);

    const joinWindowStart = new Date(sessionStart.getTime() - 15 * 60 * 1000);
    const joinWindowEnd = new Date(sessionEnd.getTime() + 15 * 60 * 1000);

    const canJoin = now >= joinWindowStart && now <= joinWindowEnd;
    const hasEnded = now > joinWindowEnd;
    const notStartedYet = now < joinWindowStart;

    const timeDiff = sessionStart.getTime() - now.getTime();
    const minutesUntil = Math.floor(timeDiff / (1000 * 60));
    const hoursUntil = Math.floor(minutesUntil / 60);

    if (hasEnded) return { canJoin: false, status: 'ended', text: 'Ended' };
    if (canJoin) return { canJoin: true, status: 'available', text: 'Join Now' };
    if (minutesUntil < 60) return { canJoin: false, status: 'soon', text: `In ${minutesUntil}m` };
    return { canJoin: false, status: 'waiting', text: `In ${hoursUntil}h ${minutesUntil % 60}m` };
  };

  // Helper to format session data (handles both demo data and real API data)
  const formatSession = (item) => {
    // If it's a real session from API
    if (item.scheduledDate && item.patientId) {
      const date = new Date(item.scheduledDate);
      const patient = item.patientId;
      const joinStatus = getSessionJoinStatus(item);
      return {
        id: item._id || item.sessionId,
        name: patient.firstName && patient.lastName ? `${patient.firstName} ${patient.lastName}` : 'Patient',
        initials: patient.firstName && patient.lastName
          ? `${patient.firstName[0]}${patient.lastName[0]}`.toUpperCase()
          : 'P',
        time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        date: date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
        condition: patient.primaryConditions?.[0] || 'General',
        mode: item.mode || 'video',
        status: item.status,
        joinStatus,
        session: item // Keep full session object
      };
    }
    // Demo data format (fallback)
    return {
      id: item.id,
      name: item.name,
      initials: item.name.split(' ').map((n) => n[0]).join(''),
      time: item.nextSession?.split(', ')[1]?.split(':')[0] || '',
      date: item.nextSession?.split(', ')[0] || '',
      condition: item.condition || 'General',
      mode: 'video',
      status: 'scheduled',
      joinStatus: { canJoin: true, status: 'available', text: 'Join' },
      session: item
    };
  };

  const formattedSessions = todaysSchedule.map(formatSession);

  return (
    <div className="fade-in space-y-6">
      <div>
        <h2 className="font-display text-2xl lg:text-3xl font-bold text-slate-900 mb-1">Upcoming Schedule</h2>
        <p className="text-slate-600">
          All scheduled sessions and meeting requests
        </p>
      </div>

      <div className="bg-white rounded-xl p-6 border border-slate-200">
        {formattedSessions.length > 0 ? (
          <div className="space-y-4">
            {formattedSessions.map((session) => (
              <div key={session.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-lg bg-slate-50 border-l-4 border-violet-600">
                <div className="text-center flex-shrink-0 sm:w-20">
                  <div className="text-2xl font-bold text-slate-900">{session.time}</div>
                  <div className="text-sm text-slate-600">{session.time.includes('PM') ? 'PM' : 'AM'}</div>
                </div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center text-violet-700 font-semibold flex-shrink-0">
                  {session.initials}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-slate-900">{session.name}</div>
                  <div className="text-sm text-slate-600">{session.condition} • {session.mode === 'video' ? 'Video' : session.mode === 'in-person' ? 'In-Person' : 'Phone'} Session</div>
                  <button 
                    onClick={() => onOpenPatient(session.session)} 
                    className="mt-2 text-sm text-violet-600 font-medium hover:text-violet-700"
                  >
                    View patient
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenNotes(session.session)}
                    className="px-4 py-2 rounded-lg font-medium text-sm inline-flex items-center justify-center gap-2 border border-slate-200 text-slate-600 hover:bg-slate-100"
                  >
                    <FileText className="w-4 h-4" />
                    Notes
                  </button>
                  {session.joinStatus?.canJoin ? (
                    <button
                      onClick={() => onJoin(session.session)}
                      className="btn-primary text-white px-6 py-2 rounded-lg font-semibold text-sm inline-flex items-center justify-center gap-2"
                    >
                      <Video className="w-4 h-4" />
                      Join
                    </button>
                  ) : session.joinStatus?.status === 'ended' ? (
                    <span className="px-4 py-2 rounded-lg text-sm text-slate-500 bg-slate-100">
                      Session Ended
                    </span>
                  ) : (
                    <span className="px-4 py-2 rounded-lg text-sm text-amber-700 bg-amber-50">
                      <Clock className="w-4 h-4 inline mr-1" />
                      {session.joinStatus?.text || 'Not started'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 text-lg font-medium">No sessions scheduled for today</p>
            <p className="text-slate-500 text-sm mt-2">Your schedule will appear here when appointments are booked</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ResourcesView() {
  return (
    <div className="fade-in space-y-6">
      <div>
        <h2 className="font-display text-2xl lg:text-3xl font-bold text-slate-900 mb-1">Resources</h2>
        <p className="text-slate-600">Breathing exercises and daily positivity for patients</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <DailyPositivityCard />
        <BreathingExerciseCard />
      </div>

      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <h3 className="font-display font-semibold text-lg text-slate-900 mb-2">How to ship this in MVP</h3>
        <ul className="list-disc pl-5 text-sm text-slate-700 space-y-2">
          <li>Daily message: store 30–90 messages, rotate by date; later personalize by check-in concern.</li>
          <li>Breathing: guided timer + haptics (mobile) + audio cues; later add streaks and favorites.</li>
        </ul>
      </div>
    </div>
  );
}

function DailyPositivityCard() {
  const messages = [
    'Take one small step today. Small steps stack into big change.',
    'Your feelings are valid — and they are not permanent.',
    'Breathe. Reset. Continue. You’re allowed to go slowly.',
    'Progress is not linear. Showing up still counts.',
    'Be kinder to yourself than you are to your inner critic.',
    'If today is heavy, aim for “good enough,” not perfect.',
    'You don’t have to do it all. Do the next right thing.',
  ];
  const idx = Math.abs(Math.floor(Date.now() / (1000 * 60 * 60 * 24))) % messages.length;
  const msg = messages[idx];

  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display font-semibold text-lg text-slate-900">Daily Positivity</h3>
          <p className="text-sm text-slate-600">Auto-refreshes each day</p>
        </div>
        <Sparkles className="w-5 h-5 text-violet-600" />
      </div>
      <div className="mt-4 p-4 rounded-lg bg-violet-50 border border-violet-100 text-slate-800">
        <div className="text-sm leading-relaxed">“{msg}”</div>
      </div>
      <div className="mt-4 text-xs text-slate-500">
        Tip: keep these short, non-clinical, and avoid promises like “this will cure anxiety.”
      </div>
    </div>
  );
}

function BreathingExerciseCard() {
  const [mode, setMode] = useState('box'); // box | 478
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState('Ready');
  const [seconds, setSeconds] = useState(0);

  // Super-light demo timer (client-side). Replace with a proper interval hook in production.
  React.useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  React.useEffect(() => {
    if (!running) {
      setPhase('Ready');
      return;
    }

    if (mode === 'box') {
      // 4-4-4-4
      const step = seconds % 16;
      if (step < 4) setPhase('Inhale');
      else if (step < 8) setPhase('Hold');
      else if (step < 12) setPhase('Exhale');
      else setPhase('Hold');
    } else {
      // 4-7-8 (cycle 19)
      const step = seconds % 19;
      if (step < 4) setPhase('Inhale');
      else if (step < 11) setPhase('Hold');
      else setPhase('Exhale');
    }
  }, [running, seconds, mode]);

  const reset = () => {
    setRunning(false);
    setSeconds(0);
    setPhase('Ready');
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display font-semibold text-lg text-slate-900">Breathing Exercise</h3>
          <p className="text-sm text-slate-600">Guided timer (demo)</p>
        </div>
        <div className="inline-flex items-center gap-2">
          <button
            onClick={() => setMode('box')}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-semibold border',
              mode === 'box' ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            )}
          >
            Box 4-4-4-4
          </button>
          <button
            onClick={() => setMode('478')}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-semibold border',
              mode === '478' ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            )}
          >
            4-7-8
          </button>
        </div>
      </div>

      <div className="mt-4 p-5 rounded-xl bg-slate-50 border border-slate-200">
        <div className="text-xs text-slate-500">Current phase</div>
        <div className="mt-1 text-2xl font-display font-bold text-slate-900">{phase}</div>
        <div className="mt-2 text-sm text-slate-600">Time: {seconds}s</div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => setRunning((v) => !v)}
          className={clsx(
            'flex-1 py-3 rounded-lg font-semibold text-sm inline-flex items-center justify-center gap-2',
            running ? 'bg-slate-900 text-white hover:bg-slate-800' : 'btn-primary text-white'
          )}
        >
          {running ? <PauseCircle className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
          {running ? 'Pause' : 'Start'}
        </button>
        <button onClick={reset} className="px-4 py-3 border border-slate-200 rounded-lg font-semibold text-sm text-slate-700 hover:bg-slate-50 inline-flex items-center justify-center gap-2">
          <RotateCcw className="w-5 h-5" />
          Reset
        </button>
      </div>
    </div>
  );
}

function NotesFromImageModal({ open, value, onChange, onClose, onSave }) {
  const [fileName, setFileName] = useState('');
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const simulateExtract = async (file) => {
    // Demo-only: in production call your server endpoint:
    // POST /api/session-notes/extract { appointmentId, image }
    // Server does OCR/vision -> returns structured draft.
    setBusy(true);
    await new Promise((r) => setTimeout(r, 900));

    const mock = [
      value,
      '',
      '---',
      'Extracted (demo):',
      `- Uploaded: ${file.name}`,
      '- Observations: patient appears fatigued; reports increased stress before deadlines.',
      '- Themes: sleep hygiene, grounding, cognitive reframing.',
      '- Plan: 5-min breathing (box), journaling prompt, follow-up next week.',
    ].join('\n');

    onChange(mock);
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative w-[min(900px,92vw)] max-h-[90vh] overflow-auto bg-white rounded-2xl border border-slate-200 shadow-2xl">
        <div className="p-5 border-b border-slate-200 flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display font-semibold text-lg text-slate-900">Notes from Image</h3>
            <p className="text-sm text-slate-600">Upload a photo (handwritten/typed). We create a draft you can edit.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-50" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <label className="inline-flex items-center gap-2 px-4 py-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer font-semibold text-sm text-slate-800">
              <Upload className="w-5 h-5" />
              <span>Upload image</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setFileName(file.name);
                  simulateExtract(file);
                }}
              />
            </label>
            <div className="text-sm text-slate-600">
              {fileName ? (
                <span>
                  Selected: <span className="font-mono text-slate-800">{fileName}</span>
                </span>
              ) : (
                'No file selected'
              )}
            </div>
            {busy ? (
              <div className="ml-auto text-sm text-slate-600 inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-violet-600 animate-pulse" />
                Drafting notes…
              </div>
            ) : null}
          </div>

          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                <FileText className="w-4 h-4" />
                Session note draft
              </div>
              <div className="text-xs text-slate-500">Editable</div>
            </div>
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full min-h-[320px] p-4 text-sm font-mono text-slate-900 focus:outline-none"
              placeholder="Upload an image to generate a draft…"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button onClick={onClose} className="px-5 py-3 rounded-lg border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
            <button
              onClick={onSave}
              className="px-5 py-3 rounded-lg btn-primary text-white font-semibold inline-flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Save Notes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Placeholder({ title, desc }) {
  return (
    <div className="fade-in bg-white rounded-xl p-6 border border-slate-200">
      <h2 className="font-display text-2xl font-bold text-slate-900">{title}</h2>
      <p className="mt-2 text-slate-600">{desc}</p>
    </div>
  );
}


function DoctorMessagesView({ conversations, onMessagesUpdate }) {
  const [selectedConversation, setSelectedConversation] = React.useState(null);
  const [newMessage, setNewMessage] = React.useState('');
  const [sending, setSending] = React.useState(false);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      setSending(true);
      const { doctorAPI } = await import('@/lib/api.js');

      await doctorAPI.sendMessage({
        content: newMessage.trim(),
        patientId: selectedConversation.patientId
      });

      setNewMessage('');
      if (onMessagesUpdate) onMessagesUpdate();
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl lg:text-3xl font-bold text-slate-900 mb-1">Messages</h2>
        <p className="text-slate-600">Communicate with your patients</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Conversations List */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-semibold text-slate-900">Conversations</h3>
          </div>
          <div className="divide-y divide-slate-200 max-h-[600px] overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-slate-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p>No conversations yet</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.conversationId}
                  onClick={() => setSelectedConversation(conv)}
                  className={clsx(
                    'w-full p-4 text-left hover:bg-slate-50 transition-colors',
                    selectedConversation?.conversationId === conv.conversationId && 'bg-violet-50'
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-900">{conv.patientName}</span>
                    {conv.unreadCount > 0 && (
                      <span className="px-2 py-1 bg-violet-600 text-white text-xs font-bold rounded-full">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600">{conv.patientIdentifier}</p>
                  {conv.lastMessage && (
                    <p className="text-sm text-slate-500 mt-1 truncate">
                      {conv.lastMessage.content}
                    </p>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Messages Panel */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
          {!selectedConversation ? (
            <div className="h-[600px] flex items-center justify-center text-slate-500">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p>Select a conversation to view messages</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-violet-600 to-purple-600 text-white">
                <h3 className="font-semibold">{selectedConversation.patientName}</h3>
                <p className="text-sm text-violet-100">{selectedConversation.patientIdentifier}</p>
              </div>

              {/* Messages */}
              <div className="h-[450px] overflow-y-auto p-4 space-y-4">
                {selectedConversation.messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  selectedConversation.messages.map((msg) => (
                    <div
                      key={msg._id}
                      className={clsx(
                        'flex',
                        msg.senderRole === 'doctor' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div
                        className={clsx(
                          'max-w-xs px-4 py-3 rounded-2xl',
                          msg.senderRole === 'doctor'
                            ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-br-none'
                            : 'bg-slate-100 text-slate-900 rounded-bl-none'
                        )}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {new Date(msg.createdAt).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Input */}
              <div className="p-4 border-t border-slate-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !sending && handleSendMessage()}
                    placeholder="Type your message..."
                    disabled={sending}
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={sending || !newMessage.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? '...' : 'Send'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
