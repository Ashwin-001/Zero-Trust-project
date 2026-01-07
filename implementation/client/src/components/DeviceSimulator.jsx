import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Settings, ShieldAlert, Cpu, Globe } from 'lucide-react';

const DeviceSimulator = () => {
    const { deviceHealth, updateDeviceHealth } = useContext(AuthContext);

    const toggle = (key) => {
        if (key === 'antivirus') updateDeviceHealth(key, !deviceHealth[key]);
        if (key === 'os') updateDeviceHealth(key, deviceHealth[key] === 'Windows 11' ? 'Outdated' : 'Windows 11');
        if (key === 'ipReputation') updateDeviceHealth(key, deviceHealth[key] === 'Good' ? 'Bad' : 'Good');
        if (key === 'location') updateDeviceHealth(key, deviceHealth[key] === 'Safe Zone' ? 'Unknown' : 'Safe Zone');
    };

    return (
        <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px' }}>
            <h3 className="text-gradient" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Settings size={20} /> Device Simulation
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>

                {/* Anti-Virus */}
                <button
                    className={`btn ${!deviceHealth.antivirus ? 'btn-danger' : ''}`}
                    onClick={() => toggle('antivirus')}
                >
                    <ShieldAlert size={16} /> AV: {deviceHealth.antivirus ? 'Active' : 'Missing'}
                </button>

                {/* OS */}
                <button
                    className={`btn ${String(deviceHealth.os).includes('Legacy') ? 'btn-danger' : ''}`}
                    onClick={() => updateDeviceHealth('os', String(deviceHealth.os).includes('Legacy') ? 'Windows 11' : 'Legacy OS')}
                >
                    <Cpu size={16} /> OS: {deviceHealth.os}
                </button>

                {/* IP Reputation */}
                <button
                    className={`btn ${deviceHealth.ipReputation === 'High Risk' ? 'btn-danger' : ''}`}
                    onClick={() => updateDeviceHealth('ipReputation', deviceHealth.ipReputation === 'Good' ? 'High Risk' : 'Good')}
                >
                    <Globe size={16} /> IP Rep: {deviceHealth.ipReputation}
                </button>

                {/* Location */}
                <button
                    className={`btn ${deviceHealth.location === 'Blacklisted Region' ? 'btn-danger' : ''}`}
                    onClick={() => updateDeviceHealth('location', deviceHealth.location === 'Blacklisted Region' ? 'Safe Zone' : 'Blacklisted Region')}
                >
                    <Globe size={16} /> Loc: {deviceHealth.location}
                </button>

                <div style={{ gridColumn: 'span 2', textAlign: 'center', fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>
                    Detected Identity: {deviceHealth.ip || '...'}
                </div>

            </div>
            <p style={{ fontSize: '0.7em', color: '#aaa', marginTop: '10px', textAlign: 'center' }}>
                *System automatically detects environment. Click tiles to simulate threats.
            </p>
        </div>
    );
};

export default DeviceSimulator;
