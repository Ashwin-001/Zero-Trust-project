const express = require('express');
const zeroTrustAuth = require('../middleware/zeroTrust');
const Log = require('../models/Log');

const router = express.Router();

// Apply Zero Trust Middleware to all routes here
router.use(zeroTrustAuth);

router.get('/public-resource', (req, res) => {
    res.json({ message: 'Access Granted to Public Resource', riskLevel: req.riskLevel });
});

router.get('/confidential-resource', (req, res) => {
    // Additional attribute check example
    if (req.user.role === 'guest') {
        return res.status(403).json({ error: 'Access Denied: Insufficient Role for Confidential Data' });
    }
    res.json({ message: 'Access Granted to Confidential Resource', riskLevel: req.riskLevel, data: 'TOP SECRET DATA: 42' });
});

router.get('/admin-panel', (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access Denied: Admistrators Only' });
    }
    res.json({ message: 'Welcome to Admin Panel', riskLevel: req.riskLevel });
});

// Endpoint to fetch logs for the dashboard (Self-monitoring)
router.get('/logs', async (req, res) => {
    try {
        const logs = await Log.find().sort({ timestamp: -1 }).limit(50);
        res.json(logs);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});

module.exports = router;
