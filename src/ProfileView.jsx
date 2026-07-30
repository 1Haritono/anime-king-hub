import React, { useState, useEffect } from 'react';
import { User, Star, Clock, Heart, Award, Film, Key, Mail, Lock, CheckCircle, Info, ChevronRight, LogOut } from 'lucide-react';
import { useApp } from './AppContext';
import { getProfileAnalytics, formatRelativeTime } from './watchHistoryService';

export default function ProfileView({ onPlaySample }) {
  const { isLoggedIn, user, loginUser, logoutUser } = useApp();

  const [showManualLoginModal, setShowManualLoginModal] = useState(false);
  const [manualUsername, setManualUsername] = useState('');
  const [manualPassword, setManualPassword] = useState('');
  const [analytics, setAnalytics] = useState(getProfileAnalytics());

  useEffect(() => {
    setAnalytics(getProfileAnalytics());
  }, []);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '187218477596-9u9jddqafjcgcjleal4hj8jjq3de4nfs.apps.googleusercontent.com';

  const handleGoogleLogin = () => {
    const redirectUri = 'http://localhost:4200';
    const scope = 'email profile';
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${encodeURIComponent(googleClientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;

    if (window.require) {
      const { shell } = window.require('electron');
      shell.openExternal(authUrl);
    } else {
      window.open(authUrl, '_blank');
    }
    loginUser('Google_User', 'google');
  };

  const handleManualLoginSubmit = (e) => {
    e.preventDefault();
    if (manualUsername) {
      loginUser(manualUsername, 'manual');
      setShowManualLoginModal(false);
    }
  };

  const { statusCounts, totalEpisodes, totalWatchHours, recentHistory, ratings } = analytics;

  // Donut SVG calculations
  const totalStatusCount = statusCounts.watching + statusCounts.planned + statusCounts.completed + statusCounts.onHold + statusCounts.dropped || 1;
  const pWatching = (statusCounts.watching / totalStatusCount) * 100;
  const pPlanned = (statusCounts.planned / totalStatusCount) * 100;
  const pCompleted = (statusCounts.completed / totalStatusCount) * 100;

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', color: 'var(--text-primary)', paddingBottom: '40px' }}>
      
      {/* Top Header Card */}
      <div className="card-amoled" style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <img
            src={user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
            alt={user.username}
            style={{ width: '76px', height: '76px', borderRadius: '50%', backgroundColor: 'var(--bg-surface)', border: '2px solid #D4AF37' }}
          />
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', color: 'var(--text-primary)' }}>
              {user.username} <Award size={20} color="#D4AF37" />
            </h2>
            <div style={{ fontSize: '0.85rem', color: '#D4AF37', fontWeight: 700, marginBottom: '4px' }}>
              {user.status}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              {isLoggedIn ? '● Онлайн • Сессия сохранена' : 'Локальный профиль пользователя'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {!isLoggedIn ? (
            <>
              <button
                onClick={handleGoogleLogin}
                style={{
                  backgroundColor: '#FFFFFF', color: '#1F1F1F', border: '1px solid #CCCCCC',
                  borderRadius: '8px', padding: '10px 16px', fontWeight: 700, fontSize: '0.85rem',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.26 21.3 7.36 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.17 0 9.98 0 12s.46 3.83 1.26 5.42l4.02-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.7 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                Google OAuth
              </button>

              <button
                onClick={() => setShowManualLoginModal(true)}
                style={{
                  backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)',
                  border: '1px solid var(--border-burgundy)', borderRadius: '8px',
                  padding: '10px 16px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '8px'
                }}
              >
                <Key size={16} color="#D4AF37" /> Логин / Пароль
              </button>
            </>
          ) : (
            <button
              onClick={logoutUser}
              style={{
                backgroundColor: 'rgba(229, 57, 53, 0.15)', color: '#FF5252',
                border: '1px solid rgba(229, 57, 53, 0.4)', borderRadius: '8px',
                padding: '10px 16px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              <LogOut size={16} /> Выйти
            </button>
          )}
        </div>
      </div>

      {/* FEATURE-14: Reference Section — Статистика с Круговой Диаграммой (Donut Chart) */}
      <div className="card-amoled" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Статистика <Info size={18} color="var(--text-muted)" />
          </div>
          <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.88rem', cursor: 'pointer' }}>Показать все</button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px' }}>
          {/* Left Stats Counts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, minWidth: '200px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#4CAF50' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Смотрю</span>
              <span style={{ fontWeight: 800, marginLeft: 'auto' }}>{statusCounts.watching}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#9C27B0' }} />
              <span style={{ color: 'var(--text-secondary)' }}>В планах</span>
              <span style={{ fontWeight: 800, marginLeft: 'auto' }}>{statusCounts.planned}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#5C6BC0' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Просмотрено</span>
              <span style={{ fontWeight: 800, marginLeft: 'auto' }}>{statusCounts.completed}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#FFB300' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Отложено</span>
              <span style={{ fontWeight: 800, marginLeft: 'auto' }}>{statusCounts.onHold}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#E53935' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Брошено</span>
              <span style={{ fontWeight: 800, marginLeft: 'auto' }}>{statusCounts.dropped}</span>
            </div>
          </div>

          {/* Right SVG Donut Chart Matching Screenshot */}
          <div style={{ position: 'relative', width: '140px', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="140" height="140" viewBox="0 0 42 42">
              <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#262626" strokeWidth="6" />
              {/* Completed (Indigo) */}
              <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#5C6BC0" strokeWidth="6"
                strokeDasharray={`${pCompleted} ${100 - pCompleted}`} strokeDashoffset="25" />
              {/* Planned (Purple) */}
              <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#9C27B0" strokeWidth="6"
                strokeDasharray={`${pPlanned} ${100 - pPlanned}`} strokeDashoffset={`${25 - pCompleted}`} />
              {/* Watching (Green) */}
              <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#4CAF50" strokeWidth="6"
                strokeDasharray={`${pWatching} ${100 - pWatching}`} strokeDashoffset={`${25 - pCompleted - pPlanned}`} />
            </svg>
          </div>
        </div>
      </div>

      {/* FEATURE-14: Reference Section — Оценки релизов */}
      <div className="card-amoled" style={{ padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px' }}>Оценки релизов</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {ratings.slice(0, 4).map((r, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <img src={r.posterUrl} alt="" style={{ width: '42px', height: '56px', borderRadius: '6px', objectFit: 'cover' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '4px' }}>{r.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ color: '#D4AF37', letterSpacing: '2px', fontSize: '0.85rem' }}>
                    {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>• {formatRelativeTime(r.timestamp)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURE-14: Reference Section — Динамика просмотра серий (Gistogram) */}
      <div className="card-amoled" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          Динамика просмотра серий <Info size={16} color="var(--text-muted)" />
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '140px', padding: '0 10px', borderBottom: '1px solid var(--border-subtle)' }}>
          {analytics.days ? analytics.days.map((d, idx) => {
            const maxVal = 10;
            const barHeight = Math.max(12, Math.min(110, (d.count / maxVal) * 110));
            return (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>{d.count}</span>
                <div style={{
                  width: '28px', height: `${barHeight}px`,
                  backgroundColor: d.count > 0 ? '#E0E0E0' : '#333333',
                  borderRadius: '12px 12px 4px 4px', transition: 'height 0.3s'
                }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', transform: 'rotate(-45deg)', transformOrigin: 'top center', marginTop: '10px' }}>
                  {d.dateLabel}
                </span>
              </div>
            );
          }) : (
            [
              { label: '23.07', val: 0 }, { label: '24.07', val: 3 }, { label: '25.07', val: 1 },
              { label: '26.07', val: 0 }, { label: '27.07', val: 5 }, { label: '28.07', val: 9 }
            ].map((d, idx) => {
              const barHeight = d.val > 0 ? (d.val / 9) * 100 : 14;
              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1 }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>{d.val}</span>
                  <div style={{ width: '28px', height: `${barHeight}px`, backgroundColor: d.val > 0 ? '#E0E0E0' : '#333333', borderRadius: '12px 12px 4px 4px' }} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>{d.label}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* FEATURE-14: Reference Section — Просмотрено недавно */}
      <div className="card-amoled" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px' }}>Просмотрено недавно</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {recentHistory.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <img src={item.posterUrl} alt="" style={{ width: '46px', height: '62px', borderRadius: '6px', objectFit: 'cover' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '4px' }}>
                  {item.title}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {item.episodeNumber} серия &nbsp;•&nbsp; {formatRelativeTime(item.timestamp)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Manual Login Modal */}
      {showManualLoginModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div className="card-amoled" style={{ maxWidth: '420px', width: '100%', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#D4AF37', fontWeight: 800, fontSize: '1.2rem', marginBottom: '16px' }}>
              <Key size={22} /> Вход по логину и паролю
            </div>
            
            <form onSubmit={handleManualLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Логин или Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    value={manualUsername}
                    onChange={(e) => setManualUsername(e.target.value)}
                    placeholder="Ваш логин..."
                    required
                    style={{
                      width: '100%', padding: '10px 12px 10px 38px', borderRadius: '8px',
                      border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-primary)', fontSize: '0.88rem'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Пароль</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="password"
                    value={manualPassword}
                    onChange={(e) => setManualPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    style={{
                      width: '100%', padding: '10px 12px 10px 38px', borderRadius: '8px',
                      border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-primary)', fontSize: '0.88rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowManualLoginModal(false)}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)', backgroundColor: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="btn-gold"
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Войти
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
