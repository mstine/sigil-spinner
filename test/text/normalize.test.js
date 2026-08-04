import { describe, expect, it } from 'vitest';
import { normalize } from '../../src/text/normalize.js';

describe('normalize', () => {
  it('strikes vowels and repeats, keeping first occurrence, for "I WILL SUCCEED"', () => {
    const { kept } = normalize('I WILL SUCCEED');
    expect(kept.join('')).toBe('WLSCD');
  });

  it('preserves kept-letter order from the original statement', () => {
    const { kept } = normalize('DOG CAT');
    // Vowels O and A struck; consonants survive in statement order: D,G,C,T.
    expect(kept).toEqual(['D', 'G', 'C', 'T']);
  });

  it('tags every struck character with a non-empty reason', () => {
    const { struck } = normalize('I WILL SUCCEED');
    expect(struck.length).toBeGreaterThan(0);
    for (const entry of struck) {
      expect(typeof entry.reason).toBe('string');
      expect(entry.reason.length).toBeGreaterThan(0);
      expect(['vowel', 'repeat', 'non-letter']).toContain(entry.reason);
    }
  });

  it('records the struck character and its original statement index', () => {
    const { struck } = normalize('AA');
    expect(struck[0]).toMatchObject({ char: 'A', index: 0, reason: 'vowel' });
    expect(struck[1]).toMatchObject({ char: 'A', index: 1, reason: 'vowel' });
  });

  it('does not throw on a single-kept-letter result', () => {
    expect(() => normalize('A B')).not.toThrow();
    const { kept } = normalize('A B');
    expect(kept).toEqual(['B']);
  });

  it('does not throw on a zero-kept-letter result', () => {
    expect(() => normalize('AEIOU')).not.toThrow();
    const { kept } = normalize('AEIOU');
    expect(kept).toEqual([]);
  });

  it('is case-insensitive, uppercasing before evaluation', () => {
    const { kept } = normalize('i will succeed');
    expect(kept.join('')).toBe('WLSCD');
  });

  it('strikes non-letter characters with reason "non-letter"', () => {
    const { struck } = normalize('HI!');
    expect(struck.some((entry) => entry.char === '!' && entry.reason === 'non-letter')).toBe(true);
  });

  it('strikes a cross-letter number collision source (two different letters) independently', () => {
    // "BK" — two different letters, both survive dedup (letter-level, not
    // number-level); repeat detection on the *number* sequence is Phase 2
    // (PATH-02) scope, not this module's concern.
    const { kept } = normalize('BK');
    expect(kept).toEqual(['B', 'K']);
  });
});
