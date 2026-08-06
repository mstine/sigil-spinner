---
phase: 02-every-planet-every-statement
plan: 01
subsystem: text-fold-repeat-loop
tags: [accent-folding, repeat-detection, svg-rendering, kamea, pythagorean]

dependency-graph:
  requires: []
  provides:
    - foldStatement
    - normalize.keptEntries
    - buildPath.repeats
    - svg.sigil-loop
    - working.keptTrail
    - working.repeats
  affects:
    - src/generate.js
    - src/render/json.js
    - src/render/svg.js

tech-stack:
  added: []
  patterns:
    - "Per-character fold with original-index provenance (never whole-string NFD)"
    - "Consecutive-repeat detection over the NUMBER sequence, never over letters"
    - "Additive SVG layer functions keyed off PathModel fields, appended at a fixed seam"

key-files:
  created:
    - src/text/fold.js
    - test/e2e/phase2-tracer.test.js
  modified:
    - src/text/normalize.js
    - src/path/buildPath.js
    - src/render/svg.js
    - src/render/json.js
    - src/generate.js
    - test/render/svg.test.js
    - test/path/buildPath.test.js
    - test/__file_snapshots__/worked-example.working.json
    - test/render/__snapshots__/json.test.js.snap

decisions:
  - "Boundary-offset check in loopLayer compares CELL coincidence (row/col match against pathModel.points[start]/[end]), not atPoint index equality — a run's LAST index (atPoint) can differ from the FIRST index that actually shares the start/end cell, which the tracer statement itself exposed as a real overlap"
  - "LOOP_NEST_STEP_FRACTION declared in Task 2 (where first used) rather than Task 1, to avoid an unused-var lint failure and preserve Task 2's TDD RED-phase integrity for the nesting behavior"
  - "GeneratePipelineResult.keptEntries and SigilWorking.keptTrail typed as optional/possibly-undefined so the existing (unmodified) test/render/json.test.js helper — which does not supply keptEntries — still typechecks and passes"

actuals:
  tokens: 8127
  tasks: 2
  commits: 3
metrics:
  duration: "~45min"
  completed: 2026-08-06

status: complete
---

# Phase 2 Plan 1: Fold, Repeat, Loop — Every Kamea, Every Statement Summary

Per-character accent folding and consecutive-digit repeat loops now trace end to end on any of the seven kameas, proven by "CLARITÉ" on Jupiter through both the library and the CLI.

## What Was Built

**Task 1 (tracer):** Wired one accented, repeat-carrying statement — `CLARITÉ` on `jupiter` — through every layer Phase 2 touches:

- `src/text/fold.js` — new module exporting `foldStatement(statement)`. Iterates code points (`[...statement]`), never the whole string, so per-character `originalIndex` provenance survives folds that change length (ß → SS). A 12-entry `TRANSLITERATION_MAP` (D-23) handles ligatures/letters NFD can't resolve (ß, æ, œ, ø, þ, ð and capitals); everything else NFD-normalizes and strips combining marks (D-22).
- `src/text/normalize.js` — now drives its classification loop from `foldStatement`'s fold records instead of the raw uppercased string. Every struck/kept entry gained `original`/`folded` fields (D-25); a new `keptEntries` array carries the same provenance for kept letters. Branch order (non-letter → vowel → repeat) and existing `kept`/`struck` shapes are unchanged, so `normalize('BK')` still keeps both letters (Pitfall 7 boundary).
- `src/path/buildPath.js` — new `detectRepeats(numbers)` pass over the NUMBER sequence (never letters), producing a `repeats: RepeatEvent[]` field: one `{ atPoint, count }` per run of consecutive equal digits, `count` = extra visits.
- `src/render/svg.js` — new `loopLayer(pathModel)` emitting one `<path class="sigil-loop">` per extra visit, appended after `endMarker` in the fixed layer order. Additive alongside `nodeLayer` — no existing marker suppressed.
- `src/render/json.js` / `src/generate.js` — `keptTrail` (from `keptEntries`) and `repeats` (from `path.repeats`) threaded straight through to the JSON working, computed nowhere in the serializer.
- `test/e2e/phase2-tracer.test.js` — end-to-end assertions: fold correctness, one repeat event, one `sigil-loop` element, all four nodes/start/end still present, four-entry `keptTrail`, and byte-identical CLI/library output.

**Task 2 (TDD):** Completed the coincident-marker geometry Task 1 left as a single-loop happy path:

- **Multi-loop nesting (D-18):** when a repeat event's `count` exceeds 1, each loop now steps outward by `LOOP_NEST_STEP_FRACTION * cellSize` and grows its radius by the same step, so a triple-repeat (`[5,5,5]`) renders two visibly distinct loops rather than two stacked identical arcs.
- **Boundary coincidence (D-19):** when a repeat's point coincides with the CELL a start/end marker is drawn on, one extra `LOOP_OFFSET_FRACTION * cellSize` of displacement is added before nesting steps begin, so the loop clears the boundary marker. Neither the loop nor the boundary marker is ever suppressed — only geometry moves.
- **Single-node dual marker (D-27):** for a one-point PathModel, `endMarker`'s bar center is now offset along the same fixed fallback direction `perpendicularUnit` already uses, so the crossbar and the coincident `sigil-start` circle are both legible instead of drawn on the identical center. Multi-point geometry is untouched.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] loopLayer's boundary check used point-index equality instead of cell coincidence**
- **Found during:** Task 2, while manually verifying the tracer statement's rendered geometry for overlaps (in lieu of an interactive browser check in this headless environment).
- **Issue:** The plan's literal instruction ("when a repeat event's `atPoint` equals `pathModel.start` or `pathModel.end`") checks the LAST index of a repeat run against the start/end index. But the tracer statement `CLARITÉ` on Jupiter repeats digit 3 (`C`, `L` both encode... actually the repeated digit is 3 at the first two kept letters `C`,`L`) as its first two points — its repeat's `atPoint` is index 1, which never equals `pathModel.start` (index 0), even though point 0 and point 1 are the exact same kamea cell. With only an index check, the boundary-clearance offset never applied, and the rendered loop's left edge (63.75) fell inside the start circle's right edge (65) — a visible overlap in the very tracer statement this plan is built around.
- **Fix:** Compare the repeat's point `{row, col}` against `pathModel.points[start]` and `pathModel.points[end]` for cell equality, not `atPoint` against the `start`/`end` indices. This matches CONTEXT.md D-19's actual wording ("lands on the start or end **cell**") more precisely than the plan action text's index-based phrasing.
- **Files modified:** `src/render/svg.js`
- **Commit:** 26e9467

### Auto-fixed Issues (minor, plan-conformance)

**2. [Rule 3 - Blocking issue] `LOOP_NEST_STEP_FRACTION` declared but unused in Task 1**
- **Found during:** Task 1's own lint verification.
- **Issue:** The plan instructs Task 1 to declare all three `LOOP_*_FRACTION` constants, but only two (`LOOP_RADIUS_FRACTION`, `LOOP_OFFSET_FRACTION`) are used before Task 2's nesting logic exists — declaring the third unused triggers `no-unused-vars` and fails Task 1's own `npm run lint` gate.
- **Fix:** Deferred `LOOP_NEST_STEP_FRACTION`'s declaration to Task 2, where it is first used, with a one-line comment explaining why. This also preserves Task 2's TDD RED-phase integrity for the nesting behavior (implementing the constant early in Task 1 would have made Task 2's "not all equal" radius test pass without a true RED step).
- **Files modified:** `src/render/svg.js` (Task 1 commit, then extended in Task 2 commit)
- **Commit:** d694e1e (deferred), 26e9467 (declared and used)

**3. [Rule 3 - Blocking issue] Typecheck failures from `keptEntries` being optional and possibly-undefined**
- **Found during:** Task 1's `npm run typecheck` verification.
- **Issue:** `test/render/json.test.js` (explicitly out of scope for this plan's file list, and required to "pass unchanged") builds its own `GeneratePipelineResult`-shaped object via a local `buildPipelineResult` helper that does not supply `keptEntries`. A strict (non-optional) `keptEntries`/`keptTrail` JSDoc type made `tsc --checkJs` fail against that existing, unmodified test file.
- **Fix:** Marked `GeneratePipelineResult.keptEntries` optional and `SigilWorking.keptTrail` as `KeptEntry[] | undefined` in JSDoc typedefs. `toWorking` still threads the field straight through with no computation (serializer contract preserved) — it is simply `undefined` when the caller omits `keptEntries`, matching the field's absence via JSON round-trip (Jest/Vitest `toEqual` treats undefined-valued properties as equivalent to absent ones, confirmed by the passing "survives a JSON round trip unchanged" test).
- **Files modified:** `src/render/json.js` (typedefs only — no logic change)
- **Commit:** d694e1e

## Known Stubs

None — all behavior described in the plan's must-haves is fully implemented (folding, repeat detection, loop rendering, coincident-marker offsetting) and covered by passing tests.

## Threat Flags

None — this plan introduces no new network endpoints, auth paths, or trust-boundary changes. The one new regex (`COMBINING_MARKS` in `fold.js`) is a bare character class per the plan's threat register (T-02-01), and no new package-manager installs occurred (T-02-SC).

## Verification

- `npx vitest run` — 125/125 tests pass (up from 118 pre-plan).
- `npm run typecheck` — exits 0.
- `npm run lint` — exits 0.
- `node bin/sigil-spinner.js 'CLARITÉ' --planet jupiter` writes an SVG containing `sigil--jupiter` and exactly one `sigil-loop` element to stdout, nothing to stderr.
- `test/__file_snapshots__/worked-example.svg` — byte-unchanged (`git diff --exit-code` exits 0), confirming zero geometry drift for the existing Saturn worked example, which carries no repeats.
- `test/__file_snapshots__/worked-example.working.json` and `test/render/__snapshots__/json.test.js.snap` — updated additively only (the two new `keptTrail`/`repeats` keys appended; every pre-existing key/value pair unchanged).

## Self-Check: PASSED

- `src/text/fold.js` — FOUND
- `test/e2e/phase2-tracer.test.js` — FOUND
- Commit `d694e1e` — FOUND in `git log --oneline`
- Commit `d147ca5` — FOUND in `git log --oneline`
- Commit `26e9467` — FOUND in `git log --oneline`
- All 125 tests passing, typecheck and lint both exit 0 — confirmed by direct re-run above.
