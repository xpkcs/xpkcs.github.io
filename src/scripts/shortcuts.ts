import { openPalette } from './palette';
import { toggleTheme } from './theme';

const help = document.getElementById('help') as HTMLDialogElement | null;
const toggle = help?.querySelector<HTMLInputElement>('[data-shortcuts-toggle]');

function singleKeysEnabled() {
  try {
    return localStorage.getItem('shortcuts') !== 'off';
  } catch {
    return true;
  }
}

export function openHelp() {
  if (help && !help.open) help.showModal();
}

function isEditable(el: EventTarget | null) {
  return el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
}

/** j/k walk the post links of the first list marked [data-nav-list]. */
function step(delta: 1 | -1) {
  const links = [...document.querySelectorAll<HTMLAnchorElement>('[data-nav-list] .title')].filter(
    (a) => a.checkVisibility(),
  );
  if (links.length === 0) return;
  const at = links.indexOf(document.activeElement as HTMLAnchorElement);
  const next = at === -1 ? (delta === 1 ? 0 : links.length - 1) : Math.min(links.length - 1, Math.max(0, at + delta));
  links[next]!.focus();
  links[next]!.scrollIntoView({ block: 'nearest' });
}

let pendingG = 0;

export function initShortcuts() {
  if (toggle) {
    toggle.checked = singleKeysEnabled();
    toggle.addEventListener('change', () => {
      try {
        localStorage.setItem('shortcuts', toggle.checked ? 'on' : 'off');
      } catch {}
    });
  }
  help?.addEventListener('click', (e) => {
    if (e.target === help) help.close();
  });
  for (const btn of document.querySelectorAll('[data-open-help]')) btn.addEventListener('click', openHelp);

  document.addEventListener('keydown', (e) => {
    if (e.isComposing || e.defaultPrevented) return;

    // ⌘K / Ctrl+K works everywhere, including while typing.
    if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      void openPalette();
      return;
    }

    // WCAG 2.1.4: single-character shortcuts can be turned off, and never fire while typing.
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (document.querySelector('dialog[open]') || isEditable(e.target) || !singleKeysEnabled()) return;

    if (pendingG && Date.now() - pendingG < 800) {
      pendingG = 0;
      if (e.key === 'h') location.href = '/';
      else if (e.key === 'p') location.href = '/posts/';
      return;
    }

    switch (e.key) {
      case '/':
        e.preventDefault();
        void openPalette();
        break;
      case '?':
        openHelp();
        break;
      case 't':
        toggleTheme();
        break;
      case 'j':
        step(1);
        break;
      case 'k':
        step(-1);
        break;
      case 'g':
        pendingG = Date.now();
        break;
    }
  });
}
