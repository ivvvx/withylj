# Desktop App Packaging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Package the Astro static site as a Tauri desktop app + migrate web hosting to Cloudflare Pages + add PWA fallback.

**Architecture:** Same Astro source produces both the web deployment (Cloudflare Pages) and the desktop app (Tauri). PWA manifest + Service Worker provide offline-capable mobile fallback. The Tauri app embeds a local HTTP server to serve static files with SPA routing.

**Tech Stack:** Astro 6, Tauri v2 (Rust), Cloudflare Pages, PWA (manifest + Service Worker)

---

### Task 1: Migrate to Cloudflare Pages

**Files:**
- Modify: `astro.config.mjs`
- Modify: `src/plugins/rehype-img.mjs`
- Delete: `.github/workflows/deploy.yml`

- [ ] **Step 1: Update astro.config.mjs — change site and base**

Replace the `site` and `base` values:

```js
// astro.config.mjs
export default defineConfig({
  // ... other config stays same
  site: 'https://withylj.pages.dev',
  base: '/',
  // ...
});
```

- [ ] **Step 2: Fix rehype-img.mjs — normalize imgPath check for base '/'**

The `imgPath` loses its leading `/` when `base` is `/`, causing the `/images/` guard to skip all images. Fix:

```js
// src/plugins/rehype-img.mjs — update the imgPath + startsWith guard
export function rehypeImg(base) {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'img' || !node.properties.src) return;

      let src = node.properties.src;
      if (typeof src !== 'string') return;

      if (src.startsWith('/') && !src.startsWith(base)) {
        src = base + src;
        node.properties.src = src;
      }

      const rawPath = src.startsWith(base) ? src.slice(base.length) : src;
      const imgPath = rawPath.startsWith('/') ? rawPath : '/' + rawPath;
      if (!imgPath.startsWith('/images/')) return;

      const lastDot = src.lastIndexOf('.');
      if (lastDot === -1) return;
      const nameWithoutExt = src.substring(0, lastDot);

      node.properties.srcset = [
        `${nameWithoutExt}-400w.webp 400w`,
        `${nameWithoutExt}-800w.webp 800w`,
        `${nameWithoutExt}-1200w.webp 1200w`,
      ].join(', ');

      node.properties.sizes = '(max-width: 600px) 400px, (max-width: 1200px) 800px, 1200px';
      node.properties.loading = 'lazy';
      node.properties.decoding = 'async';
      node.properties.fetchpriority = 'low';
    });
  };
}
```

- [ ] **Step 3: Delete GitHub Pages deploy workflow**

```bash
rm .github/workflows/deploy.yml
```

- [ ] **Step 4: Build and verify no errors**

```bash
npm run build
```

Expected: build succeeds with no errors, `dist/` has all pages and images.

- [ ] **Step 5: Commit**

```bash
git add astro.config.mjs src/plugins/rehype-img.mjs
git rm .github/workflows/deploy.yml
git commit -m "refactor: migrate site config for Cloudflare Pages"
```

---

### Task 2: Add PWA Support

**Files:**
- Create: `public/manifest.json`
- Create: `public/sw.js`
- Modify: `src/layouts/BaseLayout.astro`

- [ ] **Step 1: Create manifest.json**

```json
{
  "name": "With Ylj",
  "short_name": "withylj",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#ec4899",
  "description": "记录我们的点滴日常",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

- [ ] **Step 2: Create sw.js with cache-first strategy**

```js
const CACHE = 'withylj-v1'
const ASSETS = [
  '/',
  '/about/',
  '/albums/',
  '/timeline/',
]

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS))
  )
})

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fetchPromise = fetch(e.request).then((response) => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE).then((cache) => cache.put(e.request, clone))
        }
        return response
      })
      return cached || fetchPromise
    })
  )
})
```

- [ ] **Step 3: Add manifest link and Service Worker registration to BaseLayout.astro**

Insert these two lines into `<head>`, after the existing `<meta>` tags:

```astro
<link rel="manifest" href="/manifest.json" />
```

Insert this script at the end of `<head>`, after the existing inline theme script:

```html
<script is:inline>
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
  }
</script>
```

The full `<head>` should look like:

```astro
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content={description} />
  <link rel="manifest" href="/manifest.json" />
  <title>{title} — With Ylj</title>
  <ClientRouter />
  <script is:inline>
    (function() {
      var theme = localStorage.getItem('theme');
      if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
      }
    })();
  </script>
  <script is:inline>
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');
    }
  </script>
</head>
```

- [ ] **Step 4: Commit**

```bash
git add public/manifest.json public/sw.js src/layouts/BaseLayout.astro
git commit -m "feat: add PWA support with offline cache"
```

---

### Task 3: Generate App Icons

**Files:**
- Create: `src-tauri/icons/` (directory)
- Modify: `package.json` (add icon generation script)

- [ ] **Step 1: Install sharp for icon generation**

sharp 已在 devDependencies 中，此步跳过。

- [ ] **Step 2: Create icon generation script**

Create `scripts/generate-icons.mjs`:

```js
import sharp from 'sharp'
import { mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const iconsDir = join(__dirname, '..', 'src-tauri', 'icons')
const svgPath = join(__dirname, '..', 'public', 'favicon.svg')

mkdirSync(iconsDir, { recursive: true })

const sizes = {
  '32x32.png': 32,
  '128x128.png': 128,
  '128x128@2x.png': 256,
  'icon.ico': 32,
}

for (const [filename, size] of Object.entries(sizes)) {
  const outPath = join(iconsDir, filename)
  if (filename === 'icon.ico') {
    // Generate PNG first, then save as ICO (sharp can't output ico directly,
    // but rename works since Windows accepts PNG data in ico extension for modern apps)
    await sharp(svgPath).resize(size, size).png().toFile(outPath)
  } else {
    await sharp(svgPath).resize(size, size).png().toFile(outPath)
  }
}

// Also generate PWA icons
await sharp(svgPath).resize(192, 192).png().toFile(join(__dirname, '..', 'public', 'icon-192.png'))
await sharp(svgPath).resize(512, 512).png().toFile(join(__dirname, '..', 'public', 'icon-512.png'))

console.log('Icons generated')
```

- [ ] **Step 3: Add icon script to package.json**

在 `scripts` 中添加：

```json
"generate-icons": "node scripts/generate-icons.mjs"
```

- [ ] **Step 4: Run icon generation**

```bash
npm run generate-icons
```

- [ ] **Step 5: Commit**

```bash
git add scripts/generate-icons.mjs package.json src-tauri/icons/ public/icon-192.png public/icon-512.png
git commit -m "feat: generate app icons from favicon"
```

---

### Task 4: Initialize Tauri Project

**Files:**
- Create: `src-tauri/Cargo.toml`
- Create: `src-tauri/build.rs`
- Create: `src-tauri/tauri.conf.json`
- Create: `src-tauri/capabilities/default.json`
- Create: `src-tauri/src/main.rs`
- Create: `src-tauri/src/lib.rs`
- Modify: `package.json`

- [ ] **Step 1: Create Cargo.toml**

```toml
[package]
name = "withylj"
version = "0.1.0"
description = "With Ylj - A personal memory journal"
authors = ["iiixq"]
edition = "2021"

[lib]
name = "withylj_lib"
crate-type = ["lib", "cdylib", "staticlib"]

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-opener = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
```

- [ ] **Step 2: Create build.rs**

```rust
fn main() {
    tauri_build::build()
}
```

- [ ] **Step 3: Create tauri.conf.json**

```json
{
  "$schema": "https://raw.githubusercontent.com/nicedoc/open-tauri/main/packages/api/src/conf/schema.json",
  "productName": "withylj",
  "version": "0.1.0",
  "identifier": "com.withylj.app",
  "build": {
    "frontendDist": "../dist",
    "devUrl": "http://localhost:4321",
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build"
  },
  "app": {
    "windows": [
      {
        "title": "With Ylj",
        "width": 1200,
        "height": 800,
        "minWidth": 360,
        "minHeight": 600
      }
    ],
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.ico"
    ]
  }
}
```

- [ ] **Step 4: Create capabilities/default.json**

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Default capability for withylj",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "opener:default"
  ]
}
```

- [ ] **Step 5: Create src/main.rs**

```rust
// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    withylj_lib::run()
}
```

- [ ] **Step 6: Create src/lib.rs with embedded HTTP server for SPA support**

```rust
use std::io::Read;
use std::net::TcpListener;
use std::path::PathBuf;
use std::sync::Arc;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let dist_dir: Arc<PathBuf> = Arc::new(
        std::env::current_dir()
            .unwrap_or_else(|_| PathBuf::from("."))
            .join("dist"),
    );

    let dist = dist_dir.clone();
    std::thread::spawn(move || {
        let listener = TcpListener::bind("127.0.0.1:14876").unwrap();
        for stream in listener.incoming() {
            let dist = dist.clone();
            std::thread::spawn(move || {
                let mut stream = stream.unwrap();
                let mut buf = [0u8; 4096];
                let n = stream.read(&mut buf).unwrap_or(0);
                let req = String::from_utf8_lossy(&buf[..n]);
                let path = req
                    .lines()
                    .next()
                    .and_then(|l| l.split_whitespace().nth(1))
                    .unwrap_or("/");
                let path = path.trim_start_matches('/');
                let path = if path.is_empty() { "index.html" } else { path };

                let file_path = dist.join(path);
                let serve_path = if file_path.is_file() {
                    file_path
                } else {
                    dist.join("index.html") // SPA fallback
                };

                let content_type = match serve_path.extension().and_then(|e| e.to_str()) {
                    Some("html") => "text/html; charset=utf-8",
                    Some("css") => "text/css",
                    Some("js") => "application/javascript",
                    Some("json") => "application/json",
                    Some("png") => "image/png",
                    Some("jpg") | Some("jpeg") => "image/jpeg",
                    Some("webp") => "image/webp",
                    Some("svg") => "image/svg+xml",
                    Some("ico") => "image/x-icon",
                    _ => "application/octet-stream",
                };

                if let Ok(data) = std::fs::read(&serve_path) {
                    let resp = format!(
                        "HTTP/1.1 200 OK\r\nContent-Type: {}\r\nContent-Length: {}\r\nAccess-Control-Allow-Origin: *\r\nConnection: close\r\n\r\n",
                        content_type,
                        data.len()
                    );
                    let _ = std::io::Write::write_all(&mut stream, resp.as_bytes());
                    let _ = std::io::Write::write_all(&mut stream, &data);
                }
            });
        }
    });

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(move |app| {
            let window = app.get_webview_window("main").unwrap();
            let _ = window.navigate("http://127.0.0.1:14876".parse().unwrap());
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- [ ] **Step 7: Add tauri CLI and scripts to package.json**

Add to `devDependencies`:
```json
"@tauri-apps/cli": "^2.0.0"
```

Add to `scripts`:
```json
"tauri": "tauri"
```

- [ ] **Step 8: Install npm dependencies**

```bash
npm install
```

- [ ] **Step 9: Commit**

```bash
git add src-tauri/ package.json package-lock.json
git commit -m "feat: initialize Tauri v2 desktop app shell"
```

---

### Task 5: Build and Verify

- [ ] **Step 1: Verify Astro build**

```bash
npm run build
```

Expected: builds to `dist/` with no errors.

- [ ] **Step 2: Verify Tauri dev mode**

```bash
npx tauri dev
```

Expected: desktop window opens, site loads correctly, SPA navigation works (click through pages).

- [ ] **Step 3: Build Tauri production installer**

```bash
npx tauri build
```

Expected: builds `.msi` to `src-tauri/target/release/bundle/msi/`. Install and test the `.msi`.

- [ ] **Step 4: Verify PWA offline capability**

Open the Astro dev server or preview:
```bash
npm run preview
```
Open in Chrome → DevTools → Application → Service Workers → verify SW is registered. Go offline (Network tab → Offline) → refresh → pages should still load from cache.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: final build verification adjustments"
```

---

## Distribution Checklist

After all tasks complete:

1. **Web**: Push to `main` → Cloudflare Pages auto-deploys from GitHub
2. **Desktop**: Zip `src-tauri/target/release/bundle/msi/withylj_0.1.0_x64_en-US.msi` → send via WeChat/cloud drive
3. **Mobile**: Share the Cloudflare Pages URL → user opens once online → "Add to Home Screen" → works offline thereafter

## Known Limitations

- **Music player**: Relies on remote Meting API (NetEase Music), won't work offline in the desktop app. Falls back to silent — app still fully functional.
- **Page refresh on deep route**: If the user presses F5 on a sub-page like `/posts/hello-world`, the embedded HTTP server handles it via SPA fallback to `index.html`. ClientRouter then restores the correct route.
- **Windows SmartScreen**: First-time install will show "Windows protected your PC" warning since the app is unsigned. Recipient clicks "More info" → "Run anyway".
