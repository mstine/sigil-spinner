# Phase 8: The Sigil Skill - Research

**Researched:** 2026-08-09
**Domain:** Claude Code Agent Skills authoring (`SKILL.md` format, frontmatter, tool-permission semantics), text-parse CLI/skill drift-guard testing, npm-registry-verified `npx` invocation, personal-skill install tooling.
**Confidence:** HIGH on Agent Skills frontmatter/behavior — fetched live from the current official docs on 2026-08-09, cross-checked across two independent official pages (`code.claude.com/docs/en/skills` and `platform.claude.com/docs/en/agents-and-tools/agent-skills/{overview,best-practices}`). HIGH on `npx` invocation mechanics — live-executed against the real published registry during this research session, not assumed. MEDIUM on the drift-check's exact parsing implementation — a design recommendation grounded in the codebase's existing `test/element-docs.test.js` precedent, not yet written or test-run.

## Summary

Almost every design question in this phase was already closed by `08-CONTEXT.md`'s 21 auto-resolved decisions (D-99–D-119) before this research began. This document's job is narrower than usual: verify the two things CONTEXT.md explicitly asked to be re-checked against live, current sources rather than training-era assumptions — the Agent Skills format and the drift-check's parsing surface — and surface anything that changes the *safety margin* of an already-locked decision without relitigating the decision itself.

Two corrections came out of that verification, both load-bearing for how the plan should phrase things, neither one a reason to reopen a locked decision. **First:** `allowed-tools` in Claude Code is not a restriction — it is a same-turn permission *pre-approval* that clears when the next message is sent; every tool remains callable regardless of what's listed, governed by ordinary permission settings. D-103's conclusion (declare `Bash`, `Read`, `Write`, `Edit`, `Glob`, `Grep`) is still correct, but for a different reason than its own text states: under-declaring doesn't make a tool "fail mid-task," it means Claude hits an interactive permission *prompt* during the cold session's `npx` call — which is exactly the kind of interruption SKILL-01's "the user never has to name the tool" criterion is trying to avoid. **Second:** `scope: personal` is not a field the Agent Skills frontmatter spec recognizes at all (confirmed against the complete field table on `code.claude.com/docs/en/skills`) — what actually determines personal vs. project scope is the *directory the skill lives in* (`~/.claude/skills/` vs. `.claude/skills/`), not any frontmatter key. D-103 is still right to keep `scope: personal` for house consistency with `capture`/`draft`/`oracle` (all three already carry it, confirmed live), and an unrecognized YAML key is silently harmless — but the plan should not describe it as functionally load-bearing.

The published package was re-verified live at research time, not assumed: `@falkensmage/sigil-spinner@1.0.0`, `exports: { ".": "./src/index.js" }` — still no `./element` subpath, confirming D-116's premise holds as of 2026-08-09. The documented `npx -y @falkensmage/sigil-spinner@latest "<statement>" --planet <planet>` invocation was run for real, from a scratch directory outside the repo, during this session: it resolved, ran, and produced a clean SVG on stdout with empty stderr and exit 0 — plus two error-path runs (`E_UNKNOWN_PLANET`, `E_MISSING_STATEMENT`, both exit 2) confirming the CLI's own validated-by-the-library error behavior the skill's embedding guidance should not need to duplicate.

The one genuinely new finding this research surfaces that CONTEXT.md's decisions don't already cover: **the skill's documented invocation recipe has a shell-injection-adjacent surface** — a naive `npx ... "<statement>" ...` template with double-quote interpolation breaks (or, in principle, misbehaves) if a real intention statement contains a shell metacharacter (an embedded `"`, `` ` ``, `$(...)`). This is not a vulnerability in the published package — the library already escapes everything that reaches SVG markup — it is a property of how a fresh Claude Code session might construct the Bash command from the skill's example. The mitigation is cheap (single-quote with `'\''`-style embedded-quote escaping, or the CLI's own `-` stdin sentinel, which already exists) and should be stated explicitly in the skill body rather than left implicit in an example that happens to use a statement with no special characters.

**Primary recommendation:** build the drift-check (D-107) using the same "parse as text, never import, derive-don't-transcribe" methodology `test/element-docs.test.js` already proves out in this repo — but note precisely where that template needs to change shape, because `bin/sigil-spinner.js`'s `options: { … }` object is a *nested* multi-line literal (unlike `observedAttributes`' flat array), and a naive line-shape regex is one Prettier reformat away from silently matching zero. A concrete brace-counted extraction is given below in Code Examples, written to fail loudly rather than degrade quietly — continuing this repo's own D-109 lesson.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

Eight gray areas, all auto-resolved. Decision IDs continue from Phase 7's D-98.

**Where the skill actually lives**

- **D-99: The skill's canonical source lives in-repo at `skill/`; `~/.claude/skills/sigil/` is an installed copy and is never the source of truth.** Layout: `skill/SKILL.md` plus `skill/references/*.md`. An `npm run skill:install` script copies repo → home, one direction only, and fails rather than merging if the destination has diverged. Two independent reasons, either of which is sufficient. **(1) SKILL-03 is otherwise unrunnable.** A drift check that reads `$HOME/.claude/skills/sigil/SKILL.md` works on exactly one machine and is a no-op on a fresh clone and on every CI runner — which is the entire population that would catch the drift. **(2) The home directory is a substrate that has already failed this way.** `~/.psyche/identity/design-principles.md` § 10 ("Maintenance Must Not Return to the Failing Substrate") was written about precisely this: an installed skill copy that could silently become the de facto truth until the next sync destroyed it, with the fix being repo-canonical source plus a byte-identity drift guard. — **Reversibility:** costly.
  - Rejected: authoring only at `~/.claude/skills/sigil/`. Un-versioned, un-diffable, un-reviewable, and it makes SKILL-03 a check that can only ever run on Matt's laptop.
  - Rejected: a symlink from `~/.claude/skills/sigil` → the repo's `skill/`. Cheaper and it eliminates the parity question entirely — but it couples a *global* skill's availability to this repo staying at one path on one machine, and a `git checkout` of another branch silently swaps the installed skill underneath every open session. Two copies plus a parity guard is the honest shape.

- **D-100: `package.json`'s `files` array is not extended — `skill/` does not ship in the npm tarball.** It stays `["src", "bin", "README.md"]`, exactly as Phase 6 froze it. `test/pack-install.test.js`'s `EXPECTED_TARBALL_FILES` and `ALLOWED_TARBALL_ROOTS` therefore need **no** edit this phase. — **Reversibility:** one-way once published.

- **D-101: An install-parity guard exists, and its conditionality is a stated exception rather than a silent skip.** It asserts that every file under `~/.claude/skills/sigil/` is byte-identical to its `skill/` counterpart **when that path exists**, and is an explicit, message-printing no-op when it does not. This repo's established convention is *fail loudly rather than skip*; this is the one deliberate exception, because a missing `~/.claude/skills/sigil/` is a **correct state** for any machine that is not Matt's, whereas a missing chromium is a missing prerequisite. The no-op must print why it did nothing.

**The description — the single highest-leverage sentence in the phase**

- **D-102: The `description` frontmatter is third-person, names the concrete nouns a real request contains, carries example trigger phrases, and carries an explicit SKIP clause.** Research measured skill activation moving from ~20% to ~50% on description quality alone, and to ~90% once example trigger phrases were included; a vague description is functionally a skill that does not exist. Required elements (exact wording is Claude's discretion):
  1. **What**, in the tool's own nouns — planetary sigils, kamea magic squares, intention statements, embeddable CSS-stylable inline SVG
  2. **The vocabulary a real request actually uses** — "make me a sigil", "sigilize this intention", "planetary sigil", "kamea", "sigil for a page"
  3. **The build-context trigger** — when embedding a sigil into a page or site being built
  4. **The judgment trigger** — when choosing which planet suits an intention
  5. **A SKIP clause naming the adjacent skills** — this environment already ships `oracle` (tarot spreads, dream work, astrological synthesis) and `decide`. Tarot readings, natal charts, transits, and general symbolic interpretation belong to `oracle` and must not be captured here.
  — **Reversibility:** reversible.

- **D-103: Frontmatter is `name: sigil`, `scope: personal`, plus a declared `allowed-tools`.** `name` must be lowercase-hyphenated and match the parent directory (`~/.claude/skills/sigil/` → `sigil`) or the skill does not load. `scope: personal` matches the house convention in Matt's installed skills (`capture`, `draft`, and others all carry it). `allowed-tools` is declared rather than omitted — but note the failure mode precisely, because it is silent: `allowed-tools` is a *restriction*, so a tool omitted from it fails mid-task rather than at load. The set must cover everything the documented workflows need: `Bash` (to run `npx`), `Read`, `Write`, `Edit`, `Glob`, `Grep`. Under-declaring is the expensive direction. **(See Common Pitfalls below — this research corrects the "is a restriction" claim; the set of tools to declare does not change.)**

**What mechanics the skill carries — and the research correction that forces the answer**

- **D-104: The skill carries the flag table inline, and SKILL-03's drift check is what makes that duplication safe.** This **overrides** `.planning/research/PITFALLS.md` § Pitfall 11's "delegate to `--help`" instruction, because `sigil-spinner --help` does not exist (verified by execution: `E_CLI_USAGE: Unknown option '--help'`). Rejected: adding `--help` to the CLI this phase (scope creep, delayed payoff by a version bump/publish); pointing at the installed README (724 lines to learn seven flags). Taken: document the flags, enforce the documentation mechanically via SKILL-03. **Downstream agents must not "fix" the skill by deleting the flag table in deference to Pitfall 11** — this decision is the amendment.

- **D-105: `SKILL.md` carries mechanics plus judgment; everything exhaustive stays out and is read on demand.** Body budget ≈ under 5k tokens, holding: the invocation recipe, the flag table, the planet table plus selection heuristic, and the embedding checklist. Deliberately *not* restated: the 15 `--sigil-*` custom properties, the full `E_*` and exit-code tables, the letter-handling and folding rules, the JSON working's sixteen fields. The skill points at the installed package's README and the GitHub URL, read only on demand.

- **D-106: The skill carries an operational embedding checklist, not just an invocation recipe.** Five items: (1) supply a **distinct `--id-prefix` per co-embedded sigil**; (2) the **grid layer is present and hidden**, not absent; (3) the **glyph layer is opt-in** and depends on the viewer's font covering U+2600–26FF, mitigable with `--sigil-glyph-font`; (4) numeric `--sigil-*` values are **unitless user units**; (5) curve mode can **overshoot the viewBox** on reversal-heavy statements (`sun` + "I WILL SUCCEED" is the documented instance) — deliberately not clamped.

**The drift check**

- **D-107: `test/skill-cli-parity.test.js` parses both sides as text and asserts set equality in both directions.** It reads `skill/SKILL.md` for backtick-wrapped `--flag` tokens, reads `bin/sigil-spinner.js` for the `options: { … }` object literal of its `parseArgs` call, and asserts the two sets match exactly. **Both sides are parsed as text and neither is imported** — `bin/sigil-spinner.js` executes at import, the same constraint that forced `test/element-docs.test.js` to read `src/element/sigil-spinner-element.js` as text. Bidirectional per the D-97 precedent. Guards are keyed, not transcribed (D-55, D-61, D-65, D-97) — the test never restates the flag list as a literal on either side.

- **D-108: Deliberate non-documentation is an explicit, commented allowlist — and it is empty at phase close.** If a future flag is genuinely irrelevant to the skill, it goes into a named `INTENTIONALLY_UNDOCUMENTED` array with a reason comment, the same shape as D-96's `resolveOnly` discriminator. All seven current options — `--planet`, `--json`, `--output`, `--glyph`, `--curve`, `--id-prefix`, `--title` — are documented, so the array ships empty.

- **D-109: Both directions of the parity check are fail-first-proven.** Following 05-04's precedent (a whitespace-only excerpt satisfied MAINT-01's R1 rule vacuously; a ±200-char window let one citation's excerpt back another's path token — both found by code review, not the checker). Each direction gets a demonstrated failure against a fixture: a fabricated `--nonexistent` flag in the skill text must fail one direction, and a CLI option absent from the skill text must fail the other.

**The correspondences — content and shape**

- **D-110: A seven-row table plus a written selection heuristic inline in `SKILL.md`; worked examples in `skill/references/correspondences.md`.** The table is what Claude needs at the moment of choosing and is short enough to always be loaded; the reasoning for ambiguous cases is the long part and is read on demand. Each row carries the planet, the domains of intent it governs, and a one-line "reach for this when." The heuristic must cover the case a flat table structurally cannot: **a statement that reads as two planets at once** — which axis wins, and why.
  - Rejected: the whole correspondence set in a reference file (differentiating content behind a second read a session under token pressure would skip).
  - Rejected: everything inline including the worked examples (the longest part, needed only for the ambiguous minority).

- **D-111: The skill instructs Claude to state the reasoning out loud in its reply.** Name the chosen planet, name the domain of intent it was matched on, and — when the statement was genuinely ambiguous — name the axis that decided it and what the runner-up was. **Never bounce the choice back to the user as a question.**

- **D-112: The correspondences are attributed, in the file, as Matt's lineage with a capture date.** One line in `skill/references/correspondences.md` recording that they came from Matt directly on a named date and are not general astrological training.

**The human gate — how Matt's input actually gets captured**

- **D-113: The correspondence capture is a blocking `checkpoint:decision` at the top of the plan that authors SKILL-02, and Claude arrives at it holding a draft to correct — not a blank page.** Before the checkpoint, Claude drafts a proposed seven-row table by pulling from Matt's own onboarded corpus first (`mcp__psyche-semantic__semantic_recall`, `content_type: ["knowledge"]`, against the astrological/cross-cutting corpora enumerated in `~/.psyche/identity/behaviors.md` § Corpus-Grounded Readings) and marks **every row as proposed and unratified**. Nothing ships until Matt ratifies row by row. — **Reversibility:** one-way in substance.
  - Rejected: asking Matt seven open questions from a blank page (the elicitation the cognitive profile says stalls).
  - Rejected: shipping the corpus-derived draft unratified (claims lineage authority it does not have).

- **D-114: If the gate is not answered, the phase closes without SKILL-02 rather than shipping a guess.** The plan authoring the correspondences is **last**, so nothing else waits on it. If it does not land, the skill ships with `<!-- SKILL-02 pending: correspondences not yet captured from Matt -->` and **the `description` frontmatter is written to not claim planet-selection judgment**.

**Invocation form and the published-version boundary**

- **D-115: The documented invocation is `npx -y @falkensmage/sigil-spinner@latest "<statement>" --planet <planet>`, and no local path appears anywhere in the skill.** `-y` because a non-interactive session otherwise hangs on npx's install confirmation. `@latest` because a machine with a warm npx cache would otherwise silently run an older version. The library form (`import { generateSigil } from '@falkensmage/sigil-spinner'`) is documented as the alternative for build scripts that already carry the dependency. **Any absolute path under `/Users/`, or any reference to `~/RitualSync/sigil-spinner`, is a named review failure.**

- **D-116: The skill documents only what the published package actually resolves to — and as of 2026-08-09 that is `1.0.0`, which has no `./element`.** Verified live against the registry, not inferred. The embedding guidance is inline-SVG-only; the custom element is not documented as installable. The plan must **query the live registry at authoring time** rather than assume in either direction. — **Reversibility:** reversible, but the *wrong* direction (documenting it early) is not.

- **D-117: Success criterion 3 is verified by a real `npx` run against the registry, from a scratch directory outside this repo.** Not `node bin/sigil-spinner.js`, and not the pack-install path. Nearest precedent is 06-03's live attestation verification.

**Verifying that it actually fires**

- **D-118: Criterion 1 is a human-run cold-session check, written down as a repeatable procedure at `skill/VERIFY.md`.** A new Claude Code session, in a scratch directory that is not this repo and has no `node_modules`, given requests phrased the way real requests are phrased and **never naming the tool, the package, or a flag** — e.g. "make me a sigil for 'I WILL FINISH THIS'" and "I need a sigil for a page about letting go of an old job — pick the planet." Pass requires all four: the skill fired unprompted, a correct sigil was produced, a planet was chosen **with reasoning stated**, and no flag or package name came from the user. The prompts are **fixed in the file** so the check is repeatable.

- **D-119: The cold-session check is a blocking human gate at the phase seal, with no automated proxy.** A subagent spawned from this session inherits its context and would prove nothing about a cold session's routing; a test that asserts the description contains certain substrings proves the file's contents, not that Claude routes to it.

### Claude's Discretion

Everything not locked above. Specifically:

- **Plan decomposition and ordering**, beyond the one ordering constraint D-114 fixes (the correspondence plan is last). The natural seams are: skill scaffolding + install script; the parity check; the mechanics content; the correspondences; the verification gates — but how those group into plans is a planning call.
- **Whether the install-parity guard (D-101) is its own test file or lives inside `test/skill-cli-parity.test.js`.** Both satisfy the requirement; a separate file keeps the conditional no-op from muddying an unconditional check, which argues mildly for splitting.
- **The `skill:install` script's implementation** — a small `node` script in `scripts/` versus a shell one-liner in `package.json`. Constraint: it must be one-directional (repo → home) and must not silently overwrite a diverged destination without saying so.
- **The exact `description` wording**, within D-102's five required elements.
- **The flag-token extraction regex in D-107**, and whether the CLI side parses the `options` object by regex or by a small brace-matched scan. Constraint: it must fail loudly with a named error if it parses zero flags from either side.
- **How many worked examples go in `skill/references/correspondences.md`.** Research suggests 2–4 for the ambiguous cases; the count is open.
- **Whether `skill/VERIFY.md` also carries the D-117 npx verification procedure** or that lives separately.

### Deferred Ideas (OUT OF SCOPE)

- **A real `--help` flag on the CLI.** Named as its own requirement in the `INT-*` series and its own phase, not folded here (D-104). Reopen condition: any phase that touches `bin/sigil-spinner.js`'s argv surface for another reason.
- **Publishing `1.1.0` to npm.** Already the milestone-close action D-98 named. Until it happens, the skill cannot document the `<sigil-spinner>` element (D-116).
- **Extending the skill to cover the custom element** once `1.1.0` publishes — an element section in `SKILL.md` plus extending D-107's parity check to the element's `observedAttributes`. Blocked on the publish, not on design.
- **An MCP server** exposing `generateSigil` to Claude Desktop. Deliberately out of v1.1; if built, it must live in a separate package.
- **A project-scoped `sigil` skill in a site repo.** Precedence is enterprise > personal > project, so a same-named project skill would silently shadow this one.
- **A re-ratification trigger for the correspondences.** No mechanism proposed here for noticing when the shipped table has gone stale relative to Matt's current practice. Reopen when the first correction arrives.
- **Publishing the skill as a shareable artifact** for other practitioners. The correspondences are personal lineage; D-100 keeps them out of the tarball for that reason.
- **A PR-triggered CI workflow.** Still not a requirement.
- **The three v1.0 items deferred with written reopen conditions.** The `D-12` condition names `bin/sigil-spinner.js:20` among its triggers — this phase reads `bin/sigil-spinner.js` but must not edit it, so the condition should stay unmet.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SKILL-01 | A personal Claude Code skill at `~/.claude/skills/sigil/` makes the tool discoverable to any Claude Code session in any directory — a session that has never seen this repo can generate and embed a correct sigil without the user naming the tool first | Frontmatter/description mechanics confirmed against current official docs (below); live `npx` invocation proven from a scratch directory; `allowed-tools` semantics corrected so the plan declares tools for the right reason (avoiding a mid-cold-session permission prompt, not avoiding a "restriction failure") |
| SKILL-02 | The skill carries planet-correspondence judgment sourced from Matt directly — so planet selection is a reasoned choice rather than a guess or a question bounced back to the user | Out of scope for this research by explicit instruction (the correspondences are Matt's lineage knowledge, gated behind D-113's checkpoint) — this document supplies only the format/capture mechanics context D-110–D-112 already lock |
| SKILL-03 | A mechanical drift check fails when the skill's documented flags or options no longer match the CLI's actual surface | Concrete extraction approach given in Code Examples below, addressing the nested-object-literal shape of `bin/sigil-spinner.js`'s `parseArgs` call that `test/element-docs.test.js`'s flat-array template does not directly cover |

</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Skill discovery/routing (deciding to fire on an unprompted request) | Claude Code platform (metadata scan of `name`+`description` at session start) | — | Not owned by this repo at all — SKILL-01's success is entirely a function of `description` quality, which is prose, not code |
| Invocation mechanics (flag table, npx recipe) | Personal skill file (`~/.claude/skills/sigil/SKILL.md`, outside this repo) | In-repo canonical source (`skill/SKILL.md`) | D-99: the repo copy is the source of truth; the installed copy is what Claude Code actually reads at runtime |
| Planet-selection judgment | Personal skill file + bundled reference | Matt (human, via the D-113 checkpoint) | Content that cannot be synthesized — the skill only *carries* it |
| CLI surface (the seven flags) | `bin/sigil-spinner.js` (already shipped, Phase 5) | — | This phase never edits it; it is the drift check's source of truth |
| Drift enforcement | In-repo test (`test/skill-cli-parity.test.js`) | CI / `npm test` | The only piece of this phase that is code, and the only piece that has zero file overlap with Phase 7 |
| Install propagation (repo → home) | `scripts/` (or `package.json` script) | — | One-directional, fails loudly on divergence per D-99 |
| Live verification (does it actually fire) | Human, at the phase seal | `skill/VERIFY.md` (the instrument, not a substitute) | D-118/D-119: explicitly un-automatable |

## Standard Stack

No new runtime or dev dependency is introduced by this phase. `package.json`'s `dependencies` stays `{}`; `devDependencies` is untouched. The "stack" here is entirely the Claude Code Agent Skills platform feature (filesystem convention, not an installable package) plus this repo's existing test tooling (`vitest`, already a devDependency).

| Component | Version/Spec | Purpose | Why Standard |
|-----------|---------|---------|--------------|
| Claude Code Agent Skills (`SKILL.md` format) | Current spec as of 2026-08-09, `code.claude.com/docs/en/skills` + `platform.claude.com/docs/en/agents-and-tools/agent-skills/{overview,best-practices}` | Personal-skill discoverability mechanism | The only platform-native mechanism that satisfies SKILL-01's "fires without being named" requirement; confirmed to follow the open [Agent Skills](https://agentskills.io) standard |
| `vitest` (existing devDependency, `^4.1.10`) | Already installed | Runs `test/skill-cli-parity.test.js` and the install-parity guard | `vitest.config.js`'s `include: ['test/**/*.test.js']` picks up any new `test/skill-*.test.js` automatically — no config edit needed |
| `node:fs`, `node:path`, `node:os` (Node builtins) | Ships with Node ≥20 | File-parity comparison (`skill:install` script and D-101's guard) | Zero new dependency; the same builtins `test/pack-install.test.js` already uses for its own scratch-directory work |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| A hand-rolled text-parse drift check (D-107) | An actual JS/AST parser (e.g. `acorn`) to extract `parseArgs`'s `options` object correctly regardless of formatting | Rejected implicitly by the codebase's own precedent — `test/citations.test.js` and `test/element-docs.test.js` both already choose regex/text-scan over a real parser for exactly this class of problem, and adding a parser package here would be the *first* AST-parsing dependency in a project whose stated ethos is zero-dependency minimalism for a devDependency that exists to check seven flag names |
| A Node script for `skill:install` | A shell one-liner (`cp -r`) or `rsync --checksum` | `cp -r` cannot express "fail rather than merge if diverged" without a separate diff step; `rsync` adds an external-tool dependency the repo doesn't otherwise need. A ~30-line Node script using only `node:fs` matches this repo's existing patterns (`test/pack-install.test.js` already builds its own scratch-directory logic from builtins alone) |

## Package Legitimacy Audit

Not applicable this phase. Zero new packages are installed — `package.json`'s `dependencies` and `devDependencies` are both untouched (per D-99/D-103's own framing: "Only `scripts` gains a key"). No `npm view`/registry-legitimacy check is needed because nothing new is being pulled from any registry.

## Architecture Patterns

### System Architecture Diagram

Two independent flows this phase builds, deliberately not braided (per the phase's own framing: "if the skill would need updating for a reason that is not 'the CLI changed' or 'the correspondences changed', it has probably grown a surface it should not have").

**Flow 1 — a cold Claude Code session fires the skill (the runtime path, entirely outside this repo):**

```
User request in ANY directory
  ("make me a sigil for 'I WILL FINISH THIS'")
        │
        ▼
Claude Code session start
  scans name+description of every
  personal/project skill (~100 tok/skill,
  always in context)
        │
        ▼
description matches?  ──NO──▶  skill never loads (SKILL-01 fails)
        │ YES
        ▼
Claude reads ~/.claude/skills/sigil/SKILL.md
  via bash (Level 2: <5k tokens, loaded once)
        │
        ├──▶ planet table + heuristic ─▶ planet chosen, reasoning stated (SKILL-02)
        │        (ambiguous? read skill/references/correspondences.md
        │         — one hop, on demand)
        │
        ▼
Claude runs (Bash, pre-approved via allowed-tools for this turn):
  npx -y @falkensmage/sigil-spinner@latest "<statement>" --planet <planet>
        │
        ▼
stdout: raw SVG  ──▶  Claude embeds it in the page/artifact being built
```

**Flow 2 — the drift check (the in-repo, mechanical path, runs on every `npm test`):**

```
bin/sigil-spinner.js                    skill/SKILL.md
  parseArgs({ options: {                   flag table (backtick `--flag` tokens)
    planet: {...}, json: {...}, ...  })
        │                                       │
        │  parsed as TEXT (never imported —     │  parsed as TEXT
        │  the file executes at import)         │
        ▼                                       ▼
   Set<string> (CLI keys, no --)          Set<string> (skill flags, -- stripped)
        │                                       │
        └───────────────┬───────────────────────┘
                         ▼
         test/skill-cli-parity.test.js
         asserts equality BOTH directions
         (skill-documents-nonexistent-flag AND
          CLI-has-undocumented-flag both fail)
                         │
                         ▼
              npm test (CI, every commit)
```

### Recommended Project Structure

```
skill/                              # NEW, repo-only — canonical source (D-99)
├── SKILL.md                        # frontmatter + mechanics + judgment (D-105, <5k tok body)
├── VERIFY.md                       # D-118's fixed cold-session prompts + pass criteria
└── references/
    └── correspondences.md          # D-110/D-112: worked examples, attribution, capture date
scripts/                            # possible NEW home for the install script (Claude's discretion)
└── skill-install.mjs               # repo → ~/.claude/skills/sigil/, one-directional, fails loudly on divergence
test/
├── skill-cli-parity.test.js        # NEW — D-107/D-108/D-109's bidirectional drift check
└── skill-install-parity.test.js    # NEW (or folded into the above per discretion) — D-101's conditional no-op guard
~/.claude/skills/sigil/             # OUTSIDE this repo — the installed copy Claude Code actually reads
├── SKILL.md                        # byte-identical to skill/SKILL.md when present (D-101)
├── VERIFY.md
└── references/
    └── correspondences.md
```

### Pattern 1: Progressive Disclosure (three-level loading)

**What:** Claude Code loads skill content in three cost tiers — metadata (`name`+`description`, always in context, ~100 tokens), the `SKILL.md` body (loaded only once the skill is triggered, target under 5k tokens / under 500 lines), and bundled reference files (loaded only when `SKILL.md` explicitly links to them and the task needs that depth — zero cost otherwise).
**When to use:** Structuring any skill whose full domain knowledge exceeds what should sit in every session's system prompt. Directly the shape D-105/D-110 already lock.
**Source:** `platform.claude.com/docs/en/agents-and-tools/agent-skills/overview` (fetched live 2026-08-09) — the exact token-cost table:

```
Level 1: Metadata      | Always (startup)      | ~100 tokens/skill | name + description
Level 2: Instructions  | When skill triggered  | Under 5k tokens    | SKILL.md body
Level 3+: Resources    | As needed             | None until read    | Bundled files
```

**One rule this repo's plan should follow precisely:** keep reference-file links **one level deep from `SKILL.md`** — `SKILL.md` → `skill/references/correspondences.md` directly, never `SKILL.md` → some intermediate file → `correspondences.md`. The official best-practices guide names this explicitly: "Claude may partially read files when they're referenced from other referenced files... use `head -100` to preview content rather than reading entire files, resulting in incomplete information." D-110's structure (table+heuristic inline, worked examples one hop away) already satisfies this — just don't let a future edit add an intermediate index file.

### Pattern 2: Parse-as-Text, Never Import (this repo's established drift-guard idiom)

**What:** Any drift guard whose subject file has import-time side effects (reads `process.argv`, calls `process.exit`, dereferences `HTMLElement` at class-definition time) must read that file with `readFileSync` and extract the relevant data via text parsing — never `import`.
**When to use:** D-107, unconditionally — `bin/sigil-spinner.js` calls `parseArgs` (which throws/exits on bad argv) and reads `process.argv` at module-load time.
**Example (the existing, working precedent in this exact repo — copy the methodology, not the regex):**

```javascript
// Source: test/element-docs.test.js (already in this repo)
// Reads src/element/sigil-spinner-element.js as TEXT because
// `class extends HTMLElement` throws ReferenceError under plain Node.
const elementSource = readFileSync(path.join(REPO_ROOT, 'src/element/sigil-spinner-element.js'), 'utf-8');

function parseObservedAttributes(source) {
  const match = source.match(/static get observedAttributes\(\)\s*{\s*return\s*\[([^\]]*)\]/);
  if (!match) {
    throw new Error('could not find a `static get observedAttributes()` literal ...');
  }
  const names = match[1].split(',').map((e) => e.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
  return new Set(names);
}
```

**Why this template needs adaptation, not a straight copy, for D-107:** `observedAttributes` is a **flat array literal** (`return ['statement', 'planet', ...]`) — one bracket pair, no nesting, trivially regex-extractable. `bin/sigil-spinner.js`'s `options` object is **nested**:

```javascript
// Source: bin/sigil-spinner.js:117-127 (read live this session)
parseArgs({
  allowPositionals: true,
  options: {
    planet: { type: 'string' },
    json: { type: 'boolean', default: false },
    output: { type: 'string' },
    glyph: { type: 'boolean', default: false },
    curve: { type: 'boolean', default: false },
    'id-prefix': { type: 'string' },
    title: { type: 'boolean', default: false },
  },
});
```

A regex anchored on "one `key: { type: ...}` per source line" (mirroring the flat-array approach) would work *today* — every one of the seven options in the live file is one key per line — but it is fragile in a way `observedAttributes`' regex is not: a Prettier reformat that collapses two short options onto one line, or a future contributor adding a nested default object spanning multiple lines, silently drops matches without any error, because the regex has no way to know it undercounted. See Code Examples below for a brace-counted extraction that is robust to reformatting and fails loudly on zero matches (continuing D-109's fail-first-proven discipline).

### Pattern 3: Conditional No-Op With a Stated Reason (D-101's one deliberate exception)

**What:** A guard that is normally "fail loudly, never skip" gets exactly one exception when the *absence* of its subject is itself the correct state on most machines, and that exception prints why it did nothing rather than passing silently.
**When to use:** D-101's install-parity guard — `~/.claude/skills/sigil/` legitimately does not exist on any machine but Matt's, and treating that like a missing chromium install (a genuine prerequisite gap) would train the suite's red to mean nothing.
**Recommended shape** (see Code Examples for the full test).

### Anti-Patterns to Avoid

- **Treating `allowed-tools` as an access-control restriction.** It is a same-turn permission pre-approval, not a sandbox. Writing plan language like "if `Bash` is omitted, the skill fails" overstates the mechanism — the real cost of omission is an interactive permission prompt breaking the "user never has to say anything" experience, not a hard failure. See Common Pitfalls.
- **Treating `scope: personal` as functionally load-bearing.** It is not a recognized frontmatter field (confirmed against the complete field table in the current docs). It does nothing at runtime. Keep it for house consistency with `capture`/`draft`/`oracle`, but don't describe it in the plan as "how Claude Code knows this is personal" — the directory does that.
- **Nested reference-file chains.** Don't let `SKILL.md` point at a file that points at another file for the correspondences. One hop, always.
- **Citing the "20%→50%→90%" activation-rate statistic as independently re-verified.** It could not be re-confirmed in the current official docs fetched this session (neither the overview nor the best-practices page states specific percentages as of 2026-08-09). The qualitative guidance underneath it — be specific, name concrete nouns, include trigger phrases, avoid vague "helps with X" language — is fully corroborated by the current best-practices page. Treat the number as unconfirmable-this-session, the practice as confirmed. See State of the Art.
- **A naive double-quote statement interpolation in the skill's invocation example, presented as universally safe.** See Common Pitfalls — Shell Injection Surface below.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Skill discovery/routing | A custom "which skill matches this request" heuristic inside `SKILL.md`'s own body | The platform's own `description`-matching at session start | This is infrastructure Claude Code already owns; the skill's only job is to write a `description` good enough for that infrastructure to route correctly |
| CLI flag parsing (for the drift check) | A general-purpose JS/AST parser dependency | Text-scan regex/brace-counting, following `test/element-docs.test.js`'s and `test/citations.test.js`'s existing precedent | The subject file is a small, stable, single-object literal — a real parser is disproportionate machinery for extracting seven key names, and would be this project's first parsing dependency for a devDependency-only concern |
| Personal-skill install/sync | A generic dotfiles-sync tool (e.g. `stow`, `chezmoi`) | A small purpose-built Node script | The requirement (one-directional, fail-rather-than-merge on divergence, print why) is narrower than what a general sync tool is designed for, and pulling one in for a seven-file copy is disproportionate |

**Key insight:** every "don't hand-roll" temptation in this phase points toward infrastructure this repo or the Claude Code platform already owns. The one piece of genuinely new code (`test/skill-cli-parity.test.js`) is deliberately small and text-based because that is the established idiom for exactly this class of problem in this codebase.

## Common Pitfalls

### Pitfall 1: Misreading `allowed-tools` as a restriction rather than a pre-approval

**What goes wrong:** A plan or skill author assumes an omitted tool will cause the skill to fail, or conversely assumes a declared `allowed-tools` list is the *complete* set of tools Claude can use while the skill is active — leading either to over-declaring defensively, or to confusion when a tool not in the list still works (with a prompt).
**Why it happens:** The word "allowed" reads like an allowlist/sandbox. It isn't one. Per the current official Claude Code docs (fetched live 2026-08-09): *"The `allowed-tools` field grants permission for the listed tools during the turn that invokes the skill, so Claude can use them without prompting you for approval... It does not restrict which tools are available: every tool remains callable, and your permission settings still govern tools that are not listed."* The grant also **clears when the next message is sent** — it is a single-turn pre-approval, not a session-wide grant.
**How to avoid:** Declare `Bash`, `Read`, `Write`, `Edit`, `Glob`, `Grep` (per D-103) for the correct reason: to keep the cold session's `npx` invocation from stopping on an interactive permission prompt, which would visibly contradict SKILL-01's "the user never has to name the tool" criterion even though the skill would technically still work if the user approved the prompt. `disallowed-tools` (a distinct field) is the actual restriction mechanism, and is not relevant here.
**Warning signs:** Plan language describing `allowed-tools` as blocking, sandboxing, or gating tool availability rather than pre-approving it.
**Phase to address:** the plan authoring `SKILL.md`'s frontmatter — this is a wording correction, not a scope change; D-103's declared tool set is unaffected.

### Pitfall 2: `scope: personal` is not a real spec field, but omitting it silently loses nothing either way

**What goes wrong:** Overweighting `scope: personal` as load-bearing (assuming it controls where Claude Code looks for the skill) or, conversely, worrying that removing it would break something.
**Why it happens:** It reads like it should matter, and it's already present in three of Matt's other installed skills.
**How to avoid:** Keep it, per D-103, for house consistency — but understand it does nothing at the platform level. What actually determines personal-vs-project scope is the **directory** the `SKILL.md` lives in (`~/.claude/skills/<name>/` vs. `.claude/skills/<name>/`), confirmed against the complete frontmatter field table on `code.claude.com/docs/en/skills`, which does not list `scope` among any of its ~19 recognized keys (`name`, `description`, `when_to_use`, `argument-hint`, `arguments`, `disable-model-invocation`, `user-invocable`, `allowed-tools`, `disallowed-tools`, `model`, `effort`, `context`, `agent`, `background`, `hooks`, `paths`, `shell`, `metadata`, `license`, `compatibility`). Unrecognized YAML keys are silently harmless in Claude Code's own skill directories (confirmed by the fact that `capture`/`draft`/`oracle` already carry it and function correctly) — this differs from the stricter validation applied to skills packaged for claude.ai/API upload, where an unexpected key is a hard error.
**Warning signs:** none — this is a documentation-accuracy issue, not a functional risk, as long as the field stays present-but-inert.
**Phase to address:** the plan authoring `SKILL.md`'s frontmatter, as a one-line note rather than a design change.

### Pitfall 3: Shell-injection-adjacent surface in the documented invocation recipe

**What goes wrong:** D-115 locks the documented invocation as `npx -y @falkensmage/sigil-spinner@latest "<statement>" --planet <planet>`. If a cold session constructs the actual Bash command by naively substituting a real intention statement into that double-quoted template, a statement containing an embedded `"`, a backtick, or a `$(...)` sequence can break the argument boundary or, in the worst case, execute unintended shell constructs. This is not a defect in the published package — `escapeXml` already protects everything that reaches SVG markup — it is a property of how the *invocation string itself* gets built before the library ever sees the statement.
**Why it happens:** Intention statements are free-form user prose. English punctuation habits (an em dash, a straight quote used as an apostrophe that a text editor "smart-quotes" into a curly one, or a literal double quote for emphasis) are common enough that "statements never contain shell metacharacters" is not a safe assumption, even though the sigil algorithm itself will strip anything that isn't a letter once it reaches `generateSigil`.
**How to avoid:** The skill body should state the safe invocation pattern explicitly rather than let the illustrative `"<statement>"` example stand alone as the only guidance. Two options, either sufficient: (a) single-quote the statement and escape any embedded single quote with the standard `'\''` shell idiom (`echo 'It'\''s time' `); (b) use the CLI's own already-existing `-` stdin sentinel (`bin/sigil-spinner.js:17-19`, confirmed live: "the statement is read synchronously from stdin... when that positional is exactly a single `-` character"), piping the statement in rather than interpolating it into the argv string at all. Option (b) is the more robust of the two for a session assembling the command programmatically, since it sidesteps shell-quoting correctness entirely.
**Warning signs:** A `SKILL.md` example that only shows the double-quoted form with a "clean" statement (no punctuation), with no note about what to do when the statement contains a quote character.
**Phase to address:** the plan authoring `SKILL.md`'s mechanics section (D-104/D-105) — this belongs in the invocation recipe, not as a new requirement, since D-115 already fixes the *documented* form; this is about what the skill says to do when a real statement doesn't match the clean example.

### Pitfall 4: Assuming `npx`'s cache or `@latest` resolution behaves like a locally-installed dependency

**What goes wrong:** Assuming `npx pkg@latest` might silently reuse a stale cached resolution the way a project's own `node_modules` would after `npm install` without an update.
**Why it happens:** `npx` does cache downloaded package contents (`~/.npm/_npx/`), which can look similar to a stale-dependency problem from the outside.
**How to avoid — verified, not assumed:** `@latest` is a *dist-tag*, not a version pin, so npm always performs a registry lookup to resolve what `latest` currently points to before consulting any local cache; only the resolved version's file contents are served from cache if already downloaded. This was confirmed live this session: `npx -y @falkensmage/sigil-spinner@latest "I WILL SUCCEED" --planet saturn` from a scratch directory (`/tmp/sigil-skill-research-*`, no `package.json`, no relationship to this repo) resolved and ran in 1.65s total, exit 0, producing a well-formed `<svg xmlns=... class="sigil sigil--saturn">...` on stdout with an empty `err.log`. `-y` also has a documented non-interactive fallback: even without it, `npx`/`npm exec` in a genuinely non-interactive shell "logs a warning and then continues as though the user answered yes" — but D-115's explicit `-y` remains correct as belt-and-suspenders against interactive-detection heuristics changing.
**Warning signs:** none observed; this pitfall is resolved rather than open, recorded here so the plan doesn't re-litigate it.
**Phase to address:** none — D-115/D-117 are already correct as locked; this entry documents the live verification backing them.

### Pitfall 5: A skill directory created *after* a Claude Code session starts isn't picked up without a restart

**What goes wrong:** Running the D-118 cold-session verification in a session that was already open before `~/.claude/skills/sigil/` was first created (as opposed to a session started fresh after the install script ran), and getting a false-negative "the skill never fired" result.
**Why it happens:** Per the current official docs: *"Claude Code watches skill directories for file changes... If you create a top-level skills directory that didn't exist when the session started, restart Claude Code so it can watch the new directory."* Live *edits* to an already-watched `~/.claude/skills/` are picked up mid-session without restart; the *first-ever creation* of the top-level directory is not.
**How to avoid:** `skill/VERIFY.md`'s procedure should note explicitly: run `npm run skill:install` (or equivalent) first, from a session that is *not* the one being used for the cold-session check, then start the cold-session check in a brand-new Claude Code session opened after that install completes. This matters most for the very first run of the check on any given machine (including CI, if the parity guard is ever extended to run there) — subsequent edits to an already-installed skill are live-watched correctly.
**Warning signs:** the cold-session check "failing to fire" on a first attempt immediately after install, succeeding on a second attempt with no other change.
**Phase to address:** `skill/VERIFY.md`'s authoring — a one-line procedural note, not a design change.

## Code Examples

### `test/skill-cli-parity.test.js` — recommended extraction approach (D-107)

The SKILL.md side (flat, backtick-wrapped tokens in a markdown table — recommended format below) can reuse `test/element-docs.test.js`'s row-regex almost verbatim. The CLI side needs a brace-counted scan because `options: { … }` is nested — a flat per-line regex works today but is one reformat away from silently undercounting:

```javascript
// Source: pattern adapted from test/element-docs.test.js and
// test/citations.test.js (both already in this repo) — text-parse, never
// import, per D-96/D-107's shared constraint.

/**
 * Extract the top-level key names from the `options: { ... }` object
 * literal inside bin/sigil-spinner.js's parseArgs({ ... }) call, by
 * brace-counting rather than line-shape assumption — robust to a Prettier
 * reformat collapsing entries onto one line or a future option spanning
 * multiple lines.
 * @param {string} source
 * @returns {Set<string>}
 */
function parseCliOptionKeys(source) {
  const startMatch = source.match(/options:\s*\{/);
  if (!startMatch) {
    throw new Error('could not find `options: {` in bin/sigil-spinner.js');
  }
  const blockStart = startMatch.index + startMatch[0].length; // just past the opening `{`
  let depth = 1;
  let i = blockStart;
  for (; i < source.length && depth > 0; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') depth--;
  }
  const blockInterior = source.slice(blockStart, i - 1); // interior of the outer options block

  // Split top-level entries on commas at depth 0 within the interior,
  // then extract the key from each entry's leading `key:` or `'key':`.
  const keys = new Set();
  let entryDepth = 0;
  let entryStart = 0;
  for (let j = 0; j <= blockInterior.length; j++) {
    const ch = blockInterior[j];
    if (ch === '{') entryDepth++;
    else if (ch === '}') entryDepth--;
    if ((ch === ',' && entryDepth === 0) || j === blockInterior.length) {
      const entry = blockInterior.slice(entryStart, j).trim();
      if (entry) {
        const keyMatch = entry.match(/^(?:'([^']+)'|([A-Za-z_$][\w$-]*))\s*:/);
        if (keyMatch) keys.add(keyMatch[1] ?? keyMatch[2]);
      }
      entryStart = j + 1;
    }
  }
  return keys;
}
```

Recommended `SKILL.md` flag table shape (markdown table, not the README's bullet-list style — chosen specifically so the same row-regex idiom `test/element-docs.test.js` already proves out applies directly, just with a leading `--` stripped for comparison):

```markdown
| Flag | Type | Purpose |
|------|------|---------|
| `--planet` | string, required | one of the seven classical planets |
| `--json` | boolean | write the JSON working instead of SVG |
| `--output` | string | write to a file instead of stdout |
| `--glyph` | boolean | render the optional planetary glyph layer |
| `--curve` | boolean | curved/smoothed path instead of straight segments |
| `--id-prefix` | string | namespace the root `<svg>` id for co-embedding |
| `--title` | boolean | embed the statement in the SVG's `<title>` |
```

```javascript
function parseSkillFlagTokens(md) {
  const names = new Set();
  const rowRe = /^\|\s*`--([a-z-]+)`\s*\|/gm;
  let match;
  while ((match = rowRe.exec(md)) !== null) names.add(match[1]);
  return names;
}
```

Both extraction functions must be paired with the same zero-match guard `test/element-docs.test.js` already uses (`expect(codeAttributes.size, '...').toBeGreaterThan(0)`), and D-109's fail-first requirement means both directions need a fixture-backed demonstrated failure before the check ships.

### D-101's install-parity guard — conditional no-op shape

```javascript
// Source: pattern for D-101 — the one deliberate exception to
// "fail loudly, never skip" in this repo's test suite.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const INSTALLED_ROOT = path.join(os.homedir(), '.claude', 'skills', 'sigil');
const REPO_ROOT_SKILL = path.join(REPO_ROOT, 'skill');

it('~/.claude/skills/sigil/ is byte-identical to skill/ when present (D-101)', () => {
  if (!existsSync(INSTALLED_ROOT)) {
    console.log(
      '[skill-install-parity] SKIP (expected, not a failure): ' +
        `${INSTALLED_ROOT} does not exist on this machine. ` +
        'This is a correct state on any machine that is not Matt\'s — the ' +
        'guard is a no-op rather than a failure here (D-101).',
    );
    return; // explicit, message-printing no-op — the one stated exception
  }
  // ...walk skill/ recursively, compare each file's contents against its
  // INSTALLED_ROOT counterpart with readFileSync, collect every divergent
  // path, and fail with the full list in one message if any exist.
});
```

### Live registry/npx verification transcript (D-116/D-117, executed this session)

```
$ npm view @falkensmage/sigil-spinner version
1.0.0
$ npm view @falkensmage/sigil-spinner exports
{ '.': './src/index.js' }
$ npm view @falkensmage/sigil-spinner dist-tags
{ next: '1.0.0', latest: '1.0.0' }

$ cd /tmp/sigil-skill-research-XXXX   # scratch dir, no package.json, outside repo
$ npx -y @falkensmage/sigil-spinner@latest "I WILL SUCCEED" --planet saturn > out.svg 2> err.log
$ echo $?
0
$ head -c 300 out.svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="sigil sigil--saturn">...
$ cat err.log
(empty)

$ npx -y @falkensmage/sigil-spinner@latest "test" --planet pluto
E_UNKNOWN_PLANET: resolvePlanetKey: unknown planet "pluto". Valid planets: saturn, jupiter, mars, sun, venus, mercury, moon
$ echo $?
2

$ npx -y @falkensmage/sigil-spinner@latest --planet saturn
E_MISSING_STATEMENT: generateSigil: statement is required and must be a non-empty string, got: undefined
$ echo $?
2
```

Confirms: (1) D-116's premise — no `./element` subpath exists as of 2026-08-09, so the embedding guidance stays inline-SVG-only; (2) D-115's invocation string works exactly as documented, unmodified, from a genuinely outside-the-repo location; (3) the library's own error messages are already self-explanatory enough (naming the valid planet list, naming the missing field) that the skill's embedding checklist does not need to duplicate error-recovery guidance — a session that hits either error already has what it needs in stderr.

## State of the Art

| Old Approach (as FEATURES.md 2026-08-07 described it) | Current Verified State (2026-08-09) | When Changed | Impact |
|--------------------------------------------------------|----------------------------------------|---------------|--------|
| "activation rates went from ~20% to ~50%... and to ~90% with example trigger phrases" cited as a research finding | Could not be re-confirmed against either current official docs page fetched this session; the qualitative guidance behind it (specificity, key terms, third person, avoid vague descriptions) is fully corroborated by the current best-practices page's own examples and checklist | Unknown — possibly from a source not accessible to this session, or superseded doc content | Treat the specific percentages as unconfirmable this session, not as false; don't cite them as independently re-verified in the skill's own authoring notes or commit messages |
| "`allowed-tools` ... everything mechanical should be a single delegating line" (Pitfall 11) — already correctly amended by D-104 for the `--help`-doesn't-exist reason | Confirmed independently, for a *different* reason: `allowed-tools` was never a restriction to begin with — it's a same-turn pre-approval | This session, 2026-08-09 (live doc fetch) | D-104's conclusion (document the flags inline, enforce via SKILL-03) is unaffected; D-103's `allowed-tools` declaration is now grounded in the *correct* mechanism (avoiding a permission prompt) rather than an incorrect one (avoiding a hard failure) |
| `scope: personal` framed in FEATURES.md as part of "the personal (not project) skill" table-stakes requirement | Confirmed as directory-determined, not frontmatter-determined; `scope` is not in the recognized field list at all | This session, 2026-08-09 (live doc fetch) | No plan change — D-99's directory placement (`~/.claude/skills/sigil/`) already does the actual work; the frontmatter field is cosmetic/house-convention only |
| Custom commands (`.claude/commands/*.md`) framed historically as a separate mechanism from skills | Confirmed merged: "Custom commands have been merged into skills. A file at `.claude/commands/deploy.md` and a skill at `.claude/skills/deploy/SKILL.md` both create `/deploy` and work the same way." | Documented as current state, 2026-08-09 fetch | Not directly relevant to this phase (the sigil skill was always going to be a skill, not a command), but confirms the skill-authoring surface this phase targets is the current, non-deprecated one |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The two live-fetched official doc pages (`code.claude.com/docs/en/skills`, `platform.claude.com/docs/en/agents-and-tools/agent-skills/{overview,best-practices}`) reflect the exact Agent Skills feature set active in whatever Claude Code version executes the D-118 cold-session check | Common Pitfalls 1–2, Architecture Patterns | If the executing session runs an older/newer Claude Code build than what these docs describe, a frontmatter field's exact behavior (especially `allowed-tools`' single-turn clearing) could differ slightly. Low risk — the docs explicitly version-gate recent behavior changes (e.g., "Before v2.1.218...") and nothing this phase relies on is flagged as newly-changed or pre-release |
| A2 | The recommended brace-counted extraction function (Code Examples) correctly isolates `options: { ... }` from `bin/sigil-spinner.js` without being run against the actual file in this session | Code Examples | Medium — this is a design recommendation, not a tested implementation. The plan/execution phase must write a real fail-first test (per D-109) rather than trust this sketch as-is |
| A3 | A markdown-table flag format (vs. the README's bullet-list format) is an acceptable choice for `SKILL.md`, left open by CONTEXT.md's "Claude's Discretion" section | Code Examples | Low — explicitly discretionary per CONTEXT.md; the table format is a recommendation to reuse a proven regex idiom, not a locked requirement |
| A4 | The npx cache/`@latest` resolution behavior observed in this session (registry lookup always occurs for a dist-tag) generalizes to a machine with a genuinely cold `~/.npm/_npx/` cache, not just the warm one this session's environment had from prior repo work | Common Pitfalls 4 | Low — this is standard, well-documented npm/npx dist-tag resolution behavior, not specific to this package; a cold cache only adds first-download network time, it does not change the resolution logic |

**If this table is empty:** N/A — see entries above.

## Open Questions

1. **Should the SKIP clause (D-102, element 5) and trigger phrases live in `description` itself, or in the separate optional `when_to_use` field?**
   - What we know: current docs define a distinct `when_to_use` frontmatter field — "Additional context for when Claude should invoke the skill, such as trigger phrases or example requests. Appended to `description` in the skill listing" — with a combined 1,536-character cap across both fields in the skill listing.
   - What's unclear: D-102 says these elements belong in "the `description` frontmatter" specifically; it's not explicit whether that phrase means "the description mechanism broadly" (allowing a split across `description`+`when_to_use`) or "the literal `description:` YAML key."
   - Recommendation: treat this as within "the exact wording is Claude's discretion at authoring time" (D-102's own closing line) — either a single dense `description` or a `description`+`when_to_use` split satisfies the five required elements; the planner should pick whichever produces the clearest routing signal, and note the combined 1,536-char cap either way (well within reach for this skill's five elements).

2. **Does the `Bash` entry in `allowed-tools` need scoping to a command pattern (e.g. `Bash(npx @falkensmage/sigil-spinner* *)`), or is a bare `Bash` correct?**
   - What we know: the docs' own examples show both forms — bare tool names (`Read Grep`) and scoped patterns (`Bash(git add *) Bash(git commit *)`). D-103 locks that `Bash` must be present but does not specify scoping.
   - What's unclear: whether a narrower pattern would still cover the embedding-checklist's other Bash-adjacent needs (there are none obviously — Read/Write/Edit cover the embedding work) versus whether bare `Bash` is simpler and matches "under-declaring is the expensive direction."
   - Recommendation: bare `Bash` is defensible and matches D-103's literal text; a scoped pattern is a legitimate refinement within Claude's discretion if the plan wants a narrower footprint, since the skill's only actual shell need is the `npx` invocation.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `npm`/`npx` on PATH | The documented invocation (D-115), its live verification (D-117) | ✓ (confirmed by live execution this session) | not independently pinned this session; `npm view` calls succeeded | — |
| Public npm registry reachability | D-116/D-117's live verification | ✓ (confirmed — real registry responses returned) | — | — |
| Claude Code Agent Skills feature (personal skill directory support) | SKILL-01 entirely | ✓ (assumed present — `capture`/`draft`/`oracle` already exist and function in this exact environment, confirmed by reading their `SKILL.md` files live this session) | not independently version-checked | — |
| Node ≥20 | `skill:install` script, drift-check tests | ✓ (already an `engines` constraint on this package, unchanged by this phase) | — | — |

**Missing dependencies with no fallback:** none identified.
**Missing dependencies with fallback:** none identified.

## Security Domain

`security_enforcement: true`, `security_asvs_level: 1`, `security_block_on: "high"` per `.planning/config.json` — this section is required.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | This phase has no auth surface — a personal filesystem skill, not a networked service |
| V3 Session Management | No | No session state introduced |
| V4 Access Control | No | No access-control surface; `allowed-tools` is a UX permission-prompt mechanism, not an access-control boundary (see Common Pitfalls 1) |
| V5 Input Validation | Yes, narrowly | The intention statement is user-supplied text that a fresh Claude Code session may embed into a shell command string. Standard control: never interpolate untrusted text into a double-quoted shell string without escaping; prefer the CLI's existing `-` stdin sentinel or correct single-quote escaping (see Common Pitfalls 3). The library's own `escapeXml` already handles everything downstream of `generateSigil` — this control is specifically about the invocation-string construction step, which happens *before* the library ever sees the text |
| V6 Cryptography | No | No cryptographic operations in this phase |

### Known Threat Patterns for This Phase's Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Shell-metacharacter injection via naive interpolation of the intention statement into the documented `npx ... "<statement>" ...` invocation | Tampering | Document the safe form explicitly in `SKILL.md`'s invocation recipe: single-quote with `'\''`-escaped embedded quotes, or route the statement through the CLI's existing `-` stdin sentinel rather than argv interpolation |
| A malicious or compromised `SKILL.md`/reference file granting itself broad `allowed-tools` | Elevation of Privilege | Not this phase's risk surface directly (the skill is authored by Matt, not an untrusted third party), but worth noting per the platform's own security guidance: "Use Skills only from trusted sources... Review project skills before trusting a repository, since a skill can grant itself broad tool access." Applies to the *general* posture of authoring this skill, not a specific control this phase must add |

## Sources

### Primary (HIGH confidence)

- [Extend Claude with skills — Claude Code Docs](https://code.claude.com/docs/en/skills) — fetched live 2026-08-09; the complete frontmatter field table, personal/project/enterprise precedence, `allowed-tools`/`disallowed-tools` semantics, progressive-disclosure guidance, live change-detection behavior
- [Agent Skills — Claude Platform Docs](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview) — fetched live 2026-08-09; the three-level loading model and its token-cost table, `name`/`description` validation rules, Claude Code personal-vs-project sharing model
- [Skill authoring best practices — Claude Platform Docs](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) — fetched live 2026-08-09; description-writing guidance (third-person, specificity, avoid-vague examples), 500-line/token-budget guidance, one-level-deep reference-file rule, "avoid offering too many options" pattern
- `npm view @falkensmage/sigil-spinner {version,exports,dist-tags}` — executed live this session — confirms 1.0.0, no `./element` subpath, `latest`/`next` both point at `1.0.0`
- Live `npx -y @falkensmage/sigil-spinner@latest ...` runs (success case + two error cases) from a scratch directory outside this repo — executed live this session
- `bin/sigil-spinner.js` (read in full, lines 1-200, this session) — the authoritative CLI flag set and the `E_CLI_USAGE`/no-`--help` behavior CONTEXT.md's D-104 already found
- `test/element-docs.test.js`, `test/pack-install.test.js`, `test/citations.test.js` (read in full or substantially, this session) — the existing drift-guard and scratch-directory idioms this phase's new tests should follow
- `~/.claude/skills/{capture,draft,oracle,decide}/SKILL.md` (frontmatter read live this session) — confirms the house `scope: personal` convention and gives real comparison text for the SKIP-clause collision risk named in D-102

### Secondary (MEDIUM confidence)

- Web search on `npx -y` non-interactive behavior, cross-checked against `npm/cli` GitHub issues and `docs.npmjs.com/cli/v11/commands/npx` — corroborates but does not supersede the live-execution evidence above

### Tertiary (LOW confidence)

- None relied upon for load-bearing claims in this document.

## Metadata

**Confidence breakdown:**
- Agent Skills frontmatter/behavior: HIGH — two independent official pages fetched live the same day this research was performed, cross-checked against each other and against this environment's own already-installed skills
- npx/registry invocation mechanics: HIGH — live-executed against the real registry from a genuinely outside-the-repo scratch directory, not simulated
- Drift-check parsing approach: MEDIUM — a design recommendation grounded in this repo's own proven precedent (`test/element-docs.test.js`), but not itself written or test-run this session; the plan/execution phase must still satisfy D-109's fail-first-proven requirement independently
- Shell-injection finding (Pitfall 3): MEDIUM — a reasoned risk analysis grounded in how the documented invocation string would plausibly be constructed, not an observed exploit; no locked decision currently addresses it, so it is presented as new guidance rather than a correction to an existing one

**Research date:** 2026-08-09
**Valid until:** The Agent Skills frontmatter/behavior findings should be treated as valid for roughly 30 days given the format's active development (the docs themselves note ongoing version-gated changes as recently as "v2.1.218"); the npm registry findings (package version, exports map) are valid until the next publish event, whichever comes first — re-verify D-116's registry state at plan-authoring time regardless of this document's age, exactly as D-116 itself already instructs.
