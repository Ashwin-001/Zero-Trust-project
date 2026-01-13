import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Fingerprint, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
    const [privateKey, setPrivateKey] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            await login(privateKey);
            navigate('/dashboard');
        } catch (err) {
            setError('Biometric/Identity Mismatch Detected');
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            height: '100vh',
            width: '100vw',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(circle at center, #1a1b26 0%, #08090d 100%)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Animated Background Elements */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.1, 0.2, 0.1]
                }}
                transition={{ duration: 10, repeat: Infinity }}
                style={{
                    position: 'absolute',
                    top: '-10%',
                    right: '-10%',
                    width: '600px',
                    height: '600px',
                    background: 'var(--secondary)',
                    filter: 'blur(150px)',
                    borderRadius: '50%',
                    zIndex: 0
                }}
            />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="glass-panel"
                style={{
                    padding: '50px',
                    width: '450px',
                    textAlign: 'center',
                    zIndex: 1,
                    background: 'rgba(13, 15, 22, 0.8)'
                }}
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.2 }}
                    style={{
                        width: '80px',
                        height: '80px',
                        background: 'rgba(0, 240, 255, 0.1)',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 30px',
                        border: '1px solid rgba(0, 240, 255, 0.2)',
                        boxShadow: '0 0 20px rgba(0, 240, 255, 0.1)'
                    }}
                >
                    <ShieldCheck size={40} color="var(--primary)" />
                </motion.div>

                <h1 className="text-gradient" style={{ fontSize: '2.2rem', marginBottom: '10px' }}>Z-TRUST</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '40px', letterSpacing: '2px', fontWeight: 300 }}>
                    ZERO TRUST AUTHENTICATION SYSTEM
                </p>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        style={{
                            background: 'rgba(255, 0, 60, 0.1)',
                            color: 'var(--danger)',
                            padding: '12px',
                            borderRadius: '10px',
                            fontSize: '0.85rem',
                            marginBottom: '20px',
                            border: '1px solid rgba(255, 0, 60, 0.2)'
                        }}
                    >
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '25px', textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
                            <Fingerprint size={14} />
                            Zero-Knowledge Identity Proof
                        </div>
                        <input
                            type="password"
                            placeholder="••••••••••••••••"
                            value={privateKey}
                            onChange={(e) => setPrivateKey(e.target.value)}
                            disabled={isLoading}
                            style={{
                                height: '54px',
                                fontSize: '1.1rem',
                                letterSpacing: '4px',
                                textAlign: 'center'
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn"
                        disabled={isLoading}
                        style={{ width: '100%', height: '54px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                    >
                        {isLoading ? (
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            >
                                <Cpu size={20} />
                            </motion.div>
                        ) : (
                            <>
                                <Lock size={18} />
                                GENERATE ZK-PROOF & AUTHENTICATE
                            </>
                        )}
                    </button>
                </form>

                <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center', gap: '20px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ color: 'var(--success)', fontWeight: 800, fontSize: '1.2rem' }}>ZKP</div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>PRIVACY</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1.2rem' }}>RBAC+</div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>ABAC HYBRID</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ color: 'var(--secondary)', fontWeight: 800, fontSize: '1.2rem' }}>RSA</div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>IMMUTABLE</div>
                    </div>
                </div>
            </motion.div>

            {/* Bottom Security Banner */}
            <div style={{ position: 'absolute', bottom: '20px', left: '0', width: '100%', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.7rem', display: 'flex', justifyContent: 'center', gap: '15px' }}>
                <span>PRIVACY-PRESERVING ZERO TRUST FRAMEWORK</span>
                <span>•</span>
                <span>BLOCKCHAIN AUDIT ENABLED</span>
            </div>
        </div >
    );
};

export default Login;
