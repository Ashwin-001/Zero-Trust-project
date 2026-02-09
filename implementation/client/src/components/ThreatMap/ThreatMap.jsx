
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, ShieldAlert, Zap, Target, Activity, MapPin } from 'lucide-react';

const ThreatMap = () => {
    const [threats, setThreats] = useState([]);
    const [scannedIps, setScannedIps] = useState(0);

    // Mock data for threats
    const generateThreat = () => {
        const cities = ['New York', 'London', 'Tokyo', 'Berlin', 'Singapore', 'Sydney', 'Mumbai', 'Moscow', 'São Paulo', 'Dubai'];
        const types = ['DDoS Attempt', 'SQL Injection', 'Brute Force', 'ZKP Bypass Attempt', 'Policy Violation'];
        return {
            id: Math.random(),
            city: cities[Math.floor(Math.random() * cities.length)],
            type: types[Math.floor(Math.random() * types.length)],
            ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
            severity: Math.random() > 0.7 ? 'CRITICAL' : 'ELEVATED',
            timestamp: new Date().toLocaleTimeString(),
            x: 20 + Math.random() * 60, // percentage for positioning
            y: 20 + Math.random() * 60
        };
    };

    useEffect(() => {
        const interval = setInterval(() => {
            setThreats(prev => [generateThreat(), ...prev].slice(0, 8));
            setScannedIps(prev => prev + Math.floor(Math.random() * 100));
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="analytics-container" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', height: '100%' }}>

                {/* Main Visualizer */}
                <div className="glass-panel" style={{ position: 'relative', overflow: 'hidden', minHeight: '500px', display: 'flex', flexDirection: 'column', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', color: '#fff' }}>
                            <Globe size={24} className="text-primary" />
                            Global Threat Intelligence Matrix
                        </h2>
                        <div style={{ display: 'flex', gap: '20px' }}>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.6rem', color: '#888', letterSpacing: '1px' }}>IPS SCANNED</div>
                                <div style={{ fontSize: '1.2rem', color: 'var(--primary)', fontWeight: 700 }}>{scannedIps.toLocaleString()}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.6rem', color: '#888', letterSpacing: '1px' }}>ACTIVE THREATS</div>
                                <div style={{ fontSize: '1.2rem', color: 'var(--secondary)', fontWeight: 700 }}>{threats.length}</div>
                            </div>
                        </div>
                    </div>

                    <div style={{ flex: 1, position: 'relative', background: 'rgba(0,0,0,0.5)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                        {/* Map Grid Backdrop */}
                        <div style={{
                            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                            backgroundImage: 'radial-gradient(var(--bg-lighter) 1px, transparent 0)',
                            backgroundSize: '40px 40px', opacity: 0.2
                        }} />

                        {/* Threat Dots */}
                        <AnimatePresence>
                            {threats.map((threat) => (
                                <motion.div
                                    key={threat.id}
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 2, opacity: 0 }}
                                    style={{
                                        position: 'absolute',
                                        left: `${threat.x}%`,
                                        top: `${threat.y}%`,
                                        width: '12px',
                                        height: '12px',
                                        background: threat.severity === 'CRITICAL' ? 'var(--secondary)' : 'var(--primary)',
                                        borderRadius: '50%',
                                        boxShadow: `0 0 20px ${threat.severity === 'CRITICAL' ? 'var(--secondary)' : 'var(--primary)'}`
                                    }}
                                >
                                    <motion.div
                                        animate={{ scale: [1, 3], opacity: [0.5, 0] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        style={{
                                            position: 'absolute',
                                            top: '-4px',
                                            left: '-4px',
                                            width: '20px',
                                            height: '20px',
                                            border: `1px solid ${threat.severity === 'CRITICAL' ? 'var(--secondary)' : 'var(--primary)'}`,
                                            borderRadius: '50%'
                                        }}
                                    />

                                    {/* Label */}
                                    <div style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
                                        <div style={{ fontSize: '0.6rem', background: 'rgba(0,0,0,0.8)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
                                            {threat.city} : {threat.ip}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* Scanner Beam */}
                        <motion.div
                            animate={{ left: ['0%', '100%'] }}
                            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                            style={{ position: 'absolute', top: 0, bottom: 0, width: '2px', background: 'linear-gradient(to bottom, transparent, var(--primary), transparent)', boxShadow: '0 0 15px var(--primary)', opacity: 0.5 }}
                        />
                    </div>
                </div>

                {/* Threat Feed */}
                <div className="glass-panel" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <h3 style={{ margin: 0, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Activity size={16} className="text-secondary" />
                            Real-time Intercepts
                        </h3>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
                        {threats.map((threat) => (
                            <div key={threat.id} style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', marginBottom: '10px', borderLeft: `3px solid ${threat.severity === 'CRITICAL' ? 'var(--secondary)' : 'var(--primary)'}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                    <span style={{ fontSize: '0.65rem', color: '#888' }}>{threat.timestamp}</span>
                                    <span style={{ fontSize: '0.6rem', color: threat.severity === 'CRITICAL' ? 'var(--secondary)' : 'var(--primary)', fontWeight: 700 }}>{threat.severity}</span>
                                </div>
                                <div style={{ color: '#eee', fontSize: '0.8rem', fontWeight: 600 }}>{threat.type}</div>
                                <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '4px' }}>Source: {threat.city} ({threat.ip})</div>
                            </div>
                        ))}
                    </div>
                    <div style={{ padding: '15px', background: 'rgba(0,240,255,0.05)', textAlign: 'center', fontSize: '0.7rem', color: 'var(--primary)', letterSpacing: '1px' }}>
                        FIREWALL: ACTIVE | SHIELD: 98.4%
                    </div>
                </div>
            </div>

            {/* Bottom Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                {[
                    { label: 'Anomaly Threshold', val: '0.42%', icon: <ShieldAlert size={18} />, color: 'var(--primary)' },
                    { label: 'Latency (Edge)', val: '14ms', icon: <Zap size={18} />, color: 'var(--success)' },
                    { label: 'Honeypot Hits', val: '1,284', icon: <Target size={18} />, color: 'var(--secondary)' },
                    { label: 'Active Sessions', val: '412', icon: <MapPin size={18} />, color: '#fff' }
                ].map((m, i) => (
                    <div key={i} className="glass-panel" style={{ padding: '15px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ color: m.color }}>{m.icon}</div>
                        <div>
                            <div style={{ fontSize: '0.6rem', color: '#888', textTransform: 'uppercase' }}>{m.label}</div>
                            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>{m.val}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ThreatMap;
