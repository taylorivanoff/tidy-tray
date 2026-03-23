import { app, BrowserWindow, ipcMain, type WebContents } from 'electron';
import path from 'path';
import { getLogs, setOnNewEntry } from './logger';

let logWindow: BrowserWindow | null = null;

const logSinks = new Set<WebContents>();
let streamingInitialized = false;

function sendToSinks(channel: string, ...args: unknown[]): void {
  for (const sink of logSinks) {
    if (!sink.isDestroyed()) sink.send(channel, ...args);
  }
}

export function initLogStreaming(): void {
  if (streamingInitialized) return;
  streamingInitialized = true;

  setOnNewEntry((entry) => {
    sendToSinks('log', entry);
  });

  ipcMain.on('log-request', (event) => {
    const sender = event.sender;
    logSinks.add(sender);
    sender.once('destroyed', () => logSinks.delete(sender));
    sender.send('log-init', getLogs());
  });
}

export function getLogWindow(): BrowserWindow | null {
  return logWindow;
}

export function createOrShowLogWindow(): void {
  initLogStreaming();
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

  logWindow.on('closed', () => {
    logWindow = null;
  });

  logWindow.loadFile(logHtmlPath);
}
