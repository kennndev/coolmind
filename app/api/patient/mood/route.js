import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { MoodEntry, Patient } from '@/lib/models';
import { verifyToken } from '@/lib/helpers';

// GET - Fetch mood entries for the authenticated patient
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

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 30;
    const days = parseInt(searchParams.get('days')) || 30;

    // Find patient profile
    const patient = await Patient.findOne({ userId: user.id });
    if (!patient) {
      return NextResponse.json(
        { success: false, message: 'Patient profile not found' },
        { status: 404 }
      );
    }

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get mood entries for this patient within date range
    const entries = await MoodEntry.find({
      patientId: patient._id,
      createdAt: { $gte: startDate }
    })
      .sort({ createdAt: -1 })
      .limit(limit);

    // Calculate statistics
    const stats = {
      total: entries.length,
      averageScore: entries.length > 0
        ? entries.reduce((sum, e) => sum + e.moodScore, 0) / entries.length
        : 0,
      moodDistribution: {
        great: entries.filter(e => e.mood === 'great').length,
        good: entries.filter(e => e.mood === 'good').length,
        okay: entries.filter(e => e.mood === 'okay').length,
        struggling: entries.filter(e => e.mood === 'struggling').length,
        difficult: entries.filter(e => e.mood === 'difficult').length
      }
    };

    return NextResponse.json({
      success: true,
      entries,
      stats
    });

  } catch (error) {
    console.error('Get mood entries error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch mood entries',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// POST - Create a new mood entry
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
    const { mood, moodScore, note, triggers, activities } = await request.json();

    // Validate required fields
    if (!mood || !moodScore) {
      return NextResponse.json(
        { success: false, message: 'Mood and mood score are required' },
        { status: 400 }
      );
    }

    // Validate mood score range
    if (moodScore < 1 || moodScore > 10) {
      return NextResponse.json(
        { success: false, message: 'Mood score must be between 1 and 10' },
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

    // Create mood entry
    const entry = await MoodEntry.create({
      patientId: patient._id,
      userId: user.id,
      mood,
      moodScore,
      note: note || '',
      triggers: triggers || [],
      activities: activities || []
    });

    return NextResponse.json({
      success: true,
      message: 'Mood entry logged successfully',
      entry
    });

  } catch (error) {
    console.error('Create mood entry error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to log mood entry',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
