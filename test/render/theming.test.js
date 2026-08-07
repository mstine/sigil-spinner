import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { generateSigil } from '../../src/generate.js';

/**
 * The phase's enforcement suite (D-42, D-43) — every REND-05/REND-06 claim
 * Phase 3 makes, proven mechanically across the FULL cross-product of every
 * planet times every option combination, from ONE generator helper
 * (`allRenders`) below. Adding a future option is a one-line change to that
 * generator; every guard in this file automatically extends to cover it.
 *
 * Uses `generateSigil` (the real public seam), not `renderSvg` directly, so
 * every guard exercises the actual option-resolution/validation path a
 * caller goes through — including `idPrefix` escaping and the `render`
 * block's shape.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const README_PATH = path.join(__dirname, '..', '..', 'README.md');

/** Canonical seven-planet order, matching `src/data/kamea.js`'s `PLANET_ORDER`. */
const PLANETS = ['saturn', 'jupiter', 'mars', 'sun', 'venus', 'mercury', 'moon'];

/**
 * The main cross-product fixture. Deliberately chosen (03-RESEARCH.md
 * Pitfall D) so no substring of it can coincidentally match an attribute
 * name, a class name, or a custom-property name — it contains none of
 * "style", "id", "grid", "glyph", "path", "node", "start", "end", "loop",
 * or "sigil" as a run of 4+ characters, and it's ALL CAPS while every
 * identifier this renderer emits is lowercase.
 */
const BASE_STATEMENT = 'I WILL SUCCEED';

/** Repeat-carrying fixture (same one `determinism.test.js` uses) — guarantees loops exist. */
const REPEAT_STATEMENT = 'BKT RISES';

/** Reduces to a single kept letter ('B') — the degenerate single-node case. */
const SINGLE_LETTER_STATEMENT = 'A B';

const IDPREFIX_VALUE = 'sig-a';

/** Scoped guard regexes (03-RESEARCH.md Pitfall D — never a bare substring check). */
const STYLE_ATTR = /\sstyle\s*=/;
const ID_ATTR = /\sid\s*=\s*"/;
const PAINT_ATTRS = /** @type {const} */ (['fill', 'stroke', 'stroke-width', 'opacity', 'font-size', 'font-family']);
const GEOMETRY_ATTRS = /** @type {const} */ ([
  'x',
  'y',
  'cx',
  'cy',
  'r',
  'x1',
  'y1',
  'x2',
  'y2',
  'd',
  'viewBox',
  'class',
  'id',
  'text-anchor',
  'dominant-baseline',
]);

/**
 * Extract every value of a given attribute, scoped to the exact attribute
 * name (leading whitespace, then the literal name, then `="`) so e.g.
 * `stroke=` never accidentally matches inside `stroke-width=`.
 *
 * @param {string} svg
 * @param {string} attr
 * @returns {string[]}
 */
function attrValues(svg, attr) {
  const escaped = attr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return [...svg.matchAll(new RegExp(`\\s${escaped}="([^"]*)"`, 'g'))].map((m) => m[1]);
}

/**
 * @typedef {Object} RenderCase
 * @property {string} label
 * @property {string} planet
 * @property {string} statement
 * @property {boolean} title
 * @property {boolean} idPrefixPresent
 * @property {string} svg
 */

/**
 * ONE generator helper yielding every render this suite guards. The main
 * cross-product is 7 planets x curve(2) x glyph(2) x title(2) x
 * idPrefix-present(2) = 112 renders on `BASE_STATEMENT`, plus the
 * repeat-carrying and single-kept-letter fixtures so degenerate/loop-bearing
 * shapes are inside the cross-product too (edge rows 14-16, B4).
 *
 * @returns {RenderCase[]}
 */
function allRenders() {
  /** @type {RenderCase[]} */
  const cases = [];

  for (const planet of PLANETS) {
    for (const curve of [false, true]) {
      for (const glyph of [false, true]) {
        for (const title of [false, true]) {
          for (const idPrefixPresent of [false, true]) {
            const options = {
              curve,
              glyph,
              title,
              idPrefix: idPrefixPresent ? IDPREFIX_VALUE : undefined,
            };
            const { svg } = generateSigil(BASE_STATEMENT, planet, options);
            cases.push({
              label: `${planet} curve=${curve} glyph=${glyph} title=${title} idPrefix=${idPrefixPresent}`,
              planet,
              statement: BASE_STATEMENT,
              title,
              idPrefixPresent,
              svg,
            });
          }
        }
      }
    }
  }

  // Repeat-carrying fixture, across all seven planets, straight mode — real
  // sigil-loop elements in the cross-product (edge row 14).
  for (const planet of PLANETS) {
    const { svg } = generateSigil(REPEAT_STATEMENT, planet);
    cases.push({
      label: `${planet} repeat-carrying, straight, no options`,
      planet,
      statement: REPEAT_STATEMENT,
      title: false,
      idPrefixPresent: false,
      svg,
    });
  }

  // B4: at least one all-layers-on render (grid always-present + glyph:true +
  // curve:true), on a repeat-carrying statement so loops are ALSO present —
  // every one of the seven layers (grid, glyph, path, nodes, start, end,
  // loops) appears in this single render.
  for (const planet of PLANETS) {
    const { svg } = generateSigil(REPEAT_STATEMENT, planet, { curve: true, glyph: true });
    cases.push({
      label: `${planet} B4 all-layers-on (repeat-carrying, curve, glyph)`,
      planet,
      statement: REPEAT_STATEMENT,
      title: false,
      idPrefixPresent: false,
      svg,
    });
  }

  // Single-kept-letter degenerate fixture, smallest and largest kameas.
  for (const planet of ['saturn', 'moon']) {
    const { svg } = generateSigil(SINGLE_LETTER_STATEMENT, planet);
    cases.push({
      label: `${planet} single-kept-letter`,
      planet,
      statement: SINGLE_LETTER_STATEMENT,
      title: false,
      idPrefixPresent: false,
      svg,
    });
  }

  return cases;
}

const ALL = allRenders();

describe('theming guard suite — cross-product generator (D-42, D-43)', () => {
  it('generates at least 112 renders covering every planet x curve x glyph x title x idPrefix combination', () => {
    expect(ALL.length).toBeGreaterThanOrEqual(112);
  });

  it('the generator source references every option this suite must extend to (curve, glyph, title, idPrefix)', () => {
    const source = readFileSync(path.join(__dirname, 'theming.test.js'), 'utf-8');
    expect(/curve/.test(source)).toBe(true);
    expect(/glyph/.test(source)).toBe(true);
    expect(/title/.test(source)).toBe(true);
    expect(/idPrefix/.test(source)).toBe(true);
  });
});

describe('theming guard suite — no inline style attribute (REND-05, D-42)', () => {
  it.each(ALL.map((c) => [c.label, c]))('never emits a style attribute — %s', (_label, c) => {
    expect(STYLE_ATTR.test(c.svg)).toBe(false);
  });
});

describe('theming guard suite — paint-attribute whitelist (REND-05, D-41, D-42)', () => {
  it.each(ALL.map((c) => [c.label, c]))(
    'every fill/stroke/stroke-width/opacity/font-size/font-family value is var(--sigil-*) or none — %s',
    (_label, c) => {
      let checked = 0;
      for (const attr of PAINT_ATTRS) {
        for (const value of attrValues(c.svg, attr)) {
          checked += 1;
          expect(value === 'none' || value.startsWith('var(--sigil-')).toBe(true);
        }
      }
      expect(checked).toBeGreaterThan(0);
    },
  );
});

describe('theming guard suite — geometry-attribute converse (REND-05, D-41, Pitfall B)', () => {
  it.each(ALL.map((c) => [c.label, c]))('var( never appears inside a geometry/layout attribute — %s', (_label, c) => {
    for (const attr of GEOMETRY_ATTRS) {
      for (const value of attrValues(c.svg, attr)) {
        expect(value.includes('var(')).toBe(false);
      }
    }
  });
});

describe('theming guard suite — non-empty var() fallbacks (REND-05, edge row 11)', () => {
  it.each(ALL.map((c) => [c.label, c]))('every var(--sigil-*, <fallback>) carries a non-empty fallback — %s', (_label, c) => {
    const refs = [...c.svg.matchAll(/var\(--sigil-[a-z0-9-]+,\s*([^)]*)\)/g)];
    expect(refs.length).toBeGreaterThan(0);
    for (const match of refs) {
      expect(match[1].trim().length).toBeGreaterThan(0);
    }
  });
});

describe('theming guard suite — custom-property name pattern (REND-05, edge row 12)', () => {
  const NAME_PATTERN = /^--sigil-[a-z0-9-]+$/;
  it.each(ALL.map((c) => [c.label, c]))('every emitted --sigil-* name is ASCII kebab-case — %s', (_label, c) => {
    const names = [...c.svg.matchAll(/var\((--sigil-[a-z0-9-]*[^,)]*)/g)].map((m) => m[1]);
    for (const name of names) {
      expect(NAME_PATTERN.test(name)).toBe(true);
    }
  });
});

/**
 * Extract the set of `--sigil-*` names a README (or a synthetic string in
 * the same shape) DOCUMENTS, matched on the table's own backtick-delimited
 * cell — this is exact-token-boundary matching by construction, since a Set
 * built from a capture group compares by STRING EQUALITY, never by
 * `readme.includes(name)` substring containment (backstop B-E1).
 *
 * @param {string} readmeText
 * @returns {Set<string>}
 */
function extractDocumentedNames(readmeText) {
  return new Set([...readmeText.matchAll(/\|\s*`(--sigil-[a-z0-9-]+)`\s*\|/g)].map((m) => m[1]));
}

/**
 * Extract the set of `--sigil-*` names actually EMITTED across every render
 * this suite generated.
 *
 * @returns {Set<string>}
 */
function extractEmittedNames() {
  /** @type {Set<string>} */
  const emitted = new Set();
  for (const c of ALL) {
    for (const m of c.svg.matchAll(/var\((--sigil-[a-z0-9-]+)/g)) {
      emitted.add(m[1]);
    }
  }
  return emitted;
}

describe('theming guard suite — README drift (REND-05, D-42)', () => {
  it('every --sigil-* property emitted anywhere in the cross-product is documented in README.md, matched on exact token boundaries', () => {
    const documented = extractDocumentedNames(readFileSync(README_PATH, 'utf-8'));
    const emitted = extractEmittedNames();
    expect(emitted.size).toBeGreaterThan(0);
    for (const name of emitted) {
      expect(documented.has(name)).toBe(true);
    }
  });

  it('has teeth: a synthetic README missing --sigil-grid-number-font (a strict prefix of --sigil-grid-number-font-size) is reported UNDOCUMENTED, not satisfied by containment (backstop B-E1)', () => {
    const syntheticReadme = [
      '| Property | Default | Element | Controls |',
      '|----------|---------|---------|----------|',
      '| `--sigil-grid-number-font-size` | order-dependent | `.sigil-grid-number` | Cell-number text size |',
    ].join('\n');
    const documented = extractDocumentedNames(syntheticReadme);
    // The longer name IS present.
    expect(documented.has('--sigil-grid-number-font-size')).toBe(true);
    // The strict-prefix shorter name is NOT — a naive `.includes()` check
    // would incorrectly report this as documented, because the longer
    // name's text contains the shorter name as a substring. Exact-token-
    // boundary Set-membership does not make that mistake.
    expect(documented.has('--sigil-grid-number-font')).toBe(false);
  });
});

describe('theming guard suite — id-free by default, single id with prefix (REND-06, D-43, D-44, edge row 15)', () => {
  it.each(ALL.filter((c) => !c.idPrefixPresent).map((c) => [c.label, c]))(
    'emits zero id attributes when idPrefix is absent — %s',
    (_label, c) => {
      expect(ID_ATTR.test(c.svg)).toBe(false);
    },
  );

  it.each(ALL.filter((c) => c.idPrefixPresent).map((c) => [c.label, c]))(
    'emits exactly one id attribute, on the root element, when idPrefix is supplied — %s',
    (_label, c) => {
      expect(c.svg.match(ID_ATTR) ?? []).toHaveLength(1);
      expect(c.svg).toMatch(new RegExp(`^<svg[^>]*\\sid="${IDPREFIX_VALUE}"`));
    },
  );
});

/** Fixed layer emission order, per D-39 — grid, glyph, path, nodes, start, end, loops. */
const LAYER_MARKERS = /** @type {const} */ ([
  'class="sigil-grid"',
  'class="sigil-glyph"',
  'class="sigil-path"',
  'class="sigil-node"',
  'class="sigil-start"',
  'class="sigil-end"',
  'class="sigil-loop"',
]);

describe('theming guard suite — fixed layer emission order (REND-06, D-39, edge row 16)', () => {
  it.each(ALL.map((c) => [c.label, c]))(
    'grid, glyph, path, nodes, start, end, loops appear in strictly increasing document order (when present) — %s',
    (_label, c) => {
      const indices = LAYER_MARKERS.map((marker) => c.svg.indexOf(marker)).filter((i) => i !== -1);
      const sorted = [...indices].sort((a, b) => a - b);
      expect(indices).toEqual(sorted);
      // The grid group itself is unconditional (D-32) — every render has it.
      expect(c.svg.indexOf('class="sigil-grid"')).toBeGreaterThan(-1);
    },
  );

  it('B4: at least one all-layers-on render (grid, glyph, path, nodes, start, end, loops ALL present) preserves the exact D-39 order', () => {
    const { svg } = generateSigil(REPEAT_STATEMENT, 'moon', { curve: true, glyph: true });
    const indices = LAYER_MARKERS.map((marker) => svg.indexOf(marker));
    // Every one of the seven markers is present in THIS specific render.
    for (const index of indices) {
      expect(index).toBeGreaterThan(-1);
    }
    const sorted = [...indices].sort((a, b) => a - b);
    expect(indices).toEqual(sorted);
  });
});

describe('theming guard suite — no statement leak outside title (D-16, prohibitions)', () => {
  it.each(ALL.filter((c) => !c.title).map((c) => [c.label, c]))(
    'no 4+ character run of the fixture statement appears anywhere when title is off — %s',
    (_label, c) => {
      const stripped = c.statement.replace(/\s+/g, '');
      for (let i = 0; i + 4 <= stripped.length; i += 1) {
        const window = stripped.slice(i, i + 4);
        expect(c.svg).not.toContain(window);
      }
    },
  );
});
