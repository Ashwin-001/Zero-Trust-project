import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Unlock, Zap, ShieldCheck, Database, RefreshCw, Copy } from 'lucide-react';
import api from '../../services/api';

const QuantumVault = () => {
    const [keys, setKeys] = useState(null);
    const [secret, setSecret] = useState('');
    const [encryptedData, setEncryptedData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const generateKeys = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/quantum/keys');
            setKeys(res.data);
            // Auto-save PK for encryption for convenience
            localStorage.setItem('temp_pk_gui', res.data.public_key);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const encryptSecret = async () => {
        if (!keys && !localStorage.getItem('temp_pk_gui')) {
            alert("Generate Keys first!");
            return;
        }
        setIsLoading(true);
        try {
            const pk = keys?.public_key || localStorage.getItem('temp_pk_gui');
            const res = await api.post('/quantum/protect', {
                secret,
                public_key: pk
            });
            setEncryptedData(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <div style={{ marginBottom: '30px' }}>
                <h2 style={{ margin: 0, color: 'white' }}>Quantum Vault</h2>
                <p style={{ color: '#888', margin: '5px 0 0 0' }}>Post-Quantum Cryptography (PQC) & Lattice-Based Encryption Engine</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                {/* Key Generation Panel */}
                <div className="glass-panel" style={{ padding: '30px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                        <div style={{ padding: '12px', background: 'rgba(112, 0, 255, 0.1)', borderRadius: '12px', color: 'var(--secondary)' }}>
                            <Zap size={24} />
                        </div>
                        <h3 style={{ margin: 0, color: '#fff' }}>CRYSTALS-Kyber Keygen</h3>
                    </div>
                    <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '30px' }}>
                        Generate a specialized public/private keypair resistant to quantum computing attacks using Module-Lattice-Based Key Encapsulation Mechanism.
                    </p>

                    <button className="btn btn-secondary" onClick={generateKeys} disabled={isLoading} style={{ width: '100%', marginBottom: '30px' }}>
                        {isLoading ? 'PROCESSING...' : 'GENERATE NEW KEYPAIR'}
                    </button>

                    {keys && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#aaa', marginBottom: '5px' }}>
                                    <span>PUBLIC KEY (LATTICE)</span>
                                    <Copy size={14} style={{ cursor: 'pointer' }} />
                                </div>
                                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '8px', fontFamily: 'monospace', color: 'var(--secondary)', wordBreak: 'break-all', fontSize: '0.8rem', border: '1px solid var(--glass-border)' }}>
                                    {keys.public_key}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: '5px' }}>PRIVATE KEY (HIDDEN)</div>
                                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '8px', fontFamily: 'monospace', color: '#666', border: '1px solid var(--glass-border)' }}>
                                    {keys.private_key.substring(0, 50)}... [REDACTED]
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Encryption Panel */}
                <div className="glass-panel" style={{ padding: '30px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                        <div style={{ padding: '12px', background: 'rgba(0, 240, 255, 0.1)', borderRadius: '12px', color: 'var(--primary)' }}>
                            <Lock size={24} />
                        </div>
                        <h3 style={{ margin: 0, color: '#fff' }}>Secure Enclave</h3>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '10px' }}>SECRET DATA TO PROTECT</label>
                        <textarea
                            value={secret}
                            onChange={(e) => setSecret(e.target.value)}
                            placeholder="Enter sensitive payload..."
                            style={{ width: '100%', height: '100px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: '#fff', padding: '15px', resize: 'none' }}
                        />
                    </div>

                    <button className="btn btn-primary" onClick={encryptSecret} disabled={isLoading || !secret} style={{ width: '100%', marginBottom: '30px' }}>
                        ENCRYPT WITH PUBLIC KEY
                    </button>

                    {encryptedData && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel" style={{ padding: '20px', background: 'rgba(0, 240, 255, 0.05)', border: '1px solid rgba(0, 240, 255, 0.2)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--success)', marginBottom: '15px', fontWeight: 'bold' }}>
                                <ShieldCheck size={18} />
                                ENCRYPTION SUCCESSFUL
                            </div>
                            <div style={{ marginBottom: '10px' }}>
                                <span style={{ fontSize: '0.7rem', color: '#aaa' }}>CIPHERTEXT</span>
                                <div style={{ fontFamily: 'monospace', color: 'var(--primary)', wordBreak: 'break-all', fontSize: '0.85rem' }}>
                                    {encryptedData.cipher}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '20px', fontSize: '0.75rem', color: '#888', marginTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}>
                                <span>ALGO: {encryptedData.metadata.layer}</span>
                                <span>TS: {encryptedData.metadata.timestamp}</span>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuantumVault;
