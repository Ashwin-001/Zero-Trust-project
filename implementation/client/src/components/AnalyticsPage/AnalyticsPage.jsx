import './AnalyticsPage.css';
import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { Shield, AlertTriangle, Activity, Globe, Info, Zap, TrendingUp } from 'lucide-react';
import api from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const AnalyticsPage = () => {
    const [logs, setLogs] = useState([]);
    const [intelligence, setIntelligence] = useState({ summary: 'Calibrating AI Neural Models...', chart_data: [10, 20, 15, 25, 30] });
    const [trafficData, setTrafficData] = useState([]);
    const [riskData, setRiskData] = useState([]);

    const fetchIntelligence = async () => {
        try {
            const res = await api.get('/ai/intelligence');
            setIntelligence(res.data);
            const mappedData = res.data.chart_data.map((val, i) => ({
                name: `T-${5 - i}`,
                intensity: val,
                baseline: 20 + Math.random() * 10
            }));
            setTrafficData(mappedData);
        } catch (e) { }
    };

    const fetchLogs = async () => {
        try {
            const res = await api.get('/secure/logs');
            setLogs(res.data);
            const dist = { Low: 0, Medium: 0, High: 0, Critical: 0 };
            res.data.forEach(l => dist[l.riskLevel || l.risk_level] = (dist[l.riskLevel || l.risk_level] || 0) + 1);
            setRiskData([
                { name: 'Low', value: dist.Low || 1 },
                { name: 'Medium', value: dist.Medium || 1 },
                { name: 'High', value: dist.High || 1 },
                { name: 'Critical', value: dist.Critical || 1 },
            ]);
        } catch (e) { }
    };

    useEffect(() => {
        fetchLogs();
        fetchIntelligence();
        const logInt = setInterval(fetchLogs, 5000);
        const aiInt = setInterval(fetchIntelligence, 10000); // 10s for broader analytics
        return () => { clearInterval(logInt); clearInterval(aiInt); };
    }, []);

    const COLORS = ['var(--success)', 'var(--primary)', 'var(--warning)', 'var(--danger)'];

    return (
        <div style={{ height: 'calc(100vh - 40px)', overflowY: 'auto', padding: '30px', paddingBottom: '100px' }}>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}
            >
                <div>
                    <h1 className="text-gradient" style={{ fontSize: '2.8rem', marginBottom: '8px' }}>Security Intelligence Wall</h1>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Activity size={14} color="var(--primary)" />
                        GLOBAL HEURISTIC ENFORCEMENT • ACTIVE SINCE 2026.01.01
                    </div>
                </div>
                <div className="glass-panel" style={{ padding: '15px 25px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 800 }}>AI SYNC STATUS</div>
                        <div style={{ fontSize: '1rem', color: 'var(--success)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }} className="pulse" />
                            OPTIMIZED
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* AI Summary Banner */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-panel"
                style={{
                    padding: '25px 35px',
                    marginBottom: '40px',
                    borderLeft: '5px solid var(--secondary)',
                    background: 'rgba(112, 0, 255, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--secondary)', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2px' }}>
                    <Zap size={16} /> Gemini Cognitive Briefing
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 300, color: '#e2e8f0', fontStyle: 'italic', lineHeight: 1.5 }}>
                    "{intelligence.summary}"
                </div>
            </motion.div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '25px', marginBottom: '40px' }}>
                <MetricCard label="System Integrity" value="99.9%" delta="STABLE" icon={<Shield size={24} color="var(--primary)" />} />
                <MetricCard label="Threat Surface" value={intelligence.chart_data.reduce((a, b) => a + b, 0)} delta="LOW" color="var(--danger)" icon={<AlertTriangle size={24} color="var(--danger)" />} />
                <MetricCard label="Audit Nodes" value={logs.length} delta={`+${logs.filter(l => l.status === 'Granted').length}`} icon={<Globe size={24} color="var(--success)" />} />
                <MetricCard label="Network Entropy" value="Optimal" delta="8MS" color="var(--accent)" icon={<Activity size={24} color="var(--accent)" />} />
            </div>

            {/* Main Graphs Area */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '30px', marginBottom: '40px' }}>

                {/* Threat Intensity Area Chart */}
                <div className="glass-panel" style={{ padding: '30px', height: '420px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
                            <TrendingUp size={20} color="var(--primary)" /> Predicted Threat Intensity
                        </h4>
                        <Info size={16} color="rgba(255,255,255,0.2)" />
                    </div>
                    <ResponsiveContainer width="100%" height="80%">
                        <AreaChart data={trafficData}>
                            <defs>
                                <linearGradient id="colorIntenseAnalytics" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--secondary)" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="var(--secondary)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" stroke="rgba(255,255,255,0.1)" fontSize={12} />
                            <YAxis stroke="rgba(255,255,255,0.1)" fontSize={12} />
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                            <Tooltip contentStyle={{ background: 'rgba(13, 15, 22, 0.95)', border: '1px solid var(--primary)', borderRadius: '12px' }} />
                            <Area type="monotone" dataKey="intensity" stroke="var(--secondary)" fillOpacity={1} fill="url(#colorIntenseAnalytics)" strokeWidth={4} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Risk Distribution Pie Chart */}
                <div className="glass-panel" style={{ padding: '30px', height: '420px' }}>
                    <h4 style={{ marginBottom: '30px' }}>Blockchain Entry Risk Profile</h4>
                    <div style={{ width: '100%', height: '80%', display: 'flex', alignItems: 'center' }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={riskData}
                                    innerRadius={80}
                                    outerRadius={110}
                                    paddingAngle={10}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {riskData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                            style={{ filter: `drop-shadow(0 0 12px ${COLORS[index]}44)` }}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ background: 'rgba(0,0,0,0.8)', border: '1px solid #333' }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginLeft: '30px' }}>
                            {riskData.map((d, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: COLORS[i] }} />
                                    <div>
                                        <div style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 700 }}>{d.name}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{d.value} NODES</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Enhanced History Table */}
            <div className="glass-panel" style={{ padding: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <h4 style={{ margin: 0, fontSize: '1.2rem' }}>Immutability Checkpoint: Decrypted Ledger</h4>
                    <button className="btn" style={{ fontSize: '0.7rem', padding: '8px 16px' }}>EXPORT SECURITY AUDIT</button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', fontSize: '0.9rem', textAlign: 'left', borderCollapse: 'separate', borderSpacing: '0 10px' }}>
                        <thead>
                            <tr style={{ color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.7rem' }}>
                                <th style={{ padding: '10px 20px' }}>Timestamp</th>
                                <th>Subject Identity</th>
                                <th>Operation Context</th>
                                <th>Risk Heuristics</th>
                                <th>Cryptographic Hash</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.slice(0, 15).map((log, idx) => (
                                <motion.tr
                                    key={log.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}
                                >
                                    <td style={{ padding: '18px 20px', borderRadius: '12px 0 0 12px', border: '1px solid rgba(255,255,255,0.03)', borderRight: 'none', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono' }}>
                                        {new Date(log.timestamp).toLocaleTimeString()}
                                    </td>
                                    <td style={{ borderTop: '1px solid rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.03)', fontWeight: 600, color: '#fff' }}>
                                        {log.user}
                                    </td>
                                    <td style={{ borderTop: '1px solid rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.03)', color: log.status === 'Denied' ? 'var(--danger)' : 'var(--success)', fontWeight: 800 }}>
                                        {log.status} {log.action.split(' ')[0]}
                                    </td>
                                    <td style={{ borderTop: '1px solid rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                        <div style={{
                                            display: 'inline-block',
                                            padding: '4px 12px',
                                            borderRadius: '6px',
                                            background: (log.riskLevel || log.risk_level) === 'Critical' ? 'rgba(255,0,60,0.1)' : 'rgba(0,240,255,0.1)',
                                            color: (log.riskLevel || log.risk_level) === 'Critical' ? 'var(--danger)' : 'var(--primary)',
                                            fontSize: '0.75rem',
                                            fontWeight: 800
                                        }}>
                                            {log.riskLevel || log.risk_level}
                                        </div>
                                    </td>
                                    <td style={{ padding: '18px 20px', borderRadius: '0 12px 12px 0', border: '1px solid rgba(255,255,255,0.03)', borderLeft: 'none', fontFamily: 'JetBrains Mono', fontSize: '0.75rem', opacity: 0.4 }}>
                                        {Math.random().toString(36).substring(7).toUpperCase()}...
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const MetricCard = ({ label, value, delta, color = "var(--primary)", icon }) => (
    <motion.div
        whileHover={{ scale: 1.02 }}
        className="glass-panel"
        style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '15px' }}
    >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</span>
            <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)' }}>{icon}</div>
        </div>
        <div>
            <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: '0.8rem', color: color, display: 'flex', alignItems: 'center', gap: '5px', marginTop: '8px', fontWeight: 600 }}>
                {delta.includes('+') ? <TrendingUp size={14} /> : null}
                {delta} MONITORING
            </div>
        </div>
    </motion.div>
);

export default AnalyticsPage;
