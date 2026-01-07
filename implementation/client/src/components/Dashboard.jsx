import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import DeviceSimulator from './DeviceSimulator';
import AuditLog from './AuditLog';
import AnalyticsPanel from './AnalyticsPanel';
import api from '../services/api';
import { FileText, Shield, MonitorX, Key } from 'lucide-react';
import { notifySuccess, notifyError, notifyInfo } from '../services/tost';

const Dashboard = () => {
    const { user } = useContext(AuthContext);
    const [accessResult, setAccessResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [triggerLog, setTriggerLog] = useState(0);
    const [logs, setLogs] = useState([]);

    // Mock fetching logs for analytics
    const fetchLogsForAnalytics = async () => {
        try {
            const res = await api.get('/secure/logs');
            setLogs(res.data);
        } catch (e) { }
    };

    // Sync log fetch
    React.useEffect(() => {
        fetchLogsForAnalytics();
        const interval = setInterval(fetchLogsForAnalytics, 5000);
        return () => clearInterval(interval);
    }, [triggerLog]);


    const accessResource = async (endpoint) => {
        setLoading(true);
        setAccessResult(null);
        try {
            notifyInfo(`Requesting access to ${endpoint}...`);
            const res = await api.get(`/secure/${endpoint}`);
            setAccessResult({ success: true, message: res.data.message, riskLevel: res.data.riskLevel, data: res.data.data });
            notifySuccess('Access Granted');
        } catch (err) {
            setAccessResult({
                success: false,
                message: err.response?.data?.error || 'Access Denied',
                issues: err.response?.data?.issues
            });
            notifyError(err.response?.data?.error || 'Access Denied');
        } finally {
            setLoading(false);
            setTriggerLog(prev => prev + 1);
        }
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', height: '100%' }}>

            {/* Main Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>

                {/* Header */}
                <div className="glass-panel" style={{ padding: '20px' }}>
                    <h1 className="text-gradient">Welcome back, {user?.username}</h1>
                    <p style={{ color: '#888' }}>Zero Trust Policy Enforcer Active. Your session ID: {Math.random().toString(36).substring(7)}</p>
                </div>

                {/* Device Controls */}
                <DeviceSimulator />

                {/* Resources */}
                <div className="glass-panel" style={{ padding: '20px' }}>
                    <h3 className="text-gradient">Protected Assets</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>

                        <button className="btn" onClick={() => accessResource('public-resource')} style={{ height: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                            <FileText size={24} />
                            <span>Public File</span>
                        </button>

                        <button className="btn" onClick={() => accessResource('confidential-resource')} style={{ height: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                            <Shield size={24} />
                            <span>Confidential</span>
                        </button>

                        <button className="btn" onClick={() => accessResource('admin-panel')} style={{ height: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', borderColor: 'var(--secondary-color)', color: 'var(--secondary-color)' }}>
                            <Key size={24} />
                            <span>Admin Panel</span>
                        </button>

                        <button className="btn btn-danger" onClick={() => accessResource('server-room')} style={{ height: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                            <MonitorX size={24} />
                            <span>Server Room</span>
                        </button>

                    </div>

                    {/* Result Display */}
                    {accessResult && (
                        <div style={{
                            marginTop: '20px',
                            padding: '20px',
                            borderRadius: '12px',
                            background: accessResult.success ? 'rgba(0, 255, 157, 0.1)' : 'rgba(255, 0, 60, 0.1)',
                            border: `1px solid ${accessResult.success ? 'var(--success-color)' : 'var(--danger-color)'}`
                        }}>
                            <h2 style={{ color: accessResult.success ? 'var(--success-color)' : 'var(--danger-color)', marginTop: 0 }}>
                                {accessResult.success ? 'ACCESS GRANTED' : 'ACCESS BLOCKED'}
                            </h2>
                            <p>{accessResult.message}</p>
                            {accessResult.issues && (
                                <ul>{accessResult.issues.map((issue, i) => <li key={i}>{issue}</li>)}</ul>
                            )}
                        </div>
                    )}
                </div>

                {/* New Analytics Panel */}
                <AnalyticsPanel logs={logs} />

            </div>

            {/* Sidebar: Logs */}
            <div style={{ height: '100%', overflow: 'hidden' }}>
                <AuditLog refreshTrigger={triggerLog} />
            </div>

        </div>
    );
};

export default Dashboard;
