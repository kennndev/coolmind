import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Doctor } from '@/lib/models';

// POST - Approve all doctors (TEST ONLY - remove in production)
export async function POST(request) {
  try {
    await connectDB();

    // Update all doctors to be approved
    const result = await Doctor.updateMany(
      { isApproved: false },
      {
        $set: {
          isApproved: true,
          approvedAt: new Date()
        }
      }
    );

    // Get all approved doctors
    const approvedDoctors = await Doctor.find({ isApproved: true })
      .select('firstName lastName specialty doctorId isApproved');

    return NextResponse.json({
      success: true,
      message: `Approved ${result.modifiedCount} doctor(s)`,
      modifiedCount: result.modifiedCount,
      approvedDoctors
    });

  } catch (error) {
    console.error('Approve all doctors error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to approve doctors',
        error: error.message
      },
      { status: 500 }
    );
  }
}
