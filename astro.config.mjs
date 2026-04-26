// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.builtwithbugs.com',
  integrations: [mdx(), sitemap()],

  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport'
  },

  adapter: vercel({
    imageService: true,
    imagesConfig: {
      sizes: [320, 640, 1280],
      domains: [],
    }
  }),
});