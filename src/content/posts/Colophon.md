---
title: Colophon
date: 2026-10-29
description: How this site is built, and a test page for everything it can render.
tags:
  - meta
  - typography
kind: essay
draft: false
---

This page describes how the site is put together. It doubles as a test page: every feature the site supports appears below at least once, so if something breaks, it breaks here first.

## Type

Interface text is set in JetBrains Mono. Long-form text is set in Newsreader, a serif drawn for reading on screens.[^newsreader] The text column holds to roughly 65–70 characters per line, inside the range typographers have long recommended for continuous reading [@bringhurst2012elements].

[^newsreader]: Newsreader is a variable font with an optical-size axis, so small text and large headings each get shapes designed for their size.

### Color

There are two themes: warm paper with deep inks, and a soft slate with neon accents. The site follows your system setting until you press `t` or use the toggle in the header. Every text color is checked for contrast against both backgrounds in CI.

![Five rounded swatches on a dark slate background, labelled cyan, magenta, lime, amber, and violet](assets/palette%20swatches.png)

## Notes in the margin

Footnotes become sidenotes. On wide screens they sit in the margin beside the line that references them, a layout borrowed from Edward Tufte's books [@tufte2006beautiful].[^margin] On narrow screens, tap the number to open a note inline.

[^margin]: Notes can cite sources too, such as *Practical Typography* [@butterick2013practical].

## Sections fold

Every second- and third-level heading gets a toggle on the right. Collapsed text stays searchable: in browsers that support `hidden="until-found"`, find-in-page opens the section that holds the match. A post can turn folding off with `collapsible: false` in its frontmatter.

> [!tip] Callouts
> Obsidian's callout syntax works as-is: `> [!note]`, `> [!tip]`, `> [!warning]`, and the rest.

## Writing

Posts are Markdown files in `src/content/posts/`, written in Obsidian with `src/content/` opened as the vault. Links between posts are ordinary Markdown links to the file, like this one to the [first post](Hello%20world.md), and are rewritten to site URLs at build time.

```sh title="publishing a post"
git switch -c post/colophon
git add src/content/posts
git commit -m "post: colophon"
gh pr create --fill
```

Opening a pull request runs the checks: frontmatter, color contrast, internal links, and image alt text. Merging it deploys.

## Stack

The site is built with [Astro](https://astro.build) and hosted on GitHub Pages. Code blocks are rendered at build time by Expressive Code, and citations come from a BibTeX file. The interactive parts (the command palette, keyboard shortcuts, theme toggle, and these folding sections) are small modules with no framework. Page transitions use the browser's native cross-document view transitions.

Press `?` to see the keyboard shortcuts.
