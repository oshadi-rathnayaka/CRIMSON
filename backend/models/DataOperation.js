const mongoose = require('mongoose');

const dataOperationSchema = new mongoose.Schema(
  {
    operationType: {
      type: String,
      enum: ['import', 'export'],
      required: true,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    fileSizeBytes: {
      type: Number,
      default: 0,
    },
    records: {
      type: Number,
      default: 0,
    },
    division: {
      type: String,
      default: 'All Divisions',
      trim: true,
    },
    modules: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['success', 'error', 'downloaded'],
      default: 'success',
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DataOperation', dataOperationSchema);
