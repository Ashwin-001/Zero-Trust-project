import React, { useState } from 'react';
import '../App.css';
import { zkpAPI } from '../services/api';

function ZkpDemoPage({ currentUser }) {
  const [userId, setUserId] = useState(currentUser?.username || '');
  const [challenge, setChallenge] = useState('');
  const [response, setResponse] = useState('');
  const [correctResponse, setCorrectResponse] = useState('');
  const [verification, setVerification] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerateChallenge = async () => {
    setError('');
    setVerification(null);
    setChallenge('');
    if (!userId) {
      setError('Please enter a user id (username).');
      return;
    }
    try {
      setLoading(true);
      const data = await zkpAPI.generateChallenge(userId);
      setChallenge(data.challenge);
    } catch (e) {
      setError(e.message || 'Failed to generate challenge');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError('');
    setVerification(null);
    if (!userId || !response || !correctResponse) {
      setError('Please provide user id, response, and expected response.');
      return;
    }
    try {
      setLoading(true);
      const data = await zkpAPI.verifyResponse(userId, response, correctResponse);
      setVerification(data);
    } catch (e) {
      setError(e.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <h1 className="page-title">🔏 ZKP-Inspired Authentication Demo</h1>

      <p style={{ color: '#666', marginBottom: '20px' }}>
        This demo simulates a challenge–response protocol inspired by Zero Knowledge Proofs.
        The server issues a random challenge, and the client proves knowledge of a secret by
        responding correctly — without sending the secret itself.
      </p>

      {error && <div className="error-message">{error}</div>}

      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="form-group">
          <label>User ID (e.g., username)</label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Enter user identifier"
          />
        </div>

        <button
          className="button"
          onClick={handleGenerateChallenge}
          disabled={loading}
          style={{ width: '100%', marginBottom: '20px' }}
        >
          {loading ? 'Generating...' : 'Generate Challenge'}
        </button>

        {challenge && (
          <div className="info-message">
            <strong>Challenge for {userId}:</strong>
            <div style={{ fontFamily: 'monospace', fontSize: '13px', marginTop: '8px', wordBreak: 'break-all' }}>
              {challenge}
            </div>
            <p style={{ marginTop: '10px', fontSize: '13px', color: '#555' }}>
              In a real ZKP protocol, the client would combine this challenge with its secret
              to compute a response. Here you can experiment by choosing an expected response
              and a client response to see constant-time verification.
            </p>
          </div>
        )}

        <div className="form-group">
          <label>Expected Response (correct value)</label>
          <input
            type="text"
            value={correctResponse}
            onChange={(e) => setCorrectResponse(e.target.value)}
            placeholder="Enter the response the server considers correct"
          />
        </div>

        <div className="form-group">
          <label>Client Response (what the client sends)</label>
          <input
            type="text"
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Enter the response to verify"
          />
        </div>

        <button
          className="button secondary"
          onClick={handleVerify}
          disabled={loading || !challenge}
          style={{ width: '100%' }}
        >
          {loading ? 'Verifying...' : 'Verify Response'}
        </button>

        {verification && (
          <div style={{ marginTop: '20px' }}>
            <div className={verification.valid ? 'success-message' : 'error-message'}>
              <strong>Verification Result:</strong>{' '}
              {verification.valid ? 'Valid proof accepted' : 'Invalid response rejected'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ZkpDemoPage;

