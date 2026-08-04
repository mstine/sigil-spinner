---
phase: 01-first-sigil-end-to-end
reviewed: 2026-08-04T17:30:00Z
depth: standard
files_reviewed: 22
files_reviewed_list:
  - src/data/kamea.js
  - src/data/pythagorean.js
  - src/errors.js
  - src/generate.js
  - src/index.js
  - src/path/buildPath.js
  - src/render/coords.js
  - src/render/escapeXml.js
  - src/render/json.js
  - src/render/svg.js
  - src/text/normalize.js
  - bin/sigil-spinner.js
  - test/cli/cli.test.js
  - test/data/kamea.test.js
  - test/data/pythagorean.test.js
  - test/determinism.test.js
  - test/e2e/saturn-tracer.test.js
  - test/path/buildPath.test.js
  - test/render/coords.test.js
  - test/render/json.test.js
  - test/render/svg.test.js
  - test/text/normalize.test.js
findings:
  critical: 0
  warning: 4
  info: 3
  total: 7
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-08-04T17:30:00Z
**Depth:** standard
**Files Reviewed:** 22
**Status:** issues_found

## Summary

The determinism, escaping, and boundary-isolation contracts that this phase cares most about hold up: the kamea data is genuinely isolated to `src/data/kamea.js`, coordinates are rounded exactly once and shared between the SVG and JSON artifacts, planet names are validated against a fixed whitelist before ever reaching the SVG `class` attribute (no injection surface), the intention statement is only ever written into the SVG through `escapeXml`, and the full 112-test suite passes. This is solid, carefully-documented work.

The issues found are all in the CLI's error-handling seam and in the public API's error-code contract — not in the core generation pipeline. The most concrete one: `parseArgs()` and the stdin read in `bin/sigil-spinner.js` sit outside the `try`/`catch` block, so a malformed CLI invocation (unknown flag, `--planet` with no value) crashes with a raw Node stack trace instead of the tool's own documented `E_UNKNOWN: <message>` stderr format — verified live against a running build. None of these are data-loss or security-severity; they're robustness and API-contract gaps worth fixing before this ships as the CLI's public error-handling story.

## Warnings

### WR-01: `parseArgs()` and the stdin read run outside the CLI's try/catch, crashing with a raw stack trace instead of the documented diagnostics format

**File:** `bin/sigil-spinner.js:49-66`
**Issue:** The whole file's design intent (per its header comment and the `EXIT_CODES` table) is that every failure surfaces as a clean one-line `stderr` message via the `catch` block at line 68. But `parseArgs({...})` (line 49) and `readFileSync(0, 'utf-8')` (line 66) both execute *before* the `try` block starts. Verified live:

```
$ node bin/sigil-spinner.js "test" --unknownflag
node:internal/util/parse_args/parse_args:107
      throw new ERR_PARSE_ARGS_UNKNOWN_OPTION(...)
TypeError [ERR_PARSE_ARGS_UNKNOWN_OPTION]: Unknown option '--unknownflag'.
...
Node.js v24.4.1
```
and similarly for `--planet` with no value (`ERR_PARSE_ARGS_INVALID_OPTION_VALUE`). Both dump an internal Node stack trace to stderr and exit 1 — the exit code happens to coincide with `DEFAULT_ERROR_EXIT_CODE`, but only by accident, not because the code path was designed to produce it. This directly undercuts the file's own stated diagnostics contract ("every error/warning/usage message goes to `process.stderr`" in the tool's own clean format) for the single most common CLI mistake (a typo'd flag).
**Fix:** Move the `parseArgs` call and the stdin read inside the `try` block (or wrap them in their own try/catch that funnels into the same clean stderr format):
```js
try {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: { /* ... */ } });
  const planetArg = values.planet;
  const rawStatement = positionals[0];
  const statement = rawStatement === '-' ? readFileSync(0, 'utf-8') : rawStatement;

  const { svg, working } = generateSigil(statement, planetArg);
  // ...
} catch (err) {
  // existing SigilError / Error / unknown branches
}
```

### WR-02: Public API doesn't export the `E_*` error-code constants, so the CLI's `EXIT_CODES` map is a hand-duplicated string contract with no compile-time link to the source of truth

**File:** `src/index.js:7-8`, `bin/sigil-spinner.js:39-44`
**Issue:** `src/errors.js` exports `E_EMPTY_SEQUENCE`, `E_UNKNOWN_PLANET`, `E_MISSING_STATEMENT`, and `E_MISSING_PLANET` as named constants specifically so code can reference the stable contract without retyping strings. But the public entry point (`src/index.js`) only re-exports `generateSigil` and `SigilError` — not the codes. Per the project's own architecture rule ("`bin/sigil-spinner.js` imports only from [`src/index.js`], never from an internal module"), the CLI can't import the constants either, so `EXIT_CODES` in `bin/sigil-spinner.js` is forced to hardcode the four code strings as raw object keys (`'E_MISSING_STATEMENT': 2`, etc.) instead of `[E_MISSING_STATEMENT]: 2`. If a future change renames or retypos a code in `errors.js`, nothing catches the drift at build time — `EXIT_CODES[err.code]` would silently miss and fall through to `DEFAULT_ERROR_EXIT_CODE`, and the existing CLI tests (which independently hardcode the same string literals) wouldn't catch it either, since they'd drift in lockstep with the same typo.
**Fix:** Re-export the error codes from `src/index.js` and use them by reference in the CLI:
```js
// src/index.js
export { generateSigil } from './generate.js';
export { SigilError, E_EMPTY_SEQUENCE, E_UNKNOWN_PLANET, E_MISSING_STATEMENT, E_MISSING_PLANET } from './errors.js';

// bin/sigil-spinner.js
import { generateSigil, SigilError, E_MISSING_STATEMENT, E_MISSING_PLANET, E_UNKNOWN_PLANET, E_EMPTY_SEQUENCE } from '../src/index.js';
const EXIT_CODES = {
  [E_MISSING_STATEMENT]: 2,
  [E_MISSING_PLANET]: 2,
  [E_UNKNOWN_PLANET]: 2,
  [E_EMPTY_SEQUENCE]: 3,
};
```

### WR-03: `generateSigil` validates the planet's *existence* after the statement's *content*, so an invalid planet is masked by an unrelated `E_EMPTY_SEQUENCE` when both are wrong

**File:** `src/generate.js:68-79`
**Issue:** The validation order is: (1) statement non-empty, (2) planet non-empty, (3) `normalize(statement)` + `E_EMPTY_SEQUENCE` check, (4) `gridSize(planet)` — which is where an *unrecognized* planet name (e.g. `"pluto"`) actually gets caught. So a call like `generateSigil('AEIOU', 'pluto')` throws `E_EMPTY_SEQUENCE` and never reveals that the planet name is also invalid — the caller fixes their statement, reruns, and only then discovers the real planet problem. Structural/identity validation (does this planet exist at all) is cheaper and more fundamental than content derivation (did the statement reduce to zero letters), and should run first.
**Fix:** Move the `gridSize(planet)` call (or an equivalent existence check via `resolvePlanetKey`) above the `normalize`/`E_EMPTY_SEQUENCE` check:
```js
// Validate planet identity before spending effort on statement content.
const order = gridSize(planet);
const { kept, struck } = normalize(statement);
if (kept.length === 0) {
  throw new SigilError(E_EMPTY_SEQUENCE, ...);
}
```

### WR-04: `gridSize`/`kameaGrid` will throw a raw `TypeError` instead of a `SigilError` if a future kamea set doesn't cover all seven planets

**File:** `src/data/kamea.js:209-226`
**Issue:** `resolvePlanetKey` validates the planet name against the fixed `PLANET_ORDER` list, and `resolveSet` validates the set name against `KAMEA_SETS`, but neither validates that the *resolved set* actually contains an entry for the *resolved planet*. `gridSize`/`kameaGrid` then do `set[key].length` / return `set[key]` directly. Today this is unreachable because the only registered set (`agrippa`) covers all seven planets — but the module's own docs (D-02) explicitly design this registry to support future partial/incomplete sets (e.g. a Skinner-sourced set added incrementally). The moment such a set ships without, say, a `moon` entry, `gridSize('moon', { set: 'skinner' })` throws `TypeError: Cannot read properties of undefined (reading 'length')` instead of the library's documented `SigilError` contract — breaking the "all library-thrown errors carry a stable `.code`" guarantee for a scenario the architecture explicitly anticipates.
**Fix:**
```js
function resolveGrid(set, key) {
  const grid = set[key];
  if (!grid) {
    throw new SigilError(E_UNKNOWN_PLANET, `resolveGrid: kamea set has no grid for planet "${key}"`);
  }
  return grid;
}
```
and route `gridSize`/`kameaGrid`/`cellForNumber` through it instead of indexing `set[key]` directly.

## Info

### IN-01: No LICENSE file despite `package.json` declaring `"license": "ISC"`

**File:** `package.json:36`
**Issue:** `package.json` declares an ISC license, but no `LICENSE`/`LICENSE.md` file exists at the repo root. Tooling (npm audit reports, license scanners, some registries) treat the absence of an actual license file as a gap even when `package.json` names one.
**Fix:** Add a `LICENSE` file with the ISC license text, or update `package.json` if a different license is intended.

### IN-02: No direct unit test exercises `generateSigil`'s own `E_MISSING_STATEMENT`/`E_MISSING_PLANET` validation

**File:** `test/e2e/saturn-tracer.test.js`
**Issue:** `E_MISSING_STATEMENT` and `E_MISSING_PLANET` are only exercised indirectly through `test/cli/cli.test.js`, which asserts on CLI exit status/stdout, not on `generateSigil` throwing the specific `SigilError` code directly (the way `E_EMPTY_SEQUENCE` and `E_UNKNOWN_PLANET` already are tested at the library level). A programmatic consumer calling `generateSigil(undefined, 'saturn')` or `generateSigil('text', '')` directly has no library-level regression test guarding that path.
**Fix:** Add cases to `test/e2e/saturn-tracer.test.js` mirroring the existing `E_EMPTY_SEQUENCE` test, e.g.:
```js
it('throws SigilError with code E_MISSING_STATEMENT for a missing statement', () => {
  expect(() => generateSigil(undefined, 'saturn')).toThrow(SigilError);
});
it('throws SigilError with code E_MISSING_PLANET for an empty planet', () => {
  expect(() => generateSigil('text', '')).toThrow(SigilError);
});
```

### IN-03: `E_MISSING_PLANET`'s error message doesn't echo the invalid value received, unlike `E_MISSING_STATEMENT`'s

**File:** `src/generate.js:61-66`
**Issue:** `E_MISSING_STATEMENT`'s message includes `JSON.stringify(statement)` so a caller can see exactly what bad value was passed. `E_MISSING_PLANET`'s message only lists the valid planet names, omitting what was actually received — a minor inconsistency that makes debugging a bad programmatic call slightly harder.
**Fix:**
```js
throw new SigilError(
  E_MISSING_PLANET,
  `generateSigil: planet is required and must be a non-empty string, got: ${JSON.stringify(planet)}. Valid planets: ${planetNames().join(', ')}`,
);
```

---

_Reviewed: 2026-08-04T17:30:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
