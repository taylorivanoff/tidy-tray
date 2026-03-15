import fs from 'fs/promises';
import path from 'path';
import type { AppSettings, ParsedFile } from '../types';
import * as tmdb from './tmdb';
import { parseFilename } from './parser';

function sanitizeFileName(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, '').trim() || 'Unknown';
}

function pad(n: number, len = 2): string {
  return String(n).padStart(len, '0');
}

function applyTemplate(
  template: string,
  vars: Record<string, string | number>
): string {
  let out = template;
  for (const [k, v] of Object.entries(vars)) {
    out = out.replace(new RegExp(`\\{${k}\\}`, 'gi'), String(v));
  }
  return out;
}

export async function processFile(
  filePath: string,
  settings: AppSettings
): Promise<{ success: boolean; destPath?: string; error?: string }> {
  const parsed = parseFilename(filePath);
  if (!parsed) {
    return { success: false, error: 'Could not parse filename' };
  }

  const apiKey = settings.apiKey?.trim();
  if (!apiKey) return { success: false, error: 'TMDB API key not set' };

  const baseOut = settings.outputPath || path.dirname(filePath);

  if (parsed.type === 'tv') {
    const show = await tmdb.searchTv(apiKey, parsed.title);
    if (!show) return { success: false, error: `No TV show found: ${parsed.title}` };

    const episodes = await tmdb.getTvSeason(apiKey, show.id, parsed.season!);
    const episodeTitle =
      episodes?.find((e) => e.episode_number === parsed.episode)?.name ?? `Episode ${parsed.episode}`;

    const showName = sanitizeFileName(show.name);
    const fullRelative = applyTemplate(settings.tvTemplate, {
      show: showName,
      s: pad(parsed.season!),
      e: pad(parsed.episode!),
      title: sanitizeFileName(episodeTitle),
      ext: parsed.extension,
    });
    const destPath = path.join(baseOut, fullRelative);
    const destDir = path.dirname(destPath);

    if (settings.dryRun) {
      return { success: true, destPath };
    }

    await fs.mkdir(destDir, { recursive: true });
    let finalPath = destPath;
    let counter = 1;
    while (true) {
      try {
        await fs.access(finalPath);
        const ext = path.extname(destPath);
        const base = destPath.slice(0, -ext.length);
        finalPath = `${base} (${counter})${ext}`;
        counter++;
      } catch {
        break;
      }
    }
    await fs.rename(filePath, finalPath);
    return { success: true, destPath: finalPath };
  }

  // movie
  const movie = await tmdb.searchMovie(apiKey, parsed.title);
  if (!movie) return { success: false, error: `No movie found: ${parsed.title}` };

  const year = parsed.year ?? (movie.release_date ? parseInt(movie.release_date.slice(0, 4), 10) : 0);
  const title = sanitizeFileName(movie.title);
  const destFileName = applyTemplate(settings.movieTemplate, {
    title,
    year: year || 'Unknown',
    ext: parsed.extension,
  });
  const destPath = path.join(baseOut, destFileName);

  if (settings.dryRun) {
    return { success: true, destPath };
  }

  await fs.mkdir(baseOut, { recursive: true });
  let finalPath = destPath;
  let counter = 1;
  while (true) {
    try {
      await fs.access(finalPath);
      const ext = path.extname(destPath);
      const base = destPath.slice(0, -ext.length);
      finalPath = `${base} (${counter})${ext}`;
      counter++;
    } catch {
      break;
    }
  }
  await fs.rename(filePath, finalPath);
  return { success: true, destPath: finalPath };
}
