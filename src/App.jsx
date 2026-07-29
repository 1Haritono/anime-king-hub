import React, { useState, useEffect } from 'react';
import {
  Home, Compass, Flame, BookOpen, Bookmark, Download,
  Search, Users, Calendar, Bell, Settings, User,
  Minus, Square, X, Crown, Star, DownloadCloud, ExternalLink, Loader2,
  TrendingUp, Award, Tv, CheckCircle, Clock, Heart, Package
} from 'lucide-react';
import SettingsView from './SettingsView';
import AnimeDetailView from './AnimeDetailView';
import PlayerView from './PlayerView';
import WatchPartyModal from './WatchPartyModal';
import ProfileView from './ProfileView';
import ScheduleView from './ScheduleView';
import { MpvPlayerBridge } from './mpvBridge';
import { fetchShikimoriAnimeList, fetchShikimoriAnimeDetails } from './shikimoriApi';

function AnimeGrid({ catalog, onAnimeClick, rankBadge = false }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
      {catalog.map((item, idx) => (
        <div key={item.id} className="card-amoled" onClick={() => onAnimeClick(item)}
          style={{ padding: '14px', cursor: 'pointer', position: 'relative' }}>
          {rankBadge && (
            <div style={{ position: 'absolute', top: '22px', left: '22px', zIndex: 2, width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#D4AF37', color: '#000', fontWeight: 900, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>#{idx+1}</div>
          )}
          <div style={{ height: '240px', borderRadius: '8px', marginBottom: '10px', overflow: 'hidden', backgroundColor: 'var(--bg-surface)' }}>
            <img src={item.posterUrl} alt={item.title}
              onError={e => {
                if (!e.target.dataset.fallback) {
                  e.target.dataset.fallback = '1';
                  e.target.src = 'https://images.weserv.nl/?url=shikimori.one/system/animes/original/5114.jpg';
                }
              }}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span className="badge-gold" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>★ {item.rating}</span>
            <span className="badge-burgundy">{item.ageRating}</span>
          </div>
          <h4 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>{item.title}</h4>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.type} • {item.yearSeason}</p>
        </div>
      ))}
    </div>
  );
}

// BUG-5: Distinct, visually bold Discover View
function DiscoverView({ onAnimeClick }) {
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchShikimoriAnimeList({ order: 'ranked', limit: 12 }).then(d => { setCatalog(d); setLoading(false); });
  }, []);
  return (
    <div>
      {/* Distinct Hero Banner */}
      <div style={{ backgroundColor: 'rgba(212, 175, 55, 0.1)', border: '1px solid var(--border-gold)', borderRadius: '12px', padding: '20px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#D4AF37', fontWeight: 800, fontSize: '1.25rem', marginBottom: '4px' }}>
            <Award size={24} /> 🏆 Раздел Открытия — Топ по рейтингу
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Лучшие аниме-произведения по оценкам тысяч зрителей</p>
        </div>
        <span className="badge-gold" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>Top Ranked 2024</span>
      </div>
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', gap: '12px', color: '#D4AF37' }}>
          <Loader2 className="spin-icon" size={28} /><span>Загрузка лучших тайтлов...</span>
        </div>
      ) : <AnimeGrid catalog={catalog} onAnimeClick={onAnimeClick} />}
    </div>
  );
}

// BUG-5: Distinct Popular View
function PopularView({ onAnimeClick }) {
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchShikimoriAnimeList({ order: 'popularity', limit: 12 })
      .then(d => { setCatalog(d || []); setLoading(false); })
      .catch(err => { console.warn(err); setLoading(false); });
  }, []);
  return (
    <div>
      {/* Distinct Hero Banner */}
      <div style={{ backgroundColor: 'rgba(92, 6, 28, 0.25)', border: '1px solid var(--border-burgundy)', borderRadius: '12px', padding: '20px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FF85A2', fontWeight: 800, fontSize: '1.25rem', marginBottom: '4px' }}>
            <Flame size={24} color="#FF85A2" /> 🔥 Раздел Популярное — Хит-парад просмотров
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Самые обсуждаемые и просматриваемые аниме прямо сейчас</p>
        </div>
        <span className="badge-burgundy" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>Trending Now</span>
      </div>
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', gap: '12px', color: '#D4AF37' }}>
          <Loader2 className="spin-icon" size={28} /><span>Загрузка популярного...</span>
        </div>
      ) : <AnimeGrid catalog={catalog} onAnimeClick={onAnimeClick} rankBadge={true} />}
    </div>
  );
}

// BUG-5: Distinct Collections View
function CollectionsView({ onAnimeClick }) {
  const categories = [
    { id: 'watching', title: '▶ Смотрю сейчас', color: '#4CAF50', desc: 'Аниме в процессе просмотра' },
    { id: 'completed', title: '✓ Просмотрено', color: '#D4AF37', desc: 'Полностью просмотренные тайтлы' },
    { id: 'planned', title: '⏳ В планах', color: '#2196F3', desc: 'Отложенные на будущее' },
    { id: 'dropped', title: '✕ Брошено', color: '#F44336', desc: 'Прекращенный просмотр' }
  ];

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>📚 Персональные коллекционные списки</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Распределяйте аниме по категориям прямо с карточки просмотра</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        {categories.map(cat => {
          const saved = JSON.parse(localStorage.getItem(`collection_${cat.id}`) || '[]');
          return (
            <div key={cat.id} className="card-amoled" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontWeight: 800, color: cat.color, fontSize: '1.05rem' }}>{cat.title}</span>
                <span style={{ backgroundColor: `${cat.color}22`, color: cat.color, padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                  {saved.length} тайтлов
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '14px' }}>{cat.desc}</p>

              {saved.length === 0 ? (
                <div style={{ padding: '20px 0', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', border: '1px dashed var(--border-subtle)', borderRadius: '8px' }}>
                  В этой коллекции пока ничего нет
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {saved.slice(0, 4).map(item => (
                    <div key={item.id} onClick={() => onAnimeClick(item)} style={{ padding: '6px 10px', borderRadius: '6px', backgroundColor: 'var(--bg-surface)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.title}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// BUG-5: Distinct Bookmarks View
function BookmarksView({ onAnimeClick }) {
  const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
  return (
    <div>
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>🔖 Закладки и избранное</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Ваши сохраненные тайтлы для быстрого доступа</p>
        </div>
        <span className="badge-gold">{bookmarks.length} сохранено</span>
      </div>

      {bookmarks.length === 0 ? (
        <div className="card-amoled" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <Bookmark size={48} color="#D4AF37" style={{ marginBottom: '16px' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>У вас пока нет закладок</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Нажмите «Добавить в закладки» на странице аниме, чтобы добавить его сюда</p>
        </div>
      ) : <AnimeGrid catalog={bookmarks} onAnimeClick={onAnimeClick} />}
    </div>
  );
}

// BUG-5: Distinct Downloads View
function DownloadsView() {
  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>📥 Менеджер локальных загрузок</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Автономное скачивание эпизодов (интеграция mpv + yt-dlp)</p>
      </div>

      <div className="card-amoled" style={{ padding: '40px 20px', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
        <Download size={44} color="#5C061C" style={{ marginBottom: '14px' }} />
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>Загрузки не выполняются</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>Все выкачанные серии сохраняются в папку `Downloads/AnimeKingHub`</p>
        <button className="btn-burgundy" style={{ margin: '0 auto', fontSize: '0.85rem' }}>Проверить статус кеша MPV</button>
      </div>
    </div>
  );
}

export default function App() {
  // BUG-2: Real Theme state synchronization
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('animeking_theme') || 'amoled');

  useEffect(() => {
    localStorage.setItem('animeking_theme', themeMode);
    let effective = themeMode;
    if (themeMode === 'auto') {
      effective = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', effective);
    document.body.setAttribute('data-theme', effective);
  }, [themeMode]);

  const [activeNav, setActiveNav] = useState('home');
  const [activeTab, setActiveTab] = useState('Аниме');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAnime, setSelectedAnime] = useState(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [isWatchPartyOpen, setIsWatchPartyOpen] = useState(false);
  const [mpvBridgeInstance] = useState(() => new MpvPlayerBridge());

  const [catalog, setCatalog] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // BUG-6: Honest GitHub API update check
  const CURRENT_APP_VERSION = 'v1.3.0';
  const [hasUpdate, setHasUpdate] = useState(false);
  const [latestReleaseUrl, setLatestReleaseUrl] = useState('');

  useEffect(() => {
    fetch('https://api.github.com/repos/1Haritono/anime-king-hub/releases/latest', {
      headers: { Accept: 'application/vnd.github.v3+json' }
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && data.tag_name && data.tag_name !== CURRENT_APP_VERSION) {
          setHasUpdate(true);
          setLatestReleaseUrl(data.html_url);
        }
      })
      .catch(e => console.warn('Update check:', e.message));
  }, []);

  // Home catalog loader
  useEffect(() => {
    if (activeNav !== 'home') return;
    let isMounted = true;
    setIsLoading(true);
    let order = 'popularity', kind = '';
    if (activeTab === 'Фильмы') kind = 'movie';
    if (activeTab === 'OVA') kind = 'ova';
    if (activeTab === 'Текущие') order = 'status_ongoing';
    if (activeTab === 'Анонсированные') order = 'status_anons';
    if (activeTab === 'Завершённые') order = 'status_released';

    const t = setTimeout(() => {
      fetchShikimoriAnimeList({ order, kind, search: searchQuery, limit: 16 }).then(d => {
        if (isMounted) { setCatalog(d); setIsLoading(false); }
      });
    }, 300);
    return () => { isMounted = false; clearTimeout(t); };
  }, [activeTab, searchQuery, activeNav]);

  const navItems = [
    { id: 'home', label: 'Главная', icon: Home },
    { id: 'discover', label: 'Открытия', icon: Compass },
    { id: 'popular', label: 'Популярное', icon: Flame },
    { id: 'collections', label: 'Коллекции', icon: BookOpen },
    { id: 'bookmarks', label: 'Закладки', icon: Bookmark },
    { id: 'downloads', label: 'Загрузки', icon: Download },
  ];

  const topTabs = ['Аниме', 'Анонсированные', 'Текущие', 'Фильмы', 'OVA', 'Дунхуа', 'Завершённые'];

  // BUG-1: Immediate details page navigation
  const handleAnimeClick = async (item) => {
    setSelectedAnime(item);
    try {
      const details = await fetchShikimoriAnimeDetails(item.id);
      if (details) setSelectedAnime(details);
    } catch (e) { console.warn('Detail fetch:', e.message); }
  };

  const navigateTo = (navId) => {
    setSelectedAnime(null);
    setIsPlayerOpen(false);
    setActiveNav(navId);
  };

  const renderContent = () => {
    if (isPlayerOpen) return <PlayerView anime={selectedAnime} onBack={() => setIsPlayerOpen(false)} mpvBridge={mpvBridgeInstance} anime4kSettings={{ preset: 'modeA', quality: 'HQ' }} />;
    if (selectedAnime) return <AnimeDetailView anime={selectedAnime} onBack={() => setSelectedAnime(null)} onPlay={() => setIsPlayerOpen(true)} />;
    if (activeNav === 'settings') return <SettingsView isMpvConnected={true} themeMode={themeMode} setThemeMode={setThemeMode} />;
    if (activeNav === 'profile') return <ProfileView onPlaySample={handleAnimeClick} />;
    if (activeNav === 'schedule') return <ScheduleView onSelectAnime={handleAnimeClick} />;
    
    // BUG-5: Distinct sidebar view routing
    if (activeNav === 'discover') return <DiscoverView onAnimeClick={handleAnimeClick} />;
    if (activeNav === 'popular') return <PopularView onAnimeClick={handleAnimeClick} />;
    if (activeNav === 'collections') return <CollectionsView onAnimeClick={handleAnimeClick} />;
    if (activeNav === 'bookmarks') return <BookmarksView onAnimeClick={handleAnimeClick} />;
    if (activeNav === 'downloads') return <DownloadsView />;

    // Default Home View
    return (
      <>
        {/* BUG-8: Generic user-facing titles */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Каталог аниме: <span style={{ color: '#D4AF37' }}>{activeTab}</span>
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Единый онлайн-каталог</span>
        </div>
        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '12px', color: '#D4AF37' }}>
            <Loader2 className="spin-icon" size={28} />
            <span style={{ fontWeight: 600 }}>Загрузка каталога аниме...</span>
          </div>
        ) : catalog.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>По вашему запросу ничего не найдено.</div>
        ) : <AnimeGrid catalog={catalog} onAnimeClick={handleAnimeClick} />}
      </>
    );
  };

  return (
    <div className="app-root" style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>

      {/* BUG-2: Themed Sidebar, BUG-7: Correct logo ordering "Anime ♛ Hub" */}
      <aside className="app-sidebar" style={{ width: '240px', display: 'flex', flexDirection: 'column', paddingTop: '16px', flexShrink: 0 }}>
        
        {/* BUG-7 Logo Order */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 20px 24px 20px' }}>
          <img src="/icon.svg" alt="" style={{ width: '38px', height: '38px' }} onError={e => e.target.style.display='none'} />
          <div>
            <h1 style={{ fontSize: '1.05rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '4px', lineHeight: 1.2, color: 'var(--text-primary)' }}>
              Anime&nbsp;<Crown size={15} color="#D4AF37" fill="#D4AF37" />&nbsp;Hub
            </h1>
            <span style={{ fontSize: '0.62rem', color: '#D4AF37', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase' }}>Edition {CURRENT_APP_VERSION}</span>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeNav === item.id && !selectedAnime && !isPlayerOpen;
            return (
              <button key={item.id} className={'app-sidebar-nav-btn' + (isActive ? ' active' : '')} onClick={() => navigateTo(item.id)}>
                <Icon size={20} color={isActive ? '#D4AF37' : undefined} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* BUG-2: Themed Main Workspace */}
      <div className="app-root" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header Bar */}
        <header className="app-header" style={{ height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', userSelect: 'none' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Anime King Hub — Desktop Application</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {hasUpdate && latestReleaseUrl && (
              <a href={latestReleaseUrl} target="_blank" rel="noreferrer" className="update-btn-toolbar">
                <DownloadCloud size={12} /> Обновить <ExternalLink size={10} />
              </a>
            )}
            <button className="icon-btn" onClick={() => setIsWatchPartyOpen(true)} title="Watch Party"><Users size={16} color={isWatchPartyOpen ? '#D4AF37' : 'var(--text-secondary)'} /></button>
            <button className="icon-btn" onClick={() => navigateTo('schedule')} title="Расписание"><Calendar size={16} color={activeNav === 'schedule' && !selectedAnime ? '#D4AF37' : 'var(--text-secondary)'} /></button>
            <button className="icon-btn" title="Уведомления"><Bell size={16} color="var(--text-secondary)" /></button>
            <button className="icon-btn" onClick={() => navigateTo('profile')} title="Профиль"><User size={16} color={activeNav === 'profile' && !selectedAnime ? '#D4AF37' : 'var(--text-secondary)'} /></button>
            <button className="icon-btn" onClick={() => navigateTo('settings')} title="Настройки"><Settings size={16} color={activeNav === 'settings' && !selectedAnime ? '#D4AF37' : 'var(--text-secondary)'} /></button>
            <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--border-subtle)' }} />
            <button className="win-ctrl-btn"><Minus size={14} color="var(--text-secondary)" /></button>
            <button className="win-ctrl-btn"><Square size={12} color="var(--text-secondary)" /></button>
            <button className="win-ctrl-btn close-btn"><X size={14} color="var(--text-secondary)" /></button>
          </div>
        </header>

        {/* BUG-8: Generic Search Bar "Поиск аниме..." */}
        {!selectedAnime && !isPlayerOpen && activeNav === 'home' && (
          <div style={{ padding: '20px 24px 0 24px', backgroundColor: 'var(--bg-amoled)' }}>
            <div style={{ position: 'relative', maxWidth: '540px', marginBottom: '20px' }}>
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Поиск аниме..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  borderRadius: '8px',
                  padding: '10px 14px 10px 42px',
                  fontSize: '0.9rem',
                  outline: 'none',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-burgundy)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid var(--border-subtle)', overflowX: 'auto', scrollbarWidth: 'none' }}>
              {topTabs.map(tab => {
                const isActive = activeTab === tab;
                return (
                  <button key={tab} onClick={() => setActiveTab(tab)} style={{
                    padding: '10px 0', background: 'transparent',
                    color: isActive ? '#D4AF37' : 'var(--text-secondary)',
                    border: 'none', borderBottom: isActive ? '3px solid #5C061C' : '3px solid transparent',
                    fontSize: '0.92rem', fontWeight: isActive ? '700' : '500',
                    cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s'
                  }}>{tab}</button>
                );
              })}
            </div>
          </div>
        )}

        <main className="app-main" style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          {renderContent()}
        </main>
      </div>

      {isWatchPartyOpen && (
        <WatchPartyModal onClose={() => setIsWatchPartyOpen(false)}
          onRoomCreated={r => console.log('Room created:', r)}
          onRoomJoined={r => console.log('Room joined:', r)} />
      )}
    </div>
  );
}
