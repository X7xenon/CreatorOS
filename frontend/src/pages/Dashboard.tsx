import React, { useEffect, useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { HeroStats } from '../components/HeroStats';
import { PerformanceChart } from '../components/PerformanceChart';
import { LiveFeed } from '../components/LiveFeed';
import { LiveCountWindow } from '../components/LiveCountWindow';
import { useStore } from '../store/useStore';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({ views: 0, subscribers: 0, revenue: 0 });
  const [followerGrowth, setFollowerGrowth] = useState<any[]>([]);
  const [feed, setFeed] = useState<any[]>([]);
  const { selectedFilter, connectedAccounts } = useStore();

  const selectedAccount = connectedAccounts.find(a => a.id === selectedFilter);
  const isInstagram = selectedAccount?.platform === 'Instagram';

  useEffect(() => {
    // Fetch real summary data from SQLite DB backend
    fetch(`http://localhost:8888/api/v1/dashboard/summary?account_id=${selectedFilter}`)
      .then(res => res.json())
      .then(data => {
        setStats({
          views: data.total_views || 0,
          subscribers: data.total_followers || 0,
          revenue: data.total_likes || 0 // Reusing revenue for total likes for now
        });
      })
      .catch(console.error);
      
    // Fetch detailed analytics for the growth chart
    fetch(`http://localhost:8888/api/v1/dashboard/analytics/detailed?account_id=${selectedFilter}`)
      .then(res => res.json())
      .then(data => {
        setFollowerGrowth(data.follower_growth || []);
      })
      .catch(console.error);

    // Keep WebSocket for live simulation feed
    const ws = new WebSocket('ws://localhost:8888/api/v1/ws/ws');
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.event === 'LiveActivity' && data.data.message) {
          setFeed(prev => [{ id: Date.now(), text: data.data.message, time: new Date() }, ...prev].slice(0, 10));
        }
      } catch (err) {}
    };

    return () => ws.close();
  }, [selectedFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <HeroStats stats={stats} isInstagram={isInstagram} />
      
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <GlassCard title="Follower Growth (30 Days)">
            <PerformanceChart dataPoints={followerGrowth} />
          </GlassCard>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <LiveCountWindow initialCount={stats.views} />
          
          <GlassCard title="Live Activity Stream">
            <LiveFeed feed={feed} />
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
