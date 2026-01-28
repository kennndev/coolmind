/**
 * Authentication Middleware
 * Verifies JWT tokens and protects routes
 */

import jwt from 'jsonwebtoken';

/**
 * Authentication middleware
 * Verifies JWT token and adds user info to request
 */
export function authenticateToken(request) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return { error: 'Access token required', status: 401 };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    return { user: decoded };
  } catch (error) {
    return { error: 'Invalid or expired token', status: 403 };
  }
}

/**
 * Role-based authorization middleware
 * @param  {...string} roles - Allowed roles
 */
export function authorize(user, ...roles) {
  if (!user || !roles.includes(user.role)) {
    return { error: 'Access denied. Insufficient permissions.', status: 403 };
  }
  return { authorized: true };
}

