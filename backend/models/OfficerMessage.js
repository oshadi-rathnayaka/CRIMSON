const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    url: { type: String, required: true },
    kind: {
      type: String,
      enum: ['image', 'video', 'file'],
      required: true,
    },
  },
  { _id: false }
);

const officerMessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OfficerConversation',
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      trim: true,
      default: '',
      maxlength: 5000,
    },
    attachment: {
      type: attachmentSchema,
      default: null,
    },
  },
  { timestamps: true }
);

officerMessageSchema.index({ conversationId: 1, createdAt: -1 });

module.exports = mongoose.model('OfficerMessage', officerMessageSchema);
