/** Client behavior for collapsible sections and sidenotes rendered by the rehype plugins. */

const wide = matchMedia('(min-width: 72rem)');

function setSection(toggle: HTMLButtonElement, expanded: boolean) {
  const body = document.getElementById(toggle.getAttribute('aria-controls') ?? '');
  if (!body) return;
  const title = toggle.getAttribute('aria-label')?.replace(/^(Collapse|Expand) section: /, '') ?? '';
  toggle.setAttribute('aria-expanded', String(expanded));
  toggle.setAttribute('aria-label', `${expanded ? 'Collapse' : 'Expand'} section: ${title}`);
  // until-found keeps collapsed text reachable by find-in-page where supported.
  if (expanded) body.removeAttribute('hidden');
  else body.setAttribute('hidden', 'until-found');
}

/** Expand every collapsed section that contains `el`. */
function reveal(el: Element | null) {
  for (let body = el?.closest('.sec-body'); body; body = body.parentElement?.closest('.sec-body')) {
    const toggle = document.querySelector<HTMLButtonElement>(`.sec-toggle[aria-controls="${body.id}"]`);
    if (toggle?.getAttribute('aria-expanded') === 'false') setSection(toggle, true);
  }
}

function revealHash() {
  if (location.hash) reveal(document.getElementById(decodeURIComponent(location.hash.slice(1))));
}

function initSections() {
  for (const toggle of document.querySelectorAll<HTMLButtonElement>('.sec-toggle')) {
    toggle.addEventListener('click', () => setSection(toggle, toggle.getAttribute('aria-expanded') !== 'true'));
    document.getElementById(toggle.getAttribute('aria-controls') ?? '')?.addEventListener('beforematch', () => {
      setSection(toggle, true);
    });
  }
  window.addEventListener('hashchange', revealHash);
  revealHash();
}

function initSidenotes() {
  const notes = [...document.querySelectorAll<HTMLElement>('.sn')];
  if (notes.length === 0) return;

  // In the margin, notes are always visible; the reference button only matters inline.
  const sync = () => {
    for (const sn of notes) {
      const open = wide.matches || sn.classList.contains('open');
      sn.querySelector('.sn-ref')?.setAttribute('aria-expanded', String(open));
    }
  };

  for (const sn of notes) {
    const ref = sn.querySelector<HTMLButtonElement>('.sn-ref');
    ref?.addEventListener('click', () => {
      if (wide.matches) return;
      sn.classList.toggle('open');
      sync();
    });
    // Highlight the margin note while its reference is hovered or focused.
    for (const [on, off] of [
      ['mouseenter', 'mouseleave'],
      ['focus', 'blur'],
    ] as const) {
      ref?.addEventListener(on, () => sn.classList.add('active'));
      ref?.addEventListener(off, () => sn.classList.remove('active'));
    }
  }
  wide.addEventListener('change', sync);
  sync();
}

/** JS fallback for browsers without scroll-driven animations. */
function initProgress() {
  const bar = document.querySelector<HTMLElement>('.progress');
  if (!bar || CSS.supports('animation-timeline: scroll()')) return;
  let queued = false;
  const update = () => {
    queued = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.setProperty('--progress', String(max > 0 ? scrollY / max : 0));
  };
  addEventListener(
    'scroll',
    () => {
      if (!queued) requestAnimationFrame(update);
      queued = true;
    },
    { passive: true },
  );
  update();
}

export function initProse() {
  initSections();
  initSidenotes();
  initProgress();
}
