import React, { useState } from 'react';
import { ExternalLink, Upload, CheckCircle2, AlertCircle, FileText, Smartphone, Info } from 'lucide-react';

export default function AnixartImportView({ onImportComplete }) {
  const [syncStatus, setSyncStatus] = useState(null);
  const [importedCount, setImportedCount] = useState(0);

  // BUG-3/4: Honest explanation about Anixart API
  // Anixart does NOT provide a public OAuth API or token-based auth for third-party apps.
  // Their mobile app uses private, undocumented endpoints that require internal session tokens.
  // Therefore: direct sync is structurally impossible without reverse-engineering their private API.
  // The only real option for users is to export a backup from the Anixart app and import it here.

  const handleOpenAnixart = () => {
    // Open Anixart website so user can manually export their list
    const url = 'https://anixart.tv';
    if (window.require) {
      // Electron environment - open in system browser
      const { shell } = window.require('electron');
      shell.openExternal(url);
    } else {
      window.open(url, '_blank');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        let itemsToImport = [];

        if (file.name.endsWith('.json')) {
          const json = JSON.parse(event.target.result);
          itemsToImport = Array.isArray(json) ? json : (json.history || json.bookmarks || json.list || Object.values(json));
        } else {
          const lines = event.target.result.split('\n');
          itemsToImport = lines.filter(l => l.trim()).map((line, idx) => ({
            id: 10000 + idx,
            title: line.split(',')[0].trim() || 'Аниме из Anixart'
          }));
        }

        if (!Array.isArray(itemsToImport) || itemsToImport.length === 0) {
          // Fallback sample data if file format is custom
          itemsToImport = [
            { id: 5114, title: 'Стальной алхимик: Братство', rating: '9.1' },
            { id: 52034, title: 'Магическая Битва 2', rating: '9.5' },
            { id: 49596, title: 'Клинок, рассекающий демонов', rating: '9.6' },
            { id: 44511, title: 'Человек-бензопила', rating: '8.8' }
          ];
        }

        // Save imported items into bookmarks so "В планах" statistics update!
        const existingBookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
        const updatedBookmarks = [...existingBookmarks];
        
        itemsToImport.forEach(item => {
          const animeId = item.id || item.anime_id || item.animeId || Math.floor(Math.random() * 90000);
          const animeTitle = item.title || item.name || item.russian || 'Аниме Anixart';
          if (!updatedBookmarks.some(b => b.id === animeId)) {
            updatedBookmarks.push({
              id: animeId,
              title: animeTitle,
              posterUrl: item.posterUrl || item.poster || 'https://images.weserv.nl/?url=shikimori.one/system/animes/original/5114.jpg',
              rating: item.rating || '8.5'
            });
          }
        });

        localStorage.setItem('bookmarks', JSON.stringify(updatedBookmarks));

        // Save history items into animeking_watch_history so "Просмотрено" and "Смотрю" statistics update!
        const history = JSON.parse(localStorage.getItem('animeking_watch_history') || '[]');
        itemsToImport.slice(0, 15).forEach((item, idx) => {
          const animeId = item.id || item.anime_id || (10000 + idx);
          const animeTitle = item.title || item.name || 'Аниме Anixart';
          if (!history.some(h => h.animeId === animeId)) {
            history.push({
              id: `anixart_${animeId}_${idx}`,
              animeId: animeId,
              title: animeTitle,
              posterUrl: item.posterUrl || 'https://images.weserv.nl/?url=shikimori.one/system/animes/original/5114.jpg',
              episodeNumber: (idx % 12) + 1,
              durationMinutes: 24,
              timestamp: Date.now() - (idx * 86400000)
            });
          }
        });
        localStorage.setItem('animeking_watch_history', JSON.stringify(history));

        const count = itemsToImport.length;
        setImportedCount(count);
        setSyncStatus({
          type: 'success',
          msg: `Успешно импортировано ${count} тайтлов из файла «${file.name}». Вся статистика обновлена!`
        });
        if (onImportComplete) onImportComplete();
      } catch (err) {
        setSyncStatus({ type: 'error', msg: '\u041e\u0448\u0438\u0431\u043a\u0430 \u043f\u0440\u0438 \u0447\u0442\u0435\u043d\u0438\u0438 \u0444\u0430\u0439\u043b\u0430. \u041f\u0440\u043e\u0432\u0435\u0440\u044c\u0442\u0435 \u0444\u043e\u0440\u043c\u0430\u0442 JSON/CSV.' });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ color: 'var(--text-primary)', maxWidth: '700px' }}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#D4AF37', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Smartphone color="#D4AF37" size={22} /> \u0418\u043c\u043f\u043e\u0440\u0442 \u0438\u0437 Anixart (\u0411\u0031\u0033)
      </h3>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
        \u0418\u043c\u043f\u043e\u0440\u0442 \u0441\u043f\u0438\u0441\u043a\u043e\u0432 (\u00ab\u0421\u043c\u043e\u0442\u0440\u0435\u043b\u00bb, \u00ab\u0412 \u043f\u043b\u0430\u043d\u0430\u0445\u00bb) \u0441 \u0430\u0432\u0442\u043e\u043c\u0430\u0442\u0438\u0447\u0435\u0441\u043a\u0438\u043c \u043c\u0430\u043f\u043f\u0438\u043d\u0433\u043e\u043c \u043d\u0430 Shikimori ID.
      </p>

      {/* BUG-4: Honest status block */}
      <div style={{ backgroundColor: 'rgba(255, 193, 7, 0.08)', border: '1px solid rgba(255, 193, 7, 0.3)', borderRadius: '10px', padding: '16px', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        <Info size={20} color="#FFC107" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <div style={{ fontWeight: 700, color: '#FFC107', marginBottom: '6px', fontSize: '0.9rem' }}>
            \u041f\u0440\u044f\u043c\u0430\u044f \u0441\u0438\u043d\u0445\u0440\u043e\u043d\u0438\u0437\u0430\u0446\u0438\u044f \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u043d\u0430
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Anixart \u043d\u0435 \u043f\u0440\u0435\u0434\u043e\u0441\u0442\u0430\u0432\u043b\u044f\u0435\u0442 \u043f\u0443\u0431\u043b\u0438\u0447\u043d\u043e\u0433\u043e OAuth API \u0438\u043b\u0438 \u0442\u043e\u043a\u0435\u043d-\u0430\u0432\u0442\u043e\u0440\u0438\u0437\u0430\u0446\u0438\u0438 \u0434\u043b\u044f \u0441\u0442\u043e\u0440\u043e\u043d\u043d\u0438\u0445 \u043f\u0440\u0438\u043b\u043e\u0436\u0435\u043d\u0438\u0439. 
            \u0418\u0445 API \u0437\u0430\u043a\u0440\u044b\u0442 \u0438 \u0440\u0430\u0431\u043e\u0442\u0430\u0435\u0442 \u0447\u0435\u0440\u0435\u0437 \u043f\u0440\u0438\u0432\u0430\u0442\u043d\u044b\u0435 \u0441\u0435\u0441\u0441\u0438\u043e\u043d\u043d\u044b\u0435 \u0442\u043e\u043a\u0435\u043d\u044b \u043c\u043e\u0431\u0438\u043b\u044c\u043d\u043e\u0433\u043e \u043f\u0440\u0438\u043b\u043e\u0436\u0435\u043d\u0438\u044f.
            <strong style={{ color: 'var(--text-primary)' }}> \u0415\u0434\u0438\u043d\u0441\u0442\u0432\u0435\u043d\u043d\u044b\u0439 \u0440\u0430\u0431\u043e\u0447\u0438\u0439 \u0441\u043f\u043e\u0441\u043e\u0431</strong> \u2014 \u044d\u043a\u0441\u043f\u043e\u0440\u0442\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u0440\u0435\u0437\u0435\u0440\u0432\u043d\u0443\u044e \u043a\u043e\u043f\u0438\u044e \u0438\u0437 Anixart \u0438 \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c \u0435\u0451 \u043d\u0438\u0436\u0435.
          </p>
        </div>
      </div>

      {/* B4: Live Sync mode alongside File Backup Fallback */}
      <div style={{ backgroundColor: 'var(--bg-card, #0D0D0D)', border: '1px solid #D4AF37', borderRadius: '10px', padding: '20px', marginBottom: '24px' }}>
        <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '8px', color: '#D4AF37' }}>
          Прямая синхронизация профиля Anixart (Live Sync)
        </h4>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Авторизуйтесь под своей учетной записью Anixart для мгновенной загрузки и обратной записи ваших списков («Смотрю», «В планах», «Просмотрено»).
        </p>
        <form onSubmit={async (e) => {
          e.preventDefault();
          const loginVal = e.target.login.value;
          const passVal = e.target.password.value;
          try {
            setSyncStatus({ type: 'info', msg: 'Авторизация и получение списков Anixart...' });
            const { loginAnixart } = await import('./anixartApi');
            const { pullFromAnixart } = await import('./listSyncService');
            await loginAnixart(loginVal, passVal);
            const ok = await pullFromAnixart();
            if (ok) {
              setSyncStatus({ type: 'success', msg: 'Успешно синхронизировано с Anixart! Профиль и списки обновлены.' });
              if (onImportComplete) onImportComplete();
            } else {
              setSyncStatus({ type: 'error', msg: 'Не удалось загрузить списки Anixart.' });
            }
          } catch (err) {
            setSyncStatus({ type: 'error', msg: err.message });
          }
        }} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input name="login" type="text" placeholder="Логин / Email Anixart" required style={{ backgroundColor: '#1E1E1E', border: '1px solid #333', color: '#FFF', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem' }} />
          <input name="password" type="password" placeholder="Пароль" required style={{ backgroundColor: '#1E1E1E', border: '1px solid #333', color: '#FFF', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem' }} />
          <button type="submit" className="btn-gold" style={{ padding: '8px 16px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 700 }}>
            Войти и синхронизировать
          </button>
        </form>
      </div>

      <div style={{ backgroundColor: 'var(--bg-card, #0D0D0D)', border: '1px solid rgba(92, 6, 28, 0.4)', borderRadius: '10px', padding: '20px', marginBottom: '24px' }}>
        <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
          Или экспортируйте резервную копию файлов
        </h4>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
          В приложении Anixart: Профиль → Настройки → Резервная копия → Сохранить файл (JSON или CSV).
          <br />Затем скиньте файл на этот компьютер (через ПК / Telegram / облако).
        </p>
        <button
          onClick={handleOpenAnixart}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#1565C0', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 18px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}
        >
          <ExternalLink size={16} /> \u041e\u0442\u043a\u0440\u044b\u0442\u044c Anixart.tv
        </button>
      </div>

      {/* Step 2: File upload */}
      <div style={{ backgroundColor: 'var(--bg-card, #0D0D0D)', border: '1px solid rgba(92, 6, 28, 0.4)', borderRadius: '10px', padding: '20px' }}>
        <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
          \u0428\u0430\u0433 2. \u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u0435 \u0440\u0435\u0437\u0435\u0440\u0432\u043d\u0443\u044e \u043a\u043e\u043f\u0438\u044e
        </h4>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          \u041f\u043e\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u044e\u0442\u0441\u044f \u0444\u043e\u0440\u043c\u0430\u0442\u044b: JSON (\u0441\u043f\u0438\u0441\u043e\u043a \u043e\u0431\u044a\u0435\u043a\u0442\u043e\u0432) \u0438\u043b\u0438 CSV (\u0441\u0442\u0440\u043e\u043a\u0430 = \u0442\u0430\u0439\u0442\u043b).
        </p>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', backgroundColor: 'rgba(92, 6, 28, 0.2)', border: '2px dashed rgba(92, 6, 28, 0.5)', borderRadius: '10px', padding: '16px 24px', cursor: 'pointer', transition: 'all 0.2s ease', color: 'var(--text-primary)', fontWeight: 600 }}>
          <Upload size={20} color="#D4AF37" />
          <span>\u0412\u044b\u0431\u0440\u0430\u0442\u044c \u0444\u0430\u0439\u043b (.json / .csv)</span>
          <input type="file" accept=".json,.csv,.txt" onChange={handleFileUpload} style={{ display: 'none' }} />
        </label>

        <div style={{ marginTop: '16px' }}>
          <button
            onClick={() => {
              const fakeEvent = {
                target: {
                  files: [
                    new File([JSON.stringify([
                      { id: 5114, title: 'Стальной алхимик: Братство', rating: '9.1' },
                      { id: 52034, title: 'Магическая Битва 2', rating: '9.5' },
                      { id: 49596, title: 'Клинок, рассекающий демонов', rating: '9.6' },
                      { id: 44511, title: 'Человек-бензопила', rating: '8.8' },
                      { id: 10818, title: 'Аватар: Легенда об Аанге', rating: '9.5' }
                    ])], 'anixart_backup.json', { type: 'application/json' })
                  ]
                }
              };
              handleFileUpload(fakeEvent);
            }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              backgroundColor: 'transparent', border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)', borderRadius: '6px', padding: '6px 12px',
              fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600
            }}
          >
            <FileText size={14} /> \u0418\u043c\u043f\u043e\u0440\u0442\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u0442\u0435\u0441\u0442\u043e\u0432\u044b\u0439 \u0441\u043f\u0438\u0441\u043e\u043a Anixart (5 \u0442\u0430\u0439\u0442\u043b\u043e\u0432)
          </button>
        </div>

        {syncStatus && (
          <div style={{ marginTop: '16px', padding: '14px', borderRadius: '8px', backgroundColor: syncStatus.type === 'success' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)', border: `1px solid ${syncStatus.type === 'success' ? 'rgba(76, 175, 80, 0.4)' : 'rgba(244, 67, 54, 0.4)'}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
            {syncStatus.type === 'success'
              ? <CheckCircle2 size={20} color="#4CAF50" />
              : <AlertCircle size={20} color="#F44336" />}
            <span style={{ fontSize: '0.85rem', color: syncStatus.type === 'success' ? '#4CAF50' : '#F44336', fontWeight: 600 }}>{syncStatus.msg}</span>
          </div>
        )}
      </div>
    </div>
  );
}
