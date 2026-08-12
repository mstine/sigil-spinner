import { describe, expect, it } from 'vitest';
import { PLANET_GLYPHS, glyphFor } from '../../src/render/glyphs.js';

/** Canonical planet order, matching `src/data/kamea.js`'s `PLANET_ORDER`. */
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

/** The cited base code point (D-37) for each planet, as a lone character. */
const EXPECTED_BASE_CODE_POINT = {
  saturn: '♄',
  jupiter: '♃',
  mars: '♂',
  sun: '☉',
  venus: '♀',
  mercury: '☿',
  moon: '☽',
  uranus: '♅',
  neptune: '♆',
  pluto: '♇',
};

const VARIATION_SELECTOR_15_CODE_POINT = 0xfe0e;

/** The five XML-reserved characters (D-37/glyphLayer's no-escaping rationale). */
const XML_RESERVED = ['&', '<', '>', '"', "'"];

describe('PLANET_GLYPHS — closed ten-entry planet -> glyph map (D-37, Pitfall C)', () => {
  it('has exactly ten entries, keyed by the canonical planet order', () => {
    expect(Object.keys(PLANET_GLYPHS)).toEqual(PLANET_ORDER);
  });

  it.each(PLANET_ORDER)('is exactly two code points long for %s', (planet) => {
    expect(Array.from(PLANET_GLYPHS[planet])).toHaveLength(2);
  });

  it.each(PLANET_ORDER)("the second code point is U+FE0E (VS15) for %s", (planet) => {
    const codePoints = Array.from(PLANET_GLYPHS[planet]);
    expect(codePoints[1].codePointAt(0)).toBe(VARIATION_SELECTOR_15_CODE_POINT);
  });

  it.each(PLANET_ORDER)('the first code point matches the cited astrological character for %s', (planet) => {
    const codePoints = Array.from(PLANET_GLYPHS[planet]);
    expect(codePoints[0]).toBe(EXPECTED_BASE_CODE_POINT[/** @type {keyof typeof EXPECTED_BASE_CODE_POINT} */ (planet)]);
  });

  it('has ten mutually distinct values', () => {
    const values = new Set(Object.values(PLANET_GLYPHS));
    expect(values.size).toBe(PLANET_ORDER.length);
  });

  it.each(PLANET_ORDER)('contains no XML-reserved character for %s', (planet) => {
    const value = PLANET_GLYPHS[planet];
    for (const reserved of XML_RESERVED) {
      expect(value).not.toContain(reserved);
    }
  });

  it('is frozen — cannot be mutated at runtime', () => {
    expect(Object.isFrozen(PLANET_GLYPHS)).toBe(true);
  });
});

describe('glyphFor — case-sensitive, already-canonicalized lookup', () => {
  it.each(PLANET_ORDER)('returns the same value as PLANET_GLYPHS[planet] for %s', (planet) => {
    expect(glyphFor(planet)).toBe(PLANET_GLYPHS[planet]);
  });
});
