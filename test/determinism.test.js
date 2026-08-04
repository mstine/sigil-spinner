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
