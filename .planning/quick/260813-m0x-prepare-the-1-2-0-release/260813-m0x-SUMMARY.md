---
status: complete
quick_task: 260813-m0x
title: Prepare the 1.2.0 release
date: 2026-08-13
requirements: [REL-1.2.0]
commits:
  - 5d9d2cf
key-files:
  modified:
    - package.json
    - package-lock.json
    - skill/SKILL.md
    - test/skill-version-skew.test.js
actuals:
  tokens: 41000
  tasks: 3
  commits: 1
---

# Quick Task 260813-m0x: Prepare the 1.2.0 Release — Summary

**One-liner:** Bumped to 1.2.0 and, in doing so, discovered that two of the version-skew guard's three "live" claims were never really live — they were forward-looking promises that this release resolves into permanent historical facts, so the guard's region model had to change shape, not just its numbers.

## The reasoning this task worked out

Before this release, `skill/SKILL.md` carried three claims the version-skew guard (260812-rfu) bound to `package.json`'s version: the `--planet` flag-table row, the Published-Surface Boundary paragraph, and the Planet-list skew paragraph. All three said, in effect, "the modern three planets require a version later than 1.1.0."

That sentence is true today only because it hasn't resolved yet. It is a promissory note — its truth is contingent on what's currently published, which is exactly why binding it to `package.json` was the right call at the time. This release is the resolution. Once uranus, neptune, and pluto are actually available in `1.2.0`, the underlying fact stops being "later than whatever's current" and becomes "arrived in 1.2.0" — a statement about a specific past release. That statement is true at 1.2.0. It is equally true at 1.3.0, 2.0.0, and every version after. It never moves again.

So the guard's region model changed: `--planet` flag row and Planet-list skew are reclassified from **LIVE** to **HISTORICAL**, pinned to a new `MODERN_THREE_PINS` (`1.2.0`), independent of the existing `HISTORICAL_PINS` (the exports-map widening, `1.1.0`/`1.0.0`). The Published-Surface Boundary paragraph is now the *only* LIVE claim — the one region in the file that genuinely tracks whatever's currently published.

Leaving the two regions classified LIVE would have passed this specific release by coincidence (1.2.0 happens to be both `package.json`'s version and the arrival release) and then failed at 1.3.0, where the guard's own failure message would have instructed a developer to rewrite `1.2.0` as `1.3.0` — corrupting a correct statement about history. That's the exact failure mode the guard's own doc comment already named as "actively wrong." This reclassification is a strengthening, not a weakening: both regions move from a moving target to an exact pinned literal, so a find-and-replace sweep across the file is now caught in three places instead of one, and `findHistoricalMismatches` still takes no version parameter — the structural exemption stayed structural.

The Published-Surface Boundary paragraph's provenance clause ("re-queried live after the 1.1.0 release rather than assumed") was replaced with an honest release-prep statement, since renumbering it verbatim would have asserted a live registry observation of `1.2.0` that could not have happened — 1.2.0 isn't published yet when this line is written.

## What was done

1. **Bumped the manifest and lockfile** — `npm version 1.2.0 --no-git-tag-version`. Lock diff confined to the four version-field lines (name/version at root and `packages[""]`), no registry fetch. Fired the guard deliberately and captured its worklist verbatim before touching any prose.
2. **Reconciled SKILL.md and corrected the guard's region model** — wrote fixture tests first (TDD), watched them target the new model, then rewrote the three affected regions in `skill/SKILL.md` and restructured `test/skill-version-skew.test.js` around `LIVE_CLAIMS` (now one entry) and `HISTORICAL_CLAIMS` (now three, across two independently-reasoned pin sets). Added two new sweep-detection fixture tests proving the modern-three pin discriminates independently in both reclassified regions, and reworked the exemption-proof test to bump only the live region while asserting all three historical regions stay green.
3. **Re-synced the installed skill, ran every gate, committed** — `npm run skill:install -- --force`, verified byte-identity via `test/skill-install-parity.test.js`. All four release gates green.

## Verification

- `lint` → 0
- `typecheck` → 0
- `CI=true npm test` → 1599/1599 passed, 26 files (up from 1532/25 at 1.1.0 — the modern-three work and this task's own new fixtures account for the growth)
- `test:pack` → 2/2
- `npx vitest run test/skill-version-skew.test.js` → 13/13, one live region + three historical regions parsed from the real file
- `npx vitest run test/skill-install-parity.test.js` → 2/2, no reinstall needed
- Pack manifest inspected directly: 19 files (unchanged from 1.1.0), `./element` included, `skill/`/`scripts/`/`examples/`/`test/`/`.planning/` all excluded, zero dependencies — none of the three quick-task test files added since 1.1.0 leaked into the tarball
- Zero snapshot movement: `git diff --exit-code` and `git status --porcelain` over `test/__file_snapshots__` and `test/render/__snapshots__` both clean
- `git status --porcelain -- src bin` — nothing; no kamea grid, correspondence row, or library behavior touched
- `Prior to ` paragraph and both `HISTORICAL_PINS` entries confirmed byte-identical to pre-task state via mechanical diff
- `findHistoricalMismatches` confirmed still single-parameter (`md`) — structural exemption intact
- Manual read-through: read the rewritten skew paragraph and the boundary paragraph as if 1.3.0 had just shipped. Every sentence in the (now historical) skew paragraph holds. The boundary paragraph is the one paragraph *designed* to go stale at the next release — that's correct, it's the sole live claim.

## Deviations from Plan

**1. [Process correction, not a plan deviation] Consolidated two per-task commits into the single required release commit.**

The task-execution default (per-task atomic commits) initially produced two commits — one for Task 1 (manifest/lockfile bump) and one for Task 2 (SKILL.md + guard reconciliation). The plan's own `<verification>` and `<success_criteria>` explicitly require exactly ONE commit, subject `chore(release): 1.2.0`, touching exactly four files, matching 99b6f82's shape. Used `git reset --soft HEAD~2` (not `--hard`, not `--amend`) to combine both freshly-made, unpushed, same-run commits into the single commit the plan specifies, then committed once with the full body. No commits from before this task's execution were touched.

No other deviations. Plan executed exactly as written, including the deliberate reclassification of the two guard regions that the plan's `<the_crux>` called out as the part most tempting to "simplify" back — it was not simplified back.

## Release status

**Prepared, not published.** One commit, `chore(release): 1.2.0`, sits on the worktree branch (`worktree-agent-a9956bd4e1818718c`), unpushed, untagged. `npm view @falkensmage/sigil-spinner version` still returns `1.1.0`. The working tree is clean outside `.planning/`. The next action — merge, tag, and `gh workflow run release.yml -f mode=publish` — belongs to the developer.

## Self-Check: PASSED

- `package.json` states `1.2.0`: confirmed via `node -e` check in Task 1 verify (ran clean).
- Commit `5d9d2cf` exists: `git log --oneline -5` shows it as HEAD, subject `chore(release): 1.2.0`.
- `skill/SKILL.md` and `test/skill-version-skew.test.js` diffs match the described reclassification: confirmed via `git show --numstat` and the guard's own green run.
- `~/.claude/skills/sigil/SKILL.md` re-synced: confirmed by `test/skill-install-parity.test.js` passing without a further install step.
