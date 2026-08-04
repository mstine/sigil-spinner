/**
 * SigilError taxonomy (D-15).
 *
 * All library-thrown errors carry a stable `.code` from the constants below,
 * plus a human-readable message. Consumers — including `bin/sigil-spinner.js`
 * — MUST branch on `.code`, never on `.message` text, since the message is
 * free-form and can change without notice while the code is a published
 * contract.
 */

/** The kept-letter sequence reduced to zero letters after normalization. */
export const E_EMPTY_SEQUENCE = 'E_EMPTY_SEQUENCE';

/** An unknown planet name (or unknown kamea set name) was requested. */
export const E_UNKNOWN_PLANET = 'E_UNKNOWN_PLANET';

/** The statement argument was missing, empty, or not a string. */
export const E_MISSING_STATEMENT = 'E_MISSING_STATEMENT';

/** The planet argument was missing, empty, or not a string (D-12 — no default planet). */
export const E_MISSING_PLANET = 'E_MISSING_PLANET';

export class SigilError extends Error {
  /**
   * @param {string} code - One of the exported `E_*` code constants.
   * @param {string} message - Human-readable message; never branch on this.
   */
  constructor(code, message) {
    super(message);
    this.name = 'SigilError';
    /** @type {string} */
    this.code = code;
  }
}
