import React from 'react';

export const StyleFingerprint: React.FC = () => {
  // A mock visual radar/bar chart of creator taste
  const stats = [
    { label: 'Pacing', value: 90, color: '#f43f5e' },
    { label: 'Storytelling', value: 80, color: '#8b5cf6' },
    { label: 'Visuals', value: 95, color: '#3b82f6' },
    { label: 'Audio/SFX', value: 70, color: '#10b981' },
    { label: 'Hooks', value: 85, color: '#f59e0b' }
  ];

  return (
    <div style={{
      background: 'var(--panel-bg)',
      border: '1px solid var(--panel-border)',
      borderRadius: '12px',
      padding: '20px',
      marginTop: '16px'
    }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: 'var(--text-primary)' }}>Style Fingerprint</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {stats.map(stat => (
          <div key={stat.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <span>{stat.label}</span>
              <span>{stat.value}%</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${stat.value}%`, height: '100%', background: stat.color, borderRadius: '4px' }}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
