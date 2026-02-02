import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Users, Shield, FileText, Lock, Activity, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

const Sidebar = ({ onLogout, onNavigate, activeView }) => {

    const menuItems = [
        { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
        { id: 'threat-map', icon: <Activity size={20} />, label: 'Threat Map' },
        { id: 'users', icon: <Users size={20} />, label: 'Identity Matrix' },
        { id: 'policies', icon: <FileText size={20} />, label: 'Policies' },
        { id: 'vault', icon: <Lock size={20} />, label: 'Quantum Vault' },
        { id: 'logs', icon: <Shield size={20} />, label: 'Audit Chain' },
    ];

    return (
        <div style={{
            width: '280px',
            height: '100vh',
            background: 'var(--panel-bg)',
            borderRight: '1px solid var(--glass-border)',
            display: 'flex',
            flexDirection: 'column',
            padding: '24px'
        }}>
            <div style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Shield size={32} color="var(--primary)" />
                <h1 style={{ fontSize: '1.2rem', margin: 0, textTransform: 'uppercase', letterSpacing: '2px' }}>
                    Zero<span style={{ color: 'var(--primary)' }}>Trust</span>
                </h1>
            </div>

            <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {menuItems.map(item => (
                    <motion.div
                        key={item.id}
                        onClick={() => onNavigate(item.id)}
                        whileHover={{ x: 5, backgroundColor: 'rgba(255,255,255,0.05)' }}
                        style={{
                            padding: '12px 16px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            cursor: 'pointer',
                            color: activeView === item.id ? 'var(--primary)' : 'var(--text-secondary)',
                            background: activeView === item.id ? 'rgba(0, 240, 255, 0.1)' : 'transparent',
                            border: activeView === item.id ? '1px solid rgba(0, 240, 255, 0.2)' : '1px solid transparent'
                        }}
                    >
                        {item.icon}
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{item.label}</span>
                    </motion.div>
                ))}
            </nav>

            <motion.button
                whileHover={{ scale: 1.02 }}
                onClick={onLogout}
                className="glass-panel"
                style={{
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    color: 'var(--danger)',
                    cursor: 'pointer',
                    marginTop: 'auto'
                }}
            >
                <LogOut size={18} />
                <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>SYSTEM LOGOUT</span>
            </motion.button>
        </div>
    );
};

export default Sidebar;
