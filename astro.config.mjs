// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { rehypeImg } from './src/plugins/rehype-img.mjs';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()]
  },
  markdown: {
    rehypePlugins: [[rehypeImg, '/withylj']],
  },
  site: 'https://ivvvx.github.io',
  base: '/withylj',
});