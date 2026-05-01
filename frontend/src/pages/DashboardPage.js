import React, { useState, useEffect } from 'react';
import '../App.css';
import { accessAPI, auditAPI, mlAPI } from '../services/api';

function DashboardPage({ currentUser, onNavigate }) {
  const [decisionStats, setDecisionStats] = useState(null);
  const [auditStats, setAuditStats] = useState(null);
  const [integrity, setIntegrity] = useState(null);
  const [recentTrail, setRecentTrail] = useState([]);
  const [mlStatus, setMlStatus] = useState(null);
  const [mlTraining, setMlTraining] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, trailRes] = await Promise.all([
        accessAPI.getDecisionStats().catch(() => null),
        auditAPI.getAuditTrail(null, null, null).catch(() => ({ audit_trail: [] })),
      ]);

      if (statsRes) setDecisionStats(statsRes);
      setRecentTrail((trailRes.audit_trail || []).slice(-10).reverse());

      // Load ML status
      try {
        const mlRes = await mlAPI.getStatus();
        setMlStatus(mlRes);
      } catch (e) { /* ignore */ }

      if (currentUser?.role === 'admin') {
        const [auditStatsRes, integrityRes] = await Promise.all([
          auditAPI.getStatistics().catch(() => null),
          auditAPI.checkChainIntegrity().catch(() => null),
        ]);
        if (auditStatsRes) setAuditStats(auditStatsRes.audit_statistics);
        if (integrityRes) setIntegrity(integrityRes);
      }
    } catch (err) {
      setError('Failed to load dashboard data');
    }
    setLoading(false);
  };

  const getDecisionBadgeClass = (decision) => {
    switch (decision) {
      case 'ALLOW': return 'badge-success';
      case 'CONDITIONAL': return 'badge-warning';
      case 'DENY': return 'badge-danger';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="page">
        <h1 className="page-title">📊 Dashboard</h1>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <h1 className="page-title">📊 Dashboard</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>
        Welcome back, <strong style={{ color: 'var(--text-primary)' }}>{currentUser?.username}</strong> ({currentUser?.role})
      </p>

      {error && <div className="error-message">{error}</div>}

      {/* Quick Actions */}
      <div className="grid" style={{ marginBottom: '30px' }}>
        <div className="card" onClick={() => onNavigate('access')} style={{ cursor: 'pointer' }}>
          <div className="card-title">📋 Request Access</div>
          <div className="card-description">Submit a new access request through the Zero Trust engine</div>
        </div>
        <div className="card" onClick={() => onNavigate('audit')} style={{ cursor: 'pointer' }}>
          <div className="card-title">🔗 Audit Logs</div>
          <div className="card-description">View blockchain-secured audit trail</div>
        </div>
        <div className="card" onClick={() => onNavigate('sessions')} style={{ cursor: 'pointer' }}>
          <div className="card-title">🛡️ Sessions</div>
          <div className="card-description">Monitor active sessions &amp; continuous verification</div>
        </div>
        <div className="card" onClick={() => onNavigate('zkp-demo')} style={{ cursor: 'pointer' }}>
          <div className="card-title">🔑 ZKP Demo</div>
          <div className="card-description">Zero Knowledge Proof authentication demo</div>
        </div>
      </div>

      {/* Statistics Cards */}
      <h2 style={{ marginBottom: '15px', color: 'var(--text-primary)' }}>System Overview</h2>
      <div className="grid" style={{ marginBottom: '30px' }}>
        {decisionStats ? (
          <>
            <div className="card">
              <div className="card-title">Total Decisions</div>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: 'var(--primary)' }}>
                {decisionStats.total_decisions}
              </div>
            </div>
            <div className="card">
              <div className="card-title" style={{ color: 'var(--success)' }}>✅ Allowed</div>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: 'var(--success)' }}>
                {decisionStats.allow_count}
              </div>
            </div>
            <div className="card">
              <div className="card-title" style={{ color: 'var(--warning)' }}>⚠️ Conditional</div>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: 'var(--warning)' }}>
                {decisionStats.conditional_count}
              </div>
            </div>
            <div className="card">
              <div className="card-title" style={{ color: 'var(--danger)' }}>🚫 Denied</div>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: 'var(--danger)' }}>
                {decisionStats.deny_count}
              </div>
              {decisionStats.deny_percentage > 0 && (
                <small style={{ color: 'var(--text-secondary)' }}>{decisionStats.deny_percentage}% of total</small>
              )}
            </div>
          </>
        ) : (
          <div className="card">
            <div className="card-title">No Decisions Yet</div>
            <div className="card-description">Make an access request to see statistics</div>
          </div>
        )}
      </div>

      {/* Admin-only: Audit chain statistics */}
      {currentUser?.role === 'admin' && auditStats && (
        <>
          <h2 style={{ marginBottom: '15px', color: 'var(--text-primary)' }}>Audit Chain Health</h2>
          <div className="grid" style={{ marginBottom: '30px' }}>
            <div className="card">
              <div className="card-title">Blockchain Blocks</div>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: 'var(--primary)' }}>
                {auditStats.total_blocks}
              </div>
            </div>
            <div className="card">
              <div className="card-title">Average Risk Score</div>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: auditStats.average_risk_score > 60 ? 'var(--danger)' : 'var(--success)' }}>
                {auditStats.average_risk_score}
              </div>
            </div>
            <div className="card">
              <div className="card-title">Chain Integrity</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                {integrity?.integrity_verified ? (
                  <span style={{ color: 'var(--success)' }}>✅ Verified</span>
                ) : (
                  <span style={{ color: 'var(--danger)' }}>❌ Tampered</span>
                )}
              </div>
              {integrity && (
                <small style={{ color: 'var(--text-secondary)' }}>{integrity.message}</small>
              )}
            </div>
          </div>
        </>
      )}

      {/* Recent Activity */}
      <h2 style={{ marginBottom: '15px', color: 'var(--text-primary)' }}>Recent Activity</h2>
      {recentTrail.length > 0 ? (
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Block</th>
                <th>User</th>
                <th>Resource</th>
                <th>Decision</th>
                <th>Risk</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {recentTrail.map((entry, idx) => (
                <tr key={idx}>
                  <td>#{entry.block_id}</td>
                  <td>{entry.user_id}</td>
                  <td>{entry.resource_id}</td>
                  <td>
                    <span className={`badge ${getDecisionBadgeClass(entry.decision)}`}>
                      {entry.decision}
                    </span>
                  </td>
                  <td>{entry.risk_score}</td>
                  <td style={{ fontSize: '12px' }}>{new Date(entry.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card">
          <div className="card-description">No recent activity. Make an access request to get started.</div>
        </div>
      )}

      {/* ML Model Health */}
      {mlStatus && (
        <>
          <h2 style={{ marginTop: '30px', marginBottom: '15px', color: 'var(--text-primary)' }}>🤖 ML Model Health</h2>
          <div className="grid" style={{ marginBottom: '30px' }}>
            <div className="card">
              <div className="card-title">Model Status</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: mlStatus.model_trained ? 'var(--success)' : 'var(--warning)' }}>
                {mlStatus.model_trained ? '✅ Trained' : '⏳ Not Trained'}
              </div>
              <small style={{ color: 'var(--text-secondary)' }}>
                {mlStatus.training_samples} training samples collected
              </small>
            </div>
            <div className="card">
              <div className="card-title">Training Data</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--primary)' }}>
                {mlStatus.training_samples} events
              </div>
              <small style={{ color: 'var(--text-secondary)' }}>
                {mlStatus.ready_to_train ? 'Ready to train' : `Need ${mlStatus.min_samples_needed - mlStatus.training_samples} more`}
              </small>
            </div>
            <div className="card">
              <div className="card-title">Decision Distribution</div>
              {mlStatus.decision_distribution && Object.keys(mlStatus.decision_distribution).length > 0 ? (
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                  {Object.entries(mlStatus.decision_distribution).map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span>{k}</span>
                      <span style={{ fontWeight: 'bold', color: k === 'ALLOW' ? 'var(--success)' : k === 'DENY' ? 'var(--danger)' : 'var(--warning)' }}>{v}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <small style={{ color: 'var(--text-secondary)' }}>No data yet</small>
              )}
            </div>
            {currentUser?.role === 'admin' && (
              <div className="card">
                <div className="card-title">Train Model</div>
                <button
                  className="button"
                  disabled={mlTraining || !mlStatus.ready_to_train}
                  onClick={async () => {
                    setMlTraining(true);
                    try {
                      const res = await mlAPI.train();
                      alert(`✅ Model trained!\nAccuracy: ${(res.metrics.accuracy * 100).toFixed(1)}%\nSamples: ${res.metrics.samples}`);
                      const updated = await mlAPI.getStatus();
                      setMlStatus(updated);
                    } catch (err) { alert('Training failed: ' + err.message); }
                    setMlTraining(false);
                  }}
                  style={{ marginTop: '8px', width: '100%', padding: '8px 16px', fontSize: '12px' }}
                >
                  {mlTraining ? 'Training...' : 'Train Now'}
                </button>
                {!mlStatus.ready_to_train && (
                  <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '6px' }}>
                    Need at least {mlStatus.min_samples_needed} events
                  </small>
                )}
              </div>
            )}
          </div>
          {/* Feature Importance */}
          {mlStatus.feature_importance && Object.keys(mlStatus.feature_importance).length > 0 && (
            <div className="dark-panel" style={{ marginBottom: '30px' }}>
              <strong style={{ color: 'var(--text-primary)' }}>Top Feature Importance:</strong>
              <div style={{ marginTop: '10px' }}>
                {Object.entries(mlStatus.feature_importance).slice(0, 8).map(([name, imp]) => (
                  <div key={name} style={{ marginBottom: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      <span>{name.replace('num__', '').replace('cat__', '')}</span>
                      <span>{(imp * 100).toFixed(1)}%</span>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                      <div style={{ width: `${imp * 100 * 3}%`, maxWidth: '100%', height: '100%', background: 'var(--primary)', borderRadius: '4px' }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* User context info */}
      <h2 style={{ marginTop: '30px', marginBottom: '15px', color: 'var(--text-primary)' }}>Your Context</h2>
      <div className="grid">
        <div className="card">
          <div className="card-title">Role</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', textTransform: 'capitalize', color: 'var(--primary)' }}>
            {currentUser?.role}
          </div>
        </div>
        <div className="card">
          <div className="card-title">Department</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--primary)' }}>
            {currentUser?.department}
          </div>
        </div>
        <div className="card">
          <div className="card-title">Device Trust</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: currentUser?.device_trust_score >= 60 ? 'var(--success)' : 'var(--danger)' }}>
            {currentUser?.device_trust_score}/100
          </div>
        </div>
        <div className="card">
          <div className="card-title">Location</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--primary)' }}>
            {currentUser?.location}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;