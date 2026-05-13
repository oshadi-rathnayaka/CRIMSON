const mongoose = require('mongoose');

const officerConversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

officerConversationSchema.index({ participants: 1 });
officerConversationSchema.index({ lastMessageAt: -1 });

module.exports = mongoose.model('OfficerConversation', officerConversationSchema);
