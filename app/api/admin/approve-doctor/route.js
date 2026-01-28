import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Doctor } from '@/lib/models';
import { verifyToken } from '@/lib/helpers';

// PUT - Approve a doctor
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

    // Check if user is admin
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Only admins can approve doctors' },
        { status: 403 }
      );
    }

    const { doctorId } = await request.json();

    if (!doctorId) {
      return NextResponse.json(
        { success: false, message: 'Doctor ID is required' },
        { status: 400 }
      );
    }

    // Find and approve doctor
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return NextResponse.json(
        { success: false, message: 'Doctor not found' },
        { status: 404 }
      );
    }

    doctor.isApproved = true;
    doctor.approvedBy = user.id;
    doctor.approvedAt = new Date();
    await doctor.save();

    return NextResponse.json({
      success: true,
      message: 'Doctor approved successfully',
      doctor
    });

  } catch (error) {
    console.error('Approve doctor error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to approve doctor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// GET - Get all pending doctors (for admin)
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

    // Check if user is admin
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Only admins can view pending doctors' },
        { status: 403 }
      );
    }

    // Get all unapproved doctors
    const pendingDoctors = await Doctor.find({ isApproved: false })
      .populate('userId', 'email')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      doctors: pendingDoctors
    });

  } catch (error) {
    console.error('Get pending doctors error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch pending doctors',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
