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
 * the artifact is fully known. Argv-parse failures and stdin-read failures
 * (CR-01, CR-02) now surface through this same stderr diagnostic format
 * under CLI-local usage codes (`E_CLI_USAGE`, `E_CLI_STDIN`) rather than a
 * raw Node stack trace — this adds no validation of the statement or the
 * planet to the CLI; that still belongs to the library.
 */

import { parseArgs } from 'node:util';
import { readFileSync, writeFileSync } from 'node:fs';
import { generateSigil, SigilError } from '../src/index.js';

/**
 * Exit status per `SigilError` code (D-15). Usage-class codes
 * (`E_MISSING_STATEMENT`, `E_MISSING_PLANET`, `E_UNKNOWN_PLANET`,
 * `E_INVALID_OPTION` — D-47) and derivation-class codes (`E_EMPTY_SEQUENCE`)
 * get distinct nonzero statuses so a calling script can branch on exit
 * status alone, without parsing stderr text.
 *
 * @type {Record<string, number>}
 */
const EXIT_CODES = {
  E_MISSING_STATEMENT: 2,
  E_MISSING_PLANET: 2,
  E_UNKNOWN_PLANET: 2,
  E_EMPTY_SEQUENCE: 3,
  E_INVALID_OPTION: 2,
};

/** Exit status for any error without a mapped `SigilError` code. */
const DEFAULT_ERROR_EXIT_CODE = 1;

/**
 * CLI-local diagnostic code for a malformed argv the argument parser itself
 * rejects (an unrecognized flag, or a `type: 'string'` option with no
 * value). Has no library analog — it is never constructed as `SigilError`.
 */
const E_CLI_USAGE = 'E_CLI_USAGE';

/**
 * CLI-local diagnostic code for a failure reading the statement from file
 * descriptor 0 under the `-` sentinel. Has no library analog.
 */
const E_CLI_STDIN = 'E_CLI_STDIN';

/**
 * Exit status shared by both CLI-local diagnostic codes above. Placing
 * both CLI-syntax failures in the same usage class as the library's
 * usage-class codes lets a calling script branch on exit status alone,
 * without parsing stderr text.
 */
const CLI_USAGE_EXIT_CODE = 2;

/**
 * Write one `CODE: message` line to stderr, matching the diagnostic format
 * every error branch in this file uses, then exit with the given status.
 * Centralizing this keeps one place that knows the diagnostic format.
 *
 * @param {string} code
 * @param {string} message
 * @param {number} exitCode
 * @returns {never}
 */
function diagnose(code, message, exitCode) {
  process.stderr.write(`${code}: ${message}\n`);
  process.exit(exitCode);
}

/** @type {{ values: Record<string, unknown>, positionals: string[] }} */
let parsed;
try {
  parsed = parseArgs({
    allowPositionals: true,
    options: {
      planet: { type: 'string' },
      json: { type: 'boolean', default: false },
      output: { type: 'string' },
      glyph: { type: 'boolean', default: false },
    },
  });
} catch (/** @type {any} */ err) {
  diagnose(E_CLI_USAGE, err instanceof Error ? err.message : String(err), CLI_USAGE_EXIT_CODE);
}

const { values, positionals } = parsed;

// Cast rather than leave as `string | undefined`: a missing/empty planet is
// a valid runtime state, guarded by generateSigil's E_MISSING_PLANET check
// below, not by this CLI (Anti-Pattern 3 — validation lives in the library).
const planetArg = /** @type {string} */ (values.planet);
const jsonArg = /** @type {boolean} */ (values.json);
const outputArg = /** @type {string | undefined} */ (values.output);
const glyphArg = /** @type {boolean} */ (values.glyph);

const rawStatement = positionals[0];

/** @type {string} */
let statement;
try {
  statement = rawStatement === '-' ? readFileSync(0, 'utf-8') : rawStatement;
} catch (/** @type {any} */ err) {
  diagnose(E_CLI_STDIN, err instanceof Error ? err.message : String(err), CLI_USAGE_EXIT_CODE);
}

try {
  const { svg, working } = generateSigil(statement, planetArg, { glyph: glyphArg });
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
