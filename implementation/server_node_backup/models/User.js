const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  riskScore: { type: Number, default: 0 }, // Base risk score
});

module.exports = mongoose.model('User', userSchema);
