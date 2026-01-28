import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User, VerificationCode } from '@/lib/models';
import sendEmail from '@/lib/emailService';

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function getApprovedDoctorEmails() {
  const approvedEmails = process.env.APPROVED_DOCTOR_EMAILS || '';
  return approvedEmails.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
}

export async function POST(request) {
  try {
    await connectDB();
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Valid email is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    let user = await User.findOne({ email: normalizedEmail });
    let isNewUser = false;
    let userRole = null;

    if (!user) {
      const approvedDoctorEmails = await getApprovedDoctorEmails();
      userRole = approvedDoctorEmails.includes(normalizedEmail) ? 'doctor' : 'patient';
      isNewUser = true;
    } else {
      userRole = user.role;
    }

    // Generate verification code
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Save verification code
    await VerificationCode.create({
      email: normalizedEmail,
      code,
      type: 'login',
      expiresAt
    });

    // Send email with code
    try {
      await sendEmail({
        to: normalizedEmail,
        subject: 'Your MindFlow Login Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #667eea;">MindFlow Login</h2>
            <p>Your verification code is:</p>
            <h1 style="font-size: 36px; letter-spacing: 8px; color: #667eea;">${code}</h1>
            <p>This code will expire in 10 minutes.</p>
            ${isNewUser ? '<p><strong>Welcome to MindFlow!</strong> After verification, you\'ll be asked to complete your profile.</p>' : ''}
            <p style="color: #666; font-size: 12px; margin-top: 30px;">
              If you didn't request this code, please ignore this email.
            </p>
          </div>
        `
      });
    } catch (emailError) {
      // In development, email errors are handled by emailService
      // But if it still fails, log the code here as fallback
      if (process.env.NODE_ENV === 'development') {
        console.log('\n🔑 Verification Code:', code);
        console.log('Email:', normalizedEmail, '\n');
      } else {
        throw emailError;
      }
    }

    // In development mode, include the code in the response for easier testing
    const isDev = process.env.BYPASS_EMAIL === 'true' || process.env.NODE_ENV === 'development';

    return NextResponse.json({
      success: true,
      message: isDev
        ? `Verification code sent (DEV MODE - Code: ${code})`
        : 'Verification code sent to your email',
      isNewUser,
      role: userRole,
      ...(isDev && { devCode: code }) // Include code in response for development
    });

  } catch (error) {
    console.error('Request code error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send verification code' },
      { status: 500 }
    );
  }
}

