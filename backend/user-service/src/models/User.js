const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['rider', 'driver'], default: 'rider' },
  // Driver specific fields
  vehicleType: { type: String },
  licenseNumber: { type: String },
  isAvailable: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
