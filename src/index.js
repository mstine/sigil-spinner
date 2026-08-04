/**
 * Public library entry point. This is the entire public surface of the
 * package — `bin/sigil-spinner.js` imports only from here, never from an
 * internal module (ARCHITECTURE.md "Thin CLI Over Stable Library API").
 */

export { generateSigil } from './generate.js';
export { SigilError } from './errors.js';
