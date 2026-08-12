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
 * CURRENT VERIFICATION STATE (honest provenance — do not overstate):
 * Neither named source above has been read directly. What was actually done,
 * performed and recorded on 2026-08-12
 * ("Verification performed 2026-08-12" in
 * .planning/quick/260812-m4b-kamea-provenance-from-physical-source-st/260812-m4b-CONTEXT.md):
 *
 *   1. Every classical grid below was diffed cell-by-cell against a physical
 *      printed source — Rankine, David & d'Este, Sorita. "Practical
 *      Planetary Magick." Appendix 2, "The Kameas," pp. 177-181 (classical
 *      seven: pp. 177-179). Page 177 is legible in the photograph taken of
 *      the physical copy; the remaining page numbers are per the developer's
 *      own reading of that copy, not independently confirmed from the image.
 *   2. Each grid was tested for four structural properties: permutation of
 *      1..n^2; all rows, all columns, and both diagonals equal to the magic
 *      constant; and associativity (v(r,c) + v(n-1-r,n-1-c) === n^2+1). These
 *      properties are stronger than magic-sum verification alone but still
 *      cannot catch a wrong dihedral orientation — a grid internally magic
 *      and associative in every cell, yet rotated or reflected relative to
 *      the traditional layout ("Pitfall 1: Kamea Orientation Ambiguity" in
 *      .planning/milestones/v1.0-research/PITFALLS.md). The exact-value
 *      `SIGNED_OFF_GRIDS` assertions in `test/data/kamea.test.js` are what
 *      catch that class of defect; this diff supplements those assertions,
 *      never replaces them.
 *   3. Six of the seven classical grids — Saturn, Jupiter, Mars, Sun, Venus,
 *      Moon — are identical to the book.
 *
 * MERCURY — the repo is correct, the book is defective
 * ("Mercury — the repo is correct, the book is defective" in
 * .planning/quick/260812-m4b-kamea-provenance-from-physical-source-st/260812-m4b-CONTEXT.md):
 * the book prints, at rows 3-4, columns 5 and 8, two value-pairs swapped
 * between columns — book row 3 reads "48 ... 45" where the repo reads
 * "45 ... 48"; book row 4 reads "25 ... 28" where the repo reads "28 ... 25".
 * That swap preserves every row sum AND every column sum, which is exactly
 * why magic-sum-only verification could not have caught it. Two harder
 * checks do: the book's anti-diagonal sums 257, not the magic constant 260,
 * so as printed it is not even a magic square; and it breaks associativity
 * at those 4 cells and their 4 central-symmetry partners. The repo's Mercury
 * is magic on all rows, columns, and both diagonals, and is associative in
 * all 64 cells. NO CELL VALUE CHANGES as a result of this finding — D-02
 * (add a new KAMEA_SETS key rather than mutate an existing one) does not
 * fire here, and determinism is preserved.
 *
 * SUN — non-associativity is expected, not a defect
 * ("Sun — non-associativity is expected, not a defect" in
 * .planning/quick/260812-m4b-kamea-provenance-from-physical-source-st/260812-m4b-CONTEXT.md):
 * neither the book's Sun nor the repo's Sun is associative, and both agree
 * exactly. This is correct rather than a defect: order 6 is singly-even, and
 * the traditional Sun kamea genuinely lacks central symmetry. The
 * associativity invariant in `test/data/kamea.test.js` exempts the Sun by
 * name, carrying this same reason at the exemption site.
 *
 * CONSTRUCTION RULES — empirically fitted, not cited to Agrippa
 * ("Construction rules (empirically fitted, NOT cited to Agrippa)" in
 * .planning/quick/260812-m4b-kamea-provenance-from-physical-source-st/260812-m4b-CONTEXT.md):
 * there is no "Agrippa formula" to cite. Agrippa presents the kameas in "De
 * Occulta Philosophia" Book II as finished tables, not as algorithms. The
 * named construction methods postdate him — Agrippa wrote c.1510 (published
 * 1531-33), while the odd-order "Siamese method" is named for Simon de la
 * Loubère, who published it after his 1687 embassy to Siam. Rankine's claim
 * (p.179) that he used "the same mathematical formula used to create the
 * classical kameas" is his own assertion; the book does not publish the
 * formula. The two rules below therefore derive their authority from FIT,
 * not lineage — reproducing a known-correct grid with zero deviation is
 * evidence a rule matches whatever method actually produced that grid, not
 * evidence of a citable source for the rule itself:
 *
 *   - Odd order — start 1 at row (n+3)/2, col (n+1)/2 (1-based); step
 *     down-right with modular wrap; on collision drop two rows in the same
 *     column. Reproduces Saturn, Mars, Venus, and Moon with zero deviation.
 *   - Doubly-even order (n % 4 === 0) — fill 1..n^2 row-major; complement
 *     (n^2+1-v) where (r%4 in {0,3}) === (c%4 in {0,3}); then reverse row
 *     order. Reproduces Jupiter and Mercury with zero deviation.
 *
 * D-04's original sign-off (2026-08-04, decision: approve-candidate) covered
 * a magic-sum-verified candidate set with no independent cell-by-cell
 * corroboration beyond Saturn's full grid and Jupiter's opening row. This
 * comment supersedes that account with the state established by the
 * 2026-08-12 physical-source diff described above.
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
 * ("Anti-Pattern 2: Kamea Cell Positions Hardcoded Outside `data/kamea.js`" in
 * .planning/milestones/v1.0-research/ARCHITECTURE.md). Every consumer goes
 * through `cellForNumber`, `gridSize`, or `planetNames` below.
 */

import { SigilError, E_UNKNOWN_PLANET } from '../errors.js';

/** Canonical planet order, Saturn (smallest/slowest) to Moon (fastest). */
const PLANET_ORDER = ['saturn', 'jupiter', 'mars', 'sun', 'venus', 'mercury', 'moon'];

/** Name of the kamea set shipped in this phase. Only this set ships (D-02). */
export const DEFAULT_KAMEA_SET = 'agrippa';

/**
 * Provenance sign-off date for each kamea set, keyed by set name (D-57,
 * D-60). A value here is NOT a correctness warranty for that set's cells —
 * it names the verification state as of that date. As of 2026-08-12, every
 * classical grid was diffed cell-by-cell against a physical printed source
 * (see the SOURCE LINEAGE block above for the full account, including the
 * Mercury divergence and its two proofs), per
 * "PKG-02 — Kamea version scheme and field shape" in
 * .planning/milestones/v1.1-phases/05-publish-ready-source/05-CONTEXT.md. This is a sidecar
 * map, not a field folded into `KAMEA_SETS` entries — every existing
 * accessor indexes that map's current shape directly, and D-60 rejected
 * reshaping it. A future corrected set (e.g. verified against the physical
 * Tyson/Skinner editions) gets its own key here, matching its own new key in
 * `KAMEA_SETS`, never a mutation of `agrippa`'s value.
 *
 * @type {Readonly<Record<string, string>>}
 */
export const KAMEA_SET_VERSIONS = Object.freeze({
  agrippa: '2026-08-04',
});

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
    throw new SigilError(
      E_UNKNOWN_PLANET,
      `resolvePlanetKey: expected a string planet name, got: ${JSON.stringify(planet)}`,
    );
  }
  const key = planet.toLowerCase();
  if (!PLANET_ORDER.includes(key)) {
    throw new SigilError(
      E_UNKNOWN_PLANET,
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
    throw new SigilError(
      E_UNKNOWN_PLANET,
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
