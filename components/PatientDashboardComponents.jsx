'use client'

import React, { useState } from 'react'
import { Calendar, Users, Star, Clock, Video, MapPin, Award, Plus, Edit, Send, User, Smile, Meh, Frown, X } from 'lucide-react'

function clsx(...args) {
  return args.filter(Boolean).join(' ')
}

// ==================== JOURNAL VIEW (WITH REAL DATA) ====================
export function JournalView({ entries, onJournalUpdate }) {
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl font-bold text-slate-900 mb-2">My Journal</h2>
          <p className="text-slate-600">Your private space for reflection</p>
        </div>
        <button
          onClick={handleNewEntry}
          className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Entry
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 text-center border border-violet-100">
          <p className="text-slate-600">No journal entries yet. Start writing to track your thoughts and feelings!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <div key={entry._id} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-violet-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <MoodIcon mood={entry.mood} />
                  <div>
                    <div className="font-semibold text-slate-900">
                      {new Date(entry.createdAt).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                    <div className="text-sm text-slate-600 capitalize">{entry.mood} mood</div>
                  </div>
                </div>
                <button
                  onClick={() => handleEdit(entry)}
                  className="text-violet-600 hover:text-violet-700"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
              <p className="text-slate-700 whitespace-pre-wrap">{entry.content}</p>
              {entry.tags && entry.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {entry.tags.map((tag, idx) => (
                    <span key={idx} className="px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-sm">
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

// ==================== MESSAGES VIEW (WITH REAL DATA) ====================
export function MessagesView({ messages, doctorInfo, conversationId, onMessagesUpdate }) {
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
          <p className="text-slate-600">You don't have an assigned counselor yet. Schedule an appointment first!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl font-bold text-slate-900 mb-2">Messages</h2>
        <p className="text-slate-600">Secure communication with your counselor</p>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-violet-100 overflow-hidden">
        {/* Messages Header */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-4 text-white">
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
        <div className="h-96 overflow-y-auto p-6 space-y-4">
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
        <div className="p-4 border-t border-violet-100">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !sending && handleSendMessage()}
              placeholder="Type your message..."
              disabled={sending}
              className="flex-1 px-4 py-3 rounded-xl border border-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <button
              onClick={handleSendMessage}
              disabled={sending || !newMessage.trim()}
              className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {sending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
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

// ==================== FIND DOCTOR VIEW ====================
export function FindDoctorView({ doctors, onSelectDoctor }) {
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

// ==================== DOCTOR CARD ====================
export function DoctorCard({ doctor, onSelect }) {
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
          {doctor.subSpecialties && doctor.subSpecialties.length > 0 && (
            <p className="text-sm text-slate-600 mt-1">
              {doctor.subSpecialties.join(', ')}
            </p>
          )}
        </div>
      </div>

      {doctor.bio && (
        <p className="text-slate-700 text-sm mb-4 line-clamp-3">{doctor.bio}</p>
      )}

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-3 bg-violet-50 rounded-lg">
          <div className="text-2xl font-bold text-violet-700">{doctor.stats?.yearsOfExperience || 0}</div>
          <div className="text-xs text-slate-600">Years Exp.</div>
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

      {doctor.stats?.availableDays && doctor.stats.availableDays.length > 0 && (
        <div className="mb-4">
          <div className="text-sm text-slate-600 mb-2">Available:</div>
          <div className="flex flex-wrap gap-2">
            {doctor.stats.availableDays.map(day => (
              <span key={day} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs capitalize">
                {day}
              </span>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onSelect}
        disabled={!doctor.stats?.isAvailable}
        className="w-full px-4 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {doctor.stats?.isAvailable ? 'Schedule Appointment' : 'Not Available'}
      </button>
    </div>
  )
}

// ==================== SCHEDULE APPOINTMENT MODAL ====================
export function ScheduleAppointmentModal({ doctor, onClose, onScheduled }) {
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

      // Combine date and time
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
      alert(error.message || 'Failed to schedule appointment. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-bold text-2xl text-slate-900">Schedule Appointment</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6 p-4 bg-violet-50 rounded-xl">
          <div className="font-semibold text-slate-900">
            {doctor.title} {doctor.firstName} {doctor.lastName}
          </div>
          <div className="text-sm text-violet-600">{doctor.specialty}</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
            <input
              type="date"
              value={formData.scheduledDate}
              onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              required
              className="w-full px-4 py-3 rounded-xl border border-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Time</label>
            <input
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              required
              className="w-full px-4 py-3 rounded-xl border border-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Session Mode</label>
            <select
              value={formData.mode}
              onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="video">Video Call</option>
              <option value="in-person">In-Person</option>
              <option value="phone">Phone Call</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Session Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="initial">Initial Consultation</option>
              <option value="follow-up">Follow-up Session</option>
              <option value="emergency">Emergency Session</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Notes (Optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Any specific concerns or topics you'd like to discuss..."
              className="w-full px-4 py-3 rounded-xl border border-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
            >
              {submitting ? 'Scheduling...' : 'Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ==================== JOURNAL ENTRY MODAL ====================
export function JournalEntryModal({ entry, onClose, onSave }) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-bold text-2xl text-slate-900">
            {entry ? 'View Entry' : 'New Journal Entry'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">How are you feeling?</label>
            <div className="grid grid-cols-5 gap-2">
              {['great', 'good', 'okay', 'struggling', 'difficult'].map((mood) => (
                <button
                  key={mood}
                  type="button"
                  onClick={() => setFormData({ ...formData, mood })}
                  className={clsx(
                    'px-4 py-3 rounded-xl font-medium capitalize transition-all',
                    formData.mood === mood
                      ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white'
                      : 'bg-violet-50 text-violet-700 hover:bg-violet-100'
                  )}
                >
                  {mood}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">What's on your mind?</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={10}
              required
              placeholder="Write freely about your thoughts, feelings, and experiences..."
              className="w-full px-4 py-3 rounded-xl border border-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Tags (comma-separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="anxiety, work, family, progress..."
              className="w-full px-4 py-3 rounded-xl border border-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ==================== HELPER COMPONENTS ====================
function MoodIcon({ mood }) {
  const icons = {
    great: { icon: Smile, color: 'text-green-600' },
    good: { icon: Smile, color: 'text-blue-600' },
    okay: { icon: Meh, color: 'text-yellow-600' },
    struggling: { icon: Frown, color: 'text-orange-600' },
    difficult: { icon: Frown, color: 'text-red-600' }
  }

  const { icon: Icon, color } = icons[mood] || icons.okay
  return <Icon className={clsx('w-6 h-6', color)} />
}
