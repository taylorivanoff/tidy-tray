import fs from 'fs/promises';
import path from 'path';
import type { Dirent } from 'fs';
import type { AppSettings } from '../types';

/**
 * Recursively find media files in dir up to maxDepth (1 = top-level only, 2 = one subdir).
 */
async function findMediaFiles(
  dir: string,
  exts: Set<string>,
  maxDepth: number,
  currentDepth: number
): Promise<string[]> {
  if (currentDepth > maxDepth) return [];
  const out: string[] = [];
  let entries: Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      const sub = await findMediaFiles(full, exts, maxDepth, currentDepth + 1);
      out.push(...sub);
    } else if (e.isFile()) {
      const ext = e.name.split('.').pop()?.toLowerCase();
      if (ext && exts.has(ext)) out.push(full);
    }
  }
  return out;
}

export async function getFilesToProcess(settings: AppSettings): Promise<string[]> {
  const exts = new Set(settings.mediaExtensions.map((e) => e.toLowerCase()));
  const all: string[] = [];
  for (const watchPath of settings.watchPaths) {
    // Use a deeper scan so already-recursed folders from earlier runs get fixed.
    const files = await findMediaFiles(watchPath, exts, 5, 0);
    all.push(...files);
  }
  return all;
}
