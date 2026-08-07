---
phase: 03-themeable-embeddable-layers
plan: 01
subsystem: rendering
tags: [svg, unicode, css-custom-properties, cli, node-util-parseargs, vitest-snapshots]

# Dependency graph
requires:
  - phase: 02-every-planet-every-statement
    provides: all seven kameas locked and byte-pinned; renderSvg layer-array seam anticipating grid/glyph layers; SigilError taxonomy
provides:
  - Opt-in planetary glyph layer (REND-04) — <text class="sigil-glyph"> at the head of renderSvg's layer array, themed via four new --sigil-glyph-* custom properties
  - The whole Phase 3 option seam, proven end to end on one capability — CLI options object (D-46), library-side resolveOptions() validation with E_INVALID_OPTION (D-47), and a `render` block in the JSON working (D-48)
  - Generalized, table-driven resolveOptions() in src/generate.js ready for curve (03-03) and idPrefix (03-04) to extend as one-line additions
  - README "CSS Custom Properties" theming section with a D-42 mechanical drift guard (every var(--sigil-*) emitted must appear in the table)
affects: [03-02-grid-layer, 03-03-curve-rendering, 03-04-id-namespacing-and-finalization]

# Actuals (#2632)
actuals:
  tokens: 15500
  tasks: 3
  commits: 4

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Single declarative KNOWN_OPTIONS table in generate.js, iterated once by resolveOptions() — a later option (curve, idPrefix) is a one-line table addition, not a new branch"
    - "Internally-supplied render data spread LAST ({ ...resolvedOptions, statement }) so a caller can never override it under the same key"
    - "Scoped guard regexes (STYLE_ATTR, PAINT_ATTRS + paintAttrValues helper) for D-42 enforcement tests, avoiding bare-substring false positives inside <title>"

key-files:
  created:
    - src/render/glyphs.js
    - test/e2e/phase3-glyph-tracer.test.js
    - test/render/glyphs.test.js
    - test/__file_snapshots__/matrix-glyph-{saturn,jupiter,mars,sun,venus,mercury,moon}.svg
  modified:
    - src/errors.js
    - src/generate.js
    - src/render/svg.js
    - src/render/json.js
    - bin/sigil-spinner.js
    - test/determinism.test.js
    - test/render/svg.test.js
    - test/render/json.test.js
    - test/cli/cli.test.js
    - README.md
    - test/__file_snapshots__/worked-example.working.json

key-decisions:
  - "Task 1 built resolveOptions() as the generalized, table-driven shape Task 2 was scoped to test — no production code changes were needed in Task 2, only pinning coverage (glyphs.test.js, cli.test.js option-validation tests)"
  - "VARIATION_SELECTOR_15 constant holds the literal U+FE0E character rather than a \\uFE0E escape, matching the repo's existing convention of raw-literal non-ASCII characters in source (src/text/fold.js)"

patterns-established:
  - "Guard-test helper paintAttrValues(svg, attr) + PAINT_ATTRS array — scoped attribute-value extraction for D-42/D-43 enforcement tests, reusable by 03-02's grid-layer guards"
  - "sevenPlanetPaths() test helper builds a worked-example PathModel for all seven planets from one digit sequence — reusable pattern for any future cross-planet guard test"

requirements-completed: [REND-04]

coverage:
  - id: D1
    description: "--glyph works end to end through both the library (generateSigil(statement, planet, { glyph: true })) and the CLI (--glyph flag); glyph layer sits at the head of renderSvg's layer array, above sigil-path (D-39)"
    requirement: "REND-04"
    verification:
      - kind: e2e
        ref: "test/e2e/phase3-glyph-tracer.test.js — full behavior suite (12 tests)"
        status: pass
      - kind: unit
        ref: "test/render/svg.test.js#assembles layers in the fixed order with glyph on"
        status: pass
    human_judgment: false
  - id: D2
    description: "Closed seven-entry PLANET_GLYPHS map (planet -> cited code point + U+FE0E), presentation data in src/render/glyphs.js, D-37 layer boundary respected (not in src/data/, no cross-layer import)"
    requirement: "REND-04"
    verification:
      - kind: unit
        ref: "test/render/glyphs.test.js — full suite (map shape, code-point pinning, VS15, distinctness, no XML-reserved characters, frozen)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Option validation lives in the library: E_INVALID_OPTION for a wrong-typed known option (message + structured .details), unknown keys ignored, undefined treated as absent, CLI adds zero validation of its own (INT-04)"
    requirement: "REND-04"
    verification:
      - kind: unit
        ref: "test/cli/cli.test.js#Option validation — E_INVALID_OPTION and library/CLI parity (D-47)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Seven-planet glyph determinism matrix — byte-equal across two calls, exactly one sigil-glyph per planet, seven mutually distinct outputs, committed matrix-glyph-<planet>.svg snapshots"
    requirement: "REND-04"
    verification:
      - kind: unit
        ref: "test/determinism.test.js#Determinism matrix — glyph — %s (REND-04, INT-03)"
        status: pass
    human_judgment: false
  - id: D5
    description: "README CSS Custom Properties theming table (5 frozen + 4 glyph rows), font-coverage disclosure, geometry escape hatch; every --sigil-* name emitted in glyph mode appears in the table (D-42 mechanical drift guard)"
    requirement: "REND-04"
    verification:
      - kind: unit
        ref: "test/render/svg.test.js#every --sigil-* property emitted in glyph mode ... appears in the README theming table (D-42)"
        status: pass
    human_judgment: false

duration: 15min
completed: 2026-08-07
status: complete
---

# Phase 3 Plan 1: Themeable, Embeddable Layers — Glyph Tracer Summary

**Opt-in planetary glyph layer proving the whole Phase 3 option seam end to end — CLI flag, library validation (E_INVALID_OPTION), renderSvg layer-array head insertion, and a new `render` block in the JSON working — with zero default-output SVG bytes changed.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-08-06T23:47:02Z
- **Completed:** 2026-08-07T00:01:52Z
- **Tasks:** 3 (Task 1 tracer, TDD RED+GREEN; Task 2 hardening, TDD; Task 3 matrix + docs)
- **Files modified:** 22 (4 created source/test modules, 7 new snapshot files, 11 modified)

## Accomplishments

- `--glyph` works end to end on all seven planets through both `generateSigil()` and the CLI, rendering `<text class="sigil-glyph">` behind the traced sigil (D-39), themed via `--sigil-glyph-fill/-opacity/-size/-font`
- The Phase 3 option seam exists and is proven: `bin/sigil-spinner.js` builds and passes an options object to `generateSigil` for the first time (D-46); `resolveOptions()` validates known options in the library with the new `E_INVALID_OPTION` code and structured `.details` (D-47); the JSON working gains a `render` block recording resolved option values (D-48)
- `src/render/glyphs.js` ships the closed seven-entry `PLANET_GLYPHS` map with every code point cited and VS15 applied uniformly (research Pitfall C), respecting the D-37 render-layer boundary
- Seven-planet glyph determinism matrix committed (`matrix-glyph-<planet>.svg`), plus a mechanical D-42 drift guard proving every `--sigil-*` name the renderer can emit in glyph mode is documented in the new README theming table
- Zero pre-existing `.svg` snapshots changed; exactly one JSON snapshot (`worked-example.working.json`) rebased for the `render` block, as the plan anticipated

## Task Commits

Each task was committed atomically:

1. **Task 1: Tracer — `--glyph` end to end** (TDD) — RED `0d0033f` (test), GREEN `caaa8e4` (feat)
2. **Task 2: Option validation hardening and library/CLI error parity** (TDD, tests only — implementation already generalized in Task 1) — `046131a` (test)
3. **Task 3: Seven-planet glyph determinism matrix and README theming table** — `9c9b44e` (feat)

_TDD tasks produced test → feat commit pairs; Task 2 needed no GREEN commit since Task 1's `resolveOptions()` already satisfied every behavior it specifies._

## Files Created/Modified

- `src/render/glyphs.js` - New render-layer data module: `PLANET_GLYPHS` map, `glyphFor(planet)`
- `src/errors.js` - `E_INVALID_OPTION` domain code (D-47)
- `src/generate.js` - `resolveOptions()` (table-driven validation/defaulting), threads resolved options into `renderSvg`/`toWorking`
- `src/render/svg.js` - `glyphLayer()`, `GLYPH_SIZE_FRACTION`/`GLYPH_ANCHOR` constants, layer-array head insertion (D-39)
- `src/render/json.js` - `render` block appended after `repeats` in the working (D-48)
- `bin/sigil-spinner.js` - `--glyph` flag, options object built and passed as 3rd argument, `E_INVALID_OPTION: 2` in `EXIT_CODES`
- `test/e2e/phase3-glyph-tracer.test.js` - New tracer proving the whole seam
- `test/render/glyphs.test.js` - New unit pins for `PLANET_GLYPHS`/`glyphFor`
- `test/cli/cli.test.js` - Option-validation and CLI/library parity tests
- `test/determinism.test.js` - Fourth seven-planet matrix (glyph mode) + distinctness test
- `test/render/svg.test.js` - Layer-order (D-39) and D-42 guard tests extended to glyph mode across all seven planets
- `test/render/json.test.js` - `render` block key-order and value-reflection tests
- `README.md` - New "CSS Custom Properties" theming section, `--glyph` documented in Usage, `E_INVALID_OPTION` documented in Errors and Exit Codes
- `test/__file_snapshots__/matrix-glyph-{saturn,jupiter,mars,sun,venus,mercury,moon}.svg` - New committed glyph-mode snapshots
- `test/__file_snapshots__/worked-example.working.json` - Rebased for the new `render` block

## Decisions Made

- Task 1 built `resolveOptions()` as the fully generalized, table-driven shape (a single `KNOWN_OPTIONS` map iterated once) rather than a glyph-specific ad hoc guard, so Task 2 required zero production-code changes — only the pinning tests the plan specified.
- `VARIATION_SELECTOR_15` in `src/render/glyphs.js` holds the literal U+FE0E character (not a `︎` escape), matching the codebase's existing convention of embedding raw non-ASCII literals in source (`src/text/fold.js`'s `Æ`/`À`/etc. entries).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Two pre-existing tests broke as a direct consequence of Task 1's own required `render`-key addition (D-48)**
- **Found during:** Task 1, running the plan's own `npx vitest run` verification step
- **Issue:** `test/determinism.test.js`'s key-order assertion expected exactly `['keptTrail', 'repeats']` as the Phase 2 append, and `test/render/json.test.js`'s `buildPipelineResult` helper didn't supply a `render` field — both broke the moment `toWorking()` started emitting the D-48 `render` block every plan calls for.
- **Fix:** Updated the key-order assertion to `['keptTrail', 'repeats', 'render']`; updated `buildPipelineResult` to pass `render: { glyph: false, title: false }` matching real `generate.js` usage; regenerated the one affected inline snapshot (`test/render/__snapshots__/json.test.js.snap`).
- **Files modified:** test/determinism.test.js, test/render/json.test.js, test/render/__snapshots__/json.test.js.snap
- **Verification:** Full suite green after the fix; both files are outside Task 1's `<files>` list but the breakage was a mechanical, unavoidable consequence of Task 1's own in-scope work.
- **Committed in:** caaa8e4 (Task 1 GREEN commit)

**2. [Rule 3 - Blocking] `typecheck` failures from `unknown`-typed values not narrowing through a dynamic `typeof` comparison**
- **Found during:** Task 1, running `npm run typecheck`
- **Issue:** `resolveOptions`'s `typeof value !== expected` guard doesn't let TypeScript narrow `value` from `unknown` to `boolean` (since `expected` is a runtime string, not a literal type); several test-file call sites passing intentionally wrong-typed options (`{ glyph: 'yes' }`, `{ someFutureOption: 42 }`) also failed structural typing against `GenerateOptions`.
- **Fix:** Added an explicit `/** @type {boolean} */` cast in `resolveOptions` (with a doc comment explaining why); added `/** @type {any} */` casts at the deliberately-wrong-typed test call sites, matching the existing convention already used elsewhere in `test/cli/cli.test.js`.
- **Files modified:** src/generate.js, test/e2e/phase3-glyph-tracer.test.js
- **Verification:** `npm run typecheck` exits 0.
- **Committed in:** caaa8e4 (Task 1 GREEN commit)

**3. [Rule 3 - Blocking] `eslint no-undef` on `URL` global in a new guard test**
- **Found during:** Task 3, running `npm run lint`
- **Issue:** Used `new URL('../../README.md', import.meta.url)` to locate the README from a test file; the project's `eslint.config.js` declares an explicit, minimal globals allowlist that does not include `URL`.
- **Fix:** Replaced with the existing repo idiom already used by every other test file needing a repo-relative path (`fileURLToPath(import.meta.url)` + `path.dirname`/`path.join`) rather than expanding the eslint globals allowlist.
- **Files modified:** test/render/svg.test.js
- **Verification:** `npm run lint` exits 0.
- **Committed in:** 9c9b44e (Task 3 commit)

---

**Total deviations:** 3 auto-fixed (all Rule 3 — blocking issues required to keep `npx vitest run && npm run typecheck && npm run lint` green, per every task's own `<verify>` step). No scope creep — all three were direct, mechanical consequences of the plan's own required changes (the D-48 `render` block; TypeScript's inability to narrow through a dynamic string comparison; the project's explicit globals allowlist).
**Impact on plan:** None of the three altered behavior described in the plan; all were test-infrastructure or type-annotation fixes required to satisfy acceptance criteria the plan itself specifies.

## Issues Encountered

None beyond the three auto-fixed deviations above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `resolveOptions()`'s single declarative `KNOWN_OPTIONS` table is ready for 03-03 (`curve: boolean`) and 03-04 (`idPrefix: string`) to extend with a one-line addition each — no restructuring needed.
- The `render` block's authored key order (`curve, glyph, idPrefix, title`) has `glyph`/`title` in place; 03-03 and 03-04 insert `curve`/`idPrefix` at their documented positions without moving `render` itself.
- The README "CSS Custom Properties" table and its D-42 mechanical drift guard (`test/render/svg.test.js`) are structured for 03-02 to append six grid rows and 03-04 to finalize — no restructuring, only new rows.
- `renderSvg`'s layer array has `glyphLayer` at its head; 03-02 adds `gridLayer` above it (grid → glyph → path → nodes → start → end → loops, D-39).
- No blockers identified for 03-02 (grid layer), 03-03 (curve rendering), or 03-04 (id namespacing).

---
*Phase: 03-themeable-embeddable-layers*
*Completed: 2026-08-07*
