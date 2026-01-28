import { NextResponse } from 'next/server';
import { RtcTokenBuilder, RtcRole } from 'agora-token';
import connectDB from '@/lib/db';
import { Session } from '@/lib/models';

// Agora credentials from environment
const APP_ID = process.env.AGORA_APP_ID || '147447e8226149c992c1188519693266';
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE || '8c0e9904d9d541a39edac24513b9a760';

export async function POST(request) {
  try {
    const { channelName, uid } = await request.json();

    if (!channelName) {
      return NextResponse.json(
        { success: false, message: 'Channel name is required' },
        { status: 400 }
      );
    }

    if (!APP_CERTIFICATE) {
      return NextResponse.json(
        { success: false, message: 'Agora App Certificate not configured' },
        { status: 500 }
      );
    }

    // Validate link expiration if channelName matches session format
    if (channelName.startsWith('mindflow-')) {
      await connectDB();
      const session = await Session.findOne({ videoRoomId: channelName });
      
      if (session && session.linkExpiresAt) {
        const now = new Date();
        if (now > session.linkExpiresAt) {
          return NextResponse.json(
            { success: false, message: 'This session link has expired. Please request a new link.' },
            { status: 403 }
          );
        }
      }
    }

    // Token expires in 15 minutes
    const expirationTimeInSeconds = 900;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // Use 0 for uid to allow any user
    const userUid = uid || 0;

    // Generate the RTC token using the correct method signature
    const token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERTIFICATE,
      channelName,
      userUid,
      RtcRole.PUBLISHER,
      privilegeExpiredTs,
      privilegeExpiredTs
    );

    console.log('Generated token for channel:', channelName, 'uid:', userUid);

    return NextResponse.json({
      success: true,
      token,
      appId: APP_ID,
      channel: channelName,
      uid: userUid,
      expiresAt: privilegeExpiredTs
    });

  } catch (error) {
    console.error('Token generation error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to generate token',
        error: error.message
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const channelName = searchParams.get('channel');
  const uid = parseInt(searchParams.get('uid') || '0');

  if (!channelName) {
    return NextResponse.json(
      { success: false, message: 'Channel name is required' },
      { status: 400 }
    );
  }

  if (!APP_CERTIFICATE) {
    return NextResponse.json(
      { success: false, message: 'Agora App Certificate not configured. Add AGORA_APP_CERTIFICATE to .env.local' },
      { status: 500 }
    );
  }

  // Validate link expiration if channelName matches session format
  if (channelName.startsWith('mindflow-')) {
    try {
      await connectDB();
      const session = await Session.findOne({ videoRoomId: channelName });
      
      if (session && session.linkExpiresAt) {
        const now = new Date();
        if (now > session.linkExpiresAt) {
          return NextResponse.json(
            { success: false, message: 'This session link has expired. Please request a new link.' },
            { status: 403 }
          );
        }
      }
    } catch (error) {
      console.error('Error validating link expiration:', error);
      // Continue with token generation if validation fails (non-blocking)
    }
  }

  // Token expires in 15 minutes
  const expirationTimeInSeconds = 900;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  try {
    const token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERTIFICATE,
      channelName,
      uid,
      RtcRole.PUBLISHER,
      privilegeExpiredTs,
      privilegeExpiredTs
    );

    console.log('Generated token for channel:', channelName, 'uid:', uid);

    return NextResponse.json({
      success: true,
      token,
      appId: APP_ID,
      channel: channelName,
      uid
    });
  } catch (error) {
    console.error('Token generation error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to generate token: ' + error.message },
      { status: 500 }
    );
  }
}
