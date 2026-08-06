import { describe, expect, it } from 'vitest';
import { foldStatement, TRANSLITERATION_MAP } from '../../src/text/fold.js';

/**
 * @param {string} char
 * @returns {string}
 */
function foldOne(char) {
  const [record] = foldStatement(char);
  return record.folded;
}

describe('foldStatement — transliteration table (D-23)', () => {
  it.each([
    ['ß', 'SS'],
    ['ẞ', 'SS'],
    ['æ', 'AE'],
    ['Æ', 'AE'],
    ['œ', 'OE'],
    ['Œ', 'OE'],
    ['ø', 'O'],
    ['Ø', 'O'],
    ['þ', 'TH'],
    ['Þ', 'TH'],
    ['ð', 'D'],
    ['Ð', 'D'],
  ])('folds %s to %s', (char, expected) => {
    expect(foldOne(char)).toBe(expected);
  });
});

describe('foldStatement — Latin stroke/bar class (D-23 amendment, ratified plan 02-04 Task 2)', () => {
  it.each([
    // Verifier-reported gap vectors.
    ['Ł', 'L'],
    ['ł', 'L'],
    ['Đ', 'D'],
    ['đ', 'D'],
    ['Ħ', 'H'],
    ['ħ', 'H'],
    ['Ŧ', 'T'],
    ['ŧ', 'T'],
    // One representative from each remaining base-letter group, so no
    // group can be silently dropped by a future edit.
    ['Ⱥ', 'A'],
    ['Ƀ', 'B'],
    ['Ȼ', 'C'],
    ['Ɇ', 'E'],
    ['Ꞙ', 'F'],
    ['Ǥ', 'G'],
    ['Ɨ', 'I'],
    ['Ɉ', 'J'],
    ['Ꝁ', 'K'],
    ['Ꞥ', 'N'],
    ['Ᵽ', 'P'],
    ['Ꝙ', 'Q'],
    ['Ɍ', 'R'],
    ['Ꞩ', 'S'],
    ['Ʉ', 'U'],
    ['Ꝟ', 'V'],
    ['Ɏ', 'Y'],
    ['Ƶ', 'Z'],
  ])('folds %s to its base letter %s', (char, expected) => {
    expect(foldOne(char)).toBe(expected);
  });
});

describe('TRANSLITERATION_MAP — structural completeness (D-23 amendment)', () => {
  it('has exactly 84 keys', () => {
    expect(Object.keys(TRANSLITERATION_MAP)).toHaveLength(84);
  });

  it('maps every key to a non-empty A-Z-only value', () => {
    for (const [key, value] of Object.entries(TRANSLITERATION_MAP)) {
      expect(value, `value for key ${key}`).toMatch(/^[A-Z]+$/);
    }
  });

  it('is case-complete: every key\'s single-character case partner is also a key mapping to the identical value', () => {
    for (const [key, value] of Object.entries(TRANSLITERATION_MAP)) {
      const upper = key.toUpperCase();
      const lower = key.toLowerCase();
      for (const partner of [upper, lower]) {
        if (partner.length === 1 && partner !== key) {
          expect(TRANSLITERATION_MAP, `case partner ${partner} of key ${key}`).toHaveProperty(partner, value);
        }
      }
    }
  });
});

describe('foldStatement — NFD accent-stripping path (D-22)', () => {
  it.each([
    ['é', 'e'],
    ['É', 'E'],
    ['ñ', 'n'],
    ['Ñ', 'N'],
    ['ü', 'u'],
    ['à', 'a'],
    ['ç', 'c'],
  ])('folds %s to its base letter %s', (char, expected) => {
    expect(foldOne(char)).toBe(expected);
  });
});

describe('foldStatement — non-Latin script characters (D-24)', () => {
  it('folds Greek, Cyrillic, Hebrew, and CJK characters to themselves — never to Latin', () => {
    const records = foldStatement('ΩЯא你');
    expect(records).toHaveLength(4);
    expect(records.map((r) => r.folded)).toEqual(['Ω', 'Я', 'א', '你']);
  });
});

describe('foldStatement — defensive edge cases (threat T-02-02)', () => {
  it('returns without throwing for a lone surrogate half', () => {
    const loneSurrogate = '\uD800';
    expect(() => foldStatement(loneSurrogate)).not.toThrow();
    const records = foldStatement(loneSurrogate);
    expect(records).toHaveLength(1);
    expect(records[0].original).toBe(loneSurrogate);
  });

  it('folds a base letter carrying fifty stacked combining marks to the single base letter without throwing', () => {
    const stacked = 'e' + '́'.repeat(50);
    expect(() => foldStatement(stacked)).not.toThrow();
    const records = foldStatement(stacked);
    expect(records).toHaveLength(51);
    expect(records[0].folded).toBe('e');
    for (let i = 1; i < records.length; i += 1) {
      expect(records[i].folded).toBe('');
    }
  });
});

describe('foldStatement — provenance (D-25)', () => {
  it('retains original character and original code-point index alongside each fold', () => {
    const records = foldStatement('Ñu');
    expect(records[0]).toMatchObject({ original: 'Ñ', originalIndex: 0, folded: 'N' });
    expect(records[1]).toMatchObject({ original: 'u', originalIndex: 1, folded: 'u' });
  });
});
