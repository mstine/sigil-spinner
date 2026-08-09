---
phase: 08-the-sigil-skill
plan: 04
subsystem: distribution/skill
tags: [agent-skills, correspondences, lineage-attribution, human-gate, live-registry]
status: complete

dependency-graph:
  requires:
    - phase: 08-the-sigil-skill
      provides: "skill/SKILL.md (repo-canonical, 08-01), test/skill-cli-parity.test.js (D-107, 08-02), embedding checklist + skill/VERIFY.md (08-03)"
  provides:
    - "skill/SKILL.md — the seven-row correspondence table, the verb-over-subject selection heuristic, D-111's reasoning instruction, and the description frontmatter's fifth (judgment) element"
    - "skill/references/correspondences.md — three worked examples of the two-planet compound case, plus D-112's attribution line and the honest corpus-limitation note"
    - "SKILL-02 discharged: planet selection is now a reasoned choice grounded in Matt's ratified lineage, not a guess or a question bounced back"
  affects:
    - "~/.claude/skills/sigil/ (installed copy, refreshed by npm run skill:install -- --force)"

actuals:
  tokens: 1900
  tasks: 1
  commits: 1

tech-stack:
  added: []
  patterns:
    - "Draft-to-correct choreography for lineage knowledge a model cannot originate (D-113), compressed here because the orchestrator performed the corpus-grounding and ratification steps outside this executor's session"
    - "A row that holds two poles at once (Saturn: stability and restriction as one working) rather than collapsing a genuine paradox into a single reading"

key-files:
  created:
    - skill/references/correspondences.md
  modified:
    - skill/SKILL.md

key-decisions:
  - "Ratified verbatim per Matt's 2026-08-09 conversation, with one amendment: Saturn's row holds BOTH stability and restriction at once rather than resolving to one pole — 'It's both,' per Matt's own words, and the row is written so neither pole is dropped"
  - "The Moon row and the verb-over-subject heuristic shipped exactly as drafted — ratified without correction"
  - "Description frontmatter's fifth D-102 element (the judgment trigger) added inline to the existing 'Fires on' sentence rather than as a new trailing clause, keeping the SKIP clause and all four prior elements intact at 637 chars flattened"

patterns-established:
  - "A correspondence row that names a genuine paradox states it as held, not resolved — see Saturn's worked example (\"I WILL STOP SHRINKING MYSELF\")"

requirements-completed: [SKILL-02]

coverage:
  - id: D1
    description: "skill/SKILL.md carries the seven-row planet table, the verb-over-subject selection heuristic covering the compound two-planet case, and D-111's reasoning instruction (state the planet and matched domain; never bounce the choice back as a question)"
    requirement: "SKILL-02"
    verification:
      - kind: unit
        ref: "test/skill-cli-parity.test.js — asserts the table's row shape is never misread as a flag row; 9/9 passed"
        status: pass
      - kind: manual_procedural
        ref: "grep assertions: SKILL-02 pending count 0, never-bounce phrase present, references link present ≥1"
        status: pass
    human_judgment: false
  - id: D2
    description: "skill/references/correspondences.md carries D-112's attribution line (Matt directly, 2026-08-09, not general training), the honest corpus-limitation note, and three worked examples of the ambiguous two-planet case"
    requirement: "SKILL-02"
    verification:
      - kind: manual_procedural
        ref: "grep assertions: unratified count 0, attribution phrase present, three ### worked-example headers"
        status: pass
    human_judgment: false
  - id: D3
    description: "Full automated gate set green on the final tree: suite (1528 tests/25 files), typecheck, lint, test:pack, both parity guards, and D-117's live registry procedure from a scratch directory outside the repo"
    verification:
      - kind: unit
        ref: "npm test — 25 files, 1528 tests, all passed"
        status: pass
      - kind: unit
        ref: "npm run typecheck — exit 0"
        status: pass
      - kind: unit
        ref: "npm run lint — exit 0"
        status: pass
      - kind: unit
        ref: "npm run test:pack — 1 file, 2 tests, all passed"
        status: pass
      - kind: unit
        ref: "npx vitest run test/skill-cli-parity.test.js — 9/9 passed"
        status: pass
      - kind: unit
        ref: "npx vitest run test/skill-install-parity.test.js — 2/2 passed, no divergence, no orphan"
        status: pass
      - kind: e2e
        ref: "npx -y @falkensmage/sigil-spinner@latest 'I WILL FINISH THIS' --planet saturn, run from mktemp -d outside the repo"
        status: pass
    human_judgment: false
  - id: D4
    description: "D-119's cold-session routing/reasoning check (skill/VERIFY.md Procedure 1) — a genuinely cold Claude Code session, in a scratch directory, firing unprompted and stating reasoning"
    verification: []
    human_judgment: true
    rationale: "No automated proxy exists by design (D-119). A subagent spawned from this session inherits its context and would prove nothing about cold-session routing. NOT run in this plan — recorded as OUTSTANDING for the orchestrator and Matt to perform per skill/VERIFY.md Procedure 1."

duration: ~15min
completed: 2026-08-09
---

# Phase 8 Plan 04: The Sigil Skill — Ratified Correspondences and Phase Seal Summary

**Matt's seven planet correspondences, ratified in conversation on 2026-08-09 with one amendment (Saturn holds both stability and restriction at once), now ship inline in `skill/SKILL.md` with the verb-over-subject selection heuristic and D-111's state-the-reasoning instruction; `skill/references/correspondences.md` carries the attribution, the honest corpus-limitation note, and three worked examples; every automated gate is green on the final tree and the live registry procedure was proven from outside the repo. The D-119 cold-session check remains outstanding — it requires a human, in a fresh session, and is not self-certifiable by this executor.**

## Performance

- **Duration:** ~15 min
- **Tasks:** 1 (this executor's scope — Tasks 1 and 2 were performed by the orchestrator before dispatch; see Deviations)
- **Files modified:** 2

## Accomplishments

- Replaced the `<!-- SKILL-02 pending -->` marker in `skill/SKILL.md` with the ratified seven-row correspondence table, the verb-over-subject selection heuristic, and D-111's reasoning instruction (positive and negative halves)
- Broadened the `description` frontmatter to add D-102's fifth required element — the judgment trigger for choosing which planet suits an intention — while keeping the SKIP clause and the four prior elements intact
- Created `skill/references/correspondences.md`: D-112's attribution line, an honest record of the corpus's limitation for this use case, and three worked examples of the compound two-planet case
- Reinstalled to `~/.claude/skills/sigil/` with `--force`; confirmed the destination is byte-identical to the repository
- Ran the whole gate set on the final tree: `npm test` (1528/1528), `npm run typecheck`, `npm run lint`, `npm run test:pack`, both parity guards (`skill-cli-parity`, `skill-install-parity`) — all green
- Ran D-117's live registry procedure from `mktemp -d`, outside the repository: exit 0, resolved version `1.0.0`, stdout beginning with `<svg`, stderr empty

## Ratification Record (Task 2 resolution, as received from the orchestrator)

**Gate:** Whether the seven-row correspondence draft becomes Matt's ratified lineage in the skill, with or without corrections — or whether the phase closes without it.

**Resolution:** `ratify-with-corrections` — ratified as drafted with one amendment.

- **Q1 (Saturn — closer to stability than restriction?):** *"It's both."* Saturn's row holds both poles at once — the same structure that steadies is the structure that constrains — rather than resolving to one reading. This is a genuine paradox held, not a compromise wording.
- **Q2 (Moon row — does it work?):** *"The Moon works."* Shipped as drafted, unchanged.
- **Q3 (verb-over-subject heuristic — is it right?):** *"Yes."* Shipped as drafted, unchanged.

## Corpora Consulted (Task 1, performed by the orchestrator before this dispatch)

`mcp__psyche-semantic__semantic_recall`, `content_type: ["knowledge"]`, 2026-08-09:

- `celestial-alchemy/U01-Foundations/M08-Planetary-Remediation/handout.md` — planet/sign/house → plants, crystals, goddesses, tarot
- `celestial-alchemy/U01-Foundations/M01-Planets-Luminaries/personal-planets.md` — the sun/moon/Mercury/Venus/Mars framing quoted verbatim in the corpus record
- `elemental-witchcraft/part1-foundations/17_astrological-timing-and-the-great-work-of-magick.md` and its `Creating A Spell Worksheet` handout — confirmed the shape of the question, supplied no intention→planet table

**Honest limitation, carried into `correspondences.md` verbatim:** the corpus is natal- and remediation-shaped, not sigil-shaped. No pre-existing intention→planet mapping in Matt's own words was found anywhere in it. The draft read his material across to a different use — the ratification gate is precisely why that reach was checked rather than shipped on trust.

**Provenance constraint honored:** the two source tables in the corpus (Celestial Alchemy © Tenae Stewart, marked `DO NOT DISTRIBUTE`; the Rowan & Sage material marked `private: true`) were not reproduced, paraphrased closely, or cited in `skill/references/correspondences.md`. Only Matt's ratified articulation, as received, ships.

## Live Registry Verification (D-117)

```
$ npm view @falkensmage/sigil-spinner version
1.0.0

$ D="$(mktemp -d)" && cd "$D"
$ npx -y @falkensmage/sigil-spinner@latest 'I WILL FINISH THIS' --planet saturn
Exit status: 0
First 300 bytes of stdout:
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="sigil sigil--saturn"><g class="sigil-grid" opacity="var(--sigil-grid-opacity, 0)"><path class="sigil-grid-lines" d="M0,0 L100,0 M0,33.333 L100,33.333 M0,66.667 L100,66.667 M0,100 L100,100 M0,0 L0,100 M33.333,0 L33.333,100 M66.667,0
stderr: (empty)
```

Run from a `mktemp -d` scratch directory with no relationship to this checkout and no local `package.json`, per D-117 and `skill/VERIFY.md` Procedure 2.

## D-118/D-119 Cold-Session Check — OUTSTANDING, NOT PERFORMED

**This executor did NOT run `skill/VERIFY.md` Procedure 1, and does not claim it passed.** Per D-119, the cold-session check is a blocking human gate at the phase seal with no automated proxy — a subagent spawned from this session inherits this session's context and would prove nothing about a genuinely cold session's routing. Recording it as passed here would be a false claim.

**What remains for the orchestrator/Matt to do:**

1. Confirm `npm run skill:install` was already run in this session (it was — see above) and the installed copy is current.
2. Open a **brand-new Claude Code session**, started after that install completed.
3. `cd` into a scratch directory (`mktemp -d`) that is not this repository and has no installed `node_modules`.
4. Type the two prompts in `skill/VERIFY.md` verbatim, without naming the tool, package, or any flag.
5. Record all four pass conditions individually — condition 3 (planet chosen with reasoning stated) is now expected to **pass**, since the ratified branch shipped (unlike the declined-branch case `skill/VERIFY.md` also documents).

## Task Commits

Tasks 1 and 2 of the plan were performed by the orchestrator conversationally, outside this repository's working tree, before this executor was dispatched (see Deviations below) — neither produced a repo commit. Only Task 3 was executed here:

1. **Task 3: Author the gate's outcome (ratified branch), reinstall, and seal the phase** — `aeb0a50` (feat)

## Files Created/Modified

- `skill/SKILL.md` — Planet Selection section: seven-row table, selection heuristic, reasoning instruction; description frontmatter broadened with the fifth D-102 element
- `skill/references/correspondences.md` (new) — attribution, honest limitation note, three worked examples

## Decisions Made

- Ratified with the Saturn both-poles amendment (see Ratification Record above); Moon row and heuristic ratified unchanged
- Chose to add the judgment-trigger clause inline to the existing "Fires on" sentence in the description rather than append a new sentence — kept the flattened description under 700 chars and preserved the SKIP clause's position at the end
- Wrote a third worked example ("I WILL STOP SHRINKING MYSELF") beyond the two compound-planet cases named in the ratification prompt, specifically to demonstrate Saturn's both-poles reading in practice — 2–4 worked examples was the plan's stated range, and this row is the one case the flat table's two-planet framing alone does not illustrate

## Deviations from Plan

### Process deviation (not a code deviation) — Tasks 1 and 2 performed outside this executor's session

- **Found during:** Dispatch — this executor does not have access to the `mcp__psyche-semantic__semantic_recall` tool Task 1 requires.
- **What happened:** The orchestrator performed Task 1 (the corpus-grounded draft, via `semantic_recall`) and Task 2 (the D-113 blocking ratification checkpoint, in direct conversation with Matt) before dispatching this executor. The ratified content — the seven-row table, the amendment, and the corpus record — was handed to this executor verbatim, with an explicit instruction not to re-draft or re-run the checkpoint.
- **Consequence for this plan's task structure:** Task 1's acceptance criteria (an intermediate unratified draft file committed to the repo, with every row marked unratified) was never satisfied as a literal repo state, because the draft-then-correct choreography happened conversationally rather than through a file. No unratified draft was ever committed to the repository at any point — the repository went directly from the `<!-- SKILL-02 pending -->` marker (08-03's final state) to the ratified content (this plan's Task 3), in a single commit.
- **Why this does not violate the plan's core guarantee:** The prohibition this plan exists to enforce — "no correspondence row reaches the installed skill without having been ratified by Matt" — held throughout. The ratification happened before any file was written; nothing unratified was ever installed, committed, or shipped. The must-have truth about the draft file's *transient* existence in the repo (as opposed to the ratification itself) was not literally satisfied, but the outcome it was designed to protect was never at risk.
- **Not a Rule 1-4 deviation** in the strict sense — no bug was fixed, no missing functionality was added, and no architectural change was made. Recorded here for transparency because a downstream reader auditing this plan against its own acceptance criteria would otherwise expect to find an unratified draft commit in the git log and not find one.

No other deviations. All of Task 3's acceptance criteria (ratified-branch checks, gate-set checks, live registry checks) were satisfied as written.

## Known Stubs

None. SKILL-02 is fully delivered — the ratified branch shipped, not the declined-branch fallback.

## Threat Flags

None new. All threats T-08-14 through T-08-18 and T-08-SC from this plan's `<threat_model>` were addressed as designed:

- **T-08-14 (Spoofing — correspondence content presented as Matt's lineage):** mitigated. Ratification happened before any content was written to `skill/SKILL.md` or `skill/references/correspondences.md`; the attribution line records the actual ratification date; no unratified marker survives anywhere in either file (`grep -ci unratified` → 0 in both).
- **T-08-16 (Tampering — table row read as a flag row):** mitigated and re-verified. `test/skill-cli-parity.test.js` passed 9/9 after the table landed; the extracted flag-token set is unchanged (`--curve --glyph --id-prefix --json --output --planet --title`).
- **T-08-17 (Tampering — forced reinstall overwriting the destination):** mitigated. `npm run skill:install -- --force` completed; `test/skill-install-parity.test.js` reports no divergence, no orphan.
- **T-08-18 (Information Disclosure — personal lineage reaching the registry):** mitigated. `package.json`'s `files` array untouched (`git status --porcelain package.json` → no output); `npm run test:pack` green.
- **T-08-SC (registry fetch):** accepted per the plan's disposition — no package installed into this repository, `dependencies`/`devDependencies` untouched, and the fetch is of this project's own scoped, provenance-attested package.

## Self-Check: PASSED

- `skill/SKILL.md` — FOUND, contains seven-row planet table, selection heuristic, reasoning instruction; `SKILL-02 pending` count 0
- `skill/references/correspondences.md` — FOUND, contains attribution line, honest limitation note, three worked examples; `unratified` count 0
- Commit `aeb0a50` — FOUND in `git log --oneline`
- `npm test` — 25 files, 1528 tests, all passed
- `npm run typecheck` / `npm run lint` / `npm run test:pack` — all exit 0
- `npx vitest run test/skill-cli-parity.test.js` — 9/9 passed
- `npx vitest run test/skill-install-parity.test.js` — 2/2 passed
- Live registry check — exit 0, `1.0.0`, `<svg` stdout, empty stderr
- Installed copy at `~/.claude/skills/sigil/` — refreshed via `--force`, confirmed byte-identical by the install-parity guard

## Next Phase Readiness

Phase 8 (The Sigil Skill) is code-complete: SKILL-01 (mechanics), SKILL-02 (ratified correspondences, this plan), and SKILL-03 (drift guard) are all delivered and every automated gate is green. **One blocking item remains before the phase can be marked verified: D-118/D-119's cold-session human check**, which must be run by a human in a fresh Claude Code session per `skill/VERIFY.md` Procedure 1 (see above). This is the phase's last open item and the milestone's second (and final) human gate.

---
*Phase: 08-the-sigil-skill*
*Completed: 2026-08-09*
