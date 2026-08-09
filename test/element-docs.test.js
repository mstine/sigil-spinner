import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * README/element attribute-table drift guard (D-97).
 *
 * Reads `SigilSpinnerElement.observedAttributes` from
 * `src/element/sigil-spinner-element.js` (the source of truth — never
 * restated as a literal here, per the D-55/D-61/D-65 "guards are keyed, not
 * transcribed" precedent) and asserts the README's documented element
 * attribute table matches it exactly, in both directions. A drift between
 * the element's real attribute contract and the docs fails here, on
 * whoever introduces it, rather than surfacing as a broken copy-paste for a
 * new consumer embedding the element.
 *
 * This guard reads `src/element/sigil-spinner-element.js` as TEXT and never
 * imports it: the module dereferences `HTMLElement` at class-definition
 * time (a bare `class extends HTMLElement`), which throws
 * `ReferenceError: HTMLElement is not defined` under plain Node/Vitest —
 * the same constraint `test/pack-install.test.js`'s resolve-only `./element`
 * probe works around. Parsing source as text rather than executing it is
 * the same methodology `test/citations.test.js` already uses on `.js`
 * sources.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, '..');

const elementSource = readFileSync(
  path.join(REPO_ROOT, 'src/element/sigil-spinner-element.js'),
  'utf-8',
);
const readme = readFileSync(path.join(REPO_ROOT, 'README.md'), 'utf-8');

/**
 * Parse the `observedAttributes` array literal out of the element's source
 * TEXT — never `import`ed, per this file's header comment.
 * @param {string} source
 * @returns {Set<string>}
 */
function parseObservedAttributes(source) {
  const match = source.match(/static get observedAttributes\(\)\s*{\s*return\s*\[([^\]]*)\]/);
  if (!match) {
    throw new Error(
      'could not find a `static get observedAttributes() { return [...] }` literal in src/element/sigil-spinner-element.js',
    );
  }
  const names = match[1]
    .split(',')
    .map((entry) => entry.trim().replace(/^['"]|['"]$/g, ''))
    .filter((entry) => entry.length > 0);
  return new Set(names);
}

/**
 * Parse the README's `### Attributes` table (under `## The
 * \`<sigil-spinner>\` Custom Element`) for its documented attribute names —
 * the first, backtick-wrapped cell of each data row.
 * @param {string} md
 * @returns {Set<string>}
 */
function parseReadmeAttributes(md) {
  const sectionMatch = md.match(/### Attributes\n([\s\S]*?)\n###/);
  if (!sectionMatch) {
    throw new Error('could not find a "### Attributes" table section in README.md');
  }
  const section = sectionMatch[1];
  const names = new Set();
  const rowRe = /^\|\s*`([a-z-]+)`\s*\|/gm;
  let match;
  while ((match = rowRe.exec(section)) !== null) {
    names.add(match[1]);
  }
  return names;
}

describe('README/element attribute-table drift guard (D-97)', () => {
  it('parses a non-empty attribute set from both the element source and the README table', () => {
    const codeAttributes = parseObservedAttributes(elementSource);
    const readmeAttributes = parseReadmeAttributes(readme);
    expect(codeAttributes.size, 'parsed zero attributes from observedAttributes').toBeGreaterThan(0);
    expect(readmeAttributes.size, 'parsed zero attributes from the README table').toBeGreaterThan(0);
  });

  it("the README's documented attribute set matches observedAttributes exactly, in both directions", () => {
    const codeAttributes = parseObservedAttributes(elementSource);
    const readmeAttributes = parseReadmeAttributes(readme);

    const readmeOnly = [...readmeAttributes].filter((name) => !codeAttributes.has(name));
    const codeOnly = [...codeAttributes].filter((name) => !readmeAttributes.has(name));

    expect(
      readmeOnly,
      `README documents attribute(s) not in observedAttributes: ${readmeOnly.join(', ')}`,
    ).toEqual([]);
    expect(
      codeOnly,
      `observedAttributes has attribute(s) undocumented in README: ${codeOnly.join(', ')}`,
    ).toEqual([]);
  });
});
