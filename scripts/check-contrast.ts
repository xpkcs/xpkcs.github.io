/**
 * Contrast gate for the design tokens in src/styles/tokens.css.
 * Every token is `light-dark(<light>, <dark>)`; each pair below is checked
 * in both themes against WCAG 2.x minimums (4.5:1 text, 3:1 UI).
 */
import fs from 'node:fs';
import { wcagContrast, parse } from 'culori';

const css = fs.readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');
const tokens = new Map<string, [string, string]>();
for (const m of css.matchAll(/--([\w-]+):\s*light-dark\((oklch\([^)]*\)),\s*(oklch\([^)]*\))\)/g)) {
  tokens.set(m[1]!, [m[2]!, m[3]!]);
}

const TEXT = 4.5;
const UI = 3;
const ACCENTS = ['cyan', 'magenta', 'lime', 'amber', 'violet'];

// [foreground, background, minimum, where it's used]
const PAIRS: [string, string, number, string][] = [
  ['fg', 'bg', TEXT, 'body text'],
  ['fg', 'surface', TEXT, 'text on cards, palette'],
  ['fg', 'surface-2', TEXT, 'selected palette row'],
  ['fg-muted', 'bg', TEXT, 'meta, dates, descriptions'],
  ['fg-muted', 'surface', TEXT, 'sidenotes (inline), palette'],
  ['fg-faint', 'bg', UI, 'section toggles, list markers'],
  ['fg-faint', 'surface', UI, 'palette hints, placeholders'],
  ...ACCENTS.map((a): [string, string, number, string] => [a, 'bg', TEXT, 'tags, links, labels']),
  ['amber', 'surface', TEXT, 'inline code'],
  ['cyan', 'surface-2', UI, 'palette kind labels'],
];

let failed = 0;
for (const [theme, i] of [['light', 0], ['dark', 1]] as const) {
  console.log(`\n${theme}`);
  for (const [fg, bg, min, use] of PAIRS) {
    const a = tokens.get(fg)?.[i];
    const b = tokens.get(bg)?.[i];
    if (!a || !b) throw new Error(`Unknown token: ${a ? bg : fg}`);
    const ratio = wcagContrast(parse(a)!, parse(b)!);
    const ok = ratio >= min;
    if (!ok) failed++;
    console.log(`  ${ok ? '✓' : '✗'} ${`--${fg} on --${bg}`.padEnd(30)} ${ratio.toFixed(2).padStart(5)} ≥ ${min}  ${use}`);
  }
}

if (failed) {
  console.error(`\n${failed} pair(s) below minimum contrast.`);
  process.exit(1);
}
console.log('\nall pairs pass.');
