import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

const AnalyticsPanel = ({ logs }) => {
    const [chartData, setChartData] = useState([]);
    const [pieData, setPieData] = useState([]);
    const [radarData, setRadarData] = useState([]);

    useEffect(() => {
        // Process logs for Line Chart (Requests over Time)
        const timeMap = {};
        const riskMap = {};
        logs.forEach(log => {
            const time = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            timeMap[time] = (timeMap[time] || 0) + 1;

            // Map risk levels to numeric
            const riskLevels = { 'Low': 10, 'Medium': 40, 'High': 70, 'Critical': 100 };
            const rVal = riskLevels[log.risk_level] || 0;
            if (!riskMap[time]) riskMap[time] = { sum: 0, count: 0 };
            riskMap[time].sum += rVal;
            riskMap[time].count += 1;
        });

        const data = Object.keys(timeMap).map(time => ({
            time,
            count: timeMap[time],
            avgRisk: riskMap[time].sum / riskMap[time].count
        })).reverse().slice(0, 10).reverse();

        setChartData(data);

        // Process logs for Pie Chart (Status Distribution)
        const statusMap = { Granted: 0, Denied: 0 };
        logs.forEach(log => {
            if (log.status === 'Granted') statusMap.Granted++;
            else statusMap.Denied++;
        });
        setPieData([
            { name: 'Granted', value: statusMap.Granted },
            { name: 'Denied', value: statusMap.Denied }
        ]);

        // Process Radar Data (Security Vectors)
        const avgRisk = logs.length > 0 ? (logs.reduce((acc, l) => acc + ({ 'Low': 10, 'Medium': 40, 'High': 70, 'Critical': 100 }[l.risk_level] || 0), 0) / logs.length) : 0;
        setRadarData([
            { subject: 'Identity', A: 100 - (avgRisk * 0.8), fullMark: 100 },
            { subject: 'Encryption', A: 95, fullMark: 100 },
            { subject: 'Anomalies', A: 85, fullMark: 100 },
            { subject: 'Integrity', A: 90, fullMark: 100 },
            { subject: 'Biometrics', A: 100, fullMark: 100 },
        ]);

    }, [logs]);

    const COLORS = ['#00ff9d', '#ff003c'];

    return (
        <div className="glass-panel" style={{ padding: '20px', marginTop: '20px' }}>
            <h3 className="text-gradient">Security Analytics Engine</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', height: '250px' }}>

                {/* Line Chart */}
                <div style={{ width: '100%', height: '100%' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#888' }}>Peak Activity & Risk Trend</h4>
                    <ResponsiveContainer>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                            <XAxis dataKey="time" stroke="#666" fontSize={10} />
                            <YAxis stroke="#666" fontSize={10} />
                            <Tooltip contentStyle={{ backgroundColor: '#0d0e12', border: '1px solid var(--glass-border)', borderRadius: '8px' }} />
                            <Line type="monotone" dataKey="count" stroke="var(--primary-color)" strokeWidth={3} dot={{ r: 4, fill: 'var(--primary-color)' }} activeDot={{ r: 8 }} />
                            <Line type="monotone" dataKey="avgRisk" stroke="var(--secondary-color)" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Pie Chart */}
                <div style={{ width: '100%', height: '100%' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#888' }}>Access Outcomes</h4>
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie
                                data={pieData}
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

            </div>

            {/* Radar Chart Section */}
            <div style={{ marginTop: '30px', borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
                <h4 style={{ margin: '0 0 20px 0', fontSize: '0.9rem', color: '#888', textAlign: 'center' }}>Multi-Dimensional Security Vector Analysis</h4>
                <div style={{ height: '300px', width: '100%' }}>
                    <ResponsiveContainer>
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                            <PolarGrid stroke="#333" />
                            <PolarAngleAxis dataKey="subject" stroke="#888" fontSize={12} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar
                                name="Security Level"
                                dataKey="A"
                                stroke="var(--primary-color)"
                                fill="var(--primary-color)"
                                fillOpacity={0.4}
                            />
                            <Tooltip contentStyle={{ backgroundColor: '#0d0e12', border: '1px solid var(--glass-border)' }} />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsPanel;
