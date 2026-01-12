import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, ShieldCheck, ShieldAlert, Hexagon, RefreshCw } from 'lucide-react';

const BlockchainViewer = () => {
    const [chain, setChain] = useState([]);
    const [valid, setValid] = useState(null);
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(false);
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

    return (
        <div style={{ padding: '20px', height: '100%', overflowY: 'auto', paddingBottom: '100px' }}>
            <div className="glass-panel" style={{ padding: '30px', marginBottom: '20px', borderTop: valid === false ? '4px solid var(--danger-color)' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 className="text-gradient" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <Hexagon size={32} /> Immutable Audit Ledger
                        </h1>
                        <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                            <div style={{ fontSize: '0.8rem', color: '#888' }}>
                                <span style={{ color: 'var(--primary-color)' }}>Nodes:</span> {auditStats.totalNodes}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#888' }}>
                                <span style={{ color: 'var(--primary-color)' }}>Last Verified:</span> {auditStats.lastVerified}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#888' }}>
                                <span style={{ color: 'var(--primary-color)' }}>Storage:</span> Multi-Node (SQLite + MongoDB)
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn" onClick={exportLedger} style={{ borderColor: '#666', color: '#aaa' }}>
                            Export JSON
                        </button>
                        <button className="btn" onClick={fetchChain} disabled={loading}>
                            <RefreshCw size={18} className={loading ? 'spin' : ''} />
                        </button>
                        <button
                            className={`btn ${valid === true ? 'btn-success' : valid === false ? 'btn-danger' : ''}`}
                            onClick={verifyChain}
                            disabled={verifying}
                        >
                            {verifying ? 'Verifying...' : valid === true ? 'Integrity Verified' : valid === false ? 'CORRUPTION DETECTED' : 'Verify Chain'}
                        </button>
                    </div>
                </div>
            </div>

            {valid === false && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ background: 'rgba(255, 0, 60, 0.2)', padding: '15px', borderRadius: '12px', marginBottom: '20px', border: '1px solid var(--danger-color)', textAlign: 'center' }}>
                    <ShieldAlert color="var(--danger-color)" style={{ marginBottom: '5px' }} />
                    <div style={{ color: 'var(--danger-color)', fontWeight: 'bold' }}>SECURITY ALERT: Ledger Inconsistency Detected</div>
                    <div style={{ fontSize: '0.8rem' }}>The cryptographic chain has been broken. Investigating potential database tampering.</div>
                </motion.div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '25px' }}>
                <AnimatePresence>
                    {chain.map((block, index) => (
                        <motion.div
                            key={block.id || index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            style={{ position: 'relative', width: '100%', maxWidth: '900px' }}
                        >
                            {index !== 0 && (
                                <div style={{ position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)', color: 'var(--primary-color)', opacity: 0.3 }}>
                                    <Link2 size={24} />
                                </div>
                            )}

                            <div className="glass-panel" style={{
                                padding: '25px',
                                background: 'rgba(13, 14, 18, 0.9)',
                                borderLeft: `4px solid ${valid === false ? 'var(--danger-color)' : 'var(--primary-color)'}`,
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ background: 'var(--primary-color)', color: '#000', padding: '2px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                            NODE #{block.index}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: '#555', fontFamily: 'monospace' }}>
                                            AES-256-CBC ENCRYPTED
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#666' }}>
                                        {new Date(block.timestamp).toLocaleString()}
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                    <HashBox label="BLOCK HASH" hash={block.hash} color="var(--primary-color)" />
                                    <HashBox label="PREVIOUS NODE HASH" hash={block.previous_hash} color="#444" />
                                </div>

                                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Decrypted Payload</div>
                                    <pre style={{ margin: 0, fontSize: '0.8rem', color: '#fff', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                                        {JSON.stringify(block.data, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

const HashBox = ({ label, hash, color }) => (
    <div>
        <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '5px' }}>{label}</div>
        <div style={{
            fontFamily: 'monospace',
            fontSize: '0.7rem',
            background: 'rgba(0,0,0,0.5)',
            padding: '10px',
            borderRadius: '6px',
            color: color,
            wordBreak: 'break-all',
            border: '1px solid rgba(255,255,255,0.03)'
        }}>
            {hash}
        </div>
    </div>
);


export default BlockchainViewer;
