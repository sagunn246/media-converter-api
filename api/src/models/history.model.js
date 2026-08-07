/**
 * MongoDB Conversion History Model
 */

const mongoose = require('mongoose');

const HistorySchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true,
      trim: true,
    },
    downloadUrl: {
      type: String,
      required: true,
      trim: true,
    },
    bitrate: {
      type: String,
      required: true,
      default: '320k',
    },
    size: {
      type: String,
      default: '',
    },
    duration: {
      type: String,
      default: '',
    },
    durationSeconds: {
      type: Number,
      default: 0,
    },
    videoTitle: {
      type: String,
      default: '',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast query sorting by creation date
HistorySchema.index({ createdAt: -1 });

module.exports = mongoose.model('History', HistorySchema);
