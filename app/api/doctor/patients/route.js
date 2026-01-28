import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Patient, Doctor, Session } from '@/lib/models';
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

    // Find the Doctor record for this user
    const doctor = await Doctor.findOne({ userId: authResult.user.id });
    if (!doctor) {
      return NextResponse.json(
        { success: false, message: 'Doctor profile not found' },
        { status: 404 }
      );
    }

    // Get patients assigned to this doctor
    let patients = await Patient.find({ assignedDoctor: doctor._id })
      .select('-__v')
      .lean();

    // Also get patients who have had sessions with this doctor but no assigned doctor
    const sessionsWithDoctor = await Session.find({ doctorId: doctor._id })
      .distinct('patientId');

    if (sessionsWithDoctor.length > 0) {
      const sessionPatients = await Patient.find({
        _id: { $in: sessionsWithDoctor },
        $or: [
          { assignedDoctor: { $exists: false } },
          { assignedDoctor: null }
        ]
      }).select('-__v').lean();

      // Auto-assign these patients to the doctor
      if (sessionPatients.length > 0) {
        await Patient.updateMany(
          { _id: { $in: sessionPatients.map(p => p._id) } },
          { assignedDoctor: doctor._id }
        );

        // Add them to the response
        patients = [...patients, ...sessionPatients];
      }
    }

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



