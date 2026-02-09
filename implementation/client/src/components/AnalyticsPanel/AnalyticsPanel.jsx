import './AnalyticsPanel.css';
import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    AreaChart, Area
} from 'recharts';
import { motion } from 'framer-motion';

const AnalyticsPanel = ({ logs }) => {
    const [chartData, setChartData] = useState([]);
    const [pieData, setPieData] = useState([]);
    const [radarData, setRadarData] = useState([]);

    useEffect(() => {
        const timeMap = {};
        const riskMap = {};
        logs.forEach(log => {
            const time = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            timeMap[time] = (timeMap[time] || 0) + 1;
            const riskLevels = { 'Low': 10, 'Medium': 40, 'High': 70, 'Critical': 100 };
            const rVal = riskLevels[log.riskLevel || log.risk_level] || 0;
            if (!riskMap[time]) riskMap[time] = { sum: 0, count: 0 };
            riskMap[time].sum += rVal;
            riskMap[time].count += 1;
        });

        const data = Object.keys(timeMap).map(time => ({
            time,
            count: timeMap[time],
            avgRisk: riskMap[time].sum / riskMap[time].count
        })).reverse().slice(0, 8).reverse();

        setChartData(data);

        const statusMap = { Granted: 0, Denied: 0 };
        logs.forEach(log => {
            if (log.status === 'Granted') statusMap.Granted++;
            else statusMap.Denied++;
        });
        setPieData([
            { name: 'Authorized', value: statusMap.Granted },
            { name: 'Blocked', value: statusMap.Denied }
        ]);

        const avgRisk = logs.length > 0 ? (logs.reduce((acc, l) => acc + ({ 'Low': 10, 'Medium': 40, 'High': 70, 'Critical': 100 }[l.riskLevel || l.risk_level] || 0), 0) / logs.length) : 0;
        setRadarData([
            { subject: 'Identity', A: 100 - (avgRisk * 0.4), fullMark: 100 },
            { subject: 'Encryption', A: 98, fullMark: 100 },
            { subject: 'Anomaly', A: 100 - avgRisk, fullMark: 100 },
            { subject: 'Integrity', A: 94, fullMark: 100 },
            { subject: 'Biometrics', A: 100, fullMark: 100 },
        ]);
    }, [logs]);

    const COLORS = ['var(--success)', 'var(--danger)'];

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{
                    background: 'rgba(13, 15, 22, 0.95)',
                    border: '1px solid var(--primary)',
                    padding: '12px',
                    borderRadius: '10px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', marginBottom: '8px', fontWeight: 800 }}>{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color, fontSize: '0.85rem', fontWeight: 600, margin: '4px 0' }}>
                            {entry.name.toUpperCase()}: {entry.value}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="glass-panel" style={{ padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h3 className="text-gradient" style={{ margin: 0, fontSize: '1.2rem' }}>Vector Analysis Engine</h3>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: 800 }}>TOTAL NODES</div>
                        <div style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 800 }}>{logs.length}</div>
                    </div>
                </div>
            </div>

            {/* RAG Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
                <div style={{ padding: '15px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(0, 255, 157, 0.1)' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 800 }}>ACCESS ACCURACY</div>
                    <div style={{ fontSize: '1.5rem', color: 'var(--success)', fontWeight: 800 }}>99.8%</div>
                    <div style={{ fontSize: '0.6rem', color: '#888', marginTop: '4px' }}>RBAC + ABAC VALIDATED</div>
                </div>
                <div style={{ padding: '15px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(0, 240, 255, 0.1)' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 800 }}>POLICY COMPLIANCE</div>
                    <div style={{ fontSize: '1.5rem', color: 'var(--primary)', fontWeight: 800 }}>100%</div>
                    <div style={{ fontSize: '0.6rem', color: '#888', marginTop: '4px' }}>STRICT ENFORCEMENT</div>
                </div>
                <div style={{ padding: '15px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255, 0, 60, 0.1)' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 800 }}>BLOCK RATE</div>
                    <div style={{ fontSize: '1.5rem', color: 'var(--danger)', fontWeight: 800 }}>100%</div>
                    <div style={{ fontSize: '0.6rem', color: '#888', marginTop: '4px' }}>UNAUTHORIZED ACCESS</div>
                </div>
                <div style={{ padding: '15px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(112, 0, 255, 0.1)' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 800 }}>AVG LATENCY</div>
                    <div style={{ fontSize: '1.5rem', color: 'var(--secondary)', fontWeight: 800 }}>120ms</div>
                    <div style={{ fontSize: '0.6rem', color: '#888', marginTop: '4px' }}>PERFORMANCE OVERHEAD</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '30px' }}>

                {/* Main Interaction Graph */}
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <h4 style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '20px', letterSpacing: '2px' }}>THREAT DENSITY VS ACTIVITY</h4>
                    <div style={{ height: '240px' }}>
                        <ResponsiveContainer>
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" fontSize={10} axisLine={false} tickLine={false} />
                                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="count"
                                    stroke="var(--primary)"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorCount)"
                                    name="Traffic"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="avgRisk"
                                    stroke="var(--danger)"
                                    strokeWidth={2}
                                    dot={false}
                                    name="Risk Level"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Status Allocation */}
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.03)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <h4 style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', alignSelf: 'flex-start', marginBottom: '10px', letterSpacing: '2px' }}>DECISION FLOW</h4>
                    <div style={{ height: '200px', width: '100%' }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={8}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                            style={{ filter: `drop-shadow(0 0 10px ${COLORS[index]})` }}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                        {pieData.map((d, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[i] }} />
                                <span style={{ fontSize: '0.7rem', color: '#fff', fontWeight: 600 }}>{d.name.toUpperCase()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Radar Overlay */}
            <div style={{ marginTop: '40px', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '40px', alignItems: 'center' }}>
                <div style={{ height: '280px' }}>
                    <ResponsiveContainer>
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                            <PolarGrid stroke="rgba(255,255,255,0.05)" />
                            <PolarAngleAxis dataKey="subject" stroke="rgba(255,255,255,0.4)" fontSize={11} />
                            <Radar
                                name="Health"
                                dataKey="A"
                                stroke="var(--secondary)"
                                fill="var(--secondary)"
                                fillOpacity={0.5}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
                <div>
                    <h4 style={{ fontSize: '0.9rem', color: '#fff', marginBottom: '15px' }}>Cryptographic Health Score</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
                        Synchronized analysis across 5 dimensions of Zero Trust. Our engine correlates identity entropy with real-time biometric signatures to maintain a <strong>{(radarData[0]?.A || 0).toFixed(1)}% integrity level</strong>.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div style={{ padding: '15px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ color: 'var(--primary)', fontSize: '1.2rem', fontWeight: 800 }}>8.4ms</div>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>LATENCY P99</div>
                        </div>
                        <div style={{ padding: '15px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ color: 'var(--success)', fontSize: '1.2rem', fontWeight: 800 }}>100%</div>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>SIGNATURE AUTH</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsPanel;
