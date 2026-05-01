import React from 'react';
import '../App.css';

function DecisionPage({ onNavigate }) {
  return (
    <div className="page">
      <h1 className="page-title">📋 Decision Results</h1>
      <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
        Navigate to the Access Request page to evaluate your access
      </p>
      <button className="button" onClick={() => onNavigate('access')} style={{ maxWidth: '200px', margin: '20px auto', display: 'block' }}>
        ← Back to Access Request
      </button>
    </div>
  );
}

export default DecisionPage;
