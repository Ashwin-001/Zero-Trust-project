import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, MapPin, AlertCircle, ShieldOff } from 'lucide-react';

const ThreatMap = () => {
    // Simulated live threat data
    const threats = [
        { id: 1, type: 'DDoS Attempt', source: '192.168.1.45', target: 'Gateway-01', location: { x: 20, y: 30 }, risk: 'Critical' },
        { id: 2, type: 'Brute Force', source: '10.0.0.5', target: 'Auth-Node', location: { x: 70, y: 60 }, risk: 'High' },
        { id: 3, type: 'Port Scan', source: 'External IP', target: 'Public-API', location: { x: 45, y: 45 }, risk: 'Medium' },
    ];

    return (
        <div style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '20px' }}>
                <h2 style={{ margin: 0, color: 'white' }}>Live Threat Vector Map</h2>
                <p style={{ color: '#888', margin: '5px 0 0 0' }}>Real-time spatial visualization of active attack surfaces.</p>
            </div>

            <div className="glass-panel" style={{ flex: 1, position: 'relative', overflow: 'hidden', background: 'radial-gradient(circle at center, #1a1a2e 0%, #000 100%)' }}>
                {/* Simulated Map Grid */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
                    backgroundSize: '50px 50px',
                    opacity: 0.5
                }} />

                {/* Central Node */}
                <div style={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    width: '20px', height: '20px', borderRadius: '50%', background: 'var(--primary)',
                    boxShadow: '0 0 50px var(--primary-glow)', zIndex: 10
                }} />
                <div style={{
                    position: 'absolute', top: '52%', left: '50%', transform: 'translateX(-50%)',
                    color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.8rem'
                }}>HQ CORE</div>

                {/* Threat Nodes */}
                {threats.map((t) => (
                    <motion.div
                        key={t.id}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: [1, 1.2, 1], opacity: 1 }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        style={{
                            position: 'absolute',
                            top: `${t.location.y}%`,
                            left: `${t.location.x}%`,
                            cursor: 'pointer'
                        }}
                    >
                        <div style={{ position: 'relative' }}>
                            <AlertCircle size={32} color="var(--danger)" />
                            <div style={{
                                position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)',
                                background: 'rgba(255, 0, 0, 0.2)', padding: '5px 10px', borderRadius: '4px',
                                border: '1px solid var(--danger)', whiteSpace: 'nowrap', color: '#fff', fontSize: '0.75rem'
                            }}>
                                {t.type}
                            </div>
                            {/* Connection Line to Headquarters (Simulated via SVG if needed, simple absolute for now) */}
                        </div>
                    </motion.div>
                ))}

                {/* Threat List Overlay */}
                <div style={{
                    position: 'absolute', right: '20px', top: '20px', width: '300px',
                    background: 'rgba(0,0,0,0.8)', border: '1px solid var(--glass-border)',
                    borderRadius: '10px', padding: '20px'
                }}>
                    <h3 style={{ margin: '0 0 15px 0', fontSize: '1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <ShieldOff size={16} color="var(--danger)" /> DETECTED ANOMALIES ({threats.length})
                    </h3>
                    {threats.map(t => (
                        <div key={t.id} style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontSize: '0.85rem' }}>
                                <span>{t.type}</span>
                                <span style={{ color: 'var(--danger)' }}>{t.risk}</span>
                            </div>
                            <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '4px' }}>
                                SRC: {t.source}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ThreatMap;
