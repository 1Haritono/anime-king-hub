const { app, BrowserWindow, session, ipcMain, net } = require('electron');
const path = require('path');
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

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
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
