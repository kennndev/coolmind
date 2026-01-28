import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Patient } from '@/lib/models';
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

    // Get patients assigned to this doctor
    const patients = await Patient.find({ assignedDoctor: authResult.user.id })
      .select('-__v')
      .lean();

    return NextResponse.json({
      success: true,
      patients
    });
  } catch (error) {
    console.error('Get patients error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to get patients' },
      { status: 500 }
    );
  }
}



