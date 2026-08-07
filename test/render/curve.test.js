import { describe, expect, it } from 'vitest';
import { curvedPathD } from '../../src/render/curve.js';

/**
 * Every numeric token in a `d` string, matching the same shape
 * `formatCoord` emits (an optional leading `-`, digits, optional decimal
 * portion).
 */
const COORD_TOKEN_RE = /-?\d+(?:\.\d+)?/g;

/**
 * @param {string} d
 * @returns {string[]}
 */
function tokens(d) {
  return d.match(COORD_TOKEN_RE) ?? [];
}

describe('curvedPathD — collinear triple, the sign gate (03-03-PLAN.md Planner Note)', () => {
  it('places the FIRST segment\'s control points at 11.667,10 and 16.667,10 — 16.667 is the sign check', () => {
    // Collinear, evenly-spaced points 10 apart: P0(10,10) -> P1(20,10) ->
    // P2(30,10). For the segment P0 -> P1, the tangent at P1 is
    // (30 - 10) / 2 = 10, so the correct second control point is
    // x = 20 - 10/3 = 16.667. A role-swapped (sign-flipped) tangent would
    // instead yield x = 20 + 10/3 = 23.333, which lies OUTSIDE the segment
    // [10, 20] entirely — that is exactly the defect 03-RESEARCH.md's
    // illustrative code example contains (see the plan's Planner Note).
    const d = curvedPathD([
      { x: 10, y: 10 },
      { x: 20, y: 10 },
      { x: 30, y: 10 },
    ]);
    expect(d.startsWith('M10,10')).toBe(true);
    // Scope the sign check to the FIRST C command only — the path's second
    // segment (20,10 -> 30,10) legitimately produces a control point at
    // 23.333 as its own forward-interpolated tangent, which is correct for
    // THAT segment and must not be confused with the sign-error defect this
    // test exists to reject on the FIRST segment.
    const firstC = d.split(' C')[1];
    expect(firstC).toBeDefined();
    expect(d).toContain('C11.667,10 16.667,10 20,10');
    expect(firstC).not.toContain('23.333');
  });

  it('every emitted coordinate has y exactly 10 and x within the closed interval 10 to 30 for that same collinear input', () => {
    const d = curvedPathD([
      { x: 10, y: 10 },
      { x: 20, y: 10 },
      { x: 30, y: 10 },
    ]);
    const pairs = [...d.matchAll(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)].map((m) => ({
      x: Number(m[1]),
      y: Number(m[2]),
    }));
    expect(pairs.length).toBeGreaterThan(0);
    for (const { x, y } of pairs) {
      expect(y).toBe(10);
      expect(x).toBeGreaterThanOrEqual(10);
      expect(x).toBeLessThanOrEqual(30);
    }
  });
});

describe('curvedPathD — structural contract', () => {
  it('on a two-point input emits M then exactly one C, with both control points strictly between the two endpoints on the connecting line', () => {
    const d = curvedPathD([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
    ]);
    expect(d.startsWith('M0,0')).toBe(true);
    expect((d.match(/C/g) ?? []).length).toBe(1);
    const match = d.match(/C(-?[\d.]+),(-?[\d.]+) (-?[\d.]+),(-?[\d.]+) (-?[\d.]+),(-?[\d.]+)/);
    expect(match).not.toBeNull();
    if (!match) throw new Error('expected a C command');
    const [, b1x, b1y, b2x, b2y] = match;
    expect(Number(b1y)).toBe(0);
    expect(Number(b2y)).toBe(0);
    expect(Number(b1x)).toBeGreaterThan(0);
    expect(Number(b1x)).toBeLessThan(10);
    expect(Number(b2x)).toBeGreaterThan(0);
    expect(Number(b2x)).toBeLessThan(10);
  });

  it('on a single point input, the module contract requires >= 2 points (caller-guaranteed; not exercised in production, pathLayer guards below two points)', () => {
    // curvedPathD's precondition is documented, not runtime-checked (mirrors
    // perpendicularUnit's "every call site guarantees the precondition"
    // posture) — calling it with one point produces a degenerate M-only
    // string with no segments, which is the honest behavior of the
    // implementation under a precondition violation, not a thrown error.
    const d = curvedPathD([{ x: 5, y: 5 }]);
    expect(d).toBe('M5,5');
  });
});

describe('curvedPathD — coincident-point guard (Pitfall A, PATH-02 repeats)', () => {
  it('emits an L command (not C) for a zero-length segment between two consecutive identical points, with every token finite', () => {
    const d = curvedPathD([
      { x: 10, y: 10 },
      { x: 10, y: 10 },
      { x: 30, y: 30 },
      { x: 30, y: 30 },
    ]);
    for (const token of tokens(d)) {
      expect(Number.isFinite(Number(token))).toBe(true);
    }
    expect(tokens(d).length).toBeGreaterThan(0);
    // The first segment (index 0 -> 1) is the zero-length hop: its command
    // must be L, not C.
    const firstCommandChar = d.slice(d.indexOf(' ') + 1, d.indexOf(' ') + 2);
    expect(firstCommandChar).toBe('L');
  });

  it('still returns a fully finite d for three consecutive identical points', () => {
    const d = curvedPathD([
      { x: 5, y: 5 },
      { x: 20, y: 20 },
      { x: 20, y: 20 },
      { x: 20, y: 20 },
      { x: 40, y: 5 },
    ]);
    for (const token of tokens(d)) {
      expect(Number.isFinite(Number(token))).toBe(true);
    }
  });

  it('borrows the neighboring knot interval when a duplicated terminal point makes t01 or t23 exactly zero, without NaN', () => {
    // The path's own start/end duplication (via localWindow) always produces
    // this case for the first and last real segment — assert it directly on
    // a short, ordinary, non-repeating path.
    const d = curvedPathD([
      { x: 0, y: 0 },
      { x: 10, y: 5 },
      { x: 25, y: 0 },
    ]);
    for (const token of tokens(d)) {
      expect(Number.isFinite(Number(token))).toBe(true);
    }
  });
});

describe('curvedPathD — symmetry, formatting, and determinism', () => {
  it('reversing the point sequence produces a d whose control-point set is the mirror of the forward d', () => {
    const forwardPoints = [
      { x: 5, y: 40 },
      { x: 20, y: 10 },
      { x: 45, y: 60 },
      { x: 70, y: 15 },
    ];
    const forward = curvedPathD(forwardPoints);
    const reversed = curvedPathD([...forwardPoints].reverse());

    const forwardPairs = [...forward.matchAll(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)].map((m) => `${m[1]},${m[2]}`);
    const reversedPairs = [...reversed.matchAll(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)].map(
      (m) => `${m[1]},${m[2]}`,
    );

    // Same multiset of coordinate pairs, order aside — the reversed curve
    // uses the identical control-point positions, just traversed backward.
    expect([...forwardPairs].sort()).toEqual([...reversedPairs].sort());
  });

  it('every coordinate token matches a plain decimal pattern with at most three decimal places and no exponent character', () => {
    const d = curvedPathD([
      { x: 1.001, y: 99.999 },
      { x: 33.333, y: 66.667 },
      { x: 0.001, y: 0.001 },
      { x: 88.888, y: 11.111 },
    ]);
    const plainDecimal = /^-?\d+(\.\d{1,3})?$/;
    for (const token of tokens(d)) {
      expect(plainDecimal.test(token)).toBe(true);
      expect(/[eE]/.test(token)).toBe(false);
    }
  });

  it('calling curvedPathD twice with the same input returns strictly equal strings, and the input array and its point objects are unmutated', () => {
    const points = [
      { x: 1, y: 2 },
      { x: 10, y: 20 },
      { x: 30, y: 5 },
    ];
    const snapshot = JSON.parse(JSON.stringify(points));
    const first = curvedPathD(points);
    const second = curvedPathD(points);
    expect(first).toBe(second);
    expect(points).toEqual(snapshot);
  });
});
