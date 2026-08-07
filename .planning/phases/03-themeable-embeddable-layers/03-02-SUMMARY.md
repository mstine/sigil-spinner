---
phase: 03-themeable-embeddable-layers
plan: 02
subsystem: rendering
tags: [svg, css-custom-properties, vitest-snapshots, kamea-magic-square]

# Dependency graph
requires:
  - phase: 03-themeable-embeddable-layers
    provides: "03-01's option seam — resolveOptions()/KNOWN_OPTIONS table, glyphLayer() head-of-array insertion pattern, statement-through-options-object precedent — proven end to end before this plan extended it to internally-supplied data"
provides:
  - "The always-present kamea grid layer (REND-03) — gridLayer()/gridLatticeD() in src/render/svg.js, emitting a hidden-by-default <g class=\"sigil-grid\"> in every render for every planet, with one sigil-grid-lines lattice path and order-squared sigil-grid-number elements showing the real magic-square values"
  - "The `kamea` internally-supplied render-option key (D-35) — generate.js calls kameaGrid(canonicalPlanet) and spreads it LAST into the options object passed to renderSvg, so a caller cannot substitute a different square than the one the sigil was traced on"
  - "Six new --sigil-grid-* CSS custom properties, documented in the README theming table (now 15 rows total) with a reveal-recipe paragraph and no --grid CLI flag (D-32, deliberate divergence from .claude/CLAUDE.md's anticipated flag list)"
  - "One reviewed, complete rebase of every existing SVG snapshot (31 files) plus the inline svg.test.js snapshot — programmatically verified to differ from their predecessors by exactly the inserted grid group and nothing else"
  - "test/render/grid.test.js — dedicated edge-coverage suite tracing all six REND-03 edge rows plus backstop B5's mechanical half, across all seven kamea orders"
affects: [03-03-curve-rendering, 03-04-id-namespacing-and-finalization]

# Actuals (#2632)
actuals:
  tokens: 121608
  tasks: 2
  commits: 3

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "gridLatticeD(order): line position = roundGeometry(i * cellSize(order)) via multiplication from the loop index, never accumulated addition — matches cellCenter's existing convention and keeps Venus (100/7) and Moon (100/9) byte-deterministic"
    - "Internally-supplied render-option keys (statement, kamea) spread LAST into the options object passed to renderSvg — a caller-supplied key of the same name is always overwritten, never honored"
    - "Unit tests that build PathModels directly via buildPath (bypassing generate.js) now supply options.kamea themselves via a small render() test helper, since the grid layer is unconditional and has no matrix to read otherwise"

key-files:
  created:
    - test/render/grid.test.js
  modified:
    - src/render/svg.js
    - src/generate.js
    - README.md
    - test/render/svg.test.js
    - test/determinism.test.js (snapshot outputs only — no source changes)
    - test/__file_snapshots__/matrix-*.svg (24 files)
    - test/__file_snapshots__/matrix-glyph-*.svg (7 files)
    - test/__file_snapshots__/single-letter-*.svg (2 files)
    - test/__file_snapshots__/worked-example.svg
    - test/render/__snapshots__/svg.test.js.snap

key-decisions:
  - "The full snapshot rebase (31 .svg files + the inline svg.test.js.snap) happened in Task 1's GREEN commit, not deferred to Task 2, because Task 1's own <verify> step (npx vitest run, full suite) cannot pass while the grid layer is unconditional and the old snapshots still lack it — there is exactly one rebase event across the whole plan either way, just earlier than the plan's task breakdown implied"
  - "README's six grid theming rows and the pre-existing D-42 drift guard's satisfaction were also pulled into Task 1's GREEN commit for the same reason — the guard test (from 03-01) checks every emitted --sigil-* name against the README table, and the grid's six new properties are now emitted unconditionally"
  - "gridLayer casts options.kamea to number[][] with a documented rationale rather than adding a runtime undefined-guard — every real call path is internal (renderSvg is always invoked by generate.js with kamea already computed), so a defensive branch would be dead code, matching perpendicularUnit's existing 'defensive fallback for a case that should not occur' posture in the same file"

patterns-established:
  - "Position-parsing test helpers (parseLatticeLines/parseLatticePositions in grid.test.js) read the emitted d string back into structured horizontal/vertical position arrays, so edge-coverage assertions compare against literal expected arrays rather than recomputing the source formula"

requirements-completed: [REND-03]

coverage:
  - id: D1
    description: "The grid layer is present in every render for every planet, hidden by default via opacity=\"var(--sigil-grid-opacity, 0)\" on a wrapping <g class=\"sigil-grid\">, with no --grid flag and no grid library option (D-32)"
    requirement: "REND-03"
    verification:
      - kind: unit
        ref: "test/render/grid.test.js — describe.each(PLANETS) cardinality + backstop-B5 tests"
        status: pass
      - kind: unit
        ref: "test/render/svg.test.js#renderSvg — grid layer, always present (REND-03, D-32, D-33, D-34, D-39)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The lattice is one sigil-grid-lines path carrying all order+1 horizontal and order+1 vertical lines via multiplication-not-accumulation, each boundary line emitted exactly once, with a literal fill=\"none\" (D-33)"
    requirement: "REND-03"
    verification:
      - kind: unit
        ref: "test/render/grid.test.js#each boundary line is emitted exactly once (edge row 4), #multiplication...byte-stable (edge row 8)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Grid numbers are the kamea's actual magic-square values (1..order^2), centered with text-anchor=\"middle\" dominant-baseline=\"central\", in fixed row-major order matching kameaGrid(planet).flat() exactly (D-34)"
    requirement: "REND-03"
    verification:
      - kind: unit
        ref: "test/render/grid.test.js#grid-number elements are emitted in fixed row-major order (edge row 7), #ASCII digits only (edge row 6)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The kamea grid matrix reaches the renderer through the internally-supplied options.kamea key, spread LAST by generate.js so a caller cannot substitute a different square; src/render/ never imports src/data/kamea.js directly (D-35)"
    requirement: "REND-03"
    verification:
      - kind: unit
        ref: "test/render/svg.test.js#the render layer never imports src/data/kamea.js directly (D-35)"
        status: pass
      - kind: other
        ref: "grep -rnE \"^[[:space:]]*(import|export)[^;]*data/kamea\" src/render/ — returns nothing"
        status: pass
    human_judgment: false
  - id: D5
    description: "Layer order is grid, glyph, path, nodes, start, end, loops (D-39); six new --sigil-grid-* properties are emitted and documented in the README theming table (15 rows total), including the strict-prefix pair --sigil-grid-number-font / --sigil-grid-number-font-size"
    requirement: "REND-03"
    verification:
      - kind: unit
        ref: "test/render/svg.test.js#assembles layers in the fixed order... (D-39), test/render/grid.test.js#README drift + B-E1 strict-prefix tests"
        status: pass
    human_judgment: false
  - id: D6
    description: "Every pre-existing SVG snapshot (31 files) is rebased in one reviewed change, differing from its predecessor by exactly the inserted <g class=\"sigil-grid\">...</g> block and nothing else"
    requirement: "REND-03"
    verification:
      - kind: other
        ref: "programmatic diff-shape check: for each rebased file, stripping the <g class=\"sigil-grid\">...</g> substring from the new content reproduces the old content byte-for-byte (0 files failed)"
        status: pass
    human_judgment: false

duration: 25min
completed: 2026-08-07
status: complete
---

# Phase 3 Plan 2: Themeable, Embeddable Layers — Kamea Grid Layer Summary

**Always-present, CSS-revealable kamea grid layer (lattice + real magic-square numbers) rendered behind the sigil on every output, with the grid matrix reaching the renderer through an internally-supplied, un-overridable options key — and a single reviewed rebase of all 31 existing SVG snapshots.**

## Performance

- **Duration:** 25 min
- **Started:** 2026-08-07T19:11:00Z
- **Completed:** 2026-08-07T19:19:30Z
- **Tasks:** 2 (Task 1: grid layer, TDD RED+GREEN; Task 2: edge-coverage suite + guard extensions + README recipe)
- **Files modified:** 37 (2 source, 2 test source files created/modified, 1 new test file, README, 32 snapshot files)

## Accomplishments

- `gridLayer`/`gridLatticeD` in `src/render/svg.js` emit a hidden-by-default `<g class="sigil-grid">` — one `sigil-grid-lines` lattice path (all `order + 1` horizontal/vertical lines in one `d`, literal `fill="none"`) plus `order²` `sigil-grid-number` text elements showing the real kamea values, in every render for every planet, with no flag (D-32)
- Lattice line positions use `roundGeometry(i * cellSize(order))` — multiplication from the index, never accumulated addition — keeping Venus (100/7) and Moon (100/9) byte-deterministic across runs and platforms (D-33)
- `generate.js` calls `kameaGrid(canonicalPlanet)` and forwards it as the internally-supplied `kamea` render-option key, spread LAST into the options object so a caller-supplied `kamea` key is always overwritten (D-35, T-03-06); `src/render/` still never imports `src/data/kamea.js` directly
- Layer order completed to D-39's full sequence: grid → glyph → path → nodes → start → end → loops
- README theming table grows to 15 rows (6 new `--sigil-grid-*` properties) plus a reveal-recipe paragraph (`--sigil-grid-opacity` on `.sigil-grid`) and an explicit statement that there is no `--grid` flag
- `test/render/grid.test.js` — new dedicated suite tracing all six REND-03 edge-coverage rows (cardinality at both extremes, no double-drawn boundary lines, no empty-grid state, ASCII-digit-only text, fixed row-major order, multiplication-based precision) plus backstop B5's mechanical half, across all seven planets (55 tests)
- All 31 pre-existing `.svg` file snapshots plus the inline `svg.test.js` snapshot rebased in one commit, programmatically verified to differ from their predecessors by exactly the inserted grid group

## Task Commits

Each task was committed atomically:

1. **Task 1: Grid layer — lattice, numbers, and the always-present hidden group** (TDD) — RED `96ff324` (test), GREEN `c22c27f` (feat)
2. **Task 2: Grid assertions across all seven orders, snapshot rebase, and README grid rows** — `8243565` (test)

_Task 1's GREEN commit necessarily included the full snapshot rebase and the README's six new property rows — see Deviations below for why._

## Files Created/Modified

- `src/render/svg.js` - `gridLatticeD(order)`, `gridLayer(pathModel, options)`, `GRID_STROKE_WIDTH_FRACTION`/`GRID_NUMBER_FONT_SIZE_FRACTION` constants, `RenderOptions.kamea` typedef entry, `gridLayer` inserted at the head of `renderSvg`'s layer array
- `src/generate.js` - `kameaGrid` import, `kamea` computed from `canonicalPlanet` and spread last into `renderSvg`'s options
- `README.md` - 6 new `--sigil-grid-*` theming rows (15 total), grid reveal-recipe paragraph, updated "What This Tool Does Not Yet Do"
- `test/render/svg.test.js` - `render()` test helper supplying `options.kamea`; new grid-layer describe block; layer-order tests updated for D-39's completed order; paint-attribute/style guards extended to all seven planets in default mode
- `test/render/grid.test.js` - New dedicated edge-coverage suite (55 tests)
- `test/__file_snapshots__/*.svg` (31 files) - Rebased for the grid group insertion
- `test/render/__snapshots__/svg.test.js.snap` - Rebased inline snapshot

## Decisions Made

- The complete snapshot rebase (31 `.svg` files + the inline snapshot) landed in Task 1's GREEN commit rather than Task 2's, because Task 1's own `<verify>` step runs the full suite and cannot pass while old snapshots lack the now-unconditional grid group — there is still exactly one rebase event across the whole plan, just earlier in the task sequence than the plan's prose implied. Programmatically verified: every rebased file differs from its predecessor by exactly the inserted `<g class="sigil-grid">…</g>` block.
- The README's six grid theming rows landed in Task 1's GREEN commit too, for the identical reason — the pre-existing D-42 drift guard (from 03-01) checks every `--sigil-*` name any default render emits against the README table, and the grid's properties are now emitted unconditionally.
- `gridLayer` casts `options.kamea` to `number[][]` with a documented rationale (every real call path is internal via `renderSvg`, always invoked by `generate.js` with `kamea` already computed) rather than adding a runtime undefined-guard, matching `perpendicularUnit`'s existing "defensive fallback for a case that should not occur under current call sites" posture already established in the same file.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Making the grid layer unconditional (D-32) broke every test that calls `renderSvg` directly without supplying `options.kamea`**
- **Found during:** Task 1, running the plan's own `npx vitest run` verification step (before any test-file fixes)
- **Issue:** `test/render/svg.test.js`'s existing unit tests build `PathModel`s directly via `buildPath` and call `renderSvg(pathModel[, options])` with no `kamea` key, bypassing `generate.js` entirely. Once `gridLayer` unconditionally reads `options.kamea`, every one of those ~23 call sites would throw (`matrix.map` on `undefined`).
- **Fix:** Added a `render(pathModel, options)` test helper that always supplies `options.kamea` via `kameaGrid(pathModel.planet)`, and replaced every bare `renderSvg(...)` call in the test file with it — a direct, unavoidable mechanical consequence of D-32, not a scope change.
- **Files modified:** test/render/svg.test.js
- **Verification:** Full suite green after the fix.
- **Committed in:** `96ff324` (RED, test-only) then unaffected through `c22c27f` (GREEN)

**2. [Rule 3 - Blocking] Every committed `.svg` file snapshot and the inline `svg.test.js` snapshot went stale the moment the grid layer became unconditional**
- **Found during:** Task 1, running `npx vitest run` after implementing `gridLayer` and wiring it into `generate.js`
- **Issue:** All 31 pre-existing `.svg` snapshots (`matrix-*`, `matrix-glyph-*`, `matrix-repeat-*`, `matrix-stroke-*`, `single-letter-*`, `worked-example.svg`) plus one inline snapshot in `svg.test.js.snap` compare byte-for-byte against output that now unconditionally gains a `<g class="sigil-grid">…</g>` block — this was explicitly anticipated by the plan's own Planner Note ("D-32 makes the grid layer unconditional... every committed .svg file snapshot changes in this plan").
- **Fix:** Rebased via `npx vitest run -u`, then verified programmatically (not just by eyeballing a diff) that every one of the 32 rebased files differs from its predecessor by exactly the inserted grid group — stripping that exact substring from the new content reproduces the old content byte-for-byte, for all 32 files, zero exceptions.
- **Files modified:** test/__file_snapshots__/*.svg (31 files), test/render/__snapshots__/svg.test.js.snap
- **Verification:** `git diff test/__file_snapshots__/ | grep '^[+-]' | grep -v '^[+-][+-]' | grep -v 'sigil-grid' | wc -l` returns `0`; full suite green.
- **Committed in:** `c22c27f` (GREEN)

**3. [Rule 3 - Blocking] The pre-existing D-42 README drift guard (from 03-01) started failing once the grid's six new `--sigil-*` properties were emitted unconditionally**
- **Found during:** Task 1, running `npx vitest run` after `gridLayer` began emitting `var(--sigil-grid-*, ...)` references
- **Issue:** `test/render/svg.test.js`'s existing "every `--sigil-*` property emitted ... appears in the README theming table" test (03-01) checks every emitted custom-property name against the README table; the six new grid properties were not yet documented.
- **Fix:** Added the six grid rows to README's theming table using 03-UI-SPEC.md's wording verbatim — the exact content Task 2's own action text specifies, just landing a task earlier than planned.
- **Files modified:** README.md
- **Verification:** D-42 guard test passes for all seven planets; `grep -cE '^\| .--sigil-' README.md` returns `15`, matching Task 2's own acceptance criterion.
- **Committed in:** `c22c27f` (GREEN)

**4. [Rule 3 - Blocking] Two TypeScript narrowing errors surfaced by `npm run typecheck`**
- **Found during:** Task 1, running `npm run typecheck`
- **Issue:** `options.kamea` is typed optional on `RenderOptions` (it is never a caller-facing option), so `gridLayer`'s `matrix.map(...)` failed TS18048 ("possibly undefined"). Separately, a new `it.each` test using inline tuple literals inferred `expectedOrder` as `string | number`, breaking `expectedOrder * expectedOrder`.
- **Fix:** Added a documented `/** @type {number[][]} */` cast in `gridLayer` (every real call path is internal and always supplies `kamea`); rewrote the tuple-based test loop as a properly-typed `it.each(/** @type {[string, number][]} */ ([...]))`.
- **Files modified:** src/render/svg.js, test/render/svg.test.js
- **Verification:** `npm run typecheck` exits 0.
- **Committed in:** `c22c27f` (GREEN)

---

**Total deviations:** 4 auto-fixed (all Rule 3 — blocking issues required to keep `npx vitest run && npm run typecheck && npm run lint` green, per every task's own `<verify>` step). No scope creep — all four were direct, mechanical, and fully anticipated consequences of the plan's own required change (D-32's unconditional grid layer). Notably, deviations 2 and 3 are exactly the work Task 2's action text describes performing ("Rebase every committed .svg file snapshot..."; "Append the six grid rows to the README theming table...") — they simply had to happen inside Task 1's GREEN commit to satisfy Task 1's own verification gate, rather than waiting for Task 2. Task 2 then added the dedicated edge-coverage suite, the layer-order/guard-test extensions, and the reveal-recipe prose paragraph as originally scoped.

**Impact on plan:** None of the four altered the shipped behavior described in the plan; all were test-infrastructure fixes, a documentation drift-guard satisfaction, and type-annotation fixes required by the plan's own mandatory D-32 change.

## Issues Encountered

**Command-methodology note (not a deviation):** the plan's Task 1 acceptance criteria specify `grep -c 'class="sigil-grid-number"'` to count grid-number occurrences (expecting `9` for saturn, `81` for moon). Since the CLI emits the entire SVG as a single line, `grep -c` (which counts matching *lines*, not occurrences) returns `1` regardless of how many matches exist within that line — this is a quirk of the literal command syntax, not a defect in the implementation. Verified the actual byte content is correct using `grep -o 'class="sigil-grid-number"' | wc -l`, which returns the expected per-planet counts (9, 16, 25, 36, 49, 64, 81) exactly.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- The grid layer's `--sigil-grid-*` properties join the frozen theming surface at 15 documented rows total; 03-03 (curve rendering) and 03-04 (id namespacing) add no new grid-layer work, only their own option surfaces.
- `renderSvg`'s layer array now has `gridLayer` and `glyphLayer` both at its head in D-39's completed order; 03-03's curve branch modifies only `pathLayer`'s `d` attribute and does not touch this ordering.
- The `kamea` internally-supplied render-option key precedent (spread LAST, never caller-overridable) is now established alongside `statement` — 03-04's `idPrefix` follows the same options-threading pattern already proven twice.
- No blockers identified for 03-03 (curve rendering) or 03-04 (id namespacing and finalization).

## Self-Check: PASSED

All claimed files verified present on disk (src/render/svg.js, src/generate.js, README.md, test/render/svg.test.js, test/render/grid.test.js, 31 rebased .svg snapshots, test/render/__snapshots__/svg.test.js.snap, this SUMMARY). All claimed commit hashes verified present in git history (96ff324, c22c27f, 8243565).

---
*Phase: 03-themeable-embeddable-layers*
*Completed: 2026-08-07*
