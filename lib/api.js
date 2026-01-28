/**
 * API Service
 * Centralized API calls for the application
 */

const API_BASE_URL = '/api';

// Helper function to get auth headers
function getAuthHeaders() {
  const token = localStorage.getItem('authToken');
  if (!token) {
    console.warn('No auth token found in localStorage');
  }
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// Helper function to handle API responses
async function handleResponse(response) {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }

  return data;
}

// ==================== AUTHENTICATION ====================

export const authAPI = {
  // Request verification code
  requestCode: async (email) => {
    const response = await fetch(`${API_BASE_URL}/auth/request-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return handleResponse(response);
  },

  // Verify code
  verifyCode: async (email, code) => {
    const response = await fetch(`${API_BASE_URL}/auth/verify-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code })
    });
    return handleResponse(response);
  },

  // Resend code
  resendCode: async (email) => {
    const response = await fetch(`${API_BASE_URL}/auth/resend-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return handleResponse(response);
  },

  // Logout
  logout: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Complete patient profile
  completePatientProfile: async (profileData) => {
    const response = await fetch(`${API_BASE_URL}/auth/complete-patient-profile`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(profileData)
    });
    return handleResponse(response);
  },

  // Complete doctor profile
  completeDoctorProfile: async (profileData) => {
    const response = await fetch(`${API_BASE_URL}/auth/complete-doctor-profile`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(profileData)
    });
    return handleResponse(response);
  }
};

// ==================== DOCTOR ENDPOINTS ====================

export const doctorAPI = {
  // Get doctor profile
  getProfile: async () => {
    const response = await fetch(`${API_BASE_URL}/doctor/profile`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Update doctor profile
  updateProfile: async (profileData) => {
    const response = await fetch(`${API_BASE_URL}/doctor/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(profileData)
    });
    return handleResponse(response);
  },

  // Get assigned patients
  getPatients: async () => {
    const response = await fetch(`${API_BASE_URL}/doctor/patients`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Get schedule
  getSchedule: async (date, upcoming = false) => {
    const params = new URLSearchParams();
    if (date) {
      params.append('date', date);
    }
    if (upcoming) {
      params.append('upcoming', 'true');
    }
    const queryString = params.toString();
    const url = `${API_BASE_URL}/doctor/schedule${queryString ? `?${queryString}` : ''}`;
    const response = await fetch(url, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Get patient details
  getPatientDetails: async (patientId) => {
    const response = await fetch(`${API_BASE_URL}/doctor/patients/${patientId}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Get messages/conversations
  getMessages: async () => {
    const response = await fetch(`${API_BASE_URL}/doctor/messages`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Send message to patient
  sendMessage: async (messageData) => {
    const response = await fetch(`${API_BASE_URL}/doctor/messages`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(messageData)
    });
    return handleResponse(response);
  },

  // Get session notes
  getSessionNotes: async (sessionId) => {
    const response = await fetch(`${API_BASE_URL}/doctor/sessions/${sessionId}/notes`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Update session notes
  updateSessionNotes: async (sessionId, notesData) => {
    const response = await fetch(`${API_BASE_URL}/doctor/sessions/${sessionId}/notes`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(notesData)
    });
    return handleResponse(response);
  }
};

// ==================== PATIENT ENDPOINTS ====================

export const patientAPI = {
  // Get patient profile
  getProfile: async () => {
    const response = await fetch(`${API_BASE_URL}/patient/profile`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Update patient profile
  updateProfile: async (profileData) => {
    const response = await fetch(`${API_BASE_URL}/patient/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(profileData)
    });
    return handleResponse(response);
  },

  // Get sessions
  getSessions: async (status = null) => {
    const statusParam = status ? `?status=${status}` : '';
    const response = await fetch(`${API_BASE_URL}/patient/sessions${statusParam}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Submit pre-session check-in
  submitCheckIn: async (checkInData) => {
    const response = await fetch(`${API_BASE_URL}/patient/check-in`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(checkInData)
    });
    return handleResponse(response);
  },

  // Get check-ins
  getCheckIns: async (sessionId = null) => {
    const params = sessionId ? `?sessionId=${sessionId}` : '';
    const response = await fetch(`${API_BASE_URL}/patient/check-in${params}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Get all doctors
  getDoctors: async () => {
    const response = await fetch(`${API_BASE_URL}/patient/doctors`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Get appointments
  getAppointments: async (upcoming = false) => {
    const params = upcoming ? '?upcoming=true' : '';
    const response = await fetch(`${API_BASE_URL}/patient/appointments${params}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Schedule appointment
  scheduleAppointment: async (appointmentData) => {
    const response = await fetch(`${API_BASE_URL}/patient/appointments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(appointmentData)
    });
    return handleResponse(response);
  },

  // Cancel appointment
  cancelAppointment: async (sessionId) => {
    const response = await fetch(`${API_BASE_URL}/patient/appointments?sessionId=${sessionId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Get journal entries
  getJournalEntries: async () => {
    const response = await fetch(`${API_BASE_URL}/patient/journal`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Create journal entry
  createJournalEntry: async (entryData) => {
    const response = await fetch(`${API_BASE_URL}/patient/journal`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(entryData)
    });
    return handleResponse(response);
  },

  // Get messages
  getMessages: async () => {
    const response = await fetch(`${API_BASE_URL}/patient/messages`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Send message
  sendMessage: async (messageData) => {
    const response = await fetch(`${API_BASE_URL}/patient/messages`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(messageData)
    });
    return handleResponse(response);
  },

  // Get mood entries
  getMoodEntries: async (days = 30) => {
    const response = await fetch(`${API_BASE_URL}/patient/mood?days=${days}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Log mood entry
  logMood: async (moodData) => {
    const response = await fetch(`${API_BASE_URL}/patient/mood`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(moodData)
    });
    return handleResponse(response);
  }
};

// ==================== SESSION NOTES ENDPOINTS ====================

export const sessionNotesAPI = {
  // Create session notes
  createNotes: async (sessionId, notesData) => {
    const response = await fetch(`${API_BASE_URL}/session-notes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ sessionId, ...notesData })
    });
    return handleResponse(response);
  },

  // Get session notes
  getNotes: async (sessionId) => {
    const response = await fetch(`${API_BASE_URL}/session-notes/${sessionId}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Update session notes
  updateNotes: async (notesId, notesData) => {
    const response = await fetch(`${API_BASE_URL}/session-notes/${notesId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(notesData)
    });
    return handleResponse(response);
  },

  // Extract notes from image (OCR/Vision)
  extractFromImage: async (sessionId, imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('sessionId', sessionId);

    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/session-notes/extract`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: formData
    });
    return handleResponse(response);
  }
};

export default {
  auth: authAPI,
  doctor: doctorAPI,
  patient: patientAPI,
  sessionNotes: sessionNotesAPI
};
