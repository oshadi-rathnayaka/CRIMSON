const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema(
  {
    messageId: {
      type: String,
      unique: true,
      default: function () {
        const year = new Date().getFullYear();
        const seq = Math.floor(10000 + Math.random() * 90000);
        return `CNT-${year}-${seq}`;
      },
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    district: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['new', 'in_progress', 'resolved'],
      default: 'new',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ContactMessage', contactMessageSchema);