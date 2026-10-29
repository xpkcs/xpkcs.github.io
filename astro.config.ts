import { defineConfig, fontProviders } from 'astro/config';
import { unified, rehypeHeadingIds } from '@astrojs/markdown-remark';
import sitemap from '@astrojs/sitemap';
import expressiveCode from 'astro-expressive-code';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeCallouts from 'rehype-callouts';
import rehypeCitation from 'rehype-citation';
import { remarkObsidian } from './src/lib/remark/obsidian.ts';
import { rehypeSections } from './src/lib/rehype/sections.ts';
import { rehypeSidenotes } from './src/lib/rehype/sidenotes.ts';
import { SITE } from './src/lib/site.ts';

export default defineConfig({
  site: SITE.url,
  trailingSlash: 'always',
  // Astro 7 defaults to JSX whitespace rules, which can eat spaces between inline elements.
  compressHTML: true,
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },

  integrations: [
    expressiveCode({
      themes: ['tokyo-night', 'rose-pine-dawn'],
      // Follow the site's theme toggle (<html data-theme="dark|light">), not just the OS.
      themeCssSelector: (theme) => `[data-theme='${theme.type}']`,
      useDarkModeMediaQuery: false,
      styleOverrides: {
        codeFontFamily: 'var(--font-mono), monospace',
        uiFontFamily: 'var(--font-mono), monospace',
        codeFontSize: '0.875rem',
        borderRadius: '0.5rem',
        borderColor: 'var(--line)',
        frames: { shadowColor: 'transparent', editorActiveTabIndicatorTopColor: 'var(--magenta)' },
      },
    }),
    sitemap(),
  ],

  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: 'JetBrains Mono',
      cssVariable: '--font-mono',
      weights: ['100 800'],
      styles: ['normal', 'italic'],
      subsets: ['latin'],
      fallbacks: ['ui-monospace', 'monospace'],
    },
    {
      provider: fontProviders.fontsource(),
      name: 'Newsreader',
      cssVariable: '--font-serif',
      weights: ['200 800'],
      styles: ['normal', 'italic'],
      subsets: ['latin'],
      fallbacks: ['Georgia', 'serif'],
    },
  ],

  markdown: {
    // Unified, not Astro 7's default Sätteri: every plugin below is a remark/rehype plugin.
    // Order matters: citations → sidenotes (consumes footnotes) → sections → anchors.
    processor: unified({
      remarkPlugins: [remarkObsidian],
      rehypePlugins: [
        rehypeHeadingIds,
        [
          rehypeCitation,
          {
            bibliography: 'src/content/references.bib',
            csl: 'chicago', // bundled Chicago author-date; no network fetch at build time
            linkCitations: true,
            inlineClass: ['citation'],
          },
        ],
        [rehypeCallouts, { theme: 'obsidian' }],
        rehypeSidenotes,
        rehypeSections,
        [
          rehypeAutolinkHeadings,
          {
            // `## Heading`: the level markers are the anchor link
            behavior: 'prepend',
            properties: { className: ['anchor'], ariaHidden: 'true', tabIndex: -1 },
            content: (heading: { tagName: string }) => ({ type: 'text', value: '#'.repeat(Number(heading.tagName[1])) }),
          },
        ],
      ],
    }),
  },
});
