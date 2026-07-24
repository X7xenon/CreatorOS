import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import { useStore } from '../store/useStore';
import { Trash2, PlusCircle, Activity, Eye, EyeOff } from 'lucide-react';

export const Settings: React.FC = () => {
  const [theme, setTheme] = useState('dark');
  const { connectedAccounts, fetchAccounts } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Telegram State
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');

  useEffect(() => {
    const savedTheme = localStorage.getItem('creatoros-theme') || 'dark';
    setTheme(savedTheme);
    fetchAccounts();
  }, [fetchAccounts]);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('creatoros-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleConnectInstagram = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:8888/api/v1/auth/instagram/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username, 
          password: password || undefined,
          session_id: sessionId || undefined 
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || 'Login failed');
      }
      
      // Success
      await fetchAccounts();
      setShowModal(false);
      setUsername('');
      setPassword('');
      setSessionId('');
      
    } catch(e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleRemoveAccount = async (id: string) => {
    try {
      await fetch(`http://localhost:8888/api/v1/auth/accounts/${id}`, { method: 'DELETE' });
      fetchAccounts();
    } catch(e) {
      console.error(e);
    }
  };

  return (
    <div style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h2 style={{ fontWeight: 500 }}>System Settings</h2>
      
      <GlassCard title="Connected Accounts">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {connectedAccounts.map(acc => (
            <div key={acc.id} style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid var(--panel-border)', 
              borderRadius: '8px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Activity color={acc.platform === 'YouTube' ? '#ef4444' : '#ec4899'} />
                <span style={{ fontWeight: 500 }}>@{acc.handle}</span>
              </div>
              <button 
                onClick={() => handleRemoveAccount(acc.id)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                title="Disconnect Account"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          
          <button 
            onClick={() => {}}
            style={{
              background: 'rgba(239, 68, 68, 0.1)', border: '1px dashed #ef4444', 
              borderRadius: '8px', padding: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
              color: '#ef4444', cursor: 'pointer', fontWeight: 500, minHeight: '60px'
            }}
          >
            <PlusCircle size={20} />
            Connect YouTube (Coming Soon)
          </button>

          <button 
            onClick={() => setShowModal(true)}
            style={{
              background: 'rgba(236, 72, 153, 0.1)', border: '1px dashed #ec4899', 
              borderRadius: '8px', padding: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
              color: '#ec4899', cursor: 'pointer', fontWeight: 500, minHeight: '60px'
            }}
          >
            <PlusCircle size={20} />
            Connect Instagram
          </button>
        </div>
      </GlassCard>

      <GlassCard title="Appearance">
        <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>Select the overarching theme for CreatorOS.</p>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button 
            onClick={() => handleThemeChange('dark')}
            style={{
              padding: '12px 24px', borderRadius: '8px',
              background: theme === 'dark' ? 'var(--accent-color)' : 'transparent',
              color: theme === 'dark' ? '#fff' : 'var(--text-primary)',
              border: '1px solid var(--accent-color)', cursor: 'pointer', fontWeight: 500,
              boxShadow: theme === 'dark' ? 'var(--accent-glow)' : 'none'
            }}
          >
            Classic Dark
          </button>
          <button 
            onClick={() => handleThemeChange('cyberpunk')}
            style={{
              padding: '12px 24px', borderRadius: '8px',
              background: theme === 'cyberpunk' ? '#ff007f' : 'transparent',
              color: theme === 'cyberpunk' ? '#fff' : 'var(--text-primary)',
              border: '1px solid #ff007f', cursor: 'pointer', fontWeight: 500,
              boxShadow: theme === 'cyberpunk' ? '0 0 20px rgba(255, 0, 127, 0.8)' : 'none'
            }}
          >
            Cyberpunk Neon
          </button>
        </div>
      </GlassCard>

      <GlassCard title="WhatsApp Notifications">
        <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Connect your WhatsApp account to receive reminders before your content is scheduled to be published.
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Target Phone Number</label>
            <input 
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder="e.g. +919876543210 (with country code)"
              style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid var(--panel-border)', borderRadius: '4px' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <button 
            onClick={async () => {
              setLoading(true);
              try {
                // Generate QR
                const res = await fetch('http://localhost:8888/api/v1/whatsapp/qr');
                const data = await res.json();
                if (data.connected) {
                  alert('✅ WhatsApp is already connected!');
                  setChatId('connected'); // we reuse chatId for connection status locally for now
                } else if (data.qr) {
                  setChatId(data.qr); // reuse chatId state for QR data URL
                } else {
                  alert('QR not ready yet, try again in a few seconds.');
                }
              } catch (err: any) {
                alert('❌ Error: ' + err.message);
              } finally {
                setLoading(false);
              }
            }}
            style={{
              padding: '12px 24px', borderRadius: '8px',
              background: '#25D366',
              color: '#fff',
              border: 'none', cursor: 'pointer', fontWeight: 500,
              boxShadow: '0 0 15px rgba(37, 211, 102, 0.5)'
            }}
          >
            Show Login QR Code
          </button>
          
          <button 
            onClick={async () => {
              setLoading(true);
              try {
                // First save config
                const configRes = await fetch('http://localhost:8888/api/v1/whatsapp/config', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ target_number: botToken })
                });
                
                if (!configRes.ok) throw new Error('Failed to save configuration');
                
                // Then test it
                const res = await fetch('http://localhost:8888/api/v1/whatsapp/test', { method: 'POST' });
                const data = await res.json();
                if (res.ok) alert('✅ Test message sent!');
                else alert('❌ ' + data.detail);
              } catch (err: any) {
                alert('❌ Error: ' + err.message);
              } finally {
                setLoading(false);
              }
            }}
            disabled={!botToken}
            style={{
              padding: '12px 24px', borderRadius: '8px',
              background: !botToken ? 'rgba(37,211,102,0.3)' : 'transparent',
              color: !botToken ? '#fff' : '#25D366',
              border: '1px solid #25D366', cursor: !botToken ? 'not-allowed' : 'pointer', fontWeight: 500,
            }}
          >
            Save & Send Test
          </button>
        </div>
        
        {chatId && chatId.startsWith('data:image') && (
          <div style={{ background: 'white', padding: '16px', borderRadius: '8px', display: 'inline-block' }}>
            <img src={chatId} alt="WhatsApp QR Code" style={{ width: '250px', height: '250px' }} />
            <p style={{ color: 'black', textAlign: 'center', margin: '8px 0 0 0', fontWeight: 500 }}>Scan with WhatsApp</p>
          </div>
        )}
      </GlassCard>

      {/* Instagram Login Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="glass-panel" style={{ width: '400px' }}>
            <h3 style={{ margin: '0 0 16px 0' }}>Connect Instagram Account</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              We need to authenticate with Instagram. Your password is used once to generate an encrypted session and is <strong>never stored</strong>.
            </p>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Instagram Username</label>
              <input 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid var(--panel-border)', borderRadius: '4px' }}
              />
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Instagram Password</label>
              <div style={{ display: 'flex', position: 'relative', alignItems: 'center' }}>
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  style={{ width: '100%', padding: '10px', paddingRight: '40px', background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid var(--panel-border)', borderRadius: '4px' }}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '10px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '14px' }}>
              — OR (If Login Fails) —
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Session ID Cookie</label>
              <input 
                type="text"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                placeholder="Paste sessionid cookie here to bypass login"
                style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid var(--panel-border)', borderRadius: '4px' }}
              />
              <p style={{ fontSize: '12px', marginTop: '8px', color: 'var(--text-secondary)' }}>
                You can find this in Chrome DevTools {'>'} Application {'>'} Cookies {'>'} instagram.com {'>'} <strong>sessionid</strong>.
              </p>
            </div>

            {error && (
              <div style={{ color: '#ef4444', marginBottom: '16px', fontSize: '14px' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={() => setShowModal(false)} 
                disabled={loading}
                style={{ padding: '8px 16px', background: 'transparent', color: 'white', border: '1px solid var(--panel-border)', borderRadius: '4px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleConnectInstagram} 
                disabled={loading}
                style={{ padding: '8px 16px', background: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', boxShadow: 'var(--accent-glow)' }}
              >
                {loading ? 'Authenticating...' : 'Secure Connect'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
