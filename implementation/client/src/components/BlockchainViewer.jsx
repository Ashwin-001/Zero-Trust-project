import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, ShieldCheck, ShieldAlert, Hexagon, RefreshCw, Cpu, Database, Binary, ExternalLink, Download } from 'lucide-react';

import BiometricVerification from './BiometricVerification';

const BlockchainViewer = () => {
    const [chain, setChain] = useState([]);
    const [valid, setValid] = useState(null);
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [isVerified, setIsVerified] = useState(false); // New state for biometric check
    const [auditStats, setAuditStats] = useState({ totalNodes: 0, lastVerified: 'Never' });

    const fetchChain = async () => {
        setLoading(true);
        try {
            const res = await api.get('/ledger/chain');
            setChain(res.data);
            setAuditStats(prev => ({ ...prev, totalNodes: res.data.length }));
        } catch (e) {
            console.error("Failed to fetch chain");
        } finally {
            setLoading(false);
        }
    };

    const verifyChain = async () => {
        setVerifying(true);
        try {
            const res = await api.get('/ledger/verify');
            setValid(res.data.valid);
            setAuditStats(prev => ({ ...prev, lastVerified: new Date().toLocaleTimeString() }));
        } catch (e) {
            setValid(false);
        } finally {
            setVerifying(false);
        }
    };

    const exportLedger = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(chain, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `zero_trust_audit_log_${new Date().toISOString()}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    useEffect(() => {
        fetchChain();
        const interval = setInterval(fetchChain, 5000);
        return () => clearInterval(interval);
    }, []);

    if (!isVerified) {
        return <BiometricVerification onVerified={() => setIsVerified(true)} />;
    }

    return (
        <div style={{ padding: '30px', height: 'calc(100vh - 40px)', overflowY: 'auto', paddingBottom: '100px' }}>
            {/* Header Control Panel */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel"
                style={{
                    padding: '30px',
                    marginBottom: '40px',
                    borderTop: valid === false ? '4px solid var(--danger)' : '1px solid var(--glass-border)',
                    background: 'rgba(13, 15, 22, 0.95)'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
                            <div style={{ background: 'var(--primary-glow)', padding: '10px', borderRadius: '12px', border: '1px solid rgba(0, 240, 255, 0.2)' }}>
                                <Hexagon size={28} color="var(--primary)" />
                            </div>
                            <h1 className="text-gradient" style={{ margin: 0, fontSize: '2.2rem' }}>Immutable Audit Ledger</h1>
                        </div>
                        <div style={{ display: 'flex', gap: '30px' }}>
                            <StatItem icon={<Binary size={14} />} label="ACTIVE NODES" value={auditStats.totalNodes} />
                            <StatItem icon={<Cpu size={14} />} label="INTEGRITY CHECK" value={auditStats.lastVerified} />
                            <StatItem icon={<Database size={14} />} label="STORAGE" value="HYBRID CLOUD" />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '15px' }}>
                        <button className="btn btn-secondary" onClick={exportLedger} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Download size={16} /> JSON
                        </button>
                        <button className="btn" onClick={fetchChain} disabled={loading} style={{ width: '50px', padding: 0 }}>
                            <RefreshCw size={18} className={loading ? 'spin' : ''} color="var(--primary)" />
                        </button>
                        <button
                            className="btn"
                            style={{
                                background: valid === true ? 'var(--success)' : valid === false ? 'var(--danger)' : 'transparent',
                                color: (valid === true || valid === false) ? '#000' : 'var(--primary)',
                                boxShadow: valid === true ? '0 0 20px var(--success)' : valid === false ? '0 0 20px var(--danger)' : 'none',
                                borderColor: valid === true ? 'var(--success)' : valid === false ? 'var(--danger)' : 'var(--primary)',
                                minWidth: '180px'
                            }}
                            onClick={verifyChain}
                            disabled={verifying}
                        >
                            {verifying ? 'VERIFYING...' : valid === true ? 'INTEGRITY VERIFIED' : valid === false ? 'TAMPER DETECTED' : 'VERIFY GENESIS'}
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Error Banner */}
            <AnimatePresence>
                {valid === false && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            background: 'rgba(255, 0, 60, 0.15)',
                            padding: '20px',
                            borderRadius: '16px',
                            marginBottom: '30px',
                            border: '1px solid var(--danger)',
                            textAlign: 'center',
                            backdropFilter: 'blur(10px)'
                        }}
                    >
                        <ShieldAlert size={32} color="var(--danger)" style={{ marginBottom: '10px' }} />
                        <div style={{ color: 'var(--danger)', fontWeight: 800, fontSize: '1.2rem', letterSpacing: '1px' }}>SECURITY ALERT: CRYPTOGRAPHIC BREAK DETECTED</div>
                        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', marginTop: '5px' }}>The linked sequence of block hashes does not match the computed values. Possible unauthorized database modification.</div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Block Stream */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '35px', paddingBottom: '50px' }}>
                <AnimatePresence>
                    {chain.map((block, index) => (
                        <motion.div
                            key={block.id || index}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1, type: 'spring', damping: 20 }}
                            style={{ position: 'relative', width: '100%', maxWidth: '1000px' }}
                        >
                            {/* Connector Line */}
                            {index !== 0 && (
                                <div style={{
                                    position: 'absolute',
                                    top: '-40px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    height: '40px',
                                    width: '2px',
                                    background: 'linear-gradient(to bottom, var(--primary), transparent)',
                                    opacity: 0.4
                                }}>
                                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'var(--bg-color)', padding: '5px' }}>
                                        <Link2 size={14} color="var(--primary)" />
                                    </div>
                                </div>
                            )}

                            <div className="glass-panel" style={{
                                padding: '30px',
                                background: 'rgba(15, 23, 42, 0.6)',
                                borderTop: `1px solid rgba(255,255,255,0.05)`,
                                borderLeft: `4px solid ${valid === false ? 'var(--danger)' : index === 0 ? 'var(--secondary)' : 'var(--primary)'}`,
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                {/* Block Header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                            background: index === 0 ? 'var(--secondary)' : 'var(--primary)',
                                            color: '#000',
                                            padding: '4px 14px',
                                            borderRadius: '20px',
                                            fontSize: '0.75rem',
                                            fontWeight: 800,
                                            boxShadow: `0 0 15px ${index === 0 ? 'var(--secondary-glow)' : 'var(--primary-glow)'}`
                                        }}>
                                            {index === 0 ? 'GENESIS NODE' : `AUDIT NODE #${block.index}`}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '2px', fontWeight: 600 }}>
                                            AES-256-GCM / SHA-256
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Binary size={14} />
                                        {new Date(block.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'medium' })}
                                    </div>
                                </div>

                                {/* Hash Grid */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', marginBottom: '25px' }}>
                                    <HashBox label="BLOCK SIGNATURE (HASH)" hash={block.hash} color="var(--primary)" />
                                    <HashBox label="PARENT NODE LINK (PREV_HASH)" hash={block.previous_hash} color="rgba(255,255,255,0.4)" />
                                </div>

                                {/* Advanced Crypto Info */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', marginBottom: '25px' }}>
                                    <HashBox label="MERKLE ROOT INTEGRITY" hash={block.merkle_root} color="var(--success)" />
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 800, letterSpacing: '1px' }}>RSA AUTHENTICITY CERTIFICATE</div>
                                        <div style={{
                                            background: 'rgba(0, 255, 157, 0.03)',
                                            border: '1px solid rgba(0, 255, 157, 0.1)',
                                            padding: '12px 15px',
                                            borderRadius: '12px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '6px'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)', fontSize: '0.75rem', fontWeight: 700 }}>
                                                <ShieldCheck size={16} /> SYSTEM RSA-2048 VERIFIED
                                            </div>
                                            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'JetBrains Mono', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                SIG ID: {block.signature}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Payload View */}
                                <div style={{
                                    background: 'rgba(0,0,0,0.4)',
                                    padding: '20px',
                                    borderRadius: '16px',
                                    border: '1px solid rgba(255,255,255,0.03)',
                                    position: 'relative'
                                }}>
                                    <div style={{
                                        position: 'absolute',
                                        top: '15px',
                                        right: '20px',
                                        display: 'flex',
                                        gap: '10px',
                                        opacity: 0.5
                                    }}>
                                        <ExternalLink size={14} />
                                    </div>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 800, marginBottom: '15px', letterSpacing: '1px' }}>DECRYPTED PAYLOAD LOG</div>

                                    {/* AI Insight Highlight */}
                                    {block.data.ai_insight && (
                                        <div style={{
                                            marginBottom: '15px',
                                            padding: '15px',
                                            borderRadius: '8px',
                                            background: 'rgba(0, 240, 255, 0.1)',
                                            borderLeft: '3px solid var(--primary)'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--primary)', fontWeight: 800, fontSize: '0.7rem' }}>
                                                <Cpu size={14} /> AI RAG ANALYSIS
                                            </div>
                                            <div style={{ color: '#fff', fontSize: '0.85rem', lineHeight: '1.5' }}>
                                                {block.data.ai_insight}
                                            </div>
                                        </div>
                                    )}

                                    <pre style={{
                                        margin: 0,
                                        fontSize: '0.85rem',
                                        color: '#e2e8f0',
                                        whiteSpace: 'pre-wrap',
                                        fontFamily: 'JetBrains Mono',
                                        lineHeight: 1.5
                                    }}>
                                        {JSON.stringify(block.data, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <style>{`
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

const StatItem = ({ icon, label, value }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ color: 'var(--primary)', opacity: 0.6 }}>{icon}</div>
        <div>
            <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', fontWeight: 800 }}>{label}</div>
            <div style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>{value}</div>
        </div>
    </div>
);

const HashBox = ({ label, hash, color }) => (
    <div>
        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 800, marginBottom: '8px', letterSpacing: '1px' }}>{label}</div>
        <div style={{
            fontFamily: 'JetBrains Mono',
            fontSize: '0.75rem',
            background: 'rgba(0,0,0,0.3)',
            padding: '12px 15px',
            borderRadius: '12px',
            color: color,
            wordBreak: 'break-all',
            border: '1px solid rgba(255,255,255,0.02)',
            lineHeight: 1.4
        }}>
            {hash}
        </div>
    </div>
);

export default BlockchainViewer;
