/**
 * Text normalization (CONS-01) — strike vowels and repeating letters, keep
 * first occurrence, preserve order.
 *
 * This module has zero knowledge of numbers or kamea geometry ("Internal
 * Boundaries" in .planning/milestones/v1.0-research/ARCHITECTURE.md) — it
 * never imports from `src/data/kamea.js`.
 *
 * Y is always a consonant (CONS-04, D-21): it is kept unless struck as a
 * repeat, with no contextual or phonetic detection of Y's dual nature
 * (vowel-in-some-words, consonant-in-others). This is the resolved,
 * documented rule — `VOWELS` below deliberately excludes Y, and README.md's
 * "Letter Handling Rules" section states it as a citable public rule.
 *
 * Every character removed from the statement is retained in `struck` with a
 * reason tag (`vowel`, `repeat`, or `non-letter`) — the transparency
 * prohibition this plan carries: nothing is silently discarded.
 *
 * Classification is driven by `foldStatement` (CONS-04): every original
 * character is per-character accent/ligature-folded before classification
 * (D-22), and every struck/kept entry carries the original pre-fold character
 * and its full fold output alongside the original statement index (D-25).
 */

import { foldStatement } from './fold.js';

const VOWELS = /[AEIOU]/;
const NON_LETTER = /[^A-Z]/;

/**
 * @typedef {'vowel' | 'repeat' | 'non-letter'} StruckReason
 */

/**
 * @typedef {Object} StruckEntry
 * @property {string} char - The classified uppercase character (empty string when the original character folded to nothing).
 * @property {number} index - Zero-based index of the ORIGINAL character in the original statement (D-25).
 * @property {StruckReason} reason - Why the character was struck.
 * @property {string} original - The raw, pre-fold character as it appeared in the original statement (D-25).
 * @property {string} folded - The full fold output for `original` — may be more than one character (D-25).
 */

/**
 * @typedef {Object} KeptEntry
 * @property {string} char - The kept, classified uppercase letter.
 * @property {number} index - Zero-based index of the ORIGINAL character in the original statement (D-25).
 * @property {string} original - The raw, pre-fold character as it appeared in the original statement.
 * @property {string} folded - The full fold output for `original`.
 */

/**
 * @typedef {Object} NormalizeResult
 * @property {string[]} kept - Kept letters, in the order they occur in the statement.
 * @property {StruckEntry[]} struck - Every removed character, in original order, with a reason.
 * @property {KeptEntry[]} keptEntries - Same letters as `kept`, carrying full fold/origin provenance (D-25).
 */

/**
 * Strike vowels, repeated letters (keeping the first occurrence), and any
 * non A-Z character. Iterates `foldStatement(statement)`'s per-original-
 * character fold records rather than the raw uppercased string, so accented
 * and ligature letters fold to their base Latin form before classification
 * (D-22) while `struck`/`keptEntries` retain the original character and
 * original statement index (D-25). When one original character folds to
 * more than one letter (ß to SS), each derived letter is classified
 * independently but both share the same `original`/`index` (D-25). Never
 * throws — a statement that reduces to zero kept letters is the caller's
 * concern (E_EMPTY_SEQUENCE lives in `generate.js`), not this function's.
 *
 * @param {string} statement
 * @returns {NormalizeResult}
 */
export function normalize(statement) {
  const records = foldStatement(String(statement));
  /** @type {string[]} */
  const kept = [];
  /** @type {StruckEntry[]} */
  const struck = [];
  /** @type {KeptEntry[]} */
  const keptEntries = [];
  const seen = new Set();

  for (const { original, originalIndex: index, folded } of records) {
    const upperFolded = folded.toUpperCase();

    if (upperFolded.length === 0) {
      // The original character folded to nothing (e.g. a bare combining
      // mark with no base letter) — record it as struck so it is never
      // silently discarded (the transparency prohibition this plan carries).
      struck.push({ char: '', index, reason: 'non-letter', original, folded });
      continue;
    }

    for (const char of upperFolded) {
      if (NON_LETTER.test(char)) {
        struck.push({ char, index, reason: 'non-letter', original, folded });
        continue;
      }

      if (VOWELS.test(char)) {
        struck.push({ char, index, reason: 'vowel', original, folded });
        continue;
      }

      if (seen.has(char)) {
        struck.push({ char, index, reason: 'repeat', original, folded });
        continue;
      }

      seen.add(char);
      kept.push(char);
      keptEntries.push({ char, index, original, folded });
    }
  }

  return { kept, struck, keptEntries };
}
