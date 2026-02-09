import './Sidebar.css';
import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Activity,
    Users,
    ShieldCheck,
    LogOut,
    Hexagon,
    Terminal,
    ChevronRight,
    Cpu,
    Globe,
    Box
} from 'lucide-react';
import { motion } from 'framer-motion';

const Sidebar = () => {
    const { logout, user } = useContext(AuthContext);

    const navItems = [
        { path: '/dashboard', label: 'Command Center', icon: <LayoutDashboard size={20} /> },
        { path: '/analytics', label: 'AI Intelligence', icon: <Activity size={20} /> },
        { path: '/users', label: 'Identity Matrix', icon: <Users size={20} /> },
        { path: '/settings', label: 'Security Policy', icon: <Terminal size={20} /> },
        { path: '/blockchain', label: 'Immutable Ledger', icon: <Hexagon size={20} /> },
        { path: '/quantum-vault', label: 'Quantum Vault', icon: <Cpu size={20} /> },
        { path: '/threat-map', label: 'Threat Intelligence', icon: <Globe size={20} /> },
        { path: '/cyber-matrix', label: 'Compute Matrix', icon: <Box size={20} /> },
    ];

    return (
        <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="glass-panel"
            style={{
                width: 'var(--sidebar-width)',
                height: 'calc(100vh - 40px)',
                display: 'flex',
                flexDirection: 'column',
                margin: '20px 0 20px 20px',
                zIndex: 10,
                border: '1px solid var(--glass-border)',
                background: 'rgba(13, 15, 22, 0.95)'
            }}
        >
            {/* Sidebar Branding */}
            <div style={{ padding: '40px 30px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <ShieldCheck size={20} color="#000" />
                    </div>
                    <span style={{
                        fontWeight: 800,
                        fontSize: '1.4rem',
                        letterSpacing: '-1px',
                        color: '#fff'
                    }}>
                        Z-TRUST
                    </span>
                </div>
                <div style={{
                    fontSize: '0.65rem',
                    letterSpacing: '3px',
                    color: 'var(--primary)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    opacity: 0.8
                }}>
                    Security Protocol 2.0
                </div>
            </div>

            {/* Navigation Section */}
            <nav style={{ flex: 1, padding: '30px 15px' }}>
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        style={({ isActive }) => ({
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '14px 20px',
                            borderRadius: '12px',
                            color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                            textDecoration: 'none',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            marginBottom: '10px',
                            background: isActive ? 'rgba(0, 240, 255, 0.08)' : 'transparent',
                            border: isActive ? '1px solid rgba(0, 240, 255, 0.2)' : '1px solid transparent',
                            fontWeight: isActive ? 600 : 400,
                            position: 'relative'
                        })}
                    >
                        {({ isActive }) => (
                            <>
                                {isActive && (
                                    <motion.div
                                        layoutId="sidebar-active-pill"
                                        style={{
                                            position: 'absolute',
                                            left: 0,
                                            width: '4px',
                                            height: '24px',
                                            background: 'var(--primary)',
                                            borderRadius: '0 4px 4px 0',
                                            boxShadow: '0 0 10px var(--primary)'
                                        }}
                                    />
                                )}
                                <span style={{ opacity: isActive ? 1 : 0.7 }}>{item.icon}</span>
                                <span style={{ flex: 1, fontSize: '0.95rem' }}>{item.label}</span>
                                {isActive && <ChevronRight size={14} style={{ opacity: 0.5 }} />}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* User Profile / Status */}
            <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '16px',
                    padding: '15px',
                    marginBottom: '15px',
                    border: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: '#1e293b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'var(--secondary)'
                    }}>
                        <Users size={20} />
                    </div>
                    <div>
                        <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600, maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {user?.username || 'GUEST_USER'}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 5px var(--success)' }} />
                            AUTHORIZED
                        </div>
                    </div>
                </div>

                <button
                    onClick={logout}
                    className="btn btn-secondary"
                    style={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '10px',
                        background: 'rgba(112, 0, 255, 0.05)'
                    }}
                >
                    <LogOut size={18} />
                    SIGN OUT
                </button>
            </div>
        </motion.div>
    );
};

export default Sidebar;
