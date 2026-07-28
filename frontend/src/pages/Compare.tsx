import React, { useEffect, useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { getApiBase } from '../utils/apiBase';
import { useStore } from '../store/useStore';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export const Compare: React.FC = () => {
  const { connectedAccounts } = useStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (connectedAccounts.length < 2) {
        setLoading(false);
        return;
    }
    
    // We pass the handles to the comparison API
    const queryParams = connectedAccounts.slice(0, 4).map(acc => `usernames=${acc.handle}`).join('&');
    
    fetch(`${getApiBase()}/api/v1/comparison/?${queryParams}`)
      .then(res => res.json())
      .then(res => {
          setData(res.comparisons);
          setLoading(false);
      })
      .catch(console.error);
  }, [connectedAccounts]);

  if (loading) {
      return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>Loading comparison...</div>;
  }
  
  if (!data || Object.keys(data).length < 2) {
      return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>Not enough accounts to compare. Please connect at least 2 accounts.</div>;
  }

  const usernames = Object.keys(data);
  const chartData = {
      labels: usernames.map(u => `@${u}`),
      datasets: [
          {
              label: 'Views',
              data: usernames.map(u => data[u].metrics.views),
              backgroundColor: '#3b82f6'
          }
      ]
  };

  return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontWeight: 500, margin: 0 }}>Account Comparison</h2>
        </div>
        
        <GlassCard title="Total Views">
            <div style={{ height: '350px' }}>
               <Bar data={chartData} options={{ maintainAspectRatio: false, scales: { y: { grid: { color: 'rgba(255,255,255,0.1)' } }, x: { grid: { display: false } } }, plugins: { legend: { labels: { color: '#fff' } } } }} />
            </div>
        </GlassCard>
        
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(300px, 1fr))`, gap: '24px' }}>
            {usernames.map(u => (
                <GlassCard key={u} title={`@${u}`}>
                    <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Subscribers / Followers</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{data[u].metrics.subs.toLocaleString()}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Top Content</div>
                        {data[u].top_content.length > 0 ? data[u].top_content.map((c: any, i: number) => (
                            <div key={i} style={{ padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', marginBottom: '8px' }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{c.title}</div>
                                <div style={{ display: 'flex', fontSize: '0.8rem', color: 'var(--accent-color)', marginTop: '4px' }}>
                                    <span>👁 {c.views.toLocaleString()}</span>
                                </div>
                            </div>
                        )) : (
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No content available</div>
                        )}
                    </div>
                </GlassCard>
            ))}
        </div>
      </div>
  );
};
