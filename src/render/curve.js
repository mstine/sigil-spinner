/**
 * The single centripetal Catmull-Rom -> cubic Bezier curve module (REND-02,
 * D-28). Its one responsibility: convert a sequence of already-rounded
 * PathModel points into a cubic-Bezier SVG path `d` string. No other module
 * computes curve geometry independently — matching `coords.js`'s own
 * "single shared transform, no other module computes this independently"
 * posture for its coordinate math.
 *
 * Every emitted coordinate routes through `coords.js`'s `roundGeometry`
 * exactly once, at the point of computation, and never re-derives a value
 * from an already-rounded one (D-31) — the same single-rounding discipline
 * `coords.js`'s own header states for cell centers. Path endpoints (`Q1`,
 * `Q2` in each segment) are PathModel points that arrived here already
 * rounded via `cellCenter`; they are re-emitted unchanged, never re-rounded.
 *
 * Zero runtime dependency (D-28): the algorithm below — centripetal
 * (alpha = 0.5) Catmull-Rom parameterization, converted to cubic Bezier
 * control points via the standard Hermite-to-Bezier third-scaling — is
 * hand-rolled, in-repo. `d3-path`/`d3-shape` remain the documented fallback
 * only ("Alternatives Considered" in
 * .planning/milestones/v1.0-research/STACK.md), not imported here.
 */

import { formatCoord, roundGeometry } from './coords.js';

/**
 * The local four-point Catmull-Rom window `[Q0, Q1, Q2, Q3]` for the segment
 * from `points[k]` to `points[k + 1]` ("Pattern 1: Local 4-Point
 * Catmull-Rom Window with Duplicated Terminal Points" in
 * .planning/milestones/v1.0-phases/03-themeable-embeddable-layers/03-RESEARCH.md).
 * At the true start of the path (`k === 0`) the missing `Q0` neighbor is the
 * DUPLICATED endpoint `points[k]` itself; at the true end (`k + 2` runs off
 * the array) the missing `Q3` neighbor is the duplicated endpoint
 * `points[k + 1]`. Duplicated (not phantom-reflected) endpoints are the
 * deliberate choice: a duplicated terminal produces a knot interval of
 * exactly zero — the SAME degenerate case a mid-path consecutive repeat
 * (PATH-02) already produces — so the implementation needs exactly one
 * degenerate-case guard (`curvedSegment`'s exact-zero check below),
 * exercised by two different real inputs, rather than a second, unrelated
 * reflection formula that would only ever fire at the first and last
 * segment of the whole path.
 *
 * @param {import('./coords.js').Point[]} points
 * @param {number} k - Index of the segment's first point.
 * @returns {[import('./coords.js').Point, import('./coords.js').Point, import('./coords.js').Point, import('./coords.js').Point]}
 */
function localWindow(points, k) {
  const Q0 = k === 0 ? points[k] : points[k - 1];
  const Q1 = points[k];
  const Q2 = points[k + 1];
  const Q3 = k + 2 === points.length ? points[k + 1] : points[k + 2];
  return [Q0, Q1, Q2, Q3];
}

/**
 * The centripetal (alpha = 0.5) knot interval between two points — the
 * squared distance raised to the 0.25 power, which equals the distance
 * raised to the 0.5 power without a separate `Math.sqrt` call ("Pattern 2:
 * Centripetal Knot Intervals with Exact-Zero Guard (not epsilon)" in
 * .planning/milestones/v1.0-phases/03-themeable-embeddable-layers/03-RESEARCH.md).
 *
 * @param {import('./coords.js').Point} a
 * @param {import('./coords.js').Point} b
 * @returns {number}
 */
function knotInterval(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return (dx * dx + dy * dy) ** 0.25;
}

/**
 * The centripetal Catmull-Rom tangent at `Q1`, given the local window and
 * its guarded knot intervals ("Pattern 3: Centripetal Tangent → Hermite →
 * Bézier Control Points" in
 * .planning/milestones/v1.0-phases/03-themeable-embeddable-layers/03-RESEARCH.md,
 * tension = 0 — this project has no tension knob). Written as an explicit,
 * standalone expression rather than a role-swapped reuse of a shared
 * helper: reusing one helper with `Q0`/`Q1`/`Q2` and `Q1`/`Q2`/`Q3` swapped
 * into each other's roles is exactly the construction that produced the
 * sign error in that document's own illustrative code example (see
 * "Planner Note — a SIGN ERROR in 03-RESEARCH.md's curve code example" in
 * .planning/milestones/v1.0-phases/03-themeable-embeddable-layers/03-03-PLAN.md)
 * — a role-swapped call returns the NEGATION of the tangent the formula
 * defines, which silently overshoots every emitted curve.
 *
 * @param {import('./coords.js').Point} Q0
 * @param {import('./coords.js').Point} Q1
 * @param {import('./coords.js').Point} Q2
 * @param {number} t01
 * @param {number} t12
 * @returns {import('./coords.js').Point}
 */
function tangentAtQ1(Q0, Q1, Q2, t01, t12) {
  return {
    x: Q2.x - Q1.x + t12 * ((Q1.x - Q0.x) / t01 - (Q2.x - Q0.x) / (t01 + t12)),
    y: Q2.y - Q1.y + t12 * ((Q1.y - Q0.y) / t01 - (Q2.y - Q0.y) / (t01 + t12)),
  };
}

/**
 * The centripetal Catmull-Rom tangent at `Q2`, given the local window and
 * its guarded knot intervals. See `tangentAtQ1`'s doc comment for why this
 * is a separate, explicit expression rather than a role-swapped call into
 * that function — both tangents share the same leading `(Q2 - Q1)` term and
 * both point in the direction of travel.
 *
 * @param {import('./coords.js').Point} Q1
 * @param {import('./coords.js').Point} Q2
 * @param {import('./coords.js').Point} Q3
 * @param {number} t12
 * @param {number} t23
 * @returns {import('./coords.js').Point}
 */
function tangentAtQ2(Q1, Q2, Q3, t12, t23) {
  return {
    x: Q2.x - Q1.x + t12 * ((Q3.x - Q2.x) / t23 - (Q3.x - Q1.x) / (t12 + t23)),
    y: Q2.y - Q1.y + t12 * ((Q3.y - Q2.y) / t23 - (Q3.y - Q1.y) / (t12 + t23)),
  };
}

/**
 * One SVG path command — a cubic Bezier `C` for an ordinary segment, or a
 * degenerate `L` for a zero-length repeat hop — for the segment from
 * `points[k]` to `points[k + 1]`.
 *
 * The exact-zero guard (Pattern 2, "Pitfall A: Coincident-Point Division by
 * Zero in Curve Math" in
 * .planning/milestones/v1.0-phases/03-themeable-embeddable-layers/03-RESEARCH.md)
 * tests `t12` against exact `0`, not an epsilon: every point this renderer
 * ever sees is
 * the direct output of `cellCenter`, which rounds once before returning
 * (`src/render/coords.js`), so two points representing the SAME cell are
 * bit-identical floats — not merely close — while two points representing
 * DIFFERENT cells differ by at least one `cellSize` unit (>= 100/9 ~= 11.1
 * on the tightest kamea), many orders of magnitude above any rounding
 * noise. This guard is defensive in the sense `perpendicularUnit` documents
 * that posture in `src/render/svg.js` — it exists because the input CAN be
 * degenerate (a repeat run, or a path terminal via `localWindow`'s
 * duplicated endpoints), not because every call site avoids it.
 *
 * Guard order: if `t12` (the segment's own length) is exactly zero, the
 * segment is a zero-length repeat hop — the tangent direction is undefined
 * there, and D-30 puts the repeat's visual weight on the loop markers
 * anyway, so this emits a plain `L` to `Q2` rather than attempting Bezier
 * math. Otherwise, a zero `t01` or `t23` (a duplicated terminal point) is
 * borrowed from the real neighboring interval `t12` so the tangent formulas
 * never divide by zero.
 *
 * Control points: `B1 = Q1 + tangentAtQ1/3`, `B2 = Q2 - tangentAtQ2/3` — the
 * standard Hermite-to-Bezier third-scaling. Each of those four coordinates
 * is rounded exactly once through `roundGeometry` (D-31); `Q2` itself is an
 * already-rounded PathModel point and is re-emitted unchanged, never
 * re-rounded.
 *
 * @param {import('./coords.js').Point[]} points
 * @param {number} k
 * @returns {string}
 */
function curvedSegment(points, k) {
  const [Q0, Q1, Q2, Q3] = localWindow(points, k);

  let t01 = knotInterval(Q0, Q1);
  const t12 = knotInterval(Q1, Q2);
  let t23 = knotInterval(Q2, Q3);

  if (t12 === 0) {
    return `L${formatCoord(Q2.x)},${formatCoord(Q2.y)}`;
  }
  if (t01 === 0) {
    t01 = t12;
  }
  if (t23 === 0) {
    t23 = t12;
  }

  const m1 = tangentAtQ1(Q0, Q1, Q2, t01, t12);
  const m2 = tangentAtQ2(Q1, Q2, Q3, t12, t23);

  const b1x = roundGeometry(Q1.x + m1.x / 3);
  const b1y = roundGeometry(Q1.y + m1.y / 3);
  const b2x = roundGeometry(Q2.x - m2.x / 3);
  const b2y = roundGeometry(Q2.y - m2.y / 3);

  return (
    `C${formatCoord(b1x)},${formatCoord(b1y)} ` +
    `${formatCoord(b2x)},${formatCoord(b2y)} ` +
    `${formatCoord(Q2.x)},${formatCoord(Q2.y)}`
  );
}

/**
 * The full curved `d` string for a PathModel's points — an `M` command at
 * the first point, followed by one command (a `C` or a degenerate `L`) per
 * segment, joined by single spaces. Same overall shape as `pathLayer`'s
 * existing straight `M`-plus-`L` builder in `src/render/svg.js`, so the two
 * `d` strings are structurally comparable.
 *
 * Precondition: `points` has at least two entries. `pathLayer` already
 * guards below two points before ever calling this (matching
 * `perpendicularUnit`'s "every call site guarantees the precondition"
 * posture in `src/render/svg.js`) — this function does not re-check it and
 * is never called otherwise.
 *
 * @param {import('./coords.js').Point[]} points
 * @returns {string}
 */
export function curvedPathD(points) {
  const [first, ...rest] = points;
  const segments = rest.map((_, i) => curvedSegment(points, i));
  return [`M${formatCoord(first.x)},${formatCoord(first.y)}`, ...segments].join(' ');
}
