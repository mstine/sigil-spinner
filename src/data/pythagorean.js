/**
 * Pythagorean Number Table — cycling letter-to-digit encoder.
 *
 * The digit for a letter is derived from its position in the alphabet,
 * cycling every 9 letters: A=1, B=2, ... I=9, J=1, K=2, ... R=9, S=1, ... Z=8.
 *
 * This table is DERIVED, never transcribed. Deriving it from
 * `((charCode - 'A'.charCode) % 9) + 1` makes it structurally incapable of
 * reproducing:
 *   - the Chaldean system (non-alphabetical letter groupings, 9 unassigned), or
 *   - legacy tables that collapse I/J or U/V into a shared value.
 *
 * See test/data/pythagorean.test.js for the Chaldean-rejection test vectors
 * (A=1, I=9, J=1, R=9, S=1, Z=8) that would fail against either contamination.
 */

const CHAR_CODE_A = 'A'.charCodeAt(0);
const CHAR_CODE_Z = 'Z'.charCodeAt(0);

/**
 * Map a single A-Z letter to its Pythagorean digit (1-9).
 *
 * @param {string} letter - A single character, case-insensitive.
 * @returns {number} An integer in the range 1..9 inclusive.
 * @throws {RangeError} If `letter` does not uppercase to a single A-Z character.
 */
export function toPythagoreanDigit(letter) {
  if (typeof letter !== 'string' || letter.length !== 1) {
    throw new RangeError(`toPythagoreanDigit: expected a single character, got: ${JSON.stringify(letter)}`);
  }

  const code = letter.toUpperCase().charCodeAt(0);

  if (code < CHAR_CODE_A || code > CHAR_CODE_Z) {
    throw new RangeError(`toPythagoreanDigit: not an A-Z letter: ${JSON.stringify(letter)}`);
  }

  return ((code - CHAR_CODE_A) % 9) + 1;
}
