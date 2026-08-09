---
phase: 05-publish-ready-source
plan: 02
subsystem: json-working
tags: [provenance, determinism, kamea, json-serialization]

# Dependency graph
requires:
  - "05-01 — test/citations.test.js (the new KAMEA_SET_VERSIONS doc comment's citation must satisfy this checker)"
provides:
  - "KAMEA_SET_VERSIONS frozen sidecar map in src/data/kamea.js (D-60), naming the D-04 provenance sign-off date per kamea set"
  - "kameaVersion field on the JSON working, emitted as the 16th key immediately after kameaSet (D-57, D-58, D-59)"
  - "D-61 key-parity guard between KAMEA_SET_VERSIONS and KAMEA_SETS"
  - "Source-introspection determinism guard proving kameaVersion is a static in-source literal with no runtime derivation (T-05-04)"
affects: [publish-ready-source, published-package]

# Actuals (#2632) — pairs with the plan's estimate to calibrate future estimates.
actuals:
  tokens: 3933
  tasks: 2
  commits: 2

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Sidecar version map keyed by set name (KAMEA_SET_VERSIONS), living beside DEFAULT_KAMEA_SET rather than folded into KAMEA_SETS entries — metadata gets its own evolution path without reshaping the data structure every accessor already indexes"
    - "Source-introspection test guard: strip comment-only lines from a source file's text (matching test/render/svg.test.js's established pattern), then assert the code-only remainder contains none of a named set of forbidden runtime-derivation constructs"

key-files:
  created: []
  modified:
    - src/data/kamea.js
    - src/generate.js
    - src/render/json.js
    - README.md
    - test/data/kamea.test.js
    - test/determinism.test.js
    - test/render/json.test.js
    - test/cli/cli.test.js
    - test/render/__snapshots__/json.test.js.snap
    - test/__file_snapshots__/worked-example.working.json

key-decisions:
  - "kameaVersion's doc comment in src/data/kamea.js cites '.planning/phases/05-publish-ready-source/05-CONTEXT.md' (the live phase document recording D-57 through D-61), not an archived milestone document — the decision record exists only there as of this plan, and the citation checker (05-01) requires it to resolve on disk with a matching heading, which it does"
  - "The D-61 parity test compares Object.keys(...).sort() on both maps rather than a raw equality check, since object key enumeration order is not the property being asserted"
  - "test/cli/cli.test.js's new kameaVersion assertion uses a hardcoded literal ('2026-08-04'), matching the existing kameaSet assertion's own hardcoded-literal style in that file (a real-subprocess CLI test that doesn't import src/data/kamea.js), while test/render/json.test.js's assertion compares against the imported KAMEA_SET_VERSIONS constant per the plan's explicit instruction for that file"

requirements-completed: [PKG-02]

coverage:
  - id: D1
    description: "A saved JSON working carries kameaVersion as a string field positioned immediately after kameaSet, sourced from a frozen in-source literal, not computed at build or run time"
    requirement: "PKG-02"
    verification:
      - kind: unit
        ref: "test/determinism.test.js#kameaVersion is a static in-source literal, not derived at build or run time (PKG-02, T-05-04) > %s contains no runtime-derivation construct outside comments"
        status: pass
      - kind: unit
        ref: "test/determinism.test.js#Determinism contract > emits the documented sixteen-key working order whole (PKG-02, D-58)"
        status: pass
      - kind: manual
        ref: "node bin/sigil-spinner.js \"I WILL SUCCEED\" --planet saturn --json — confirmed 16 keys, kameaSet at index 2, kameaVersion at index 3, value 2026-08-04, two consecutive runs byte-identical"
        status: pass
    human_judgment: false
  - id: D2
    description: "Adding a kamea set without a version entry fails the suite at the moment of introduction (D-61)"
    requirement: "PKG-02"
    verification:
      - kind: unit
        ref: "test/data/kamea.test.js#resolver behavior > KAMEA_SET_VERSIONS names exactly the same set of keys as KAMEA_SETS (D-61)"
        status: pass
      - kind: other
        ref: "Manually injected a stub key into KAMEA_SETS during implementation — the parity test failed as expected, then the injection was reverted before commit"
        status: pass
    human_judgment: false
  - id: D3
    description: "Exactly two JSON-shaped snapshots rebased with one inserted line each; all 46 SVG-shaped snapshots byte-unchanged"
    requirement: "PKG-02"
    verification:
      - kind: other
        ref: "git diff --numstat -- test/__file_snapshots__/worked-example.working.json test/render/__snapshots__/json.test.js.snap (1 insertion, 0 deletions each); git diff --name-only over the .svg snapshot set (empty)"
        status: pass
    human_judgment: false

duration: 10min
completed: 2026-08-08
status: complete
---

# Phase 05 Plan 02: Kamea Version in the JSON Working Summary

**Added `kameaVersion` as the JSON working's 16th field — a frozen in-source literal naming the D-04 provenance sign-off date, wired end to end from a new `KAMEA_SET_VERSIONS` sidecar map through `generate.js` and `render/json.js`, with a D-61 parity guard and a source-introspection determinism guard closing the two gaps the shape opens.**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-08-08T18:52:00Z (approx.)
- **Completed:** 2026-08-08T18:55:34Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

- `src/data/kamea.js` gained `KAMEA_SET_VERSIONS`, a frozen sidecar map (`Object.freeze`, matching the `PLANET_GLYPHS` convention) with a single `agrippa: '2026-08-04'` entry, declared beside `DEFAULT_KAMEA_SET` and leaving `KAMEA_SETS` untouched (D-60). Its doc comment states plainly that the value is a provenance sign-off date, not a correctness warranty, and cites the phase's own decision record.
- `src/generate.js` threads `kameaVersion: KAMEA_SET_VERSIONS[DEFAULT_KAMEA_SET]` into the `toWorking` call as a sibling of `kameaSet: DEFAULT_KAMEA_SET` — no new function, no new parameter.
- `src/render/json.js` destructures and re-emits `kameaVersion` immediately after `kameaSet`, with matching `@property {string} kameaVersion` lines on both the `SigilWorking` and `GeneratePipelineResult` typedefs.
- `README.md`'s working table gained the `kameaVersion` row, positioned after `kameaSet`, documented with the same provenance framing.
- A real CLI `--json` invocation confirmed: 16 keys total, `kameaSet` at index 2, `kameaVersion` at index 3, value `2026-08-04`, and two consecutive identical invocations produce byte-identical stdout.
- `test/data/kamea.test.js` gained the D-61 parity assertion (`Object.keys(KAMEA_SET_VERSIONS).sort()` equals `Object.keys(KAMEA_SETS).sort()`), verified to have teeth by temporarily injecting an unversioned stub key into `KAMEA_SETS` (failed as expected, then reverted before commit).
- `test/determinism.test.js`: replaced the hardcoded twelve-key `phase1Order` prefix-plus-appends assertion with a single whole sixteen-key order assertion, since an *inserted* key contradicts the prefix framing rather than extending it. Added a source-introspection determinism guard over the three producing files (`src/data/kamea.js`, `src/generate.js`, `src/render/json.js`), asserting none contains a filesystem read, environment lookup, clock call, subprocess call, or manifest import — verified to have teeth by independently injecting a `Date.now()` call and a `readFileSync` import (each caught, then reverted), plus a byte-identical-repeat-run assertion.
- `test/render/json.test.js` and `test/cli/cli.test.js` extended their existing `kameaSet` assertions to also cover `kameaVersion`, the former compared against the imported `KAMEA_SET_VERSIONS` constant so the test cannot drift out of agreement with the source.
- Rebased exactly two JSON-shaped snapshots (`test/__file_snapshots__/worked-example.working.json`, `test/render/__snapshots__/json.test.js.snap`), one inserted line each. `git diff --name-only` over the `.svg` snapshot set confirmed zero SVG-shaped snapshots moved.
- Full suite: 1460 passed / 19 files. `npm run typecheck` and `npm run lint` both exit 0. `npx vitest run test/citations.test.js` exits 0 (the new doc comment's citation is in canonical form). `package.json` `dependencies` remains `{}`.

## Task Commits

Each task was committed atomically:

1. **Task 1: kameaVersion end to end — constant, thread, emit, document** — `5b459ed` (feat)
2. **Task 2: Test surface, parity guard, determinism guard, and the two-snapshot rebase** — `7f3dd5e` (test)

**Plan metadata:** commit pending (this SUMMARY + STATE/ROADMAP/REQUIREMENTS update)

## Files Created/Modified

- `src/data/kamea.js` - `KAMEA_SET_VERSIONS` frozen sidecar map added (D-60)
- `src/generate.js` - `KAMEA_SET_VERSIONS` imported; `kameaVersion` threaded into the `toWorking` call
- `src/render/json.js` - `kameaVersion` destructured and re-emitted after `kameaSet`; JSDoc `@property` added to both typedefs
- `README.md` - `kameaVersion` row added to the working table
- `test/data/kamea.test.js` - D-61 parity assertion added
- `test/determinism.test.js` - whole sixteen-key order assertion (replacing the twelve-key prefix); new source-introspection determinism guard describe block
- `test/render/json.test.js` - fixture and per-field assertion extended for `kameaVersion`
- `test/cli/cli.test.js` - `--json` working-fields block asserts `kameaVersion`
- `test/render/__snapshots__/json.test.js.snap` - rebased, one line added
- `test/__file_snapshots__/worked-example.working.json` - rebased, one line added

## Decisions Made

- Cited the phase's own live `05-CONTEXT.md` (not an archived milestone document) for the `KAMEA_SET_VERSIONS` doc comment, since D-57 through D-61 are recorded there and it satisfies the citation checker's on-disk-resolution + heading-match requirement as of this plan.
- Used sorted-key-array equality (not raw object equality) for the D-61 parity test, since key enumeration order isn't the property under test.
- Kept `test/cli/cli.test.js`'s new assertion as a hardcoded literal, matching that file's existing style for a real-subprocess test that has no import from `src/data/kamea.js`.

## Deviations from Plan

None — plan executed as written. Task 1's acceptance criteria list included "npm run typecheck exits 0," which does not hold in isolation immediately after Task 1's commit (three pre-existing tests reference a fixture/key-order/snapshot the plan explicitly assigns to Task 2 to update) — this is the plan's own designed sequencing (Task 2's `<action>` explicitly extends `buildPipelineResult`, rewrites the key-order assertion, and rebases the snapshots), not a defect. Both `npm run typecheck` and the full suite are green after Task 2's commit, which is the state that matters for the plan as a whole.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- PKG-02 is fully satisfied: the JSON working names both the kamea set and its version, the value is a guarded static literal, and the D-61 parity guard protects future kamea-set additions.
- Plan 05-03 (INT-05 `--title` CLI flag, INT-06 accessible name) can proceed independently — no file overlap with this plan's touched files.
- No blockers.

---
*Phase: 05-publish-ready-source*
*Completed: 2026-08-08*

## Self-Check: PASSED

- FOUND: .planning/phases/05-publish-ready-source/05-02-SUMMARY.md
- FOUND commit: 5b459ed
- FOUND commit: 7f3dd5e
- FOUND: src/data/kamea.js
- FOUND: src/generate.js
- FOUND: src/render/json.js
