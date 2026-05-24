import { visit } from 'unist-util-visit';

export function rehypeImageBase(base) {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'img' || !node.properties.src) return;

      let src = node.properties.src;
      if (typeof src !== 'string') return;

      if (src.startsWith('/') && !src.startsWith(base)) {
        src = base + src;
        node.properties.src = src;
      }

      // Add responsive WebP srcset for images under /images/
      const imgPath = src.startsWith(base) ? src.slice(base.length) : src;
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
    });
  };
}
