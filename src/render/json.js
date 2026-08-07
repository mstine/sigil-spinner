/**
 * JSON "working" serializer (OUT-01, D-14) — a thin serializer over what the
 * orchestrator (`generate.js`) already retained from the pipeline. This
 * module computes nothing itself (ARCHITECTURE.md Component
 * Responsibilities): every field below is a direct read or a straight
 * re-pairing of values `generate.js` already has. In particular, cell x/y
 * values are read straight off the PathModel's points — the same rounded
 * numbers `render/svg.js` consumed to draw the path — so the JSON working
 * and the SVG can never disagree about geometry (OUT-01 precision edge).
 *
 * `working.statement` is untrusted user input. This library returns data,
 * not markup, and does not escape it — any consumer that displays
 * `working.statement` (e.g. a teaching page narrating the derivation) MUST
 * HTML-escape it before rendering it into HTML.
 */

/**
 * @typedef {Object} LetterNumberPair
 * @property {string} letter - A kept letter.
 * @property {number} number - That letter's Pythagorean digit (1-9).
 */

/**
 * @typedef {Object} WorkingCell
 * @property {number} row - Zero-indexed row on the planet's kamea.
 * @property {number} col - Zero-indexed column on the planet's kamea.
 * @property {number} x - viewBox x-coordinate of the cell's center — the
 *   same rounded value the SVG path was drawn from.
 * @property {number} y - viewBox y-coordinate of the cell's center — the
 *   same rounded value the SVG path was drawn from.
 */

/**
 * @typedef {Object} SigilWorking
 * @property {string} statement - The original, untrusted intention statement.
 * @property {string} planet - Canonical lowercase planet name.
 * @property {string} kameaSet - The kamea set name that produced this sigil (D-02).
 * @property {number} gridSize - The planet's kamea order (3-9).
 * @property {string[]} lettersKept - Kept letters, in statement order.
 * @property {import('../text/normalize.js').StruckEntry[]} lettersStruck - Every struck character, with its reason.
 * @property {LetterNumberPair[]} letterNumbers - Each kept letter paired with its Pythagorean digit, same order as lettersKept.
 * @property {number[]} numbers - The Pythagorean digit sequence, one per kept letter.
 * @property {WorkingCell[]} cells - One entry per traced number: row/col AND the viewBox x/y the SVG path was drawn from.
 * @property {import('../path/buildPath.js').PathSegment[]} segments - Line segments between consecutive cells.
 * @property {number} start - Index into `cells` of the cell the sigil-start marker was drawn on.
 * @property {number} end - Index into `cells` of the cell the sigil-end marker was drawn on.
 * @property {import('../text/normalize.js').KeptEntry[] | undefined} keptTrail - Kept letters with full fold/origin provenance (D-25); `undefined` when the pipeline result did not supply `keptEntries`.
 * @property {import('../path/buildPath.js').RepeatEvent[]} repeats - Consecutive-repeat events from the traced number sequence (PATH-02, D-18, D-20).
 * @property {{ curve: boolean, glyph: boolean, idPrefix: string | null, title: boolean }} render - Resolved option values (D-48), appended last, sufficient to reproduce the exact SVG from the working alone. Key order is `curve`, `glyph`, `idPrefix`, `title` per D-48; `idPrefix` serializes as JSON `null` (never dropped) when the caller omitted it, so the block's key set is invariant across every option combination.
 */

/**
 * @typedef {Object} GeneratePipelineResult
 *   Everything `generate.js` retained from the pipeline — the sole input this
 *   serializer needs.
 * @property {string} statement
 * @property {string} planet
 * @property {string} kameaSet
 * @property {number} gridSize
 * @property {string[]} kept
 * @property {import('../text/normalize.js').StruckEntry[]} struck
 * @property {import('../text/normalize.js').KeptEntry[]} [keptEntries] - Absent in callers built before D-25's keptTrail extension; `keptTrail` is then `undefined`.
 * @property {number[]} numbers
 * @property {import('../path/buildPath.js').PathModel} path
 * @property {{ curve: boolean, glyph: boolean, idPrefix: string | null, title: boolean }} render - Resolved option values (D-48), passed through unchanged into `SigilWorking.render`.
 */

/**
 * Serialize a pipeline result into the JSON working (D-14). Computes
 * nothing — every field is a direct read or a straight re-pairing of values
 * `generate.js` already has. Fields are emitted in a fixed key order so
 * `JSON.stringify` output is byte-stable across runs for identical input.
 *
 * @param {GeneratePipelineResult} result
 * @returns {SigilWorking}
 */
export function toWorking(result) {
  const { statement, planet, kameaSet, gridSize, kept, struck, keptEntries, numbers, path, render } = result;

  /** @type {LetterNumberPair[]} */
  const letterNumbers = kept.map((letter, index) => ({ letter, number: numbers[index] }));

  /** @type {WorkingCell[]} */
  const cells = path.points.map((point) => ({
    row: point.row,
    col: point.col,
    x: point.x,
    y: point.y,
  }));

  return {
    statement,
    planet,
    kameaSet,
    gridSize,
    lettersKept: kept,
    lettersStruck: struck,
    letterNumbers,
    numbers,
    cells,
    segments: path.segments,
    start: path.start,
    end: path.end,
    keptTrail: keptEntries,
    repeats: path.repeats,
    render,
  };
}
