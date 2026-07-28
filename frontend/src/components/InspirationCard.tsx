import React from 'react';

export interface InspirationCardProps {
  inspiration: {
    id: number;
    title: string;
    url: string;
    platform: string;
    creator: string;
    date_added: string;
    category: string;
    tags: string[];
    analysis_json?: any;
    status: string;
  };
}

export const InspirationCard: React.FC<InspirationCardProps> = ({ inspiration }) => {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.03)',
      backdropFilter: 'blur(10px)',
      border: '1px solid var(--panel-border)',
      borderRadius: '16px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      cursor: 'pointer'
    }}
    onMouseOver={(e) => {
      e.currentTarget.style.border = '1px solid rgba(139, 92, 246, 0.5)';
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.3)';
    }}
    onMouseOut={(e) => {
      e.currentTarget.style.border = '1px solid var(--panel-border)';
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'none';
    }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 10 }}>
        <span style={{
          padding: '4px 10px',
          fontSize: '11px',
          fontWeight: 600,
          borderRadius: '20px',
          background: 'rgba(99, 102, 241, 0.1)',
          color: '#818cf8',
          border: '1px solid rgba(99, 102, 241, 0.2)'
        }}>
          {inspiration.platform}
        </span>
        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
          {new Date(inspiration.date_added).toLocaleDateString()}
        </span>
      </div>

      <div style={{ zIndex: 10, marginTop: '4px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0', lineHeight: 1.3 }}>
          {inspiration.title}
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
          by <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{inspiration.creator}</span>
        </p>
      </div>

      {inspiration.tags && inspiration.tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px', zIndex: 10 }}>
          {inspiration.tags.map((tag, idx) => (
            <span key={idx} style={{
              fontSize: '10px', padding: '2px 8px', borderRadius: '4px',
              background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)',
              border: '1px solid rgba(255, 255, 255, 0.1)', textTransform: 'uppercase', letterSpacing: '0.5px'
            }}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {inspiration.analysis_json && Object.keys(inspiration.analysis_json).length > 0 && (
        <div style={{
          marginTop: '8px', padding: '12px', borderRadius: '12px',
          background: 'rgba(0, 0, 0, 0.2)', border: '1px solid rgba(255, 255, 255, 0.05)',
          fontSize: '12px', color: 'var(--text-secondary)', zIndex: 10,
          display: 'flex', flexDirection: 'column', gap: '6px'
        }}>
          {inspiration.analysis_json.Hook && (
            <p style={{ margin: 0 }}><span style={{ fontWeight: 600, color: '#c084fc' }}>Hook:</span> {inspiration.analysis_json.Hook}</p>
          )}
          {inspiration.analysis_json['Camera Style'] && (
            <p style={{ margin: 0 }}><span style={{ fontWeight: 600, color: '#f472b6' }}>Camera:</span> {inspiration.analysis_json['Camera Style']}</p>
          )}
          {inspiration.analysis_json.Audience && (
            <p style={{ margin: 0 }}><span style={{ fontWeight: 600, color: '#818cf8' }}>Audience:</span> {inspiration.analysis_json.Audience}</p>
          )}
        </div>
      )}

      <div style={{ marginTop: 'auto', paddingTop: '16px', display: 'flex', gap: '8px', zIndex: 10 }}>
        <button style={{
          flex: 1, padding: '8px', borderRadius: '8px', background: '#4f46e5',
          color: '#fff', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)'
        }}>
          Analyze
        </button>
        <button style={{
          padding: '8px 12px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.05)',
          color: '#fff', fontSize: '13px', fontWeight: 600, border: '1px solid var(--panel-border)', cursor: 'pointer'
        }}>
          ...
        </button>
      </div>

      {/* Granular Learning Buttons */}
      <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '6px', zIndex: 10 }}>
        {['Learn Hook', 'Learn Story', 'Learn Editing', 'Learn CTA', 'Learn Camera', 'Learn Thumbnail'].map((btn) => (
          <button key={btn} style={{
            fontSize: '10px', padding: '4px 8px', borderRadius: '4px',
            background: 'rgba(139, 92, 246, 0.1)', color: '#c084fc',
            border: '1px solid rgba(139, 92, 246, 0.2)', cursor: 'pointer'
          }}>
            {btn}
          </button>
        ))}
      </div>
    </div>
  );
};
