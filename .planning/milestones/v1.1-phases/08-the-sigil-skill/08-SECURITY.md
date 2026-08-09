---
phase: 08
slug: the-sigil-skill
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
block_on: high
created: 2026-08-09
audit_type: retroactive
register_authored_at_plan_time: true
---

# Phase 08 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

**Audit type:** retroactive, run after the v1.1 milestone shipped. The register was authored at plan time across all four plans.

**Result: SECURED.** 19 threats, 16 mitigations closed, 3 accepted, 0 open — plus one advisory that was **acted on rather than filed**, because the audit proved it exploitable. See § The advisory that became a fix.

**Distinctive risk shape.** This phase ships *instructions an autonomous agent executes*. The skill tells a Claude Code session to build and run a shell command from user-supplied text. That is a command-injection surface mediated by prose rather than by code, and prose is a materially weaker control than a mechanism — which is exactly what the audit demonstrated.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| user prose → agent-assembled shell command | The skill instructs an agent to put a free-form intention statement into a command line | Untrusted text into a shell |
| repo `skill/` → `~/.claude/skills/sigil/` | An install script writes into Matt's real home directory | Files, one-directional |
| skill content → any Claude Code session, on any machine | The installed skill is global; a machine-local path baked into it breaks everywhere else | Documented instructions |
| documented surface → published registry surface | The skill describes what the published package exposes; a claim ahead of reality fails on every consumer machine | API claims |
| Matt's lineage material → the public registry | The correspondences are personal esoteric knowledge; reaching npm would be irreversible | Personal content |
| `npx -y` → the registry | Auto-install without a prompt; the exact scoped name is the typosquat control | Package identity |

---

## Threat Register

19 threats across the four plans' `<threat_model>` blocks.

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| **T-08-01** | Tampering | **the invocation recipe — shell quoting of a user-supplied statement** | **high** | mitigate | Both declared halves present and **empirically proven effective**: the escape idiom contains the payload, and the `-` stdin sentinel (real, at `bin/sigil-spinner.js:167`) removes shell quoting from the path entirely. Package name byte-exact against the registry across four forms. **Strengthened after the audit** — the stdin form is now the primary example rather than a sub-bullet; see § The advisory that became a fix | closed (control strengthened) |
| T-08-02 | Tampering | `skill-install.js` destination resolution | medium | mitigate | `path.join(os.homedir(), '.claude', 'skills', 'sigil')` (`:43`); the only argv read is `includes('--force')` (`:45`); zero `process.env` reads. Probed five argv shapes and five environment variables — **0 files redirected**. Two-pass classify-then-write (`:120-152`). See residual R-2 on the wording | closed |
| T-08-03 | Tampering | `skill-install.js` overwrite behaviour | medium | mitigate | Divergence exits 1 with the path named and the file left unmodified (`:124-136`). An orphan **survived both a plain and a `--force` install** and was reported, never deleted (`:95-104`). Nothing is read from the destination back into the repo | closed |
| T-08-04 | Elevation of Privilege | `allowed-tools` frontmatter | low | mitigate | Exactly six declared: Bash, Read, Write, Edit, Glob, Grep (`SKILL.md:15-21`). The field is a same-turn pre-approval, not a sandbox, so the risk direction is over-granting convenience | closed |
| T-08-05 | Repudiation | the skill's stated planet reasoning (deferred from 08-01 to 08-04) | low | **accept** | See Accepted Risks R-08-01 | closed — accepted risk |
| **T-08-06** | Tampering | parity extraction returning an empty set instead of failing | **high** | mitigate | Both parsers throw named errors (`skill-cli-parity.test.js:144-151, 223`); fail-loud string scanner at `:104-125`. 13/13 soundness tests green, including zero-anchor, dual-anchor, spread-entry, structural-string, and a benign control | closed |
| T-08-07 | Denial of Service | the install-parity test reading under the home directory | low | mitigate | Zero write calls (grep for write/mkdir/rm/unlink/append finds nothing); walks bounded to `skill/` and `~/.claude/skills/sigil/`. See residual R-3 on the wording | closed |
| T-08-08 | Tampering | importing `bin/sigil-spinner.js` into the test process would reach `process.exit` | medium | mitigate | Read with `readFileSync` (`:50`); repo-wide grep for an import or require of that path inside `test/` returns 0 matches; rationale recorded at `:19-29` | closed |
| **T-08-09** | Repudiation | **a guard that has only ever been observed green** | **high** | mitigate | **Re-executed live by this audit, not accepted from the summary.** Four mutations, all red with their intended messages: phantom skill flag → `documents flag(s) the CLI does not have`; extra CLI option → `has option(s) undocumented in skill/SKILL.md`; installed-copy divergence → `diverged from repository source`; orphan → `orphan at destination`. All restored, all green, working tree clean | closed |
| **T-08-10** | Tampering | **documenting a package subpath the registry does not expose** | **high** | mitigate | State changed after phase close and was re-verified — see § Post-close state change below. The rewritten section is factually correct against the live registry, and the mitigation *mechanism* (a live re-query rather than an assumption) was honoured for the rewrite, not merely accidentally satisfied | closed |
| T-08-11 | Spoofing | a second markdown table read as the flag table | medium | mitigate | The post-close rewrite introduced **zero** table rows into the Published-Surface Boundary section — it is a numbered list. Extracted token set unchanged: `--curve --glyph --id-prefix --json --output --planet --title` | closed |
| T-08-12 | Repudiation | a verification procedure with an unstated precondition | medium | mitigate | `skill/VERIFY.md:9-14` states the session-restart condition explicitly, including the first-creation-versus-live-edit distinction — without which a first run reports a false negative indistinguishable from a real routing failure | closed |
| T-08-13 | Information Disclosure | a machine-local path leaking into a globally-installed skill | medium | mitigate | `grep -rEn 'RitualSync\|/Users/\|/home/' skill/` returns nothing | closed |
| **T-08-14** | Spoofing | correspondence content presented as Matt's lineage when unratified | **high** | mitigate | `correspondences.md:5-9` carries the attribution block and the ratification date 2026-08-09, plus an explicit honest-limitation paragraph naming that the corpus contained no pre-existing table. `grep -ci unratified` returns 0 in both files — the draft-state marker is fully absent from the shipped tree | closed |
| T-08-15 | Repudiation | a correspondence set drifted from current practice | medium | **accept** | See Accepted Risks R-08-02 | closed — accepted risk |
| T-08-16 | Tampering | the correspondence table's row shape read as a flag row | medium | mitigate | Planet-table first cells are `**Saturn**` and similar; the guard regex is anchored to a backticked double-hyphen token in the first cell and cannot match. Token set re-extracted after the table landed: still exactly the seven | closed |
| T-08-17 | Tampering | the forced reinstall overwriting the destination | medium | mitigate | `diff -rq skill/ ~/.claude/skills/sigil/` identical, 3 files, no orphan; the force path names every overwrite (`:151`) | closed |
| **T-08-18** | Information Disclosure | **personal lineage material reaching the registry** | **high** | mitigate | **Verified against the real published tarball**, not a dry run. `npm pack @falkensmage/sigil-spinner@1.1.0` → 19 files, roots `bin/ LICENSE package.json README.md src/`. `skill/`, `scripts/`, `correspondences`, `SKILL.md`, and `VERIFY.md` are all **absent**; extracted content greps clean for `RitualSync` and `/Users/`. Matt's planet correspondences are not on the registry | closed |
| T-08-SC | Tampering | the registry fetch the documented `npx` invocation performs | low | **accept** | See Accepted Risks R-08-03 | closed — accepted risk |

---

## The advisory that became a fix — T-08-01

T-08-01's declared mitigation was present and worked, so the threat closed as declared. The audit nonetheless demonstrated a real exploitation path, and it was fixed rather than filed.

**The problem was position, not absence.** The skill's primary code block carried a pre-quoted `'<statement>'` placeholder — a shape that *looks* already-safe. The shell-safety guidance sat two lines below it, and the stdin sentinel was nested as a sub-bullet beneath the second option. An agent scanning for "the command to run" reaches the code block first; one that substitutes statement text into that placeholder and does not read on produces the vulnerable command.

Reproduced independently, with a harmless marker, using the local binary:

| Path an agent might follow | Result |
|---|---|
| The primary code block's `'<statement>'` shape | **INJECTED** — the marker command executed |
| The single-quote + `'\''` idiom (guidance, line 41) | contained — valid sigil, marker never ran |
| The `-` stdin sentinel (sub-bullet, line 45) | contained — statement treated as data |

The mitigation worked wherever it was followed. It was simply on the wrong side of a skim.

**Fix applied 2026-08-09:** the stdin form is now *the* code block; the argument form is demoted to a clearly-labelled fallback for interactive one-offs, carrying an explicit statement of what goes wrong and why. This converts the control from *prose an agent must read* into *the shape an agent copies*, at no cost to any other threat — it introduces no table, so T-08-11 and T-08-16 are untouched, and the flag token set is unchanged (13/13 parity tests green). The installed copy was refreshed and `diff -r` confirms byte-identity.

**What the fix does not do:** the argument form is still injectable if an agent uses it with unexamined prose — that is a property of shell quoting, not of this file. The fix changes which shape is copied and states the hazard plainly at the point of use. Making the unsafe shape impossible would require the skill to stop documenting argument-passing at all, which would break legitimate interactive use.

---

## Post-close state change — T-08-10

This threat's state changed *after* the phase closed, so it is recorded rather than silently re-verified.

At phase close, published `1.0.0` exposed only `.`. The skill therefore documented inline-SVG embedding only, and an acceptance criterion asserted the element subpath string was **absent** from the file — correct at the time.

Since then, at v1.1 milestone close: `1.1.0` was published **with** the `./element` subpath, and the skill's Published-Surface Boundary was rewritten to describe both embedding paths. Re-verified in this audit:

- `npm view @falkensmage/sigil-spinner@1.1.0 exports` returns exactly `.`, `./element`, `./package.json` — matching `SKILL.md:115` verbatim
- The sharp form was checked, not assumed: a fresh registry install resolves `./element` to a real file and throws `ReferenceError: HTMLElement is not defined` exactly as the skill documents, while `/nope` gives `ERR_PACKAGE_PATH_NOT_EXPORTED`
- The light-DOM claim holds (zero `attachShadow`), and the referenced drift guard exists (`element-docs.test.js:44`)
- **The mitigation mechanism was honoured, not bypassed**: commit `4f6a115` records "Re-queried live rather than assumed" and names the three entry points. The rewrite was correct *because* the registry was consulted, which is the control this threat specifies — not correct by luck

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| R-08-01 | T-08-05 | Deferred from 08-01 to 08-04, where the attribution line and capture date make a ratified row distinguishable from a drifted one. Accepted at 08-01 because that plan shipped no correspondence content at all; discharged in substance by T-08-14's attribution block | Plan-time (08-01) | 2026-08-09 |
| R-08-02 | T-08-15 | The attribution line's capture date lets a later reader tell when the rows were ratified, but **no mechanism exists for noticing that a shipped table has gone stale** relative to Matt's current practice — the parity guard covers flags, not judgment. Accepted with the gap recorded, and it is genuinely recorded in the artifact itself: `correspondences.md:7` states "no mechanism here for detecting staleness, only this dated record." Reopen condition is the arrival of the first correction | Plan-time (08-04), re-verified 2026-08-09 | 2026-08-09 |
| R-08-03 | T-08-SC | No package is installed into this repository by the phase; `dependencies` and `devDependencies` are untouched. The runtime fetch the skill instructs is of this project's own scoped package, published with a verified provenance attestation, and the fully scoped name is documented byte-exact — independently confirmed against the registry across four occurrences, which is the practical typosquat control. Accepted with the attestation as the transfer | Plan-time (all four plans), re-verified 2026-08-09 | 2026-08-09 |

---

## Threat Flags channel — the positive control

**All four summaries carry `## Threat Flags`, and all four report "None" with per-threat evidence** — for example 08-02 records `grep -c "import .*bin/sigil-spinner"` → 0, and 08-03 records the live registry re-query and its zero-match assertion.

Phase 8 is the only v1.1 phase where this channel was populated (Phases 5, 6, and 7 all omit the section entirely). It functions here as genuine confirmation of the register rather than as boilerplate.

Worth stating honestly about its limits: the channel confirmed the register and surfaced nothing it missed — but it also did not surface the T-08-01 positioning problem or the two prose-precision issues below. **It works as confirmation, not as independent detection.** That is a real distinction, and it is the argument for a security pass in addition to the channel rather than instead of it.

---

## Residuals — none blocking

**R-2 — T-08-02's prose is slightly overstated.** The plan says the destination is "never taken from argv or an environment variable." The script's own code is clean, but `os.homedir()` consults `$HOME` on POSIX, and `env HOME=<probe> node scripts/skill-install.js` did write into the probe directory. The security property that matters holds — segments after the home directory are fixed literals, and relative paths come from `path.relative` over real entries, so there is no traversal primitive — and anyone controlling `$HOME` already controls the process. Documentation precision only.

**R-3 — T-08-07's prose is slightly imprecise.** The mitigation says the walk "is rooted at the repository's own skill tree." It also walks `INSTALLED_ROOT` (`skill-install-parity.test.js:103`) to find orphans. That is a bounded, read-only walk of `~/.claude/skills/sigil/`, not of the home directory, so the property holds and the threat is closed. The sentence under-describes what the code does.

**R-4 — incidental, outside the register (low).** `scripts/skill-install.js:150` uses `writeFileSync`, which follows symlinks; a pre-existing symlink at a destination path would be written through on `--force`. This requires prior write access to `~/.claude/skills/sigil/`, meaning the home directory is already compromised. Recorded only because this script writes into Matt's real home directory.

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Accepted | Open | Run By |
|------------|---------------|--------|----------|------|--------|
| 2026-08-09 | 19 | 16 | 3 | 0 | Claude (gsd-security-auditor, retroactive State B) |

Verification hygiene: the audit performed live mutation proofs on `skill/SKILL.md`, `bin/sigil-spinner.js`, and the installed copy, then restored all three and confirmed `cmp`-identity against pre-mutation backups. `git status --porcelain` empty afterwards. Full suite 25 files / 1,532 tests green. All scratch directories removed.

The T-08-01 fix was applied by the orchestrator after the audit returned, and re-verified: parity guards 13/13, install-parity green, installed copy byte-identical, zero flag-table rows introduced.

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-08-09

**Carried forward, not blocking:** two prose-precision corrections (R-2, R-3) and one incidental symlink note (R-4). The correspondence-staleness gap (R-08-02) remains accepted with its reopen condition stated.
