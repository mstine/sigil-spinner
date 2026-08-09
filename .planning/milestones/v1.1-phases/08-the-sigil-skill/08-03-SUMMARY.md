---
phase: 08-the-sigil-skill
plan: 03
subsystem: distribution/skill
tags: [agent-skills, progressive-disclosure, verification-instrument, live-registry]
status: complete

dependency-graph:
  requires:
    - phase: 08-the-sigil-skill
      provides: "skill/SKILL.md (repo-canonical, 08-01), test/skill-cli-parity.test.js (D-107, 08-02)"
  provides:
    - "skill/SKILL.md — five-item embedding checklist (D-106), Going Deeper progressive-disclosure pointers (D-105), Published-Surface Boundary recording the live registry re-query (D-116)"
    - "skill/VERIFY.md — the fixed-prompt instrument for the two un-automatable success criteria (D-118, D-117)"
  affects:
    - "~/.claude/skills/sigil/ (installed copy, refreshed by npm run skill:install -- --force)"

tech-stack:
  added: []
  patterns:
    - "Progressive disclosure via one-hop pointer (node_modules README + repo URL), never through an intermediate file"
    - "Fixed verbatim prompts as the instrument for a human-run check, same shape as examples/element.html (D-95)"

key-files:
  created:
    - skill/VERIFY.md
  modified:
    - skill/SKILL.md

decisions:
  - "D-116 discharged by live re-query at authoring time, not assumed: npm view @falkensmage/sigil-spinner version -> 1.0.0, exports -> { '.': './src/index.js' } — no ./element subpath, so the skill documents inline-SVG embedding only and names the observed version and reason inline"
  - "Embedding checklist authored as a numbered list, not a second markdown table — the drift guard's row regex is anchored to '| \\`--flag\\` |' table rows, and a second table with that shape would misclassify a prose mention as a documented flag"
  - "skill/VERIFY.md's two procedures state the session-restart precondition explicitly (a top-level skills directory created after a session starts is not watched by that session) so a first-run false negative is not mistaken for a real routing failure"

actuals:
  tokens: 2921
  tasks: 2
  commits: 2

metrics:
  duration: ~25min
  completed: 2026-08-09
---

# Phase 8 Plan 03: The Sigil Skill — Embedding Checklist, Progressive Disclosure, Verification Instrument Summary

**One-liner:** `skill/SKILL.md` grew a five-item embedding checklist, a one-hop progressive-disclosure pointer, and a published-surface boundary line recorded against a live registry re-query; `skill/VERIFY.md` was created as the fixed-prompt instrument for the phase's two un-automatable success criteria.

## What Was Built

- **`skill/SKILL.md` — Embedding Checklist section (D-106).** Five items, each an instruction a session would otherwise learn by shipping a broken page: distinct `--id-prefix` per co-embedded sigil (identical prefixes collide by design); the grid layer is present-and-hidden, not absent, revealed by one CSS declaration; the glyph layer is opt-in and font-dependent (U+2600–U+26FF coverage, mitigable via `--sigil-glyph-font`); numeric `--sigil-*` values are unitless user units; curve mode can overshoot the viewBox on a reversal-heavy statement (the documented `sun` + "I WILL SUCCEED" instance). Authored as a numbered list rather than a second markdown table, so `test/skill-cli-parity.test.js`'s row-anchored `parseSkillFlagTokens` regex (`^\|\s*`--[a-z-]+`\s*\|`) does not misread a prose mention of a flag as a documented one.
- **`skill/SKILL.md` — Going Deeper section (D-105).** Names, as explicitly out of scope for the body, the four bodies of depth deliberately not restated (the fifteen `--sigil-*` properties, the full error-code/exit-status tables, the letter-handling and folding rules, the JSON working's sixteen fields), and points one hop at `node_modules/@falkensmage/sigil-spinner/README.md` and `https://github.com/mstine/sigil-spinner` — never through an intermediate reference file.
- **`skill/SKILL.md` — Published-Surface Boundary section (D-116).** Records the live registry re-query performed at authoring time (below) and states plainly that the custom element exists in this working tree but is not part of the published package, so the skill does not instruct a session to import an element entry point that would fail with a package-path-not-exported error on every machine.
- **`skill/VERIFY.md` (new).** Two named procedures: Procedure 1 is D-118's cold-session routing/reasoning check for success criterion 1, with the two fixed prompts written verbatim ("make me a sigil for 'I WILL FINISH THIS'" and the letting-go-of-an-old-job prompt that asks the session to pick the planet), the session-restart precondition stated explicitly, and four separately-recorded pass conditions. Procedure 2 is D-117's live-registry check for success criterion 3, reproducing the skill's exact documented invocation string against the published package (never the repository's own local entry point), with the two error-case sanity anchors (`E_UNKNOWN_PLANET`, `E_MISSING_STATEMENT`) recorded as the reason the embedding checklist doesn't duplicate error-recovery guidance.

## Live Registry Verification (D-116, re-queried at authoring time — not assumed)

```
$ npm view @falkensmage/sigil-spinner version
1.0.0
$ npm view @falkensmage/sigil-spinner exports
{ '.': './src/index.js' }
```

No `./element` subpath as of 2026-08-09. **Branch taken:** the embedding guidance stays inline-SVG-only; `skill/SKILL.md`'s Published-Surface Boundary section names the observed version (`1.0.0`) and states the reason the element is undocumented. `grep -c 'sigil-spinner/element' skill/SKILL.md` → `0`, confirming the string never appears.

## `skill/SKILL.md` Body Budget

Final size: **7,829 bytes** (well under the 20,000-byte / roughly-5k-token D-105 progressive-disclosure ceiling). Flag-token set extracted by the drift guard is unchanged from 08-01/08-02: `--curve --glyph --id-prefix --json --output --planet --title`.

## Task Commits

Each task was committed atomically:

1. **Task 1: The embedding checklist, the on-demand depth pointers, and the published-surface boundary** — `bebd5b2` (feat)
2. **Task 2: skill/VERIFY.md — the fixed-prompt instrument for the two un-automatable criteria** — `48ce29e` (feat)

## Verification Evidence

- `npx vitest run test/skill-cli-parity.test.js` → 9/9 passed, both after Task 1's content growth and unchanged.
- Extracted flag-token set: `grep -oE '^\| `--[a-z-]+`' skill/SKILL.md | grep -oE '\-\-[a-z-]+' | sort | tr '\n' ' '` → `--curve --glyph --id-prefix --json --output --planet --title` (byte-identical to 08-01/08-02).
- `grep -c 'U+2600' skill/SKILL.md` → 1. `grep -c 'node_modules/@falkensmage/sigil-spinner/README.md' skill/SKILL.md` → 1. `grep -c 'github.com/mstine/sigil-spinner' skill/SKILL.md` → 1.
- Frontmatter untouched: `git diff -U0 -- skill/SKILL.md | grep -c '^[+-]description:'` → 0.
- `grep -rEl 'RitualSync|/Users/' skill/` → no output (both files clean of local paths).
- `skill/VERIFY.md`: `grep -c 'I WILL FINISH THIS'` → 1; `grep -ci 'letting go of an old job'` → 1; `grep -ci 'restart\|brand-new session\|new Claude Code session'` → 1; `grep -c 'skill:install'` → 2; `grep -c 'node bin/sigil-spinner.js'` → 0 (the repo's own local binary path is explicitly not what the live procedure verifies).
- `npm run skill:install -- --force` → wrote `skill/VERIFY.md`, overwrote `skill/SKILL.md` at `~/.claude/skills/sigil/`; `cmp -s skill/VERIFY.md "$HOME/.claude/skills/sigil/VERIFY.md"` → exit 0 (byte-identical).
- `npx vitest run test/skill-install-parity.test.js` → 2/2 passed, no divergence, no orphan.
- Full suite: `npm test` → 25 files, 1528 tests, all passed. `npm run lint` and `npm run typecheck` both exit 0.
- `git status --porcelain package.json README.md` → no output (both untouched, as the plan requires).

## Deviations from Plan

None — plan executed exactly as written. Task 1 intentionally left `test/skill-install-parity.test.js` red between the two task commits (the installed copy diverges the moment `skill/SKILL.md`'s repo source changes, before the reinstall) — this is the expected transient state the plan's own two-task structure describes ("Then reinstall so the destination carries this file and the Task 1 edits"), not a defect. The full suite is green as of the final (Task 2) commit.

## Known Stubs

None. The `<!-- SKILL-02 pending: correspondences not yet captured from Matt -->` marker in `skill/SKILL.md`'s Planet Selection section is untouched by this plan — it remains the explicit, D-114-mandated placeholder that 08-04 resolves behind its blocking human checkpoint, exactly as 08-01 left it.

## Threat Flags

None. All three `mitigate`-dispositioned threats this plan's `<threat_model>` names were addressed exactly as designed: T-08-10 (documenting an unpublished subpath) is closed by the live re-query recorded above plus the zero-match assertion on the literal string; T-08-11 (a second table read as the flag table) is closed by authoring the checklist as a numbered list rather than a table, keeping the extracted flag-token set byte-identical to 08-01/08-02; T-08-12 (an unstated verification precondition) is closed by `skill/VERIFY.md` stating the session-restart condition explicitly in Procedure 1's Preconditions section. T-08-13 (a machine-local path leaking into the globally-installed skill) is closed — `grep -rEl 'RitualSync|/Users/' skill/` produced no output. T-08-SC (package installs) is not applicable — no package was installed; the two `npm view` calls are read-only registry metadata queries.

## Self-Check: PASSED

- `skill/SKILL.md` — FOUND, 7,829 bytes, contains Embedding Checklist / Going Deeper / Published-Surface Boundary sections
- `skill/VERIFY.md` — FOUND, 7,184 bytes, byte-identical to `$HOME/.claude/skills/sigil/VERIFY.md`
- Commit `bebd5b2` — FOUND in `git log --oneline --all`
- Commit `48ce29e` — FOUND in `git log --oneline --all`
- `npm test` — 25 files, 1528 tests, all passed
- `npm run lint` / `npm run typecheck` — both exit 0

## Next Phase Readiness

Wave 3 (this plan) is now closed. 08-04 remains: the correspondences plan, gated behind the D-113 human `checkpoint:decision`, which owns SKILL-02. `test/skill-cli-parity.test.js`'s REQUIREMENTS.md checkbox for SKILL-01 was deliberately left unchecked by this plan — this plan built the mechanics and the verification instrument, but SKILL-01 itself is only satisfied once `skill/VERIFY.md`'s Procedure 1 (D-118) is actually run and passes, which is a blocking human gate at phase seal (D-119), not an automated step this plan performs. Everything this plan built stays untouched by 08-04's scope — the embedding checklist, progressive-disclosure pointers, published-surface boundary, and `skill/VERIFY.md`'s two procedures are all final as authored here, independent of whether the correspondences land.

---
*Phase: 08-the-sigil-skill*
*Completed: 2026-08-09*
