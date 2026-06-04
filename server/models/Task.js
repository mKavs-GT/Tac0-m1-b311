const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['Todo', 'In Progress', 'In Review', 'Done'], default: 'Todo' },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium' },
  assigneeId: { type: String },
  projectId: { type: String },
  sprintId: { type: String },
  dueDate: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
