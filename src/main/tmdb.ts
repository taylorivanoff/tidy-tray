const TMDB_BASE = 'https://api.themoviedb.org/3';

interface TmdbMovieResult {
  id: number;
  title: string;
  release_date?: string;
}

interface TmdbTvResult {
  id: number;
  name: string;
  first_air_date?: string;
}

interface TmdbEpisode {
  episode_number: number;
  name: string;
}

interface TmdbSeasonResponse {
  episodes: TmdbEpisode[];
}

const cache = new Map<string, unknown>();

function cacheKey(prefix: string, ...parts: (string | number)[]): string {
  return `${prefix}:${parts.join(':')}`;
}

export async function searchMovie(apiKey: string, query: string): Promise<TmdbMovieResult | null> {
  const key = cacheKey('movie', query);
  const cached = cache.get(key) as TmdbMovieResult | undefined;
  if (cached) return cached;

  const url = `${TMDB_BASE}/search/movie?api_key=${encodeURIComponent(apiKey)}&query=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = (await res.json()) as { results?: TmdbMovieResult[] };
  const first = data.results?.[0] ?? null;
  if (first) cache.set(key, first);
  return first;
}

export async function searchTv(apiKey: string, query: string): Promise<TmdbTvResult | null> {
  const key = cacheKey('tv', query);
  const cached = cache.get(key) as TmdbTvResult | undefined;
  if (cached) return cached;

  const url = `${TMDB_BASE}/search/tv?api_key=${encodeURIComponent(apiKey)}&query=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = (await res.json()) as { results?: TmdbTvResult[] };
  const first = data.results?.[0] ?? null;
  if (first) cache.set(key, first);
  return first;
}

export async function getTvSeason(
  apiKey: string,
  tvId: number,
  seasonNumber: number
): Promise<TmdbEpisode[] | null> {
  const key = cacheKey('season', String(tvId), String(seasonNumber));
  const cached = cache.get(key) as TmdbEpisode[] | undefined;
  if (cached) return cached;

  const url = `${TMDB_BASE}/tv/${tvId}/season/${seasonNumber}?api_key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = (await res.json()) as TmdbSeasonResponse;
  const episodes = data.episodes ?? null;
  if (episodes) cache.set(key, episodes);
  return episodes;
}

export async function testApiKey(apiKey: string): Promise<boolean> {
  if (!apiKey.trim()) return false;
  const url = `${TMDB_BASE}/configuration?api_key=${encodeURIComponent(apiKey.trim())}`;
  const res = await fetch(url);
  return res.ok;
}
