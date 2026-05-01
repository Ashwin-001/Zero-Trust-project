
const API_BASE_URL = 'http://localhost:5000/api';

let authToken = localStorage.getItem('auth_token') || null;

export const setAuthToken = (token) => {
  authToken = token;
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
};

export const getAuthToken = () => authToken;

const makeRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  const response = await fetch(url, {
    ...options,
    headers
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'API Error');
  }
  
  return data;
};

// Authentication APIs
export const authAPI = {
  register: (username, password, email, role, department) =>
    makeRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, email, role, department })
    }),
  
  login: (username, password, deviceTrustScore = 50, location = 'Office') =>
    makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ 
        username, 
        password, 
        device_trust_score: deviceTrustScore,
        location 
      })
    }),
  
  logout: () =>
    makeRequest('/auth/logout', { method: 'POST' }),
  
  verifyToken: () =>
    makeRequest('/auth/verify-token', { method: 'POST' }),
  
  getUsers: () =>
    makeRequest('/auth/users', { method: 'GET' })
};

// Access Control APIs
export const accessAPI = {
  requestAccess: (resourceId, currentLocation = 'Office', deviceTrustScore) =>
    makeRequest('/access/request', {
      method: 'POST',
      body: JSON.stringify({ 
        resource_id: resourceId,
        current_location: currentLocation,
        ...(deviceTrustScore !== undefined && deviceTrustScore !== null
          ? { device_trust_score: deviceTrustScore }
          : {})
      })
    }),
  
  getResources: () =>
    makeRequest('/access/resources', { method: 'GET' }),
  
  getDecisionStats: () =>
    makeRequest('/access/decision-stats', { method: 'GET' }),
  
  getDeniedAccesses: () =>
    makeRequest('/access/denied-accesses', { method: 'GET' }),
  
  getHighRiskAccesses: (threshold = 70) =>
    makeRequest(`/access/high-risk-accesses?threshold=${threshold}`, { method: 'GET' })
};

// Audit APIs
export const auditAPI = {
  getAuditTrail: (userId, resourceId, decision) => {
    const params = new URLSearchParams();
    if (userId) params.append('user_id', userId);
    if (resourceId) params.append('resource_id', resourceId);
    if (decision) params.append('decision', decision);
    
    return makeRequest(`/audit/trail?${params}`, { method: 'GET' });
  },
  
  getUserHistory: (userId) =>
    makeRequest(`/audit/user-history/${userId}`, { method: 'GET' }),
  
  getResourceLog: (resourceId) =>
    makeRequest(`/audit/resource-log/${resourceId}`, { method: 'GET' }),
  
  getDeniedAttempts: () =>
    makeRequest('/audit/denied-attempts', { method: 'GET' }),
  
  getHighRiskAccesses: (threshold = 70) =>
    makeRequest(`/audit/high-risk?threshold=${threshold}`, { method: 'GET' }),
  
  checkChainIntegrity: () =>
    makeRequest('/audit/chain-integrity', { method: 'GET' }),
  
  getStatistics: () =>
    makeRequest('/audit/statistics', { method: 'GET' }),
  
  exportChain: () =>
    makeRequest('/audit/export', { method: 'GET' }),
  
  getBlock: (blockId) =>
    makeRequest(`/audit/block/${blockId}`, { method: 'GET' })
};

// Metrics & ZKP demo APIs
export const metricsAPI = {
  getSummary: () =>
    makeRequest('/metrics/summary', { method: 'GET' }),
  checkIntegrity: () =>
    makeRequest('/metrics/integrity', { method: 'GET' }),
  getAnalytics: () =>
    makeRequest('/metrics/analytics', { method: 'GET' })
};

export const zkpAPI = {
  getParameters: () =>
    makeRequest('/zkp/parameters', { method: 'GET' }),
  
  generateKeypair: () =>
    makeRequest('/zkp/keygen', { method: 'POST' }),
  
  interactiveProve: (privateKey) =>
    makeRequest('/zkp/prove/interactive', {
      method: 'POST',
      body: JSON.stringify(privateKey ? { private_key: privateKey } : {})
    }),
  
  nonInteractiveProve: (privateKey, message) =>
    makeRequest('/zkp/prove/non-interactive', {
      method: 'POST',
      body: JSON.stringify({ private_key: privateKey, message: message || '' })
    }),
  
  nonInteractiveVerify: (publicKey, proof) =>
    makeRequest('/zkp/verify/non-interactive', {
      method: 'POST',
      body: JSON.stringify({ public_key: publicKey, proof })
    }),
  
  getMerkleTree: () =>
    makeRequest('/zkp/merkle/tree', { method: 'GET' }),
  
  getMerkleProof: (blockIndex) =>
    makeRequest(`/zkp/merkle/proof/${blockIndex}`, { method: 'GET' }),

  // Legacy
  generateChallenge: (userId) =>
    makeRequest('/zkp/challenge', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId })
    }),
  verifyResponse: (userId, response, correctResponse) =>
    makeRequest('/zkp/verify', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, response, correct_response: correctResponse })
    })
};

// ML Model APIs
export const mlAPI = {
  getStatus: () =>
    makeRequest('/ml/status', { method: 'GET' }),

  train: () =>
    makeRequest('/ml/train', { method: 'POST' }),

  predict: (resourceId, currentLocation, deviceTrustScore) =>
    makeRequest('/ml/predict', {
      method: 'POST',
      body: JSON.stringify({
        resource_id: resourceId,
        current_location: currentLocation,
        device_trust_score: deviceTrustScore
      })
    }),

  getFeatureImportance: () =>
    makeRequest('/ml/importance', { method: 'GET' })
};

// Session / Continuous Verification APIs
export const sessionAPI = {
  sendHeartbeat: (sessionId, deviceTrustScore, location) =>
    makeRequest('/session/heartbeat', {
      method: 'POST',
      body: JSON.stringify({
        session_id: sessionId,
        device_trust_score: deviceTrustScore,
        location
      })
    }),

  getActiveSessions: () =>
    makeRequest('/session/active', { method: 'GET' }),

  revokeSession: (sessionId) =>
    makeRequest(`/session/revoke/${sessionId}`, { method: 'POST' }),

  getSessionHistory: (sessionId) =>
    makeRequest(`/session/history/${sessionId}`, { method: 'GET' })
};

const api = {
  authAPI,
  accessAPI,
  auditAPI,
  metricsAPI,
  zkpAPI,
  mlAPI,
  sessionAPI
};

export default api;
