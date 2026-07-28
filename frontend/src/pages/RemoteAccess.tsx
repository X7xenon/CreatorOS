import React, { useState } from 'react';
import { useTailscale } from '../hooks/useTailscale';
import { GlassCard } from '../components/GlassCard';
import { getApiBase } from '../utils/apiBase';
import { QRCodeSVG } from 'qrcode.react';
import { Wifi, Activity, Shield, Smartphone, Monitor, Code2, Database, Power, RotateCcw, Upload, Download, Trash2, Globe } from 'lucide-react';

export const RemoteAccess: React.FC = () => {
  const { connected, tailscaleIp, remoteUrl, peers, health, systemStats, wsStatus } = useTailscale();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [config, setConfig] = useState({ tailscale_exe: "C:\\Program Files\\Tailscale\\tailscale.exe" });
  
  const handleRemoteAction = async (action: string) => {
    try {
      const res = await fetch(`${getApiBase()}/api/v1/remote/${action}`, { method: 'POST' });
      const data = await res.json();
      alert(data.message || data.status);
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'control', label: 'Control Panel', icon: Power },
    { id: 'qr', label: 'QR Code', icon: Smartphone },
    { id: 'devices', label: 'Trusted Devices', icon: Shield },
    { id: 'advanced', label: 'Advanced', icon: Code2 },
  ];

  return (
    <div style={{ maxWidth: '1000px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontWeight: 500, margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Globe size={24} color={connected ? '#25D366' : '#ef4444'} />
          Secure Remote Access
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: connected ? '#25D366' : '#ef4444' }} />
          {connected ? 'Tailscale Mesh Online' : 'Tailscale Offline'}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--panel-border)', paddingBottom: '16px' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '8px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px',
              background: activeTab === t.id ? 'var(--accent-color)' : 'transparent',
              color: activeTab === t.id ? '#fff' : 'var(--text-secondary)',
              border: activeTab === t.id ? 'none' : '1px solid transparent',
              cursor: 'pointer', fontWeight: 500
            }}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <GlassCard title="System Health Dashboard">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            {Object.keys(health).map(key => (
              <div key={key} style={{
                background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '16px',
                borderLeft: `4px solid ${health[key] === 'healthy' ? '#25D366' : health[key] === 'warning' ? '#eab308' : '#ef4444'}`
              }}>
                <div style={{ textTransform: 'capitalize', fontWeight: 500, marginBottom: '4px' }}>{key}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Status: {health[key]}</div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {activeTab === 'control' && (
        <>
          <GlassCard title="Resource Utilization">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px' }}>
                <div style={{ marginBottom: '8px', color: 'var(--text-secondary)' }}>CPU Usage</div>
                <div style={{ fontSize: '24px', fontWeight: 600 }}>{systemStats.cpu || 0}%</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px' }}>
                <div style={{ marginBottom: '8px', color: 'var(--text-secondary)' }}>RAM Usage</div>
                <div style={{ fontSize: '24px', fontWeight: 600 }}>{systemStats.ram || 0}%</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px' }}>
                <div style={{ marginBottom: '8px', color: 'var(--text-secondary)' }}>Storage Used</div>
                <div style={{ fontSize: '24px', fontWeight: 600 }}>{Math.round(systemStats.disk || 0)}%</div>
              </div>
            </div>
          </GlassCard>
          
          <GlassCard title="Remote Actions">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <button onClick={() => handleRemoteAction('restart-backend')} className="action-btn">
                <RotateCcw size={16} /> Restart Backend
              </button>
              <button onClick={() => handleRemoteAction('backup-db')} className="action-btn">
                <Database size={16} /> Backup Database
              </button>
              <button onClick={() => handleRemoteAction('clear-cache')} className="action-btn">
                <Trash2 size={16} /> Clear Cache
              </button>
              <button onClick={() => handleRemoteAction('shutdown')} className="action-btn" style={{ color: '#ef4444' }}>
                <Power size={16} /> Shutdown CreatorOS
              </button>
            </div>
          </GlassCard>
        </>
      )}

      {activeTab === 'qr' && (
        <GlassCard title="Mobile Access QR">
          {connected ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', padding: '24px 0' }}>
              <div style={{ background: '#fff', padding: '16px', borderRadius: '12px' }}>
                <QRCodeSVG value={`${remoteUrl}?theme=dark&remember=true`} size={250} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 500, marginBottom: '8px' }}>Scan from your Android Phone</div>
                <code style={{ background: 'rgba(0,0,0,0.5)', padding: '8px 12px', borderRadius: '4px', color: '#25D366' }}>
                  {remoteUrl}
                </code>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
              Tailscale must be running to generate the secure remote URL.
            </div>
          )}
        </GlassCard>
      )}

      {activeTab === 'devices' && (
        <GlassCard title="Tailscale Peers">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--panel-border)', textAlign: 'left' }}>
                <th style={{ padding: '12px' }}>Device Name</th>
                <th style={{ padding: '12px' }}>IP Address</th>
                <th style={{ padding: '12px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {peers.map((peer, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {peer.os === 'android' ? <Smartphone size={16} /> : <Monitor size={16} />}
                    {peer.name}
                  </td>
                  <td style={{ padding: '12px', fontFamily: 'monospace' }}>{peer.ip}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ color: peer.online ? '#25D366' : 'var(--text-secondary)' }}>
                      {peer.online ? 'Online' : 'Offline'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      )}

      {activeTab === 'advanced' && (
        <GlassCard title="Tailscale Configuration">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Tailscale CLI Path</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input 
                  value={config.tailscale_exe} 
                  onChange={e => setConfig({...config, tailscale_exe: e.target.value})}
                  style={{ flex: 1, padding: '10px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid var(--panel-border)', borderRadius: '4px' }}
                />
                <button 
                  onClick={async () => {
                    await fetch(`${getApiBase()}/api/v1/network/tailscale-path`, {
                      method: 'PUT',
                      headers: {'Content-Type': 'application/json'},
                      body: JSON.stringify({ tailscale_exe: config.tailscale_exe })
                    });
                    alert('Saved');
                  }}
                  style={{ padding: '0 20px', background: 'var(--accent-color)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Save
                </button>
              </div>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              WebSocket Status: {wsStatus}
            </div>
          </div>
        </GlassCard>
      )}
      
      <style>{`
        .action-btn {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          background: rgba(255,255,255,0.05); border: 1px solid var(--panel-border);
          padding: 16px; border-radius: 8px; color: var(--text-primary); cursor: pointer;
          font-weight: 500; transition: all 0.2s;
        }
        .action-btn:hover { background: rgba(255,255,255,0.1); }
      `}</style>
    </div>
  );
};
