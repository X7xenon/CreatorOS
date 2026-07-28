import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (action: string) => void;
}

const ACTIONS = [
  'Improve Hook',
  'Shorten',
  'Expand',
  'Rewrite',
  'Generate CTA',
  'Add Proof',
  'Make Emotional'
];

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onSelectAction }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredActions = ACTIONS.filter(a => a.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
        e.preventDefault();
      } else if (e.key === 'ArrowDown') {
        setSelectedIndex(prev => (prev < filteredActions.length - 1 ? prev + 1 : prev));
        e.preventDefault();
      } else if (e.key === 'ArrowUp') {
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
        e.preventDefault();
      } else if (e.key === 'Enter') {
        if (filteredActions[selectedIndex]) {
          onSelectAction(filteredActions[selectedIndex]);
          onClose();
        }
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredActions, selectedIndex, onClose, onSelectAction]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '15vh'
    }} onClick={onClose}>
      <div style={{
        background: 'var(--panel-bg)', border: '1px solid var(--panel-border)',
        borderRadius: '12px', width: '100%', maxWidth: '600px',
        boxShadow: '0 16px 40px rgba(0,0,0,0.5)', overflow: 'hidden'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px', borderBottom: '1px solid var(--panel-border)' }}>
          <Search size={20} color="var(--text-secondary)" style={{ marginRight: '12px' }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search..."
            style={{
              flex: 1, background: 'transparent', border: 'none', color: 'var(--text-primary)',
              fontSize: '16px', outline: 'none'
            }}
          />
        </div>
        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {filteredActions.length === 0 ? (
            <div style={{ padding: '16px', color: 'var(--text-secondary)', textAlign: 'center' }}>No actions found.</div>
          ) : (
            filteredActions.map((action, index) => (
              <div
                key={action}
                onMouseEnter={() => setSelectedIndex(index)}
                onClick={() => {
                  onSelectAction(action);
                  onClose();
                }}
                style={{
                  padding: '12px 16px',
                  background: index === selectedIndex ? 'rgba(139,92,246,0.15)' : 'transparent',
                  color: index === selectedIndex ? '#a78bfa' : 'var(--text-primary)',
                  cursor: 'pointer',
                  borderLeft: index === selectedIndex ? '3px solid #8b5cf6' : '3px solid transparent'
                }}
              >
                {action}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
