import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Message, Doctor, Patient } from '@/lib/models';
import { verifyToken } from '@/lib/helpers';

// GET - Fetch messages for doctor's patients
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

    // Find doctor profile
    const doctor = await Doctor.findOne({ userId: user.id }).populate('userId');
    if (!doctor) {
      return NextResponse.json(
        { success: false, message: 'Doctor profile not found' },
        { status: 404 }
      );
    }

    // Get all patients assigned to this doctor
    const patients = await Patient.find({ assignedDoctor: doctor._id })
      .populate('userId', 'email')
      .lean();

    // Get conversations for each patient
    const conversations = [];

    for (const patient of patients) {
      // Generate conversation ID
      const ids = [user.id, patient.userId._id.toString()].sort();
      const conversationId = `${ids[0]}-${ids[1]}`;

      // Get messages for this conversation
      const messages = await Message.find({ conversationId })
        .sort({ createdAt: -1 })
        .limit(1);

      if (messages.length > 0 || true) { // Show all patients even if no messages
        const allMessages = await Message.find({ conversationId }).sort({ createdAt: 1 });
        const unreadCount = await Message.countDocuments({
          conversationId,
          recipientId: user.id,
          isRead: false
        });

        conversations.push({
          patientId: patient._id,
          patientName: `${patient.firstName} ${patient.lastName}`,
          patientIdentifier: patient.patientId,
          conversationId,
          messages: allMessages,
          lastMessage: messages[0] || null,
          unreadCount
        });
      }
    }

    // Sort by most recent message
    conversations.sort((a, b) => {
      const aTime = a.lastMessage ? new Date(a.lastMessage.createdAt) : new Date(0);
      const bTime = b.lastMessage ? new Date(b.lastMessage.createdAt) : new Date(0);
      return bTime - aTime;
    });

    return NextResponse.json({
      success: true,
      conversations
    });

  } catch (error) {
    console.error('Get doctor messages error:', error);
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

// POST - Send message to patient
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
    const { content, patientId } = await request.json();

    if (!content || !patientId) {
      return NextResponse.json(
        { success: false, message: 'Content and patient ID are required' },
        { status: 400 }
      );
    }

    // Find doctor
    const doctor = await Doctor.findOne({ userId: user.id }).populate('userId');
    if (!doctor) {
      return NextResponse.json(
        { success: false, message: 'Doctor profile not found' },
        { status: 404 }
      );
    }

    // Find patient
    const patient = await Patient.findById(patientId).populate('userId');
    if (!patient) {
      return NextResponse.json(
        { success: false, message: 'Patient not found' },
        { status: 404 }
      );
    }

    // Generate conversation ID
    const ids = [user.id, patient.userId._id.toString()].sort();
    const conversationId = `${ids[0]}-${ids[1]}`;

    // Create message
    const message = await Message.create({
      senderId: user.id,
      senderRole: 'doctor',
      recipientId: patient.userId._id,
      recipientRole: 'patient',
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
