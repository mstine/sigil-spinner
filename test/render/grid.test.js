import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { renderSvg } from '../../src/render/svg.js';
import { buildPath } from '../../src/path/buildPath.js';
import { cellForNumber, gridSize, kameaGrid } from '../../src/data/kamea.js';
import { cellCenter } from '../../src/render/coords.js';

/**
 * Dedicated unit suite for the kamea grid layer (REND-03, 03-02) — every
 * assertion here is traceable to a numbered row in
 * `.planning/phases/03-themeable-embeddable-layers/03-EDGE-COVERAGE.md`
 * (rows 3 through 8) or to backstop B5. `test/render/svg.test.js` carries
 * the general sigil-anatomy and layer-order coverage this file does not
 * repeat.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const README_PATH = path.join(__dirname, '..', '..', 'README.md');

/** Canonical seven-planet order, matching `src/data/kamea.js`'s `PLANET_ORDER`. */
const PLANETS = ['saturn', 'jupiter', 'mars', 'sun', 'venus', 'mercury', 'moon'];

/** Same worked-example digit sequence every other Phase 3 test file reuses. */
const NUMBERS = [5, 3, 1, 3, 4];

/**
 * @param {string} planet
 * @returns {import('../../src/path/buildPath.js').PathModel}
 */
function pathFor(planet) {
  const order = gridSize(planet);
  const cells = NUMBERS.map((n) => cellForNumber(planet, n));
  return buildPath(NUMBERS, cells, planet, order);
}

/**
 * `renderSvg` helper — supplies the pathModel's real kamea matrix via
 * `options.kamea`, mirroring `generate.js`'s internal spread (D-35). These
 * unit tests build PathModels directly via `buildPath`, bypassing
 * `generate.js`, so they must supply this key themselves.
 *
 * @param {import('../../src/path/buildPath.js').PathModel} pathModel
 * @param {import('../../src/render/svg.js').RenderOptions} [options]
 * @returns {string}
 */
function render(pathModel, options = {}) {
  return renderSvg(pathModel, { ...options, kamea: kameaGrid(pathModel.planet) });
}

/**
 * Extract the `sigil-grid-lines` path's `d` attribute value from a rendered
 * SVG string.
 *
 * @param {string} svg
 * @returns {string}
 */
function latticeD(svg) {
  const match = svg.match(/class="sigil-grid-lines" d="([^"]*)"/);
  if (!match) {
    throw new Error('expected a sigil-grid-lines element with a d attribute');
  }
  return match[1];
}

/**
 * Parse a lattice `d` string into an ordered array of `{ command, args }`
 * pairs — one pair per line (each line is one `M...` token followed by one
 * `L...` token, per `gridLatticeD`'s emission shape).
 *
 * @param {string} d
 * @returns {{ m: string, l: string }[]}
 */
function parseLatticeLines(d) {
  const tokens = d.split(' ');
  /** @type {{ m: string, l: string }[]} */
  const lines = [];
  for (let i = 0; i < tokens.length; i += 2) {
    lines.push({ m: tokens[i], l: tokens[i + 1] });
  }
  return lines;
}

/**
 * Parse a lattice `d` string into its horizontal and vertical line
 * positions, in emission order (row 8's grid-position assertions read these
 * directly, never recomputing `i * cellSize` themselves).
 *
 * @param {string} d
 * @param {number} order
 * @returns {{ horizontal: number[], vertical: number[] }}
 */
function parseLatticePositions(d, order) {
  const lines = parseLatticeLines(d);
  const horizontalLines = lines.slice(0, order + 1);
  const verticalLines = lines.slice(order + 1);

  const horizontal = horizontalLines.map(({ m, l }) => {
    const mMatch = m.match(/^M0,([\d.]+)$/);
    const lMatch = l.match(/^L100,([\d.]+)$/);
    if (!mMatch || !lMatch || mMatch[1] !== lMatch[1]) {
      throw new Error(`malformed horizontal lattice line: M=${m} L=${l}`);
    }
    return Number(mMatch[1]);
  });

  const vertical = verticalLines.map(({ m, l }) => {
    const mMatch = m.match(/^M([\d.]+),0$/);
    const lMatch = l.match(/^L([\d.]+),100$/);
    if (!mMatch || !lMatch || mMatch[1] !== lMatch[1]) {
      throw new Error(`malformed vertical lattice line: M=${m} L=${l}`);
    }
    return Number(mMatch[1]);
  });

  return { horizontal, vertical };
}

describe.each(PLANETS)('Grid layer — %s (REND-03)', (planet) => {
  const order = gridSize(planet);

  it(`cardinality: exactly one sigil-grid-lines path and ${order}² sigil-grid-number elements, always present (edge row 3, row 5)`, () => {
    const svg = render(pathFor(planet));
    expect(svg.match(/class="sigil-grid-lines"/g) ?? []).toHaveLength(1);
    expect(svg.match(/class="sigil-grid-number"/g) ?? []).toHaveLength(order * order);
  });

  it('each boundary line is emitted exactly once — total line count is exactly 2 * (order + 1) (edge row 4)', () => {
    const svg = render(pathFor(planet));
    const d = latticeD(svg);
    const lines = parseLatticeLines(d);
    expect(lines).toHaveLength(2 * (order + 1));

    const { horizontal, vertical } = parseLatticePositions(d, order);
    expect(horizontal).toHaveLength(order + 1);
    expect(vertical).toHaveLength(order + 1);

    // The two axes share the identical position set (both derive from the
    // same `i * cellSize` sequence) — every distinct position therefore
    // appears exactly twice across the whole lattice (once per axis), which
    // is what proves the outer border is not redrawn on top of the i=0 and
    // i=order lines: there is no THIRD occurrence of any position.
    const combined = [...horizontal, ...vertical];
    const counts = new Map();
    for (const pos of combined) {
      counts.set(pos, (counts.get(pos) ?? 0) + 1);
    }
    expect(counts.size).toBe(order + 1);
    for (const count of counts.values()) {
      expect(count).toBe(2);
    }
  });

  it('grid-number text is ASCII digits only, with string length equal to code-point length (edge row 6)', () => {
    const svg = render(pathFor(planet));
    const values = [...svg.matchAll(/class="sigil-grid-number"[^>]*>([^<]*)</g)].map((m) => m[1]);
    expect(values.length).toBe(order * order);
    for (const value of values) {
      expect(/^[0-9]{1,2}$/.test(value)).toBe(true);
      expect(value.length).toBe(Array.from(value).length);
    }
  });

  it('grid-number elements are emitted in fixed row-major order matching kameaGrid(planet).flat() (edge row 7)', () => {
    const svg = render(pathFor(planet));
    const numbers = [...svg.matchAll(/class="sigil-grid-number"[^>]*>(\d+)</g)].map((m) => Number(m[1]));
    expect(numbers).toEqual(kameaGrid(planet).flat());

    // Re-render and confirm the emission order is stable across runs, not
    // merely correct on one call.
    const secondNumbers = [...render(pathFor(planet)).matchAll(/class="sigil-grid-number"[^>]*>(\d+)</g)].map((m) =>
      Number(m[1]),
    );
    expect(secondNumbers).toEqual(numbers);
  });

  it('every grid-number x/y equals cellCenter(row, col, order) — the same shared transform pathLayer/nodeLayer use (Pitfall 10)', () => {
    const svg = render(pathFor(planet));
    const positions = [...svg.matchAll(/class="sigil-grid-number" x="([\d.]+)" y="([\d.]+)"/g)].map((m) => ({
      x: Number(m[1]),
      y: Number(m[2]),
    }));
    expect(positions).toHaveLength(order * order);

    const expected = [];
    for (let row = 0; row < order; row += 1) {
      for (let col = 0; col < order; col += 1) {
        const { x, y } = cellCenter(row, col, order);
        expected.push({ x, y });
      }
    }
    expect(positions).toEqual(expected);
  });

  it('lattice line positions are computed via multiplication, rounded once at precision 3, and are byte-stable across runs (edge row 8)', () => {
    const first = render(pathFor(planet));
    const second = render(pathFor(planet));
    expect(first).toBe(second);

    const { horizontal, vertical } = parseLatticePositions(latticeD(first), order);
    for (const pos of [...horizontal, ...vertical]) {
      // Never more than 3 decimal places (GEOMETRY_PRECISION) — this would
      // fail immediately if a value carried IEEE-754 accumulation drift
      // beyond the rounded precision.
      const decimalPlaces = (String(pos).split('.')[1] ?? '').length;
      expect(decimalPlaces).toBeLessThanOrEqual(3);
    }
  });

  it('backstop B5 (mechanical half): the group opacity fallback is 0, the lattice fill is a literal "none", and every grid-number carries a fill var() reference', () => {
    const svg = render(pathFor(planet));
    expect(svg).toContain('class="sigil-grid" opacity="var(--sigil-grid-opacity, 0)"');
    expect(svg).toMatch(/class="sigil-grid-lines"[^>]*\sfill="none"/);
    const numberFills = [...svg.matchAll(/class="sigil-grid-number"[^>]*\sfill="([^"]*)"/g)].map((m) => m[1]);
    expect(numberFills.length).toBe(order * order);
    for (const fill of numberFills) {
      expect(fill.startsWith('var(--sigil-grid-number-fill')).toBe(true);
    }
  });
});

describe('Grid layer — cardinality at both kamea extremes, literal positions (edge row 3, row 8)', () => {
  it('saturn (order 3): exactly 4 horizontal + 4 vertical lines, 9 numbers, and the literal position sequence 0, 33.333, 66.667, 100', () => {
    const svg = render(pathFor('saturn'));
    const { horizontal, vertical } = parseLatticePositions(latticeD(svg), 3);
    expect(horizontal).toEqual([0, 33.333, 66.667, 100]);
    expect(vertical).toEqual([0, 33.333, 66.667, 100]);
    expect(svg.match(/class="sigil-grid-number"/g) ?? []).toHaveLength(9);
  });

  it('moon (order 9): exactly 10 horizontal + 10 vertical lines, 81 numbers, and the literal position sequence 0, 11.111 .. 100', () => {
    const svg = render(pathFor('moon'));
    const { horizontal, vertical } = parseLatticePositions(latticeD(svg), 9);
    const expected = [0, 11.111, 22.222, 33.333, 44.444, 55.556, 66.667, 77.778, 88.889, 100];
    expect(horizontal).toEqual(expected);
    expect(vertical).toEqual(expected);
    expect(svg.match(/class="sigil-grid-number"/g) ?? []).toHaveLength(81);
  });

  it('venus (order 7, the other non-terminating cellSize 100/7) is byte-stable across two runs', () => {
    expect(render(pathFor('venus'))).toBe(render(pathFor('venus')));
  });
});

describe('Grid layer — no gridSize outside 3..13 is reachable (edge row 3)', () => {
  it('gridSize throws E_UNKNOWN_PLANET before any grid geometry would be computed for an unrecognized planet', () => {
    expect(() => gridSize('nibiru')).toThrow(/E_UNKNOWN_PLANET|unknown planet/i);
  });
});

describe('Grid layer — every --sigil-grid-* property emitted in default mode appears in the README theming table (D-42, grid-scoped)', () => {
  it('collects every var(--sigil-grid-*) reference across all seven planets and confirms each is documented', () => {
    const readme = readFileSync(README_PATH, 'utf-8');
    const documented = new Set([...readme.matchAll(/\|\s*`(--sigil-[a-z0-9-]+)`\s*\|/g)].map((m) => m[1]));
    const emitted = new Set();
    for (const planet of PLANETS) {
      const svg = render(pathFor(planet));
      for (const m of svg.matchAll(/var\((--sigil-grid-[a-z0-9-]+)/g)) {
        emitted.add(m[1]);
      }
    }
    // All six grid properties must actually appear at least once across the
    // seven planets, or this test would vacuously pass with an empty set.
    expect(emitted.size).toBe(6);
    for (const name of emitted) {
      expect(documented.has(name)).toBe(true);
    }
  });

  it('the strict-prefix pair --sigil-grid-number-font and --sigil-grid-number-font-size are each independently documented (B-E1)', () => {
    const readme = readFileSync(README_PATH, 'utf-8');
    const documented = new Set([...readme.matchAll(/\|\s*`(--sigil-[a-z0-9-]+)`\s*\|/g)].map((m) => m[1]));
    expect(documented.has('--sigil-grid-number-font')).toBe(true);
    expect(documented.has('--sigil-grid-number-font-size')).toBe(true);
  });
});
