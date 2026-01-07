import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Key } from 'lucide-react'; // Changed icon to Key

const Login = () => {
    const [privateKey, setPrivateKey] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(privateKey);
            navigate('/dashboard');
        } catch (err) {
            setError('Invalid Private Key');
        }
    };

    return (
        <div style={{ height: '100vh', width: '100vw' }} className="flex-center">
            <div className="glass-panel" style={{ padding: '40px', width: '400px', textAlign: 'center' }}>
                <ShieldCheck size={64} color="var(--primary-color)" style={{ marginBottom: '20px' }} />
                <h2 className="text-gradient" style={{ margin: '0 0 20px 0' }}>Zero Trust Portal</h2>

                {error && <p style={{ color: 'var(--danger-color)' }}>{error}</p>}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '15px', textAlign: 'left' }}>
                        <label style={{ fontSize: '0.8rem', color: '#888', marginLeft: '5px' }}>Identity Key</label>
                        <input
                            type="password"
                            placeholder="Enter Private Key"
                            value={privateKey}
                            onChange={(e) => setPrivateKey(e.target.value)}
                            style={{ width: '100%', marginTop: '5px' }}
                        />
                    </div>

                    <button type="submit" className="btn" style={{ width: '100%', marginTop: '10px' }}>
                        <Key size={16} style={{ display: 'inline', marginRight: '5px' }} />
                        Authenticate
                    </button>
                </form>

                <p style={{ marginTop: '20px', fontSize: '0.8rem', color: '#888' }}>
                    Access requires a valid cryptographic identity key.
                </p>
            </div>
        </div>
    );
};

export default Login;
