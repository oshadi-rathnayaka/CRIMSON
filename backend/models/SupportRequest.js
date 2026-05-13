const mongoose = require('mongoose');

const supportRequestSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      unique: true,
      default: function () {
        const year = new Date().getFullYear();
        const seq  = Math.floor(10000 + Math.random() * 90000);
        return `TKT-${year}-${seq}`;
      },
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    victimName: {
      type: String,
      trim: true,
      default: '',
    },
    serviceType: {
      type: String,
      required: true,
      enum: ['medical', 'legal', 'counseling', 'welfare'],
    },
    serviceLabel: {
      type: String,
      required: true,
    },
    victimAge: {
      type: Number,
      min: 0,
      max: 120,
      required: true,
    },
    victimGender: {
      type: String,
      enum: ['Male', 'Female', 'Other', 'Prefer not to say'],
      required: true,
    },
    crimeType: {
      type: String,
      required: true,
      trim: true,
    },
    district: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      enum: ['normal', 'urgent'],
      default: 'normal',
    },
    status: {
      type: String,
      enum: ['submitted', 'under_review', 'assigned', 'completed', 'closed'],
      default: 'submitted',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SupportRequest', supportRequestSchema);
