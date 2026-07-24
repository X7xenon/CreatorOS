import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import { useStore } from '../store/useStore';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, X } from 'lucide-react';

interface CalendarEvent {
  id: string;
  account_id: string;
  platform: string;
  title: string;
  status: string;
  scheduled_time: string;
  thumbnail?: string;
  color?: string;
}

export const Calendar: React.FC = () => {
  const { selectedFilter } = useStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // New Post Form State
  const [newPost, setNewPost] = useState({
    title: '',
    platform: 'YouTube',
    status: 'Scheduled',
    scheduled_time: new Date().toISOString().slice(0, 16)
  });

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const accountQuery = selectedFilter !== 'all' ? `&account_id=${selectedFilter}` : '';
      const monthQuery = `&month=${currentDate.getMonth() + 1}`;
      const yearQuery = `&year=${currentDate.getFullYear()}`;
      
      const res = await fetch(`http://localhost:8888/api/v1/calendar/events?${accountQuery}${monthQuery}${yearQuery}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [currentDate, selectedFilter]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFilter === 'all') {
      alert("Please select a specific account to add a post.");
      return;
    }
    
    try {
      const res = await fetch('http://localhost:8888/api/v1/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: selectedFilter,
          platform: newPost.platform,
          title: newPost.title,
          status: newPost.status,
          scheduled_time: new Date(newPost.scheduled_time).toISOString(),
          color: newPost.platform === 'YouTube' ? '#ef4444' : '#ec4899'
        })
      });
      if (res.ok) {
        setIsModalOpen(false);
        setNewPost({ ...newPost, title: '' });
        fetchEvents();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const renderDays = () => {
    const grid = [];
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Weekday headers
    for (let i = 0; i < 7; i++) {
      grid.push(
        <div key={`header-${i}`} style={{ textAlign: 'center', padding: '10px 0', fontWeight: 600, color: 'var(--text-secondary)' }}>
          {weekdays[i]}
        </div>
      );
    }

    // Blank cells before month starts
    for (let i = 0; i < firstDayOfMonth; i++) {
      grid.push(<div key={`blank-${i}`} style={{ padding: '10px', minHeight: '100px', border: '1px solid rgba(255,255,255,0.05)' }}></div>);
    }

    // Actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = events.filter(e => {
        const eDate = new Date(e.scheduled_time);
        return eDate.getDate() === day && eDate.getMonth() === currentDate.getMonth() && eDate.getFullYear() === currentDate.getFullYear();
      });

      grid.push(
        <div key={`day-${day}`} style={{ 
          padding: '10px', 
          minHeight: '120px', 
          border: '1px solid var(--panel-border)',
          backgroundColor: 'rgba(255,255,255,0.02)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ fontWeight: 500, marginBottom: '8px', color: 'var(--text-secondary)' }}>{day}</div>
          {dayEvents.map(event => (
            <div key={event.id} style={{
              background: `linear-gradient(90deg, ${event.color || 'var(--accent-color)'}33, transparent)`,
              borderLeft: `3px solid ${event.color || 'var(--accent-color)'}`,
              padding: '4px 8px',
              borderRadius: '0 4px 4px 0',
              fontSize: '0.75rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              cursor: 'pointer'
            }}>
              <strong>{event.platform}</strong>: {event.title}
            </div>
          ))}
        </div>
      );
    }
    return grid;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CalendarIcon size={24} className="glow-accent" />
          Content Calendar
        </h2>
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--panel-bg)', padding: '4px 16px', borderRadius: '24px', border: '1px solid var(--panel-border)' }}>
            <button onClick={handlePrevMonth} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px' }}><ChevronLeft size={20} /></button>
            <span style={{ fontWeight: 600, minWidth: '120px', textAlign: 'center' }}>
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={handleNextMonth} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px' }}><ChevronRight size={20} /></button>
          </div>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', 
              background: 'var(--accent-color)', color: 'white', 
              border: 'none', padding: '10px 20px', borderRadius: '8px', 
              fontWeight: 600, cursor: 'pointer',
              boxShadow: 'var(--accent-glow)'
            }}
          >
            <Plus size={18} /> Add Post
          </button>
        </div>
      </div>

      <GlassCard style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px' }}>
        {loading ? (
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading...</div>
        ) : events.length === 0 && selectedFilter === 'all' ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--text-secondary)' }}>
            <CalendarIcon size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <h3>No Scheduled Posts</h3>
            <p>Select an account and add a post to get started.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: 'var(--panel-border)', border: '1px solid var(--panel-border)', borderRadius: '8px', overflow: 'hidden' }}>
            {renderDays()}
          </div>
        )}
      </GlassCard>

      {/* Add Post Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 1000
        }}>
          <GlassCard style={{ width: '100%', maxWidth: '500px', padding: '32px', position: 'relative' }}>
            <button 
              onClick={() => setIsModalOpen(false)}
              style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
            <h3 style={{ marginBottom: '24px' }}>Schedule Content</h3>
            
            {selectedFilter === 'all' ? (
              <p style={{ color: 'var(--danger-color)' }}>Please select a specific account from the sidebar first.</p>
            ) : (
              <form onSubmit={handleCreatePost} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Title</label>
                  <input required value={newPost.title} onChange={e => setNewPost({...newPost, title: e.target.value})} type="text" style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--panel-border)', color: 'white' }} placeholder="E.g. React Tutorial" />
                </div>
                
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Platform</label>
                    <select value={newPost.platform} onChange={e => setNewPost({...newPost, platform: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--panel-border)', color: 'white' }}>
                      <option value="YouTube">YouTube</option>
                      <option value="Instagram">Instagram</option>
                      <option value="TikTok">TikTok</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Status</label>
                    <select value={newPost.status} onChange={e => setNewPost({...newPost, status: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--panel-border)', color: 'white' }}>
                      <option value="Scheduled">Scheduled</option>
                      <option value="Draft">Draft</option>
                      <option value="Published">Published</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Date & Time</label>
                  <input required value={newPost.scheduled_time} onChange={e => setNewPost({...newPost, scheduled_time: e.target.value})} type="datetime-local" style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--panel-border)', color: 'white', colorScheme: 'dark' }} />
                </div>
                
                <button type="submit" style={{ marginTop: '16px', background: 'var(--accent-color)', color: 'white', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', boxShadow: 'var(--accent-glow)' }}>
                  Save Event
                </button>
              </form>
            )}
          </GlassCard>
        </div>
      )}
    </div>
  );
};
