const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  client: { type: String },
  status: { type: String, enum: ['Active', 'Planning', 'Completed', 'On Hold'], default: 'Active' },
  progress: { type: Number, default: 0 },
  dueDate: { type: Date },
  members: [{ type: String }],
  milestones: [{
    id: String,
    title: String,
    completed: Boolean,
    date: Date
  }]
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
