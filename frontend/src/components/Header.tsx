import React from 'react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';

export const Header: React.FC = () => {
  const { connectedAccounts, selectedFilter, setSelectedFilter } = useStore();
  const navigate = useNavigate();

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
            <option value="platform_YouTube">All YouTube Accounts</option>
            {connectedAccounts.filter(a => a.platform === 'YouTube').map(acc => (
              <option key={acc.id} value={acc.id}>@{acc.handle}</option>
            ))}
          </optgroup>
          <optgroup label="Instagram">
            <option value="platform_Instagram">All Instagram Accounts</option>
            {connectedAccounts.filter(a => a.platform === 'Instagram').map(acc => (
              <option key={acc.id} value={acc.id}>@{acc.handle}</option>
            ))}
          </optgroup>
        </select>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <button 
          onClick={() => navigate('/compare')}
          style={{
            background: 'var(--accent-color)',
            color: '#fff',
            border: 'none',
            padding: '6px 14px',
            borderRadius: '6px',
            fontSize: '0.85rem',
            cursor: 'pointer',
            fontWeight: 500,
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#6d28d9'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--accent-color)'}
        >
          Compare Accounts
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--success-color)', boxShadow: 'var(--success-glow)' }} />
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>System Online</span>
        </div>
      </div>
    </header>
  );
};
