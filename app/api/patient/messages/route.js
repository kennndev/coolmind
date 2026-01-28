import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Message, Patient, Doctor, Session } from '@/lib/models';
import { verifyToken } from '@/lib/helpers';

// GET - Fetch messages for the authenticated patient
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
    const patient = await Patient.findOne({ userId: user.id }).populate('assignedDoctor');
    if (!patient) {
      return NextResponse.json(
        { success: false, message: 'Patient profile not found' },
        { status: 404 }
      );
    }

    // If patient has an assigned doctor, get conversation
    let messages = [];
    let conversationId = null;
    let doctorInfo = null;
    let doctor = null;

    // First check if patient has assigned doctor
    if (patient.assignedDoctor) {
      doctor = await Doctor.findById(patient.assignedDoctor).populate('userId');
    }

    // If no assigned doctor, find from any existing session
    if (!doctor) {
      const anySession = await Session.findOne({ patientId: patient._id })
        .sort({ createdAt: -1 })
        .populate('doctorId');

      if (anySession && anySession.doctorId) {
        doctor = await Doctor.findById(anySession.doctorId).populate('userId');

        // Auto-assign this doctor to the patient
        if (doctor) {
          patient.assignedDoctor = doctor._id;
          await patient.save();
        }
      }
    }

    if (doctor) {
      // Generate conversation ID (consistent format: smaller_id-larger_id)
      const ids = [user.id, doctor.userId._id.toString()].sort();
      conversationId = `${ids[0]}-${ids[1]}`;

      // Fetch messages for this conversation
      messages = await Message.find({
        conversationId
      }).sort({ createdAt: 1 });

      doctorInfo = {
        id: doctor._id,
        name: `${doctor.title} ${doctor.firstName} ${doctor.lastName}`,
        specialty: doctor.specialty
      };
    }

    return NextResponse.json({
      success: true,
      messages,
      conversationId,
      doctor: doctorInfo
    });

  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch messages',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// POST - Send a new message
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

    const { user } = authResult;
    const { content, recipientId } = await request.json();

    // Validate required fields
    if (!content || !recipientId) {
      return NextResponse.json(
        { success: false, message: 'Content and recipient are required' },
        { status: 400 }
      );
    }

    // Find patient profile
    const patient = await Patient.findOne({ userId: user.id });
    if (!patient) {
      return NextResponse.json(
        { success: false, message: 'Patient profile not found' },
        { status: 404 }
      );
    }

    // Find doctor (recipient)
    const doctor = await Doctor.findById(recipientId).populate('userId');
    if (!doctor) {
      return NextResponse.json(
        { success: false, message: 'Doctor not found' },
        { status: 404 }
      );
    }

    // Generate conversation ID (consistent format: smaller_id-larger_id)
    const ids = [user.id, doctor.userId._id.toString()].sort();
    const conversationId = `${ids[0]}-${ids[1]}`;

    // Create message
    const message = await Message.create({
      senderId: user.id,
      senderRole: 'patient',
      recipientId: doctor.userId._id,
      recipientRole: 'doctor',
      conversationId,
      content,
      isRead: false
    });

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });

  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to send message',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
