import React, { useState } from 'react';
import Terminal from './components/Terminal/Terminal';
import GUILayout from './components/GUI/GUILayout';
import { motion } from 'framer-motion';
import { Terminal as TerminalIcon, LayoutTemplate, ShieldCheck, Cpu } from 'lucide-react';
import './index.css';

const App = () => {
    const [mode, setMode] = useState('selection'); // 'selection', 'cli', 'gui'

    if (mode === 'cli') {
        return <Terminal onExit={() => setMode('selection')} />;
    }

    if (mode === 'gui') {
        return <GUILayout onExit={() => setMode('selection')} />;
    }

    return (
        <div className="mode-selector">
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <Cpu size={64} color="#00f0ff" style={{ marginBottom: '20px' }} />
                <h1 style={{ fontSize: '2.5rem', letterSpacing: '4px', textTransform: 'uppercase' }}>Zero<span style={{ color: '#00f0ff' }}>Trust</span> BIOS</h1>
                <p style={{ color: '#888' }}>Select Interface Protocol v2.4.0</p>
            </div>

            <div style={{ display: 'flex', gap: '40px' }}>
                <motion.div
                    className="mode-card"
                    onClick={() => setMode('gui')}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <LayoutTemplate size={64} color="#7000ff" />
                    <h2 style={{ marginTop: '20px' }}>Graphical Interface</h2>
                    <p style={{ fontSize: '0.9rem', color: '#888', padding: '0 20px' }}>
                        Visual Dashboard with Matrix Visualization, Threat Maps, and Real-time Component Monitoring.
                    </p>
                </motion.div>

                <motion.div
                    className="mode-card"
                    onClick={() => setMode('cli')}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <TerminalIcon size={64} color="#00ff9d" />
                    <h2 style={{ marginTop: '20px' }}>Terminal Interface</h2>
                    <p style={{ fontSize: '0.9rem', color: '#888', padding: '0 20px' }}>
                        Raw Command Line Access. High-speed execution, audit logs, and direct kernel interaction.
                    </p>
                </motion.div>
            </div>

            <div style={{ marginTop: '60px', color: '#444', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldCheck size={14} />
                SECURE BOOT ENABLED | INTEGRITY VERIFIED
            </div>
        </div>
    );
};

export default App;
