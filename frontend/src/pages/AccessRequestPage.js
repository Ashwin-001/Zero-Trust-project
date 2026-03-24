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

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      const data = await accessAPI.getResources();
      setResources(data.resources);
    } catch (err) {
      setError('Failed to load resources');
    }
  };

  const handleRequestAccess = async () => {
    if (!selectedResource) {
      setError('Please select a resource');
      return;
    }

    setLoading(true);
    setError('');
    setDecision(null);
    setDetails(null);

    try {
      const response = await accessAPI.requestAccess(
        selectedResource,
        currentLocation,
        deviceTrust
      );
      setDecision(response.decision);
      setDetails(response.detailed_evaluation);

      // Continuous verification: notify App of new session
      if (response.session && response.session.session_id && onSessionCreated) {
        onSessionCreated(response.session.session_id);
      }
    } catch (err) {
      setError(err.message || 'Access request failed');
    }
    setLoading(false);
  };

  return (
    <div className="page">
      <h1 className="page-title">📋 Access Request</h1>

      {error && <div className="error-message">{error}</div>}
      {currentUser && (
        <div className="info-message">
          <strong>Current User:</strong> {currentUser.username} ({currentUser.role} - {currentUser.department})
        </div>
      )}

      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="form-group">
          <label>Select Resource to Access</label>
          <select
            value={selectedResource || ''}
            onChange={(e) => setSelectedResource(e.target.value)}
          >
            <option value="">-- Choose a Resource --</option>
            {resources.map((res) => (
              <option key={res.id} value={res.id}>
                {res.name} (Sensitivity: {res.sensitivity_level}/5)
              </option>
            ))}
          </select>
        </div>

        {selectedResource && (
          <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '4px', marginBottom: '20px' }}>
            {resources
              .filter((r) => r.id === selectedResource)
              .map((res) => (
                <div key={res.id}>
                  <p>
                    <strong>Resource Type:</strong> {res.type}
                  </p>
                  <p>
                    <strong>Sensitivity Level:</strong> {res.sensitivity_level}/5
                  </p>
                  <p>
                    <strong>Required Role:</strong> {res.required_role}
                  </p>
                  {res.required_departments.length > 0 && (
                    <p>
                      <strong>Required Departments:</strong> {res.required_departments.join(', ')}
                    </p>
                  )}
                </div>
              ))}
          </div>
        )}

        <div className="form-group">
          <label>Your Current Location</label>
          <select value={currentLocation} onChange={(e) => setCurrentLocation(e.target.value)}>
            <option value="Office">Office</option>
            <option value="Remote">Remote</option>
            <option value="Mobile">Mobile</option>
          </select>
        </div>

        <div className="form-group">
          <label>Device Trust Score ({deviceTrust}/100)</label>
          <input
            type="range"
            min="0"
            max="100"
            value={deviceTrust}
            onChange={(e) => setDeviceTrust(parseInt(e.target.value))}
          />
          <small style={{ color: '#999' }}>
            Adjust based on device security posture. Higher = more secure device.
          </small>
        </div>

        <button
          className="button"
          onClick={handleRequestAccess}
          disabled={loading || !selectedResource}
          style={{ width: '100%' }}
        >
          {loading ? 'Processing...  ' : 'Request Access'}
        </button>
      </div>

      {decision && (
        <div style={{ marginTop: '40px', maxWidth: '600px', margin: '40px auto 0' }}>
          <h2 style={{ marginBottom: '20px', color: '#333' }}>⚖️ Access Decision Result</h2>

          <div className={`decision-card ${decision.decision.toLowerCase()}`}>
            <div style={{ marginBottom: '15px' }}>
              <span className={`decision-badge badge-${decision.decision.toLowerCase()}`}>
                {decision.decision}
              </span>
            </div>

            <p style={{ marginBottom: '15px', color: '#666' }}>{decision.reason}</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '4px' }}>
                <strong>Risk Score:</strong>
                <div style={{ fontSize: '24px', color: '#667eea', marginTop: '5px' }}>
                  {decision.risk_score}/100
                </div>
                <small style={{ color: '#999' }}>{decision.risk_level}</small>
              </div>

              <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '4px' }}>
                <strong>ABAC Score:</strong>
                <div style={{ fontSize: '24px', color: '#667eea', marginTop: '5px' }}>
                  {(decision.abac_score * 100).toFixed(0)}%
                </div>
              </div>
            </div>

            {decision.recommendations && decision.recommendations.length > 0 && (
              <div>
                <strong>Recommendations:</strong>
                <ul style={{ marginLeft: '20px', marginTop: '8px', fontSize: '14px', color: '#666' }}>
                  {decision.recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            {decision.conditions && (
              <div style={{ marginTop: '20px', background: '#fff3e0', padding: '12px', borderRadius: '4px', color: '#e65100' }}>
                <strong>Conditions Required:</strong>
                <ul style={{ marginLeft: '20px', marginTop: '8px', fontSize: '14px' }}>
                  {decision.conditions.multi_factor_auth_required && <li>✓ Multi-Factor Authentication</li>}
                  {decision.conditions.session_monitoring_required && <li>✓ Session Monitoring Enabled</li>}
                  {decision.conditions.time_limited_access && (
                    <li>✓ Time Limited Access ({decision.time_limit_minutes} minutes)</li>
                  )}
                  {decision.conditions.one_time_approval_required && <li>✓ One-Time Approval Required</li>}
                  {decision.conditions.resource_logging_required && <li>✓ All Actions Will Be Logged</li>}
                </ul>
              </div>
            )}

            <button
              className="button"
              onClick={() => onNavigate('audit')}
              style={{ marginTop: '20px', width: '100%' }}
            >
              View Audit Logs
            </button>
          </div>

          {details && (
            <div className="grid" style={{ marginTop: '30px' }}>
              <div className="card">
                <div className="card-title">RBAC Evaluation</div>
                <div className="card-description">
                  <strong>Status:</strong>{' '}
                  {details.rbac.passed ? 'PASS' : 'FAIL'}
                </div>
                <p style={{ fontSize: '14px', color: '#666' }}>{details.rbac.reason}</p>
              </div>

              <div className="card">
                <div className="card-title">ABAC Evaluation</div>
                <div className="card-description">
                  <strong>Weighted Score:</strong>{' '}
                  {(details.abac.weighted_score * 100).toFixed(1)}%
                </div>
                <ul style={{ fontSize: '14px', color: '#666', marginLeft: '18px', marginTop: '8px' }}>
                  <li>Department: {(details.abac.department_score * 100).toFixed(0)}%</li>
                  <li>Device Trust: {(details.abac.device_trust_score * 100).toFixed(0)}%</li>
                  <li>Location: {(details.abac.location_score * 100).toFixed(0)}%</li>
                  <li>Sensitivity: {(details.abac.sensitivity_score * 100).toFixed(0)}%</li>
                </ul>
              </div>

              <div className="card">
                <div className="card-title">Risk Evaluation</div>
                <div className="card-description">
                  <strong>Overall:</strong> {details.risk.overall_score.toFixed(2)} ({details.risk.risk_level})
                </div>
                <ul style={{ fontSize: '14px', color: '#666', marginLeft: '18px', marginTop: '8px' }}>
                  <li>Login Attempts: {(details.risk.factors.login_attempts * 100).toFixed(0)}%</li>
                  <li>Time of Access: {(details.risk.factors.time_of_access * 100).toFixed(0)}%</li>
                  <li>Location Change: {(details.risk.factors.location_change * 100).toFixed(0)}%</li>
                  <li>Device Risk: {(details.risk.factors.device_risk * 100).toFixed(0)}%</li>
                  <li>Dept Mismatch: {(details.risk.factors.department_mismatch * 100).toFixed(0)}%</li>
                  <li>
                    Access Pattern:{' '}
                    {(
                      (details.risk.factors.access_pattern ?? details.risk.factors.access_pattern_anomaly) * 100
                    ).toFixed(0)}
                    %
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AccessRequestPage;
