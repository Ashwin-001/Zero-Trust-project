import React, { useState, useEffect } from 'react';
import '../App.css';
import { auditAPI, metricsAPI } from '../services/api';

function AuditLogPage({ currentUser }) {
  const [auditLog, setAuditLog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [chainIntegrity, setChainIntegrity] = useState(null);
  const [metricsSummary, setMetricsSummary] = useState(null);
  const [error, setError] = useState('');

  const loadAuditData = async () => {
    setLoading(true);
    setError('');

    try {
      if (filter === 'all') {
        const data = await auditAPI.getAuditTrail();
        setAuditLog(data.audit_trail);
      } else if (filter === 'denied') {
        const data = await auditAPI.getDeniedAttempts();
        setAuditLog(data.denied_attempts);
      } else if (filter === 'high-risk') {
        const data = await auditAPI.getHighRiskAccesses(70);
        setAuditLog(data.high_risk_accesses);
      } else if (filter === 'my-history') {
        if (currentUser?.username) {
          const data = await auditAPI.getUserHistory(currentUser.username);
          setAuditLog(data.access_history);
        }
      }

      // Load summary metrics and integrity from dedicated metrics endpoints
      try {
        const summary = await metricsAPI.getSummary();
        setMetricsSummary(summary);
      } catch (e) {
        // ignore metrics failure
      }

      try {
        const integrity = await metricsAPI.checkIntegrity();
        setChainIntegrity(integrity);
      } catch (e) {
        // integrity check may fail; ignore
      }
    } catch (err) {
      setError(err.message || 'Failed to load audit logs');
    }
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    loadAuditData();
  }, [filter]);

  const getDecisionBadgeClass = (decision) => {
    switch (decision) {
      case 'ALLOW': return 'badge-success';
      case 'CONDITIONAL': return 'badge-warning';
      case 'DENY': return 'badge-danger';
      default: return '';
    }
  };

  const getRiskBadgeClass = (riskScore) => {
    if (riskScore < 40) return 'badge-success';
    if (riskScore < 70) return 'badge-warning';
    return 'badge-danger';
  };

  // Use blockchain_stats for all counts (persisted and aligned with records)
  const stats = metricsSummary?.blockchain_stats;

  return (
    <div className="page">
      <h1 className="page-title">📊 Audit Log & Blockchain Verification</h1>

      {error && <div className="error-message">{error}</div>}

      {chainIntegrity && metricsSummary && (
        <div className="info-message" style={{ borderLeft: chainIntegrity.valid ? '4px solid var(--success)' : '4px solid var(--danger)' }}>
          <strong>🔗 Blockchain Integrity:</strong> {chainIntegrity.valid ? '✓ Verified' : '✗ Tampered'}
          <div style={{ marginTop: '8px', fontSize: '14px' }}>
            Active Risk Profile: <strong>{metricsSummary.risk_profile}</strong>
          </div>
        </div>
      )}

      {stats && (
        <div className="audit-stats-grid">
          <div className="audit-stat-card audit-stat-allow">
            <div className="audit-stat-value">
              {stats.allow_count}
            </div>
            <div className="audit-stat-label">✓ Allowed</div>
          </div>
          <div className="audit-stat-card audit-stat-conditional">
            <div className="audit-stat-value">
              {stats.conditional_count}
            </div>
            <div className="audit-stat-label">⚠ Conditional</div>
          </div>
          <div className="audit-stat-card audit-stat-deny">
            <div className="audit-stat-value">
              {stats.deny_count}
            </div>
            <div className="audit-stat-label">✗ Denied</div>
          </div>
          <div className="audit-stat-card audit-stat-risk">
            <div className="audit-stat-value">
              {stats.average_risk_score}
            </div>
            <div className="audit-stat-label">Avg Risk</div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          className={`button ${filter === 'all' ? '' : 'secondary'}`}
          onClick={() => setFilter('all')}
        >
          All Logs
        </button>
        <button
          className={`button ${filter === 'denied' ? '' : 'secondary'}`}
          onClick={() => setFilter('denied')}
        >
          Denied
        </button>
        {currentUser?.role === 'admin' && (
          <button
            className={`button ${filter === 'high-risk' ? '' : 'secondary'}`}
            onClick={() => setFilter('high-risk')}
          >
            High Risk
          </button>
        )}
        <button
          className={`button ${filter === 'my-history' ? '' : 'secondary'}`}
          onClick={() => setFilter('my-history')}
        >
          My History
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="spinner"></div>
        </div>
      ) : (
        <>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '15px' }}>Total Records: {auditLog.length}</p>

          {auditLog.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              No audit logs found. Make some access requests first!
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Block ID</th>
                    <th>User</th>
                    <th>Resource</th>
                    <th>Decision</th>
                    <th>Risk Score</th>
                    <th>Hash</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLog.map((log, idx) => (
                    <tr key={idx}>
                      <td>#{log.block_id}</td>
                      <td>{log.user_id}</td>
                      <td>{log.resource_id}</td>
                      <td>
                        <span className={`badge ${getDecisionBadgeClass(log.decision)}`}>
                          {log.decision}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getRiskBadgeClass(log.risk_score)}`}>
                          {log.risk_score}
                        </span>
                      </td>
                      <td style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'monospace', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {log.hash ? log.hash.substring(0, 12) + '...' : 'N/A'}
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AuditLogPage;