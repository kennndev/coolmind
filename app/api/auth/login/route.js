import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/db';
import { User, Patient, Doctor } from '@/lib/models';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_EXPIRY = '7d';

export async function POST(request) {
  try {
    await connectDB();
    const { email, password } = await request.json();

    // Validate input
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Valid email is required' },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { success: false, message: 'Password is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { success: false, message: 'Account is deactivated. Please contact support.' },
        { status: 403 }
      );
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Check profile completion status
    let profileCompleted = false;
    let requiresOnboarding = true;

    if (user.role === 'patient') {
      const patient = await Patient.findOne({ userId: user._id });
      profileCompleted = patient?.profileCompleted || false;
      requiresOnboarding = !patient || !patient.profileCompleted;
    } else if (user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: user._id });
      profileCompleted = doctor?.profileCompleted || false;
      requiresOnboarding = !doctor || !doctor.profileCompleted;
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        profileCompleted
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      },
      profileCompleted,
      requiresOnboarding
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Login failed' },
      { status: 500 }
    );
  }
}
