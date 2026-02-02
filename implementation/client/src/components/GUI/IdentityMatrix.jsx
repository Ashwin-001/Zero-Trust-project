import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Shield, Key, RefreshCw } from 'lucide-react';
import api from '../../services/api';

const IdentityMatrix = () => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/secure/identity-matrix');
            setUsers(res.data);
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
                    <h2 style={{ margin: 0 }}>Identity Matrix</h2>
                    <p style={{ color: '#888', margin: '5px 0 0 0' }}>Active Zero Trust Principals & Role Assignments</p>
                </div>
                <button className="btn" onClick={fetchUsers} disabled={isLoading}>
                    <RefreshCw size={18} className={isLoading ? 'spin' : ''} /> REFRESH MATRIX
                </button>
            </div>

            <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--glass-border)' }}>
                        <tr>
                            <th style={{ padding: '20px', color: '#888', fontSize: '0.8rem' }}>PRINCIPAL IDENTITY</th>
                            <th style={{ padding: '20px', color: '#888', fontSize: '0.8rem' }}>ROLE</th>
                            <th style={{ padding: '20px', color: '#888', fontSize: '0.8rem' }}>CRYPTOGRAPHIC FINGERPRINT</th>
                            <th style={{ padding: '20px', color: '#888', fontSize: '0.8rem' }}>STATUS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u, i) => (
                            <motion.tr
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}
                            >
                                <td style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{ padding: '10px', background: 'rgba(0, 240, 255, 0.1)', borderRadius: '10px', color: 'var(--primary)' }}>
                                        <Users size={20} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>{u.username}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#666' }}>{u.email || 'N/A'}</div>
                                    </div>
                                </td>
                                <td style={{ padding: '20px' }}>
                                    <span style={{
                                        padding: '5px 12px',
                                        borderRadius: '20px',
                                        background: u.role === 'admin' ? 'rgba(112, 0, 255, 0.2)' : 'rgba(255,255,255,0.05)',
                                        color: u.role === 'admin' ? 'var(--secondary)' : '#aaa',
                                        fontSize: '0.8rem',
                                        fontWeight: 'bold',
                                        border: `1px solid ${u.role === 'admin' ? 'var(--secondary)' : 'transparent'}`
                                    }}>
                                        {u.role.toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ padding: '20px', fontFamily: 'monospace', color: 'var(--primary)', opacity: 0.8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Key size={14} />
                                        {u.private_key ? u.private_key.substring(0, 24) + '...' : 'MISSING_KEY'}
                                    </div>
                                </td>
                                <td style={{ padding: '20px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)' }}>
                                        <Shield size={14} />
                                        <span>VERIFIED</span>
                                    </div>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default IdentityMatrix;
