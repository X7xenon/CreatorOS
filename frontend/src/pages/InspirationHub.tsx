import React, { useState, useEffect } from 'react';
import { InspirationCard, InspirationCardProps } from '../components/InspirationCard';
import { Sparkles, Plus, Search } from 'lucide-react';
import { getApiBase } from '../utils/apiBase';

import { ProfileSelector } from '../components/ProfileSelector';

export const InspirationHub: React.FC = () => {
  const [inspirations, setInspirations] = useState<InspirationCardProps['inspiration'][]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Recently Added');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = ['Recently Added', 'Studied', 'Archived'];

  useEffect(() => {
    const fetchInspirations = async () => {
      try {
        setLoading(true);
        // Fallback mock data
        const mockData = [
          {
            id: 1,
            title: "How I built a $1M business in 30 days",
            url: "https://youtube.com/watch?v=123",
            platform: "YouTube",
            creator: "Alex Hormozi",
            date_added: new Date().toISOString(),
            category: "Business",
            tags: ["entrepreneurship", "scaling"],
            status: "analyzed",
            analysis_json: {
              Hook: "High contrast statement about money",
              "Camera Style": "Dynamic moving shots",
              Audience: "Aspiring entrepreneurs"
            }
          },
          {
            id: 2,
            title: "The only productivity system you need",
            url: "https://twitter.com/x/123",
            platform: "Twitter",
            creator: "Dan Koe",
            date_added: new Date(Date.now() - 86400000).toISOString(),
            category: "Productivity",
            tags: ["systems", "focus"],
            status: "new"
          },
          {
            id: 3,
            title: "Top 5 hidden iOS features",
            url: "https://tiktok.com/@mrwhosetheboss/video/123",
            platform: "TikTok",
            creator: "Mrwhosetheboss",
            date_added: new Date(Date.now() - 172800000).toISOString(),
            category: "Tech",
            tags: ["ios", "tips"],
            status: "analyzed",
            analysis_json: {
              Hook: "Did you know your iPhone can do this?",
              "Camera Style": "Close-up macro shots of phone",
              Audience: "General tech consumers"
            }
          }
        ];
        
        try {
          const response = await fetch(`${getApiBase()}/api/v1/inspiration`);
          if (response.ok) {
            const data = await response.json();
            if (data && data.length > 0) {
              setInspirations(data);
              return;
            }
          }
        } catch (e) {}
        
        // Use mock data if API fails or returns empty
        setInspirations(mockData);
      } catch (error) {
        console.error("Failed to fetch inspirations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInspirations();
  }, []);

  const filteredInspirations = inspirations.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.creator.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={28} color="#8b5cf6" />
              Inspiration Hub
            </h1>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '14px' }}>Save, analyze, and remix top-performing content.</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <ProfileSelector />
            <button 
              onClick={() => {
                const url = prompt("Enter video/post URL:");
                if (!url) return;
                const title = prompt("Enter Title:") || "Untitled Idea";
                const creator = prompt("Enter Creator Name:") || "Unknown";
                
                fetch(`${getApiBase()}/api/v1/inspiration`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    title, url, creator,
                    platform: url.includes('tiktok') ? 'TikTok' : url.includes('youtube') || url.includes('youtu.be') ? 'YouTube' : url.includes('twitter') || url.includes('x.com') ? 'Twitter' : 'Web',
                    category: 'General',
                    tags: [],
                    status: 'new'
                  })
                }).then(r => r.json()).then(data => {
                  setInspirations(prev => [...prev, data]);
                }).catch(err => {
                  alert("Failed to add inspiration!");
                });
              }}
              style={{
              padding: '10px 20px', background: '#fff', color: '#000', fontWeight: 600,
              borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
              boxShadow: '0 0 20px rgba(255,255,255,0.15)'
            }}>
              <Plus size={18} />
              Add New
            </button>
          </div>
        </div>

        {/* Controls Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', background: 'var(--panel-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--panel-border)' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '8px' }}>
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  background: activeTab === tab ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: activeTab === tab ? '#fff' : 'var(--text-secondary)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  transition: 'all 0.2s'
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '10px' }} />
            <input
              type="text"
              placeholder="Search by title, creator, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '10px 10px 10px 36px',
                background: 'rgba(0,0,0,0.2)', border: '1px solid var(--panel-border)',
                borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px', boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* Content Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            <Sparkles size={32} color="#8b5cf6" style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} />
            <p style={{ marginTop: '16px' }}>Loading inspirations...</p>
          </div>
        ) : filteredInspirations.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            {filteredInspirations.map(inspiration => (
              <InspirationCard key={inspiration.id} inspiration={inspiration} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px', background: 'var(--panel-bg)', borderRadius: '16px', border: '1px dashed var(--panel-border)' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
              <Sparkles size={32} color="#8b5cf6" />
            </div>
            <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>No inspirations found</h3>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '14px' }}>Try adjusting your search or add a new piece of content.</p>
          </div>
        )}
      </div>
    </div>
  );
};
