import React, { useState } from 'react';
import { User, MoreVertical, ShieldCheck, Mail, Lock, Trash2, Smartphone, AlertTriangle, Fingerprint, ShieldAlert, Key, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DeviceFleet from './DeviceFleet';
import BiometricVerification from './BiometricVerification';

const UsersPage = () => {
    const [isVerified, setIsVerified] = useState(false);
    const [users, setUsers] = useState([
        { id: 1, name: 'Alice Admin', email: 'admin@corp.com', role: 'CORE_ADMIN', status: 'Active', mfa: true, lastLogin: '2 mins ago', level: 5 },
        { id: 2, name: 'Bob Builder', email: 'bob@corp.com', role: 'DEV_OPS', status: 'Active', mfa: true, lastLogin: '1 hour ago', level: 3 },
        { id: 3, name: 'Charlie Guest', email: 'charlie@external.com', role: 'EXTERNAL', status: 'Suspended', mfa: false, lastLogin: '4 days ago', level: 1 },
        { id: 4, name: 'Dave Ops', email: 'dave@corp.com', role: 'NETWORK_ENG', status: 'Active', mfa: true, lastLogin: '5 mins ago', level: 4 },
        { id: 5, name: 'Eve Hacker', email: 'eve@unknown.net', role: 'UNAUTHORIZED', status: 'Flagged', mfa: false, lastLogin: 'Just now', level: 0 },
    ]);

    const statusMap = {
        'Active': { color: 'var(--success)', label: 'OPTIMAL' },
        'Suspended': { color: 'var(--text-secondary)', label: 'INACTIVE' },
        'Flagged': { color: 'var(--danger)', label: 'BREACH_RISK' },
    };

    if (!isVerified) {
        return <BiometricVerification onVerified={() => setIsVerified(true)} />;
    }

    return (
        <div style={{ height: 'calc(100vh - 40px)', overflowY: 'auto', padding: '30px', paddingBottom: '100px' }}>
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}
            >
                <div>
                    <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Identity Matrix</h1>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Fingerprint size={14} color="var(--primary)" />
                        SUBJECT VERIFICATION & ACCESS CONTROL ENGINE
                    </div>
                </div>
                <button className="btn" style={{ height: '48px', padding: '0 30px' }}>
                    + ENROLL NEW SUBJECT
                </button>
            </motion.div>

            {/* Quick Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px', marginBottom: '40px' }}>
                <div className="glass-panel" style={{ padding: '25px', borderLeft: '4px solid var(--danger)', background: 'rgba(255, 0, 60, 0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
                        <ShieldAlert size={20} color="var(--danger)" />
                        <h4 style={{ margin: 0, fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 800, letterSpacing: '2px' }}>THREAT ADVISORY</h4>
                    </div>
                    <p style={{ fontSize: '1rem', color: '#e2e8f0', margin: 0, fontWeight: 300 }}>
                        <strong style={{ color: 'var(--danger)' }}>Eve Hacker</strong> flagged for pattern-based brute force heuristic on ADMIN_ROOT.
                    </p>
                </div>

                <div className="glass-panel" style={{ padding: '25px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)' }}>MFA COMPLIANCE</span>
                        <span style={{ color: 'var(--success)', fontSize: '0.75rem', fontWeight: 800 }}>92%</span>
                    </div>
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '92%' }}
                            transition={{ duration: 1.5 }}
                            style={{ height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--success))' }}
                        />
                    </div>
                    <div style={{ marginTop: '10px', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>BIOMETRIC ENROLLMENT RATIO OPTIMAL</div>
                </div>

                <div className="glass-panel" style={{ padding: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '5px' }}>ACTIVE SESSIONS</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff' }}>42</div>
                    </div>
                    <div style={{ padding: '15px', borderRadius: '15px', background: 'var(--primary-glow)' }}>
                        <Activity size={32} color="var(--primary)" />
                    </div>
                </div>
            </div>

            {/* Subject Table */}
            <div className="glass-panel" style={{ padding: '0', marginBottom: '40px' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.7rem' }}>
                            <th style={{ padding: '25px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Subject Identity</th>
                            <th style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Authorization Level</th>
                            <th style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Policy Status</th>
                            <th style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Security Factors</th>
                            <th style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Last Telemetry</th>
                            <th style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user, idx) => (
                            <motion.tr
                                key={user.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}
                            >
                                <td style={{ padding: '20px 25px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <div style={{
                                            width: '44px',
                                            height: '44px',
                                            borderRadius: '14px',
                                            background: `linear-gradient(135deg, var(--primary), var(--secondary))`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#000',
                                            fontWeight: 800,
                                            fontSize: '1.1rem'
                                        }}>
                                            {user.name[0]}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700, color: '#fff', fontSize: '1rem' }}>{user.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono' }}>{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Key size={14} color="var(--primary)" />
                                        <span style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 600 }}>{user.role}</span>
                                    </div>
                                </td>
                                <td>
                                    <span style={{
                                        padding: '4px 12px',
                                        borderRadius: '8px',
                                        background: `${statusMap[user.status].color}12`,
                                        color: statusMap[user.status].color,
                                        fontSize: '0.7rem',
                                        fontWeight: 800,
                                        border: `1px solid ${statusMap[user.status].color}25`
                                    }}>
                                        {statusMap[user.status].label}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <Smartphone size={18} color={user.mfa ? "var(--success)" : "rgba(255,255,255,0.1)"} />
                                        <Mail size={18} color="var(--success)" />
                                        <ShieldCheck size={18} color={user.status === 'Flagged' ? 'var(--danger)' : 'var(--success)'} />
                                    </div>
                                </td>
                                <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{user.lastLogin}</td>
                                <td>
                                    <button style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: '10px' }}>
                                        <MoreVertical size={20} />
                                    </button>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Device Fleet Section */}
            <DeviceFleet />
        </div>
    );
};

export default UsersPage;
