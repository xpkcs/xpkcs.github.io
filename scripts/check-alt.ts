/**
 * Fails when a published post has an image without real alt text.
 * Obsidian pastes images as `![](assets/Pasted image ….png)`, so empty alt
 * and filename-like alt are the common mistakes. Wikilink embeds (`![[…]]`)
 * are also rejected: the vault is configured for Markdown links.
 */
import fs from 'node:fs';
import path from 'node:path';

const DIR = new URL('../src/content/posts/', import.meta.url);
const problems: string[] = [];

for (const file of fs.readdirSync(DIR).filter((f) => f.endsWith('.md'))) {
  const source = fs.readFileSync(new URL(encodeURIComponent(file), DIR), 'utf8');
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(source)?.[1] ?? '';
  if (!/^draft:\s*false\s*$/m.test(frontmatter)) continue;

  let inFence = false;
  source.split(/\r?\n/).forEach((line, i) => {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    if (inFence) return;
    const where = `${file}:${i + 1}`;
    if (/!\[\[[^\]]+\]\]/.test(line)) problems.push(`${where}  wikilink embed; use a Markdown image link`);
    for (const m of line.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)) {
      const alt = m[1]!.trim();
      const name = path.parse(decodeURI(m[2]!.split(/\s/)[0]!)).name;
      if (!alt) problems.push(`${where}  image has no alt text: ${m[2]}`);
      else if (/^pasted image/i.test(alt) || alt === name) problems.push(`${where}  alt text is a filename: "${alt}"`);
    }
    for (const m of line.matchAll(/<img\b(?![^>]*\balt="[^"]+")[^>]*>/g)) {
      problems.push(`${where}  <img> without alt: ${m[0]}`);
    }
  });
}

if (problems.length) {
  console.error(`Images need descriptive alt text:\n${problems.map((p) => `  ${p}`).join('\n')}`);
  process.exit(1);
}
console.log('alt text: ok');
