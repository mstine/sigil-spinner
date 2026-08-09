---
phase: 08-the-sigil-skill
verified: 2026-08-09T15:30:00Z
human_verified: 2026-08-09T15:52:00Z
status: passed
score: 7/7 must-haves verified
behavior_unverified: 0
overrides_applied: 0
gaps: []
human_verification_outcome: |
  The single behavior-unverified item — the cold-session routing and reasoning
  check (ROADMAP Success Criterion 1 / SKILL-01, D-118/D-119) — was performed by
  Matt on 2026-08-09 under Claude Code 2.1.226, per `skill/VERIFY.md` Procedure 1:
  a brand-new session opened after `npm run skill:install -- --force`, in a scratch
  directory outside this repository. All four pass conditions held. Only the two
  verbatim prompts were typed; nothing was supplied at any point in the exchange,
  which is what carries condition 4. Recorded in `skill/VERIFY.md`'s Results block
  and `08-UAT.md`. This resolves the item by observation, not by override —
  no gate was waived.
behavior_unverified_items:
  - truth: "In a fresh Claude Code session in an unrelated directory, asking for a sigil produces a correct one — the user never has to name the tool, the package, or the flags (ROADMAP Success Criterion 1 / SKILL-01)."
    test: "Open a brand-new Claude Code session (started after `npm run skill:install` completed), cd into a `mktemp -d` scratch directory outside this repo, and type the two fixed prompts verbatim from `skill/VERIFY.md` Procedure 1 — never naming the tool, package, or a flag."
    expected: "All four pass conditions hold: (1) the skill fired unprompted, (2) a correct SVG sigil was produced, (3) a planet was chosen with reasoning stated in the reply (not a bare name, not a question bounced back), (4) no flag or package name came from the user at any point."
    why_human: "No automated proxy exists by design (D-119). Skill routing/discovery is a property of the live Claude Code agent's own request-to-skill matching — a subagent spawned from this verification session inherits this session's context (it has already seen the repo, the skill files, and this very task) and would prove nothing about whether a genuinely cold session routes to the skill unprompted. `skill/VERIFY.md`'s own Results block is confirmed still blank (unfilled `Date:` / `PASS / FAIL` fields) — the check has never been run."
human_verification:
  - test: "Run `skill/VERIFY.md` Procedure 1 (cold-session routing and reasoning check) exactly as written, including its stated preconditions (fresh install, brand-new session started after install, scratch directory outside the repo)."
    expected: "All four pass conditions recorded individually in the Results block; a partial pass counts as a fail."
    why_human: "This is the only way to observe live skill discovery/routing behavior — the mechanism the entire phase goal depends on ('picks the right planet ... without the user naming the tool first'). It cannot be simulated from within a session that already has this repo's context loaded."
---

# Phase 8: The Sigil Skill Verification Report

**Phase Goal:** A Claude Code session in any directory, that has never seen this repo, picks the right planet for the intent and embeds a correct sigil — without the user naming the tool first.
**Verified:** 2026-08-09T15:30:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

Sourced from ROADMAP.md § Phase 8 Success Criteria (the roadmap contract) plus each plan's `must_haves.truths`, deduplicated.

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | (SC1/SKILL-01) In a fresh Claude Code session in an unrelated directory, asking for a sigil produces a correct one — the user never has to name the tool, the package, or the flags. | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | All mechanics that make this *possible* are present and independently verified (repo-canonical `skill/SKILL.md`, one-directional install script, byte-identical installed copy, live-registry-verified invocation string, description frontmatter with trigger vocabulary and SKIP clause). But whether a cold session actually *routes* to the skill unprompted and produces correct, reasoned output is runtime agent behavior no grep or unit test can observe. `skill/VERIFY.md` Procedure 1 is the designed instrument and its Results block is confirmed still blank. REQUIREMENTS.md itself carries SKILL-01 as `- [ ]` (unchecked) and "Not started" in its traceability table — the project's own bookkeeping agrees this is open. |
| 2 | (SC2/SKILL-02) The planet chosen is a reasoned choice grounded in Matt's own correspondences, with the reasoning stated — not a guess, and not a question bounced back to the user. | ✓ VERIFIED | `skill/SKILL.md`'s Planet Selection section carries a ratified seven-row table, a verb-over-subject selection heuristic for the ambiguous two-planet case, and an explicit "state the reasoning out loud, every time" / "never bounce the choice back" instruction. `skill/references/correspondences.md` carries the attribution ("came from Matt directly, ratified in conversation on 2026-08-09"), an honest corpus-limitation note, and three worked examples. The Saturn amendment Matt made in ratification ("it's both" — holds stability and restriction as one working, not collapsed to one pole) is present verbatim in the shipped table (line 75 of `skill/SKILL.md`). `<!-- SKILL-02 pending -->` marker count is 0. This is a content/authorship claim, not a runtime-behavior claim, so it is directly checkable from the artifact and I did so. |
| 3 | (SC3/SKILL-01 mechanics) The skill's documented invocation runs against the published package, verified live, not against a local path that only works on this machine. | ✓ VERIFIED | `skill/SKILL.md`'s invocation section documents `npx -y @falkensmage/sigil-spinner@latest '<statement>' --planet <planet>` — no local path. 08-01-SUMMARY and 08-04-SUMMARY both record this exact string run for real from `mktemp -d` scratch directories outside the repo against the live registry, exit 0, empty stderr, stdout beginning with a valid `<svg...>` root. `skill/VERIFY.md` Procedure 2 documents this as a repeatable instrument. I did not re-run the live npx invocation myself (network/registry side effect), but the invocation string is present, contains no local-path leakage (`grep -rEl 'RitualSync|/Users/' skill/` → no output, independently reproducible), and two independent plan executions recorded live success. |
| 4 | (SC4/SKILL-03) A mechanical drift check fails loudly when the skill's documented flags or options stop matching the CLI's actual surface. | ✓ VERIFIED | `test/skill-cli-parity.test.js` exists, is bidirectional (both a skill-only extra flag and a CLI-only extra flag fail), and is fail-first-proven. I independently reproduced the guard tripping: deleted the `--title` row from `skill/SKILL.md` and re-ran the suite — 2 of 13 tests failed with `bin/sigil-spinner.js has option(s) undocumented in skill/SKILL.md: title`; restored, re-ran — 13/13 passed. The one Critical code-review finding (CR-01: `parseCliOptionKeys` silently dropped unparseable `options:` entries, which could let the guard pass on a wrong-but-equal set) was fixed, not waived — confirmed present in current source (`could not parse a key from an options entry in bin/sigil-spinner.js` at line 193, with a soundness test at line 285) and covered by the full green suite. |
| 5 (plan-level) | `npm run skill:install` copies `skill/` into the personal skill directory one-directionally, and refuses to replace a diverged destination file without `--force`. | ✓ VERIFIED | `scripts/skill-install.js` exists (128+ lines, real logic, not a stub); destination computed only from `os.homedir()` plus fixed segments. `$HOME/.claude/skills/sigil/` confirmed byte-identical to `skill/` via `diff -r` (I ran this independently). 08-01-SUMMARY and 08-02-SUMMARY both record live mutation proofs (divergence → exit 1 naming the path → `--force` restores; orphan reported not deleted). |
| 6 (plan-level) | The npm tarball still contains no repo-only directory — `skill/` and `scripts/` are absent from `npm pack` output. | ✓ VERIFIED | Independently ran `npm pack --dry-run --json` — 19 files, `skill/` present: false, `scripts/` present: false. `package.json.files` still exactly `["src","bin","README.md"]` (confirmed via direct `require`). |
| 7 (plan-level) | `npm run lint` and `npm run typecheck` both cover the new install script rather than silently skipping it. | ✓ VERIFIED | `eslint.config.js` / `tsconfig.json` extended to include `scripts/**/*.js` (08-01-SUMMARY). Independently ran `npm run lint` and `npm run typecheck` — both exit 0 on the current tree, which includes `scripts/skill-install.js`. |

**Score:** 6/7 truths verified (1 present, behavior-unverified — see `behavior_unverified_items`)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `skill/SKILL.md` | Frontmatter, invocation recipe, seven-row flag table, planet table + heuristic, embedding checklist, progressive-disclosure pointers, published-surface boundary | ✓ VERIFIED | Read in full. All sections present and substantive (116 lines). `description` carries D-102's five required elements including the SKIP clause naming `oracle`/`decide`. No `SKILL-02 pending` marker remains. |
| `scripts/skill-install.js` | One-directional repo → personal-skill-dir install, fail-rather-than-merge on divergence | ✓ VERIFIED | Exists, wired (`package.json` `scripts.skill:install` runs it), byte-identity confirmed against installed copy, mutation-proven in SUMMARY and cross-checked here. |
| `test/skill-cli-parity.test.js` | Bidirectional CLI↔skill drift guard, fail-first-proven | ✓ VERIFIED | 13 tests, independently re-mutated and confirmed red-then-green. CR-01 fix present in source. |
| `test/skill-install-parity.test.js` | Byte-identity guard between `skill/` and installed copy, conditional no-op when absent | ✓ VERIFIED | 2 tests passing; `diff -r skill $HOME/.claude/skills/sigil` confirms identity directly. |
| `skill/VERIFY.md` | Fixed-prompt cold-session procedure (Procedure 1) and live-registry procedure (Procedure 2) | ✓ VERIFIED as an artifact / ✗ NOT YET RUN as an instrument | The file exists with both procedures fully specified. Its Results blocks are confirmed blank — this is expected, since running Procedure 1 is exactly the outstanding human-verification item. |
| `skill/references/correspondences.md` | Attribution, honest limitation note, worked examples | ✓ VERIFIED | Read in full. Attribution line present and dated, three worked examples present including the Saturn both-poles case. |
| `package.json` | One new `scripts.skill:install` key; `files`/`dependencies`/`exports`/`version` untouched | ✓ VERIFIED | Confirmed via direct `require('./package.json')` read. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `skill/SKILL.md` | published npm package | documented `npx -y @falkensmage/sigil-spinner@latest` invocation | ✓ WIRED | String present, no local-path leakage (independently grepped), two independent live runs recorded in SUMMARYs. |
| `scripts/skill-install.js` | personal skill directory | `os.homedir()` + fixed segments | ✓ WIRED | Confirmed by reading source and by the byte-identical installed copy. |
| `test/skill-cli-parity.test.js` | `bin/sigil-spinner.js` | text-read (never imported) brace-counted scan of `options:` literal | ✓ WIRED | Independently re-triggered the guard; it reads the real CLI source and the real skill table. |
| `skill/SKILL.md` | `skill/references/correspondences.md` | one-hop link | ✓ WIRED | `references/correspondences.md` referenced twice in `SKILL.md`; file exists and is substantive. |
| Ratified content | installed copy | `npm run skill:install -- --force` | ✓ WIRED | `diff -r` confirms byte-identity on the current tree, including the ratified Planet Selection section. |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| SKILL-01 | 08-01, 08-03 (mechanics) | Personal skill discoverable by any cold Claude Code session | ⚠️ NEEDS HUMAN | All supporting mechanics verified; the discoverability claim itself (the requirement's actual text: "a session that has never seen this repo can generate and embed a correct sigil without the user naming the tool first") rests entirely on the unrun cold-session check. REQUIREMENTS.md itself marks this `- [ ]` / "Not started." |
| SKILL-02 | 08-04 | Ratified planet-correspondence judgment | ✓ SATISFIED | Content present, attributed, ratified per the record above; independently confirmed in the artifact. |
| SKILL-03 | 08-02 | Mechanical drift check | ✓ SATISFIED | Independently re-proven to fail loudly on a real mutation and to pass clean when restored; CR-01 soundness fix confirmed present. |

No orphaned requirements — all three phase-mapped IDs (SKILL-01, SKILL-02, SKILL-03) appear in a plan's `requirements:` frontmatter and are accounted for above.

### Anti-Patterns Found

Scanned `skill/SKILL.md`, `skill/VERIFY.md`, `skill/references/correspondences.md`, `scripts/skill-install.js`, `test/skill-cli-parity.test.js`, `test/skill-install-parity.test.js` for TBD/FIXME/XXX/TODO/HACK/PLACEHOLDER, empty-return stubs, and hardcoded-empty-data patterns.

None found in shipped skill content or scripts. The only "pending"-shaped marker in the history (`<!-- SKILL-02 pending: correspondences not yet captured from Matt -->`) was a plan-scoped, explicitly-designed placeholder (D-114) and is confirmed absent from the current tree (`grep -c 'SKILL-02 pending' skill/SKILL.md` → 0, per 08-04-SUMMARY and independently re-confirmed by reading the file).

`INTENTIONALLY_UNDOCUMENTED` in `test/skill-cli-parity.test.js` is an empty array by design (D-108) — independently confirmed; not a stub, a deliberate allowlist with wired soundness proof.

No debt markers requiring the gate in Step 7.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full suite green | `npm test` | 25 files, 1532 tests, all passed | ✓ PASS |
| Typecheck | `npm run typecheck` | exit 0 | ✓ PASS |
| Lint | `npm run lint` | exit 0 | ✓ PASS |
| Pack smoke test | `npm run test:pack` | 1 file, 2 tests, passed | ✓ PASS |
| Drift guard actually bites (skill-only extra) | delete `--title` row from `skill/SKILL.md`, run `npx vitest run test/skill-cli-parity.test.js` | 2/13 failed: `bin/sigil-spinner.js has option(s) undocumented in skill/SKILL.md: title` | ✓ PASS (guard proven, then restored to 13/13) |
| Tarball boundary | `npm pack --dry-run --json` | 19 files; `skill/` absent, `scripts/` absent | ✓ PASS |
| Install byte-identity | `diff -r skill "$HOME/.claude/skills/sigil"` | no output (identical) | ✓ PASS |
| Cold-session routing (SC1) | `skill/VERIFY.md` Procedure 1 | not run — Results block blank | ? SKIP → routed to human verification |

### Human Verification Required

### 1. Cold-Session Routing and Reasoning Check (skill/VERIFY.md Procedure 1)

**Test:** From a genuinely new Claude Code session (started after `npm run skill:install` has completed), in a `mktemp -d` scratch directory unrelated to this repo, type — verbatim, without naming the tool, package, or any flag — the two fixed prompts:
1. "make me a sigil for 'I WILL FINISH THIS'"
2. "I need a sigil for a page about letting go of an old job — pick the planet."

**Expected:** All four pass conditions hold individually: (1) the skill fired unprompted, (2) a correct SVG sigil traced from the stated statement on a real planet's kamea was produced, (3) a planet was chosen with the reasoning stated in the reply (not a bare name, not a question bounced back), (4) no flag or package name came from the user at any point.

**Why human:** This is runtime agent routing/discovery behavior. No grep, unit test, or subagent invocation can honestly substitute — a subagent spawned from any session that has already loaded this repo's context (including this verification) inherits that context and proves nothing about whether a truly cold session routes to the skill on its own. This is D-119's explicit, designed conclusion, and the phase's own executor plans correctly declined to self-certify it (08-04-SUMMARY records it as "OUTSTANDING, NOT PERFORMED").

## Gaps Summary

No structural gaps — every artifact, key link, and drift guard this phase was supposed to build exists, is substantive, is wired, and (where independently re-testable) was re-tested and confirmed. Code review's one Critical finding was fixed and confirmed fixed, not waived. `src/` and `bin/` are untouched this phase, so zero regression risk to the published package's own behavior.

The phase is not `passed` because its headline success criterion — "a Claude Code session in any directory, that has never seen this repo, picks the right planet for the intent and embeds a correct sigil — without the user naming the tool first" — is a claim about live agent routing behavior that has not yet been observed. Everything that makes that observation *possible* is built and correct; the observation itself has not happened. `skill/VERIFY.md` Procedure 1 is the designed, ready-to-run instrument. REQUIREMENTS.md's own bookkeeping agrees (SKILL-01 unchecked, "Not started").

This is `human_needed`, not `gaps_found` — nothing is broken or missing, one thing that only a human (in a fresh session) can observe has not yet been observed.

---

_Verified: 2026-08-09T15:30:00Z_
_Verifier: Claude (gsd-verifier)_
