---
phase: 05-publish-ready-source
plan: 01
subsystem: testing
tags: [documentation-integrity, drift-guard, vitest, jsdoc-comments]

# Dependency graph
requires: []
provides:
  - "test/citations.test.js — mechanical citation-integrity checker (R1 path/heading resolution, R2 file-scoped label backing, 34-site anti-appeasement floor)"
  - "33 repaired citation sites across 12 shipped-source files, all resolving to real headings in the archived v1.0 research/phase documents"
affects: [publish-ready-source, published-package]

# Actuals (#2632) — pairs with the plan's estimate to calibrate future estimates.
actuals:
  tokens: 8822
  tasks: 3
  commits: 3

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Comment-blob extraction with per-character line mapping — normalizes multi-line JSDoc/// comments into one contiguous string while preserving a line-number back-reference for reporting"
    - "Quote-span exclusion — text inside a matched double-quoted excerpt is excluded from further token/label scanning, so a quoted heading that happens to mention a filename or label as part of its own title (e.g. a Planner Note heading naming '03-RESEARCH.md') isn't mistaken for a fresh citation site"
    - "Enclosing-parenthetical citation window with a ±200-char fallback — scopes which quoted excerpt backs which path token when multiple citations sit close together"

key-files:
  created:
    - test/citations.test.js
  modified:
    - src/data/kamea.js
    - src/generate.js
    - src/index.js
    - src/path/buildPath.js
    - src/render/coords.js
    - src/render/curve.js
    - src/render/glyphs.js
    - src/render/json.js
    - src/render/svg.js
    - src/text/fold.js
    - src/text/normalize.js
    - bin/sigil-spinner.js

key-decisions:
  - "Citation window is the enclosing parenthetical when the token sits inside one that closes past it, else a ±200-char fallback span — handles both single citations and dense multi-citation sentences without cross-contamination"
  - "Matches inside a quoted excerpt are excluded from further R1/R2 scanning, since a real heading (curve.js's Planner Note) can legitimately mention a filename as part of its own title"
  - "Rewrote svg.js's `style=\"\"` code example to `style=''` — the literal adjacent double-quotes were corrupting the checker's quote-pairing for the real Pitfall 8 citation quoted later in the same comment blob; comment-only, no citation content changed"
  - "Site 25 (svg.js Pitfall 5, loop-marker geometry) and site 12 (buildPath.js Pitfall 5, degenerate inputs) now cite two distinct, unrelated documents rather than sharing a bare label — the exact collision MAINT-01 exists to close"

patterns-established:
  - "Pattern: fully-qualified citation form is `\"<verbatim heading excerpt>\" in <fully-qualified .planning/ path>` inside one parenthetical or sentence window"

requirements-completed: [MAINT-01]

coverage:
  - id: D1
    description: "Citation-integrity checker (test/citations.test.js) enforces R1 (path resolves + heading-matching quote) and R2 (bare label backed file-scoped) with a 34-site anti-appeasement floor"
    requirement: "MAINT-01"
    verification:
      - kind: unit
        ref: "test/citations.test.js#Citation integrity (MAINT-01) > has zero findings across src/ and bin/, and at least the plan-time-enumerated site count"
        status: pass
      - kind: unit
        ref: "test/citations.test.js#Citation integrity (MAINT-01) > produces byte-identical findings output across two runs"
        status: pass
    human_judgment: false
  - id: D2
    description: "33 stale/ambiguous citation sites repaired across 12 shipped-source files, each verbatim-quoted excerpt checked against the live archived document at plan time"
    requirement: "MAINT-01"
    verification:
      - kind: unit
        ref: "npx vitest run test/citations.test.js (zero findings post-repair)"
        status: pass
      - kind: unit
        ref: "npm test (1455 tests, no behavior change)"
        status: pass
      - kind: other
        ref: "npm run typecheck (tsc --allowJs --checkJs --noEmit, exit 0)"
        status: pass
      - kind: other
        ref: "npm run lint (eslint ., exit 0)"
        status: pass
    human_judgment: false

duration: 15min
completed: 2026-08-08
status: complete
---

# Phase 05 Plan 01: Citation Repair and Integrity Checker Summary

**Repaired 33 stale/ambiguous documentation citations across 12 source files and committed `test/citations.test.js`, a mechanical checker that fails the suite if this rot recurs.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-08-08T18:31:40Z
- **Completed:** 2026-08-08T18:46:32Z
- **Tasks:** 3
- **Files modified:** 13 (12 source files + 1 new test file)

## Accomplishments

- Built `test/citations.test.js`: walks every `.js` file under `src/` and `bin/`, extracts comment text (JSDoc blocks and `//` runs joined into one normalized string per blob, with a per-character line-number map for accurate reporting), and enforces:
  - **R1** — every markdown-path token must be fully qualified (`.planning/...` or exactly `README.md`), resolve on disk, and have a quoted excerpt in its citation window matching a real heading in the target file
  - **R2** — every bare `Pitfall N`/`Pattern N`/`Anti-Pattern N` label must be backed, file-scoped, by an R1-valid citation for that exact label somewhere in the same file
  - A 34-site anti-appeasement floor, so deleting citations to "pass" the check fails loudly instead
- Proved the checker has teeth: captured its first failing run on the pre-repair tree, which correctly named all four `bin/sigil-spinner.js` sites (3, 6, 147, 155) and both `src/data/kamea.js` sites (26, 65) — including sites RESEARCH.md's own 30-row table had missed.
- Repaired all 33 sites the plan's Citation Resolution Table enumerated, across `src/data/kamea.js`, `src/generate.js`, `src/index.js`, `src/path/buildPath.js`, `src/render/coords.js`, `src/render/curve.js`, `src/render/glyphs.js`, `src/render/json.js`, `src/render/svg.js`, `src/text/fold.js`, `src/text/normalize.js`, and `bin/sigil-spinner.js` — resolving each to a fully-qualified path under `.planning/milestones/v1.0-research/` or `.planning/milestones/v1.0-phases/.../` with a verbatim quoted heading excerpt.
- Left the one negative control (`src/text/normalize.js:11`, citing `README.md`'s "Letter Handling Rules") untouched — it already resolved correctly.
- Zero behavior change: 1455 tests pass, `tsc --checkJs` exits 0, `eslint` exits 0, no snapshot rebased, `package.json` `dependencies` remains `{}`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Citation checker, red then green on one real file** — `9d05e22` (test)
2. **Task 2: Repair the ARCHITECTURE.md and PITFALLS.md citation sites** — `8d84e3b` (docs)
3. **Task 3: Repair the moved-document and CLI citation sites, close the checker** — `0cce3d4` (docs)

**Plan metadata:** commit pending (this SUMMARY + STATE/ROADMAP/REQUIREMENTS update)

## Files Created/Modified

- `test/citations.test.js` - New mechanical citation-integrity checker (R1 resolution, R2 file-scoped label backing, 34-site floor)
- `src/data/kamea.js` - Sites 1, 2 repaired (Pitfall 1 kamea orientation, Anti-Pattern 2 hardcoded grid literal)
- `src/generate.js` - Sites 3-7 repaired (Internal Boundaries, Anti-Pattern 3 x2, Anti-Pattern 4 x2)
- `src/index.js` - Site 8 repaired (Pattern 3: Thin CLI Over Stable Library API)
- `src/path/buildPath.js` - Sites 9-12 repaired, including the dual Pitfall 7/Pitfall 2 citation and the previously-missed bare Anti-Pattern 1
- `src/render/coords.js` - Site 13 repaired (Pitfall 10, coordinate-scaling)
- `src/render/json.js` - Site 22 repaired (Component Responsibilities)
- `src/render/svg.js` - Sites 23-25 repaired (Pitfall 8, Internal Boundaries, Pitfall 5 loop-marker geometry distinct from buildPath.js's Pitfall 5); one `style=""` → `style=''` code-example edit to fix a quote-parsing collision
- `src/render/curve.js` - Sites 14-19 repaired (STACK.md Alternatives Considered, Patterns 1-3, the dual sign-error Planner Note citation, Pitfall A); reworded one redundant bare in-prose doc-name mention
- `src/render/glyphs.js` - Sites 20-21 repaired/confirmed (Pitfall C, file-scoped bare backing)
- `src/text/fold.js` - Sites 26-28 repaired (Internal Boundaries, Pitfall 1 and Pitfall 3 scoped to 02-RESEARCH.md)
- `src/text/normalize.js` - Site 29 repaired (Internal Boundaries); site 30 (README.md negative control) left unchanged
- `bin/sigil-spinner.js` - Sites 31-32 repaired (Pattern 3, Anti-Pattern 3); sites 33-34 confirmed file-scoped bare backing; line 20's deferred D-12 item confirmed untouched

## Decisions Made

- Citation window resolution: prefer the enclosing parenthetical when the token sits inside one that closes past the token; fall back to a ±200-char span otherwise. This correctly scoped dense multi-citation sentences (e.g. `buildPath.js:45`'s dual Pitfall 7/Pitfall 2 citation) without one token's window bleeding into another's.
- Text inside a matched quoted excerpt is excluded from further R1/R2 token scanning. Without this, `curve.js`'s real Planner Note heading — "Planner Note — a SIGN ERROR in 03-RESEARCH.md's curve code example" — would have its own title text flagged as an unqualified citation, since the heading legitimately names a filename as part of itself.
- `src/render/svg.js`'s illustrative `style=""` code example was rewritten to `style=''`. The literal adjacent double-quote characters were corrupting the checker's quote-pairing regex, causing it to consume the real "Pitfall 8" citation's opening quote as a spurious closing delimiter. This is a comment-only formatting fix with no citation-content change.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Quote-pairing corruption from literal `style=""` code example**
- **Found during:** Task 3, while repairing `src/render/svg.js`'s Pitfall 8 citation
- **Issue:** `src/render/svg.js` line 12 (pre-existing text) contained `` `style=""` `` — two adjacent literal double-quote characters. Once the Pitfall 8 citation was fully quoted later in the same comment blob, the checker's `"([^"]+)"` regex paired the second quote of `style=""` with the opening quote of the real citation, consuming it as a bogus match and leaving the actual "Pitfall 8: ..." excerpt unrecognized.
- **Fix:** Changed the illustrative example to `style=''` (single quotes), preserving the exact same meaning (never emits an inline `style` attribute, empty or otherwise) with no double-quote characters to collide with.
- **Files modified:** `src/render/svg.js`
- **Verification:** `npx vitest run test/citations.test.js` went from 1 remaining finding to 0.
- **Committed in:** `0cce3d4` (Task 3 commit)

**2. [Rule 1 - Bug] Checker needed quote-span exclusion for headings that self-reference a filename**
- **Found during:** Task 3, while repairing `src/render/curve.js`'s sign-error Planner Note citation
- **Issue:** The real target heading is "Planner Note — a SIGN ERROR in 03-RESEARCH.md's curve code example" — its own title contains the string "03-RESEARCH.md". Once quoted verbatim in the citing comment (as required to satisfy R1), the checker's initial implementation would re-scan that quoted text and flag "03-RESEARCH.md" inside the quote as its own unqualified citation site.
- **Fix:** Added `quoteSpans()`/`insideAnySpan()` to `test/citations.test.js`, excluding any token or label match whose start index falls inside an already-matched double-quoted span from further R1/R2 site accounting.
- **Files modified:** `test/citations.test.js`
- **Verification:** `npx vitest run test/citations.test.js` passes with zero findings; the 34-site floor still holds.
- **Committed in:** `0cce3d4` (Task 3 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 - bugs in checker/comment interaction discovered during implementation, not pre-existing runtime bugs)
**Impact on plan:** Both fixes were necessary for the checker to correctly validate real, legitimate citations without false positives. No scope creep — no runtime code path, exported symbol, or emitted byte moved.

## Issues Encountered

- `tsc --allowJs --checkJs --noEmit` initially failed with 23 implicit-`any` errors in the new `test/citations.test.js`, since `tsconfig.json`'s `include` covers `test/**/*.js` under `strict: true`. Resolved by adding full JSDoc type annotations (`@param`, `@returns`, `@type`, and typedefs for `RawLine`, `Blob`, `Finding`) throughout the checker. No behavior change — pure type annotation.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `test/citations.test.js` now runs as part of `npm test` on every future change, so a future `.planning/research/*.md` refresh (as already happened for v1.1) cannot silently re-break these citations without failing the suite.
- Plans 05-02 (PKG-02, kamea-set versioning) and 05-03 (INT-05/INT-06, `--title` flag + accessible name) can proceed — this plan's footprint (`src/render/svg.js`, `bin/sigil-spinner.js`) overlapped with theirs as flagged in the plan's objective, and both files are now in a clean, fully-cited state for those plans to build on.
- No blockers.

---
*Phase: 05-publish-ready-source*
*Completed: 2026-08-08*

## Self-Check: PASSED

- FOUND: test/citations.test.js
- FOUND: .planning/phases/05-publish-ready-source/05-01-SUMMARY.md
- FOUND commit: 9d05e22
- FOUND commit: 8d84e3b
- FOUND commit: 0cce3d4
