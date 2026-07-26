import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GlassCard } from '../components/GlassCard';
import {
  Library, Clock, CheckCircle, PlusCircle,
  Trash2, ChevronUp, ChevronDown, Sparkles, AlertCircle, BarChart2
} from 'lucide-react';

const API = 'http://localhost:8888/api/v1/scripting';

const BLOCK_COLORS: Record<string, { border: string; bg: string; label: string }> = {
  Hook:    { border: '#3b82f6', bg: 'rgba(59,130,246,0.07)',  label: 'HOOK' },
  Problem: { border: '#ef4444', bg: 'rgba(239,68,68,0.07)',   label: 'PROBLEM' },
  Story:   { border: '#8b5cf6', bg: 'rgba(139,92,246,0.07)',  label: 'STORY' },
  Proof:   { border: '#10b981', bg: 'rgba(16,185,129,0.07)',  label: 'PROOF' },
  Example: { border: '#f59e0b', bg: 'rgba(245,158,11,0.07)',  label: 'EXAMPLE' },
  CTA:     { border: '#ec4899', bg: 'rgba(236,72,153,0.07)',  label: 'CTA' },
};

const TIMELINE_SEGMENTS = [
  { range: '0–3s',  type: 'Hook',    color: '#3b82f6', note: 'Instant hook — viewer decides to stay or leave.' },
  { range: '3–10s', type: 'Problem', color: '#ef4444', note: 'Validate their pain. Build urgency.' },
  { range: '10–25s',type: 'Story',   color: '#8b5cf6', note: 'Pull them into your world. Open a loop.' },
  { range: '25–45s',type: 'Proof',   color: '#10b981', note: 'Evidence + credibility. Close the credibility gap.' },
  { range: '45s+',  type: 'CTA',     color: '#ec4899', note: 'Drive the action. One clear ask.' },
];

interface Block { id: string; type: string; content: string; order: number; }
interface Asset { id: string; title: string; status: string; audience: string; goal: string; }
interface HookTemplate { id: string; category: string; template: string; tone: string; }
interface HealthScore {
  hook?: {score: number; note: string};
  story?: {score: number; note: string};
  novelty?: {score: number; note: string};
  retention?: {score: number; note: string};
  teaching?: {score: number; note: string};
  emotion?: {score: number; note: string};
  cta?: {score: number; note: string};
  evidence?: {score: number; note: string};
  visual_potential?: {score: number; note: string};
  virality?: {score: number; note: string};
  overall?: number;
  top_suggestion?: string;
}

export const ScriptingLab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'editor' | 'timeline' | 'hooks'>('editor');
  const [rightPanel, setRightPanel] = useState<'knowledge' | 'health'>('knowledge');

  // Asset state
  const [asset, setAsset] = useState<Asset | null>(null);
  const [titleInput, setTitleInput] = useState('');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [showAssetList, setShowAssetList] = useState(false);

  // Hook Lab state
  const [hookCategories, setHookCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('Curiosity');
  const [hookTemplates, setHookTemplates] = useState<HookTemplate[]>([]);
  const [generatedHooks, setGeneratedHooks] = useState<string[]>([]);
  const [hookContext, setHookContext] = useState('');
  const [generatingHooks, setGeneratingHooks] = useState(false);

  // Health score state
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null);
  const [scoringLoading, setScoringLoading] = useState(false);
  const [scoreError, setScoreError] = useState('');

  // Autosave
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const aiModel = localStorage.getItem('creatoros-ai-model') || 'Gemini 2.5 Flash';

  // --- Load hook categories on mount ---
  useEffect(() => {
    fetch(`${API}/hooks/categories`).then(r => r.json()).then(setHookCategories).catch(() => {});
    fetchAllAssets();
  }, []);

  // --- Load hook templates when category changes ---
  useEffect(() => {
    if (!selectedCategory) return;
    fetch(`${API}/hooks/templates?category=${encodeURIComponent(selectedCategory)}`)
      .then(r => r.json()).then(setHookTemplates).catch(() => {});
  }, [selectedCategory]);

  const fetchAllAssets = async () => {
    const r = await fetch(`${API}/assets`).catch(() => null);
    if (r?.ok) setAllAssets(await r.json());
  };

  const loadAsset = async (a: Asset) => {
    setAsset(a);
    setTitleInput(a.title);
    setShowAssetList(false);
    const r = await fetch(`${API}/assets/${a.id}/blocks`);
    if (r.ok) setBlocks(await r.json());
  };

  const createNewAsset = async () => {
    const r = await fetch(`${API}/assets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Untitled Script', type: 'Script' })
    });
    if (r.ok) {
      const a = await r.json();
      setAsset(a);
      setTitleInput(a.title);
      setBlocks([]);
      fetchAllAssets();
    }
  };

  // --- Autosave ---
  const triggerAutosave = useCallback(() => {
    if (!asset) return;
    setSaveStatus('unsaved');
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(async () => {
      setSaveStatus('saving');
      await fetch(`${API}/assets/${asset.id}/save`, { method: 'POST' });
      setSaveStatus('saved');
    }, 3000);
  }, [asset]);

  // --- Block operations ---
  const addBlock = async (type: string) => {
    if (!asset) return;
    const r = await fetch(`${API}/assets/${asset.id}/blocks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ asset_id: asset.id, type, content: '', order: blocks.length })
    });
    if (r.ok) { const b = await r.json(); setBlocks(prev => [...prev, b]); triggerAutosave(); }
  };

  const updateBlock = useCallback(async (blockId: string, content: string) => {
    setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, content } : b));
    triggerAutosave();
    // Debounce actual API call
    await fetch(`${API}/blocks/${blockId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
  }, [triggerAutosave]);

  const deleteBlock = async (blockId: string) => {
    await fetch(`${API}/blocks/${blockId}`, { method: 'DELETE' });
    setBlocks(prev => prev.filter(b => b.id !== blockId));
    triggerAutosave();
  };

  const moveBlock = async (index: number, dir: -1 | 1) => {
    const newBlocks = [...blocks];
    const [moved] = newBlocks.splice(index, 1);
    newBlocks.splice(index + dir, 0, moved);
    const reordered = newBlocks.map((b, i) => ({ ...b, order: i }));
    setBlocks(reordered);
    // Update orders on backend
    for (const b of reordered) {
      await fetch(`${API}/blocks/${b.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: b.order })
      });
    }
    triggerAutosave();
  };

  // --- AI Hook Generation ---
  const generateHooks = async () => {
    if (!hookContext) return;
    setGeneratingHooks(true);
    setGeneratedHooks([]);
    try {
      const r = await fetch(`${API}/hooks/generate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: selectedCategory, idea_context: hookContext, model: aiModel, count: 3 })
      });
      if (r.ok) { const d = await r.json(); setGeneratedHooks(d.hooks || []); }
      else { const e = await r.json(); setGeneratedHooks([`Error: ${e.detail}`]); }
    } finally { setGeneratingHooks(false); }
  };

  const useHook = async (hookText: string) => {
    if (!asset) { alert('Open or create a script first!'); return; }
    const r = await fetch(`${API}/assets/${asset.id}/blocks`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ asset_id: asset.id, type: 'Hook', content: hookText, order: 0 })
    });
    if (r.ok) {
      const b = await r.json();
      setBlocks(prev => [b, ...prev]);
      setActiveTab('editor');
      triggerAutosave();
    }
  };

  // --- Health Score ---
  const runHealthScore = async () => {
    if (!asset) { setScoreError('No script open.'); return; }
    setScoringLoading(true);
    setScoreError('');
    setHealthScore(null);
    setRightPanel('health');
    try {
      const r = await fetch(`${API}/health-score`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asset_id: asset.id, model: aiModel })
      });
      if (r.ok) setHealthScore(await r.json());
      else { const e = await r.json(); setScoreError(e.detail); }
    } finally { setScoringLoading(false); }
  };

  const scoreColor = (s: number) => s >= 8 ? '#10b981' : s >= 5 ? '#f59e0b' : '#ef4444';

  // --- Render ---
  const tabStyle = (t: string) => ({
    padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
    fontWeight: 600, fontSize: '14px', transition: 'all 0.2s',
    background: activeTab === t ? 'var(--panel-border)' : 'transparent',
    color: activeTab === t ? '#fff' : 'var(--text-secondary)'
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', height: '100%', minHeight: 0 }}>

      {/* ══════════ LEFT: EDITOR ══════════ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minHeight: 0 }}>

        {/* TOP BAR */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={tabStyle('editor')} onClick={() => setActiveTab('editor')}>Story Builder</button>
            <button style={tabStyle('timeline')} onClick={() => setActiveTab('timeline')}>Timeline</button>
            <button style={tabStyle('hooks')} onClick={() => setActiveTab('hooks')}>Hook Lab</button>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {/* Asset switcher */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowAssetList(v => !v)} style={{
                padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--panel-border)',
                background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px'
              }}>
                {asset ? asset.title.substring(0, 22) + (asset.title.length > 22 ? '…' : '') : 'Open Script ▾'}
              </button>
              {showAssetList && (
                <div style={{
                  position: 'absolute', top: '40px', left: 0, zIndex: 100,
                  background: 'var(--panel-bg)', border: '1px solid var(--panel-border)',
                  borderRadius: '10px', minWidth: '240px', padding: '8px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
                }}>
                  <button onClick={createNewAsset} style={{
                    display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 12px',
                    borderRadius: '8px', border: 'none', background: 'rgba(139,92,246,0.15)',
                    color: '#a78bfa', cursor: 'pointer', fontWeight: 600, marginBottom: '8px'
                  }}>
                    <PlusCircle size={16} /> New Script
                  </button>
                  {allAssets.map(a => (
                    <button key={a.id} onClick={() => loadAsset(a)} style={{
                      display: 'block', width: '100%', textAlign: 'left', padding: '10px 12px',
                      borderRadius: '8px', border: 'none', background: asset?.id === a.id ? 'var(--panel-border)' : 'transparent',
                      color: 'var(--text-primary)', cursor: 'pointer', marginBottom: '4px', fontSize: '14px'
                    }}>
                      {a.title}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              {saveStatus === 'saving' && <><Clock size={14} /> Saving…</>}
              {saveStatus === 'saved' && <><CheckCircle size={14} color="#10b981" /> Saved</>}
              {saveStatus === 'unsaved' && <><AlertCircle size={14} color="#f59e0b" /> Unsaved</>}
            </div>
          </div>
        </div>

        {/* ── STORY BUILDER ── */}
        {activeTab === 'editor' && (
          <GlassCard style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '500px' }}>
            {!asset ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '16px', color: 'var(--text-secondary)' }}>
                <Sparkles size={48} color="#8b5cf6" style={{ opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: '16px' }}>Open an existing script or create a new one</p>
                <button onClick={createNewAsset} style={{
                  padding: '12px 24px', borderRadius: '10px', background: 'rgba(139,92,246,0.2)',
                  color: '#a78bfa', border: '1px solid #8b5cf6', cursor: 'pointer', fontWeight: 600
                }}>
                  + Create New Script
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                <input
                  value={titleInput}
                  onChange={e => { setTitleInput(e.target.value); triggerAutosave(); }}
                  onBlur={() => asset && fetch(`${API}/assets/${asset.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: titleInput }) })}
                  placeholder="Script Title…"
                  style={{
                    fontSize: '22px', fontWeight: 700, background: 'transparent', border: 'none',
                    color: 'var(--text-primary)', outline: 'none', width: '100%', borderBottom: '1px solid var(--panel-border)', paddingBottom: '12px'
                  }}
                />

                {/* Block List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                  {blocks.sort((a, b) => a.order - b.order).map((block, idx) => {
                    const style = BLOCK_COLORS[block.type] || BLOCK_COLORS['Story'];
                    return (
                      <div key={block.id} style={{ borderLeft: `3px solid ${style.border}`, background: style.bg, borderRadius: '0 8px 8px 0', padding: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: style.border, letterSpacing: '1px' }}>{style.label}</span>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button onClick={() => idx > 0 && moveBlock(idx, -1)} disabled={idx === 0} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '2px' }}><ChevronUp size={14} /></button>
                            <button onClick={() => idx < blocks.length - 1 && moveBlock(idx, 1)} disabled={idx === blocks.length - 1} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '2px' }}><ChevronDown size={14} /></button>
                            <button onClick={() => deleteBlock(block.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}><Trash2 size={14} /></button>
                          </div>
                        </div>
                        <textarea
                          value={block.content}
                          onChange={e => updateBlock(block.id, e.target.value)}
                          placeholder={`Write ${block.type} here…`}
                          style={{
                            width: '100%', minHeight: '70px', background: 'transparent', border: 'none',
                            color: 'var(--text-primary)', outline: 'none', resize: 'vertical',
                            fontFamily: 'inherit', fontSize: '15px', lineHeight: '1.6'
                          }}
                        />
                      </div>
                    );
                  })}

                  {/* Add block */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {Object.keys(BLOCK_COLORS).map(type => (
                      <button key={type} onClick={() => addBlock(type)} style={{
                        padding: '6px 14px', borderRadius: '20px', border: `1px solid ${BLOCK_COLORS[type].border}`,
                        background: BLOCK_COLORS[type].bg, color: BLOCK_COLORS[type].border,
                        cursor: 'pointer', fontSize: '13px', fontWeight: 600
                      }}>
                        + {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </GlassCard>
        )}

        {/* ── TIMELINE ── */}
        {activeTab === 'timeline' && (
          <GlassCard style={{ flex: 1, minHeight: '500px' }}>
            <h3 style={{ margin: '0 0 20px 0', color: 'var(--text-primary)' }}>Pacing Timeline</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {TIMELINE_SEGMENTS.map(seg => {
                const matchingBlock = blocks.find(b => b.type === seg.type);
                return (
                  <div key={seg.range} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={{ minWidth: '60px', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '13px', paddingTop: '12px' }}>{seg.range}</div>
                    <div style={{ flex: 1, padding: '14px', borderLeft: `3px solid ${seg.color}`, background: `rgba(${seg.color.replace('#','').match(/.{2}/g)?.map(h => parseInt(h,16)).join(',')},0.08)`, borderRadius: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <strong style={{ color: seg.color, fontSize: '13px' }}>{seg.type}</strong>
                        {matchingBlock ? <span style={{ fontSize: '12px', color: '#10b981' }}>✓ Written</span> : <span style={{ fontSize: '12px', color: '#f59e0b' }}>Missing</span>}
                      </div>
                      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>{seg.note}</p>
                      {matchingBlock && (
                        <p style={{ margin: '8px 0 0 0', color: 'var(--text-primary)', fontSize: '13px', fontStyle: 'italic', opacity: 0.8 }}>
                          "{matchingBlock.content.substring(0, 80)}{matchingBlock.content.length > 80 ? '…' : ''}"
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        )}

        {/* ── HOOK LAB ── */}
        {activeTab === 'hooks' && (
          <GlassCard style={{ flex: 1, minHeight: '500px' }}>
            <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-primary)' }}>Hook Lab</h3>

            {/* Category Selector */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
              {hookCategories.map(cat => (
                <button key={cat} onClick={() => setSelectedCategory(cat)} style={{
                  padding: '6px 14px', borderRadius: '20px', border: '1px solid var(--panel-border)',
                  background: selectedCategory === cat ? 'rgba(139,92,246,0.3)' : 'transparent',
                  color: selectedCategory === cat ? '#a78bfa' : 'var(--text-secondary)',
                  cursor: 'pointer', fontSize: '13px', fontWeight: 600
                }}>
                  {cat}
                </button>
              ))}
            </div>

            {/* Templates from DB */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '10px', letterSpacing: '1px' }}>TEMPLATES</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                {hookTemplates.map(h => (
                  <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px' }}>
                    <span style={{ color: 'var(--text-primary)', fontSize: '14px', flex: 1, marginRight: '12px' }}>{h.template}</span>
                    <button onClick={() => useHook(h.template)} style={{
                      padding: '4px 12px', borderRadius: '6px', border: '1px solid var(--panel-border)',
                      background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', whiteSpace: 'nowrap'
                    }}>Use</button>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Generate */}
            <div style={{ borderTop: '1px solid var(--panel-border)', paddingTop: '16px' }}>
              <div style={{ fontSize: '12px', color: '#a78bfa', fontWeight: 700, marginBottom: '10px', letterSpacing: '1px' }}>AI GENERATOR</div>
              <input
                value={hookContext}
                onChange={e => setHookContext(e.target.value)}
                placeholder="Describe your video idea…"
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--panel-border)',
                  background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)', outline: 'none', fontSize: '14px', marginBottom: '10px', boxSizing: 'border-box'
                }}
              />
              <button onClick={generateHooks} disabled={!hookContext || generatingHooks} style={{
                width: '100%', padding: '11px', borderRadius: '8px', background: generatingHooks ? 'rgba(139,92,246,0.3)' : 'rgba(139,92,246,0.2)',
                color: '#a78bfa', border: '1px solid #8b5cf6', cursor: generatingHooks ? 'wait' : 'pointer', fontWeight: 600, display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '12px'
              }}>
                <Sparkles size={16} /> {generatingHooks ? 'Generating…' : `Generate Similar (${aiModel})`}
              </button>

              {generatedHooks.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {generatedHooks.map((h, i) => (
                    <div key={i} style={{ padding: '12px', background: 'rgba(139,92,246,0.1)', borderRadius: '8px', borderLeft: '3px solid #8b5cf6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                      <span style={{ color: 'var(--text-primary)', fontSize: '14px' }}>{h}</span>
                      <button onClick={() => useHook(h)} style={{ padding: '4px 12px', borderRadius: '6px', border: '1px solid #8b5cf6', background: 'transparent', color: '#a78bfa', cursor: 'pointer', fontSize: '12px', whiteSpace: 'nowrap' }}>Use</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </GlassCard>
        )}
      </div>

      {/* ══════════ RIGHT: KNOWLEDGE & HEALTH ══════════ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Panel toggle */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setRightPanel('knowledge')} style={{ ...tabStyle('knowledge'), background: rightPanel === 'knowledge' ? 'var(--panel-border)' : 'transparent', color: rightPanel === 'knowledge' ? '#fff' : 'var(--text-secondary)' }}>Knowledge</button>
          <button onClick={() => setRightPanel('health')} style={{ ...tabStyle('health'), background: rightPanel === 'health' ? 'var(--panel-border)' : 'transparent', color: rightPanel === 'health' ? '#fff' : 'var(--text-secondary)' }}>Health Score</button>
        </div>

        {/* ── KNOWLEDGE PANEL ── */}
        {rightPanel === 'knowledge' && (
          <GlassCard style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--panel-border)' }}>
              <Library size={18} color="#8b5cf6" />
              <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--text-primary)' }}>Knowledge Panel</h3>
            </div>

            {/* AI Suggestions */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '1px', marginBottom: '10px' }}>AI SUGGESTIONS</div>
              {blocks.length === 0 && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>Start writing blocks and suggestions will appear here.</p>
              )}
              {blocks.length > 0 && !blocks.find(b => b.type === 'Hook') && (
                <div style={{ padding: '10px 12px', background: 'rgba(239,68,68,0.1)', borderLeft: '3px solid #ef4444', borderRadius: '4px', fontSize: '13px', marginBottom: '8px' }}>
                  <strong style={{ color: '#ef4444' }}>Missing Hook</strong><br />
                  <span style={{ color: 'var(--text-secondary)' }}>Your script has no Hook block. This is the #1 retention killer.</span>
                </div>
              )}
              {blocks.length > 0 && !blocks.find(b => b.type === 'CTA') && (
                <div style={{ padding: '10px 12px', background: 'rgba(245,158,11,0.1)', borderLeft: '3px solid #f59e0b', borderRadius: '4px', fontSize: '13px', marginBottom: '8px' }}>
                  <strong style={{ color: '#f59e0b' }}>Weak CTA</strong><br />
                  <span style={{ color: 'var(--text-secondary)' }}>No Call-to-Action detected. Don't let viewers leave without an action.</span>
                </div>
              )}
              {blocks.length > 0 && !blocks.find(b => b.type === 'Proof') && (
                <div style={{ padding: '10px 12px', background: 'rgba(59,130,246,0.1)', borderLeft: '3px solid #3b82f6', borderRadius: '4px', fontSize: '13px', marginBottom: '8px' }}>
                  <strong style={{ color: '#3b82f6' }}>No Proof</strong><br />
                  <span style={{ color: 'var(--text-secondary)' }}>Add evidence or statistics to build authority and trust.</span>
                </div>
              )}
              {blocks.find(b => b.type === 'Hook') && blocks.find(b => b.type === 'CTA') && blocks.find(b => b.type === 'Proof') && (
                <div style={{ padding: '10px 12px', background: 'rgba(16,185,129,0.1)', borderLeft: '3px solid #10b981', borderRadius: '4px', fontSize: '13px' }}>
                  <strong style={{ color: '#10b981' }}>Looking Good!</strong><br />
                  <span style={{ color: 'var(--text-secondary)' }}>Core structure is complete. Run AI Health Check for a deep score.</span>
                </div>
              )}
            </div>

            {/* Script stats */}
            {blocks.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '1px', marginBottom: '10px' }}>QUICK STATS</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ padding: '10px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>{blocks.length}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Blocks</div>
                  </div>
                  <div style={{ padding: '10px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {blocks.reduce((sum, b) => sum + b.content.split(/\s+/).filter(Boolean).length, 0)}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Words</div>
                  </div>
                </div>
              </div>
            )}

            {/* Run health check CTA */}
            <button onClick={runHealthScore} disabled={scoringLoading || !asset} style={{
              width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(139,92,246,0.2)',
              color: '#a78bfa', border: '1px solid #8b5cf6', cursor: (!asset || scoringLoading) ? 'not-allowed' : 'pointer',
              fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
            }}>
              <BarChart2 size={18} /> {scoringLoading ? 'Scoring…' : 'Run AI Health Check'}
            </button>
          </GlassCard>
        )}

        {/* ── HEALTH SCORE ── */}
        {rightPanel === 'health' && (
          <GlassCard style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--panel-border)' }}>
              <BarChart2 size={18} color="#8b5cf6" />
              <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--text-primary)' }}>AI Health Score</h3>
            </div>

            {scoringLoading && (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                <Sparkles size={32} color="#8b5cf6" style={{ animation: 'spin 1s linear infinite' }} />
                <p style={{ marginTop: '12px' }}>Analyzing your script…</p>
              </div>
            )}

            {scoreError && (
              <div style={{ padding: '12px', background: 'rgba(239,68,68,0.1)', borderRadius: '8px', color: '#ef4444', fontSize: '14px' }}>
                {scoreError}
              </div>
            )}

            {healthScore && !scoringLoading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Overall */}
                <div style={{ textAlign: 'center', padding: '16px', background: `rgba(${healthScore.overall && healthScore.overall >= 8 ? '16,185,129' : healthScore.overall && healthScore.overall >= 5 ? '245,158,11' : '239,68,68'},0.1)`, borderRadius: '12px', marginBottom: '4px' }}>
                  <div style={{ fontSize: '48px', fontWeight: 900, color: scoreColor(healthScore.overall || 0) }}>{healthScore.overall}/10</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Overall Score</div>
                </div>

                {/* Top suggestion */}
                {healthScore.top_suggestion && (
                  <div style={{ padding: '12px', background: 'rgba(139,92,246,0.1)', borderLeft: '3px solid #8b5cf6', borderRadius: '4px', fontSize: '13px', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    <strong style={{ color: '#a78bfa' }}>Top Fix:</strong> {healthScore.top_suggestion}
                  </div>
                )}

                {/* Dimension scores */}
                {Object.entries(healthScore).filter(([k]) => k !== 'overall' && k !== 'top_suggestion').map(([key, val]) => {
                  if (!val || typeof val !== 'object') return null;
                  const score = (val as {score: number; note: string}).score;
                  const note = (val as {score: number; note: string}).note;
                  return (
                    <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{key.replace('_', ' ')}</span>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: scoreColor(score) }}>{score}/10</span>
                      </div>
                      <div style={{ height: '4px', background: 'var(--panel-border)', borderRadius: '2px' }}>
                        <div style={{ height: '4px', width: `${score * 10}%`, background: scoreColor(score), borderRadius: '2px', transition: 'width 0.5s ease' }} />
                      </div>
                      {note && <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>{note}</p>}
                    </div>
                  );
                })}

                <button onClick={runHealthScore} style={{
                  marginTop: '8px', padding: '10px', borderRadius: '8px', background: 'transparent',
                  color: 'var(--text-secondary)', border: '1px solid var(--panel-border)', cursor: 'pointer', fontSize: '13px'
                }}>
                  Re-analyze
                </button>
              </div>
            )}

            {!healthScore && !scoringLoading && !scoreError && (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <BarChart2 size={36} style={{ opacity: 0.4 }} />
                <p style={{ margin: 0, fontSize: '14px' }}>No score yet. Write some blocks, then click "Run AI Health Check".</p>
              </div>
            )}
          </GlassCard>
        )}
      </div>
    </div>
  );
};
