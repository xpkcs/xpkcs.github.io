export const SITE = {
  url: 'https://xpkcs.github.io',
  title: 'xpkcs',
  description: 'Notes, essays, and experiments.',
  author: 'xpkcs',
  repo: 'https://github.com/xpkcs/xpkcs.github.io',
} as const;

export const NAV = [
  { href: '/posts/', label: 'posts' },
  { href: '/tags/', label: 'tags' },
  { href: '/about/', label: 'about' },
] as const;
