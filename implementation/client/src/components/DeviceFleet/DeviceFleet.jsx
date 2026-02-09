import './DeviceFleet.css';
import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, Laptop, Cpu, Globe, Server, Activity, CheckCircle2, Zap, Hexagon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DeviceFleet = () => {
    const [devices, setDevices] = useState([]);
    const [stats, setStats] = useState({ activeNodes: 0, totalHashrate: '0 TH/s', networkLatency: '0ms' });

    // Initial Generation
    useEffect(() => {
        const mockDevices = Array.from({ length: 100 }, (_, i) => {
            const random = (arr) => arr[Math.floor(Math.random() * arr.length)];

            const osOptions = ['Windows 11', 'Windows 10', 'macOS Sonoma', 'Linux Ubuntu', 'Legacy XP'];
            const avOptions = ['Active', 'Active', 'Outdated', 'Disabled', 'Unknown'];
            const ipOptions = ['Valid', 'Valid', 'Valid', 'Proxy', 'Blacklisted'];
            const gpuOptions = ['NVIDIA RTX 4090', 'NVIDIA RTX 3080', 'NVIDIA GTX 1660', 'Integrated', 'None'];

            const os = random(osOptions);
            const antivirus = random(avOptions);
            const ipIntegrity = random(ipOptions);
            const gpu = random(gpuOptions);

            let riskScore = 0;
            if (antivirus !== 'Active') riskScore += 30;
            if (os === 'Legacy XP') riskScore += 50;
            if (ipIntegrity === 'Blacklisted') riskScore += 100;

            const status = riskScore === 0 ? 'VALIDATING' : riskScore < 50 ? 'SYNCING' : 'OFFLINE';

            return {
                id: `NODE-${1000 + i}`,
                nodeHash: `0x${Math.random().toString(16).substr(2, 8)}...`,
                blockHeight: 840000 + Math.floor(Math.random() * 50),
                latency: Math.floor(Math.random() * 100) + 10,
                os,
                antivirus,
                ipIntegrity,
                gpu,
                status,
                riskScore
            };
        });

        setDevices(mockDevices);
    }, []);

    // Live Simulation Effect
    useEffect(() => {
        const interval = setInterval(() => {
            setDevices(prevDevices => {
                return prevDevices.map(dev => {
                    // Randomly update some devices
                    if (Math.random() > 0.7) {
                        const newHeight = dev.status === 'VALIDATING' ? dev.blockHeight + 1 : dev.blockHeight;
                        const newLatency = Math.max(10, dev.latency + (Math.floor(Math.random() * 20) - 10));

                        // Occasional status flicker for realism
                        let newStatus = dev.status;
                        if (dev.riskScore < 50 && Math.random() > 0.95) {
                            newStatus = newStatus === 'VALIDATING' ? 'MINING' : 'VALIDATING';
                        }

                        return {
                            ...dev,
                            blockHeight: newHeight,
                            latency: newLatency,
                            status: newStatus
                        };
                    }
                    return dev;
                });
            });

            // Update Global Stats
            setStats(prev => ({
                activeNodes: Math.floor(90 + Math.random() * 10),
                totalHashrate: (450 + Math.random() * 10).toFixed(2) + ' PH/s',
                networkLatency: (24 + Math.random() * 5).toFixed(1) + 'ms'
            }));

        }, 1000); // 1-second ticks

        return () => clearInterval(interval);
    }, []);

    const getStatusColor = (status) => {
        if (status === 'VALIDATING') return 'var(--success)';
        if (status === 'MINING') return 'var(--primary)';
        if (status === 'SYNCING') return 'var(--warning)';
        return 'var(--danger)';
    };

    return (
        <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', marginTop: '30px' }}>
            <div style={{ padding: '25px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
                <div>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ background: 'var(--primary-glow)', padding: '8px', borderRadius: '8px', border: '1px solid rgba(0, 240, 255, 0.2)' }}>
                            <Hexagon size={20} color="var(--primary)" />
                        </div>
                        Distributed Node Fleet
                    </h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '5px', marginLeft: '48px' }}>
                        Live Blockchain Network • PoS Consensus
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '30px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 800 }}>ACTIVE NODES</div>
                        <div style={{ fontSize: '1.2rem', color: 'var(--success)', fontWeight: 800 }}>{stats.activeNodes}/100</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 800 }}>HASHRATE</div>
                        <div style={{ fontSize: '1.2rem', color: 'var(--primary)', fontWeight: 800 }}>{stats.totalHashrate}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 800 }}>LATENCY</div>
                        <div style={{ fontSize: '1.2rem', color: '#fff', fontWeight: 800 }}>{stats.networkLatency}</div>
                    </div>
                </div>
            </div>

            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead style={{ position: 'sticky', top: 0, background: '#0f172a', zIndex: 10, boxShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                        <tr style={{ textAlign: 'left', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                            <th style={{ padding: '15px 20px' }}>Node ID</th>
                            <th>Current Block</th>
                            <th>Node Hash</th>
                            <th>Hardware (GPU)</th>
                            <th>Latency</th>
                            <th>Consensus State</th>
                        </tr>
                    </thead>
                    <tbody>
                        {devices.map((device, idx) => (
                            <motion.tr
                                key={device.id}
                                layoutId={device.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}
                            >
                                <td style={{ padding: '12px 20px', fontFamily: 'JetBrains Mono', color: 'var(--primary)' }}>
                                    {device.id}
                                </td>
                                <td style={{ fontFamily: 'JetBrains Mono', color: '#fff' }}>
                                    #{device.blockHeight.toLocaleString()}
                                </td>
                                <td style={{ fontFamily: 'JetBrains Mono', fontSize: '0.75rem', opacity: 0.6 }}>
                                    {device.nodeHash}
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--secondary)' }}>
                                        <Cpu size={14} />
                                        {device.gpu}
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: device.latency < 50 ? 'var(--success)' : 'var(--warning)' }}>
                                        <Activity size={14} />
                                        {device.latency}ms
                                    </div>
                                </td>
                                <td>
                                    <span style={{
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        fontSize: '0.7rem',
                                        fontWeight: 800,
                                        background: `${getStatusColor(device.status)}22`,
                                        color: getStatusColor(device.status),
                                        border: `1px solid ${getStatusColor(device.status)}44`,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}>
                                        {device.status === 'MINING' && <Zap size={10} fill="currentColor" />}
                                        {device.status}
                                    </span>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DeviceFleet;
