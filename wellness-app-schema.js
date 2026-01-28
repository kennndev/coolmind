/**
 * MongoDB Schema Definitions for Wellness App
 * Using Mongoose ODM
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

// ==================== USER AUTHENTICATION ====================

/**
 * User Schema - Base authentication model
 * Handles email-based passwordless authentication
 */
const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  role: {
    type: String,
    enum: ['patient', 'doctor', 'admin'],
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
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

const User = mongoose.model('User', UserSchema);

// ==================== VERIFICATION CODES ====================

/**
 * VerificationCode Schema
 * Stores temporary codes/tokens for email verification and login
 */
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
    index: { expires: 0 } // TTL index - auto-delete expired codes
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

// Compound index for efficient lookups
VerificationCodeSchema.index({ email: 1, code: 1, type: 1 });

const VerificationCode = mongoose.model('VerificationCode', VerificationCodeSchema);

// ==================== PATIENT PROFILE ====================

/**
 * Patient Schema
 * Extended profile information for patients
 */
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
  // Medical Information
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
  // Assignment
  assignedDoctor: {
    type: Schema.Types.ObjectId,
    ref: 'Doctor',
    index: true
  },
  // Metadata
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

// Virtual for full name
PatientSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

const Patient = mongoose.model('Patient', PatientSchema);

// ==================== DOCTOR PROFILE ====================

/**
 * Doctor Schema
 * Extended profile information for healthcare providers
 */
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
  // Credentials
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
  // Contact & Professional Info
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
  // Schedule & Availability
  workingHours: {
    monday: { start: String, end: String, available: Boolean },
    tuesday: { start: String, end: String, available: Boolean },
    wednesday: { start: String, end: String, available: Boolean },
    thursday: { start: String, end: String, available: Boolean },
    friday: { start: String, end: String, available: Boolean },
    saturday: { start: String, end: String, available: Boolean },
    sunday: { start: String, end: String, available: Boolean }
  },
  // Status
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
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Virtual for full name with title
DoctorSchema.virtual('fullName').get(function() {
  return `${this.title} ${this.firstName} ${this.lastName}`;
});

const Doctor = mongoose.model('Doctor', DoctorSchema);

// ==================== PRE-SESSION CHECK-IN ====================

/**
 * CheckIn Schema
 * Stores patient pre-session check-in data
 */
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
  // Check-in Data
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
  // Additional Metrics
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
  // Flags
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

const CheckIn = mongoose.model('CheckIn', CheckInSchema);

// ==================== SESSIONS/APPOINTMENTS ====================

/**
 * Session Schema
 * Manages therapy sessions/appointments
 */
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
  // Scheduling
  scheduledDate: {
    type: Date,
    required: true,
    index: true
  },
  duration: {
    type: Number, // in minutes
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
  // Status
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled',
    index: true
  },
  // Video Call Info
  videoRoomId: {
    type: String
  },
  videoRoomUrl: {
    type: String
  },
  // Session Details
  actualStartTime: {
    type: Date
  },
  actualEndTime: {
    type: Date
  },
  actualDuration: {
    type: Number // in minutes
  },
  // Check-in
  checkInId: {
    type: Schema.Types.ObjectId,
    ref: 'CheckIn'
  },
  checkInCompleted: {
    type: Boolean,
    default: false
  },
  // Cancellation
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
  // Reminders
  reminderSent: {
    type: Boolean,
    default: false
  },
  reminderSentAt: {
    type: Date
  },
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound indexes for common queries
SessionSchema.index({ patientId: 1, scheduledDate: -1 });
SessionSchema.index({ doctorId: 1, scheduledDate: -1 });
SessionSchema.index({ status: 1, scheduledDate: 1 });

const Session = mongoose.model('Session', SessionSchema);

// ==================== SESSION NOTES ====================

/**
 * SessionNote Schema
 * Clinical notes and documentation for sessions
 */
const SessionNoteSchema = new Schema({
  sessionId: {
    type: Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
    index: true
  },
  doctorId: {
    type: Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
    index: true
  },
  patientId: {
    type: Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },
  // Note Content
  presentingConcern: {
    type: String,
    required: true
  },
  subjective: {
    type: String, // Patient's subjective report
    maxlength: 5000
  },
  objective: {
    type: String, // Clinician's observations
    maxlength: 5000
  },
  assessment: {
    type: String, // Clinical assessment
    maxlength: 5000
  },
  plan: {
    type: String, // Treatment plan
    maxlength: 5000
  },
  keyPoints: [{
    type: String
  }],
  interventionsUsed: [{
    type: String
  }],
  homeworkAssigned: [{
    task: String,
    dueDate: Date
  }],
  // Risk Assessment
  riskFlags: [{
    type: String,
    enum: ['suicide', 'self-harm', 'harm-to-others', 'substance-abuse', 'none']
  }],
  riskLevel: {
    type: String,
    enum: ['none', 'low', 'moderate', 'high', 'immediate'],
    default: 'none'
  },
  riskNotes: {
    type: String,
    maxlength: 2000
  },
  // Progress Tracking
  progressRating: {
    type: String,
    enum: ['improving', 'stable', 'declining', 'needs-attention']
  },
  // Image/Document Extraction
  extractedFromImage: {
    type: Boolean,
    default: false
  },
  originalImageUrl: {
    type: String
  },
  // Status
  isDraft: {
    type: Boolean,
    default: true
  },
  signedAt: {
    type: Date
  },
  signedBy: {
    type: Schema.Types.ObjectId,
    ref: 'Doctor'
  },
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

SessionNoteSchema.index({ patientId: 1, createdAt: -1 });
SessionNoteSchema.index({ doctorId: 1, createdAt: -1 });

const SessionNote = mongoose.model('SessionNote', SessionNoteSchema);

// ==================== MESSAGES ====================

/**
 * Message Schema
 * Secure messaging between patients and doctors
 */
const MessageSchema = new Schema({
  conversationId: {
    type: String,
    required: true,
    index: true
  },
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
  // Message Content
  content: {
    type: String,
    required: true,
    maxlength: 5000
  },
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String,
    fileSize: Number
  }],
  // Status
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  // Metadata
  relatedSessionId: {
    type: Schema.Types.ObjectId,
    ref: 'Session'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, recipientId: 1 });

const Message = mongoose.model('Message', MessageSchema);

// ==================== RESOURCES ====================

/**
 * Resource Schema
 * Daily positivity messages, breathing exercises, etc.
 */
const ResourceSchema = new Schema({
  type: {
    type: String,
    enum: ['daily-message', 'breathing-exercise', 'meditation', 'article', 'video'],
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  // For exercises
  duration: {
    type: Number // in seconds
  },
  instructions: [{
    step: Number,
    instruction: String,
    duration: Number
  }],
  // Categorization
  tags: [{
    type: String
  }],
  concernAreas: [{
    type: String,
    enum: ['Anxiety', 'Depression', 'Stress', 'Sleep', 'Relationships', 'General']
  }],
  // Visibility
  isActive: {
    type: Boolean,
    default: true
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  // Engagement Tracking
  viewCount: {
    type: Number,
    default: 0
  },
  favoriteCount: {
    type: Number,
    default: 0
  },
  // Metadata
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
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

const Resource = mongoose.model('Resource', ResourceSchema);

// ==================== PATIENT PROGRESS ====================

/**
 * Progress Schema
 * Track patient progress over time
 */
const ProgressSchema = new Schema({
  patientId: {
    type: Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },
  doctorId: {
    type: Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  // Metrics (weekly/monthly snapshots)
  period: {
    type: String,
    enum: ['week', 'month', 'quarter'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  // Aggregated Data
  averageMood: {
    type: Number
  },
  sessionsCompleted: {
    type: Number,
    default: 0
  },
  checkInsCompleted: {
    type: Number,
    default: 0
  },
  mostCommonConcerns: [{
    concern: String,
    frequency: Number
  }],
  // Overall Assessment
  overallProgress: {
    type: String,
    enum: ['improving', 'stable', 'declining', 'needs-attention']
  },
  doctorNotes: {
    type: String,
    maxlength: 2000
  },
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  }
});

ProgressSchema.index({ patientId: 1, startDate: -1 });

const Progress = mongoose.model('Progress', ProgressSchema);

// ==================== ADMIN LOG ====================

/**
 * AdminLog Schema
 * Audit trail for administrative actions
 */
const AdminLogSchema = new Schema({
  adminId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    enum: ['approve-doctor', 'deactivate-user', 'assign-patient', 'update-permissions', 'other']
  },
  targetModel: {
    type: String,
    required: true,
    enum: ['User', 'Patient', 'Doctor', 'Session', 'Other']
  },
  targetId: {
    type: Schema.Types.ObjectId
  },
  details: {
    type: Schema.Types.Mixed
  },
  ipAddress: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

const AdminLog = mongoose.model('AdminLog', AdminLogSchema);

// ==================== EXPORTS ====================

module.exports = {
  User,
  VerificationCode,
  Patient,
  Doctor,
  CheckIn,
  Session,
  SessionNote,
  Message,
  Resource,
  Progress,
  AdminLog
};