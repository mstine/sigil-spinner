---
phase: 01-first-sigil-end-to-end
plan: 02
subsystem: core-pipeline
tags: [node, esm, svg, kamea, pythagorean-numerology, cli, parseargs]

# Dependency graph
requires:
  - phase: 01-01
    provides: "src/data/kamea.js cellForNumber/gridSize resolvers and src/data/pythagorean.js toPythagoreanDigit, both locked and tested"
provides:
  - "src/errors.js — SigilError taxonomy (D-15) with stable .code; E_EMPTY_SEQUENCE and E_UNKNOWN_PLANET"
  - "src/text/normalize.js — normalize(statement) strikes vowels/repeats, keeps first occurrence, tags every struck character with a reason (CONS-01)"
  - "src/render/coords.js — single shared cellSize/cellCenter/formatCoord transform, coordinates rounded exactly once (Pitfall 10, D-07)"
  - "src/path/buildPath.js — buildPath() returns a plain, JSON-serializable, renderer-agnostic PathModel (PATH-01, PATH-03)"
  - "src/render/svg.js — renderSvg() composes path/node/start/end layers in fixed order, fully CSS-stylable, id-free, opt-in title (REND-01, D-05, D-06, D-08, D-16)"
  - "src/render/escapeXml.js — five-entity XML escape used only for the title element"
  - "src/generate.js — generateSigil(statement, planet, options) orchestrator returning { svg, working } (D-13, INT-01)"
  - "src/index.js — public library entry (generateSigil, SigilError)"
  - "bin/sigil-spinner.js — thin CLI, parseArgs-based, stdout-only artifact (INT-02)"
affects: [01-03]

# Actuals (#2632)
actuals:
  tokens: 10200
  tasks: 2
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Pipe-and-filter pipeline: normalize -> encode -> cellForNumber -> buildPath -> renderSvg, wired only inside generate.js (the sole cross-boundary importer)"
    - "Renderer-agnostic PathModel (plain JSON-serializable object) as the seam between the symbolic pipeline and any renderer (SVG now, JSON in 01-03)"
    - "Single shared coordinate transform (cellSize/cellCenter/formatCoord) — every rendered coordinate rounds exactly once, at one call site"
    - "Per-layer SVG composition: renderSvg assembles independent layer functions (path, nodes, start, end) in one fixed, documented order"
    - "SigilError with stable .code, never message-text branching; CLI and library share identical error guarantees"
    - "All paint attributes are var(--sigil-*, <fallback>) references or 'none' — zero style= attributes, zero id attributes"

key-files:
  created:
    - src/errors.js
    - src/text/normalize.js
    - src/render/coords.js
    - src/render/svg.js
    - src/render/escapeXml.js
    - src/path/buildPath.js
    - src/generate.js
    - src/index.js
    - bin/sigil-spinner.js
    - test/text/normalize.test.js
    - test/path/buildPath.test.js
    - test/render/coords.test.js
    - test/render/svg.test.js
    - test/e2e/saturn-tracer.test.js
  modified:
    - src/data/kamea.js
    - test/data/kamea.test.js

key-decisions:
  - "Migrated kamea.js's two unknown-planet/unknown-set guards from RangeError to SigilError(E_UNKNOWN_PLANET) per D-15/plan instruction; the out-of-range-digit guard stays RangeError (not a planet/set problem)."
  - "renderSvg's RenderOptions carries both `title` and `statement` — generate.js merges the caller's options with the actual statement argument before calling renderSvg, so the renderer's public signature stays a plain options object rather than a third positional parameter."
  - "Marker geometry (node radius, start radius, end-bar length) derives from cellSize(order) via fixed fractions (0.06/0.1/0.32) defined as module constants in svg.js — never a hardcoded pixel unit, never recomputed cell size."
  - "PathModel point field for the encoded digit is named `n`, matching ARCHITECTURE.md Pattern 2's example shape exactly."

patterns-established:
  - "Pattern: renderSvg's four layers (pathLayer, nodeLayer, startMarker, endMarker) are independent pure functions returning markup fragments; renderSvg only assembles them in fixed order — Phase 3's grid/glyph layers slot into the same seam without touching existing layers."
  - "Pattern: coordinate rounding happens exactly once, inside render/coords.js's cellCenter(); formatCoord only formats already-rounded numbers — no module re-rounds or recomputes cell geometry independently."

requirements-completed: [CONS-01, PATH-01, PATH-03, REND-01, INT-01]

coverage:
  - id: D1
    description: "A single CLI invocation (sigil-spinner \"I WILL SUCCEED\" --planet saturn) writes a self-contained, viewBox-based, class-hooked SVG to stdout and nothing else"
    requirement: "INT-02"
    verification:
      - kind: e2e
        ref: "test/e2e/saturn-tracer.test.js#returns an svg with the fixed viewBox, sigil/sigil--saturn classes, and a path layer"
        status: pass
      - kind: other
        ref: "node bin/sigil-spinner.js \"I WILL SUCCEED\" --planet saturn | grep -q 'class=\"sigil sigil--saturn\"'"
        status: pass
    human_judgment: false
  - id: D2
    description: "normalize() strikes vowels and repeats, keeps first occurrence, preserves order, and tags every struck character with a reason so nothing is silently discarded"
    requirement: "CONS-01"
    verification:
      - kind: unit
        ref: "test/text/normalize.test.js#strikes vowels and repeats, keeping first occurrence, for \"I WILL SUCCEED\""
        status: pass
      - kind: unit
        ref: "test/text/normalize.test.js#tags every struck character with a non-empty reason"
        status: pass
    human_judgment: false
  - id: D3
    description: "buildPath() returns a plain, JSON-serializable, renderer-agnostic PathModel with start/end markers and no deduplication of revisited cells"
    requirement: "PATH-01"
    verification:
      - kind: unit
        ref: "test/path/buildPath.test.js#keeps the twice-visited cell (1,0) as two distinct points, not deduplicated"
        status: pass
      - kind: unit
        ref: "test/path/buildPath.test.js#survives a JSON round trip unchanged"
        status: pass
    human_judgment: false
  - id: D4
    description: "generateSigil(statement, planet, options) is importable from src/index.js and returns { svg, working } from one call, deterministically"
    requirement: "INT-01"
    verification:
      - kind: e2e
        ref: "test/e2e/saturn-tracer.test.js#is deterministic — two identical calls return byte-identical svg strings"
        status: pass
      - kind: e2e
        ref: "test/e2e/saturn-tracer.test.js#returns an object with a string svg and a JSON-serializable working"
        status: pass
    human_judgment: false
  - id: D5
    description: "The sigil carries a start circle, an end bar, and a node at every visited cell under the D-08 class taxonomy, fully CSS-stylable with zero inline style/id/bare-color attributes"
    requirement: "REND-01"
    verification:
      - kind: unit
        ref: "test/render/svg.test.js#emits exactly five sigil-node elements, including both at the twice-visited cell"
        status: pass
      - kind: unit
        ref: "test/render/svg.test.js#every stroke/fill attribute is a var() reference with a fallback, or none"
        status: pass
      - kind: unit
        ref: "test/render/svg.test.js#assembles layers in the fixed order: path, then nodes, then start, then end"
        status: pass
    human_judgment: false
  - id: D6
    description: "The intention statement is absent from the SVG by default and only appears, XML-escaped, when the caller opts in via { title: true } (D-16)"
    requirement: "PATH-03"
    verification:
      - kind: unit
        ref: "test/render/svg.test.js#omits the statement entirely when the title option is absent"
        status: pass
      - kind: unit
        ref: "test/render/svg.test.js#embeds the XML-escaped statement when the title option is enabled"
        status: pass
    human_judgment: false

duration: 40min
completed: 2026-08-04
status: complete
---

# Phase 1 Plan 2: Tracer and Sigil Anatomy Summary

**End-to-end `sigil-spinner "I WILL SUCCEED" --planet saturn` pipeline — normalize, encode, kamea lookup, PathModel, coordinate transform, layered SVG with start/end/node anatomy, opt-in title — all wired through one deterministic `generateSigil()` call.**

## Performance

- **Duration:** ~40 min
- **Started:** 2026-08-04T21:56:00Z
- **Completed:** 2026-08-04T22:05:22Z
- **Tasks:** 2 (1 tracer, 1 TDD anatomy task)
- **Files modified:** 17

## Accomplishments
- A single CLI invocation turns `"I WILL SUCCEED"` + `saturn` into a self-contained, viewBox-based, class-hooked inline SVG on stdout — and the library call (`generateSigil`) returns the identical SVG plus a full JSON-serializable `working` object.
- Every architectural boundary from `ARCHITECTURE.md` was exercised by a real call: `text/normalize.js` never imports `data/kamea.js`; `path/buildPath.js` emits zero markup tokens; `render/svg.js` never recomputes coordinates outside `cellSize`/`cellCenter`; `bin/sigil-spinner.js` imports only `src/index.js`.
- Sigil anatomy under TDD: a `sigil-node` circle at every visited cell (Saturn's cell (1,0) legitimately appears twice, un-deduplicated), a `sigil-start` circle, and a `sigil-end` bar drawn perpendicular to the incoming segment — all derived from `cellSize(order)` via fixed fractions, never a hardcoded pixel constant.
- Determinism proven with a byte-equality assertion (not just "ran it twice, looked the same"): two identical `generateSigil` calls and two identical CLI invocations produce byte-for-byte identical SVG.
- Zero inline `style=` attributes, zero `id` attributes, zero bare color literals — every paint attribute is `var(--sigil-*, <fallback>)` or `none`.
- The intention statement is absent from the SVG by default (D-16's release-the-intention posture) and only appears, XML-escaped via a hand-rolled 5-entity `escapeXml()`, when the caller passes `{ title: true }`.
- `SigilError` taxonomy (D-15) lands with a stable `.code`; `kamea.js`'s unknown-planet/unknown-set guards were migrated from bare `RangeError` onto it, so the CLI and library now give identical, code-branchable error guarantees for `E_UNKNOWN_PLANET` and `E_EMPTY_SEQUENCE`.

## Task Commits

Each task was committed atomically (Task 2 followed the RED/GREEN TDD cycle per its `tdd="true"` marker):

1. **Task 1: End-to-end "statement to Saturn sigil SVG" — one path, every layer** - `6336c67` (feat) — tracer slice; re-verified end-to-end before expansion per the tracer feedback gate, then proceeded autonomously (auto-chain active).
2. **Task 2: Sigil anatomy — start circle, end bar, visited-cell nodes, opt-in title** - `5b33b06` (test, RED — failing anatomy assertions against the tracer's path-only renderer) then `0bac0f1` (feat, GREEN — anatomy implemented, all tests pass).

**Plan metadata:** (this commit) `docs(01-02): complete Tracer and Sigil Anatomy plan`

_Note: Task 2 is a TDD task — two commits (test → feat); no refactor commit was needed, the GREEN implementation was already clean._

## Files Created/Modified
- `src/errors.js` - `SigilError` class + `E_EMPTY_SEQUENCE`/`E_UNKNOWN_PLANET` code constants (D-15)
- `src/data/kamea.js` - unknown-planet/unknown-set guards migrated from `RangeError` to `SigilError(E_UNKNOWN_PLANET)`
- `src/text/normalize.js` - `normalize(statement)` — strike vowels/repeats, keep first occurrence, tag every struck character with a reason (CONS-01)
- `src/render/coords.js` - `cellSize`/`cellCenter`/`formatCoord` — the single shared coordinate transform, rounded once (Pitfall 10, D-07)
- `src/path/buildPath.js` - `buildPath()` — plain, JSON-serializable PathModel, zero markup (Anti-Pattern 1)
- `src/render/svg.js` - `renderSvg()` — four fixed-order layers (path, nodes, start, end), fully CSS-stylable, id-free, opt-in title
- `src/render/escapeXml.js` - five-entity XML escape, used only for the title element
- `src/generate.js` - `generateSigil()` orchestrator — the only module importing across `text/`, `data/`, `path/`
- `src/index.js` - public library entry (`generateSigil`, `SigilError`)
- `bin/sigil-spinner.js` - thin CLI (`node:util.parseArgs`, stdout-only artifact, stderr + nonzero exit on error)
- `test/text/normalize.test.js`, `test/path/buildPath.test.js`, `test/render/coords.test.js`, `test/render/svg.test.js`, `test/e2e/saturn-tracer.test.js` - full pipeline test coverage
- `test/data/kamea.test.js` - updated the two unknown-planet/unknown-set assertions to expect `SigilError` (see Deviations)

## Decisions Made
- **Marker geometry fractions:** node radius `0.06 * cellSize`, start-marker radius `0.1 * cellSize`, end-bar length `0.32 * cellSize` — chosen as small, visually distinct constants within the fixed 100×100 viewBox; documented as module constants in `src/render/svg.js` per CONTEXT.md's "Claude's Discretion" on precise marker geometry.
- **RenderOptions carries `statement`:** rather than adding a third positional parameter to `renderSvg(pathModel, options)`, `generate.js` merges the caller's options with the actual statement argument (`{ ...options, statement }`) before calling the renderer — keeps the renderer's public signature a single options object.
- **PathModel digit field named `n`:** matches `ARCHITECTURE.md` Pattern 2's example shape exactly, rather than inventing a different field name.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated test/data/kamea.test.js to expect SigilError instead of RangeError**
- **Found during:** Task 1 (SigilError migration)
- **Issue:** The plan explicitly instructs migrating `kamea.js`'s unknown-planet/unknown-set guards from `RangeError` to `SigilError(E_UNKNOWN_PLANET)` (D-15), but `test/data/kamea.test.js` (written in plan 01-01, before `SigilError` existed) asserted `toThrow(RangeError)` for both guards. Left unchanged, the migration would have broken two passing tests from the prior plan.
- **Fix:** Updated the two assertions to `toThrow(SigilError)` and added `.code === 'E_UNKNOWN_PLANET'` checks; the separate out-of-range-digit assertion (still `RangeError`, per the plan) was left untouched.
- **Files modified:** test/data/kamea.test.js
- **Verification:** `npm test` — all 86 tests pass, including the updated kamea guard tests.
- **Committed in:** `6336c67` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (blocking — necessary consequence of the plan's own explicit migration instruction)
**Impact on plan:** No scope creep; this was the only way to keep the D-15 migration from breaking prior-plan tests.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `generateSigil()`, `SigilError`, and the full `text/ -> data/ -> path/ -> render/` pipeline are locked and tested; plan 01-03 can build the JSON "working" renderer and the full D-14 field set on top of this foundation without touching the pipeline's shape.
- `PathModel` is confirmed renderer-agnostic in structure (no markup tokens, survives a JSON round trip) — the PATH-03 "unclassified" probe from the plan's Flagged Assumptions is now backed by real evidence, though the plan itself notes full "consumed identically" proof waits on 01-03's JSON renderer existing.
- No blockers carried forward.

---
*Phase: 01-first-sigil-end-to-end*
*Completed: 2026-08-04*

## Self-Check: PASSED

All 14 created/modified source and test files verified present on disk; all 3 task commit hashes (`6336c67`, `5b33b06`, `0bac0f1`) verified present in git history.
