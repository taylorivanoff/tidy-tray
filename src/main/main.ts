import { app, ipcMain, dialog, BrowserWindow } from 'electron';
import path from 'path';
import { createTray } from './tray';
import { createSettingsWindow, showSettingsWindow } from './settings-window';
import { getSettings, setSettings } from './store';
import { startWatcher, stopWatcher } from './watcher';
import { processFile } from './renamer';
import { testApiKey } from './tmdb';
import type { AppSettings } from '../types';

let isQuitting = false;
let splashWindow: BrowserWindow | null = null;

function closeSplash(): void {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.destroy();
    splashWindow = null;
  }
}

function createSplash(splashPath: string): void {
  splashWindow = new BrowserWindow({
    width: 300,
    height: 320,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    webPreferences: { nodeIntegration: false },
  });
  splashWindow.loadFile(splashPath);
  splashWindow.center();
}

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    showSettingsWindow();
  });
}

app.on('before-quit', () => {
  isQuitting = true;
  stopWatcher();
});

app.whenReady().then(() => {
  const appPath = app.getAppPath();
  const iconPath = path.join(appPath, 'resources', 'icon.png');
  const splashPath = path.join(appPath, 'resources', 'splash.html');
  createSplash(splashPath);

  createTray(iconPath, () => {
    const win = createSettingsWindow(() => {});
    win.show();
    win.focus();
  });

  createSettingsWindow(() => {}, () => {
    closeSplash();
  });
  setTimeout(closeSplash, 5000);

  function refreshWatcher(): void {
    const settings = getSettings();
    stopWatcher();
    startWatcher(settings, async (filePath) => {
      try {
        await processFile(filePath, getSettings());
      } catch (err) {
        console.error('Process file error:', err);
      }
    });
  }

  ipcMain.handle('get-settings', () => getSettings());
  ipcMain.handle('set-settings', (_e, settings: Partial<AppSettings>) => {
    setSettings(settings);
    refreshWatcher();
  });
  ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    });
    return result.canceled ? null : result.filePaths[0];
  });
  ipcMain.handle('test-api-key', async (_e, apiKey: string) => testApiKey(apiKey));

  refreshWatcher();
});

app.on('window-all-closed', () => {
  if (!isQuitting) {
    closeSplash();
    (app as unknown as { dock?: { hide?: () => void } }).dock?.hide?.();
  }
});
