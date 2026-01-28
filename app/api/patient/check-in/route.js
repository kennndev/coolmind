import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { CheckIn, Patient, Session } from '@/lib/models';
import { verifyToken } from '@/lib/helpers';

// GET - Fetch check-ins for the authenticated patient
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    // Find patient profile
    const patient = await Patient.findOne({ userId: user.id });
    if (!patient) {
      return NextResponse.json(
        { success: false, message: 'Patient profile not found' },
        { status: 404 }
      );
    }

    // Build query
    const query = { patientId: patient._id };
    if (sessionId) {
      query.sessionId = sessionId;
    }

    // Get check-ins
    const checkIns = await CheckIn.find(query)
      .sort({ createdAt: -1 })
      .populate('sessionId');

    return NextResponse.json({
      success: true,
      checkIns
    });

  } catch (error) {
    console.error('Get check-ins error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch check-ins',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// POST - Create a new check-in
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
    const {
      sessionId,
      mood,
      primaryConcern,
      severity,
      specificConcerns,
      note,
      sleepQuality,
      energyLevel,
      stressLevel
    } = await request.json();

    // Validate required fields
    if (!mood || !primaryConcern || !severity) {
      return NextResponse.json(
        { success: false, message: 'Mood, primary concern, and severity are required' },
        { status: 400 }
      );
    }

    // Validate ranges
    if (mood < 1 || mood > 10) {
      return NextResponse.json(
        { success: false, message: 'Mood must be between 1 and 10' },
        { status: 400 }
      );
    }

    if (severity < 1 || severity > 5) {
      return NextResponse.json(
        { success: false, message: 'Severity must be between 1 and 5' },
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

    // If sessionId provided, verify it exists and belongs to this patient
    let session = null;
    if (sessionId) {
      session = await Session.findById(sessionId);
      if (!session || session.patientId.toString() !== patient._id.toString()) {
        return NextResponse.json(
          { success: false, message: 'Invalid session' },
          { status: 400 }
        );
      }
    }

    // Create check-in
    const checkIn = await CheckIn.create({
      patientId: patient._id,
      sessionId: sessionId || undefined,
      mood,
      primaryConcern,
      severity,
      specificConcerns: specificConcerns || [],
      note: note || '',
      sleepQuality,
      energyLevel,
      stressLevel,
      reviewedByDoctor: false
    });

    // If linked to a session, update the session
    if (session) {
      session.checkInId = checkIn._id;
      session.checkInCompleted = true;
      await session.save();
    }

    return NextResponse.json({
      success: true,
      message: 'Check-in submitted successfully',
      checkIn
    });

  } catch (error) {
    console.error('Create check-in error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to submit check-in',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
