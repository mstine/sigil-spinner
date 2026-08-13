---
phase: quick-260812-rfu
plan: 01
subsystem: testing
tags: [vitest, skill, drift-guard, version-skew, jsdoc-typescript]

# Dependency graph
requires:
  - phase: quick-260812-n36
    provides: "skill/SKILL.md's Planet Selection / Published-Surface Boundary / Planet-list skew content, which this task adds a drift guard for"
provides:
  - "test/skill-version-skew.test.js — a live-vs-historical-aware drift guard binding skill/SKILL.md's three LIVE version claims to package.json's version, while structurally exempting the one HISTORICAL claim"
affects: [skill, release-process, next-version-bump]

# Actuals (#2632) — chars/4 over the realized diff, not a harness token count.
actuals:
  tokens: 3901
  tasks: 3
  commits: 1

tech-stack:
  added: []
  patterns:
    - "Region-based markdown drift guard: anchor text (never line numbers) locates a region, region kind (row | paragraph) determines extraction shape, and a coverage scan proves no semver token escapes the four known regions."
    - "Structural exemption over commented exemption: the historical-pin comparison function's signature omits the 'current version' parameter entirely, so the exemption cannot be silently broken by a future edit that starts threading currentVersion through every comparison."

key-files:
  created:
    - test/skill-version-skew.test.js
  modified: []

key-decisions:
  - "Followed the plan's design exactly: extractRegion() throws two distinct named errors (missing anchor vs. ambiguous anchor) rather than one generic error, since the two failure modes require different repairs."
  - "findHistoricalMismatches(md) takes no currentVersion parameter — the exemption is enforced by the function's type signature, not by a comment a future editor could miss."
  - "Coverage check (findCoverageGaps) reuses the same four regions the live/historical checks already extract, rather than re-deriving region boundaries a second time, so the two can never drift apart."

patterns-established:
  - "Live-vs-historical region classification for any future doc-drift guard in this repo: anchor-located regions, one pure comparison function per classification, a coverage scan proving total accounting."

requirements-completed: [SKILL-VER-GUARD-01]

coverage:
  - id: D1
    description: "test/skill-version-skew.test.js exists, is green, typechecks, and lints — the three live claims in skill/SKILL.md are keyed to package.json's version, never transcribed"
    requirement: "SKILL-VER-GUARD-01"
    verification:
      - kind: unit
        ref: "test/skill-version-skew.test.js#Skill version-skew live-tree guard (SKILL-VER-GUARD-01) every live claim in skill/SKILL.md matches package.json's version"
        status: pass
      - kind: other
        ref: "npm run typecheck (tsc --allowJs --checkJs --noEmit, strict mode)"
        status: pass
      - kind: other
        ref: "npx eslint test/skill-version-skew.test.js"
        status: pass
    human_judgment: false
  - id: D2
    description: "The historical 'Prior to ' paragraph is structurally exempt from the version binding — its comparison function takes no currentVersion parameter, proven live by mutation"
    requirement: "SKILL-VER-GUARD-01"
    verification:
      - kind: unit
        ref: "test/skill-version-skew.test.js#Skill version-skew live-tree guard (SKILL-VER-GUARD-01) the historical/pinned paragraph in skill/SKILL.md states exactly the transcribed pinned versions"
        status: pass
      - kind: other
        ref: "Task 2 live mutation proof: package.json bumped to 9.9.9, guard run via `npx vitest run --reporter=json`, JSON report parsed mechanically — the historical/pinned-matching tests (4 of them) all reported status 'passed' while the live-claim test reported 'failed'"
        status: pass
    human_judgment: false
  - id: D3
    description: "Every semver token in skill/SKILL.md (9 total, on 4 lines) is accounted for by exactly one of the four known regions — a fifth version claim added elsewhere cannot go unguarded"
    requirement: "SKILL-VER-GUARD-01"
    verification:
      - kind: unit
        ref: "test/skill-version-skew.test.js#Skill version-skew live-tree guard (SKILL-VER-GUARD-01) every semver token in skill/SKILL.md is accounted for by exactly one known region"
        status: pass
    human_judgment: false
  - id: D4
    description: "The addition costs nothing outside its own file — full suite green, zero snapshot movement, skill/src/bin/package.json untouched, install parity intact"
    requirement: "SKILL-VER-GUARD-01"
    verification:
      - kind: integration
        ref: "CI=true npm test (26 files, 1597 tests, all passed)"
        status: pass
      - kind: other
        ref: "git diff --exit-code -- test/__file_snapshots__ test/render/__snapshots__ (exit 0); git status --porcelain over the same paths (empty)"
        status: pass
      - kind: other
        ref: "git status --porcelain -- skill src bin package.json (empty); diff -rq skill/ ~/.claude/skills/sigil/ (empty — byte-identical, no reinstall needed)"
        status: pass
    human_judgment: false

duration: ~20min
completed: 2026-08-13
status: complete
---

# Quick Task 260812-rfu: Guard the sigil skill's version-skew claims Summary

**Added `test/skill-version-skew.test.js`, a region-classifying drift guard that binds three LIVE version claims in `skill/SKILL.md` to `package.json`'s version while structurally exempting the one HISTORICAL claim about pre-`1.1.0` behavior — proven to discriminate by live mutation, not just fixtures.**

## Performance

- **Duration:** ~20 min
- **Completed:** 2026-08-13T01:00Z
- **Tasks:** 3 (Task 1 auto+tdd, Task 2 auto proof, Task 3 auto proof)
- **Files modified:** 1 (`test/skill-version-skew.test.js`, created)

## Accomplishments

- Built a region extractor (`extractRegion`) that locates a unique text anchor (never a line number) and pulls either a single table row or a paragraph-to-next-blank-line, throwing two distinctly-named errors for the missing-anchor and ambiguous-anchor failure modes.
- Classified `skill/SKILL.md`'s nine semver-shaped tokens (across four lines) into exactly four regions: three LIVE (the `--planet` flag-table row, the Published-Surface Boundary opening paragraph, the Planet-list skew paragraph) and one HISTORICAL (the "Prior to " paragraph).
- Made the historical exemption structural: `findHistoricalMismatches(md)` has no `currentVersion` parameter in its signature at all, so a future edit that tries to thread the current version through every comparison function cannot silently break the exemption without a type error.
- Added a coverage scan (`findCoverageGaps`) proving every semver token in the file belongs to exactly one of the four known regions — a fifth, un-classified version claim added anywhere else in the file would be caught by name and line number.
- Proved discrimination by live mutation (Task 2): bumped `package.json`'s version to `9.9.9`, ran the guard alone with `--reporter=json`, and mechanically asserted from the JSON report that the live-claim test failed while all four historical/pinned-matching tests passed in the same run — then reverted via `git checkout --` and verified byte-identical restoration.
- Proved the addition costs nothing (Task 3): full suite green (26 files, 1597 tests), typecheck and lint clean, zero snapshot movement, `skill/`, `src/`, `bin/`, `package.json` all untouched, and `skill/` still byte-identical to the installed `~/.claude/skills/sigil/` copy (no reinstall required).

## Task Commits

Each task was committed atomically per the plan's design — Tasks 2 and 3 were proof-only steps with zero net file changes, so they have no commits of their own:

1. **Task 1: Build the version-skew guard, live-vs-historical aware** - `bdb4a69` (test)
2. **Task 2: Prove the guard discriminates — live mutation, then verified revert** - no commit (package.json mutation was bumped and reverted via `git checkout --`, net zero diff; verified `git diff --exit-code` and `git status --porcelain` both clean before and after)
3. **Task 3: Prove the addition costs nothing — full suite, snapshots, install parity** - no commit (proof-only; no files changed)

## Files Created/Modified

- `test/skill-version-skew.test.js` - Live-vs-historical-aware drift guard binding `skill/SKILL.md`'s three LIVE version claims to `package.json`'s version, with a structurally-exempt historical-pin check and a whole-file coverage scan; 11 tests across two `describe` blocks (live-tree guard + fixture-driven soundness).

## Decisions Made

- Followed the plan's structural-exemption design exactly rather than a commented one: `findHistoricalMismatches(md)` omits the `currentVersion` parameter from its type signature, making the exemption enforceable by TypeScript's `strict` + `checkJs` pass rather than relying on a comment nobody reads.
- Used plain substring anchor matching (`text.indexOf`), reusing the exact anchor strings verified unique at planning time, rather than building new regexes — kept the extractor generic across `row` and `paragraph` region kinds so it could serve all four regions from one function.
- Named tests per the plan's naming contract (`live` in the live-claim test's full name, `historical`/`pinned` in the historical test's full name, neither in soundness-block names) so Task 2's mutation-proof script could identify the right tests mechanically from vitest's JSON report by regex on `fullName`.

## Deviations from Plan

None - plan executed exactly as written. All three tasks' `<done>` criteria were met without needing any Rule 1-4 auto-fixes.

## Issues Encountered

None. The full suite's browser tests (`test/browser/*`) ran cleanly with no chromium-missing failure this session — the environment already had Playwright's chromium installed from prior work, so the plan's documented fallback (`npx playwright install chromium`) was not needed.

**Test-count sanity check:** `.planning/STATE.md` records 1,532 passed tests as of the v1.1 milestone close. The full suite run in this task shows 1,597 — a delta of 65, not the 11 this task's file alone contributes. The other 54 tests were added by the two quick tasks that landed after the v1.1 milestone close and before this one (`260812-m4b` and `260812-n36`, both already merged into this branch's history per `git log`), whose test additions were never reflected back into STATE.md's recorded baseline. This is pre-existing drift in a documentation figure, not a regression introduced by this task — confirmed by isolating this task's own contribution (11 tests, all in `test/skill-version-skew.test.js`) via the targeted single-file run in Task 1.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The next release that bumps `package.json`'s version to publish `uranus`, `neptune`, and `pluto` will now fail this guard loudly on whoever makes that bump, with a message naming the three claims to update in `skill/SKILL.md` and an explicit warning to leave the "Prior to " paragraph untouched.
- No blockers. `skill/` remains byte-identical to the installed copy, so no `skill:install` re-sync was needed as part of this task.

---
*Phase: quick-260812-rfu*
*Completed: 2026-08-13*
