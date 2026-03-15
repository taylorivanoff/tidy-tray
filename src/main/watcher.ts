import chokidar, { type FSWatcher } from 'chokidar';
import type { AppSettings } from '../types';

export type FileAddCallback = (filePath: string) => void;

let watcher: FSWatcher | null = null;

export function startWatcher(
  settings: AppSettings,
  onFileAdd: FileAddCallback
): void {
  stopWatcher();
  if (!settings.watcherEnabled || settings.watchPaths.length === 0) return;

  const exts = new Set(settings.mediaExtensions.map((e) => e.toLowerCase()));
  watcher = chokidar.watch(settings.watchPaths, {
    persistent: true,
    ignoreInitial: true,
    depth: 2,
  });
  watcher.on('add', (filePath: string) => {
    const ext = filePath.split('.').pop()?.toLowerCase();
    if (ext && exts.has(ext)) {
      onFileAdd(filePath);
    }
  });
}

export function stopWatcher(): void {
  if (watcher) {
    watcher.close();
    watcher = null;
  }
}
