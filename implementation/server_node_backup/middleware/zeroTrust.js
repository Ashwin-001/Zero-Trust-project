const jwt = require('jsonwebtoken');
const Log = require('../models/Log');

// Simulated Device Health Validation
const checkDeviceHealth = (deviceInfo) => {
    const issues = [];
    if (!deviceInfo.antivirus) issues.push('Antivirus Disabled');
    if (deviceInfo.os === 'Outdated') issues.push('OS Outdated');
    if (deviceInfo.ipReputation === 'Bad') issues.push('Suspicious IP');

    return {
        isHealthy: issues.length === 0,
        issues
    };
};

// Zero Trust Middleware
const zeroTrustAuth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        const deviceInfo = JSON.parse(req.header('x-device-info') || '{}');
        const requestType = req.method + ' ' + req.originalUrl;

        // Prevent infinite logging loop (Self-Monitoring)
        if (req.originalUrl.includes('/api/secure/logs')) {
            // Still basic Verify Identity
            if (!token) return res.status(401).json({ error: 'Access Denied' });
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                req.user = decoded;
                return next(); // Skip logging and complex checks for this specific read-only endpoint
            } catch (e) {
                return res.status(401).json({ error: 'Access Denied' });
            }
        }

        // 1. Identity Verification
        if (!token) {
            await logAccess('Unknown', requestType, 'Denied', 'Critical', deviceInfo, 'Missing Token');
            return res.status(401).json({ error: 'Access Denied: No Token Provided' });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (e) {
            await logAccess('Unknown', requestType, 'Denied', 'High', deviceInfo, 'Invalid Token');
            return res.status(401).json({ error: 'Access Denied: Invalid Token' });
        }

        // 2. Device Health Check (Continuous Verification)
        const health = checkDeviceHealth(deviceInfo);
        if (!health.isHealthy) {
            await logAccess(decoded.username, requestType, 'Denied', 'High', deviceInfo, `Device Health Failed: ${health.issues.join(', ')}`);
            return res.status(403).json({ error: 'Access Denied: Device Health Check Failed', issues: health.issues });
        }

        // 3. Risk Scoring (Dynamic)
        let riskScore = 0;
        let riskLevel = 'Low';

        // Simple rules
        if (deviceInfo.location === 'Unknown') riskScore += 30;
        if (new Date().getHours() < 6) riskScore += 20; // Suspicious time
        if (req.originalUrl.includes('admin') && decoded.role !== 'admin') riskScore += 50;

        // Determine Level
        if (riskScore > 70) riskLevel = 'Critical';
        else if (riskScore > 40) riskLevel = 'High';
        else if (riskScore > 20) riskLevel = 'Medium';

        // Enforcement
        if (riskScore > 60) {
            await logAccess(decoded.username, requestType, 'Denied', riskLevel, deviceInfo, `Risk Score too high: ${riskScore}`);
            return res.status(403).json({ error: 'Access Denied: Risk Threshold Exceeded' });
        }

        // Attach user to request
        req.user = decoded;
        req.riskLevel = riskLevel;

        // Log Successful verification
        await logAccess(decoded.username, requestType, 'Granted', riskLevel, deviceInfo, 'All checks passed');
        next();

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const blockchainService = require('../utils/blockchainService');

async function logAccess(user, action, status, riskLevel, deviceHealth, details) {
    try {
        const log = new Log({ user, action, status, riskLevel, deviceHealth, details });
        await log.save();

        // Add to Blockchain
        await blockchainService.addBlock({
            logId: log._id,
            user,
            action,
            status,
            riskLevel,
            details
        });

    } catch (err) {
        console.error('Logging failed:', err);
    }
}

module.exports = zeroTrustAuth;
