# Phase 4: v1.0 Tech Debt Closeout - Pattern Map

**Mapped:** 2026-08-07
**Files analyzed:** 8 modified, 0 new
**Analogs found:** 8 / 8 (all in-file — this phase is convention-extension, not new-file, so the "analog" for each file is the surrounding convention in that same file)

## File Classification

| Modified File | Role | Data Flow | Analog (same-file convention) | Match Quality |
|----------------|------|-----------|-------------------------------|----------------|
| `src/generate.js` | service (orchestrator) | request-response (validate → transform → return) | `resolveOptions` itself (lines 117-147) — table-driven type/absent validation | exact (in-file) |
| `bin/sigil-spinner.js` | controller (CLI entry) | request-response (argv → stdout/stderr/exit) | `diagnose()` / `E_CLI_USAGE` pattern (lines 56-89, 105-107) | exact (in-file) |
| `src/index.js` | module (public export surface) | N/A (barrel export) | existing `export { X } from './y.js'` lines 7-8 | exact (in-file) |
| `README.md` | config/docs | N/A | existing field-list prose block (lines 26-29) + Errors table (401-421) | exact (in-file) |
| `test/cli/cli.test.js` | test | request-response | sibling `it(...)` blocks around 389-472 asserting `E_INVALID_OPTION`/`.details` | exact (in-file) |
| `test/determinism.test.js` or new describe in `cli.test.js` | test | CRUD-ish (round-trip: generate → reuse output as input) | `toMatchFileSnapshot` pattern (determinism.test.js) for snapshot assertions; plain `expect(...).not.toThrow()` pattern (cli.test.js) for the new round-trip test | role-match |
| `.planning/phases/02-*/02-0{1,2,3,4}-SUMMARY.md` | config (frontmatter metadata) | batch | `01-01-SUMMARY.md:54`'s correctly-populated `requirements-completed:` key | exact (in-file, cross-file template) |
| `src/data/kamea.js` (deferred item, guard only if bundled) | utility | CRUD (data lookup) | existing `SigilError(E_UNKNOWN_PLANET, ...)` throw pattern used elsewhere in the same file | role-match |

## Pattern Assignments

### `src/generate.js` (WR-01 fix — `resolveOptions`)

**Analog:** the function's own existing absent/type-check block, same file, lines 117-147.

**Current absent-check** (lines 120-125, the exact line to change):
```js
for (const [name, expected] of Object.entries(KNOWN_OPTIONS)) {
  const value = options[name];
  if (value === undefined) {
    resolved[name] = ABSENT_DEFAULT_BY_TYPE[expected];
    continue;
  }
```

**Fix — extend the absent check to a type-keyed sentinel comparison** (per RESEARCH.md's "Recommended fix," scoped narrowly so `{ glyph: null }` still throws — `ABSENT_DEFAULT_BY_TYPE.boolean` is `false`, not `null`):
```js
if (value === undefined || value === ABSENT_DEFAULT_BY_TYPE[expected]) {
  resolved[name] = ABSENT_DEFAULT_BY_TYPE[expected];
  continue;
}
```

**Existing type-keyed table this fix must reuse, not duplicate** (lines 56-78 — do not hand-roll a bespoke idPrefix special case; extend the table-driven pattern already established for D-47/D-48):
```js
const KNOWN_OPTIONS = {
  curve: 'boolean',
  glyph: 'boolean',
  title: 'boolean',
  idPrefix: 'string',
};
const ABSENT_DEFAULT_BY_TYPE = {
  boolean: false,
  string: null,
};
```

**Error-construction idiom to preserve unchanged** (lines 126-139 — the throw shape all `E_INVALID_OPTION` cases share; do not touch this):
```js
if (typeof value !== expected) {
  throw new SigilError(
    E_INVALID_OPTION,
    `generateSigil: option "${name}" must be a ${expected}, got: ${JSON.stringify(value)}`,
    { option: name, value, expected },
  );
}
if (expected === 'string' && /** @type {string} */ (value).length === 0) {
  throw new SigilError(
    E_INVALID_OPTION,
    `generateSigil: option "${name}" must be a non-empty string, got an empty string`,
    { option: name, value, expected },
  );
}
```

---

### `src/generate.js` (Wave 3, optional — WR-03 validation-ordering)

**Analog:** the existing ordering of checks in `generateSigil` itself (lines 177-233): statement check → planet type check → `resolveOptions` → normalize/empty-sequence check → THEN `gridSize(planet)` (which throws `E_UNKNOWN_PLANET`).

**Pattern to copy:** if reordering to check `gridSize(planet)` (or an equivalent planet-validity check) before the empty-sequence check, follow the same "one guard clause per concern, throw immediately, no accumulation" style already used for the statement/planet presence guards (lines 178-190):
```js
if (typeof planet !== 'string' || planet.length === 0) {
  throw new SigilError(
    E_MISSING_PLANET,
    `generateSigil: planet is required and must be a non-empty string. Valid planets: ${planetNames().join(', ')}`,
  );
}
```
Do not introduce a new validation style (e.g. a validation-results array) — this file's convention is exclusively sequential guard-clause throws.

---

### `bin/sigil-spinner.js` (WR-04 fix — extra positionals)

**Analog:** the file's own `E_CLI_USAGE` / `diagnose()` pattern, already used twice in this file (parseArgs throw handler, lines 93-107; stdin read failure, lines 128-132).

**Constants already defined, reuse verbatim — do not redefine:**
```js
const E_CLI_USAGE = 'E_CLI_USAGE';
const CLI_USAGE_EXIT_CODE = 2;

function diagnose(code, message, exitCode) {
  process.stderr.write(`${code}: ${message}\n`);
  process.exit(exitCode);
}
```

**Existing third-use call-site shape to copy (this is literally the third invocation of `diagnose` in the file — match the other two):**
```js
} catch (/** @type {any} */ err) {
  diagnose(E_CLI_USAGE, err instanceof Error ? err.message : String(err), CLI_USAGE_EXIT_CODE);
}
```

**Insertion point and new check** (immediately after line 109, `const { values, positionals } = parsed;`):
```js
const { values, positionals } = parsed;
if (positionals.length > 1) {
  diagnose(
    E_CLI_USAGE,
    `unexpected extra argument(s): ${positionals.slice(1).join(', ')} (only one statement positional is accepted; use - to read from stdin)`,
    CLI_USAGE_EXIT_CODE,
  );
}
```

**Do not touch:** `EXIT_CODES` map (lines 44-50) — that's for `SigilError` codes from the library, not CLI-local diagnostics; `E_CLI_USAGE` already routes through `diagnose()`, not through `EXIT_CODES`.

---

### `src/index.js` (Phase 1 WR-02 — re-export error codes, if bundled)

**Analog:** the file's own two existing export lines (the entire file is 8 lines — this is the whole pattern):
```js
export { generateSigil } from './generate.js';
export { SigilError } from './errors.js';
```

**Fix shape — add a third export line in the same bare re-export style** (no renaming, no wrapping in a namespace object — match the flat-export convention):
```js
export { E_MISSING_STATEMENT, E_MISSING_PLANET, E_UNKNOWN_PLANET, E_EMPTY_SEQUENCE, E_INVALID_OPTION } from './errors.js';
```
Confirm the exact constant names/full list against `src/errors.js` before writing this line — do not guess names from memory.

---

### `README.md` (documentation gap — `keptTrail`, `repeats`, `render`)

**Analog:** the existing field-list prose block, lines 26-29 (current, stale):
```
- `working` — the full JSON derivation trail (see Worked Example below):
  `statement`, `planet`, `kameaSet`, `gridSize`, `lettersKept`,
  `lettersStruck`, `letterNumbers`, `numbers`, `cells`, `segments`, `start`,
  `end`.
```

**Authoritative source of truth to extend from — `src/render/json.js`'s `SigilWorking` typedef (lines 34-50)**, which already documents every field including the three missing from README: `keptTrail` (line 47), `repeats` (line 48), `render` (line 49, with its own inline field breakdown `{ curve, glyph, idPrefix, title }`).

**Recommended target shape:** RESEARCH.md recommends promoting this from inline prose to a field-reference table near the Worked Example section (README.md:268 onward), one row per field (name / type / one-line description), since the count has grown from 11 to 15. If a table is added, match this repo's existing Markdown table convention already used elsewhere in README (e.g. the Errors and Exit Codes table around line 401):
```
| Field | Type | Description |
|-------|------|--------------|
| `statement` | `string` | The original, untrusted intention statement. |
```
Pull the type and description text directly from the JSDoc typedef (lines 34-50) rather than re-authoring prose — the typedef is the single source of truth per RESEARCH.md's ownership table.

---

### `test/cli/cli.test.js` (invert one test, WR-01; add coverage, WR-04)

**Analog — the exact test to invert, lines 461-472:**
```js
it('throws E_INVALID_OPTION for a null idPrefix (wrong type, not absent)', () => {
  /** @type {any} */
  let caught;
  try {
    generateSigil(STATEMENT, 'saturn', /** @type {any} */ ({ idPrefix: null }));
  } catch (/** @type {any} */ err) {
    caught = err;
  }
  expect(caught).toBeInstanceOf(SigilError);
  expect(caught.code).toBe('E_INVALID_OPTION');
  expect(caught.details.option).toBe('idPrefix');
});
```
Per RESEARCH.md, this must be inverted to assert the round-trip now succeeds (`generateSigil(STATEMENT, 'saturn', { idPrefix: null })` must NOT throw, and `resolved.idPrefix` must equal `null`) — record this as a deliberate, named inversion in the plan, not a silent diff. **Do not delete** the sibling test immediately above it (lines 389-400, "treats null as a wrong type... for a boolean option") — that one must keep passing unmodified; it is the regression guard proving the fix is correctly scoped to string-typed options whose absent-default is `null`, not to `null` in general.

**Analog for the new WR-04 CLI-usage test — the existing sibling test for the same diagnostic class, lines 425-431:**
```js
it('exits 2 with an E_CLI_USAGE stderr line for an unrecognized flag — no domain validation migrated into the CLI (INT-04)', () => {
  const { stdout, stderr, status } = runCli([STATEMENT, '--planet', 'saturn', '--nope']);
  expect(status).toBe(2);
  expect(stdout).toBe('');
  expect(stderr.startsWith('E_CLI_USAGE: ')).toBe(true);
  expect(stderr).not.toContain('E_INVALID_OPTION');
});
```
New test should follow this exact shape: `runCli([STATEMENT, 'EXTRA', '--planet', 'saturn'])`, assert `status === 2`, `stdout === ''`, `stderr.startsWith('E_CLI_USAGE: ')`. Use the file's existing `runCli()` helper (lines 1-31) — never spawn the subprocess directly.

**Analog for the round-trip regression test (new coverage, WR-01) — plain `.not.toThrow()` assertion style already used elsewhere in this file** (e.g. line matching `expect(() => ...).not.toThrow()` idiom implied by the "throws"-style tests inverted above — use `expect(() => fn()).not.toThrow()` for the negative assertion, and a direct `.toBe()` equality for the SVG round-trip):
```js
it('round-trips working.render straight back into generateSigil without throwing', () => {
  const first = generateSigil(STATEMENT, 'saturn');
  expect(() => generateSigil(STATEMENT, 'saturn', first.working.render)).not.toThrow();
  const second = generateSigil(STATEMENT, 'saturn', first.working.render);
  expect(second.svg).toBe(first.svg);
});
```
This test can live in `test/cli/cli.test.js` (co-located with the other option-resolution tests) or in `test/determinism.test.js` (co-located with the project's other round-trip/byte-identity assertions) — either is a valid analog location; prefer `cli.test.js` since it's option-resolution behavior, not rendering determinism, per the file's own scope.

---

### `.planning/phases/02-every-planet-every-statement/02-0{1,2,3,4}-SUMMARY.md` (frontmatter backfill)

**Analog:** `01-01-SUMMARY.md:54`, the correctly-populated example RESEARCH.md cites:
```yaml
requirements-completed: [CONS-02, KAMEA-01, KAMEA-03]
```

**Exact values to insert (mechanical, no re-derivation — table already computed in RESEARCH.md):**

| File | `requirements-completed` value |
|------|----------------------------------------|
| `02-01-SUMMARY.md` | `[KAMEA-02, PATH-02, CONS-04]` |
| `02-02-SUMMARY.md` | `[KAMEA-02, CONS-03, CONS-04, INT-03, INT-04]` |
| `02-03-SUMMARY.md` | `[PATH-02, INT-03]` |
| `02-04-SUMMARY.md` | `[CONS-03, CONS-04, INT-03, INT-04]` |

Match the exact frontmatter key name (`requirements-completed`) and bracketed-list YAML style already used in `01-01-SUMMARY.md` — read that file's frontmatter block directly before editing to confirm indentation/quoting conventions rather than guessing.

---

## Shared Patterns

### Error construction (`SigilError`)
**Source:** `src/generate.js` lines 126-139, and used identically at lines 178-190 (`E_MISSING_STATEMENT`), 186-189 (`E_MISSING_PLANET`), 224-228 (`E_EMPTY_SEQUENCE`).
**Apply to:** any new/modified throw in `src/generate.js`.
```js
throw new SigilError(
  E_SOME_CODE,
  `generateSigil: <human-readable message, names the offending value>`,
  { /* machine-introspectable details, echoing caller's own values verbatim */ },
);
```

### CLI diagnostic (`diagnose()` / stderr `CODE: message` line)
**Source:** `bin/sigil-spinner.js` lines 86-89, used 3x (including the new WR-04 call site).
**Apply to:** `bin/sigil-spinner.js` only — never introduce a second diagnostic-formatting helper in this file.
```js
diagnose(CODE, message, exitCode); // writes "${code}: ${message}\n" to stderr, then process.exit(exitCode)
```

### Snapshot testing conventions
**Source:** `test/determinism.test.js` (file-based, `toMatchFileSnapshot('./__file_snapshots__/<name>.svg')`) and `test/render/json.test.js:109` / `test/render/svg.test.js:124` (inline, `toMatchSnapshot()` against `test/render/__snapshots__/*.snap`).
**Apply to:** No plan in this phase is expected to touch snapshots (RESEARCH.md Assumption A2 — WR-01 is validation-path-only, WR-04 is a new-diagnostic-only addition, README is docs-only). If `npx vitest run` shows ANY snapshot diff after a Phase 4 change, treat it as a plan-scope violation and stop — per RESEARCH.md's explicit warning, this is a signal the fix leaked into a path that affects `svg`/`working` output shape, which none of the three mandatory items should do.

### `SigilError` public re-export surface
**Source:** `src/index.js` (whole file, 8 lines) — the single flat-export barrel pattern.
**Apply to:** `src/index.js` only, if the Phase 1 WR-02 item is bundled. Keep the barrel flat (`export { X } from './y.js'` per line) — do not introduce a namespace object or a default export.

## No Analog Found

None. Every file in scope for this phase is a modification to an existing file with an already-established in-file convention; RESEARCH.md already did the file:line location work exhaustively. No new files are created by this phase.

## Metadata

**Analog search scope:** `src/generate.js`, `bin/sigil-spinner.js`, `src/index.js`, `src/render/json.js`, `README.md`, `test/cli/cli.test.js`, `test/determinism.test.js`, `test/render/json.test.js`, `test/render/svg.test.js`, `.planning/phases/01-first-sigil-end-to-end/01-01-SUMMARY.md`, `.planning/phases/02-every-planet-every-statement/02-0{1,2,3,4}-SUMMARY.md` (frontmatter only) — all read directly this session (2026-08-07), each excerpt above quoted verbatim from source, not paraphrased.
**Files scanned:** 11
**Pattern extraction date:** 2026-08-07
