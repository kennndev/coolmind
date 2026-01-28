import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Doctor, Session } from '@/lib/models';
import { verifyToken } from '@/lib/helpers';

// GET - Fetch all approved doctors with their stats
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

    // Get all approved doctors
    const doctors = await Doctor.find({ isApproved: true })
      .populate('userId', 'email isActive')
      .select('-licenseNumber') // Don't expose license number to patients
      .lean();

    // Get stats for each doctor
    const doctorsWithStats = await Promise.all(
      doctors.map(async (doctor) => {
        // Count total sessions
        const totalSessions = await Session.countDocuments({
          doctorId: doctor._id,
          status: 'completed'
        });

        // Count current patients (unique patients with completed sessions)
        const patients = await Session.distinct('patientId', {
          doctorId: doctor._id,
          status: { $in: ['completed', 'scheduled', 'confirmed'] }
        });

        // Calculate availability (check if they have working hours set)
        const workingDays = Object.entries(doctor.workingHours || {})
          .filter(([_, hours]) => hours?.available)
          .map(([day]) => day);

        return {
          ...doctor,
          stats: {
            totalSessions,
            currentPatients: patients.length,
            yearsOfExperience: doctor.yearsOfExperience || 0,
            availableDays: workingDays,
            isAvailable: workingDays.length > 0
          }
        };
      })
    );

    return NextResponse.json({
      success: true,
      doctors: doctorsWithStats
    });

  } catch (error) {
    console.error('Get doctors error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch doctors',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
