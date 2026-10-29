import { getPublishedPosts, getTags, isoDate, postUrl, tagUrl } from '../lib/posts';
import { NAV } from '../lib/site';

/** Build-time index for the command palette. */
export async function GET() {
  const posts = await getPublishedPosts();
  const tags = await getTags();
  const items = [
    { kind: 'page', label: 'home', url: '/', keywords: 'index start' },
    ...NAV.map((n) => ({ kind: 'page', label: n.label, url: n.href })),
    { kind: 'page', label: 'rss feed', url: '/rss.xml', keywords: 'subscribe atom' },
    ...posts.map((p) => ({
      kind: 'post',
      label: p.data.title,
      url: postUrl(p),
      hint: isoDate(p.data.date),
      keywords: [p.data.description, ...p.data.tags, p.data.kind].filter(Boolean).join(' '),
    })),
    ...[...tags].map(([tag, list]) => ({ kind: 'tag', label: `#${tag}`, url: tagUrl(tag), hint: String(list.length) })),
  ];
  return new Response(JSON.stringify(items), { headers: { 'Content-Type': 'application/json' } });
}
