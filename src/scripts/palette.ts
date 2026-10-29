import { toggleTheme } from './theme';
import { openHelp } from './shortcuts';

interface Item {
  kind: 'post' | 'tag' | 'page' | 'action';
  label: string;
  hint?: string;
  url?: string;
  keywords?: string;
  run?: () => void;
}

interface Match {
  item: Item;
  score: number;
  hits: number[];
}

const dialog = document.getElementById('palette') as HTMLDialogElement | null;
const input = dialog?.querySelector('input');
const list = dialog?.querySelector<HTMLUListElement>('#palette-list');

let items: Item[] | null = null;
let matches: Match[] = [];
let selected = 0;

const ACTIONS: Item[] = [
  { kind: 'action', label: 'toggle theme', hint: 't', run: toggleTheme, keywords: 'dark light mode color' },
  { kind: 'action', label: 'keyboard shortcuts', hint: '?', run: openHelp, keywords: 'help keys' },
];

async function load(): Promise<Item[]> {
  if (items) return items;
  try {
    const res = await fetch('/search.json');
    items = [...((await res.json()) as Item[]), ...ACTIONS];
  } catch {
    items = ACTIONS;
  }
  return items;
}

/** Subsequence match: consecutive and word-start hits score higher. */
function fuzzy(query: string, text: string): { score: number; hits: number[] } | null {
  if (!query) return { score: 0, hits: [] };
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  const hits: number[] = [];
  let score = 0;
  let ti = 0;
  for (const ch of q) {
    const found = t.indexOf(ch, ti);
    if (found === -1) return null;
    const prev = hits.at(-1);
    score += prev !== undefined && found === prev + 1 ? 3 : 1;
    if (found === 0 || /[\s\-/#]/.test(t[found - 1]!)) score += 2;
    hits.push(found);
    ti = found + 1;
  }
  return { score: score - t.length * 0.01, hits };
}

function search(query: string, all: Item[]): Match[] {
  const out: Match[] = [];
  for (const item of all) {
    const onLabel = fuzzy(query, item.label);
    const onKeywords = !onLabel && item.keywords ? fuzzy(query, item.keywords) : null;
    if (onLabel) out.push({ item, score: onLabel.score, hits: onLabel.hits });
    else if (onKeywords) out.push({ item, score: onKeywords.score * 0.5, hits: [] });
  }
  return query ? out.sort((a, b) => b.score - a.score).slice(0, 50) : out;
}

function highlighted(label: string, hits: number[]): DocumentFragment {
  const frag = document.createDocumentFragment();
  const set = new Set(hits);
  let run = '';
  let inMark = false;
  const flush = () => {
    if (!run) return;
    if (inMark) {
      const m = document.createElement('mark');
      m.textContent = run;
      frag.append(m);
    } else frag.append(run);
    run = '';
  };
  [...label].forEach((ch, i) => {
    if (set.has(i) !== inMark) {
      flush();
      inMark = set.has(i);
    }
    run += ch;
  });
  flush();
  return frag;
}

function render() {
  if (!list || !input) return;
  list.replaceChildren();
  if (matches.length === 0) {
    const li = document.createElement('li');
    li.className = 'p-empty';
    li.textContent = 'no matches';
    list.append(li);
    input.removeAttribute('aria-activedescendant');
    return;
  }
  matches.forEach(({ item, hits }, i) => {
    const li = document.createElement('li');
    li.id = `p-opt-${i}`;
    li.setAttribute('role', 'option');
    li.setAttribute('aria-selected', String(i === selected));
    const kind = document.createElement('span');
    kind.className = 'p-kind';
    kind.dataset.kind = item.kind;
    kind.textContent = item.kind;
    const label = document.createElement('span');
    label.className = 'p-label';
    label.append(highlighted(item.label, hits));
    li.append(kind, label);
    if (item.hint) {
      const hint = document.createElement('span');
      hint.className = 'p-hint';
      hint.textContent = item.hint;
      li.append(hint);
    }
    li.addEventListener('mousemove', () => select(i));
    li.addEventListener('click', () => activate(i));
    list.append(li);
  });
  input.setAttribute('aria-activedescendant', `p-opt-${selected}`);
}

function select(i: number) {
  if (!list || !input || matches.length === 0) return;
  selected = (i + matches.length) % matches.length;
  list.querySelectorAll('[role=option]').forEach((el, j) => el.setAttribute('aria-selected', String(j === selected)));
  input.setAttribute('aria-activedescendant', `p-opt-${selected}`);
  list.querySelector(`#p-opt-${selected}`)?.scrollIntoView({ block: 'nearest' });
}

function activate(i: number) {
  const item = matches[i]?.item;
  if (!item) return;
  dialog?.close();
  if (item.run) item.run();
  else if (item.url) location.href = item.url;
}

async function update() {
  if (!input) return;
  matches = search(input.value.trim(), await load());
  selected = 0;
  render();
}

export async function openPalette() {
  if (!dialog || !input || dialog.open) return;
  input.value = '';
  dialog.showModal();
  input.focus();
  await update();
}

export function initPalette() {
  if (!dialog || !input) return;
  input.addEventListener('input', update);
  input.addEventListener('keydown', (e) => {
    const down = e.key === 'ArrowDown' || (e.ctrlKey && e.key === 'n');
    const up = e.key === 'ArrowUp' || (e.ctrlKey && e.key === 'p');
    if (down || up) {
      e.preventDefault();
      select(selected + (down ? 1 : -1));
    } else if (e.key === 'Enter' && !e.isComposing) {
      e.preventDefault();
      activate(selected);
    }
  });
  // click on the backdrop closes
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
  for (const btn of document.querySelectorAll('[data-open-palette]')) {
    btn.addEventListener('click', openPalette);
  }
}
