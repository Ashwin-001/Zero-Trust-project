import React, { useEffect, useState } from 'react';
import api from '../services/api';

const AuditLog = ({ refreshTrigger }) => {
    const [logs, setLogs] = useState([]);

    const fetchLogs = async () => {
        try {
            const res = await api.get('/secure/logs');
            setLogs(res.data);
        } catch (e) {
            console.error(e);
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
                    <div key={log._id} style={{
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
                        {log.details && <div style={{ fontSize: '0.8rem', fontStyle: 'italic', marginTop: '5px' }}>{log.details}</div>}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AuditLog;
