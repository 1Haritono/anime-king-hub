import React from 'react';
import { User, Star, Clock, Heart, Award, Film, Download, CheckCircle, ShieldCheck, Play } from 'lucide-react';

export default function ProfileView({ onPlaySample }) {
  const userStats = {
    username: 'AnixartUser_Pro',
    status: 'VIP Аниме-ценитель',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=KingHub',
    watchedEpisodes: 1420,
    completedTitles: 118,
    plannedTitles: 24,
    hoursWatched: 568,
    syncStatus: 'Синхронизировано с Anixart API'
  };

  const history = [
    { id: 1, title: 'Атака титанов: Финал', ep: 'Сезон 4, Серия 16', time: 'Сегодня, 13:40', poster: 'https://shikimori.one/system/animes/original/40028.jpg' },
    { id: 2, title: 'Магическая битва 2', ep: 'Серия 12', time: 'Вчера, 21:15', poster: 'https://shikimori.one/system/animes/original/51009.jpg' },
    { id: 3, title: 'Человек-бензопила', ep: 'Серия 12', time: '25 июля, 18:30', poster: 'https://shikimori.one/system/animes/original/44511.jpg' }
  ];

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', color: '#FFF' }}>
      
      {/* Profile Header */}
      <div style={{
        backgroundColor: '#0A0A0A',
        border: '1px solid #5C061C',
        borderRadius: '12px',
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        boxShadow: '0 8px 32px rgba(92, 6, 28, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <img
            src={userStats.avatar}
            alt={userStats.username}
            style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#1A1A1A', border: '2px solid #D4AF37' }}
          />
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FFF', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              {userStats.username} <Award size={20} color="#D4AF37" />
            </h2>
            <div style={{ fontSize: '0.85rem', color: '#D4AF37', fontWeight: 700, marginBottom: '6px' }}>
              {userStats.status}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#4CAF50', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle size={14} /> {userStats.syncStatus}
            </div>
          </div>
        </div>

        <button className="btn-burgundy" style={{ padding: '10px 18px', fontSize: '0.85rem' }}>
          Редактировать профиль
        </button>
      </div>

      {/* Stats Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div style={{ backgroundColor: '#0D0D0D', border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
          <Film size={24} color="#D4AF37" style={{ marginBottom: '8px' }} />
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#D4AF37' }}>{userStats.completedTitles}</div>
          <div style={{ fontSize: '0.8rem', color: '#AAA' }}>Просмотренных тайтлов</div>
        </div>

        <div style={{ backgroundColor: '#0D0D0D', border: '1px solid rgba(92, 6, 28, 0.5)', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
          <Play size={24} color="#5C061C" style={{ marginBottom: '8px' }} />
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#FFF' }}>{userStats.watchedEpisodes}</div>
          <div style={{ fontSize: '0.8rem', color: '#AAA' }}>Просмотрено серий</div>
        </div>

        <div style={{ backgroundColor: '#0D0D0D', border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
          <Clock size={24} color="#D4AF37" style={{ marginBottom: '8px' }} />
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#D4AF37' }}>{userStats.hoursWatched} ч</div>
          <div style={{ fontSize: '0.8rem', color: '#AAA' }}>Времени за просмотром</div>
        </div>

        <div style={{ backgroundColor: '#0D0D0D', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
          <Heart size={24} color="#E91E63" style={{ marginBottom: '8px' }} />
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#FFF' }}>{userStats.plannedTitles}</div>
          <div style={{ fontSize: '0.8rem', color: '#AAA' }}>Запланировано</div>
        </div>
      </div>

      {/* History Section */}
      <div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#D4AF37', marginBottom: '16px' }}>
          История просмотров
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {history.map(item => (
            <div
              key={item.id}
              style={{
                backgroundColor: '#0A0A0A',
                border: '1px solid #1F1F1F',
                borderRadius: '8px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <img src={item.poster} alt={item.title} style={{ width: '40px', height: '56px', borderRadius: '4px', objectFit: 'cover' }} />
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FFF' }}>{item.title}</h4>
                  <div style={{ fontSize: '0.8rem', color: '#888' }}>{item.ep}</div>
                </div>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#666' }}>{item.time}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
