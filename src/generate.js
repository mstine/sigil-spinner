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
import { cellForNumber, gridSize } from './data/kamea.js';
import { buildPath } from './path/buildPath.js';
import { renderSvg } from './render/svg.js';
import { SigilError, E_EMPTY_SEQUENCE } from './errors.js';

/**
 * @typedef {Object} GenerateOptions
 * @property {boolean} [title] - When true, embed the (XML-escaped) statement
 *   in the SVG's `<title>` element (D-16). Defaults to false — the intention
 *   statement is omitted from the SVG by default.
 */

/**
 * @typedef {Object} SigilWorking
 * @property {string} statement - The original, unmodified intention statement.
 * @property {string[]} kept - Kept letters, in statement order.
 * @property {import('./text/normalize.js').StruckEntry[]} struck - Every struck character, with reason.
 * @property {number[]} numbers - The Pythagorean digit sequence, one per kept letter.
 * @property {string} planet - Lowercase, resolved planet name.
 * @property {number} gridSize - The planet's kamea order.
 * @property {import('./path/buildPath.js').PathModel} path - The traced PathModel.
 */

/**
 * @typedef {Object} GenerateResult
 * @property {string} svg - Self-contained inline SVG string.
 * @property {SigilWorking} working - Plain, JSON-serializable derivation trail.
 */

/**
 * Turn an intention statement plus a planet into a sigil: `{ svg, working }`
 * (D-13). Throws `SigilError` with code `E_EMPTY_SEQUENCE` when the statement
 * reduces to zero kept letters, and propagates `SigilError` with code
 * `E_UNKNOWN_PLANET` from the kamea data layer for an unrecognized planet.
 *
 * @param {string} statement
 * @param {string} planet
 * @param {GenerateOptions} [options]
 * @returns {GenerateResult}
 */
export function generateSigil(statement, planet, options = {}) {
  const { kept, struck } = normalize(statement);

  if (kept.length === 0) {
    throw new SigilError(
      E_EMPTY_SEQUENCE,
      `Statement reduced to zero kept letters after striking vowels and repeats: ${JSON.stringify(statement)}`,
    );
  }

  // gridSize throws SigilError(E_UNKNOWN_PLANET) first for an unrecognized
  // planet, before any further work is done.
  const order = gridSize(planet);
  const numbers = kept.map((letter) => toPythagoreanDigit(letter));
  const cells = numbers.map((n) => cellForNumber(planet, n));
  const path = buildPath(numbers, cells, planet, order);
  const svg = renderSvg(path, { ...options, statement });

  /** @type {SigilWorking} */
  const working = {
    statement,
    kept,
    struck,
    numbers,
    planet: planet.toLowerCase(),
    gridSize: order,
    path,
  };

  return { svg, working };
}
