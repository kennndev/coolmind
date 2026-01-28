import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User, Doctor } from '@/lib/models';
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

    if (!user || user.role !== 'doctor') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    const {
      firstName,
      lastName,
      title,
      specialty,
      subSpecialties,
      licenseNumber,
      licenseState,
      licenseExpiryDate,
      phoneNumber,
      bio,
      yearsOfExperience,
      education,
      certifications
    } = await request.json();

    if (!firstName || !lastName || !specialty || !licenseNumber) {
      return NextResponse.json(
        { success: false, message: 'First name, last name, specialty, and license number are required' },
        { status: 400 }
      );
    }

    // Check if doctor record exists, create if not
    let doctor = await Doctor.findOne({ userId });

    if (!doctor) {
      // Generate unique doctor ID
      const doctorCount = await Doctor.countDocuments();
      const doctorId = `DOC${String(doctorCount + 1).padStart(6, '0')}`;

      // Create new doctor record
      doctor = await Doctor.create({
        userId,
        doctorId,
        firstName,
        lastName,
        title,
        specialty,
        subSpecialties,
        licenseNumber,
        licenseState,
        licenseExpiryDate: licenseExpiryDate ? new Date(licenseExpiryDate) : null,
        phoneNumber,
        bio,
        yearsOfExperience,
        education,
        certifications,
        profileCompleted: true,
        isApproved: true // Auto-approve doctors
      });
    } else {
      // Update existing doctor record
      doctor = await Doctor.findOneAndUpdate(
        { userId },
        {
          firstName,
          lastName,
          title,
          specialty,
          subSpecialties,
          licenseNumber,
          licenseState,
          licenseExpiryDate: licenseExpiryDate ? new Date(licenseExpiryDate) : null,
          phoneNumber,
          bio,
          yearsOfExperience,
          education,
          certifications,
          profileCompleted: true,
          isApproved: true,
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
      message: 'Profile completed successfully.',
      token: sessionToken,
      doctor,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        name: `${title || ''} ${firstName} ${lastName}`.trim()
      },
      profileCompleted: true,
      requiresOnboarding: false
    });

  } catch (error) {
    console.error('Complete doctor profile error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to complete profile' },
      { status: 500 }
    );
  }
}

