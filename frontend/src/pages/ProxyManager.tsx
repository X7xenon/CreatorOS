import React, { useEffect, useState, useCallback } from 'react';
import { Shield, Plus, RefreshCw, Upload, Download, Wifi, WifiOff, Loader2, Trash2, CheckCircle, XCircle, MinusCircle, Globe } from 'lucide-react';
import { getApiBase } from '../utils/apiBase';

const API = `${getApiBase()}/api/v1/proxy`;

type ProxyStatus = 'ACTIVE' | 'DEAD' | 'DISABLED';
type ProxyType = 'Residential' | 'ISP' | 'Datacenter';

interface AssignedAccount {
  id: string;
  username: string;
  platform: string;
}

interface Proxy {
  id: string;
  name: string;
  proxy_type: ProxyType;
  provider: string | null;
  country: string | null;
  status: ProxyStatus;
  last_checked: string | null;
  last_used: string | null;
  fail_count: number;
  response_time_ms: number | null;
  notes: string | null;
  created_at: string;
  assigned_accounts: AssignedAccount[];
}

// ──────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────

const StatusBadge = ({ status }: { status: ProxyStatus }) => {
  const map: Record<ProxyStatus, { label: string; color: string; icon: React.ReactNode }> = {
    ACTIVE: { label: 'Active', color: '#00c897', icon: <CheckCircle size={12} /> },
    DEAD: { label: 'Dead', color: '#ff4d6d', icon: <XCircle size={12} /> },
    DISABLED: { label: 'Disabled', color: '#888', icon: <MinusCircle size={12} /> },
  };
  const { label, color, icon } = map[status];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 20,
      background: `${color}22`, color, fontSize: 11, fontWeight: 600,
    }}>
      {icon} {label}
    </span>
  );
};

const TypeBadge = ({ type }: { type: string }) => {
  const colors: Record<string, string> = {
    Residential: '#7c3aed',
    ISP: '#2563eb',
    Datacenter: '#0891b2',
  };
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 12,
      background: `${colors[type] ?? '#555'}22`,
      color: colors[type] ?? '#aaa',
      fontSize: 11, fontWeight: 600,
    }}>{type}</span>
  );
};

// ──────────────────────────────────────────────
// Main page
// ──────────────────────────────────────────────

export default function ProxyManager() {
  const [proxies, setProxies] = useState<Proxy[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const fetchProxies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(API + '/');
      const data = await res.json();
      setProxies(data);
    } catch {
      console.error('Failed to fetch proxies');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProxies(); }, [fetchProxies]);

  const handleTest = async (id: string) => {
    setTesting(id);
    try {
      await fetch(`${API}/${id}/test`, { method: 'POST' });
      await fetchProxies();
    } finally {
      setTesting(null);
    }
  };

  const handleDisable = async (id: string) => {
    await fetch(`${API}/${id}/disable`, { method: 'POST' });
    fetchProxies();
  };

  const handleEnable = async (id: string) => {
    await fetch(`${API}/${id}/enable`, { method: 'POST' });
    fetchProxies();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this proxy? Accounts using it will be unlinked.')) return;
    await fetch(`${API}/${id}`, { method: 'DELETE' });
    fetchProxies();
  };

  const handleExport = async () => {
    const res = await fetch(`${API}/export`);
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'proxies_export.json'; a.click();
  };

  const filtered = proxies
    .filter(p => filterStatus === 'all' || p.status === filterStatus)
    .filter(p =>
      searchTerm === '' ||
      (p.name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.country ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.provider ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    );

  const stats = {
    total: proxies.length,
    active: proxies.filter(p => p.status === 'ACTIVE').length,
    dead: proxies.filter(p => p.status === 'DEAD').length,
    disabled: proxies.filter(p => p.status === 'DISABLED').length,
  };

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto', color: '#e2e8f0' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Shield size={24} color="#fff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#f1f5f9' }}>Proxy Manager</h1>
            <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Sticky proxy assignment for account identity protection</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={fetchProxies} style={btnStyle('#1e293b')}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={handleExport} style={btnStyle('#1e293b')}>
            <Download size={14} /> Export
          </button>
          <button onClick={() => setShowImportModal(true)} style={btnStyle('#1e293b')}>
            <Upload size={14} /> Bulk Import
          </button>
          <button onClick={() => setShowAddModal(true)} style={btnStyle('linear-gradient(135deg, #7c3aed, #2563eb)')}>
            <Plus size={14} /> Add Proxy
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total', value: stats.total, color: '#7c3aed', icon: <Globe size={18} /> },
          { label: 'Active', value: stats.active, color: '#00c897', icon: <Wifi size={18} /> },
          { label: 'Dead', value: stats.dead, color: '#ff4d6d', icon: <WifiOff size={18} /> },
          { label: 'Disabled', value: stats.disabled, color: '#888', icon: <MinusCircle size={18} /> },
        ].map(s => (
          <div key={s.label} style={{
            background: '#0f172a', border: '1px solid #1e293b', borderRadius: 14,
            padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: `${s.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: s.color,
            }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#f1f5f9' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{s.label} Proxies</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <input
          placeholder="Search by name, country, provider..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{
            flex: 1, padding: '9px 14px', borderRadius: 10,
            background: '#0f172a', border: '1px solid #1e293b',
            color: '#e2e8f0', outline: 'none', fontSize: 13,
          }}
        />
        {(['all', 'ACTIVE', 'DEAD', 'DISABLED'] as const).map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} style={{
            ...btnStyle(filterStatus === s ? '#7c3aed' : '#1e293b'),
            fontSize: 12, padding: '8px 16px',
          }}>
            {s === 'all' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{
        background: '#0f172a', border: '1px solid #1e293b',
        borderRadius: 16, overflow: 'hidden',
      }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>
            <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>
            <Shield size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
            <p style={{ margin: 0 }}>No proxies found. Add one to get started.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#1e293b', color: '#94a3b8', textAlign: 'left' }}>
                {['Proxy', 'Type', 'Status', 'Country', 'Response', 'Fails', 'Assigned To', 'Last Check', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((proxy, i) => (
                <tr key={proxy.id} style={{
                  borderTop: '1px solid #1e293b',
                  background: i % 2 === 0 ? 'transparent' : '#0a1628',
                  transition: 'background 0.15s',
                }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 600, color: '#f1f5f9' }}>{proxy.name}</div>
                    <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{proxy.id}</div>
                  </td>
                  <td style={{ padding: '14px 16px' }}><TypeBadge type={proxy.proxy_type} /></td>
                  <td style={{ padding: '14px 16px' }}><StatusBadge status={proxy.status} /></td>
                  <td style={{ padding: '14px 16px', color: '#94a3b8' }}>
                    {proxy.country ? `🌍 ${proxy.country}` : '—'}
                  </td>
                  <td style={{ padding: '14px 16px', color: proxy.response_time_ms && proxy.response_time_ms < 500 ? '#00c897' : '#ff4d6d' }}>
                    {proxy.response_time_ms != null ? `${proxy.response_time_ms}ms` : '—'}
                  </td>
                  <td style={{ padding: '14px 16px', color: proxy.fail_count > 0 ? '#f59e0b' : '#64748b' }}>
                    {proxy.fail_count}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {proxy.assigned_accounts.length === 0 ? (
                      <span style={{ color: '#475569', fontSize: 12 }}>Unassigned</span>
                    ) : (
                      proxy.assigned_accounts.map(a => (
                        <span key={a.id} style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          marginRight: 6, padding: '2px 8px', borderRadius: 8,
                          background: '#1e293b', color: '#94a3b8', fontSize: 11,
                        }}>
                          {a.platform === 'Instagram' ? '📸' : '🎥'} {a.username}
                        </span>
                      ))
                    )}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#64748b', fontSize: 12 }}>
                    {proxy.last_checked
                      ? new Date(proxy.last_checked).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })
                      : '—'}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <ActionBtn
                        onClick={() => handleTest(proxy.id)}
                        loading={testing === proxy.id}
                        title="Test connectivity"
                        color="#2563eb"
                        icon={<Wifi size={13} />}
                      />
                      {proxy.status === 'DISABLED' ? (
                        <ActionBtn onClick={() => handleEnable(proxy.id)} title="Enable" color="#00c897" icon={<CheckCircle size={13} />} />
                      ) : (
                        <ActionBtn onClick={() => handleDisable(proxy.id)} title="Disable" color="#888" icon={<MinusCircle size={13} />} />
                      )}
                      <ActionBtn onClick={() => handleDelete(proxy.id)} title="Delete" color="#ff4d6d" icon={<Trash2 size={13} />} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAddModal && <AddProxyModal onClose={() => setShowAddModal(false)} onSaved={fetchProxies} />}
      {showImportModal && <BulkImportModal onClose={() => setShowImportModal(false)} onSaved={fetchProxies} />}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function btnStyle(bg: string) {
  return {
    display: 'inline-flex' as const, alignItems: 'center' as const, gap: 6,
    padding: '9px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
    background: bg, color: '#fff', fontSize: 13, fontWeight: 500,
  };
}

function ActionBtn({ onClick, title, color, icon, loading = false }: {
  onClick: () => void; title: string; color: string; icon: React.ReactNode; loading?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 30, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer',
        background: `${color}22`, color, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {loading ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : icon}
    </button>
  );
}

// ──────────────────────────────────────────────
// Add Proxy Modal
// ──────────────────────────────────────────────

function AddProxyModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ proxy_url: '', name: '', proxy_type: 'Datacenter', provider: '', country: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  const handleTest = async () => {
    if (!form.proxy_url) return;
    setTesting(true);
    try {
      const res = await fetch(`${API}/test-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proxy_url: form.proxy_url }),
      });
      setTestResult(await res.json());
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!form.proxy_url) return;
    setSaving(true);
    try {
      await fetch(`${API}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalWrapper onClose={onClose} title="Add New Proxy">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <InputField label="Proxy URL *" placeholder="http://user:pass@host:port" value={form.proxy_url} onChange={v => setForm(f => ({ ...f, proxy_url: v }))} />
        <InputField label="Name" placeholder="US Residential #1" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Type</label>
            <select value={form.proxy_type} onChange={e => setForm(f => ({ ...f, proxy_type: e.target.value }))} style={inputStyle}>
              {['Datacenter', 'ISP', 'Residential'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <InputField label="Country" placeholder="US" value={form.country} onChange={v => setForm(f => ({ ...f, country: v }))} />
        </div>
        <InputField label="Provider" placeholder="Webshare, Oxylabs..." value={form.provider} onChange={v => setForm(f => ({ ...f, provider: v }))} />
        <InputField label="Notes" placeholder="Optional notes" value={form.notes} onChange={v => setForm(f => ({ ...f, notes: v }))} />

        {testResult && (
          <div style={{
            padding: 12, borderRadius: 10, fontSize: 13,
            background: testResult.alive ? '#00c89722' : '#ff4d6d22',
            color: testResult.alive ? '#00c897' : '#ff4d6d',
            border: `1px solid ${testResult.alive ? '#00c89755' : '#ff4d6d55'}`,
          }}>
            {testResult.alive
              ? `✅ Proxy alive — IP: ${testResult.ip} — ${testResult.response_time_ms}ms`
              : `❌ Proxy unreachable — ${testResult.error}`}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button onClick={handleTest} style={{ ...btnStyle('#1e293b'), flex: 1 }}>
            {testing ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Wifi size={14} />}
            Test First
          </button>
          <button onClick={handleSave} style={{ ...btnStyle('linear-gradient(135deg, #7c3aed, #2563eb)'), flex: 2 }}>
            {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={14} />}
            Save Proxy
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}

// ──────────────────────────────────────────────
// Bulk Import Modal
// ──────────────────────────────────────────────

function BulkImportModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [raw, setRaw] = useState('');
  const [proxyType, setProxyType] = useState('Datacenter');
  const [provider, setProvider] = useState('');
  const [country, setCountry] = useState('');
  const [saving, setSaving] = useState(false);

  const handleImport = async () => {
    const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) return;
    setSaving(true);
    try {
      await fetch(`${API}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proxy_urls: lines, proxy_type: proxyType, provider, country }),
      });
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalWrapper onClose={onClose} title="Bulk Import Proxies">
      <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 12px' }}>
        Paste one proxy per line in format: <code style={{ color: '#7c3aed' }}>protocol://user:pass@host:port</code>
      </p>
      <textarea
        value={raw}
        onChange={e => setRaw(e.target.value)}
        rows={8}
        placeholder={"http://user:pass@1.2.3.4:8080\nhttp://user:pass@5.6.7.8:8080"}
        style={{ ...inputStyle, width: '100%', resize: 'vertical', fontFamily: 'monospace', fontSize: 12 }}
      />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, margin: '12px 0' }}>
        <div>
          <label style={labelStyle}>Type</label>
          <select value={proxyType} onChange={e => setProxyType(e.target.value)} style={inputStyle}>
            {['Datacenter', 'ISP', 'Residential'].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <InputField label="Provider" placeholder="Webshare" value={provider} onChange={setProvider} />
        <InputField label="Country" placeholder="IN" value={country} onChange={setCountry} />
      </div>
      <button onClick={handleImport} style={{ ...btnStyle('linear-gradient(135deg, #7c3aed, #2563eb)'), width: '100%', justifyContent: 'center' }}>
        {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={14} />}
        Import {raw.split('\n').filter(l => l.trim()).length} Proxies
      </button>
    </ModalWrapper>
  );
}

// ──────────────────────────────────────────────
// Shared UI helpers
// ──────────────────────────────────────────────

function ModalWrapper({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#000000cc',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{
        background: '#0f172a', border: '1px solid #1e293b',
        borderRadius: 20, padding: 28, width: 480, maxHeight: '80vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, color: '#f1f5f9' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 20 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, color: '#64748b', marginBottom: 6 };
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  background: '#1e293b', border: '1px solid #334155',
  color: '#e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box',
};

function InputField({ label, placeholder, value, onChange }: {
  label: string; placeholder?: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} style={inputStyle} />
    </div>
  );
}
