import jwt from 'jsonwebtoken';
import { Patient, Doctor } from './models';

export function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function generatePatientId() {
  const prefix = 'P';
  let id;
  let exists = true;

  while (exists) {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    id = `${prefix}-${randomNum}`;
    exists = await Patient.findOne({ patientId: id });
  }

  return id;
}

export async function generateDoctorId() {
  const prefix = 'D';
  let id;
  let exists = true;

  while (exists) {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    id = `${prefix}-${randomNum}`;
    exists = await Doctor.findOne({ doctorId: id });
  }

  return id;
}

export function generateSessionToken(user) {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );
}

export async function getApprovedDoctorEmails() {
  const approvedEmails = process.env.APPROVED_DOCTOR_EMAILS || '';
  return approvedEmails.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
}

/**
 * Verify JWT token from request
 * Returns { valid: boolean, user?: object, error?: string }
 */
export function verifyToken(request) {
  // Try both lowercase and capitalized Authorization header (case-insensitive)
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.error('No token found in Authorization header');
    return { valid: false, error: 'Access token required' };
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret === 'your-secret-key') {
    console.error('JWT_SECRET not properly configured');
    return { valid: false, error: 'Server configuration error' };
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    return { 
      valid: true, 
      user: {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role
      }
    };
  } catch (error) {
    console.error('Token verification failed:', error.message);
    if (error.name === 'TokenExpiredError') {
      return { valid: false, error: 'Token expired. Please log in again.' };
    }
    return { valid: false, error: 'Invalid or expired token' };
  }
}

