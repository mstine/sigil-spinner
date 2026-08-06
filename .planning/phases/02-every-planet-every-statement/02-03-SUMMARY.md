---
phase: 02-every-planet-every-statement
plan: 03
subsystem: render
tags: [svg, loop-geometry, gap-closure, determinism]
dependency-graph:
  requires: [02-01]
  provides: ["src/render/svg.js:loopLayer", "src/render/svg.js:loopDirection", "sigil-loop connectedness contract"]
  affects: ["test/render/svg.test.js", "test/e2e/phase2-tracer.test.js", "test/determinism.test.js"]
tech-stack:
  added: []
  patterns:
    - "Two-arc idiom for a closed circle whose path data literally begins and ends at its anchor point (connectedness inspectable in markup, testable without geometry math)"
    - "Direction resolution as a three-step fallback chain with a centre-ward sign rule, extracted to its own named function"
key-files:
  created:
    - test/__file_snapshots__/single-letter-saturn.svg
    - test/__file_snapshots__/single-letter-moon.svg
    - test/__file_snapshots__/matrix-repeat-saturn.svg
    - test/__file_snapshots__/matrix-repeat-jupiter.svg
    - test/__file_snapshots__/matrix-repeat-mars.svg
    - test/__file_snapshots__/matrix-repeat-sun.svg
    - test/__file_snapshots__/matrix-repeat-venus.svg
    - test/__file_snapshots__/matrix-repeat-mercury.svg
    - test/__file_snapshots__/matrix-repeat-moon.svg
  modified:
    - src/render/svg.js
    - test/determinism.test.js
    - test/render/svg.test.js
    - test/e2e/phase2-tracer.test.js
decisions:
  - "SINGLE_NODE_END_OFFSET_FRACTION split from the former LOOP_OFFSET_FRACTION (same 0.14 value) so D-27's single-letter end-bar offset is governed independently of loop geometry — tuning loop aesthetics can never silently change single-letter output bytes (IN-03)"
  - "Loop anchor formula: q (the antipode) = p + 2*r*u, not p + r*u — p + r*u is the circle's implied center, and q sits diametrically opposite p through that center; verified against both worked examples in the plan (CLARITÉ/jupiter, BKT RISES/saturn) to the exact byte"
  - "Direction resolution extracted into loopDirection(pathModel, repeat), a three-step fallback (segment entering the run's first point, else segment leaving its last point, else fixed {1,0}) with a centre-ward sign rule, replacing the dead always-zero-length lookup (WR-01)"
  - "LOOP_RADIUS_FRACTION and LOOP_NEST_STEP_FRACTION both raised to 0.14 (from 0.09/0.05); new LOOP_BOUNDARY_STEP_FRACTION (0.04) added for boundary-cell radius bump — all per the plan's locked geometry specification, sized for legibility on the tightest 9x9 moon grid"
  - "LOOP_OFFSET_FRACTION deleted entirely — its translation role no longer exists once the marker is anchored at the cell rather than translated away from it"
metrics:
  duration: ~45min
  completed: 2026-08-06
status: complete
actuals:
  tokens: 9470
  tasks: 3
  commits: 4
---

# Phase 2 Plan 3: Close G-02-1 — Loop Geometry Is Now an Actual Loop Summary

Rewrote `loopLayer` so the consecutive-repeat marker is a full circle anchored at the repeated cell's own center — connected to the traced line, as D-17 always required — replacing the shipped detached, off-cell, always-+x half-arc that G-02-1 reported.

## What Was Built

**Task 1 — Decoupled the D-27 single-node offset (IN-03).** Added two golden file snapshots (`single-letter-saturn.svg`, `single-letter-moon.svg`) generated from the *unmodified* renderer, then split the previously-shared `LOOP_OFFSET_FRACTION` into a new, independent `SINGLE_NODE_END_OFFSET_FRACTION` (same 0.14 value) so `endMarker`'s one-point D-27 displacement no longer shares a constant with loop geometry. Re-ran the suite and confirmed byte-for-byte zero drift against the goldens before touching anything else.

**Task 2 — Rewrote `loopLayer` as a cell-anchored, travel-perpendicular loop (G-02-1).** TDD: wrote anchor-equality tests first (confirmed RED against the old geometry — 5 failing assertions), then implemented:
- Every loop's path data is `M p A r,r 0 1,1 q A r,r 0 1,1 p` — two equal-radius arc commands that literally begin and end at the repeated cell's center `p`, making connectedness inspectable in the markup itself.
- New `loopDirection(pathModel, repeat)` resolves the bulge direction from the run's REAL travel: the segment entering the run's first point, else the segment leaving its last point, else a fixed `{1,0}` fallback — replacing the dead lookup that always found the zero-length within-run hop and always fell back to `+x` (WR-01, the root cause of the reported "always drifts +x" symptom).
- A centre-ward sign rule (`applyCentreWardSign`) picks whichever of the two valid perpendiculars curls toward the viewBox interior, so large nested loops don't clip at the frame edge.
- Nesting (D-18) and boundary handling (D-19) now vary radius only — `r_i = baseRadius + boundaryStep + i * nestStep` — the anchor never moves.
- Deleted `LOOP_OFFSET_FRACTION`; raised `LOOP_RADIUS_FRACTION`/`LOOP_NEST_STEP_FRACTION` to 0.14; added `LOOP_BOUNDARY_STEP_FRACTION` (0.04).
- Both worked-example anchors from the plan's locked spec (CLARITÉ/jupiter, BKT RISES/saturn) reproduced to the exact byte.

**Task 3 — Byte-pinned repeat-carrying loop geometry across all seven kameas (IN-04).** Added a second `describe.each(PLANETS)` matrix in `test/determinism.test.js` using `'BKT RISES'` (digits 2,2,2,9,1 on every planet — planet-independent repeat structure), snapshotting to seven new `matrix-repeat-<planet>.svg` files and asserting exactly two `sigil-loop` elements per case. The prior matrix statement (`'I WILL SUCCEED'`) has zero consecutive repeats, so none of its seven snapshots had ever exercised `loopLayer` — this closes that coverage hole at every kamea order, including the tightest (9x9 moon).

## Verification Performed

- `npx vitest run`: 184/184 tests pass, 0 skipped.
- `npm run typecheck` and `npm run lint`: both exit 0.
- Renderer-only guard: `git diff --exit-code -- src/path/buildPath.js src/render/json.js src/generate.js` is clean — the fix touched only `src/render/svg.js` and the three named test files, as the diagnosis required.
- Every pre-existing committed snapshot (all seven `matrix-*.svg`, `worked-example.svg`, `worked-example.working.json`, both `.snap` files) is byte-identical — confirmed via `git diff --exit-code`.
- Re-running the suite a second time writes zero new snapshots (idempotent, clean working tree).
- Human legibility check performed: rendered `matrix-repeat-moon.svg`, `matrix-repeat-saturn.svg`, and `CLARITÉ`/jupiter to PNG via `rsvg-convert` with an inspection stylesheet. Confirmed all three: (1) each repeat marker reads as a closed circle with a visible interior, not a notch or half-arc; (2) each loop visibly touches the sigil's traced line at the cell; (3) on the two-loop cases (moon, saturn) the nested loops are individually countable, not merged. This is the exact check that originally produced G-02-1's UAT failure — it now passes.

## Deviations from Plan

None — plan executed exactly as written, including the exact worked-example byte values specified in the "Locked geometry specification" section.

## Known Stubs

None.

## Threat Flags

None — this plan opens no new trust boundary or text-into-markup path; every value `loopLayer` emits is a number produced by the existing `roundGeometry`/`formatCoord` single-rounding-point contract. See the plan's `<threat_model>` for the full STRIDE register (all four threats already mitigated or accepted, no new register entries required).

## Self-Check: PASSED

- `src/render/svg.js` — FOUND
- `test/determinism.test.js` — FOUND
- `test/render/svg.test.js` — FOUND
- `test/e2e/phase2-tracer.test.js` — FOUND
- `test/__file_snapshots__/single-letter-saturn.svg` — FOUND
- `test/__file_snapshots__/single-letter-moon.svg` — FOUND
- `test/__file_snapshots__/matrix-repeat-saturn.svg` — FOUND
- `test/__file_snapshots__/matrix-repeat-jupiter.svg` — FOUND
- `test/__file_snapshots__/matrix-repeat-mars.svg` — FOUND
- `test/__file_snapshots__/matrix-repeat-sun.svg` — FOUND
- `test/__file_snapshots__/matrix-repeat-venus.svg` — FOUND
- `test/__file_snapshots__/matrix-repeat-mercury.svg` — FOUND
- `test/__file_snapshots__/matrix-repeat-moon.svg` — FOUND
- commit `a549906` (Task 1) — FOUND
- commit `3dd6b7c` (Task 2 RED) — FOUND
- commit `44840f9` (Task 2 GREEN) — FOUND
- commit `550081f` (Task 3) — FOUND
