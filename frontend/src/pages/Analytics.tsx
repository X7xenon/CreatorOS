import React, { useEffect, useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { useStore } from '../store/useStore';
import { getApiBase } from '../utils/apiBase';
import { Doughnut, Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler, Tooltip, Legend);

interface AnalyticsData {
  engagement_rate: number;
  watch_time_hours: number;
  ctr: number;
  follower_growth: { date: string, followers: number }[];
  media_performance: { Views: number, Likes: number, Comments: number };
  recent_reels: { id: string, caption: string, views: number, likes: number }[];
}

export const Analytics: React.FC = () => {
  const { selectedFilter, connectedAccounts } = useStore();
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    fetch(`${getApiBase()}/api/v1/dashboard/analytics/detailed?account_id=${selectedFilter}`)
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, [selectedFilter]);

  if (!data) return <div>Loading analytics...</div>;

  const currentFilterLabel = selectedFilter === 'all' ? 'All Accounts' : connectedAccounts.find(a => a.id === selectedFilter)?.handle || 'Selected Account';

  // 1. Follower Growth Line Chart
  const growthData = {
    labels: data.follower_growth.map(d => d.date.split('-').slice(1).join('/')), // MM/DD
    datasets: [{
      label: 'Followers',
      data: data.follower_growth.map(d => d.followers),
      borderColor: 'rgba(139, 92, 246, 1)',
      backgroundColor: 'rgba(139, 92, 246, 0.2)',
      fill: true,
      tension: 0.4
    }]
  };

  // 2. Media Performance Doughnut Chart (Excluding views because views dwarf likes/comments usually, 
  // but let's show Views, Likes, Comments if that's what we want, or just Likes vs Comments)
  const performanceData = {
    labels: ['Likes', 'Comments'],
    datasets: [{
      data: [data.media_performance.Likes, data.media_performance.Comments],
      backgroundColor: ['#ec4899', '#3b82f6'],
      borderColor: 'rgba(0,0,0,0.5)',
      borderWidth: 2,
    }]
  };

  // 3. Recent Reels Bar Chart
  const reelsData = {
    labels: data.recent_reels.map(r => r.caption),
    datasets: [
      {
        label: 'Views',
        data: data.recent_reels.map(r => r.views),
        backgroundColor: '#10b981'
      },
      {
        label: 'Likes',
        data: data.recent_reels.map(r => r.likes),
        backgroundColor: '#ec4899'
      }
    ]
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontWeight: 500, margin: 0 }}>Advanced Analytics</h2>
        <div style={{ background: 'var(--panel-bg)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.9rem', color: 'var(--accent-color)', border: '1px solid var(--accent-color)' }}>
          Showing Data For: <strong>{currentFilterLabel}</strong>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
        <GlassCard>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Avg. Engagement Rate</div>
          <div className="font-mono glow-success" style={{ fontSize: '2rem', fontWeight: 600 }}>{data.engagement_rate}%</div>
        </GlassCard>
        <GlassCard>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Total Interactions</div>
          <div className="font-mono glow-accent" style={{ fontSize: '2rem', fontWeight: 600 }}>{(data.media_performance.Likes + data.media_performance.Comments).toLocaleString()}</div>
        </GlassCard>
        <GlassCard>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Total Views</div>
          <div className="font-mono" style={{ fontSize: '2rem', fontWeight: 600 }}>{data.media_performance.Views.toLocaleString()}</div>
        </GlassCard>
      </div>

      <GlassCard title="Follower Growth (Last 30 Days)">
        <div style={{ height: '300px', display: 'flex', justifyContent: 'center' }}>
          {data.follower_growth.length > 0 ? (
            <Line data={growthData} options={{ maintainAspectRatio: false, scales: { y: { beginAtZero: false, grid: { color: 'rgba(255,255,255,0.1)' } }, x: { grid: { color: 'rgba(255,255,255,0.1)' } } } }} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}>No historical snapshots available. Data collection starts today!</div>
          )}
        </div>
      </GlassCard>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <GlassCard title="Engagement Breakdown">
          <div style={{ height: '250px', display: 'flex', justifyContent: 'center' }}>
            {data.media_performance.Likes > 0 ? (
              <Doughnut data={performanceData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#fff' } } } }} />
            ) : (
               <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}>No media data yet.</div>
            )}
          </div>
        </GlassCard>
        
        <GlassCard title="Recent Media Performance">
          <div style={{ height: '250px', display: 'flex', justifyContent: 'center' }}>
            {data.recent_reels.length > 0 ? (
              <Bar data={reelsData} options={{ maintainAspectRatio: false, scales: { y: { grid: { color: 'rgba(255,255,255,0.1)' } }, x: { grid: { display: false } } }, plugins: { legend: { labels: { color: '#fff' } } } }} />
            ) : (
               <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}>No media data yet.</div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
