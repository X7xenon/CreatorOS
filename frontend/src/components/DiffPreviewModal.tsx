import React from 'react';
import { X, Check } from 'lucide-react';
import { Suggestion } from './SuggestionCard';

interface DiffPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (s: Suggestion) => void;
  suggestion: Suggestion | null;
}

export const DiffPreviewModal: React.FC<DiffPreviewModalProps> = ({ isOpen, onClose, onApply, suggestion }) => {
  if (!isOpen || !suggestion) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)', zIndex: 1000,
      display: 'flex', justifyContent: 'center', alignItems: 'center'
    }} onClick={onClose}>
      <div style={{
        background: 'var(--panel-bg)', border: '1px solid var(--panel-border)',
        borderRadius: '12px', width: '90%', maxWidth: '800px',
        boxShadow: '0 16px 40px rgba(0,0,0,0.5)', overflow: 'hidden',
        display: 'flex', flexDirection: 'column'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--panel-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Preview: {suggestion.action}</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20}/></button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: 'var(--panel-border)' }}>
          <div style={{ background: 'var(--panel-bg)', padding: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#ef4444', marginBottom: '12px', textTransform: 'uppercase' }}>Original (Before)</div>
            <div style={{ background: 'rgba(239, 68, 68, 0.05)', borderLeft: '3px solid #ef4444', padding: '12px', borderRadius: '4px', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', fontSize: '14px', lineHeight: 1.6 }}>
              {suggestion.originalText}
            </div>
          </div>
          <div style={{ background: 'var(--panel-bg)', padding: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#10b981', marginBottom: '12px', textTransform: 'uppercase' }}>Suggested (After)</div>
            <div style={{ background: 'rgba(16, 185, 129, 0.05)', borderLeft: '3px solid #10b981', padding: '12px', borderRadius: '4px', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', fontSize: '14px', lineHeight: 1.6 }}>
              {suggestion.suggestedText}
            </div>
          </div>
        </div>

        <div style={{ padding: '16px', borderTop: '1px solid var(--panel-border)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button onClick={onClose} style={{
            padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--panel-border)',
            background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600
          }}>Cancel</button>
          <button onClick={() => { onApply(suggestion); onClose(); }} style={{
            padding: '8px 16px', borderRadius: '8px', border: 'none',
            background: '#8b5cf6', color: '#fff', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px'
          }}><Check size={16}/> Apply Changes</button>
        </div>
      </div>
    </div>
  );
};
