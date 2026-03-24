import React, { useState, useEffect, useCallback } from 'react';
import '../App.css';
import { sessionAPI } from '../services/api';

function SessionMonitorPage({ currentUser }) {
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState(null);
  const [expandedSession, setExpandedSession] = useState(null);
  const [sessionHistory, setSessionHistory] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revokeLoading, setRevokeLoading] = useState(null);

  const isAdmin = currentUser?.role === 'admin';

  const loadSessions = useCallback(async () => {
    try {
      const data = await sessionAPI.getActiveSessions();
      setSessions(data.sessions || []);
      setStats(data.stats || null);
      setError('');
    } catch (err) {
      setError('Failed to load sessions');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSessions();
    // Auto-refresh every 10 seconds
    const interval = setInterval(loadSessions, 10000);
    return () => clearInterval(interval);
  }, [loadSessions]);

  const handleRevoke = async (sessionId) => {
    setRevokeLoading(sessionId);
    try {
      await sessionAPI.revokeSession(sessionId);
      await loadSessions();
    } catch (err) {
      setError(err.message || 'Failed to revoke session');
    }
    setRevokeLoading(null);
  };

  const handleToggleHistory = async (sessionId) => {
    if (expandedSession === sessionId) {
      setExpandedSession(null);
      return;
    }
    setExpandedSession(sessionId);
    if (!sessionHistory[sessionId]) {
      try {
        const data = await sessionAPI.getSessionHistory(sessionId);
        setSessionHistory((prev) => ({
          ...prev,
          [sessionId]: data.history || []
        }));
      } catch (err) {
        console.error('Failed to load session history');
      }
    }
  };

  const getRiskColor = (score) => {
    if (score < 20) return '#00ff9d';
    if (score < 50) return '#fcee0a';
    if (score < 75) return '#ff9800';
    return '#ff003c';
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'ACTIVE': return 'badge-session-active';
      case 'REVOKED': return 'badge-session-revoked';
      case 'EXPIRED': return 'badge-session-expired';
      default: return '';
    }
  };

  const getDecisionBadgeClass = (decision) => {
    switch (decision) {
      case 'ALLOW': return 'badge-allow';
      case 'CONDITIONAL': return 'badge-conditional';
      case 'DENY': return 'badge-deny';
      default: return '';
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '—';
    const d = new Date(isoString);
    return d.toLocaleTimeString();
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return '—';
    const d = new Date(isoString);
    return d.toLocaleString();
  };

  if (loading) {
    return (
      <div className="page">
        <h1 className="page-title">📡 Session Monitor</h1>
        <div className="loading">Loading sessions...</div>
      </div>
    );
  }

  return (
    <div className="page">
      <h1 className="page-title">📡 Continuous Verification Monitor</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
        Real-time session monitoring with continuous trust re-evaluation.
        Sessions are automatically re-evaluated on each heartbeat using
        RBAC + ABAC + Risk Scoring.
      </p>

      {error && <div className="error-message">{error}</div>}

      {/* Stats Overview */}
      {stats && (
        <div className="session-stats-grid">
          <div className="session-stat-card">
            <div className="session-stat-value" style={{ color: 'var(--primary)' }}>
              {stats.active_sessions}
            </div>
            <div className="session-stat-label">Active Sessions</div>
          </div>
          <div className="session-stat-card">
            <div className="session-stat-value" style={{ color: 'var(--danger)' }}>
              {stats.revoked_sessions}
            </div>
            <div className="session-stat-label">Revoked</div>
          </div>
          <div className="session-stat-card">
            <div className="session-stat-value" style={{ color: getRiskColor(stats.average_active_risk_score) }}>
              {stats.average_active_risk_score}
            </div>
            <div className="session-stat-label">Avg Risk Score</div>
          </div>
          <div className="session-stat-card">
            <div className="session-stat-value" style={{ color: 'var(--secondary)' }}>
              {stats.total_re_evaluations}
            </div>
            <div className="session-stat-label">Re-evaluations</div>
          </div>
        </div>
      )}

      {/* Sessions Table */}
      {sessions.length === 0 ? (
        <div className="info-message">
          No sessions found. Request access to a resource to create a monitored session.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="table session-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Resource</th>
                <th>Status</th>
                <th>Decision</th>
                <th>Risk Score</th>
                <th>Last Heartbeat</th>
                <th>Re-evals</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <React.Fragment key={session.session_id}>
                  <tr
                    className={`session-row ${session.status === 'REVOKED' ? 'session-row-revoked' : ''}`}
                    onClick={() => handleToggleHistory(session.session_id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td style={{ color: 'var(--text-primary)' }}>{session.user_id}</td>
                    <td>{session.resource_id.replace('resource_', '')}</td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(session.status)}`}>
                        <span className={session.status === 'ACTIVE' ? 'heartbeat-dot' : ''} />
                        {session.status}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getDecisionBadgeClass(session.current_decision)}`}>
                        {session.current_decision}
                      </span>
                    </td>
                    <td>
                      <span
                        className="risk-indicator"
                        style={{ color: getRiskColor(session.current_risk_score) }}
                      >
                        {session.current_risk_score}
                      </span>
                      <span style={{ fontSize: '11px', marginLeft: '6px', color: 'var(--text-secondary)' }}>
                        {session.current_risk_level}
                      </span>
                    </td>
                    <td style={{ fontSize: '13px' }}>{formatTime(session.last_heartbeat)}</td>
                    <td style={{ textAlign: 'center' }}>{session.re_evaluation_count}</td>
                    {isAdmin && (
                      <td>
                        {session.status === 'ACTIVE' && (
                          <button
                            className="button button-revoke"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRevoke(session.session_id);
                            }}
                            disabled={revokeLoading === session.session_id}
                          >
                            {revokeLoading === session.session_id ? '...' : 'Revoke'}
                          </button>
                        )}
                        {session.status === 'REVOKED' && (
                          <span style={{ fontSize: '12px', color: 'var(--danger)' }}>
                            {session.revoke_reason || 'revoked'}
                          </span>
                        )}
                      </td>
                    )}
                  </tr>

                  {/* Warnings row */}
                  {session.warnings && session.warnings.length > 0 && (
                    <tr className="session-warning-row">
                      <td colSpan={isAdmin ? 8 : 7}>
                        <div className="session-warning">
                          ⚠️ {session.warnings.join(' | ')}
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* Expanded history */}
                  {expandedSession === session.session_id && (
                    <tr className="session-history-row">
                      <td colSpan={isAdmin ? 8 : 7}>
                        <div className="session-history-panel">
                          <strong style={{ color: 'var(--text-primary)' }}>
                            Re-evaluation History
                          </strong>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                            Session created: {formatDateTime(session.created_at)}
                          </div>

                          {(!sessionHistory[session.session_id] ||
                            sessionHistory[session.session_id].length === 0) ? (
                            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                              No re-evaluations yet. Waiting for heartbeat...
                            </p>
                          ) : (
                            <table className="table" style={{ fontSize: '13px' }}>
                              <thead>
                                <tr>
                                  <th>Time</th>
                                  <th>Decision</th>
                                  <th>Risk</th>
                                  <th>Action</th>
                                  <th>Device Trust</th>
                                  <th>Location</th>
                                </tr>
                              </thead>
                              <tbody>
                                {sessionHistory[session.session_id].map((event, idx) => (
                                  <tr key={idx}>
                                    <td>{formatTime(event.timestamp)}</td>
                                    <td>
                                      <span className={`badge ${getDecisionBadgeClass(event.new_decision)}`}>
                                        {event.new_decision}
                                      </span>
                                    </td>
                                    <td style={{ color: getRiskColor(event.risk_score) }}>
                                      {event.risk_score}
                                    </td>
                                    <td>
                                      <span className={
                                        event.action_taken === 'revoked'
                                          ? 'history-action-revoked'
                                          : event.action_taken === 'downgraded'
                                            ? 'history-action-downgraded' : ''
                                      }>
                                        {event.action_taken}
                                      </span>
                                    </td>
                                    <td>{event.context_snapshot?.device_trust_score ?? '—'}</td>
                                    <td>{event.context_snapshot?.location ?? '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: '20px', fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center' }}>
        Auto-refreshing every 10 seconds • Click a session row to view re-evaluation history
      </div>
    </div>
  );
}

export default SessionMonitorPage;
