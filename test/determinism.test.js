import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { generateSigil } from '../src/index.js';

/**
 * Determinism suite (the tool's core value proposition): asserts byte
 * equality, never "ran it twice, looked the same" (PITFALLS.md "Looks Done
 * But Isn't" checklist). Every case here fails loudly on any change to
 * coordinate rounding, attribute ordering, field ordering, or accidental
 * shared mutable state.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI_PATH = path.join(__dirname, '..', 'bin', 'sigil-spinner.js');

const STATEMENT = 'I WILL SUCCEED';
const PLANET = 'saturn';

/** Canonical seven-planet order, matching `src/data/kamea.js`'s `PLANET_ORDER` exactly. */
const PLANETS = ['saturn', 'jupiter', 'mars', 'sun', 'venus', 'mercury', 'moon'];

describe('Determinism contract', () => {
  it('produces strictly equal svg strings across two identical calls', () => {
    const first = generateSigil(STATEMENT, PLANET);
    const second = generateSigil(STATEMENT, PLANET);
    expect(first.svg).toBe(second.svg);
  });

  it('produces strictly equal JSON.stringify(working) strings across two identical calls', () => {
    const first = generateSigil(STATEMENT, PLANET);
    const second = generateSigil(STATEMENT, PLANET);
    expect(JSON.stringify(first.working)).toBe(JSON.stringify(second.working));
  });

  it('produces the same svg through the library call as through the CLI subprocess', () => {
    const { svg } = generateSigil(STATEMENT, PLANET);
    const cliOutput = execFileSync(process.execPath, [CLI_PATH, STATEMENT, '--planet', PLANET], {
      encoding: 'utf-8',
    });
    expect(cliOutput).toBe(svg);
  });

  it('returns identical results for interleaved calls as for standalone calls (no shared mutable state, INT-02)', () => {
    const STATEMENT_A = 'I WILL SUCCEED';
    const STATEMENT_B = 'MY POWER GROWS';

    const standaloneA = generateSigil(STATEMENT_A, PLANET);
    const standaloneB = generateSigil(STATEMENT_B, PLANET);

    const interleaved = [];
    for (let i = 0; i < 10; i += 1) {
      const statement = i % 2 === 0 ? STATEMENT_A : STATEMENT_B;
      interleaved.push(generateSigil(statement, PLANET));
    }

    interleaved.forEach((result, index) => {
      const expected = index % 2 === 0 ? standaloneA : standaloneB;
      expect(result.svg).toBe(expected.svg);
      expect(JSON.stringify(result.working)).toBe(JSON.stringify(expected.working));
    });
  });

  it('matches the committed worked-example SVG file snapshot', async () => {
    const { svg } = generateSigil(STATEMENT, PLANET);
    await expect(svg).toMatchFileSnapshot('./__file_snapshots__/worked-example.svg');
  });

  it('matches the committed worked-example working file snapshot', async () => {
    const { working } = generateSigil(STATEMENT, PLANET);
    await expect(JSON.stringify(working, null, 2)).toMatchFileSnapshot(
      './__file_snapshots__/worked-example.working.json',
    );
  });
});

describe.each(PLANETS)('Determinism matrix — %s (KAMEA-02, INT-03)', (planet) => {
  it('produces strictly equal SVG and working across two calls, and matches its committed snapshot', async (ctx) => {
    const first = generateSigil(STATEMENT, planet);
    const second = generateSigil(STATEMENT, planet);
    expect(first.svg).toBe(second.svg);
    expect(JSON.stringify(first.working)).toBe(JSON.stringify(second.working));
    // Snapshot assertion uses the test-context `expect` (not the imported
    // module-level `expect`) so the snapshot resolves against this specific
    // parameterized case rather than a shared inline-snapshot slot.
    await ctx.expect(first.svg).toMatchFileSnapshot(`./__file_snapshots__/matrix-${planet}.svg`);
  });
});

describe('Seven-planet distinctness and key-order stability (ROADMAP success criterion 1, INT-03)', () => {
  it('produces seven mutually distinct SVGs for the same statement across all seven planets', () => {
    const svgs = new Set(PLANETS.map((planet) => generateSigil(STATEMENT, planet).svg));
    expect(svgs.size).toBe(7);
  });

  it('produces byte-identical SVG and working for a one-kept-letter statement on the smallest and largest kameas', () => {
    for (const planet of ['saturn', 'moon']) {
      const first = generateSigil('A B', planet);
      const second = generateSigil('A B', planet);
      expect(first.svg).toBe(second.svg);
      expect(JSON.stringify(first.working)).toBe(JSON.stringify(second.working));
    }
  });

  it('matches the committed single-letter snapshot on saturn (smallest kamea, D-27 end-bar offset)', async () => {
    const { svg } = generateSigil('A B', 'saturn');
    await expect(svg).toMatchFileSnapshot('./__file_snapshots__/single-letter-saturn.svg');
  });

  it('matches the committed single-letter snapshot on moon (largest kamea, D-27 end-bar offset)', async () => {
    const { svg } = generateSigil('A B', 'moon');
    await expect(svg).toMatchFileSnapshot('./__file_snapshots__/single-letter-moon.svg');
  });

  it('appends the Phase 2 working keys after the unchanged Phase 1 key order', () => {
    const { working } = generateSigil(STATEMENT, PLANET);
    const keys = Object.keys(working);
    const phase1Order = [
      'statement',
      'planet',
      'kameaSet',
      'gridSize',
      'lettersKept',
      'lettersStruck',
      'letterNumbers',
      'numbers',
      'cells',
      'segments',
      'start',
      'end',
    ];
    expect(keys.slice(0, phase1Order.length)).toEqual(phase1Order);
    expect(keys.slice(phase1Order.length)).toEqual(['keptTrail', 'repeats']);
  });
});
