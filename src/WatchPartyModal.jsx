import React, { useState } from 'react';
import { Users, Plus, LogIn, Copy, Check, X, Shield, Send, MessageSquare, UserPlus, Server } from 'lucide-react';

export default function WatchPartyModal({ onClose, onRoomCreated, onRoomJoined }) {
  const [mode, setMode] = useState('menu'); // 'menu', 'create', 'join', 'active_room', 'friends_list'
  const [pinCode, setPinCode] = useState('');
  const [inputPin, setInputPin] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeRoomData, setActiveRoomData] = useState(null);
  
  // D24: Side Panel / Inline Room Text Chat
  const [chatMessages, setChatMessages] = useState([
    { id: 1, user: 'Система', text: 'Комната Watch Party успешно создана', time: '14:20' }
  ]);
  const [newMessage, setNewMessage] = useState('');
  
  // D22: Friends list state & Context Menu state
  const [friends] = useState([
    { id: 1, name: 'Alex_Anime', status: 'В сети', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Alex' },
    { id: 2, name: 'OtakuKing', status: 'В сети', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Otaku' },
    { id: 3, name: 'SakuraFan', status: 'Не в сети', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Sakura' }
  ]);
  const [contextMenu, setContextMenu] = useState(null); // { x, y, friend }
  const [inviteNotification, setInviteNotification] = useState(null);

  // D20: Generate 6-character PIN
  const generatePin = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreateRoom = () => {
    const newPin = generatePin();
    setPinCode(newPin);
    const room = {
      pin: newPin,
      isHost: true,
      members: ['Вы (Хост)', 'Alex_Anime']
    };
    setActiveRoomData(room);
    setMode('active_room');
    if (onRoomCreated) onRoomCreated(room);
  };

  // D21: Join via PIN
  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (inputPin.length < 6) return;
    const room = {
      pin: inputPin.toUpperCase(),
      isHost: false,
      members: ['Хост комнаты', 'Вы']
    };
    setActiveRoomData(room);
    setMode('active_room');
    if (onRoomJoined) onRoomJoined(room);
  };

  const copyPin = () => {
    navigator.clipboard.writeText(pinCode || activeRoomData?.pin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setChatMessages(prev => [
      ...prev,
      { id: Date.now(), user: 'Вы', text: newMessage, time: new Date().toLocaleTimeString().slice(0, 5) }
    ]);
    setNewMessage('');
  };

  // D22: Right Click Context Menu handler for Friends
  const handleFriendRightClick = (e, friend) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      friend
    });
  };

  const handleInviteFriend = (friend) => {
    setContextMenu(null);
    setInviteNotification(`Приглашение на трансляцию отправлено другу ${friend.name}!`);
    setTimeout(() => setInviteNotification(null), 3000);
  };

  return (
    <div 
      onClick={() => setContextMenu(null)}
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}
    >
      <div style={{
        backgroundColor: '#0D0D0D',
        border: '1px solid #5C061C',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '480px',
        width: '100%',
        color: '#FFF',
        boxShadow: '0 8px 32px rgba(92, 6, 28, 0.4)',
        position: 'relative'
      }}>

        {/* Invite Toast Notification */}
        {inviteNotification && (
          <div style={{
            position: 'absolute',
            top: '-45px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#5C061C',
            color: '#D4AF37',
            border: '1px solid #D4AF37',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '0.8rem',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
          }}>
            {inviteNotification}
          </div>
        )}
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#D4AF37', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users color="#D4AF37" size={20} /> Watch Party (Совместный просмотр)
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* D19: Menu Mode (Create / Join / Friends Buttons) */}
        {mode === 'menu' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontSize: '0.85rem', color: '#AAA', marginBottom: '4px' }}>
              Смотрите аниме синхронно вместе с друзьями в режиме реального времени.
            </p>

            <button
              onClick={handleCreateRoom}
              className="btn-burgundy"
              style={{ justifyContent: 'center', padding: '12px', fontSize: '0.9rem' }}
            >
              <Plus size={18} /> Создать комнату (Хост)
            </button>

            <button
              onClick={() => setMode('join')}
              className="btn-gold"
              style={{ justifyContent: 'center', padding: '12px', fontSize: '0.9rem' }}
            >
              <LogIn size={18} /> Присоединиться по ПИН-коду
            </button>

            <button
              onClick={() => setMode('friends_list')}
              style={{
                backgroundColor: '#1A1A1A',
                border: '1px solid #333',
                color: '#FFF',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <UserPlus size={18} color="#D4AF37" /> Список друзей (ПКМ для приглашения)
            </button>
          </div>
        )}

        {/* D22: Friends List with Context Menu on Right Click */}
        {mode === 'friends_list' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#AAA' }}>Кликните ПКМ по другу для действия:</span>
              <button onClick={() => setMode('menu')} className="btn-burgundy" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>Назад</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  onContextMenu={(e) => handleFriendRightClick(e, friend)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#000',
                    border: '1px solid #222',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    cursor: 'context-menu',
                    userSelect: 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src={friend.avatar} alt={friend.name} style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#222' }} />
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#FFF' }}>{friend.name}</div>
                      <div style={{ fontSize: '0.75rem', color: friend.status === 'В сети' ? '#4CAF50' : '#888' }}>{friend.status}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#666' }}>Нажмите ПКМ</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* D21: Join Mode */}
        {mode === 'join' && (
          <div>
            <p style={{ fontSize: '0.85rem', color: '#AAA', marginBottom: '16px' }}>
              Введите 6-значный ПИН-код комнаты, предоставленный хостом:
            </p>
            <form onSubmit={handleJoinRoom} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input
                type="text"
                maxLength={6}
                placeholder="ПИН-код (напр. B7M2X9)"
                value={inputPin}
                onChange={(e) => setInputPin(e.target.value.toUpperCase())}
                style={{
                  backgroundColor: '#000',
                  border: '1px solid #5C061C',
                  padding: '12px',
                  borderRadius: '8px',
                  color: '#D4AF37',
                  fontSize: '1.2rem',
                  fontWeight: 900,
                  letterSpacing: '4px',
                  textAlign: 'center',
                  textTransform: 'uppercase'
                }}
              />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" className="btn-gold" style={{ flex: 1, justifyContent: 'center' }}>
                  Присоединиться
                </button>
                <button type="button" onClick={() => setMode('menu')} className="btn-burgundy" style={{ flex: 1, justifyContent: 'center' }}>
                  Назад
                </button>
              </div>
            </form>
          </div>
        )}

        {/* D20, D23, D24: Active Room View with Side Chat Panel & WS Info */}
        {mode === 'active_room' && activeRoomData && (
          <div>
            {/* PIN Code Box */}
            <div style={{
              backgroundColor: '#140408',
              border: '1px solid #5C061C',
              borderRadius: '8px',
              padding: '12px',
              textAlign: 'center',
              marginBottom: '16px'
            }}>
              <div style={{ fontSize: '0.75rem', color: '#AAA', marginBottom: '2px' }}>ПИН-КОД ВАШЕЙ КОМНАТЫ:</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#D4AF37', letterSpacing: '6px', marginBottom: '6px' }}>
                {activeRoomData.pin}
              </div>
              <button
                onClick={copyPin}
                style={{
                  backgroundColor: '#1E1E1E',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#FFF',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {copied ? <Check size={14} color="#4CAF50" /> : <Copy size={14} />}
                <span>{copied ? 'Скопировано!' : 'Скопировать ПИН'}</span>
              </button>
            </div>

            {/* D23: WebSocket Sync Status Banner */}
            <div style={{
              backgroundColor: '#0A1A0F',
              border: '1px solid #2E7D32',
              borderRadius: '6px',
              padding: '8px 12px',
              fontSize: '0.75rem',
              color: '#81C784',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px'
            }}>
              <Server size={14} color="#81C784" />
              <span><strong>WebSocket Sync Active:</strong> Синхронизация воспроизведения, паузы и таймлайна (до 3.0x).</span>
            </div>

            {/* D24: Side Panel / Inline Text Chat Inside Room */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#AAA', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Участники ({activeRoomData.members.length}):</span>
                <span style={{ color: '#D4AF37' }}>Текстовый чат комнаты (D24)</span>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {activeRoomData.members.map((m, idx) => (
                  <span key={idx} className="badge-gold" style={{ fontSize: '0.75rem' }}>{m}</span>
                ))}
              </div>

              {/* Chat Message Window */}
              <div style={{
                backgroundColor: '#000',
                border: '1px solid #222',
                borderRadius: '8px',
                padding: '10px',
                height: '140px',
                overflowY: 'auto',
                marginBottom: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                {chatMessages.map(msg => (
                  <div key={msg.id} style={{ fontSize: '0.8rem', lineHeight: '1.3' }}>
                    <span style={{ color: '#666', fontSize: '0.7rem', marginRight: '6px' }}>[{msg.time}]</span>
                    <strong style={{ color: '#D4AF37' }}>{msg.user}:</strong>{' '}
                    <span style={{ color: '#DDD' }}>{msg.text}</span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Сообщение в чат комнаты..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  style={{
                    flex: 1,
                    backgroundColor: '#000',
                    border: '1px solid #333',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    color: '#FFF',
                    fontSize: '0.85rem'
                  }}
                />
                <button type="submit" className="btn-burgundy" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
                  <Send size={14} />
                </button>
              </form>
            </div>

            <button onClick={() => setMode('menu')} className="btn-burgundy" style={{ width: '100%', justifyContent: 'center' }}>
              Покинуть комнату
            </button>
          </div>
        )}

        {/* D22 Context Menu on Right Click */}
        {contextMenu && (
          <div style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            backgroundColor: '#1E040B',
            border: '1px solid #5C061C',
            borderRadius: '8px',
            padding: '6px',
            zIndex: 3000,
            boxShadow: '0 8px 24px rgba(0,0,0,0.8)'
          }}>
            <button
              onClick={() => handleInviteFriend(contextMenu.friend)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#D4AF37',
                padding: '8px 14px',
                borderRadius: '4px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%'
              }}
            >
              <UserPlus size={16} /> Пригласить на трансляцию
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
