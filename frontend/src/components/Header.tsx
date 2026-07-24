import React from 'react';
import { useStore } from '../store/useStore';

export const Header: React.FC = () => {
  const { connectedAccounts, selectedFilter, setSelectedFilter } = useStore();

  return (
    <header style={{
      height: '70px',
      borderBottom: '1px solid var(--panel-border)',
      background: 'rgba(0,0,0,0.2)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 2rem',
      justifyContent: 'space-between'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <h3 style={{ margin: 0, fontWeight: 500, color: 'var(--text-secondary)' }}>
          Command Center
        </h3>
        
        {/* Global Filter */}
        <select 
          value={selectedFilter}
          onChange={(e) => setSelectedFilter(e.target.value)}
          style={{
            background: 'var(--panel-bg)',
            border: '1px solid var(--panel-border)',
            color: 'var(--text-primary)',
            padding: '8px 16px',
            borderRadius: '8px',
            outline: 'none',
            fontFamily: 'inherit',
            fontSize: '0.9rem',
            cursor: 'pointer'
          }}
        >
          <option value="all">All Accounts & Platforms</option>
          <optgroup label="YouTube">
            {connectedAccounts.filter(a => a.platform === 'YouTube').map(acc => (
              <option key={acc.id} value={acc.id}>@{acc.handle}</option>
            ))}
          </optgroup>
          <optgroup label="Instagram">
            {connectedAccounts.filter(a => a.platform === 'Instagram').map(acc => (
              <option key={acc.id} value={acc.id}>@{acc.handle}</option>
            ))}
          </optgroup>
        </select>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--success-color)', boxShadow: 'var(--success-glow)' }} />
        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>System Online</span>
      </div>
    </header>
  );
};
