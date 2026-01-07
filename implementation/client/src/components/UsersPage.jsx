import React, { useState } from 'react';
import { User, MoreVertical, ShieldCheck, Mail, Lock, Trash2, Smartphone, AlertTriangle } from 'lucide-react';

const UsersPage = () => {
    // Mock Users Data
    const [users, setUsers] = useState([
        { id: 1, name: 'Alice Admin', email: 'admin@corp.com', role: 'admin', status: 'Active', mfa: true, lastLogin: '2 mins ago' },
        { id: 2, name: 'Bob Builder', email: 'bob@corp.com', role: 'dev', status: 'Active', mfa: true, lastLogin: '1 hour ago' },
        { id: 3, name: 'Charlie Guest', email: 'charlie@external.com', role: 'guest', status: 'Suspended', mfa: false, lastLogin: '4 days ago' },
        { id: 4, name: 'Dave Ops', email: 'dave@corp.com', role: 'admin', status: 'Active', mfa: true, lastLogin: '5 mins ago' },
        { id: 5, name: 'Eve Hacker', email: 'eve@unknown.net', role: 'user', status: 'Flagged', mfa: false, lastLogin: 'Just now' },
    ]);

    const statusColor = (status) => {
        if (status === 'Active') return '#00ff9d';
        if (status === 'Suspended') return '#888';
        if (status === 'Flagged') return '#ff003c';
        return '#fff';
    }

    return (
        <div style={{ height: '100%', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <h1 className="text-gradient">Identity Management</h1>
                    <p style={{ color: '#888' }}>Manage users, roles, and zero-trust verification statuses.</p>
                </div>
                <button className="btn">
                    + New User
                </button>
            </div>

            <div className="glass-panel" style={{ padding: '0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#888' }}>
                            <th style={{ padding: '20px' }}>User Identity</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Security Factors</th>
                            <th>Last Activity</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black', fontWeight: 'bold' }}>
                                        {user.name[0]}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>{user.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#888' }}>{user.email}</div>
                                    </div>
                                </td>
                                <td style={{ textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '1px' }}>{user.role}</td>
                                <td>
                                    <span style={{
                                        padding: '5px 10px',
                                        borderRadius: '20px',
                                        background: `${statusColor(user.status)}20`,
                                        color: statusColor(user.status),
                                        fontSize: '0.8rem',
                                        border: `1px solid ${statusColor(user.status)}40`
                                    }}>
                                        {user.status}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        {user.mfa ? <Smartphone size={16} color="#00ff9d" /> : <Smartphone size={16} color="#555" />}
                                        <Mail size={16} color="#00ff9d" />
                                        <ShieldCheck size={16} color={user.status === 'Flagged' ? '#ff003c' : '#00ff9d'} />
                                    </div>
                                </td>
                                <td style={{ color: '#ccc' }}>{user.lastLogin}</td>
                                <td>
                                    <button style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer' }}>
                                        <MoreVertical size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginTop: '20px' }}>
                <div className="glass-panel" style={{ padding: '20px', border: '1px solid var(--danger-color)', background: 'rgba(255, 0, 60, 0.05)' }}>
                    <h4 style={{ color: 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 10px 0' }}>
                        <AlertTriangle size={18} /> Suspicious Activity Feed
                    </h4>
                    <p style={{ fontSize: '0.9rem', color: '#ccc' }}>
                        User <strong>Eve Hacker</strong> attempted to access admin root 5 times in 10s.
                    </p>
                </div>

                <div className="glass-panel" style={{ padding: '20px' }}>
                    <h4 style={{ margin: '0 0 10px 0' }}>MFA Adoption</h4>
                    <div className="loading-bar" style={{ width: '85%' }}></div>
                    <p style={{ textAlign: 'right', marginTop: '5px', fontSize: '0.9rem' }}>85% Compliant</p>
                </div>

                <div className="glass-panel" style={{ padding: '20px' }}>
                    <h4 style={{ margin: '0 0 10px 0' }}>Active Tokens</h4>
                    <h2 className="text-gradient">42</h2>
                    <p style={{ fontSize: '0.8rem', color: '#888' }}>Expiring in &lt; 5m: 12</p>
                </div>
            </div>

        </div>
    );
};

export default UsersPage;
