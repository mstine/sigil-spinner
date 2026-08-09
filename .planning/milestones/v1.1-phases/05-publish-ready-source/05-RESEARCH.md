# Phase 5: Publish-Ready Source - Research

**Researched:** 2026-08-08
**Domain:** In-repo correctness work on an already-shipped, zero-dependency Node CLI/library (kamea version metadata, CLI/library flag parity, SVG accessible-name wiring, stale doc-citation repair). No new external dependency, no new architectural surface.
**Confidence:** HIGH — every claim below is either read directly from this repo's own source/docs this session, or (for the ARIA pattern) cross-checked against two independent accessibility references.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

Only one of the four gray areas was discussed. **PKG-02's design is fully locked below.** INT-05, INT-06, and MAINT-01 carry no locked decisions from this discussion — research and planning own those calls, subject to the constraints in Code Context.

#### PKG-02 — Kamea version scheme and field shape

- **D-57: The kamea version value is the D-04 provenance date, `'2026-08-04'`** — not semver. Rationale: D-02 already establishes that a corrected kamea set becomes a *new key* in `KAMEA_SETS` rather than mutating `agrippa`, so this set's cells can never change and semver has no second version to express. What *can* change is the verification strength behind them (Mars, Sun, Venus, Mercury, and Moon rest on a single web source, magic-sum verified but not independently cross-checked — see `src/data/kamea.js:16-42`). A sign-off date names exactly that state: these cells, verified this much, as of this date. — **Reversibility:** one-way.

- **D-58: The version lands as a new sibling field immediately after `kameaSet`** — `kameaSet: 'agrippa', kameaVersion: '2026-08-04', gridSize: 3, …`. The working's key set goes 15 → 16, purely additive. Rejected: making `kameaSet` an object `{ name, version }`, and introducing a nested `kamea: { set, version }` block — both are breaking changes to a documented field that existing consumers read as a string. — **Reversibility:** one-way.

- **D-59: The JSON field is named `kameaVersion`** — chosen over `kameaSetVersion` (bureaucratic beside the other fifteen short field names) and over `kameaSetDate` (welds the field name to the current scheme). — **Reversibility:** one-way.

- **D-60: The constant is a sidecar map keyed by set name — `KAMEA_SET_VERSIONS = { agrippa: '2026-08-04' }` — living in `src/data/kamea.js` beside `DEFAULT_KAMEA_SET`.** Rationale: D-02 guarantees a second kamea set eventually exists, and the seam must survive that. Rejected: restructuring `KAMEA_SETS` entries into `{ version, grids }` (changes the shape every existing accessor indexes); a standalone `DEFAULT_KAMEA_VERSION` constant (single global version for a multi-set structure — silently wrong for a second set). — **Reversibility:** reversible — internal module shape.

- **D-61: A test asserts key parity between `KAMEA_SETS` and `KAMEA_SET_VERSIONS`** — `Object.keys()` of both must be identical sets. Rejected: a runtime throw in `resolveSet` (lands on a consumer, not the set-adder); doing both (makes the runtime case unreachable in practice, so pick one).

### Claude's Discretion

- **INT-05 (`--title` flag)** — flag shape (boolean parity with `options.title` vs. a string variant), whether `--no-title` is needed, how it threads into `working.render.title`. Constraint: the library owns validation (INT-04), and CLI/library output must stay byte-identical.
- **INT-06 (ARIA wiring)** — the `<title>` element's id derivation, whether `role="img"` is also emitted, and the rule for title-present-but-no-`idPrefix` (where D-44 keeps the artifact id-free by construction). This is the **only** requirement permitted to move the 46 SVG-shaped snapshots; any SVG snapshot movement must trace to it and be reviewed as such.
- **MAINT-01 (citation repair)** — repair strategy and scope. See Code Context: the problem is larger than the single line the requirement names.
- **Snapshot rebase sequencing** — the roadmap requires each rebase be a reviewed consequence of a named requirement, not incidental churn. How that is split across commits is a planning call.

### Deferred Ideas (OUT OF SCOPE)

- **`PACKAGE_VERSION` as a second in-source constant, and a CI assertion that it matches `package.json`'s `version`.** Recommended by Pitfall 10, but out of PKG-02's scope: success criterion 1 asks only that a working "names both the kamea set and its version." Revisit if Phase 6 wants published artifacts to name the emitting package version.
- **A mechanical citation drift check** — a test that fails when a `Pitfall N` or `D-NN` citation in `src/` no longer resolves. Structurally the same instrument as Phase 8's SKILL-03 drift check. Not deferred *out* of Phase 5 — it was simply not discussed. Planning may fold it into MAINT-01 if it is the cheapest way to satisfy success criterion 4 durably rather than once. **Research finding below strongly supports folding this in — see Common Pitfalls, "Citation rot is systemic, not incidental."**
- **The three v1.0 items deferred with written reopen conditions** (`E_CLI_STDIN` test coverage, the `perpendicularUnit` doc comment, the `D-12` ID collision) remain deferred. Note the `D-12` condition: it reopens if any of `src/errors.js:20`, `src/generate.js:163`, `src/generate.js:238`, or `bin/sigil-spinner.js:20` is edited for another reason — **INT-05 edits `bin/sigil-spinner.js`**, so planning should check whether line 20 is in the diff. [VERIFIED: bin/sigil-spinner.js:20 — read this session; line 20 is comment prose ("Diagnostics (D-12): every error/warning/usage message goes to"), and the `parseArgs` options block INT-05 must edit starts at line 116. A minimal `title: { type: 'boolean', default: false }` addition to that block does not require touching line 20, so the D-12 reopen condition is avoidable by construction — but the plan should still verify the final diff.]

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PKG-02 | JSON working carries the kamea set's version alongside `kameaSet`, from a static in-source constant | D-57–D-61 fully lock the design (see above). Research below verifies exact insertion points in `src/data/kamea.js`, `src/generate.js:277-293`, `src/render/json.js:78-107`, and both snapshot/test files, with line numbers and verbatim current content. |
| INT-05 | `--title` CLI flag exposing `options.title` | Research below establishes the codebase's own established boolean-flag convention (`--glyph`, `--curve` — simple presence flags, no negation) and confirms `node:util.parseArgs`'s `allowNegative` option is unavailable on this project's Node `>=20.0.0` floor (landed Node 22.4), which forecloses a `--no-title` variant without a floor bump. |
| INT-06 | `aria-labelledby` wiring when title + idPrefix both present | Research below cross-checks the `role="img"` + id'd `<title>` + `aria-labelledby` pattern against two independent accessibility sources, and maps it onto the exact two lines (`src/render/svg.js:636`, `:651`) and the `escapeXml` discipline already established for `idPrefix` (D-44). |
| MAINT-01 | Every decision/pitfall citation in shipped source resolves to a document that still says what it claims | Research below performed a full citation audit (not sampled) across every `.js` file in `src/` and `bin/`, verified against both the current and archived versions of every cited document. **Found 30 stale-or-ambiguous citation sites across 3 documents (PITFALLS.md, ARCHITECTURE.md, STACK.md) and 8 source files — roughly 3x the count CONTEXT.md's Code Context section names.** Full resolution table below. |

</phase_requirements>

## Summary

This phase touches no new library, no new architectural boundary, and no new runtime dependency — it is 100% internal-correctness work on a codebase whose conventions (hand-rolled SVG templating, `node:util.parseArgs`, `escapeXml`-gated string injection, Vitest byte-pinned snapshots) are already fully established and documented in `.claude/CLAUDE.md`. The research task here was therefore not "what library should we use" but "what does the existing code actually say, precisely, at the lines this phase must touch" — and, for MAINT-01, "how much of the codebase's citation surface is actually broken."

PKG-02's design was fully locked by discuss-phase (D-57 through D-61); this research verified every insertion point named by those decisions against the live source and found no discrepancies — `KAMEA_SET_VERSIONS` slots directly beside `DEFAULT_KAMEA_SET` at `src/data/kamea.js:75`, the `toWorking` destructure/return in `src/render/json.js:78-107` needs one new destructured field and one new key in the returned object literal (alphabetically after `kameaSet` in the Vitest snapshot's own sort order — confirmed, not coincidental), and both snapshot files' `"kameaSet": "agrippa",` lines (`json.test.js.snap:39`, `worked-example.working.json:4`) are the exact lines that will grow a sibling line on rebase.

INT-05 has a strong, mechanically-derivable answer once the codebase's own convention is read: `--glyph` and `--curve` are both simple presence-flags (`{ type: 'boolean', default: false }`, no negated form), and `node:util.parseArgs`'s only negation mechanism (`allowNegative`) landed in Node 22.4 — after this project's documented `>=20.0.0` engines floor. A `--no-title` flag is therefore both inconsistent with the two existing boolean flags and not cleanly implementable without either bumping the floor or hand-rolling token reprocessing (itself an inconsistency with the zero-cleverness `parseArgs` convention already established). The research recommends parity with `--glyph`/`--curve`: presence-only boolean, no negated form.

INT-06's `aria-labelledby` pattern is a well-documented, two-source-corroborated accessibility technique — `role="img"` on the root `<svg>`, an `id` on the `<title>` element, and `aria-labelledby` on `<svg>` referencing that id — used specifically because native browser/AT support for a bare `<title>` (no ARIA) remains inconsistent. This maps cleanly onto the two existing emission lines in `src/render/svg.js` and the `escapeXml` discipline D-44 already established for `idPrefix`; the only design question CONTEXT.md leaves open (id derivation and the title-without-idPrefix case) is addressed with two concrete, source-cited recommendations below.

MAINT-01 is the most significant research finding of this phase. CONTEXT.md's Code Context section, from a scouting pass, named "10 pitfall citations across `src/`." A full audit performed this session — every `.md` filename mentioned anywhere in `src/`+`bin/`, cross-checked against both the current and archived version of each target document — found **30 citation sites across 8 files, referencing 3 separate documents that were each wholesale-replaced at the same path** (`PITFALLS.md`, `ARCHITECTURE.md`, and — a new finding — `STACK.md`), plus the 3 sites CONTEXT.md already named that reference the genuinely-*moved* `03-RESEARCH.md`/`03-03-PLAN.md`. The rot mechanism is structural, not a one-off typo: every v1.1 research document at `.planning/research/*.md` was written to **replace, not append to,** the v1.0 document at the identical path, and none of the ~26 unqualified in-source citations written during v1.0 development anticipated that. This has a direct implication for how MAINT-01 should be scoped and fixed — see Common Pitfalls.

**Primary recommendation:** Plan PKG-02 as a small, surgical diff exactly matching D-57–D-61 (insertion points below); plan INT-05 as a one-line `parseArgs` addition following the `--glyph`/`--curve` precedent with no negated form; plan INT-06 using the `role="img"` + id'd `<title>` + `aria-labelledby` pattern, applied only when both `title` and `idPrefix` are present; and scope MAINT-01 to the full 30-site table below, not the 10 sites named in CONTEXT.md's Code Context, repairing every citation to an explicit, fully-qualified path (never a bare filename) so this exact rot cannot recur silently on the next milestone's research refresh.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Kamea version constant + threading (PKG-02) | Library (`src/data/`, `src/generate.js`, `src/render/json.js`) | — | Pure data/computation; zero I/O, zero CLI involvement. The CLI never touches this field — it flows through `generateSigil` → `toWorking` untouched. |
| `--title` CLI flag (INT-05) | CLI (`bin/sigil-spinner.js`) | Library (`src/generate.js` — validation) | Flag parsing and threading is CLI-tier; validation of the resulting boolean stays library-tier per the established Anti-Pattern-3 rule ("CLI-Only Validation" — never duplicate a check the library already owns). |
| `aria-labelledby` wiring (INT-06) | Library (`src/render/svg.js`) | — | Pure string-templating inside the existing renderer; no new tier, no new boundary. The CLI is unaffected — it already threads `title`/`idPrefix` through unchanged. |
| Citation repair (MAINT-01) | Documentation / source comments | — | Not a runtime-behavior tier at all — every fix is a doc-comment string edit. No test behavior changes unless a drift-check test is added (see Common Pitfalls). |

## Standard Stack

**No new external dependency, no new library, in any part of this phase.** Every requirement is satisfied entirely with tooling already in `package.json`'s `devDependencies` (Vitest for snapshot verification) or Node built-ins (`node:util.parseArgs`, already in use). This is consistent with the project's `.claude/CLAUDE.md` stack doc, which documents `node:util.parseArgs` as the CLI parser and hand-rolled string templating as the SVG-generation approach — both already fully in place; this phase extends existing call sites, it does not introduce new ones.

### Core (already installed, extended not added)
| Library | Version | Purpose | Why Standard (for this phase) |
|---------|---------|---------|--------------|
| `node:util.parseArgs` | Node built-in, `>=20.0.0` floor [VERIFIED: package.json:18-20 — `"engines": { "node": ">=20.0.0" }`] | INT-05's `--title` flag | Already parsing 6 flags at `bin/sigil-spinner.js:116-123`; INT-05 adds a 7th entry to the same `options` object literal, zero new import. |
| Hand-rolled SVG string templating (`src/render/svg.js`) | n/a, in-repo | INT-06's `aria-labelledby`/`role` emission | Already the sole SVG-generation mechanism; INT-06 extends the existing `title`/`idAttr` template-literal construction at `svg.js:636-651`, no new abstraction. |
| Vitest snapshot testing | `4.1.10` [VERIFIED: package.json:44, and `npx vitest --version` run this session confirms `vitest/4.1.10 darwin-arm64 node-v24.4.1`] | PKG-02/INT-06 rebase verification | Already the project's determinism-contract mechanism (48 committed snapshots); no new test infrastructure needed. |

### Supporting
None needed. No new supporting library for any of the four requirements.

### Alternatives Considered
Not applicable — no library decision exists in this phase. The only "alternative" genuinely on the table was `parseArgs`'s `allowNegative: true` for a `--no-title` flag; researched and rejected below (Common Pitfalls: "Node floor forecloses `allowNegative`").

**Installation:** None. `npm install` need not be run for any requirement in this phase.

## Package Legitimacy Audit

**Not applicable — this phase installs zero external packages.** PKG-02, INT-05, INT-06, and MAINT-01 are all pure source-level edits to an already-shipped, zero-dependency codebase. `package.json`'s `dependencies` field is empty before this phase and must remain empty after it (milestone-wide constraint, restated in REQUIREMENTS.md's Out of Scope table: "Any runtime dependency, for any feature"). No package-legitimacy check is required.

## Architecture Patterns

### System Architecture Diagram

```
                    ┌─────────────────────────────┐
                    │   bin/sigil-spinner.js       │
                    │   (CLI — argv/stdin in)      │
                    │                              │
   argv ──────────► │  parseArgs({ ..., title })   │  ◄── INT-05: add `title`
                    │  (7 flags after this phase)  │      to options block
                    └──────────────┬───────────────┘
                                   │ generateSigil(statement, planet,
                                   │   { glyph, curve, idPrefix, title })
                                   ▼
                    ┌─────────────────────────────┐
                    │   src/generate.js            │
                    │   (orchestrator)             │
                    │                              │
                    │  resolveOptions()  ──────────┼──► validates `title`
                    │  kameaGrid(planet)            │    (already handles it —
                    │  buildPath(...)               │    INT-04 pre-existing)
                    │  renderSvg(path, {...})  ─────┼─────┐
                    │  toWorking({...,               │     │
                    │    kameaSet: DEFAULT_KAMEA_SET,│     │
                    │    kameaVersion: ...  ◄────────┼──┐  │  PKG-02: new field,
                    │  })                            │  │  │  read from sidecar map
                    └──────────────┬─────────────────┘  │  │
                                   │                     │  │
                    ┌──────────────▼──────────┐   ┌──────▼──▼────────────┐
                    │  src/data/kamea.js        │   │  src/render/svg.js    │
                    │                           │   │                       │
                    │  KAMEA_SET_VERSIONS = {   │   │  <title id="...">     │
                    │    agrippa: '2026-08-04'  │   │  aria-labelledby=     │
                    │  }  ◄── PKG-02 sidecar map│   │  role="img"           │
                    │                           │   │  ◄── INT-06: only when│
                    │  (D-61 parity test        │   │      title+idPrefix   │
                    │   asserts key set matches │   │      both present     │
                    │   KAMEA_SETS)             │   └───────────┬───────────┘
                    └───────────────────────────┘               │
                                   │                              ▼
                    ┌──────────────▼──────────┐        SVG string out
                    │  src/render/json.js       │        (stdout or --output)
                    │                           │
                    │  toWorking(): destructure │
                    │  kameaVersion, emit as    │
                    │  sibling key after        │
                    │  kameaSet (D-58)          │
                    └──────────────┬────────────┘
                                   ▼
                        JSON working out
                        (stdout --json, or --output)
```

### Recommended Project Structure

No new files or directories. All four requirements are edits to existing files:

```
src/
├── data/
│   └── kamea.js         # PKG-02: + KAMEA_SET_VERSIONS sidecar map (D-60); MAINT-01: 2 citation fixes
├── generate.js           # PKG-02: thread kameaVersion into toWorking() call; MAINT-01: 7 citation fixes
├── index.js               # MAINT-01: 1 citation fix
├── path/
│   └── buildPath.js      # MAINT-01: 3 citation fixes
├── render/
│   ├── coords.js          # MAINT-01: 1 citation fix
│   ├── curve.js            # MAINT-01: 6 citation fixes
│   ├── glyphs.js            # MAINT-01: 2 citation fixes
│   ├── json.js               # PKG-02: + kameaVersion field (D-58/D-59); MAINT-01: 1 citation fix
│   └── svg.js                 # INT-06: aria-labelledby/role wiring at :636/:651; MAINT-01: 2 citation fixes
└── text/
    ├── fold.js            # MAINT-01: 3 citation fixes
    └── normalize.js        # MAINT-01: 1 citation fix
bin/
└── sigil-spinner.js       # INT-05: + --title flag; MAINT-01: 1 citation fix
test/
├── determinism.test.js       # PKG-02: hand-edit hardcoded key-order array (line 243 region)
├── data/kamea.test.js         # PKG-02: + KAMEA_SET_VERSIONS parity test (D-61)
└── render/
    ├── json.test.js             # PKG-02: hand-edit pipeline-result fixture (line 27 region)
    └── __snapshots__/json.test.js.snap  # PKG-02: rebase (1 of 48)
test/__file_snapshots__/
└── worked-example.working.json  # PKG-02: rebase (1 of 48)
README.md                    # PKG-02: + kameaVersion table row; INT-05: + --title in Usage/CLI flag list
```

### Pattern 1: Sidecar version map, keyed identically to the data it versions (PKG-02)

**What:** A second, small, flat object (`KAMEA_SET_VERSIONS`) declared beside the data it annotates (`KAMEA_SETS`), keyed by the same set-name strings, with a test asserting `Object.keys()` parity between the two.

**When to use:** Any time metadata about a keyed data structure needs its own evolution path without reshaping the structure's own consumers. This is D-60's own reasoning, already locked — included here because the exact insertion point matters for planning.

**Example (from live source, exact current state):**
```js
// Source: src/data/kamea.js:74-89 — read this session
/** Name of the kamea set shipped in this phase. Only this set ships (D-02). */
export const DEFAULT_KAMEA_SET = 'agrippa';

// ◄── KAMEA_SET_VERSIONS goes here, per D-60 ("living in src/data/kamea.js
//     beside DEFAULT_KAMEA_SET")

/**
 * @typedef {Record<string, number[][]>} KameaSet
 *   A kamea set: planet name (lowercase) -> row-major grid.
 */

/**
 * Registry of kamea sets, keyed by set name. Only `agrippa` is populated —
 * the shape exists so a future verified set (e.g. `skinner`, `golden-dawn`)
 * can be added without reshaping this API (D-02).
 *
 * @type {Record<string, KameaSet>}
 */
export const KAMEA_SETS = {
  agrippa: {
    saturn: [ /* ... */ ],
    // ...
  },
};
```

Only one key currently exists in `KAMEA_SETS` (`agrippa`) [VERIFIED: src/data/kamea.js:89-148 — the object literal contains exactly one top-level key, `agrippa`, holding the seven planet grids], so `KAMEA_SET_VERSIONS = Object.freeze({ agrippa: '2026-08-04' })` is a one-entry map matching D-57's value and D-60's shape exactly. `Object.freeze` is not explicitly required by any locked decision but matches the established convention `PLANET_GLYPHS` already uses one file over [VERIFIED: src/render/glyphs.js:50 — `export const PLANET_GLYPHS = Object.freeze({...})`] for a closed, non-mutable lookup map of identical shape (string key → string value).

### Pattern 2: Threading a new working field through the orchestrator (PKG-02)

**What:** `generate.js` is the single place that assembles the `GeneratePipelineResult` object passed to `toWorking()`. D-58 requires `kameaVersion` to land as a sibling of `kameaSet` in the emitted JSON, which means it must also be a sibling of `kameaSet: DEFAULT_KAMEA_SET` in this assembly call.

**Current exact state (read this session):**
```js
// Source: src/generate.js:277-293
const working = toWorking({
  statement,
  planet: canonicalPlanet,
  kameaSet: DEFAULT_KAMEA_SET,
  gridSize: order,
  kept,
  struck,
  keptEntries,
  numbers,
  path,
  render: {
    curve: /** @type {boolean} */ (resolvedOptions.curve),
    glyph: /** @type {boolean} */ (resolvedOptions.glyph),
    idPrefix: /** @type {string | null} */ (resolvedOptions.idPrefix),
    title: /** @type {boolean} */ (resolvedOptions.title),
  },
});
```
`generate.js` already imports `DEFAULT_KAMEA_SET` from `./data/kamea.js` at line 14 [VERIFIED: src/generate.js:14 — `import { cellForNumber, gridSize, planetNames, DEFAULT_KAMEA_SET, kameaGrid } from './data/kamea.js';`]. A `kameaVersion: KAMEA_SET_VERSIONS[DEFAULT_KAMEA_SET]` addition to this same import and this same object literal is the minimal diff — no new function, no new parameter threading.

### Pattern 3: Emitting a new working key in fixed, documented order (PKG-02)

**What:** `toWorking()` in `src/render/json.js` destructures its input and re-emits a fixed-order object literal — this is the single point where JSON key order is authored.

**Current exact state (read this session):**
```js
// Source: src/render/json.js:77-108
export function toWorking(result) {
  const { statement, planet, kameaSet, gridSize, kept, struck, keptEntries, numbers, path, render } = result;
  // ...
  return {
    statement,
    planet,
    kameaSet,
    gridSize,
    lettersKept: kept,
    lettersStruck: struck,
    letterNumbers,
    numbers,
    cells,
    segments: path.segments,
    start: path.start,
    end: path.end,
    keptTrail: keptEntries,
    repeats: path.repeats,
    render,
  };
}
```
D-58 requires `kameaVersion` inserted **immediately after `kameaSet`** in both the destructure and the returned object literal — `const { statement, planet, kameaSet, kameaVersion, gridSize, ... }` and `{ statement, planet, kameaSet, kameaVersion, gridSize, ... }`. The `SigilWorking` and `GeneratePipelineResult` JSDoc typedefs immediately above this function (lines 34-66) also need a `@property {string} kameaVersion` line inserted after the existing `kameaSet` property line, per this module's own stated convention of "the single source of truth this table tracks" (README.md:275).

### Anti-Patterns to Avoid

- **Deriving `kameaVersion` at runtime instead of reading the sidecar map.** Any `Date.now()`, `readFileSync`, `process.env`, or `execSync` appearing in `src/data/kamea.js` or `src/generate.js` for the first time is itself the defect signal — [CITED: .planning/research/PITFALLS.md Pitfall 10] names exactly this failure class and is explicitly flagged as load-bearing by CONTEXT.md's canonical refs.
- **Restructuring `KAMEA_SETS` to carry the version inline.** D-60 explicitly rejected this (`{ version, grids }` nesting) because it changes the shape every existing accessor indexes (`kamea.js:182-187`, `:256`, and the test file's `KAMEA_SETS.agrippa[planet]` assertion pattern).
- **A `--no-title` CLI flag using `allowNegative`.** See Common Pitfalls below — forecloses on this project's own documented Node floor.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SVG accessible-name wiring | A custom "compute accessible name" helper, or inline string concatenation for the `<title id>`/`aria-labelledby` pair | The existing `escapeXml` + template-literal pattern already used for `idPrefix` (`svg.js:646-649`) and for `<title>` content (`svg.js:636`) | The pattern is already proven, tested, and the exact right shape — INT-06 is an extension of two existing lines, not a new subsystem. No third-party ARIA helper library exists that would be appropriate for a zero-dependency SVG string generator, and none should be reached for. |
| CLI boolean flag negation | Hand-rolled token reprocessing to support `--no-title` on a `parseArgs` version that lacks `allowNegative` | Nothing — omit the negated form, matching `--glyph`/`--curve` | `options.title` already defaults to `false`/absent; a caller who wants no title simply omits the flag. Building negation infrastructure for a boolean whose only two states are "flag present" and "flag absent" is solving a problem this CLI does not have, and no other flag in the CLI has this affordance either. |
| Citation-freshness checking | Nothing hand-rolled needed beyond a grep-based test (see below) | A simple regex extraction + `fs.existsSync`/heading-match test, following the exact pattern Phase 8's SKILL-03 will already establish for CLI-flag drift | This is squarely a "cheap mechanical check" problem, not a "reach for a library" problem — see Common Pitfalls for a concrete sketch. |

**Key insight:** every requirement in this phase is small enough, and the codebase's own conventions established enough, that the correct answer in all four cases is "extend the existing pattern by one line/field/citation," never "introduce new machinery."

## Common Pitfalls

### Pitfall 1: Citation rot is systemic, not incidental — and CONTEXT.md's own count undercounts it 3x

**What goes wrong:** Scoping MAINT-01 to the ~10 citation sites CONTEXT.md's Code Context section names (all "Pitfall N" citations) misses roughly 20 additional sites that reference two other documents — `ARCHITECTURE.md` and `STACK.md` — that were wholesale-replaced by the same v1.1 research refresh, at the same path, using the same silent-supersession pattern PITFALLS.md itself already documents about itself.

**Why it happens:** `.planning/research/*.md` is not versioned per-milestone in its live location — each milestone's `/gsd-plan-phase` research pass writes a **new** document to the **same path**, and the old content is only preserved because it happens to also live under `.planning/milestones/v1.0-research/`. Every citation written during v1.0 development that used a bare filename (`PITFALLS.md`, `ARCHITECTURE.md`, `STACK.md`) rather than a fully-qualified path silently starts pointing at different content the moment a later milestone's research runs — with no build error, no lint failure, no test failure, because these are doc-comment prose strings, not code.

**Full verified citation table** (every `.md` filename mentioned anywhere in `src/`+`bin/`, audited this session by reading both the current and target document at each cited location):

| # | File:Line | Citation text (verbatim) | Currently resolves to (wrong) | Should resolve to |
|---|-----------|---------------------------|-------------------------------|---------------------|
| 1 | `src/data/kamea.js:26` | `Pitfall 1 in .planning/research/PITFALLS.md` | v1.1 Pitfall 1: "Scoped package publishes private" | [VERIFIED: .planning/milestones/v1.0-research/PITFALLS.md:9] v1.0 Pitfall 1: "Kamea Orientation Ambiguity" |
| 2 | `src/data/kamea.js:65` | `(.planning/research/ARCHITECTURE.md, Anti-Pattern 2)` | v1.1 doc has no "Anti-Pattern 2" (no Anti-Patterns section at all) | [VERIFIED: .planning/milestones/v1.0-research/ARCHITECTURE.md:224] v1.0 Anti-Pattern 2: "Kamea Cell Positions Hardcoded Outside `data/kamea.js`" |
| 3 | `src/path/buildPath.js:3` | `(ARCHITECTURE.md Pattern 2)` | v1.1 doc has no "Pattern 2" | [VERIFIED: .planning/milestones/v1.0-research/ARCHITECTURE.md:119] v1.0 Pattern 2: "Renderer-Agnostic Intermediate Model (PathModel)" |
| 4 | `src/path/buildPath.js:45` | `(Pitfall 7 / Pitfall 2)` | v1.1 PITFALLS.md Pitfall 7 doesn't exist (only 12 pitfalls, #7 is "Shadow DOM..."); wrong content either way | [VERIFIED: .planning/milestones/v1.0-research/PITFALLS.md:142] v1.0 Pitfall 7 "Consecutive-Repeat Detection Misses Cross-Letter Number Collisions" **and** [VERIFIED: .planning/milestones/v1.0-phases/02-every-planet-every-statement/02-RESEARCH.md:281] that phase's own Pitfall 2 "Consecutive-Repeat Detection on Letters Instead of Numbers" — dual citation, both moved |
| 5 | `src/path/buildPath.js:75` | `(Pitfall 5, the Phase 1 degenerate safety net)` | v1.1 Pitfall 5: "ESM-only package produces a confusing error for CommonJS consumers" | [VERIFIED: .planning/milestones/v1.0-research/PITFALLS.md:96] v1.0 Pitfall 5: "Degenerate Text-Processing Inputs Producing Empty or Single-Node Sigils" |
| 6 | `src/render/coords.js:3` | `(Pitfall 10 — duplicated coordinate math...)` | v1.1 Pitfall 10: "A version/provenance field in the JSON working becomes a silent determinism leak" | [VERIFIED: .planning/milestones/v1.0-research/PITFALLS.md:208] v1.0 Pitfall 10: "Coordinate-Scaling / viewBox Inconsistency Across Seven Different Kamea Sizes" |
| 7 | `src/render/curve.js:19` | `d3-path/d3-shape remain the documented STACK.md fallback` | Current v1.1 STACK.md never documents d3-path/d3-shape as a curve-math fallback (only rejects d3-shape, in the unrelated web-component context) | [VERIFIED: .planning/milestones/v1.0-research/STACK.md:21-23,55] v1.0 STACK.md's Alternatives Considered table, which explicitly names this fallback |
| 8 | `src/render/curve.js:27` | `(03-RESEARCH.md Pattern 1)` | File doesn't exist at `.planning/research/03-RESEARCH.md` (never did — phase research was always per-phase-directory) | [VERIFIED: .planning/milestones/v1.0-phases/03-themeable-embeddable-layers/03-RESEARCH.md:189] "Pattern 1: Local 4-Point Catmull-Rom Window with Duplicated Terminal Points" |
| 9 | `src/render/curve.js:56` | `(03-RESEARCH.md Pattern 2)` | same broken path | [VERIFIED: same file:209] "Pattern 2: Centripetal Knot Intervals with Exact-Zero Guard (not epsilon)" |
| 10 | `src/render/curve.js:70` | `(03-RESEARCH.md Pattern 3...)` | same broken path | [VERIFIED: same file:233] "Pattern 3: Centripetal Tangent → Hermite → Bézier Control Points" |
| 11 | `src/render/curve.js:75` | `03-RESEARCH.md's own illustrative code example (see 03-03-PLAN.md's Planner Note)` | same broken path, plus a second unresolvable relative filename | [VERIFIED: `.planning/milestones/v1.0-phases/03-themeable-embeddable-layers/` contains both `03-RESEARCH.md` and `03-03-PLAN.md`] — both files moved together |
| 12 | `src/render/curve.js:119` | `(03-RESEARCH.md Pattern 2, Pitfall A)` | same broken path | [VERIFIED: same file:299] "Pitfall A: Coincident-Point Division by Zero in Curve Math" |
| 13 | `src/render/glyphs.js:17` | `Per 03-RESEARCH.md Pitfall C` | same broken path | [VERIFIED: same file:319] "Pitfall C: Two of Seven Glyphs Carry Real Emoji-Presentation Risk" |
| 14 | `src/render/glyphs.js:40` | `(Pitfall C)` | ambiguous without the file already cited two lines above at :17 (same fix) | same target as #13 |
| 15 | `src/render/svg.js:13` | `(Pitfall 8)` | v1.1 Pitfall 8: "Verifying the web component..." | [VERIFIED: .planning/milestones/v1.0-research/PITFALLS.md:163] v1.0 Pitfall 8: "CSS-Styleability Killed by Inline `style` Attributes..." |
| 16 | `src/render/svg.js:28` | `(D-35, ARCHITECTURE.md internal boundaries)` | v1.1 doc's "Internal boundaries" section covers only v1.1 web-component additions, not the text/data/path/render boundary this comment describes | [VERIFIED: .planning/milestones/v1.0-research/ARCHITECTURE.md:248-256] v1.0 "Internal Boundaries" table, specifically the `render/svg.js` ↔ `path/` row |
| 17 | `src/render/svg.js:516` | `(Pitfall 5, D-06)` | v1.1 Pitfall 5 (wrong doc, wrong content — see #5) | [VERIFIED: .planning/milestones/v1.0-phases/02-every-planet-every-statement/02-RESEARCH.md:295] that phase's own Pitfall 5: "Loop-Marker Geometry Silently Duplicating or Suppressing Existing Nodes" — **note this is a different Pitfall 5 than #5 above**, confirming two independently-numbered Pitfall lists both use the bare "Pitfall 5" form in source |
| 18 | `src/text/fold.js:7` | `(ARCHITECTURE.md internal boundary)` | same v1.1 gap as #16 | [VERIFIED: .planning/milestones/v1.0-research/ARCHITECTURE.md:252] v1.0 "Internal Boundaries" table, `text/` ↔ `data/pythagorean.js` row |
| 19 | `src/text/fold.js:160` | `(Pitfall 1)` | ambiguous — could misread as milestone-wide PITFALLS.md Pitfall 1 (wrong: kamea orientation, unrelated) | [VERIFIED: .planning/milestones/v1.0-phases/02-every-planet-every-statement/02-RESEARCH.md:271] that phase's own Pitfall 1: "Whole-String Folding Breaks Original-Index Provenance" |
| 20 | `src/text/fold.js:164` | `(Pitfall 3)` | ambiguous — could misread as milestone-wide PITFALLS.md Pitfall 3 (wrong: Chaldean/Pythagorean conflation, unrelated) | [VERIFIED: same file:285] that phase's own Pitfall 3: "`ß`/`ẞ` Case Asymmetry in Native `toUpperCase()`" |
| 21 | `src/text/normalize.js:5` | `(ARCHITECTURE.md internal boundary)` | same v1.1 gap as #16/#18 | same target as #18 |
| 22 | `src/generate.js:3` | `(ARCHITECTURE.md internal boundaries)` | same v1.1 gap | [VERIFIED: v1.0 ARCHITECTURE.md:248-256] full "Internal Boundaries" table, specifically the `generate.js` ↔ everything row |
| 23 | `src/generate.js:9` | `(ARCHITECTURE.md Anti-Pattern 4)` | v1.1 has no Anti-Patterns section | [VERIFIED: v1.0 ARCHITECTURE.md:236] "Anti-Pattern 4: Mutable Shared Options Object Threaded Through the Pipeline" |
| 24 | `src/generate.js:87` | `(D-47, ARCHITECTURE.md Anti-Pattern 3...)` | same gap | [VERIFIED: v1.0 ARCHITECTURE.md:230] "Anti-Pattern 3: CLI-Only Validation" |
| 25 | `src/generate.js:128` | `(ARCHITECTURE.md Anti-Pattern 4...)` | same gap | same target as #23 |
| 26 | `src/generate.js:187` | `(ARCHITECTURE.md Anti-Pattern 3)` | same gap | same target as #24 |
| 27 | `src/index.js:4` | `(ARCHITECTURE.md "Thin CLI Over Stable Library API")` | v1.1 has no such pattern name anywhere | [VERIFIED: v1.0 ARCHITECTURE.md:146] "Pattern 3: Thin CLI Over Stable Library API" |
| 28 | `src/render/json.js:4` | `(ARCHITECTURE.md Component Responsibilities)` | v1.1 has no "Component Responsibilities" heading | [VERIFIED: v1.0 ARCHITECTURE.md:44] "### Component Responsibilities" |
| 29 | `bin/sigil-spinner.js:3` | `(ARCHITECTURE.md "Thin CLI Over Stable Library API")` | same gap as #27 | same target as #27 |
| 30 | `src/text/normalize.js:11` | `README.md's "Letter Handling Rules" section` | **Not stale** — [VERIFIED: README.md:333] `## Letter Handling Rules` heading still exists and still states the Y-is-always-consonant rule. Included for completeness/negative confirmation, not a fix target. |

Row 30 is a deliberate negative-control finding: not every citation in `src/` is broken — `README.md` citations remain accurate because `README.md` is not a research artifact that gets wholesale-replaced per milestone. This confirms the rot is specific to the `.planning/research/*.md` replace-in-place pattern, not a general staleness problem across all doc citations.

**How to avoid recurrence:** every citation written as part of this phase's fix should use a **fully-qualified path** (e.g. `.planning/milestones/v1.0-research/PITFALLS.md`, not `PITFALLS.md` or `.planning/research/PITFALLS.md`), because the archived path is durable (archives are not replaced-in-place) while the live `.planning/research/` path is not. A citation to `.planning/research/*.md` should be treated as inherently time-bound and is only safe for content that describes the *current* milestone's own additions (e.g. `svg.js`'s D-35 boundary note could cite the *current* `.planning/research/ARCHITECTURE.md`'s "Internal boundaries (v1.1 additions...)" section specifically for the new `kamea.js` ↔ `json.js` boundary PKG-02 introduces — but that is new content this phase adds, not a fix to old content).

**Warning signs:** any doc-comment citation of the form `(FILENAME.md, ...)` with a bare filename and no directory — this is exactly the pattern behind all 29 stale sites above; every citation using a fully-qualified path from the start (all `PROJECT.md`/`D-NN` citations in this codebase, which cite the milestone-stable `.planning/PROJECT.md`) had zero rot.

### Pitfall 2: Node engines floor forecloses `parseArgs`'s `allowNegative` for a `--no-title` flag

**What goes wrong:** Reaching for `parseArgs({ ..., allowNegative: true })` to cleanly support `--no-title` looks like the "proper" modern way to add negatable-boolean support, and would work correctly on the Node version most contributors' machines actually run (this session's `node --version` reports `v24.4.1`). It silently breaks on any consumer running the project's own documented floor.

**Why it happens:** `allowNegative` is a genuinely recent addition — [CITED: https://github.com/nodejs/node/pull/53107] confirms it landed in Node v22.4, two full minor-floor-jumps above this project's committed `>=20.0.0` `engines.node` field [VERIFIED: package.json:18-20]. Nothing in local development would ever surface this: any machine new enough to be actively developing this project in 2026 has Node well past v22.4.

**How to avoid:** Don't add a negated form at all. `--glyph` and `--curve` are the two existing precedents for exactly this shape of option (`{ type: 'boolean', default: false }`, presence-only, no negated variant) [VERIFIED: bin/sigil-spinner.js:120-121 — `glyph: { type: 'boolean', default: false }, curve: { type: 'boolean', default: false },`], and `options.title` in the library has the identical default-false-when-absent semantics [VERIFIED: src/generate.js:80-83 — `ABSENT_DEFAULT_BY_TYPE = { boolean: false, string: null }`]. A caller who wants no title already gets that by omitting `--title`; there is no affordance gap to fill.

**Warning signs:** `allowNegative` appearing anywhere in the `parseArgs` call, or any hand-rolled token-reprocessing loop for `--no-title` — both are solving a problem the existing two boolean flags don't have and never needed to solve.

### Pitfall 3: A version/provenance field in the JSON working becomes a silent determinism leak (PKG-02, already load-bearing per CONTEXT.md)

**What goes wrong:** [CITED: .planning/research/PITFALLS.md, Pitfall 10] — CONTEXT.md's own canonical refs flag this as load-bearing. Summarized here for research completeness: reading a build timestamp, git SHA, or `package.json`'s `version` at runtime for `kameaVersion` would break byte-identical determinism between the dev tree and an installed package, and none of the four warning-sign imports (`readFileSync`, `import ... from '../package.json'`, `process.env`, `Date.now()`/`execSync`) exist anywhere in `src/` today [VERIFIED: confirmed by this session's own read of every file `src/data/kamea.js`, `src/generate.js`, `src/render/json.js` touches for PKG-02 — none contain any of these imports].

**How to avoid:** D-57–D-61 already lock the fix (a hardcoded literal in a sidecar map) — this pitfall is fully closed by the locked design, included here only to confirm the research agrees with CONTEXT.md's own citation and to give the planner the exact grep command to verify it stayed closed: `grep -nE "readFileSync|process\.env|Date\.now|execSync" src/data/kamea.js src/generate.js src/render/json.js` should return nothing before and after the PKG-02 diff.

## Code Examples

### Existing boolean-flag pattern INT-05 should follow exactly
```js
// Source: bin/sigil-spinner.js:114-124 — read this session, current live state
parsed = parseArgs({
  allowPositionals: true,
  options: {
    planet: { type: 'string' },
    json: { type: 'boolean', default: false },
    output: { type: 'string' },
    glyph: { type: 'boolean', default: false },
    curve: { type: 'boolean', default: false },
    'id-prefix': { type: 'string' },
    // INT-05 adds: title: { type: 'boolean', default: false },
  },
});
```
And the corresponding threading into `generateSigil` a few lines later:
```js
// Source: bin/sigil-spinner.js:168-173
const { svg, working } = generateSigil(statement, planetArg, {
  glyph: glyphArg,
  curve: curveArg,
  idPrefix: idPrefixArg,
  // INT-05 adds: title: titleArg,
});
```

### Existing `title`/`idPrefix` emission INT-06 extends
```js
// Source: src/render/svg.js:636-651 — read this session, current live state
const title = options.title ? `<title>${escapeXml(options.statement ?? '')}</title>` : '';

const idAttr =
  typeof options.idPrefix === 'string' && options.idPrefix.length > 0
    ? ` id="${escapeXml(options.idPrefix)}"`
    : '';

return `<svg xmlns="${SVG_NAMESPACE}" viewBox="0 0 100 100" class="sigil sigil--${pathModel.planet}"${idAttr}>${title}${layers}</svg>`;
```
**Recommended INT-06 pattern** (illustrative — the exact id-derivation string and whether `role="img"` is unconditional are Claude's Discretion per CONTEXT.md, not locked):
```js
// Illustrative sketch — not verbatim source. Applies role="img" +
// aria-labelledby ONLY when both title and a non-empty idPrefix are present,
// matching D-44's "idPrefix is the only route to an emitted id" discipline —
// no id is ever synthesized when idPrefix is absent.
const hasIdPrefix = typeof options.idPrefix === 'string' && options.idPrefix.length > 0;
const titleId = hasIdPrefix ? `${escapeXml(options.idPrefix)}-title` : null;
const title = options.title
  ? `<title${titleId ? ` id="${titleId}"` : ''}>${escapeXml(options.statement ?? '')}</title>`
  : '';
const ariaAttrs =
  options.title && titleId ? ` role="img" aria-labelledby="${titleId}"` : '';
// ... idAttr unchanged ...
return `<svg xmlns="${SVG_NAMESPACE}" viewBox="0 0 100 100" class="sigil sigil--${pathModel.planet}"${idAttr}${ariaAttrs}>${title}${layers}</svg>`;
```

### The `role="img"` + id'd `<title>` + `aria-labelledby` accessibility pattern
```html
<!-- Source: cross-checked against CSS-Tricks "Accessible SVGs" and
     TPGi "Using ARIA to enhance SVG accessibility" — both independently
     confirm this exact pattern -->
<svg role="img" aria-labelledby="sigil-a-title" ...>
  <title id="sigil-a-title">I will succeed</title>
  ...
</svg>
```
[CITED: https://css-tricks.com/accessible-svgs/] — "The recommended approach combines both: add an ID to the `<title>` element... link it via `aria-labelledby`... This dual approach is necessary because browser support is not quite there yet for native title element accessibility." [CITED: https://www.tpgi.com/using-aria-enhance-svg-accessibility/, via WebSearch summary] — "Putting `role="img"` on the SVG element ensures it is identified as a graphic, and using `aria-labelledby` referencing the id values of the title and desc elements provides the accessible name." Both sources independently agree a bare `<title>` (no ARIA) has inconsistent AT support, which is exactly what success criterion 3 ("exposes its accessible name to assistive technology without the embedder hand-authoring any ARIA") is asking the library to close.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `parseArgs` had no built-in negation mechanism; negated flags required manual token reprocessing | `allowNegative: true` config option adds native `--no-x` support | Node v22.4 (2025) | Not usable on this project's `>=20.0.0` floor — see Pitfall 2. Not relevant to INT-05's recommended design (no negated form needed at all), but relevant if a future phase ever bumps the floor and reconsiders. |
| Bare `<title>` element assumed sufficient for SVG accessible names | `role="img"` + id'd `<title>` + `aria-labelledby` is the belt-and-suspenders recommendation, because AT/browser support for bare `<title>` remains inconsistent even in 2026 | Long-standing (pre-2020) guidance, still current per both sources checked this session | Directly informs INT-06's recommended pattern above. |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `role="img"` should be applied only when `title` is present (not unconditionally on every SVG), and only when `idPrefix` is also present (since `aria-labelledby` has nothing to reference otherwise) | Code Examples, INT-06 sketch | Low — this is explicitly flagged as Claude's Discretion in CONTEXT.md, not a locked decision; the planner/executor should confirm the title-without-idPrefix behavior against success criterion 3's exact wording ("when a title and an id prefix are both present") before finalizing. If wrong, only the SVG markup for that one combination changes — no data-layer or determinism impact. |
| A2 | The derived `<title>` id should be `${idPrefix}-title` (a simple, readable suffix) rather than a hash or other scheme | Code Examples, INT-06 sketch | Low — purely illustrative; CONTEXT.md explicitly leaves "the `<title>` element's id derivation" to planning. Any deterministic, XML-safe (post-`escapeXml`) derivation satisfies the success criterion equally. |
| A3 | No `--no-title` flag is needed, matching `--glyph`/`--curve` precedent | Common Pitfalls (Pitfall 2), Summary | Low — this is Claude's Discretion per CONTEXT.md ("whether `--no-title` is needed"). The research finding (Node floor forecloses `allowNegative`) is [VERIFIED] fact; the recommendation to therefore omit negation entirely is a design judgment the planner should confirm, though it is the only option consistent with both the Node floor and the existing two-flag precedent. |

**If this table is empty:** N/A — three low-risk discretion-area assumptions are logged above; none affect PKG-02 (fully locked) or MAINT-01 (a pure citation-repair task with no design ambiguity once the resolution table is applied).

## Open Questions

1. **Should `KAMEA_SET_VERSIONS` be exported from `src/index.js` (the public library surface)?**
   - What we know: `DEFAULT_KAMEA_SET` is not currently exported from `index.js` either [VERIFIED: src/index.js:11-19 — the full export list is `generateSigil`, `SigilError`, and five `E_*` constants; no kamea-related export exists]. `kameaVersion` reaches consumers entirely through `working.kameaVersion`, never as a standalone import.
   - What's unclear: whether a consumer might want to look up a *different* set's version without generating a sigil (e.g., tooling that lists all available kamea sets and their versions). No requirement asks for this.
   - Recommendation: do not export it. Nothing in PKG-02's success criteria or D-57–D-61 asks for a standalone export, and `DEFAULT_KAMEA_SET` itself sets the precedent of staying internal. If a future phase needs it, exporting later is additive and non-breaking.

2. **Should the citation-drift mechanical check (deferred idea) be built in this phase, or left deferred?**
   - What we know: CONTEXT.md's Deferred Ideas section explicitly leaves this open ("Not deferred *out* of Phase 5... Planning may fold it into MAINT-01 if it is the cheapest way to satisfy success criterion 4 durably"). This session's 30-site audit demonstrates the rot is systemic and will recur the next time `.planning/research/*.md` is wholesale-replaced by a v1.2 research pass.
   - What's unclear: the cost/benefit tradeoff of building a grep-based drift test now (cheap: a regex over `.md` filenames + `Pitfall N`/`Pattern N`/`Anti-Pattern N` mentions, checked against `fs.existsSync` and a heading-grep on the target file) versus treating this repair as a one-time fix.
   - Recommendation: build a minimal version — even a test that just asserts *no bare filename citation* exists in `src/`/`bin/` (i.e., every `.md` mention is preceded by a `.planning/` path) would have caught 29 of the 30 sites in this table without needing to understand document *content* at all, which is far cheaper than a full heading-resolution check. This is a plan-time cost/benefit call, not a research blocker.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All four requirements | ✓ | v24.4.1 [VERIFIED: `node --version` run this session] | — (floor is `>=20.0.0`, well above) |
| Vitest | PKG-02/INT-06 snapshot rebase and verification | ✓ | 4.1.10 [VERIFIED: `npx vitest --version` run this session] | — |
| TypeScript (`tsc --checkJs`) | Typecheck gate on any JSDoc typedef changes (PKG-02's `SigilWorking`/`GeneratePipelineResult`) | ✓ | present at `node_modules/.bin/tsc` [VERIFIED: `ls node_modules/.bin/tsc` run this session] | — |
| Playwright/Chromium | Only if INT-06's verification goes beyond markup-shape assertions into a real rendered accessible-name check (optional, per CONTEXT.md's "if... needs verification beyond markup shape" framing) | ✓ | 1.62.1 [VERIFIED: `npx playwright --version` run this session] | Markup-shape assertions alone (string-contains checks on the emitted SVG) are sufficient to satisfy success criterion 3's literal wording and do not require a browser; Playwright is available as a stronger option, not a blocking requirement. |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** none — everything needed is already installed.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No auth surface anywhere in this project — local CLI/library, no network, no user accounts. |
| V3 Session Management | No | No sessions. |
| V4 Access Control | No | No access-control surface. |
| V5 Input Validation | Yes | Already handled by `resolveOptions()` in `src/generate.js:134-164` [VERIFIED — read this session] for the `title` boolean's type validation (unchanged by this phase — INT-05 threads an already-validated option through a new CLI flag, it does not add new validation logic). For INT-06, any string value interpolated into the new `<title id="...">` / `aria-labelledby="..."` attributes MUST go through `escapeXml`, matching the existing discipline for `idPrefix` (D-44) and title content (D-16) — this is the one place this phase's design must actively preserve an existing control, not merely inherit one. |
| V6 Cryptography | No | No cryptographic operation anywhere in this project. |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Attribute-value injection via an unescaped `idPrefix`-derived string reaching a new `id="${idPrefix}-title"` attribute (INT-06) | Tampering | Route the derived title-id through `escapeXml` exactly as the existing `idAttr` construction already does at `svg.js:646-649` [VERIFIED this session] — a hostile `idPrefix` containing a double-quote must not be able to break out of the new attribute any more than it can break out of the existing `id` attribute. This is a direct extension of D-44's already-closed threat, not a new threat surface, but it is new *code* that must independently apply the same discipline — copy-paste of the escaping call, not an assumption that escaping "already happened" upstream. |
| Stale documentation citations misleading a future contributor into trusting security-relevant guidance that no longer applies (MAINT-01) | Information Disclosure (mild — this is a correctness/trust threat, not a data-exposure one) | Not a traditional ASVS-mapped threat, but worth naming: several of the 30 stale citations point at content describing *why* a security-relevant discipline exists (e.g., `svg.js:13`'s Pitfall 8 citation about why paint attributes must never be bare literals — a CSS-injection-adjacent concern). A contributor who follows a broken citation and finds unrelated content may conclude the discipline is undocumented/optional. Fixing all 30 sites (not just the 10 CONTEXT.md names) closes this trust gap completely rather than partially. |

## Sources

### Primary (HIGH confidence)
- This repository's own source files, read directly this session: `src/data/kamea.js`, `src/generate.js`, `src/render/json.js`, `src/render/svg.js`, `src/render/coords.js`, `src/render/curve.js`, `src/render/glyphs.js`, `src/path/buildPath.js`, `src/text/fold.js`, `src/text/normalize.js`, `src/index.js`, `bin/sigil-spinner.js`, `package.json`, `README.md`, `.planning/config.json`, `.planning/PROJECT.md` (Key Decisions cross-check), `.planning/STATE.md`, `.planning/REQUIREMENTS.md`, `.planning/phases/05-publish-ready-source/05-CONTEXT.md`.
- `.planning/research/PITFALLS.md` and `.planning/milestones/v1.0-research/PITFALLS.md` — both read in full this session, cross-checked against every unqualified "Pitfall N" citation in `src/`.
- `.planning/research/ARCHITECTURE.md` and `.planning/milestones/v1.0-research/ARCHITECTURE.md` — both read in full this session.
- `.planning/research/STACK.md` and `.planning/milestones/v1.0-research/STACK.md` — targeted grep + read this session.
- `.planning/milestones/v1.0-phases/02-every-planet-every-statement/02-RESEARCH.md` and `.planning/milestones/v1.0-phases/03-themeable-embeddable-layers/03-RESEARCH.md` — both read this session for their own independently-numbered Pitfall/Pattern lists.
- Live environment checks run this session: `node --version` (v24.4.1), `npx vitest --version` (4.1.10), `npx playwright --version` (1.62.1), `ls node_modules/.bin/tsc`.

### Secondary (MEDIUM confidence)
- [nodejs/node PR #53107](https://github.com/nodejs/node/pull/53107) — `allowNegative` addition to `parseArgs`, confirmed landed Node v22.4.
- [CSS-Tricks: Accessible SVGs](https://css-tricks.com/accessible-svgs/) — `role="img"` + id'd `<title>` + `aria-labelledby` pattern, fetched and summarized this session.
- WebSearch results (cross-checked, not independently fetched): TPGi "Using ARIA to enhance SVG accessibility"; MDN/general accessibility-checker consensus on the same pattern.

### Tertiary (LOW confidence)
- None — every claim in this document is either read directly from repo source this session, or corroborated by at least two independent web sources for the one external-domain claim (SVG ARIA pattern).

## Metadata

**Confidence breakdown:**
- PKG-02 design/insertion points: HIGH — fully locked by discuss-phase decisions (D-57–D-61), every insertion point verified against live source read this session, no open design questions.
- INT-05 flag design: HIGH — derived mechanically from the codebase's own established convention (`--glyph`/`--curve`) plus a verified Node-version constraint; the "no negated form" recommendation is a low-risk discretion-area judgment, not a fact claim.
- INT-06 ARIA pattern: HIGH for the underlying accessibility technique (two independent sources agree); MEDIUM for the exact id-derivation scheme and the title-without-idPrefix edge case, both explicitly left to Claude's Discretion by CONTEXT.md.
- MAINT-01 citation scope: HIGH — every one of the 30 cited sites was independently verified this session by reading both the citing line and the target document/section (or confirming its absence).

**Research date:** 2026-08-08
**Valid until:** This phase's own MAINT-01 finding argues for a short shelf life on any citation this research adds that references `.planning/research/*.md` by path — such citations should be re-verified whenever the next milestone's research pass runs. The PKG-02/INT-05/INT-06 technical findings (Node version behavior, ARIA pattern, exact source line numbers) are stable for at least 30 days absent a source-file refactor.
