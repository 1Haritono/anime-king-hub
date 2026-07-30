import React, { useState } from 'react';
import {
  Play, Star, Heart, Edit3, QrCode, Info, Users, ArrowLeft,
  Share2, Shield, Calendar, Film, Mic, Tv, Layers, ExternalLink
} from 'lucide-react';

export default function AnimeDetailView({ anime, onBack, onPlay }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  if (!anime) return null;

  return (
    <div style={{ color: '#FFFFFF', paddingBottom: '40px' }}>
      
      {/* Back Button */}
      <button
        onClick={onBack}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: '#121212',
          border: '1px solid rgba(255,255,255,0.1)',
          color: '#FFF',
          padding: '8px 16px',
          borderRadius: '8px',
          cursor: 'pointer',
          marginBottom: '20px',
          fontWeight: 600,
          fontSize: '0.85rem'
        }}
      >
        <ArrowLeft size={16} /> Назад к каталогу
      </button>

      {/* Main Title Banner & Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '32px', marginBottom: '32px' }}>
        
        {/* Left Poster Column */}
        <div>
          <div style={{
            width: '100%',
            height: '400px',
            backgroundColor: '#1A1A1A',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid rgba(92, 6, 28, 0.4)',
            position: 'relative',
            boxShadow: '0 8px 24px rgba(0,0,0,0.8)'
          }}>
            <img
              src={anime.posterUrl || "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80"}
              alt={anime.title}
              onError={(e) => {
                const original = anime.posterUrl;
                if (original && !e.target.dataset.proxied) {
                  e.target.dataset.proxied = '1';
                  e.target.src = `https://corsproxy.io/?${encodeURIComponent(original)}`;
                }
              }}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            {/* Age Rating Badge */}
            <div style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              backgroundColor: '#5C061C',
              color: '#FFF',
              fontWeight: 900,
              fontSize: '0.8rem',
              padding: '4px 8px',
              borderRadius: '6px',
              border: '1px solid #FF85A2'
            }}>
              {anime.ageRating || '16+'}
            </div>
          </div>

          {/* Red Play Button under poster */}
          <button
            onClick={() => onPlay(anime)}
            style={{
              width: '100%',
              marginTop: '16px',
              backgroundColor: '#E50914',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '14px',
              fontWeight: 800,
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 4px 15px rgba(229, 9, 20, 0.4)',
              transition: 'all 0.2s ease'
            }}
          >
            <Play size={20} fill="#FFF" /> Воспроизвести
          </button>
        </div>

        {/* Right Information Column */}
        <div>
          {/* Title Header */}
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '8px', lineHeight: '1.2' }}>
            {anime.title}
          </h1>
          <div style={{ fontSize: '1rem', color: '#A0A0A0', marginBottom: '16px', fontStyle: 'italic' }}>
            {anime.originalTitle || "Shingeki no Kyojin: The Final Season"}
          </div>

          {/* Ratings Block: Strictly 2 Sources (Site Rating & Kinopoisk) */}
          <div style={{ display: 'flex', gap: '20px', marginBottom: '24px', flexWrap: 'wrap' }}>
            
            {/* Site Rating */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: '#121212',
              border: '1px solid rgba(212, 175, 55, 0.4)',
              padding: '10px 16px',
              borderRadius: '10px'
            }}>
              <Star size={24} color="#D4AF37" fill="#D4AF37" />
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#D4AF37' }}>
                  {anime.rating || '9.4'} <span style={{ fontSize: '0.8rem', color: '#666' }}>/ 10</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#A0A0A0' }}>
                  Рейтинг сайта ({anime.votesCount || '14,280'} голосов)
                </div>
              </div>
            </div>

            {/* Kinopoisk Rating (DESIGN-22: Redesigned matching reference image with SVG K sunburst logo) */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: '#121212',
              border: '1px solid rgba(255, 102, 0, 0.4)',
              padding: '8px 16px',
              borderRadius: '10px',
              boxShadow: '0 4px 14px rgba(255, 102, 0, 0.15)'
            }}>
              {/* Kinopoisk Reference Pill Box */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#0A0A0A',
                border: '1px solid rgba(255, 102, 0, 0.6)',
                padding: '5px 12px',
                borderRadius: '8px'
              }}>
                {/* SVG Kinopoisk K Sunburst Logo */}
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 3V21H8V14L14 21H19L12 12.5L18.5 3H13.5L8 10.5V3H4Z" fill="url(#kp_grad)" />
                  <path d="M14 4.5L10 9M17 9L11.5 11M16 15L10.5 13M12.5 19L9.5 14" stroke="#FF9900" strokeWidth="1.5" strokeLinecap="round" />
                  <defs>
                    <linearGradient id="kp_grad" x1="4" y1="3" x2="19" y2="21" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#FF5500" />
                      <stop offset="0.6" stopColor="#FF9900" />
                      <stop offset="1" stopColor="#E5E600" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Score Number in Gradient */}
                <span style={{
                  fontSize: '1.25rem',
                  fontWeight: 900,
                  background: 'linear-gradient(90deg, #FF6600 0%, #FFAA00 50%, #B8E600 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontFamily: 'monospace, sans-serif',
                  letterSpacing: '-0.5px'
                }}>
                  {anime.kinopoiskRating || '9.2'}
                </span>
              </div>

              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#FFFFFF' }}>
                  Кинопоиск
                </div>
                <div style={{ fontSize: '0.72rem', color: '#A0A0A0' }}>
                  {anime.votesCount || '85,410'} оценок
                </div>
              </div>
            </div>

          </div>

          {/* Interactive Icon Buttons Row */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className="icon-action-btn"
              title="В избранное"
              style={{ color: isFavorite ? '#E50914' : '#FFF' }}
            >
              <Heart size={18} fill={isFavorite ? '#E50914' : 'none'} />
              <span>{isFavorite ? 'В избранном' : 'Избранное'}</span>
            </button>

            <button onClick={() => setShowEditModal(true)} className="icon-action-btn" title="Редактировать карточку">
              <Edit3 size={18} />
              <span>Редактировать</span>
            </button>

            <button onClick={() => setShowQrModal(true)} className="icon-action-btn" title="Показать QR-код">
              <QrCode size={18} />
              <span>QR-код</span>
            </button>

            <button className="icon-action-btn" title="Узнать о авторах и съёмочной группе">
              <Info size={18} />
              <span>О создателях</span>
            </button>

            <button className="icon-action-btn" title="Актерский состав и озвучка">
              <Users size={18} />
              <span>Актёры</span>
            </button>
          </div>

          {/* Details Table */}
          <div style={{
            backgroundColor: '#0D0D0D',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '10px',
            padding: '16px 20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '12px 24px',
            fontSize: '0.9rem'
          }}>
            <div>
              <span style={{ color: '#666', marginRight: '8px' }}>Статус:</span>
              <span style={{ color: '#4CAF50', fontWeight: 700 }}>{anime.status || 'Завершён'}</span>
            </div>
            <div>
              <span style={{ color: '#666', marginRight: '8px' }}>Тип:</span>
              <a href="#type" style={{ color: '#D4AF37', textDecoration: 'none', fontWeight: 600 }}>{anime.type || 'ТВ-сериал (24 эп.)'}</a>
            </div>
            <div>
              <span style={{ color: '#666', marginRight: '8px' }}>Год/Сезон:</span>
              <a href="#season" style={{ color: '#D4AF37', textDecoration: 'none', fontWeight: 600 }}>{anime.yearSeason || 'Зима 2024'}</a>
            </div>
            <div>
              <span style={{ color: '#666', marginRight: '8px' }}>Студия:</span>
              <a href="#studio" style={{ color: '#D4AF37', textDecoration: 'none', fontWeight: 600 }}>{anime.studio || 'MAPPA'}</a>
            </div>
            <div>
              <span style={{ color: '#666', marginRight: '8px' }}>Режиссёр:</span>
              <a href="#director" style={{ color: '#D4AF37', textDecoration: 'none', fontWeight: 600 }}>{anime.director || 'Юитиро Хаяси'}</a>
            </div>
            <div>
              <span style={{ color: '#666', marginRight: '8px' }}>Тип перевода:</span>
              <span style={{ color: '#FFF' }}>Дубляж + Многоголосый</span>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <span style={{ color: '#666', marginRight: '8px' }}>Студии озвучки:</span>
              <span style={{ gap: '8px', display: 'inline-flex' }}>
                {['Studio Band', 'Anilibria', 'Deep', 'JAM Club'].map(studio => (
                  <a key={studio} href={`#voice-${studio}`} style={{ color: '#D4AF37', textDecoration: 'none', backgroundColor: '#1A1A1A', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                    {studio}
                  </a>
                ))}
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Grid of Screenshots */}
      <div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '16px', color: '#D4AF37' }}>
          Кадры из тайтла
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {[1, 2, 3, 4].map(idx => (
            <div key={idx} style={{
              height: '130px',
              backgroundColor: '#161616',
              borderRadius: '8px',
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.05)'
            }}>
              <img
                src={`https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop&q=80&sig=${idx}`}
                alt="Screenshot"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* QR Modal */}
      {showQrModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#0D0D0D', border: '1px solid #5C061C', borderRadius: '12px', padding: '24px', textAlign: 'center', maxWidth: '300px' }}>
            <h4 style={{ fontSize: '1.1rem', marginBottom: '12px', color: '#D4AF37' }}>QR-код тайтла</h4>
            <div style={{ backgroundColor: '#FFF', padding: '16px', borderRadius: '8px', display: 'inline-block', marginBottom: '16px' }}>
              <QrCode size={160} color="#000" />
            </div>
            <button onClick={() => setShowQrModal(false)} className="btn-burgundy" style={{ width: '100%', justifyContent: 'center' }}>Закрыть</button>
          </div>
        </div>
      )}

      {/* Edit Card Modal */}
      {showEditModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#0D0D0D', border: '1px solid #5C061C', borderRadius: '12px', padding: '24px', maxWidth: '400px', width: '100%' }}>
            <h4 style={{ fontSize: '1.1rem', marginBottom: '12px', color: '#D4AF37' }}>Редактирование карточки</h4>
            <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '16px' }}>Изменение локальных пользовательских метаданных тайтла.</p>
            <input type="text" defaultValue={anime.title} style={{ width: '100%', backgroundColor: '#000', border: '1px solid #333', padding: '10px', borderRadius: '6px', color: '#FFF', marginBottom: '16px' }} />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowEditModal(false)} className="btn-gold" style={{ flex: 1, justifyContent: 'center' }}>Сохранить</button>
              <button onClick={() => setShowEditModal(false)} className="btn-burgundy" style={{ flex: 1, justifyContent: 'center' }}>Отмена</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
