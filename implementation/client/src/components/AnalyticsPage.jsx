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

    // Mock Data generation for rich visuals if logs are sparse
    const [trafficData, setTrafficData] = useState([]);
    const [riskData, setRiskData] = useState([]);

    useEffect(() => {
        // Fetch real logs
        const fetchLogs = async () => {
            try {
                const res = await api.get('/secure/logs');
                setLogs(res.data);
            } catch (e) { }
        };
        fetchLogs();

        // Generate Mock Trend Data
        const mockTrend = Array.from({ length: 24 }, (_, i) => ({
            name: `${i}:00`,
            safe: Math.floor(Math.random() * 100) + 50,
            threats: Math.floor(Math.random() * 30),
            risk: Math.floor(Math.random() * 80)
        }));
        setTrafficData(mockTrend);

        const mockRisk = [
            { name: 'Low', value: 400 },
            { name: 'Medium', value: 300 },
            { name: 'High', value: 100 },
            { name: 'Critical', value: 50 },
        ];
        setRiskData(mockRisk);

    }, []);

    const COLORS = ['#00ff9d', '#00f0ff', '#fcee0a', '#ff003c'];

    return (
        <div style={{ height: '100%', overflowY: 'auto' }}>
            <h1 className="text-gradient">Security Intelligence & Analytics</h1>
            <p style={{ color: '#888', marginBottom: '30px' }}>Real-time threat vectors and network telemetry.</p>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
                <MetricCard label="Total Requests" value="14,205" delta="+12%" icon={<Activity size={24} color="#00f0ff" />} />
                <MetricCard label="Threats Blocked" value="342" delta="-5%" color="#ff003c" icon={<Shield size={24} color="#ff003c" />} />
                <MetricCard label="Active Sessions" value="28" delta="+2" icon={<Globe size={24} color="#00ff9d" />} />
                <MetricCard label="Avg Risk Score" value="12/100" delta="-2pts" color="#fcee0a" icon={<AlertTriangle size={24} color="#fcee0a" />} />
            </div>

            {/* Main Charts Area */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '20px' }}>

                {/* Network Traffic Area Chart */}
                <div className="glass-panel" style={{ padding: '20px', height: '300px' }}>
                    <h4>Network Traffic Volume (24h)</h4>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trafficData}>
                            <defs>
                                <linearGradient id="colorSafe" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#00ff9d" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#00ff9d" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorThreat" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ff003c" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#ff003c" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" stroke="#666" />
                            <YAxis stroke="#666" />
                            <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                            <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} />
                            <Area type="monotone" dataKey="safe" stroke="#00ff9d" fillOpacity={1} fill="url(#colorSafe)" />
                            <Area type="monotone" dataKey="threats" stroke="#ff003c" fillOpacity={1} fill="url(#colorThreat)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Risk Distribution Pie */}
                <div className="glass-panel" style={{ padding: '20px', height: '300px' }}>
                    <h4>Threat Risk Distribution</h4>
                    <div style={{ width: '100%', height: '80%' }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={riskData}
                                    innerRadius={60}
                                    outerRadius={80}
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
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', fontSize: '0.8rem' }}>
                            <span style={{ color: COLORS[0] }}>Low</span>
                            <span style={{ color: COLORS[1] }}>Medium</span>
                            <span style={{ color: COLORS[2] }}>High</span>
                            <span style={{ color: COLORS[3] }}>Critical</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Secondary Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

                {/* Anomaly Detection Scatter Simulation (Bar here for simplicity) */}
                <div className="glass-panel" style={{ padding: '20px', height: '250px' }}>
                    <h4>Anomaly Frequency by Hour</h4>
                    <ResponsiveContainer width="100%" height="90%">
                        <BarChart data={trafficData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                            <XAxis dataKey="name" stroke="#666" />
                            <YAxis stroke="#666" />
                            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} />
                            <Bar dataKey="risk" fill="#fcee0a" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Recent Raw Logs */}
                <div className="glass-panel" style={{ padding: '20px', height: '250px', overflowY: 'auto' }}>
                    <h4>Review Latest Interventions</h4>
                    <table style={{ width: '100%', fontSize: '0.8rem', textAlign: 'left', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                                <th style={{ padding: '10px 0' }}>Time</th>
                                <th>User</th>
                                <th>Action</th>
                                <th>Risk</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.slice(0, 10).map((log) => (
                                <tr key={log._id} style={{ borderBottom: '1px solid #222' }}>
                                    <td style={{ padding: '8px 0' }}>{new Date(log.timestamp).toLocaleTimeString()}</td>
                                    <td>{log.user}</td>
                                    <td>{log.action.split(' ')[0]}</td>
                                    <td style={{ color: log.riskLevel === 'Critical' ? '#ff003c' : '#00ff9d' }}>{log.riskLevel}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

            </div>

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
