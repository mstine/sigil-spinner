/**
 * Public library entry point. This is the entire public surface of the
 * package — `bin/sigil-spinner.js` imports only from here, never from an
 * internal module (ARCHITECTURE.md "Thin CLI Over Stable Library API").
 *
 * The `E_*` error-code constants are part of the public surface (WR-02,
 * D-55) so consumers can branch on a thrown `SigilError`'s `.code` against
 * an imported constant rather than a string literal they typed themselves.
 */

export { generateSigil } from './generate.js';
export { SigilError } from './errors.js';
export {
  E_EMPTY_SEQUENCE,
  E_UNKNOWN_PLANET,
  E_MISSING_STATEMENT,
  E_MISSING_PLANET,
  E_INVALID_OPTION,
} from './errors.js';
