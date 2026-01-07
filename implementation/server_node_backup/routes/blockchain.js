const express = require('express');
const Block = require('../models/Block');
const blockchainService = require('../utils/blockchainService');
const zeroTrustAuth = require('../middleware/zeroTrust');

const router = express.Router();

// Protected by Zero Trust
router.use(zeroTrustAuth);

router.get('/chain', async (req, res) => {
    try {
        const chain = await Block.find().sort({ index: -1 }).limit(20); // Get last 20 blocks
        res.json(chain);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch blockchain' });
    }
});

router.get('/verify', async (req, res) => {
    try {
        const result = await blockchainService.isChainValid();
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: 'Validation failed' });
    }
});

module.exports = router;
