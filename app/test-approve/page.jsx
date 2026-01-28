'use client'

import { useState } from 'react'

export default function TestApprovePage() {
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const approveDoctors = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/test/approve-all-doctors', {
        method: 'POST'
      })
      const data = await res.json()
      setResult(JSON.stringify(data, null, 2))
    } catch (error) {
      setResult('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6">Test: Approve All Doctors</h1>

        <button
          onClick={approveDoctors}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Approving...' : 'Approve All Doctors'}
        </button>

        {result && (
          <div className="mt-6">
            <h2 className="font-semibold mb-2">Result:</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {result}
            </pre>
          </div>
        )}

        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> This is a test page for development only.
            In production, only admins should be able to approve doctors.
          </p>
        </div>
      </div>
    </div>
  )
}
