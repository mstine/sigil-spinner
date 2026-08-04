#!/usr/bin/env node
/**
 * Thin CLI wrapper (ARCHITECTURE.md "Thin CLI Over Stable Library API").
 * Zero domain logic lives here — argv/stdin in, one call into
 * `../src/index.js`, stdout/file out. Statement and planet validation happen
 * in the library, not here (Anti-Pattern 3), so a programmatic caller gets
 * identical guarantees.
 *
 * Artifact selection (D-10): raw SVG to stdout by default; `--json` swaps
 * stdout to the JSON working instead — one artifact per stream, no envelope.
 * `--output <file>` writes the selected artifact to a file and leaves stdout
 * completely empty (D-11) — getting both artifacts means two invocations,
 * the determinism contract guarantees they describe the same sigil.
 *
 * Statement input (D-09): the first positional argument, or — when that
 * positional is exactly a single `-` character — the statement is read
 * synchronously from stdin (file descriptor 0), which is what lets the tool
 * compose in a shell pipeline.
 *
 * Diagnostics (D-12): every error/warning/usage message goes to
 * `process.stderr`; `process.stdout` carries only the requested artifact
 * (Integration Gotchas — stdout purity). Nothing is written to stdout before
 * the artifact is fully known.
 */

import { parseArgs } from 'node:util';
import { readFileSync, writeFileSync } from 'node:fs';
import { generateSigil, SigilError } from '../src/index.js';

/**
 * Exit status per `SigilError` code (D-15). Usage-class codes
 * (`E_MISSING_STATEMENT`, `E_MISSING_PLANET`, `E_UNKNOWN_PLANET`) and
 * derivation-class codes (`E_EMPTY_SEQUENCE`) get distinct nonzero statuses
 * so a calling script can branch on exit status alone, without parsing
 * stderr text.
 *
 * @type {Record<string, number>}
 */
const EXIT_CODES = {
  E_MISSING_STATEMENT: 2,
  E_MISSING_PLANET: 2,
  E_UNKNOWN_PLANET: 2,
  E_EMPTY_SEQUENCE: 3,
};

/** Exit status for any error without a mapped `SigilError` code. */
const DEFAULT_ERROR_EXIT_CODE = 1;

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    planet: { type: 'string' },
    json: { type: 'boolean', default: false },
    output: { type: 'string' },
  },
});

// Cast rather than leave as `string | undefined`: a missing/empty planet is
// a valid runtime state, guarded by generateSigil's E_MISSING_PLANET check
// below, not by this CLI (Anti-Pattern 3 — validation lives in the library).
const planetArg = /** @type {string} */ (values.planet);
const jsonArg = /** @type {boolean} */ (values.json);
const outputArg = /** @type {string | undefined} */ (values.output);

const rawStatement = positionals[0];
const statement = rawStatement === '-' ? readFileSync(0, 'utf-8') : rawStatement;

try {
  const { svg, working } = generateSigil(statement, planetArg);
  const artifact = jsonArg ? JSON.stringify(working, null, 2) : svg;

  if (outputArg) {
    // Not atomic: a concurrent writer to the same path, or a process killed
    // mid-write, can leave a partially-written file. Documented in README's
    // Usage section rather than left undescribed.
    writeFileSync(outputArg, artifact);
  } else {
    process.stdout.write(artifact);
  }
} catch (err) {
  if (err instanceof SigilError) {
    process.stderr.write(`${err.code}: ${err.message}\n`);
    process.exit(EXIT_CODES[err.code] ?? DEFAULT_ERROR_EXIT_CODE);
  } else if (err instanceof Error) {
    process.stderr.write(`E_UNKNOWN: ${err.message}\n`);
  } else {
    process.stderr.write(`E_UNKNOWN: ${String(err)}\n`);
  }
  process.exit(DEFAULT_ERROR_EXIT_CODE);
}
