import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const AnalyticsPanel = ({ logs }) => {
    const [chartData, setChartData] = useState([]);
    const [pieData, setPieData] = useState([]);

    useEffect(() => {
        // Process logs for Line Chart (Requests over Time)
        const timeMap = {};
        logs.forEach(log => {
            const time = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            timeMap[time] = (timeMap[time] || 0) + 1;
        });
        const data = Object.keys(timeMap).map(time => ({ time, count: timeMap[time] })).reverse().slice(0, 10).reverse();
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

    }, [logs]);

    const COLORS = ['#00ff9d', '#ff003c'];

    return (
        <div className="glass-panel" style={{ padding: '20px', marginTop: '20px' }}>
            <h3 className="text-gradient">Security Analytics Engine</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', height: '250px' }}>

                {/* Line Chart */}
                <div style={{ width: '100%', height: '100%' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#888' }}>Traffic Volume (Last 10m)</h4>
                    <ResponsiveContainer>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis dataKey="time" stroke="#666" fontSize={12} />
                            <YAxis stroke="#666" fontSize={12} />
                            <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} />
                            <Line type="monotone" dataKey="count" stroke="#00f0ff" strokeWidth={2} dot={false} />
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
        </div>
    );
};

export default AnalyticsPanel;
