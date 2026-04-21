// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import partytown from '@astrojs/partytown';

export default defineConfig({
  site: 'https://www.icareaircare.com',
  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes('/our-team/') &&
        !page.includes('/privacy-policy/') &&
        !page.includes('/terms-of-use/') &&
        !page.includes('/thank-you/') &&
        !page.includes('/book/') &&
        !page.endsWith('/rss.xml') &&
        // Legacy URLs that 301 to canonical versions — do not include in sitemap
        !page.includes('/emergency-ac-repair-wesley-chapel-fl/') &&
        !page.includes('/air-duct-cleaning-in-wesley-chapel-fl-what-you-need-to-know/') &&
        !page.includes('/ac-not-cooling-solutions/'),
    }),
    partytown({ config: { forward: ['dataLayer.push', 'gtag'] } }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  image: {
    responsiveStyles: true,
  },
  build: {
    // Inline every stylesheet — kills the render-blocking CSS requests
    // flagged by Lighthouse (BaseLayout.css + ReviewStrip.css were ~310ms)
    inlineStylesheets: 'always',
  },
});
