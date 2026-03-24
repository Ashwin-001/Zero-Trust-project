import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import LoginPage from './pages/LoginPage';
import AccessRequestPage from './pages/AccessRequestPage';
import DecisionPage from './pages/DecisionPage';
import AuditLogPage from './pages/AuditLogPage';
import ZkpDemoPage from './pages/ZkpDemoPage';
import SessionMonitorPage from './pages/SessionMonitorPage';
import NavBar from './components/NavBar';
import { getAuthToken, setAuthToken, authAPI } from './services/api';
import useSessionHeartbeat from './hooks/useSessionHeartbeat';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('login');
  const [loading, setLoading] = useState(true);

  // Continuous verification state
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [sessionWarnings, setSessionWarnings] = useState([]);

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      verifySession();
    } else {
      setLoading(false);
    }
  }, []);

  const verifySession = async () => {
    try {
      const response = await authAPI.verifyToken();
      // Token is valid — restore user data from the response
      if (response.user) {
        setCurrentUser(response.user);
        setCurrentPage('access');
      } else {
        // Token valid but no user data; clear and redirect to login
        setAuthToken(null);
        setCurrentPage('login');
      }
    } catch (error) {
      console.log('Session expired');
      setAuthToken(null);
      setCurrentPage('login');
    }
    setLoading(false);
  };

  const handleLogin = (userData) => {
    setCurrentUser(userData);
    setCurrentPage('access');
  };

  const handleLogout = () => {
    setAuthToken(null);
    setCurrentUser(null);
    setActiveSessionId(null);
    setSessionWarnings([]);
    setCurrentPage('login');
  };

  // Called by AccessRequestPage when a session is created
  const handleSessionCreated = (sessionId) => {
    setActiveSessionId(sessionId);
    setSessionWarnings([]);
  };

  const handleSessionRevoked = useCallback((message) => {
    setActiveSessionId(null);
    setCurrentUser(null);
    setCurrentPage('login');
    alert('⚠️ Session Revoked: ' + message);
  }, []);

  const handleSessionWarning = useCallback((warnings) => {
    setSessionWarnings(warnings);
  }, []);

  // Heartbeat hook — continuous verification
  useSessionHeartbeat(
    activeSessionId,
    currentUser?.device_trust_score || 50,
    currentUser?.location || 'Office',
    handleSessionRevoked,
    handleSessionWarning
  );

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="App">
      {currentUser && <NavBar currentUser={currentUser} onNavigate={setCurrentPage} onLogout={handleLogout} />}

      {/* Session warning banner */}
      {sessionWarnings.length > 0 && (
        <div className="session-warning-banner">
          ⚠️ {sessionWarnings.join(' | ')}
        </div>
      )}
      
      <div className="main-container">
        {currentPage === 'login' && <LoginPage onLogin={handleLogin} />}
        {currentPage === 'access' && (
          <AccessRequestPage
            currentUser={currentUser}
            onNavigate={setCurrentPage}
            onSessionCreated={handleSessionCreated}
          />
        )}
        {currentPage === 'decision' && <DecisionPage onNavigate={setCurrentPage} />}
        {currentPage === 'audit' && <AuditLogPage currentUser={currentUser} onNavigate={setCurrentPage} />}
        {currentPage === 'zkp-demo' && <ZkpDemoPage currentUser={currentUser} />}
        {currentPage === 'sessions' && <SessionMonitorPage currentUser={currentUser} />}
      </div>
    </div>
  );
}

export default App;
