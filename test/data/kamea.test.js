import { describe, expect, it } from 'vitest';
import { cellForNumber, DEFAULT_KAMEA_SET, gridSize, kameaGrid, KAMEA_SETS, planetNames } from '../../src/data/kamea.js';
import { SigilError } from '../../src/errors.js';

// Signed-off cell values (D-04, approve-candidate, 2026-08-04) — the same
// literals recorded in src/data/kamea.js's module header. This is the
// exact-value source of truth: it catches an orientation swap (a dihedral
// variant that still sums correctly but places digits in different cells)
// that a magic-sum-only check would miss (Pitfall 1).
/** @type {Record<string, number[][]>} */
const SIGNED_OFF_GRIDS = {
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
};

/** @type {Record<string, number>} */
const MAGIC_CONSTANTS = {
  saturn: 15,
  jupiter: 34,
  mars: 65,
  sun: 111,
  venus: 175,
  mercury: 260,
  moon: 369,
};

const PLANETS = ['saturn', 'jupiter', 'mars', 'sun', 'venus', 'mercury', 'moon'];

/**
 * @param {number[][]} grid
 * @param {number} constant
 * @returns {boolean}
 */
function sumsToConstant(grid, constant) {
  const order = grid.length;

  // Rows
  for (const row of grid) {
    const rowSum = row.reduce((/** @type {number} */ a, /** @type {number} */ b) => a + b, 0);
    if (rowSum !== constant) return false;
  }

  // Columns
  for (let col = 0; col < order; col += 1) {
    let colSum = 0;
    for (let row = 0; row < order; row += 1) colSum += grid[row][col];
    if (colSum !== constant) return false;
  }

  // Diagonals
  let mainDiag = 0;
  let antiDiag = 0;
  for (let i = 0; i < order; i += 1) {
    mainDiag += grid[i][i];
    antiDiag += grid[i][order - 1 - i];
  }
  if (mainDiag !== constant || antiDiag !== constant) return false;

  return true;
}

describe('kamea exact-value assertions', () => {
  it.each(PLANETS)('%s grid matches the signed-off cell values exactly', (planet) => {
    expect(kameaGrid(planet)).toEqual(SIGNED_OFF_GRIDS[planet]);
  });
});

describe('kamea magic-sum supplement (Pitfall 2 — supplement only, never source of truth)', () => {
  it.each(PLANETS)('%s: every row, column, and both diagonals sum to its magic constant', (planet) => {
    expect(sumsToConstant(kameaGrid(planet), MAGIC_CONSTANTS[planet])).toBe(true);
  });
});

describe('resolver behavior', () => {
  it('DEFAULT_KAMEA_SET is "agrippa"', () => {
    expect(DEFAULT_KAMEA_SET).toBe('agrippa');
  });

  it('KAMEA_SETS exposes the agrippa set with all seven planets', () => {
    expect(Object.keys(KAMEA_SETS)).toContain('agrippa');
    for (const planet of PLANETS) {
      expect(KAMEA_SETS.agrippa[planet]).toBeDefined();
    }
  });

  it('planetNames returns the seven names in canonical Saturn-to-Moon order', () => {
    expect(planetNames()).toEqual(PLANETS);
  });

  it.each([
    ['saturn', 3],
    ['jupiter', 4],
    ['mars', 5],
    ['sun', 6],
    ['venus', 7],
    ['mercury', 8],
    ['moon', 9],
  ])('gridSize(%s) === %i', (planet, expectedSize) => {
    expect(gridSize(planet)).toBe(expectedSize);
  });

  it.each(PLANETS)('%s: each digit 1..9 resolves to exactly one distinct in-range cell', (planet) => {
    const order = gridSize(planet);
    const seen = new Set();
    for (let n = 1; n <= 9; n += 1) {
      const { row, col } = cellForNumber(planet, n);
      expect(row).toBeGreaterThanOrEqual(0);
      expect(row).toBeLessThan(order);
      expect(col).toBeGreaterThanOrEqual(0);
      expect(col).toBeLessThan(order);
      const key = `${row},${col}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });

  it('cellForNumber matches case-insensitively', () => {
    expect(cellForNumber('SATURN', 5)).toEqual(cellForNumber('saturn', 5));
    expect(cellForNumber('Saturn', 5)).toEqual(cellForNumber('saturn', 5));
  });

  it('throws SigilError with code E_UNKNOWN_PLANET for an unknown planet (D-15)', () => {
    expect(() => cellForNumber('pluto', 5)).toThrow(SigilError);
    expect(() => gridSize('pluto')).toThrow(SigilError);
    try {
      gridSize('pluto');
      throw new Error('expected gridSize to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(SigilError);
      if (err instanceof SigilError) {
        expect(err.code).toBe('E_UNKNOWN_PLANET');
      }
    }
  });

  it('throws for a digit outside 1..9', () => {
    expect(() => cellForNumber('saturn', 0)).toThrow(RangeError);
    expect(() => cellForNumber('saturn', 10)).toThrow(RangeError);
  });

  it('throws SigilError with code E_UNKNOWN_PLANET for an unknown kamea set (D-15)', () => {
    expect(() => cellForNumber('saturn', 5, { set: 'nonexistent' })).toThrow(SigilError);
    expect(() => gridSize('saturn', { set: 'nonexistent' })).toThrow(SigilError);
    try {
      gridSize('saturn', { set: 'nonexistent' });
      throw new Error('expected gridSize to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(SigilError);
      if (err instanceof SigilError) {
        expect(err.code).toBe('E_UNKNOWN_PLANET');
      }
    }
  });
});
