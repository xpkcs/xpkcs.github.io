import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;

/**
 * The only sanctioned way to list posts. Drafts are visible in `astro dev`
 * and excluded from production builds, so every page, feed, and index that
 * goes through here gets the same answer.
 */
export async function getPublishedPosts(): Promise<Post[]> {
  const posts = await getCollection('posts', ({ data }) => import.meta.env.DEV || !data.draft);
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export async function getTags(): Promise<Map<string, Post[]>> {
  const byTag = new Map<string, Post[]>();
  for (const post of await getPublishedPosts()) {
    for (const tag of post.data.tags) {
      byTag.set(tag, [...(byTag.get(tag) ?? []), post]);
    }
  }
  return new Map([...byTag].sort(([a], [b]) => a.localeCompare(b)));
}

export const postUrl = (post: Post) => `/posts/${post.id}/`;
export const tagUrl = (tag: string) => `/tags/${encodeURIComponent(tag)}/`;

/** ISO date (YYYY-MM-DD) in UTC, matching how dates are written in frontmatter. */
export const isoDate = (d: Date) => d.toISOString().slice(0, 10);

const HUES = ['cyan', 'magenta', 'lime', 'amber', 'violet'] as const;

/** Map a tag onto one of the five curated accent hues, stable across builds. */
export function tagHue(tag: string): (typeof HUES)[number] {
  let h = 0;
  for (const ch of tag) h = (h * 31 + ch.codePointAt(0)!) >>> 0;
  return HUES[h % HUES.length]!;
}

/** View-transition names must be valid idents. */
export const vtName = (post: Post) => `t-${post.id.replace(/[^a-zA-Z0-9-]/g, '-')}`;
