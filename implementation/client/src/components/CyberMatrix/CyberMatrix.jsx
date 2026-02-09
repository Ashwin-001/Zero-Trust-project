
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Box, Lock, Unlock, Database, Server, HardDrive, Shield } from 'lucide-react';

const CyberMatrix = () => {
    const [selected, setSelected] = useState(null);

    const resources = [
        { id: 1, name: 'Mainframe-Alpha', type: 'Server', status: 'Secure', risk: 5, icon: <Server size={24} /> },
        { id: 2, name: 'Secure-DB-01', type: 'Database', status: 'Encrypted', risk: 12, icon: <Database size={24} /> },
        { id: 3, name: 'Bio-Auth-Node', type: 'Authentication', status: 'Secure', risk: 2, icon: <Shield size={24} /> },
        { id: 4, name: 'File-Store-Gamma', type: 'Storage', status: 'Decrypted', risk: 45, icon: <HardDrive size={24} /> },
        { id: 5, name: 'Quantum-Engine', type: 'Compute', status: 'Locked', risk: 0, icon: <Box size={24} /> },
        { id: 6, name: 'Edge-Gateway-1', type: 'Gateway', status: 'Active', risk: 18, icon: <Server size={24} /> },
        { id: 7, name: 'IAM-Provider', type: 'Identity', status: 'Secure', risk: 8, icon: <Database size={24} /> },
        { id: 8, name: 'Legacy-Proxy', type: 'Proxy', status: 'Exposed', risk: 82, icon: <HardDrive size={24} /> },
        { id: 9, name: 'Audit-Chain', type: 'Logger', status: 'Immutable', risk: 4, icon: <Shield size={24} /> },
    ];

    return (
        <div className="analytics-container" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ marginBottom: '10px' }}>
                <h2 style={{ margin: 0, color: '#fff' }}>Protected Resource Matrix</h2>
                <p style={{ color: '#888', fontSize: '0.9rem' }}>Real-time spatial visualization of secured network nodes.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '25px', perspective: '1000px' }}>
                {resources.map((res, i) => (
                    <motion.div
                        key={res.id}
                        whileHover={{
                            scale: 1.05,
                            rotateX: 5,
                            rotateY: 5,
                            boxShadow: `0 0 30px ${res.risk > 50 ? 'rgba(255, 0, 112, 0.4)' : 'rgba(0, 240, 255, 0.4)'}`
                        }}
                        onClick={() => setSelected(res)}
                        className="glass-panel"
                        style={{
                            padding: '30px',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            border: `1px solid ${res.risk > 50 ? 'rgba(255, 0, 112, 0.2)' : 'rgba(255,255,255,0.05)'}`,
                            background: res.risk > 50 ? 'rgba(255, 0, 112, 0.05)' : 'rgba(255,255,255,0.02)'
                        }}
                    >
                        <div style={{
                            width: '60px', height: '60px', borderRadius: '15px',
                            background: 'rgba(255,255,255,0.03)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', marginBottom: '20px',
                            color: res.risk > 50 ? 'var(--secondary)' : 'var(--primary)'
                        }}>
                            {res.icon}
                        </div>
                        <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem', color: '#fff' }}>{res.name}</h3>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
                            <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: '#888' }}>{res.type}</span>
                            <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(0,255,0,0.05)', color: 'var(--success)' }}>{res.status}</span>
                        </div>

                        {/* Risk Bar */}
                        <div style={{ width: '100%', height: '4px', background: '#222', borderRadius: '2px' }}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${res.risk}%` }}
                                style={{ height: '100%', background: res.risk > 50 ? 'var(--secondary)' : 'var(--primary)', boxShadow: `0 0 10px ${res.risk > 50 ? 'var(--secondary)' : 'var(--primary)'}` }}
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: '10px' }}>
                            <span style={{ fontSize: '0.6rem', color: '#666' }}>RISK SCORE</span>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: res.risk > 50 ? 'var(--secondary)' : 'var(--primary)' }}>{res.risk}</span>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Selection Detail Panel */}
            <AnimatePresence>
                {selected && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="glass-panel"
                        style={{
                            padding: '30px', borderTop: `4px solid ${selected.risk > 50 ? 'var(--secondary)' : 'var(--primary)'}`,
                            display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '30px', alignItems: 'center'
                        }}
                    >
                        <div style={{ color: selected.risk > 50 ? 'var(--secondary)' : 'var(--primary)' }}>
                            {selected.risk > 50 ? <Lock size={40} /> : <Unlock size={40} />}
                        </div>
                        <div>
                            <h2 style={{ margin: 0, color: '#fff' }}>Node Authentication: {selected.name}</h2>
                            <p style={{ margin: '5px 0 0 0', color: '#888' }}>Protocol: TLS 1.3 | Enc: AES-GCM-256 | Identity: ZKP-Verified</p>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button className="btn btn-secondary" onClick={() => setSelected(null)}>CLOSE</button>
                            <button className="btn btn-primary">RE-VERIFY</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CyberMatrix;
