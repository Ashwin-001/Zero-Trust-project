import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import DeviceSimulator from './DeviceSimulator';
import AuditLog from './AuditLog';
import AnalyticsPanel from './AnalyticsPanel';
import AIAssistant from './AIAssistant';
import api from '../services/api';
import {
    FileText,
    Shield,
    MonitorX,
    Key,
    Clock,
    Fingerprint,
    Activity,
    Lock,
    Unlock,
    Server
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { notifySuccess, notifyError, notifyInfo } from '../services/tost';

const Dashboard = () => {
    const { user } = useContext(AuthContext);
    const [accessResult, setAccessResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [triggerLog, setTriggerLog] = useState(0);
    const [logs, setLogs] = useState([]);
    const [verifying, setVerifying] = useState(false);

    const fetchLogsForAnalytics = async () => {
        try {
            const res = await api.get('/secure/logs');
            setLogs(res.data);
        } catch (e) { }
    };

    React.useEffect(() => {
        fetchLogsForAnalytics();
        const interval = setInterval(fetchLogsForAnalytics, 5000);
        return () => clearInterval(interval);
    }, [triggerLog]);

    const accessResource = async (endpoint) => {
        setVerifying(true);
        // Simulate advanced biometric scan
        await new Promise(r => setTimeout(r, 2000));

        setLoading(true);
        setAccessResult(null);
        try {
            notifyInfo(`Negotiating handshake for ${endpoint}...`);
            const res = await api.get(`/secure/${endpoint}`);
            setAccessResult({ success: true, message: res.data.message, riskLevel: res.data.riskLevel, data: res.data.data });
            notifySuccess('Session Authorized');
        } catch (err) {
            setAccessResult({
                success: false,
                message: err.response?.data?.error || 'Access Denied',
                issues: err.response?.data?.issues
            });
            notifyError('Heuristic Block Engaged');
        } finally {
            setLoading(false);
            setVerifying(false);
            setTriggerLog(prev => prev + 1);
        }
    };

    const resources = [
        { id: 'public-resource', label: 'Public Node', icon: <FileText size={24} />, color: 'var(--primary)' },
        { id: 'confidential-resource', label: 'Vault Access', icon: <Shield size={24} />, color: 'var(--primary)' },
        { id: 'admin-panel', label: 'System Admin', icon: <Key size={24} />, color: 'var(--secondary)' },
        { id: 'server-room', label: 'Mainframe', icon: <Server size={24} />, color: 'var(--danger)' },
    ];

    return (
        <div style={{
            display: 'flex',
            gap: '30px',
            height: '100%',
            padding: '20px',
            boxSizing: 'border-box'
        }}>
            {/* Main Command Center - Left Column */}
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '30px',
                overflowY: 'auto',
                paddingRight: '15px'
            }}>

                {/* Immersive Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <motion.h1
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-gradient"
                            style={{ fontSize: '2.5rem', marginBottom: '8px' }}
                        >
                            Command Center
                        </motion.h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                <Clock size={14} color="var(--primary)" />
                                {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </div>
                            <div style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.1)', marginTop: '4px' }} />
                            <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, marginTop: '4px' }}>
                                {user?.username?.toUpperCase()} • SECURITY_LVL_4
                            </div>
                        </div>
                    </div>
                    <div className="glass-panel" style={{ padding: '15px 25px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ height: '32px', width: '32px', borderRadius: '50%', background: 'rgba(0, 255, 157, 0.1)', display: 'flex', alignItems: 'center', justifyItems: 'center', border: '1px solid var(--success)' }}>
                            <Activity size={18} color="var(--success)" className="pulse" style={{ margin: 'auto' }} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: 800 }}>CORE STATUS</div>
                            <div style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>OPERATIONAL</div>
                        </div>
                    </div>
                </div>

                {/* Top Row: AI & Devices */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                    <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
                        <div style={{ flex: '1 1 400px' }}><AIAssistant /></div>
                        <div style={{ flex: '1 1 350px' }}><DeviceSimulator /></div>
                    </div>
                </div>

                {/* Resource Grid */}
                <div className="glass-panel" style={{ padding: '30px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '30px' }}>
                        <Lock size={20} color="var(--primary)" />
                        <h3 className="text-gradient" style={{ margin: 0 }}>Protected Network Resources</h3>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                        {resources.map((res) => (
                            <motion.button
                                key={res.id}
                                whileHover={{ scale: 1.05, translateY: -5 }}
                                whileTap={{ scale: 0.95 }}
                                className="btn"
                                onClick={() => accessResource(res.id)}
                                style={{
                                    height: '140px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '15px',
                                    background: 'rgba(255,255,255,0.02)',
                                    borderColor: res.color,
                                    color: res.color,
                                    width: '100%'
                                }}
                            >
                                <div style={{
                                    padding: '12px',
                                    borderRadius: '12px',
                                    background: `rgba(${res.color === 'var(--danger)' ? '255,0,60' : res.color === 'var(--secondary)' ? '112,0,255' : '0,240,255'}, 0.1)`
                                }}>
                                    {res.icon}
                                </div>
                                <span style={{ fontWeight: 700, letterSpacing: '1px', fontSize: '0.85rem' }}>{res.label}</span>
                            </motion.button>
                        ))}
                    </div>

                    <AnimatePresence>
                        {accessResult && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                style={{
                                    marginTop: '30px',
                                    padding: '25px',
                                    borderRadius: '20px',
                                    background: accessResult.success ? 'rgba(0, 255, 157, 0.05)' : 'rgba(255, 0, 60, 0.05)',
                                    border: `1px solid ${accessResult.success ? 'rgba(0, 255, 157, 0.2)' : 'rgba(255, 0, 60, 0.2)'}`,
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                                    {accessResult.success ? <Unlock color="var(--success)" size={28} /> : <Lock color="var(--danger)" size={28} />}
                                    <h2 style={{
                                        color: accessResult.success ? 'var(--success)' : 'var(--danger)',
                                        margin: 0,
                                        fontSize: '1.5rem',
                                        letterSpacing: '1px'
                                    }}>
                                        {accessResult.success ? 'IDENTITY AUTHORIZED' : 'ACCESS DENIED'}
                                    </h2>
                                </div>
                                <p style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '20px', fontWeight: 300 }}>{accessResult.message}</p>

                                {accessResult.data && (
                                    <div style={{
                                        background: 'rgba(0,0,0,0.4)',
                                        padding: '15px',
                                        borderRadius: '12px',
                                        fontFamily: 'JetBrains Mono',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        color: 'var(--primary)',
                                        fontSize: '0.9rem'
                                    }}>
                                        <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', marginBottom: '8px' }}>ENCRYPTED_PAYLOAD_DECRYPTED</div>
                                        {accessResult.data}
                                    </div>
                                )}

                                {accessResult.issues && (
                                    <div style={{ marginTop: '15px' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--danger)', fontWeight: 800, marginBottom: '8px' }}>SECURITY BREACH VECTORS:</div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                            {accessResult.issues.map((issue, i) => (
                                                <span key={i} style={{ background: 'rgba(255,0,60,0.1)', color: 'var(--danger)', padding: '5px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                                                    {issue}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <AnalyticsPanel logs={logs} />
                <div style={{ height: '40px' }} /> {/* Footer space */}
            </div>

            {/* Live Stream Panel - Right Column */}
            <div style={{ width: '350px', display: 'flex', flexDirection: 'column' }}>
                <AuditLog refreshTrigger={triggerLog} />
            </div>

            {/* Immersive Biometric HUD Overlay */}
            <AnimatePresence>
                {verifying && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                            background: 'rgba(8, 9, 13, 0.9)', zIndex: 9999, display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(20px)'
                        }}
                    >
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                            style={{
                                position: 'absolute',
                                width: '400px',
                                height: '400px',
                                border: '2px solid var(--primary)',
                                borderRadius: '50%',
                                opacity: 0.1,
                                borderStyle: 'dashed'
                            }}
                        />
                        <div style={{ position: 'relative' }}>
                            <Fingerprint size={120} color="var(--primary)" className="pulse" />
                            <motion.div
                                animate={{ top: ['0%', '100%', '0%'] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                style={{
                                    position: 'absolute',
                                    left: '-20px',
                                    width: '160px',
                                    height: '2px',
                                    background: 'var(--primary)',
                                    boxShadow: '0 0 20px var(--primary)',
                                    zIndex: 1
                                }}
                            />
                        </div>
                        <h2 className="text-gradient" style={{ marginTop: '50px', fontSize: '2rem', letterSpacing: '4px' }}>ZERO TRUST ENGINE</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '30px', marginTop: '30px' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ color: 'var(--success)', fontWeight: 800 }}>ZKP</div>
                                <div style={{ fontSize: '0.6rem', color: '#888' }}>IDENTITY PROOF</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ color: 'var(--primary)', fontWeight: 800 }}>RBAC</div>
                                <div style={{ fontSize: '0.6rem', color: '#888' }}>ROLE CHECK</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ color: 'var(--primary)', fontWeight: 800 }}>ABAC</div>
                                <div style={{ fontSize: '0.6rem', color: '#888' }}>CONTEXT & DEVICE</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ color: 'var(--secondary)', fontWeight: 800 }}>RISK</div>
                                <div style={{ fontSize: '0.6rem', color: '#888' }}>SCORING MODEL</div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Dashboard;
