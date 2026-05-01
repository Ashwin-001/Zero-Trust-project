import React, { useState, useEffect } from 'react';
import '../App.css';
import { accessAPI } from '../services/api';

function AccessRequestPage({ currentUser, onNavigate, onSessionCreated }) {
  const [resources, setResources] = useState([]);
  const [selectedResource, setSelectedResource] = useState(null);
  const [currentLocation, setCurrentLocation] = useState('Office');
  const [deviceTrust, setDeviceTrust] = useState(70);
  const [loading, setLoading] = useState(false);
  const [decision, setDecision] = useState(null);
  const [details, setDetails] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { loadResources(); }, []);

  const loadResources = async () => {
    try { const data = await accessAPI.getResources(); setResources(data.resources); }
    catch (err) { setError('Failed to load resources'); }
  };

  const handleRequestAccess = async () => {
    if (!selectedResource) { setError('Please select a resource'); return; }
    setLoading(true); setError(''); setDecision(null); setDetails(null);
    try {
      const response = await accessAPI.requestAccess(selectedResource, currentLocation, deviceTrust);
      setDecision(response.decision);
      setDetails(response.detailed_evaluation);
      if (response.session && response.session.session_id && onSessionCreated) {
        onSessionCreated(response.session.session_id);
      }
    } catch (err) { setError(err.message || 'Access request failed'); }
    setLoading(false);
  };

  const ConfidenceBar = ({ value, label, color }) => (
    <div style={{ marginBottom: '6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
        <span>{label}</span><span>{(value * 100).toFixed(0)}%</span>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
        <div style={{ width: `${value * 100}%`, height: '100%', background: color, borderRadius: '4px', transition: 'width 0.5s' }}></div>
      </div>
    </div>
  );

  return (
    <div className="page">
      <h1 className="page-title">Access Request</h1>
      {error && <div className="error-message">{error}</div>}
      {currentUser && (
        <div className="info-message">
          <strong>Current User:</strong> {currentUser.username} ({currentUser.role} - {currentUser.department})
        </div>
      )}
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="form-group">
          <label>Select Resource to Access</label>
          <select value={selectedResource || ''} onChange={(e) => setSelectedResource(e.target.value)}>
            <option value="">-- Choose a Resource --</option>
            {resources.map((res) => (
              <option key={res.id} value={res.id}>{res.name} (Sensitivity: {res.sensitivity_level}/5)</option>
            ))}
          </select>
        </div>
        {selectedResource && (
          <div className="dark-panel" style={{ marginBottom: '20px' }}>
            {resources.filter((r) => r.id === selectedResource).map((res) => (
              <div key={res.id}>
                <p style={{ color: 'var(--text-secondary)' }}><strong style={{ color: 'var(--text-primary)' }}>Type:</strong> {res.type}</p>
                <p style={{ color: 'var(--text-secondary)' }}><strong style={{ color: 'var(--text-primary)' }}>Sensitivity:</strong> {res.sensitivity_level}/5</p>
                <p style={{ color: 'var(--text-secondary)' }}><strong style={{ color: 'var(--text-primary)' }}>Required Role:</strong> {res.required_role}</p>
                {res.required_departments.length > 0 && (
                  <p style={{ color: 'var(--text-secondary)' }}><strong style={{ color: 'var(--text-primary)' }}>Departments:</strong> {res.required_departments.join(', ')}</p>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="form-group">
          <label>Location</label>
          <select value={currentLocation} onChange={(e) => setCurrentLocation(e.target.value)}>
            <option value="Office">Office</option>
            <option value="Remote">Remote</option>
            <option value="Mobile">Mobile</option>
          </select>
        </div>
        <div className="form-group">
          <label>Device Trust ({deviceTrust}/100)</label>
          <input type="range" min="0" max="100" value={deviceTrust} onChange={(e) => setDeviceTrust(parseInt(e.target.value))} />
        </div>
        <button className="button" onClick={handleRequestAccess} disabled={loading || !selectedResource} style={{ width: '100%' }}>
          {loading ? 'Processing...' : 'Request Access'}
        </button>
      </div>

      {decision && (
        <div style={{ marginTop: '40px', maxWidth: '700px', margin: '40px auto 0' }}>
          <h2 style={{ marginBottom: '20px', color: 'var(--text-primary)' }}>Access Decision Result</h2>
          <div className={'decision-card ' + decision.decision.toLowerCase()}>
            <div style={{ marginBottom: '15px' }}>
              <span className={'decision-badge badge-' + decision.decision.toLowerCase()}>{decision.decision}</span>
            </div>
            <p style={{ marginBottom: '15px', color: 'var(--text-secondary)' }}>{decision.reason}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div className="dark-panel">
                <strong style={{ color: 'var(--text-primary)' }}>Risk Score:</strong>
                <div style={{ fontSize: '24px', color: 'var(--primary)', marginTop: '5px' }}>{decision.risk_score}/100</div>
                <small style={{ color: 'var(--text-secondary)' }}>{decision.risk_level}</small>
              </div>
              <div className="dark-panel">
                <strong style={{ color: 'var(--text-primary)' }}>ABAC Score:</strong>
                <div style={{ fontSize: '24px', color: 'var(--primary)', marginTop: '5px' }}>{(decision.abac_score * 100).toFixed(0)}%</div>
              </div>
            </div>
            {decision.recommendations && decision.recommendations.length > 0 && (
              <div style={{ marginBottom: '15px' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Recommendations:</strong>
                <ul style={{ marginLeft: '20px', marginTop: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  {decision.recommendations.map((rec, idx) => (<li key={idx}>{rec}</li>))}
                </ul>
              </div>
            )}
            {decision.conditions && (
              <div className="dark-panel" style={{ borderColor: 'rgba(252,238,10,0.3)' }}>
                <strong style={{ color: 'var(--warning)' }}>Conditions:</strong>
                <ul style={{ marginLeft: '20px', marginTop: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  {decision.conditions.multi_factor_auth_required && <li>Multi-Factor Auth</li>}
                  {decision.conditions.session_monitoring_required && <li>Session Monitoring</li>}
                  {decision.conditions.time_limited_access && <li>Time Limited ({decision.time_limit_minutes} min)</li>}
                  {decision.conditions.resource_logging_required && <li>All Actions Logged</li>}
                </ul>
              </div>
            )}
          </div>

          {/* ML Analysis Card */}
          {details && details.ml_analysis && (
            <div className="dark-panel" style={{ marginTop: '20px', borderColor: details.ml_analysis.model_available ? 'rgba(0,240,255,0.3)' : 'var(--glass-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '18px', marginRight: '8px' }}>🤖</span>
                <strong style={{ color: 'var(--text-primary)', fontSize: '16px' }}>ML Model Analysis</strong>
              </div>
              {!details.ml_analysis.model_available ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                  Model not yet trained. Make more access requests, then train the model from the Dashboard to enable ML predictions.
                </p>
              ) : (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Predicted: </span>
                      <span className={'badge badge-' + (details.ml_analysis.predicted_decision === 'ALLOW' ? 'success' : details.ml_analysis.predicted_decision === 'DENY' ? 'danger' : 'warning')}>
                        {details.ml_analysis.predicted_decision}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Confidence: </span>
                      <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{(details.ml_analysis.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                  {/* Confidence bars */}
                  <div style={{ marginBottom: '12px' }}>
                    {details.ml_analysis.probabilities && Object.entries(details.ml_analysis.probabilities)
                      .sort((a, b) => b[1] - a[1])
                      .map(([label, prob]) => (
                        <ConfidenceBar
                          key={label}
                          label={label}
                          value={prob}
                          color={label === 'ALLOW' ? 'var(--success)' : label === 'DENY' ? 'var(--danger)' : 'var(--warning)'}
                        />
                      ))
                    }
                  </div>
                  {/* Agreement indicator */}
                  <div style={{ padding: '8px 12px', borderRadius: '8px', background: details.ml_analysis.agrees_with_rules ? 'rgba(0,255,157,0.08)' : 'rgba(255,0,60,0.08)', border: details.ml_analysis.agrees_with_rules ? '1px solid rgba(0,255,157,0.2)' : '1px solid rgba(255,0,60,0.2)' }}>
                    <span style={{ fontSize: '14px', color: details.ml_analysis.agrees_with_rules ? 'var(--success)' : 'var(--danger)' }}>
                      {details.ml_analysis.agrees_with_rules ? '✓ ML agrees with rule-based decision' : '⚠ ML disagrees with rule-based decision'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Detailed Evaluation */}
          {details && (
            <div className="grid" style={{ marginTop: '20px' }}>
              <div className="card">
                <div className="card-title">RBAC</div>
                <div className="card-description">{details.rbac.passed ? '✅ PASS' : '❌ FAIL'}</div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{details.rbac.reason}</p>
              </div>
              <div className="card">
                <div className="card-title">ABAC</div>
                <div className="card-description">Score: {(details.abac.weighted_score * 100).toFixed(1)}%</div>
                <ul style={{ fontSize: '13px', color: 'var(--text-secondary)', marginLeft: '16px', marginTop: '6px' }}>
                  <li>Dept: {(details.abac.department_score * 100).toFixed(0)}%</li>
                  <li>Device: {(details.abac.device_trust_score * 100).toFixed(0)}%</li>
                  <li>Location: {(details.abac.location_score * 100).toFixed(0)}%</li>
                  <li>Sensitivity: {(details.abac.sensitivity_score * 100).toFixed(0)}%</li>
                </ul>
              </div>
              <div className="card">
                <div className="card-title">Risk</div>
                <div className="card-description">{details.risk.overall_score.toFixed(1)} ({details.risk.risk_level})</div>
                <ul style={{ fontSize: '13px', color: 'var(--text-secondary)', marginLeft: '16px', marginTop: '6px' }}>
                  <li>Login: {(details.risk.factors.login_attempts * 100).toFixed(0)}%</li>
                  <li>Time: {(details.risk.factors.time_of_access * 100).toFixed(0)}%</li>
                  <li>Location: {(details.risk.factors.location_change * 100).toFixed(0)}%</li>
                  <li>Device: {(details.risk.factors.device_risk * 100).toFixed(0)}%</li>
                  <li>Dept: {(details.risk.factors.department_mismatch * 100).toFixed(0)}%</li>
                </ul>
              </div>
            </div>
          )}
          <button className="button" onClick={() => onNavigate('audit')} style={{ marginTop: '20px', width: '100%' }}>View Audit Logs</button>
        </div>
      )}
    </div>
  );
}

export default AccessRequestPage;