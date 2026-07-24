import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const LiveFeed: React.FC<{ feed: any[] }> = ({ feed }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '300px' }}>
      <AnimatePresence>
        {feed.length === 0 ? (
          <div style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '2rem' }}>Awaiting telemetry data...</div>
        ) : (
          feed.map(item => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              style={{
                padding: '12px',
                borderLeft: '2px solid var(--accent-color)',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '0 8px 8px 0',
                display: 'flex',
                justifyContent: 'space-between'
              }}
            >
              <span style={{ fontSize: '0.95rem' }}>{item.text}</span>
              <span className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {item.time.toLocaleTimeString()}
              </span>
            </motion.div>
          ))
        )}
      </AnimatePresence>
    </div>
  );
};
