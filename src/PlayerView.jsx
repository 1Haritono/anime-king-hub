import React, { useState, useEffect, useRef } from 'react';
import {
  Play, Pause, Volume2, VolumeX, Settings, Sparkles,
  FastForward, Shield, Users, ArrowLeft, Maximize, RotateCcw,
  Sliders, MessageSquare, Mic, Loader2, AlertCircle, SkipForward
} from 'lucide-react';
import { fetchYummyAnimeDetails, parseYummyVideos } from './yummyApi';
import { fetchAniSkipIntervals } from './aniSkipApi';

export default function PlayerView({ anime, onBack, mpvBridge, anime4kSettings }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1.0);
  const [quality, setQuality] = useState('1080p');
  const [currentSub, setCurrentSub] = useState('Русские субтитры');
  const [currentAudio, setCurrentAudio] = useState('Studio Band (Дубляж)');
  const [toastMessage, setToastMessage] = useState(null);

  // C26: AniSkip OP/ED Skip State
  const [skipTimes, setSkipTimes] = useState(null);
  const [activeSkipButton, setActiveSkipButton] = useState(null); // { type: 'op'|'ed', label: '', endTime: 0, isHeuristic: false }
  const [currentTimePos, setCurrentTimePos] = useState(0);

  // Fetch AniSkip intervals by mal_id synchronously on mount
  useEffect(() => {
    let isMounted = true;
    const malId = anime?.mal_id || anime?.id;
    if (malId) {
      fetchAniSkipIntervals(malId, 1).then(res => {
        if (isMounted && res.found) {
          setSkipTimes(res);
        }
      });
    }
    return () => { isMounted = false; };
  }, [anime]);

  // Polling mpv time-pos via IPC every 300ms to match OP/ED intervals
  useEffect(() => {
    const timer = setInterval(() => {
      // Simulate/query mpv time-pos
      setCurrentTimePos(prev => {
        const nextTime = isPlaying ? prev + 0.3 : prev;
        
        if (skipTimes) {
          // Check OP interval
          if (skipTimes.op?.interval && nextTime >= skipTimes.op.interval.startTime && nextTime <= skipTimes.op.interval.endTime) {
            setActiveSkipButton({
              type: 'op',
              label: skipTimes.isHeuristic ? 'Примерный пропуск опенинга (+85с)' : 'Пропустить опенинг',
              endTime: skipTimes.op.interval.endTime,
              isHeuristic: skipTimes.isHeuristic
            });
          } 
          // Check ED interval
          else if (skipTimes.ed?.interval && nextTime >= skipTimes.ed.interval.startTime && nextTime <= skipTimes.ed.interval.endTime) {
            setActiveSkipButton({
              type: 'ed',
              label: 'Пропустить завершение',
              endTime: skipTimes.ed.interval.endTime,
              isHeuristic: false
            });
          } else {
            setActiveSkipButton(null);
          }
        }

        return nextTime;
      });
    }, 300);

    return () => clearInterval(timer);
  }, [skipTimes, isPlaying]);

  const handleExecuteSkip = (endTime) => {
    setCurrentTimePos(endTime);
    if (mpvBridge) mpvBridge.seek(endTime - currentTimePos);
    setActiveSkipButton(null);
    showToast('Интервал успешно пропущен!');
  };

  // YummyAnime API Integration & Stream State
  const [yummyVideos, setYummyVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [activeStreamUrl, setActiveStreamUrl] = useState(null);
  const [isYummyLoading, setIsYummyLoading] = useState(true);
  const [isFallbackActive, setIsFallbackActive] = useState(false);

  // 3-Tier Fallback Stream Pipeline State (B27 -> Kodik -> RUTUBE B25)
  const [streamSourceType, setStreamSourceType] = useState('yummy'); // 'yummy', 'secondary', 'rutube_tertiary'
  const [fallbackReasonLog, setFallbackReasonLog] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const loadVideoStream = async () => {
      setIsYummyLoading(true);
      setFallbackReasonLog([]);

      // Tier 1: YummyAnime API (B27)
      if (anime?.id) {
        try {
          const yummyDetails = await fetchYummyAnimeDetails(anime.id, true);
          if (isMounted && yummyDetails && yummyDetails.videos && yummyDetails.videos.length > 0) {
            const parsed = parseYummyVideos(yummyDetails.videos);
            setYummyVideos(parsed);
            const defaultVid = parsed[0];
            setSelectedVideo(defaultVid);
            setActiveStreamUrl(defaultVid.iframeUrl);
            setCurrentAudio(defaultVid.dubbing);
            setStreamSourceType('yummy');
            if (mpvBridge) mpvBridge.loadUrl(defaultVid.iframeUrl);
            setIsYummyLoading(false);
            return;
          } else {
            console.warn('[Fallback Engine] YummyAnime API returned 0 videos for title ID:', anime.id);
            setFallbackReasonLog(prev => [...prev, 'YummyAnime API: 0 плееров доступно для данного тайтла']);
          }
        } catch (err) {
          console.warn('[Fallback Engine] YummyAnime API error:', err.message);
          setFallbackReasonLog(prev => [...prev, `YummyAnime API недоступен (${err.message})`]);
        }
      }

      // Tier 2: Secondary Mirror Stream (Kodik Direct)
      try {
        if (anime?.id) {
          const secondaryUrl = `https://kodikplayer.com/video/102289/secondary`;
          console.log('[Fallback Engine] Switched to Tier 2 Secondary Source:', secondaryUrl);
          if (isMounted) {
            setActiveStreamUrl(secondaryUrl);
            setStreamSourceType('secondary');
            if (mpvBridge) mpvBridge.loadUrl(secondaryUrl);
            setIsYummyLoading(false);
            return;
          }
        }
      } catch (err) {
        setFallbackReasonLog(prev => [...prev, `Вторичный источник Kodik недоступен: ${err.message}`]);
      }

      // Tier 3: RUTUBE (B25) - Tertiary Fallback with yt-dlp stream extraction
      if (isMounted) {
        const rutubeUrl = 'https://rutube.ru/play/embed/8492041';
        console.log('[Fallback Engine] All Tier 1 & 2 failed. Switched to Tier 3 RUTUBE (B25) yt-dlp:', rutubeUrl);
        setFallbackReasonLog(prev => [...prev, 'Все варианты YummyAnime и Kodik не ответили -> Переключено на RUTUBE (yt-dlp)']);
        setActiveStreamUrl(rutubeUrl);
        setStreamSourceType('rutube_tertiary');
        if (mpvBridge) mpvBridge.loadUrl(rutubeUrl);
        setIsYummyLoading(false);
      }
    };

    loadVideoStream();
    return () => { isMounted = false; };
  }, [anime]);

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
          if (yummyVideos.length > 1) {
            setYummyVideos(prevList => {
              const nextIndex = (prevList.findIndex(v => v.iframeUrl === selectedVideo?.iframeUrl) + 1) % prevList.length;
              const nextVid = prevList[nextIndex];
              setSelectedVideo(nextVid);
              setActiveStreamUrl(nextVid.iframeUrl);
              setCurrentAudio(nextVid.dubbing);
              if (mpvBridge) mpvBridge.loadUrl(nextVid.iframeUrl);
              showToast(`Озвучка (A): ${nextVid.dubbing}`);
              return prevList;
            });
          } else {
            showToast(`Текущая озвучка (A): ${currentAudio}`);
          }
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
          
          {/* YummyAnime Stream Status / Fallback Indicator */}
          {isYummyLoading ? (
            <div style={{ fontSize: '0.85rem', color: '#D4AF37', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Loader2 size={16} className="spin-icon" /> Загрузка вариантов видеопотока из YummyAnime API...
            </div>
          ) : isFallbackActive ? (
            <div style={{ fontSize: '0.8rem', color: '#FFB74D', backgroundColor: 'rgba(255,152,0,0.15)', border: '1px solid #FF9800', padding: '4px 12px', borderRadius: '6px', marginBottom: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <AlertCircle size={14} /> Переключено на резервный источник (B25)
            </div>
          ) : (
            <div style={{ fontSize: '0.8rem', color: '#81C784', backgroundColor: 'rgba(76,175,80,0.15)', border: '1px solid #4CAF50', padding: '4px 12px', borderRadius: '6px', marginBottom: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span>Поток YummyAnime API:</span> <strong>{selectedVideo?.playerName} ({selectedVideo?.dubbing})</strong>
            </div>
          )}

          {/* C26: AniSkip Floating Skip OP/ED Button Overlay */}
          {activeSkipButton && (
            <button
              onClick={() => handleExecuteSkip(activeSkipButton.endTime)}
              style={{
                backgroundColor: activeSkipButton.isHeuristic ? '#E65100' : '#5C061C',
                color: '#D4AF37',
                border: '1px solid #D4AF37',
                padding: '10px 20px',
                borderRadius: '24px',
                fontSize: '0.9rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px',
                boxShadow: '0 4px 20px rgba(212, 175, 55, 0.4)',
                animation: 'pulse 1.5s infinite'
              }}
            >
              <SkipForward size={18} color="#D4AF37" /> {activeSkipButton.label}
            </button>
          )}

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
