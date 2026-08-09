---
phase: 08-the-sigil-skill
plan: 02
subsystem: testing
tags: [drift-guard, vitest, agent-skills, text-parse-never-import, byte-identity]

requires:
  - phase: 08-the-sigil-skill
    provides: "skill/SKILL.md (repo-canonical), scripts/skill-install.js (D-99), 08-01"
provides:
  - "test/skill-cli-parity.test.js — bidirectional SKILL-03 drift guard between skill/SKILL.md's flag table and bin/sigil-spinner.js's parseArgs options, fail-first-proven both directions"
  - "test/skill-install-parity.test.js — repo-to-installed byte-identity guard (D-101), the suite's one stated conditional no-op"
affects: [08-03 mechanics content plan, 08-04 correspondences plan]

actuals:
  tokens: 4383
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Brace-counted extraction for a nested multi-line object literal (parseCliOptionKeys), adapted from element-docs.test.js's flat-array regex template"
    - "Module-level allowlist constant proven wired via push/pop mutation against the real array, not a re-derived stand-in (INTENTIONALLY_UNDOCUMENTED soundness proof)"
    - "Conditional no-op as this suite's one stated exception to fail-loudly-never-skip, printing why it did nothing"

key-files:
  created:
    - test/skill-cli-parity.test.js
    - test/skill-install-parity.test.js
  modified: []

key-decisions:
  - "Factored subtractAllowlist(cliKeys) out of the main assertion so the D-109 soundness proof for INTENTIONALLY_UNDOCUMENTED mutates the real module-level array (push/pop) rather than re-deriving an equivalent computation that could silently drift from what the main test actually runs"
  - "skill-install-parity's absent-destination no-op uses a plain early return with a console.log, never a vitest skip API, so the reporter shows a genuine pass with a visible reason rather than a collapsible skip"

patterns-established:
  - "Guards are keyed, not transcribed — sixth instance (D-55, D-61, D-65, D-97, D-107, and this plan's D-101 install guard, which derives INSTALLED_ROOT/REPO_SKILL_ROOT from the same path construction skill-install.js uses rather than hardcoding either)"

requirements-completed: [SKILL-03]

coverage:
  - id: D1
    description: "A flag documented in the skill that the CLI does not have fails npm test"
    requirement: "SKILL-03"
    verification:
      - kind: unit
        ref: "test/skill-cli-parity.test.js#the skill flag table matches the CLI option keys exactly, in both directions"
        status: pass
      - kind: unit
        ref: "test/skill-cli-parity.test.js#the skill-only difference is non-empty when the skill documents a flag the CLI does not have"
        status: pass
    human_judgment: false
  - id: D2
    description: "A CLI option the skill does not document also fails npm test — bidirectional, not one-directional"
    requirement: "SKILL-03"
    verification:
      - kind: unit
        ref: "test/skill-cli-parity.test.js#the skill flag table matches the CLI option keys exactly, in both directions"
        status: pass
      - kind: unit
        ref: "test/skill-cli-parity.test.js#the CLI-only difference is non-empty when the CLI source has an extra option the skill omits"
        status: pass
    human_judgment: false
  - id: D3
    description: "Both directions demonstrated failing against a live fixture before being trusted (D-109), not merely asserted in prose"
    requirement: "SKILL-03"
    verification:
      - kind: manual_procedural
        ref: "Live mutation proof recorded below: fabricated skill row -> exit 1 naming 'nonexistent'; omitted CLI-documented row -> exit 1 naming 'title'; both restored via git checkout"
        status: pass
    human_judgment: false
  - id: D4
    description: "If either extraction parses zero tokens, the suite fails with a named error rather than passing vacuously"
    requirement: "SKILL-03"
    verification:
      - kind: unit
        ref: "test/skill-cli-parity.test.js#fails loudly (named error) when the CLI source has no `options:` anchor"
        status: pass
      - kind: unit
        ref: "test/skill-cli-parity.test.js#fails loudly (named error) when the skill source has no flag-table rows"
        status: pass
    human_judgment: false
  - id: D5
    description: "The installed skill copy is byte-identical to skill/ when present; when absent, the suite prints why it did nothing rather than passing silently (D-101)"
    verification:
      - kind: unit
        ref: "test/skill-install-parity.test.js#~/.claude/skills/sigil/ is byte-identical to skill/, file for file, when present"
        status: pass
      - kind: manual_procedural
        ref: "Live mutation proofs below: divergence, orphan, and absent-destination, each observed red/no-op-message then green again"
        status: pass
    human_judgment: false

duration: ~15min
completed: 2026-08-09
status: complete
---

# Phase 8 Plan 02: The Bidirectional Skill-CLI Parity Guards Summary

**Two mechanical drift guards — `test/skill-cli-parity.test.js` (text-parsed, bidirectional, fail-first-proven against `skill/SKILL.md` and `bin/sigil-spinner.js`) and `test/skill-install-parity.test.js` (byte-identity between `skill/` and the installed personal copy, with a printing conditional no-op) — both mutation-proven red-then-green before this plan closed.**

## Performance

- **Duration:** ~15min
- **Started:** 2026-08-09T19:20:00Z (approx.)
- **Completed:** 2026-08-09T19:33:21Z
- **Tasks:** 2
- **Files modified:** 2 (both new)

## Accomplishments

- `test/skill-cli-parity.test.js`: a `parseCliOptionKeys` brace-counted extraction over `bin/sigil-spinner.js`'s nested `options: { ... }` literal, paired with a row-anchored `parseSkillFlagTokens` over `skill/SKILL.md`'s flag table — asserted equal in both directions, with a zero-match guard, an empty-but-wired `INTENTIONALLY_UNDOCUMENTED` allowlist, and a five-test soundness block proving both directions actually fire against fixtures before being trusted.
- `test/skill-install-parity.test.js`: a byte-identity walk between `skill/` and `~/.claude/skills/sigil/`, collecting missing/diverged/orphan findings together in one stably-sorted failure message, with the phase's one deliberate conditional no-op (absent destination) always printing why it did nothing.
- Both files picked up automatically by `vitest.config.js`'s existing flat `include` — confirmed by `git status --porcelain vitest.config.js` producing no output.
- Full suite: 25 files, 1528 tests, all passing. `npm run lint` and `npm run typecheck` both exit 0.

## Task Commits

Each task was committed atomically:

1. **Task 1: The bidirectional CLI-parity drift guard, fail-first-proven in both directions** - `7c0a40d` (test)
2. **Task 2: The repo-to-installed byte-identity guard, with the phase's one stated conditional no-op** - `544e451` (test)

_Note: no plan-metadata commit precedes this summary; the metadata commit follows this file per the execute-plan protocol._

## Files Created/Modified

- `test/skill-cli-parity.test.js` - SKILL-03's bidirectional drift guard: `parseCliOptionKeys` (brace-counted), `parseSkillFlagTokens` (row-anchored regex), `INTENTIONALLY_UNDOCUMENTED` (empty, D-108), zero-match guard, bidirectional set-difference assertion, five-test soundness block (D-109)
- `test/skill-install-parity.test.js` - `INSTALLED_ROOT`/`REPO_SKILL_ROOT` mirroring `scripts/skill-install.js`'s own path construction, a non-empty-source-tree guard, and the byte-identity walk with its one printing conditional no-op (D-101)

## Decisions Made

- **`subtractAllowlist(cliKeys)` factored out as its own function** so the D-109 soundness proof for `INTENTIONALLY_UNDOCUMENTED` could mutate the real module-level array via push/pop and observe the effect through the exact code path the main assertion uses — rather than re-deriving an equivalent subtraction that could silently drift from what actually runs. This is what makes the "empty array has real machinery behind it" claim load-bearing rather than assumed.
- **The absent-destination no-op is a plain early `return` with a `console.log`, never a vitest `.skip`** — confirmed by `grep -c '\.skip\|it\.skip\|describe\.skip'` returning 0. A collapsible skip in a test reporter is functionally silent in a way a printed message inside a passing test is not; D-101 requires the reason to be visible, not just present in source.
- **`skill-cli-parity`'s soundness block constructs every fixture as a literal source string**, never a file on disk — matching `test/citations.test.js`'s `checkSource(source, relPath)` factoring, and confirming `parseCliOptionKeys`/`parseSkillFlagTokens` already take text rather than paths (no refactor needed to make fixtures cheap).

## Deviations from Plan

None — plan executed exactly as written. No Rule 1-4 auto-fixes were needed beyond the routine TypeScript narrowing below, which is a mechanical correction rather than a design deviation.

### Auto-fixed Issues

**1. [Rule 3 - blocking issue] `tsc --checkJs` rejected `startMatch.index` as possibly `undefined`**
- **Found during:** Task 1, first `npm run typecheck` run after authoring `test/skill-cli-parity.test.js`.
- **Issue:** `RegExpMatchArray.index` is typed `number | undefined` even after the preceding `if (!startMatch)` guard narrows `startMatch` itself to non-null — TypeScript does not narrow `.index` from that check.
- **Fix:** `(startMatch.index ?? 0) + startMatch[0].length` — the `??` is unreachable in practice (a matched regex always has a defined `.index`), but it satisfies the type checker without weakening the runtime guard already in place.
- **Files modified:** `test/skill-cli-parity.test.js`.
- **Commit:** `7c0a40d` (folded into the task's single commit, since the fix landed before the task's own verification ran).

---

**Total deviations:** 1 auto-fixed (1 blocking, type-only).
**Impact on plan:** No scope creep — a mechanical type-narrowing fix, not a design change.

## Issues Encountered

None. Both files' first vitest run passed on the first attempt (9/9 and 2/2 respectively); the mutation proofs required by the plan's acceptance criteria were the only additional work, and all four (two skill-cli-parity directions, plus install-parity's divergence/orphan/absent-destination trio) fired and restored correctly on the first attempt.

## Mutation Proof Evidence (D-109 / D-101, recorded per plan's `<output>` instruction)

**`test/skill-cli-parity.test.js` — skill-side direction:**
Appended a fabricated `| \`--nonexistent\` | boolean | fabricated for mutation proof |` row to `skill/SKILL.md`. `npx vitest run test/skill-cli-parity.test.js` → 1 failed, message: `skill/SKILL.md documents flag(s) the CLI does not have: nonexistent: expected [ 'nonexistent' ] to deeply equal []`. Restored via `git checkout -- skill/SKILL.md`; re-run → 9/9 passed.

**`test/skill-cli-parity.test.js` — CLI-side direction:**
Removed the `--title` row from `skill/SKILL.md`'s flag table. `npx vitest run test/skill-cli-parity.test.js` → 2 failed (the main bidirectional assertion and one soundness test that also depends on the live skill table), main-assertion message: `bin/sigil-spinner.js has option(s) undocumented in skill/SKILL.md: title: expected [ 'title' ] to deeply equal []`. Restored via `git checkout -- skill/SKILL.md`; re-run → 9/9 passed.

**`test/skill-install-parity.test.js` — divergence proof:**
Appended a character to `~/.claude/skills/sigil/SKILL.md`. Run → 1 failed, message: `diverged from repository source: SKILL.md`. Restored via `npm run skill:install -- --force` (`[skill-install] overwrote /Users/falkensmage/.claude/skills/sigil/SKILL.md`); re-run → 2/2 passed.

**`test/skill-install-parity.test.js` — orphan proof:**
Created `~/.claude/skills/sigil/STRAY.md` with no repository counterpart. Run → 1 failed, message: `orphan at destination (no repository counterpart): STRAY.md`. Restored by deleting the stray file; re-run → 2/2 passed.

**`test/skill-install-parity.test.js` — absent-destination proof:**
Renamed `~/.claude/skills/sigil` → `~/.claude/skills/sigil.bak`. Run with `--reporter=verbose` → 2/2 passed, stdout: `[skill-install-parity] no-op (expected, not a failure): /Users/falkensmage/.claude/skills/sigil does not exist on this machine. This is the correct state on any machine that is not Matt's — the guard is a deliberate no-op here rather than a failure, per D-101, this suite's one stated exception to fail-loudly-rather-than-skip.` Restored via `mv ~/.claude/skills/sigil.bak ~/.claude/skills/sigil`; re-run → 2/2 passed, no no-op message (destination present).

## User Setup Required

None - no external service configuration required.

## Known Stubs

None. Both guards are fully wired against the real `skill/SKILL.md` and `bin/sigil-spinner.js` sources committed in 08-01; no placeholder or mock data is involved.

## Threat Flags

None. All four threats this plan's `<threat_model>` assigned to these two files (T-08-06 through T-08-09, plus the accepted T-08-SC) were addressed exactly as designed: both extraction functions throw named errors on a missing anchor and are covered by a dedicated zero-match test (T-08-06); `test/skill-install-parity.test.js` is read-only under the home directory with no unbounded traversal (T-08-07); `bin/sigil-spinner.js` is read with `readFileSync` and never imported, confirmed by `grep -c "import .*bin/sigil-spinner"` returning 0 (T-08-08); and every assertion in both files is paired with a demonstrated failure — the soundness block's five fixture-backed tests plus this summary's five live mutation proofs (T-08-09).

## Self-Check: PASSED

- `test/skill-cli-parity.test.js` — FOUND, 9 tests passing
- `test/skill-install-parity.test.js` — FOUND, 2 tests passing
- Commit `7c0a40d` — FOUND in `git log --oneline --all`
- Commit `544e451` — FOUND in `git log --oneline --all`
- `npm test` — 25 files, 1528 tests, all passed
- `npm run lint` / `npm run typecheck` — both exit 0
- `git status --porcelain bin/sigil-spinner.js vitest.config.js test/pack-install.test.js` — no output

## Next Phase Readiness

`skill/SKILL.md`'s inline flag table (D-104) is now mechanically enforced against `bin/sigil-spinner.js`'s real options in both directions, and the installed copy can no longer silently become the source of truth (D-99's second reason, now closed by a live guard rather than a stated intent). Plan 08-03 (mechanics content, prose sections that will name flags outside the table) is unblocked: the row-anchoring in `parseSkillFlagTokens` was deliberately designed so prose mentions of `--flag` tokens do not get miscounted as documented, which is exactly what 08-03 will introduce. Plan 08-04 (correspondences, gated behind the D-113 human checkpoint) is unaffected by this plan's scope.

---
*Phase: 08-the-sigil-skill*
*Completed: 2026-08-09*
