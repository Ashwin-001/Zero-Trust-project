import React, { useEffect, useState } from 'react';
import api from '../services/api';

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
        const interval = setInterval(fetchLogs, 2000); // Polling
        return () => clearInterval(interval);
    }, [refreshTrigger]);

    return (
        <div className="glass-panel" style={{ padding: '20px', height: '100%', overflowY: 'auto' }}>
            <h3 className="text-gradient">Live Security Logs</h3>
            <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {logs.map((log) => (
                    <div key={log.id} style={{
                        padding: '10px',
                        borderRadius: '8px',
                        background: log.status === 'Denied' ? 'rgba(255, 0, 60, 0.1)' : 'rgba(0, 255, 157, 0.1)',
                        borderLeft: `3px solid ${log.status === 'Denied' ? 'var(--danger-color)' : 'var(--success-color)'}`
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#ccc' }}>
                            <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                            <span style={{ fontWeight: 'bold', color: log.riskLevel === 'Critical' ? 'var(--danger-color)' : 'var(--primary-color)' }}>
                                Risk: {log.riskLevel}
                            </span>
                        </div>
                        <div style={{ fontWeight: 'bold' }}>{log.action}</div>
                        <div style={{ fontSize: '0.9rem' }}>User: {log.user}</div>
                        <div style={{ fontSize: '0.9rem' }}>Result: {log.status}</div>
                        {log.details && <div style={{ fontSize: '0.8rem', fontStyle: 'italic', marginTop: '5px', color: '#888' }}>{log.details}</div>}

                        <div style={{ marginTop: '8px' }}>
                            <button
                                className="btn"
                                style={{ fontSize: '0.7rem', padding: '4px 8px' }}
                                onClick={() => analyzeLog(log.id)}
                                disabled={analyzingId === log.id}
                            >
                                {analyzingId === log.id ? 'AI Analyzing...' : 'AI Analyze'}
                            </button>
                            {aiInsights[log.id] && (
                                <div style={{
                                    marginTop: '8px',
                                    padding: '8px',
                                    background: 'rgba(255,255,255,0.05)',
                                    borderRadius: '5px',
                                    fontSize: '0.75rem',
                                    borderLeft: '2px solid var(--primary-color)'
                                }}>
                                    <strong>Gemini Insight:</strong> {aiInsights[log.id]}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AuditLog;
