import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/lib/models';
import { authenticateToken } from '@/lib/auth';

export async function POST(request) {
  try {
    await connectDB();
    const authResult = authenticateToken(request);

    if (authResult.error) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      );
    }

    const user = await User.findById(authResult.user.id);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Verify token error:', error);
    return NextResponse.json(
      { success: false, message: 'Token verification failed' },
      { status: 500 }
    );
  }
}



