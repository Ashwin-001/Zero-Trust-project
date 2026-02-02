import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Key, UserPlus, ArrowRight, Loader } from 'lucide-react';
import api from '../../services/api';

const LoginScreen = ({ onLoginSuccess }) => {
    const [view, setView] = useState('login'); // 'login' or 'enroll'
    const [privateKey, setPrivateKey] = useState('');
    const [customKey, setCustomKey] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [generatedIdentity, setGeneratedIdentity] = useState(null);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            // Updated to send ONLY private_key
            const res = await api.post('/auth/login', { private_key: privateKey });
            const { access, username, role } = res.data;
            localStorage.setItem('token', access);
            localStorage.setItem('user', username);
            onLoginSuccess();
        } catch (err) {
            setError(err.response?.data?.detail || 'Authentication Failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEnroll = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const payload = {};
            if (customKey.trim()) payload.private_key = customKey.trim();

            const res = await api.post('/auth/enroll', payload);
            setGeneratedIdentity(res.data);
            setView('success');
        } catch (err) {
            setError('Enrollment Failed: ' + (err.response?.data?.detail || 'Unknown Error'));
        } finally {
            setIsLoading(false);
        }
    };

    if (view === 'success' && generatedIdentity) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-panel"
                style={{ maxWidth: '500px', margin: '100px auto', padding: '40px', textAlign: 'center' }}
            >
                <Shield size={64} color="var(--success)" style={{ marginBottom: '20px' }} />
                <h2 style={{ color: 'var(--success)' }}>Identity Enrolled</h2>
                <p>Your zero-trust identity has been established.</p>

                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '10px', margin: '20px 0', textAlign: 'left' }}>
                    <div style={{ marginBottom: '10px' }}>
                        <span style={{ color: '#888', fontSize: '0.8rem' }}>IDENTITY UID</span>
                        <div style={{ color: '#fff', fontWeight: 'bold' }}>{generatedIdentity.username}</div>
                    </div>
                    <div>
                        <span style={{ color: '#888', fontSize: '0.8rem' }}>PRIVATE ACCESS KEY (SAVE THIS!)</span>
                        <div style={{ color: 'var(--primary)', fontWeight: 'bold', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                            {generatedIdentity.private_key}
                        </div>
                    </div>
                </div>

                <button className="btn btn-primary" onClick={() => {
                    setPrivateKey(generatedIdentity.private_key);
                    setView('login');
                }}>
                    PROCEED TO LOGIN
                </button>
            </motion.div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: '20px' }}>

            <div style={{ marginBottom: '40px', textAlign: 'center' }}>
                <h1 style={{ fontSize: '3rem', margin: 0 }}>ZERO<span style={{ color: 'var(--primary)' }}>TRUST</span></h1>
                <p style={{ letterSpacing: '4px', textTransform: 'uppercase', fontSize: '0.8rem', color: '#666' }}>Secure Access Gateway</p>
            </div>

            <motion.div
                key={view}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel"
                style={{ width: '100%', maxWidth: '400px', padding: '40px' }}
            >
                {view === 'login' ? (
                    <form onSubmit={handleLogin}>
                        <h2 style={{ marginBottom: '30px' }}>Authentication</h2>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.9rem', color: '#aaa' }}>PRIVATE KEY</label>
                            <div style={{ position: 'relative' }}>
                                <Key size={18} style={{ position: 'absolute', top: '15px', left: '15px', color: '#666' }} />
                                <input
                                    type="password"
                                    placeholder="Enter your cryptographic key..."
                                    value={privateKey}
                                    onChange={e => setPrivateKey(e.target.value)}
                                    style={{ paddingLeft: '45px' }}
                                    autoFocus
                                />
                            </div>
                        </div>

                        {error && <div style={{ color: 'var(--danger)', marginBottom: '20px', fontSize: '0.9rem' }}>{error}</div>}

                        <button className="btn" style={{ width: '100%', marginBottom: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                            {isLoading ? <Loader className="spin" size={20} /> : <>ACCESS MAINNET <ArrowRight size={18} /></>}
                        </button>

                        <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                            <span style={{ fontSize: '0.9rem', color: '#666', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={() => setView('enroll')}>
                                <UserPlus size={16} /> NO KEY? ENROLL NEW IDENTITY
                            </span>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleEnroll}>
                        <h2 style={{ marginBottom: '30px' }}>Enroll Identity</h2>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.9rem', color: '#aaa' }}>CUSTOM KEY (OPTIONAL)</label>
                            <input
                                type="text"
                                placeholder="Leave blank to auto-generate..."
                                value={customKey}
                                onChange={e => setCustomKey(e.target.value)}
                            />
                            <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '8px' }}>
                                If you provide a custom key, ensure it is high-entropy. Otherwise, the system will generate a cryptographically secure key for you.
                            </p>
                        </div>

                        {error && <div style={{ color: 'var(--danger)', marginBottom: '20px', fontSize: '0.9rem' }}>{error}</div>}

                        <button className="btn btn-secondary" style={{ width: '100%', marginBottom: '20px' }} type="submit">
                            {isLoading ? 'ENROLLING...' : 'GENERATE IDENTITY'}
                        </button>

                        <div style={{ textAlign: 'center' }}>
                            <span style={{ fontSize: '0.9rem', color: '#888', cursor: 'pointer' }} onClick={() => setView('login')}>
                                ← Back to Login
                            </span>
                        </div>
                    </form>
                )}
            </motion.div>
        </div>
    );
};

export default LoginScreen;
