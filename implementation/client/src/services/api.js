import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_URL,
});

// Interceptor to add Token and Simulated Device Headers
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // Inject Simulated Device Info
    const startDevice = localStorage.getItem('deviceInfo');
    const deviceInfo = startDevice ? JSON.parse(startDevice) : {
        antivirus: true,
        os: 'Windows 11',
        ipReputation: 'Good',
        location: 'US-West'
    };

    config.headers['x-device-info'] = JSON.stringify(deviceInfo);

    return config;
});

// Interceptor to handle Session Expiry
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && (error.response.status === 401)) {
            // Token expired or invalid
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/'; // Force redirect to login
        }
        return Promise.reject(error);
    }
);

export default api;
