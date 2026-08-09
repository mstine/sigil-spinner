# Phase 8: The Sigil Skill - Context

**Gathered:** 2026-08-09
**Status:** Ready for planning
**Mode:** `--auto` — every gray area below was auto-resolved to the recommended option. **No decision here was confirmed by Matt in conversation.** Decisions carrying a `one-way` or `costly` rating are surfaced as `checkpoint:decision` gates in the plans, following the Phase 7 precedent where the three published-contract decisions (D-80, D-82, D-84) were confirmed at the pre-execution gate before any code was written.

**Two things were verified live during this discussion rather than assumed, and both change the shape of the phase:**

| Finding | Verified | Consequence |
|---|---|---|
| **`sigil-spinner --help` does not exist.** `parseArgs` declares no `help` option, so `--help` exits with `E_CLI_USAGE: Unknown option '--help'` | `node bin/sigil-spinner.js --help`, 2026-08-09 | The research's primary anti-drift mitigation ("never duplicate flag syntax, delegate to `--help`") is unavailable. SKILL-03's drift check becomes the *substitute* mitigation, not a supplement. See D-104 |
| **The published `1.0.0` has no `./element` subpath.** `exports` on the registry is `{ ".": "./src/index.js" }` only; `versions = '1.0.0'`, `latest = 1.0.0` | `npm view @falkensmage/sigil-spinner@1.0.0`, 2026-08-09 | Phase 7 shipped the custom element into the tree under D-98 without publishing. A skill documenting `@falkensmage/sigil-spinner/element` would emit `ERR_PACKAGE_PATH_NOT_EXPORTED` on every machine. See D-116 |

<domain>
## Phase Boundary

A **personal** Claude Code skill at `~/.claude/skills/sigil/` that makes Sigil Spinner discoverable and correctly usable from any Claude Code session in any directory — carrying both invocation mechanics and Matt's own planet-correspondence judgment — plus an in-repo mechanical drift check that fails when the skill's documented CLI surface stops matching the CLI's actual one.

Three requirements:

- **SKILL-01** — a session that has never seen this repo generates and embeds a correct sigil without the user naming the tool first
- **SKILL-02** — planet selection is a reasoned choice grounded in Matt's correspondences, stated out loud, not a guess and not a question bounced back
- **SKILL-03** — a mechanical drift check fails when the skill's documented flags no longer match the CLI's real option keys

**The load-bearing constraint, restated because it decides the phase's structure:** this is the *one* place in the whole system that duplicates CLI knowledge outside the README, and it is a prose file that nothing type-checks. It is also installed globally, written once, and then the project moves on. Every decision below that could go two ways went the way that makes the duplication mechanically enforced rather than trusted.

**The parallel constraint from v1.0, carried forward:** both real v1.0 defects passed a fully green 1,453-test suite and were caught by a human looking at output. A skill whose tests assert only "the file parses and its flags exist" would pass while never firing in a real session. Success criterion 1 is a cold-session human check (D-118), not a green test.

**Not in this phase:**

- Adding `--help` to the CLI. That is a new CLI capability, an `INT-*`-series concern, and it would not be reachable via `npx` until a publish. Deferred with a named reason (see Deferred Ideas)
- Publishing `1.1.0`. Still the milestone-close action D-98 named — this phase now gives it a *second* consumer (the skill's element section), which is recorded, not acted on
- Any change to sigil construction, rendering, the JSON working, the `--sigil-*` surface, or the `<sigil-spinner>` element. The skill describes and invokes; it generates nothing new
- An MCP server (deferred out of v1.1 in REQUIREMENTS.md)
- Shipping the skill inside the npm tarball (D-100)

</domain>

<decisions>
## Implementation Decisions

Eight gray areas, all auto-resolved. Decision IDs continue from Phase 7's D-98.

### Where the skill actually lives

- **D-99: The skill's canonical source lives in-repo at `skill/`; `~/.claude/skills/sigil/` is an installed copy and is never the source of truth.** Layout: `skill/SKILL.md` plus `skill/references/*.md`. An `npm run skill:install` script copies repo → home, one direction only, and fails rather than merging if the destination has diverged. Two independent reasons, either of which is sufficient. **(1) SKILL-03 is otherwise unrunnable.** A drift check that reads `$HOME/.claude/skills/sigil/SKILL.md` works on exactly one machine and is a no-op on a fresh clone and on every CI runner — which is the entire population that would catch the drift. **(2) The home directory is a substrate that has already failed this way.** `~/.psyche/identity/design-principles.md` § 10 ("Maintenance Must Not Return to the Failing Substrate") was written about precisely this: an installed skill copy that could silently become the de facto truth until the next sync destroyed it, with the fix being repo-canonical source plus a byte-identity drift guard. — **Reversibility:** costly — moving the source later means re-pointing the drift check, the install script, and every path reference in the plans, and re-establishing which copy was authoritative during the gap.
  - Rejected: authoring only at `~/.claude/skills/sigil/`. Un-versioned, un-diffable, un-reviewable, and it makes SKILL-03 a check that can only ever run on Matt's laptop.
  - Rejected: a symlink from `~/.claude/skills/sigil` → the repo's `skill/`. Cheaper and it eliminates the parity question entirely — but it couples a *global* skill's availability to this repo staying at one path on one machine, and a `git checkout` of another branch silently swaps the installed skill underneath every open session. Two copies plus a parity guard is the honest shape.

- **D-100: `package.json`'s `files` array is not extended — `skill/` does not ship in the npm tarball.** It stays `["src", "bin", "README.md"]`, exactly as Phase 6 froze it. The skill is Matt's personal Claude Code configuration carrying his lineage correspondences; it is not part of the published library's contract, and shipping it would both change a frozen tarball surface and distribute personal esoteric judgment to anyone who runs `npm install`. `files` is an allowlist, so this requires no `.npmignore` and no action — but it is recorded as a decision rather than an omission, because "add the skill to `files` for completeness" is exactly the plausible-sounding edit a later agent would make. `test/pack-install.test.js`'s `EXPECTED_TARBALL_FILES` and `ALLOWED_TARBALL_ROOTS` therefore need **no** edit this phase — a notable difference from Phase 7. — **Reversibility:** one-way once published — a published tarball's file list cannot be retracted, only superseded by a new version.

- **D-101: An install-parity guard exists, and its conditionality is a stated exception rather than a silent skip.** It asserts that every file under `~/.claude/skills/sigil/` is byte-identical to its `skill/` counterpart **when that path exists**, and is an explicit, message-printing no-op when it does not. This repo's established convention is *fail loudly rather than skip* (`test/browser/*` fails with install instructions rather than skipping when chromium is absent). This is the one deliberate exception, and the reason is that the two cases are genuinely different: a missing chromium is a **missing prerequisite** the developer should fix, while a missing `~/.claude/skills/sigil/` is a **correct state** for any machine that is not Matt's. Conflating them would train the suite's red to mean nothing. The no-op must print why it did nothing — an unexplained pass is how a guard decays into decoration.

### The description — the single highest-leverage sentence in the phase

- **D-102: The `description` frontmatter is third-person, names the concrete nouns a real request contains, carries example trigger phrases, and carries an explicit SKIP clause.** Research measured skill activation moving from ~20% to ~50% on description quality alone, and to ~90% once example trigger phrases were included; a vague description is functionally a skill that does not exist, because Claude never routes to it. The exact wording is Claude's discretion at authoring time; the required *elements* are locked:
  1. **What**, in the tool's own nouns — planetary sigils, kamea magic squares, intention statements, embeddable CSS-stylable inline SVG
  2. **The vocabulary a real request actually uses** — "make me a sigil", "sigilize this intention", "planetary sigil", "kamea", "sigil for a page"
  3. **The build-context trigger** — when embedding a sigil into a page or site being built
  4. **The judgment trigger** — when choosing which planet suits an intention
  5. **A SKIP clause naming the adjacent skills**, because the collision is real rather than hypothetical: this environment already ships `oracle` (tarot spreads, dream work, astrological synthesis) and `decide`. Tarot readings, natal charts, transits, and general symbolic interpretation belong to `oracle` and must not be captured here. A description written as "helps with symbolic/esoteric work" would fire on all of it and erode trust in skill-surfacing generally.
  — **Reversibility:** reversible — the description is a one-line edit and a re-install. Rated explicitly because its *importance* invites a one-way reading; it is the highest-leverage line in the phase and also the cheapest to change.

- **D-103: Frontmatter is `name: sigil`, `scope: personal`, plus a declared `allowed-tools`.** `name` must be lowercase-hyphenated and match the parent directory (`~/.claude/skills/sigil/` → `sigil`) or the skill does not load. `scope: personal` matches the house convention in Matt's installed skills (`capture`, `draft`, and others all carry it). `allowed-tools` is declared rather than omitted, for the same reason those two precedents declare it — but note the failure mode precisely, because it is silent: `allowed-tools` is a *restriction*, so a tool omitted from it fails mid-task rather than at load. The set must cover everything the documented workflows need: `Bash` (to run `npx`), `Read`, `Write`, `Edit`, `Glob`, `Grep`. Under-declaring is the expensive direction.

### What mechanics the skill carries — and the research correction that forces the answer

- **D-104: The skill carries the flag table inline, and SKILL-03's drift check is what makes that duplication safe.** This **overrides** `.planning/research/PITFALLS.md` § Pitfall 11, which instructs: "Do not duplicate flag syntax in the skill … everything mechanical should be a single delegating line (`run sigil-spinner --help` …) rather than a hand-copied table of flags." That mitigation assumed a `--help` this CLI does not have (verified above), so following it literally would point a fresh session at a command that errors. The three available paths and why two lose:
  - Rejected: **add `--help` to the CLI this phase.** It is a new CLI capability — its own requirement in the `INT-*` series, its own phase — and it changes the published artifact, so `npx @falkensmage/sigil-spinner@latest --help` would keep failing until a version bump and publish. Scope creep with a delayed payoff.
  - Rejected: **point at the installed README.** It makes a session read 724 lines to learn seven flags, and README depth is exactly what D-105 pushes to on-demand reading.
  - Taken: **document the flags, and enforce the documentation mechanically.** SKILL-03 is not incidental to this choice; it is the precondition for it. **Downstream agents must not "fix" the skill by deleting the flag table in deference to Pitfall 11** — this decision is the amendment, and the drift check (D-107) is the reason it is safe.

- **D-105: `SKILL.md` carries mechanics plus judgment; everything exhaustive stays out and is read on demand.** Body budget ≈ under 5k tokens, holding: the invocation recipe, the flag table, the planet table plus selection heuristic, and the embedding checklist. Deliberately *not* restated: the 15 `--sigil-*` custom properties, the full `E_*` and exit-code tables, the letter-handling and folding rules, the JSON working's sixteen fields. The skill points at the installed package's README (`node_modules/@falkensmage/sigil-spinner/README.md`) and at the GitHub URL, and instructs Claude to read it only when the task actually needs that depth. This is the documented progressive-disclosure pattern and it also keeps the drift surface small — every line the skill restates is a line that can rot.

- **D-106: The skill carries an operational embedding checklist, not just an invocation recipe.** Five items, each a README fact restated as an instruction a session would otherwise learn by shipping a broken page: (1) supply a **distinct `--id-prefix` per co-embedded sigil** — identical prefixes collide by design and are the caller's documented responsibility, not a bug to discover; (2) the **grid layer is present and hidden**, not absent — one CSS declaration reveals it; (3) the **glyph layer is opt-in** and depends on the viewer's font covering U+2600–26FF, mitigable with `--sigil-glyph-font`; (4) numeric `--sigil-*` values are **unitless user units**; (5) curve mode can **overshoot the viewBox** on reversal-heavy statements (`sun` + "I WILL SUCCEED" is the documented instance) — deliberately not clamped.

### The drift check

- **D-107: `test/skill-cli-parity.test.js` parses both sides as text and asserts set equality in both directions.** It reads `skill/SKILL.md` for backtick-wrapped `--flag` tokens, reads `bin/sigil-spinner.js` for the `options: { … }` object literal of its `parseArgs` call, and asserts the two sets match exactly. **Both sides are parsed as text and neither is imported** — `bin/sigil-spinner.js` executes at import (it reads `process.argv`, may read fd 0, and calls `process.exit`), which is the same constraint that forced `test/element-docs.test.js` to read `src/element/sigil-spinner-element.js` as text rather than importing it, and the same methodology `test/citations.test.js` already applies to `.js` sources. Bidirectional per the D-97 precedent: a flag the skill documents that the CLI lacks fails, **and** a CLI flag the skill omits also fails. Guards are keyed, not transcribed (D-55, D-61, D-65, D-97) — the test never restates the flag list as a literal on either side.

- **D-108: Deliberate non-documentation is an explicit, commented allowlist — and it is empty at phase close.** If a future flag is genuinely irrelevant to the skill, it goes into a named `INTENTIONALLY_UNDOCUMENTED` array with a reason comment, the same shape as D-96's `resolveOnly` discriminator. All seven current options — `--planet`, `--json`, `--output`, `--glyph`, `--curve`, `--id-prefix`, `--title` — are documented, so the array ships empty. The point of an empty-but-present allowlist is that skipping a flag requires a deliberate edit with a written reason, instead of the check quietly degrading into one-directional the first time someone finds the reverse direction inconvenient.

- **D-109: Both directions of the parity check are fail-first-proven.** Following 05-04's precedent, which exists because this project has already shipped an unsound checker once (a whitespace-only excerpt satisfied MAINT-01's R1 rule vacuously, and a ±200-char window let one citation's excerpt back another's path token — both found by code review, not by the checker). A guard that has never been observed to fail is a guard that has not been tested. Each direction gets a demonstrated failure against a fixture: a fabricated `--nonexistent` flag in the skill text must fail one direction, and a CLI option absent from the skill text must fail the other.

### The correspondences — content and shape

- **D-110: A seven-row table plus a written selection heuristic inline in `SKILL.md`; worked examples in `skill/references/correspondences.md`.** The table is what Claude needs at the moment of choosing and is short enough to always be loaded; the reasoning for ambiguous cases is the long part and is read on demand. Each row carries the planet, the domains of intent it governs, and a one-line "reach for this when." The heuristic must cover the case a flat table structurally cannot: **a statement that reads as two planets at once** — which axis wins, and why. That is the case that separates a reasoned choice from a lookup.
  - Rejected: the whole correspondence set in a reference file. The differentiating content would sit behind a second read, and a session under token pressure would skip it and guess — the precise failure SKILL-02 exists to prevent.
  - Rejected: everything inline including the worked examples. The examples are the longest part and are needed only for the ambiguous minority.

- **D-111: The skill instructs Claude to state the reasoning out loud in its reply.** Success criterion 2 requires the reasoning *stated*, not merely performed. The instruction: name the chosen planet, name the domain of intent it was matched on, and — when the statement was genuinely ambiguous — name the axis that decided it and what the runner-up was. And the negative half, stated because it is the failure mode the criterion calls out by name: **never bounce the choice back to the user as a question.** A stated reasoned choice the user can correct in one sentence is the deliverable; an interrogation is the thing this skill exists to remove.

- **D-112: The correspondences are attributed, in the file, as Matt's lineage with a capture date.** One line in `skill/references/correspondences.md` recording that they came from Matt directly on a named date and are not general astrological training. This is what makes the planet choice trustworthy rather than confident, and it is what lets a future reader tell whether a row was ratified or drifted in later.

### The human gate — how Matt's input actually gets captured

- **D-113: The correspondence capture is a blocking `checkpoint:decision` at the top of the plan that authors SKILL-02, and Claude arrives at it holding a draft to correct — not a blank page.** Before the checkpoint, Claude drafts a proposed seven-row table by pulling from Matt's own onboarded corpus first — `mcp__psyche-semantic__semantic_recall` with `content_type: ["knowledge"]` against the astrological and cross-cutting corpora enumerated in `~/.psyche/identity/behaviors.md` § Corpus-Grounded Readings (School of Astrological Arcana, Celestial Alchemy, the podia mythology/techniques material, Eighth House, the Artemisian, CreativeMind, the Mórrígan Intensive) — and marks **every row as proposed and unratified**. Nothing ships until Matt ratifies row by row. The reasoning is a cognitive-profile call, not a convenience one: task initiation is severely impaired and response inhibition/metacognition are strong, so *correcting a wrong row* is a reliable operation where *generating seven rows from nothing* stalls. Same instrument as Phase 7's pre-execution gate, where the three one-way decisions were confirmed by presenting them as decided-with-alternatives rather than as open questions. — **Reversibility:** one-way in substance — an unratified correspondence set that ships is a skill claiming lineage authority it does not have, and it cannot be un-relied-upon by whoever already used it.
  - Rejected: asking Matt seven open questions ("what does Saturn govern for you?"). Highest quality in theory; it is the blank-page elicitation the cognitive profile says stalls, and it converts a ten-minute correction pass into an authoring project.
  - Rejected: shipping the corpus-derived draft unratified. It would make the skill claim exactly the authority SKILL-02 exists to guarantee, which is worse than shipping without the correspondences at all.

- **D-114: If the gate is not answered, the phase closes without SKILL-02 rather than shipping a guess.** ROADMAP.md already structures the phase this way ("scaffolding, SKILL-01, and SKILL-03 proceed while that input is pending"); this makes it concrete and orderable. The plan authoring the correspondences is **last**, so nothing else waits on it. If it does not land, the skill ships with the correspondence section replaced by an explicit `<!-- SKILL-02 pending: correspondences not yet captured from Matt -->` marker, and — this is the part that must not be forgotten — **the `description` frontmatter is written to not claim planet-selection judgment**, since a description promising reasoning the body cannot deliver is worse than a narrower one.

### Invocation form and the published-version boundary

- **D-115: The documented invocation is `npx -y @falkensmage/sigil-spinner@latest "<statement>" --planet <planet>`, and no local path appears anywhere in the skill.** `-y` because a non-interactive session otherwise hangs on npx's install confirmation. `@latest` because a machine with a warm npx cache would otherwise silently run an older version — an invisible failure in a tool whose whole contract is determinism. The library form (`import { generateSigil } from '@falkensmage/sigil-spinner'`) is documented as the alternative for build scripts that already carry the dependency. **Any absolute path under `/Users/`, or any reference to `~/RitualSync/sigil-spinner`, is a named review failure** (PITFALLS § Pitfall 11 warning signs) — the skill is global and must work on a machine that has never cloned this repo.

- **D-116: The skill documents only what the published package actually resolves to — and as of 2026-08-09 that is `1.0.0`, which has no `./element`.** Verified live against the registry, not inferred. Phase 7 built `<sigil-spinner>` and deliberately did not publish it (D-98), so a skill telling a fresh session to `import '@falkensmage/sigil-spinner/element'` would produce `ERR_PACKAGE_PATH_NOT_EXPORTED` on **every** machine — a failure that reads as a broken install and would send a session debugging its own `node_modules`. Therefore: **the embedding guidance is inline-SVG-only, and the custom element is not documented as installable.** The plan must **query the live registry at authoring time** rather than assume in either direction — if `1.1.0` publishes first, the element section is added and D-107's parity check extends to cover it. Assuming the state at plan time is the whole failure mode here. — **Reversibility:** reversible — adding an element section later is additive. Rated because the *wrong* direction (documenting it early) is not: it ships broken instructions to every future session until noticed.

- **D-117: Success criterion 3 is verified by a real `npx` run against the registry, from a scratch directory outside this repo.** It captures the resolved version and the produced SVG, and it runs the exact string the skill tells a session to type. Not `node bin/sigil-spinner.js`, and not the pack-install path: `test/pack-install.test.js` proves the **tarball** works, which is a different claim from the **registry plus npx resolution** working. Nearest precedent is 06-03's live attestation verification, which read real registry responses rather than trusting the workflow's exit code — the same discipline, one layer out.

### Verifying that it actually fires

- **D-118: Criterion 1 is a human-run cold-session check, written down as a repeatable procedure at `skill/VERIFY.md`.** A new Claude Code session, in a scratch directory that is not this repo and has no `node_modules`, given requests phrased the way real requests are phrased and **never naming the tool, the package, or a flag** — e.g. "make me a sigil for 'I WILL FINISH THIS'" and "I need a sigil for a page about letting go of an old job — pick the planet." Pass requires all four: the skill fired unprompted, a correct sigil was produced, a planet was chosen **with reasoning stated**, and no flag or package name came from the user. The prompts are **fixed in the file** so the check is repeatable rather than re-improvised, which is the same reasoning as D-95 — the artifact is the *instrument* the check is performed with, not documentation that happens to be viewable.

- **D-119: The cold-session check is a blocking human gate at the phase seal, with no automated proxy.** There is no honest substitute. A subagent spawned from this session inherits its context and would prove nothing about a cold session's routing; a test that asserts the description contains certain substrings proves the file's contents, not that Claude routes to it. This is the same shape as Phase 7's success criterion 1, and the same v1.0 lesson: structural tests verify wiring, not behavior.

### Claude's Discretion

Everything not locked above. Specifically:

- **Plan decomposition and ordering**, beyond the one ordering constraint D-114 fixes (the correspondence plan is last). The natural seams are: skill scaffolding + install script; the parity check; the mechanics content; the correspondences; the verification gates — but how those group into plans is a planning call.
- **Whether the install-parity guard (D-101) is its own test file or lives inside `test/skill-cli-parity.test.js`.** Both satisfy the requirement; a separate file keeps the conditional no-op from muddying an unconditional check, which argues mildly for splitting.
- **The `skill:install` script's implementation** — a small `node` script in `scripts/` versus a shell one-liner in `package.json`. Constraint: it must be one-directional (repo → home) and must not silently overwrite a diverged destination without saying so.
- **The exact `description` wording**, within D-102's five required elements.
- **The flag-token extraction regex in D-107**, and whether the CLI side parses the `options` object by regex or by a small brace-matched scan. Constraint: it must fail loudly with a named error if it parses zero flags from either side — the `element-docs.test.js` precedent has exactly this guard, and it is what stops a regex that silently stops matching from turning the whole check green.
- **How many worked examples go in `skill/references/correspondences.md`.** Research suggests 2–4 for the ambiguous cases; the count is open, the requirement that ambiguous-case reasoning is present is not.
- **Whether `skill/VERIFY.md` also carries the D-117 npx verification procedure** or that lives separately.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and requirements

- `.planning/ROADMAP.md` § Phase 8: The Sigil Skill (lines 170-185) — goal, the four success criteria, the human gate and its explicit instruction to structure the phase so scaffolding/SKILL-01/SKILL-03 proceed while it is pending, the open decision this phase owns, and the note that the skill's files live outside the repository
- `.planning/ROADMAP.md` § Human Gates (lines 47-55) — the correspondences gate, what it blocks and what it does not
- `.planning/ROADMAP.md` § Milestone-Wide Constraints (lines 211-219) — zero runtime dependencies, no build step, byte-determinism, light DOM. No phase may violate these
- `.planning/REQUIREMENTS.md` — SKILL-01, SKILL-02, SKILL-03 verbatim (lines 23-25); § Open Decisions for Discuss-Phase (lines 68-77) assigns the correspondence capture format to this phase; § Deferred (line 52) records MCP-01 as out of v1.1 and *why*
- `.planning/PROJECT.md` § Current Milestone (lines 25-43) — "must come from Matt, not from general training", and the two-distinct-consumers framing that keeps Phases 7 and 8 unbraided

### The skill's design — load-bearing research

- `.planning/research/FEATURES.md` (lines 19-23) — the `name`/`description` frontmatter contract, the measured activation rates (~20% → ~50% → ~90%), the third-person-with-trigger-language rule, the progressive-disclosure body budget, and the personal-vs-project scope decision with its precedence note
- `.planning/research/FEATURES.md` (lines 36-38) — the heuristic-not-lookup-table argument behind D-110, the embedding-checklist content behind D-106, and the bundled-reference-file pattern
- `.planning/research/PITFALLS.md` § Pitfall 11 (lines 200-217) — the three failure modes (never fires / fires on everything / drifts from the CLI), the `oracle`-collision risk that D-102's SKIP clause answers, the never-hardcode-a-local-path rule behind D-115, and the drift-check design behind D-107. **Read alongside D-104 — this phase amends its "delegate to `--help`" mitigation, because `--help` does not exist**
- `.planning/research/PITFALLS.md` (lines 248, 275, 286, 313) — the flag-table trade-off row, the over-broad-trigger risk row, the leftover-dev-path checklist item, and the pitfall→phase mapping
- `.planning/research/ARCHITECTURE.md` (lines 170, 183, 189, 203) — the skill's file footprint as entirely outside this repository, its lack of file dependencies, and the verification-order (not code) dependency on PKG-01 that D-117 discharges
- `.planning/research/SUMMARY.md` (lines 50, 90, 101, 105, 124) — the skill as one of five distribution features, the human gate, the "skill content-capture format needs discuss-phase" note this context closes, and the drift-check-ships-in-the-same-phase rule

### Prior phase decisions this phase builds on

- `.planning/phases/07-the-sigil-spinner-element/07-CONTEXT.md` — D-95 (the instrument-not-documentation argument D-118 reuses), D-96/D-97 (the two drift-guard precedents D-107 follows, including the parse-as-text-never-import constraint), D-98 (the publish boundary that makes D-116 necessary), and the auto-mode/one-way-checkpoint precedent this context's header follows
- `.planning/phases/06-published-package/06-CONTEXT.md` — D-72 (`ENTRY_POINTS` as data, the shape D-108's allowlist copies) and the live-registry verification discipline D-117 extends
- `.planning/phases/05-publish-ready-source/05-CONTEXT.md` — D-57–D-61, and the 05-04 checker-soundness lesson that D-109 acts on

### Matt's own operating constraints — binding on this phase, not background

- `~/.psyche/identity/design-principles.md` § 10 "Maintenance Must Not Return to the Failing Substrate" — the repo-canonical-source-plus-drift-guard shape D-99 adopts, written from the prior failure of exactly this `~/.claude/skills/` pattern
- `~/.psyche/identity/cognitive-profile.md` § Clinical EF Calibration — severely impaired task initiation, strong response inhibition/metacognition. The evidence behind D-113's draft-to-correct choreography
- `~/.psyche/identity/behaviors.md` § Corpus-Grounded Readings (SYMB-06) — the enumerated astrological and cross-cutting corpora D-113's draft pulls from, and the honesty fallback if `semantic_recall` returns nothing relevant

### Contract surfaces this phase touches

- `bin/sigil-spinner.js:113-127` — the `parseArgs` `options` object: `planet`, `json`, `output`, `glyph`, `curve`, `id-prefix`, `title`. **The authoritative flag set for D-107, and there is no `help` key** — verified by execution, not by reading
- `bin/sigil-spinner.js:1-35` — the header comment documenting D-09/D-10/D-11/D-12 (stdin via `-`, artifact selection, `--output` stdout purity, stderr diagnostics). The behavioral facts the skill's invocation recipe must get right
- `test/element-docs.test.js` — the closest existing template for D-107: parses a source file as text, derives the expected set rather than restating it, asserts both directions, and guards against a zero-match regex. Copy the methodology
- `test/citations.test.js` and `test/package-identity.test.js` — the other two mechanical drift guards and the house idiom for them
- `test/pack-install.test.js:37-75` — `ENTRY_POINTS`, `EXPECTED_TARBALL_FILES`, `ALLOWED_TARBALL_ROOTS`. **Needs no edit this phase** (D-100) — recorded so an agent does not add a `skill/` row by pattern-matching Phase 7
- `package.json` (lines 6-15, 24-32) — `exports`, `files`, and `scripts`. Only `scripts` gains a key (`skill:install`); `files` and `exports` are untouched
- `README.md` § CLI (lines 69-109), § Errors and Exit Codes (lines 629-663), § CSS Custom Properties (lines 163-262) — the depth the skill points at rather than restates (D-105)
- `~/.claude/skills/capture/SKILL.md` and `~/.claude/skills/draft/SKILL.md` — the house frontmatter convention D-103 matches (`name` / `scope: personal` / `description` / `allowed-tools`)
- `.planning/STATE.md` § Blockers/Concerns (lines 138-148) — the curve overshoot and glyph font-coverage items D-106's checklist restates

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`test/element-docs.test.js`** — the direct template for D-107. Already solves every hard part: parsing a JS source as text because importing it throws, deriving the expected set from the source rather than transcribing it, asserting set equality in both directions with named diffs in the failure message, and a separate first test asserting both parses returned something non-empty (the guard that stops a stale regex from silently greening the check).
- **`test/citations.test.js`** — the precedent for treating `.js` sources as text and for a drift guard whose own soundness was later challenged and repaired (05-04). D-109's fail-first requirement comes directly from that history.
- **`test/package-identity.test.js`** — the README↔`package.json` binding guard; the third instance of the same idiom.
- **`bin/sigil-spinner.js`'s `parseArgs` block** — a single, self-contained `options: { … }` object literal, which is what makes D-107's text parse tractable. Note it is inside a `try`/`catch` that calls `diagnose(...)`, i.e. `process.exit` — reinforcing that this file must never be imported by a test.
- **The `E_*` exit-code map keyed from imported constants (D-55)** — the canonical statement of "guards are keyed, not transcribed" in this codebase, and the reason D-107 must not restate the flag list.

### Established Patterns

- **Guards are keyed, not transcribed.** D-55, D-61, D-65, D-97 — four instances. D-107 is the fifth and must not break the streak.
- **Parse as text when importing has side effects.** Established by `test/citations.test.js`, made explicit by D-96 and `test/element-docs.test.js`'s header. Binding for `bin/sigil-spinner.js`.
- **The suite fails loudly rather than skipping.** Universal in this repo. D-101 is the single stated exception and carries its reason inline.
- **Options are validated by the library, never by the surface.** `bin/sigil-spinner.js:157-159`. The skill inherits this posture: it should not teach a session to pre-validate planets or statements — `generateSigil` owns that, and its errors are actionable.
- **Live registry state is verified, not assumed.** 06-03 read real registry responses rather than trusting exit codes. D-116 and D-117 continue it.

### Integration Points

- **`package.json` `scripts`** gains exactly one key (`skill:install`). `exports`, `files`, `main`, `bin`, and `version` are all untouched — this phase publishes nothing and changes no published contract.
- **`skill/`** is a new top-level directory, repo-only, outside `files`. **`examples/`** is the precedent for a repo-only directory that stays out of the tarball (D-95).
- **`vitest.config.js`** — `include: ['test/**/*.test.js']` is one flat include, so any new `test/skill-*.test.js` is picked up by `npm test` automatically with no config edit. Note the consequence: the install-parity guard (D-101) will run on every developer's `npm test`, which is exactly why its no-op-when-absent behavior has to be correct rather than incidental.
- **`~/.claude/skills/sigil/`** is the install destination and the only thing this phase writes outside the repository.
- **Zero source files change.** `src/`, `bin/`, and the published artifact are untouched. This phase's blast radius inside the package is one `scripts` key.

</code_context>

<specifics>
## Specific Ideas

- The skill's job description is **"be the thing that makes a cold session behave like a session that has read the README and knows Matt's correspondences"** — not "be a second interface to the tool." Every decision above that could go two ways went the way that keeps the skill *describing* the CLI rather than *becoming* a surface of its own. That framing is the best test for any question this context did not anticipate: **if the skill would need updating for a reason that is not "the CLI changed" or "the correspondences changed", it has probably grown a surface it should not have.**
- The verification shape is deliberately three-vantage-point and should stay that way in planning: the parity test proves the **documentation matches the code** (in-repo, mechanical, runs on every commit); the npx run proves the **registry and the documented invocation string actually work** (outside the repo, live, run once per publish); the cold-session check proves the skill **fires and reasons** (human, un-automatable). None of the three can see what the others see, and collapsing any two loses a real vantage point — the same argument D-96 made for keeping the Node smoke test and the browser test separate.
- Success criterion 1 has a human in it on purpose, and success criterion 2 has a *judgment* in it on purpose. Neither is a test that can be written. `skill/VERIFY.md` should be planned as a deliverable with that job — the instrument the check is performed with — not as a nice-to-have that gets cut if the phase runs long. Phase 7 made exactly this argument for `examples/element.html` and it held.
- The correspondences are the only part of this phase that is genuinely Matt's and genuinely un-researchable. Everything else is mechanics. Plan the phase so that if only one thing gets Matt's attention, it is that gate — and so that a "no" or a "not now" on it costs the phase one plan rather than the whole thing (D-114).

</specifics>

<deferred>
## Deferred Ideas

- **A real `--help` flag on the CLI.** Named as its own requirement in the `INT-*` series and its own phase, not folded here (D-104). Worth it independently of the skill — the CLI currently answers `--help` with `E_CLI_USAGE: Unknown option '--help'`, which is a poor first experience for a human who just ran `npx @falkensmage/sigil-spinner`. Reopen condition: any phase that touches `bin/sigil-spinner.js`'s argv surface for another reason.
- **Publishing `1.1.0` to npm.** Already the milestone-close action D-98 named. This phase gives it a **second** consumer: until it happens, the skill cannot document the `<sigil-spinner>` element (D-116). Recorded so the dependency is visible at milestone close rather than rediscovered.
- **Extending the skill to cover the custom element** once `1.1.0` publishes — an element section in `SKILL.md` plus extending D-107's parity check to the element's `observedAttributes` (which `test/element-docs.test.js` already parses, so the extraction exists). Blocked on the publish, not on design.
- **An MCP server** exposing `generateSigil` to Claude Desktop. Deliberately out of v1.1; if built, it must live in a separate package (the `@modelcontextprotocol/sdk` dependency would break the zero-dependency guarantee).
- **A project-scoped `sigil` skill in a site repo.** Precedence is enterprise > personal > project, so a same-named project skill would silently shadow this one. Unlikely, but worth one line in the skill's own notes if a site repo ever grows one.
- **A re-ratification trigger for the correspondences.** They are lineage knowledge and will evolve. There is no mechanism proposed here for noticing when the shipped table has gone stale relative to Matt's current practice — the parity check covers flags, not judgment. Reopen when the first correction arrives.
- **Publishing the skill as a shareable artifact** (a repo, a plugin, a marketplace entry) for other practitioners. The correspondences are personal lineage; D-100 keeps them out of the tarball for that reason. If the mechanics half is ever worth sharing, it is a different artifact with the judgment half removed.
- **A PR-triggered CI workflow.** Still not a requirement. This phase adds one or two more test files but no new external prerequisite (the parity check needs no browser), so it does not move the answer.
- **The three v1.0 items deferred with written reopen conditions** (`E_CLI_STDIN` coverage, the `perpendicularUnit` doc comment, the `D-12` ID collision). The `D-12` condition names `bin/sigil-spinner.js:20` among its triggers — **this phase reads `bin/sigil-spinner.js` but must not edit it**, so the condition should stay unmet. Planning should confirm rather than assume.

</deferred>

---

*Phase: 8-The Sigil Skill*
*Context gathered: 2026-08-09*
