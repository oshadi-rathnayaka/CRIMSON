const mongoose = require('mongoose');

const sosAlertSchema = new mongoose.Schema(
  {
    caseId: {
      type: String,
      unique: true,
      default: function () {
        const year = new Date().getFullYear();
        const seq  = Math.floor(10000 + Math.random() * 90000);
        return `SOS-${year}-${seq}`;
      },
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: { type: String, default: '' },
    location: {
      latitude:  { type: Number, default: null },
      longitude: { type: Number, default: null },
      address:   { type: String, default: 'Unknown' },
      district:  { type: String, default: 'Unknown' },
    },
    status: {
      type:    String,
      enum:    ['active', 'assigned', 'cancelled', 'resolved'],
      default: 'active',
    },
    activatedAt:  { type: Date, default: Date.now },
    cancelledAt:  { type: Date, default: null },
    resolvedAt:   { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SosAlert', sosAlertSchema);
