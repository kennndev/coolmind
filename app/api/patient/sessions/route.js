import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Patient, Session } from '@/lib/models';
import { verifyToken } from '@/lib/helpers';

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

    // Get patient ID from user
    const patient = await Patient.findOne({ userId: authResult.user.id });
    
    if (!patient) {
      return NextResponse.json(
        { success: false, message: 'Patient profile not found' },
        { status: 404 }
      );
    }

    // Get status filter from query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Build query
    const query = { patientId: patient._id };
    if (status) {
      query.status = status;
    }

    // Get sessions
    const sessions = await Session.find(query)
      .populate('doctorId', 'firstName lastName specialty')
      .sort({ scheduledDate: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      sessions
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to get sessions' },
      { status: 500 }
    );
  }
}

