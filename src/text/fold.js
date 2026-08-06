/**
 * Per-character accent/ligature folding (CONS-04) — reduces any Unicode
 * letter to its base Latin A-Z equivalent(s), one fold per ORIGINAL
 * character, with full origin provenance retained.
 *
 * This module has zero knowledge of numbers or kamea geometry
 * (ARCHITECTURE.md internal boundary) — it never imports from
 * `src/data/kamea.js` or `src/path/buildPath.js`.
 *
 * Folding never throws — every string input, including empty strings, lone
 * surrogates, and unbounded stacked combining marks, produces a `FoldRecord`
 * array with no exception (CONS-04).
 */

/**
 * Case-sensitive transliteration table (D-23) for letters that NFD-normalize-
 * and-strip cannot resolve to a single base Latin letter — ligatures and
 * letters with no accent to strip (ß, æ, œ, ø, þ, ð and their capitals).
 */
/** @type {Record<string, string>} */
const TRANSLITERATION_MAP = {
  'ß': 'SS',
  'ẞ': 'SS',
  'æ': 'AE',
  'Æ': 'AE',
  'œ': 'OE',
  'Œ': 'OE',
  'ø': 'O',
  'Ø': 'O',
  'þ': 'TH',
  'Þ': 'TH',
  'ð': 'D',
  'Ð': 'D',
};

/** Unicode Combining Diacritical Marks block (U+0300-U+036F). */
const COMBINING_MARKS = /[̀-ͯ]/g;

/**
 * @typedef {Object} FoldRecord
 * @property {string} original - The character as it appeared in the original statement.
 * @property {number} originalIndex - Zero-based code-point index of `original` in the original statement.
 * @property {string} folded - `original`'s fold output — zero, one, or more base Latin characters.
 */

/**
 * Fold a statement into one `FoldRecord` per original character (D-22, D-25).
 * Iterates code points (`[...statement]`), never the whole string at once —
 * whole-string NFD normalization destroys the per-character `originalIndex`
 * provenance the moment any fold changes the string's length (Pitfall 1).
 * Consults `TRANSLITERATION_MAP` first for characters NFD cannot resolve
 * (D-23), otherwise NFD-normalizes the single character and strips its
 * combining marks (D-22). Never relies on native `toUpperCase` to fold ß
 * (Pitfall 3).
 *
 * @param {string} statement
 * @returns {FoldRecord[]}
 */
export function foldStatement(statement) {
  const chars = [...statement];
  return chars.map((original, originalIndex) => {
    if (original in TRANSLITERATION_MAP) {
      return { original, originalIndex, folded: TRANSLITERATION_MAP[original] };
    }
    const folded = original.normalize('NFD').replace(COMBINING_MARKS, '');
    return { original, originalIndex, folded };
  });
}
