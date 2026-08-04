import { describe, expect, it } from 'vitest';
import { toPythagoreanDigit } from '../../src/data/pythagorean.js';

describe('toPythagoreanDigit', () => {
  // Chaldean-rejection vectors (CONS-02, Pitfalls 3-4). A Chaldean table or a
  // legacy merged I/J-U/V table would fail these — the cycling formula
  // structurally cannot reproduce either.
  it.each([
    ['A', 1],
    ['I', 9],
    ['J', 1],
    ['R', 9],
    ['S', 1],
    ['Z', 8],
  ])('toPythagoreanDigit(%s) === %i (not Chaldean)', (letter, expected) => {
    expect(toPythagoreanDigit(letter)).toBe(expected);
  });

  it('resolves the A-Z boundary pair', () => {
    expect(toPythagoreanDigit('A')).toBe(1);
    expect(toPythagoreanDigit('Z')).toBe(8);
  });

  it('throws for a character one step outside the A-Z range', () => {
    expect(() => toPythagoreanDigit('@')).toThrow(RangeError);
    expect(() => toPythagoreanDigit('[')).toThrow(RangeError);
  });

  it('distinguishes I from J and U from V (rejects legacy merged tables)', () => {
    expect(toPythagoreanDigit('I')).not.toBe(toPythagoreanDigit('J'));
    expect(toPythagoreanDigit('U')).not.toBe(toPythagoreanDigit('V'));
  });

  it('is case-insensitive', () => {
    expect(toPythagoreanDigit('a')).toBe(toPythagoreanDigit('A'));
    expect(toPythagoreanDigit('z')).toBe(toPythagoreanDigit('Z'));
  });

  it('maps every letter A-Z to an integer in 1..9 with no floating-point arithmetic', () => {
    for (let code = 'A'.charCodeAt(0); code <= 'Z'.charCodeAt(0); code += 1) {
      const letter = String.fromCharCode(code);
      const digit = toPythagoreanDigit(letter);
      expect(Number.isInteger(digit)).toBe(true);
      expect(digit).toBeGreaterThanOrEqual(1);
      expect(digit).toBeLessThanOrEqual(9);
    }
  });

  it('produces the full verified A-Z cycling table', () => {
    const expected = {
      A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9,
      J: 1, K: 2, L: 3, M: 4, N: 5, O: 6, P: 7, Q: 8, R: 9,
      S: 1, T: 2, U: 3, V: 4, W: 5, X: 6, Y: 7, Z: 8,
    };
    for (const [letter, digit] of Object.entries(expected)) {
      expect(toPythagoreanDigit(letter)).toBe(digit);
    }
  });
});
