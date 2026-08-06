import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { generateSigil } from '../../src/index.js';

/**
 * Phase 2 tracer: one accented statement carrying a consecutive-digit repeat,
 * traced end to end on a non-Saturn kamea. "CLARITÉ" on Jupiter (4x4) folds
 * É to E, strikes A/I/E as vowels, keeps C, L, R, T, encodes to digits
 * 3, 3, 9, 2 — exactly one consecutive repeat at the second point (D-17,
 * D-18, D-20, D-22, D-25, KAMEA-02, PATH-02).
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI_PATH = path.join(__dirname, '..', '..', 'bin', 'sigil-spinner.js');

const STATEMENT = 'CLARITÉ';
const PLANET = 'jupiter';

describe('generateSigil — Phase 2 tracer ("CLARITÉ" on Jupiter)', () => {
  it('folds É to E and keeps C, L, R, T (D-22, D-25)', () => {
    const { working } = generateSigil(STATEMENT, PLANET);
    expect(working.lettersKept).toEqual(['C', 'L', 'R', 'T']);
    const accentedStruck = working.lettersStruck.find((entry) => entry.original === 'É');
    expect(accentedStruck).toMatchObject({ original: 'É', char: 'E', reason: 'vowel' });
  });

  it('carries exactly one consecutive-repeat event at the second point (PATH-02, D-18)', () => {
    const { working } = generateSigil(STATEMENT, PLANET);
    expect(working.repeats).toEqual([{ atPoint: 1, count: 1 }]);
  });

  it('renders exactly one sigil-loop element on the Jupiter kamea (D-17, D-20, KAMEA-02)', () => {
    const { svg } = generateSigil(STATEMENT, PLANET);
    expect(svg).toContain('sigil--jupiter');
    expect(svg.match(/class="sigil-loop"/g) ?? []).toHaveLength(1);
  });

  it('anchors the sigil-loop at the repeated cell center 62.5,87.5 — a true independent pin, not derived from the PathModel (G-02-1)', () => {
    const { svg } = generateSigil(STATEMENT, PLANET);
    const match = svg.match(/class="sigil-loop" d="([^"]+)"/);
    expect(match).not.toBeNull();
    if (!match) {
      throw new Error('expected a sigil-loop element to be present');
    }
    const d = match[1];
    expect(d.startsWith('M62.5,87.5 ')).toBe(true);
    expect(d.endsWith('62.5,87.5')).toBe(true);
  });

  it('renders the loop additively — four nodes, one start, one end, all still present (Pitfall 5, D-06)', () => {
    const { svg } = generateSigil(STATEMENT, PLANET);
    expect(svg.match(/class="sigil-node"/g) ?? []).toHaveLength(4);
    expect(svg.match(/class="sigil-start"/g) ?? []).toHaveLength(1);
    expect(svg.match(/class="sigil-end"/g) ?? []).toHaveLength(1);
  });

  it('reports a four-entry keptTrail in the working (D-20, D-25)', () => {
    const { working } = generateSigil(STATEMENT, PLANET);
    expect(working.keptTrail).toHaveLength(4);
  });

  it('produces byte-identical stdout through the CLI subprocess as through the library (INT-02)', () => {
    const { svg } = generateSigil(STATEMENT, PLANET);
    const cliOutput = execFileSync(process.execPath, [CLI_PATH, STATEMENT, '--planet', PLANET], {
      encoding: 'utf-8',
    });
    expect(cliOutput).toBe(svg);
  });
});
