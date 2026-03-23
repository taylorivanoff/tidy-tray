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
  const opts: { persistent: boolean; ignoreInitial: boolean; depth: number; usePolling?: boolean; interval?: number } = {
    persistent: true,
    ignoreInitial: true,
    // Keep deeper scanning so nested folders created by previous runs are still picked up.
    depth: 5,
  };
  if (settings.usePolling) {
    opts.usePolling = true;
    opts.interval = Math.max(500, settings.pollingIntervalMs ?? 2000);
  }
  watcher = chokidar.watch(settings.watchPaths, opts);
  const handleCandidate = (filePath: string): void => {
    const ext = filePath.split('.').pop()?.toLowerCase();
    if (ext && exts.has(ext)) {
      onFileAdd(filePath);
    }
  };

  // Polling drivers often surface files as "add" before the writer is done.
  // Handling "change" lets us retry when the file becomes readable/stable.
  watcher.on('add', handleCandidate);
  watcher.on('change', handleCandidate);
}

export function stopWatcher(): void {
  if (watcher) {
    watcher.close();
    watcher = null;
  }
}
