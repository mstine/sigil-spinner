---
phase: 08-the-sigil-skill
plan: 01
subsystem: distribution/skill
tags: [agent-skills, cli-drift-guard, install-script, npx, tracer]
status: complete

dependency-graph:
  requires: []
  provides:
    - "skill/SKILL.md (repo-canonical Agent Skills source)"
    - "scripts/skill-install.js (one-directional repo -> personal-skill-dir installer)"
    - "package.json scripts.skill:install"
  affects:
    - "eslint.config.js (files glob)"
    - "tsconfig.json (include array)"

tech-stack:
  added: []
  patterns:
    - "Two-pass classify-then-write file sync (node:fs builtins only, no new dependency)"
    - "Agent Skills frontmatter matching house convention (capture/draft/oracle SKILL.md)"
    - "Bidirectional-safe flag-table markdown shape reused by 08-02's drift check"

key-files:
  created:
    - skill/SKILL.md
    - scripts/skill-install.js
  modified:
    - package.json
    - eslint.config.js
    - tsconfig.json

decisions:
  - "D-99 confirmed by Matt at pre-execution gate: repo-canonical skill/, ~/.claude/skills/sigil/ is an installed copy, install is one-directional with a parity guard (option-a)"
  - "D-100 confirmed by Matt at pre-execution gate: package.json files array is not extended — skill/ never ships in the npm tarball, no edit to test/pack-install.test.js (option-a)"
  - "allowed-tools declares all six of Bash/Read/Write/Edit/Glob/Grep for the correct reason per RESEARCH.md: pre-approval to avoid a mid-cold-session permission prompt, not a hard restriction"
  - "Flag table stays inline in SKILL.md rather than delegating to --help, because sigil-spinner --help does not exist (verified live) — D-104's amendment to PITFALLS.md Pitfall 11"
  - "Planet-selection judgment (D-102 element 4) deliberately withheld from the description and body this plan; a pending-correspondences HTML comment marks the gap per D-114"

actuals:
  tokens: 3100
  tasks: 3
  commits: 1

metrics:
  duration: ~35min
  completed: 2026-08-09
---

# Phase 8 Plan 01: Sigil Skill Tracer — Repo-Canonical Source, Install, Live Invocation Summary

**One-liner:** Repo-canonical `skill/SKILL.md` with a one-directional `npm run skill:install` and a documented `npx` invocation, proven end to end against the live npm registry from outside the repo.

## What Was Built

This plan is the phase's tracer: it proves the whole runtime path — authored skill source, installed copy, and a real invocation against the published package — in one thin, production-quality slice.

- **`skill/SKILL.md`** — the repo-canonical source (D-99). Frontmatter: `name: sigil`, `scope: personal` (house convention, confirmed inert-but-harmless at the platform level per RESEARCH.md), `allowed-tools` declaring `Bash`, `Read`, `Write`, `Edit`, `Glob`, `Grep`, and a `description` carrying D-102 elements 1 (what — planetary sigils, kamea, intention statements, embeddable CSS-stylable SVG), 2 (trigger vocabulary — "make me a sigil", "sigilize this intention", "planetary sigil", "kamea", "sigil for a page"), 3 (build-context trigger), and 5 (SKIP clause naming `oracle` and `decide` by name). Element 4 (planet-selection judgment) is deliberately withheld per D-114 until 08-04 ratifies the correspondences.
  - Body: an invocation section documenting `npx -y @falkensmage/sigil-spinner@latest '<statement>' --planet <planet>`, explaining `-y` and `@latest`, and stating the shell-safety rule explicitly (single-quote escaping, or the CLI's `-` stdin sentinel as the preferred form for programmatic assembly) plus the library-form alternative.
  - A seven-row markdown flag table (`--planet`, `--json`, `--output`, `--glyph`, `--curve`, `--id-prefix`, `--title`) matching `bin/sigil-spinner.js`'s `parseArgs` options exactly — this table deliberately overrides `PITFALLS.md` Pitfall 11's "delegate to `--help`" guidance because `sigil-spinner --help` does not exist.
  - A `<!-- SKILL-02 pending: correspondences not yet captured from Matt -->` marker in place of any planet table, per D-114.
- **`scripts/skill-install.js`** — Node-builtins-only (`node:fs`, `node:path`, `node:os`, `node:url`), one-directional copy from `skill/` to `os.homedir()/.claude/skills/sigil/`, with a destination computed only from `os.homedir()` plus fixed segments (never argv/env). Two-pass: classify every file as new/identical/divergent, then act. Any divergence without `--force` writes nothing, names every divergent path, and exits non-zero; `--force` overwrites and names every path it touched. Orphan files at the destination are reported, never deleted.
- **`package.json`** — exactly one new key, `scripts["skill:install"]`. `files`, `exports`, `main`, `bin`, `version`, `dependencies`, `devDependencies` all untouched.
- **`eslint.config.js`** / **`tsconfig.json`** — extended their existing `files`/`include` arrays to add `scripts/**/*.js`, so the new install script is linted and type-checked rather than silently outside both gates.

## Checkpoint Resolutions (confirmed by Matt at a pre-execution gate, not re-prompted during this run)

| Gate | Resolution | Alternatives declined |
|---|---|---|
| **Task 1 — D-99** (where the skill's canonical source lives) | **option-a**: Repo-canonical `skill/`, `~/.claude/skills/sigil/` is an installed copy, install is one-directional, parity guard exists | option-b (author only in the personal skill directory — un-versioned, un-diffable); option-c (symlink — couples global availability to one repo path on one machine) |
| **Task 2 — D-100** (npm tarball boundary) | **option-a**: `package.json`'s `files` array is not extended — `skill/` stays repo-only, no edit to `test/pack-install.test.js` | option-b (add the skill directory to `files` — irreversible once published, distributes personal lineage judgment to every consumer) |

Both were put to Matt directly in the session that dispatched this plan, and his answers are recorded verbatim above per the pre-resolved-checkpoints instruction — no re-prompting occurred during execution.

## Live Verification Evidence

- `npm view @falkensmage/sigil-spinner version` → `1.0.0` (precondition satisfied before Task 3 began).
- `npm run skill:install` → wrote `/Users/falkensmage/.claude/skills/sigil/SKILL.md`; `cmp -s skill/SKILL.md "$HOME/.claude/skills/sigil/SKILL.md"` exits 0 (byte-identical).
- Second `npm run skill:install` with no intervening edit → `already up to date`, exit 0, nothing written.
- Appending a stray character to the installed copy → `npm run skill:install` exits 1, names the exact path, leaves the file unmodified; `npm run skill:install -- --force` exits 0, names the overwritten path, restores byte-identity.
- `npm run lint` and `npm run typecheck` both exit 0, with `scripts/skill-install.js` inside both gates (confirmed via `npx eslint --debug scripts/skill-install.js` and `tsconfig.json`'s `include`).
- `npm pack --dry-run --json` → 19 files, no `skill/` or `scripts/` root present in the tarball.
- `git status --porcelain test/pack-install.test.js` → no output; `EXPECTED_TARBALL_FILES`/`ALLOWED_TARBALL_ROOTS` untouched.
- **The exact invocation string committed to `skill/SKILL.md`:**
  ```
  npx -y @falkensmage/sigil-spinner@latest '<statement>' --planet <planet>
  ```
  Run for real from a `mktemp -d` scratch directory outside the repo:
  ```
  npx -y @falkensmage/sigil-spinner@latest 'I WILL FINISH THIS' --planet saturn
  ```
  Exit 0, empty stderr, stdout began with `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="sigil sigil--saturn">...`. Resolved registry version at invocation time: `1.0.0` (dist-tag `latest` and `next` both point at `1.0.0`).
- Full suite: `npm test` → 23 files, 1517 tests, all passed.
- **Tracer feedback gate (auto mode active — `workflow._auto_chain_active: true`):** re-ran the plan's full `<verify>` block after the commit (`npm run skill:install && test -f ... && npm run lint && npm run typecheck && npx ... | head -c 5 | grep -q '<svg'`) — passed, `TRACER_OK`. Logged: "⚡ Tracer verified end-to-end — expanding." This plan has no expansion task beyond the tracer, so no further task ran.

## Deviations from Plan

None — plan executed exactly as written. The only in-flight fix was a self-contained typecheck correction (see below), not a deviation from the plan's design.

### Auto-fixed Issues

**1. [Rule 3 — blocking issue] `tsc --checkJs` rejected a `const` type assertion applied to a ternary expression**
- **Found during:** Task 3, first `npm run typecheck` run after authoring `scripts/skill-install.js`.
- **Issue:** `status: /** @type {const} */ (srcContent.equals(destContent) ? 'identical' : 'divergent')` — TS1355: a `const` assertion can only apply to a literal, not to the result of a conditional expression.
- **Fix:** Replaced the inline ternary-plus-cast with a named `classify(relPath)` function carrying an explicit `@returns {Classification}` JSDoc annotation, letting the return-type contract do the narrowing instead of an inline cast.
- **Files modified:** `scripts/skill-install.js`.
- **Commit:** `40cd7e0` (folded into the task's single commit, since the fix landed before the task's own verification ran).

## Known Stubs

None. The `<!-- SKILL-02 pending -->` marker in the Planet Selection section is not a stub in the broken-windows sense — it is the explicit, D-114-mandated placeholder for content that a later plan (08-04) intentionally gates behind a blocking human checkpoint. It is documented in this plan's own design, not an unplanned gap.

## Threat Flags

None. All four threats in this plan's `<threat_model>` (T-08-01 through T-08-04, plus the accepted T-08-05/T-08-SC) were addressed exactly as designed: the shell-safety rule is stated explicitly in the invocation section (T-08-01), the install script's destination is `homedir()`-plus-fixed-segments only with no caller-controlled component and a two-pass write (T-08-02/T-08-03), and `allowed-tools` declares exactly the six needed tools with no over-grant (T-08-04).

## Self-Check: PASSED

- `skill/SKILL.md` — FOUND
- `scripts/skill-install.js` — FOUND
- `$HOME/.claude/skills/sigil/SKILL.md` — FOUND, byte-identical to `skill/SKILL.md`
- Commit `40cd7e0` — FOUND in `git log --oneline --all`
