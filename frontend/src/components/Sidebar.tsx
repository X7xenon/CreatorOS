import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Calendar, Settings, Activity, Home } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const linkStyle = ({ isActive }: { isActive: boolean }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 20px',
    borderRadius: '8px',
    color: isActive ? '#fff' : 'var(--text-secondary)',
    background: isActive ? 'var(--panel-border)' : 'transparent',
    textDecoration: 'none',
    fontWeight: isActive ? 600 : 400,
    transition: 'all 0.2s ease',
    marginBottom: '8px',
    border: isActive ? '1px solid var(--panel-border)' : '1px solid transparent',
  });

  return (
    <aside style={{
      width: '260px',
      background: 'var(--panel-bg)',
      borderRight: '1px solid var(--panel-border)',
      padding: '2rem 1rem',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{ padding: '0 10px', marginBottom: '3rem' }}>
        <h2 className="glow-accent" style={{ fontSize: '1.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={24} />
          CreatorOS
        </h2>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', paddingLeft: '32px', letterSpacing: '1px' }}>
          by xenon
        </div>
      </div>

      <nav style={{ flex: 1 }}>
        <NavLink to="/home" style={linkStyle}>
          <Home size={20} />
          Home
        </NavLink>
        <NavLink to="/dashboard" style={linkStyle}>
          <LayoutDashboard size={20} />
          Dashboard
        </NavLink>
        <NavLink to="/analytics" style={linkStyle}>
          <Activity size={20} />
          Analytics
        </NavLink>
        <NavLink to="/calendar" style={linkStyle}>
          <Calendar size={20} />
          Calendar
        </NavLink>
      </nav>

      <div style={{ marginTop: 'auto' }}>
        <NavLink to="/settings" style={linkStyle}>
          <Settings size={20} />
          Settings
        </NavLink>
      </div>
    </aside>
  );
};
