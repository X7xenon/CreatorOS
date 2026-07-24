import React, { useEffect, useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { useStore } from '../store/useStore';

export const MissionControl: React.FC = () => {
  const { selectedFilter, connectedAccounts } = useStore();
  const [goals, setGoals] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [scheduled, setScheduled] = useState<any[]>([]);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [targetMetric, setTargetMetric] = useState('Views');
  const [targetValue, setTargetValue] = useState<number>(100000);
  const [deadline, setDeadline] = useState('');
  const [missionAccountId, setMissionAccountId] = useState(selectedFilter === 'all' || selectedFilter.startsWith('platform_') ? 'global' : selectedFilter);

  // Update modal default when filter changes
  useEffect(() => {
    if (selectedFilter === 'all' || selectedFilter.startsWith('platform_')) {
      setMissionAccountId('global');
    } else {
      setMissionAccountId(selectedFilter);
    }
  }, [selectedFilter]);

  const fetchGoals = () => {
    let url = 'http://localhost:8888/api/v1/mission/goals';
    if (selectedFilter !== 'all' && !selectedFilter.startsWith('platform_')) {
      url += `?account_id=${selectedFilter}`;
    }
    fetch(url)
      .then(res => res.json())
      .then(data => setGoals(data))
      .catch(console.error);
  };

  const handleSetMission = async () => {
    if (!title || !targetValue) return;
    
    const payload = {
      title,
      category: "Custom",
      target_metric: targetMetric,
      target_value: targetValue,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      account_id: missionAccountId === 'global' ? null : missionAccountId
    };
    
    try {
      await fetch('http://localhost:8888/api/v1/mission/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      setShowModal(false);
      fetchGoals();
      // Reset form
      setTitle('');
      setTargetValue(100000);
      setDeadline('');
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    // Fetch active goals
    fetchGoals();

    let qs = '';
    if (selectedFilter !== 'all' && !selectedFilter.startsWith('platform_')) {
      qs = `?account_id=${selectedFilter}`;
    }

    // Fetch achievements
    fetch(`http://localhost:8888/api/v1/mission/achievements${qs}`)
      .then(res => res.json())
      .then(data => setAchievements(data))
      .catch(console.error);
      
    // Fetch upcoming calendar events (pending tasks)
    fetch(`http://localhost:8888/api/v1/calendar/events${qs}`)
      .then(res => res.json())
      .then(data => {
        setScheduled(data.filter((e: any) => e.status === 'Scheduled').slice(0, 5));
      })
      .catch(console.error);
  }, [selectedFilter]);

  // Animated Progress Ring component
  const ProgressRing = ({ radius, stroke, progress }: { radius: number, stroke: number, progress: number }) => {
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <svg height={radius * 2} width={radius * 2} style={{ filter: 'drop-shadow(0 0 10px rgba(0,255,136,0.5))' }}>
        <circle
          stroke="rgba(255,255,255,0.1)"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke="#00ff88"
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s ease-in-out' }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          strokeLinecap="round"
          transform={`rotate(-90 ${radius} ${radius})`}
        />
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="24px" fontWeight="bold">
          {Math.round(progress)}%
        </text>
      </svg>
    );
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
      {/* Left Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* CURRENT MISSIONS */}
        <GlassCard title="🎯 Active Missions">
          {goals.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '10px 0' }}>
              {goals.map((goal: any, index: number) => {
                const progressPercent = Math.min((goal.current_value / goal.target_value) * 100, 100);
                
                // Calculate days left
                let daysLeft = null;
                let deadlineColor = "#00ff88"; // Green
                if (goal.deadline) {
                  const dDate = new Date(goal.deadline);
                  const diff = dDate.getTime() - new Date().getTime();
                  daysLeft = Math.ceil(diff / (1000 * 3600 * 24));
                  if (daysLeft <= 3) deadlineColor = "#ff4444"; // Red
                  else if (daysLeft <= 7) deadlineColor = "#ffaa00"; // Yellow
                }
                
                return (
                  <div key={goal.id} style={{ display: 'flex', alignItems: 'center', gap: '40px', padding: '10px 20px', borderBottom: index < goals.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                    <ProgressRing radius={80} stroke={12} progress={progressPercent} />
                    <div style={{ flex: 1 }}>
                      <h2 style={{ fontSize: '28px', marginBottom: '8px', color: '#fff' }}>{goal.title}</h2>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#aaa', fontSize: '16px', marginBottom: '16px' }}>
                        <span>{goal.current_value.toLocaleString()} / {goal.target_value.toLocaleString()} {goal.target_metric}</span>
                      </div>
                      {daysLeft !== null && (
                        <div style={{ padding: '10px 16px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.05)', display: 'inline-block', border: `1px solid ${deadlineColor}40` }}>
                          <span style={{ color: deadlineColor, fontWeight: 'bold' }}>⏳ {daysLeft} Days Left</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
              <p>No active missions. Time to set a new goal!</p>
              <button onClick={() => setShowModal(true)} style={{ marginTop: '16px', padding: '10px 20px', background: '#00ff88', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Set Mission</button>
            </div>
          )}
        </GlassCard>

        {/* AI SUGGESTION */}
        {goals.length > 0 && goals[0].ai_suggestion && (
          <div style={{ background: 'linear-gradient(90deg, rgba(138,43,226,0.2) 0%, rgba(75,0,130,0.2) 100%)', border: '1px solid rgba(138,43,226,0.3)', borderRadius: '12px', padding: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
            <span style={{ fontSize: '24px' }}>🤖</span>
            <p style={{ margin: 0, color: '#e0c8ff' }}><strong>AI Suggestion:</strong> {goals[0].ai_suggestion}</p>
          </div>
        )}

        {/* ACTION CENTER */}
        <GlassCard title="⚡ Action Center (Pending Uploads)">
          {scheduled.length > 0 ? (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
               {scheduled.map(ev => (
                 <div key={ev.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: '4px solid #00ff88' }}>
                   <div>
                     <div style={{ fontWeight: 'bold', color: '#fff' }}>{ev.title}</div>
                     <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>{ev.platform}</div>
                   </div>
                   <div style={{ textAlign: 'right' }}>
                     <div style={{ color: '#00ff88' }}>{new Date(ev.scheduled_time).toLocaleDateString()}</div>
                     <div style={{ fontSize: '12px', color: '#888' }}>{new Date(ev.scheduled_time).toLocaleTimeString()}</div>
                   </div>
                 </div>
               ))}
             </div>
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>No pending uploads scheduled.</div>
          )}
        </GlassCard>
      </div>

      {/* Right Column: Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <GlassCard title="🏆 Milestones & Achievements">
          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
            {/* Vertical Line */}
            <div style={{ position: 'absolute', left: '20px', top: '10px', bottom: '10px', width: '2px', background: 'rgba(255,255,255,0.1)', zIndex: 0 }}></div>
            
            {achievements.length > 0 ? achievements.map((ach) => (
              <div key={ach.id} style={{ display: 'flex', gap: '16px', zIndex: 1 }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                  {ach.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '16px' }}>{ach.title}</div>
                  <div style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>{ach.description}</div>
                  <div style={{ fontSize: '11px', color: '#555', marginTop: '6px' }}>{new Date(ach.unlocked_at).toLocaleDateString()}</div>
                </div>
              </div>
            )) : (
              <div style={{ color: '#888', paddingLeft: '50px' }}>No achievements unlocked yet.</div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Set Mission Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '32px', width: '400px' }}>
            <h3 style={{ margin: '0 0 24px 0', color: '#fff', fontSize: '20px' }}>Set New Mission</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#888', fontSize: '13px' }}>Mission Title</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Hit 100k views!" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: '#fff', boxSizing: 'border-box' }} />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#888', fontSize: '13px' }}>Target Account</label>
                <select value={missionAccountId} onChange={e => setMissionAccountId(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: '#fff', boxSizing: 'border-box' }}>
                  <option value="global">🌍 Global (All Accounts)</option>
                  {connectedAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.platform === 'YouTube' ? '🎥' : '📸'} {acc.platform} - @{acc.handle}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#888', fontSize: '13px' }}>Target Metric</label>
                <select value={targetMetric} onChange={e => setTargetMetric(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: '#fff', boxSizing: 'border-box' }}>
                  <option>Views</option>
                  <option>Followers</option>
                  <option>Revenue</option>
                  <option>Uploads</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#888', fontSize: '13px' }}>Target Value</label>
                <input type="number" value={targetValue} onChange={e => setTargetValue(Number(e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: '#fff', boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#888', fontSize: '13px' }}>Deadline</label>
                <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: '#fff', boxSizing: 'border-box' }} />
              </div>
              
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '10px', background: '#1e293b', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleSetMission} style={{ flex: 1, padding: '10px', background: '#00ff88', border: 'none', color: '#000', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Launch Mission</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
