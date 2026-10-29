# xpkcs.github.io — Plan

Revised after one adversarial review round (review of v0 draft, 2026-10-29). Versions verified on the same date.

## Decisions

| Area | Decision |
|---|---|
| Framework | Astro 7.x, TypeScript strict, pnpm, single Node version pinned in `.node-version` |
| Markdown processor | **`unified()` explicitly** (Astro 7 defaults to Sätteri; all remark/rehype plugins need unified) |
| Authoring | `src/content/` opened as an Obsidian vault, with **standard Markdown links**, no wikilinks; branch → commit → PR |
| Review | PR CI: `astro check` + build + offline link check + `dist` artifact; local `pnpm dev` |
| Typography | Monospace chrome (nav, headings, meta, code, UI) + serif essay body |
| Theme | Soft dark (not near-black) + warm paper light; OS default + manual toggle; neon, colorful, but contrast-checked |
| Interactivity | Native cross-document View Transitions, ⌘K / `/` palette, opt-out single-key shortcuts, header caret, reading progress |
| Features | Sidenotes, collapsible headings, citations, plus code highlighting, RSS, tags, reading time, sitemap |
| Domain | `xpkcs.github.io` (CNAME-ready) |

## Content model

- Collection `posts` via `glob()` over `src/content/posts/*.md`; schema in `src/content.config.ts`.
- Frontmatter (Zod):
  - `title`
  - `date`: Obsidian date property, `z.coerce.date()`
  - `updated?`
  - `description`: required only when `draft: false`, via refine
  - `tags: string[]`
  - `kind: 'post' | 'essay'`
  - `draft = true`
  - `slug?`: so renaming a note doesn't change the URL
  - `collapsible?`: per-post override
- A single `getPublishedPosts()` helper feeds every listing: pages, tags, RSS, sitemap and the ⌘K index. Drafts can't leak because nothing else reads the collection.

## Obsidian setup (committed `.obsidian/`, no community plugins)

- Settings:
  - "Use [[Wikilinks]]" off
  - "New link format" = relative path
  - "Default location for new attachments" = `posts/assets`
- With these settings Obsidian writes plain `![](assets/x.png)`, which Astro optimizes natively.
- One small remark plugin rewrites `[text](other-post.md)` to `/posts/<slug>`. It also handles Obsidian's `%20`-encoded paths for "Pasted image …" files.
- Callouts (`> [!note]`) via `rehype-callouts`.
- Core Templates plugin + `_templates/post.md` (defaults `draft: true`); `pnpm new "Title"` for terminal use.
- Gitignore `workspace*.json` and `.trash/`.

## Markdown pipeline (in this order)

1. `rehype-citation`
   - `src/content/references.bib`, Pandoc `[@key]` syntax.
   - **Vendored CSL file** (Chicago author-date), so CI never fetches styles.
   - Citations link to the bibliography entry. Hover popovers are deferred.
2. **Sidenotes** (custom rehype). Turns GFM `[^n]` footnotes into inline `<span class="sidenote" role="note">` plus a numbered `<button aria-expanded>`. It does not emit `<aside>`, because that would break the enclosing `<p>`.
   - Wide screens: the note sits in the margin column.
   - Narrow screens: tapping the button expands it inline.
   - No JS: notes render as small inline text.
   - The original footnote list is removed.
3. **Collapsible sections** (custom rehype). Wraps h2/h3 sections, on by default with a per-post opt-out.
   - Skips the footnote and bibliography nodes.
   - Heading toggle button with `aria-expanded`, content `hidden="until-found"`. Find-in-page reveals collapsed text in Chromium; Safari support for that is still partial, which is acceptable because sections start expanded.
   - The margin column uses CSS `subgrid` so sidenotes still align inside sections.
4. `rehypeHeadingIds` (Astro built-in) → `rehype-autolink-headings`.
5. Expressive Code: terminal frames, one curated dark/light theme pair, `themeCssSelector` keyed to `[data-theme]` so code blocks follow the toggle.
6. Reading time (remark).

Each of steps 1–3 gets a **fixture post** that exercises it, plus the interactions: a footnote inside a collapsed section, a citation inside a footnote.

## Design system

- Plain CSS, custom properties, OKLCH.
  - `light-dark()` for colors.
  - `[data-theme]`-scoped variables for anything `light-dark()` can't hold (glow shadows).
- A blocking inline `<head>` script sets `data-theme` before first paint.
- **Dark:** background around `oklch(0.28 0.02 270)`, tuned between L 0.27 and 0.30, with raised surfaces one step lighter. Neon accents (cyan, magenta, lime, amber, violet):
  - Glow only on large mono UI and decorative marks (caret, active nav, heading markers, focus rings).
  - Never on body links or prose.
- **Light:** warm paper around `oklch(0.97 0.015 85)`. The same five hues as deep inks at L ≈ 0.45–0.55, with no glow.
- Color is used generously but on purpose:
  - Tags map onto the five curated hues, never a free hash.
  - Section markers, link underlines, selection, and the reading bar use the palette.
  - Code uses its own theme pair.
- **Contrast gate:** a script checks every token pair (4.5:1 for text, 3:1 for UI) in both themes and runs in CI.
- Fonts come from the Astro Fonts API (`fontProviders.fontsource()`, `<Font preload>`, automatic fallback metrics):
  - Mono: JetBrains Mono or Commit Mono.
  - Serif: Newsreader or Source Serif 4.
  - Final pick is made on real prose in Phase 2.
- Layout: CSS grid with a ~68ch prose column plus a margin column, and fluid type via `clamp()`.

## Interactivity

- Native view transitions: `@view-transition { navigation: auto }`, with `view-transition-name` morphing a post's title from the list into the page. Plus Astro `prefetch`.
  - No ClientRouter, which avoids theme flash, double-bound listeners and script re-run issues.
  - Unsupported browsers get normal navigation.
- Command palette as a vanilla TS web component:
  - Opens with ⌘K / Ctrl+K and `/`.
  - Fuzzy search over a build-time JSON index (titles, tags, descriptions); also jumps to pages and toggles the theme.
- Single-key shortcuts (`j/k`, `enter`, `t`, `g h`, `?`):
  - Ignored in inputs, contenteditable, during IME composition and with modifier keys held.
  - The `?` help overlay has an off switch that persists. This meets WCAG 2.1.4.
- Effects:
  - Blinking block caret in the header prompt (`~/xpkcs ▌`).
  - Reading progress driven by `animation-timeline: scroll()`, with a small JS fallback.
  - **No** type-on titles, since they conflict with the title morph and with screen readers.
  - Everything respects `prefers-reduced-motion`.

## Pages

- `/`: intro plus recent posts
- `/posts`: list, with a filter by kind
- `/posts/<slug>`
- `/tags/<tag>`
- `/about`
- `/rss.xml`
- `/404`
- `robots.txt`, sitemap, favicon, one static default OG image
- `site` set in `astro.config.ts` so canonical, RSS and sitemap URLs are correct

## CI/CD

- **`deploy.yml`**, on push to `main`:
  - `withastro/action@v6` → `actions/deploy-pages`
  - `concurrency: pages`, short artifact retention
  - Pages source = GitHub Actions
- **`ci.yml`**, on PR:
  - `pnpm install --frozen-lockfile`
  - `astro check`
  - contrast script
  - build
  - lychee `--offline --root-dir dist` (internal links)
  - alt-text check (fails on images with empty alt or "Pasted image" alt)
  - upload `dist` with 7-day retention
- **`links.yml`**: weekly cron that checks external links with lychee and opens an issue on failure, so PRs aren't flaky.
- `main` is protected by the repo ruleset `protect-main` (set up 2026-10-29): changes go through a PR, the `ci` check from GitHub Actions must pass, and force-pushes and deletion are blocked. **The job in `ci.yml` must be named `ci`** or merges will stay blocked.

## Repo layout

```
.github/workflows/{ci,deploy,links}.yml
.node-version
src/
  content.config.ts
  content/                  ← Obsidian vault root
    .obsidian/              (app.json, templates.json; workspace ignored)
    _templates/post.md
    posts/*.md
    posts/assets/
    references.bib
    csl/chicago-author-date.csl
  components/  layouts/  pages/  styles/
  lib/{remark,rehype}/  lib/posts.ts
scripts/{new-post,check-contrast,check-alt}.ts
astro.config.ts  CLAUDE.md  PLAN.md
```

## Phases (in order; each one is shippable)

0. **Skeleton deploy.** Scaffold Astro 7 with `unified()`, set `.node-version`, add `ci.yml` and `deploy.yml`, and deploy a hello-world to Pages. Add a fixture post exercising links, images and a filename with spaces.
1. **Publish a real post, end to end.** Collection and schema, `getPublishedPosts()`, Obsidian config and template, `pnpm new`, plain post and list pages, RSS, sitemap. Exit criterion: write a post in Obsidian, open a PR, CI passes, merge, and the post is live.
2. **Design.** Tokens, fonts, layout grid, theme script and toggle, contrast gate, Expressive Code theming. Tune all of it on real prose.
3. **Essay features, one at a time with fixtures:** sidenotes → citations → collapsible sections → callouts.
4. **Interactivity.** View transitions and prefetch, palette, shortcuts, caret, reading progress.
5. **Polish.** Tags and about pages, 404, favicon/OG/robots, `links.yml`, accessibility pass (keyboard, screen reader, reduced motion), Lighthouse budget.

## Implementation notes (2026-10-29)

Phases 0–5 were built in one pass. Where the build differs from the plan above:

- **Toolchain.** Astro 7.4.2 is installed; pnpm's minimum release age skips the newest patches. TypeScript is pinned to 6.x because `@astrojs/check` doesn't support TS 7 yet. `compressHTML: true` is set because Astro 7's JSX whitespace mode can drop spaces between inline elements.
- **Citations.** rehype-citation bundles Chicago author-date, so no CSL file is vendored and the build never touches the network.
- **Sidenotes.** They use Tufte-style floats into a reserved margin column, not `subgrid`. Floats pass through the section wrappers unchanged, which makes them simpler than subgrid. The margin column appears at ≥72rem; below that, notes open inline from their numbered button.
- **Heading anchors.** The `##` markers are the anchor links, hanging in the left gutter on wide screens. Section toggles are `[−]`/`[+]` on the right.
- **Kind filter.** `/posts/` filters by kind with CSS `:has()` radio buttons. A second list would repeat entries, and repeated `view-transition-name`s make the browser skip the transition.
- **Feature test page.** The fixture is a real published post, **Colophon**, which exercises every renderer feature: sidenotes, a citation inside a sidenote, nested collapsible sections, callouts, code, an image with a space in its filename, and a `.md` link to another post.
- **Placeholders to replace:** the home lede (`SITE.description` in `src/lib/site.ts`), `src/pages/about.astro`, and the "Hello world" post.

## Review outcomes

- **Accepted.**
  - Unified processor in Astro 7 (I verified this myself on npm and in the docs).
  - `<aside>`-in-`<p>` bug; light-theme neon contrast; ClientRouter → native transitions; drop the custom wikilink plugin.
  - Content-first phasing; feature collisions and subgrid; theme script; Expressive Code selector.
  - WCAG 2.1.4 shortcuts; Fonts API; vendored CSL; CI split; authoring guardrails; cut type-on titles; defer citation popovers.
- **Modified.** The review suggested making collapsible sections opt-in per post. I kept them **on by default with a per-post opt-out**, since you asked for them as a feature. The collisions it raised are handled by skipping footnote and bibliography nodes and by using subgrid.
