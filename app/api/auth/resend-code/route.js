import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { VerificationCode } from '@/lib/models';
import sendEmail from '@/lib/emailService';
import { generateCode } from '@/lib/helpers';

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

    // Generate new verification code
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Invalidate old codes
    await VerificationCode.updateMany(
      { email: normalizedEmail, type: 'login', used: false },
      { used: true }
    );

    // Save new verification code
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
            <p style="color: #666; font-size: 12px; margin-top: 30px;">
              If you didn't request this code, please ignore this email.
            </p>
          </div>
        `
      });
    } catch (emailError) {
      if (process.env.BYPASS_EMAIL !== 'true' && process.env.NODE_ENV !== 'development') {
        throw emailError;
      }
      console.log('\n🔑 Verification Code:', code);
      console.log('Email:', normalizedEmail, '\n');
    }

    // In development mode, include the code in the response for easier testing
    const isDev = process.env.BYPASS_EMAIL === 'true' || process.env.NODE_ENV === 'development';

    return NextResponse.json({
      success: true,
      message: isDev
        ? `Verification code resent (DEV MODE - Code: ${code})`
        : 'Verification code resent to your email',
      ...(isDev && { devCode: code })
    });

  } catch (error) {
    console.error('Resend code error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to resend verification code' },
      { status: 500 }
    );
  }
}



