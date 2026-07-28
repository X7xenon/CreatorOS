import React from 'react';
import { Check, X, Eye } from 'lucide-react';

export interface Suggestion {
  id: string;
  blockId: string;
  action: string;
  originalText: string;
  suggestedText: string;
}

interface SuggestionCardProps {
  suggestion: Suggestion;
  onPreview: (s: Suggestion) => void;
  onApply: (s: Suggestion) => void;
  onDismiss: (s: Suggestion) => void;
}

export const SuggestionCard: React.FC<SuggestionCardProps> = ({ suggestion, onPreview, onApply, onDismiss }) => {
  return (
    <div style={{
      background: 'var(--panel-bg)',
      border: '1px solid var(--panel-border)',
      borderRadius: '8px',
      padding: '12px',
      marginBottom: '12px'
    }}>
      <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#8b5cf6', marginBottom: '8px', textTransform: 'uppercase' }}>
        {suggestion.action}
      </div>
      <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--text-primary)', fontStyle: 'italic', opacity: 0.9 }}>
        "{suggestion.suggestedText.substring(0, 100)}{suggestion.suggestedText.length > 100 ? '...' : ''}"
      </p>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={() => onPreview(suggestion)} style={{
          flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid var(--panel-border)',
          background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px'
        }}><Eye size={14}/> Preview</button>
        <button onClick={() => onApply(suggestion)} style={{
          flex: 1, padding: '6px', borderRadius: '4px', border: 'none',
          background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px'
        }}><Check size={14}/> Apply</button>
        <button onClick={() => onDismiss(suggestion)} style={{
          flex: 1, padding: '6px', borderRadius: '4px', border: 'none',
          background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px'
        }}><X size={14}/> Dismiss</button>
      </div>
    </div>
  );
};
