/**
 * Text normalization (CONS-01) — strike vowels and repeating letters, keep
 * first occurrence, preserve order.
 *
 * This module has zero knowledge of numbers or kamea geometry (ARCHITECTURE.md
 * internal boundary) — it never imports from `src/data/kamea.js`.
 *
 * Y is treated as a consonant in this phase. Y's dual phonetic nature
 * (vowel-in-some-words, consonant-in-others) is CONS-04's documented rule,
 * explicitly Phase 2 scope — no contextual or phonetic detection happens here.
 *
 * Every character removed from the statement is retained in `struck` with a
 * reason tag (`vowel`, `repeat`, or `non-letter`) — the transparency
 * prohibition this plan carries: nothing is silently discarded.
 */

const VOWELS = /[AEIOU]/;
const NON_LETTER = /[^A-Z]/;

/**
 * @typedef {'vowel' | 'repeat' | 'non-letter'} StruckReason
 */

/**
 * @typedef {Object} StruckEntry
 * @property {string} char - The character as it appeared in the uppercased statement.
 * @property {number} index - Zero-based index of the character in the original statement.
 * @property {StruckReason} reason - Why the character was struck.
 */

/**
 * @typedef {Object} NormalizeResult
 * @property {string[]} kept - Kept letters, in the order they occur in the statement.
 * @property {StruckEntry[]} struck - Every removed character, in original order, with a reason.
 */

/**
 * Strike vowels, repeated letters (keeping the first occurrence), and any
 * non A-Z character. Never throws — a statement that reduces to zero kept
 * letters is the caller's concern (E_EMPTY_SEQUENCE lives in `generate.js`),
 * not this function's.
 *
 * @param {string} statement
 * @returns {NormalizeResult}
 */
export function normalize(statement) {
  const upper = String(statement).toUpperCase();
  /** @type {string[]} */
  const kept = [];
  /** @type {StruckEntry[]} */
  const struck = [];
  const seen = new Set();

  for (let index = 0; index < upper.length; index += 1) {
    const char = upper[index];

    if (NON_LETTER.test(char)) {
      struck.push({ char, index, reason: 'non-letter' });
      continue;
    }

    if (VOWELS.test(char)) {
      struck.push({ char, index, reason: 'vowel' });
      continue;
    }

    if (seen.has(char)) {
      struck.push({ char, index, reason: 'repeat' });
      continue;
    }

    seen.add(char);
    kept.push(char);
  }

  return { kept, struck };
}
