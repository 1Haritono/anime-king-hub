import React, { useState } from 'react';
import {
  Moon, Sun, Smartphone, Plus, RefreshCw, CheckCircle2,
  XCircle, Zap, ShieldAlert, Sparkles, Sliders, Server, Eye, DownloadCloud, Lock
} from 'lucide-react';
import AnixartImportView from './AnixartImportView';

export default function SettingsView({ isMpvConnected = false, themeMode = 'amoled', setThemeMode }) {
  const [activeSection, setActiveSection] = useState('appearance');

  const [endpoints, setEndpoints] = useState([
    { id: 1, name: 'Основной CDN (Европа)', url: 'https://cdn-eu.animeking.hub/api', ping: 42, status: 'online' },
    { id: 2, name: 'Торрент-релей #1 (СНГ)', url: 'https://relay-ru.animeking.hub/torrent', ping: 18, status: 'online' },
    { id: 3, name: 'Резервный Mirror (Азия)', url: 'https://asia-mirror.animeking.hub', ping: 195, status: 'slow' }
  ]);

  return (
    <div style={{ display: 'flex', gap: '24px', color: 'var(--text-primary)' }}>
      
      {/* Settings Navigation */}
      <div style={{ width: '220px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button onClick={() => setActiveSection('appearance')} className={`app-sidebar-nav-btn ${activeSection === 'appearance' ? 'active' : ''}`}>
          <Eye size={18} /> Внешний вид
        </button>
        <button onClick={() => setActiveSection('connection')} className={`app-sidebar-nav-btn ${activeSection === 'connection' ? 'active' : ''}`}>
          <Server size={18} /> Подключение
        </button>
        <button onClick={() => setActiveSection('anixart')} className={`app-sidebar-nav-btn ${activeSection === 'anixart' ? 'active' : ''}`}>
          <DownloadCloud size={18} /> Импорт списков
        </button>
      </div>

      {/* Main Settings Panel — BUG-2: Uses settings-panel class */}
      <div className="settings-panel" style={{ flex: 1, borderRadius: '12px', padding: '24px' }}>
        
        {/* BUG-2: Theme Selection */}
        {activeSection === 'appearance' && (
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '8px', color: '#D4AF37' }}>
              Внешний вид (Тема оформления)
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Выберите цветовое оформление интерфейса. Изменения применяются мгновенно ко всем элементам.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
              
              {/* AMOLED */}
              <div onClick={() => setThemeMode('amoled')} className={`theme-card ${themeMode === 'amoled' ? 'selected' : ''}`}>
                <div style={{ height: '60px', backgroundColor: '#000000', borderRadius: '6px', border: '1px solid #5C061C', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#D4AF37', fontWeight: 900, fontSize: '0.8rem' }}>#000000 AMOLED</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>AMOLED Чёрный</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Максимальный контраст</div>
              </div>

              {/* Тёмная */}
              <div onClick={() => setThemeMode('dark')} className={`theme-card ${themeMode === 'dark' ? 'selected' : ''}`}>
                <div style={{ height: '60px', backgroundColor: '#1A1A1A', borderRadius: '6px', border: '1px solid #333', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Moon size={22} color="#A0A0A0" />
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Тёмная</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Классическая тёмная гамма</div>
              </div>

              {/* Светлая */}
              <div onClick={() => setThemeMode('light')} className={`theme-card ${themeMode === 'light' ? 'selected' : ''}`}>
                <div style={{ height: '60px', backgroundColor: '#F0F0F0', borderRadius: '6px', border: '1px solid #CCC', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sun size={22} color="#333" />
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Светлая</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Светлый режим высокого контраста</div>
              </div>

              {/* Авто */}
              <div onClick={() => setThemeMode('auto')} className={`theme-card ${themeMode === 'auto' ? 'selected' : ''}`}>
                <div style={{ height: '60px', backgroundColor: '#333', borderRadius: '6px', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Smartphone size={22} color="#D4AF37" />
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Авто (Система)</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Следовать теме вашей ОС</div>
              </div>

            </div>
          </div>
        )}

        {/* CONNECTION */}
        {activeSection === 'connection' && (
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#D4AF37', marginBottom: '8px' }}>Источники и Сервера</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>Управление подключенными точками видеопотоков</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {endpoints.map(ep => (
                <div key={ep.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{ep.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{ep.url}</div>
                  </div>
                  <span className="badge-gold">{ep.ping} ms</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ANIXART */}
        {activeSection === 'anixart' && <AnixartImportView />}
      </div>
    </div>
  );
}
