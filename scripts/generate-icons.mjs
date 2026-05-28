import sharp from 'sharp'
import toIco from 'to-ico'
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const iconsDir = join(__dirname, '..', 'src-tauri', 'icons')
const svgPath = join(__dirname, '..', 'public', 'favicon.svg')

mkdirSync(iconsDir, { recursive: true })

// Generate PNG icons for Tauri
const sizes = {
  '32x32.png': 32,
  '128x128.png': 128,
  '128x128@2x.png': 256,
}

for (const [filename, size] of Object.entries(sizes)) {
  const outPath = join(iconsDir, filename)
  await sharp(svgPath).resize(size, size).png().toFile(outPath)
}

// Generate proper ICO file (Windows requires valid ICO format)
const ico_32 = await sharp(svgPath).resize(32, 32).png().toBuffer()
const ico_48 = await sharp(svgPath).resize(48, 48).png().toBuffer()
const ico_256 = await sharp(svgPath).resize(256, 256).png().toBuffer()
const icoBuf = await toIco([ico_32, ico_48, ico_256])
writeFileSync(join(iconsDir, 'icon.ico'), icoBuf)

// Generate PWA icons
await sharp(svgPath).resize(192, 192).png().toFile(join(__dirname, '..', 'public', 'icon-192.png'))
await sharp(svgPath).resize(512, 512).png().toFile(join(__dirname, '..', 'public', 'icon-512.png'))

console.log('Icons generated')
