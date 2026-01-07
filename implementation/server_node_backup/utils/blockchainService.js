const crypto = require('crypto');
const Block = require('../models/Block');

class BlockchainService {

    constructor() {
        this.initializeChain();
    }

    async initializeChain() {
        const count = await Block.countDocuments();
        if (count === 0) {
            await this.createGenesisBlock();
        }
    }

    calculateHash(index, previousHash, timestamp, data, nonce) {
        return crypto
            .createHash('sha256')
            .update(index + previousHash + timestamp + JSON.stringify(data) + nonce)
            .digest('hex');
    }

    async createGenesisBlock() {
        console.log("Creating Genesis Block...");
        const genesisBlock = new Block({
            index: 0,
            timestamp: Date.now(),
            data: { message: "Genesis Block - Zero Trust Ledger Started" },
            previousHash: "0",
            nonce: 0,
            hash: this.calculateHash(0, "0", Date.now(), { message: "Genesis Block - Zero Trust Ledger Started" }, 0)
        });
        await genesisBlock.save();
    }

    async getLatestBlock() {
        return await Block.findOne().sort({ index: -1 });
    }

    async addBlock(data) {
        const previousBlock = await this.getLatestBlock();
        const index = previousBlock.index + 1;
        const timestamp = Date.now();
        const previousHash = previousBlock.hash;

        let nonce = 0;
        let hash = this.calculateHash(index, previousHash, timestamp, data, nonce);

        // Simple Proof of Work (Start with 00)
        while (!hash.startsWith("00")) {
            nonce++;
            hash = this.calculateHash(index, previousHash, timestamp, data, nonce);
        }

        const newBlock = new Block({
            index,
            timestamp,
            data,
            previousHash,
            hash,
            nonce
        });

        await newBlock.save();
        return newBlock;
    }

    async isChainValid() {
        const chain = await Block.find().sort({ index: 1 });

        for (let i = 1; i < chain.length; i++) {
            const currentBlock = chain[i];
            const previousBlock = chain[i - 1];

            // 1. Check if hash matches content
            const recapturedHash = this.calculateHash(
                currentBlock.index,
                currentBlock.previousHash,
                currentBlock.timestamp,
                currentBlock.data,
                currentBlock.nonce
            );

            if (currentBlock.hash !== recapturedHash) {
                return { valid: false, error: `Block ${currentBlock.index} hash invalid` };
            }

            // 2. Check if previousHash matches
            if (currentBlock.previousHash !== previousBlock.hash) {
                return { valid: false, error: `Block ${currentBlock.index} broken link to previous` };
            }
        }
        return { valid: true };
    }
}

module.exports = new BlockchainService();
