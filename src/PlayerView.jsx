import React, { useState, useEffect, useRef } from 'react';
import {
  Play, Pause, Volume2, VolumeX, Settings, Sparkles,
  FastForward, Shield, Users, ArrowLeft, Maximize, RotateCcw,
  Sliders, MessageSquare, Mic
} from 'lucide-react';

export default function PlayerView({ anime, onBack, mpvBridge, anime4kSettings }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1.0);
  const [quality, setQuality] = useState('1080p');
  const [currentSub, setCurrentSub] = useState('Русские субтитры');
  const [currentAudio, setCurrentAudio] = useState('Studio Band (Дубляж)');
  const [toastMessage, setToastMessage] = useState(null);

  const playerContainerRef = useRef(null);

  // C16: Speed steps up to 3.0x
  const speedSteps = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.25, 2.5, 2.75, 3.0];
  const qualityOptions = ['1080p', '720p', '480p', 'Auto'];

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2000);
  };

  // C18: Hotkeys Handler (←/→ seek, Space play/pause, S subtitles, A audio)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger hotkeys if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          setIsPlaying(prev => !prev);
          if (mpvBridge) mpvBridge.togglePlayPause();
          showToast(isPlaying ? 'Пауза' : 'Воспроизведение');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (mpvBridge) mpvBridge.seek(-5);
          showToast('Перемотка -5 сек (←)');
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (mpvBridge) mpvBridge.seek(5);
          showToast('Перемотка +5 сек (→)');
          break;
        case 'KeyS':
          e.preventDefault();
          if (mpvBridge) mpvBridge.cycleSubtitles();
          setCurrentSub(prev => prev === 'Русские субтитры' ? 'Японские субтитры' : 'Русские субтитры');
          showToast('Смена субтитров (S)');
          break;
        case 'KeyA':
          e.preventDefault();
          if (mpvBridge) mpvBridge.cycleAudio();
          setCurrentAudio(prev => prev.includes('Studio Band') ? 'Anilibria (Многоголосый)' : 'Studio Band (Дубляж)');
          showToast('Смена озвучки (A)');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, mpvBridge]);

  const handleSpeedChange = (newSpeed) => {
    setSpeed(newSpeed);
    if (mpvBridge) mpvBridge.setSpeed(newSpeed);
    showToast(`Скорость: ${newSpeed}x`);
  };

  const handleQualityChange = (newQuality) => {
    setQuality(newQuality);
    if (mpvBridge) mpvBridge.setQuality(newQuality);
    showToast(`Качество: ${newQuality}`);
  };

  return (
    <div style={{ color: '#FFF', height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Header Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <button
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#121212',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#FFF',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.85rem'
          }}
        >
          <ArrowLeft size={16} /> Выход из плеера
        </button>

        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#D4AF37', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{anime?.title || 'Просмотр аниме'}</span>
          <span style={{ fontSize: '0.75rem', backgroundColor: '#5C061C', color: '#FFF', padding: '2px 8px', borderRadius: '4px' }}>mpv Engine IPC</span>
        </div>
      </div>

      {/* Main Video Viewport (mpv Engine Window Embed) */}
      <div
        ref={playerContainerRef}
        style={{
          flex: 1,
          backgroundColor: '#000000',
          border: '1px solid rgba(92, 6, 28, 0.6)',
          borderRadius: '12px',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justify: 'space-between',
          padding: '24px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.9)'
        }}
      >

        {/* Toast Notification Overlay */}
        {toastMessage && (
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(92, 6, 28, 0.9)',
            border: '1px solid #D4AF37',
            color: '#FFF',
            padding: '8px 20px',
            borderRadius: '20px',
            fontWeight: 700,
            fontSize: '0.85rem',
            zIndex: 100
          }}>
            {toastMessage}
          </div>
        )}

        {/* Center Mock Video Frame / Engine Info */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: 'rgba(92, 6, 28, 0.4)',
            border: '2px solid #D4AF37',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            marginBottom: '16px',
            boxShadow: '0 0 25px rgba(212, 175, 55, 0.3)'
          }}>
            {isPlaying ? <Play size={36} color="#D4AF37" fill="#D4AF37" /> : <Pause size={36} color="#D4AF37" />}
          </div>

          <div style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '4px' }}>
            Воспроизведение через движок MPV (IPC JSON Process)
          </div>
          <div style={{ fontSize: '0.85rem', color: '#AAA', maxWidth: '500px' }}>
            Шейдеры Anime4K: <strong style={{ color: '#D4AF37' }}>{anime4kSettings?.preset || 'Выключено'} ({anime4kSettings?.quality || 'HQ'})</strong>
          </div>

          {/* Hotkey Legend Overlay */}
          <div style={{ display: 'flex', gap: '16px', marginTop: '20px', fontSize: '0.75rem', color: '#888', backgroundColor: 'rgba(10,10,10,0.8)', padding: '8px 16px', borderRadius: '8px' }}>
            <span><kbd style={{ background: '#222', padding: '2px 6px', borderRadius: '4px' }}>Space</kbd> Play/Pause</span>
            <span><kbd style={{ background: '#222', padding: '2px 6px', borderRadius: '4px' }}>← / →</kbd> Перемотка</span>
            <span><kbd style={{ background: '#222', padding: '2px 6px', borderRadius: '4px' }}>S</kbd> Субтитры</span>
            <span><kbd style={{ background: '#222', padding: '2px 6px', borderRadius: '4px' }}>A</kbd> Озвучка</span>
          </div>
        </div>

        {/* Bottom Control Bar */}
        <div style={{
          backgroundColor: 'rgba(10, 10, 10, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          gap: '20px'
        }}>
          {/* Left Play/Pause & Audio / Sub status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => {
                setIsPlaying(!isPlaying);
                if (mpvBridge) mpvBridge.togglePlayPause();
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D4AF37' }}
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} fill="#D4AF37" />}
            </button>

            <div style={{ fontSize: '0.8rem', color: '#AAA' }}>
              <span style={{ color: '#FFF', fontWeight: 600 }}>[A] {currentAudio}</span> • <span style={{ color: '#FFF', fontWeight: 600 }}>[S] {currentSub}</span>
            </div>
          </div>

          {/* Right Speed & Quality Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            
            {/* C15: Quality Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.8rem', color: '#888' }}>Качество:</span>
              <select
                value={quality}
                onChange={(e) => handleQualityChange(e.target.value)}
                style={{ backgroundColor: '#000', border: '1px solid #5C061C', color: '#D4AF37', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}
              >
                {qualityOptions.map(q => <option key={q} value={q}>{q}</option>)}
              </select>
            </div>

            {/* C16: Speed Steps Selector (up to 3.0x) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.8rem', color: '#888' }}>Скорость:</span>
              <select
                value={speed}
                onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                style={{ backgroundColor: '#000', border: '1px solid #5C061C', color: '#D4AF37', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}
              >
                {speedSteps.map(s => <option key={s} value={s}>{s}x</option>)}
              </select>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
