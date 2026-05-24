// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { rehypeImageBase } from './src/plugins/rehype-image-base.mjs';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()]
  },
  markdown: {
    rehypePlugins: [[rehypeImageBase, '/withylj']],
  },
  site: 'https://ivvvx.github.io',
  base: '/withylj',
});