import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db';
import { User } from '@/lib/models';

async function getApprovedDoctorEmails() {
  const approvedEmails = process.env.APPROVED_DOCTOR_EMAILS || '';
  return approvedEmails.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
}

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

    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Determine user role based on approved doctor emails
    const approvedDoctorEmails = await getApprovedDoctorEmails();
    const userRole = approvedDoctorEmails.includes(normalizedEmail) ? 'doctor' : 'patient';

    // Hash password with bcrypt (salt is generated automatically)
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await User.create({
      email: normalizedEmail,
      password: hashedPassword,
      role: userRole,
      isVerified: true
    });

    return NextResponse.json({
      success: true,
      message: 'Account created successfully. Please login.',
      role: userRole
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create account' },
      { status: 500 }
    );
  }
}
