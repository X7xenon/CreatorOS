import React, { useEffect, useState } from 'react';
import { GlassCard } from './GlassCard';
import { motion } from 'framer-motion';

interface LiveCountWindowProps {
  initialCount?: number;
}

export const LiveCountWindow: React.FC<LiveCountWindowProps> = ({ initialCount = 0 }) => {
  const [count, setCount] = useState(initialCount);
  const [trend, setTrend] = useState<'up' | 'down' | 'flat'>('flat');

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8888/api/v1/ws/ws');
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.event === 'LiveActivity' && data.data.stats?.views) {
          setCount(prev => {
            const next = data.data.stats.views;
            if (next > prev) setTrend('up');
            else if (next < prev) setTrend('down');
            else setTrend('flat');
            return next;
          });
        }
      } catch (err) {}
    };

    return () => ws.close();
  }, []);

  return (
    <GlassCard title="Live Viewer Count">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '120px' }}>
        <motion.div 
          key={count} // Force re-animation when count changes
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--accent-color)', textShadow: 'var(--accent-glow)', fontFamily: 'var(--font-mono)' }}
        >
          {count.toLocaleString()}
        </motion.div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', color: trend === 'up' ? 'var(--success-color)' : trend === 'down' ? 'var(--danger-color)' : 'var(--text-secondary)' }}>
          <span style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {trend === 'up' ? '▲ Trending Up' : trend === 'down' ? '▼ Trending Down' : '− Stable'}
          </span>
        </div>
      </div>
    </GlassCard>
  );
};
