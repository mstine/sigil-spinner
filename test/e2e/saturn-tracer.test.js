import { describe, expect, it } from 'vitest';
import { generateSigil } from '../../src/index.js';
import { SigilError } from '../../src/errors.js';

describe('generateSigil — Saturn tracer ("I WILL SUCCEED")', () => {
  it('returns an svg with the fixed viewBox, sigil/sigil--saturn classes, and a path layer', () => {
    const { svg } = generateSigil('I WILL SUCCEED', 'saturn');
    expect(svg).toContain('viewBox="0 0 100 100"');
    expect(svg).toContain('class="sigil sigil--saturn"');
    expect(svg).toContain('class="sigil-path"');
  });

  it('is deterministic — two identical calls return byte-identical svg strings', () => {
    const first = generateSigil('I WILL SUCCEED', 'saturn');
    const second = generateSigil('I WILL SUCCEED', 'saturn');
    expect(first.svg).toBe(second.svg);
  });

  it('throws SigilError with code E_EMPTY_SEQUENCE for an all-vowel statement', () => {
    expect(() => generateSigil('AEIOU', 'saturn')).toThrow(SigilError);
    try {
      generateSigil('AEIOU', 'saturn');
      throw new Error('expected generateSigil to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(SigilError);
      if (err instanceof SigilError) {
        expect(err.code).toBe('E_EMPTY_SEQUENCE');
      }
    }
  });

  it('returns an object with a string svg and a JSON-serializable working', () => {
    const result = generateSigil('I WILL SUCCEED', 'saturn');
    expect(typeof result.svg).toBe('string');
    expect(() => JSON.stringify(result.working)).not.toThrow();
    const roundTripped = JSON.parse(JSON.stringify(result.working));
    expect(roundTripped).toEqual(result.working);
  });

  it('emits no inline styling attribute and no id attribute', () => {
    const { svg } = generateSigil('I WILL SUCCEED', 'saturn');
    expect(svg).not.toMatch(/ style=/);
    expect(svg).not.toMatch(/ id=/);
  });

  it('performs independent calls with no shared mutable state (INT-02 concurrency edge)', () => {
    const a = generateSigil('I WILL SUCCEED', 'saturn');
    const b = generateSigil('MY POWER GROWS', 'saturn');
    const c = generateSigil('I WILL SUCCEED', 'saturn');
    expect(a.svg).toBe(c.svg);
    expect(a.svg).not.toBe(b.svg);
  });
});
