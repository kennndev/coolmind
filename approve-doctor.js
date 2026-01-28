// Script to approve a doctor
// Run this with: node approve-doctor.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const DoctorSchema = new mongoose.Schema({
  isApproved: Boolean,
  firstName: String,
  lastName: String
}, { collection: 'doctors' });

const Doctor = mongoose.model('Doctor', DoctorSchema);

async function approveDoctor() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Approve all doctors (or you can filter by doctorId)
    const result = await Doctor.updateMany(
      { isApproved: false },
      { $set: { isApproved: true } }
    );

    console.log(`✅ Approved ${result.modifiedCount} doctor(s)`);

    const doctors = await Doctor.find({ isApproved: true });
    console.log('\nApproved doctors:');
    doctors.forEach(doc => {
      console.log(`  - ${doc.firstName} ${doc.lastName}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

approveDoctor();
