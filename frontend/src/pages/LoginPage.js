import React, { useState } from 'react';
import '../App.css';
import { authAPI, setAuthToken } from '../services/api';

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [deviceTrust, setDeviceTrust] = useState('70');
  const [location, setLocation] = useState('Office');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  const demoCredentials = [
    { username: 'admin_user', password: 'admin_pass', role: 'admin', dept: 'IT' },
    { username: 'john_employee', password: 'emp_pass', role: 'employee', dept: 'Finance' },
    { username: 'jane_viewer', password: 'viewer_pass', role: 'viewer', dept: 'HR' },
    { username: 'remote_employee', password: 'remote_pass', role: 'employee', dept: 'IT' }
  ];

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(username, password, parseInt(deviceTrust), location);
      setAuthToken(response.token);
      onLogin(response.user);
    } catch (err) {
      setError(err.message || 'Login failed');
    }
    setLoading(false);
  };

  const handleDemoLogin = async (cred) => {
    setUsername(cred.username);
    setPassword(cred.password);
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(cred.username, cred.password, parseInt(deviceTrust), location);
      setAuthToken(response.token);
      onLogin(response.user);
    } catch (err) {
      setError(err.message || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div className="page">
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        <h1 className="page-title" style={{ textAlign: 'center' }}>
          🔐 Zero Trust Security Framework
        </h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>
          Demonstrating RBAC, ABAC, Risk Scoring & Blockchain Auditing
        </p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>

          <div className="form-group">
            <label>Device Trust Score (0-100)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={deviceTrust}
              onChange={(e) => setDeviceTrust(e.target.value)}
            />
            <small style={{ color: '#999' }}>Represents device security posture</small>
          </div>

          <div className="form-group">
            <label>Current Location</label>
            <select value={location} onChange={(e) => setLocation(e.target.value)}>
              <option value="Office">Office</option>
              <option value="Remote">Remote</option>
              <option value="Mobile">Mobile</option>
            </select>
          </div>

          <button type="submit" className="button" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <hr style={{ margin: '30px 0', border: 'none', borderTop: '1px solid #ddd' }} />

        <button
          type="button"
          className="button secondary"
          onClick={() => setShowDemo(!showDemo)}
          style={{ width: '100%', marginBottom: '15px' }}
        >
          {showDemo ? 'Hide Demo Credentials' : 'Show Demo Credentials'}
        </button>

        {showDemo && (
          <div style={{ marginTop: '20px' }}>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
              <strong>Demo User Accounts:</strong>
            </p>
            <div style={{ display: 'grid', gap: '10px' }}>
              {demoCredentials.map((cred) => (
                <button
                  key={cred.username}
                  type="button"
                  className="card"
                  onClick={() => handleDemoLogin(cred)}
                  style={{ textAlign: 'left', cursor: 'pointer' }}
                >
                  <div className="card-title">{cred.username}</div>
                  <div className="card-description">
                    <strong>Role:</strong> {cred.role} | <strong>Dept:</strong> {cred.dept}
                  </div>
                  <small style={{ color: '#999' }}>Password: {cred.password}</small>
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: '30px', padding: '20px', background: '#f0f0f0', borderRadius: '8px' }}>
          <strong>ℹ️ System Features:</strong>
          <ul style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
            <li>✓ Privacy-Preserving Authentication (hashed passwords)</li>
            <li>✓ Role-Based Access Control (RBAC)</li>
            <li>✓ Attribute-Based Access Control (ABAC)</li>
            <li>✓ Risk Scoring Engine</li>
            <li>✓ Blockchain-Based Audit Logging</li>
            <li>✓ Decision Engine (Allow/Deny/Conditional)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
