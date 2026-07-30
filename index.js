const { app, BrowserWindow, session, ipcMain } = require('electron');
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
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Inject Referer header for shikimori.one images & Kodik/Alloha/VK video embeds to bypass hotlink & domain blocks
  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: [
      'https://shikimori.one/*',
      '*://*.kodik*.com/*',
      '*://*.kodik.info/*',
      '*://*.alloha.*/*',
      '*://*.vk.com/*',
      '*://*.rutube.ru/*'
    ] },
    (details, callback) => {
      details.requestHeaders['Referer'] = 'https://shikimori.one/';
      details.requestHeaders['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
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

ipcMain.on('start-download-update', () => {
  autoUpdater.downloadUpdate().catch(err => {
    if (mainWindow) mainWindow.webContents.send('updater-status', { status: 'error', error: err.message });
  });
});

ipcMain.on('quit-and-install-update', () => {
  autoUpdater.quitAndInstall(false, true);
});

app.whenReady().then(() => {
  createWindow();

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
