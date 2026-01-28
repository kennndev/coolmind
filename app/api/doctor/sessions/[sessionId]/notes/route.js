import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Session, Doctor } from '@/lib/models';
import { verifyToken } from '@/lib/helpers';

// GET - Fetch session notes
export async function GET(request, { params }) {
  try {
    await connectDB();
    const authResult = verifyToken(request);

    if (!authResult.valid) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: 401 }
      );
    }

    const { sessionId } = params;
    const userId = authResult.user.id;

    // Find doctor profile
    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      return NextResponse.json(
        { success: false, message: 'Doctor profile not found' },
        { status: 404 }
      );
    }

    // Find session and verify it belongs to this doctor
    const session = await Session.findOne({
      _id: sessionId,
      doctorId: doctor._id
    })
      .populate('patientId', 'firstName lastName patientId')
      .lean();

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      notes: {
        sessionNotes: session.sessionNotes || '',
        presentingConcerns: session.presentingConcerns || '',
        keyObservations: session.keyObservations || '',
        interventionsUsed: session.interventionsUsed || '',
        treatmentPlan: session.treatmentPlan || '',
        homework: session.homework || '',
        riskAssessment: session.riskAssessment || 'none',
        riskNotes: session.riskNotes || '',
        notesUpdatedAt: session.notesUpdatedAt
      },
      patient: session.patientId,
      sessionDate: session.scheduledDate
    });

  } catch (error) {
    console.error('Get session notes error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to get session notes' },
      { status: 500 }
    );
  }
}

// PUT - Update session notes
export async function PUT(request, { params }) {
  try {
    await connectDB();
    const authResult = verifyToken(request);

    if (!authResult.valid) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: 401 }
      );
    }

    const { sessionId } = params;
    const userId = authResult.user.id;
    const body = await request.json();

    // Find doctor profile
    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      return NextResponse.json(
        { success: false, message: 'Doctor profile not found' },
        { status: 404 }
      );
    }

    // Find session and verify it belongs to this doctor
    const session = await Session.findOne({
      _id: sessionId,
      doctorId: doctor._id
    });

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Session not found' },
        { status: 404 }
      );
    }

    // Update notes fields
    const updateFields = {};

    if (body.sessionNotes !== undefined) {
      updateFields.sessionNotes = body.sessionNotes;
    }
    if (body.presentingConcerns !== undefined) {
      updateFields.presentingConcerns = body.presentingConcerns;
    }
    if (body.keyObservations !== undefined) {
      updateFields.keyObservations = body.keyObservations;
    }
    if (body.interventionsUsed !== undefined) {
      updateFields.interventionsUsed = body.interventionsUsed;
    }
    if (body.treatmentPlan !== undefined) {
      updateFields.treatmentPlan = body.treatmentPlan;
    }
    if (body.homework !== undefined) {
      updateFields.homework = body.homework;
    }
    if (body.riskAssessment !== undefined) {
      updateFields.riskAssessment = body.riskAssessment;
    }
    if (body.riskNotes !== undefined) {
      updateFields.riskNotes = body.riskNotes;
    }

    updateFields.notesUpdatedAt = new Date();
    updateFields.updatedAt = new Date();

    // Update session
    await Session.findByIdAndUpdate(sessionId, updateFields);

    return NextResponse.json({
      success: true,
      message: 'Session notes saved successfully'
    });

  } catch (error) {
    console.error('Update session notes error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to save session notes' },
      { status: 500 }
    );
  }
}
