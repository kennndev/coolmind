import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User, Patient, Doctor, VerificationCode } from '@/lib/models';
import mongoose from 'mongoose';

export async function GET(request) {
  try {
    await connectDB();
    
    const db = mongoose.connection;
    const dbName = db.name;
    const dbState = db.readyState; // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    
    // Count documents
    const userCount = await User.countDocuments();
    const patientCount = await Patient.countDocuments();
    const doctorCount = await Doctor.countDocuments();
    const codeCount = await VerificationCode.countDocuments();
    
    // Get sample data
    const sampleUsers = await User.find().limit(5).select('email role createdAt');
    const samplePatients = await Patient.find().limit(5).select('patientId firstName lastName createdAt');
    const sampleDoctors = await Doctor.find().limit(5).select('doctorId firstName lastName createdAt');
    
    return NextResponse.json({
      success: true,
      connection: {
        state: dbState === 1 ? 'connected' : 'disconnected',
        database: dbName,
        host: db.host,
        port: db.port
      },
      counts: {
        users: userCount,
        patients: patientCount,
        doctors: doctorCount,
        verificationCodes: codeCount
      },
      samples: {
        users: sampleUsers,
        patients: samplePatients,
        doctors: sampleDoctors
      },
      mongoUri: process.env.MONGODB_URI ? 'Set (hidden)' : 'NOT SET'
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      mongoUri: process.env.MONGODB_URI ? 'Set (hidden)' : 'NOT SET'
    }, { status: 500 });
  }
}



