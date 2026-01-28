'use client'

import { useState, useEffect } from 'react'
import AuthFlow from '@/components/AuthFlow'
import WellnessApp from '@/components/WellnessApp'
import PatientDashboard from '@/components/PatientDashboard'

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
      const userRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null
      const userData = typeof window !== 'undefined' ? localStorage.getItem('userData') : null

      if (token && userRole) {
        // Verify token with backend
        const response = await fetch('/api/auth/verify-token', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          setIsAuthenticated(true)
          setUser(userData ? JSON.parse(userData) : { role: userRole })
        } else {
          handleLogout()
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      handleLogout()
    } finally {
      setLoading(false)
    }
  }

  const handleAuthComplete = (data) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', data.token)
      localStorage.setItem('userRole', data.user.role)
      localStorage.setItem('userData', JSON.stringify(data.user))
    }

    setIsAuthenticated(true)
    setUser(data.user)
  }

  const handleLogout = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken')
        localStorage.removeItem('userRole')
        localStorage.removeItem('userData')
      }

      setIsAuthenticated(false)
      setUser(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AuthFlow onAuthComplete={handleAuthComplete} />
  }

  if (user?.role === 'doctor') {
    return <WellnessApp user={user} onLogout={handleLogout} />
  }

  if (user?.role === 'patient') {
    return <PatientDashboard user={user} onLogout={handleLogout} />
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 max-w-md">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Unknown User Role</h2>
        <p className="text-slate-600 mb-6">Your account role is not recognized. Please contact support.</p>
        <button
          onClick={handleLogout}
          className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg font-semibold hover:from-violet-700 hover:to-purple-700 transition-all"
        >
          Logout
        </button>
      </div>
    </div>
  )
}

