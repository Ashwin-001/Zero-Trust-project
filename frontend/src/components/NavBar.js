import React from 'react';
import '../App.css';
import { setAuthToken } from '../services/api';

function NavBar({ currentUser, onNavigate, onLogout }) {
  const handleLogout = () => {
    setAuthToken(null);
    onLogout();
  };

  return (
    <nav style={{
      background: 'rgba(0, 0, 0, 0.2)',
      padding: '15px 20px',
      color: 'white',
      marginBottom: '20px',
      borderRadius: '8px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: '0', fontSize: '20px' }}>🔐 Zero Trust Framework</h2>
          <small>Logged in as: {currentUser?.username} ({currentUser?.role})</small>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="button secondary" onClick={() => onNavigate('access')}>
            Access Request
          </button>
          <button className="button secondary" onClick={() => onNavigate('audit')}>
            Audit Logs
          </button>
          <button className="button secondary" onClick={() => onNavigate('sessions')}>
            Session Monitor
          </button>
          <button className="button secondary" onClick={() => onNavigate('zkp-demo')}>
            ZKP Demo
          </button>
          <button className="button secondary" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default NavBar;
