import { describe, expect, it } from 'vitest';
import { buildPath } from '../../src/path/buildPath.js';
import { cellForNumber, gridSize } from '../../src/data/kamea.js';

// Worked example (01-RESEARCH.md): "I WILL SUCCEED" -> kept W,L,S,C,D ->
// digits 5,3,1,3,4 -> Saturn cells (1,1),(1,0),(2,1),(1,0),(0,0).
const ORDER = gridSize('saturn');
const NUMBERS = [5, 3, 1, 3, 4];
const CELLS = NUMBERS.map((n) => cellForNumber('saturn', n));

describe('buildPath', () => {
  it('produces five points at the worked-example cells, in order', () => {
    const model = buildPath(NUMBERS, CELLS, 'saturn', ORDER);
    expect(model.points.map((p) => [p.row, p.col])).toEqual([
      [1, 1],
      [1, 0],
      [2, 1],
      [1, 0],
      [0, 0],
    ]);
  });

  it('sets start to 0 and end to the last index', () => {
    const model = buildPath(NUMBERS, CELLS, 'saturn', ORDER);
    expect(model.start).toBe(0);
    expect(model.end).toBe(4);
  });

  it('keeps the twice-visited cell (1,0) as two distinct points, not deduplicated', () => {
    const model = buildPath(NUMBERS, CELLS, 'saturn', ORDER);
    const revisits = model.points.filter((p) => p.row === 1 && p.col === 0);
    expect(revisits).toHaveLength(2);
  });

  it("carries each point's digit alongside row/col/x/y", () => {
    const model = buildPath(NUMBERS, CELLS, 'saturn', ORDER);
    expect(model.points[0]).toMatchObject({ n: 5, row: 1, col: 1 });
    expect(typeof model.points[0].x).toBe('number');
    expect(typeof model.points[0].y).toBe('number');
  });

  it('yields one point with start === end and no segments for a one-number sequence', () => {
    const oneCells = [cellForNumber('saturn', 4)];
    const model = buildPath([4], oneCells, 'saturn', ORDER);
    expect(model.points).toHaveLength(1);
    expect(model.start).toBe(0);
    expect(model.end).toBe(0);
    expect(model.segments).toEqual([]);
  });

  it('does not throw on a one-number sequence', () => {
    const oneCells = [cellForNumber('saturn', 4)];
    expect(() => buildPath([4], oneCells, 'saturn', ORDER)).not.toThrow();
  });

  it('emits no markup tokens — the PathModel is plain data (Anti-Pattern 1)', () => {
    const model = buildPath(NUMBERS, CELLS, 'saturn', ORDER);
    const serialized = JSON.stringify(model);
    expect(serialized).not.toMatch(/<(svg|path|circle|line|g)[ >]/);
  });

  it('survives a JSON round trip unchanged', () => {
    const model = buildPath(NUMBERS, CELLS, 'saturn', ORDER);
    const roundTripped = JSON.parse(JSON.stringify(model));
    expect(roundTripped).toEqual(model);
  });

  it('detects a run of three consecutive equal digits as one repeat event with count 2 (D-18)', () => {
    const tripleCells = [cellForNumber('saturn', 5), cellForNumber('saturn', 5), cellForNumber('saturn', 5)];
    const model = buildPath([5, 5, 5], tripleCells, 'saturn', ORDER);
    expect(model.repeats).toEqual([{ atPoint: 2, count: 2 }]);
  });
});
