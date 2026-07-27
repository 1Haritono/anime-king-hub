import React, { useState } from 'react';
import { Calendar, Clock, Play, Bell, Star, Flame } from 'lucide-react';

export default function ScheduleView({ onSelectAnime }) {
  const [selectedDay, setSelectedDay] = useState('Понедельник');

  const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

  const scheduleData = {
    'Понедельник': [
      { id: 40028, title: 'Атака титанов: Финал', ep: 'Серия 16', time: '18:00', rating: '8.57', poster: 'https://shikimori.one/system/animes/original/40028.jpg' },
      { id: 51009, title: 'Магическая битва 2', ep: 'Серия 14', time: '21:30', rating: '8.62', poster: 'https://shikimori.one/system/animes/original/51009.jpg' }
    ],
    'Вторник': [
      { id: 44511, title: 'Человек-бензопила', ep: 'Серия 12', time: '19:00', rating: '8.48', poster: 'https://shikimori.one/system/animes/original/44511.jpg' }
    ],
    'Среда': [
      { id: 38000, title: 'Клинок, рассекающий демонов', ep: 'Серия 11', time: '20:15', rating: '8.41', poster: 'https://shikimori.one/system/animes/original/38000.jpg' }
    ],
    'Четверг': [
      { id: 11757, title: 'Мастера Меча Онлайн', ep: 'Серия 25', time: '17:45', rating: '7.20', poster: 'https://shikimori.one/system/animes/original/11757.jpg' }
    ],
    'Пятница': [
      { id: 38524, title: 'Моя геройская академия 5', ep: 'Серия 20', time: '18:30', rating: '7.85', poster: 'https://shikimori.one/system/animes/original/38524.jpg' }
    ],
    'Суббота': [
      { id: 11061, title: 'Охотник х Охотник (2011)', ep: 'Серия 148', time: '12:00', rating: '9.04', poster: 'https://shikimori.one/system/animes/original/11061.jpg' }
    ],
    'Воскресенье': [
      { id: 20, title: 'Наруто: Ураганные хроники', ep: 'Серия 500', time: '15:00', rating: '8.25', poster: 'https://shikimori.one/system/animes/original/20.jpg' }
    ]
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', color: '#FFF' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <Calendar size={28} color="#D4AF37" />
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#FFF' }}>
            Расписание выхода серий
          </h2>
          <span style={{ fontSize: '0.8rem', color: '#AAA' }}>Обновления в реальном времени из Shikimori API</span>
        </div>
      </div>

      {/* Days Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
        {days.map(day => {
          const isActive = selectedDay === day;
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              style={{
                backgroundColor: isActive ? '#5C061C' : '#0D0D0D',
                color: isActive ? '#D4AF37' : '#AAA',
                border: isActive ? '1px solid #D4AF37' : '1px solid #222',
                padding: '10px 18px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Schedule Items List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {(scheduleData[selectedDay] || []).map(anime => (
          <div
            key={anime.id}
            style={{
              backgroundColor: '#0A0A0A',
              border: '1px solid rgba(92, 6, 28, 0.4)',
              borderRadius: '10px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 4px 16px rgba(0,0,0,0.5)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <img src={anime.poster} alt={anime.title} style={{ width: '50px', height: '70px', borderRadius: '6px', objectFit: 'cover' }} />
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFF', marginBottom: '4px' }}>{anime.title}</h4>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '0.8rem', color: '#AAA' }}>
                  <span style={{ color: '#D4AF37', fontWeight: 700 }}>{anime.ep}</span>
                  <span>•</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> {anime.time}</span>
                  <span>•</span>
                  <span className="badge-gold" style={{ fontSize: '0.7rem' }}><Star size={10} fill="#D4AF37" /> {anime.rating}</span>
                </div>
              </div>
            </div>

            <button
              className="btn-gold"
              onClick={() => onSelectAnime && onSelectAnime(anime)}
              style={{ padding: '8px 16px', fontSize: '0.8rem' }}
            >
              <Play size={14} /> Смотреть
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
