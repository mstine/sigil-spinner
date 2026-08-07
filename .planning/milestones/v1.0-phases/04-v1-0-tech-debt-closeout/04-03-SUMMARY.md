---
phase: 04-v1-0-tech-debt-closeout
plan: 03
subsystem: api
tags: [validation-ordering, error-taxonomy, exit-codes, documentation, vitest]

# Dependency graph
requires:
  - phase: 04-v1-0-tech-debt-closeout
    plan: 01
    provides: "resolveOptions's type-keyed absent-sentinel table (WR-01 fix) — this plan's Task 1 reorder inserts a call ahead of the same resolveOptions/normalize block without touching that table"
  - phase: 04-v1-0-tech-debt-closeout
    plan: 02
    provides: "the CLI's diagnose()/E_CLI_USAGE pattern and README field-reference table — this plan does not reuse either directly but shares the file (test/cli/cli.test.js) they both extended"
provides:
  - "generateSigil('AEIOU','pluto') reports E_UNKNOWN_PLANET, not E_EMPTY_SEQUENCE — planet identity settled before statement content is judged"
  - "All five E_* error-code constants importable from the package root (src/index.js), and bin/sigil-spinner.js's EXIT_CODES map keyed from those constants instead of string literals"
  - "All four Phase 2 SUMMARY.md files carry requirements-completed frontmatter, transcribed from 02-VERIFICATION.md"
  - "Written disposition for all eleven v1.0 tech-debt audit items in .planning/v1.0-MILESTONE-AUDIT.md — 6 closed, 2 verified non-issues, 3 deferred with reopen conditions"
affects: []

# Actuals (#2632)
actuals:
  tokens: 4928
  tasks: 3
  commits: 5

tech-stack:
  added: []
  patterns:
    - "Guard-clause reordering: gridSize(planet) relocated ahead of normalize()/the empty-sequence check, preserving the file's sequential-throw style with no new validation abstraction"
    - "Computed-key exit-status map: bin/sigil-spinner.js's EXIT_CODES keyed via [E_CONSTANT]: value rather than string literals, so a rename in src/errors.js propagates or fails loudly at import"

key-files:
  created: []
  modified:
    - src/generate.js
    - src/index.js
    - bin/sigil-spinner.js
    - test/cli/cli.test.js
    - .planning/phases/02-every-planet-every-statement/02-01-SUMMARY.md
    - .planning/phases/02-every-planet-every-statement/02-02-SUMMARY.md
    - .planning/phases/02-every-planet-every-statement/02-03-SUMMARY.md
    - .planning/phases/02-every-planet-every-statement/02-04-SUMMARY.md
    - .planning/v1.0-MILESTONE-AUDIT.md

key-decisions:
  - "D-54: planet identity is validated before statement content — gridSize(planet) moved ahead of normalize()/the empty-sequence block, so a doubly-invalid call reports E_UNKNOWN_PLANET instead of masking it behind E_EMPTY_SEQUENCE"
  - "D-55: the five E_* constants join the public surface via src/index.js, and bin/sigil-spinner.js's EXIT_CODES map is rekeyed to computed keys from those imports — E_CLI_USAGE/E_CLI_STDIN stay CLI-local, out of both the map and src/errors.js"
  - "D-56: the four Phase 2 SUMMARY files' requirements-completed values are transcribed from 02-VERIFICATION.md's Requirements Coverage table (inverted requirement-to-plans to plan-to-requirements), not re-derived from the PLAN files"

patterns-established:
  - "Audit-register disposition line: each tech-debt item in v1.0-MILESTONE-AUDIT.md now carries a **Disposition:** line naming CLOSED/DEFERRED/VERIFIED NON-ISSUE, its plan/decision reference or reopen condition — a template future closeout phases can reuse"

requirements-completed: [TD-ORD, TD-EXP, TD-META]

coverage:
  - id: D1
    description: "generateSigil('AEIOU','pluto') reports E_UNKNOWN_PLANET (not E_EMPTY_SEQUENCE); every existing single-fault error case still reports exactly the code it reported before the reorder"
    requirement: "TD-ORD"
    verification:
      - kind: unit
        ref: "test/cli/cli.test.js#Validation ordering — planet identity settled before statement content (WR-03, D-54)"
        status: pass
    human_judgment: false
  - id: D2
    description: "All five E_* constants import from the package root and equal their own names; a real thrown SigilError's .code matches the imported constant by identity; the CLI's exit-status map is keyed from those constants"
    requirement: "TD-EXP"
    verification:
      - kind: unit
        ref: "test/cli/cli.test.js#Public error-code constants and CLI exit-map drift protection (WR-02, D-55)"
        status: pass
    human_judgment: false
  - id: D3
    description: "All four Phase 2 SUMMARY files carry requirements-completed frontmatter matching 02-VERIFICATION.md, and the v1.0 audit register carries a written disposition for all eleven items"
    requirement: "TD-META"
    verification:
      - kind: other
        ref: "for f in .planning/phases/02-every-planet-every-statement/02-0{1,2,3,4}-SUMMARY.md; do grep -q '^requirements-completed:' \"$f\"; done (all four pass)"
        status: pass
    human_judgment: false
  - id: D4
    description: "All 48 committed snapshot files remain byte-unchanged; package.json/package-lock.json unchanged"
    requirement: "TD-ORD"
    verification:
      - kind: unit
        ref: "git status --porcelain test/__file_snapshots__ test/render/__snapshots__ package.json package-lock.json (empty output)"
        status: pass
    human_judgment: false

duration: 6min
completed: 2026-08-07
status: complete
---

# Phase 4 Plan 3: Validation Ordering, Public Error Codes, and Audit Register Closure Summary

**Planet identity now outranks statement content in `generateSigil`'s guard sequence, all five `E_*` error codes are public and drive the CLI's exit-status map by reference rather than string literal, and the v1.0 tech-debt register ends the phase with a written outcome for all eleven items — six closed, two verified non-issues, three deferred with a stated reopen condition.**

## Performance

- **Duration:** 6min (measured from first task commit to final task commit)
- **Started:** 2026-08-07T09:28:37-05:00
- **Completed:** 2026-08-07T09:34:47-05:00
- **Tasks:** 3 completed
- **Files modified:** 9

## Accomplishments

- Closed WR-03/Phase 1 (D-54): `generateSigil('AEIOU','pluto')` now reports `E_UNKNOWN_PLANET` instead of masking it behind `E_EMPTY_SEQUENCE` — `gridSize(planet)` moved ahead of `normalize()`/the empty-sequence block, with every existing single-fault code (`E_MISSING_STATEMENT`, `E_MISSING_PLANET`, `E_UNKNOWN_PLANET`, `E_EMPTY_SEQUENCE`, `E_INVALID_OPTION`) verified unchanged.
- Closed WR-02/Phase 1 (D-55): all five `E_*` constants re-exported from `src/index.js` in the existing flat barrel style; `bin/sigil-spinner.js`'s `EXIT_CODES` map rekeyed to computed keys (`[E_CONSTANT]: value`) so a future rename in `src/errors.js` propagates or fails loudly at import instead of silently orphaning an entry. `E_CLI_USAGE`/`E_CLI_STDIN` stayed CLI-local as before.
- Closed the cross-cutting metadata gap (D-56): all four Phase 2 `*-SUMMARY.md` files now carry `requirements-completed`, transcribed from `02-VERIFICATION.md`'s Requirements Coverage table — union of the four values covers all six Phase 2 requirements with no orphaned ID.
- Dispositioned all eleven items in `.planning/v1.0-MILESTONE-AUDIT.md`: added a **Disposition** line to every item recording CLOSED (with plan/decision reference), VERIFIED NON-ISSUE (with the evidence that settled it), or DEFERRED (with a stated reopen condition) — plus a summary line at the top of the Tech Debt section.
- Zero package installs, zero snapshot churn, zero `package.json`/`package-lock.json` changes across all three tasks.

## Task Commits

Each task was committed atomically (TDD RED/GREEN split for Tasks 1 and 2):

1. **Task 1 (RED): Failing coverage for planet-identity-before-content ordering** - `05d2d8c` (test)
2. **Task 1 (GREEN): Validate planet identity before statement content** - `636a215` (fix)
3. **Task 2 (RED): Failing coverage for public E_* constant exports** - `2b50216` (test)
4. **Task 2 (GREEN): Export E_* error-code constants and rekey CLI exit map** - `f19eb9d` (feat)
5. **Task 3: Backfill requirements-completed frontmatter and disposition all 11 audit items** - `775086a` (docs)

_TDD RED/GREEN split applies to Tasks 1 and 2 (`tdd="true"`). Task 3 (`type="auto"`, no `tdd` attribute) is documentation-only and committed as a single `docs` commit._

## Files Created/Modified

- `src/generate.js` — `gridSize(planet)` call and its comment relocated ahead of `normalize(statement)`/the empty-sequence block, citing D-54
- `src/index.js` — third flat re-export line carrying the five `E_*` constants; header comment extended
- `bin/sigil-spinner.js` — new import of the five `E_*` constants; `EXIT_CODES` rekeyed from string-literal keys to computed keys; doc comment extended citing D-55
- `test/cli/cli.test.js` — import block extended with the five `E_*` constants; two new `describe` blocks: "Validation ordering — planet identity settled before statement content (WR-03, D-54)" (7 cases) and "Public error-code constants and CLI exit-map drift protection (WR-02, D-55)" (3 cases)
- `.planning/phases/02-every-planet-every-statement/02-01-SUMMARY.md` — `requirements-completed: [KAMEA-02, PATH-02, CONS-04]` added
- `.planning/phases/02-every-planet-every-statement/02-02-SUMMARY.md` — `requirements-completed: [KAMEA-02, CONS-03, CONS-04, INT-03, INT-04]` added
- `.planning/phases/02-every-planet-every-statement/02-03-SUMMARY.md` — `requirements-completed: [PATH-02, INT-03]` added
- `.planning/phases/02-every-planet-every-statement/02-04-SUMMARY.md` — `requirements-completed: [CONS-03, CONS-04, INT-03, INT-04]` added
- `.planning/v1.0-MILESTONE-AUDIT.md` — a **Disposition** line added to all eleven tech-debt items, plus a Phase 4 closeout summary line at the top of the Tech Debt section

## Decisions Made

D-54, D-55, D-56 — all pre-recorded in `04-03-PLAN.md`'s Plan-level decisions section; no new decisions required during execution. Followed the plan as specified, including the exact frontmatter insertion point (last key before the closing `---` fence, since none of the four Phase 2 SUMMARY files carry the `patterns-established`/`coverage` sections `01-01-SUMMARY.md` anchors its own key to).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

All three cheap audit items are closed, and the v1.0 tech-debt register ends this phase fully decided: 6 items fixed (across all three plans in this phase), 2 closed as verified non-issues with evidence, 3 deferred with a written reason and reopen condition. Zero items ambiguous. Final verification: 1435/1435 automated tests (above the 1425 baseline), `npm run typecheck` exit 0, `npm run lint` exit 0, zero snapshot churn, zero `package.json`/`package-lock.json` changes. This is the final plan in Phase 4 (v1.0 Tech Debt Closeout) — no downstream plan depends on this one.

## Self-Check: PASSED

- FOUND: src/generate.js
- FOUND: src/index.js
- FOUND: bin/sigil-spinner.js
- FOUND: test/cli/cli.test.js
- FOUND: .planning/phases/02-every-planet-every-statement/02-01-SUMMARY.md
- FOUND: .planning/phases/02-every-planet-every-statement/02-02-SUMMARY.md
- FOUND: .planning/phases/02-every-planet-every-statement/02-03-SUMMARY.md
- FOUND: .planning/phases/02-every-planet-every-statement/02-04-SUMMARY.md
- FOUND: .planning/v1.0-MILESTONE-AUDIT.md
- FOUND: 05d2d8c (test — RED, Task 1)
- FOUND: 636a215 (fix — GREEN, Task 1)
- FOUND: 2b50216 (test — RED, Task 2)
- FOUND: f19eb9d (feat — GREEN, Task 2)
- FOUND: 775086a (docs — Task 3)

---
*Phase: 04-v1-0-tech-debt-closeout*
*Completed: 2026-08-07*
