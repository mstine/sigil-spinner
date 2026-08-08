/**
 * Turn a number sequence + resolved kamea cells into a plain,
 * renderer-agnostic PathModel ("Pattern 2: Renderer-Agnostic Intermediate
 * Model (PathModel)" in .planning/milestones/v1.0-research/ARCHITECTURE.md).
 * This module emits no markup of any kind ("Anti-Pattern 1: Building SVG
 * Strings Inside the Path Builder" in
 * .planning/milestones/v1.0-research/ARCHITECTURE.md) — the choice of
 * output format belongs entirely to the renderer(s) that consume this
 * object.
 */

import { cellCenter } from '../render/coords.js';

/**
 * @typedef {Object} PathPoint
 * @property {number} n - The Pythagorean digit (1-9) this point represents.
 * @property {number} row - Zero-indexed row on the planet's kamea.
 * @property {number} col - Zero-indexed column on the planet's kamea.
 * @property {number} x - viewBox x-coordinate of the cell's center.
 * @property {number} y - viewBox y-coordinate of the cell's center.
 */

/**
 * @typedef {Object} PathSegment
 * @property {number} from - Index into `points` where the segment starts.
 * @property {number} to - Index into `points` where the segment ends.
 */

/**
 * @typedef {Object} RepeatEvent
 * @property {number} atPoint - Index into `points` of the LAST point in a run of consecutive equal digits.
 * @property {number} count - Number of EXTRA visits in that run (run length minus one) — one loop per extra visit (D-18).
 */

/**
 * @typedef {Object} PathModel
 * @property {string} planet - Lowercase planet name.
 * @property {number} gridSize - The planet's kamea order (3-9).
 * @property {PathPoint[]} points - One entry per number in the traced sequence.
 * @property {PathSegment[]} segments - Line segments between consecutive points.
 * @property {number} start - Index into `points` of the first visited cell.
 * @property {number} end - Index into `points` of the last visited cell.
 * @property {RepeatEvent[]} repeats - Consecutive-repeat events derived from the number sequence (PATH-02, D-18).
 */

/**
 * Detect runs of consecutive equal digits in the traced NUMBER sequence
 * (PATH-02) — never over letters. `normalize('BK')` keeps both letters B and
 * K even though both encode to Pythagorean digit 2 ("Pitfall 7:
 * Consecutive-Repeat Detection Misses Cross-Letter Number Collisions" in
 * .planning/milestones/v1.0-research/PITFALLS.md / "Pitfall 2:
 * Consecutive-Repeat Detection on Letters Instead of Numbers" in
 * .planning/milestones/v1.0-phases/02-every-planet-every-statement/02-RESEARCH.md) —
 * a repeat is a property of the traced NUMBER sequence, not of letter
 * identity, so this pass runs here, over `numbers`, never in `normalize.js`.
 * For each run of length k greater than 1, pushes one event whose `atPoint`
 * is the index of the LAST point in the run and whose `count` is k - 1, so
 * there is exactly one loop per extra visit (D-18).
 *
 * @param {number[]} numbers
 * @returns {RepeatEvent[]}
 */
function detectRepeats(numbers) {
  /** @type {RepeatEvent[]} */
  const repeats = [];
  let runLength = 1;
  for (let i = 1; i <= numbers.length; i += 1) {
    if (i < numbers.length && numbers[i] === numbers[i - 1]) {
      runLength += 1;
      continue;
    }
    if (runLength > 1) {
      repeats.push({ atPoint: i - 1, count: runLength - 1 });
    }
    runLength = 1;
  }
  return repeats;
}

/**
 * Build a PathModel from a number sequence and its resolved kamea cells. A
 * one-element `numbers` array yields one point, an empty `segments` array,
 * and `start` equal to `end` — it must not throw ("Pitfall 5: Degenerate
 * Text-Processing Inputs Producing Empty or Single-Node Sigils" in
 * .planning/milestones/v1.0-research/PITFALLS.md, the Phase 1 degenerate
 * safety net). A zero-length array is the caller's error, not this
 * function's.
 *
 * @param {number[]} numbers
 * @param {{ row: number, col: number }[]} cells - One cell per entry in `numbers`, same order.
 * @param {string} planet
 * @param {number} order - The planet's kamea order.
 * @returns {PathModel}
 */
export function buildPath(numbers, cells, planet, order) {
  /** @type {PathPoint[]} */
  const points = numbers.map((n, index) => {
    const { row, col } = cells[index];
    const { x, y } = cellCenter(row, col, order);
    return { n, row, col, x, y };
  });

  /** @type {PathSegment[]} */
  const segments = [];
  for (let index = 0; index < points.length - 1; index += 1) {
    segments.push({ from: index, to: index + 1 });
  }

  const start = 0;
  const end = points.length - 1;

  return { planet, gridSize: order, points, segments, start, end, repeats: detectRepeats(numbers) };
}
