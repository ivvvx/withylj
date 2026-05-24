import { visit } from 'unist-util-visit';

export function rehypeImageBase(base) {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName === 'img' && node.properties.src) {
        const src = node.properties.src;
        if (typeof src === 'string' && src.startsWith('/') && !src.startsWith(base)) {
          node.properties.src = base + src;
        }
      }
    });
  };
}
