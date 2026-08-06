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
 * Case-sensitive transliteration table (D-23) for Latin letters that NFD
 * cannot resolve to a single base Latin letter via combining-mark stripping.
 * It covers two named classes:
 *
 * 1. Ligatures and letters with no accent to strip — the original D-23
 *    lineage entries: `ß`, `æ`, `œ`, `ø`, `þ`, `ð` and their capitals.
 * 2. The Latin stroke/bar class — any Latin letter whose Unicode name
 *    identifies a single A-Z base letter plus a stroke or bar overlay (e.g.
 *    `Ł`, `Đ`, `Ħ`, `Ŧ`). Ratified as a D-23 amendment at the Task 2
 *    `checkpoint:decision` of plan 02-04 (72 additions, 84 entries total,
 *    case-complete, every value A-Z-only) — see that plan's "Gap 2
 *    direction" section for the class definition and derivation.
 *
 * Deliberately excluded, and struck as `non-letter` rather than folded:
 * digraphs beyond the original six (`Ĳ`, `Ǆ`, `Ǉ`, `Ǌ`, `Ǳ`, `ȸ`),
 * reversed/turned/rotated letters (`Ǝ`, `Ə`, `ǝ`, `ƍ`, `Ʌ`), and
 * hooked/tailed phonetic letters (`Ɓ`, `Ƈ`, `Ɗ`, `Ƒ`, `Ɠ`, `Ƙ`, `Ƥ`, `Ƭ`,
 * `Ƴ`, …). None of these has an unambiguous single base letter, so folding
 * them would be invention rather than transliteration.
 */
/** @type {Record<string, string>} */
export const TRANSLITERATION_MAP = {
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
  // A
  'Ⱥ': 'A',
  'ⱥ': 'A',
  // B
  'ƀ': 'B',
  'Ƃ': 'B',
  'ƃ': 'B',
  'Ƀ': 'B',
  // C
  'Ȼ': 'C',
  'ȼ': 'C',
  'Ꞓ': 'C',
  'ꞓ': 'C',
  // D
  'Đ': 'D',
  'đ': 'D',
  'Ƌ': 'D',
  'ƌ': 'D',
  // E
  'Ɇ': 'E',
  'ɇ': 'E',
  // F
  'Ꞙ': 'F',
  'ꞙ': 'F',
  // G
  'Ǥ': 'G',
  'ǥ': 'G',
  'Ꞡ': 'G',
  'ꞡ': 'G',
  // H
  'Ħ': 'H',
  'ħ': 'H',
  // I
  'Ɨ': 'I',
  'ɨ': 'I',
  // J
  'Ɉ': 'J',
  'ɉ': 'J',
  // K
  'Ꝁ': 'K',
  'ꝁ': 'K',
  'Ꝃ': 'K',
  'ꝃ': 'K',
  'Ꝅ': 'K',
  'ꝅ': 'K',
  'Ꞣ': 'K',
  'ꞣ': 'K',
  // L
  'Ł': 'L',
  'ł': 'L',
  'ƚ': 'L',
  'Ƚ': 'L',
  'Ⱡ': 'L',
  'ⱡ': 'L',
  'Ꝉ': 'L',
  'ꝉ': 'L',
  // N
  'Ꞥ': 'N',
  'ꞥ': 'N',
  // P
  'ᵽ': 'P',
  'Ᵽ': 'P',
  // Q
  'Ꝙ': 'Q',
  'ꝙ': 'Q',
  // R
  'Ɍ': 'R',
  'ɍ': 'R',
  'Ꞧ': 'R',
  'ꞧ': 'R',
  // S
  'Ꞩ': 'S',
  'ꞩ': 'S',
  'Ꟍ': 'S',
  'ꟍ': 'S',
  // T
  'Ŧ': 'T',
  'ŧ': 'T',
  'Ⱦ': 'T',
  'ⱦ': 'T',
  // U
  'Ʉ': 'U',
  'ʉ': 'U',
  'Ꞹ': 'U',
  'ꞹ': 'U',
  // V
  'Ꝟ': 'V',
  'ꝟ': 'V',
  // Y
  'Ɏ': 'Y',
  'ɏ': 'Y',
  // Z
  'Ƶ': 'Z',
  'ƶ': 'Z',
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
