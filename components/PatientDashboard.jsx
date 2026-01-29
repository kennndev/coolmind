'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Calendar,
  MessageCircle,
  Heart,
  Video,
  Clock,
  CheckCircle,
  AlertCircle,
  Sparkles,
  PlayCircle,
  PauseCircle,
  RotateCcw,
  LogOut,
  Menu,
  X,
  User,
  Users,
  Activity,
  TrendingUp,
  BookOpen,
  Shield,
  Phone,
  Send,
  Smile,
  Meh,
  Frown,
  FileText,
  Bell,
  Settings,
  ChevronRight,
  Plus,
  Edit,
} from 'lucide-react'
import AgoraVideoCall from './AgoraVideoCall'

function clsx(...args) {
  return args.filter(Boolean).join(' ')
}

export default function PatientDashboard({ user: authUser, onLogout }) {
  const [currentView, setCurrentView] = useState('home')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [patientProfile, setPatientProfile] = useState(null)
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedSession, setSelectedSession] = useState(null)
  const [videoRoom, setVideoRoom] = useState(null)

  // Data states
  const [journalEntries, setJournalEntries] = useState([])
  const [messages, setMessages] = useState([])
  const [doctorInfo, setDoctorInfo] = useState(null)
  const [conversationId, setConversationId] = useState(null)
  const [moodEntries, setMoodEntries] = useState([])
  const [moodStats, setMoodStats] = useState(null)
  const [doctors, setDoctors] = useState([])

  // Modals
  const [checkInModal, setCheckInModal] = useState(false)
  const [messageModal, setMessageModal] = useState(false)
  const [journalModal, setJournalModal] = useState(false)
  const [scheduleModal, setScheduleModal] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [doctorSelectModal, setDoctorSelectModal] = useState(false)

  // Check if patient has no assigned doctor
  const hasNoDoctor = patientProfile && !patientProfile.assignedDoctor

  const user = useMemo(() => {
    if (patientProfile) {
      const firstName = patientProfile.firstName || 'Friend'
      const lastName = patientProfile.lastName || ''
      return {
        role: 'patient',
        name: `${firstName} ${lastName}`.trim() || 'Friend',
        id: patientProfile.patientId,
        email: authUser?.email,
      }
    }
    return authUser || { role: 'patient', name: 'Friend', id: 'P-0000' }
  }, [patientProfile, authUser])

  const getUserInitials = (name) => {
    if (!name || typeof name !== 'string') return '✨'
    const parts = name.trim().split(' ').filter(Boolean)
    if (parts.length === 0) return '✨'
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || '✨'
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  useEffect(() => {
    loadPatientData()
  }, [])

  const loadPatientData = async () => {
    try {
      setLoading(true)
      const { patientAPI } = await import('@/lib/api.js')

      try {
        const profileData = await patientAPI.getProfile()
        if (profileData.success) {
          setPatientProfile(profileData.profile)
        }
      } catch (profileError) {
        console.error('Failed to load patient profile:', profileError)
      }

      try {
        const sessionsData = await patientAPI.getSessions()
        if (sessionsData.success) {
          setSessions(sessionsData.sessions || [])
        }
      } catch (sessionsError) {
        console.error('Failed to load sessions:', sessionsError)
      }

      try {
        const journalData = await patientAPI.getJournalEntries()
        if (journalData.success) {
          setJournalEntries(journalData.entries || [])
        }
      } catch (journalError) {
        console.error('Failed to load journal:', journalError)
      }

      try {
        const messagesData = await patientAPI.getMessages()
        if (messagesData.success) {
          setMessages(messagesData.messages || [])
          setDoctorInfo(messagesData.doctor)
          setConversationId(messagesData.conversationId)
        }
      } catch (messagesError) {
        console.error('Failed to load messages:', messagesError)
      }

      try {
        const moodData = await patientAPI.getMoodEntries(30)
        if (moodData.success) {
          setMoodEntries(moodData.entries || [])
          setMoodStats(moodData.stats)
        }
      } catch (moodError) {
        console.error('Failed to load mood data:', moodError)
      }

      try {
        const doctorsData = await patientAPI.getDoctors()
        if (doctorsData.success) {
          setDoctors(doctorsData.doctors || [])
        }
      } catch (doctorsError) {
        console.error('Failed to load doctors:', doctorsError)
      }
    } catch (error) {
      console.error('Failed to load patient data:', error)
    } finally {
      setLoading(false)
    }
  }

  const navItems = useMemo(
    () => [
      { id: 'home', icon: Heart, label: 'Home' },
      { id: 'sessions', icon: Calendar, label: 'Appointments' },
      { id: 'find-doctor', icon: Users, label: 'Find Doctor' },
      { id: 'messages', icon: MessageCircle, label: 'Messages' },
      { id: 'resources', icon: Sparkles, label: 'Wellness Tools' },
      { id: 'journal', icon: BookOpen, label: 'My Journal' },
      { id: 'progress', icon: TrendingUp, label: 'Progress' },
    ],
    []
  )

  const upcomingSessions = useMemo(() => {
    const now = new Date()
    return sessions.filter((s) => {
      if (s.status !== 'scheduled' && s.status !== 'confirmed') return false
      // Include sessions that haven't ended yet (session end + 15 min buffer)
      const sessionStart = new Date(s.scheduledDate)
      const sessionDuration = s.duration || 50
      const sessionEnd = new Date(sessionStart.getTime() + (sessionDuration + 15) * 60 * 1000)
      return now <= sessionEnd
    })
  }, [sessions])

  const pastSessions = useMemo(() => {
    const now = new Date()
    return sessions.filter((s) => {
      // Include completed sessions OR sessions that have ended
      if (s.status === 'completed') return true
      if (s.status === 'scheduled' || s.status === 'confirmed') {
        const sessionStart = new Date(s.scheduledDate)
        const sessionDuration = s.duration || 50
        const sessionEnd = new Date(sessionStart.getTime() + (sessionDuration + 15) * 60 * 1000)
        return now > sessionEnd
      }
      return false
    })
  }, [sessions])

  // Calculate unread message count
  const unreadMessageCount = useMemo(() => {
    if (!messages || !authUser?.id) return 0
    const userId = authUser.id.toString()
    return messages.filter(
      (msg) => {
        const recipientId = msg.recipientId?.toString() || msg.recipientId
        return recipientId === userId && !msg.isRead
      }
    ).length
  }, [messages, authUser])

  // Update navItems with badge for Messages
  const navItemsWithBadge = useMemo(
    () =>
      navItems.map((item) => {
        if (item.id === 'messages' && unreadMessageCount > 0) {
          return { ...item, badge: unreadMessageCount }
        }
        return item
      }),
    [navItems, unreadMessageCount]
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-violet-100 safe-area-top">
        <div className="flex items-center justify-between px-3 sm:px-4 py-3 sm:py-4">
          <button
            aria-label="Open menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 -ml-2 text-violet-600 touch-manipulation active:bg-violet-50 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-violet-600 fill-violet-600" />
            <h1 className="font-display font-bold text-lg sm:text-xl bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              CoolMind
            </h1>
          </div>
          <button onClick={onLogout} className="p-2 -mr-2 text-violet-600 touch-manipulation active:bg-violet-50 rounded-lg transition-colors" aria-label="Logout">
            <LogOut className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </header>

      <div className="flex min-h-screen">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:flex flex-col w-72 bg-white/80 backdrop-blur-lg border-r border-violet-100">
          <div className="p-6 border-b border-violet-100">
            <div className="flex items-center gap-2 mb-1">
              <Heart className="w-7 h-7 text-violet-600 fill-violet-600" />
              <h1 className="font-display font-bold text-2xl bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                CoolMind
              </h1>
            </div>
            <p className="text-sm text-violet-600 font-medium">Your Wellness Space</p>
          </div>

          <nav className="flex-1 p-4">
            <div className="space-y-1">
              {navItemsWithBadge.map(({ id, icon: Icon, label, badge }) => (
                <button
                  key={id}
                  onClick={() => setCurrentView(id)}
                  className={clsx(
                    'w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                    currentView === id
                      ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-200'
                      : 'text-slate-600 hover:bg-violet-50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <span>{label}</span>
                  </div>
                  {badge && badge > 0 ? (
                    <span className="bg-white text-violet-600 text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                      {badge}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </nav>

          <div className="p-4 border-t border-violet-100">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                {getUserInitials(user.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-900 truncate">{user.name || 'Friend'}</div>
                <div className="text-xs text-violet-600">Your safe space</div>
              </div>
              <button
                onClick={onLogout}
                className="text-xs text-violet-600 hover:text-violet-700 font-medium"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Sidebar */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-30 bg-black/20 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
            <aside className="w-72 max-w-[85vw] h-full bg-white/95 backdrop-blur-lg shadow-xl flex flex-col" onClick={(e) => e.stopPropagation()}>
              {/* Mobile Menu Header */}
              <div className="p-4 border-b border-violet-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-violet-600 fill-violet-600" />
                  <h2 className="font-display font-bold text-lg bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                    Menu
                  </h2>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 touch-manipulation"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Navigation Items */}
              <nav className="flex-1 overflow-y-auto p-4">
                <div className="space-y-1">
                  {navItemsWithBadge.map(({ id, icon: Icon, label, badge }) => (
                    <button
                      key={id}
                      onClick={() => {
                        setCurrentView(id)
                        setMobileMenuOpen(false)
                      }}
                      className={clsx(
                        'w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all touch-manipulation active:scale-[0.98]',
                        currentView === id
                          ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md'
                          : 'text-slate-600 hover:bg-violet-50 active:bg-violet-100'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span>{label}</span>
                      </div>
                      {badge && badge > 0 ? (
                        <span className="bg-white text-violet-600 text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center flex-shrink-0">
                          {badge}
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>
              </nav>
            </aside>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-violet-600 font-medium">Loading your space...</p>
                </div>
              </div>
            ) : (
              <>
                {currentView === 'home' && (
                  <HomeView
                    patientProfile={patientProfile}
                    upcomingSessions={upcomingSessions}
                    pastSessions={pastSessions}
                    onCheckIn={() => setCheckInModal(true)}
                    onMessage={() => setMessageModal(true)}
                    onJoinSession={(session) => {
                      // Generate room name from session - must match doctor's logic
                      let room = null;
                      
                      if (session.videoRoomId) {
                        room = session.videoRoomId;
                      } else if (session.videoRoomUrl) {
                        const url = session.videoRoomUrl;
                        if (url.includes('meet.jit.si/')) {
                          room = url.split('meet.jit.si/')[1].split('?')[0].split('#')[0];
                        } else {
                          room = url;
                        }
                      } else if (session.sessionId) {
                        // Generate room ID the same way as when appointment is created
                        room = `mindflow-${session.sessionId}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
                      } else if (session._id) {
                        room = `mindflow-${session._id}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
                      }
                      
                      if (!room) {
                        console.error('No room ID found in session:', session);
                        alert('Unable to join session: Room ID not found.');
                        return;
                      }
                      
                      // Sanitize room ID
                      room = room.toString().replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
                      console.log('Patient joining room:', room);
                      setVideoRoom(room);
                    }}
                  />
                )}
                {currentView === 'sessions' && (
                  <SessionsView
                    sessions={sessions}
                    onCheckIn={(session) => {
                      setSelectedSession(session)
                      setCheckInModal(true)
                    }}
                  />
                )}
                {currentView === 'find-doctor' && (
                  <FindDoctorView
                    doctors={doctors}
                    onSelectDoctor={(doc) => {
                      setSelectedDoctor(doc)
                      setScheduleModal(true)
                    }}
                  />
                )}
                {currentView === 'messages' && (
                  <MessagesView
                    messages={messages}
                    doctorInfo={doctorInfo}
                    conversationId={conversationId}
                    onMessagesUpdate={loadPatientData}
                  />
                )}
                {currentView === 'resources' && <ResourcesView />}
                {currentView === 'journal' && (
                  <JournalView
                    entries={journalEntries}
                    onJournalUpdate={loadPatientData}
                  />
                )}
                {currentView === 'progress' && (
                  <ProgressView
                    pastSessions={pastSessions}
                    moodEntries={moodEntries}
                    moodStats={moodStats}
                    journalEntries={journalEntries}
                  />
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Pre-Session Check-In Modal */}
      {checkInModal && (
        <CheckInModal
          session={selectedSession || upcomingSessions[0]}
          onClose={() => {
            setCheckInModal(false)
            setSelectedSession(null)
          }}
          onSubmit={async (data) => {
            console.log('Check-in submitted:', data)
            setCheckInModal(false)
            setSelectedSession(null)
          }}
        />
      )}

      {/* Message Modal */}
      {messageModal && <MessageModal onClose={() => setMessageModal(false)} />}

      {/* Journal Modal */}
      {journalModal && <JournalEntryModal onClose={() => setJournalModal(false)} onSave={loadPatientData} />}

      {/* Schedule Appointment Modal */}
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

      {/* Video Call Modal */}
      {videoRoom && (
        <AgoraVideoCall
          channelName={videoRoom}
          userName={user?.name || 'Patient'}
          userRole="patient"
          onClose={() => setVideoRoom(null)}
        />
      )}

      {/* Doctor Selection Modal */}
      {doctorSelectModal && (
        <DoctorSelectionModal
          doctors={doctors}
          onClose={() => setDoctorSelectModal(false)}
          onSelect={async (doctor) => {
            try {
              const { patientAPI } = await import('@/lib/api.js')
              const result = await patientAPI.selectDoctor(doctor._id)
              if (result.success) {
                setDoctorSelectModal(false)
                loadPatientData() // Refresh data
              }
            } catch (error) {
              console.error('Failed to select doctor:', error)
            }
          }}
        />
      )}

      {/* Prompt to select doctor if none assigned */}
      {hasNoDoctor && !doctorSelectModal && doctors.length > 0 && (
        <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 bg-violet-600 text-white p-4 rounded-xl shadow-xl z-40">
          <div className="flex items-start gap-3">
            <Users className="w-6 h-6 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Choose Your Doctor</p>
              <p className="text-sm text-violet-100 mt-1">Select a healthcare provider to schedule appointments and start your wellness journey.</p>
              <button
                onClick={() => setDoctorSelectModal(true)}
                className="mt-3 px-4 py-2 bg-white text-violet-600 rounded-lg font-semibold text-sm hover:bg-violet-50"
              >
                Browse Doctors
              </button>
            </div>
            <button onClick={() => setDoctorSelectModal(true)} className="text-white/60 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ==================== HOME VIEW ====================
function HomeView({ patientProfile, upcomingSessions, pastSessions, onCheckIn, onMessage, onJoinSession }) {
  const nextSession = upcomingSessions[0]

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-white shadow-xl">
        <h2 className="font-display text-2xl sm:text-3xl font-bold mb-2">
          Welcome back, {patientProfile?.firstName || 'Friend'}! 💜
        </h2>
        <p className="text-violet-100 text-base sm:text-lg">
          {nextSession
            ? `Your next session is ${new Date(nextSession.scheduledDate).toLocaleDateString()}`
            : 'Take a moment for yourself today'}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        <QuickActionCard
          icon={Calendar}
          title="Pre-Session Check-In"
          description="Share how you're feeling"
          color="violet"
          onClick={onCheckIn}
          disabled={!nextSession}
        />
        <QuickActionCard
          icon={MessageCircle}
          title="Message Counselor"
          description="Send a quick message"
          color="blue"
          onClick={onMessage}
        />
        <QuickActionCard
          icon={Sparkles}
          title="Wellness Tools"
          description="Breathing & relaxation"
          color="purple"
          onClick={() => {}}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Next Session Card */}
          {nextSession && (
            <NextSessionCard 
              session={nextSession} 
              onCheckIn={onCheckIn}
              onJoinSession={onJoinSession}
            />
          )}

          {/* Recent Activity */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-violet-100">
            <h3 className="font-display font-semibold text-base sm:text-lg text-slate-900 mb-3 sm:mb-4">Recent Sessions</h3>
            {pastSessions.length > 0 ? (
              <div className="space-y-3">
                {pastSessions.slice(0, 3).map((session) => (
                  <SessionHistoryItem key={session._id} session={session} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-violet-300 mx-auto mb-3" />
                <p className="text-slate-600">No sessions yet. Your journey starts here!</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 sm:space-y-6">
          {/* Mood Check */}
          <MoodQuickCard />

          {/* Daily Positivity */}
          <DailyPositivityCard />

          {/* Emergency Resources */}
          <EmergencyResourcesCard />
        </div>
      </div>
    </div>
  )
}

// ==================== SESSIONS VIEW ====================
function SessionsView({ sessions, onCheckIn }) {
  const upcoming = sessions.filter((s) => s.status === 'scheduled' || s.status === 'confirmed')
  const past = sessions.filter((s) => s.status === 'completed')

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mb-1 sm:mb-2">My Appointments</h2>
        <p className="text-sm sm:text-base text-slate-600">View and manage your therapy sessions</p>
      </div>

      {/* Upcoming Sessions */}
      {upcoming.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-violet-100">
          <h3 className="font-display font-semibold text-base sm:text-lg text-slate-900 mb-3 sm:mb-4">Upcoming Sessions</h3>
          <div className="space-y-4">
            {upcoming.map((session) => (
              <AppointmentCard key={session._id} session={session} onCheckIn={onCheckIn} />
            ))}
          </div>
        </div>
      )}

      {/* Past Sessions */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-violet-100">
        <h3 className="font-display font-semibold text-base sm:text-lg text-slate-900 mb-3 sm:mb-4">Session History</h3>
        {past.length > 0 ? (
          <div className="space-y-3">
            {past.map((session) => (
              <SessionHistoryItem key={session._id} session={session} />
            ))}
          </div>
        ) : (
          <p className="text-slate-600 text-center py-8">No completed sessions yet</p>
        )}
      </div>
    </div>
  )
}

// ==================== MESSAGES VIEW ====================
function MessagesView({ messages, doctorInfo, conversationId, onMessagesUpdate }) {
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !doctorInfo) return

    try {
      setSending(true)
      const { patientAPI } = await import('@/lib/api.js')

      await patientAPI.sendMessage({
        content: newMessage.trim(),
        recipientId: doctorInfo.id
      })

      setNewMessage('')
      if (onMessagesUpdate) onMessagesUpdate()
    } catch (error) {
      console.error('Failed to send message:', error)
      alert('Failed to send message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  if (!doctorInfo) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="font-display text-3xl font-bold text-slate-900 mb-2">Messages</h2>
          <p className="text-slate-600">Secure communication with your counselor</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 text-center border border-violet-100">
          <MessageCircle className="w-16 h-16 text-violet-300 mx-auto mb-4" />
          <p className="text-slate-600">You don't have an assigned counselor yet. Schedule an appointment first!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mb-1 sm:mb-2">Messages</h2>
        <p className="text-sm sm:text-base text-slate-600">Secure communication with your counselor</p>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-violet-100 overflow-hidden">
        {/* Messages Header */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-3 sm:p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold">{doctorInfo.name}</div>
              <div className="text-sm text-violet-100">{doctorInfo.specialty}</div>
            </div>
          </div>
        </div>

        {/* Messages List */}
        <div className="h-80 sm:h-96 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400">
              <p>No messages yet. Start a conversation!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg._id}
                className={clsx(
                  'flex',
                  msg.senderRole === 'patient' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={clsx(
                    'max-w-xs px-4 py-3 rounded-2xl',
                    msg.senderRole === 'patient'
                      ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-br-none'
                      : 'bg-violet-50 text-slate-900 rounded-bl-none'
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

        {/* Message Input */}
        <div className="border-t border-violet-100 p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !sending && handleSendMessage()}
              placeholder="Type your message..."
              disabled={sending}
              className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white text-base"
            />
            <button
              onClick={handleSendMessage}
              disabled={sending || !newMessage.trim()}
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg active:scale-[0.95] transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 touch-manipulation text-sm sm:text-base"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">{sending ? 'Sending...' : 'Send'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-blue-900 mb-1">Your Privacy Matters</p>
          <p className="text-blue-700">
            Messages are secure and private. For emergencies, please call the crisis hotline.
          </p>
        </div>
      </div>
    </div>
  )
}

// ==================== RESOURCES VIEW ====================
function ResourcesView() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mb-1 sm:mb-2">Wellness Tools</h2>
        <p className="text-sm sm:text-base text-slate-600">Resources to support you between sessions</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        <DailyPositivityCard large />
        <BreathingExerciseCard />
      </div>

      {/* Additional Resources */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <ResourceCard
          icon={BookOpen}
          title="Self-Care Tips"
          description="Practical advice for daily wellness"
          color="violet"
        />
        <ResourceCard
          icon={Heart}
          title="Mindfulness Guide"
          description="Techniques for staying present"
          color="pink"
        />
        <ResourceCard icon={Activity} title="Mood Journal" description="Track your emotional patterns" color="blue" />
      </div>
    </div>
  )
}

// ==================== JOURNAL VIEW ====================
function JournalView({ entries, onJournalUpdate }) {
  const [showModal, setShowModal] = useState(false)
  const [editingEntry, setEditingEntry] = useState(null)

  const handleNewEntry = () => {
    setEditingEntry(null)
    setShowModal(true)
  }

  const handleEdit = (entry) => {
    setEditingEntry(entry)
    setShowModal(true)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mb-1 sm:mb-2">My Journal</h2>
          <p className="text-sm sm:text-base text-slate-600">Your private space for reflection</p>
        </div>
        <button
          onClick={handleNewEntry}
          className="px-4 sm:px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg active:scale-[0.98] transition-all inline-flex items-center justify-center gap-2 touch-manipulation w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          New Entry
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-8 sm:p-12 text-center border border-violet-100">
          <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-violet-300 mx-auto mb-4" />
          <p className="text-sm sm:text-base text-slate-600">No journal entries yet. Start writing to track your thoughts and feelings!</p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {entries.map((entry) => (
            <div key={entry._id} className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-violet-100">
              <div className="flex items-start sm:items-center justify-between mb-3 gap-3">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <MoodIcon mood={entry.mood} />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm sm:text-base text-slate-900">
                      {new Date(entry.createdAt).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                    <div className="text-xs sm:text-sm text-slate-600 capitalize">{entry.mood} mood</div>
                  </div>
                </div>
                <button
                  onClick={() => handleEdit(entry)}
                  className="text-violet-600 hover:text-violet-700 p-2 -mr-2 touch-manipulation flex-shrink-0"
                  aria-label="Edit entry"
                >
                  <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
              <p className="text-sm sm:text-base text-slate-700 whitespace-pre-wrap break-words">{entry.content}</p>
              {entry.tags && entry.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {entry.tags.map((tag, idx) => (
                    <span key={idx} className="px-2 sm:px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-xs sm:text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <JournalEntryModal
          entry={editingEntry}
          onClose={() => setShowModal(false)}
          onSave={onJournalUpdate}
        />
      )}
    </div>
  )
}

// ==================== PROGRESS VIEW ====================
function ProgressView({ pastSessions, moodEntries, moodStats, journalEntries }) {
  const completedSessions = pastSessions.filter(s => s.status === 'completed').length
  const avgMood = moodStats?.averageScore ? moodStats.averageScore.toFixed(1) : 'N/A'
  const totalJournalEntries = journalEntries?.length || 0

  // Calculate mood distribution percentages
  const totalMoodEntries = moodStats?.total || 0
  const moodDistribution = moodStats?.moodDistribution || {}

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mb-1 sm:mb-2">My Progress</h2>
        <p className="text-sm sm:text-base text-slate-600">Track your wellness journey</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={Calendar} label="Sessions Completed" value={completedSessions} color="violet" />
        <StatCard icon={Heart} label="Mood Average" value={totalMoodEntries > 0 ? `${avgMood}/10` : 'No data'} color="pink" />
        <StatCard icon={BookOpen} label="Journal Entries" value={totalJournalEntries} color="purple" />
        <StatCard icon={TrendingUp} label="Mood Checks" value={totalMoodEntries} color="blue" />
      </div>

      {/* Mood Distribution */}
      {totalMoodEntries > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-violet-100">
          <h3 className="font-display font-semibold text-lg text-slate-900 mb-4">Mood Distribution (Last 30 Days)</h3>
          <div className="space-y-3">
            {Object.entries(moodDistribution).map(([mood, count]) => {
              const percentage = totalMoodEntries > 0 ? ((count / totalMoodEntries) * 100).toFixed(1) : 0
              const colors = {
                great: 'bg-green-600',
                good: 'bg-blue-600',
                okay: 'bg-yellow-600',
                struggling: 'bg-orange-600',
                difficult: 'bg-red-600'
              }
              return (
                <div key={mood}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700 capitalize">{mood}</span>
                    <span className="text-sm text-slate-600">{count} ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className={clsx('h-2 rounded-full', colors[mood])}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent Mood Entries */}
      {moodEntries && moodEntries.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-violet-100">
          <h3 className="font-display font-semibold text-lg text-slate-900 mb-4">Recent Mood Log</h3>
          <div className="space-y-3">
            {moodEntries.slice(0, 5).map((entry) => (
              <div key={entry._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <MoodIcon mood={entry.mood} />
                  <div>
                    <div className="font-medium text-slate-900 capitalize">{entry.mood}</div>
                    <div className="text-sm text-slate-600">
                      {new Date(entry.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
                <div className="text-2xl font-bold text-violet-600">{entry.moodScore}/10</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {totalMoodEntries === 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 text-center border border-violet-100">
          <TrendingUp className="w-16 h-16 text-violet-300 mx-auto mb-4" />
          <p className="text-slate-600">Start tracking your mood to see your progress over time!</p>
        </div>
      )}
    </div>
  )
}

// ==================== COMPONENTS ====================

function QuickActionCard({ icon: Icon, title, description, color, onClick, disabled }) {
  const colors = {
    violet: 'from-violet-600 to-purple-600',
    blue: 'from-blue-600 to-cyan-600',
    purple: 'from-purple-600 to-pink-600',
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-violet-100 text-left hover:shadow-xl active:scale-[0.98] transition-all touch-manipulation',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <div className={clsx('w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br', colors[color], 'flex items-center justify-center mb-3 sm:mb-4')}>
        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
      </div>
      <h3 className="font-display font-semibold text-sm sm:text-base text-slate-900 mb-1">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-600">{description}</p>
    </button>
  )
}

function NextSessionCard({ session, onCheckIn, onJoinSession }) {
  // Calculate session timing
  const now = new Date()
  const sessionStart = new Date(session.scheduledDate)
  const sessionDuration = session.duration || 50 // default 50 minutes
  const sessionEnd = new Date(sessionStart.getTime() + sessionDuration * 60 * 1000)

  // Join window: 15 minutes before to 15 minutes after session end
  const joinWindowStart = new Date(sessionStart.getTime() - 15 * 60 * 1000)
  const joinWindowEnd = new Date(sessionEnd.getTime() + 15 * 60 * 1000)

  const canJoin = now >= joinWindowStart && now <= joinWindowEnd
  const hasEnded = now > joinWindowEnd
  const notStartedYet = now < joinWindowStart

  // Calculate time until session
  const timeDiff = sessionStart.getTime() - now.getTime()
  const minutesUntil = Math.floor(timeDiff / (1000 * 60))
  const hoursUntil = Math.floor(minutesUntil / 60)

  const getTimeStatus = () => {
    if (hasEnded) return { text: 'Session ended', color: 'text-violet-200' }
    if (canJoin) return { text: 'Join now', color: 'text-green-300' }
    if (minutesUntil < 60) return { text: `Starts in ${minutesUntil} min`, color: 'text-yellow-300' }
    if (hoursUntil < 24) return { text: `Starts in ${hoursUntil}h ${minutesUntil % 60}m`, color: 'text-violet-200' }
    return { text: 'Upcoming', color: 'text-violet-200' }
  }

  const timeStatus = getTimeStatus()

  return (
    <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-xl">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="font-display font-semibold text-base sm:text-lg">Next Session</h3>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium ${timeStatus.color}`}>{timeStatus.text}</span>
          <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>
      <div className="space-y-2 sm:space-y-3">
        <div>
          <p className="text-violet-100 text-xs sm:text-sm mb-1">Date & Time</p>
          <p className="font-semibold text-base sm:text-lg">
            {new Date(session.scheduledDate).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          <p className="text-violet-100 text-sm sm:text-base">
            {new Date(session.scheduledDate).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-3">
          {!session.checkInCompleted && !hasEnded && (
            <button
              onClick={onCheckIn}
              className="flex-1 px-4 py-3 bg-white text-violet-600 rounded-xl font-semibold hover:bg-violet-50 active:scale-[0.98] transition-all touch-manipulation text-sm sm:text-base"
            >
              Complete Check-in
            </button>
          )}
          {canJoin && (session.videoRoomUrl || session.videoRoomId || session._id) && (
            <button
              onClick={() => onJoinSession && onJoinSession(session)}
              className="flex-1 px-4 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 active:scale-[0.98] transition-all inline-flex items-center justify-center gap-2 touch-manipulation text-sm sm:text-base"
            >
              <Video className="w-4 h-4" />
              Join Session
            </button>
          )}
          {notStartedYet && !canJoin && (
            <div className="flex-1 px-4 py-3 bg-white/10 text-white/70 rounded-xl font-medium text-center text-sm sm:text-base">
              <Clock className="w-4 h-4 inline mr-2" />
              Available {minutesUntil < 60 ? `in ${minutesUntil} min` : `in ${hoursUntil}h`}
            </div>
          )}
          {hasEnded && (
            <div className="flex-1 px-4 py-3 bg-white/10 text-white/70 rounded-xl font-medium text-center text-sm sm:text-base">
              Session has ended
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AppointmentCard({ session, onCheckIn }) {
  return (
    <div className="bg-violet-50 rounded-xl p-3 sm:p-4 border border-violet-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1">
          <p className="font-semibold text-sm sm:text-base text-slate-900">
            {new Date(session.scheduledDate).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </p>
          <p className="text-xs sm:text-sm text-slate-600">
            {new Date(session.scheduledDate).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!session.checkInCompleted && (
            <button
              onClick={() => onCheckIn(session)}
              className="px-4 py-2.5 bg-violet-600 text-white rounded-lg text-sm font-semibold hover:bg-violet-700 active:scale-[0.95] transition-all touch-manipulation w-full sm:w-auto"
            >
              Check-in
            </button>
          )}
          {session.checkInCompleted && <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />}
        </div>
      </div>
    </div>
  )
}

function SessionHistoryItem({ session }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors">
      <div className="flex items-center gap-3">
        <CheckCircle className="w-5 h-5 text-green-600" />
        <div>
          <p className="font-semibold text-slate-900 text-sm">
            {new Date(session.scheduledDate).toLocaleDateString()}
          </p>
          <p className="text-xs text-slate-600">{session.type || 'Follow-up'}</p>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-400" />
    </div>
  )
}

function MoodQuickCard() {
  const [mood, setMood] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Map mood strings to scores
  const moodScoreMap = {
    'great': 9,
    'okay': 5,
    'struggling': 2
  }

  const handleMoodSelect = async (selectedMood) => {
    if (saving || saved) return
    
    setMood(selectedMood)
    setSaved(false)
    setSaving(true)

    try {
      const { patientAPI } = await import('@/lib/api.js')
      const moodScore = moodScoreMap[selectedMood]
      
      await patientAPI.logMood({
        mood: selectedMood,
        moodScore: moodScore
      })

      setSaved(true)
      // Reset saved state after 3 seconds
      setTimeout(() => {
        setSaved(false)
      }, 3000)
    } catch (error) {
      console.error('Failed to save mood:', error)
      alert('Failed to save mood. Please try again.')
      setMood(null)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-violet-100">
      <h3 className="font-display font-semibold text-base sm:text-lg text-slate-900 mb-3 sm:mb-4">How are you feeling?</h3>
      <div className="flex justify-around mb-3 sm:mb-4">
        <button
          onClick={() => handleMoodSelect('great')}
          disabled={saving}
          className={clsx(
            'p-2.5 sm:p-3 rounded-full transition-all touch-manipulation active:scale-95',
            mood === 'great' ? 'bg-green-100 scale-110' : 'hover:bg-slate-50 active:bg-slate-100',
            saving && 'opacity-50 cursor-not-allowed'
          )}
          aria-label="Great mood"
        >
          <Smile className="w-7 h-7 sm:w-8 sm:h-8 text-green-600" />
        </button>
        <button
          onClick={() => handleMoodSelect('okay')}
          disabled={saving}
          className={clsx(
            'p-2.5 sm:p-3 rounded-full transition-all touch-manipulation active:scale-95',
            mood === 'okay' ? 'bg-yellow-100 scale-110' : 'hover:bg-slate-50 active:bg-slate-100',
            saving && 'opacity-50 cursor-not-allowed'
          )}
          aria-label="Okay mood"
        >
          <Meh className="w-7 h-7 sm:w-8 sm:h-8 text-yellow-600" />
        </button>
        <button
          onClick={() => handleMoodSelect('struggling')}
          disabled={saving}
          className={clsx(
            'p-2.5 sm:p-3 rounded-full transition-all touch-manipulation active:scale-95',
            mood === 'struggling' ? 'bg-red-100 scale-110' : 'hover:bg-slate-50 active:bg-slate-100',
            saving && 'opacity-50 cursor-not-allowed'
          )}
          aria-label="Struggling mood"
        >
          <Frown className="w-7 h-7 sm:w-8 sm:h-8 text-red-600" />
        </button>
      </div>
      {saving && (
        <p className="text-xs sm:text-sm text-center text-violet-600">
          Saving your mood...
        </p>
      )}
      {saved && !saving && (
        <p className="text-xs sm:text-sm text-center text-green-600 font-medium">
          ✓ Thanks for sharing! Your counselor can see your mood trends.
        </p>
      )}
      {mood && !saving && !saved && (
        <p className="text-xs sm:text-sm text-center text-slate-600">
          Thanks for sharing. Your counselor can see your mood trends.
        </p>
      )}
    </div>
  )
}

function DailyPositivityCard({ large }) {
  const messages = [
    'Take one small step today. Small steps stack into big change.',
    'Your feelings are valid — and they are not permanent.',
    'Breathe. Reset. Continue. You\'re allowed to go slowly.',
    'Progress is not linear. Showing up still counts.',
    'Be kinder to yourself than you are to your inner critic.',
    'If today is heavy, aim for "good enough," not perfect.',
    'You don\'t have to do it all. Do the next right thing.',
  ]
  const idx = Math.abs(Math.floor(Date.now() / (1000 * 60 * 60 * 24))) % messages.length
  const msg = messages[idx]

  return (
    <div className={clsx('bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-violet-100', large && 'lg:row-span-2')}>
      <div className="flex items-start justify-between gap-3 mb-3 sm:mb-4">
        <div>
          <h3 className="font-display font-semibold text-base sm:text-lg text-slate-900">Daily Message</h3>
          <p className="text-xs sm:text-sm text-slate-600">A gentle reminder for today</p>
        </div>
        <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-violet-600 flex-shrink-0" />
      </div>
      <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-100">
        <p className="text-sm sm:text-base text-slate-800 leading-relaxed">"{msg}"</p>
      </div>
    </div>
  )
}

function BreathingExerciseCard() {
  const [mode, setMode] = useState('box')
  const [running, setRunning] = useState(false)
  const [phase, setPhase] = useState('Ready')
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    if (!running) return
    const t = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [running])

  useEffect(() => {
    if (!running) {
      setPhase('Ready')
      return
    }

    if (mode === 'box') {
      const step = seconds % 16
      if (step < 4) setPhase('Inhale')
      else if (step < 8) setPhase('Hold')
      else if (step < 12) setPhase('Exhale')
      else setPhase('Hold')
    } else {
      const step = seconds % 19
      if (step < 4) setPhase('Inhale')
      else if (step < 11) setPhase('Hold')
      else setPhase('Exhale')
    }
  }, [running, seconds, mode])

  const reset = () => {
    setRunning(false)
    setSeconds(0)
    setPhase('Ready')
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-violet-100">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div>
          <h3 className="font-display font-semibold text-base sm:text-lg text-slate-900">Breathing Exercise</h3>
          <p className="text-xs sm:text-sm text-slate-600">Guided relaxation timer</p>
        </div>
        <div className="inline-flex items-center gap-2">
          <button
            onClick={() => setMode('box')}
            className={clsx(
              'px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all touch-manipulation active:scale-95',
              mode === 'box'
                ? 'bg-violet-600 text-white border-violet-600 shadow-lg'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 active:bg-slate-100'
            )}
          >
            Box 4-4-4-4
          </button>
          <button
            onClick={() => setMode('478')}
            className={clsx(
              'px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all touch-manipulation active:scale-95',
              mode === '478'
                ? 'bg-violet-600 text-white border-violet-600 shadow-lg'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 active:bg-slate-100'
            )}
          >
            4-7-8
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200 mb-3 sm:mb-4">
        <div className="text-xs text-violet-600 font-semibold uppercase tracking-wide mb-2">Current phase</div>
        <div className="text-2xl sm:text-3xl font-display font-bold text-slate-900 mb-2">{phase}</div>
        <div className="text-xs sm:text-sm text-slate-600">Time: {seconds}s</div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <button
          onClick={() => setRunning((v) => !v)}
          className={clsx(
            'flex-1 py-3 rounded-xl font-semibold text-sm inline-flex items-center justify-center gap-2 shadow-lg transition-all touch-manipulation active:scale-[0.98]',
            running
              ? 'bg-slate-900 text-white hover:bg-slate-800'
              : 'bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:shadow-xl'
          )}
        >
          {running ? <PauseCircle className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
          {running ? 'Pause' : 'Start'}
        </button>
        <button
          onClick={reset}
          className="px-4 py-3 border border-slate-200 rounded-xl font-semibold text-sm text-slate-700 hover:bg-slate-50 active:bg-slate-100 inline-flex items-center justify-center gap-2 touch-manipulation active:scale-[0.98]"
        >
          <RotateCcw className="w-5 h-5" />
          Reset
        </button>
      </div>
    </div>
  )
}

function EmergencyResourcesCard() {
  return (
    <div className="bg-red-50 border-2 border-red-200 rounded-xl sm:rounded-2xl p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
        <h3 className="font-display font-semibold text-sm sm:text-base text-red-900">Crisis Support</h3>
      </div>
      <p className="text-xs sm:text-sm text-red-800 mb-3 sm:mb-4">If you're in crisis, help is available 24/7</p>
      <div className="space-y-2">
        <a 
          href="tel:1122"
          className="w-full px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 active:scale-[0.98] transition-all inline-flex items-center justify-center gap-2 touch-manipulation text-sm sm:text-base"
        >
          <Phone className="w-4 h-4" />
          Call Emergency Services
        </a>
        <p className="text-center text-xs text-red-700">1122 - Pakistan Emergency Services</p>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    violet: 'from-violet-600 to-purple-600',
    green: 'from-green-600 to-emerald-600',
    pink: 'from-pink-600 to-rose-600',
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-violet-100">
      <div className={clsx('w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br', colors[color], 'flex items-center justify-center mb-3 sm:mb-4')}>
        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
      </div>
      <p className="text-xs sm:text-sm text-slate-600 mb-1">{label}</p>
      <p className="text-2xl sm:text-3xl font-bold text-slate-900">{value}</p>
    </div>
  )
}

function ResourceCard({ icon: Icon, title, description, color }) {
  const colors = {
    violet: 'from-violet-600 to-purple-600',
    pink: 'from-pink-600 to-rose-600',
    blue: 'from-blue-600 to-cyan-600',
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-violet-100 hover:shadow-lg active:scale-[0.98] transition-all cursor-pointer touch-manipulation">
      <div className={clsx('w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br', colors[color], 'flex items-center justify-center mb-3')}>
        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
      </div>
      <h3 className="font-display font-semibold text-sm sm:text-base text-slate-900 mb-1">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-600">{description}</p>
    </div>
  )
}

function MoodIcon({ mood }) {
  const icons = {
    great: { Icon: Smile, color: 'text-green-600', bg: 'bg-green-100' },
    good: { Icon: Smile, color: 'text-green-500', bg: 'bg-green-50' },
    okay: { Icon: Meh, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    struggling: { Icon: Frown, color: 'text-red-600', bg: 'bg-red-100' },
  }

  const { Icon, color, bg } = icons[mood] || icons.okay

  return (
    <div className={clsx('w-10 h-10 rounded-full flex items-center justify-center', bg)}>
      <Icon className={clsx('w-5 h-5', color)} />
    </div>
  )
}

// ==================== MODALS ====================

function CheckInModal({ session, onClose, onSubmit }) {
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    mood: 5,
    primaryConcern: '',
    severity: 3,
    note: '',
    sleepQuality: 5,
    energyLevel: 5,
    stressLevel: 5,
  })

  const handleSubmit = async () => {
    if (!formData.primaryConcern) {
      alert('Please select your main concern')
      return
    }

    try {
      setSubmitting(true)
      const { patientAPI } = await import('@/lib/api.js')

      await patientAPI.submitCheckIn({
        sessionId: session?._id,
        mood: formData.mood,
        primaryConcern: formData.primaryConcern,
        severity: formData.severity,
        specificConcerns: [],
        note: formData.note,
        sleepQuality: formData.sleepQuality,
        energyLevel: formData.energyLevel,
        stressLevel: formData.stressLevel
      })

      alert('Check-in submitted successfully!')
      if (onSubmit) onSubmit(formData)
      onClose()
    } catch (error) {
      console.error('Failed to submit check-in:', error)
      alert('Failed to submit check-in. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl max-w-lg w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-violet-100 p-4 sm:p-6 z-10">
          <div className="flex items-start sm:items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-lg sm:text-xl font-bold text-slate-900">Pre-Session Check-In</h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">Help your counselor prepare for your session</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 -mr-2 flex-shrink-0 touch-manipulation" aria-label="Close">
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Mood Slider */}
          <div>
            <label className="block text-sm sm:text-base font-semibold text-slate-900 mb-3">
              How are you feeling today? (1-10)
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={formData.mood}
              onChange={(e) => setFormData({ ...formData, mood: parseInt(e.target.value) })}
              className="w-full h-2 sm:h-2 touch-manipulation"
            />
            <div className="flex justify-between text-xs sm:text-sm text-slate-600 mt-2">
              <span>Not great</span>
              <span className="text-xl sm:text-2xl font-bold text-violet-600">{formData.mood}</span>
              <span>Excellent</span>
            </div>
          </div>

          {/* Primary Concern */}
          <div>
            <label className="block text-sm sm:text-base font-semibold text-slate-900 mb-3">What's your main focus today?</label>
            <select
              value={formData.primaryConcern}
              onChange={(e) => setFormData({ ...formData, primaryConcern: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-500 text-base touch-manipulation"
            >
              <option value="">Select...</option>
              <option value="Anxiety">Anxiety</option>
              <option value="Depression">Depression</option>
              <option value="Stress">Stress</option>
              <option value="Work/School">Work/School</option>
              <option value="Relationships">Relationships</option>
              <option value="Sleep">Sleep</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Severity */}
          <div>
            <label className="block text-sm sm:text-base font-semibold text-slate-900 mb-3">How intense is this concern? (1-5)</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  onClick={() => setFormData({ ...formData, severity: num })}
                  className={clsx(
                    'flex-1 py-3 rounded-xl border-2 font-semibold transition-all text-base touch-manipulation active:scale-[0.95]',
                    formData.severity === num
                      ? 'border-violet-600 bg-violet-50 text-violet-600'
                      : 'border-slate-200 hover:border-violet-300 active:bg-slate-50'
                  )}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm sm:text-base font-semibold text-slate-900 mb-3">
              Anything else you'd like to share? (Optional)
            </label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              rows="4"
              className="w-full px-4 py-3 rounded-xl border border-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-500 text-base resize-y min-h-[80px]"
              placeholder="Share what's on your mind..."
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-violet-100 p-4 sm:p-6">
          <button
            onClick={handleSubmit}
            disabled={!formData.primaryConcern || submitting}
            className="w-full px-4 sm:px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation text-base"
          >
            {submitting ? 'Submitting...' : 'Submit Check-In'}
          </button>
        </div>
      </div>
    </div>
  )
}

function MessageModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6 border-b border-violet-100">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg sm:text-xl font-bold text-slate-900">Send Message</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 -mr-2 touch-manipulation" aria-label="Close">
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>
        <div className="p-4 sm:p-6">
          <textarea
            rows="6"
            className="w-full px-4 py-3 rounded-xl border border-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-500 mb-4 text-base resize-y min-h-[120px]"
            placeholder="Type your message to your counselor..."
          />
          <button className="w-full px-4 sm:px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg active:scale-[0.98] transition-all touch-manipulation text-base">
            Send Message
          </button>
        </div>
      </div>
    </div>
  )
}

function JournalEntryModal({ entry, onClose, onSave }) {
  const [formData, setFormData] = useState({
    mood: entry?.mood || 'okay',
    content: entry?.content || '',
    tags: entry?.tags?.join(', ') || ''
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.content.trim()) {
      alert('Please write something in your journal entry')
      return
    }

    try {
      setSubmitting(true)
      const { patientAPI } = await import('@/lib/api.js')

      await patientAPI.createJournalEntry({
        mood: formData.mood,
        content: formData.content.trim(),
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
      })

      alert('Journal entry saved!')
      if (onSave) onSave()
      onClose()
    } catch (error) {
      console.error('Failed to save journal entry:', error)
      alert('Failed to save journal entry. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-violet-100 p-4 sm:p-6 z-10">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg sm:text-xl font-bold text-slate-900">
              {entry ? 'View Entry' : 'New Journal Entry'}
            </h3>
            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-slate-600 p-2 -mr-2 touch-manipulation"
              aria-label="Close"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div>
            <label className="block text-sm sm:text-base font-semibold text-slate-900 mb-3">How are you feeling?</label>
            <div className="flex gap-2 overflow-x-auto pb-2 sm:grid sm:grid-cols-5 sm:overflow-x-visible sm:pb-0 scrollbar-hide">
              {['great', 'good', 'okay', 'struggling', 'difficult'].map((mood) => (
                <button
                  key={mood}
                  type="button"
                  onClick={() => setFormData({ ...formData, mood })}
                  className={clsx(
                    'min-w-[100px] sm:min-w-0 px-3 sm:px-4 py-3 sm:py-3 rounded-xl font-medium capitalize transition-all text-sm sm:text-base touch-manipulation',
                    formData.mood === mood
                      ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg'
                      : 'bg-violet-50 text-violet-700 hover:bg-violet-100 active:bg-violet-200'
                  )}
                >
                  {mood}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm sm:text-base font-semibold text-slate-900 mb-3">What's on your mind?</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={8}
              required
              placeholder="Write freely about your thoughts, feelings, and experiences..."
              className="w-full px-4 py-3 rounded-xl border border-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-500 text-base sm:text-base resize-y min-h-[120px]"
            />
          </div>

          <div>
            <label className="block text-sm sm:text-base font-semibold text-slate-900 mb-3">Tags (comma-separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="anxiety, work, family, progress..."
              className="w-full px-4 py-3 rounded-xl border border-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-500 text-base"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 sm:pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 sm:py-3 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 active:bg-slate-100 transition-all touch-manipulation text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-3 sm:py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation text-base"
            >
              {submitting ? 'Saving...' : 'Save Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ==================== FIND DOCTOR VIEW ====================
function FindDoctorView({ doctors, onSelectDoctor }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl font-bold text-slate-900 mb-2">Find a Counselor</h2>
        <p className="text-slate-600">Choose a counselor that's right for you</p>
      </div>

      {doctors.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 text-center border border-violet-100">
          <Users className="w-16 h-16 text-violet-300 mx-auto mb-4" />
          <p className="text-slate-600">No counselors available at this time.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {doctors.map((doctor) => (
            <DoctorCard key={doctor._id} doctor={doctor} onSelect={() => onSelectDoctor(doctor)} />
          ))}
        </div>
      )}
    </div>
  )
}

function DoctorCard({ doctor, onSelect }) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-violet-100 hover:shadow-xl transition-all">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white font-semibold text-xl">
          {doctor.firstName[0]}{doctor.lastName[0]}
        </div>
        <div className="flex-1">
          <h3 className="font-display font-semibold text-lg text-slate-900">
            {doctor.title} {doctor.firstName} {doctor.lastName}
          </h3>
          <p className="text-violet-600 font-medium">{doctor.specialty}</p>
        </div>
      </div>

      {doctor.bio && (
        <p className="text-slate-700 text-sm mb-4 line-clamp-3">{doctor.bio}</p>
      )}

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-3 bg-violet-50 rounded-lg">
          <div className="text-2xl font-bold text-violet-700">{doctor.stats?.yearsOfExperience || 0}</div>
          <div className="text-xs text-slate-600">Years</div>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-700">{doctor.stats?.totalSessions || 0}</div>
          <div className="text-xs text-slate-600">Sessions</div>
        </div>
        <div className="text-center p-3 bg-pink-50 rounded-lg">
          <div className="text-2xl font-bold text-pink-700">{doctor.stats?.currentPatients || 0}</div>
          <div className="text-xs text-slate-600">Patients</div>
        </div>
      </div>

      <button
        onClick={onSelect}
        className="w-full px-4 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
      >
        Schedule Appointment
      </button>
    </div>
  )
}

function ScheduleAppointmentModal({ doctor, onClose, onScheduled }) {
  const [formData, setFormData] = useState({
    scheduledDate: '',
    time: '',
    mode: 'video',
    type: 'follow-up',
    notes: ''
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.scheduledDate || !formData.time) {
      alert('Please select date and time')
      return
    }

    try {
      setSubmitting(true)
      const { patientAPI } = await import('@/lib/api.js')

      const dateTime = new Date(`${formData.scheduledDate}T${formData.time}`)

      await patientAPI.scheduleAppointment({
        doctorId: doctor._id,
        scheduledDate: dateTime.toISOString(),
        mode: formData.mode,
        type: formData.type,
        notes: formData.notes
      })

      alert('Appointment scheduled successfully!')
      if (onScheduled) onScheduled()
      onClose()
    } catch (error) {
      console.error('Failed to schedule appointment:', error)
      alert(error.message || 'Failed to schedule appointment.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl max-w-md w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="border-b border-violet-100 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-xl sm:text-2xl text-slate-900">Schedule Appointment</h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg touch-manipulation" aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-3 sm:p-4 bg-violet-50 rounded-xl">
            <div className="font-semibold text-sm sm:text-base text-slate-900">
              {doctor.title} {doctor.firstName} {doctor.lastName}
            </div>
            <div className="text-xs sm:text-sm text-violet-600">{doctor.specialty}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-sm sm:text-base font-medium text-slate-700 mb-2">Date</label>
            <input
              type="date"
              value={formData.scheduledDate}
              onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              required
              className="w-full px-4 py-3 rounded-xl border border-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-500 text-base touch-manipulation"
            />
          </div>

          <div>
            <label className="block text-sm sm:text-base font-medium text-slate-700 mb-2">Time</label>
            <input
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              required
              className="w-full px-4 py-3 rounded-xl border border-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-500 text-base touch-manipulation"
            />
          </div>

          <div>
            <label className="block text-sm sm:text-base font-medium text-slate-700 mb-2">Mode</label>
            <select
              value={formData.mode}
              onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-500 text-base touch-manipulation"
            >
              <option value="video">Video Call</option>
              <option value="in-person">In-Person</option>
              <option value="phone">Phone Call</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 active:bg-slate-100 transition-all touch-manipulation text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation text-base"
            >
              {submitting ? 'Scheduling...' : 'Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ==================== DOCTOR SELECTION MODAL ====================

function DoctorSelectionModal({ doctors, onClose, onSelect }) {
  const [selecting, setSelecting] = useState(null)

  const handleSelect = async (doctor) => {
    setSelecting(doctor._id)
    await onSelect(doctor)
    setSelecting(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6" />
            <div>
              <h2 className="text-lg font-semibold">Choose Your Doctor</h2>
              <p className="text-sm text-violet-100">Select a healthcare provider to get started</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {doctors.length > 0 ? (
            <div className="space-y-4">
              {doctors.map((doctor) => (
                <div
                  key={doctor._id}
                  className="p-4 border border-slate-200 rounded-xl hover:border-violet-300 hover:bg-violet-50/50 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center text-violet-700 font-bold text-lg flex-shrink-0">
                      {doctor.firstName?.[0]}{doctor.lastName?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900">
                        {doctor.title || 'Dr.'} {doctor.firstName} {doctor.lastName}
                      </h3>
                      <p className="text-sm text-violet-600 font-medium">{doctor.specialty || 'General Practice'}</p>
                      {doctor.bio && (
                        <p className="text-sm text-slate-600 mt-2 line-clamp-2">{doctor.bio}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {doctor.yearsOfExperience && (
                          <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">
                            {doctor.yearsOfExperience}+ years exp
                          </span>
                        )}
                        {doctor.stats?.currentPatients !== undefined && (
                          <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">
                            {doctor.stats.currentPatients} patients
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleSelect(doctor)}
                      disabled={selecting === doctor._id}
                      className="px-4 py-2 bg-violet-600 text-white rounded-lg font-semibold text-sm hover:bg-violet-700 disabled:opacity-50 flex-shrink-0"
                    >
                      {selecting === doctor._id ? 'Selecting...' : 'Select'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 text-lg font-medium">No doctors available</p>
              <p className="text-slate-500 text-sm mt-2">Please check back later</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
