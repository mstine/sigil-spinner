import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { renderSvg } from '../../src/render/svg.js';
import { buildPath } from '../../src/path/buildPath.js';
import { cellForNumber, gridSize, kameaGrid } from '../../src/data/kamea.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const README_PATH = path.join(__dirname, '..', '..', 'README.md');

const ORDER = gridSize('saturn');
// Worked example: "I WILL SUCCEED" -> digits 5,3,1,3,4 -> Saturn cells
// (1,1),(1,0),(2,1),(1,0),(0,0). Cell (1,0) is visited twice, not consecutively.
const NUMBERS = [5, 3, 1, 3, 4];
const CELLS = NUMBERS.map((n) => cellForNumber('saturn', n));
const WORKED_PATH = buildPath(NUMBERS, CELLS, 'saturn', ORDER);

/** Canonical seven-planet order, matching `src/data/kamea.js`'s `PLANET_ORDER`. */
const PLANETS = ['saturn', 'jupiter', 'mars', 'sun', 'venus', 'mercury', 'moon'];

function onePointPath() {
  const cells = [cellForNumber('saturn', 4)];
  return buildPath([4], cells, 'saturn', ORDER);
}

/**
 * Build a worked-example PathModel for every one of the seven planets — the
 * same digit sequence, since every kamea contains cells 1-9, so the only
 * thing that varies is geometry (D-42/D-43 guard tests must hold at every
 * kamea order, not just Saturn's coarse 3x3).
 *
 * @returns {import('../../src/path/buildPath.js').PathModel[]}
 */
function sevenPlanetPaths() {
  return PLANETS.map((planet) => {
    const order = gridSize(planet);
    const cells = NUMBERS.map((n) => cellForNumber(planet, n));
    return buildPath(NUMBERS, cells, planet, order);
  });
}

/** Scoped guard regexes (03-RESEARCH.md Pitfall D — never a bare substring check). */
const STYLE_ATTR = /\sstyle\s*=/;
const PAINT_ATTRS = ['fill', 'stroke', 'opacity', 'stroke-width', 'font-size', 'font-family'];

/**
 * `renderSvg` helper for these unit tests — always supplies the pathModel's
 * real kamea matrix via `options.kamea`, the internally-supplied render-
 * option key `generate.js` computes and spreads in production (D-35). These
 * unit tests build PathModels directly via `buildPath`, bypassing
 * `generate.js` entirely, so they must supply this key themselves — the grid
 * layer (03-02, D-32) is unconditional and has no matrix to read otherwise.
 *
 * @param {import('../../src/path/buildPath.js').PathModel} pathModel
 * @param {import('../../src/render/svg.js').RenderOptions} [options]
 * @returns {string}
 */
function render(pathModel, options = {}) {
  return renderSvg(pathModel, { ...options, kamea: kameaGrid(pathModel.planet) });
}

/**
 * @param {string} svg
 * @param {string} attr
 * @returns {string[]}
 */
function paintAttrValues(svg, attr) {
  return [...svg.matchAll(new RegExp(`\\s${attr}="([^"]*)"`, 'g'))].map((m) => m[1]);
}

describe('renderSvg — sigil anatomy', () => {
  it('emits exactly one sigil-start element at the first point', () => {
    const svg = render(WORKED_PATH);
    expect(svg.match(/class="sigil-start"/g) ?? []).toHaveLength(1);
  });

  it('emits exactly one sigil-end element at the last point', () => {
    const svg = render(WORKED_PATH);
    expect(svg.match(/class="sigil-end"/g) ?? []).toHaveLength(1);
  });

  it('emits exactly five sigil-node elements, including both at the twice-visited cell', () => {
    const svg = render(WORKED_PATH);
    expect(svg.match(/class="sigil-node"/g) ?? []).toHaveLength(5);
  });

  it('renders a one-point sigil with one node, one start, one end, and no empty path element', () => {
    const svg = render(onePointPath());
    expect(svg.match(/class="sigil-node"/g) ?? []).toHaveLength(1);
    expect(svg.match(/class="sigil-start"/g) ?? []).toHaveLength(1);
    expect(svg.match(/class="sigil-end"/g) ?? []).toHaveLength(1);
    expect(svg).not.toMatch(/class="sigil-path"/);
    expect(svg).not.toMatch(/ d=""/);
  });

  it('assembles layers in the fixed order: grid, then path, then nodes, then start, then end (glyph off, D-39)', () => {
    const svg = render(WORKED_PATH);
    const gridIndex = svg.indexOf('class="sigil-grid"');
    const pathIndex = svg.indexOf('class="sigil-path"');
    const firstNodeIndex = svg.indexOf('class="sigil-node"');
    const startIndex = svg.indexOf('class="sigil-start"');
    const endIndex = svg.indexOf('class="sigil-end"');
    expect(gridIndex).toBeGreaterThan(-1);
    expect(gridIndex).toBeLessThan(pathIndex);
    expect(pathIndex).toBeLessThan(firstNodeIndex);
    expect(firstNodeIndex).toBeLessThan(startIndex);
    expect(startIndex).toBeLessThan(endIndex);
  });

  it('assembles layers in the fixed order with glyph on: grid, glyph, then path, then nodes, then start, then end (D-39)', () => {
    const svg = render(WORKED_PATH, { glyph: true });
    const gridIndex = svg.indexOf('class="sigil-grid"');
    const glyphIndex = svg.indexOf('class="sigil-glyph"');
    const pathIndex = svg.indexOf('class="sigil-path"');
    const firstNodeIndex = svg.indexOf('class="sigil-node"');
    const startIndex = svg.indexOf('class="sigil-start"');
    const endIndex = svg.indexOf('class="sigil-end"');
    expect(gridIndex).toBeGreaterThan(-1);
    expect(gridIndex).toBeLessThan(glyphIndex);
    expect(glyphIndex).toBeLessThan(pathIndex);
    expect(pathIndex).toBeLessThan(firstNodeIndex);
    expect(firstNodeIndex).toBeLessThan(startIndex);
    expect(startIndex).toBeLessThan(endIndex);
  });

  it('produces byte-identical output across two runs', () => {
    expect(render(WORKED_PATH)).toBe(render(WORKED_PATH));
  });

  it('omits the statement entirely when the title option is absent', () => {
    const svg = render(WORKED_PATH, { statement: 'I WILL SUCCEED' });
    expect(svg).not.toContain('SUCCEED');
    expect(svg).not.toContain('<title>');
  });

  it('embeds the XML-escaped statement when the title option is enabled', () => {
    const statement = 'I <3> & "succeed"';
    const svg = render(WORKED_PATH, { title: true, statement });
    expect(svg).toContain('<title>I &lt;3&gt; &amp; &quot;succeed&quot;</title>');
  });

  it('every stroke/fill attribute is a var() reference with a fallback, or none, in default (grid-present) mode on all seven planets', () => {
    for (const pathModel of sevenPlanetPaths()) {
      const svg = render(pathModel, { title: true, statement: 'test' });
      const paintAttrs = [...svg.matchAll(/(?:stroke|fill)="([^"]*)"/g)].map((m) => m[1]);
      expect(paintAttrs.length).toBeGreaterThan(0);
      for (const value of paintAttrs) {
        expect(value === 'none' || value.startsWith('var(--sigil-')).toBe(true);
      }
    }
  });

  it('never emits an inline style attribute, in default (grid-present) mode on all seven planets', () => {
    for (const pathModel of sevenPlanetPaths()) {
      const svg = render(pathModel);
      expect(STYLE_ATTR.test(svg)).toBe(false);
    }
  });

  it('matches the worked-example snapshot', () => {
    expect(render(WORKED_PATH)).toMatchSnapshot();
  });
});

describe('renderSvg — grid layer, always present (REND-03, D-32, D-33, D-34, D-39)', () => {
  it.each(
    /** @type {[string, number][]} */ ([
      ['saturn', 3],
      ['moon', 9],
    ]),
  )('emits exactly one sigil-grid-lines path and order-squared sigil-grid-number elements, hidden by default, for %s (order %i)', (planet, expectedOrder) => {
    const cells = NUMBERS.map((n) => cellForNumber(planet, n));
    const pathModel = buildPath(NUMBERS, cells, planet, expectedOrder);
    const svg = render(pathModel);
    expect(gridSize(planet)).toBe(expectedOrder);
    expect(svg.match(/class="sigil-grid-lines"/g) ?? []).toHaveLength(1);
    expect(svg.match(/class="sigil-grid-number"/g) ?? []).toHaveLength(expectedOrder * expectedOrder);
    expect(svg).toContain('class="sigil-grid" opacity="var(--sigil-grid-opacity, 0)"');
  });

  it('carries a literal fill="none" on the lattice path and displays the real kamea in row-major order', () => {
    const svg = render(WORKED_PATH);
    expect(svg).toMatch(/class="sigil-grid-lines"[^>]*fill="none"/);
    const numbers = [...svg.matchAll(/class="sigil-grid-number"[^>]*>(\d+)</g)].map((m) => Number(m[1]));
    expect(numbers).toEqual(kameaGrid('saturn').flat());
  });

  it('assembles layers with the grid ahead of the glyph, ahead of the path (D-39)', () => {
    const svg = render(WORKED_PATH, { glyph: true });
    const gridIndex = svg.indexOf('class="sigil-grid"');
    const glyphIndex = svg.indexOf('class="sigil-glyph"');
    const pathIndex = svg.indexOf('class="sigil-path"');
    expect(gridIndex).toBeGreaterThan(-1);
    expect(gridIndex).toBeLessThan(glyphIndex);
    expect(glyphIndex).toBeLessThan(pathIndex);
  });

  it('produces byte-identical grid output across two runs', () => {
    expect(render(WORKED_PATH)).toBe(render(WORKED_PATH));
  });

  it('the render layer never imports src/data/kamea.js directly (D-35)', () => {
    const svgSource = readFileSync(path.join(__dirname, '..', '..', 'src', 'render', 'svg.js'), 'utf-8');
    expect(/^\s*import[^;]*data\/kamea/m.test(svgSource)).toBe(false);
  });
});

describe('renderSvg — glyph-mode guards across all seven planets (REND-04, REND-05, D-42)', () => {
  it('never emits a style attribute in glyph mode, on any of the seven planets', () => {
    for (const pathModel of sevenPlanetPaths()) {
      const svg = render(pathModel, { glyph: true });
      expect(STYLE_ATTR.test(svg)).toBe(false);
    }
  });

  it('every paint-family attribute value is var(--sigil-*) or a bare non-color keyword (none), in glyph mode, on all seven planets', () => {
    for (const pathModel of sevenPlanetPaths()) {
      const svg = render(pathModel, { glyph: true });
      let checked = 0;
      for (const attr of PAINT_ATTRS) {
        for (const value of paintAttrValues(svg, attr)) {
          checked += 1;
          expect(value === 'none' || value.startsWith('var(--sigil-')).toBe(true);
        }
      }
      expect(checked).toBeGreaterThan(0);
    }
  });

  it('every --sigil-* property emitted in glyph mode, on any of the seven planets, appears in the README theming table (D-42)', () => {
    const readme = readFileSync(README_PATH, 'utf-8');
    const documented = new Set([...readme.matchAll(/\|\s*`(--sigil-[a-z0-9-]+)`\s*\|/g)].map((m) => m[1]));
    const emitted = new Set();
    for (const pathModel of sevenPlanetPaths()) {
      const svg = render(pathModel, { glyph: true });
      for (const m of svg.matchAll(/var\((--sigil-[a-z0-9-]+)/g)) {
        emitted.add(m[1]);
      }
    }
    expect(emitted.size).toBeGreaterThan(0);
    for (const name of emitted) {
      expect(documented.has(name)).toBe(true);
    }
  });
});

// Repeat-loop fixtures (Phase 2, D-17-D-20, D-27). Built via buildPath from
// real digit sequences, not synthetic objects, so these exercise the same
// path detectRepeats/loopLayer take in production.
function tripleRepeatPath() {
  const cells = [cellForNumber('saturn', 5), cellForNumber('saturn', 5), cellForNumber('saturn', 5)];
  return buildPath([5, 5, 5], cells, 'saturn', ORDER);
}

function repeatAtSecondPointPath() {
  // First two digits equal (5, 5), third distinct (3) — the repeat's
  // atPoint (1) sits nearest the start; exercises the "near the boundary"
  // path without suppressing either the start marker or the loop (D-19).
  const cells = [cellForNumber('saturn', 5), cellForNumber('saturn', 5), cellForNumber('saturn', 3)];
  return buildPath([5, 5, 3], cells, 'saturn', ORDER);
}

function repeatAtLastPointPath() {
  // Last two digits equal (5, 5) — the repeat's atPoint equals
  // pathModel.end exactly, exercising the boundary-offset branch (D-19).
  const cells = [cellForNumber('saturn', 3), cellForNumber('saturn', 5), cellForNumber('saturn', 5)];
  return buildPath([3, 5, 5], cells, 'saturn', ORDER);
}

function digitTwoTripleRepeatPath() {
  // A second, independent run-of-three fixture (digits 2, 2, 2) for the
  // nesting-anchor pin — kept separate from tripleRepeatPath (digit 5) so
  // that fixture's own existing radii-distinctness test stays untouched.
  const cells = [cellForNumber('saturn', 2), cellForNumber('saturn', 2), cellForNumber('saturn', 2)];
  return buildPath([2, 2, 2], cells, 'saturn', ORDER);
}

/**
 * Extract every `sigil-loop` element's two-arc geometry from an SVG string.
 * The regex is deliberately strict to the exact `d` shape the locked
 * geometry specification requires — `M p A r,r 0 1,1 q A r,r 0 1,1 p` — so a
 * loop with any other number of arc commands, or non-circular (rx !== ry)
 * radii, simply fails to match rather than partially matching.
 */
const LOOP_D_RE =
  /class="sigil-loop" d="M([-\d.]+),([-\d.]+) A([\d.]+),([\d.]+) 0 1,1 ([-\d.]+),([-\d.]+) A([\d.]+),([\d.]+) 0 1,1 ([-\d.]+),([-\d.]+)"/g;

/**
 * @param {string} svg
 */
function extractLoops(svg) {
  return [...svg.matchAll(LOOP_D_RE)].map((m) => ({
    startX: Number(m[1]),
    startY: Number(m[2]),
    r1x: Number(m[3]),
    r1y: Number(m[4]),
    midX: Number(m[5]),
    midY: Number(m[6]),
    r2x: Number(m[7]),
    r2y: Number(m[8]),
    endX: Number(m[9]),
    endY: Number(m[10]),
  }));
}

describe('renderSvg — repeat loops (Phase 2)', () => {
  it('renders two sigil-loop elements with distinct arc radii for a run of three equal digits (D-18)', () => {
    const svg = render(tripleRepeatPath());
    const radii = [...svg.matchAll(/class="sigil-loop" d="M[-\d.]+,[-\d.]+ A([\d.]+),/g)].map((m) => Number(m[1]));
    expect(radii).toHaveLength(2);
    expect(new Set(radii).size).toBe(2);
  });

  it('renders both a sigil-start element and a sigil-loop element when a repeat sits near the start (D-19)', () => {
    const svg = render(repeatAtSecondPointPath());
    expect(svg.match(/class="sigil-start"/g) ?? []).toHaveLength(1);
    expect(svg.match(/class="sigil-loop"/g) ?? []).toHaveLength(1);
  });

  it('renders both a sigil-end element and a sigil-loop element when a repeat lands on the last point (D-19)', () => {
    const svg = render(repeatAtLastPointPath());
    expect(svg.match(/class="sigil-end"/g) ?? []).toHaveLength(1);
    expect(svg.match(/class="sigil-loop"/g) ?? []).toHaveLength(1);
  });

  it('offsets the end bar from the start circle for a one-kept-letter sigil (D-27, CONS-03)', () => {
    const svg = render(onePointPath());
    expect(svg.match(/class="sigil-node"/g) ?? []).toHaveLength(1);
    expect(svg.match(/class="sigil-start"/g) ?? []).toHaveLength(1);
    expect(svg.match(/class="sigil-end"/g) ?? []).toHaveLength(1);

    const startMatch = svg.match(/class="sigil-start" cx="([\d.-]+)" cy="([\d.-]+)"/);
    const endMatch = svg.match(/class="sigil-end" x1="([\d.-]+)" y1="([\d.-]+)" x2="([\d.-]+)" y2="([\d.-]+)"/);
    expect(startMatch).not.toBeNull();
    expect(endMatch).not.toBeNull();
    if (!startMatch || !endMatch) {
      throw new Error('expected both sigil-start and sigil-end markers to be present');
    }
    const endMidX = (Number(endMatch[1]) + Number(endMatch[3])) / 2;
    const endMidY = (Number(endMatch[2]) + Number(endMatch[4])) / 2;
    expect([endMidX, endMidY]).not.toEqual([Number(startMatch[1]), Number(startMatch[2])]);
  });

  it('never emits an inline style attribute or a bare color literal when loops are present', () => {
    const svg = render(tripleRepeatPath());
    expect(svg).not.toMatch(/ style=/);
    const paintAttrs = [...svg.matchAll(/(?:stroke|fill)="([^"]*)"/g)].map((m) => m[1]);
    expect(paintAttrs.length).toBeGreaterThan(0);
    for (const value of paintAttrs) {
      expect(value === 'none' || value.startsWith('var(--sigil-')).toBe(true);
    }
  });

  it('produces byte-identical output across two runs, including loop geometry (INT-03)', () => {
    expect(render(tripleRepeatPath())).toBe(render(tripleRepeatPath()));
  });

  it.each([
    ['a run of three equal digits', tripleRepeatPath],
    ['a repeat near the start', repeatAtSecondPointPath],
    ['a repeat at the last point', repeatAtLastPointPath],
  ])('anchors every sigil-loop d value at the repeated cell center for %s (G-02-1)', (_label, buildFixture) => {
    const pathModel = buildFixture();
    const svg = render(pathModel);
    const loops = extractLoops(svg);
    const expectedLoopCount = pathModel.repeats.reduce((sum, repeat) => sum + repeat.count, 0);
    expect(loops).toHaveLength(expectedLoopCount);
    expect(loops.length).toBeGreaterThan(0);

    for (const repeat of pathModel.repeats) {
      const cell = pathModel.points[repeat.atPoint];
      for (const loop of loops) {
        // Leading move-to and trailing coordinate pair both equal the
        // repeated cell's own center — the marker is connected, not
        // translated away from the point it marks (D-19: anchor never
        // moves; only radius may vary).
        expect(loop.startX).toBe(cell.x);
        expect(loop.startY).toBe(cell.y);
        expect(loop.endX).toBe(cell.x);
        expect(loop.endY).toBe(cell.y);
      }
    }
  });

  it('nests loops sharing one anchor with growing, equal-per-arc radii for digits 2,2,2 (D-18, G-02-1)', () => {
    const pathModel = digitTwoTripleRepeatPath();
    const svg = render(pathModel);
    const loops = extractLoops(svg);
    expect(loops).toHaveLength(2);

    const cell = pathModel.points[pathModel.repeats[0].atPoint];
    for (const loop of loops) {
      expect(loop.startX).toBe(cell.x);
      expect(loop.startY).toBe(cell.y);
      expect(loop.endX).toBe(cell.x);
      expect(loop.endY).toBe(cell.y);
      // Circle, not ellipse — rx equals ry within each arc command.
      expect(loop.r1x).toBe(loop.r1y);
      expect(loop.r2x).toBe(loop.r2y);
      // Both arc commands within one d share the same radius (one loop).
      expect(loop.r1x).toBe(loop.r2x);
    }
    // Nested loops differ only by radius (D-18: countable, not stacked).
    expect(loops[0].r1x).not.toBe(loops[1].r1x);
  });
});
