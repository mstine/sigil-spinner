/**
 * The single shared (row, col) -> viewBox (x, y) coordinate transform
 * (Pitfall 10 — duplicated coordinate math is how renderers silently drift
 * apart). Every module that needs a coordinate goes through this file; no
 * other module computes cell size or cell center independently.
 *
 * Per D-07 the viewBox is fixed at `0 0 100 100` for every planet — cell
 * size is always `100 / order`, so no module computes a separate scale
 * factor per planet.
 */

/**
 * Decimal places every coordinate is rounded to, exactly once, at the point
 * of computation. This is the determinism contract: both the SVG renderer
 * and the JSON working consume these same rounded numbers, so the two
 * artifacts can never disagree.
 */
const COORDINATE_PRECISION = 3;

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
