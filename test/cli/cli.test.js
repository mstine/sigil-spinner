import { readFileSync, unlinkSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { generateSigil, SigilError } from '../../src/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI_PATH = path.join(__dirname, '..', '..', 'bin', 'sigil-spinner.js');

const STATEMENT = 'I WILL SUCCEED';
const PLANETS = ['saturn', 'jupiter', 'mars', 'sun', 'venus', 'mercury', 'moon'];

/**
 * Drive the CLI as a real subprocess — never by importing it — so these
 * tests exercise the actual argv/stdin/stdout/stderr/exit-code surface a
 * shell script or build pipeline would see. Never throws on a nonzero exit;
 * returns stdout, stderr, and status so tests can assert on all three.
 *
 * @param {string[]} args
 * @param {{ input?: string }} [opts]
 * @returns {{ stdout: string, stderr: string, status: number }}
 */
function runCli(args, opts = {}) {
  try {
    const stdout = execFileSync(process.execPath, [CLI_PATH, ...args], {
      encoding: 'utf-8',
      input: opts.input,
    });
    return { stdout, stderr: '', status: 0 };
  } catch (/** @type {any} */ err) {
    return {
      stdout: err.stdout ?? '',
      stderr: err.stderr ?? '',
      status: typeof err.status === 'number' ? err.status : 1,
    };
  }
}

describe('sigil-spinner CLI', () => {
  it('writes SVG to stdout and nothing to stderr for a plain invocation, and exits 0', () => {
    const { stdout, stderr, status } = runCli([STATEMENT, '--planet', 'saturn']);
    expect(status).toBe(0);
    expect(stderr).toBe('');
    expect(stdout).toContain('<svg');
    expect(stdout).toContain('class="sigil sigil--saturn"');
  });

  it('writes parseable JSON with the D-14 working fields to stdout with --json', () => {
    const { stdout, status } = runCli([STATEMENT, '--planet', 'saturn', '--json']);
    expect(status).toBe(0);
    expect(stdout.startsWith('{')).toBe(true);
    const working = JSON.parse(stdout);
    expect(working.statement).toBe(STATEMENT);
    expect(working.planet).toBe('saturn');
    expect(working.kameaSet).toBe('agrippa');
    expect(working.gridSize).toBe(3);
    expect(working.lettersKept).toEqual(['W', 'L', 'S', 'C', 'D']);
    expect(working.numbers).toEqual([5, 3, 1, 3, 4]);
    expect(working.cells).toHaveLength(5);
  });

  it('produces the same SVG for a statement piped via a dash positional as for an argument', () => {
    const viaArgument = runCli([STATEMENT, '--planet', 'saturn']);
    const viaStdin = runCli(['-', '--planet', 'saturn'], { input: STATEMENT });
    expect(viaStdin.status).toBe(0);
    expect(viaStdin.stdout).toBe(viaArgument.stdout);
  });

  it('writes the artifact to --output and leaves stdout empty', () => {
    const outputPath = path.join(os.tmpdir(), `sigil-spinner-test-${process.pid}-${Date.now()}.svg`);
    try {
      const { stdout, status } = runCli([STATEMENT, '--planet', 'saturn', '--output', outputPath]);
      expect(status).toBe(0);
      expect(stdout).toBe('');
      const written = readFileSync(outputPath, 'utf-8');
      expect(written.length).toBeGreaterThan(0);
      expect(written).toContain('<svg');
    } finally {
      unlinkSync(outputPath);
    }
  });

  it('matches --planet case-insensitively, producing identical stdout for SATURN and saturn', () => {
    const lower = runCli([STATEMENT, '--planet', 'saturn']);
    const upper = runCli([STATEMENT, '--planet', 'SATURN']);
    expect(upper.status).toBe(0);
    expect(upper.stdout).toBe(lower.stdout);
  });

  it('exits nonzero with empty stdout and a stderr message naming all seven planets for an unknown planet', () => {
    const { stdout, stderr, status } = runCli([STATEMENT, '--planet', 'pluto']);
    expect(status).not.toBe(0);
    expect(stdout).toBe('');
    for (const planet of PLANETS) {
      expect(stderr).toContain(planet);
    }
  });

  it('exits nonzero with empty stdout when --planet is missing', () => {
    const { stdout, status } = runCli([STATEMENT]);
    expect(status).not.toBe(0);
    expect(stdout).toBe('');
  });

  it('exits nonzero with empty stdout and E_EMPTY_SEQUENCE on stderr for an all-vowel statement', () => {
    const { stdout, stderr, status } = runCli(['AEIOU', '--planet', 'saturn']);
    expect(status).not.toBe(0);
    expect(stdout).toBe('');
    expect(stderr).toContain('E_EMPTY_SEQUENCE');
  });

  it('gives distinct nonzero exit statuses for a usage-class error and a derivation-class error', () => {
    const unknownPlanet = runCli([STATEMENT, '--planet', 'pluto']);
    const emptySequence = runCli(['AEIOU', '--planet', 'saturn']);
    expect(unknownPlanet.status).not.toBe(0);
    expect(emptySequence.status).not.toBe(0);
    expect(unknownPlanet.status).not.toBe(emptySequence.status);
  });
});

describe('Degenerate statements — enriched E_EMPTY_SEQUENCE and library/CLI error parity (D-26, INT-04)', () => {
  it('throws E_EMPTY_SEQUENCE naming the total struck count and a per-reason breakdown for an all-vowel statement', () => {
    /** @type {any} */
    let caught;
    try {
      generateSigil('AEIOU', 'saturn');
    } catch (/** @type {any} */ err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(SigilError);
    expect(caught.code).toBe('E_EMPTY_SEQUENCE');
    expect(caught.message).toContain('5');
    expect(caught.message).toContain('vowels');
    expect(Array.isArray(caught.details.struck)).toBe(true);
    expect(caught.details.struck).toHaveLength(5);
    for (const entry of caught.details.struck) {
      expect(typeof entry.reason).toBe('string');
    }
  });

  it('throws E_EMPTY_SEQUENCE with a reason breakdown that reflects the actual reason tags for a repeated vowel', () => {
    // Every character in "AAA" is a vowel — the branch order in normalize.js
    // classifies vowels before ever checking for a repeat, so all three
    // strikes carry reason "vowel", never "repeat". The breakdown must
    // reflect that real per-reason tally, not a naive distinct-letter count.
    /** @type {any} */
    let caught;
    try {
      generateSigil('AAA', 'saturn');
    } catch (/** @type {any} */ err) {
      caught = err;
    }
    expect(caught.code).toBe('E_EMPTY_SEQUENCE');
    expect(caught.details.struck).toHaveLength(3);
    expect(caught.details.struck.every((/** @type {any} */ entry) => entry.reason === 'vowel')).toBe(true);
    expect(caught.message).toContain('3');
    expect(caught.message).toContain('vowels');
  });

  it('throws E_EMPTY_SEQUENCE for a whitespace-only statement', () => {
    expect(() => generateSigil('   ', 'saturn')).toThrow(SigilError);
    try {
      generateSigil('   ', 'saturn');
    } catch (/** @type {any} */ err) {
      expect(err.code).toBe('E_EMPTY_SEQUENCE');
    }
  });

  it('pins the exact E_EMPTY_SEQUENCE message for an all-vowel statement (byte-unchanged common path)', () => {
    /** @type {any} */
    let caught;
    try {
      generateSigil('AEIOU', 'saturn');
    } catch (/** @type {any} */ err) {
      caught = err;
    }
    expect(caught.message).toBe('Statement reduced to zero kept letters: all 5 characters struck (5 vowels).');
  });

  it('pins the exact E_EMPTY_SEQUENCE message for a repeated-vowel statement (byte-unchanged common path)', () => {
    /** @type {any} */
    let caught;
    try {
      generateSigil('AAA', 'saturn');
    } catch (/** @type {any} */ err) {
      caught = err;
    }
    expect(caught.message).toBe('Statement reduced to zero kept letters: all 3 characters struck (3 vowels).');
  });

  it('pins the exact E_EMPTY_SEQUENCE message for a whitespace-only statement (byte-unchanged common path)', () => {
    /** @type {any} */
    let caught;
    try {
      generateSigil('   ', 'saturn');
    } catch (/** @type {any} */ err) {
      caught = err;
    }
    expect(caught.message).toBe('Statement reduced to zero kept letters: all 3 characters struck (3 non-letters).');
  });

  it('names the original character count and strike count separately for a multi-character fold (CONS-03, "Ææ")', () => {
    /** @type {any} */
    let caught;
    try {
      generateSigil('Ææ', 'saturn');
    } catch (/** @type {any} */ err) {
      caught = err;
    }
    expect(caught.code).toBe('E_EMPTY_SEQUENCE');
    expect(caught.message).toBe(
      'Statement reduced to zero kept letters: all 2 characters struck, producing 4 strikes (4 vowels).',
    );
    expect(Array.isArray(caught.details.struck)).toBe(true);
    expect(caught.details.struck).toHaveLength(4);
  });

  it('counts and pluralizes a single-character multi-fold correctly ("Æ")', () => {
    /** @type {any} */
    let caught;
    try {
      generateSigil('Æ', 'saturn');
    } catch (/** @type {any} */ err) {
      caught = err;
    }
    expect(caught.code).toBe('E_EMPTY_SEQUENCE');
    expect(caught.message).toBe(
      'Statement reduced to zero kept letters: all 1 character struck, producing 2 strikes (2 vowels).',
    );
  });

  it('lists per-reason breakdown in first-strike order for a byte-stable message ("Æ!")', () => {
    /** @type {any} */
    let caught;
    try {
      generateSigil('Æ!', 'saturn');
    } catch (/** @type {any} */ err) {
      caught = err;
    }
    expect(caught.code).toBe('E_EMPTY_SEQUENCE');
    expect(caught.message).toBe(
      'Statement reduced to zero kept letters: all 2 characters struck, producing 3 strikes (2 vowels, 1 non-letter).',
    );
  });

  it('reports the identical multi-fold E_EMPTY_SEQUENCE text from library and CLI ("Ææ", INT-04)', () => {
    /** @type {any} */
    let libraryError;
    try {
      generateSigil('Ææ', 'saturn');
    } catch (/** @type {any} */ err) {
      libraryError = err;
    }
    const { stdout, stderr, status } = runCli(['Ææ', '--planet', 'saturn']);
    const aeiouResult = runCli(['AEIOU', '--planet', 'saturn']);
    expect(stdout).toBe('');
    expect(stderr).toBe(`E_EMPTY_SEQUENCE: ${libraryError.message}\n`);
    expect(status).toBe(aeiouResult.status);
  });

  it('throws E_MISSING_STATEMENT for an empty string and for null', () => {
    try {
      generateSigil('', 'saturn');
      throw new Error('expected generateSigil to throw');
    } catch (/** @type {any} */ err) {
      expect(err.code).toBe('E_MISSING_STATEMENT');
    }
    try {
      generateSigil(/** @type {any} */ (null), 'saturn');
      throw new Error('expected generateSigil to throw');
    } catch (/** @type {any} */ err) {
      expect(err.code).toBe('E_MISSING_STATEMENT');
    }
  });

  it('returns a valid single-node sigil for a one-letter statement rather than throwing (CONS-03, D-27)', () => {
    const result = generateSigil('B', 'saturn');
    expect(result.svg).toContain('<svg');
    expect(result.working.lettersKept).toEqual(['B']);
  });

  it('leaves two-argument SigilError construction unchanged — no details property present', () => {
    const err = new SigilError('E_TEST', 'msg');
    expect(Object.hasOwn(err, 'details')).toBe(false);
  });

  it('CLI exits 3 for an all-vowel statement, writes empty stdout, and mirrors the library strike-count message on stderr (INT-04)', () => {
    /** @type {any} */
    let libraryError;
    try {
      generateSigil('AEIOU', 'saturn');
    } catch (/** @type {any} */ err) {
      libraryError = err;
    }
    const { stdout, stderr, status } = runCli(['AEIOU', '--planet', 'saturn']);
    expect(status).toBe(3);
    expect(stdout).toBe('');
    expect(stderr).toContain(libraryError.code);
    expect(stderr).toContain('5');
    expect(stderr).toContain('vowels');
  });
});
