/**
 * Orchestrator — the only module allowed to import across `text/`, `data/`,
 * and `path/` (ARCHITECTURE.md internal boundaries). Wires normalize, encode,
 * cell lookup, path, and render into the public `generateSigil` entry point.
 *
 * Holds no module-level mutable state and performs no I/O, so concurrent
 * calls are independent (INT-02 concurrency edge). Each stage takes exactly
 * the inputs it needs and returns a new value — no mutable context object is
 * threaded through the pipeline (ARCHITECTURE.md Anti-Pattern 4).
 */

import { normalize } from './text/normalize.js';
import { toPythagoreanDigit } from './data/pythagorean.js';
import { cellForNumber, gridSize, planetNames, DEFAULT_KAMEA_SET } from './data/kamea.js';
import { buildPath } from './path/buildPath.js';
import { renderSvg } from './render/svg.js';
import { toWorking } from './render/json.js';
import { SigilError, E_EMPTY_SEQUENCE, E_MISSING_STATEMENT, E_MISSING_PLANET } from './errors.js';

/**
 * @typedef {Object} GenerateOptions
 * @property {boolean} [title] - When true, embed the (XML-escaped) statement
 *   in the SVG's `<title>` element (D-16). Defaults to false — the intention
 *   statement is omitted from the SVG by default.
 */

/**
 * @typedef {import('./render/json.js').SigilWorking} SigilWorking
 */

/**
 * @typedef {Object} GenerateResult
 * @property {string} svg - Self-contained inline SVG string.
 * @property {SigilWorking} working - Plain, JSON-serializable derivation trail (D-14).
 */

/**
 * Turn an intention statement plus a planet into a sigil: `{ svg, working }`
 * (D-13). Throws `SigilError` with code `E_MISSING_STATEMENT` when the
 * statement is not a non-empty string, `E_MISSING_PLANET` when the planet is
 * missing/empty/not a string (D-12 — there is no default planet),
 * `E_EMPTY_SEQUENCE` when the statement reduces to zero kept letters, and
 * propagates `SigilError` with code `E_UNKNOWN_PLANET` from the kamea data
 * layer for an unrecognized planet name. These guards run in the library, not
 * the CLI, so a programmatic caller gets identical error guarantees
 * (ARCHITECTURE.md Anti-Pattern 3).
 *
 * @param {string} statement
 * @param {string} planet
 * @param {GenerateOptions} [options]
 * @returns {GenerateResult}
 */
export function generateSigil(statement, planet, options = {}) {
  if (typeof statement !== 'string' || statement.length === 0) {
    throw new SigilError(
      E_MISSING_STATEMENT,
      `generateSigil: statement is required and must be a non-empty string, got: ${JSON.stringify(statement)}`,
    );
  }

  if (typeof planet !== 'string' || planet.length === 0) {
    throw new SigilError(
      E_MISSING_PLANET,
      `generateSigil: planet is required and must be a non-empty string. Valid planets: ${planetNames().join(', ')}`,
    );
  }

  const { kept, struck, keptEntries } = normalize(statement);

  if (kept.length === 0) {
    // Build a per-reason strike-count breakdown (D-26) so the thrown message
    // names not just that everything was struck, but why — e.g. "5 vowels"
    // or "2 vowels, 1 non-letter". Pluralize the reason word only when its
    // count is not 1.
    const counts = struck.reduce((acc, entry) => {
      acc[entry.reason] = (acc[entry.reason] ?? 0) + 1;
      return acc;
    }, /** @type {Record<string, number>} */ ({}));
    const breakdown = Object.entries(counts)
      .map(([reason, count]) => `${count} ${reason}${count === 1 ? '' : 's'}`)
      .join(', ');

    throw new SigilError(
      E_EMPTY_SEQUENCE,
      `Statement reduced to zero kept letters: all ${struck.length} characters struck (${breakdown}).`,
      { struck },
    );
  }

  // gridSize throws SigilError(E_UNKNOWN_PLANET) first for an unrecognized
  // planet, before any further work is done.
  const order = gridSize(planet);

  // Resolve to canonical lowercase once, then use that value everywhere
  // downstream — cellForNumber/gridSize are case-insensitive per planet, but
  // the PathModel's `planet` field feeds the SVG's `sigil--<planet>` class
  // (D-08), which must not vary with the caller's casing (D-12).
  const canonicalPlanet = planet.toLowerCase();
  const numbers = kept.map((letter) => toPythagoreanDigit(letter));
  const cells = numbers.map((n) => cellForNumber(canonicalPlanet, n));
  const path = buildPath(numbers, cells, canonicalPlanet, order);
  const svg = renderSvg(path, { ...options, statement });

  const working = toWorking({
    statement,
    planet: canonicalPlanet,
    kameaSet: DEFAULT_KAMEA_SET,
    gridSize: order,
    kept,
    struck,
    keptEntries,
    numbers,
    path,
  });

  return { svg, working };
}
