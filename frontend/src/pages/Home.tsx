import React, { useEffect, useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { useStore } from '../store/useStore';

interface Video {
  id: number;
  title: string;
  platform: string;
  account: string;
  views: number;
  likes: number;
}

export const Home: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const { selectedFilter } = useStore();

  useEffect(() => {
    fetch(`http://localhost:8888/api/v1/dashboard/top-videos?account_id=${selectedFilter}`)
      .then(res => res.json())
      .then(data => {
        // Sort by views descending
        const sorted = data.sort((a: Video, b: Video) => b.views - a.views);
        setVideos(sorted);
      })
      .catch(console.error);
  }, [selectedFilter]);

  const filteredVideos = videos;

  return (
    <div>
      <h2 style={{ marginBottom: '24px', fontWeight: 500 }}>Home - Top Performing Content</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredVideos.map((video, index) => (
          <GlassCard key={video.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '8px', 
                  background: video.platform === 'YouTube' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(236, 72, 153, 0.2)',
                  color: video.platform === 'YouTube' ? '#ef4444' : '#ec4899',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 'bold', fontSize: '1.2rem'
                }}>
                  {index + 1}
                </div>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 500 }}>{video.title}</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    {video.platform} • @{video.account}
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '32px', textAlign: 'right' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Views</div>
                  <div className="font-mono glow-accent" style={{ fontSize: '1.2rem', fontWeight: 600 }}>
                    {video.views >= 1000000 ? (video.views / 1000000).toFixed(1) + 'M' : video.views >= 1000 ? (video.views / 1000).toFixed(1) + 'K' : video.views}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Likes</div>
                  <div className="font-mono" style={{ fontSize: '1.2rem', fontWeight: 600 }}>
                    {video.likes >= 1000000 ? (video.likes / 1000000).toFixed(1) + 'M' : video.likes >= 1000 ? (video.likes / 1000).toFixed(1) + 'K' : video.likes}
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
};
