import React, { useState } from 'react';
import '../App.css';
import { zkpAPI } from '../services/api';

function ZkpDemoPage({ currentUser }) {
  const [proof, setProof] = useState(null);
  const [merkle, setMerkle] = useState(null);
  const [merkleProof, setMerkleProof] = useState(null);
  const [blockIdx, setBlockIdx] = useState(0);
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');

  const run = async (key, fn) => { setLoading(key); setError(''); try { await fn(); } catch(e) { setError(e.message); } setLoading(''); };

  const StepBox = ({ num, title, color, children }) => (
    <div style={{ padding: '12px', marginBottom: '6px', background: `${color}08`, borderLeft: `3px solid ${color}`, borderRadius: '0 8px 8px 0' }}>
      <div style={{ fontSize: '12px', color, fontWeight: 'bold' }}>Step {num} — {title}</div>
      <div style={{ marginTop: '6px' }}>{children}</div>
    </div>
  );

  return (
    <div className="page">
      <h1 className="page-title">🔐 Cryptographic Verification Suite</h1>
      {error && <div className="error-message">{error}</div>}

      {/* Explanation */}
      <div className="dark-panel" style={{ marginBottom: '20px' }}>
        <h2 style={{ color: 'var(--text-primary)', fontSize: '18px', marginBottom: '8px' }}>What is a Zero-Knowledge Proof?</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
          A ZKP lets you <strong style={{ color: 'var(--primary)' }}>prove you know a secret without revealing it</strong>.
        </p>
        <div style={{ background: 'rgba(0,240,255,0.05)', border: '1px solid rgba(0,240,255,0.15)', borderRadius: '8px', padding: '12px', margin: '12px 0' }}>
          <strong style={{ color: 'var(--primary)', fontSize: '13px' }}>🏰 Analogy:</strong>
          <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}> A cave has a locked door. You prove you have the key by entering one side and exiting the other — without ever showing the key.</span>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>We implement the <strong style={{ color: 'var(--warning)' }}>Schnorr Protocol</strong> — mathematically proven ZKP based on the Discrete Logarithm Problem.</p>
      </div>

      {/* Protocol Flow */}
      <div className="dark-panel" style={{ marginBottom: '20px' }}>
        <h3 style={{ color: 'var(--text-primary)', fontSize: '15px', marginBottom: '12px' }}>📡 Protocol Flow</h3>
        <pre style={{ fontFamily: 'monospace', fontSize: '11px', lineHeight: '1.7', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.3)', padding: '14px', borderRadius: '8px', overflow: 'auto', margin: 0 }}>{`  PROVER (Client)                    VERIFIER (Server)
  ─────────────────                  ──────────────────
  Picks random r
  Computes R = g^r mod p
       ─────── sends R ──────────►

       ◄────── sends c ──────────   Picks random c

  s = (r + c×x) mod q
  ↑ uses secret x (NEVER sent!)
       ─────── sends s ──────────►
                                     Checks: g^s ≡ R×y^c mod p
                                     ✅ Match → Identity PROVEN

  ┌──────────────────────────────────────────────────────┐
  │  🔒 Secret key x is NEVER transmitted!               │
  └──────────────────────────────────────────────────────┘`}</pre>
      </div>

      {/* Live Demo */}
      <div className="dark-panel" style={{ marginBottom: '20px' }}>
        <h3 style={{ color: 'var(--text-primary)', fontSize: '15px', marginBottom: '10px' }}>⚡ Live Demo</h3>
        <button className="button" onClick={() => run('zkp', async () => setProof(await zkpAPI.interactiveProve()))} disabled={loading === 'zkp'} style={{ width: '100%', marginBottom: '15px' }}>
          {loading === 'zkp' ? '⏳ Running...' : '🚀 Run Zero-Knowledge Proof'}
        </button>

        {proof && proof.steps && (<div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
            <div style={{ background: 'rgba(255,0,60,0.08)', border: '1px solid rgba(255,0,60,0.2)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: 'var(--danger)' }}>🔒 SECRET (never sent)</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--danger)' }}>x = {proof.keys.private_key_x}</div>
            </div>
            <div style={{ background: 'rgba(0,255,157,0.08)', border: '1px solid rgba(0,255,157,0.2)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: 'var(--success)' }}>🌐 PUBLIC</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--success)' }}>y = {proof.keys.public_key_y}</div>
            </div>
          </div>

          <StepBox num={1} title="Commitment (Prover→Verifier)" color="var(--success)">
            <code style={{ fontSize: '12px', color: 'var(--warning)' }}>{proof.steps.step1_commitment.formula}</code>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>📤 Sent: R = {proof.steps.step1_commitment.R_commitment}</div>
          </StepBox>
          <StepBox num={2} title="Challenge (Verifier→Prover)" color="var(--primary)">
            <div style={{ fontSize: '14px', color: 'var(--primary)', fontWeight: 'bold' }}>c = {proof.steps.step2_challenge.c_challenge}</div>
          </StepBox>
          <StepBox num={3} title="Response (Prover→Verifier)" color="var(--warning)">
            <code style={{ fontSize: '12px', color: 'var(--warning)' }}>{proof.steps.step3_response.formula}</code>
            <div style={{ fontSize: '11px', color: 'var(--danger)', marginTop: '4px' }}>⚠️ Secret x used in calculation but NEVER sent!</div>
          </StepBox>
          <StepBox num={4} title="Verification" color={proof.steps.step4_verification.verified ? 'var(--success)' : 'var(--danger)'}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>g^s mod p = <strong style={{ color: 'var(--primary)' }}>{proof.steps.step4_verification.lhs.split('= ').pop()}</strong></div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>R×y^c mod p = <strong style={{ color: 'var(--primary)' }}>{proof.steps.step4_verification.rhs.split('= ').pop()}</strong></div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '6px', color: 'var(--success)' }}>✅ MATCH — Identity proven without revealing secret!</div>
          </StepBox>

          <div style={{ padding: '12px', borderRadius: '8px', textAlign: 'center', background: 'rgba(0,255,157,0.08)', border: '1px solid rgba(0,255,157,0.2)', marginTop: '12px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>The server <strong style={{ color: 'var(--success)' }}>VERIFIED</strong> the prover knows x={proof.keys.private_key_x} — yet x was <strong style={{ color: 'var(--danger)' }}>NEVER transmitted</strong>.</div>
          </div>
        </div>)}
      </div>

      {/* Merkle Tree */}
      <div className="dark-panel">
        <h3 style={{ color: 'var(--text-primary)', fontSize: '15px', marginBottom: '10px' }}>🌳 Merkle Tree — Audit Chain Integrity</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '12px' }}>Verify any single audit block in O(log n) time without checking the entire chain.</p>
        <button className="button secondary" onClick={() => run('mt', async () => setMerkle(await zkpAPI.getMerkleTree()))} disabled={loading === 'mt'} style={{ width: '100%', marginBottom: '12px' }}>
          {loading === 'mt' ? 'Building...' : 'Build Merkle Tree from Audit Chain'}
        </button>

        {merkle && merkle.merkle_root && (<div>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '6px', marginBottom: '10px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Merkle Root:</div>
            <div style={{ fontSize: '11px', color: 'var(--primary)', fontFamily: 'monospace', wordBreak: 'break-all' }}>{merkle.merkle_root}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>Leaves: {merkle.total_leaves} | Depth: {merkle.tree_depth}</div>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', alignItems: 'center' }}>
            <input type="number" min="0" max={merkle.total_leaves - 1} value={blockIdx} onChange={e => setBlockIdx(parseInt(e.target.value) || 0)} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'rgba(15,23,42,0.6)', color: 'var(--text-primary)', fontSize: '13px' }} />
            <button className="button" onClick={() => run('mp', async () => setMerkleProof(await zkpAPI.getMerkleProof(blockIdx)))} style={{ padding: '8px 14px', fontSize: '11px' }}>Verify Block</button>
          </div>
          {merkleProof && (<div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '6px', fontSize: '12px' }}>
            <div style={{ color: merkleProof.verified ? 'var(--success)' : 'var(--danger)', fontWeight: 'bold', marginBottom: '6px' }}>{merkleProof.verified ? '✅ Block verified in tree' : '❌ Verification failed'}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>Complexity: {merkleProof.complexity}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '4px' }}>Proof path ({merkleProof.proof_length} hops):</div>
            {merkleProof.proof_path.map((s, i) => (<div key={i} style={{ fontSize: '10px', fontFamily: 'monospace', color: 'var(--primary)', padding: '2px 0' }}>↳ L{s.level} ({s.direction}): {s.hash.substring(0, 24)}...</div>))}
          </div>)}
        </div>)}
        {merkle && !merkle.merkle_root && <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>No audit blocks yet.</p>}
      </div>
    </div>
  );
}

export default ZkpDemoPage;