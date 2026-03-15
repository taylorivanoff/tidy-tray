import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { getLogs, setOnNewEntry } from './logger';

let logWindow: BrowserWindow | null = null;

function sendToLogWindow(channel: string, ...args: unknown[]): void {
  if (logWindow && !logWindow.isDestroyed() && logWindow.webContents) {
    logWindow.webContents.send(channel, ...args);
  }
}

export function getLogWindow(): BrowserWindow | null {
  return logWindow;
}

export function createOrShowLogWindow(): void {
  if (logWindow && !logWindow.isDestroyed()) {
    logWindow.show();
    logWindow.focus();
    return;
  }

  const appPath = app.getAppPath();
  const preloadPath = path.join(__dirname, '..', 'preload', 'log-preload.js');
  const logHtmlPath = path.join(appPath, 'src', 'renderer', 'log.html');

  logWindow = new BrowserWindow({
    width: 700,
    height: 400,
    minWidth: 400,
    minHeight: 200,
    title: 'Tidy Tray – Console',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  setOnNewEntry((entry) => sendToLogWindow('log', entry));

  const onLogRequest = (): void => sendToLogWindow('log-init', getLogs());
  ipcMain.on('log-request', onLogRequest);

  logWindow.on('closed', () => {
    logWindow = null;
    setOnNewEntry(null);
    ipcMain.removeListener('log-request', onLogRequest);
  });

  logWindow.loadFile(logHtmlPath);
}
