'use client'

import React, { useEffect, useRef, useState } from 'react'
import { X, Loader2, AlertCircle } from 'lucide-react'

/**
 * JitsiVideoCall Component
 *
 * Uses 8x8.vc (Jitsi's official hosted solution) which has fewer restrictions
 * than meet.jit.si for anonymous users joining meetings.
 *
 * Both doctor and patient can join as equal participants without moderator issues.
 */
export default function JitsiVideoCall({ roomId, displayName, onClose }) {
  const jitsiContainerRef = useRef(null)
  const jitsiApiRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!roomId || !jitsiContainerRef.current) return

    // Load Jitsi Meet API
    const loadJitsi = () => {
      // Check if already loaded
      if (window.JitsiMeetExternalAPI) {
        initializeJitsi()
        return
      }

      const script = document.createElement('script')
      // Use 8x8.vc API - more reliable for anonymous meetings
      script.src = 'https://8x8.vc/external_api.js'
      script.async = true
      script.onload = () => initializeJitsi()
      script.onerror = () => {
        setError('Failed to load video service. Please refresh and try again.')
        setLoading(false)
      }
      document.body.appendChild(script)
    }

    const initializeJitsi = () => {
      try {
        // Use 8x8.vc - Jitsi's hosted solution with better anonymous support
        const domain = '8x8.vc'

        // Create a unique room name with the vpaas prefix required by 8x8
        // For production, you should use your own JaaS app ID
        const roomName = `vpaas-magic-cookie-public/${roomId}`

        const options = {
          roomName: roomName,
          width: '100%',
          height: '100%',
          parentNode: jitsiContainerRef.current,
          userInfo: {
            displayName: displayName || 'Participant'
          },
          configOverwrite: {
            // Disable pre-join page - go directly into meeting
            prejoinPageEnabled: false,
            // Don't require display name prompt
            requireDisplayName: false,
            // Start with devices on
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            // Disable welcome/landing pages
            enableWelcomePage: false,
            // Disable lobby - both parties can join immediately
            enableLobby: false,
            // Disable authentication prompts
            enableAutomaticUrlCopy: false,
            // Disable the insecure room name warning
            enableInsecureRoomNameWarning: false,
            // Disable deep linking to app
            disableDeepLinking: true,
            // Disable invite functions
            disableInviteFunctions: true,
            // Make everyone a moderator when they join
            enableUserRolesBasedOnToken: false,
            // Disable the "someone is already in call" notification
            disableRemoteMute: true,
            // P2P mode for direct connection (better for 1-on-1)
            p2p: {
              enabled: true
            },
            // Disable 3rd party requests
            disableThirdPartyRequests: true,
            // Hide extra UI elements
            hideConferenceSubject: true,
            hideConferenceTimer: false,
            // Disable feedback
            enableFeedbackAnimation: false,
            // Disable oply reactions
            disableReactions: true,
            disablePolls: true
          },
          interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: [
              'microphone',
              'camera',
              'desktop',
              'fullscreen',
              'fodeviceselection',
              'hangup',
              'chat',
              'settings',
              'videoquality',
              'filmstrip',
              'tileview'
            ],
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            SHOW_BRAND_WATERMARK: false,
            MOBILE_APP_PROMO: false,
            HIDE_INVITE_MORE_HEADER: true,
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
            DISABLE_PRESENCE_STATUS: true,
            DISABLE_FOCUS_INDICATOR: true,
            GENERATE_ROOMNAMES_ON_WELCOME_PAGE: false,
            DISPLAY_WELCOME_PAGE_CONTENT: false,
            DISPLAY_WELCOME_FOOTER: false,
            APP_NAME: 'MindFlow Session',
            NATIVE_APP_NAME: 'MindFlow',
            PROVIDER_NAME: 'MindFlow',
            SHOW_CHROME_EXTENSION_BANNER: false,
            HIDE_KICK_BUTTON_FOR_GUESTS: true,
            TILE_VIEW_MAX_COLUMNS: 2
          }
        }

        jitsiApiRef.current = new window.JitsiMeetExternalAPI(domain, options)

        // Set loading to false when conference is ready
        jitsiApiRef.current.addEventListener('videoConferenceJoined', () => {
          setLoading(false)
          console.log('Joined video conference successfully')
        })

        // Listen for video conference left event
        jitsiApiRef.current.addEventListener('videoConferenceLeft', () => {
          if (onClose) onClose()
        })

        // Handle ready to close
        jitsiApiRef.current.addEventListener('readyToClose', () => {
          if (onClose) onClose()
        })

        // Log participant events for debugging
        jitsiApiRef.current.addEventListener('participantJoined', (participant) => {
          console.log('Participant joined:', participant)
        })

        jitsiApiRef.current.addEventListener('participantLeft', (participant) => {
          console.log('Participant left:', participant)
        })

        // Handle errors
        jitsiApiRef.current.addEventListener('errorOccurred', (error) => {
          console.error('Jitsi error:', error)
          if (error.error?.name === 'conference.connectionError') {
            setError('Connection failed. Please check your internet and try again.')
          }
        })

      } catch (err) {
        console.error('Failed to initialize Jitsi:', err)
        setError('Failed to start video call. Please try again.')
        setLoading(false)
      }
    }

    loadJitsi()

    return () => {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose()
        jitsiApiRef.current = null
      }
    }
  }, [roomId, displayName, onClose])

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-[60] bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-lg transition-colors"
        title="End Call"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Loading State */}
      {loading && (
        <div className="absolute inset-0 z-[55] flex items-center justify-center bg-slate-900">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-violet-500 animate-spin mx-auto mb-4" />
            <p className="text-white text-lg font-medium">Connecting to session...</p>
            <p className="text-slate-400 text-sm mt-2">Room: {roomId}</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 z-[55] flex items-center justify-center bg-slate-900">
          <div className="text-center max-w-md mx-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-white text-lg font-medium mb-2">Connection Error</p>
            <p className="text-slate-400 text-sm mb-6">{error}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700"
              >
                Try Again
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-600"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Jitsi Container */}
      <div ref={jitsiContainerRef} className="w-full h-full" />
    </div>
  )
}
