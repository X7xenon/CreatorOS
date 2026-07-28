import React, { useState, useEffect, useRef } from 'react';
import { GlassCard } from './GlassCard';
import { getApiBase } from '../utils/apiBase';
import { 
  ChevronDown, ChevronUp, Sparkles, MessageSquare, Zap, Target, 
  Search, BookOpen, AlertTriangle, CheckCircle, BarChart2
} from 'lucide-react';

const API = `${getApiBase()}/api/v1/scripting`;

interface Block { id: string; type: string; content: string; order: number; }
interface Asset { id: string; title: string; status: string; director_data?: any; }

interface AICoachPanelProps {
  asset: Asset | null;
  blocks: Block[];
  selectedBlockId: string | null;
  onUpdateBlock: (id: string, content: string) => void;
  onAddBlock: (type: string) => void;
  onRunHealthCheck: () => void;
  healthScoreData: any;
  scoringLoading: boolean;
  scoreError: string;
}

const AccordionItem: React.FC<{ title: string; icon: React.ReactNode; isOpen: boolean; onClick: () => void; children: React.ReactNode }> = ({ title, icon, isOpen, onClick, children }) => (
  <div style={{ marginBottom: '8px', border: '1px solid var(--panel-border)', borderRadius: '8px', overflow: 'hidden' }}>
    <button onClick={onClick} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '14px' }}>
        {icon}
        {title}
      </div>
      {isOpen ? <ChevronUp size={16} color="var(--text-secondary)" /> : <ChevronDown size={16} color="var(--text-secondary)" />}
    </button>
    {isOpen && (
      <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid var(--panel-border)' }}>
        {children}
      </div>
    )}
  </div>
);

export const AICoachPanel: React.FC<AICoachPanelProps> = ({ asset, blocks, selectedBlockId, onUpdateBlock, onAddBlock, onRunHealthCheck, healthScoreData, scoringLoading, scoreError }) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    coach: true, director: false, research: false, questions: false, missing: false, stats: true, health: false
  });

  const toggleSection = (sec: string) => setOpenSections(p => ({ ...p, [sec]: !p[sec] }));

  // States for API data
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [director, setDirector] = useState<any>(null);
  
  React.useEffect(() => {
    if (asset?.director_data) {
      setDirector(asset.director_data);
    }
  }, [asset?.director_data]);
  
  const [loadingDirector, setLoadingDirector] = useState(false);
  const [audienceQuestions, setAudienceQuestions] = useState<string[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [researchQuery, setResearchQuery] = useState('');
  const [researchResult, setResearchResult] = useState('');
  const [loadingResearch, setLoadingResearch] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const words = blocks.reduce((acc, b) => acc + b.content.split(/\s+/).filter(Boolean).length, 0);
  const readingTime = Math.ceil(words / 150);
  const speakingTime = Math.ceil(words / 130);
  const hookBlock = blocks.find(b => b.type === 'Hook');
  const ctaBlock = blocks.find(b => b.type === 'CTA');
  const proofBlock = blocks.find(b => b.type === 'Proof');
  const problemBlock = blocks.find(b => b.type === 'Problem');
  const storyBlock = blocks.find(b => b.type === 'Story');

  const checklist = [
    { label: 'Hook', done: !!hookBlock },
    { label: 'Problem', done: !!problemBlock },
    { label: 'Story', done: !!storyBlock },
    { label: 'Proof', done: !!proofBlock },
    { label: 'Call to Action', done: !!ctaBlock }
  ];
  const completion = Math.round((checklist.filter(c => c.done).length / checklist.length) * 100);

  const fetchSuggestions = async () => {
    if (!asset) return;
    setLoadingSuggestions(true);
    try {
      const res = await fetch(`${API}/assets/${asset.id}/coach-suggestions`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({}) });
      if (res.ok) setSuggestions((await res.json()).suggestions || []);
    } catch {}
    setLoadingSuggestions(false);
  };

  const fetchDirector = async () => {
    if (!asset) return;
    setLoadingDirector(true);
    try {
      const res = await fetch(`${API}/assets/${asset.id}/director`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({}) });
      if (res.ok) setDirector(await res.json());
    } catch {}
    setLoadingDirector(false);
  };

  const fetchQuestions = async () => {
    if (!asset) return;
    setLoadingQuestions(true);
    try {
      const res = await fetch(`${API}/assets/${asset.id}/audience-questions`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({}) });
      if (res.ok) setAudienceQuestions((await res.json()).questions || []);
    } catch {}
    setLoadingQuestions(false);
  };

  const performResearch = async () => {
    if (!researchQuery) return;
    setLoadingResearch(true);
    try {
      const res = await fetch(`${API}/research`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ query: researchQuery }) });
      if (res.ok) setResearchResult((await res.json()).result);
    } catch {}
    setLoadingResearch(false);
  };

  const runQuickAction = async (action: string) => {
    if (!selectedBlockId) return alert('Select a block in the editor first!');
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/blocks/${selectedBlockId}/improve`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ action }) });
      if (res.ok) {
        const data = await res.json();
        onUpdateBlock(selectedBlockId, data.improved);
      }
    } catch {}
    setActionLoading(false);
  };

  return (
    <GlassCard style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <Sparkles size={20} color="#8b5cf6" />
        <h2 style={{ margin: 0, fontSize: '18px', color: '#fff' }}>AI Writing Coach</h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', paddingRight: '8px', flex: 1 }}>
        
        {/* Section 1: AI Writing Coach */}
        <AccordionItem title="Writing Suggestions" icon={<Zap size={16} color="#f59e0b" />} isOpen={openSections.coach} onClick={() => toggleSection('coach')}>
          {suggestions.length > 0 ? (
            <ul style={{ paddingLeft: '20px', margin: '0 0 16px 0', color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5' }}>
              {suggestions.map((s, i) => <li key={i} style={{ marginBottom: '8px' }}>{s}</li>)}
            </ul>
          ) : (
             <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>Click below to analyze script context.</p>
          )}
          <button onClick={fetchSuggestions} disabled={loadingSuggestions || blocks.length === 0} style={{ width: '100%', padding: '8px', background: 'rgba(139,92,246,0.2)', color: '#a78bfa', border: '1px solid #8b5cf6', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
            {loadingSuggestions ? 'Analyzing...' : 'Get Contextual Suggestions'}
          </button>
          
          <div style={{ marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', letterSpacing: '0.5px' }}>QUICK ACTIONS (SELECTED BLOCK)</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {['Improve Hook', 'Rewrite CTA', 'Add Story', 'Add Proof', 'Simplify Paragraph', 'Make Emotional'].map(action => (
                <button key={action} onClick={() => runQuickAction(action)} disabled={actionLoading || !selectedBlockId} style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', borderRadius: '4px', fontSize: '12px', cursor: selectedBlockId ? 'pointer' : 'not-allowed', opacity: selectedBlockId ? 1 : 0.5 }}>
                  ✨ {action}
                </button>
              ))}
            </div>
          </div>
        </AccordionItem>

        {/* Section 2: AI Director */}
        <AccordionItem title="AI Director" icon={<Target size={16} color="#ec4899" />} isOpen={openSections.director} onClick={() => toggleSection('director')}>
          {!director ? (
            <button onClick={fetchDirector} disabled={loadingDirector || blocks.length === 0} style={{ width: '100%', padding: '8px', background: 'rgba(236,72,153,0.2)', color: '#f472b6', border: '1px solid #ec4899', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
              {loadingDirector ? 'Generating Metadata...' : 'Generate Director Notes'}
            </button>
          ) : (
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              <div style={{ marginBottom: '8px' }}><strong>Style:</strong> {director.style}</div>
              <div style={{ marginBottom: '8px' }}><strong>Camera:</strong> {director.camera?.join(', ')}</div>
              <div style={{ marginBottom: '8px' }}><strong>B-Roll:</strong> {director.b_roll?.join(', ')}</div>
              <div style={{ marginBottom: '8px' }}><strong>Music:</strong> {director.music}</div>
              <div style={{ marginBottom: '12px' }}><strong>SFX:</strong> {director.sfx?.join(', ')}</div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => alert('XenClips integration coming in future release!')} style={{ flex: 1, padding: '8px', background: '#ec4899', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                  Apply to XenClips
                </button>
                <button onClick={fetchDirector} disabled={loadingDirector} style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }} title="Regenerate Notes">
                  {loadingDirector ? '...' : '🔄'}
                </button>
              </div>
            </div>
          )}
        </AccordionItem>

        {/* Section 4: Research Assistant */}
        <AccordionItem title="Research Assistant" icon={<BookOpen size={16} color="#3b82f6" />} isOpen={openSections.research} onClick={() => toggleSection('research')}>
          <input value={researchQuery} onChange={e => setResearchQuery(e.target.value)} placeholder="E.g., Find statistics on..." style={{ width: '100%', padding: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--panel-border)', borderRadius: '4px', color: '#fff', fontSize: '13px', marginBottom: '8px', boxSizing: 'border-box' }} />
          <button onClick={performResearch} disabled={loadingResearch || !researchQuery} style={{ width: '100%', padding: '8px', background: 'rgba(59,130,246,0.2)', color: '#60a5fa', border: '1px solid #3b82f6', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>
            {loadingResearch ? 'Searching...' : 'Search & Summarize'}
          </button>
          {researchResult && (
            <div style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', fontSize: '12px', color: 'var(--text-primary)', lineHeight: '1.5' }}>
              {researchResult}
              <button onClick={() => { if(selectedBlockId) onUpdateBlock(selectedBlockId, blocks.find(b=>b.id===selectedBlockId)?.content + '\n\n' + researchResult) }} style={{ display: 'block', marginTop: '8px', padding: '4px 8px', background: 'var(--panel-border)', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontSize: '11px' }}>
                Insert at Cursor
              </button>
            </div>
          )}
        </AccordionItem>

        {/* Section 5: Audience Questions */}
        <AccordionItem title="Audience Questions" icon={<MessageSquare size={16} color="#10b981" />} isOpen={openSections.questions} onClick={() => toggleSection('questions')}>
          {audienceQuestions.length > 0 ? (
            <ul style={{ paddingLeft: '20px', margin: '0', color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5' }}>
              {audienceQuestions.map((q, i) => <li key={i} style={{ marginBottom: '8px' }}>{q}</li>)}
            </ul>
          ) : (
            <button onClick={fetchQuestions} disabled={loadingQuestions || blocks.length === 0} style={{ width: '100%', padding: '8px', background: 'rgba(16,185,129,0.2)', color: '#34d399', border: '1px solid #10b981', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
              {loadingQuestions ? 'Predicting...' : 'Predict Audience Questions'}
            </button>
          )}
        </AccordionItem>

        {/* Section 6: Missing Elements */}
        <AccordionItem title="Missing Elements" icon={<AlertTriangle size={16} color="#f59e0b" />} isOpen={openSections.missing} onClick={() => toggleSection('missing')}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Script Completion</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>{completion}%</span>
          </div>
          <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', marginBottom: '16px', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: '#10b981', width: `${completion}%`, transition: 'width 0.3s' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {checklist.map(item => (
              <div key={item.label} onClick={() => !item.done && onAddBlock(item.label === 'Call to Action' ? 'CTA' : item.label)} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: item.done ? 'default' : 'pointer' }}>
                {item.done ? <CheckCircle size={14} color="#10b981" /> : <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.3)' }} />}
                <span style={{ fontSize: '13px', color: item.done ? 'var(--text-primary)' : 'var(--text-secondary)', textDecoration: item.done ? 'line-through' : 'none' }}>{item.label}</span>
              </div>
            ))}
          </div>
        </AccordionItem>

        {/* Section 7: Quick Stats */}
        <AccordionItem title="Quick Stats" icon={<BarChart2 size={16} color="#6366f1" />} isOpen={openSections.stats} onClick={() => toggleSection('stats')}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div style={{ padding: '10px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{blocks.length}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Blocks</div>
            </div>
            <div style={{ padding: '10px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{words}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Words</div>
            </div>
            <div style={{ padding: '10px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{readingTime}m</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Reading Time</div>
            </div>
            <div style={{ padding: '10px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{speakingTime}m</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Speaking Time</div>
            </div>
          </div>
        </AccordionItem>

        {/* Section 8: Health Score */}
        <AccordionItem title="AI Health Score" icon={<CheckCircle size={16} color="#8b5cf6" />} isOpen={openSections.health} onClick={() => toggleSection('health')}>
           <button onClick={onRunHealthCheck} disabled={scoringLoading || !asset || blocks.length === 0} style={{ width: '100%', padding: '10px', background: 'rgba(139,92,246,0.2)', color: '#a78bfa', border: '1px solid #8b5cf6', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, marginBottom: '16px' }}>
              {scoringLoading ? 'Scoring...' : 'Run Full Health Check'}
           </button>
           {scoreError && <div style={{ color: '#ef4444', fontSize: '12px', marginBottom: '8px' }}>{scoreError}</div>}
           {healthScoreData && !scoringLoading && (
             <div>
               <div style={{ textAlign: 'center', padding: '16px', background: `rgba(139,92,246,0.1)`, borderRadius: '12px', marginBottom: '12px' }}>
                 <div style={{ fontSize: '36px', fontWeight: 900, color: '#a78bfa' }}>{healthScoreData.overall}/10</div>
                 <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Overall Score</div>
               </div>
               {healthScoreData.top_suggestion && (
                 <div style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                   <strong style={{ color: '#fff' }}>Top Fix:</strong> {healthScoreData.top_suggestion}
                 </div>
               )}
               {['hook', 'story', 'emotion', 'trust', 'curiosity', 'cta', 'retention'].map(key => {
                 const data = (healthScoreData as any)[key];
                 if (!data) return null;
                 return (
                   <div key={key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                     <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{key}</span>
                     <strong style={{ color: '#fff' }}>{data.score}/10</strong>
                   </div>
                 );
               })}
             </div>
           )}
        </AccordionItem>

      </div>
    </GlassCard>
  );
};
