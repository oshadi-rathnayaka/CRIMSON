const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Please provide a full name'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters']
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email'
      ]
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false // Don't return password by default
    },
    role: {
      type: String,
      enum: ['citizen', 'admin', 'officer'],
      default: 'citizen'
    },
    phone: {
      type: String,
      default: null
    },
    district: {
      type: String,
      default: null
    },
    // ── Officer-specific fields (null for non-officer roles) ──────────────
    badgeNumber: {
      type: String,
      default: null
    },
    division: {
      type: String,
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    nationalId: {
      type: String,
      default: null
    },
    language: {
      type: String,
      default: 'English'
    },
    profilePhoto: {
      type: String,   // base64 data URL or URL string
      default: null
    },
    privacySettings: {
      anonymousReporting: { type: Boolean, default: true },
      hideIdentity:       { type: Boolean, default: true },
      shareData:          { type: Boolean, default: false },
    },
    settings: {
      preferences: {
        language:   { type: String, default: 'english' },
        theme:      { type: String, default: 'light' },
        dateFormat: { type: String, default: 'DD/MM/YYYY' },
        timeFormat: { type: String, default: '24hour' },
      },
      notifications: {
        caseStatus:         { type: Boolean, default: false },
        supportRequest:     { type: Boolean, default: false },
        emergencyAlerts:    { type: Boolean, default: false },
        emailNotifications: { type: Boolean, default: false },
        smsNotifications:   { type: Boolean, default: false },
      },
      accessibility: {
        textSize:     { type: Number, default: 50 },
        highContrast: { type: Boolean, default: false },
        screenReader: { type: Boolean, default: false },
      },
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    lastLogin: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;

  console.log('[User] Hashing password for:', this.email);
  const salt = await bcryptjs.genSalt(10);
  this.password = await bcryptjs.hash(this.password, salt);
  console.log('[User] Password hashed successfully');
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcryptjs.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
