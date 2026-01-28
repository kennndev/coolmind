import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User, Patient } from '@/lib/models';
import { authenticateToken } from '@/lib/auth';

export async function POST(request) {
  try {
    await connectDB();
    const authResult = authenticateToken(request);

    if (authResult.error) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      );
    }

    const userId = authResult.user.id;
    const user = await User.findById(userId);

    if (!user || user.role !== 'patient') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      phoneNumber,
      emergencyContact,
      address,
      primaryConditions
    } = await request.json();

    if (!firstName || !lastName || !dateOfBirth) {
      return NextResponse.json(
        { success: false, message: 'First name, last name, and date of birth are required' },
        { status: 400 }
      );
    }

    // Check if patient record exists, create if not
    let patient = await Patient.findOne({ userId });

    if (!patient) {
      // Generate unique patient ID
      const patientCount = await Patient.countDocuments();
      const patientId = `PAT${String(patientCount + 1).padStart(6, '0')}`;

      // Create new patient record
      patient = await Patient.create({
        userId,
        patientId,
        firstName,
        lastName,
        dateOfBirth: new Date(dateOfBirth),
        gender,
        phoneNumber,
        emergencyContact,
        address,
        primaryConditions,
        profileCompleted: true,
        onboardingCompleted: true
      });
    } else {
      // Update existing patient record
      patient = await Patient.findOneAndUpdate(
        { userId },
        {
          firstName,
          lastName,
          dateOfBirth: new Date(dateOfBirth),
          gender,
          phoneNumber,
          emergencyContact,
          address,
          primaryConditions,
          profileCompleted: true,
          onboardingCompleted: true,
          updatedAt: new Date()
        },
        { new: true }
      );
    }

    // Generate session token with updated user info
    const { generateSessionToken } = await import('@/lib/helpers');
    const sessionToken = generateSessionToken(user);

    // Return response with user data for frontend
    return NextResponse.json({
      success: true,
      message: 'Profile completed successfully',
      token: sessionToken,
      patient,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        name: `${firstName} ${lastName}`
      },
      profileCompleted: true,
      requiresOnboarding: false
    });

  } catch (error) {
    console.error('Complete patient profile error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to complete profile' },
      { status: 500 }
    );
  }
}

