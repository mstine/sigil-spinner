---
phase: 04-v1-0-tech-debt-closeout
plan: 01
subsystem: api
tags: [validation, options-resolution, typescript-jsdoc, vitest]

# Dependency graph
requires:
  - phase: 03-themeable-embeddable-layers
    provides: "resolveOptions's type-keyed KNOWN_OPTIONS/ABSENT_DEFAULT_BY_TYPE table (D-47), toWorking's render block always serializing idPrefix as null when absent (D-48)"
provides:
  - "generateSigil(s, p, working.render) round-trips without throwing, on all seven planets, with and without a real idPrefix, and under non-default option combinations"
  - "GenerateOptions.idPrefix typed string | null so the round-trip typechecks for a TypeScript consumer with no cast"
affects: [04-02, 04-03]

# Actuals (#2632)
actuals:
  tokens: 2398
  tasks: 2
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Type-keyed absent-sentinel widening: resolveOptions's absent-check now treats value === ABSENT_DEFAULT_BY_TYPE[expected] as absent, not just value === undefined — scoped per-type by construction so it never loosens boolean validation"

key-files:
  created: []
  modified:
    - src/generate.js
    - test/cli/cli.test.js

key-decisions:
  - "D-49: Fix WR-01 by widening the type-keyed absent-check in resolveOptions rather than special-casing idPrefix or dropping the key at serialize time"
  - "D-49a: The null-idPrefix test at test/cli/cli.test.js:461-472 is inverted deliberately to assert success, not silently loosened — sibling boolean-null test at 389-400 stays unmodified as the scoping regression guard"
  - "D-50: GenerateOptions.idPrefix widened from {string} to {string | null} so the round-trip is legal at the type level too — no cast at the call site"

patterns-established:
  - "Absent-sentinel widening extends an existing declarative table (ABSENT_DEFAULT_BY_TYPE) rather than adding a bespoke per-option branch — any future string-typed option whose absent default is also null is automatically covered"

requirements-completed: [TD-WR01]

coverage:
  - id: D1
    description: "working.render fed straight back into generateSigil produces byte-identical SVG on all seven planets, with and without idPrefix"
    requirement: "TD-WR01"
    verification:
      - kind: unit
        ref: "test/cli/cli.test.js#working.render round-trip (WR-01, D-49, D-50)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The absent-sentinel widening is type-scoped: { glyph: null } still throws E_INVALID_OPTION for boolean options"
    requirement: "TD-WR01"
    verification:
      - kind: unit
        ref: "test/cli/cli.test.js#still throws E_INVALID_OPTION for glyph: null — the absent-sentinel widening is type-scoped, not general"
        status: pass
    human_judgment: false
  - id: D3
    description: "The round-trip call typechecks under tsc --checkJs with no type-assertion at the call site"
    requirement: "TD-WR01"
    verification:
      - kind: unit
        ref: "npm run typecheck (tsc --allowJs --checkJs --noEmit)"
        status: pass
    human_judgment: false
  - id: D4
    description: "All 48 committed snapshot files remain byte-unchanged"
    requirement: "TD-WR01"
    verification:
      - kind: unit
        ref: "git status --porcelain test/__file_snapshots__ test/render/__snapshots__ (empty output)"
        status: pass
    human_judgment: false

duration: 8min
completed: 2026-08-07
status: complete
---

# Phase 4 Plan 1: WR-01 Round-Trip Closure Summary

**`working.render` now round-trips straight back into `generateSigil` — the type-keyed absent-check in `resolveOptions` treats a value strictly equal to its own type's absent-default as absent, closing the gap between `null`-serialized JSON and the `undefined`-only check that used to throw `E_INVALID_OPTION`.**

## Performance

- **Duration:** 8min (measured from plan-doc commit to final task commit)
- **Started:** 2026-08-07T09:13:34-05:00
- **Completed:** 2026-08-07T09:18:08-05:00
- **Tasks:** 2 completed
- **Files modified:** 2

## Accomplishments
- Closed WR-01: `generateSigil(s, p, generateSigil(s, p).working.render)` no longer throws `E_INVALID_OPTION` — it returns byte-identical `svg`, live-verified via `node -e` and via 16 new/inverted Vitest cases.
- Widened `resolveOptions`'s absent-check to `value === undefined || value === ABSENT_DEFAULT_BY_TYPE[expected]` — type-scoped by construction, so `{ glyph: null }` (and any other boolean option set to `null`) still throws exactly as before.
- Widened `GenerateOptions.idPrefix` from `{string}` to `{string | null}` (D-50) so the round-trip call typechecks with zero cast at the call site — verified via `npm run typecheck` exiting 0.
- Inverted the deliberately-wrong regression test at `test/cli/cli.test.js:461-472` per D-49a, with an in-source comment explaining the inversion is intentional; left the sibling boolean-null test (`389-400`) byte-for-byte unmodified.
- Extended round-trip coverage to all seven planets, a real `idPrefix`, a non-default `{ curve, glyph, title }` combination, and a double round-trip proving `render`-block normalization is idempotent.

## Task Commits

Each task was committed atomically (TDD RED/GREEN split for Task 1):

1. **Task 1 (RED): Tracer — failing round-trip test** - `95be58a` (test)
2. **Task 1 (GREEN): Close WR-01 in resolveOptions + widen GenerateOptions.idPrefix** - `d5a84ff` (feat)
3. **Task 2: Expand round-trip coverage to all planets/option states** - `11a8c3a` (test)

_TDD RED/GREEN split applies to Task 1 (`tdd="true"`, tracer). Task 2 is pure test-addition (`tdd="true"`, no source change required) — verified GREEN immediately against Task 1's already-general fix, consistent with the plan's own instruction that a Task 2 failure would indicate a Task 1 defect, not something to work around in the test._

## Files Created/Modified
- `src/generate.js` — `resolveOptions`'s absent-check widened; `GenerateOptions.idPrefix` typedef widened to `string | null`; JSDoc rule list extended citing D-49/D-50
- `test/cli/cli.test.js` — one test inverted (D-49a); new `working.render round-trip (WR-01, D-49, D-50)` describe block with 10 test cases (tracer + type-scoping guards + all-planets + idPrefix + non-default combo + idempotence)

## Decisions Made
- D-49, D-49a, D-50 — all pre-recorded in `04-01-PLAN.md`'s Plan-level decisions section; no new decisions required during execution. Followed the plan as specified.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

WR-01 is fully closed and verified live (`node -e` reproduction plus 1420/1420 automated tests, `npm run typecheck` exit 0, `npm run lint` exit 0, zero snapshot churn, zero package.json/package-lock.json changes). `src/generate.js`'s `resolveOptions` and `GenerateOptions` typedef are the only source-level artifacts this plan produced; both are stable inputs for 04-02 (WR-04 CLI diagnostics) and 04-03, neither of which touches the same functions. No blockers.

## Self-Check: PASSED

- FOUND: src/generate.js
- FOUND: test/cli/cli.test.js
- FOUND: .planning/phases/04-v1-0-tech-debt-closeout/04-01-SUMMARY.md
- FOUND: 95be58a (test — RED)
- FOUND: d5a84ff (feat — GREEN)
- FOUND: 11a8c3a (test — expanded coverage)

---
*Phase: 04-v1-0-tech-debt-closeout*
*Completed: 2026-08-07*
