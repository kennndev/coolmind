import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { JournalEntry, Patient } from '@/lib/models';
import { verifyToken } from '@/lib/helpers';

// GET - Fetch all journal entries for the authenticated patient
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
    const patient = await Patient.findOne({ userId: user.id });
    if (!patient) {
      return NextResponse.json(
        { success: false, message: 'Patient profile not found' },
        { status: 404 }
      );
    }

    // Get all journal entries for this patient, sorted by most recent
    const entries = await JournalEntry.find({
      patientId: patient._id
    }).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      entries
    });

  } catch (error) {
    console.error('Get journal entries error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch journal entries',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// POST - Create a new journal entry
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
    const { mood, content, tags } = await request.json();

    // Validate required fields
    if (!mood || !content) {
      return NextResponse.json(
        { success: false, message: 'Mood and content are required' },
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

    // Create journal entry
    const entry = await JournalEntry.create({
      patientId: patient._id,
      userId: user.id,
      mood,
      content,
      tags: tags || [],
      isPrivate: true
    });

    return NextResponse.json({
      success: true,
      message: 'Journal entry created successfully',
      entry
    });

  } catch (error) {
    console.error('Create journal entry error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create journal entry',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
