const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    caseId: {
      type: String,
      unique: true,
      default: function () {
        const year = new Date().getFullYear();
        const seq  = Math.floor(10000 + Math.random() * 90000);
        return `CRM-${year}-${seq}-SL`;
      },
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category:    { type: String, required: true },
    description: { type: String, required: true },
    location: {
      address:   { type: String, default: 'Unknown' },
      latitude:  { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
    files: [
      {
        name: String,
        size: Number,
        type: String,
      },
    ],
    status: {
      type: String,
      enum: ['submitted', 'under_review', 'assigned', 'resolved', 'closed'],
      default: 'submitted',
    },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Report', reportSchema);
