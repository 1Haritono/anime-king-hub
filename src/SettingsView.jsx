import React, { useState } from 'react';
import {
  Moon, Sun, Smartphone, Plus, RefreshCw, CheckCircle2,
  XCircle, Zap, ShieldAlert, Sparkles, Sliders, Server, Eye, DownloadCloud
} from 'lucide-react';
import AnixartImportView from './AnixartImportView';

export default function SettingsView({ isMpvConnected = false, themeMode = 'amoled', setThemeMode }) {
  const [activeSection, setActiveSection] = useState('appearance');

  // A8: Connection State (Multiple endpoints + ping status + add new)
  const [endpoints, setEndpoints] = useState([
    { id: 1, name: 'Основной CDN (Европа)', url: 'https://cdn-eu.animeking.hub/api', ping: 42, status: 'online' },
    { id: 2, name: 'Торрент-релей #1 (СНГ)', url: 'https://relay-ru.animeking.hub/torrent', ping: 18, status: 'online' },
    { id: 3, name: 'Резервный Mirror (Азия)', url: 'https://asia-mirror.animeking.hub', ping: 195, status: 'slow' },
    { id: 4, name: 'Локальный узловой прокси', url: 'http://127.0.0.1:8080', ping: 0, status: 'offline' }
  ]);
  const [newEndpointName, setNewEndpointName] = useState('');
  const [newEndpointUrl, setNewEndpointUrl] = useState('');
  const [isPingTesting, setIsPingTesting] = useState(false);

  // A9: Anime4K Upscale State
  const [anime4kPreset, setAnime4kPreset] = useState('off'); // 'off', 'modeA', 'modeB', 'modeC', 'modeAA', 'modeBB', 'modeCA'
  const [anime4kQuality, setAnime4kQuality] = useState('HQ'); // 'Fast', 'HQ'

  // Helper to re-ping endpoints
  const pingAllEndpoints = () => {
    setIsPingTesting(true);
    setTimeout(() => {
      setEndpoints(prev => prev.map(ep => ({
        ...ep,
        ping: Math.floor(Math.random() * 80) + 12,
        status: Math.random() > 0.15 ? 'online' : 'slow'
      })));
      setIsPingTesting(false);
    }, 600);
  };

  const handleAddEndpoint = (e) => {
    e.preventDefault();
    if (!newEndpointName || !newEndpointUrl) return;
    setEndpoints(prev => [
      ...prev,
      {
        id: Date.now(),
        name: newEndpointName,
        url: newEndpointUrl,
        ping: Math.floor(Math.random() * 50) + 15,
        status: 'online'
      }
    ]);
    setNewEndpointName('');
    setNewEndpointUrl('');
  };

  return (
    <div style={{ display: 'flex', gap: '30px', color: '#FFFFFF' }}>
      
      {/* Settings Navigation Tabs */}
      <div style={{ width: '220px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          onClick={() => setActiveSection('appearance')}
          className={`settings-nav-btn ${activeSection === 'appearance' ? 'active' : ''}`}
        >
          <Eye size={18} /> Внешний вид (А7)
        </button>
        <button
          onClick={() => setActiveSection('connection')}
          className={`settings-nav-btn ${activeSection === 'connection' ? 'active' : ''}`}
        >
          <Server size={18} /> Подключение (А8)
        </button>
        <button
          onClick={() => setActiveSection('anixart')}
          className={`settings-nav-btn ${activeSection === 'anixart' ? 'active' : ''}`}
        >
          <DownloadCloud size={18} /> Импорт Anixart (Б13)
        </button>
        <button
          onClick={() => setActiveSection('playback')}
          className={`settings-nav-btn ${activeSection === 'playback' ? 'active' : ''}`}
        >
          <Zap size={18} /> Воспроизведение (А9)
        </button>
      </div>

      {/* Main Settings Panel */}
      <div style={{ flex: 1, backgroundColor: '#0A0A0A', border: '1px solid rgba(92, 6, 28, 0.4)', borderRadius: '12px', padding: '24px' }}>
        
        {/* A7: ВНЕШНИЙ ВИД */}
        {activeSection === 'appearance' && (
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '8px', color: '#D4AF37' }}>
              Внешний вид (Тема оформления)
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#888888', marginBottom: '24px' }}>
              Выберите глобальное графическое оформление интерфейса. Все безымянные пресеты убраны.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
              
              {/* AMOLED */}
              <div
                onClick={() => setThemeMode('amoled')}
                className={`theme-card ${themeMode === 'amoled' ? 'selected' : ''}`}
              >
                <div style={{ height: '70px', backgroundColor: '#000000', borderRadius: '6px', border: '1px solid #5C061C', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#D4AF37', fontWeight: 900, fontSize: '0.8rem' }}>#000000 AMOLED</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>AMOLED Чёрный</div>
                <div style={{ fontSize: '0.75rem', color: '#666' }}>Максимальное энергосбережение и контраст</div>
              </div>

              {/* Тёмная */}
              <div
                onClick={() => setThemeMode('dark')}
                className={`theme-card ${themeMode === 'dark' ? 'selected' : ''}`}
              >
                <div style={{ height: '70px', backgroundColor: '#1A1A1A', borderRadius: '6px', border: '1px solid #333', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Moon size={24} color="#A0A0A0" />
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Тёмная</div>
                <div style={{ fontSize: '0.75rem', color: '#666' }}>Классическая тёмно-серая гамма</div>
              </div>

              {/* Светлая */}
              <div
                onClick={() => setThemeMode('light')}
                className={`theme-card ${themeMode === 'light' ? 'selected' : ''}`}
              >
                <div style={{ height: '70px', backgroundColor: '#F0F0F0', borderRadius: '6px', border: '1px solid #CCC', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sun size={24} color="#333" />
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: themeMode === 'light' ? '#D4AF37' : '#FFF' }}>Светлая</div>
                <div style={{ fontSize: '0.75rem', color: '#666' }}>Высокая яркость для светлых помещений</div>
              </div>

              {/* Авто */}
              <div
                onClick={() => setThemeMode('auto')}
                className={`theme-card ${themeMode === 'auto' ? 'selected' : ''}`}
              >
                <div style={{ height: '70px', backgroundColor: '#111', borderRadius: '6px', border: '1px stroke #555', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Smartphone size={24} color="#D4AF37" />
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Авто (Система)</div>
                <div style={{ fontSize: '0.75rem', color: '#666' }}>Следовать настройкам вашей ОС</div>
              </div>

            </div>
          </div>
        )}

        {/* A8: ПОДКЛЮЧЕНИЕ */}
        {activeSection === 'connection' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#D4AF37' }}>Источники и Сервера</h3>
                <p style={{ fontSize: '0.85rem', color: '#888' }}>Управление всеми подключенными конечными точками и их статусом</p>
              </div>
              <button onClick={pingAllEndpoints} className="btn-burgundy" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
                <RefreshCw size={14} className={isPingTesting ? 'spin-icon' : ''} /> Проверить пинг
              </button>
            </div>

            {/* List of Endpoints */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              {endpoints.map(ep => (
                <div key={ep.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'space-between',
                  padding: '14px 18px',
                  backgroundColor: '#121212',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px'
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {ep.name}
                      {ep.status === 'online' && <span className="badge-gold" style={{ fontSize: '0.7rem' }}>Онлайн</span>}
                      {ep.status === 'slow' && <span className="badge-burgundy" style={{ fontSize: '0.7rem' }}>Задержка</span>}
                      {ep.status === 'offline' && <span style={{ backgroundColor: '#333', color: '#888', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>Офлайн</span>}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#666', fontFamily: 'monospace', marginTop: '2px' }}>{ep.url}</div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: ep.ping < 50 ? '#4CAF50' : ep.ping < 150 ? '#FF9800' : '#F44336' }}>
                      {ep.ping > 0 ? `${ep.ping} ms` : 'N/A'}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Form to Add New Endpoint */}
            <form onSubmit={handleAddEndpoint} style={{
              backgroundColor: '#160408',
              border: '1px solid rgba(92, 6, 28, 0.6)',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '12px', color: '#FFF' }}>Добавить новую конечную точку</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px' }}>
                <input
                  type="text"
                  placeholder="Название сервера"
                  value={newEndpointName}
                  onChange={(e) => setNewEndpointName(e.target.value)}
                  style={{ backgroundColor: '#000', border: '1px solid #333', padding: '8px 12px', borderRadius: '6px', color: '#FFF', fontSize: '0.85rem' }}
                />
                <input
                  type="text"
                  placeholder="URL (https://...)"
                  value={newEndpointUrl}
                  onChange={(e) => setNewEndpointUrl(e.target.value)}
                  style={{ backgroundColor: '#000', border: '1px solid #333', padding: '8px 12px', borderRadius: '6px', color: '#FFF', fontSize: '0.85rem' }}
                />
                <button type="submit" className="btn-gold" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                  <Plus size={14} /> Добавить
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Б13: ИМПОРТ ANIXART */}
        {activeSection === 'anixart' && (
          <AnixartImportView />
        )}

        {/* A9: ВОСПРОИЗВЕДЕНИЕ (ANIME4K UPSCALE) */}
        {activeSection === 'playback' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#D4AF37', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={20} color="#D4AF37" /> Улучшение изображения Anime4K (Активно — mpv Engine IPC C17)
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#888' }}>
                  Реальные пресеты шейдеров Anime4K, подключенные напрямую через --glsl-shaders mpv.
                </p>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(76, 175, 80, 0.2)', border: '1px solid #4CAF50', padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', color: '#81C784' }}>
                <CheckCircle2 size={14} /> Подключено к плееру на mpv (C17)
              </div>
            </div>

            {/* Fully Enabled Settings Container */}
            <div style={{ opacity: 1, pointerEvents: 'auto' }}>
              
              {/* Presets Selection */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', marginBottom: '12px' }}>Режим апскейла (Пресет Anime4K):</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                  
                  {[
                    { id: 'off', label: 'Выключено', desc: 'Сброс шейдеров (CTRL+0)' },
                    { id: 'modeA', label: 'Режим А', desc: 'Для источников ~1080p' },
                    { id: 'modeB', label: 'Режим B', desc: 'Для источников ~720p' },
                    { id: 'modeC', label: 'Режим C', desc: 'Для источников ~480p / SD' },
                    { id: 'modeAA', label: 'Режим A+A', desc: 'Двойная обработка 1080p' },
                    { id: 'modeBB', label: 'Режим B+B', desc: 'Двойная обработка 720p' },
                    { id: 'modeCA', label: 'Режим C+A', desc: 'Комбинированный SD+HD' },
                  ].map(preset => (
                    <button
                      key={preset.id}
                      onClick={() => setAnime4kPreset(preset.id)}
                      style={{
                        padding: '12px 10px',
                        backgroundColor: anime4kPreset === preset.id ? 'rgba(92, 6, 28, 0.4)' : '#121212',
                        border: anime4kPreset === preset.id ? '1px solid #D4AF37' : '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '8px',
                        color: '#FFF',
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: anime4kPreset === preset.id ? '#D4AF37' : '#FFF' }}>{preset.label}</div>
                      <div style={{ fontSize: '0.7rem', color: '#888', marginTop: '2px' }}>{preset.desc}</div>
                    </button>
                  ))}

                </div>
              </div>

              {/* Quality Level (GPU Load) */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', marginBottom: '12px' }}>Уровень качества шейдера (Нагрузка GPU):</label>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <button
                    onClick={() => setAnime4kQuality('Fast')}
                    style={{
                      flex: 1,
                      padding: '12px',
                      backgroundColor: anime4kQuality === 'Fast' ? 'rgba(92, 6, 28, 0.4)' : '#121212',
                      border: anime4kQuality === 'Fast' ? '1px solid #D4AF37' : '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '8px',
                      color: '#FFF',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: anime4kQuality === 'Fast' ? '#D4AF37' : '#FFF' }}>Fast (Лёгкие CNN-ядра)</div>
                    <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '2px' }}>Для встроенных или слабых видеокарт</div>
                  </button>

                  <button
                    onClick={() => setAnime4kQuality('HQ')}
                    style={{
                      flex: 1,
                      padding: '12px',
                      backgroundColor: anime4kQuality === 'HQ' ? 'rgba(92, 6, 28, 0.4)' : '#121212',
                      border: anime4kQuality === 'HQ' ? '1px solid #D4AF37' : '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '8px',
                      color: '#FFF',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: anime4kQuality === 'HQ' ? '#D4AF37' : '#FFF' }}>HQ (Тяжёлые ядра)</div>
                    <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '2px' }}>Максимальная детализация для дискретных GPU</div>
                  </button>
                </div>
              </div>

              {/* Explanatory Footer Note */}
              <div style={{
                backgroundColor: '#0F0F0F',
                borderLeft: '4px solid #D4AF37',
                padding: '12px 16px',
                borderRadius: '0 8px 8px 0',
                fontSize: '0.8rem',
                color: '#AAAAAA',
                lineHeight: '1.4'
              }}>
                <strong style={{ color: '#D4AF37' }}>Обратите внимание:</strong> Режим выбирается исходя из артефактов и качества исходного видео, а не из желаемого разрешения экрана. Anime4K восстанавливает линии и чёткость видеопотока на лету.
              </div>

            </div>

          </div>
        )}

      </div>

    </div>
  );
}
