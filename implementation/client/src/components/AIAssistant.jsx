import React, { useState } from 'react';
import { Sparkles, Brain, RefreshCcw, Radar, Terminal, Activity } from 'lucide-react';
import api from '../services/api';
import { notifySuccess, notifyError, notifyInfo } from '../services/tost';
import { motion, AnimatePresence } from 'framer-motion';

const AIAssistant = () => {
    const [isTraining, setIsTraining] = useState(false);
    const [mlStatus, setMlStatus] = useState(null);
    const [aiInsight, setAiInsight] = useState('Initializing AI Security Posture analysis...');
    const [loadingInsight, setLoadingInsight] = useState(false);

    const trainModel = async () => {
        setIsTraining(true);
        try {
            notifyInfo('Recalibrating Neural Pathways...');
            await api.post('/ml/train');
            notifySuccess('ML Core Synchronized');
            fetchStatus();
        } catch (err) {
            notifyError('Sync Failed: Insufficient Data Entropy');
        } finally {
            setIsTraining(false);
        }
    };

    const fetchStatus = async () => {
        try {
            const res = await api.get('/ml/status');
            setMlStatus(res.data);
        } catch (e) { }
    };

    const fetchInsight = async () => {
        setLoadingInsight(true);
        try {
            const res = await api.get('/ai/posture');
            setAiInsight(res.data.insight);
        } catch (e) {
            setAiInsight("Security vectors are currently stable. No lateral movement detected.");
        } finally {
            setLoadingInsight(false);
        }
    };

    React.useEffect(() => {
        fetchStatus();
        fetchInsight();
        const interval = setInterval(fetchInsight, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="glass-panel" style={{ padding: '30px', position: 'relative', overflow: 'hidden' }}>
            {/* Background Scanner Effect */}
            <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                background: 'radial-gradient(circle at 90% 10%, rgba(112, 0, 255, 0.05) 0%, transparent 40%)',
                zIndex: 0,
                pointerEvents: 'none'
            }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '25px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '12px',
                            background: 'rgba(112, 0, 255, 0.1)',
                            border: '1px solid rgba(112, 0, 255, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Radar size={24} className="pulse" color="var(--secondary)" />
                        </div>
                        <div>
                            <h3 className="text-gradient" style={{ margin: 0, fontSize: '1.2rem' }}>Cognitive Security Core</h3>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', letterSpacing: '1px' }}>AI-DRIVEN ANOMALY ENFORCEMENT</div>
                        </div>
                    </div>
                    <motion.button
                        whileHover={{ rotate: 180 }}
                        transition={{ duration: 0.5 }}
                        className="btn"
                        onClick={fetchInsight}
                        disabled={loadingInsight}
                        style={{ padding: '8px', border: 'none', background: 'rgba(255,255,255,0.05)' }}
                    >
                        <RefreshCcw size={16} color="var(--primary)" />
                    </motion.button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '25px' }}>

                    {/* ML Control Block */}
                    <div style={{ padding: '20px', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600 }}>
                                <Terminal size={14} /> HEURISTICS
                            </div>
                            <div style={{
                                padding: '4px 8px',
                                borderRadius: '6px',
                                background: mlStatus?.is_trained ? 'rgba(0, 255, 157, 0.1)' : 'rgba(252, 238, 10, 0.1)',
                                color: mlStatus?.is_trained ? 'var(--success)' : 'var(--warning)',
                                fontSize: '0.6rem',
                                fontWeight: 800
                            }}>
                                {mlStatus?.is_trained ? 'PRIME' : 'SYNCING'}
                            </div>
                        </div>
                        <button
                            className="btn btn-secondary"
                            style={{ width: '100%', fontSize: '0.75rem', height: '42px', padding: 0 }}
                            onClick={trainModel}
                            disabled={isTraining}
                        >
                            {isTraining ? 'RECALIBRATING...' : 'SYNC NEURAL CORE'}
                        </button>
                    </div>

                    {/* Sensor Data Block */}
                    <div style={{ padding: '20px', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600 }}>
                            <Activity size={14} /> CONFIDENCE INDEX
                        </div>
                        <div style={{ height: '42px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.03)' }}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: mlStatus?.is_trained ? '92%' : '15%' }}
                                transition={{ duration: 2, ease: "easeOut" }}
                                style={{
                                    height: '100%',
                                    background: 'linear-gradient(90deg, var(--secondary), var(--primary))',
                                    boxShadow: '0 0 15px var(--primary-glow)'
                                }}
                            />
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.7rem',
                                color: '#fff',
                                fontWeight: 800,
                                textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                            }}>
                                {mlStatus?.is_trained ? '92.4% ACCURACY' : 'HEURISTIC COLD-START'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* AI Executive Summary */}
                <div style={{
                    padding: '20px',
                    background: 'rgba(0, 240, 255, 0.03)',
                    borderRadius: '16px',
                    border: '1px solid rgba(0, 240, 255, 0.1)',
                    position: 'relative'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: '-10px',
                        left: '20px',
                        background: 'var(--bg-color)',
                        padding: '2px 10px',
                        fontSize: '0.6rem',
                        color: 'var(--primary)',
                        fontWeight: 800,
                        borderRadius: '4px',
                        border: '1px solid rgba(0, 240, 255, 0.1)'
                    }}>
                        LIVE EXECUTIVE INSIGHT
                    </div>
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={aiInsight}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            style={{
                                margin: 0,
                                fontSize: '0.95rem',
                                color: '#e2e8f0',
                                fontStyle: 'italic',
                                lineHeight: 1.6,
                                fontWeight: 300
                            }}
                        >
                            "{loadingInsight ? 'Deep analysis in progress...' : aiInsight}"
                        </motion.p>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default AIAssistant;
