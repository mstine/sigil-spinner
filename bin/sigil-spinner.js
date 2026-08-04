#!/usr/bin/env node
/**
 * Thin CLI wrapper (ARCHITECTURE.md "Thin CLI Over Stable Library API").
 * Zero domain logic lives here — argv in, one call into `../src/index.js`,
 * stdout/stderr out. Planet validation happens in the library, not here
 * (Anti-Pattern 3), so programmatic callers get identical guarantees.
 *
 * stdout carries only the requested artifact; every diagnostic goes to
 * stderr with a nonzero exit code (Integration Gotchas — stdout discipline).
 */

import { parseArgs } from 'node:util';
import { generateSigil, SigilError } from '../src/index.js';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    planet: { type: 'string' },
  },
});

const statement = positionals[0];

try {
  const { svg } = generateSigil(statement, /** @type {string} */ (values.planet));
  process.stdout.write(svg);
} catch (err) {
  if (err instanceof SigilError) {
    process.stderr.write(`${err.code}: ${err.message}\n`);
  } else if (err instanceof Error) {
    process.stderr.write(`E_UNKNOWN: ${err.message}\n`);
  } else {
    process.stderr.write(`E_UNKNOWN: ${String(err)}\n`);
  }
  process.exit(1);
}
