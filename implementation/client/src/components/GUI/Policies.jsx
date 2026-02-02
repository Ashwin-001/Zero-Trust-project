import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Shield, AlertTriangle, CheckSquare } from 'lucide-react';

const Policies = () => {
    // Static policies for demo purposes as we don't have a backend CRUD for this yet
    const [policies] = useState([
        { id: 1, name: 'Micro-Segmentation Alpha', scope: 'Database Tier', effect: 'DENY-ALL-EXCEPT', status: 'Active', severity: 'High' },
        { id: 2, name: 'ZTA-Identity-Verification', scope: 'Global', effect: 'MFA-REQUIRED', status: 'Active', severity: 'Critical' },
        { id: 3, name: 'Lateral Movement Block', scope: 'Workstations', effect: 'ISOLATE', status: 'Active', severity: 'Medium' },
        { id: 4, name: 'Data Exfiltration Monitor', scope: 'Egress Gateways', effect: 'AUDIT-LOG', status: 'Learning', severity: 'Low' },
    ]);

    return (
        <div style={{ color: 'white' }}>
            <div style={{ marginBottom: '30px' }}>
                <h2 style={{ margin: 0 }}>Policy Engine</h2>
                <p style={{ color: '#888', margin: '5px 0 0 0' }}>Dynamic Access Control List (DACL) & Governance</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                {policies.map((p, i) => (
                    <motion.div
                        key={p.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass-panel"
                        style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)' }}>
                                    <FileText size={20} color="var(--primary)" />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{p.name}</h3>
                                    <span style={{ fontSize: '0.8rem', color: '#666' }}>Scope: {p.scope}</span>
                                </div>
                            </div>
                            <span style={{
                                padding: '4px 10px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold',
                                background: p.status === 'Active' ? 'rgba(0,255,0,0.1)' : 'rgba(255,165,0,0.1)',
                                color: p.status === 'Active' ? 'var(--success)' : 'var(--warning)'
                            }}>
                                {p.status}
                            </span>
                        </div>

                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '8px', borderLeft: '3px solid var(--secondary)' }}>
                            <span style={{ fontSize: '0.7rem', color: '#888', display: 'block', marginBottom: '5px' }}>ENFORCEMENT EFFECT</span>
                            <div style={{ fontWeight: 'bold', letterSpacing: '1px' }}>{p.effect}</div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', color: p.severity === 'Critical' ? 'var(--danger)' : '#aaa' }}>
                                <AlertTriangle size={14} /> {p.severity} Impact
                            </div>
                            <button className="btn btn-sm" style={{ padding: '5px 15px', fontSize: '0.75rem' }}>EDIT</button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default Policies;
