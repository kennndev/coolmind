/**
 * MongoDB Schema Definitions for MindFlow
 * Using Mongoose ODM
 */

import mongoose from 'mongoose';
const { Schema } = mongoose;

// ==================== USER AUTHENTICATION ====================

const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['patient', 'doctor', 'admin'],
    required: true
  },
  isVerified: {
    type: Boolean,
    default: true // Auto-verify since we're using password auth
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

UserSchema.index({ email: 1, role: 1 });

// ==================== VERIFICATION CODES ====================

const VerificationCodeSchema = new Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  code: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['login', 'verify-email', 'password-reset'],
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 }
  },
  used: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

VerificationCodeSchema.index({ email: 1, code: 1, type: 1 });

// ==================== PATIENT PROFILE ====================

const PatientSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  patientId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'non-binary', 'prefer-not-to-say', 'other']
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phoneNumber: String
  },
  primaryConditions: [{
    type: String
  }],
  allergies: [{
    type: String
  }],
  medications: [{
    name: String,
    dosage: String,
    frequency: String
  }],
  assignedDoctor: {
    type: Schema.Types.ObjectId,
    ref: 'Doctor',
    index: true
  },
  profileCompleted: {
    type: Boolean,
    default: false
  },
  onboardingCompleted: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

PatientSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// ==================== DOCTOR PROFILE ====================

const DoctorSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  doctorId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    enum: ['Dr.', 'Prof.', 'Mr.', 'Ms.', 'Mrs.'],
    default: 'Dr.'
  },
  specialty: {
    type: String,
    required: true,
    trim: true
  },
  subSpecialties: [{
    type: String
  }],
  licenseNumber: {
    type: String,
    required: true,
    unique: true
  },
  licenseState: {
    type: String
  },
  licenseExpiryDate: {
    type: Date
  },
  education: [{
    degree: String,
    institution: String,
    year: Number
  }],
  certifications: [{
    name: String,
    issuingOrganization: String,
    issueDate: Date,
    expiryDate: Date
  }],
  phoneNumber: {
    type: String,
    trim: true
  },
  bio: {
    type: String,
    maxlength: 1000
  },
  yearsOfExperience: {
    type: Number
  },
  workingHours: {
    monday: { start: String, end: String, available: Boolean },
    tuesday: { start: String, end: String, available: Boolean },
    wednesday: { start: String, end: String, available: Boolean },
    thursday: { start: String, end: String, available: Boolean },
    friday: { start: String, end: String, available: Boolean },
    saturday: { start: String, end: String, available: Boolean },
    sunday: { start: String, end: String, available: Boolean }
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  profileCompleted: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

DoctorSchema.virtual('fullName').get(function() {
  return `${this.title} ${this.firstName} ${this.lastName}`;
});

// ==================== PRE-SESSION CHECK-IN ====================

const CheckInSchema = new Schema({
  patientId: {
    type: Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },
  sessionId: {
    type: Schema.Types.ObjectId,
    ref: 'Session',
    index: true
  },
  mood: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  primaryConcern: {
    type: String,
    enum: ['Anxiety', 'Depression', 'Stress', 'Work/School', 'Relationships', 'Sleep', 'Other'],
    required: true
  },
  severity: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  specificConcerns: [{
    type: String
  }],
  note: {
    type: String,
    maxlength: 1000
  },
  sleepQuality: {
    type: Number,
    min: 1,
    max: 10
  },
  energyLevel: {
    type: Number,
    min: 1,
    max: 10
  },
  stressLevel: {
    type: Number,
    min: 1,
    max: 10
  },
  reviewedByDoctor: {
    type: Boolean,
    default: false
  },
  reviewedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

CheckInSchema.index({ patientId: 1, createdAt: -1 });

// ==================== SESSIONS ====================

const SessionSchema = new Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  patientId: {
    type: Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },
  doctorId: {
    type: Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
    index: true
  },
  scheduledDate: {
    type: Date,
    required: true,
    index: true
  },
  duration: {
    type: Number,
    default: 50
  },
  type: {
    type: String,
    enum: ['initial', 'follow-up', 'emergency', 'group'],
    default: 'follow-up'
  },
  mode: {
    type: String,
    enum: ['video', 'in-person', 'phone'],
    default: 'video'
  },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled',
    index: true
  },
  videoRoomId: {
    type: String
  },
  videoRoomUrl: {
    type: String
  },
  linkExpiresAt: {
    type: Date
  },
  actualStartTime: {
    type: Date
  },
  actualEndTime: {
    type: Date
  },
  actualDuration: {
    type: Number
  },
  checkInId: {
    type: Schema.Types.ObjectId,
    ref: 'CheckIn'
  },
  checkInCompleted: {
    type: Boolean,
    default: false
  },
  cancelledBy: {
    type: String,
    enum: ['patient', 'doctor', 'system']
  },
  cancellationReason: {
    type: String
  },
  cancelledAt: {
    type: Date
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  reminderSentAt: {
    type: Date
  },
  // Doctor's session notes
  sessionNotes: {
    type: String,
    maxlength: 10000
  },
  // Structured notes fields
  presentingConcerns: {
    type: String,
    maxlength: 2000
  },
  keyObservations: {
    type: String,
    maxlength: 2000
  },
  interventionsUsed: {
    type: String,
    maxlength: 2000
  },
  treatmentPlan: {
    type: String,
    maxlength: 2000
  },
  homework: {
    type: String,
    maxlength: 1000
  },
  riskAssessment: {
    type: String,
    enum: ['none', 'low', 'moderate', 'high'],
    default: 'none'
  },
  riskNotes: {
    type: String,
    maxlength: 1000
  },
  notesUpdatedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

SessionSchema.index({ patientId: 1, scheduledDate: -1 });
SessionSchema.index({ doctorId: 1, scheduledDate: -1 });
SessionSchema.index({ status: 1, scheduledDate: 1 });

// ==================== JOURNAL ENTRIES ====================

const JournalEntrySchema = new Schema({
  patientId: {
    type: Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  mood: {
    type: String,
    enum: ['great', 'good', 'okay', 'struggling', 'difficult'],
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 5000
  },
  tags: [{
    type: String
  }],
  isPrivate: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

JournalEntrySchema.index({ patientId: 1, createdAt: -1 });
JournalEntrySchema.index({ userId: 1, createdAt: -1 });

// ==================== MESSAGES ====================

const MessageSchema = new Schema({
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  senderRole: {
    type: String,
    enum: ['patient', 'doctor'],
    required: true
  },
  recipientId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  recipientRole: {
    type: String,
    enum: ['patient', 'doctor'],
    required: true
  },
  conversationId: {
    type: String,
    required: true,
    index: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, recipientId: 1 });

// ==================== MOOD TRACKING ====================

const MoodEntrySchema = new Schema({
  patientId: {
    type: Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  mood: {
    type: String,
    enum: ['great', 'good', 'okay', 'struggling', 'difficult'],
    required: true
  },
  moodScore: {
    type: Number,
    min: 1,
    max: 10,
    required: true
  },
  note: {
    type: String,
    maxlength: 500
  },
  triggers: [{
    type: String
  }],
  activities: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

MoodEntrySchema.index({ patientId: 1, createdAt: -1 });
MoodEntrySchema.index({ userId: 1, createdAt: -1 });

// ==================== EXPORTS ====================

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const VerificationCode = mongoose.models.VerificationCode || mongoose.model('VerificationCode', VerificationCodeSchema);
const Patient = mongoose.models.Patient || mongoose.model('Patient', PatientSchema);
const Doctor = mongoose.models.Doctor || mongoose.model('Doctor', DoctorSchema);
const CheckIn = mongoose.models.CheckIn || mongoose.model('CheckIn', CheckInSchema);
const Session = mongoose.models.Session || mongoose.model('Session', SessionSchema);
const JournalEntry = mongoose.models.JournalEntry || mongoose.model('JournalEntry', JournalEntrySchema);
const Message = mongoose.models.Message || mongoose.model('Message', MessageSchema);
const MoodEntry = mongoose.models.MoodEntry || mongoose.model('MoodEntry', MoodEntrySchema);

export {
  User,
  VerificationCode,
  Patient,
  Doctor,
  CheckIn,
  Session,
  JournalEntry,
  Message,
  MoodEntry
};

