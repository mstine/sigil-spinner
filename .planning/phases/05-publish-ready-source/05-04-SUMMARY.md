---
phase: 05-publish-ready-source
plan: 04
subsystem: testing
tags: [documentation-integrity, drift-guard, vitest, gap-closure, citation-checker]

# Dependency graph
requires:
  - phase: 05-publish-ready-source (plan 01)
    provides: "test/citations.test.js — the R1/R2 citation checker this plan repairs"
provides:
  - "test/citations.test.js — sound R1 evidence rules: excerptMatchesHeading (non-empty, prefix-matched excerpt) and orderedCandidateExcerpts (adjacency-bounded, nearest-first excerpt-to-token pairing)"
  - "checkSource(source, relPath) — a pure seam letting synthetic defect fixtures run through the identical rule path the live tree uses"
  - "10-test fixture-driven soundness suite pinning CR-01 (whitespace-only, single-character, mid-heading-substring excerpts) and WR-01 (borrowed-neighbour excerpt pairing) as fail-first-proven regressions"
affects: [published-package]

# Actuals (#2632) — pairs with the plan's estimate to calibrate future estimates.
actuals:
  tokens: 2754
  tasks: 2
  commits: 2

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "checkFile/checkSource seam split — module-private checkFile(filePath, relPath) reduced to a readFileSync + delegate wrapper around a pure checkSource(source, relPath), so synthetic defect shapes can be fed through the identical rule path without a second file on disk"
    - "Prefix-match evidence rule (excerptMatchesHeading) chosen over a minimum-length floor — the discriminating property is whether the excerpt starts a real heading, not how long it is, since 48 of 185 cited headings are themselves under 19 characters"
    - "Adjacency-bounded nearest-first candidate ordering (orderedCandidateExcerpts) with first-match-wins semantics — nearest candidate is tried first but is not required to resolve, preserving legitimate chained-citation parentheticals where a neighbour's excerpt sits nearer than the token's own"

key-files:
  created: []
  modified:
    - test/citations.test.js

key-decisions:
  - "Prefix match, not length floor: excerptMatchesHeading requires the trimmed excerpt be non-empty AND a prefix of a real heading. Measured at plan time: 33/33 real citations satisfy it; any length floor strict enough to reject a single character would also reject legitimate short-heading citations (e.g. 'Sources', 'Determinism')."
  - "MAX_EXCERPT_TOKEN_DISTANCE = 20, derived from measurement (every real citation places its excerpt 4-5 characters from its token) — 4x observed headroom, 10x tighter than the 200-char scan span."
  - "First-match-wins across nearest-first ordered candidates, not nearest-only-must-resolve — required to keep src/path/buildPath.js's chained two-citation parenthetical resolving, since its second citation's excerpt sits nearer to the first citation's token than that token's own excerpt does."
  - "Scan span (citationWindow / PAREN_WINDOW_FALLBACK_CHARS) left untouched — only a distance filter was applied to candidates found within the existing span, per the load-bearing hazard noted in the plan (re-anchoring the scan broke src/generate.js:142 at plan-measurement time)."

requirements-completed: [MAINT-01]

coverage:
  - id: D1
    description: "CR-01 closed — excerptMatchesHeading rejects whitespace-only, single-character, and mid-heading-substring excerpts while still accepting every real citation"
    requirement: "MAINT-01"
    verification:
      - kind: unit
        ref: "test/citations.test.js#Citation checker soundness (CR-01, WR-01) > rejects a whitespace-only excerpt (CR-01)"
        status: pass
      - kind: unit
        ref: "test/citations.test.js#Citation checker soundness (CR-01, WR-01) > rejects a degenerate single-character excerpt (CR-01, one keystroke past empty)"
        status: pass
      - kind: unit
        ref: "test/citations.test.js#Citation checker soundness (CR-01, WR-01) > rejects an excerpt that appears mid-heading but does not start it (prefix tightening)"
        status: pass
      - kind: unit
        ref: "test/citations.test.js#Citation checker soundness (CR-01, WR-01) > accepts a verbatim heading excerpt (clean control — the guard still discriminates)"
        status: pass
    human_judgment: false
  - id: D2
    description: "WR-01 closed — orderedCandidateExcerpts bounds excerpt-to-token pairing to 20 characters, nearest-first, so a neighbouring citation's excerpt can no longer back an unrelated token"
    requirement: "MAINT-01"
    verification:
      - kind: unit
        ref: "test/citations.test.js#Citation checker soundness (CR-01, WR-01) > rejects a token backed only by a neighbouring citation excerpt ~75+ characters away (WR-01)"
        status: pass
      - kind: unit
        ref: "test/citations.test.js#Citation checker soundness (CR-01, WR-01) > accepts a citation in canonical adjacent form (adjacent clean control)"
        status: pass
      - kind: unit
        ref: "test/citations.test.js#Citation checker soundness (CR-01, WR-01) > resolves a chained two-citation parenthetical even when the second excerpt is nearer to the first token (chained-citation control, mirrors src/path/buildPath.js:51-53)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Live tree still reports zero findings, all 33 real citations resolve, the 34-site floor and src/bin inspection scope are unchanged, and no production code was touched"
    requirement: "MAINT-01"
    verification:
      - kind: unit
        ref: "test/citations.test.js#Citation integrity (MAINT-01) > has zero findings across src/ and bin/, and at least the plan-time-enumerated site count"
        status: pass
      - kind: unit
        ref: "test/citations.test.js#Citation integrity (MAINT-01) > produces byte-identical findings output across two runs"
        status: pass
      - kind: other
        ref: "npm test && npm run typecheck && npm run lint"
        status: pass
    human_judgment: false

# Metrics
duration: 12min
completed: 2026-08-08
status: complete
---

# Phase 5 Plan 4: Citation checker soundness (CR-01, WR-01) Summary

**Closed CR-01 (blank/single-character/mid-heading excerpts satisfying R1 unconditionally) and WR-01 (a ±200-char window letting one citation's excerpt back a different citation's path token), via a `checkSource` seam and two fail-first-proven fixture families — zero production code touched.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-08-08T20:10:00Z
- **Completed:** 2026-08-08T20:22:21Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Split `checkFile` into a pure `checkSource(source, relPath)` seam plus a thin `readFileSync`-and-delegate wrapper, so synthetic defect shapes can run through the identical R1/R2 rule path the live tree uses
- Added `excerptMatchesHeading(excerpt, headings)` — an excerpt only backs a citation when non-empty after trimming AND is a prefix of a real heading, closing CR-01 without a length floor (which measurement showed would reject legitimate short-heading citations)
- Added `MAX_EXCERPT_TOKEN_DISTANCE` (20 chars) and `orderedCandidateExcerpts(windowText, winStart, tokenStart, tokenEnd)` — bidirectional, nearest-first, distance-filtered candidate ordering, closing WR-01
- Added a 10-test fixture-driven soundness suite: 5 CR-01-family fixtures (3 must-fail-first: whitespace-only, single-character, mid-heading-substring; 2 controls: clean verbatim heading, absent excerpt) and 3 WR-01-family fixtures (1 must-fail-first: borrowed-neighbour ~90 chars away; 2 controls: adjacent clean form, chained-citation mirroring `src/path/buildPath.js:51-53` verbatim)
- Confirmed live tree unaffected: all 33 real path-token citations still resolve, zero findings, site count still ≥34, R2 label backing (`validExcerpts`) unshifted

## Task Commits

Each task was committed atomically:

1. **Task 1: Fixture seam plus the R1 evidence rule, proven red then green** - `1595a82` (test)
2. **Task 2: Adjacency-bounded nearest-first excerpt pairing, and the seal** - `57d3e13` (test)

_Both tasks were `tdd="true"`; each commit bundles its fail-first fixture addition and its rule implementation together as a single atomic unit rather than separate RED/GREEN commits, since both steps target the same `describe` block within one file and were verified fail-first-then-green before committing (evidence captured below, not via a separate commit)._

## Files Created/Modified

- `test/citations.test.js` - Added `MAX_EXCERPT_TOKEN_DISTANCE`, `excerptMatchesHeading`, `orderedCandidateExcerpts`, `checkSource` (extracted from `checkFile`), and a 10-test `Citation checker soundness (CR-01, WR-01)` describe block

## Decisions Made

- Prefix match over length floor for R1 evidence (see frontmatter `key-decisions` — measured 48/185 headings under 19 chars, which any adequate length floor would incorrectly reject)
- `MAX_EXCERPT_TOKEN_DISTANCE = 20`, derived from the measured 4-5 char real-citation distance
- First-match-wins across nearest-first candidates (not nearest-only-must-resolve), required by the real chained citation in `src/path/buildPath.js:51-53`
- Left `citationWindow`/`PAREN_WINDOW_FALLBACK_CHARS` untouched — adjacency is a filter over the existing scan span, never a re-anchoring of it

## Deviations from Plan

None — plan executed exactly as written. Both scope-finding predictions (prefix rule needed, not a length floor; pairing needed a candidate-selection change, not an excerpt-content guard) held exactly as measured, and no additional production-code or scope changes were required.

## Fail-First Evidence (captured during execution, per task acceptance criteria)

**Task 1 — before `excerptMatchesHeading` was wired in**, 3 of 5 CR-01-family fixtures failed as required:

```
❯ test/citations.test.js (7 tests | 3 failed)
     × rejects a whitespace-only excerpt (CR-01)
     × rejects a degenerate single-character excerpt (CR-01, one keystroke past empty)
     × rejects an excerpt that appears mid-heading but does not start it (prefix tightening)

FAIL  ... > rejects a whitespace-only excerpt (CR-01)
AssertionError: expected [] to have a length of 1 but got +0
FAIL  ... > rejects a degenerate single-character excerpt (CR-01, one keystroke past empty)
AssertionError: expected [] to have a length of 1 but got +0
FAIL  ... > rejects an excerpt that appears mid-heading but does not start it (prefix tightening)
AssertionError: expected [] to have a length of 1 but got +0

 Test Files  1 failed (1)
      Tests  3 failed | 4 passed (7)
```

After implementing `excerptMatchesHeading` and wiring it into the R1 loop: all 7 tests passed (5 new fixtures + the 2 pre-existing live-tree `it` blocks).

**Task 2 — before `orderedCandidateExcerpts`/`MAX_EXCERPT_TOKEN_DISTANCE` were wired in**, the borrowed-neighbour fixture failed as required (both controls already passed):

```
❯ test/citations.test.js (10 tests | 1 failed | 9 skipped)
     × rejects a token backed only by a neighbouring citation excerpt ~75+ characters away (WR-01)

FAIL  ... > rejects a token backed only by a neighbouring citation excerpt ~75+ characters away (WR-01)
AssertionError: expected [] to have a length of 1 but got +0

 Test Files  1 failed (1)
      Tests  1 failed | 9 passed (10)
```

After implementing `MAX_EXCERPT_TOKEN_DISTANCE` and `orderedCandidateExcerpts`, and rewiring the R1 loop to iterate ordered, distance-filtered candidates: all 10 tests passed, including the chained-citation control (proving the rule was not over-tightened into nearest-only).

**Note on fixture calibration:** the borrowed-neighbour fixture's padding text was tuned during implementation so the excerpt-to-token gap (~90 chars) stayed safely inside the existing `PAREN_WINDOW_FALLBACK_CHARS` (200-char) scan span without the window's edge truncating the quoted excerpt itself — an initial draft at ~184 chars clipped the window boundary through the middle of the quoted word, which would have produced a false failure unrelated to the adjacency rule. This was caught and corrected before the fail-first run above was captured; no code under test was affected.

## Issues Encountered

None beyond the fixture-calibration note above (resolved during fixture authoring, before any fail-first evidence was captured).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- MAINT-01 (CR-01 and WR-01) is closed; phase success criterion 4 ("Citations backed by real archived text with resolvable headings") is now durable — the checker itself, not just today's tree state, verifies it
- `npm test`, `npm run typecheck`, and `npm run lint` all exit 0; `package.json` `dependencies` remains an empty object; no snapshot was rebased
- Zero production code changed (`git diff --name-only -- src bin` empty for both task commits) — Phase 5's remaining requirements (PKG-02, INT-05, INT-06) are unaffected by this gap-closure plan
- No blockers

---
*Phase: 05-publish-ready-source*
*Completed: 2026-08-08*

## Self-Check: PASSED

- FOUND: test/citations.test.js
- FOUND: .planning/phases/05-publish-ready-source/05-04-SUMMARY.md
- FOUND: commit 1595a82
- FOUND: commit 57d3e13
