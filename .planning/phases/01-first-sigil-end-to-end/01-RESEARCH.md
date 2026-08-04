# Phase 1: First Sigil, End to End - Research

**Researched:** 2026-08-04
**Domain:** Deterministic text→geometry→SVG pipeline (traditional Western kamea sigil construction) + Node CLI/library packaging
**Confidence:** MEDIUM — pipeline architecture, tooling, and text-processing correctness are HIGH; the canonical kamea grid *values* are MEDIUM (internally magic-square-valid and cross-checked across two independent web sources, but not yet checked against the phase's own specified primary sources — see Assumptions Log A1 and the D-04 human checkpoint gate)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Kamea source & verification**
- **D-01:** Primary source: Agrippa, *Three Books of Occult Philosophy*, Donald Tyson ed. (Llewellyn). Independent cross-check: Skinner, *The Complete Magician's Tables*. These two citations go in the data module header and README. — Reversibility: one-way — determinism is a published contract; changing grid data after sigils are embedded on live sites changes output for identical inputs and would require the v2 kamea-set-version escape hatch (PKG-02).
- **D-02:** Data layer is kamea-set-aware from day one: grids keyed by set name, default `agrippa`; the JSON working names the set that produced the sigil. Only the `agrippa` set ships in Phase 1. Skinner and Golden Dawn sets are deferred — each lands only after its own full seven-grid verification. — Reversibility: costly — the set key threads through the data API, working schema, and options surface.
- **D-03:** Verification scope: all seven grids, cell-by-cell, against BOTH sources — deliberately exceeding the roadmap's Saturn-only cross-check minimum. Programmatic magic-sum checks are a supplement, never the source of truth (generation-as-verification only, per pitfalls research).
- **D-04:** Lock ritual: Claude verifies, Matt signs off. Research pulls both sources, builds all seven grids, presents them side-by-side with citations; Matt eyeballs and blesses before the data module is committed. This is a human checkpoint gate in the plan — the canonical data does not commit without it.

**Sigil anatomy & markers**
- **D-05:** Start marker: small circle at the first cell (`sigil-start`). End marker: short perpendicular bar/crossbar at the last cell (`sigil-end`). Each is its own element with a semantic class — plain shapes, not SVG `<marker>` defs (also keeps Phase 1 id-free, sidestepping REND-06 collisions until Phase 3).
- **D-06:** A `circle.sigil-node` is emitted at every visited cell, hidden by default via its custom-property default, revealable with one CSS rule — same posture as the Phase 3 grid layer.
- **D-07:** Fixed `viewBox="0 0 100 100"` for all planets; cell size = 100/order. All seven planets render at consistent scale side-by-side and CSS sizing behaves identically per planet. Renderer may apply a small internal inset in the cell-center math so edge-cell markers don't clip — implementation detail, not a config surface.
- **D-08:** Class taxonomy: BEM-ish with planet modifier. Root `<svg class="sigil sigil--saturn">`; children `sigil-path`, `sigil-node`, `sigil-start`, `sigil-end` (Phase 3 adds `sigil-grid`, `sigil-glyph`). Per-planet theming is one selector (`.sigil--mars { --sigil-stroke: … }`). — Reversibility: costly — class names are the public CSS contract embedding sites write against.

**CLI surface**
- **D-09:** Statement comes in as a positional argument; a statement of `-` reads stdin (pipeline composition). Bin name: `sigil-spinner`.
- **D-10:** stdout carries raw SVG by default; `--json` swaps stdout to the JSON working. One artifact per stream — no envelopes on the default path. `--output <file>` writes the selected artifact to a file (INT-02).
- **D-11:** Getting both artifacts from the CLI = two invocations (once plain, once `--json`); determinism guarantees they describe the same sigil. No dual-file CLI surface in v1. (The library returns both from one call regardless.)
- **D-12:** `--planet` is required with no default — choosing the planet is part of the working, not a fallback. Case-insensitive match against the seven; unknown planet → stderr error listing valid names + nonzero exit. All diagnostics to stderr; stdout is reserved strictly for the artifact.

**Library API & JSON working**
- **D-13:** `generateSigil(statement, planet, options)` returns a plain eager object `{ svg, working }` — SVG string plus working object from one call, plain JSON-able data, no methods. (Internally the PathModel remains the renderer-agnostic seam per PATH-03/ARCHITECTURE.md; the eager return is the public face.)
- **D-14:** The working is the full trail + letter map: statement, letters kept AND struck, per-letter letter→number pairs, number sequence, planet, kamea set, grid size, cells as row/col AND viewBox x/y, path segments. A teaching page can narrate the entire derivation from the working alone. — Reversibility: costly — the working schema is a consumed data contract; removing fields later breaks consumers.
- **D-15:** Error contract: throw a `SigilError` subclass with a stable `.code` (`E_UNKNOWN_PLANET`, `E_EMPTY_SEQUENCE`, …) plus human message. CLI maps code→exit status + stderr. Consumers branch on `.code`, never message text. Phase 2's INT-04 (identical CLI/library errors) builds on this shape.
- **D-16:** The intention statement is omitted from the SVG by default — no `<title>`/`<desc>`/data attributes carrying it unless the caller opts in (e.g. `{ title: true }`), honoring the release-the-intention posture of classic sigil practice. When opted in, the statement is XML-escaped. The working always carries the statement (documented as untrusted input consumers must HTML-escape).

### Claude's Discretion
- Exact `--sigil-*` custom-property names and their defaults (full surface is Phase 3's REND-05; Phase 1 just must never hardcode presentation values or emit `style=""`).
- Exact JSON working field names and nesting — honor D-14's content list; shape is planner/executor's call.
- Internal module layout — follow `.planning/research/ARCHITECTURE.md`'s structure unless something better emerges.
- Precise marker geometry (circle radius, bar length/angle) within the fixed 100×100 viewBox.

### Deferred Ideas (OUT OF SCOPE)
- Skinner and Golden Dawn kamea sets as switchable named sets — architecture supports them from day one (D-02); each ships only after full seven-grid verification against its own source. Future phase / backlog.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CONS-01 | Strike vowels and repeating letters, keep first occurrence, preserve order | Worked example below (`I WILL SUCCEED`); `text/normalize.js` design in Architecture Patterns; letter-struck-reason tagging design supports D-14's "kept AND struck" requirement |
| CONS-02 | Encode remaining letters via Pythagorean Number Table, cycling formula | Full A–Z table computed and verified in-session against the cycling formula; Chaldean-rejection test vectors verified (A=1,I=9,J=1,R=9,S=1,Z=8) |
| KAMEA-01 | All seven kameas hard-coded as literal arrays from a single cited canonical source | All seven candidate grids gathered below with citations; magic-sum verified in-session; flagged pending D-04 human sign-off against the actual D-01 primary sources |
| KAMEA-03 | Kamea layouts verified against an independent source before lock | Two-source cross-check performed for Saturn/Jupiter rows via web search; full magic-sum arithmetic verification performed for all seven; Skinner cross-check explicitly NOT achievable via web tooling (physical book) — routed to D-04 gate |
| PATH-01 | Ordered path with start marker at first cell, end marker at last | PathModel pattern (ARCHITECTURE.md Pattern 2) + coordinate-transform code example; worked example traces a 5-point path |
| PATH-03 | PathModel is renderer-agnostic, consumed identically by SVG and JSON | Anti-Pattern 1 (no SVG in path builder) reinforced; PathModel shape example included |
| REND-01 | Self-contained, viewBox-based inline SVG with semantic CSS classes | Coordinate transform + escapeXml code examples; Pitfall 8 (no inline `style=`) and Pitfall 10 (shared transform function) called out |
| OUT-01 | JSON "working" alongside SVG, consistent with the rendered sigil | D-14 field list mapped to a candidate working schema in Code Examples |
| INT-01 | Importable ESM library exposing `generateSigil(statement, planet, options)` | Architecture pipeline + orchestrator pattern from ARCHITECTURE.md; package.json `exports`/`type: module` guidance |
| INT-02 | Invocable as CLI: statement + planet + flags → SVG/JSON to stdout/file, thin wrapper | `node:util.parseArgs` API confirmed against official docs; stdin-via-`-` pattern (`fs.readFileSync(0)`) confirmed; stdout/stderr discipline from Pitfalls Integration Gotchas |
</phase_requirements>

## Summary

Phase 1 is architecturally low-risk and correctness-critical in exactly one place: the seven kamea grids. Everything else — text normalization, the Pythagorean cycling table, the pipe-and-filter pipeline, the renderer-agnostic PathModel, `node:util.parseArgs`-based CLI, hand-rolled SVG templating — is a well-understood, already-researched shape (see `.planning/research/ARCHITECTURE.md`, `PITFALLS.md`, `STACK.md`, all dated today and treated as ground truth for this phase). No new architectural research was needed there; this document adds only what's specific to *planning* Phase 1: concrete kamea grid candidates, a worked derivation example, exact API shapes for the built-in tools the plan will lean on, and the security/package-legitimacy passes this phase's protocol requires.

The one genuinely open question this research could not close from a coding agent's tool access: the phase's own locked decision (D-01) specifies Tyson/Llewellyn's Agrippa edition and Skinner's *Complete Magician's Tables* as the two sources for the kamea lock — both are physical/scanned books, not available to web search or fetch tools. What this research *could* do: locate a full seven-grid candidate set from web sources, verify every grid's internal magic-square correctness by hand (rows/columns/diagonals sum to the correct constant for all seven — this rules out transcription typos but NOT wrong orientation, per Pitfall 1's 8-dihedral-variant warning), and cross-check the Saturn and Jupiter grids against a second independent web source. This candidate set is exactly the input the plan's D-04 human checkpoint gate needs — it does not substitute for that gate.

**Primary recommendation:** Build the pipeline and renderer against the candidate kamea data below, structured so the D-04 checkpoint task is "confirm/correct these specific cell values against your physical Tyson/Llewellyn and Skinner copies" rather than "find the data from scratch." Everything downstream (path tracing, SVG, JSON working, CLI) is safe to build in parallel with that gate since it's agnostic to which specific orientation wins — only `data/kamea.js`'s literal values change if Matt corrects them.

## Architectural Responsibility Map

This project has no web-application tiers (no browser, no server rendering, no CDN, no database) — it is a pure local computation library plus a thin CLI wrapper (confirmed: `.planning/research/ARCHITECTURE.md` "Integration Points — External Services: None"). The table below substitutes the project's own layer taxonomy (from `ARCHITECTURE.md`'s Component Responsibilities) for the standard web-tier table, serving the same purpose: catching capability/layer misassignment before planning.

| Capability | Primary Layer | Secondary Layer | Rationale |
|------------|---------------|------------------|-----------|
| Strike vowels/repeats (CONS-01) | `text/normalize.js` | — | Planet-agnostic; must not import from `data/kamea.js` (ARCHITECTURE.md boundary) |
| Pythagorean letter→number encoding (CONS-02) | `data/pythagorean.js` | — | Static lookup + one pure function; no knowledge of planets |
| Kamea grid ownership + cell lookup (KAMEA-01, KAMEA-03) | `data/kamea.js` | — | Single source of truth; every other module calls `cellForNumber`/`gridSize`, never inlines a grid (Pitfall 1, Anti-Pattern 2) |
| Path/PathModel construction (PATH-01, PATH-03) | `path/buildPath.js` | `data/kamea.js` (read-only) | The only module combining a number sequence with a planet; emits a plain object, never SVG (Anti-Pattern 1) |
| SVG string rendering (REND-01) | `render/svg.js` (+ `render/svg/*` sub-layers) | `path/` output (read-only) | Consumes PathModel only; owns the coordinate-transform function and all XML escaping |
| JSON working serialization (OUT-01) | `render/json.js` | `generate.js` (orchestrator, source of intermediate values) | Thin serializer; computes nothing itself |
| Library public API (INT-01) | `src/index.js` / `generate.js` | — | Only file allowed to import across `data/`, `text/`, `path/` (ARCHITECTURE.md Internal Boundaries) |
| CLI wrapper (INT-02) | `bin/sigil-spinner.js` | `src/index.js` (calls only) | Zero domain logic; argv/stdin in, stdout/file out; validation lives in the library, not here (Anti-Pattern 3) |

## Standard Stack

This phase does not introduce any stack decisions beyond what `.planning/research/STACK.md` already locked (and `.claude/CLAUDE.md` mirrors as project constraints). Versions re-verified against the npm registry this session — all current as of 2026-08-04:

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|---------------|
| Node.js | `>=20.0.0` (dev/test on 22 & 24; local env confirmed running `v24.4.1`) | Runtime | `node:util.parseArgs` stable since Node 20; matches STACK.md's floor |
| `node:util.parseArgs` (built-in) | ships with Node | CLI argument parsing for `--planet`, `--curve`, `--grid`, `--json`, `--output`, and the positional statement | Zero dependency, stable since Node 20 [VERIFIED: nodejs.org/api/util.html — fetched this session] |
| Hand-rolled SVG string templating | n/a | `render/svg.js` and sub-layers | No DOM dependency needed for server-side SVG generation; confirmed the standard approach, not a workaround [CITED: STACK.md, cross-referenced this session] |

### Supporting (dev-only, needed to stand up the repo in Phase 1)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `vitest` | `4.1.10` [VERIFIED: npm registry, `npm view vitest version`] | Snapshot tests for deterministic SVG/JSON output | From the first test file — this phase's success criteria depend on snapshot-testable output |
| `typescript` | `7.0.2` [VERIFIED: npm registry] | `tsc --allowJs --checkJs --noEmit` type-checking over JSDoc-annotated `.js` | Set up early so `PathModel`/`SigilResult` shapes get JSDoc `@typedef`s from the start |
| `@types/node` | `26.1.2` [VERIFIED: npm registry — **not previously listed in STACK.md**, added by this research] | Types for `node:util`, `node:fs`, `process` under `tsc --checkJs` | Needed the moment `bin/sigil-spinner.js` or `data/*.js` reference `process.argv`/`process.stdout`/`fs.readFileSync` — without it, `--checkJs` either errors or silently loses type coverage on every Node built-in call |
| `eslint` | `10.8.0` [VERIFIED: npm registry] | Lint hygiene | Standard; not load-bearing for correctness |
| `prettier` | `3.9.6` [VERIFIED: npm registry] | Source formatting (never applied to generated SVG output, per STACK.md's explicit warning) | Standard |

### Alternatives Considered

No new alternatives beyond what STACK.md already evaluated (`d3-path`/`d3-shape` as a curve fallback — Phase 3 concern; `commander` — only if the CLI grows a second verb). Not re-litigated here.

**Installation:**
```bash
npm init -y
npm pkg set type=module
npm pkg set bin.sigil-spinner=./bin/sigil-spinner.js
npm pkg set engines.node=">=20.0.0"
npm install --save-dev vitest@4.1.10 typescript@7.0.2 @types/node@26.1.2 eslint@10.8.0 prettier@3.9.6
```

## Package Legitimacy Audit

All five packages below are pre-existing STACK.md recommendations (except `@types/node`, added this session) being installed for the first time in this greenfield repo, so the gate applies.

| Package | Registry | Weekly Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-------------------|--------------|---------|-------------|
| `vitest` | npm | 88,317,116 | github.com/vitest-dev/vitest | SUS (`too-new`) | Approved — see note |
| `typescript` | npm | 260,894,933 | github.com/microsoft/TypeScript | SUS (`too-new`) | Approved — see note |
| `eslint` | npm | 155,152,751 | github.com/eslint/eslint | SUS (`too-new`) | Approved — see note |
| `prettier` | npm | 128,407,153 | github.com/prettier/prettier | SUS (`too-new`) | Approved — see note |
| `@types/node` | npm | 410,358,132 | github.com/DefinitelyTyped/DefinitelyTyped | SUS (`too-new`) | Approved — see note |

**Note on the `too-new` verdict:** The legitimacy seam (`gsd-tools query package-legitimacy check`) flagged all five as `SUS` solely because each package's *latest version* was published within the last ~30 days (routine release cadence for actively maintained tooling) — not because of low downloads, a missing repo, a `postinstall` script, or any other slopsquat signal. All five have hundred-million-plus weekly download counts, long-lived canonical GitHub repos, no `postinstall` scripts, and are not deprecated. This reads as a false positive on a heuristic tuned for genuinely new/unproven packages, not a legitimacy concern for tools this established. **Per protocol, the SUS verdict is preserved here rather than silently upgraded to OK** — the planner should add a lightweight `checkpoint:human-verify` step before the `npm install` task (a single consolidated confirmation covering all five is reasonable given they're identical false-positive cases, rather than five separate checkpoints).

**Packages removed due to SLOP verdict:** none.
**Packages flagged as suspicious (SUS):** `vitest`, `typescript`, `eslint`, `prettier`, `@types/node` — all judged false-positive per the note above; planner still gates per protocol.

## Architecture Patterns

Full architecture research (system diagram, module layout, four core patterns, four anti-patterns, internal boundary rules) already exists at `.planning/research/ARCHITECTURE.md` and is treated as locked ground truth for this phase — it is not reproduced in full here. The excerpts below are the pieces most load-bearing for Phase 1 planning specifically.

### System Architecture Diagram (Phase 1 scope only)

```
statement (CLI positional or stdin via "-")
        │
        ▼
┌───────────────────┐
│ text/normalize.js │  strike vowels, strike repeats (keep first occurrence)
└─────────┬──────────┘
          │ lettersKept[] (+ struck letters, tagged with reason)
          ▼
┌────────────────────────┐
│ data/pythagorean.js     │  cycling-formula lookup, per kept letter
└─────────┬────────────────┘
          │ numbers[] (1-9)
          ▼
┌────────────────────────┐      ┌──────────────────────────┐
│ data/kamea.js            │◀────│ generate.js (orchestrator)│
│ cellForNumber(planet, n) │      │ planet = "saturn" (v1)    │
│ gridSize(planet)         │      └──────────────────────────┘
└─────────┬────────────────┘
          │ cells[] {row, col}
          ▼
┌────────────────────┐
│ path/buildPath.js    │  numbers + cells + planet → PathModel
└─────────┬─────────────┘  (points, start idx, end idx, gridSize — NO svg/strings)
          │ PathModel (plain object)
          ├─────────────────────────────┐
          ▼                             ▼
┌────────────────────┐        ┌──────────────────────┐
│ render/svg.js         │        │ render/json.js          │
│ + coordinate transform│        │ (thin serializer over   │
│ + escapeXml           │        │  everything generate.js │
│ (start circle, end bar,│        │  already retained)      │
│  hidden .sigil-node)  │        └───────────┬────────────┘
└─────────┬─────────────┘                    │
          ▼                                  ▼
     SVG string                        JSON working
          └───────────────┬──────────────────┘
                           ▼
              { svg, working }  ◀── generateSigil() return (D-13)
                           │
              ┌────────────┴─────────────┐
              ▼                          ▼
     src/index.js (library)      bin/sigil-spinner.js (CLI)
     exports generateSigil        argv/stdin → call → stdout/file
                                  (Anti-Pattern 3: zero domain logic here)
```

### Recommended Project Structure (from ARCHITECTURE.md, Phase 1 subset)

```
src/
├── data/
│   ├── kamea.js          # 7 canonical squares (agrippa set) + cellForNumber()/gridSize()
│   └── pythagorean.js    # cycling-formula-derived letter → 1-9 table + lookup fn
├── text/
│   └── normalize.js      # strike vowels + duplicates, preserve order, tag struck reason
├── path/
│   └── buildPath.js      # numbers + planet → PathModel (pure geometry, no SVG)
├── render/
│   ├── svg.js            # PathModel + options → SVG string (path, start/end, hidden nodes)
│   ├── coords.js         # single shared (row,col) → (x,y) transform (Pitfall 10)
│   ├── escapeXml.js      # 5-entity XML escape, used only when { title: true }
│   └── json.js           # pipeline result → "working" JSON
├── errors.js              # SigilError + code taxonomy (D-15)
├── generate.js             # orchestrator: generateSigil(statement, planet, opts)
└── index.js                 # public library entry (re-exports generateSigil)
bin/
└── sigil-spinner.js         # thin CLI: argv/stdin → src/index.js → stdout/file
test/
├── data/                    # exact-match tests against candidate kamea grids
├── text/
├── path/
└── render/
README.md                    # cites D-01 sources; documents determinism + Y/statement-omission posture
```

### Pattern: Pipe-and-Filter Pipeline + Renderer-Agnostic PathModel

Already fully documented in `ARCHITECTURE.md` Patterns 1–2. The one Phase-1-specific addition: because only Saturn renders in this phase but all seven grids must exist and be tested (KAMEA-01/03), `data/kamea.js` should be planet-parametric from day one — `cellForNumber('saturn', 5)` — even though `generate.js`'s v1 default/only-exercised value is `'saturn'`. This avoids a Phase 2 rewrite of `data/kamea.js` when KAMEA-02 (any-planet selection) lands; Phase 2 only needs to widen the CLI/library's accepted `planet` values, not touch the data layer.

### Anti-Patterns to Avoid (Phase 1 relevant subset — full list in ARCHITECTURE.md)

- **Building SVG inside `path/buildPath.js`:** breaks OUT-01's JSON-working guarantee and makes curve-vs-straight (Phase 3) a second code path. `buildPath()` returns the plain PathModel only.
- **Kamea literals outside `data/kamea.js`:** even a "just for Saturn, just for now" inline grid in the renderer creates a second source of truth for the highest-risk data in the project.
- **CLI-only planet validation:** `--planet`'s case-insensitive matching/error message (D-12) must be enforced in the library (`generate.js` or `data/kamea.js`), not just in `bin/sigil-spinner.js`'s argument parsing — INT-01 requires the library to give identical guarantees to programmatic callers.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|--------------|-----|
| Magic square generation for orders 4–9 | A parametric `generateMagicSquare(order)` function feeding rendering | Literal hard-coded arrays per planet (candidate set below) | 880+ distinct valid 4×4 squares alone exist; a generated square is *a* valid magic square, not necessarily Agrippa's — this is Pitfall 2, explicitly "core algorithm/data phase" scoped |
| CLI argument parsing | Manual `process.argv.slice(2)` loop, or a hand-rolled flag parser | `node:util.parseArgs` (built-in, stable since Node 20) [VERIFIED: nodejs.org/api/util.html] | Zero dependency, handles `--planet`/`--curve`/`--json`/`--output` plus the positional statement with `allowPositionals: true` out of the box |
| Pythagorean letter table | Copy-pasting a 26-entry table off a numerology webpage | Derive from `((charCode - 65) % 9) + 1` | Structurally immune to Chaldean/legacy I-J-U-V contamination (Pitfalls 3–4) — this is a "derive, never transcribe" rule, not a library-vs-hand-roll choice |
| Coordinate transform (row/col → viewBox x/y) | Inline arithmetic duplicated in the path renderer, grid renderer, and marker renderer | One shared, tested `cellCenter(row, col, order)` function in `render/coords.js` | Duplicated coordinate math is exactly how the three renderers silently drift apart (Pitfall 10) |

**Key insight:** In this domain, "don't hand-roll" mostly means "don't hand-*derive*-from-a-source-that-isn't-the-locked-source" (kamea grids, numerology table) rather than "use a library instead of writing code" — the actual computation (a lookup, a formula, a coordinate transform) is trivial and *should* be hand-written; what must never be hand-rolled is the underlying *data provenance*.

## Common Pitfalls

Full pitfalls research (12 pitfalls, all cross-referenced to a prevention phase) exists at `.planning/research/PITFALLS.md` and is authoritative. The subset directly gating Phase 1's success criteria:

### Pitfall: Kamea Orientation Ambiguity (Pitfall 1 in PITFALLS.md)
**What goes wrong:** All 8 dihedral variants of a magic square are equally "correct" mathematically but place digits in different cells — silently producing a traditionally-wrong sigil that looks fine.
**How this phase avoids it:** The candidate grid set below was checked for internal magic-square correctness (necessary) and cross-checked against a second web source for Saturn/Jupiter (partial), but the D-04 human checkpoint gate — Matt confirming against the physical Tyson/Llewellyn and Skinner sources — is the actual prevention mechanism, not this research pass. **The plan must not skip or soften this gate.**

### Pitfall: Algorithmic Magic Square Generation (Pitfall 2)
**How this phase avoids it:** `data/kamea.js` ships literal arrays only; any generation code exists solely as a test-time magic-sum assertion, never as the source of the shipped values.

### Pitfall: Chaldean/Pythagorean Table Conflation + Legacy I/J-U/V Contamination (Pitfalls 3–4)
**How this phase avoids it:** The table is derived from the cycling formula, never transcribed. Verify with the exact test vectors below (computed and checked in-session).

### Pitfall: CSS-Styleability Killed by Inline `style=` or Hardcoded Presentation Values (Pitfall 8)
**How this phase avoids it:** Even though Phase 1 doesn't build the full `--sigil-*` custom-property surface (that's REND-05/Phase 3), it must not emit `style=""` anywhere, and any paint-relevant attribute (`stroke`, `fill`) should already use `var(--sigil-x, <default>)` rather than a bare literal — this is cheaper to do correctly from the first line of `render/svg.js` than to retrofit in Phase 3.

### Pitfall: Coordinate-Scaling Inconsistency Across Kamea Sizes (Pitfall 10)
**How this phase avoids it:** D-07 already locks the fixed 100×100 viewBox + `100/order` cell size. This phase's job is to implement that as exactly one shared, tested transform function (see Code Examples) — not duplicate the arithmetic between the path renderer and the (future, Phase 3) grid renderer.

**Explicitly Phase 2/3 scoped, not this phase's problem (do not over-build):** Pitfall 5 (degenerate empty/single-node input — CONS-03 is Phase 2), Pitfall 6 (accented letters/Y-handling — CONS-04 is Phase 2), Pitfall 7 (cross-letter repeat-number collisions — PATH-02 is Phase 2), Pitfall 9 (ID collisions — REND-06 is Phase 3, and D-05 deliberately keeps Phase 1 id-free specifically to sidestep this).

### One Phase-1-relevant gap PITFALLS.md doesn't explicitly cover: minimal degenerate-input safety net

CONS-03 (full degenerate-input contract: clear errors, single-node rendering) is explicitly Phase 2 scope. But Phase 1's own test statement, `data/kamea.js`, and `path/buildPath.js` will still run during Phase 1 development and testing — an empty or single-letter number sequence must not *crash* the pipeline even though a polished error contract isn't required yet. Recommend: `buildPath()` should not throw on a 0- or 1-length number sequence in Phase 1 (a 1-length sequence should just produce a single-point PathModel with `start === end`); a fully *empty* sequence can throw a bare `SigilError('E_EMPTY_SEQUENCE', ...)` now (the code already appears in D-15's example) even though CONS-03's full UX polish (distinct guidance message, etc.) is Phase 2's job. This avoids Phase 1 painting itself into an un-guarded corner that Phase 2 then has to retrofit around.

## Code Examples

All computed and verified directly in this research session (not copied from a source) unless otherwise cited.

### Pythagorean cycling table [VERIFIED: computed in-session from the cycling formula]
```js
// data/pythagorean.js
export function toPythagoreanDigit(letter) {
  const code = letter.toUpperCase().charCodeAt(0);
  if (code < 65 || code > 90) {
    throw new Error(`toPythagoreanDigit: not an A-Z letter: ${letter}`);
  }
  return ((code - 65) % 9) + 1;
}
```
Full A–Z table (computed and hand-verified this session):
`A1 B2 C3 D4 E5 F6 G7 H8 I9 J1 K2 L3 M4 N5 O6 P7 Q8 R9 S1 T2 U3 V4 W5 X6 Y7 Z8`

Chaldean-rejection test vectors (from PITFALLS.md Pitfall 3, re-verified against the formula this session):
```js
// test/data/pythagorean.test.js
test.each([
  ['A', 1], ['I', 9], ['J', 1], ['R', 9], ['S', 1], ['Z', 8],
])('toPythagoreanDigit(%s) === %i (not Chaldean)', (letter, expected) => {
  expect(toPythagoreanDigit(letter)).toBe(expected);
});
// I !== J (9 vs 1) and U !== V (3 vs 4) fall out of this automatically —
// a Chaldean or legacy merged-table would fail these.
```

### Candidate Saturn kamea (3×3) — pending D-04 sign-off
[CITED: furtherlight.blogspot.com "Agrippa's Magic Squares - Part 2" — secondary blog, no specific edition cited; cross-checked against a second independent web source for the same row values; magic-sum verified in-session]
```js
// data/kamea.js — set: 'agrippa'
// Saturn (3x3), magic constant 15. Source: candidate — see Assumptions Log A1.
// Row-major, top row first, left to right.
saturn: [
  [4, 9, 2],
  [3, 5, 7],
  [8, 1, 6],
],
```
Verified in-session: every row, column, and both diagonals sum to 15 (Saturn's magic constant per PITFALLS.md sources).

### All seven candidate grids (KAMEA-01) — pending D-04 sign-off
[CITED: furtherlight.blogspot.com "Agrippa's Magic Squares - Part 2"; magic-sum verified in-session for every grid below — every row, column, and both diagonals sum to the listed constant]

| Planet | Order | Magic constant | Top row → bottom row (row-major) |
|--------|-------|-----------------|-------------------------------------|
| Saturn | 3 | 15 | `4,9,2` / `3,5,7` / `8,1,6` |
| Jupiter | 4 | 34 | `4,14,15,1` / `9,7,6,12` / `5,11,10,8` / `16,2,3,13` |
| Mars | 5 | 65 | `11,24,7,20,3` / `4,12,25,8,16` / `17,5,13,21,9` / `10,18,1,14,22` / `23,6,19,2,15` |
| Sun | 6 | 111 | `6,32,3,34,35,1` / `7,11,27,28,8,30` / `19,14,16,15,23,24` / `18,20,22,21,17,13` / `25,29,10,9,26,12` / `36,5,33,4,2,31` |
| Venus | 7 | 175 | `22,47,16,41,10,35,4` / `5,23,48,17,42,11,29` / `30,6,24,49,18,36,12` / `13,31,7,25,43,19,37` / `38,14,32,1,26,44,20` / `21,39,8,33,2,27,45` / `46,15,40,9,34,3,28` |
| Mercury | 8 | 260 | `8,58,59,5,4,62,63,1` / `49,15,14,52,53,11,10,56` / `41,23,22,44,45,19,18,48` / `32,34,35,29,28,38,39,25` / `40,26,27,37,36,30,31,33` / `17,47,46,20,21,43,42,24` / `9,55,54,12,13,51,50,16` / `64,2,3,61,60,6,7,57` |
| Moon | 9 | 369 | `37,78,29,70,21,62,13,54,5` / `6,38,79,30,71,22,63,14,46` / `47,7,39,80,31,72,23,55,15` / `16,48,8,40,81,32,64,24,56` / `57,17,49,9,41,73,33,65,25` / `26,58,18,50,1,42,74,34,66` / `67,27,59,10,51,2,43,75,35` / `36,68,19,60,11,52,3,44,76` / `77,28,69,20,61,12,53,4,45` |

**Jupiter's top row (`4,14,15,1`) and Saturn's full grid were independently corroborated by a second web source** (mysticsymbolism.com search snippet and the-magic-square.blogspot.com respectively) beyond the primary furtherlight.blogspot.com source. Mars/Sun/Venus/Mercury/Moon have magic-sum verification but only the single furtherlight source — flag these six for extra scrutiny at the D-04 gate.

### Worked example (CONS-01 → CONS-02 → PATH-01), matches success criterion 4
[VERIFIED: computed in-session from the cycling formula + the candidate Saturn grid above]

Statement: `"I WILL SUCCEED"`

1. **Strike vowels (A,E,I,O,U):** `I`(vowel), `W`, `I`(vowel), `L`, `L`, `S`, `U`(vowel), `C`, `C`, `E`(vowel), `E`(vowel), `D` → consonants in order: `W, L, L, S, C, C, D`
2. **Strike repeats, keep first occurrence:** `W, L, S, C, D` (second `L` and second `C` struck as repeats)
3. **Letters kept:** `W L S C D`
4. **Pythagorean digits** (from the table above): `W=5, L=3, S=1, C=3, D=4`
5. **Number sequence:** `5, 3, 1, 3, 4`
6. **Cell lookup on the candidate Saturn grid** (`cellForNumber('saturn', n)`, 0-indexed row/col):
   `5→(1,1)`, `3→(1,0)`, `1→(2,1)`, `3→(1,0)`, `4→(0,0)`
7. **Path:** `(1,1) → (1,0) → (2,1) → (1,0) → (0,0)` — start = `(1,1)` [circle marker], end = `(0,0)` [bar marker]. Note cell `(1,0)` is revisited but *not* consecutively, so no loop/notch marker fires — correctly out of scope for Phase 1 (PATH-02 is Phase 2).

This statement, its intermediate values, and its resulting path are a strong candidate for the phase's first snapshot-test fixture.

### Coordinate transform (Pitfall 10 — one shared function)
```js
// render/coords.js
export function cellCenter(row, col, order, { inset = 0.15 } = {}) {
  const cellSize = 100 / order;
  const insetAmount = cellSize * inset;
  return {
    x: col * cellSize + cellSize / 2,
    y: row * cellSize + cellSize / 2,
    // insetAmount available to callers that need to keep edge-cell
    // marker geometry (e.g. the start circle's radius) from clipping
    // the 0/100 viewBox boundary — D-07's "renderer may apply a small
    // internal inset," left as an implementation detail here.
  };
}
```
Applied to the worked example above (Saturn, order 3, cellSize ≈ 33.33): `(1,1)→(50,50)`, `(1,0)→(16.67,50)`, `(2,1)→(50,83.33)`, `(0,0)→(16.67,16.67)`.

### XML escaping (used only when `{ title: true }` per D-16)
[CITED: general Node.js/XML guidance — 5-entity escape is the standard minimal transform]
```js
// render/escapeXml.js
const XML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' };
export function escapeXml(str) {
  return str.replace(/[&<>"']/g, (ch) => XML_ESCAPES[ch]);
}
```
No runtime dependency added (consistent with the project's zero-dependency embed constraint) — this is a solved, five-character-mapping problem, not a parsing problem.

### `node:util.parseArgs` + stdin-via-`-` (D-09, D-12) [VERIFIED: nodejs.org/api/util.html, fetched this session]
```js
// bin/sigil-spinner.js
#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { readFileSync } from 'node:fs';
import { generateSigil } from '../src/index.js';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    planet: { type: 'string' },   // required — validated in the library, not here (Anti-Pattern 3)
    json: { type: 'boolean', default: false },
    output: { type: 'string' },
  },
});

const rawStatement = positionals[0];
const statement = rawStatement === '-'
  ? readFileSync(0, 'utf-8')   // fd 0 = stdin, synchronous read
  : rawStatement;

try {
  const { svg, working } = generateSigil(statement, values.planet, values);
  process.stdout.write(values.json ? JSON.stringify(working, null, 2) : svg);
} catch (err) {
  process.stderr.write(`${err.code ?? 'E_UNKNOWN'}: ${err.message}\n`);
  process.exit(1);
}
```
Note: all diagnostics go to `process.stderr`; `process.stdout` carries only the requested artifact — this is the Integration Gotcha from PITFALLS.md ("Keep stdout reserved strictly for the requested artifact").

### `SigilError` taxonomy (D-15)
```js
// errors.js
export class SigilError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'SigilError';
    this.code = code;
  }
}
// Phase 1 minimum: E_UNKNOWN_PLANET (D-12). E_EMPTY_SEQUENCE exists as a
// guard rail now (see Common Pitfalls, "minimal degenerate-input safety
// net") but its full user-facing contract is CONS-03 / Phase 2.
```

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|-----------------|
| A1 | The seven candidate kamea grids (sourced from furtherlight.blogspot.com, magic-sum verified, partially cross-checked) match the orientation in Tyson/Llewellyn's Agrippa edition and Skinner's *Complete Magician's Tables* (D-01's actual specified sources) | Standard Stack candidate grids table | HIGH — per D-01, wrong orientation is a one-way mistake once sigils are live (Pitfall 1); this is exactly why D-04's human checkpoint gate exists and must not be skipped or treated as a formality |
| A2 | `@types/node` is needed as a dev dependency for accurate `tsc --checkJs` coverage of Node built-ins used in `bin/sigil-spinner.js` (not listed in the original STACK.md research) | Standard Stack / Supporting | LOW — worst case, `--checkJs` silently loses type coverage on `process`/`fs` calls; easy to add later, no data-correctness impact |
| A3 | A hand-rolled 5-entity `escapeXml()` is sufficient for D-16's XML-escaping requirement (vs. a dedicated `xml-escape` package) | Code Examples | LOW — the SVG-embedded text is a fixed, well-known 5-character escaping problem; a library adds a runtime dependency for no correctness gain here |
| A4 | The traditional repeat-marker convention description (small wave/bump, no back-tracing) is accurate — LOW confidence, single source | Common Pitfalls | LOW for Phase 1 (PATH-02/marker geometry is Phase 2 scope) — noted only as forward context, does not gate this phase's success criteria |

## Open Questions

1. **Does the candidate Saturn/Jupiter/Mars/Sun/Venus/Mercury/Moon grid set (furtherlight.blogspot.com, cross-checked) match Tyson/Llewellyn and Skinner exactly?**
   - What we know: internally magic-square-valid for all seven; Saturn and Jupiter's opening row independently corroborated by a second web source.
   - What's unclear: whether this specific dihedral orientation is the one printed in Tyson/Llewellyn's edition and in Skinner's tables — the two sources D-01 actually names.
   - Recommendation: present this exact candidate table to Matt as the D-04 checkpoint's starting point ("confirm or correct these cell values against your copies") rather than re-researching from zero at execution time.

2. **Exact JSON working field names/nesting** — explicitly left to the planner/executor per CONTEXT.md's Claude's Discretion. This research's Code Examples section models the content (statement, kept/struck letters with per-letter number, number sequence, planet, kamea set, grid size, cells with row/col + x/y, path segments) but does not lock field names.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|--------------|-----------|---------|----------|
| Node.js | Runtime, `node:util.parseArgs` | ✓ | v24.4.1 (local) | — |
| npm | Package install | ✓ | 11.4.2 (local) | — |
| git | Repo already initialized | ✓ | 2.50.1 | — |

No missing dependencies. No external services of any kind (confirmed: ARCHITECTURE.md "Integration Points — External Services: None").

## Security Domain

`security_enforcement` is enabled (`.planning/config.json`: `true`, ASVS level 1, block on `high`). This is a local, offline CLI/library with no network I/O, no auth, no persistence, no multi-user surface — most ASVS categories are structurally not applicable, which is itself worth stating explicitly rather than leaving blank.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|-----------------|---------|---------------------|
| V2 Authentication | No | No accounts, no network surface |
| V3 Session Management | No | No sessions |
| V4 Access Control | No | Single local user/process, no multi-tenant data |
| V5 Input Validation | Yes | `--planet` validated against the fixed 7-name enum with a clear stderr error (D-12); statement is treated as opaque text (no code execution, no path/command construction from it); XML-escape any statement text embedded in output (D-16, `escapeXml()` above) |
| V6 Cryptography | No | No secrets, no crypto operations in this phase |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|-------------------------|
| Markup/XML injection via unescaped statement text in `<title>`/`<desc>` (only reachable when `{ title: true }`, per D-16) | Tampering | `escapeXml()` applied to any raw statement text embedded in output; statement omitted from SVG entirely by default |
| stdout channel pollution (diagnostic/log text leaking into the SVG/JSON artifact stream a build pipeline pipes) | Tampering (of the downstream artifact) | stdout reserved strictly for the requested artifact; all diagnostics/errors to stderr with nonzero exit (PITFALLS.md Integration Gotchas; enforced in the `bin/sigil-spinner.js` example above) |
| Regex-based denial via a crafted/pathological statement string in text-normalization regexes | Denial of Service | Keep `normalize()`'s regexes to simple, non-nested character classes (e.g. `/[AEIOU]/gi`); avoid nested-quantifier patterns that risk catastrophic backtracking — low real-world risk given statements are short human-typed sentences, but cheap to guard against from the start |
| Downstream XSS if a consumer renders the JSON working's `statement` field directly into HTML | Information Disclosure / Tampering (of the consuming page) | Document in the JSON schema/README that `working.statement` is untrusted input the *consumer* must HTML-escape before display (PITFALLS.md Security Mistakes — already flagged there, restated here for the ASVS mapping) |

## Sources

### Primary (HIGH confidence)
- [Node.js `util.parseArgs()` official docs](https://nodejs.org/api/util.html) — fetched directly this session, config/return shape confirmed
- npm registry direct lookups (`npm view <pkg> version`) for `vitest`, `typescript`, `eslint`, `prettier`, `@types/node` — this session
- In-session computation: full A–Z Pythagorean cycling table, Chaldean-rejection test vectors, magic-sum verification of all seven candidate kamea grids (rows, columns, both diagonals), worked example derivation

### Secondary (MEDIUM confidence)
- [Further Light: Agrippa's Magic Squares - Part 2](http://furtherlight.blogspot.com/2009/11/agrippas-magic-squares-part-2.html) — source of all seven candidate kamea grids; secondary blog, no specific edition cited by the blog itself
- Web search cross-check corroborating Saturn's full grid and Jupiter's opening row from a second independent source
- Standard Node.js/XML escaping guidance (multiple consistent web sources on the 5-character XML entity set)

### Tertiary (LOW confidence)
- Traditional repeat-marker convention description (mysticryst.com and similar practice sites) — single-source, not cross-checked, and out of Phase 1's scope (PATH-02 is Phase 2) — included only as forward context
- Skinner's *Complete Magician's Tables* kamea content — could not be located via web search (physical/scanned book); explicitly routed to the D-04 human checkpoint gate rather than asserted

### Project research (in-repo, treated as ground truth)
- `.planning/research/ARCHITECTURE.md` — pipeline structure, module layout, patterns, anti-patterns
- `.planning/research/PITFALLS.md` — all 12 pitfalls, sourced and cross-referenced
- `.planning/research/STACK.md` — locked tech stack and versions

## Metadata

**Confidence breakdown:**
- Standard stack / tooling: HIGH — re-verified against npm registry and official Node docs this session, matches already-locked STACK.md
- Architecture: HIGH — fully researched in `.planning/research/ARCHITECTURE.md`, not re-litigated
- Kamea grid data (KAMEA-01/03): MEDIUM — internally magic-square-valid for all seven, partial independent cross-check, but not yet checked against D-01's own named primary sources; the D-04 human gate is load-bearing and must run
- Pitfalls: HIGH — fully researched in `.planning/research/PITFALLS.md`; this document's Common Pitfalls section only re-scopes which of the 12 apply to Phase 1 specifically
- Security: MEDIUM — ASVS mapping is straightforward given the tool's narrow local/offline surface, but this is domain reasoning applied to a well-understood shape, not a citable "CLI security checklist" for this exact stack

**Research date:** 2026-08-04
**Valid until:** Kamea grid data — valid until the D-04 checkpoint resolves it (should not be treated as stable beyond that gate). Tooling/versions — 30 days (fast-moving npm ecosystem, but STACK.md and this research already agree, so low actual drift risk for Phase 1's execution window).
