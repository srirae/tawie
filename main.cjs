const { app, BrowserWindow, ipcMain, shell, Menu, Tray, nativeImage } = require('electron');
const path = require('path');
const os = require('os');
const child_process = require('child_process');
const fs = require('fs');

let mainWindow;
let tray = null;
let settingsCache = null;

function readSettings() {
  if (settingsCache) return settingsCache;
  try {
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    settingsCache = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    return settingsCache;
  } catch (e) {
    settingsCache = {};
    return settingsCache;
  }
}

function writeSettings(patch) {
  try {
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    const data = { ...readSettings(), ...patch };
    fs.writeFileSync(settingsPath, JSON.stringify(data, null, 2));
    settingsCache = data;
  } catch (e) {}
}

const isDev = !app.isPackaged && !process.argv.includes('--prod');

function rebuildMenus() {
  const appMenu = Menu.buildFromTemplate([
    ...(process.platform === 'darwin' ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        {
          label: 'Settings',
          accelerator: 'CommandOrControl+,',
          click: () => { if (mainWindow) mainWindow.loadURL(isDev ? 'http://localhost:3000/settings' : 'app://renderer/settings.html'); }
        },
        { type: 'separator' },
        { label: 'Check for Updates...', click: () => { /* placeholder */ } },
        ...(isDev ? [
          { type: 'separator' },
          { label: 'Reset Onboarding', click: () => { if (mainWindow) { mainWindow.webContents.executeJavaScript('localStorage.removeItem("tawie-onboarding-complete");'); mainWindow.reload(); } } },
          { label: 'Hard Reset', click: () => { if (mainWindow) { mainWindow.webContents.executeJavaScript('localStorage.clear();'); mainWindow.reload(); } } },
        ] : []),
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ]
    }] : []),
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Developer',
      submenu: [
        {
          label: 'Force fresh restart',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.executeJavaScript('localStorage.clear();');
              mainWindow.reload();
            }
          }
        },
      ]
    }
  ]);
  Menu.setApplicationMenu(appMenu);

  if (tray && process.platform === 'linux') {
    tray.setContextMenu(buildTrayContextMenu());
  }
}

function buildTrayContextMenu() {
  return Menu.buildFromTemplate([
    { label: 'Settings', click: () => { if (mainWindow) { mainWindow.loadURL(isDev ? 'http://localhost:3000/settings' : 'app://renderer/settings.html'); mainWindow.show(); } } },
    { label: 'Help', click: () => shell.openExternal('https://github.com/tawie') },
    { label: 'Check for Updates...', click: () => {} },
    ...(isDev ? [
      { type: 'separator' },
      { label: 'Force fresh restart', click: () => { if (mainWindow) { mainWindow.webContents.executeJavaScript('localStorage.clear();'); mainWindow.reload(); } } }
    ] : []),
    { type: 'separator' },
    { label: 'Quit Tawie', click: () => app.quit() }
  ]);
}

function createTray() {
  const iconPath = path.join(__dirname, 'public/tawie.svg');
  // Usually PNG is better for Tray but trying SVG as requested.
  // We'll let Electron handle it or fallback.
  let trayImage;
  try {
    trayImage = nativeImage.createFromPath(iconPath);
  } catch(e) {
    trayImage = nativeImage.createEmpty();
  }
  
  tray = new Tray(trayImage);
  tray.setToolTip('Tawie');
  
  if (process.platform === 'linux') {
    tray.setContextMenu(buildTrayContextMenu());
  } else {
    tray.on('right-click', () => {
      tray.popUpContextMenu(buildTrayContextMenu());
    });
  }
  
  tray.on('click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'public/tawie.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  rebuildMenus();
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile(path.join(__dirname, 'out/index.html'));
  }
}

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();
    createTray();

    app.on('activate', function () {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// IPC Handlers
ipcMain.handle('get-system-info', () => {
  return {
    platform: os.platform(),
    release: os.release(),
    totalmem: os.totalmem(),
    freemem: os.freemem(),
  };
});

ipcMain.handle('get-storage-info', () => {
  try {
    const stat = fs.statfsSync(process.platform === 'win32' ? 'C:\\' : '/');
    return {
      freeBytes: stat.bfree * stat.bsize,
      totalBytes: stat.blocks * stat.bsize,
    };
  } catch (e) {
    return { freeBytes: 10 * 1024 * 1024 * 1024, totalBytes: 10 * 1024 * 1024 * 1024 };
  }
});

ipcMain.handle('check-docker', () => {
  try {
    const result = child_process.execSync('docker -v', { stdio: 'pipe' }).toString();
    return result.toLowerCase().includes('docker version');
  } catch (e) {
    return false;
  }
});

ipcMain.handle('open-external', (event, url) => {
  shell.openExternal(url);
});

ipcMain.handle('docker-pull', (event, image) => {
  return new Promise((resolve, reject) => {
    child_process.exec(`docker pull ${image}`, (error, stdout, stderr) => {
      if (error) {
        reject(error.message);
      } else {
        resolve(stdout);
      }
    });
  });
});

ipcMain.handle('settings:read', () => {
  return readSettings();
});

ipcMain.on('settings:write', (event, patch) => {
  writeSettings(patch);
});

ipcMain.handle('settings:launch-at-startup', () => {
  return app.getLoginItemSettings().openAtLogin;
});

ipcMain.on('settings:set-launch-at-startup', (event, enabled) => {
  app.setLoginItemSettings({ openAtLogin: enabled });
  writeSettings({ launchAtStartup: enabled });
});
