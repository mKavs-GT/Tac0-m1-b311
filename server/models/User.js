const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  firstName: { type: String, required: true },
  avatar: { type: String },
  role: { type: String, required: true },
  isExecutive: { type: Boolean, default: false },
  isManager: { type: Boolean, default: false },
  status: { type: String, enum: ['focus', 'break', 'deepwork', 'offline'], default: 'offline' },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
