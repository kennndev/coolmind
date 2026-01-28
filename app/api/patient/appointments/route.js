import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Session, Patient, Doctor } from '@/lib/models';
import { verifyToken } from '@/lib/helpers';

// GET - Fetch patient's appointments
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

    // Find patient
    const patient = await Patient.findOne({ userId: user.id });
    if (!patient) {
      return NextResponse.json(
        { success: false, message: 'Patient profile not found' },
        { status: 404 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const upcoming = searchParams.get('upcoming') === 'true';

    // Build query
    const query = { patientId: patient._id };
    if (status) {
      query.status = status;
    }
    if (upcoming) {
      query.scheduledDate = { $gte: new Date() };
      query.status = { $in: ['scheduled', 'confirmed'] };
    }

    // Get sessions - explicitly include video room fields
    const sessions = await Session.find(query)
      .select('sessionId scheduledDate duration type mode status videoRoomId videoRoomUrl checkInCompleted patientId doctorId checkInId notes actualStartTime actualEndTime')
      .populate('doctorId', 'firstName lastName title specialty phoneNumber')
      .populate('checkInId')
      .sort({ scheduledDate: upcoming ? 1 : -1 })
      .lean();

    return NextResponse.json({
      success: true,
      appointments: sessions
    });

  } catch (error) {
    console.error('Get appointments error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch appointments',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// POST - Schedule a new appointment
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
    const { doctorId, scheduledDate, duration, type, mode, notes } = await request.json();

    // Validate required fields
    if (!doctorId || !scheduledDate || !mode) {
      return NextResponse.json(
        { success: false, message: 'Doctor, date, and mode are required' },
        { status: 400 }
      );
    }

    // Find patient
    const patient = await Patient.findOne({ userId: user.id });
    if (!patient) {
      return NextResponse.json(
        { success: false, message: 'Patient profile not found' },
        { status: 404 }
      );
    }

    // Verify doctor exists and is approved
    const doctor = await Doctor.findById(doctorId);
    if (!doctor || !doctor.isApproved) {
      return NextResponse.json(
        { success: false, message: 'Doctor not found or not approved' },
        { status: 404 }
      );
    }

    // Check if time slot is available
    const appointmentDate = new Date(scheduledDate);
    const existingSession = await Session.findOne({
      doctorId,
      scheduledDate: appointmentDate,
      status: { $in: ['scheduled', 'confirmed', 'in-progress'] }
    });

    if (existingSession) {
      return NextResponse.json(
        { success: false, message: 'This time slot is not available' },
        { status: 400 }
      );
    }

    // Generate session ID
    const sessionCount = await Session.countDocuments();
    const sessionId = `S-${Date.now()}-${sessionCount + 1}`;

    // Generate video channel name for Agora - use sessionId for consistency
    let videoRoomId = null;
    let videoRoomUrl = null;
    let linkExpiresAt = null;
    if (mode === 'video') {
      // Use sessionId to ensure both patient and doctor join the same channel
      // Format: mindflow-S-timestamp-count (cleaned for Agora compatibility)
      videoRoomId = `mindflow-${sessionId}`.toLowerCase().replace(/[^a-z0-9-]/g, '');
      // Store the channel name as URL for backwards compatibility
      videoRoomUrl = videoRoomId;
      // Link expires 15 minutes after creation
      linkExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    }

    // Create session
    const session = await Session.create({
      sessionId,
      patientId: patient._id,
      doctorId,
      scheduledDate: appointmentDate,
      duration: duration || 50,
      type: type || 'follow-up',
      mode,
      status: 'scheduled',
      videoRoomId,
      videoRoomUrl,
      linkExpiresAt,
      notes
    });

    // Assign doctor to patient if not already assigned
    if (!patient.assignedDoctor) {
      patient.assignedDoctor = doctorId;
      await patient.save();
    }

    // Populate doctor info for response
    await session.populate('doctorId', 'firstName lastName title specialty');

    return NextResponse.json({
      success: true,
      message: 'Appointment scheduled successfully',
      appointment: session
    });

  } catch (error) {
    console.error('Schedule appointment error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to schedule appointment',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE - Cancel an appointment
export async function DELETE(request) {
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
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { success: false, message: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Find patient
    const patient = await Patient.findOne({ userId: user.id });
    if (!patient) {
      return NextResponse.json(
        { success: false, message: 'Patient profile not found' },
        { status: 404 }
      );
    }

    // Find session
    const session = await Session.findById(sessionId);
    if (!session || session.patientId.toString() !== patient._id.toString()) {
      return NextResponse.json(
        { success: false, message: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Check if can cancel (not already completed or cancelled)
    if (session.status === 'completed' || session.status === 'cancelled') {
      return NextResponse.json(
        { success: false, message: `Cannot cancel ${session.status} appointment` },
        { status: 400 }
      );
    }

    // Update session
    session.status = 'cancelled';
    session.cancelledBy = 'patient';
    session.cancelledAt = new Date();
    await session.save();

    return NextResponse.json({
      success: true,
      message: 'Appointment cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel appointment error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to cancel appointment',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
