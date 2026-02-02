import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link2, GitCommit, Clock, CheckCircle, Search } from 'lucide-react';
import api from '../../services/api';

const AuditChain = () => {
    const [chain, setChain] = useState([]);
    const [isValid, setIsValid] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchChain();
    }, []);

    const fetchChain = async () => {
        setIsLoading(true);
        try {
            const [chainRes, verifyRes] = await Promise.all([
                api.get('/ledger/chain'),
                api.get('/ledger/verify')
            ]);
            setChain(chainRes.data);
            setIsValid(verifyRes.data.is_valid);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h2 style={{ margin: 0 }}>Audit Chain</h2>
                    <p style={{ color: '#888', margin: '5px 0 0 0' }}>Immutable Distributed Ledger & Forensic Logs</p>
                </div>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div className={`status-badge ${isValid ? 'secure' : 'danger'}`}>
                        {isValid ? 'CONSENSUS: VALID' : 'CONSENSUS: BROKEN'}
                    </div>
                    <button className="btn" onClick={fetchChain}>SCAN NETWORK</button>
                </div>
            </div>

            <div style={{ position: 'relative', paddingLeft: '40px' }}>
                {/* Timeline Line */}
                <div style={{ position: 'absolute', left: '19px', top: '0', bottom: '0', width: '2px', background: 'linear-gradient(to bottom, var(--primary), transparent)' }} />

                {chain.map((block, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass-panel"
                        style={{ marginBottom: '20px', position: 'relative' }}
                    >
                        {/* Dot */}
                        <div style={{
                            position: 'absolute', left: '-46px', top: '30px',
                            width: '14px', height: '14px', borderRadius: '50%',
                            background: block.hash.startsWith('00') ? 'var(--primary)' : 'var(--warning)',
                            boxShadow: `0 0 10px ${block.hash.startsWith('00') ? 'var(--primary)' : 'var(--warning)'}`,
                            border: '2px solid #000'
                        }} />

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '15px' }}>
                            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary)' }}>Block #{block.index}</div>
                                <span style={{ fontSize: '0.8rem', color: '#666' }}>{new Date(block.timestamp).toLocaleString()}</span>
                            </div>
                            <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#666' }}>
                                HASH: {block.hash.substring(0, 30)}...
                            </div>
                        </div>

                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '8px', fontSize: '0.9rem', color: '#ccc', marginBottom: '15px' }}>
                            {typeof block.data === 'string' ? block.data :
                                (block.data.user ? (
                                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                        <span style={{ color: 'var(--secondary)', fontWeight: 'bold' }}>{block.data.user}</span>
                                        <span style={{ color: '#fff' }}>{block.data.action}</span>
                                        <span style={{
                                            padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem',
                                            background: block.data.status === 'Granted' ? 'rgba(0,255,0,0.1)' : 'rgba(255,0,0,0.1)',
                                            color: block.data.status === 'Granted' ? 'var(--success)' : 'var(--danger)'
                                        }}>
                                            {block.data.status}
                                        </span>
                                    </div>
                                ) : JSON.stringify(block.data))
                            }
                        </div>

                        <div style={{ display: 'flex', gap: '30px', fontSize: '0.75rem', color: '#666' }}>
                            <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                                <GitCommit size={14} /> Prev: {block.previous_hash.substring(0, 10)}...
                            </div>
                            <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                                <Search size={14} /> Nonce: {block.nonce}
                            </div>
                            <div style={{ color: 'var(--primary)' }}>SOURCE: {block.source}</div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default AuditChain;
