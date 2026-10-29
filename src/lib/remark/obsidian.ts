import fs from 'node:fs';
import path from 'node:path';
import { slug as githubSlug } from 'github-slugger';
import { toString } from 'mdast-util-to-string';
import { visit } from 'unist-util-visit';
import type { Root } from 'mdast';
import type { VFile } from 'vfile';

const POSTS_DIR = path.resolve('src/content/posts');
const WORDS_PER_MINUTE = 230;

/**
 * Map each post's filename to its URL slug, mirroring the glob loader:
 * frontmatter `slug` wins, otherwise github-slugger on the filename.
 * Re-read on every call so renames are picked up by the dev server.
 */
function slugsByFilename(): Map<string, string> {
  const map = new Map<string, string>();
  for (const file of fs.readdirSync(POSTS_DIR)) {
    if (!file.endsWith('.md')) continue;
    const source = fs.readFileSync(path.join(POSTS_DIR, file), 'utf8');
    const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(source)?.[1] ?? '';
    const explicit = /^slug:\s*["']?([^"'\r\n]+?)["']?\s*$/m.exec(frontmatter)?.[1];
    map.set(file, explicit ?? githubSlug(file.slice(0, -'.md'.length)));
  }
  return map;
}

const isRelative = (url: string) => !/^([a-z][a-z0-9+.-]*:|\/|#)/i.test(url);

/**
 * Bridges Obsidian-authored Markdown to site URLs:
 * - `[text](Other%20Note.md#heading)` becomes `/posts/other-note/#heading`
 * - percent-encoded image paths (Obsidian encodes spaces) are decoded so
 *   Astro's image pipeline can resolve the file on disk
 * - computes reading time into frontmatter as `minutesRead`
 */
export function remarkObsidian() {
  return (tree: Root, file: VFile) => {
    let slugs: Map<string, string> | undefined;

    visit(tree, ['link', 'image'], (node) => {
      if (node.type !== 'link' && node.type !== 'image') return;
      if (!isRelative(node.url)) return;

      if (node.type === 'image') {
        node.url = decodeURI(node.url);
        return;
      }

      const [target, hash] = node.url.split('#', 2) as [string, string?];
      if (!target.endsWith('.md')) return;
      slugs ??= slugsByFilename();
      const slug = slugs.get(path.basename(decodeURI(target)));
      if (!slug) {
        file.message(`Link to unknown note: ${node.url}`, node);
        return;
      }
      node.url = `/posts/${slug}/${hash ? `#${githubSlug(decodeURI(hash))}` : ''}`;
    });

    const words = toString(tree).split(/\s+/).filter(Boolean).length;
    const astro = (file.data as { astro?: { frontmatter: Record<string, unknown> } }).astro;
    if (astro) astro.frontmatter.minutesRead = Math.max(1, Math.round(words / WORDS_PER_MINUTE));
  };
}
