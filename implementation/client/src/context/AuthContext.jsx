import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    // Default Safe Device
    const [deviceHealth, setDeviceHealth] = useState({
        antivirus: true,
        os: 'Windows 11',
        ipReputation: 'Good',
        location: 'Safe Zone'
    });

    useEffect(() => {
        // Persist device health across reloads for simulation consistency
        const stored = localStorage.getItem('deviceInfo');
        if (stored) setDeviceHealth(JSON.parse(stored));

        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        if (token && storedUser) {
            setUser(JSON.parse(storedUser));
        }

        // Automatic Detection Logic
        const detectSystem = async () => {
            let detectedOS = 'Unknown OS';
            const userAgent = window.navigator.userAgent;

            if (userAgent.indexOf("Win") !== -1) detectedOS = "Windows";
            if (userAgent.indexOf("Mac") !== -1) detectedOS = "MacOS";
            if (userAgent.indexOf("X11") !== -1) detectedOS = "UNIX";
            if (userAgent.indexOf("Linux") !== -1) detectedOS = "Linux";
            if (userAgent.indexOf("Android") !== -1) detectedOS = "Android";
            if (userAgent.indexOf("iPhone") !== -1) detectedOS = "iOS";

            let detectedIP = 'Fetching...';
            let detectedLocation = 'Unknown';

            try {
                const res = await fetch('https://ipapi.co/json/');
                const data = await res.json();
                detectedIP = data.ip || 'Unknown';
                detectedLocation = data.city ? `${data.city}, ${data.country_name}` : 'Unknown Location';
            } catch (err) {
                console.error("GeoIP Fetch Error:", err);
                detectedIP = '127.0.0.1 (Offline)';
                detectedLocation = 'Localhost';
            }

            // Simulating Antivirus Check (Real access is blocked by browser sandbox)
            // We assume secure unless explicitly compromised logic is added
            const isSecure = true;

            setDeviceHealth(prev => ({
                ...prev,
                os: detectedOS,
                location: detectedLocation,
                ipReputation: 'Good', // Kept as 'Good' for now, could be based on IP blocklists
                antivirus: isSecure,
                ip: detectedIP // Added actual IP field
            }));
        };

        detectSystem();
    }, []);

    useEffect(() => {
        localStorage.setItem('deviceInfo', JSON.stringify(deviceHealth));
    }, [deviceHealth]);

    const login = async (privateKey) => {
        const res = await api.post('/auth/login', { private_key: privateKey });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify({ username: res.data.username, role: res.data.role }));
        setUser({ username: res.data.username, role: res.data.role });
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    const updateDeviceHealth = (key, value) => {
        setDeviceHealth(prev => ({ ...prev, [key]: value }));
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, deviceHealth, updateDeviceHealth }}>
            {children}
        </AuthContext.Provider>
    );
};
