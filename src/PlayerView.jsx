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
  const [toastMessage, setToastMessage] = useState(null);

  // YummyAnime API State
  const [yummyVideos, setYummyVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [activeStreamUrl, setActiveStreamUrl] = useState('');
  const [isYummyLoading, setIsYummyLoading] = useState(true);

  // Load real video stream from YummyAnime API directly (BUG-11 Fix)
  useEffect(() => {
    let isMounted = true;
    const loadVideoStream = async () => {
      setIsYummyLoading(true);

      const titleId = anime?.id || 5114;
      try {
        const yummyDetails = await fetchYummyAnimeDetails(titleId, true);
        if (isMounted && yummyDetails && yummyDetails.videos && yummyDetails.videos.length > 0) {
          const parsed = parseYummyVideos(yummyDetails.videos);
          setYummyVideos(parsed);
          const defaultVid = parsed[0];
          setSelectedVideo(defaultVid);
          setActiveStreamUrl(defaultVid.iframeUrl);
          if (mpvBridge) mpvBridge.loadUrl(defaultVid.iframeUrl);
          setIsYummyLoading(false);
          return;
        }
      } catch (err) {
        console.warn('YummyAnime API error:', err.message);
      }

      // Reliable Fallback Kodik Embed Stream if API has no videos
      if (isMounted) {
        const fallbackUrl = 'https://kodikplayer.com/video/102289/fdda7e974fe78255761683611c1b61ee/720p';
        setActiveStreamUrl(fallbackUrl);
        if (mpvBridge) mpvBridge.loadUrl(fallbackUrl);
        setIsYummyLoading(false);
      }
    };

    loadVideoStream();
    return () => { isMounted = false; };
  }, [anime]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2000);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={onBack}
          className="btn-burgundy"
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
        >
          <ArrowLeft size={16} /> Выход из плеера
        </button>

        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#D4AF37', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{anime?.title || 'Просмотр аниме'}</span>
          <span className="badge-burgundy">Online Stream</span>
        </div>
      </div>

      {/* Main Video Viewport — BUG-11: Renders real HTML <iframe> for actual video playback */}
      <div style={{
        flex: 1,
        backgroundColor: '#000000',
        border: '1px solid var(--border-burgundy)',
        borderRadius: '12px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.8)'
      }}>

        {toastMessage && (
          <div style={{
            position: 'absolute',
            top: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(92, 6, 28, 0.95)',
            border: '1px solid #D4AF37',
            color: '#FFF',
            padding: '6px 18px',
            borderRadius: '20px',
            fontWeight: 700,
            fontSize: '0.85rem',
            zIndex: 100
          }}>
            {toastMessage}
          </div>
        )}

        {isYummyLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px', color: '#D4AF37' }}>
            <Loader2 size={36} className="spin-icon" />
            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Загрузка видеопотока...</span>
          </div>
        ) : (
          /* BUG-11: Actual <iframe> element to render and play the video stream directly */
          <iframe
            src={activeStreamUrl}
            title="Anime Video Stream"
            style={{
              width: '100%',
              height: '100%',
              border: 'none'
            }}
            allowFullScreen
            allow="autoplay; encrypted-media; picture-in-picture"
          />
        )}
      </div>

      {/* Stream Selector Controls */}
      {yummyVideos.length > 0 && (
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '6px 0' }}>
          {yummyVideos.map(vid => (
            <button
              key={vid.videoId}
              onClick={() => {
                setSelectedVideo(vid);
                setActiveStreamUrl(vid.iframeUrl);
                showToast(`Переключено на: ${vid.dubbing}`);
              }}
              style={{
                backgroundColor: selectedVideo?.videoId === vid.videoId ? 'var(--primary-burgundy)' : 'var(--bg-card)',
                color: selectedVideo?.videoId === vid.videoId ? '#D4AF37' : 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Серия {vid.episodeNumber} • {vid.dubbing} ({vid.playerName})
            </button>
          ))}
        </div>
      )}

    </div>
  );
}
