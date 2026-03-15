# Tidy Tray

**Organize movies and TV shows from your system tray.** A free, open-source alternative to FileBot, TinyMediaManager, Sonarr/Radarr, TVRename, mNamr and other media renamers. Runs in the background, watches your folders, and renames files using [The Movie Database (TMDB)](https://www.themoviedb.org)—no subscription, no GUI clutter.

---

## Why Tidy Tray?

| | Tidy Tray | FileBot | Bulk renamers |
|--|-----------|---------|----------------|
| **Price** | Free, open source | Paid license | Varies |
| **Runs in background** | Yes (system tray) | Manual / scheduled | Manual |
| **Metadata source** | TMDB (free API) | Multiple (some paid) | Often none |
| **Episode titles** | Yes | Yes | Rarely |
| **Custom templates** | Yes | Yes | Sometimes |
| **Dry run** | Yes | Yes | Sometimes |

If you’re tired of paying for FileBot or running one-off renamers by hand, Tidy Tray gives you automatic, TMDB-powered renaming that stays out of the way until you need to change settings.

---

## Features

- **System tray only** — No main window. Open Settings from the tray when you need to configure; the rest of the time it just watches and renames.
- **Automatic watching** — Add a folder, drop in files like `Show.Name.S01E05.1080p.mkv`, and they’re renamed and moved into a proper structure with real episode titles.
- **TV shows** → e.g. `Show Name/Season 01/Show Name - S01E05 - Episode Title.mkv`
- **Movies** → e.g. `Movie Name (2024).mkv`
- **Configurable templates** — Control folder and filename patterns (placeholders: `{show}`, `{s}`, `{e}`, `{title}`, `{year}`, `{ext}`).
- **Dry run** — Log what would be renamed without moving files.
- **TMDB** — Same database used by Plex, Kodi, and others; one free API key is all you need.

---

## Quick start

### 1. Get a TMDB API key (free)

1. Create an account at [themoviedb.org](https://www.themoviedb.org).
2. Go to **Settings → API** and request an API key (choose “Developer”).
3. Copy your **API Key (v3 auth)**.

### 2. Install and run

**From source (Node.js required):**

```bash
git clone https://github.com/yourusername/tidy-tray.git
cd tidy-tray
npm install
npm start
```

**Windows:** After `npm run release`, find the installer in the `dist/` folder.

### 3. Configure

1. Right-click the tray icon → **Open Settings**.
2. Paste your TMDB API key and click **Test**.
3. Click **Add folder** and choose the directory where you download or save new media (e.g. `Downloads` or an incoming folder).
4. Optionally set an **Output folder** (if empty, files are renamed in place).
5. Click **Save**.

New video files (e.g. `.mkv`, `.mp4`, `.avi`) that match common patterns (`S01E05`, `1x05`, or a movie name with a year) will be renamed and moved automatically.

---

## Filename patterns

Tidy Tray detects:

- **TV:** `Show.Name.S01E05.*`, `Show.Name.1x05.*`, `Show Name s01e05 …`
- **Movies:** `Movie.Name.2024.*` or similar with a 4-digit year

The part before the season/episode or year is used as the search query for TMDB.

---

## Templates

**TV** (default): `{show}/Season {s}/{show} - S{s}E{e} - {title}.{ext}`

- `{show}` — Show name  
- `{s}` — Season (zero-padded)  
- `{e}` — Episode (zero-padded)  
- `{title}` — Episode title from TMDB  
- `{ext}` — File extension  

**Movie** (default): `{title} ({year}).{ext}`

- `{title}` — Movie title  
- `{year}` — Release year  
- `{ext}` — File extension  

Change these in Settings to match your preferred layout.

---

## Scripts

| Command | Description |
|--------|-------------|
| `npm start` | Build and run the app |
| `npm run build` | Compile TypeScript only |
| `npm run release` | Build Windows installer (NSIS) |

---

## Tech stack

- [Electron](https://www.electronjs.org/) — Cross-platform desktop
- [TMDB API](https://www.themoviedb.org/documentation/api) — Movie and TV metadata
- [chokidar](https://github.com/paulmillr/chokidar) — Folder watching
- [electron-store](https://github.com/sindresorhus/electron-store) — Settings persistence

---

## Attribution

This product uses the [TMDB API](https://www.themoviedb.org/documentation/api) but is not endorsed or certified by TMDB.

---

## License

MIT — use it, change it, ship it. See [LICENSE](LICENSE) for details.
