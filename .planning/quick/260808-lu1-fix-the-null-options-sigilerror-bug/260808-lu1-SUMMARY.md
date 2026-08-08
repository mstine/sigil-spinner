---
phase: quick-260808-lu1
plan: 01
subsystem: api
tags: [error-handling, validation, sigilerror, cr-01]

requires: []
provides:
  - Every caller-input shape reachable through generateSigil terminates in either a sigil or a typed SigilError — no raw TypeError escapes the public surface
affects: [phase-6-published-package]

actuals:
  tokens: 3606
  tasks: 3
  commits: 5

tech-stack:
  added: []
  patterns:
    - "Total value formatter for error-message interpolation (describeValue) — branches on bigint/symbol/function typeof before attempting JSON.stringify, and catches circular-structure throws, so the error-construction path itself cannot crash with an untyped error"
    - "Options-bag normalization happens once, inside resolveOptions, via nullish coalescing to {} before any property access — never relies on a default parameter, which only applies to undefined and not to an explicitly passed null"

key-files:
  created: []
  modified:
    - src/generate.js
    - test/cli/cli.test.js
    - README.md

key-decisions:
  - "null/undefined for the whole options argument is coerced to absent (matches D-49/D-50's precedent for idPrefix: an optional slot given null resolves to absent); a present-but-wrong-typed bag (string, number, boolean, BigInt, Symbol, function) is rejected with E_INVALID_OPTION, using the idPrefix absent-sentinel (null) for .details.option to signal 'the whole bag, not a named option'"
  - "Arrays are accepted as an options bag (resolve to all-defaults) — consistent with D-47's ignore-unknown-keys forward-compatibility rule, since an array is an object carrying no known option keys, same as {}"
  - "No new E_* error code was introduced; every closed crash site reuses an existing code (E_INVALID_OPTION or E_MISSING_STATEMENT)"

requirements-completed: [CR-01]

coverage:
  - id: D1
    description: "generateSigil(s, p, null) and generateSigil(s, p, undefined) return a sigil byte-identical to the omitted-argument call (H1)"
    requirement: "CR-01"
    verification:
      - kind: unit
        ref: "test/cli/cli.test.js#treats a null options bag as absent, not a crash — a default parameter never applies to an explicitly passed null"
        status: pass
    human_judgment: false
  - id: D2
    description: "A BigInt or circular value passed as a known option, or as the statement, throws SigilError (E_INVALID_OPTION / E_MISSING_STATEMENT) instead of a raw TypeError from inside the error-construction path (H2-H5)"
    requirement: "CR-01"
    verification:
      - kind: unit
        ref: "test/cli/cli.test.js#Argument-shape crash class — every caller-supplied shape terminates in a SigilError (CR-01 sibling audit)"
        status: pass
    human_judgment: false
  - id: D3
    description: "A present-but-non-object options bag (string, number, boolean, BigInt, Symbol, function) throws E_INVALID_OPTION instead of silently resolving to all-defaults; an array bag still resolves to all-defaults"
    requirement: "CR-01"
    verification:
      - kind: unit
        ref: "test/cli/cli.test.js#Argument-shape crash class — every caller-supplied shape terminates in a SigilError (CR-01 sibling audit)"
        status: pass
    human_judgment: false
  - id: D4
    description: "README § Errors and Exit Codes and the API description document the restored contract: omitted/null/{} are equivalent for options, and a non-object bag is E_INVALID_OPTION"
    verification: []
    human_judgment: true
    rationale: "Prose accuracy against the shipped behavior is a documentation-quality judgment, not something a unit test asserts"

duration: 5min
completed: 2026-08-08
status: complete
---

# Quick Task 260808-lu1: Fix the null-options SigilError bug Summary

**Restored the library's `SigilError`-for-every-error contract across all five audited crash sites — a null options bag, BigInt/circular option values, and BigInt/circular statements now all terminate in a sigil or a typed error, never a raw `TypeError`.**

## Performance

- **Duration:** ~5 min
- **Tasks:** 3 completed
- **Files modified:** 3 (`src/generate.js`, `test/cli/cli.test.js`, `README.md`)

## Accomplishments

- Closed the originally reported bug (H1): `generateSigil(s, p, null)` now returns a sigil byte-identical to omitting the argument, instead of crashing with `TypeError: Cannot read properties of null (reading 'curve')`.
- Closed four sibling crash sites (H2-H5), all strictly worse than H1 because they fired from inside the `SigilError`-construction path itself: `JSON.stringify` throwing on BigInt and circular values inside both the `E_INVALID_OPTION` and `E_MISSING_STATEMENT` message templates.
- Closed an adjacent silent-acceptance defect: a present-but-wrong-typed `options` bag (string, number, boolean, BigInt, Symbol, function) previously resolved silently to all-defaults instead of raising `E_INVALID_OPTION` — unvalidated input silently changing observable behavior, which `npm publish` in Phase 6 would have frozen as permanent, accidental API surface.
- Added a total, never-throwing value describer (`describeValue`) used at both interpolation sites, so the library's error-construction path can no longer be the thing that produces an untyped crash.
- Published the restored contract in README: the three equivalent shapes for the `options` argument (omitted, `null`, `{}`), and the wrong-typed-bag trigger for `E_INVALID_OPTION`.

## Audit Table — Before/After

| # | Input | Crash site (before) | Behavior after |
|---|-------|---------------------|-----------------|
| H1 | `generateSigil(s, p, null)` | Raw `TypeError` — `options[name]` on `null` | Returns a sigil, byte-identical to omitted-argument call |
| H2 | `generateSigil(s, p, { curve: 1n })` | Raw `TypeError` — `JSON.stringify(BigInt)` | `SigilError` code `E_INVALID_OPTION` |
| H3 | `generateSigil(s, p, { idPrefix: <circular> })` | Raw `TypeError` — `JSON.stringify(circular)` | `SigilError` code `E_INVALID_OPTION` |
| H4 | `generateSigil(1n, p)` | Raw `TypeError` — `JSON.stringify(BigInt)` in `E_MISSING_STATEMENT` message | `SigilError` code `E_MISSING_STATEMENT` |
| H5 | `generateSigil(<circular>, p)` | Raw `TypeError` — `JSON.stringify(circular)` in `E_MISSING_STATEMENT` message | `SigilError` code `E_MISSING_STATEMENT` |
| — | `generateSigil(s, p, 'nope' \| 42 \| true \| 1n \| Symbol() \| fn)` | Silently accepted, resolved to all-defaults | `SigilError` code `E_INVALID_OPTION`, `.details.option === null` |
| — | `generateSigil(s, p, [])` | Silently accepted (unchanged) | Still silently accepted, all-defaults, byte-identical to omitted-argument call (D-47 boundary, unchanged by design) |
| — | `{ curve: Symbol('s') }` | `E_INVALID_OPTION` with lossy message `got: undefined` | `E_INVALID_OPTION` with message describing the symbol |

No new `E_*` error code was introduced — every closed hole reuses an existing code from `src/errors.js`.

## Coerce-vs-Reject Decision

The task constraint required rejecting unless the codebase's own validation style showed coercion was the established pattern for analogous inputs. It does: `idPrefix` given `null` resolves to absent under D-49/D-50, a decision the codebase committed to hard enough to deliberately invert a previously-rejecting test (`test/cli/cli.test.js:609-619`). Since `options` is itself declared optional (`generateSigil(s, p)` and `generateSigil(s, p, {})` are already equivalent), the same discriminator applies at the bag level: a **required** slot given `null` rejects (no legal absent state), an **optional** slot given `null` resolves to absent. So `null`/`undefined` for the whole `options` argument coerces to `{}`. A bag that is *present and structurally wrong* (a primitive or function) still rejects with the existing `E_INVALID_OPTION` code — no new code invented, and the asymmetry (arrays accepted, primitives/functions rejected) is recorded in the `resolveOptions` doc comment.

## Fail-First RED Proof

**Task 1** — `treats a null options bag as absent, not a crash`:
```
TypeError: Cannot read properties of null (reading 'curve')
 at resolveOptions src/generate.js:152:26
 at generateSigil src/generate.js:224:27
```

**Task 2** — 11 of 13 new cases in the "Argument-shape crash class" suite failed before the fix (2 already passed by design — the array-bag boundary and the unchanged-message-text case):
```
FAIL throws E_INVALID_OPTION, not a BigInt serialization TypeError, for a BigInt option value (H2)
AssertionError: expected TypeError: Do not know how to serialize a... to be an instance of SigilError

FAIL throws E_INVALID_OPTION, not a circular-structure TypeError, for a circular option value (H3)
AssertionError: expected TypeError: Converting circular structure ... to be an instance of SigilError

FAIL throws E_MISSING_STATEMENT, not a BigInt serialization TypeError, for a BigInt statement (H4)
AssertionError: expected TypeError: Do not know how to serialize a... to be an instance of SigilError

FAIL throws E_MISSING_STATEMENT, not a circular-structure TypeError, for a circular statement (H5)
AssertionError: expected TypeError: Converting circular structure ... to be an instance of SigilError

FAIL throws E_INVALID_OPTION for a string/number/boolean/BigInt/Symbol/function options bag, not a silent all-defaults resolution (6 cases)
AssertionError: expected undefined to be an instance of SigilError

FAIL still throws E_INVALID_OPTION for a Symbol option value, with a message describing the symbol rather than reading "got: undefined"
AssertionError: expected '...got: undefined' not to contain 'got: undefined'

11 failed | 2 passed | 82 skipped (95)
```

## Task Commits

Each task was committed atomically (Tasks 1 and 2 carry TDD RED/GREEN pairs):

1. **Task 1 RED** - `254394b` (test) — failing test for null options bag
2. **Task 1 GREEN** - `8809bdf` (feat) — coerce null/undefined options bag to absent
3. **Task 2 RED** - `aff8cf7` (test) — failing tests for H2-H5 and the wrong-typed-bag case
4. **Task 2 GREEN** - `d5389b8` (feat) — total value describer, wrong-typed-bag rejection
5. **Task 3** - `35df4ec` (docs) — README contract update

## Files Created/Modified

- `src/generate.js` — `resolveOptions` now coalesces `null`/`undefined` to `{}` before any property access, rejects a present-but-non-object bag with `E_INVALID_OPTION`, and both `SigilError` message-interpolation sites use the new `describeValue` total formatter instead of raw `JSON.stringify`. `generateSigil`'s `options` JSDoc widened to `GenerateOptions | null`.
- `test/cli/cli.test.js` — one new test in the existing D-47 option-validation suite (null options bag), and one new `describe` block ("Argument-shape crash class") covering H2-H5 and the wrong-typed-bag/array-boundary/Symbol-message cases.
- `README.md` — API description now states the three equivalent shapes for the `options` argument; the `E_INVALID_OPTION` table row now also describes the wrong-typed-bag trigger and the `.details.option === null` whole-bag signal.

## Decisions Made

See "Coerce-vs-Reject Decision" above. No other decisions required — the plan's `planner_audit` section fully specified the fix scope.

## Deviations from Plan

None - plan executed exactly as written. All five audited crash sites (H1-H5) plus the wrong-typed-bag finding were closed exactly as scoped; no new `E_*` code was added; zero snapshots moved; `dependencies` remained `{}`.

## Known Stubs

None.

## Issues Encountered

None.

## Gate Results (Task 3)

1. `npm test` — 1496 passed / 20 files (browser tests ran; Chromium was present).
2. `npm run typecheck` — exit 0.
3. `npm run lint` — exit 0.
4. `git diff --name-only <base-sha> -- test/__file_snapshots__ test/render/__snapshots__` — empty. No snapshot moved.
5. `git status --porcelain -- test/__file_snapshots__ test/render/__snapshots__` — empty. No new untracked snapshot.
6. `dependencies` in `package.json` — still `{}`.
7. Scratch baseline file (`.base-sha`) removed after the gate passed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

The `generateSigil` public surface now has no known reachable path to a raw `TypeError` — every caller-input shape terminates in a sigil or a `SigilError` carrying an existing `E_*` code. This closes the review finding (`05-REVIEW.md`, CR-01) that was blocking Phase 6 from treating the library's error contract as permanent and public once `npm publish` runs. No blockers for Phase 6.

---
*Quick task: 260808-lu1*
*Completed: 2026-08-08*

## Self-Check: PASSED

All modified files (`src/generate.js`, `test/cli/cli.test.js`, `README.md`) confirmed present on disk. All 5 task commit hashes (`254394b`, `8809bdf`, `aff8cf7`, `d5389b8`, `35df4ec`) confirmed present in `git log`.
