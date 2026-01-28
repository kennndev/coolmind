'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import AgoraRTC from 'agora-rtc-sdk-ng'
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Loader2,
  AlertCircle,
  User
} from 'lucide-react'

// Agora App ID (Testing Mode - no token required)
const APP_ID = '8c0e9904d9d541a39edac24513b9a760'

// Configure Agora client - reduce logs
AgoraRTC.setLogLevel(4)

export default function AgoraVideoCall({ channelName, userName, userRole, onClose }) {
  const [joined, setJoined] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [remoteUser, setRemoteUser] = useState(null)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [videoEnabled, setVideoEnabled] = useState(true)

  const clientRef = useRef(null)
  const localAudioTrackRef = useRef(null)
  const localVideoTrackRef = useRef(null)
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const joinedRef = useRef(false)

  // Cleanup function
  const cleanup = useCallback(async () => {
    console.log('Cleaning up Agora...')

    if (localAudioTrackRef.current) {
      localAudioTrackRef.current.stop()
      localAudioTrackRef.current.close()
      localAudioTrackRef.current = null
    }

    if (localVideoTrackRef.current) {
      localVideoTrackRef.current.stop()
      localVideoTrackRef.current.close()
      localVideoTrackRef.current = null
    }

    if (clientRef.current) {
      clientRef.current.removeAllListeners()
      if (joinedRef.current) {
        await clientRef.current.leave()
        joinedRef.current = false
      }
      clientRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!channelName) {
      setError('No channel name provided')
      setLoading(false)
      return
    }

    // Prevent double initialization
    if (clientRef.current || joinedRef.current) {
      return
    }

    const init = async () => {
      try {
        console.log('Initializing Agora for channel:', channelName)

        // Create Agora client
        const client = AgoraRTC.createClient({
          mode: 'rtc',
          codec: 'vp8'
        })
        clientRef.current = client

        // Handle remote user publishing
        client.on('user-published', async (user, mediaType) => {
          console.log('Remote user published:', user.uid, mediaType)
          await client.subscribe(user, mediaType)

          if (mediaType === 'video') {
            setRemoteUser(user)
            // Play video after state update
            setTimeout(() => {
              if (remoteVideoRef.current && user.videoTrack) {
                user.videoTrack.play(remoteVideoRef.current)
              }
            }, 100)
          }

          if (mediaType === 'audio') {
            user.audioTrack?.play()
          }
        })

        client.on('user-unpublished', (user, mediaType) => {
          console.log('Remote user unpublished:', user.uid, mediaType)
          if (mediaType === 'video') {
            setRemoteUser(prev => prev?.uid === user.uid ? null : prev)
          }
        })

        client.on('user-left', (user) => {
          console.log('Remote user left:', user.uid)
          setRemoteUser(prev => prev?.uid === user.uid ? null : prev)
        })

        // Create local tracks
        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
          { encoderConfig: 'speech_standard' },
          { encoderConfig: '480p_1', facingMode: 'user' }
        )

        localAudioTrackRef.current = audioTrack
        localVideoTrackRef.current = videoTrack

        // Join channel (no token needed for testing mode)
        const uid = await client.join(APP_ID, channelName, null, null)
        joinedRef.current = true
        console.log('Joined channel with UID:', uid)

        // Publish local tracks
        await client.publish([audioTrack, videoTrack])
        console.log('Published local tracks')

        // Play local video
        if (localVideoRef.current) {
          videoTrack.play(localVideoRef.current)
        }

        setJoined(true)
        setLoading(false)

      } catch (err) {
        console.error('Agora error:', err)

        let errorMessage = 'Failed to join video call.'
        if (err.message?.includes('Permission') || err.name === 'NotAllowedError') {
          errorMessage = 'Camera/microphone permission denied. Please allow access and try again.'
        } else if (err.message?.includes('NotFound') || err.name === 'NotFoundError') {
          errorMessage = 'Camera or microphone not found. Please check your devices.'
        } else if (err.message) {
          errorMessage = err.message
        }

        setError(errorMessage)
        setLoading(false)
        await cleanup()
      }
    }

    init()

    // Cleanup on unmount
    return () => {
      cleanup()
    }
  }, [channelName, cleanup])

  // Play remote video when remoteUser changes
  useEffect(() => {
    if (remoteUser?.videoTrack && remoteVideoRef.current) {
      remoteUser.videoTrack.play(remoteVideoRef.current)
    }
  }, [remoteUser])

  const toggleAudio = async () => {
    if (localAudioTrackRef.current) {
      await localAudioTrackRef.current.setEnabled(!audioEnabled)
      setAudioEnabled(!audioEnabled)
    }
  }

  const toggleVideo = async () => {
    if (localVideoTrackRef.current) {
      await localVideoTrackRef.current.setEnabled(!videoEnabled)
      setVideoEnabled(!videoEnabled)
    }
  }

  const handleLeave = async () => {
    await cleanup()
    onClose?.()
  }

  const otherParticipantName = userRole === 'doctor' ? 'Patient' : 'Doctor'

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-white font-medium">CoolMind Session</span>
        </div>
        <span className="text-slate-400 text-sm">
          {remoteUser ? '2 participants' : 'Waiting for ' + otherParticipantName.toLowerCase() + '...'}
        </span>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-violet-500 animate-spin mx-auto mb-4" />
            <p className="text-white text-lg font-medium">Connecting...</p>
            <p className="text-slate-400 text-sm mt-2">Setting up your video session</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex-1 flex items-center justify-center">
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

      {/* Video Area */}
      {joined && !error && (
        <div className="flex-1 p-4 flex gap-4">
          {/* Remote Video (Other Participant) */}
          <div className="flex-1 relative bg-slate-800 rounded-2xl overflow-hidden">
            {remoteUser ? (
              <>
                <div
                  ref={remoteVideoRef}
                  className="w-full h-full"
                />
                <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-black/60 rounded-full backdrop-blur-sm">
                  <span className="text-white text-sm font-medium">{otherParticipantName}</span>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <div className="w-24 h-24 bg-slate-700 rounded-full flex items-center justify-center mb-4">
                  <User className="w-12 h-12 text-slate-500" />
                </div>
                <div className="w-8 h-8 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mb-4"></div>
                <p className="text-white text-lg font-medium">Waiting for {otherParticipantName}...</p>
                <p className="text-slate-400 text-sm mt-2">They will appear here when they join</p>
              </div>
            )}
          </div>

          {/* Local Video (Self) - Picture in Picture */}
          <div className="w-64 h-48 relative bg-slate-800 rounded-xl overflow-hidden flex-shrink-0 self-end">
            <div
              ref={localVideoRef}
              className="w-full h-full"
            />
            {!videoEnabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                <VideoOff className="w-10 h-10 text-slate-500" />
              </div>
            )}
            <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded-full backdrop-blur-sm">
              <span className="text-white text-xs font-medium">
                {userName || 'You'} ({userRole === 'doctor' ? 'Doctor' : 'Patient'})
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Controls Bar */}
      {joined && !error && (
        <div className="bg-slate-800 p-4">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={toggleAudio}
              className={`p-4 rounded-full transition-all ${
                audioEnabled
                  ? 'bg-slate-700 hover:bg-slate-600 text-white'
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
              title={audioEnabled ? 'Mute' : 'Unmute'}
            >
              {audioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
            </button>

            <button
              onClick={toggleVideo}
              className={`p-4 rounded-full transition-all ${
                videoEnabled
                  ? 'bg-slate-700 hover:bg-slate-600 text-white'
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
              title={videoEnabled ? 'Turn off camera' : 'Turn on camera'}
            >
              {videoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
            </button>

            <button
              onClick={handleLeave}
              className="p-4 bg-red-600 hover:bg-red-700 rounded-full text-white transition-all"
              title="End call"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
