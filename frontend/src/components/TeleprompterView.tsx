import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, FastForward, Rewind, Maximize, X } from 'lucide-react';

interface TeleprompterViewProps {
  text: string;
  onExit: () => void;
}

export const TeleprompterView: React.FC<TeleprompterViewProps> = ({ text, onExit }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(2); // lines per second
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(p => !p);
      } else if (e.code === 'ArrowUp') {
        setSpeed(s => Math.min(s + 1, 10));
      } else if (e.code === 'ArrowDown') {
        setSpeed(s => Math.max(s - 1, 1));
      } else if (e.code === 'Escape') {
        onExit();
      } else if (e.code === 'KeyF') {
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onExit]);

  useEffect(() => {
    if (isPlaying) {
      scrollInterval.current = setInterval(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop += speed;
        }
      }, 50);
    } else {
      if (scrollInterval.current) clearInterval(scrollInterval.current);
    }
    return () => {
      if (scrollInterval.current) clearInterval(scrollInterval.current);
    };
  }, [isPlaying, speed]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: '#000',
        color: '#fff',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '2rem',
        overflowY: 'auto'
      }}
    >
      {/* Controls */}
      <div style={{
        position: 'fixed',
        top: '20px', right: '20px',
        display: 'flex', gap: '10px',
        background: 'rgba(255,255,255,0.1)',
        padding: '10px',
        borderRadius: '8px',
        zIndex: 10000
      }}>
        <button onClick={() => setSpeed(Math.max(speed - 1, 1))} style={btnStyle} title="Slower (Down)"><Rewind size={20} /></button>
        <button onClick={() => setIsPlaying(!isPlaying)} style={btnStyle} title="Play/Pause (Space)">
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>
        <button onClick={() => setSpeed(Math.min(speed + 1, 10))} style={btnStyle} title="Faster (Up)"><FastForward size={20} /></button>
        <button onClick={toggleFullscreen} style={btnStyle} title="Fullscreen (F)"><Maximize size={20} /></button>
        <button onClick={onExit} style={{ ...btnStyle, color: '#ef4444' }} title="Exit (Esc)"><X size={20} /></button>
      </div>

      <div style={{ position: 'fixed', top: '20px', left: '20px', color: '#666', zIndex: 10000 }}>
        Speed: {speed} | Hotkeys: Space, Up, Down, F, Esc
      </div>

      {/* Guide Line */}
      <div style={{
        position: 'fixed',
        top: '30%', left: '10%', right: '10%',
        height: '2px',
        backgroundColor: 'rgba(239,68,68,0.5)',
        zIndex: 10000,
        pointerEvents: 'none'
      }} />

      {/* Content */}
      <div 
        ref={contentRef}
        style={{
          marginTop: '30vh',
          marginBottom: '50vh',
          width: '80%',
          maxWidth: '1000px',
          fontSize: '48px',
          lineHeight: '1.5',
          fontWeight: 'bold',
          whiteSpace: 'pre-wrap',
          textAlign: 'center'
        }}
      >
        {text}
      </div>
    </div>
  );
};

const btnStyle = {
  background: 'transparent',
  border: 'none',
  color: '#fff',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '5px'
};
