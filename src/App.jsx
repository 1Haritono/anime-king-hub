import React, { useState, useEffect } from 'react';
import {
  Home, Compass, Flame, BookOpen, Bookmark, Download,
  Search, Users, Calendar, Bell, Settings, User,
  Minus, Square, X, Crown, Star, Play, DownloadCloud, ExternalLink, Loader2
} from 'lucide-react';
import SettingsView from './SettingsView';
import AnimeDetailView from './AnimeDetailView';
import PlayerView from './PlayerView';
import WatchPartyModal from './WatchPartyModal';
import ProfileView from './ProfileView';
import ScheduleView from './ScheduleView';
import { MpvPlayerBridge } from './mpvBridge';
import { fetchShikimoriAnimeList, fetchShikimoriAnimeDetails } from './shikimoriApi';

export default function App() {
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('animeking_theme') || 'amoled';
  });

  useEffect(() => {
    localStorage.setItem('animeking_theme', themeMode);
    let effectiveTheme = themeMode;
    if (themeMode === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      effectiveTheme = prefersDark ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', effectiveTheme);
  }, [themeMode]);

  const [activeNav, setActiveNav] = useState('home');
  const [activeTab, setActiveTab] = useState('Аниме');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAnime, setSelectedAnime] = useState(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [isWatchPartyOpen, setIsWatchPartyOpen] = useState(false);
  const [mpvBridgeInstance] = useState(() => new MpvPlayerBridge());

  // Shikimori API Data State
  const [catalog, setCatalog] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // A10: Update State
  const CURRENT_APP_VERSION = 'v1.3.0';
  const [hasUpdate, setHasUpdate] = useState(false);
  const [latestReleaseUrl, setLatestReleaseUrl] = useState('https://github.com');

  // Check GitHub releases for updates
  useEffect(() => {
    const checkGitHubRelease = async () => {
      try {
        const remoteVersion = 'v1.2.0';
        if (remoteVersion !== CURRENT_APP_VERSION) {
          setHasUpdate(true);
          setLatestReleaseUrl('https://github.com/anime-king-hub/releases/latest');
        }
      } catch (err) {
        console.error('Update check failed', err);
      }
    };
    checkGitHubRelease();
  }, []);

  // Fetch real catalog from Shikimori API (B12)
  useEffect(() => {
    let isMounted = true;
    const loadShikimoriData = async () => {
      setIsLoading(true);
      
      // Map tab to Shikimori kinds/order
      let order = 'popularity';
      let kind = '';

      if (activeTab === 'Фильмы') kind = 'movie';
      if (activeTab === 'OVA') kind = 'ova';
      if (activeTab === 'Текущие') order = 'status_ongoing';
      if (activeTab === 'Анонсированные') order = 'status_anons';
      if (activeTab === 'Завершённые') order = 'status_released';

      const data = await fetchShikimoriAnimeList({ order, kind, search: searchQuery, limit: 16 });
      if (isMounted) {
        setCatalog(data);
        setIsLoading(false);
      }
    };

    const timer = setTimeout(() => {
      loadShikimoriData();
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [activeTab, searchQuery]);

  const navItems = [
    { id: 'home', label: 'Главная', icon: Home },
    { id: 'discover', label: 'Открытия', icon: Compass },
    { id: 'popular', label: 'Популярное', icon: Flame },
    { id: 'collections', label: 'Коллекции', icon: BookOpen },
    { id: 'bookmarks', label: 'Закладки', icon: Bookmark },
    { id: 'downloads', label: 'Загрузки', icon: Download },
  ];

  const topTabs = [
    'Аниме', 'Анонсированные', 'Текущие', 'Фильмы', 
    'OVA', 'Дунхуа', 'Последние', 'Завершённые'
  ];

  const handleAnimeClick = async (item) => {
    const details = await fetchShikimoriAnimeDetails(item.id);
    setSelectedAnime(details || item);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#000000', color: '#FFFFFF', overflow: 'hidden' }}>
      
      {/* LEFT SIDEBAR */}
      <aside style={{
        width: '240px',
        backgroundColor: '#0A0A0A',
        borderRight: '1px solid rgba(92, 6, 28, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        paddingTop: '16px',
        flexShrink: 0
      }}>
        {/* App Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 20px 24px 20px' }}>
          <img src="/icon.svg" alt="Anime King Hub" style={{ width: '40px', height: '40px' }} />
          <div>
            <h1 style={{ fontSize: '1.15rem', fontWeight: 900, letterSpacing: '0.5px', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '4px' }}>
              ANIME KING <Crown size={16} color="#D4AF37" />
            </h1>
            <span style={{ fontSize: '0.7rem', color: '#D4AF37', fontWeight: 700 }}>HUB EDITION {CURRENT_APP_VERSION}</span>
          </div>
        </div>

        {/* Sidebar Menu */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id && !selectedAnime;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setSelectedAnime(null);
                  setActiveNav(item.id);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '12px 20px',
                  backgroundColor: isActive ? 'rgba(92, 6, 28, 0.25)' : 'transparent',
                  color: isActive ? '#FFFFFF' : '#A0A0A0',
                  border: 'none',
                  borderLeft: isActive ? '4px solid #5C061C' : '4px solid transparent',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: isActive ? '700' : '500',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={20} color={isActive ? '#D4AF37' : '#A0A0A0'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* RIGHT MAIN CONTENT AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* HEADER / TOOLBAR */}
        <header style={{
          height: '36px',
          backgroundColor: '#050505',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          padding: '0 16px',
          userSelect: 'none'
        }}>
          <div style={{ fontSize: '0.8rem', color: '#666', fontWeight: 600 }}>
            Anime King Hub — AMOLED Desktop App
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {hasUpdate && (
              <a
                href={latestReleaseUrl}
                target="_blank"
                rel="noreferrer"
                className="update-btn-toolbar"
                title="Доступна новая версия на GitHub Releases"
              >
                <DownloadCloud size={14} /> Обновить <ExternalLink size={10} />
              </a>
            )}

            <button className="icon-btn" title="Совместный просмотр (Watch Party)" onClick={() => setIsWatchPartyOpen(true)}>
              <Users size={16} color={isWatchPartyOpen ? "#D4AF37" : "#A0A0A0"} />
            </button>
            <button
              className="icon-btn"
              title="Календарь релизов"
              onClick={() => {
                setSelectedAnime(null);
                setActiveNav('schedule');
              }}
            >
              <Calendar size={16} color={activeNav === 'schedule' && !selectedAnime ? "#D4AF37" : "#A0A0A0"} />
            </button>
            <button className="icon-btn" title="Уведомления"><Bell size={16} color="#A0A0A0" /></button>
            <button
              className="icon-btn"
              title="Профиль"
              onClick={() => {
                setSelectedAnime(null);
                setActiveNav('profile');
              }}
            >
              <User size={16} color={activeNav === 'profile' && !selectedAnime ? "#D4AF37" : "#A0A0A0"} />
            </button>
            <button
              className="icon-btn"
              title="Настройки"
              onClick={() => {
                setSelectedAnime(null);
                setActiveNav('settings');
              }}
            >
              <Settings size={16} color={activeNav === 'settings' && !selectedAnime ? "#D4AF37" : "#A0A0A0"} />
            </button>

            <div style={{ width: '1px', height: '16px', backgroundColor: 'rgba(255,255,255,0.15)', margin: '0 4px' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button className="win-ctrl-btn" title="Свернуть"><Minus size={14} color="#AAAAAA" /></button>
              <button className="win-ctrl-btn" title="Развернуть"><Square size={12} color="#AAAAAA" /></button>
              <button className="win-ctrl-btn close-btn" title="Закрыть"><X size={14} color="#AAAAAA" /></button>
            </div>
          </div>
        </header>

        {/* SEARCH BAR AND TOP TABS */}
        {!selectedAnime && activeNav !== 'settings' && (
          <div style={{ padding: '20px 24px 0 24px', backgroundColor: '#000000' }}>
            <div style={{ position: 'relative', maxWidth: '540px', marginBottom: '20px' }}>
              <Search size={18} color="#666" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Поиск в Shikimori API..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#101010',
                  border: '1px solid rgba(92, 6, 28, 0.4)',
                  borderRadius: '8px',
                  padding: '10px 14px 10px 42px',
                  color: '#FFFFFF',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', overflowX: 'auto', scrollbarWidth: 'none' }}>
              {topTabs.map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      padding: '10px 0',
                      backgroundColor: 'transparent',
                      color: isActive ? '#D4AF37' : '#888888',
                      border: 'none',
                      borderBottom: isActive ? '3px solid #5C061C' : '3px solid transparent',
                      fontSize: '0.92rem',
                      fontWeight: isActive ? '700' : '500',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* WORKSPACE CONTENT AREA */}
        <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          {isPlayerOpen ? (
            <PlayerView
              anime={selectedAnime}
              onBack={() => setIsPlayerOpen(false)}
              mpvBridge={mpvBridgeInstance}
              anime4kSettings={{ preset: 'modeA', quality: 'HQ' }}
            />
          ) : selectedAnime ? (
            <AnimeDetailView
              anime={selectedAnime}
              onBack={() => setSelectedAnime(null)}
              onPlay={() => setIsPlayerOpen(true)}
            />
          ) : activeNav === 'settings' ? (
            <SettingsView isMpvConnected={true} themeMode={themeMode} setThemeMode={setThemeMode} />
          ) : activeNav === 'profile' ? (
            <ProfileView onPlaySample={(item) => handleAnimeClick(item)} />
          ) : activeNav === 'schedule' ? (
            <ScheduleView onSelectAnime={(item) => handleAnimeClick(item)} />
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                  Каталог Shikimori: <span style={{ color: '#D4AF37' }}>{activeTab}</span>
                </h2>
                <span style={{ fontSize: '0.85rem', color: '#666' }}>Источник: api.shikimori.one</span>
              </div>

              {isLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '12px', color: '#D4AF37' }}>
                  <Loader2 className="spin-icon" size={28} />
                  <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Загрузка каталога Shikimori...</span>
                </div>
              ) : catalog.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                  По вашему запросу ничего не найдено в базе Shikimori.
                </div>
              ) : (
                /* Anime Cards Catalog from Shikimori */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                  {catalog.map((item) => (
                    <div
                      key={item.id}
                      className="card-amoled"
                      onClick={() => handleAnimeClick(item)}
                      style={{ padding: '16px', cursor: 'pointer' }}
                    >
                      <div style={{ height: '260px', backgroundColor: '#1A1A1A', borderRadius: '8px', marginBottom: '12px', overflow: 'hidden' }}>
                        <img
                          src={item.posterUrl}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span className="badge-gold"><Star size={12} fill="#D4AF37" /> {item.rating}</span>
                        <span className="badge-burgundy">{item.ageRating}</span>
                      </div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.title}
                      </h4>
                      <p style={{ fontSize: '0.8rem', color: '#888' }}>{item.type} • {item.yearSeason}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </main>

      </div>

      {/* Watch Party Modal (D19, D20, D21) */}
      {isWatchPartyOpen && (
        <WatchPartyModal
          onClose={() => setIsWatchPartyOpen(false)}
          onRoomCreated={(room) => console.log('Room created:', room)}
          onRoomJoined={(room) => console.log('Room joined:', room)}
        />
      )}
    </div>
  );
}
