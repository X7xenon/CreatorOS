import React, { useState, useEffect } from 'react';
import { GlassCard } from './GlassCard';
import { TeleprompterView } from './TeleprompterView';
import { getApiBase } from '../utils/apiBase';
import { Copy, FileText, Download, Code, Play, X, Sparkles, Wand2 } from 'lucide-react';

interface FinalScriptModalProps {
  assetId: string;
  onClose: () => void;
}

interface CompiledData {
  status: string;
  id: string;
  metrics: {
    readTime: string;
    wordCount: number;
    readingLevel: string;
    pacing: string;
  };
  text: string;
  markdown: string;
  teleprompter: string;
}

export const FinalScriptModal: React.FC<FinalScriptModalProps> = ({ assetId, onClose }) => {
  const [data, setData] = useState<CompiledData | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'clean' | 'markdown' | 'teleprompter'>('preview');
  const [showTeleprompter, setShowTeleprompter] = useState(false);
  const [rewriteInstruction, setRewriteInstruction] = useState('');
  const [isRewriting, setIsRewriting] = useState(false);

  useEffect(() => {
    fetch(`${getApiBase()}/api/v1/assets/${assetId}/compile`, { method: 'POST' })
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, [assetId]);

  const handleRewrite = async () => {
    if (!rewriteInstruction) return;
    setIsRewriting(true);
    try {
      const res = await fetch(`${getApiBase()}/api/v1/assets/${assetId}/compile/rewrite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructions: rewriteInstruction })
      });
      const result = await res.json();
      if (result.status === 'success' && data) {
        setData({
          ...data,
          text: result.text,
          markdown: result.text, // Mock update
          teleprompter: result.text
        });
      }
    } finally {
      setIsRewriting(false);
    }
  };

  const handleApplyBack = async () => {
    await fetch(`${getApiBase()}/api/v1/assets/${assetId}/compile/apply-back`, { method: 'POST' });
    alert('Applied back to asset blocks!');
  };

  if (showTeleprompter && data) {
    return <TeleprompterView text={data.teleprompter} onExit={() => setShowTeleprompter(false)} />;
  }

  if (!data) {
    return (
      <div style={overlayStyle}>
        <GlassCard style={modalStyle}>
          <div style={{ padding: '2rem', textAlign: 'center' }}>Compiling Final Script...</div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div style={overlayStyle}>
      <GlassCard style={modalStyle}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--panel-border)' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><Sparkles color="#8b5cf6" /> Final Script</h2>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '14px', color: 'var(--text-secondary)' }}>
            <span>⏱ {data.metrics.readTime}</span>
            <span>📝 {data.metrics.wordCount} words</span>
            <span>📚 {data.metrics.readingLevel}</span>
            <span>⚡ {data.metrics.pacing}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}><X /></button>
        </div>

        <div style={{ display: 'flex', gap: '20px', height: 'calc(100% - 70px)' }}>
          {/* Main Content Area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              {(['preview', 'clean', 'markdown'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '8px 16px', borderRadius: '8px', border: 'none',
                    background: activeTab === tab ? 'var(--panel-border)' : 'transparent',
                    color: activeTab === tab ? '#fff' : 'var(--text-secondary)',
                    cursor: 'pointer', textTransform: 'capitalize'
                  }}
                >
                  {tab}
                </button>
              ))}
              <button 
                onClick={() => setShowTeleprompter(true)}
                style={{
                  padding: '8px 16px', borderRadius: '8px', border: 'none',
                  background: 'rgba(59,130,246,0.2)', color: '#3b82f6',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                <Play size={16} /> Teleprompter
              </button>
            </div>

            {/* Content View */}
            <div style={{ 
              flex: 1, display: 'flex', flexDirection: 'column'
            }}>
              {(activeTab === 'preview' || activeTab === 'clean') && (
                <textarea 
                  value={data.text}
                  onChange={(e) => setData({ ...data, text: e.target.value, teleprompter: e.target.value })}
                  style={{ 
                    flex: 1, background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '16px',
                    border: '1px solid var(--panel-border)', color: 'var(--text-primary)',
                    fontFamily: 'inherit', fontSize: '15px', lineHeight: '1.6', outline: 'none', resize: 'none'
                  }}
                />
              )}
              {activeTab === 'markdown' && (
                <div style={{ 
                  flex: 1, background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '16px',
                  overflowY: 'auto', border: '1px solid var(--panel-border)'
                }}>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{data.markdown}</pre>
                </div>
              )}
            </div>

            {/* Toolbar */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button style={toolbarBtnStyle} onClick={() => navigator.clipboard.writeText(data.text)}><Copy size={16} /> Copy</button>
              <button style={toolbarBtnStyle}><FileText size={16} /> Export TXT</button>
              <button style={toolbarBtnStyle}><Code size={16} /> Export MD</button>
              <button style={toolbarBtnStyle}><Download size={16} /> Export DOCX</button>
            </div>
          </div>

          {/* AI Side Panel */}
          <div style={{ width: '300px', background: 'rgba(139,92,246,0.05)', borderRadius: '8px', padding: '16px', border: '1px solid rgba(139,92,246,0.2)', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#a78bfa' }}>
              <Wand2 size={18} /> AI Refinements
            </h3>
            <textarea
              value={rewriteInstruction}
              onChange={e => setRewriteInstruction(e.target.value)}
              placeholder="E.g., Make it punchier, or shorten the intro..."
              style={{ flex: 1, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--panel-border)', borderRadius: '8px', padding: '12px', color: '#fff', outline: 'none', resize: 'none', marginBottom: '10px' }}
            />
            <button
              onClick={handleRewrite}
              disabled={isRewriting || !rewriteInstruction}
              style={{ padding: '10px', background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: '8px', cursor: isRewriting ? 'wait' : 'pointer', fontWeight: 'bold', marginBottom: '10px' }}
            >
              {isRewriting ? 'Rewriting...' : 'Rewrite Script'}
            </button>
            <button
              onClick={handleApplyBack}
              style={{ padding: '10px', background: 'rgba(16,185,129,0.2)', color: '#10b981', border: '1px solid #10b981', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Apply Back to Blocks
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0,0,0,0.7)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1000
};

const modalStyle: React.CSSProperties = {
  width: '90%', height: '90%',
  maxWidth: '1200px',
  display: 'flex', flexDirection: 'column',
  padding: '20px'
};

const toolbarBtnStyle = {
  display: 'flex', alignItems: 'center', gap: '6px',
  padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--panel-border)',
  background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '13px'
};
