import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AccessRequestPage from './pages/AccessRequestPage';
import DecisionPage from './pages/DecisionPage';
import AuditLogPage from './pages/AuditLogPage';
import ZkpDemoPage from './pages/ZkpDemoPage';
import SessionMonitorPage from './pages/SessionMonitorPage';
import AnalyticsPage from './pages/AnalyticsPage';
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

  const verifySession = useCallback(async () => {
    try {
      const response = await authAPI.verifyToken();
      if (response.user) {
        setCurrentUser(response.user);
        setCurrentPage('dashboard');
      } else {
        setAuthToken(null);
        setCurrentPage('login');
      }
    } catch (error) {
      console.log('Session expired');
      setAuthToken(null);
      setCurrentPage('login');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      verifySession();
    } else {
      setLoading(false);
    }
  }, [verifySession]);

  const handleLogin = (userData) => {
    setCurrentUser(userData);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setAuthToken(null);
    setCurrentUser(null);
    setActiveSessionId(null);
    setSessionWarnings([]);
    setCurrentPage('login');
  };

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
        {currentPage === 'login' && <LoginPage onLogin={handleLogin} onNavigate={setCurrentPage} />}
        {currentPage === 'register' && <RegisterPage onNavigate={setCurrentPage} />}
        {currentPage === 'dashboard' && (
          <DashboardPage currentUser={currentUser} onNavigate={setCurrentPage} />
        )}
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
        {currentPage === 'analytics' && <AnalyticsPage currentUser={currentUser} />}
      </div>
    </div>
  );
}

export default App;