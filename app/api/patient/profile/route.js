import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Patient, User } from '@/lib/models';
import { verifyToken } from '@/lib/helpers';

// GET - Fetch patient profile
export async function GET(request) {
  try {
    await connectDB();

    const authResult = verifyToken(request);
    if (!authResult.valid) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: 401 }
      );
    }

    const { user } = authResult;

    // Find patient profile
    const patient = await Patient.findOne({ userId: user.id })
      .populate('userId')
      .populate('assignedDoctor');

    if (!patient) {
      return NextResponse.json(
        { success: false, message: 'Patient profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: patient
    });

  } catch (error) {
    console.error('Get patient profile error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch profile',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// PUT - Update patient profile
export async function PUT(request) {
  try {
    await connectDB();

    const authResult = verifyToken(request);
    if (!authResult.valid) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: 401 }
      );
    }

    const { user } = authResult;
    const updates = await request.json();

    // Find patient profile
    const patient = await Patient.findOne({ userId: user.id });
    if (!patient) {
      return NextResponse.json(
        { success: false, message: 'Patient profile not found' },
        { status: 404 }
      );
    }

    // Update allowed fields
    const allowedFields = [
      'firstName',
      'lastName',
      'dateOfBirth',
      'gender',
      'phoneNumber',
      'address',
      'emergencyContact',
      'primaryConditions',
      'allergies',
      'medications'
    ];

    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        patient[field] = updates[field];
      }
    });

    // Check if profile is complete
    const requiredFields = ['firstName', 'lastName', 'dateOfBirth'];
    const isComplete = requiredFields.every(field =>
      patient[field] && patient[field] !== 'Pending'
    );

    if (isComplete && !patient.profileCompleted) {
      patient.profileCompleted = true;
    }

    patient.updatedAt = new Date();
    await patient.save();

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      profile: patient
    });

  } catch (error) {
    console.error('Update patient profile error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update profile',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
