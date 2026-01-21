import React, { useState, useEffect, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import { Scan, ShieldCheck, Lock, UserCheck, AlertTriangle } from 'lucide-react';

const BiometricVerification = ({ onVerified }) => {
    const webcamRef = useRef(null);
    const [scanning, setScanning] = useState(true);
    const [progress, setProgress] = useState(0);
    const [verified, setVerified] = useState(false);
    const [error, setError] = useState(null);

    // Simulate scanning process
    useEffect(() => {
        let interval;
        if (scanning && !verified) {
            interval = setInterval(() => {
                setProgress(prev => {
                    const newProgress = prev + 2; // rapid increment
                    if (newProgress >= 100) {
                        clearInterval(interval);
                        setScanning(false);
                        setVerified(true);
                        setTimeout(onVerified, 1500); // Wait a bit before closing
                        return 100;
                    }
                    return newProgress;
                });
            }, 50);
        }
        return () => clearInterval(interval);
    }, [scanning, verified, onVerified]);

    const videoConstraints = {
        width: 1280,
        height: 720,
        facingMode: "user"
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 1000,
                background: 'rgba(5, 7, 10, 0.95)',
                backdropFilter: 'blur(20px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff'
            }}
        >
            <div style={{ position: 'relative', width: '100%', maxWidth: '600px', padding: '20px' }}>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '12px',
                            background: 'rgba(255,255,255,0.05)',
                            padding: '10px 20px',
                            borderRadius: '30px',
                            marginBottom: '20px',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}
                    >
                        <Lock size={16} color="var(--primary)" />
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, letterSpacing: '1px' }}>SECURITY CLEARANCE REQUIRED</span>
                    </motion.div>
                    <h2 style={{ fontSize: '2rem', margin: 0, marginBottom: '10px' }}>Biometric Verification</h2>
                    <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0 }}>Please look at the camera to verify your identity</p>
                </div>

                {/* Camera Frame */}
                <div style={{
                    position: 'relative',
                    borderRadius: '24px',
                    overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 0 50px rgba(0,0,0,0.5)',
                    background: '#000',
                    aspectRatio: '16/9'
                }}>

                    <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        videoConstraints={videoConstraints}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} // Mirror effect
                        onUserMediaError={() => setError("Camera access denied")}
                    />

                    {/* Scanning Overlay */}
                    <AnimatePresence>
                        {scanning && (
                            <>
                                {/* Face Frame */}
                                <svg style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '60%', height: '80%', zIndex: 10 }}>
                                    <path d="M 10 50 L 10 10 L 50 10" fill="none" stroke="var(--primary)" strokeWidth="4" strokeLinecap="round" />
                                    <path d="M 240 10 L 290 10 L 290 50" fill="none" stroke="var(--primary)" strokeWidth="4" strokeLinecap="round" style={{ transform: 'translateX(calc(100% - 300px))' }} /> {/* Approx right side adjustment needed if responsive, but fixed viewBox for SVG is better */}
                                    {/* Using simple div borders for corners instead of complex SVG for reliability */}
                                </svg>

                                <div style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    width: '240px',
                                    height: '320px',
                                    border: '2px solid rgba(0, 240, 255, 0.3)',
                                    borderRadius: '16px'
                                }}>
                                    {/* Corner Accents */}
                                    <div style={{ position: 'absolute', top: -2, left: -2, width: 20, height: 20, borderTop: '4px solid var(--primary)', borderLeft: '4px solid var(--primary)', borderRadius: '4px 0 0 0' }} />
                                    <div style={{ position: 'absolute', top: -2, right: -2, width: 20, height: 20, borderTop: '4px solid var(--primary)', borderRight: '4px solid var(--primary)', borderRadius: '0 4px 0 0' }} />
                                    <div style={{ position: 'absolute', bottom: -2, left: -2, width: 20, height: 20, borderBottom: '4px solid var(--primary)', borderLeft: '4px solid var(--primary)', borderRadius: '0 0 0 4px' }} />
                                    <div style={{ position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, borderBottom: '4px solid var(--primary)', borderRight: '4px solid var(--primary)', borderRadius: '0 0 4px 0' }} />

                                    {/* Scaning Line */}
                                    <motion.div
                                        animate={{ top: ['5%', '95%', '5%'] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                        style={{
                                            position: 'absolute',
                                            left: '2%',
                                            width: '96%',
                                            height: '2px',
                                            background: 'var(--primary)',
                                            boxShadow: '0 0 10px var(--primary), 0 0 20px var(--primary)',
                                            zIndex: 20
                                        }}
                                    />
                                </div>
                            </>
                        )}
                    </AnimatePresence>

                    {/* Status Text Overlay */}
                    <div style={{
                        position: 'absolute',
                        bottom: '20px',
                        left: 0,
                        width: '100%',
                        textAlign: 'center',
                        zIndex: 30
                    }}>
                        {verified ? (
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                style={{
                                    background: 'rgba(0, 255, 157, 0.2)',
                                    border: '1px solid var(--success)',
                                    color: 'var(--success)',
                                    padding: '10px 20px',
                                    borderRadius: '30px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    fontWeight: 700
                                }}
                            >
                                <UserCheck size={20} />
                                IDENTITY CONFIRMED
                            </motion.div>
                        ) : error ? (
                            <div style={{ color: 'var(--danger)', background: 'rgba(0,0,0,0.8)', padding: '10px 20px', borderRadius: '30px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                <AlertTriangle size={16} /> {error}
                            </div>
                        ) : (
                            <div style={{ color: 'var(--primary)', fontFamily: 'monospace', letterSpacing: '2px', fontWeight: 600 }}>
                                SCANNING FACIAL GEOMETRY... {progress}%
                            </div>
                        )}
                    </div>

                    {/* Grid Overlay */}
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(rgba(0, 240, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 0.1) 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                        opacity: 0.2,
                        pointerEvents: 'none'
                    }} />
                </div>
            </div>
        </motion.div>
    );
};

export default BiometricVerification;
