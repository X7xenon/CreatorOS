import React, { useState, useEffect } from 'react';

export const ProfileSelector: React.FC = () => {
  const [profiles, setProfiles] = useState<{id: string, name: string, active: boolean}[]>([]);
  const [activeProfile, setActiveProfile] = useState<string>('');

  useEffect(() => {
    // In a real app we'd fetch from /api/v1/profiles
    setProfiles([
      { id: 'mrbeast', name: 'MrBeast Profile', active: true },
      { id: 'mkbhd', name: 'MKBHD Profile', active: false },
      { id: 'hormozi', name: 'Hormozi Profile', active: false }
    ]);
    setActiveProfile('mrbeast');
  }, []);

  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.2)',
      border: '1px solid var(--panel-border)',
      borderRadius: '8px',
      padding: '8px 12px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    }}>
      <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Active Profile:</span>
      <select 
        value={activeProfile}
        onChange={(e) => setActiveProfile(e.target.value)}
        style={{
          background: 'transparent',
          color: 'var(--text-primary)',
          border: 'none',
          outline: 'none',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer'
        }}
      >
        {profiles.map(p => (
          <option key={p.id} value={p.id} style={{ background: '#1a1a1a' }}>
            {p.name}
          </option>
        ))}
      </select>
    </div>
  );
};
