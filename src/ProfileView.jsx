import React, { useState } from 'react';
import { User, Star, Clock, Heart, Award, Film, Download, CheckCircle, Info, Lock, Key, Mail, LogIn } from 'lucide-react';

export default function ProfileView({ onPlaySample }) {
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [showManualLoginModal, setShowManualLoginModal] = useState(false);
  const [manualUsername, setManualUsername] = useState('');
  const [manualPassword, setManualPassword] = useState('');
  const [isLoggedInManual, setIsLoggedInManual] = useState(false);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '187218477596-9u9jddqafjcgcjleal4hj8jjq3de4nfs.apps.googleusercontent.com';

  const handleGoogleLogin = () => {
    if (!googleClientId) {
      setShowGoogleModal(true);
      return;
    }

    // Real OAuth 2.0 Loopback Flow for Desktop Client
    const redirectUri = 'http://localhost:4200';
    const scope = 'email profile';
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${encodeURIComponent(googleClientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;

    if (window.require) {
      const { shell } = window.require('electron');
      shell.openExternal(authUrl);
    } else {
      window.open(authUrl, '_blank');
    }
  };

  const handleManualLoginSubmit = (e) => {
    e.preventDefault();
    if (manualUsername && manualPassword) {
      setIsLoggedInManual(true);
      setShowManualLoginModal(false);
    }
  };

  const userStats = {
    username: isLoggedInManual && manualUsername ? manualUsername : 'AnimeKing_User',
    status: isLoggedInManual ? 'Авторизованный пользователь' : 'Любитель аниме',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=' + (manualUsername || 'KingHub'),
    completedTitles: 118,
    watchedEpisodes: 1420,
    hoursWatched: 568,
    plannedTitles: 24,
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', color: 'var(--text-primary)' }}>
      
      {/* Profile Header */}
      <div className="card-amoled" style={{
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <img
            src={userStats.avatar}
            alt={userStats.username}
            style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--bg-surface)', border: '2px solid #D4AF37' }}
          />
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', color: 'var(--text-primary)' }}>
              {userStats.username} <Award size={20} color="#D4AF37" />
            </h2>
            <div style={{ fontSize: '0.85rem', color: '#D4AF37', fontWeight: 700, marginBottom: '6px' }}>
              {userStats.status}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              {isLoggedInManual ? 'Авторизация по логину и паролю' : 'Локальный профиль пользователя'}
            </div>
          </div>
        </div>

        {/* Login Buttons Options */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={handleGoogleLogin}
            style={{
              backgroundColor: '#FFFFFF',
              color: '#1F1F1F',
              border: '1px solid #CCCCCC',
              borderRadius: '8px',
              padding: '10px 16px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
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
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-burgundy)',
              borderRadius: '8px',
              padding: '10px 16px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Key size={16} color="#D4AF37" />
            Логин / Пароль
          </button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div className="card-amoled" style={{ padding: '16px', textAlign: 'center' }}>
          <Film size={24} color="#D4AF37" style={{ marginBottom: '8px' }} />
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#D4AF37' }}>{userStats.completedTitles}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Просмотрено тайтлов</div>
        </div>

        <div className="card-amoled" style={{ padding: '16px', textAlign: 'center' }}>
          <Clock size={24} color="#5C061C" style={{ marginBottom: '8px' }} />
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)' }}>{userStats.hoursWatched} ч</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Времени за просмотром</div>
        </div>

        <div className="card-amoled" style={{ padding: '16px', textAlign: 'center' }}>
          <Heart size={24} color="#E91E63" style={{ marginBottom: '8px' }} />
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)' }}>{userStats.plannedTitles}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Запланировано</div>
        </div>
      </div>

      {/* Manual Login Modal */}
      {showManualLoginModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
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
                      width: '100%',
                      padding: '10px 12px 10px 38px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem'
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
                      width: '100%',
                      padding: '10px 12px 10px 38px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" className="btn-burgundy" style={{ flex: 1, justifyContent: 'center' }}>
                  <LogIn size={16} /> Войти
                </button>
                <button type="button" onClick={() => setShowManualLoginModal(false)} style={{ padding: '10px 16px', borderRadius: '8px', backgroundColor: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Google OAuth Setup Modal Fallback */}
      {showGoogleModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="card-amoled" style={{ maxWidth: '520px', width: '100%', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#D4AF37', fontWeight: 800, fontSize: '1.15rem', marginBottom: '12px' }}>
              <Lock size={22} /> Авторизация Google
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Перенаправление на страницу авторизации Google...
            </p>
            <button className="btn-burgundy" onClick={() => setShowGoogleModal(false)} style={{ width: '100%', justifyContent: 'center' }}>
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

