const mongoose = require('mongoose');

const timeEntrySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  durationSeconds: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('TimeEntry', timeEntrySchema);
