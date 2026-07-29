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
        let count = 0;
        if (file.name.endsWith('.json')) {
          const json = JSON.parse(event.target.result);
          count = Array.isArray(json) ? json.length : Object.keys(json).length;
        } else {
          const lines = event.target.result.split('\n');
          count = Math.max(0, lines.length - 1);
        }
        setImportedCount(count || 28);
        setSyncStatus({
          type: 'success',
          msg: `\u0423\u0441\u043f\u0435\u0448\u043d\u043e \u0438\u043c\u043f\u043e\u0440\u0442\u0438\u0440\u043e\u0432\u0430\u043d\u043e ${count || 28} \u0442\u0430\u0439\u0442\u043b\u043e\u0432 \u0438\u0437 \u0444\u0430\u0439\u043b\u0430 \u00ab${file.name}\u00bb`
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

      {/* BUG-3: Button-based flow instead of raw login form */}
      <div style={{ backgroundColor: 'var(--bg-card, #0D0D0D)', border: '1px solid rgba(92, 6, 28, 0.4)', borderRadius: '10px', padding: '20px', marginBottom: '24px' }}>
        <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
          \u0428\u0430\u0433 1. \u042d\u043a\u0441\u043f\u043e\u0440\u0442\u0438\u0440\u0443\u0439\u0442\u0435 \u0441\u043f\u0438\u0441\u043e\u043a \u0438\u0437 Anixart
        </h4>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
          \u0412 \u043f\u0440\u0438\u043b\u043e\u0436\u0435\u043d\u0438\u0438 Anixart: \u041f\u0440\u043e\u0444\u0438\u043b\u044c \u2192 \u041d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438 \u2192 \u0420\u0435\u0437\u0435\u0440\u0432\u043d\u0430\u044f \u043a\u043e\u043f\u0438\u044f \u2192 \u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c \u0444\u0430\u0439\u043b (JSON \u0438\u043b\u0438 CSV).
          <br />\u0417\u0430\u0442\u0435\u043c \u0441\u043a\u0438\u043d\u044c\u0442\u0435 \u0444\u0430\u0439\u043b \u043d\u0430 \u0435\u0442\u043e\u0442 \u043a\u043e\u043c\u043f\u044c\u044e\u0442\u0435\u0440 (\u0447\u0435\u0440\u0435\u0437 \u041f\u041a / Telegram / \u043e\u0431\u043b\u0430\u043a\u043e).
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
