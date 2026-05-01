import React, { useState, useEffect } from 'react';
import '../App.css';
import { metricsAPI } from '../services/api';

function AnalyticsPage({ currentUser }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadAnalytics(); }, []);

  const loadAnalytics = async () => {
    setLoading(true); setError('');
    try { setData(await metricsAPI.getAnalytics()); }
    catch (err) { setError(err.message || 'Failed to load analytics'); }
    setLoading(false);
  };

  const Bar = ({ value, max, color, label }) => (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '2px' }}>
        <span>{label}</span><span>{value}</span>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '4px', height: '10px', overflow: 'hidden' }}>
        <div style={{ width: `${max > 0 ? (value / max) * 100 : 0}%`, height: '100%', background: color, borderRadius: '4px' }}></div>
      </div>
    </div>
  );

  if (loading) return <div className="page"><h1 className="page-title">📈 Security Analytics</h1><div style={{ textAlign: 'center', padding: '40px' }}><div className="spinner"></div></div></div>;
  if (error) return <div className="page"><h1 className="page-title">📈 Security Analytics</h1><div className="error-message">{error}</div></div>;
  if (!data || data.total_events === 0) return <div className="page"><h1 className="page-title">📈 Security Analytics</h1><div className="info-message">No data yet. Make access requests first.</div></div>;

  const maxRisk = Math.max(...data.risk_distribution.map(d => d.count), 1);
  const maxRes = Math.max(...data.resource_frequency.map(d => d.count), 1);
  const maxHourly = Math.max(...data.hourly_heatmap.map(d => d.total), 1);
  const maxUser = Math.max(...data.user_activity.map(d => d.requests), 1);

  return (
    <div className="page">
      <h1 className="page-title">📈 Security Analytics</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '25px' }}>
        Visualizing <strong style={{ color: 'var(--primary)' }}>{data.total_events}</strong> access decisions
        <button className="button secondary" onClick={loadAnalytics} style={{ marginLeft: '15px', padding: '6px 12px', fontSize: '11px' }}>Refresh</button>
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Decision Timeline */}
        <div className="dark-panel">
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px', fontSize: '14px' }}>📊 Decision Trend</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '100px' }}>
            {data.decision_timeline.slice(-24).map((e, i) => {
              const t = e.allow + e.conditional + e.deny;
              const mx = Math.max(...data.decision_timeline.slice(-24).map(x => x.allow + x.conditional + x.deny), 1);
              const h = (t / mx) * 100;
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }} title={`${e.time}\nA:${e.allow} C:${e.conditional} D:${e.deny}`}>
                  {e.deny > 0 && <div style={{ height: `${(e.deny/t)*h}%`, background: 'var(--danger)', minHeight: '2px', borderRadius: '2px 2px 0 0' }}></div>}
                  {e.conditional > 0 && <div style={{ height: `${(e.conditional/t)*h}%`, background: 'var(--warning)', minHeight: '2px' }}></div>}
                  {e.allow > 0 && <div style={{ height: `${(e.allow/t)*h}%`, background: 'var(--success)', minHeight: '2px', borderRadius: '0 0 2px 2px' }}></div>}
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '11px', color: 'var(--text-secondary)' }}>
            <span style={{ color: 'var(--success)' }}>● Allow</span>
            <span style={{ color: 'var(--warning)' }}>● Conditional</span>
            <span style={{ color: 'var(--danger)' }}>● Deny</span>
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="dark-panel">
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px', fontSize: '14px' }}>⚠️ Risk Score Distribution</h3>
          {data.risk_distribution.map(b => (
            <Bar key={b.range} label={b.range} value={b.count} max={maxRisk}
              color={b.range === '0-20' ? 'var(--success)' : b.range === '20-40' ? '#4ade80' : b.range === '40-60' ? 'var(--warning)' : b.range === '60-80' ? '#ff6b35' : 'var(--danger)'} />
          ))}
        </div>

        {/* Department Breakdown */}
        <div className="dark-panel">
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px', fontSize: '14px' }}>🏢 Department Patterns</h3>
          {data.department_breakdown.map(d => {
            const t = d.allow + d.conditional + d.deny;
            return (
              <div key={d.department} style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '3px' }}>
                  <span>{d.department}</span><span>{t}</span>
                </div>
                <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                  {d.allow > 0 && <div style={{ width: `${(d.allow/t)*100}%`, background: 'var(--success)' }}></div>}
                  {d.conditional > 0 && <div style={{ width: `${(d.conditional/t)*100}%`, background: 'var(--warning)' }}></div>}
                  {d.deny > 0 && <div style={{ width: `${(d.deny/t)*100}%`, background: 'var(--danger)' }}></div>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Hourly Heatmap */}
        <div className="dark-panel">
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px', fontSize: '14px' }}>🕐 Hourly Activity Heatmap</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
            {data.hourly_heatmap.map(h => {
              const intensity = maxHourly > 0 ? h.total / maxHourly : 0;
              return (
                <div key={h.hour} title={`${h.hour}:00 — ${h.total} requests (${h.high_risk} high-risk)`} style={{
                  width: '28px', height: '28px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '9px', fontWeight: intensity > 0.3 ? 'bold' : 'normal',
                  color: intensity > 0.5 ? '#000' : 'var(--text-secondary)',
                  background: h.high_risk > 0 ? `rgba(255, 0, 60, ${intensity * 0.7})` : `rgba(0, 240, 255, ${intensity * 0.7})`,
                  border: '1px solid rgba(255,255,255,0.05)'
                }}>{h.hour}</div>
              );
            })}
          </div>
          <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-secondary)' }}>
            <span style={{ color: 'var(--primary)' }}>● Normal</span>{' '}
            <span style={{ color: 'var(--danger)' }}>● Has high-risk</span>
          </div>
        </div>

        {/* Resource Frequency */}
        <div className="dark-panel">
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px', fontSize: '14px' }}>📁 Resource Access Frequency</h3>
          {data.resource_frequency.map(r => (
            <Bar key={r.resource} label={r.resource.replace('resource_', '')} value={r.count} max={maxRes} color="var(--primary)" />
          ))}
        </div>

        {/* User Activity */}
        <div className="dark-panel">
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px', fontSize: '14px' }}>👤 User Activity</h3>
          {data.user_activity.map(u => (
            <div key={u.user} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{u.user}</span>
                <span style={{ color: u.avg_risk > 60 ? 'var(--danger)' : u.avg_risk > 40 ? 'var(--warning)' : 'var(--success)', fontSize: '11px' }}>
                  Risk: {u.avg_risk}
                </span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                <div style={{ width: `${(u.requests / maxUser) * 100}%`, height: '100%', background: u.avg_risk > 60 ? 'var(--danger)' : 'var(--primary)', borderRadius: '4px' }}></div>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>{u.requests} requests</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AnalyticsPage;