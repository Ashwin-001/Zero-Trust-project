import React, { useState } from 'react';
import '../App.css';
import { authAPI } from '../services/api';

function RegisterPage({ onNavigate }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const [department, setDepartment] = useState('IT');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const validDepartments = ['IT', 'Finance', 'HR', 'Dev', 'Operations', 'Marketing'];

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (username.length < 3 || username.length > 30) { setError('Username must be 3-30 characters'); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) { setError('Username can only contain letters, numbers, and underscores'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Please enter a valid email address'); return; }

    setLoading(true);
    try {
      await authAPI.register(username, password, email, role, department);
      setSuccess('Registration successful! You can now log in.');
      setUsername(''); setPassword(''); setConfirmPassword(''); setEmail('');
    } catch (err) { setError(err.message || 'Registration failed'); }
    setLoading(false);
  };

  return (
    <div className="page">
      <div style={{ maxWidth: '450px', margin: '0 auto' }}>
        <h1 className="page-title" style={{ textAlign: 'center' }}>📝 Create Account</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '30px' }}>
          Register a new user for the Zero Trust framework
        </p>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label>Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="3-30 chars: letters, numbers, underscores" required minLength={3} maxLength={30} />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@company.com" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" required minLength={6} />
            {password && (
              <small style={{ color: password.length >= 8 ? 'var(--success)' : 'var(--warning)' }}>
                Strength: {password.length >= 10 ? 'Strong' : password.length >= 8 ? 'Good' : password.length >= 6 ? 'Fair' : 'Too short'}
              </small>
            )}
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat your password" required />
            {confirmPassword && password !== confirmPassword && (
              <small style={{ color: 'var(--danger)' }}>Passwords do not match</small>
            )}
          </div>
          <div className="form-group">
            <label>Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="viewer">Viewer</option>
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </select>
            <small style={{ color: 'var(--text-secondary)' }}>Determines RBAC access level</small>
          </div>
          <div className="form-group">
            <label>Department</label>
            <select value={department} onChange={(e) => setDepartment(e.target.value)}>
              {validDepartments.map((dept) => (<option key={dept} value={dept}>{dept}</option>))}
            </select>
            <small style={{ color: 'var(--text-secondary)' }}>Used for ABAC attribute evaluation</small>
          </div>
          <button type="submit" className="button" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Registering...' : 'Create Account'}
          </button>
        </form>

        <hr style={{ margin: '30px 0', border: 'none', borderTop: '1px solid var(--glass-border)' }} />

        <button type="button" className="button secondary" onClick={() => onNavigate('login')} style={{ width: '100%' }}>
          ← Back to Login
        </button>

        <div className="dark-info-box" style={{ marginTop: '30px' }}>
          <strong style={{ color: 'var(--text-primary)' }}>ℹ️ About Registration:</strong>
          <ul style={{ marginTop: '10px', fontSize: '14px', color: 'var(--text-secondary)' }}>
            <li>Your password is hashed before storage (never stored in plaintext)</li>
            <li>Your role determines what resources you can access (RBAC)</li>
            <li>Your department is used for attribute-based policies (ABAC)</li>
            <li>New users start with a default device trust score of 50</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;