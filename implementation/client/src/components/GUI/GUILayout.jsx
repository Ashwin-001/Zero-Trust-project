import React, { useState } from 'react';
import Sidebar from './Sidebar';
import CyberMatrix from './CyberMatrix';
import LoginScreen from './LoginScreen';
import IdentityMatrix from './IdentityMatrix';
import QuantumVault from './QuantumVault';
import AuditChain from './AuditChain';
import Policies from './Policies';
import ThreatMap from './ThreatMap';
import ExamMetricsPanel from './ExamMetricsPanel';
import { motion, AnimatePresence } from 'framer-motion';
import useDeviceSecurity from '../../hooks/useDeviceSecurity';
import { Activity, ShieldAlert, Wifi } from 'lucide-react';

const GUILayout = ({ onExit }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
    const [currentView, setCurrentView] = useState('dashboard');
    const [lockoutMessage, setLockoutMessage] = useState('');

    const { status, policy, toggleSimulatedRisk, deviceData } = useDeviceSecurity(isAuthenticated, (msg) => {
        setLockoutMessage(msg);
        localStorage.removeItem('token'); // Kill session token
        setIsAuthenticated(false);
    });

    if (lockoutMessage) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', background: '#000', color: 'var(--danger)' }}>
                <ShieldAlert size={64} style={{ marginBottom: '20px' }} />
                <h1 style={{ fontSize: '3rem' }}>ACCESS REVOKED</h1>
                <p style={{ color: '#fff', fontSize: '1.2rem' }}>{lockoutMessage}</p>
                <button className="btn btn-secondary" style={{ marginTop: '40px' }} onClick={() => {
                    setLockoutMessage('');
                    onExit();
                }}>
                    RETURN TO BIOS
                </button>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <LoginScreen onLoginSuccess={() => setIsAuthenticated(true)} />;
    }

    const renderContent = () => {
        switch (currentView) {
            case 'dashboard': return <CyberMatrix />;
            case 'threat-map': return <ThreatMap />;
            case 'users': return <IdentityMatrix />;
            case 'policies': return <Policies />;
            case 'vault': return <QuantumVault />;
            case 'logs': return <AuditChain />;
            default: return <CyberMatrix />;
        }
    };

    return (
        <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-color)', overflow: 'hidden' }}>
            <Sidebar
                onLogout={() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setIsAuthenticated(false);
                    onExit();
                }}
                onNavigate={setCurrentView}
                activeView={currentView}
            />
            <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', marginBottom: '5px' }}>Command Center</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            System Status: <span style={{ color: status === 'ALLOWED' ? 'var(--success)' : 'var(--danger)' }}>{status}</span>
                            {policy.restrict_web_access && <span style={{ marginLeft: '10px', color: 'var(--warning)', fontSize: '0.8rem' }}> [LIMITED MODE]</span>}
                        </p>
                    </div>

                    {/* Device Pulse Monitor */}
                    <div className="glass-panel" style={{ padding: '10px 20px', display: 'flex', gap: '30px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <span style={{ fontSize: '0.7rem', color: '#888' }}>DEVICE HEALTH PULSE (500ms)</span>
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <div
                                    onClick={() => toggleSimulatedRisk('av')}
                                    style={{ cursor: 'pointer', display: 'flex', gap: '5px', alignItems: 'center', color: deviceData.antivirus ? 'var(--success)' : 'var(--danger)' }}
                                    title="Click to Toggle Anti-Virus (Simulate Attack)"
                                >
                                    <ShieldAlert size={16} /> AV: {deviceData.antivirus ? 'ON' : 'OFF'}
                                </div>
                                <div
                                    onClick={() => toggleSimulatedRisk('geo')}
                                    style={{ cursor: 'pointer', display: 'flex', gap: '5px', alignItems: 'center', color: deviceData.geo === 'Unknown' ? 'var(--danger)' : 'var(--primary)' }}
                                    title="Click to Toggle Location"
                                >
                                    <Wifi size={16} /> LOC: {deviceData.geo}
                                </div>
                            </div>
                        </div>
                        <div style={{ paddingLeft: '20px', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
                            <Activity size={24} color={status === 'ALLOWED' ? 'var(--success)' : 'var(--danger)'} className={status === 'ALLOWED' ? 'pulse' : ''} />
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                {renderContent()}

                {currentView === 'dashboard' && (
                    <div style={{ marginTop: '30px' }}>
                        <ExamMetricsPanel />
                    </div>
                )}

            </div>
        </div>
    );
};

export default GUILayout;
