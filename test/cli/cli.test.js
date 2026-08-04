import { readFileSync, unlinkSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

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
