/**
 * Scaffold a draft post: `pnpm new "My Title"` or `pnpm new "My Title" --essay`.
 * The filename is the title, matching what Obsidian creates.
 */
import fs from 'node:fs';

const args = process.argv.slice(2);
const essay = args.includes('--essay');
const title = args.filter((a) => !a.startsWith('--')).join(' ').trim();

if (!title) {
  console.error('usage: pnpm new "Post title" [--essay]');
  process.exit(1);
}

const filename = `${title.replace(/[\\/:*?"<>|#^[\]]/g, '').trim()}.md`;
const file = new URL(`../src/content/posts/${encodeURIComponent(filename)}`, import.meta.url);
if (fs.existsSync(file)) {
  console.error(`already exists: src/content/posts/${filename}`);
  process.exit(1);
}

const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD, local time
fs.writeFileSync(
  file,
  `---
title: ${JSON.stringify(title)}
date: ${today}
description:
tags: []
kind: ${essay ? 'essay' : 'post'}
draft: true
---

`,
);
console.log(`created src/content/posts/${filename} (draft)`);
