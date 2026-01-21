import './OAuthCallback.css';
import React, { useEffect, useContext, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const OAuthCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { googleLogin } = useContext(AuthContext);
    const [status, setStatus] = useState('Authenticating with Google...');

    useEffect(() => {
        const code = searchParams.get('code');
        if (code) {
            googleLogin(code)
                .then(() => {
                    navigate('/dashboard');
                })
                .catch((err) => {
                    console.error("Google Login Error", err);
                    setStatus('Login Failed. Please check console for details.');
                    setTimeout(() => navigate('/'), 3000);
                });
        } else {
            navigate('/');
        }
    }, [searchParams, googleLogin, navigate]);

    return (
        <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', background: '#0f172a' }}>
            <h2>{status}</h2>
        </div>
    );
};

export default OAuthCallback;
