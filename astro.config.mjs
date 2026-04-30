// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import rehypeExternalLinks from 'rehype-external-links';

import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.builtwithbugs.com',
  output: 'static',

  integrations: [
    mdx(),
    sitemap({
      filter: (page) =>
        !page.includes('/mentions-legales') &&
        !page.includes('/politique-de-confidentialite'),
      changefreq: 'weekly',
      priority: 0.7,
    }),
  ],

  markdown: {
    shikiConfig: {
      theme: 'github-dark',
    },
    rehypePlugins: [
      [rehypeExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer'] }],
    ],
  },

  prefetch: {
    defaultStrategy: 'hover',
  },

  adapter: vercel({
    imageService: true,
    imagesConfig: {
      sizes: [320, 640, 1280],
      formats: ['image/avif', 'image/webp'],
      minimumCacheTTL: 31536000,
      domains: [],
    },
  }),
});
