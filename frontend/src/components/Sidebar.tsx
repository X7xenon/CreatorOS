import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Calendar, Settings, Activity, Home, Target, Shield, Power, Code2 } from 'lucide-react';

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
  const handleExit = async () => {
    if (window.confirm("Are you sure you want to shut down CreatorOS? This will stop the backend, frontend, and WhatsApp services.")) {
      try {
        await fetch('http://localhost:8888/api/v1/system/shutdown', { method: 'POST' });
        alert("CreatorOS services have been shut down. You can safely close this browser window.");
        window.close(); // May be blocked by browsers, but worth trying
      } catch (err) {
        console.error("Shutdown error", err);
        alert("Tried to shut down. If the terminals are closed, it was successful.");
      }
    }
  };

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

      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <NavLink to="/home" style={linkStyle}>
          <Home size={20} />
          Home
        </NavLink>
        <NavLink to="/dashboard" style={linkStyle}>
          <LayoutDashboard size={20} />
          Dashboard
        </NavLink>
        <NavLink to="/mission" style={linkStyle}>
          <Target size={20} />
          Mission Control
        </NavLink>
        <NavLink to="/scripting" style={linkStyle}>
          <Code2 size={20} />
          Scripting Lab
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
        <NavLink to="/proxy" style={linkStyle}>
          <Shield size={20} />
          Proxy Manager
        </NavLink>
        <NavLink to="/settings" style={linkStyle}>
          <Settings size={20} />
          Settings
        </NavLink>
        
        <button 
          onClick={handleExit}
          style={{
            display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', 
            borderRadius: '8px', color: '#ef4444', background: 'transparent',
            border: '1px solid transparent', cursor: 'pointer', fontWeight: 500,
            width: '100%', textAlign: 'left', marginTop: '16px', fontSize: '1rem',
            fontFamily: 'inherit'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <Power size={20} />
          Exit CreatorOS
        </button>
      </div>
    </aside>
  );
};
