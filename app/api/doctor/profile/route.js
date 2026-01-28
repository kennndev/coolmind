import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Doctor } from '@/lib/models';
import { authenticateToken } from '@/lib/auth';

export async function GET(request) {
  try {
    await connectDB();
    const authResult = authenticateToken(request);

    if (authResult.error) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      );
    }

    const doctor = await Doctor.findOne({ userId: authResult.user.id });

    if (!doctor) {
      return NextResponse.json(
        { success: false, message: 'Doctor profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      doctor
    });
  } catch (error) {
    console.error('Get doctor profile error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to get doctor profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    await connectDB();
    const authResult = authenticateToken(request);

    if (authResult.error) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      );
    }

    const updateData = await request.json();
    const doctor = await Doctor.findOneAndUpdate(
      { userId: authResult.user.id },
      { ...updateData, updatedAt: new Date() },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      doctor
    });
  } catch (error) {
    console.error('Update doctor profile error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update doctor profile' },
      { status: 500 }
    );
  }
}



