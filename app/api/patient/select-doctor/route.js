import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Patient, Doctor } from '@/lib/models';
import { verifyToken } from '@/lib/helpers';

// POST - Patient selects a doctor
export async function POST(request) {
  try {
    await connectDB();

    const authResult = verifyToken(request);
    if (!authResult.valid) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: 401 }
      );
    }

    const { doctorId } = await request.json();

    if (!doctorId) {
      return NextResponse.json(
        { success: false, message: 'Doctor ID is required' },
        { status: 400 }
      );
    }

    // Find patient profile
    const patient = await Patient.findOne({ userId: authResult.user.id });
    if (!patient) {
      return NextResponse.json(
        { success: false, message: 'Patient profile not found' },
        { status: 404 }
      );
    }

    // Find the doctor
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return NextResponse.json(
        { success: false, message: 'Doctor not found' },
        { status: 404 }
      );
    }

    // Check if doctor is approved and accepting patients
    if (!doctor.isApproved) {
      return NextResponse.json(
        { success: false, message: 'This doctor is not available' },
        { status: 400 }
      );
    }

    // Assign doctor to patient
    patient.assignedDoctor = doctor._id;
    await patient.save();

    return NextResponse.json({
      success: true,
      message: 'Doctor selected successfully',
      doctor: {
        id: doctor._id,
        name: `${doctor.title || ''} ${doctor.firstName} ${doctor.lastName}`.trim(),
        specialty: doctor.specialty
      }
    });

  } catch (error) {
    console.error('Select doctor error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to select doctor' },
      { status: 500 }
    );
  }
}
