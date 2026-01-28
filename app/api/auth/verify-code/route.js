import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User, VerificationCode, Patient, Doctor } from '@/lib/models';
import { generateSessionToken, generatePatientId, generateDoctorId, getApprovedDoctorEmails } from '@/lib/helpers';

export async function POST(request) {
  try {
    await connectDB();
    const { email, code } = await request.json();

    if (process.env.NODE_ENV === 'development') {
      console.log('=== VERIFY CODE REQUEST ===');
      console.log('Email:', email);
      console.log('Code:', code);
    }

    if (!email || !code) {
      return NextResponse.json(
        { success: false, message: 'Email and code are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const trimmedCode = code.trim();

    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Verifying code for:', normalizedEmail);
      console.log('Code received:', trimmedCode);
    }

    // Check if code exists (even if used or expired) for better error messages
    const anyCode = await VerificationCode.findOne({
      email: normalizedEmail,
      code: trimmedCode,
      type: 'login'
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('Code lookup result:', anyCode ? 'Found' : 'Not found');
      if (anyCode) {
        console.log('Code used:', anyCode.used);
        console.log('Code expires at:', anyCode.expiresAt);
        console.log('Current time:', new Date());
      }
    }

    if (!anyCode) {
      // Check if there are any codes for this email
      const codesForEmail = await VerificationCode.find({
        email: normalizedEmail,
        type: 'login'
      }).sort({ createdAt: -1 }).limit(1);
      
      if (codesForEmail.length > 0 && process.env.NODE_ENV === 'development') {
        console.log('Latest code for email:', codesForEmail[0].code);
      }

      return NextResponse.json(
        { success: false, message: 'Invalid verification code. Please check the code and try again.' },
        { status: 400 }
      );
    }

    // Check if code was already used
    if (anyCode.used) {
      return NextResponse.json(
        { success: false, message: 'This verification code has already been used. Please request a new code.' },
        { status: 400 }
      );
    }

    // Check if code expired
    if (anyCode.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, message: 'Verification code has expired. Please request a new code.' },
        { status: 400 }
      );
    }

    const verificationRecord = anyCode;

    // Mark code as used
    verificationRecord.used = true;
    await verificationRecord.save();

    // Find or create user
    let user = await User.findOne({ email: normalizedEmail });
    let isNewUser = false;

    if (!user) {
      const approvedDoctorEmails = await getApprovedDoctorEmails();
      const role = approvedDoctorEmails.includes(normalizedEmail) ? 'doctor' : 'patient';

      user = await User.create({
        email: normalizedEmail,
        role,
        isVerified: true,
        lastLogin: new Date()
      });

      if (process.env.NODE_ENV === 'development') {
        console.log('✓ User created:', user.email, 'Role:', user.role);
      }

      isNewUser = true;

      // Create profile based on role
      try {
        if (role === 'patient') {
          const patientId = await generatePatientId();
          const patient = await Patient.create({
            userId: user._id,
            patientId,
            firstName: 'Pending',
            lastName: 'Profile',
            dateOfBirth: new Date('2000-01-01'),
            profileCompleted: false
          });
          if (process.env.NODE_ENV === 'development') {
            console.log('✓ Patient profile created:', patient.patientId, 'ID:', patient._id, 'profileCompleted:', patient.profileCompleted);
          }
        } else if (role === 'doctor') {
          const doctorId = await generateDoctorId();
          // Auto-approve if email is in approved list
          const isAutoApproved = approvedDoctorEmails.includes(normalizedEmail);
          const doctor = await Doctor.create({
            userId: user._id,
            doctorId,
            firstName: 'Pending',
            lastName: 'Profile',
            specialty: 'Pending',
            licenseNumber: 'PENDING',
            profileCompleted: false,
            isApproved: isAutoApproved,
            approvedAt: isAutoApproved ? new Date() : undefined
          });
          if (process.env.NODE_ENV === 'development') {
            console.log('✓ Doctor profile created:', doctor.doctorId, 'ID:', doctor._id, 'isApproved:', doctor.isApproved);
          }
        }
      } catch (profileError) {
        console.error('✗ Error creating profile:', profileError);
        throw profileError;
      }
    } else {
      user.lastLogin = new Date();
      if (!user.isVerified) {
        user.isVerified = true;
      }
      await user.save();
    }

    // Generate session token
    const sessionToken = generateSessionToken(user);

    // Get profile completion status
    let profileData = null;
    let profileCompleted = false;

    if (user.role === 'patient') {
      const patient = await Patient.findOne({ userId: user._id });
      profileCompleted = patient?.profileCompleted ?? false;
      profileData = patient;
      if (process.env.NODE_ENV === 'development') {
        console.log('Patient profile lookup:', { 
          found: !!patient, 
          profileCompleted: profileCompleted,
          patientId: patient?.patientId 
        });
      }
    } else if (user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: user._id });
      profileCompleted = doctor?.profileCompleted ?? false;
      profileData = doctor;
      if (process.env.NODE_ENV === 'development') {
        console.log('Doctor profile lookup:', { 
          found: !!doctor, 
          profileCompleted: profileCompleted,
          doctorId: doctor?.doctorId 
        });
      }
    }

    // Always require onboarding for new users, or if profile is not completed
    // For new users, profileCompleted will be false, so this ensures form is shown
    const requiresOnboarding = isNewUser || !profileCompleted;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Auth response data:', {
        isNewUser,
        profileCompleted,
        requiresOnboarding,
        role: user.role,
        hasProfile: !!profileData
      });
    }

    return NextResponse.json({
      success: true,
      message: isNewUser ? 'Account created successfully' : 'Login successful',
      token: sessionToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      },
      isNewUser,
      profileCompleted,
      profileData,
      requiresOnboarding
    });

  } catch (error) {
    console.error('Verify code error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Verification failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

