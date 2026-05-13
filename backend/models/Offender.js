const mongoose = require('mongoose');

const offenderSchema = new mongoose.Schema(
  {
    nic: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Number,
      min: 0,
      max: 120,
      default: null,
    },
    alias: {
      type: String,
      default: '',
      trim: true,
    },
    district: {
      type: String,
      required: true,
      trim: true,
    },
    primaryCrimeType: {
      type: String,
      required: true,
      trim: true,
    },
    riskLevel: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
    legalStatus: {
      type: String,
      enum: ['Open', 'On Bail', 'Convicted', 'Released'],
      default: 'Open',
    },
    convictionCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    pendingCaseCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Offender', offenderSchema);
