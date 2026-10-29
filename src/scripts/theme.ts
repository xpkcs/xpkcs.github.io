type Theme = 'light' | 'dark';

const root = document.documentElement;
const osDark = matchMedia('(prefers-color-scheme: dark)');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

function stored(): Theme | null {
  try {
    const t = localStorage.getItem('theme');
    return t === 'light' || t === 'dark' ? t : null;
  } catch {
    return null;
  }
}

function apply(theme: Theme) {
  const swap = () => {
    root.dataset.theme = theme;
  };
  if (document.startViewTransition && !reducedMotion.matches) document.startViewTransition(swap);
  else swap();
}

export function toggleTheme() {
  const next: Theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  // Choosing the OS theme again clears the override, so the site follows the OS from then on.
  try {
    if (next === (osDark.matches ? 'dark' : 'light')) localStorage.removeItem('theme');
    else localStorage.setItem('theme', next);
  } catch {}
  apply(next);
}

export function initTheme() {
  osDark.addEventListener('change', (e) => {
    if (!stored()) apply(e.matches ? 'dark' : 'light');
  });
  for (const btn of document.querySelectorAll('[data-theme-toggle]')) {
    btn.addEventListener('click', toggleTheme);
  }
}
