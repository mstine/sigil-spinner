/**
 * Kamea data — the seven classical planetary magic squares.
 *
 * ============================================================================
 * SOURCE LINEAGE (D-01, D-04) — read before touching a cell value
 * ============================================================================
 *
 * Primary source named by the project's locked decision (D-01):
 *   Agrippa, Henry Cornelius. "Three Books of Occult Philosophy."
 *   Donald Tyson, ed. Llewellyn Publications.
 *
 * Independent cross-check source named by D-01:
 *   Skinner, Stephen. "The Complete Magician's Tables." Golden Hoard Press.
 *
 * ACTUAL VERIFICATION PERFORMED (honest provenance — do not overstate):
 * Both named sources above are physical books that could not be read by
 * research tooling. What was actually done, and signed off via the D-04
 * checkpoint on 2026-08-04 (decision: approve-candidate):
 *
 *   1. All seven grids below were sourced from a single secondary web source
 *      (furtherlight.blogspot.com, "Agrippa's Magic Squares - Part 2" —
 *      no specific Agrippa edition cited by that source itself).
 *   2. Every row, column, and both diagonals of all seven grids were verified
 *      to sum to the correct magic constant for that grid's order (this
 *      catches transcription typos, NOT wrong dihedral orientation — see
 *      Pitfall 1 in .planning/research/PITFALLS.md).
 *   3. Saturn's full grid and Jupiter's opening row were independently
 *      corroborated against a second, separate web source
 *      (the-magic-square.blogspot.com and mysticsymbolism.com respectively).
 *   4. Mars, Sun, Venus, Mercury, and Moon rest on the single furtherlight
 *      source only — magic-sum verified, but NOT independently cross-checked
 *      against a second source, and NOT verified against the physical
 *      Tyson/Llewellyn or Skinner editions named in D-01.
 *
 * The option to supply corrections transcribed from the physical Tyson and
 * Skinner copies was offered at the D-04 checkpoint; the candidate set was
 * approved as-is instead. This citation describes exactly that — a
 * magic-sum-verified, partially-cross-checked candidate set signed off by
 * the developer, NOT a claim that these cells were checked cell-by-cell
 * against Tyson/Llewellyn or Skinner. If a future set corrects this against
 * the physical sources, add it under a new key in KAMEA_SETS (D-02) rather
 * than mutating this one, since determinism is a published contract.
 *
 * D-04 sign-off date: 2026-08-04
 *
 * ============================================================================
 * ORDERING CONVENTION (D-01)
 * ============================================================================
 * Every grid is a row-major array of arrays: the outer array's first element
 * is the square's TOP row, and each row's elements run LEFT to RIGHT. So
 * `grid[0][0]` is the top-left cell and `grid[row][col]` is unambiguous.
 *
 * ============================================================================
 * GRID ORDER AND MAGIC CONSTANTS (Saturn → Moon, canonical order)
 * ============================================================================
 *   Saturn  — 3x3 — magic constant 15
 *   Jupiter — 4x4 — magic constant 34
 *   Mars    — 5x5 — magic constant 65
 *   Sun     — 6x6 — magic constant 111
 *   Venus   — 7x7 — magic constant 175
 *   Mercury — 8x8 — magic constant 260
 *   Moon    — 9x9 — magic constant 369
 *
 * No other module in this repository may contain a kamea grid literal
 * (.planning/research/ARCHITECTURE.md, Anti-Pattern 2). Every consumer goes
 * through `cellForNumber`, `gridSize`, or `planetNames` below.
 */

/** Canonical planet order, Saturn (smallest/slowest) to Moon (fastest). */
const PLANET_ORDER = ['saturn', 'jupiter', 'mars', 'sun', 'venus', 'mercury', 'moon'];

/** Name of the kamea set shipped in this phase. Only this set ships (D-02). */
export const DEFAULT_KAMEA_SET = 'agrippa';

/**
 * @typedef {Record<string, number[][]>} KameaSet
 *   A kamea set: planet name (lowercase) -> row-major grid.
 */

/**
 * Registry of kamea sets, keyed by set name. Only `agrippa` is populated —
 * the shape exists so a future verified set (e.g. `skinner`, `golden-dawn`)
 * can be added without reshaping this API (D-02).
 *
 * @type {Record<string, KameaSet>}
 */
export const KAMEA_SETS = {
  agrippa: {
    saturn: [
      [4, 9, 2],
      [3, 5, 7],
      [8, 1, 6],
    ],
    jupiter: [
      [4, 14, 15, 1],
      [9, 7, 6, 12],
      [5, 11, 10, 8],
      [16, 2, 3, 13],
    ],
    mars: [
      [11, 24, 7, 20, 3],
      [4, 12, 25, 8, 16],
      [17, 5, 13, 21, 9],
      [10, 18, 1, 14, 22],
      [23, 6, 19, 2, 15],
    ],
    sun: [
      [6, 32, 3, 34, 35, 1],
      [7, 11, 27, 28, 8, 30],
      [19, 14, 16, 15, 23, 24],
      [18, 20, 22, 21, 17, 13],
      [25, 29, 10, 9, 26, 12],
      [36, 5, 33, 4, 2, 31],
    ],
    venus: [
      [22, 47, 16, 41, 10, 35, 4],
      [5, 23, 48, 17, 42, 11, 29],
      [30, 6, 24, 49, 18, 36, 12],
      [13, 31, 7, 25, 43, 19, 37],
      [38, 14, 32, 1, 26, 44, 20],
      [21, 39, 8, 33, 2, 27, 45],
      [46, 15, 40, 9, 34, 3, 28],
    ],
    mercury: [
      [8, 58, 59, 5, 4, 62, 63, 1],
      [49, 15, 14, 52, 53, 11, 10, 56],
      [41, 23, 22, 44, 45, 19, 18, 48],
      [32, 34, 35, 29, 28, 38, 39, 25],
      [40, 26, 27, 37, 36, 30, 31, 33],
      [17, 47, 46, 20, 21, 43, 42, 24],
      [9, 55, 54, 12, 13, 51, 50, 16],
      [64, 2, 3, 61, 60, 6, 7, 57],
    ],
    moon: [
      [37, 78, 29, 70, 21, 62, 13, 54, 5],
      [6, 38, 79, 30, 71, 22, 63, 14, 46],
      [47, 7, 39, 80, 31, 72, 23, 55, 15],
      [16, 48, 8, 40, 81, 32, 64, 24, 56],
      [57, 17, 49, 9, 41, 73, 33, 65, 25],
      [26, 58, 18, 50, 1, 42, 74, 34, 66],
      [67, 27, 59, 10, 51, 2, 43, 75, 35],
      [36, 68, 19, 60, 11, 52, 3, 44, 76],
      [77, 28, 69, 20, 61, 12, 53, 4, 45],
    ],
  },
};

/**
 * Resolve a planet name (case-insensitive) to its canonical lowercase key.
 * Throws for anything not one of the seven classical planets.
 *
 * @param {string} planet
 * @returns {string}
 */
function resolvePlanetKey(planet) {
  if (typeof planet !== 'string') {
    throw new RangeError(`resolvePlanetKey: expected a string planet name, got: ${JSON.stringify(planet)}`);
  }
  const key = planet.toLowerCase();
  if (!PLANET_ORDER.includes(key)) {
    throw new RangeError(
      `resolvePlanetKey: unknown planet "${planet}". Valid planets: ${PLANET_ORDER.join(', ')}`,
    );
  }
  return key;
}

/**
 * Resolve a kamea set name, defaulting to DEFAULT_KAMEA_SET when omitted.
 * Throws for an unknown set name.
 *
 * @param {string} [set]
 * @returns {KameaSet}
 */
function resolveSet(set) {
  const setName = set ?? DEFAULT_KAMEA_SET;
  const resolved = KAMEA_SETS[setName];
  if (!resolved) {
    throw new RangeError(
      `resolveSet: unknown kamea set "${setName}". Valid sets: ${Object.keys(KAMEA_SETS).join(', ')}`,
    );
  }
  return resolved;
}

/**
 * The seven classical planet names in canonical Saturn-to-Moon order.
 *
 * @returns {string[]}
 */
export function planetNames() {
  return [...PLANET_ORDER];
}

/**
 * The order (side length) of a planet's kamea — 3 for saturn through 9 for moon.
 *
 * @param {string} planet - Case-insensitive planet name.
 * @param {{ set?: string }} [opts]
 * @returns {number}
 */
export function gridSize(planet, opts = {}) {
  const key = resolvePlanetKey(planet);
  const set = resolveSet(opts.set);
  return set[key].length;
}

/**
 * Return the literal grid for a planet — used internally and by tests.
 *
 * @param {string} planet - Case-insensitive planet name.
 * @param {{ set?: string }} [opts]
 * @returns {number[][]}
 */
export function kameaGrid(planet, opts = {}) {
  const key = resolvePlanetKey(planet);
  const set = resolveSet(opts.set);
  return set[key];
}

/**
 * Find the zero-indexed {row, col} of the cell holding digit `n` on a
 * planet's kamea. Throws for an unknown planet, an unknown set, or an `n`
 * outside 1..9 — never returns undefined or null.
 *
 * @param {string} planet - Case-insensitive planet name.
 * @param {number} n - Digit to locate, must be an integer in 1..9.
 * @param {{ set?: string }} [opts]
 * @returns {{ row: number, col: number }}
 */
export function cellForNumber(planet, n, opts = {}) {
  const key = resolvePlanetKey(planet);
  const set = resolveSet(opts.set);

  if (!Number.isInteger(n) || n < 1 || n > 9) {
    throw new RangeError(`cellForNumber: n must be an integer in 1..9, got: ${JSON.stringify(n)}`);
  }

  const grid = set[key];
  for (let row = 0; row < grid.length; row += 1) {
    const col = grid[row].indexOf(n);
    if (col !== -1) {
      return { row, col };
    }
  }

  // Unreachable for the shipped agrippa set (every grid contains 1..9),
  // but guarded so this never silently returns undefined for a bad set.
  throw new RangeError(`cellForNumber: digit ${n} not found on ${key}'s "${opts.set ?? DEFAULT_KAMEA_SET}" grid`);
}
