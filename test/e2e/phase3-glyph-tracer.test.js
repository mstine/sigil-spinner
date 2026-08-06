import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { generateSigil, SigilError } from '../../src/index.js';

/**
 * Phase 3 tracer: proves the whole option seam (D-46 CLI options object,
 * D-47 library validation, D-39 layer-array head insertion, D-48 working
 * `render` block) end to end on ONE new capability — the optional planetary
 * glyph layer (REND-04, D-36 through D-39) — from a CLI flag, through
 * library-side option resolution and validation, through the new
 * `src/render/glyphs.js` data module, into `renderSvg`'s layer array, and
 * out into both the SVG artifact and the JSON working's new `render` block.
 *
 * This plan changes ZERO existing SVG snapshot bytes — the glyph layer is
 * opt-in and vanishes through the existing `.filter(Boolean)` join when off.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI_PATH = path.join(__dirname, '..', '..', 'bin', 'sigil-spinner.js');
const WORKED_EXAMPLE_SVG_PATH = path.join(
  __dirname,
  '..',
  '__file_snapshots__',
  'worked-example.svg',
);

const STATEMENT = 'I WILL SUCCEED';
const SATURN = 'saturn';

/** Expected two-code-point glyph string per planet (D-37, Pitfall C VS15). */
const EXPECTED_GLYPHS = {
  saturn: '♄︎',
  jupiter: '♃︎',
  mars: '♂︎',
  sun: '☉︎',
  venus: '♀︎',
  mercury: '☿︎',
  moon: '☽︎',
};

describe('generateSigil — Phase 3 glyph tracer (REND-04, D-36..D-39, D-46..D-48)', () => {
  it('contains exactly one class="sigil-glyph" occurrence when glyph:true', () => {
    const { svg } = generateSigil(STATEMENT, SATURN, { glyph: true });
    expect(svg.match(/class="sigil-glyph"/g) ?? []).toHaveLength(1);
  });

  it('contains zero occurrences of "sigil-glyph" with the option absent, and with glyph:false', () => {
    const withoutOption = generateSigil(STATEMENT, SATURN);
    const withFalse = generateSigil(STATEMENT, SATURN, { glyph: false });
    expect(withoutOption.svg).not.toContain('sigil-glyph');
    expect(withFalse.svg).not.toContain('sigil-glyph');
  });

  it('produces SVG byte-identical to the committed worked-example.svg when the glyph option is absent', () => {
    const { svg } = generateSigil(STATEMENT, SATURN);
    const committed = readFileSync(WORKED_EXAMPLE_SVG_PATH, 'utf-8');
    expect(svg).toBe(committed);
  });

  it.each(Object.entries(EXPECTED_GLYPHS))(
    'renders the cited two-code-point glyph text for %s',
    (planet, expectedGlyph) => {
      const { svg } = generateSigil(STATEMENT, planet, { glyph: true });
      expect(svg).toContain(`>${expectedGlyph}</text>`);
    },
  );

  it('throws SigilError E_INVALID_OPTION for a wrong-typed glyph option, naming it in message and details', () => {
    let caught;
    try {
      generateSigil(STATEMENT, SATURN, { glyph: 'yes' });
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(SigilError);
    expect(caught.code).toBe('E_INVALID_OPTION');
    expect(caught.message).toContain('glyph');
    expect(caught.details.option).toBe('glyph');
  });

  it('treats glyph:undefined as absent rather than throwing', () => {
    expect(() => generateSigil(STATEMENT, SATURN, { glyph: undefined })).not.toThrow();
    const withUndefined = generateSigil(STATEMENT, SATURN, { glyph: undefined });
    const withoutOption = generateSigil(STATEMENT, SATURN);
    expect(withUndefined.svg).toBe(withoutOption.svg);
  });

  it('ignores an unknown option key without throwing (D-47 forward compatibility)', () => {
    expect(() => generateSigil(STATEMENT, SATURN, { someFutureOption: 42 })).not.toThrow();
  });

  it('records a render block { glyph: true, title: false } as the last working key', () => {
    const { working } = generateSigil(STATEMENT, SATURN, { glyph: true });
    expect(working.render).toEqual({ glyph: true, title: false });
    const keys = Object.keys(working);
    expect(keys[keys.length - 1]).toBe('render');
  });

  it('writes to stdout exactly the string the equivalent library call returns, via --glyph', () => {
    const { svg } = generateSigil(STATEMENT, SATURN, { glyph: true });
    const cliOutput = execFileSync(
      process.execPath,
      [CLI_PATH, STATEMENT, '--planet', SATURN, '--glyph'],
      { encoding: 'utf-8' },
    );
    expect(cliOutput).toBe(svg);
  });

  it('paints the glyph layer BEFORE the sigil-path element (D-39: grid, glyph, path, ...)', () => {
    const { svg } = generateSigil(STATEMENT, SATURN, { glyph: true });
    const glyphIndex = svg.indexOf('class="sigil-glyph"');
    const pathIndex = svg.indexOf('class="sigil-path"');
    expect(glyphIndex).toBeGreaterThan(-1);
    expect(pathIndex).toBeGreaterThan(-1);
    expect(glyphIndex).toBeLessThan(pathIndex);
  });
});
