import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Activity, Server, Shield, AlertTriangle, Monitor, CheckCircle, Smartphone, Lock, Globe, Clock, Zap, Database } from 'lucide-react';

const ExamMetricsPanel = () => {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const res = await api.get('/system/metrics');
                setMetrics(res.data);
                setLoading(false);
            } catch (e) {
                console.error("Failed to fetch metrics", e);
                setLoading(false);
            }
        };

        fetchMetrics();
        const interval = setInterval(fetchMetrics, 2000); // 2s polling
        return () => clearInterval(interval);
    }, []);

    if (loading || !metrics) {
        return <div style={{ color: '#888', textAlign: 'center', padding: '20px' }}>Loading system metrics...</div>;
    }

    const SectionHeader = ({ icon: Icon, title, color }) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', paddingBottom: '10px', borderBottom: `1px solid ${color}33` }}>
            <Icon size={18} color={color} />
            <h4 style={{ margin: 0, color: color, textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>{title}</h4>
        </div>
    );

    const MetricRow = ({ label, value, highlight = false, alert = false }) => (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.85rem' }}>
            <span style={{ color: '#aaa' }}>{label}</span>
            <span style={{
                color: alert ? 'var(--danger)' : highlight ? 'var(--success)' : '#fff',
                fontWeight: highlight || alert ? 'bold' : 'normal',
                fontFamily: 'monospace'
            }}>{value}</span>
        </div>
    );

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

            {/* FRONTEND COLUMN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Monitor size={24} color="var(--primary)" /> Frontend Telemetry
                </h3>

                {/* Performance */}
                <div className="glass-panel" style={{ padding: '20px' }}>
                    <SectionHeader icon={Zap} title="Performance" color="var(--primary)" />
                    <MetricRow label="Page Load Time" value={metrics.frontend_metrics.performance.page_load_time} />
                    <MetricRow label="API Response Time" value={metrics.frontend_metrics.performance.api_response_time} />
                    <MetricRow label="Device Check Latency" value={metrics.frontend_metrics.performance.device_check_latency} highlight />
                    <MetricRow label="Dashboard Refresh" value={metrics.frontend_metrics.performance.dashboard_refresh_time} />
                </div>

                {/* Reliability */}
                <div className="glass-panel" style={{ padding: '20px' }}>
                    <SectionHeader icon={Activity} title="Reliability" color="#f39c12" />
                    <MetricRow label="Failed API Requests" value={metrics.frontend_metrics.reliability.failed_api_requests} alert={metrics.frontend_metrics.reliability.failed_api_requests > 5} />
                    <MetricRow label="UI Errors / Crashes" value={metrics.frontend_metrics.reliability.ui_errors} alert={metrics.frontend_metrics.reliability.ui_errors > 0} />
                    <MetricRow label="Session Timeouts" value={metrics.frontend_metrics.reliability.session_timeout_count} />
                </div>

                {/* Device Monitoring */}
                <div className="glass-panel" style={{ padding: '20px', border: '1px solid var(--primary)' }}>
                    <SectionHeader icon={Smartphone} title="Device Monitoring" color="var(--primary)" />
                    <MetricRow label="Device Checks / Sec" value={metrics.frontend_metrics.device_monitoring.checks_per_sec} highlight />
                    <MetricRow label="Success vs Failed" value={metrics.frontend_metrics.device_monitoring.success_vs_failed} />
                    <MetricRow label="Trust Status" value={metrics.frontend_metrics.device_monitoring.trust_status} highlight />
                    <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#fff' }}>Trust Score</span>
                            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--success)' }}>{metrics.frontend_metrics.device_monitoring.trust_score}</span>
                        </div>
                        <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', marginTop: '5px', borderRadius: '2px' }}>
                            <div style={{ width: metrics.frontend_metrics.device_monitoring.trust_score.split('/')[0] + '%', height: '100%', background: 'var(--success)', borderRadius: '2px' }}></div>
                        </div>
                    </div>
                </div>

                {/* Security / Access */}
                <div className="glass-panel" style={{ padding: '20px' }}>
                    <SectionHeader icon={Lock} title="Security & Access" color="var(--secondary)" />
                    <MetricRow label="Login Success vs Fail" value={metrics.frontend_metrics.security.login_success_vs_fail} />
                    <MetricRow label="Access Granted" value={metrics.frontend_metrics.security.access_granted} highlight />
                    <MetricRow label="Access Denied" value={metrics.frontend_metrics.security.access_denied} alert />
                    <MetricRow label="Antivirus OFF Alerts" value={metrics.frontend_metrics.security.antivirus_off_alerts} alert={metrics.frontend_metrics.security.antivirus_off_alerts > 0} />
                    <MetricRow label="IP/Geo Mismatch" value={metrics.frontend_metrics.security.ip_geo_mismatch} alert={metrics.frontend_metrics.security.ip_geo_mismatch > 0} />
                </div>
            </div>

            {/* BACKEND COLUMN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Server size={24} color="var(--secondary)" /> Backend Telemetry
                </h3>

                {/* Performance */}
                <div className="glass-panel" style={{ padding: '20px' }}>
                    <SectionHeader icon={Zap} title="Performance" color="var(--secondary)" />
                    <MetricRow label="API Response Time" value={metrics.backend_metrics.performance.api_response_time} />
                    <MetricRow label="Requests / Sec" value={metrics.backend_metrics.performance.requests_per_sec} />
                    <MetricRow label="Device Checks / Sec" value={metrics.backend_metrics.performance.device_checks_processed_sec} highlight />
                    <MetricRow label="Avg Verification Time" value={metrics.backend_metrics.performance.avg_verification_time} />
                    <MetricRow label="DB Query Time" value={metrics.backend_metrics.performance.db_query_time} />
                    <MetricRow label="CPU Usage" value={metrics.backend_metrics.performance.cpu_usage} />
                    <MetricRow label="Memory Usage" value={metrics.backend_metrics.performance.memory_usage} />
                </div>

                {/* Reliability */}
                <div className="glass-panel" style={{ padding: '20px' }}>
                    <SectionHeader icon={Clock} title="Reliability" color="#e74c3c" />
                    <MetricRow label="Server Uptime" value={metrics.backend_metrics.reliability.uptime} highlight />
                    <MetricRow label="Error Rate (4xx/5xx)" value={metrics.backend_metrics.reliability.error_rate} alert={parseFloat(metrics.backend_metrics.reliability.error_rate) > 0.1} />
                    <MetricRow label="Failed Validations" value={metrics.backend_metrics.reliability.failed_validations} />
                    <MetricRow label="Service Crashes" value={metrics.backend_metrics.reliability.service_crashes} alert={metrics.backend_metrics.reliability.service_crashes > 0} />
                </div>

                {/* Security / Zero Trust */}
                <div className="glass-panel" style={{ padding: '20px', border: '1px solid var(--secondary)', background: 'rgba(112, 0, 255, 0.05)' }}>
                    <SectionHeader icon={Shield} title="Zero Trust Security Core" color="var(--secondary)" />
                    <MetricRow label="Total Device Checks" value={metrics.backend_metrics.zero_trust_security.total_checks} highlight />
                    <MetricRow label="IP Validation Failures" value={metrics.backend_metrics.zero_trust_security.ip_failures} alert={metrics.backend_metrics.zero_trust_security.ip_failures > 5} />
                    <MetricRow label="Antivirus Failures" value={metrics.backend_metrics.zero_trust_security.antivirus_failures} alert={metrics.backend_metrics.zero_trust_security.antivirus_failures > 0} />
                    <MetricRow label="Geo-location Violations" value={metrics.backend_metrics.zero_trust_security.geo_violations} alert={metrics.backend_metrics.zero_trust_security.geo_violations > 2} />
                    <MetricRow label="Trust Score (Device)" value={metrics.backend_metrics.zero_trust_security.trust_score_device} highlight />
                    <MetricRow label="Blocked Requests" value={metrics.backend_metrics.zero_trust_security.blocked_requests} alert />
                    <MetricRow label="Restricted Website Attempts" value={metrics.backend_metrics.zero_trust_security.restricted_attempts} alert />
                    <MetricRow label="Unauthorized Access" value={metrics.backend_metrics.zero_trust_security.unauthorized_access} alert={metrics.backend_metrics.zero_trust_security.unauthorized_access > 0} />
                    <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        <MetricRow label="Risk Score Calculation" value={metrics.backend_metrics.zero_trust_security.risk_score} alert={metrics.backend_metrics.zero_trust_security.risk_score > 50} />
                        <MetricRow label="Logs / Alerts Generated" value={metrics.backend_metrics.zero_trust_security.logs_generated} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExamMetricsPanel;
