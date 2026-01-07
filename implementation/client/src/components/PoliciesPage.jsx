import React, { useState } from 'react';
import { ToggleLeft, ToggleRight, Save, RotateCcw, Shield } from 'lucide-react';
import { notifySuccess } from '../services/tost';

const PoliciesPage = () => {
    // Mock State for Settings
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
        notifySuccess('Security Policies Updated Successfully');
    };

    return (
        <div style={{ height: '100%', overflowY: 'auto', maxWidth: '800px' }}>
            <h1 className="text-gradient">Global Security Policies</h1>
            <p style={{ color: '#888', marginBottom: '30px' }}>Configure the Zero Trust Engine parameters and compliance rules.</p>

            <div className="glass-panel" style={{ padding: '30px', marginBottom: '30px' }}>
                <h3 style={{ borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '20px' }}>Authentication & Access</h3>

                <ToggleItem
                    label="Enforce Multi-Factor Authentication (MFA)"
                    description="Require a second verification step for all user roles."
                    active={settings.enforceMFA}
                    onClick={() => toggle('enforceMFA')}
                />

                <ToggleItem
                    label="Adaptive Geo-Blocking"
                    description="Automatically reject login attempts from high-risk countries."
                    active={settings.geoBlocking}
                    onClick={() => toggle('geoBlocking')}
                />

                <ToggleItem
                    label="Continuous Device Health Monitoring"
                    description="Re-verify antivirus and OS status on every request."
                    active={settings.deviceHealthCheck}
                    onClick={() => toggle('deviceHealthCheck')}
                />
            </div>

            <div className="glass-panel" style={{ padding: '30px', marginBottom: '30px' }}>
                <h3 style={{ borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '20px' }}>Risk Engine Configuration</h3>

                <div style={{ marginBottom: '25px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <label>Risk Threshold (Score {settings.riskThreshold})</label>
                        <span style={{ color: 'var(--primary-color)' }}>Strict</span>
                    </div>
                    <input
                        type="range"
                        min="10" max="100"
                        value={settings.riskThreshold}
                        onChange={(e) => setSettings({ ...settings, riskThreshold: e.target.value })}
                        style={{ width: '100%' }} // Note: Default input style in index.css might conflict, inline override
                    />
                    <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '5px' }}>Requests with a risk score above this value will be automatically blocked.</p>
                </div>

                <div style={{ marginBottom: '10px' }}>
                    <label>Session Timeout (Minutes)</label>
                    <input
                        type="number"
                        value={settings.sessionTimeout}
                        onChange={(e) => setSettings({ ...settings, sessionTimeout: e.target.value })}
                        style={{ width: '100px', display: 'block', marginTop: '10px' }}
                    />
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '30px', border: '1px solid var(--danger-color)' }}>
                <h3 style={{ color: 'var(--danger-color)', borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '20px' }}>Danger Zone</h3>

                <ToggleItem
                    label="System Maintenance Mode"
                    description="Lock down the entire platform. Only Super Admins can login."
                    active={settings.maintenanceMode}
                    onClick={() => toggle('maintenanceMode')}
                    isDanger={true}
                />
            </div>

            <div style={{ marginTop: '30px', display: 'flex', gap: '15px' }}>
                <button className="btn" onClick={handleSave} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <Save size={18} /> Save Changes
                </button>
                <button className="btn" style={{ borderColor: '#666', color: '#aaa', display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <RotateCcw size={18} /> Reset Defaults
                </button>
            </div>

        </div>
    );
};

const ToggleItem = ({ label, description, active, onClick, isDanger }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
            <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: isDanger ? 'var(--danger-color)' : 'white' }}>{label}</div>
            <div style={{ color: '#888', fontSize: '0.9rem', maxWidth: '400px' }}>{description}</div>
        </div>
        <div onClick={onClick} style={{ cursor: 'pointer' }}>
            {active
                ? <ToggleRight size={40} color={isDanger ? 'var(--danger-color)' : 'var(--success-color)'} />
                : <ToggleLeft size={40} color="#666" />
            }
        </div>
    </div>
);

export default PoliciesPage;
