import { h } from 'hastscript';
import { toString } from 'hast-util-to-string';
import type { Element, ElementContent, Root, RootContent } from 'hast';
import type { VFile } from 'vfile';

const LEVELS: Record<string, number> = { h2: 2, h3: 3 };

const isBibliography = (n: RootContent): n is Element =>
  n.type === 'element' && n.properties.id === 'refs';

/**
 * Wraps each h2/h3 and the content under it in a collapsible section.
 * Expanded by default, and stays expanded without JS; the toggle button is
 * enhanced client-side, which collapses the body with `hidden="until-found"`.
 * The bibliography is pulled out first and appended as its own,
 * non-collapsible section with a heading.
 */
export function rehypeSections() {
  return (tree: Root, file: VFile) => {
    const frontmatter = (file.data as { astro?: { frontmatter: Record<string, unknown> } }).astro?.frontmatter;
    const refs = tree.children.find(isBibliography);
    if (refs) tree.children = tree.children.filter((n) => n !== refs);

    if (frontmatter?.collapsible !== false) {
      const root: { level: number; children: (RootContent | ElementContent)[] } = { level: 1, children: [] };
      const stack = [root];

      for (const node of tree.children) {
        const level = node.type === 'element' ? LEVELS[node.tagName] : undefined;
        if (!level) {
          stack.at(-1)!.children.push(node);
          continue;
        }
        while (stack.at(-1)!.level >= level) stack.pop();

        const heading = node as Element;
        const id = String(heading.properties.id ?? '');
        const body = h('div.sec-body', { id: `${id}-body` });
        const section = h('section.sec', { dataLevel: level }, [
          h('div.sec-head', [
            h(
              'button.sec-toggle',
              { type: 'button', ariaExpanded: 'true', ariaControls: `${id}-body`, ariaLabel: `Collapse section: ${toString(heading)}` },
              [h('span', { ariaHidden: 'true' }, '▾')],
            ),
            heading,
          ]),
          body,
        ]);
        stack.at(-1)!.children.push(section);
        stack.push({ level, children: body.children });
      }
      tree.children = root.children as RootContent[];
    }

    if (refs) {
      tree.children.push(
        h('section.bibliography', { ariaLabelledby: 'references' }, [h('h2', { id: 'references' }, 'References'), refs]),
      );
    }
  };
}
