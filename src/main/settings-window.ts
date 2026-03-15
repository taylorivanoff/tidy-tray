import { app, BrowserWindow, screen } from 'electron';
import path from 'path';
import { getWindowBounds, setWindowBounds } from './store';

let settingsWindow: BrowserWindow | null = null;

const DEFAULT_WIDTH = 580;
const DEFAULT_HEIGHT = 720;

function getValidatedBounds(): { width: number; height: number; x?: number; y?: number } {
  const saved = getWindowBounds();
  const defaults = { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT };
  if (!saved?.width || !saved?.height) return defaults;
  const displays = screen.getAllDisplays();
  const inBounds = displays.some((d) => {
    const { x, y, width, height } = d.bounds;
    return (
      saved.x != null &&
      saved.y != null &&
      saved.x >= x &&
      saved.x < x + width &&
      saved.y >= y &&
      saved.y < y + height
    );
  });
  return inBounds
    ? { width: saved.width, height: saved.height, x: saved.x, y: saved.y }
    : defaults;
}

export function getSettingsWindow(): BrowserWindow | null {
  return settingsWindow;
}

export function createSettingsWindow(
  onClose: () => void,
  onReady?: () => void
): BrowserWindow {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.show();
    settingsWindow.focus();
    return settingsWindow;
  }

  const bounds = getValidatedBounds();
  const preloadPath = path.join(__dirname, '..', 'preload', 'preload.js');
  settingsWindow = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    minWidth: 480,
    minHeight: 520,
    show: false,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });

  settingsWindow.on('close', (event) => {
    const win = settingsWindow;
    if (win && !win.isDestroyed()) {
      event.preventDefault();
      win.hide();
      onClose();
    }
  });

  settingsWindow.on('resize', () => {
    const win = settingsWindow;
    if (win && !win.isDestroyed() && !win.isMinimized() && !win.isMaximized()) {
      setWindowBounds(win.getBounds());
    }
  });
  settingsWindow.on('move', () => {
    const win = settingsWindow;
    if (win && !win.isDestroyed() && !win.isMinimized() && !win.isMaximized()) {
      setWindowBounds(win.getBounds());
    }
  });

  const appPath = app.getAppPath();
  const settingsHtml = path.join(appPath, 'src', 'renderer', 'settings.html');
  settingsWindow.loadFile(settingsHtml);

  if (onReady) {
    settingsWindow.webContents.once('did-finish-load', () => {
      onReady();
    });
  }

  return settingsWindow;
}

export function showSettingsWindow(): void {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.show();
    settingsWindow.focus();
  }
}
