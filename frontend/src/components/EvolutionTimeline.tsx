import React from 'react';

export const EvolutionTimeline: React.FC = () => {
  const events = [
    { date: 'Oct 12', title: 'Learned Retention Tactics', detail: 'Increased average hook length.' },
    { date: 'Oct 15', title: 'Adopted Dynamic Captions', detail: 'Integrated Hormozi-style bold fonts.' },
    { date: 'Oct 18', title: 'Refined Camera Style', detail: 'Added slight zoom on punchlines.' }
  ];

  return (
    <div style={{
      background: 'var(--panel-bg)',
      border: '1px solid var(--panel-border)',
      borderRadius: '12px',
      padding: '20px',
      marginTop: '16px'
    }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: 'var(--text-primary)' }}>Evolution Timeline</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
        <div style={{ position: 'absolute', left: '4px', top: '8px', bottom: '8px', width: '2px', background: 'rgba(255,255,255,0.1)' }}></div>
        {events.map((evt, i) => (
          <div key={i} style={{ display: 'flex', gap: '12px', zIndex: 1 }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#8b5cf6', marginTop: '4px' }}></div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{evt.date}</div>
              <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600 }}>{evt.title}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{evt.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
