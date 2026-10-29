import { h } from 'hastscript';
import { visit, SKIP } from 'unist-util-visit';
import type { Element, ElementContent, Root } from 'hast';

const isElement = (n: unknown, tag?: string): n is Element =>
  (n as Element)?.type === 'element' && (!tag || (n as Element).tagName === tag);

/** Footnote bodies are flow content; sidenotes sit inside a <p>, so flatten to phrasing content. */
function toPhrasing(li: Element): ElementContent[] {
  const out: ElementContent[] = [];
  for (const child of li.children) {
    if (isElement(child) && 'dataFootnoteBackref' in child.properties) continue;
    if (isElement(child, 'p')) {
      const inner = child.children.filter((c) => !(isElement(c) && 'dataFootnoteBackref' in c.properties));
      const last = inner.at(-1);
      if (last?.type === 'text') last.value = last.value.trimEnd();
      out.push(h('span.sn-p', inner));
    } else if (child.type === 'text' && !child.value.trim()) {
      continue;
    } else {
      out.push(child as ElementContent);
    }
  }
  return out;
}

/**
 * Turns GFM footnotes into Tufte-style sidenotes.
 *
 *   <sup><a data-footnote-ref href="#user-content-fn-x">1</a></sup>
 *   → <span class="sn">
 *       <button class="sn-ref" aria-expanded="false" aria-controls="sn-x">1</button>
 *       <span class="sn-note" id="sn-x" role="note">…</span>
 *     </span>
 *
 * Wide screens float the note into the margin; narrow screens expand it inline
 * from the button. The footnote list at the end of the document is removed.
 */
export function rehypeSidenotes() {
  return (tree: Root) => {
    const bodies = new Map<string, ElementContent[]>();

    visit(tree, 'element', (node, index, parent) => {
      if (!('dataFootnotes' in node.properties) || !parent || index === undefined) return;
      visit(node, 'element', (li) => {
        if (li.tagName === 'li' && typeof li.properties.id === 'string') {
          bodies.set(li.properties.id, toPhrasing(li));
        }
      });
      parent.children.splice(index, 1);
      return [SKIP, index];
    });
    if (bodies.size === 0) return;

    const seen = new Set<string>();
    visit(tree, 'element', (sup, index, parent) => {
      if (sup.tagName !== 'sup' || !parent || index === undefined) return;
      const ref = sup.children.find((c): c is Element => isElement(c, 'a') && 'dataFootnoteRef' in c.properties);
      if (!ref) return;

      const target = String(ref.properties.href).replace(/^#/, '');
      const label = (ref.children[0] as { value?: string })?.value ?? '';
      const id = `sn-${target.replace(/^user-content-fn-/, '')}`;

      // Second and later references to the same note just point at the first.
      const replacement = seen.has(target)
        ? h('sup.sn-again', [h('a', { href: `#${id}`, ariaLabel: `See note ${label}` }, label)])
        : h('span.sn', [
            h('button.sn-ref', { type: 'button', ariaExpanded: 'false', ariaControls: id, ariaLabel: `Note ${label}` }, label),
            h('span.sn-note', { id, role: 'note' }, [h('span.sn-num', { ariaHidden: 'true' }, label), ...(bodies.get(target) ?? [])]),
          ]);
      seen.add(target);
      parent.children[index] = replacement;
      return SKIP;
    });
  };
}
