const { app, BrowserWindow, session, ipcMain, net } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    backgroundColor: '#000000',
    title: 'Anime King Hub',
    autoHideMenuBar: true,
    webPreferences: {
      // TODO: Migrate nodeIntegration and contextIsolation to a secure contextBridge preload.js script in future releases
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Handle did-fail-load for friendly error UI instead of pure black screen
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    if (validatedURL.includes('localhost:5173')) {
      console.error('[Electron] Vite dev server не запущен на http://localhost:5173. Запусти «npm run dev» или используй «npm start».');
      const errorHtml = `
        <!DOCTYPE html>
        <html>
          <head><meta charset="UTF-8"><title>Anime King Hub — Ошибка загрузки</title></head>
          <body style="background:#000; color:#FF85A2; font-family:sans-serif; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; margin:0; text-align:center; padding:20px;">
            <h2 style="color:#D4AF37; font-size:1.5rem; margin-bottom:12px;">⚠️ Ошибка загрузки интерфейса</h2>
            <p style="color:#EEE; max-width:500px; font-size:0.95rem; line-height:1.5;">Vite dev server не запущен на <b>http://localhost:5173</b> и отсутствует собранная папка <b>dist/</b>.</p>
            <div style="background:#141414; border:1px solid #5C061C; border-radius:8px; padding:12px 20px; font-family:monospace; color:#D4AF37; margin:16px 0;">
              npm start
            </div>
            <p style="color:#AAA; font-size:0.85rem;">Запустите «npm start» или «npm run dev» для старта сервера и перезапустите Electron.</p>
          </body>
        </html>
      `;
      mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(errorHtml)}`).catch(() => {});
    }
  });

  // 5.1 AdBlock: Block ad & tracker hosts in Electron session for HTTP/HTTPS requests
  const AD_BLOCK_DOMAINS = [
    'doubleclick.net',
    'googlesyndication.com',
    'adservice.google.com',
    'adfox.ru',
    'mytarget.com',
    'yandex.ru/ads',
    'an.yandex.ru',
    'popunder',
    'clickunder',
    'adsterra',
    'exoclick',
    'bet365',
    '1xbet',
    'mostbet',
    'warface',
    'adriver.ru'
  ];

  session.defaultSession.webRequest.onBeforeRequest(
    { urls: ['http://*/*', 'https://*/*'] },
    (details, callback) => {
      const url = details.url || '';
      const isAd = AD_BLOCK_DOMAINS.some(domain => url.toLowerCase().includes(domain));
      if (isAd) {
        console.log(`[AdBlock] Blocked URL: ${url}`);
        return callback({ cancel: true });
      }
      callback({ cancel: false });
    }
  );

  // Inject Referer header for shikimori.one, YummyAnime, Kodik, Alloha, VK, etc.
  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: [
      '*://api.yani.tv/*',
      '*://*.yani.tv/*',
      '*://*.shikimori.one/*',
      '*://*.kodikplayer.com/*',
      '*://*.kodik.info/*',
      '*://*.kodik.biz/*',
      '*://*.alloha.tv/*',
      '*://*.alloha.world/*',
      '*://*.vk.com/*',
      '*://*.rutube.ru/*',
      '*://*.cvh.name/*'
    ] },
    (details, callback) => {
      const url = details.url || '';
      details.requestHeaders['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      
      // Do not aggressively override Referer for YummyAnime API requests
      if (!url.includes('api.yani.tv')) {
        details.requestHeaders['Referer'] = 'https://shikimori.one/';
      }
      callback({ requestHeaders: details.requestHeaders });
    }
  );

  const distExists = fs.existsSync(path.join(__dirname, 'dist/index.html'));
  const isDev = process.env.NODE_ENV === 'development' || !distExists;

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
    mainWindow.loadURL('http://localhost:5173').catch(() => {
      console.error('[Electron] Vite dev server не запущен на http://localhost:5173. Запусти «npm run dev» или используй «npm start».');
    });
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }
}

// Auto-updater Setup (FEATURE-13)
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

autoUpdater.on('checking-for-update', () => {
  if (mainWindow) mainWindow.webContents.send('updater-status', { status: 'checking' });
});

autoUpdater.on('update-available', (info) => {
  if (mainWindow) mainWindow.webContents.send('updater-status', { status: 'available', version: info.version });
});

autoUpdater.on('update-not-available', () => {
  if (mainWindow) mainWindow.webContents.send('updater-status', { status: 'not-available' });
});

autoUpdater.on('error', (err) => {
  if (mainWindow) mainWindow.webContents.send('updater-status', { status: 'error', error: err ? err.message : 'Unknown error' });
});

autoUpdater.on('download-progress', (progressObj) => {
  if (mainWindow) {
    mainWindow.webContents.send('updater-status', {
      status: 'downloading',
      percent: Math.round(progressObj.percent)
    });
  }
});

autoUpdater.on('update-downloaded', () => {
  if (mainWindow) mainWindow.webContents.send('updater-status', { status: 'downloaded' });
});

ipcMain.on('check-for-updates', () => {
  autoUpdater.checkForUpdates().catch(err => {
    if (mainWindow) mainWindow.webContents.send('updater-status', { status: 'error', error: err.message });
  });
});

ipcMain.handle('electron-fetch', async (event, url, options = {}) => {
  try {
    const fetchOptions = {
      method: options.method || 'GET',
      headers: options.headers || {}
    };
    if (options.body) {
      fetchOptions.body = options.body;
    }

    const response = await net.fetch(url, fetchOptions);
    const text = await response.text();

    if (!response.ok) {
      console.warn(`[electron-fetch Error] URL: ${url} | Status: ${response.status}`);
    }

    return { 
      ok: response.ok, 
      status: response.status, 
      data: text,
      headers: response.headers ? Object.fromEntries(response.headers.entries()) : {}
    };
  } catch (err) {
    console.error(`[electron-fetch Exception] URL: ${url} | Error: ${err.message}`);
    return { 
      ok: false, 
      status: 0, 
      error: err.message, 
      data: '' 
    };
  }
});

ipcMain.on('start-download-update', () => {
  autoUpdater.downloadUpdate().catch(err => {
    if (mainWindow) mainWindow.webContents.send('updater-status', { status: 'error', error: err.message });
  });
});

ipcMain.on('quit-and-install-update', () => {
  autoUpdater.quitAndInstall(false, true);
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// Anixart Main Process Session & IPC Bridge (AnixApp Pattern)
let anixartSessionToken = null;

ipcMain.handle('anix:login', async (event, { login, password }) => {
  try {
    const response = await net.fetch('https://api.anixart.tv/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'AnixartAndroid/8.1' },
      body: JSON.stringify({ login, password })
    });
    if (!response.ok) throw new Error('Неверный логин или пароль Anixart');
    const data = await response.json();
    anixartSessionToken = data.token || data.token_session;
    return { success: true, token: anixartSessionToken, user: data.user || { username: login } };
  } catch (err) {
    console.warn('[Anixart Main IPC] Login failed:', err.message);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('anix:logout', () => {
  anixartSessionToken = null;
  return { success: true };
});

ipcMain.handle('anix:getAuthStatus', () => {
  return { hasToken: !!anixartSessionToken, token: anixartSessionToken };
});

ipcMain.handle('anix:selfProfile', async () => {
  if (!anixartSessionToken) return null;
  try {
    const res = await net.fetch('https://api.anixart.tv/profile/me', {
      headers: { 'Authorization': `Bearer ${anixartSessionToken}`, 'User-Agent': 'AnixartAndroid/8.1' }
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  return null;
});

ipcMain.handle('anix:setListStatus', async (event, { releaseId, status }) => {
  if (!anixartSessionToken) return false;
  try {
    const res = await net.fetch(`https://api.anixart.tv/release/${releaseId}/status`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${anixartSessionToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return res.ok;
  } catch (e) { return false; }
});

ipcMain.handle('anix:markEpisodeAsWatched', async (event, { releaseId, episode }) => {
  if (!anixartSessionToken) return false;
  try {
    const res = await net.fetch(`https://api.anixart.tv/release/${releaseId}/episode`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${anixartSessionToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ episode })
    });
    return res.ok;
  } catch (e) { return false; }
});

app.whenReady().then(() => {
  createWindow();

  // Silent auto update check 4 seconds after app ready in production
  if (process.env.NODE_ENV !== 'development' && app.isPackaged) {
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch(err => {
        console.warn('[autoUpdater] Initial check error:', err.message);
      });
    }, 4000);

    // Periodic check every 6 hours
    setInterval(() => {
      autoUpdater.checkForUpdates().catch(err => {
        console.warn('[autoUpdater] Periodic check error:', err.message);
      });
    }, 6 * 60 * 60 * 1000);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
