import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, ChevronDown, Bell, X, AlertTriangle, RefreshCw
} from 'lucide-react';
import { fetchYummyAnimeDetails, parseYummyVideos, ipcFetch } from './yummyApi';
import { logEpisodeWatch, savePlaybackPosition, getPlaybackPosition } from './watchHistoryService';


export default function PlayerView({ anime, onBack, mpvBridge }) {
  const [yummyVideos, setYummyVideos] = useState([]);
  const [selectedDub, setSelectedDub] = useState('Озвучка РуАниме / DEEP');
  const [selectedPlayer, setSelectedPlayer] = useState('Плеер Alloha');
  const [selectedEpisode, setSelectedEpisode] = useState(1);

  const [activeStreamUrl, setActiveStreamUrl] = useState('');
  const [isYummyLoading, setIsYummyLoading] = useState(true);
  const [streamError, setStreamError] = useState(null);

  // Dropdown UI States
  const [isDubDropdownOpen, setIsDubDropdownOpen] = useState(false);
  const [isPlayerDropdownOpen, setIsPlayerDropdownOpen] = useState(false);

  // Playback Resume Position Overlay
  const [savedPositionSeconds, setSavedPositionSeconds] = useState(0);
  const [showResumeOverlay, setShowResumeOverlay] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Available Dubs & Players computed from YummyAnime API
  const [dubList, setDubList] = useState([
    { name: 'Озвучка РуАниме / DEEP', epBadge: '12 / 12', views: '109K', popularityPercent: 95 },
    { name: 'Озвучка AniStar', epBadge: '12 / 12', views: '20.5K', popularityPercent: 35 },
    { name: 'Озвучка AniStar & DEEP', epBadge: '12 / 12', views: '4.1K', popularityPercent: 18 },
    { name: 'Озвучка 2x2', epBadge: '12 / 12', views: '3.8K', popularityPercent: 15 },
    { name: 'Озвучка AniMaunt', epBadge: '5 / 12', views: '76', popularityPercent: 5 }
  ]);

  const [playerList, setPlayerList] = useState([
    { name: 'Плеер Alloha', epBadge: '12 / 12' },
    { name: 'Плеер Kodik', epBadge: '12 / 12' },
    { name: 'Плеер CVH', epBadge: '12 / 12' }
  ]);

  // Resolve stream URL per selected player & dub
  const resolveAndSetStream = async (player, dub, videos = yummyVideos) => {
    setStreamError(null);
    if (!anime?.id) {
      setStreamError('Нет ID тайтла');
      return;
    }

    console.log('[RAW Stream Request LOG]', {
      animeId: anime.id,
      title: anime.title || 'Просмотр аниме',
      episode: selectedEpisode,
      dub: dub,
      player: player,
      timestamp: new Date().toISOString()
    });

    const cleanDub = dub.replace(/^Озвучка\s+/, '').toLowerCase().trim();
    const cleanPlayer = player.replace(/^Плеер\s+/, '').toLowerCase().trim();
    const targetEpStr = String(selectedEpisode).trim();

    // 1. Strict multi-property match
    let matchedVid = videos.find(v => {
      const vDub = String(v.dubbing || '').toLowerCase().trim();
      const vPlayer = String(v.playerName || '').toLowerCase().trim();
      const vEpStr = String(v.episodeNumber || '').trim();

      const dubMatches = vDub.includes(cleanDub) || cleanDub.includes(vDub);
      const playerMatches = vPlayer.includes(cleanPlayer) || cleanPlayer.includes(vPlayer);
      const epMatches = vEpStr === targetEpStr;

      return dubMatches && playerMatches && epMatches;
    });

    // 2. Resilient fallback: If exact dub+player match not found, pick first video matching target episode
    if (!matchedVid) {
      matchedVid = videos.find(v => String(v.episodeNumber || '').trim() === targetEpStr);
      if (matchedVid) {
        console.warn(`[Matching Fallback] Exact match for player "${player}" + dub "${dub}" not found. Using first video for Episode ${targetEpStr}:`, matchedVid.playerName);
      }
    }

    // 3. If no video for this episode exists at all, trigger fallback chain
    if (!matchedVid || !matchedVid.iframeUrl) {
      console.warn(`[Video Missing] No matching video found for ${player}, ${dub}, Episode ${selectedEpisode}`);
      showToast(`Источнику ${player} видео недоступно, пробуем другой источник...`);
      setTimeout(() => {
        handleTriggerFallbackChain();
      }, 1500);
      return;
    }

    let targetUrl = matchedVid.iframeUrl;

    if (mpvBridge && typeof mpvBridge.loadUrl === 'function') {
      try {
        if (targetUrl.includes('<iframe') || targetUrl.includes('.html') || targetUrl.startsWith('http')) {
          console.warn('[mpvBridge] Passing HTML/embed URL to mpv:', targetUrl);
        }
        mpvBridge.loadUrl(targetUrl);
      } catch (e) {
        console.warn('mpvBridge error:', e);
      }
    }
    
    // Perform pre-flight check to diagnose provider errors
    try {
      const res = await ipcFetch(targetUrl);
      const htmlText = await res.text();

      if (player === 'Плеер Alloha' || player === 'Плеер Kodik') {
        console.log(`[RAW Player Request - ${cleanPlayerName}]`, {
          endpoint: targetUrl,
          headers: { Referer: 'https://shikimori.one/', 'User-Agent': navigator.userAgent },
          animeId: anime.id, episode: selectedEpisode, dub
        });
        const hasErrorCode2 = htmlText.includes('Error code: 2');
        console.log(`[RAW Player Response - ${cleanPlayerName}]`, {
          status: res.status, rawTextContainsErrorCode2: hasErrorCode2, note: hasErrorCode2 ? 'Provider internal embed page returned "Error code: 2"' : 'Provider returned valid HTML'
        });
        
        if (hasErrorCode2) {
          setStreamError(`Ошибка провайдера ${player}: Error code 2`);
          return;
        }
      } 
      else if (player === 'Плеер CVH') {
        console.log('[RAW Player Request - CVH/VK]', {
          endpoint: targetUrl,
          headers: { Referer: 'https://vk.com/', 'User-Agent': navigator.userAgent },
          animeId: anime.id, episode: selectedEpisode, dub
        });
        const isVkMissing = htmlText.includes('Видеофайл не найден');
        console.log('[RAW Player Response - CVH/VK]', {
          status: res.status, rawTextContainsErrorCode2: false, note: isVkMissing ? 'VK video file missing/private' : 'Provider returned valid HTML'
        });

        if (isVkMissing) {
          showToast('Источнику Плеер CVH видео недоступно, пробуем другой источник...');
          setTimeout(() => {
            handleTriggerFallbackChain();
          }, 1500);
          return;
        }
      }
    } catch (e) {
      console.warn('Pre-flight fetch failed, proceeding with direct load:', e);
    }

    setActiveStreamUrl(targetUrl);
  };

  // Load Real Streams from API
  useEffect(() => {
    let isMounted = true;

    const loadVideoStream = async () => {
      if (!anime?.id) {
        setIsYummyLoading(false);
        setStreamError('Нет ID тайтла');
        return;
      }

      setIsYummyLoading(true);
      const titleId = anime.id;

      try {
        const yummyDetails = await fetchYummyAnimeDetails(titleId, true);
        if (isMounted && yummyDetails && yummyDetails.videos && yummyDetails.videos.length > 0) {
          const parsed = parseYummyVideos(yummyDetails.videos);
          setYummyVideos(parsed);

          // Extract unique dubs & players dynamically
          const dubMap = new Map();
          const playerMap = new Map();

          parsed.forEach(v => {
            const dName = `Озвучка ${v.dubbing}`;
            const pName = `Плеер ${v.playerName || 'Alloha'}`;

            dubMap.set(dName, (dubMap.get(dName) || 0) + 1);
            playerMap.set(pName, (playerMap.get(pName) || 0) + 1);
          });

          let firstDub = selectedDub;
          let firstPlayer = selectedPlayer;

          if (dubMap.size > 0) {
            const dynamicDubs = Array.from(dubMap.keys()).map((dName, idx) => ({
              name: dName,
              epBadge: `${dubMap.get(dName)} эп.`,
              views: `${(100 - idx * 18).toFixed(1)}K`,
              popularityPercent: Math.max(10, 90 - idx * 20)
            }));
            setDubList(dynamicDubs);
            firstDub = dynamicDubs[0]?.name ?? selectedDub;
            setSelectedDub(firstDub);
          }

          if (playerMap.size > 0) {
            const dynamicPlayers = Array.from(playerMap.keys()).map(pName => ({
              name: pName,
              epBadge: `${playerMap.get(pName)} эп.`
            }));
            setPlayerList(dynamicPlayers);
            firstPlayer = dynamicPlayers[0]?.name ?? selectedPlayer;
            setSelectedPlayer(firstPlayer);
          }

          // FIX (2): Avoid STALE STATE on initial stream resolution
          await resolveAndSetStream(firstPlayer, firstDub, parsed);
          setIsYummyLoading(false);
          logEpisodeWatch(anime, selectedEpisode, firstDub, firstPlayer);
        } else if (isMounted) {
          setStreamError('Видео не найдены для данного тайтла.');
          setIsYummyLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.warn('YummyAnime API load error:', err.message);
          let errorMsg = 'Ошибка загрузки данных YummyAnime.';
          if (err.message.includes('401') || err.message.includes('403') || err.message.includes('expired token')) {
            errorMsg = 'Токен API недействителен (401/403). Проверьте VITE_YUMMY_APP_TOKEN в .env';
          } else if (err.message.includes('timeout')) {
            errorMsg = 'Ошибка сети / timeout при подключении к YummyAnime';
          } else if (err.message.includes('HTTP error')) {
            errorMsg = `Ошибка сервера YummyAnime (${err.message})`;
          }
          setStreamError(errorMsg);
          setIsYummyLoading(false);
        }
      }
    };

    loadVideoStream();

    // Check saved playback position
    if (anime?.id) {
      const savedPos = getPlaybackPosition(anime.id, selectedEpisode);
      if (savedPos > 0) {
        setSavedPositionSeconds(savedPos);
        setShowResumeOverlay(true);
      }
    }

  }, [anime, selectedEpisode]);

  // Handle Dub Change
  const handleSelectDub = (dubName) => {
    setSelectedDub(dubName);
    setIsDubDropdownOpen(false);
    showToast(`Выбрана: ${dubName}`);
    resolveAndSetStream(selectedPlayer, dubName);
  };

  // Handle Player Change (BUG-19 / BUG-19b Fix)
  const handleSelectPlayer = (playerName) => {
    setSelectedPlayer(playerName);
    setIsPlayerDropdownOpen(false);
    showToast(`Переключен плеер: ${playerName}`);
    resolveAndSetStream(playerName, selectedDub);
  };

  // Fallback Chain Trigger (BUG-19)
  const handleTriggerFallbackChain = () => {
    const players = playerList.map(p => p.name);
    const currIdx = players.indexOf(selectedPlayer);
    const nextPlayer = players[(currIdx + 1) % players.length];
    
    showToast(`Переключение на следующий плеер: ${nextPlayer}`);
    handleSelectPlayer(nextPlayer);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2000);
  };

  const formatTimestamp = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `00:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleResumePlayback = () => {
    setShowResumeOverlay(false);
    showToast(`Возобновлено с ${formatTimestamp(savedPositionSeconds)}`);
    if (mpvBridge && mpvBridge.seek) {
      mpvBridge.seek(savedPositionSeconds);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '10px', color: 'var(--text-primary)' }}>
      
      {/* Top Back Navigation Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
        <button
          onClick={onBack}
          className="btn-burgundy"
          style={{ padding: '6px 14px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <ArrowLeft size={16} /> Назад к деталям
        </button>
        <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#D4AF37' }}>
          {anime?.title || 'Просмотр аниме'}
        </span>
      </div>

      {/* FEATURE-17: Reference Selectors Bar (Side-by-side Dub & Player Selectors) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative', zIndex: 10 }}>
        
        {/* Dub Dropdown Selector */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setIsDubDropdownOpen(!isDubDropdownOpen); setIsPlayerDropdownOpen(false); }}
            style={{
              backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)', borderRadius: '8px',
              padding: '8px 14px', fontSize: '0.88rem', fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'
            }}
          >
            <span>{selectedDub}</span>
            <span style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-muted)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700 }}>
              12 / 12
            </span>
            <ChevronDown size={16} color="var(--text-muted)" />
          </button>

          {isDubDropdownOpen && (
            <div style={{
              position: 'absolute', top: '110%', left: 0, width: '360px',
              backgroundColor: '#1E1E1E', border: '1px solid #333333', borderRadius: '10px',
              boxShadow: '0 12px 36px rgba(0,0,0,0.9)', padding: '12px', zIndex: 100
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>Озвучки</span>
                <span style={{ backgroundColor: '#E53935', color: '#FFF', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800 }}>
                  {dubList.length}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '260px', overflowY: 'auto' }}>
                {dubList.map((dub, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectDub(dub.name)}
                    style={{
                      padding: '8px 10px', borderRadius: '6px', cursor: 'pointer',
                      backgroundColor: selectedDub === dub.name ? 'rgba(212, 175, 55, 0.12)' : 'transparent',
                      border: selectedDub === dub.name ? '1px solid var(--border-gold)' : '1px solid transparent'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: selectedDub === dub.name ? '#D4AF37' : 'var(--text-primary)' }}>{dub.name}</span>
                      <span style={{ backgroundColor: '#333', color: '#AAA', padding: '1px 6px', borderRadius: '8px', fontSize: '0.72rem' }}>{dub.epBadge}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>👁 {dub.views}</span>
                      <div style={{ flex: 1, height: '4px', backgroundColor: '#333', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${dub.popularityPercent}%`, height: '100%', backgroundColor: '#E53935' }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Player Dropdown Selector */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setIsPlayerDropdownOpen(!isPlayerDropdownOpen); setIsDubDropdownOpen(false); }}
            style={{
              backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)', borderRadius: '8px',
              padding: '8px 14px', fontSize: '0.88rem', fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'
            }}
          >
            <span>{selectedPlayer}</span>
            <span style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-muted)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700 }}>
              12 / 12
            </span>
            <ChevronDown size={16} color="var(--text-muted)" />
          </button>

          {isPlayerDropdownOpen && (
            <div style={{
              position: 'absolute', top: '110%', left: 0, width: '220px',
              backgroundColor: '#1E1E1E', border: '1px solid #333333', borderRadius: '10px',
              boxShadow: '0 12px 36px rgba(0,0,0,0.9)', padding: '10px', zIndex: 100
            }}>
              {playerList.map((p, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectPlayer(p.name)}
                  style={{
                    padding: '8px 10px', borderRadius: '6px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    backgroundColor: selectedPlayer === p.name ? 'rgba(92, 6, 28, 0.4)' : 'transparent',
                    color: selectedPlayer === p.name ? '#FF85A2' : 'var(--text-primary)'
                  }}
                >
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{p.name}</span>
                  <span style={{ backgroundColor: '#333', color: '#AAA', padding: '1px 6px', borderRadius: '8px', fontSize: '0.72rem' }}>{p.epBadge}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Header Buttons */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
            Подписка
          </button>
          <button style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}>
            <Bell size={16} />
          </button>
        </div>
      </div>

      {/* Dynamic Episode Number Tabs Row */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '6px 0', scrollbarWidth: 'none' }}>
        {(() => {
          const episodeList = Array.from(
            new Set(yummyVideos.map(v => parseInt(v.episodeNumber, 10)).filter(n => !isNaN(n)))
          ).sort((a, b) => a - b);

          if (episodeList.length === 0) {
            return (
              <div style={{ padding: '6px 12px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Эпизоды не найдены
              </div>
            );
          }

          return episodeList.map(ep => {
            const isSelected = selectedEpisode === ep;
            const isFullyWatched = false;

            return (
              <button
                key={ep}
                onClick={() => {
                  setSelectedEpisode(ep);
                  logEpisodeWatch(anime, ep, selectedDub, selectedPlayer);
                  if (anime?.id) savePlaybackPosition(anime.id, ep, 0);
                }}
                style={{
                  minWidth: '46px', height: '38px', borderRadius: '8px',
                  backgroundColor: isSelected ? '#424242' : 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  border: isSelected ? '2px solid #4CAF50' : '1px solid var(--border-subtle)',
                  borderBottom: isFullyWatched ? '3px solid #E53935' : (isSelected ? '2px solid #4CAF50' : '1px solid var(--border-subtle)'),
                  fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                {ep}
              </button>
            );
          });
        })()}
      </div>

      {/* Player Viewport Container */}
      <div style={{
        flex: 1, backgroundColor: '#000000', border: '1px solid var(--border-burgundy)',
        borderRadius: '12px', position: 'relative', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.8)'
      }}>

        {/* Saved Position Overlay */}
        {showResumeOverlay && (
          <div style={{
            position: 'absolute', bottom: '60px', left: '50%', transform: 'translateX(-50%)',
            backgroundColor: 'rgba(18, 22, 28, 0.95)', border: '1px solid #2A3644',
            borderRadius: '10px', padding: '14px 20px', zIndex: 50, textAlign: 'center',
            boxShadow: '0 8px 24px rgba(0,0,0,0.7)', maxWidth: '320px', width: '90%'
          }}>
            <button
              onClick={() => setShowResumeOverlay(false)}
              style={{ position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}
            >
              <X size={14} />
            </button>
            <div style={{ fontSize: '0.85rem', color: '#CCC', marginBottom: '10px' }}>
              Вы остановились на <span style={{ fontWeight: 700, color: '#FFF' }}>{formatTimestamp(savedPositionSeconds)}</span>
            </div>
            <button
              onClick={handleResumePlayback}
              style={{
                backgroundColor: 'rgba(0, 168, 225, 0.2)', color: '#00A8FF',
                border: '1px solid #00A8FF', borderRadius: '6px', padding: '8px 16px',
                fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', width: '100%'
              }}
            >
              Продолжить просмотр
            </button>
          </div>
        )}

        {toastMessage && (
          <div style={{
            position: 'absolute', top: '16px', left: '50%', transform: 'translateX(-50%)',
            backgroundColor: 'rgba(92, 6, 28, 0.95)', border: '1px solid #D4AF37',
            color: '#FFF', padding: '6px 18px', borderRadius: '20px', fontWeight: 700, fontSize: '0.85rem', zIndex: 100
          }}>
            {toastMessage}
          </div>
        )}

        {isYummyLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px', color: '#D4AF37' }}>
            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Загрузка видеопотока...</span>
          </div>
        ) : streamError ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px', color: '#FF5252', padding: '20px', textAlign: 'center' }}>
            <AlertTriangle size={48} />
            <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{streamError}</div>
            <button
              onClick={handleTriggerFallbackChain}
              className="btn-gold"
              style={{ padding: '8px 20px', fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <RefreshCw size={16} /> Попробовать следующий плеер
            </button>
          </div>
        ) : (
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <iframe
              key={activeStreamUrl}
              src={activeStreamUrl}
              title="Anime Video Stream"
              style={{ width: '100%', height: '100%', border: 'none' }}
              allowFullScreen
              allow="autoplay; encrypted-media; picture-in-picture"
              sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
              onError={() => {
                console.warn('[Player Iframe Error] Triggering fallback chain...');
                handleTriggerFallbackChain();
              }}
            />

            {/* Anime King Hub Internal Ad Slot Banner */}
            <div style={{
              position: 'absolute', bottom: '12px', right: '16px',
              backgroundColor: 'rgba(18, 18, 18, 0.85)', border: '1px solid var(--border-burgundy)',
              borderRadius: '8px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '8px',
              color: '#FF85A2', fontSize: '0.75rem', fontWeight: 700, backdropFilter: 'blur(4px)', pointerEvents: 'none'
            }}>
              <span>👑 Anime King Hub VIP Banner Slot</span>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
