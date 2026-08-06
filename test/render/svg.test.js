import { describe, expect, it } from 'vitest';
import { renderSvg } from '../../src/render/svg.js';
import { buildPath } from '../../src/path/buildPath.js';
import { cellForNumber, gridSize } from '../../src/data/kamea.js';

const ORDER = gridSize('saturn');
// Worked example: "I WILL SUCCEED" -> digits 5,3,1,3,4 -> Saturn cells
// (1,1),(1,0),(2,1),(1,0),(0,0). Cell (1,0) is visited twice, not consecutively.
const NUMBERS = [5, 3, 1, 3, 4];
const CELLS = NUMBERS.map((n) => cellForNumber('saturn', n));
const WORKED_PATH = buildPath(NUMBERS, CELLS, 'saturn', ORDER);

function onePointPath() {
  const cells = [cellForNumber('saturn', 4)];
  return buildPath([4], cells, 'saturn', ORDER);
}

describe('renderSvg — sigil anatomy', () => {
  it('emits exactly one sigil-start element at the first point', () => {
    const svg = renderSvg(WORKED_PATH);
    expect(svg.match(/class="sigil-start"/g) ?? []).toHaveLength(1);
  });

  it('emits exactly one sigil-end element at the last point', () => {
    const svg = renderSvg(WORKED_PATH);
    expect(svg.match(/class="sigil-end"/g) ?? []).toHaveLength(1);
  });

  it('emits exactly five sigil-node elements, including both at the twice-visited cell', () => {
    const svg = renderSvg(WORKED_PATH);
    expect(svg.match(/class="sigil-node"/g) ?? []).toHaveLength(5);
  });

  it('renders a one-point sigil with one node, one start, one end, and no empty path element', () => {
    const svg = renderSvg(onePointPath());
    expect(svg.match(/class="sigil-node"/g) ?? []).toHaveLength(1);
    expect(svg.match(/class="sigil-start"/g) ?? []).toHaveLength(1);
    expect(svg.match(/class="sigil-end"/g) ?? []).toHaveLength(1);
    expect(svg).not.toMatch(/class="sigil-path"/);
    expect(svg).not.toMatch(/ d=""/);
  });

  it('assembles layers in the fixed order: path, then nodes, then start, then end', () => {
    const svg = renderSvg(WORKED_PATH);
    const pathIndex = svg.indexOf('class="sigil-path"');
    const firstNodeIndex = svg.indexOf('class="sigil-node"');
    const startIndex = svg.indexOf('class="sigil-start"');
    const endIndex = svg.indexOf('class="sigil-end"');
    expect(pathIndex).toBeGreaterThan(-1);
    expect(pathIndex).toBeLessThan(firstNodeIndex);
    expect(firstNodeIndex).toBeLessThan(startIndex);
    expect(startIndex).toBeLessThan(endIndex);
  });

  it('produces byte-identical output across two runs', () => {
    expect(renderSvg(WORKED_PATH)).toBe(renderSvg(WORKED_PATH));
  });

  it('omits the statement entirely when the title option is absent', () => {
    const svg = renderSvg(WORKED_PATH, { statement: 'I WILL SUCCEED' });
    expect(svg).not.toContain('SUCCEED');
    expect(svg).not.toContain('<title>');
  });

  it('embeds the XML-escaped statement when the title option is enabled', () => {
    const statement = 'I <3> & "succeed"';
    const svg = renderSvg(WORKED_PATH, { title: true, statement });
    expect(svg).toContain('<title>I &lt;3&gt; &amp; &quot;succeed&quot;</title>');
  });

  it('every stroke/fill attribute is a var() reference with a fallback, or none', () => {
    const svg = renderSvg(WORKED_PATH, { title: true, statement: 'test' });
    const paintAttrs = [...svg.matchAll(/(?:stroke|fill)="([^"]*)"/g)].map((m) => m[1]);
    expect(paintAttrs.length).toBeGreaterThan(0);
    for (const value of paintAttrs) {
      expect(value === 'none' || value.startsWith('var(--sigil-')).toBe(true);
    }
  });

  it('never emits an inline style attribute', () => {
    const svg = renderSvg(WORKED_PATH);
    expect(svg).not.toMatch(/ style=/);
  });

  it('matches the worked-example snapshot', () => {
    expect(renderSvg(WORKED_PATH)).toMatchSnapshot();
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

describe('renderSvg — repeat loops (Phase 2)', () => {
  it('renders two sigil-loop elements with distinct arc radii for a run of three equal digits (D-18)', () => {
    const svg = renderSvg(tripleRepeatPath());
    const radii = [...svg.matchAll(/class="sigil-loop" d="M[-\d.]+,[-\d.]+ A([\d.]+),/g)].map((m) => Number(m[1]));
    expect(radii).toHaveLength(2);
    expect(new Set(radii).size).toBe(2);
  });

  it('renders both a sigil-start element and a sigil-loop element when a repeat sits near the start (D-19)', () => {
    const svg = renderSvg(repeatAtSecondPointPath());
    expect(svg.match(/class="sigil-start"/g) ?? []).toHaveLength(1);
    expect(svg.match(/class="sigil-loop"/g) ?? []).toHaveLength(1);
  });

  it('renders both a sigil-end element and a sigil-loop element when a repeat lands on the last point (D-19)', () => {
    const svg = renderSvg(repeatAtLastPointPath());
    expect(svg.match(/class="sigil-end"/g) ?? []).toHaveLength(1);
    expect(svg.match(/class="sigil-loop"/g) ?? []).toHaveLength(1);
  });

  it('offsets the end bar from the start circle for a one-kept-letter sigil (D-27, CONS-03)', () => {
    const svg = renderSvg(onePointPath());
    expect(svg.match(/class="sigil-node"/g) ?? []).toHaveLength(1);
    expect(svg.match(/class="sigil-start"/g) ?? []).toHaveLength(1);
    expect(svg.match(/class="sigil-end"/g) ?? []).toHaveLength(1);

    const startMatch = svg.match(/class="sigil-start" cx="([\d.-]+)" cy="([\d.-]+)"/);
    const endMatch = svg.match(/class="sigil-end" x1="([\d.-]+)" y1="([\d.-]+)" x2="([\d.-]+)" y2="([\d.-]+)"/);
    const endMidX = (Number(endMatch[1]) + Number(endMatch[3])) / 2;
    const endMidY = (Number(endMatch[2]) + Number(endMatch[4])) / 2;
    expect([endMidX, endMidY]).not.toEqual([Number(startMatch[1]), Number(startMatch[2])]);
  });

  it('never emits an inline style attribute or a bare color literal when loops are present', () => {
    const svg = renderSvg(tripleRepeatPath());
    expect(svg).not.toMatch(/ style=/);
    const paintAttrs = [...svg.matchAll(/(?:stroke|fill)="([^"]*)"/g)].map((m) => m[1]);
    expect(paintAttrs.length).toBeGreaterThan(0);
    for (const value of paintAttrs) {
      expect(value === 'none' || value.startsWith('var(--sigil-')).toBe(true);
    }
  });

  it('produces byte-identical output across two runs, including loop geometry (INT-03)', () => {
    expect(renderSvg(tripleRepeatPath())).toBe(renderSvg(tripleRepeatPath()));
  });
});
