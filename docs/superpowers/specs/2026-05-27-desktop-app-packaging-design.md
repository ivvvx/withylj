# Desktop App Packaging Design

## Goal

Package the Astro static site as a Windows desktop application for offline use, while keeping the web version as fallback for mobile devices.

## Target User

Girlfriend (family/friends), not public distribution. Trust is assumed, no code signing needed for now.

## Architecture

```
src/ (Astro source)
    ├── npm run build
    │     └── dist/ (static files)
    │           ├── Cloudflare Pages (web version)
    │           │     ├── Desktop browser access
    │           │     └── Mobile browser + PWA install
    │           │
    │           └── npx tauri build
    │                 └── .msi installer (Windows desktop app)
    │                       └── Offline use, no internet needed
    │
    └── src-tauri/ (Tauri shell, new)
```

The desktop app and web deployment share the same Astro source. Building is independent — web deploy and desktop package are two separate CI/build paths.

## Implementation Components

### 1. Tauri Desktop App

**Structure:**
- `src-tauri/` — Rust shell (~30 lines of Rust)
- `tauri.conf.json` — Window config, app name, icon, CSP
- Local HTTP server embedded in Rust to serve `dist/` files
- SPA fallback: all unrecognized routes → `index.html`

**Build output:**
- `withylj_0.1.0_x64.msi` (~6-8MB)
- `withylj_0.1.0_x64-setup.exe`

**Key config decisions:**
- Window title: "withylj"
- Fixed window size or maximizable (TBD)
- App icon: reuse favicon or design new one
- Music playback: local audio files must be in `public/`, remote URLs won't work offline

**SPA routing in Tauri:**
The ClientRouter used by Astro requires a server that falls back to `index.html` for unknown routes. Tauri's Rust shell starts a tiny HTTP server on `localhost` that does exactly this — static files served directly, all other paths get `index.html`.

### 2. Cloudflare Pages Migration

**Changes to `astro.config.mjs`:**
- `site`: `https://withylj.pages.dev` (or custom domain)
- `base`: `/` (no subpath)
- `rehypeImg` base path updated accordingly

**CI/CD:**
- Remove old GitHub Actions deploy to Pages
- Cloudflare Pages auto-deploys on push to `main` via GitHub integration
- Build command: `npm run build`, output: `dist/`

### 3. PWA Fallback for Mobile

**New files:**
- `public/manifest.json` — name, icons, display mode
- `public/sw.js` — Service Worker with cache-first strategy

**HTML changes:**
- `<link rel="manifest">` in document `<head>`
- Service Worker registration script

**Cache strategy:**
- First visit: cache all pages, assets, images
- Subsequent visits: serve from cache (offline capable)
- Content update: stale-while-revalidate on next online visit

### 4. Project File Changes Summary

| File | Action |
|------|--------|
| `src-tauri/` (directory) | New |
| `astro.config.mjs` | Modify site/base |
| `public/manifest.json` | New |
| `public/sw.js` | New |
| `src/components/Header.astro` | Add manifest link tag |
| `.github/workflows/deploy.yml` | Remove (Cloudflare replaces) |
| `package.json` | Add `tauri` script |

## Build & Distributon Flow

```
1. npm run build          → dist/  (Astro build)
2. npx tauri build        → .msi   (Tauri bundle)
3. Zip .msi → send via WeChat/cloud drive
4. Recipient unzips, double-clicks .msi to install
5. App runs offline, no server needed
```

## PWA User Flow (Mobile)

```
1. Open URL in mobile browser (first time needs internet)
2. Page loads → everything cached by Service Worker
3. Browser prompts "Add to Home Screen"
4. After install → opens like an app, works offline
5. Content updates auto-fetch on next online visit
```

## Out of Scope

- Code signing certificate (only needed for public distribution)
- iOS/macOS packaging (requires Apple Developer account + Mac)
- Auto-updater (manual reinstall for content updates is fine for this use case)
- Android APK packaging via Tauri (complex, PWA covers mobile well enough)
