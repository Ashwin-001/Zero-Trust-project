
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Cpu, Lock, Unlock, Key, RefreshCw, Layers } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

const QuantumVault = () => {
    const [keys, setKeys] = useState(null);
    const [loading, setLoading] = useState(false);
    const [secret, setSecret] = useState('');
    const [protectedSecret, setProtectedSecret] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);

    const fetchKeys = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8000/api/quantum/keys', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setKeys(response.data);
            toast.success("Quantum Keypair Synchronized");
        } catch (error) {
            toast.error("Failed to sync quantum keys");
        } finally {
            setLoading(false);
        }
    };

    const protectSecret = async () => {
        if (!secret) return;
        setAnalyzing(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('http://localhost:8000/api/quantum/protect',
                { secret, public_key: keys?.public_key },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setProtectedSecret(response.data);
            setSecret('');
            toast.info("Lattice-Based Encryption Applied");
        } catch (error) {
            toast.error("Quantum encryption failed");
        } finally {
            setAnalyzing(false);
        }
    };

    useEffect(() => {
        fetchKeys();
    }, []);

    return (
        <div className="analytics-container" style={{ padding: '0', height: '100%', overflowY: 'auto' }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '10px' }}
            >
                {/* Header Card */}
                <div className="glass-panel" style={{ gridColumn: 'span 2', padding: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.05), rgba(112, 0, 255, 0.05))' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '2rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <Cpu className="text-primary" size={32} />
                            Quantum-Resistant Identity Vault
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '10px', fontSize: '0.9rem' }}>
                            Identity protection utilizing Module-Lattice based Key Encapsulation Mechanisms (ML-KEM).
                        </p>
                    </div>
                    <button className="btn btn-primary" onClick={fetchKeys} disabled={loading}>
                        <RefreshCw size={18} className={loading ? 'spin' : ''} style={{ marginRight: '8px' }} />
                        REGENERATE KEYS
                    </button>
                </div>

                {/* Keypair Card */}
                <div className="glass-panel" style={{ padding: '25px' }}>
                    <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Key size={20} className="text-secondary" />
                        Active Post-Quantum Keypair
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={{ fontSize: '0.7rem', color: 'var(--primary)', letterSpacing: '1px', textTransform: 'uppercase' }}>Public Key (Identity)</label>
                            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', fontSize: '0.8rem', fontFamily: 'monospace', wordBreak: 'break-all', color: '#888', border: '1px solid rgba(0, 240, 255, 0.1)' }}>
                                {keys?.public_key || 'GENERATING...'}
                            </div>
                        </div>
                        <div>
                            <label style={{ fontSize: '0.7rem', color: 'var(--secondary)', letterSpacing: '1px', textTransform: 'uppercase' }}>Private Key (Encrypted)</label>
                            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', fontSize: '0.8rem', fontFamily: 'monospace', wordBreak: 'break-all', color: '#888', border: '1px solid rgba(112, 0, 255, 0.1)', filter: 'blur(3px)', userSelect: 'none' }}>
                                {keys?.private_key || 'GENERATING...'}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <div className="metric-badge" style={{ background: 'rgba(0, 255, 136, 0.1)', color: 'var(--success)' }}>
                                {keys?.algorithm}
                            </div>
                            <div className="metric-badge" style={{ background: 'rgba(0, 240, 255, 0.1)', color: 'var(--primary)' }}>
                                {keys?.security_bits} Bits
                            </div>
                        </div>
                    </div>
                </div>

                {/* Secret Protection Card */}
                <div className="glass-panel" style={{ padding: '25px' }}>
                    <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <ShieldAlert size={20} className="text-primary" />
                        Lattice-Based Secret Obfuscation
                    </h3>

                    <div style={{ marginBottom: '20px' }}>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Enter data to protect..."
                            value={secret}
                            onChange={(e) => setSecret(e.target.value)}
                            style={{ width: '100%', marginBottom: '15px' }}
                        />
                        <button className="btn btn-secondary" style={{ width: '100%' }} onClick={protectSecret} disabled={analyzing}>
                            {analyzing ? 'APPLYING LATTICE NOISE...' : 'ENCRYPT SECRET'}
                        </button>
                    </div>

                    <AnimatePresence>
                        {protectedSecret && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--primary)' }}>CYPHERTEXT</span>
                                    <span style={{ fontSize: '0.7rem', color: '#888' }}>QC-SHIELD-V2.1</span>
                                </div>
                                <div style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--secondary)', overflowX: 'auto' }}>
                                    {protectedSecret.cipher}
                                </div>
                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '10px', paddingTop: '10px', fontSize: '0.65rem', color: '#555' }}>
                                    Layer: {protectedSecret.metadata.layer} | Resiliance: HIGH
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Quantum Visualization */}
                <div className="glass-panel" style={{ gridColumn: 'span 2', padding: '25px', height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', overflow: 'hidden', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.1, pointerEvents: 'none' }}>
                        <div className="scanline"></div>
                    </div>

                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        style={{ width: '150px', height: '150px', border: '2px solid var(--primary)', borderRadius: '50%', position: 'absolute', opacity: 0.2 }}
                    />
                    <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                        style={{ width: '120px', height: '120px', border: '2px dashed var(--secondary)', borderRadius: '50%', position: 'absolute', opacity: 0.3 }}
                    />

                    <Layers size={48} className="text-primary" style={{ zIndex: 1 }} />
                    <h3 style={{ marginTop: '20px', zIndex: 1, color: '#fff', letterSpacing: '2px' }}>LATTICE CORE STABLE</h3>
                    <div style={{ display: 'flex', gap: '5px', marginTop: '10px', zIndex: 1 }}>
                        {[...Array(20)].map((_, i) => (
                            <motion.div
                                key={i}
                                animate={{ height: [5, 15, 5] }}
                                transition={{ duration: 1 + Math.random(), repeat: Infinity }}
                                style={{ width: '3px', background: 'var(--primary)', borderRadius: '2px', opacity: 0.5 }}
                            />
                        ))}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default QuantumVault;
