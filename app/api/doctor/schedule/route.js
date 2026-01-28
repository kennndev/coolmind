import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Session, Doctor, Patient } from '@/lib/models';
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

    const userId = authResult.user.id;

    // Find doctor profile
    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      return NextResponse.json(
        { success: false, message: 'Doctor profile not found' },
        { status: 404 }
      );
    }

    // Get query params for date filtering
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const upcoming = searchParams.get('upcoming') === 'true';

    // Build date filter
    let dateFilter = {};
    if (dateParam) {
      // Specific date filter
      const targetDate = new Date(dateParam);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
      dateFilter = {
        scheduledDate: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      };
    } else if (upcoming || !dateParam) {
      // If upcoming=true or no date specified, get all future sessions
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      dateFilter = {
        scheduledDate: { $gte: now }
      };
    }

    // Fetch sessions for this doctor - include videoRoomId and videoRoomUrl
    const sessions = await Session.find({
      doctorId: doctor._id,
      ...dateFilter,
      status: { $in: ['scheduled', 'confirmed', 'in-progress'] }
    })
      .select('sessionId scheduledDate duration type mode status videoRoomId videoRoomUrl checkInCompleted checkInId patientId doctorId')
      .populate({
        path: 'patientId',
        select: 'firstName lastName patientId primaryConditions'
      })
      .populate('checkInId')
      .sort({ scheduledDate: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      sessions
    });
  } catch (error) {
    console.error('Get schedule error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to get schedule' },
      { status: 500 }
    );
  }
}

