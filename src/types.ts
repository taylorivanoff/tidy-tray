export interface AppSettings {
  apiKey: string;
  watchPaths: string[];
  tvTemplate: string;
  movieTemplate: string;
  outputPath: string;
  watcherEnabled: boolean;
  dryRun: boolean;
  mediaExtensions: string[];
}

export const DEFAULT_SETTINGS: AppSettings = {
  apiKey: '',
  watchPaths: [],
  tvTemplate: '{show}/Season {s}/{show} - S{s}E{e} - {title}.{ext}',
  movieTemplate: '{title} ({year}).{ext}',
  outputPath: '',
  watcherEnabled: true,
  dryRun: false,
  mediaExtensions: ['mkv', 'mp4', 'avi', 'mov', 'wmv', 'm4v', 'webm'],
};

export interface ParsedFile {
  type: 'tv' | 'movie';
  title: string;
  season?: number;
  episode?: number;
  year?: number;
  extension: string;
}
