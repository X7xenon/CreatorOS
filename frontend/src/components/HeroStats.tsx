import React from 'react';
import { GlassCard } from './GlassCard';

interface HeroStatsProps {
  stats: { views: number; subscribers: number; likes: number; };
  isInstagram?: boolean;
}

export const HeroStats: React.FC<HeroStatsProps> = ({ stats, isInstagram }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
      <GlassCard>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '2px' }}>Total Views</div>
        <div className="font-mono glow-accent" style={{ fontSize: '2.5rem', fontWeight: 600 }}>
          {stats.views >= 1000000 ? (stats.views / 1000000).toFixed(2) + 'M' : stats.views >= 1000 ? (stats.views / 1000).toFixed(1) + 'K' : stats.views}
        </div>
      </GlassCard>
      
      <GlassCard>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '2px' }}>
          {isInstagram ? 'Followers' : 'Subscribers'}
        </div>
        <div className="font-mono" style={{ fontSize: '2.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          {stats.subscribers.toLocaleString()}
        </div>
      </GlassCard>

      <GlassCard>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '2px' }}>Total Likes</div>
        <div className="font-mono glow-success" style={{ fontSize: '2.5rem', fontWeight: 600 }}>
          {stats.likes > 0 ? (stats.likes / 1000).toFixed(1) + 'K' : '0.0K'}
        </div>
      </GlassCard>
    </div>
  );
};
