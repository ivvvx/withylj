/**
 * Build responsive srcset for a cover image URL (already includes base prefix).
 * Returns attributes to spread on an <img> tag.
 */
export function responsiveCover(src: string): {
  src: string;
  srcset: string;
  sizes: string;
} {
  const lastDot = src.lastIndexOf('.');
  if (lastDot === -1) return { src, srcset: '', sizes: '' };

  const nameWithoutExt = src.substring(0, lastDot);

  return {
    src,
    srcset: [
      `${nameWithoutExt}-400w.webp 400w`,
      `${nameWithoutExt}-800w.webp 800w`,
      `${nameWithoutExt}-1200w.webp 1200w`,
    ].join(', '),
    sizes: '(max-width: 600px) 400px, (max-width: 1200px) 800px, 1200px',
  };
}
