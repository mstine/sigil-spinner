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
import { cellForNumber, gridSize, planetNames, DEFAULT_KAMEA_SET, kameaGrid } from './data/kamea.js';
import { buildPath } from './path/buildPath.js';
import { renderSvg } from './render/svg.js';
import { toWorking } from './render/json.js';
import {
  SigilError,
  E_EMPTY_SEQUENCE,
  E_MISSING_STATEMENT,
  E_MISSING_PLANET,
  E_INVALID_OPTION,
} from './errors.js';

/**
 * @typedef {Object} GenerateOptions
 * @property {boolean} [title] - When true, embed the (XML-escaped) statement
 *   in the SVG's `<title>` element (D-16). Defaults to false — the intention
 *   statement is omitted from the SVG by default.
 * @property {boolean} [glyph] - When true, render the opt-in planetary glyph
 *   layer (REND-04, D-36 through D-39). Defaults to false.
 */

/**
 * Known render options and the type each must satisfy when present (D-47).
 * A single declarative table, iterated once by `resolveOptions`, so a later
 * option (`curve`: boolean in 03-03, `idPrefix`: string in 03-04) is a
 * one-line addition here rather than a new branch.
 *
 * @type {Record<string, 'boolean' | 'string'>}
 */
const KNOWN_OPTIONS = {
  glyph: 'boolean',
  title: 'boolean',
};

/**
 * Resolve and validate the caller-supplied options object into a fresh,
 * frozen object of defaulted values (D-47, ARCHITECTURE.md Anti-Pattern 3 —
 * option validation lives in the library, never the CLI). Rules, all
 * load-bearing:
 *
 *  - A known option whose value is `undefined` is treated as ABSENT, not
 *    wrong-typed. This matters concretely: `node:util.parseArgs` yields
 *    `undefined` for an unsupplied string flag (e.g. a future `--id-prefix`),
 *    and the CLI passes its options object unconditionally, so without this
 *    rule a default CLI invocation would throw.
 *  - A known option present with a non-`undefined` value of the wrong type
 *    throws `SigilError(E_INVALID_OPTION, ...)` naming the option in the
 *    message, with `.details.option`, `.details.value` (round-tripping
 *    exactly what the caller passed), and `.details.expected` attached — the
 *    same "humans read the message, programs introspect the data" posture
 *    as the existing `E_EMPTY_SEQUENCE` throw (D-26).
 *  - An unknown key is ignored entirely — no throw, no warning (D-47
 *    forward compatibility: a caller passing a future option against this
 *    version gets defaults, not an error).
 *  - Every absent known option defaults to `false`.
 *
 * Builds and returns a fresh, frozen object on every call and never writes
 * to its argument — `generateSigil` holds no module-level mutable state
 * (INT-02 concurrency edge), and this function must not become the
 * exception (ARCHITECTURE.md Anti-Pattern 4: no mutable options object
 * threaded through the pipeline).
 *
 * @param {Record<string, unknown>} options
 * @returns {Readonly<Record<string, boolean>>}
 */
function resolveOptions(options) {
  /** @type {Record<string, boolean>} */
  const resolved = {};
  for (const [name, expected] of Object.entries(KNOWN_OPTIONS)) {
    const value = options[name];
    if (value === undefined) {
      resolved[name] = false;
      continue;
    }
    if (typeof value !== expected) {
      throw new SigilError(
        E_INVALID_OPTION,
        `generateSigil: option "${name}" must be a ${expected}, got: ${JSON.stringify(value)}`,
        { option: name, value, expected },
      );
    }
    // Every currently-known option is boolean-typed; the `typeof value !==
    // expected` guard above has already confirmed that at runtime, but
    // `expected` is a runtime string, not a literal type, so TS cannot
    // narrow `value` from `unknown` through it — an explicit cast documents
    // what the runtime check already proved.
    resolved[name] = /** @type {boolean} */ (value);
  }
  return Object.freeze(resolved);
}

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
 * `E_INVALID_OPTION` when a known option in `options` is supplied with the
 * wrong type (D-47 — unknown option keys are ignored, not validated),
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

  const resolvedOptions = resolveOptions(options);

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

    // characterCount and strikeCount name two different things and can
    // differ: a single original character can fold to more than one letter
    // (D-25, e.g. Æ -> AE), and each derived letter is classified — and
    // potentially struck — independently. characterCount is the number of
    // distinct ORIGINAL statement positions among the struck entries (built
    // from each entry's `index`, which D-25 guarantees is the original
    // character's index even when it produced several struck entries).
    // strikeCount is simply how many entries were struck. breakdown always
    // sums to strikeCount, never to characterCount, so when the two counts
    // differ the message must say so explicitly rather than mislabeling the
    // strike count as a character count.
    const characterCount = new Set(struck.map((entry) => entry.index)).size;
    const strikeCount = struck.length;
    const strikeScope = strikeCount === characterCount ? '' : `, producing ${strikeCount} strikes`;

    throw new SigilError(
      E_EMPTY_SEQUENCE,
      `Statement reduced to zero kept letters: all ${characterCount} character${characterCount === 1 ? '' : 's'} struck${strikeScope} (${breakdown}).`,
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
  // The grid layer's magic-square matrix (03-02, D-32/D-35) — read from the
  // data layer here, the only cross-layer importer, and never by
  // `src/render/` importing `src/data/kamea.js` directly.
  const kamea = kameaGrid(canonicalPlanet);
  // Internally-supplied render data (`statement`, `kamea`) is spread LAST so
  // it always wins over any caller-supplied key of the same name in the
  // resolved options object — a caller cannot smuggle a `statement` override
  // through the options surface, and cannot substitute a different kamea
  // than the one the sigil was actually traced on (T-03-06). A future
  // reorder of this spread is visibly a security-relevant change.
  const svg = renderSvg(path, { ...resolvedOptions, statement, kamea });

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
    render: { glyph: resolvedOptions.glyph, title: resolvedOptions.title },
  });

  return { svg, working };
}
