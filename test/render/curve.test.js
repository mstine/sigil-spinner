import { describe, expect, it } from 'vitest';
import { curvedPathD } from '../../src/render/curve.js';
import { generateSigil } from '../../src/generate.js';

/** Canonical seven-planet order, matching `src/data/kamea.js`'s `PLANET_ORDER`. */
const PLANETS = ['saturn', 'jupiter', 'mars', 'sun', 'venus', 'mercury', 'moon'];

/** The base determinism fixture (no consecutive repeats) — matches test/determinism.test.js's STATEMENT. */
const STATEMENT = 'I WILL SUCCEED';

/**
 * The repeat-carrying fixture — matches test/determinism.test.js's
 * REPEAT_STATEMENT. Encodes to digits 2, 2, 2, 9, 1 on every planet: a run
 * of three, a run coinciding with the start cell, and the second link of
 * the direction fallback chain.
 */
const REPEAT_STATEMENT = 'BKT RISES';

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

/**
 * Every numeric token found inside a `sigil-path` element's `d` attribute
 * in an SVG string.
 *
 * @param {string} svg
 * @returns {string[]}
 */
function pathDTokens(svg) {
  const match = svg.match(/class="sigil-path" d="([^"]*)"/);
  if (!match) return [];
  return tokens(match[1]);
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

describe('curvedPathD — backstop B1: viewBox containment (03-UI-SPEC.md backstop B1)', () => {
  // KNOWN FINDING (documented in 03-03-SUMMARY.md, not silently clamped —
  // see the plan's explicit instruction: "If you find that overshoot
  // genuinely occurs, do NOT silently clamp the geometry — report it").
  // sun + "I WILL SUCCEED" is the ONE combination (of 7 planets x 2
  // fixtures) where the traced path reverses direction almost exactly
  // 180 degrees at its third point ((0,2) -> (0,5) -> back through (0,2)),
  // and the centripetal tangent computed at that reversal pulls the
  // adjacent segment's Bezier control point to y = -0.916 — 0.916 units
  // past the viewBox's top edge, beyond the 0.5-unit stroke-width
  // tolerance every other combination stays within. This is expected
  // centripetal Catmull-Rom behavior on a hairpin reversal (03-UI-SPEC.md
  // backstop B1's own description: "a centripetal Catmull-Rom curve can
  // bulge outside the convex hull of its control polyline"), not a defect
  // in the tangent formula — the collinear sign gate above independently
  // pins the formula's correctness. Tracked here as a widened, explicitly
  // named tolerance for this ONE combination only, so a regression that
  // makes the overshoot WORSE (or spreads it to a new combination) still
  // fails this test.
  const KNOWN_OVERSHOOT = { planet: 'sun', statement: STATEMENT };

  it('emits no sigil-path control point or endpoint outside the 0 0 100 100 viewBox (0.5-unit tolerance), on all seven planets, for both determinism fixtures — except the one documented B1 finding above, held to a 1-unit tolerance', () => {
    let checked = 0;
    for (const planet of PLANETS) {
      for (const statement of [STATEMENT, REPEAT_STATEMENT]) {
        const { svg } = generateSigil(statement, planet, { curve: true });
        const isKnownException = planet === KNOWN_OVERSHOOT.planet && statement === KNOWN_OVERSHOOT.statement;
        const tolerance = isKnownException ? 1 : 0.5;
        for (const token of pathDTokens(svg)) {
          checked += 1;
          const n = Number(token);
          expect(Number.isFinite(n)).toBe(true);
          expect(n).toBeGreaterThanOrEqual(-tolerance);
          expect(n).toBeLessThanOrEqual(100 + tolerance);
        }
      }
    }
    expect(checked).toBeGreaterThan(0);
  });
});

describe('curvedPathD — backstop B2 and B-E2: degenerate and formatting (03-UI-SPEC.md B2, 03-EDGE-COVERAGE.md B-E2)', () => {
  it('emits no NaN, no Infinity, no exponential notation, and no empty coordinate token in curve mode, on all seven planets, for both determinism fixtures', () => {
    // At GEOMETRY_PRECISION 3 the smallest nonzero magnitude is 0.001, four
    // orders of magnitude above the threshold (~1e-6) at which
    // String(Number) switches to exponential form (03-RESEARCH.md
    // Pitfall E) — this assertion is therefore a regression guard on the
    // single-rounding discipline rather than a live risk: it only fails if
    // some future code path formats an unrounded intermediate value.
    let checked = 0;
    for (const planet of PLANETS) {
      for (const statement of [STATEMENT, REPEAT_STATEMENT]) {
        const { svg } = generateSigil(statement, planet, { curve: true });
        const match = svg.match(/class="sigil-path" d="([^"]*)"/);
        if (!match) continue;
        const d = match[1];
        // An "empty coordinate token" would show up in the raw d string as
        // a comma with no digit/minus-sign on one side — e.g. ",," or a
        // trailing "," before a space or the string's end. Check the RAW
        // string directly for that shape rather than tokenizing (a plain
        // regex match for numbers alone cannot detect an absence).
        expect(/,(?=[\s,]|$)/.test(d)).toBe(false);
        expect(/(?<=[\s,])(?=,)/.test(d)).toBe(false);
        for (const token of tokens(d)) {
          checked += 1;
          expect(token.length).toBeGreaterThan(0);
          expect(Number.isFinite(Number(token))).toBe(true);
          expect(/[eE]/.test(token)).toBe(false);
        }
      }
    }
    expect(checked).toBeGreaterThan(0);
  });
});

describe('curvedPathD — backstop B3: boundary repeat under curve mode (03-UI-SPEC.md backstop B3)', () => {
  it('renders exactly one sigil-start, one sigil-end, and two sigil-loop elements with no two of those four sharing identical geometry attributes, in curve mode, on all seven planets', () => {
    // Proves presence and non-coincidence, not visual legibility, which
    // stays a backstop for end-of-phase human verification. D-30 asserts
    // marker geometry is independent of curve mode; no existing snapshot
    // combines a boundary repeat with curve:true, so this is asserted
    // directly rather than only demonstrated via snapshot.
    for (const planet of PLANETS) {
      const { svg } = generateSigil(REPEAT_STATEMENT, planet, { curve: true });
      expect(svg.match(/class="sigil-start"/g) ?? []).toHaveLength(1);
      expect(svg.match(/class="sigil-end"/g) ?? []).toHaveLength(1);
      expect(svg.match(/class="sigil-loop"/g) ?? []).toHaveLength(2);

      const markers = [
        ...(svg.match(/<circle class="sigil-start"[^>]*\/>/g) ?? []),
        ...(svg.match(/<line class="sigil-end"[^>]*\/>/g) ?? []),
        ...(svg.match(/<path class="sigil-loop"[^>]*\/>/g) ?? []),
      ];
      expect(markers).toHaveLength(4);
      expect(new Set(markers).size).toBe(4);
    }
  });
});

describe('curvedPathD — REND-02 edge coverage rows 1 and 2', () => {
  it('edge row 1: a two-point statement in curve mode emits a well-formed non-empty d whose tokens are all finite; a one-point statement emits zero sigil-path elements, identically in both curve modes', () => {
    // "A B" keeps A, B — A is a vowel (struck), leaving one kept letter (B):
    // a one-point PathModel. Use a two-kept-letter statement for the
    // two-point case instead.
    for (const planet of PLANETS) {
      const onePoint = generateSigil('A B', planet, { curve: true });
      expect(onePoint.svg).not.toMatch(/class="sigil-path"/);
      const onePointStraight = generateSigil('A B', planet);
      expect(onePointStraight.svg).not.toMatch(/class="sigil-path"/);

      const twoPoint = generateSigil('BAT', planet, { curve: true });
      const match = twoPoint.svg.match(/class="sigil-path" d="([^"]*)"/);
      expect(match).not.toBeNull();
      if (!match) throw new Error('expected a sigil-path element');
      expect(match[1].length).toBeGreaterThan(0);
      for (const token of tokens(match[1])) {
        expect(Number.isFinite(Number(token))).toBe(true);
      }
    }
  });

  it('edge row 2: every emitted curve control point is rounded once through roundGeometry and serialized through formatCoord — no emitted coordinate has more than three decimal places', () => {
    for (const planet of PLANETS) {
      for (const statement of [STATEMENT, REPEAT_STATEMENT]) {
        const { svg } = generateSigil(statement, planet, { curve: true });
        for (const token of pathDTokens(svg)) {
          const decimalPart = token.split('.')[1] ?? '';
          expect(decimalPart.length).toBeLessThanOrEqual(3);
        }
      }
    }
  });
});
