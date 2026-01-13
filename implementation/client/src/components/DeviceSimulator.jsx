import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Settings, ShieldAlert, Cpu, Globe, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const DeviceSimulator = () => {
    const { deviceHealth, updateDeviceHealth } = useContext(AuthContext);

    const toggle = (key, current, safe, unsafe) => {
        const next = current === safe ? unsafe : safe;
        updateDeviceHealth(key, next);
    };

    const statusItems = [
        {
            key: 'antivirus',
            label: 'Anti-Virus',
            icon: <ShieldAlert size={20} />,
            safe: true,
            unsafe: false,
            display: (v) => v ? 'ACTIVE' : 'OFFLINE'
        },
        {
            key: 'os',
            label: 'OS Version',
            icon: <Cpu size={20} />,
            safe: 'Windows 11',
            unsafe: 'Legacy Kernel',
            display: (v) => v
        },
        {
            key: 'ipReputation',
            label: 'IP Integrity',
            icon: <Globe size={20} />,
            safe: 'Good',
            unsafe: 'High Risk',
            display: (v) => v
        },
        {
            key: 'location',
            label: 'Geofence',
            icon: <Globe size={20} />,
            safe: 'Home Office',
            unsafe: 'Blacklisted Region',
            display: (v) => v
        },
    ];

    return (
        <div className="glass-panel" style={{ padding: '25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 className="text-gradient" style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
                    <Settings size={22} className="pulse" />
                    Identity & Device Matrix
                </h3>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
                    ID: {deviceHealth.ip || '0.0.0.0'}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                {statusItems.map((item) => {
                    const isSafe = deviceHealth[item.key] === item.safe;
                    return (
                        <motion.div
                            key={item.key}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => toggle(item.key, deviceHealth[item.key], item.safe, item.unsafe)}
                            style={{
                                background: isSafe ? 'rgba(0, 255, 157, 0.03)' : 'rgba(255, 0, 60, 0.05)',
                                border: `1px solid ${isSafe ? 'rgba(0, 255, 157, 0.1)' : 'rgba(255, 0, 60, 0.2)'}`,
                                borderRadius: '16px',
                                padding: '15px',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ color: isSafe ? 'var(--primary)' : 'var(--danger)', opacity: 0.8 }}>
                                    {item.icon}
                                </div>
                                {isSafe ? <CheckCircle2 size={16} color="var(--success)" /> : <AlertCircle size={16} color="var(--danger)" />}
                            </div>
                            <div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>{item.label}</div>
                                <div style={{ fontSize: '1rem', color: isSafe ? '#fff' : 'var(--danger)', fontWeight: 700 }}>
                                    {item.display(deviceHealth[item.key])}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            <div style={{
                marginTop: '20px',
                padding: '12px',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '10px',
                fontSize: '0.75rem',
                color: 'rgba(240, 244, 255, 0.4)',
                fontStyle: 'italic',
                textAlign: 'center',
                border: '1px solid rgba(255,255,255,0.03)'
            }}>
                Interactive simulation: Click tiles to disrupt environment attributes and observe real-time policy enforcement.
            </div>
        </div>
    );
};

export default DeviceSimulator;
