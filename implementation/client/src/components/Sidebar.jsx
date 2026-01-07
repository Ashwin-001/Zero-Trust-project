import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Activity, Users, Settings, LogOut, Hexagon } from 'lucide-react';

const Sidebar = () => {
    const { logout } = useContext(AuthContext);

    const activeStyle = {
        background: 'rgba(0, 240, 255, 0.1)',
        borderRight: '3px solid var(--primary-color)',
        color: 'var(--primary-color)'
    };

    const linkStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '15px 20px',
        color: '#ccc',
        textDecoration: 'none',
        transition: 'all 0.3s ease',
        marginBottom: '5px'
    };

    return (
        <div className="glass-panel" style={{
            width: '240px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '0 16px 16px 0',
            borderLeft: 'none',
            zIndex: 10
        }}>
            <div style={{ padding: '30px 20px' }}>
                <h2 className="text-gradient" style={{ margin: 0, fontSize: '1.5rem' }}>Z-TRUST</h2>
                <span style={{ fontSize: '0.7rem', letterSpacing: '2px', color: '#666' }}>ENTERPRISE SEC</span>
            </div>

            <nav style={{ flex: 1 }}>
                <NavLink to="/dashboard" style={({ isActive }) => isActive ? { ...linkStyle, ...activeStyle } : linkStyle}>
                    <LayoutDashboard size={20} /> Dashboard
                </NavLink>
                <NavLink to="/analytics" style={({ isActive }) => isActive ? { ...linkStyle, ...activeStyle } : linkStyle}>
                    <Activity size={20} /> Analytics
                </NavLink>
                <NavLink to="/users" style={({ isActive }) => isActive ? { ...linkStyle, ...activeStyle } : linkStyle}>
                    <Users size={20} /> Identity Mgmt
                </NavLink>
                <NavLink to="/settings" style={({ isActive }) => isActive ? { ...linkStyle, ...activeStyle } : linkStyle}>
                    <Settings size={20} /> Policies
                </NavLink>
                <NavLink to="/blockchain" style={({ isActive }) => isActive ? { ...linkStyle, ...activeStyle } : linkStyle}>
                    <Hexagon size={20} /> Audit Ledger
                </NavLink>
            </nav>

            <div style={{ padding: '20px' }}>
                <button onClick={logout} className="btn btn-danger" style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                    <LogOut size={18} /> Logout
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
