import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, ShieldCheck, ShieldAlert, Hexagon, RefreshCw } from 'lucide-react';

const BlockchainViewer = () => {
    const [chain, setChain] = useState([]);
    const [valid, setValid] = useState(null); // null, true, false
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(false);

    const fetchChain = async () => {
        setLoading(true);
        try {
            const res = await api.get('/ledger/chain');
            setChain(res.data);
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
        } catch (e) {
            setValid(false);
        } finally {
            setVerifying(false);
        }
    };

    useEffect(() => {
        fetchChain();
        const interval = setInterval(fetchChain, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{ padding: '20px', height: '100%', overflowY: 'auto' }}>
            <div className="glass-panel" style={{ padding: '30px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 className="text-gradient" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <Hexagon size={32} /> Immutable Audit Ledger
                        </h1>
                        <p style={{ color: '#aaa', marginTop: '5px' }}>
                            Blockchain-backed security logs. Every access attempt is cryptographically linked.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <button className="btn" onClick={fetchChain} disabled={loading}>
                            <RefreshCw size={18} className={loading ? 'spin' : ''} /> Refresh
                        </button>
                        <button
                            className={`btn ${valid === true ? 'btn-success' : valid === false ? 'btn-danger' : ''}`}
                            onClick={verifyChain}
                            disabled={verifying}
                            style={{ borderColor: valid === true ? 'var(--success-color)' : valid === false ? 'var(--danger-color)' : '' }}
                        >
                            {verifying ? 'Verifying...' : valid === true ? 'Integrity Verified' : valid === false ? 'CORRUPTION DETECTED' : 'Verify Integrity'}
                            {valid === true ? <ShieldCheck size={18} /> : valid === false ? <ShieldAlert size={18} /> : <ShieldCheck size={18} />}
                        </button>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', paddingBottom: '50px' }}>
                <AnimatePresence>
                    {chain.map((block, index) => (
                        <motion.div
                            key={block._id}
                            initial={{ opacity: 0, y: -50, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 20, delay: index * 0.1 }}
                            style={{ position: 'relative', width: '100%', maxWidth: '800px' }}
                        >
                            {index !== 0 && (
                                <div style={{
                                    position: 'absolute',
                                    top: '-25px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    color: 'var(--primary-color)',
                                    zIndex: 0
                                }}>
                                    <Link2 size={24} />
                                </div>
                            )}

                            <div className="glass-panel" style={{
                                padding: '20px',
                                borderLeft: `5px solid ${block.data.status === 'Granted' ? 'var(--success-color)' : 'var(--danger-color)'}`,
                                position: 'relative',
                                zIndex: 1,
                                background: 'rgba(20, 20, 30, 0.8)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                    <span style={{
                                        background: 'rgba(255,255,255,0.1)',
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.8rem',
                                        fontFamily: 'monospace'
                                    }}>
                                        Block #{block.index}
                                    </span>
                                    <span style={{ fontSize: '0.8rem', color: '#888' }}>
                                        {new Date(block.timestamp).toLocaleString()}
                                    </span>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
                                    <div>
                                        <div style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '5px' }}>Current Hash</div>
                                        <div style={{
                                            fontFamily: 'monospace',
                                            fontSize: '0.7rem',
                                            background: '#000',
                                            padding: '8px',
                                            borderRadius: '4px',
                                            color: 'var(--primary-color)',
                                            wordBreak: 'break-all'
                                        }}>
                                            {block.hash}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '5px' }}>Previous Hash</div>
                                        <div style={{
                                            fontFamily: 'monospace',
                                            fontSize: '0.7rem',
                                            background: '#000',
                                            padding: '8px',
                                            borderRadius: '4px',
                                            color: '#666',
                                            wordBreak: 'break-all'
                                        }}>
                                            {block.previousHash}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginTop: '15px', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '5px', color: '#fff' }}>Payload Data</div>
                                    <pre style={{
                                        margin: 0,
                                        fontSize: '0.75rem',
                                        color: '#bbb',
                                        overflowX: 'auto'
                                    }}>
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

export default BlockchainViewer;
