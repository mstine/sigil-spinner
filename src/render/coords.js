/**
 * The single shared (row, col) -> viewBox (x, y) coordinate transform
 * ("Pitfall 10: Coordinate-Scaling / viewBox Inconsistency Across Seven
 * Different Kamea Sizes" in .planning/milestones/v1.0-research/PITFALLS.md
 * — duplicated coordinate math is how renderers silently drift apart).
 * Every module that needs a coordinate goes through this file; no other
 * module computes cell size or cell center independently.
 *
 * Per D-07 the viewBox is fixed at `0 0 100 100` for every planet — cell
 * size is always `100 / order`, so no module computes a separate scale
 * factor per planet.
 *
 * This module owns TWO precision contracts, deliberately kept as separate
 * constants even though they currently share the value 3 — the same
 * separate-constants-for-separate-contracts discipline the
 * `SINGLE_NODE_END_OFFSET_FRACTION` split established (review finding
 * IN-03): `COORDINATE_PRECISION` governs cell centers (this file's own
 * `cellCenter`), while `GEOMETRY_PRECISION` governs derived marker and
 * curve geometry (marker radii/offsets in `src/render/svg.js`, Bezier
 * control points in `src/render/curve.js`). `GEOMETRY_PRECISION` and its
 * `roundGeometry` rounding function were moved here from `svg.js` in 03-03
 * so `src/render/curve.js` can import the single rounding point without
 * creating a `svg.js` -> `curve.js` -> `svg.js` import cycle (`svg.js` must
 * import `curvedPathD` from `curve.js`).
 */

/**
 * Decimal places every coordinate is rounded to, exactly once, at the point
 * of computation. This is the determinism contract: both the SVG renderer
 * and the JSON working consume these same rounded numbers, so the two
 * artifacts can never disagree.
 */
const COORDINATE_PRECISION = 3;

/**
 * Decimal places geometry derived from `cellSize` (marker radii/lengths,
 * curve control points) is rounded to. Deliberately a separate constant from
 * `COORDINATE_PRECISION` above — see this module's header comment.
 */
export const GEOMETRY_PRECISION = 3;

/**
 * Round a number to `GEOMETRY_PRECISION` decimal places, exactly once, at
 * the point of computation. Shared by every module that derives geometry
 * from `cellSize` — marker radii/offsets in `src/render/svg.js`, Bezier
 * control points in `src/render/curve.js` — so there is exactly one rounding
 * point for derived geometry, matching this file's own single-rounding
 * discipline for cell centers (`round`, below).
 *
 * @param {number} n
 * @returns {number}
 */
export function roundGeometry(n) {
  const factor = 10 ** GEOMETRY_PRECISION;
  return Math.round(n * factor) / factor;
}

/**
 * @typedef {Object} Point
 * @property {number} x
 * @property {number} y
 */

/**
 * The side length of one grid cell within the fixed 100x100 viewBox.
 *
 * @param {number} order - The kamea's order (3 for saturn through 9 for moon).
 * @returns {number}
 */
export function cellSize(order) {
  return 100 / order;
}

/**
 * Round a number to the module's fixed coordinate precision. Internal only —
 * every coordinate is rounded exactly once, here, before it is ever written
 * into either the SVG string or the JSON working.
 *
 * @param {number} n
 * @returns {number}
 */
function round(n) {
  const factor = 10 ** COORDINATE_PRECISION;
  return Math.round(n * factor) / factor;
}

/**
 * The center point of cell (row, col) on a kamea of the given order, within
 * the fixed 100x100 viewBox. Rounded once to `COORDINATE_PRECISION` decimal
 * places.
 *
 * @param {number} row - Zero-indexed row.
 * @param {number} col - Zero-indexed column.
 * @param {number} order - The kamea's order.
 * @returns {Point}
 */
export function cellCenter(row, col, order) {
  const size = cellSize(order);
  return {
    x: round(col * size + size / 2),
    y: round(row * size + size / 2),
  };
}

/**
 * Format an already-rounded coordinate as the shortest exact decimal string,
 * for writing into SVG markup. Never call this on a number that hasn't
 * already been rounded via `cellCenter` or an equivalent single rounding
 * point — this function only formats, it does not round.
 *
 * @param {number} n - An already-rounded number.
 * @returns {string}
 */
export function formatCoord(n) {
  return String(n);
}
