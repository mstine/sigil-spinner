---
phase: 04-v1-0-tech-debt-closeout
plan: 02
subsystem: api
tags: [cli, argv-validation, documentation, vitest]

# Dependency graph
requires:
  - phase: 04-v1-0-tech-debt-closeout
    plan: 01
    provides: "working.render round-trips into generateSigil without throwing (WR-01) — the round-trip example this plan documents in the README depends on that fix being live"
provides:
  - "CLI rejects any invocation carrying more than one statement positional with a single E_CLI_USAGE stderr line and exit status 2, naming the discarded extras"
  - "README documents all 15 SigilWorking fields (including keptTrail, repeats, and the whole render block) in a field-reference table sourced from the src/render/json.js typedef"
  - "README documents the two CLI-local diagnostic codes (E_CLI_USAGE, E_CLI_STDIN) alongside the library's SigilError table"
affects: [04-03]

# Actuals (#2632)
actuals:
  tokens: 7965
  tasks: 2
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Third use of the CLI's existing diagnose()/E_CLI_USAGE/CLI_USAGE_EXIT_CODE trio for a new argv-shape violation — no new diagnostic helper or error code introduced"
    - "README field-reference table transcribed directly from a JSDoc typedef rather than re-authored, so the doc and the source typedef can be diffed for drift"

key-files:
  created: []
  modified:
    - bin/sigil-spinner.js
    - test/cli/cli.test.js
    - README.md

key-decisions:
  - "D-51: extra positionals are a hard usage error (exit 2) via the existing E_CLI_USAGE/diagnose() pattern, not a warning-and-proceed — pre-recorded in the plan"
  - "D-52: the README's working field list moves from an 11-field inline prose bullet to a 15-row field-reference table transcribed from SigilWorking's JSDoc typedef — pre-recorded in the plan"
  - "D-53: E_CLI_USAGE and E_CLI_STDIN get their own clearly-separated block under Errors and Exit Codes, stating they are CLI-local and never thrown as SigilError — pre-recorded in the plan"

patterns-established:
  - "Argv-shape guard placement: the extra-positional check sits immediately after the parseArgs destructure and before the stdin read, so malformed argv is rejected before any I/O"

requirements-completed: [TD-WR04, TD-DOC]

coverage:
  - id: D1
    description: "CLI exits 2 with a single E_CLI_USAGE stderr line naming the discarded extra positional(s); stdout is empty"
    requirement: "TD-WR04"
    verification:
      - kind: unit
        ref: "test/cli/cli.test.js#exits 2 with an E_CLI_USAGE stderr line naming the discarded extra positional (WR-04, D-51)"
        status: pass
      - kind: unit
        ref: "test/cli/cli.test.js#exits 2 and names every extra positional when three or more are supplied (WR-04, D-51)"
        status: pass
      - kind: unit
        ref: "test/cli/cli.test.js#writes exactly one diagnostic line for an extra positional — no raw Node stack trace (WR-04, D-51)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The single-positional and `-` stdin invocations remain byte-identical, unaffected by the new guard"
    requirement: "TD-WR04"
    verification:
      - kind: unit
        ref: "test/cli/cli.test.js#leaves the single-positional invocation unaffected by the extra-positional guard (WR-04, D-51)"
        status: pass
      - kind: unit
        ref: "test/cli/cli.test.js#leaves the `-` stdin invocation unaffected by the extra-positional guard, byte-identical to the single-positional invocation (WR-04, D-51)"
        status: pass
    human_judgment: false
  - id: D3
    description: "README documents all 15 SigilWorking fields (including keptTrail, repeats, and the render block) in a table sourced from the typedef, plus the two CLI-local diagnostic codes"
    requirement: "TD-DOC"
    verification:
      - kind: unit
        ref: "grep -c keptTrail README.md >= 1; sed -n '/## The JSON Working/,/## Worked Example/p' README.md | grep -c '^| \\`' == 15; grep -c E_CLI_USAGE / E_CLI_STDIN README.md >= 1"
        status: pass
    human_judgment: false
  - id: D4
    description: "All 48 committed snapshot files remain byte-unchanged; package.json/package-lock.json unchanged"
    requirement: "TD-WR04"
    verification:
      - kind: unit
        ref: "git status --porcelain test/__file_snapshots__ test/render/__snapshots__ package.json package-lock.json (empty output)"
        status: pass
    human_judgment: false

duration: 3min
completed: 2026-08-07
status: complete
---

# Phase 4 Plan 2: WR-04 CLI Diagnostics + README Field Reference Summary

**The CLI now diagnoses (rather than silently discards) any extra positional argument via the existing `E_CLI_USAGE`/`diagnose()` pattern, and the README carries a 15-row field-reference table for `working` transcribed from the `SigilWorking` typedef, plus documentation for the two CLI-local diagnostic codes.**

## Performance

- **Duration:** 3min (measured from first task commit to final task commit)
- **Started:** 2026-08-07T09:22:14-05:00
- **Completed:** 2026-08-07T09:24:36-05:00
- **Tasks:** 2 completed
- **Files modified:** 3

## Accomplishments

- Closed WR-04: `sigil-spinner.js 'A' 'EXTRA' --planet saturn` now exits 2 with exactly one `E_CLI_USAGE` stderr line naming `EXTRA`, instead of silently rendering the first statement and discarding the rest — verified live via direct CLI invocation and via 5 new Vitest cases.
- The guard reuses the file's existing `diagnose()`/`E_CLI_USAGE`/`CLI_USAGE_EXIT_CODE` trio verbatim (this is the third call site in the file) — no second diagnostic helper, no new error code.
- Guard placed immediately after the `parseArgs` destructure and before the stdin read, so an invocation combining `-` with an extra positional is rejected on argv shape rather than blocking on I/O first.
- Single-positional and `-` stdin invocations remain byte-identical — verified with a live `diff` between the two outputs and with explicit regression tests.
- Closed the README documentation gap: replaced the stale 11-field prose bullet with a new `## The JSON Working` section carrying a 15-row field-reference table (adding `keptTrail`, `repeats`, and the whole `render` block, which were previously undocumented), transcribed directly from `src/render/json.js`'s `SigilWorking` JSDoc typedef.
- Documented the `render` sub-block's four keys, its JSON-`null`-for-absent-idPrefix invariance (D-48), and its round-trip into `generateSigil` (D-49) with a runnable fenced example — live-verified via `node -e` that the round-trip actually produces `second.svg === first.svg`.
- Added a new "CLI-local diagnostic codes" block under `## Errors and Exit Codes` documenting `E_CLI_USAGE` and `E_CLI_STDIN`, stating explicitly they are CLI-local and never thrown as `SigilError`.
- Updated the `### CLI` usage synopsis to state that extra positionals are a usage error.

## Task Commits

1. **Task 1 (RED): Failing coverage for extra-positional CLI rejection** - `dbe1567` (test)
2. **Task 1 (GREEN): CLI rejects more than one statement positional** - `a5ea0e7` (feat)
3. **Task 2: Document the JSON working's fields and CLI-local diagnostics** - `15cbcfe` (docs)

_TDD RED/GREEN split applies to Task 1 (`tdd="true"`). Task 2 (`type="auto"`, no `tdd` attribute) is documentation-only and committed as a single `docs` commit._

## Files Created/Modified

- `bin/sigil-spinner.js` — new extra-positional guard (`positionals.length > 1`) immediately after the `parseArgs` destructure, reusing `diagnose`/`E_CLI_USAGE`/`CLI_USAGE_EXIT_CODE`; header comment's Diagnostics paragraph extended citing D-51
- `test/cli/cli.test.js` — 5 new test cases in the `CLI exception safety` describe block: two-positional rejection, three-positional rejection (both extras named), single-diagnostic-line assertion, and two explicit unaffected-behavior guards (single positional, `-` stdin)
- `README.md` — new `## The JSON Working` section (15-row field table + `render` sub-block documentation with a runnable round-trip example); stale `working` bullet replaced with a link; new CLI-local diagnostics block under `## Errors and Exit Codes`; `### CLI` usage synopsis updated; whole file reformatted with `prettier --write` (see Deviations)

## Decisions Made

D-51, D-52, D-53 — all pre-recorded in `04-02-PLAN.md`'s Plan-level decisions section; no new decisions required during execution. Followed the plan as specified.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Reformatted the whole README.md with `prettier --write` to satisfy the plan's own verification gate**
- **Found during:** Task 2 verification (`npx prettier --check README.md`)
- **Issue:** The plan's `<verify>` block for Task 2 requires `npx prettier --check README.md` to exit 0. Confirmed via `git stash` that `README.md` already failed this check on the pre-existing, unmodified file (pre-existing formatting drift unrelated to this plan's content — e.g. `*italic*` vs. Prettier's `_italic_` convention, and unaligned Markdown table columns).
- **Fix:** Ran `npx prettier --write README.md` after making the plan's content edits, which reformatted the entire file (not just the new/edited sections) to Prettier's canonical style. Re-verified every content-level acceptance criterion (field names, row counts, grep counts, heading match, link check) still passed after the reformat.
- **Files modified:** `README.md` (already in scope for this task)
- **Verification:** `npx prettier --check README.md` exits 0; `npx vitest run --exclude 'test/browser/**'` still 1425/1425 passing; `git status --porcelain src bin test/__file_snapshots__ test/render/__snapshots__` empty (no source/snapshot drift from a docs-only task).
- **Committed in:** `15cbcfe` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking — pre-existing formatting drift the plan's own gate required fixing)
**Impact on plan:** No scope creep — the reformat is a byproduct of satisfying a verification step the plan itself specified. All prior README content is semantically unchanged; only whitespace/quote-style formatting shifted.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

WR-04 and the README documentation gap are both fully closed and verified live (`node bin/sigil-spinner.js 'I WILL SUCCEED' 'EXTRA' --planet saturn` exits 2 with one `E_CLI_USAGE` line; 1425/1425 automated tests; `npm run typecheck` exit 0; `npm run lint` exit 0; `npx prettier --check README.md` exit 0; zero snapshot churn; zero package.json/package-lock.json changes). `bin/sigil-spinner.js` and `README.md` are the only source-level artifacts this plan produced; both are stable inputs for `04-03`, which touches different files (`generate.js`'s validation ordering, `src/index.js`'s exports, and Phase 2 SUMMARY frontmatter). No blockers.

## Self-Check: PASSED

- FOUND: bin/sigil-spinner.js
- FOUND: test/cli/cli.test.js
- FOUND: README.md
- FOUND: .planning/phases/04-v1-0-tech-debt-closeout/04-02-SUMMARY.md
- FOUND: dbe1567 (test — RED)
- FOUND: a5ea0e7 (feat — GREEN)
- FOUND: 15cbcfe (docs)

---
*Phase: 04-v1-0-tech-debt-closeout*
*Completed: 2026-08-07*
