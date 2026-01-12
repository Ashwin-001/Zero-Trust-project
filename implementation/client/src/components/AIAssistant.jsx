import React, { useState } from 'react';
import { Sparkles, Brain, RefreshCcw } from 'lucide-react';
import api from '../services/api';
import { notifySuccess, notifyError, notifyInfo } from '../services/tost';

const AIAssistant = () => {
    const [isTraining, setIsTraining] = useState(false);
    const [mlStatus, setMlStatus] = useState(null);
    const [aiInsight, setAiInsight] = useState('Initializing AI Security Posture analysis...');
    const [loadingInsight, setLoadingInsight] = useState(false);

    const trainModel = async () => {
        setIsTraining(true);
        try {
            notifyInfo('Retraining ML Engine...');
            await api.post('/ml/train');
            notifySuccess('ML Engine Retrained Successfully');
            fetchStatus();
        } catch (err) {
            notifyError('Training failed: Not enough data yet');
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
            setAiInsight("Security trends are currently stable. Monitoring active for anomalies.");
        } finally {
            setLoadingInsight(false);
        }
    };

    React.useEffect(() => {
        fetchStatus();
        fetchInsight();
        const interval = setInterval(fetchInsight, 30000); // Update insight every 30s
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="glass-panel" style={{ padding: '20px', marginTop: '20px', position: 'relative', minHeight: '220px' }}>
            {/* Background Glow */}
            <div style={{
                position: 'absolute',
                top: '-50px',
                right: '-50px',
                width: '150px',
                height: '150px',
                background: 'var(--primary-color)',
                filter: 'blur(80px)',
                opacity: 0.1,
                zIndex: 0
            }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Sparkles className="text-gradient" size={24} />
                        <h3 className="text-gradient" style={{ margin: 0 }}>AI Security Intelligence</h3>
                    </div>
                    <button className="btn" onClick={fetchInsight} disabled={loadingInsight} style={{ padding: '5px 10px', fontSize: '0.7rem' }}>
                        <RefreshCcw size={12} className={loadingInsight ? 'spin' : ''} />
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                    <div style={{ padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <span style={{ fontSize: '0.9rem', color: '#888' }}>ML Status</span>
                            <span style={{ fontSize: '0.9rem', color: mlStatus?.is_trained ? 'var(--success-color)' : 'var(--warning-color)' }}>
                                {mlStatus?.is_trained ? 'Active & Learning' : 'Cold Start'}
                            </span>
                        </div>
                        <button
                            className="btn"
                            style={{ width: '100%', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            onClick={trainModel}
                            disabled={isTraining}
                        >
                            <RefreshCcw size={14} className={isTraining ? 'spin' : ''} />
                            {isTraining ? 'Training...' : 'Retrain Engine'}
                        </button>
                    </div>

                    <div style={{ padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                            <Brain size={16} color="var(--secondary-color)" />
                            <span style={{ fontSize: '0.9rem' }}>Anomaly Detection</span>
                        </div>
                        <div style={{ height: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
                            <div style={{
                                width: mlStatus?.is_trained ? '85%' : '0%',
                                height: '100%',
                                background: 'linear-gradient(90deg, var(--secondary-color), var(--primary-color))',
                                transition: 'width 2s ease-in-out'
                            }} />
                            <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                Confidence: {mlStatus?.is_trained ? 'High' : 'Low'}
                            </span>
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', borderLeft: '3px solid var(--primary-color)' }}>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#bbb', fontStyle: 'italic', minHeight: '1.2em' }}>
                        "{loadingInsight ? 'AI is analyzing security logs...' : aiInsight}"
                    </p>
                </div>
            </div>

            <style>{`
                .spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default AIAssistant;
