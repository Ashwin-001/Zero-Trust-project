const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    user: { type: String, required: true },
    action: { type: String, required: true },
    status: { type: String, enum: ['Granted', 'Denied'], required: true },
    riskLevel: { type: String, required: true },
    deviceHealth: { type: Object }, // Snapshot of device health
    timestamp: { type: Date, default: Date.now },
    details: { type: String }
});

module.exports = mongoose.model('Log', logSchema);
