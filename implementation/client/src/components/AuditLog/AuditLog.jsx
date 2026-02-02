import './AuditLog.css';
import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, ShieldAlert, ShieldCheck, Zap } from 'lucide-react';

const AuditLog = ({ refreshTrigger }) => {
    const [logs, setLogs] = useState([]);
    const [analyzingId, setAnalyzingId] = useState(null);
    const [aiInsights, setAiInsights] = useState({});

    const fetchLogs = async () => {
        try {
            const res = await api.get('/secure/logs');
            setLogs(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    const analyzeLog = async (logId) => {
        setAnalyzingId(logId);
        try {
            const res = await api.post('/ai/insight', { log_id: logId });
            setAiInsights(prev => ({ ...prev, [logId]: res.data.insight }));
        } catch (e) {
            console.error(e);
        } finally {
            setAnalyzingId(null);
        }
    };

    useEffect(() => {
        fetchLogs();
        const interval = setInterval(fetchLogs, 5000);
        return () => clearInterval(interval);
    }, [refreshTrigger]);

    return (
        <div className="glass-panel" style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: '25px',
            background: 'var(--panel-bg)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <Terminal size={20} color="var(--primary)" />
                <h3 className="text-gradient" style={{ margin: 0, fontSize: '1.1rem' }}>Audit Stream</h3>
                <div className="shimmer" style={{ flex: 1, height: '1px' }} />
            </div>

            <div style={{
                flex: 1,
                overflowY: 'auto',
                paddingRight: '10px'
            }}>
                <AnimatePresence initial={false}>
                    {logs.map((log) => (
                        <motion.div
                            key={log.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.3 }}
                            style={{
                                padding: '15px',
                                borderRadius: '12px',
                                background: 'rgba(15, 23, 42, 0.4)',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                marginBottom: '12px',
                                borderLeft: `4px solid ${log.status === 'Denied' ? 'var(--danger)' : 'var(--success)'}`
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.7rem' }}>
                                <span style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'JetBrains Mono' }}>
                                    {new Date(log.timestamp).toLocaleTimeString()}
                                </span>

                                <span style={{
                                    color: log.risk_level === 'Critical' ? 'var(--danger)' : 'var(--primary)',
                                    fontWeight: 800,
                                    textTransform: 'uppercase',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    {log.risk_score !== undefined && (
                                        <div style={{
                                            background: log.risk_score > 50 ? 'rgba(255, 0, 60, 0.2)' : 'rgba(0, 240, 255, 0.2)',
                                            padding: '2px 8px',
                                            borderRadius: '6px',
                                            fontSize: '0.65rem'
                                        }}>
                                            SCORE: {log.risk_score}
                                        </div>
                                    )}
                                    {log.risk_level}
                                </span>
                            </div>

                            <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600, marginBottom: '4px' }}>
                                {log.action}
                            </div>

                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '10px' }}>
                                {log.status === 'Denied' ? <ShieldAlert size={12} color="var(--danger)" /> : <ShieldCheck size={12} color="var(--success)" />}
                                {log.user} • {log.status}
                            </div>

                            <button
                                className="btn"
                                onClick={() => analyzeLog(log.id)}
                                disabled={analyzingId === log.id}
                                style={{
                                    padding: '6px 12px',
                                    fontSize: '0.65rem',
                                    background: 'rgba(0, 240, 255, 0.03)',
                                    border: '1px solid rgba(0, 240, 255, 0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px'
                                }}
                            >
                                <Zap size={10} color="var(--primary)" />
                                {analyzingId === log.id ? 'ANALYZING...' : 'DEEP INSIGHT'}
                            </button>

                            <AnimatePresence>
                                {aiInsights[log.id] && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        style={{
                                            marginTop: '12px',
                                            padding: '12px',
                                            background: 'rgba(0, 240, 255, 0.05)',
                                            borderRadius: '8px',
                                            fontSize: '0.8rem',
                                            color: '#e2e8f0',
                                            border: '1px solid rgba(0, 240, 255, 0.1)',
                                            lineHeight: '1.4'
                                        }}
                                    >
                                        <div style={{ fontSize: '0.6rem', color: 'var(--primary)', fontWeight: 800, marginBottom: '4px', textTransform: 'uppercase' }}>Gemini Core Analysis</div>
                                        {aiInsights[log.id]}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <div style={{ paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>
                CONTINUOUS FEED ACTIVE • {logs.length} NODES STORED
            </div>
        </div>
    );
};

export default AuditLog;
