const {
  app,
  BrowserWindow,
  ipcMain,
  Tray,
  Menu,
  nativeImage,
} = require('electron');
const path = require('path');
const fs = require('fs');

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

app.on('second-instance', () => {
  showMainWindow();
});

const {
  openAtkAcpi,
  forcePerformanceMode,
  closeAtkHandle,
} = require('./fan-core');

/** Fallback if assets/tray.png is missing (16×16) */
const TRAY_PNG_FALLBACK = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAA/klEQVQ4EZWSsQ3CQAxFnwnQIKyARBkBE3AQByEjMAI7sAMLsAI7pKUkkpK0bgsB7OU+cOKw/PvLO74A6MkqEhM8DyPCHB+YblGwYjTiyDBv8AthAFwR8zEwDxXcAsAGOAFljgGog+eIoAVMY2MG1huCzM3surw1b28WFoT/uTC7K3VCUUtKKW9Btbm7YQHGE1CgrT1i4GaD8zgiTEm5XQZbYN4DeIsOsBx+T9rOsI0W+D4mAn1NyFBrz1VVtL+2UUydNvLi2YOXVVwWOIM0LHULnm3RAh+ARMG5bI3QeXDXDazwP9jvn/p/kSYD8gEYN/Xyq8EC8QAAAABJRU5ErkJggg==',
  'base64'
);

let mainWindow = null;
let tray = null;
let atkHandle = null;
let intervalId = null;
let isQuitting = false;

const TRAY_DISPLAY_SIZE = 32;
const WINDOW_ICON_MAX = 256;

function loadPngFromAssets() {
  const assetPath = path.join(__dirname, 'assets', 'tray.png');
  if (!fs.existsSync(assetPath)) {
    return null;
  }
  const img = nativeImage.createFromPath(assetPath);
  return img.isEmpty() ? null : img;
}

function trayIconImage() {
  const img = loadPngFromAssets();
  if (img) {
    const { width, height } = img.getSize();
    if (width > TRAY_DISPLAY_SIZE || height > TRAY_DISPLAY_SIZE) {
      return img.resize({
        width: TRAY_DISPLAY_SIZE,
        height: TRAY_DISPLAY_SIZE,
        quality: 'best',
      });
    }
    return img;
  }
  return nativeImage.createFromBuffer(TRAY_PNG_FALLBACK);
}

/** Taskbar / window title icon (same asset as tray, larger) */
function windowIconImage() {
  const img = loadPngFromAssets();
  if (img) {
    const { width, height } = img.getSize();
    const maxDim = Math.max(width, height);
    if (maxDim > WINDOW_ICON_MAX) {
      const scale = WINDOW_ICON_MAX / maxDim;
      return img.resize({
        width: Math.round(width * scale),
        height: Math.round(height * scale),
        quality: 'best',
      });
    }
    return img;
  }
  return nativeImage.createFromBuffer(TRAY_PNG_FALLBACK);
}

function showMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    createWindow();
    return;
  }
  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }
  mainWindow.setSkipTaskbar(false);
  mainWindow.show();
  mainWindow.focus();
}

function buildTrayMenu() {
  return Menu.buildFromTemplate([
    {
      label: 'Show window',
      click: () => showMainWindow(),
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true;
        stopFanService();
        app.quit();
      },
    },
  ]);
}

function createTray() {
  if (tray) return;
  tray = new Tray(trayIconImage());
  tray.setToolTip('Vivobook performance force');
  tray.setContextMenu(buildTrayMenu());
  tray.on('click', () => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      createWindow();
      return;
    }
    if (mainWindow.isVisible()) {
      mainWindow.hide();
      mainWindow.setSkipTaskbar(true);
    } else {
      showMainWindow();
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 380,
    autoHideMenuBar: true,
    show: true,
    icon: windowIconImage(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'gui', 'index.html'));

  mainWindow.on('close', (e) => {
    if (isQuitting) return;
    e.preventDefault();
    mainWindow.hide();
    mainWindow.setSkipTaskbar(true);
  });
}

function stopFanService() {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
  if (atkHandle) {
    closeAtkHandle(atkHandle);
    atkHandle = null;
  }
}

function tick(mode) {
  if (!atkHandle) return;
  const res = forcePerformanceMode(atkHandle, mode);
  const ok = res !== 0;
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('fan:tick', {
      ok,
      time: new Date().toLocaleTimeString(),
    });
  }
}

ipcMain.handle('fan:start', (_event, mode) => {
  if (atkHandle) {
    return { ok: false, error: 'already_running' };
  }
  const handle = openAtkAcpi();
  if (!handle) {
    return { ok: false, error: 'admin_or_device' };
  }
  atkHandle = handle;
  const m = Number(mode);
  tick(m);
  intervalId = setInterval(() => tick(m), 10000);
  return { ok: true };
});

ipcMain.handle('fan:stop', () => {
  stopFanService();
  return { ok: true };
});

app.whenReady().then(() => {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.local.vivobook-fan-gui');
  }
  createTray();
  createWindow();
});

app.on('window-all-closed', () => {
  /* Keep running in the system tray */
});

app.on('before-quit', () => {
  isQuitting = true;
  stopFanService();
  if (tray) {
    tray.destroy();
    tray = null;
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else {
    showMainWindow();
  }
});
