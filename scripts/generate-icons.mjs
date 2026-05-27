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
  await sharp(svgPath).resize(size, size).png().toFile(outPath)
}

// Also generate PWA icons
await sharp(svgPath).resize(192, 192).png().toFile(join(__dirname, '..', 'public', 'icon-192.png'))
await sharp(svgPath).resize(512, 512).png().toFile(join(__dirname, '..', 'public', 'icon-512.png'))

console.log('Icons generated')
