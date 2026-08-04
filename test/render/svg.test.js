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
