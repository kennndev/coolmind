'use client'

import React, { useState, useEffect } from 'react'
import {
  X,
  Save,
  FileText,
  AlertTriangle,
  Loader2,
  CheckCircle,
  Clock,
  User
} from 'lucide-react'

export default function SessionNotesModal({ session, onClose, onSaved }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  const [notes, setNotes] = useState({
    sessionNotes: '',
    presentingConcerns: '',
    keyObservations: '',
    interventionsUsed: '',
    treatmentPlan: '',
    homework: '',
    riskAssessment: 'none',
    riskNotes: ''
  })

  const [patientInfo, setPatientInfo] = useState(null)

  useEffect(() => {
    if (session?._id) {
      loadNotes()
    } else {
      setLoading(false)
    }
  }, [session])

  const loadNotes = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/doctor/sessions/${session._id}/notes`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (data.success) {
        setNotes(data.notes)
        setPatientInfo(data.patient)
      }
    } catch (err) {
      console.error('Failed to load notes:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)

      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/doctor/sessions/${session._id}/notes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(notes)
      })

      const data = await response.json()

      if (data.success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
        onSaved?.()
      } else {
        setError(data.message || 'Failed to save notes')
      }
    } catch (err) {
      setError('Failed to save notes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field, value) => {
    setNotes(prev => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  const patientName = patientInfo
    ? `${patientInfo.firstName} ${patientInfo.lastName}`
    : session?.patientId?.firstName
      ? `${session.patientId.firstName} ${session.patientId.lastName}`
      : 'Patient'

  const sessionDate = session?.scheduledDate
    ? new Date(session.scheduledDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
    : ''

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6" />
            <div>
              <h2 className="text-lg font-semibold">Session Notes</h2>
              <div className="flex items-center gap-4 text-sm text-violet-100">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {patientName}
                </span>
                {sessionDate && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {sessionDate}
                  </span>
                )}
              </div>
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
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Quick Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Session Notes (Quick Summary)
                </label>
                <textarea
                  value={notes.sessionNotes}
                  onChange={(e) => handleChange('sessionNotes', e.target.value)}
                  placeholder="Write a quick summary of the session..."
                  className="w-full h-32 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                />
              </div>

              {/* Structured Notes Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Presenting Concerns */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Presenting Concerns
                  </label>
                  <textarea
                    value={notes.presentingConcerns}
                    onChange={(e) => handleChange('presentingConcerns', e.target.value)}
                    placeholder="What issues did the patient present today?"
                    className="w-full h-28 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none text-sm"
                  />
                </div>

                {/* Key Observations */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Key Observations
                  </label>
                  <textarea
                    value={notes.keyObservations}
                    onChange={(e) => handleChange('keyObservations', e.target.value)}
                    placeholder="Notable observations about mood, behavior, progress..."
                    className="w-full h-28 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none text-sm"
                  />
                </div>

                {/* Interventions Used */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Interventions / Techniques Used
                  </label>
                  <textarea
                    value={notes.interventionsUsed}
                    onChange={(e) => handleChange('interventionsUsed', e.target.value)}
                    placeholder="CBT techniques, mindfulness exercises, etc."
                    className="w-full h-28 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none text-sm"
                  />
                </div>

                {/* Treatment Plan */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Treatment Plan / Next Steps
                  </label>
                  <textarea
                    value={notes.treatmentPlan}
                    onChange={(e) => handleChange('treatmentPlan', e.target.value)}
                    placeholder="Goals for next session, treatment adjustments..."
                    className="w-full h-28 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none text-sm"
                  />
                </div>
              </div>

              {/* Homework */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Homework / Assignments
                </label>
                <textarea
                  value={notes.homework}
                  onChange={(e) => handleChange('homework', e.target.value)}
                  placeholder="Tasks assigned to patient between sessions..."
                  className="w-full h-20 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none text-sm"
                />
              </div>

              {/* Risk Assessment */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <label className="text-sm font-medium text-slate-700">
                    Risk Assessment
                  </label>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {[
                    { value: 'none', label: 'None', color: 'bg-green-100 text-green-700 border-green-200' },
                    { value: 'low', label: 'Low', color: 'bg-blue-100 text-blue-700 border-blue-200' },
                    { value: 'moderate', label: 'Moderate', color: 'bg-amber-100 text-amber-700 border-amber-200' },
                    { value: 'high', label: 'High', color: 'bg-red-100 text-red-700 border-red-200' }
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => handleChange('riskAssessment', option.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                        notes.riskAssessment === option.value
                          ? option.color + ' ring-2 ring-offset-1 ring-slate-400'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {notes.riskAssessment !== 'none' && (
                  <textarea
                    value={notes.riskNotes}
                    onChange={(e) => handleChange('riskNotes', e.target.value)}
                    placeholder="Describe risk factors and safety plan..."
                    className="w-full h-20 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none text-sm"
                  />
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 flex items-center justify-between">
          <div className="text-sm text-slate-500">
            {notes.notesUpdatedAt && (
              <span>
                Last saved: {new Date(notes.notesUpdatedAt).toLocaleString()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="px-6 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : saved ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Notes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
