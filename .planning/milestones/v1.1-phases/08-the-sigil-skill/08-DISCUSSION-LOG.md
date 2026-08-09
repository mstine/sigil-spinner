# Phase 8: The Sigil Skill - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-09
**Phase:** 8-The Sigil Skill
**Mode:** `--auto` — Claude selected the recommended option for every question. No option was chosen by Matt in conversation.
**Areas discussed:** Skill source of truth, Trigger description, CLI mechanics in the skill, Drift-check design, Correspondence format, Human-gate choreography, Invocation form and published-version boundary, Cold-session verification

---

## Skill source of truth and install path

| Option | Description | Selected |
|--------|-------------|----------|
| Repo-canonical `skill/` + one-way install to `~/.claude/skills/sigil/` (recommended) | Source is versioned and reviewable; SKILL-03 runs on a fresh clone and in CI; byte-identity parity guard covers the installed copy | ✓ |
| Author directly at `~/.claude/skills/sigil/` | Simplest; no two copies. But un-versioned, un-diffable, and SKILL-03 becomes unrunnable anywhere but Matt's laptop | |
| Symlink `~/.claude/skills/sigil` → repo `skill/` | Eliminates parity entirely, but couples a global skill to one repo path on one machine, and a branch checkout silently swaps the installed skill | |

**Choice:** Repo-canonical — D-99, D-100, D-101.
**Notes:** Two independent sufficient reasons recorded: the drift check is otherwise unrunnable by the population that would catch drift, and `~/.psyche/identity/design-principles.md` § 10 was written about this exact `~/.claude/skills/` failure mode. Also decided here: `files` is NOT extended (D-100) and `test/pack-install.test.js` needs no edit — recorded explicitly because "add `skill/` to `files` for completeness" is the plausible wrong edit a later agent would make by pattern-matching Phase 7.

---

## Trigger description and activation boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Narrow, third-person, concrete nouns + example trigger phrases + explicit SKIP clause (recommended) | Research measured activation ~20% → ~50% on description quality, → ~90% with example trigger phrases; SKIP clause protects the adjacent `oracle` / `decide` skills | ✓ |
| Broad capability description ("helps with symbolic/esoteric work") | Fires on tarot, natal charts, transits — noise that erodes trust in skill-surfacing generally | |
| Minimal one-liner ("Generates sigils") | Functionally a skill that never fires, because Claude never routes to it | |

**Choice:** Narrow with SKIP clause — D-102, D-103.
**Notes:** Five required elements locked; exact wording left to authoring time. Frontmatter shape (`name: sigil`, `scope: personal`, declared `allowed-tools`) matched to the house convention in `~/.claude/skills/capture` and `~/.claude/skills/draft`. Noted that `allowed-tools` is a *restriction* whose omission fails mid-task rather than at load — under-declaring is the expensive direction.

---

## What CLI mechanics the skill carries

**Live finding that decided this area:** `sigil-spinner --help` does not exist. `parseArgs` declares no `help` option, so `--help` exits with `E_CLI_USAGE: Unknown option '--help'` (verified by execution, 2026-08-09).

| Option | Description | Selected |
|--------|-------------|----------|
| Flag table inline, made safe by SKILL-03's drift check (recommended) | Duplication is enforced mechanically rather than trusted; SKILL-03 becomes the precondition for the choice rather than incidental to it | ✓ |
| Add `--help` to the CLI, then delegate to it as the research prescribes | New CLI capability — its own `INT-*` requirement, its own phase — and unreachable via `npx` until a publish | |
| Point at the installed package's README | Makes a session read 724 lines to learn seven flags | |

**Choice:** Inline table + mechanical guard — D-104, D-105, D-106.
**Notes:** This **amends** `.planning/research/PITFALLS.md` § Pitfall 11, whose mitigation ("never duplicate flag syntax; delegate to `--help`") assumed a `--help` this CLI does not have. Recorded loudly in CONTEXT.md so a downstream agent does not "fix" the skill by deleting the table in deference to the research. Depth split locked (D-105): mechanics and judgment inline, the 15 `--sigil-*` properties / `E_*` tables / folding rules / 16-field working stay in the README and are read on demand.

---

## Drift-check design

| Option | Description | Selected |
|--------|-------------|----------|
| Text-parse both sides, assert set equality in both directions, empty-but-present allowlist (recommended) | Follows the `test/element-docs.test.js` template exactly; a CLI flag the skill omits fails too, not just the reverse | ✓ |
| One-directional (skill flags ⊆ CLI options) | Catches renames but silently permits a new flag to go undocumented forever — the drift this exists to prevent | |
| Import `bin/sigil-spinner.js` and read `parseArgs` config at runtime | Impossible: the file executes at import, reads `process.argv`, and can call `process.exit` | |

**Choice:** Bidirectional text parse — D-107, D-108, D-109.
**Notes:** `INTENTIONALLY_UNDOCUMENTED` allowlist ships **empty** — all seven current options are documented. An empty-but-present allowlist means skipping a flag requires a deliberate edit with a written reason. D-109 requires both directions be fail-first-proven, from the 05-04 precedent where this project shipped an unsound checker whose R1 rule was satisfied vacuously by a whitespace-only excerpt.

---

## Correspondence content format and placement

| Option | Description | Selected |
|--------|-------------|----------|
| Seven-row table + selection heuristic inline; worked examples in a bundled reference (recommended) | The decision-time content is always loaded; the long ambiguous-case reasoning is read on demand | ✓ |
| Everything in a bundled reference file | The differentiating content sits behind a second read; a session under token pressure skips it and guesses — the exact SKILL-02 failure | |
| Everything inline including worked examples | The examples are the longest part and are needed only for the ambiguous minority | |

**Choice:** Split — D-110, D-111, D-112.
**Notes:** The heuristic must cover the case a flat table structurally cannot — a statement reading as two planets at once, which axis wins and why. D-111 locks the "state the reasoning out loud, never bounce the choice back as a question" instruction, because success criterion 2 names both halves. D-112 requires the correspondences be attributed to Matt with a capture date.

---

## How the human gate is choreographed

| Option | Description | Selected |
|--------|-------------|----------|
| Blocking `checkpoint:decision`, Claude arrives with a corpus-grounded draft marked unratified (recommended) | Correcting wrong rows is reliable where authoring seven rows from nothing stalls; nothing ships unratified | ✓ |
| Ask Matt seven open questions | Highest quality in theory; it is blank-page elicitation, and it converts a correction pass into an authoring project | |
| Ship the corpus-derived draft unratified | Makes the skill claim exactly the lineage authority SKILL-02 exists to guarantee — worse than shipping without correspondences | |

**Choice:** Draft-to-correct at a blocking gate — D-113, D-114.
**Notes:** Draft is pulled via `semantic_recall` over the astrological and cross-cutting corpora enumerated in `~/.psyche/identity/behaviors.md` § Corpus-Grounded Readings. Rationale is a cognitive-profile call (task initiation severely impaired, response inhibition/metacognition strong), not a convenience one. D-114 orders the correspondence plan **last** so a "no" or "not now" costs one plan rather than the phase, and requires the `description` be narrowed to not claim judgment if SKILL-02 does not land.

---

## Invocation form and the published-version boundary

**Live finding that decided this area:** published `1.0.0` has `exports: { ".": "./src/index.js" }` only — no `./element`. `versions = '1.0.0'`, `latest = 1.0.0` (verified against the registry, 2026-08-09).

| Option | Description | Selected |
|--------|-------------|----------|
| `npx -y …@latest`, inline-SVG embedding only, element undocumented until `1.1.0` publishes (recommended) | Everything the skill documents actually resolves on a machine that has never cloned this repo | ✓ |
| Document the custom element now, since it exists in the tree | Emits `ERR_PACKAGE_PATH_NOT_EXPORTED` on every machine — a failure that reads as a broken install | |
| Bare `npx @falkensmage/sigil-spinner` without `-y`/`@latest` | Hangs on the install prompt in a non-interactive session; a warm cache silently runs an old version | |

**Choice:** Published-state-only — D-115, D-116, D-117.
**Notes:** The plan must **query the live registry at authoring time** rather than assume in either direction — if `1.1.0` publishes first, the element section is added and the parity check extends to it. No absolute path under `/Users/` and no `~/RitualSync/sigil-spinner` reference may appear in the skill; that is a named review failure. D-117 requires success criterion 3 be discharged by a real `npx` run from a scratch directory — the tarball test proves a different claim.

---

## Verifying that the skill actually fires

| Option | Description | Selected |
|--------|-------------|----------|
| Human-run cold-session check with fixed prompts, written to `skill/VERIFY.md` (recommended) | Repeatable instrument rather than a one-time performance; same argument D-95 made for `examples/element.html` | ✓ |
| Spawn a subagent and check whether it routes to the skill | Inherits this session's context; proves nothing about a cold session's routing | |
| Assert the description contains certain substrings | Proves the file's contents, not that Claude routes to it | |

**Choice:** Human gate with a written procedure — D-118, D-119.
**Notes:** Pass requires all four: skill fired unprompted, correct sigil produced, planet chosen with reasoning stated, no flag or package name supplied by the user. Prompts are fixed in the file so the check is repeatable — a session that has just been told about the tool cannot verify discoverability.

---

## Claude's Discretion

Auto-mode selected the recommended option everywhere, so nothing was deferred to Claude *by Matt*. The following were left deliberately unlocked in CONTEXT.md because no contract depends on them:

- Plan decomposition and ordering, beyond D-114's constraint that the correspondence plan is last
- Whether the install-parity guard is its own test file or lives inside the parity test
- The `skill:install` script's implementation (node script vs. shell one-liner), subject to one-directional and no-silent-overwrite constraints
- The exact `description` wording within D-102's five required elements
- The flag-token extraction regex, subject to a fail-loudly-on-zero-matches guard
- The number of worked examples in the correspondences reference (research suggests 2–4)
- Whether `skill/VERIFY.md` also carries the D-117 npx verification procedure

## Deferred Ideas

- A real `--help` flag on the CLI — its own `INT-*` requirement and phase; reopen when a phase touches the argv surface for another reason
- Publishing `1.1.0` — already the milestone-close action D-98 named; this phase gives it a second consumer
- Extending the skill to cover the custom element once `1.1.0` publishes, including extending the parity check to `observedAttributes`
- An MCP server (separate package, or the zero-dependency guarantee breaks)
- A project-scoped `sigil` skill in a site repo would silently shadow this personal one (precedence: enterprise > personal > project)
- A re-ratification trigger for the correspondences — the parity check covers flags, not judgment
- Publishing the skill as a shareable artifact with the personal lineage content removed
- A PR-triggered CI workflow — unchanged by this phase, which adds no new external prerequisite
- The three v1.0 items with written reopen conditions; the `D-12` condition names `bin/sigil-spinner.js:20`, and this phase reads that file but must not edit it
