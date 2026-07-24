import React, { useEffect, useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { useStore } from '../store/useStore';

export const MissionControl: React.FC = () => {
  const { selectedFilter } = useStore();
  const [goals, setGoals] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [scheduled, setScheduled] = useState<any[]>([]);

  useEffect(() => {
    // Fetch active goals
    fetch(`http://localhost:8888/api/v1/mission/goals?account_id=${selectedFilter}`)
      .then(res => res.json())
      .then(data => setGoals(data))
      .catch(console.error);

    // Fetch achievements
    fetch(`http://localhost:8888/api/v1/mission/achievements?account_id=${selectedFilter}`)
      .then(res => res.json())
      .then(data => setAchievements(data))
      .catch(console.error);
      
    // Fetch upcoming calendar events (pending tasks)
    fetch(`http://localhost:8888/api/v1/calendar/events?account_id=${selectedFilter}`)
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

  const currentGoal = goals.length > 0 ? goals[0] : null;
  const progressPercent = currentGoal ? Math.min((currentGoal.current_value / currentGoal.target_value) * 100, 100) : 0;
  
  // Calculate days left
  let daysLeft = null;
  let deadlineColor = "#00ff88"; // Green
  if (currentGoal?.deadline) {
    const dDate = new Date(currentGoal.deadline);
    const diff = dDate.getTime() - new Date().getTime();
    daysLeft = Math.ceil(diff / (1000 * 3600 * 24));
    if (daysLeft <= 3) deadlineColor = "#ff4444"; // Red
    else if (daysLeft <= 7) deadlineColor = "#ffaa00"; // Yellow
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
      {/* Left Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* CURRENT MISSION */}
        <GlassCard title="🎯 Current Mission">
          {currentGoal ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '40px', padding: '20px' }}>
              <ProgressRing radius={80} stroke={12} progress={progressPercent} />
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '28px', marginBottom: '8px', color: '#fff' }}>{currentGoal.title}</h2>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#aaa', fontSize: '16px', marginBottom: '16px' }}>
                  <span>{currentGoal.current_value.toLocaleString()} / {currentGoal.target_value.toLocaleString()} {currentGoal.target_metric}</span>
                </div>
                {daysLeft !== null && (
                  <div style={{ padding: '10px 16px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.05)', display: 'inline-block', border: `1px solid ${deadlineColor}40` }}>
                    <span style={{ color: deadlineColor, fontWeight: 'bold' }}>⏳ {daysLeft} Days Left</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
              <p>No active missions. Time to set a new goal!</p>
              <button style={{ marginTop: '16px', padding: '10px 20px', background: '#00ff88', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Set Mission</button>
            </div>
          )}
        </GlassCard>

        {/* AI SUGGESTION */}
        {currentGoal?.ai_suggestion && (
          <div style={{ background: 'linear-gradient(90deg, rgba(138,43,226,0.2) 0%, rgba(75,0,130,0.2) 100%)', border: '1px solid rgba(138,43,226,0.3)', borderRadius: '12px', padding: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
            <span style={{ fontSize: '24px' }}>🤖</span>
            <p style={{ margin: 0, color: '#e0c8ff' }}><strong>AI Suggestion:</strong> {currentGoal.ai_suggestion}</p>
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
    </div>
  );
};
