import './PoliciesPage.css';
import React, { useState } from 'react';
import { ToggleLeft, ToggleRight, Save, RotateCcw, Shield, ShieldAlert, Cpu, Settings as SettingsIcon, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';
import { notifySuccess } from '../../services/toast';

const PoliciesPage = () => {
    const [settings, setSettings] = useState({
        enforceMFA: true,
        geoBlocking: true,
        deviceHealthCheck: true,
        sessionTimeout: 15,
        riskThreshold: 70,
        maintenanceMode: false,
    });

    const toggle = (key) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = () => {
        notifySuccess('Security Protocols Synchronized');
    };

    return (
        <div style={{ height: 'calc(100vh - 40px)', overflowY: 'auto', padding: '30px', paddingBottom: '100px' }}>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: '40px' }}
            >
                <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Security Policy Enforcer</h1>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <SettingsIcon size={14} color="var(--primary)" />
                    NIST 800-207 ZERO TRUST COMPLIANCE PANEL
                </div>
            </motion.div>

            <div style={{ maxWidth: '900px', display: 'flex', flexDirection: 'column', gap: '30px' }}>

                {/* Auth & Access Section */}
                <div className="glass-panel" style={{ padding: '35px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '30px' }}>
                        <Terminal size={20} color="var(--primary)" />
                        <h3 className="text-gradient" style={{ margin: 0, fontSize: '1.2rem' }}>Access & Identity Protocols</h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                        <ToggleItem
                            label="Mandatory Multi-Factor Handshake"
                            description="Enforce cryptographic TOTP or Biometric verification for all subject entries."
                            active={settings.enforceMFA}
                            onClick={() => toggle('enforceMFA')}
                        />
                        <ToggleItem
                            label="Heuristic Geo-Fencing"
                            description="Block ingress requests from blacklisted network regions and TOR exit nodes."
                            active={settings.geoBlocking}
                            onClick={() => toggle('geoBlocking')}
                        />
                        <ToggleItem
                            label="Continuous Endpoint Telemetry"
                            description="Baseline OS integrity and antivirus health on every micro-request."
                            active={settings.deviceHealthCheck}
                            onClick={() => toggle('deviceHealthCheck')}
                        />
                    </div>
                </div>

                {/* Hybrid Access Control Section */}
                <div className="glass-panel" style={{ padding: '35px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '30px' }}>
                        <Shield size={20} color="var(--primary)" />
                        <h3 className="text-gradient" style={{ margin: 0, fontSize: '1.2rem' }}>Hybrid Access Control (RBAC + ABAC)</h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                        <ToggleItem
                            label="Role-Based Access Control (RBAC)"
                            description="Enforce strict role boundaries (Admin, Dev, Guest) for all resource requests."
                            active={true}
                            onClick={() => { }}
                        />
                        <ToggleItem
                            label="Attribute-Based Access Control (ABAC)"
                            description="Dynamically evaluate Time, Location, Device Health, and Request Context."
                            active={true}
                            onClick={() => { }}
                        />
                        <ToggleItem
                            label="Risk-Adaptive Authorization"
                            description="Real-time adjustment of permissions based on current threat score."
                            active={true}
                            onClick={() => { }}
                        />
                    </div>
                </div>

                {/* Risk Engine Config */}
                <div className="glass-panel" style={{ padding: '35px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '30px' }}>
                        <Cpu size={20} color="var(--primary)" />
                        <h3 className="text-gradient" style={{ margin: 0, fontSize: '1.2rem' }}>Risk Scoring Heuristics</h3>
                    </div>

                    <div style={{ marginBottom: '40px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                            <div>
                                <div style={{ fontSize: '1rem', color: '#fff', fontWeight: 600 }}>Breach Sensitivity Threshold</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Score &gt; {settings.riskThreshold} will trigger immediate isolation.</div>
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>{settings.riskThreshold}</div>
                        </div>
                        <input
                            type="range"
                            min="10" max="100"
                            value={settings.riskThreshold}
                            onChange={(e) => setSettings({ ...settings, riskThreshold: e.target.value })}
                            style={{
                                appearance: 'none',
                                width: '100%',
                                height: '6px',
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: '10px',
                                outline: 'none',
                                cursor: 'pointer'
                            }}
                        />
                    </div>

                    <div>
                        <div style={{ fontSize: '1rem', color: '#fff', fontWeight: 600, marginBottom: '5px' }}>TTL Session Buffer (Minutes)</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '15px' }}>Cryptographic session validity before re-handshake.</div>
                        <input
                            type="number"
                            value={settings.sessionTimeout}
                            onChange={(e) => setSettings({ ...settings, sessionTimeout: e.target.value })}
                            style={{
                                width: '120px',
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid var(--glass-border)',
                                color: 'var(--primary)',
                                padding: '12px',
                                borderRadius: '10px',
                                fontSize: '1.1rem',
                                fontWeight: 800,
                                textAlign: 'center'
                            }}
                        />
                    </div>
                </div>

                {/* Disaster Recovery / Lockdown */}
                <div className="glass-panel" style={{ padding: '35px', border: '1px solid rgba(255, 0, 60, 0.2)', background: 'rgba(255, 0, 60, 0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '25px' }}>
                        <ShieldAlert size={20} color="var(--danger)" />
                        <h3 style={{ color: 'var(--danger)', margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>VULNERABILITY LEVEL: CRITICAL</h3>
                    </div>

                    <ToggleItem
                        label="Global System Lockdown"
                        description="Sever all external node connections. Only subjects with level 5 clearance can ingress."
                        active={settings.maintenanceMode}
                        onClick={() => toggle('maintenanceMode')}
                        isDanger={true}
                    />
                </div>

                {/* Action Bar */}
                <div style={{ display: 'flex', gap: '20px', padding: '10px 0' }}>
                    <button className="btn" onClick={handleSave} style={{ height: '54px', padding: '0 40px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <Save size={20} /> DEPLOY PROTOCOLS
                    </button>
                    <button className="btn btn-secondary" style={{ height: '54px', padding: '0 30px', display: 'flex', gap: '10px', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                        <RotateCcw size={18} /> REVERT TO BASELINE
                    </button>
                </div>
            </div>
        </div>
    );
};

const ToggleItem = ({ label, description, active, onClick, isDanger }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ flex: 1, paddingRight: '40px' }}>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: isDanger ? 'var(--danger)' : '#fff', marginBottom: '4px' }}>{label}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{description}</div>
        </div>
        <motion.div
            whileTap={{ scale: 0.9 }}
            onClick={onClick}
            style={{
                cursor: 'pointer',
                color: active ? (isDanger ? 'var(--danger)' : 'var(--success)') : 'rgba(255,255,255,0.1)',
                transition: 'color 0.3s ease'
            }}
        >
            {active ? <ToggleRight size={48} /> : <ToggleLeft size={48} />}
        </motion.div>
    </div>
);

export default PoliciesPage;
