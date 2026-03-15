import { app, ipcMain, dialog, BrowserWindow, Menu } from 'electron';
import path from 'path';
import { createTray, destroyTray, setTrayMenu } from './tray';
import { createSettingsWindow, showSettingsWindow, getSettingsWindow } from './settings-window';
import { createOrShowLogWindow, getLogWindow } from './log-window';
import { getSettings, setSettings } from './store';
import { startWatcher, stopWatcher } from './watcher';
import { processFile } from './renamer';
import { getFilesToProcess } from './manual-run';
import { testApiKey } from './tmdb';
import { addLog } from './logger';
import { addProcessedRecord, wasProcessed, getProcessedRecords } from './processed-db';
import { runStructureCheck } from './structure-checker';
import type { AppSettings } from '../types';

let isQuitting = false;
let splashWindow: BrowserWindow | null = null;
let structureCheckTimer: ReturnType<typeof setInterval> | null = null;

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
  if (structureCheckTimer) { clearInterval(structureCheckTimer); structureCheckTimer = null; }
  stopWatcher();
  closeSplash();
  const win = getSettingsWindow();
  if (win && !win.isDestroyed()) win.destroy();
  const logWin = getLogWindow();
  if (logWin && !logWin.isDestroyed()) logWin.destroy();
  destroyTray();
});

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  const appPath = app.getAppPath();
  const iconPath = path.join(appPath, 'resources', 'icon.png');
  const splashPath = path.join(appPath, 'resources', 'splash.html');
  createSplash(splashPath);

  async function runManualProcess(): Promise<{ processed: number; errors: number }> {
    const settings = getSettings();
    if (!settings.apiKey?.trim()) {
      addLog('error', 'Manual run: TMDB API key not set.');
      return { processed: 0, errors: 1 };
    }
    if (settings.watchPaths.length === 0) {
      addLog('warn', 'Manual run: No watch folders configured.');
      return { processed: 0, errors: 0 };
    }
    const files = await getFilesToProcess(settings);
    addLog('info', `Manual run: Found ${files.length} file(s) in watch folders.`);
    let processed = 0;
    let errors = 0;
    for (const filePath of files) {
      try {
        if (wasProcessed(filePath)) {
          addLog('info', `Skipped (already processed): ${filePath}`);
          continue;
        }
        const result = await processFile(filePath, getSettings());
        if (result.success && result.destPath) {
          const verb = getSettings().dryRun ? 'Would rename' : 'Renamed';
          addLog('info', `${verb}: ${filePath} → ${result.destPath}`);
          if (!getSettings().dryRun) {
            addProcessedRecord({
              sourcePath: filePath,
              destPath: result.destPath,
              processedAt: new Date().toISOString(),
              type: result.type ?? (result.showName ? 'tv' : 'movie'),
              showName: result.showName,
              season: result.season,
              episode: result.episode,
              movieTitle: result.movieTitle,
              year: result.year,
            });
          }
          processed++;
        } else {
          addLog('error', `${filePath}: ${result.error ?? 'Unknown error'}`);
          errors++;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        addLog('error', `${filePath}: ${msg}`);
        errors++;
      }
    }
    addLog('info', `Manual run done: ${processed} processed, ${errors} error(s).`);
    return { processed, errors };
  }

  function toggleWatching(): void {
    const next = !getSettings().watcherEnabled;
    setSettings({ watcherEnabled: next });
    refreshWatcher();
    addLog('info', next ? 'Folder watching started.' : 'Folder watching paused.');
    setTrayMenu(getTrayMenuTemplate());
  }

  async function runStructureCheckNow(): Promise<void> {
    const settings = getSettings();
    const outputPath = settings.outputPath?.trim();
    if (!outputPath) {
      addLog('warn', 'Structure check: No output folder configured.');
      return;
    }
    addLog('info', 'Structure check running...');
    const issues = await runStructureCheck(outputPath, settings);
    if (issues.length === 0) {
      addLog('info', 'Structure check: No issues found.');
    } else {
      for (const i of issues) {
        addLog('warn', `Structure: [${i.kind}] ${i.message}`);
      }
      addLog('warn', `Structure check: ${issues.length} issue(s) found.`);
    }
  }

  function scheduleStructureCheck(): void {
    if (structureCheckTimer) clearInterval(structureCheckTimer);
    structureCheckTimer = null;
    const settings = getSettings();
    const interval = settings.structureCheckIntervalMs ?? 30 * 60 * 1000;
    if (interval > 0 && settings.outputPath?.trim()) {
      structureCheckTimer = setInterval(() => void runStructureCheckNow(), interval);
    }
  }

  function getTrayMenuTemplate() {
    const watching = getSettings().watcherEnabled;
    return [
      { label: 'Open Settings', click: () => { const win = createSettingsWindow(() => {}); win.show(); win.focus(); } },
      { label: 'Show Console', click: () => createOrShowLogWindow() },
      { label: 'Process watch folders now', click: () => void runManualProcess() },
      { label: watching ? 'Pause watching' : 'Resume watching', click: () => toggleWatching() },
      { label: 'Check structure', click: () => void runStructureCheckNow() },
      { type: 'separator' as const },
      { label: 'Quit', click: () => app.quit() },
    ];
  }

  createTray(iconPath, getTrayMenuTemplate, () => {
    const win = createSettingsWindow(() => {});
    win.show();
    win.focus();
  });

  createSettingsWindow(() => {}, () => {
    closeSplash();
    const settings = getSettings();
    if (!settings.apiKey?.trim() || settings.watchPaths.length === 0) {
      showSettingsWindow();
    }
  });
  setTimeout(closeSplash, 5000);

  function refreshWatcher(): void {
    const settings = getSettings();
    stopWatcher();
    startWatcher(settings, async (filePath) => {
      try {
        if (wasProcessed(filePath)) {
          addLog('info', `Skipped (already processed): ${filePath}`);
          return;
        }
        const result = await processFile(filePath, getSettings());
        if (result.success && result.destPath) {
          const verb = getSettings().dryRun ? 'Would rename' : 'Renamed';
          addLog('info', `${verb}: ${filePath} → ${result.destPath}`);
          if (!getSettings().dryRun) {
            addProcessedRecord({
              sourcePath: filePath,
              destPath: result.destPath,
              processedAt: new Date().toISOString(),
              type: result.type ?? (result.showName ? 'tv' : 'movie'),
              showName: result.showName,
              season: result.season,
              episode: result.episode,
              movieTitle: result.movieTitle,
              year: result.year,
            });
          }
        } else {
          addLog('error', `${filePath}: ${result.error ?? 'Unknown error'}`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        addLog('error', `${filePath}: ${msg}`);
      }
    });
  }

  ipcMain.handle('get-settings', () => getSettings());
  ipcMain.handle('set-settings', (_e, settings: Partial<AppSettings>) => {
    setSettings(settings);
    refreshWatcher();
    scheduleStructureCheck();
  });
  ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    });
    return result.canceled ? null : result.filePaths[0];
  });
  ipcMain.handle('test-api-key', async (_e, apiKey: string) => testApiKey(apiKey));
  ipcMain.handle('run-manual', async () => runManualProcess());
  ipcMain.handle('run-structure-check', () => runStructureCheckNow());
  ipcMain.handle('get-processed-records', () => getProcessedRecords());

  refreshWatcher();
  scheduleStructureCheck();
  addLog('info', 'Tidy Tray started. Open Console from the tray to see log output.');
});

app.on('window-all-closed', () => {
  if (!isQuitting) {
    closeSplash();
    (app as unknown as { dock?: { hide?: () => void } }).dock?.hide?.();
  }
});
