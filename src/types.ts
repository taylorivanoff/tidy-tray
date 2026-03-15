export interface AppSettings {
  apiKey: string;
  watchPaths: string[];
  tvTemplate: string;
  movieTemplate: string;
  outputPath: string;
  watcherEnabled: boolean;
  usePolling: boolean;
  pollingIntervalMs: number;
  dryRun: boolean;
  mediaExtensions: string[];
  structureCheckIntervalMs: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  apiKey: '',
  watchPaths: [],
  tvTemplate: '{show}/Season {s}/{show} - S{s}E{e} - {title}.{ext}',
  movieTemplate: '{title} ({year}).{ext}',
  outputPath: '',
  watcherEnabled: true,
  usePolling: false,
  pollingIntervalMs: 2000,
  dryRun: false,
  mediaExtensions: ['mkv', 'mp4', 'avi', 'mov', 'wmv', 'm4v', 'webm'],
  structureCheckIntervalMs: 30 * 60 * 1000,
};

export interface ParsedFile {
  type: 'tv' | 'movie';
  title: string;
  season?: number;
  episode?: number;
  year?: number;
  extension: string;
}

export interface ProcessedRecord {
  sourcePath: string;
  destPath: string;
  processedAt: string;
  type: 'tv' | 'movie';
  showName?: string;
  season?: number;
  episode?: number;
  movieTitle?: string;
  year?: number;
}
