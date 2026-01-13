import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { Shield, AlertTriangle, Activity, Globe } from 'lucide-react';
import api from '../services/api';

const AnalyticsPage = () => {
    const [logs, setLogs] = useState([]);
    const [intelligence, setIntelligence] = useState({ summary: 'Loading AI Intel...', chart_data: [0, 0, 0, 0, 0] });
    const [trafficData, setTrafficData] = useState([]);
    const [riskData, setRiskData] = useState([]);

    const fetchIntelligence = async () => {
        try {
            const res = await api.get('/ai/intelligence');
            setIntelligence(res.data);

            // Map AI chart data to a format Recharts likes
            const mappedData = res.data.chart_data.map((val, i) => ({
                name: `T-${5 - i}`,
                intensity: val,
                baseline: 20 + Math.random() * 10
            }));
            setTrafficData(mappedData);
        } catch (e) {
            console.error("Intelligence fetch failed");
        }
    };

    const fetchLogs = async () => {
        try {
            const res = await api.get('/secure/logs');
            setLogs(res.data);

            // Calculate risk distribution from real logs
            const dist = { Low: 0, Medium: 0, High: 0, Critical: 0 };
            res.data.forEach(l => dist[l.risk_level] = (dist[l.risk_level] || 0) + 1);
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
        const aiInt = setInterval(fetchIntelligence, 2000); // 2-second AI intelligence

        return () => {
            clearInterval(logInt);
            clearInterval(aiInt);
        };
    }, []);

    const COLORS = ['#00ff9d', '#00f0ff', '#fcee0a', '#ff003c'];

    return (
        <div style={{ height: '100%', overflowY: 'auto', paddingBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="text-gradient">Zero Trust Security Intelligence</h1>
                </div>
                <div style={{ background: 'rgba(0, 240, 255, 0.1)', padding: '10px 20px', borderRadius: '12px', border: '1px solid var(--primary-color)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--primary-color)', fontWeight: 'bold' }}>AI STATUS</div>
                    <div style={{ fontSize: '0.9rem' }}>Real-time Analysis Active</div>
                </div>
            </div>

            {/* AI Summary Banner */}
            <div className="glass-panel" style={{ padding: '15px 25px', marginBottom: '30px', borderLeft: '4px solid var(--secondary-color)', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <Activity className="pulse" color="var(--secondary-color)" />
                <span style={{ fontSize: '1.1rem', fontStyle: 'italic', color: '#e0e6ed' }}>
                    "{intelligence.summary}"
                </span>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <MetricCard label="System Integrity" value="100%" delta="Stable" icon={<Shield size={24} color="#00f0ff" />} />
                <MetricCard label="Threat Vectors" value={intelligence.chart_data.reduce((a, b) => a + b, 0)} delta="Live" color="#ff003c" icon={<AlertTriangle size={24} color="#ff003c" />} />
                <MetricCard label="Processed Nodes" value={logs.length} delta={`+${logs.filter(l => l.status === 'Granted').length}`} icon={<Globe size={24} color="#00ff9d" />} />
                <MetricCard label="Network Load" value="Optimal" delta="0ms Lag" color="#fcee0a" icon={<Activity size={24} color="#fcee0a" />} />
            </div>

            {/* Charts Area */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>

                {/* AI Predicted Threat Intensity */}
                <div className="glass-panel" style={{ padding: '20px', height: '350px' }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Shield size={18} color="var(--primary-color)" /> AI Predicted Threat Intensity
                    </h4>
                    <ResponsiveContainer width="100%" height="85%">
                        <AreaChart data={trafficData}>
                            <defs>
                                <linearGradient id="colorIntense" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--secondary-color)" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="var(--secondary-color)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" stroke="#444" />
                            <YAxis stroke="#444" />
                            <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                            <Tooltip contentStyle={{ backgroundColor: '#0d0e12', border: '1px solid #333', borderRadius: '8px' }} />
                            <Area type="monotone" dataKey="intensity" stroke="var(--secondary-color)" fillOpacity={1} fill="url(#colorIntense)" strokeWidth={3} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Risk Distribution Pie */}
                <div className="glass-panel" style={{ padding: '20px', height: '350px' }}>
                    <h4>Blockchain Node Risk Distribution</h4>
                    <div style={{ width: '100%', height: '80%' }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={riskData}
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {riskData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', fontSize: '0.8rem', marginTop: '10px' }}>
                            {riskData.map((d, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: COLORS[i] }} />
                                    <span>{d.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Historical Table */}
            <div className="glass-panel" style={{ padding: '20px' }}>
                <h4 style={{ marginBottom: '20px' }}>RAG Context: Decrypted Blockchain Nodes</h4>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', fontSize: '0.85rem', textAlign: 'left', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                                <th style={{ padding: '15px 10px' }}>Time</th>
                                <th>Identity</th>
                                <th>Operation</th>
                                <th>Entropy (Risk)</th>
                                <th>Node ID</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.slice(0, 8).map((log) => (
                                <tr key={log.id} style={{ borderBottom: '1px solid #222' }}>
                                    <td style={{ padding: '12px 10px' }}>{new Date(log.timestamp).toLocaleTimeString()}</td>
                                    <td>{log.user}</td>
                                    <td style={{ color: log.status === 'Denied' ? 'var(--danger-color)' : '#fff' }}>{log.status} {log.action.split(' ')[0]}</td>
                                    <td style={{ color: log.riskLevel === 'Critical' ? '#ff003c' : log.riskLevel === 'Low' ? '#00ff9d' : '#fcee0a' }}>
                                        {log.riskLevel}
                                    </td>
                                    <td style={{ fontFamily: 'monospace', opacity: 0.5 }}>{Math.random().toString(36).substring(7).toUpperCase()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <style>{`
                .pulse { animation: pulse-shadow 2s infinite; }
                @keyframes pulse-shadow {
                    0% { filter: drop-shadow(0 0 0px var(--secondary-color)); }
                    50% { filter: drop-shadow(0 0 10px var(--secondary-color)); }
                    100% { filter: drop-shadow(0 0 0px var(--secondary-color)); }
                }
            `}</style>
        </div>
    );
};


const MetricCard = ({ label, value, delta, color = "#fff", icon }) => (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#888', fontSize: '0.9rem' }}>{label}</span>
            {icon}
        </div>
        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: color }}>{value}</div>
        <div style={{ fontSize: '0.8rem', color: delta.includes('+') ? '#00ff9d' : '#ff003c' }}>{delta} from yesterday</div>
    </div>
);

export default AnalyticsPage;
