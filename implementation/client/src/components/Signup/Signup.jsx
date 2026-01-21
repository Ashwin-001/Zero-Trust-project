import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Lock, Fingerprint, Cpu, User, Key, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import { notifySuccess, notifyError } from '../../services/tost';

const Signup = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        private_key: '',
        role: 'user'
    });
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (!formData.username || !formData.password || !formData.private_key) {
            setError('All security parameters are mandatory for enrollment.');
            setIsLoading(false);
            return;
        }

        try {
            await api.post('/auth/register', formData);
            notifySuccess('Subject enrolled in Identity Matrix successfully.');
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed. Identity collision or system rejection.');
            notifyError('System Rejection: Enrollment Failed');
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
                    bottom: '-10%',
                    left: '-10%',
                    width: '600px',
                    height: '600px',
                    background: 'var(--primary)',
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
                    padding: '40px',
                    width: '500px',
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
                        width: '60px',
                        height: '60px',
                        background: 'rgba(112, 0, 255, 0.1)',
                        borderRadius: '15px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 20px',
                        border: '1px solid rgba(112, 0, 255, 0.2)',
                        boxShadow: '0 0 20px rgba(112, 0, 255, 0.1)'
                    }}
                >
                    <User size={30} color="var(--secondary)" />
                </motion.div>

                <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '8px' }}>IDENTITY ENROLLMENT</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '30px', letterSpacing: '2px', fontWeight: 300 }}>
                    SECURE SUBJECT ONBOARDING PROTOCOL
                </p>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        style={{
                            background: 'rgba(255, 0, 60, 0.1)',
                            color: 'var(--danger)',
                            padding: '10px',
                            borderRadius: '10px',
                            fontSize: '0.8rem',
                            marginBottom: '20px',
                            border: '1px solid rgba(255, 0, 60, 0.2)'
                        }}
                    >
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>
                            <Mail size={12} /> Username / Identifier
                        </label>
                        <input
                            type="text"
                            name="username"
                            placeholder="agent_007"
                            value={formData.username}
                            onChange={handleChange}
                            disabled={isLoading}
                        />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>
                            <Lock size={12} /> Access Password
                        </label>
                        <input
                            type="password"
                            name="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                            disabled={isLoading}
                        />
                    </div>

                    <div style={{ marginBottom: '25px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>
                            <Fingerprint size={12} /> Unique Private Key (Z-TRUST ID)
                        </label>
                        <input
                            type="text"
                            name="private_key"
                            placeholder="pk_example_123"
                            value={formData.private_key}
                            onChange={handleChange}
                            disabled={isLoading}
                            style={{ fontFamily: 'JetBrains Mono' }}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-secondary"
                        disabled={isLoading}
                        style={{ width: '100%', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
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
                                <ShieldCheck size={18} />
                                ENROLL IN IDENTITY MATRIX
                            </>
                        )}
                    </button>
                </form>

                <div style={{ marginTop: '25px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Already enrolled? <Link to="/" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>Execute Login Sequence</Link>
                </div>
            </motion.div>

            {/* Bottom Security Banner */}
            <div style={{ position: 'absolute', bottom: '20px', left: '0', width: '100%', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.7rem', display: 'flex', justifyContent: 'center', gap: '15px' }}>
                <span>ZERO TRUST ARCHITECTURE</span>
                <span>•</span>
                <span>IMMUTABLE IDENTITY PROOFING</span>
            </div>
        </div>
    );
};

export default Signup;
