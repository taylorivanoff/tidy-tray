import fs from 'fs/promises';
import path from 'path';
import type { AppSettings } from '../types';

const MEDIA_EXTS = new Set(['mkv', 'mp4', 'avi', 'mov', 'wmv', 'm4v', 'webm']);

export interface StructureIssue {
  kind: 'recurring_folder' | 'invalid_tv_path' | 'invalid_movie_path';
  filePath: string;
  message: string;
}

/** Movie: Title (YYYY).ext at root or one level */
function isValidMoviePath(relativePath: string): boolean {
  const normalized = relativePath.replace(/\\/g, '/');
  const parts = normalized.split('/').filter(Boolean);
  const file = parts[parts.length - 1];
  return Boolean(file.match(/^.+\s\(\d{4}\)\.\w+$/i) || file.match(/^.+\s\(\d{4}\)\s*\(\d+\)\.\w+$/i));
}

/** Detect if path has the same folder name repeated (e.g. Show/Show/Season 01) */
function hasRecurringFolder(relativePath: string): boolean {
  const parts = relativePath.replace(/\\/g, '/').split('/').filter(Boolean);
  const seen = new Set<string>();
  for (const p of parts) {
    const lower = p.toLowerCase();
    if (seen.has(lower)) return true;
    seen.add(lower);
  }
  return false;
}

async function collectMediaFiles(
  dir: string,
  baseDir: string,
  exts: Set<string>,
  maxDepth: number,
  depth: number,
  out: string[]
): Promise<void> {
  if (depth > maxDepth) return;
  let entries: { name: string; isFile: () => boolean; isDirectory: () => boolean }[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    const rel = path.relative(baseDir, full);
    if (e.isDirectory()) {
      await collectMediaFiles(full, baseDir, exts, maxDepth, depth + 1, out);
    } else if (e.isFile()) {
      const ext = e.name.split('.').pop()?.toLowerCase();
      if (ext && exts.has(ext)) out.push(rel);
    }
  }
}

export async function runStructureCheck(
  outputPath: string,
  settings: AppSettings
): Promise<StructureIssue[]> {
  const issues: StructureIssue[] = [];
  const exts = new Set(settings.mediaExtensions.map((e) => e.toLowerCase()));
  if (!outputPath) return issues;

  let dir: string;
  try {
    const stat = await fs.stat(outputPath);
    if (!stat.isDirectory()) return issues;
    dir = outputPath;
  } catch {
    return issues;
  }

  const files: string[] = [];
  await collectMediaFiles(dir, dir, exts, 5, 0, files);

  for (const rel of files) {
    if (hasRecurringFolder(rel)) {
      issues.push({
        kind: 'recurring_folder',
        filePath: path.join(dir, rel),
        message: `Recurring folder name in path: ${rel}`,
      });
    }
    const parts = rel.replace(/\\/g, '/').split('/').filter(Boolean);
    if (parts.length === 1 && !isValidMoviePath(rel)) {
      issues.push({
        kind: 'invalid_movie_path',
        filePath: path.join(dir, rel),
        message: `Root file does not match movie pattern (Title (Year).ext): ${rel}`,
      });
    }
  }

  return issues;
}
