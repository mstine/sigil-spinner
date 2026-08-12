/**
 * Kamea data — the ten planetary magic squares: the seven classical planets
 * plus the three trans-Saturnian modern additions (Uranus, Neptune, Pluto).
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
 * Trans-Saturnian (modern, non-traditional — see PLANET_ATTESTATION below):
 *   Uranus  — 11x11 — magic constant 671
 *   Neptune — 12x12 — magic constant 870
 *   Pluto   — 13x13 — magic constant 1105
 *
 * No other module in this repository may contain a kamea grid literal
 * ("Anti-Pattern 2: Kamea Cell Positions Hardcoded Outside `data/kamea.js`" in
 * .planning/milestones/v1.0-research/ARCHITECTURE.md). Every consumer goes
 * through `cellForNumber`, `gridSize`, or `planetNames` below.
 */

import { SigilError, E_UNKNOWN_PLANET } from '../errors.js';

/** Canonical planet order, Saturn (smallest/slowest) to Moon (fastest), then
 * the three trans-Saturnian modern additions appended after the classical
 * seven, preserving their existing order. */
const PLANET_ORDER = [
  'saturn',
  'jupiter',
  'mars',
  'sun',
  'venus',
  'mercury',
  'moon',
  'uranus',
  'neptune',
  'pluto',
];

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
 * Per-planet attestation, keyed by canonical planet key. Every planet
 * carries `traditional` — `true` for the seven classical planets sourced
 * from the printed book (SOURCE LINEAGE above), `false` for the three
 * trans-Saturnian modern additions (Rankine's own 1980s extension, p.179).
 *
 * The `attestation` key is scoped to non-traditional planets ONLY — it
 * answers "how do we know this non-traditional grid is right," a question
 * that only arises where there is no traditional source to answer it.
 * `traditional: false` alone cannot distinguish Uranus and Pluto (an
 * independent printed source AND the fitted construction rule agree, zero
 * differing cells) from Neptune (the fitted rule only, contradicting the
 * sole printed source) — `attestation` carries that distinction. No
 * classical planet carries this key at all: Mercury's divergence from the
 * printed book (see SOURCE LINEAGE above) is a correction to a defective
 * transcription, not a question of whether an unattested grid is right, and
 * belongs in that full-sentence citation rather than a one-word enum that
 * would flatten the distinction between "the book is wrong" and "there is
 * no book to check against."
 *
 * Vocabulary, both values applying to `uranus`, `neptune`, and `pluto`
 * only:
 *   - `'attested'` — an independent source (the printed book) and the
 *     empirically-fitted construction rule agree, zero differing cells.
 *   - `'derived'`  — the fitted construction rule only; the sole printed
 *     source disagrees, and the generated form was preferred (see the
 *     Neptune divergence note immediately above its grid literal in
 *     `KAMEA_SETS.agrippa`).
 *
 * @type {Readonly<Record<string, { traditional: boolean, attestation?: string }>>}
 */
export const PLANET_ATTESTATION = Object.freeze({
  saturn: Object.freeze({ traditional: true }),
  jupiter: Object.freeze({ traditional: true }),
  mars: Object.freeze({ traditional: true }),
  sun: Object.freeze({ traditional: true }),
  venus: Object.freeze({ traditional: true }),
  mercury: Object.freeze({ traditional: true }),
  moon: Object.freeze({ traditional: true }),
  uranus: Object.freeze({ traditional: false, attestation: 'attested' }),
  neptune: Object.freeze({ traditional: false, attestation: 'derived' }),
  pluto: Object.freeze({ traditional: false, attestation: 'attested' }),
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
    // uranus and pluto: NOT traditional (Rankine created these in the 1980s,
    // p.179, so kamea sigilisation could extend to the outer planets), but
    // ATTESTED — the printed book and the empirically-fitted construction
    // rule above agree, zero differing cells. See PLANET_ATTESTATION below.
    uranus: [
      [56, 117, 46, 107, 36, 97, 26, 87, 16, 77, 6],
      [7, 57, 118, 47, 108, 37, 98, 27, 88, 17, 67],
      [68, 8, 58, 119, 48, 109, 38, 99, 28, 78, 18],
      [19, 69, 9, 59, 120, 49, 110, 39, 89, 29, 79],
      [80, 20, 70, 10, 60, 121, 50, 100, 40, 90, 30],
      [31, 81, 21, 71, 11, 61, 111, 51, 101, 41, 91],
      [92, 32, 82, 22, 72, 1, 62, 112, 52, 102, 42],
      [43, 93, 33, 83, 12, 73, 2, 63, 113, 53, 103],
      [104, 44, 94, 23, 84, 13, 74, 3, 64, 114, 54],
      [55, 105, 34, 95, 24, 85, 14, 75, 4, 65, 115],
      [116, 45, 106, 35, 96, 25, 86, 15, 76, 5, 66],
    ],
    // neptune: NOT traditional, and DERIVED rather than attested — this
    // square is generated by the empirically-fitted construction rule and
    // CONTRADICTS the printed book. The book's printed Neptune prints `34`
    // twice (35 absent) and `69` twice (68 absent) — visible typos in the
    // photograph. Even after repairing both typos it still fails: columns 8
    // and 9 sum 869 and 871 against magic constant 870, and 4 cells break
    // associativity. The square below is clean on every test: full
    // permutation of 1..144, all rows/columns/both diagonals at 870, and
    // fully associative (verified by the invariant probes in
    // test/data/kamea.test.js). Neptune is nonetheless the WEAKEST LINK in
    // this whole chain: it extrapolates a rule fitted at n=4 and n=8 out to
    // n=12, and it disagrees structurally with the sole printed source (a
    // column-block swap, over and above the typos) — the preference for the
    // generated form is a sound inference, not provenance. See
    // PLANET_ATTESTATION below for the `derived` label this earns.
    neptune: [
      [12, 134, 135, 9, 8, 138, 139, 5, 4, 142, 143, 1],
      [121, 23, 22, 124, 125, 19, 18, 128, 129, 15, 14, 132],
      [109, 35, 34, 112, 113, 31, 30, 116, 117, 27, 26, 120],
      [48, 98, 99, 45, 44, 102, 103, 41, 40, 106, 107, 37],
      [60, 86, 87, 57, 56, 90, 91, 53, 52, 94, 95, 49],
      [73, 71, 70, 76, 77, 67, 66, 80, 81, 63, 62, 84],
      [61, 83, 82, 64, 65, 79, 78, 68, 69, 75, 74, 72],
      [96, 50, 51, 93, 92, 54, 55, 89, 88, 58, 59, 85],
      [108, 38, 39, 105, 104, 42, 43, 101, 100, 46, 47, 97],
      [25, 119, 118, 28, 29, 115, 114, 32, 33, 111, 110, 36],
      [13, 131, 130, 16, 17, 127, 126, 20, 21, 123, 122, 24],
      [144, 2, 3, 141, 140, 6, 7, 137, 136, 10, 11, 133],
    ],
    pluto: [
      [79, 164, 67, 152, 55, 140, 43, 128, 31, 116, 19, 104, 7],
      [8, 80, 165, 68, 153, 56, 141, 44, 129, 32, 117, 20, 92],
      [93, 9, 81, 166, 69, 154, 57, 142, 45, 130, 33, 105, 21],
      [22, 94, 10, 82, 167, 70, 155, 58, 143, 46, 118, 34, 106],
      [107, 23, 95, 11, 83, 168, 71, 156, 59, 131, 47, 119, 35],
      [36, 108, 24, 96, 12, 84, 169, 72, 144, 60, 132, 48, 120],
      [121, 37, 109, 25, 97, 13, 85, 157, 73, 145, 61, 133, 49],
      [50, 122, 38, 110, 26, 98, 1, 86, 158, 74, 146, 62, 134],
      [135, 51, 123, 39, 111, 14, 99, 2, 87, 159, 75, 147, 63],
      [64, 136, 52, 124, 27, 112, 15, 100, 3, 88, 160, 76, 148],
      [149, 65, 137, 40, 125, 28, 113, 16, 101, 4, 89, 161, 77],
      [78, 150, 53, 138, 41, 126, 29, 114, 17, 102, 5, 90, 162],
      [163, 66, 151, 54, 139, 42, 127, 30, 115, 18, 103, 6, 91],
    ],
  },
};

/**
 * The unknown-planet message, listing valid planets with classical and
 * modern separated (D-3) — this CLI has no `--help` flag at all (the skill
 * reference documents its absence, and `bin/sigil-spinner.js` delegates all
 * planet validation to this library), so `resolvePlanetKey`'s thrown message
 * is the real surface where a caller meets the planet enumeration. Both
 * lists are derived from `PLANET_ORDER` and `PLANET_ATTESTATION` rather than
 * transcribed, so an added planet updates this message with no separate
 * edit.
 *
 * @returns {string}
 */
function validPlanetsMessage() {
  const classical = PLANET_ORDER.filter((name) => PLANET_ATTESTATION[name]?.traditional);
  const modern = PLANET_ORDER.filter((name) => !PLANET_ATTESTATION[name]?.traditional);
  return `Classical: ${classical.join(' ')} / Modern: ${modern.join(' ')} (non-traditional)`;
}

/**
 * Resolve a planet name (case-insensitive) to its canonical lowercase key.
 * Throws for anything not one of the ten planets (the seven classical plus
 * the three trans-Saturnian modern additions).
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
      `resolvePlanetKey: unknown planet "${planet}". Valid planets: ${validPlanetsMessage()}`,
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
 * All ten planet names in canonical order — the seven classical planets
 * (Saturn-to-Moon) followed by the three trans-Saturnian modern additions
 * (Uranus, Neptune, Pluto). See `PLANET_ATTESTATION` to distinguish
 * traditional from non-traditional entries.
 *
 * @returns {string[]}
 */
export function planetNames() {
  return [...PLANET_ORDER];
}

/**
 * The order (side length) of a planet's kamea — 3 for saturn through 13 for pluto.
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
