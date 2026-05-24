import { readdir, stat } from 'node:fs/promises';
import { join, extname, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const SIZES = [400, 800, 1200];
const BLUR_WIDTH = 10;
const IMAGE_DIR = fileURLToPath(new URL('../public/images', import.meta.url));

async function* walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else if (entry.isFile()) {
      yield full;
    }
  }
}

function isOptimized(filepath) {
  const name = basename(filepath, extname(filepath));
  return /-(400w|800w|1200w|blur)$/.test(name);
}

function isImage(filepath) {
  const ext = extname(filepath).toLowerCase();
  return ['.jpg', '.jpeg', '.png'].includes(ext);
}

function getOutputPath(original, suffix) {
  const ext = extname(original);
  const nameWithoutExt = basename(original, ext);
  return join(dirname(original), `${nameWithoutExt}-${suffix}.webp`);
}

async function newerThan(a, b) {
  try {
    const [statA, statB] = await Promise.all([stat(a), stat(b)]);
    return statA.mtimeMs >= statB.mtimeMs;
  } catch {
    return false;
  }
}

async function processImage(filepath) {
  const image = sharp(filepath);
  const metadata = await image.metadata();
  const originalWidth = metadata.width || Infinity;

  let processed = 0;

  for (const size of SIZES) {
    if (size >= originalWidth) continue;
    const output = await getOutputPath(filepath, `${size}w`);
    if (await newerThan(output, filepath)) continue;

    await image
      .clone()
      .resize({ width: size, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(output);
    processed++;
  }

  // Blur placeholder
  const blurOutput = await getOutputPath(filepath, 'blur');
  if (!(await newerThan(blurOutput, filepath))) {
    await image
      .clone()
      .resize({ width: BLUR_WIDTH, withoutEnlargement: true })
      .webp({ quality: 30 })
      .toFile(blurOutput);
    processed++;
  }

  return processed;
}

async function main() {
  console.log('Optimizing images...\n');

  const tasks = [];
  for await (const filepath of walk(IMAGE_DIR)) {
    if (!isImage(filepath) || isOptimized(filepath)) continue;
    tasks.push({ filepath });
  }

  if (tasks.length === 0) {
    console.log('All images are already optimized.');
    return;
  }

  let total = 0;
  let skipped = 0;
  for (const { filepath } of tasks) {
    const relative = filepath.replace(IMAGE_DIR, '');
    const count = await processImage(filepath);
    if (count > 0) {
      console.log(`  ${relative} → ${count} variants`);
    } else {
      skipped++;
    }
    total += count;
  }

  console.log(`\nDone. ${total} optimized, ${skipped} skipped (up to date).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
