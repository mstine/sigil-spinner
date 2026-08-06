# Phase 2: Every Planet, Every Statement - Research

**Researched:** 2026-08-06
**Domain:** Unicode text folding, consecutive-sequence detection, SVG marker geometry, deterministic multi-case test matrices — all within an existing, locked pipe-and-filter pipeline (no new architecture, no new packages)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Repeat marker convention (PATH-02)**
- **D-17:** Consecutive-repeat marker is a **small loop** (circular curl at the cell), not a notch/chevron, and not configurable. — Reversibility: costly — the loop's rendered form becomes part of the visual contract for sigils embedded on live sites; determinism means changing the shape changes output for identical inputs.
- **D-18:** **One loop per extra visit**: a triple repeat (5,5,5) draws two loops at the cell, nested/offset so they're countable. The drawn sigil stays a faithful encoding of the number sequence — every number has a visible consequence.
- **D-19:** When a repeat lands on the start or end cell, **both the boundary marker and the loop render**, with geometry offset for legibility. Nothing is suppressed — same "every fact visible" posture as D-06's nodes.
- **D-20:** Each loop is its **own SVG element with a semantic class** (naming per D-08 taxonomy, e.g. `sigil-loop` — exact name Claude's discretion), independently CSS-stylable like `sigil-start`/`sigil-end`. Repeats are recorded as data in the PathModel and the JSON working. — Reversibility: costly — the class joins the public CSS contract (D-08) and the working schema is a consumed data contract (D-14).

**Y rule (CONS-04)**
- **D-21:** **Y is always a consonant** — kept unless struck as a repeat. This is current `normalize()` behavior promoted to a documented rule: cited in code (replacing the Phase 1 "deferred to CONS-04" comment) and stated in the README, with test vectors (e.g. RHYTHM, YES).

**Non-ASCII / accents (CONS-04)**
- **D-22:** Accented Latin letters **fold to their base letter** via Unicode decomposition (NFD, strip combining marks): É→E (then struck as vowel), Ñ→N (kept as consonant). README rule: "accents are ignored; the base letter is used" — matching hand derivation.
- **D-23:** Non-decomposable Latin letters use a **small explicit transliteration map**: ß→SS, Æ→AE, Œ→OE, Ø→O, Þ→TH, Ð→D. The map is a documented literal table in code and README — the citable rule, same posture as the kamea data lock.
- **D-24:** **Non-Latin script letters** (Greek, Cyrillic, Hebrew, CJK, …) are **struck as `non-letter`** and recorded in the struck trail — consistent with digits/punctuation. A fully non-Latin statement reduces to zero and hits E_EMPTY_SEQUENCE (which names the cause per D-26). No dedicated non-Latin error.
- **D-25:** The working **records both the original character and its folded form** (É→E) on kept and struck entries, so a teaching page can narrate exactly what happened to every character. — Reversibility: costly — extends the working schema, which is a consumed data contract (D-14); removing the fields later breaks consumers.

**Degenerate inputs (CONS-03)**
- **D-26:** The empty-reduction error (E_EMPTY_SEQUENCE) carries **a human message with strike counts** ("all 9 characters struck: 5 vowels, 2 repeats, 2 non-letters") **and the structured struck list on the error object** — CLI users read the message, programmatic consumers introspect the data. Builds on D-15's stable-code contract.
- **D-27:** A single-letter sigil renders **both the start circle and end crossbar at its one cell**, geometry offset for legibility. Every sigil has a uniform anatomy: a start and an end, even when they coincide.

### Claude's Discretion

- Exact loop geometry (radius, offset direction, nesting spacing for multi-repeats) within the fixed 100×100 viewBox — consistent with Phase 1's marker-geometry discretion.
- Exact semantic class name for the loop element (within the D-08 BEM-ish taxonomy).
- Exact working field names for repeat/fold data — honor D-18/D-25 content; shape is planner/executor's call (mirrors D-14 discretion).
- How the transliteration map and fold logic are structured in `src/text/` — must respect the ARCHITECTURE.md boundary (text layer knows nothing of numbers/kameas).
- Determinism snapshot suite structure (INT-03) — which statements × planets × options matrix, so long as all seven planets are covered.
- Whitespace-only and empty-string statement edge handling — existing E_MISSING_STATEMENT / E_EMPTY_SEQUENCE plumbing covers these; exact boundary is planner's call.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope. (Phase 1's deferred Skinner/Golden Dawn kamea sets remain on the backlog, untouched by this phase.)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-------------------|
| KAMEA-02 | User can select any of the seven classical planets; number sequence maps to cells via direct 1–9 cell lookup on the chosen kamea | Already generically implemented (`cellForNumber`/`gridSize` in `src/data/kamea.js`, `PLANET_ORDER` at line 72) — this phase's work is a seven-planet determinism/snapshot test matrix (see Code Examples, Architectural Responsibility Map) proving success criterion 1 ("seven visibly distinct sigils"), not new construction |
| PATH-02 | Consecutive repeat numbers produce the traditional loop/notch marker at that cell (triggered only on consecutive repeats, not any recurrence) | Pattern 2 (independent repeat-detection pass over `numbers[]` inside `buildPath()`), Pattern 3 (coincident-marker geometry), Pitfall 2 (letters-vs-numbers), Code Examples (`detectRepeats`, loop-marker `<path>` technique) |
| CONS-03 | Degenerate inputs are handled with defined behavior — empty result produces a clear error; single-letter result produces a valid single-node sigil | Code Examples (`SigilError` `details` extension + strike-count message for D-26), Pattern 3 / D-27 (coincident start+end marker for single-letter sigils) |
| CONS-04 | Non-ASCII/accented letters and Y-handling follow a documented, deterministic rule cited in code and README | Pattern 1 (origin-tracked fold-then-classify), Pitfalls 1/3/4/6 (whole-string folding, `ß`/`ẞ` asymmetry, non-decomposable letters, astral characters), recommended literal transliteration map table |
| INT-03 | Identical input always produces byte-identical output (determinism verified by snapshot tests across all seven planets) | Code Examples (`describe.each` seven-planet matrix, test-context `expect` guidance for parameterized snapshot tests) |
| INT-04 | Input validation lives in the library (not the CLI), so programmatic consumers get identical guarantees and clear errors | Already structurally satisfied since Phase 1 (Anti-Pattern 3 enforced) — Architectural Responsibility Map confirms all Phase 2 validation additions (fold edge cases, enriched E_EMPTY_SEQUENCE) land in `src/generate.js`/`src/text/`, never `bin/sigil-spinner.js` |
</phase_requirements>

## Summary

Phase 2 is almost entirely an extension of code that already exists and already works generically. `generate.js`, `data/kamea.js`, `path/buildPath.js`, and `render/svg.js` are already planet-parameterized — KAMEA-02 is largely a **verification and test-coverage** task, not new construction. The real net-new work is: (1) a text-folding step ahead of the existing `normalize()` classification loop (CONS-04), (2) a consecutive-repeat detection pass over the **number** sequence, independent of the existing letter-dedup pass (PATH-02, per Pitfall 7), (3) a small new SVG marker layer for the repeat loop, geometrically consistent with the existing shape-only marker convention (D-05), (4) enrichment of the existing `SigilError`/`E_EMPTY_SEQUENCE` throw site with structured strike-count data (CONS-03/D-26), and (5) widening the existing determinism suite into a full seven-planet matrix (INT-03).

Every discrete Unicode-folding claim in this document was verified by running Node 24 directly this session, not recalled from training memory — this matters because two of the six D-23 transliteration-map letters (ß and its rarely-used capital ẞ) interact with JavaScript's native `toUpperCase()` in a way that is easy to get subtly wrong if the fold and uppercase steps are ordered carelessly (see Common Pitfalls).

**Primary recommendation:** Add a single new `src/text/fold.js` module that runs **character-by-character** over the raw statement (never over a whole-string-NFD'd copy — that breaks index provenance), applies the six-entry literal transliteration map first, falls back to NFD-decompose-and-strip for any other accented Latin letter, and returns per-character `{ original, originalIndex, folded }` records that `normalize()` consumes instead of iterating the raw string directly. Detect consecutive-repeats as a new pass inside `buildPath()` over the final `numbers` array (`numbers[i] === numbers[i-1]`), not inside `normalize()`. Render the loop as a small `<path>` open-arc ("hook") element with class `sigil-loop`, using the same `cellSize`/`roundGeometry`/`perpendicularUnit` machinery `render/svg.js` already has for `sigil-end`.

## Architectural Responsibility Map

> This project is a single-tier pure-computation library + thin CLI (no browser/server/CDN/DB split exists per `.planning/research/ARCHITECTURE.md` — confirmed unchanged this phase). The standard web-tier framework (Browser/SSR/API/CDN/DB) does not apply. The table below maps each Phase 2 capability to *this project's own* pipeline-stage ownership, which serves the same boundary-sanity-checking purpose for the planner.

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Consecutive-repeat detection (number-sequence pass) | Path layer (`src/path/buildPath.js`) | — | Operates on the resolved number sequence, the same input `buildPath` already consumes; must NOT live in `text/normalize.js` (Pitfall 7 — letter-dedup and number-repeat are different concerns) |
| Repeat-loop marker rendering | Render layer (`src/render/svg.js`) | — | Pure markup concern; consumes repeat data already attached to the PathModel, per ARCHITECTURE.md's "no SVG in path builder" anti-pattern |
| Accent folding / transliteration map | Text layer (new `src/text/fold.js`) | — | Zero knowledge of numbers or kamea, same boundary `normalize.js` already respects; must run *before* `normalize()`'s classification loop |
| Y-as-consonant rule (documentation only) | Text layer (`src/text/normalize.js`) | Docs (README) | Behavior already implemented (D-21 promotes existing behavior to a cited rule) — no code change, comment + README only |
| Non-Latin script strike handling | Text layer (`src/text/normalize.js`) | — | Reuses the existing `non-letter` strike branch unchanged; folding produces only A-Z or nothing, so anything else already falls through correctly |
| Working-schema fold/repeat fields | Render/serialize layer (`src/render/json.js`) | Path + Text layers (data origin) | `toWorking()` is a thin serializer (ARCHITECTURE.md: "computes nothing itself") — new fields are read-throughs from `buildPath`/`normalize` output, not computed here |
| Degenerate-input error enrichment (D-26) | Orchestrator/Error layer (`src/generate.js`, `src/errors.js`) | — | The `E_EMPTY_SEQUENCE` throw site already lives in `generate.js`; enrichment extends `SigilError`, not the CLI (INT-04) |
| Single-letter dual-marker anatomy (D-27) | Render layer (`src/render/svg.js`) | — | Reuses/extends the existing `startMarker`/`endMarker` coincident-geometry problem already partially solved by `endMarker`'s zero-length-vector fallback |
| Seven-planet exercise (KAMEA-02) | Test layer (`test/`) | Data layer (already correct, `src/data/kamea.js`) | No production code change — `cellForNumber`/`gridSize`/`generateSigil` are already planet-generic; this is coverage, not construction |
| Determinism matrix (INT-03) | Test layer (`test/determinism.test.js`) | — | Widen existing byte-equality assertions across all seven planets, not new determinism machinery |
| CLI/library identical errors (INT-04) | Orchestrator layer (`src/generate.js`) | CLI layer (`bin/sigil-spinner.js`, unchanged) | Already structurally satisfied (Anti-Pattern 3 enforced since Phase 1) — verification, not new work |

## Package Legitimacy Audit

**Not applicable — this phase introduces zero new npm packages.** All Phase 2 work uses built-in ECMAScript/Node facilities already available in the locked stack:
- `String.prototype.normalize('NFD')` — built into the JS engine, no package [VERIFIED: ran in Node 24.4.1 this session]
- Unicode property escapes (`/\p{M}/gu`, `/\p{Script=Latin}/u`) — native `RegExp` `u`-flag feature, ES2018+, no package [VERIFIED: ran in Node 24.4.1 this session, both patterns matched/executed without error]
- `vitest`'s existing `describe.each`/`test.each`/`describe.for`/`test.for` and `toMatchSnapshot`/`toMatchFileSnapshot` — already a locked dev dependency (`vitest@^4.1.10`, confirmed installed via `package.json` this session), no new package needed for the seven-planet test matrix

No `Package Legitimacy Audit` table is produced because there is nothing to audit. If a future phase reconsiders `d3-path`/`d3-shape` for curve rendering (Phase 3 concern per `.claude/CLAUDE.md`, not this phase), run the full gate at that time.

## Architecture Patterns

### System Architecture Diagram

```
                              statement (raw string)
                                      │
                        ┌─────────────▼──────────────┐
                        │  src/text/fold.js  (NEW)    │   per-original-character:
                        │  1. literal map lookup      │   { original, originalIndex,
                        │     (ß,ẞ,Æ,æ,Œ,œ,Ø,ø,Þ,þ,Ð,ð)│     folded }  0/1/2 folded
                        │  2. else NFD + strip marks   │     chars per original char
                        └─────────────┬───────────────┘
                                      │ folded-char stream (with origin refs)
                        ┌─────────────▼──────────────┐
                        │ src/text/normalize.js       │   existing loop, now iterates
                        │ (EXTENDED)                  │   the folded stream instead of
                        │ vowel / repeat / non-letter │   the raw uppercased string;
                        │ classification, unchanged   │   kept/struck entries carry
                        │                              │   {original, folded} (D-25)
                        └─────────────┬───────────────┘
                                      │ kept letters (A-Z), struck (+ reasons + origin)
                        ┌─────────────▼──────────────┐
                        │ data/pythagorean.js          │   unchanged
                        └─────────────┬───────────────┘
                                      │ numbers[] (1-9 per kept letter)
                        ┌─────────────▼──────────────┐
                        │ data/kamea.js  cellForNumber │   unchanged — already
                        │                              │   planet-generic (KAMEA-02)
                        └─────────────┬───────────────┘
                                      │ cells[]
                        ┌─────────────▼──────────────┐
                        │ path/buildPath.js (EXTENDED) │   NEW: independent pass —
                        │ existing point/segment build │   for i>=1, numbers[i]===
                        │ + repeat-detection pass       │   numbers[i-1] → repeat event
                        │  (Pitfall 7 — on NUMBERS,      │   attached to PathModel
                        │   not on letters/text)         │   (new `repeats` array)
                        └─────────────┬───────────────┘
                                      │ PathModel { points, segments, repeats, start, end }
                         ┌────────────┼────────────┐
                         ▼                         ▼
              ┌────────────────────┐   ┌────────────────────┐
              │ render/svg.js       │   │ render/json.js      │
              │ (EXTENDED)          │   │ (EXTENDED)           │
              │ + loopLayer():       │   │ + repeats[], folds   │
              │   1 <path class=     │   │   fields — pure       │
              │   "sigil-loop"> per  │   │   read-through, no     │
              │   repeat event,      │   │   computation          │
              │   nested/offset for  │   │                        │
              │   3+ repeats (D-18)  │   │                        │
              └────────────────────┘   └────────────────────┘
                         │                         │
                         └───────────┬─────────────┘
                                     ▼
                          generate.js orchestrator
                          (EXTENDED: E_EMPTY_SEQUENCE
                           now carries strike-count
                           message + structured data
                           per D-26)
```

### Recommended Project Structure

```
src/
├── text/
│   ├── fold.js          # NEW — accent/transliteration folding, char-by-char, origin-tracked
│   └── normalize.js     # EXTENDED — consumes fold.js output instead of raw string
├── path/
│   └── buildPath.js     # EXTENDED — adds independent consecutive-repeat detection pass
├── render/
│   ├── svg.js           # EXTENDED — adds loopLayer(), extends startMarker/endMarker
│   │                    #   for coincident-marker offset (D-19, D-27)
│   └── json.js          # EXTENDED — adds fold/repeat fields, still zero computation
├── errors.js             # EXTENDED — SigilError gains an optional `details` payload
└── generate.js           # EXTENDED — E_EMPTY_SEQUENCE throw enriched (D-26)
test/
├── text/
│   ├── fold.test.js      # NEW
│   └── normalize.test.js # EXTENDED — accent/Y/non-Latin vectors
├── path/
│   └── buildPath.test.js # EXTENDED — repeat-detection vectors (Pitfall 7 cases)
├── render/
│   └── svg.test.js       # EXTENDED — loop marker, coincident-marker vectors
└── determinism.test.js   # EXTENDED — seven-planet matrix (INT-03)
```

### Pattern 1: Origin-Tracked Character Folding (fold-before-classify)

**What:** A dedicated per-character fold step runs *before* the existing kept/struck classification loop, producing a flat stream of `{ original, originalIndex, folded }` records — where `folded` is a string of 0, 1, or 2 output characters (0 only in pathological inputs; 1 for the common case; 2 for the six expandable transliteration-map letters: `ß→SS`, `Æ→AE`, `Œ→OE`, `Ø→O`→ actually 1 char, `Þ→TH`, `Ð→D`→ 1 char — see exact map below). `normalize()` then iterates this stream instead of the raw string, classifying each *folded* character exactly as it does today, while still being able to report the *original* character/index for the working (D-25).

**When to use:** Any statement containing a character outside plain `A-Z` after `.toUpperCase()`.

**Why not fold the whole string first:** Calling `statement.normalize('NFD')` (or applying the literal map) on the *entire string* and then iterating the result by index silently breaks the original-index provenance D-25 requires, because NFD decomposition and the two-character map entries **change the string's length** relative to the original. A naive "fold whole string, then loop with the same index variable" implementation will misattribute struck/kept entries to the wrong original character the moment any fold produces a different length than 1. Fold **per original character**, in a loop over the *original* string, and only then hand each character's folded output (however many code units it is) to the classifier.

**Example (verified this session — Node 24.4.1):**
```js
// VERIFIED: ran in Node 24.4.1 this session
'é'.normalize('NFD')   // → "é" (2 code units: base + combining acute)
'ñ'.normalize('NFD')   // → "ñ"
'ß'.normalize('NFD')   // → "ß" (UNCHANGED — sharp s has no canonical NFD decomposition)
'Æ'.normalize('NFD')   // → "Æ" (UNCHANGED — no canonical decomposition)
'ß'.toUpperCase()      // → "SS"  (JS engine's built-in special-casing already does this!)
'ẞ'.toUpperCase()      // → "ẞ"  (the rare CAPITAL sharp s does NOT map to "SS" via toUpperCase)
```

This is the concrete reason D-23's map must be applied **explicitly and symmetrically for both cases** (`ß` and `ẞ`), rather than relying on `toUpperCase()` to handle the lowercase form "for free" — that reliance would work for `ß` but silently fail for the rarely-typed capital `ẞ`, an inconsistency that would only surface on that one specific input and is exactly the kind of asymmetry a citable rule table (D-23) is meant to prevent.

**Recommended literal map** (apply before/independent of native `toUpperCase()`, case-sensitive on both members of each pair):

| Input | Folded | Input | Folded |
|-------|--------|-------|--------|
| `ß` | `SS` | `ẞ` | `SS` |
| `æ` | `AE` | `Æ` | `AE` |
| `œ` | `OE` | `Œ` | `OE` |
| `ø` | `O` | `Ø` | `O` |
| `þ` | `TH` | `Þ` | `TH` |
| `ð` | `D` | `Ð` | `D` |

[VERIFIED: ran `.normalize('NFD')` and `.toUpperCase()` on all twelve characters above plus é/É/ñ/Ñ/ü/à/ç in Node 24.4.1 this session — table entries reflect actual runtime output, not recalled Unicode-decomposition-chart knowledge]

### Pattern 2: Independent Consecutive-Repeat Pass Over the Number Sequence (not the letter sequence)

**What:** `buildPath()` gains a second, independent computation alongside its existing point/segment construction: iterate the incoming `numbers` array and record every index `i >= 1` where `numbers[i] === numbers[i - 1]`. This is Pitfall 7's core guidance, and it is directly testable against the codebase's own `test/text/normalize.test.js` fixture: the existing test `'strikes a cross-letter number collision source (two different letters) independently'` (line 54-60) already proves `normalize('BK')` keeps *both* letters (`['B', 'K']`) — meaning `toPythagoreanDigit('B')` and `toPythagoreanDigit('K')` can and do collide at the number level even though letter-dedup let both through. [VERIFIED: test/text/normalize.test.js:54-60, quoted: `const { kept } = normalize('BK'); expect(kept).toEqual(['B', 'K']);`]

**When to use:** Inside `buildPath`, after points are built, before returning the PathModel. Do not implement this inside `normalize.js` — that module has (correctly) zero knowledge of numbers (ARCHITECTURE.md boundary), and Pitfall 7 exists specifically because letter-repeat and number-repeat are different questions.

**Recommended PathModel extension:**
```js
// Recommended shape — Claude's/planner's discretion per CONTEXT.md
{
  // ...existing points, segments, start, end...
  repeats: [
    { atPoint: 5, count: 1 },   // one extra loop at points[5] (a double)
    { atPoint: 9, count: 2 },   // two extra loops at points[9] (a triple, D-18)
  ]
}
```
For a run of `k` consecutive equal numbers, emit exactly `k - 1` "extra visit" events total (D-18: "one loop per extra visit"), attached to the *later* point(s) in the run so each loop visually marks a revisit rather than the original visit.

**Boundary interaction (D-19):** If `atPoint === pathModel.start` or `atPoint === pathModel.end`, the loop geometry needs an additional offset beyond the standard nesting offset, since the start-circle or end-crossbar already occupies that cell. Both markers still render — nothing is suppressed (posture stated explicitly in CONTEXT.md's Specific Ideas: "draw every fact, offset geometry for legibility, suppress nothing").

### Pattern 3: Coincident-Marker Geometry (shared by D-19, D-20, D-27)

**What:** Three distinct scenarios in this phase all reduce to the same sub-problem — two or more marker shapes need to render at the *same* `(x, y)` cell center without visually merging into an unreadable blob:
1. A repeat loop landing on the start/end cell (D-19)
2. Multiple loops for 3+ consecutive repeats, needing to stay "countable" (D-18)
3. A single-letter sigil, where the start circle and end crossbar both sit at the one and only point (D-27)

**Recommended approach:** `render/svg.js` already solves a version of this — `endMarker()`'s `perpendicularUnit(dx, dy)` function (lines 118-124) computes a deterministic perpendicular direction from the incoming segment, and falls back to a fixed `{ x: 1, y: 0 }` when there is no segment to derive one from (the one-point case, lines 139-140). [VERIFIED: src/render/svg.js:118-124,139-140] The same helper and the same zero-length-vector fallback are the natural mechanism for offsetting: the loop marker outward from a coincident node/start/end marker, and each additional nested loop further outward again (incrementing a `LOOP_OFFSET_FRACTION * index` distance along that same perpendicular, consistent with the existing `NODE_RADIUS_FRACTION`/`START_RADIUS_FRACTION`/`END_BAR_LENGTH_FRACTION` constant-fraction-of-`cellSize` pattern already established at src/render/svg.js:25-31).

**Trade-off:** Exact radius/offset/nesting-spacing values are explicitly Claude's/planner's discretion per 02-CONTEXT.md — this pattern only fixes the *mechanism* (reuse `perpendicularUnit` + a new `*_FRACTION` constant), not the exact numbers.

### Anti-Patterns to Avoid

- **Folding the whole statement string before iterating it:** Breaks index provenance the instant any fold changes length (see Pattern 1). Fold per-character, in a loop over the *original* string.
- **Relying on native `toUpperCase()` to handle `ß`/`ẞ`:** Works for lowercase `ß` by accident, silently fails for capital `ẞ`. Use the explicit literal map for both, per D-23.
- **Detecting consecutive repeats on the `kept` letters array instead of the `numbers` array:** Misses cross-letter number collisions entirely (Pitfall 7) — the exact bug class the project's own test suite (`test/text/normalize.test.js:54-60`) already documents as explicitly out of `normalize.js`'s scope.
- **Building the loop marker as complex cubic-Bézier cursive-coil math:** Over-engineering for a fixed 100×100 viewBox at this project's scale. A one- or two-arc `<path>` (per Pattern 3 / Code Examples below) reads as a loop and stays consistent with the codebase's existing "plain shapes, no `<marker>` defs" convention (D-05).
- **Adding a CLI-side check for accented/non-Latin input or degenerate statements:** Anti-Pattern 3 from `.planning/research/ARCHITECTURE.md` — all of Phase 2's new validation belongs in the library (`generate.js`/`text/`), never in `bin/sigil-spinner.js` (INT-04).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Accent/diacritic stripping for arbitrary Latin letters | A hand-maintained table mapping every accented character to its base letter | `str.normalize('NFD')` + strip `/[̀-ͯ]/g` or `/\p{M}/gu` | Built into the JS engine; covers every combining-mark-based accented Latin letter without a maintained table, verified this session to work correctly for é/ñ/ü/à/ç and their uppercase forms |
| Detecting "is this character a letter at all" for non-Latin-script rejection | A hand-built Unicode letter/script table | The existing `NON_LETTER` regex (`[^A-Z]`, applied *after* folding) already does this correctly — anything that isn't a plain A-Z post-fold is struck as `non-letter`, which is exactly D-24's rule | No new logic needed; folding already reduces the problem to "is it A-Z or not" |
| Parameterized test matrices across seven planet variants | Seven near-duplicate test files or seven copy-pasted `it()` blocks | Vitest's `describe.each`/`test.each` (Jest-compatible) or the newer `describe.for`/`test.for` [CITED: vitest.dev via WebSearch this session] | Already the project's test runner (`vitest@^4.1.10`); avoids seven-fold test-file duplication for INT-03's matrix |
| Snapshot comparison / diffing for the seven-planet SVG/JSON matrix | Custom string-diff assertions | Vitest's existing `toMatchSnapshot()`/`toMatchFileSnapshot()`, already used in `test/determinism.test.js` and `test/render/svg.test.js` | Already proven in this codebase (Phase 1); no new tooling needed, just more cases |

**Key insight:** Every "don't hand-roll" item in this phase resolves to "use what the JS engine or the already-installed test runner already provides" — this phase adds zero new external dependencies, consistent with `.claude/CLAUDE.md`'s zero-runtime-dependency constraint.

## Runtime State Inventory

> Not applicable — Phase 2 is pure additive/extension work on existing modules (no rename, no refactor, no migration). Confirmed by reading `src/generate.js`, `src/errors.js`, `src/data/kamea.js`, `src/text/normalize.js`, `src/path/buildPath.js`, `src/render/svg.js`, `src/render/json.js`, `src/render/coords.js` in full this session — none require renaming, and no stored/external/OS-registered state exists for this local, no-I/O CLI+library (confirmed unchanged from Phase 1's own architecture: "no runtime dependencies... no network I/O").

## Common Pitfalls

### Pitfall 1: Whole-String Folding Breaks Original-Index Provenance (new this phase)

**What goes wrong:** If accent-folding is implemented as `statement.normalize('NFD').replace(/[̀-ͯ]/g, '')` applied once to the *entire* statement, and the classification loop then indexes into *that* result while trying to also report "original statement index" for D-25/D-14's struck-entry `index` field, the indices silently stop lining up the moment any character's fold produces a different number of output units than 1 (NFD expansion of an accented letter momentarily creates 2 code units before stripping; the six-entry transliteration map letters expand from 1 input character to 1-2 output characters).

**Why it happens:** It is natural and idiomatic to reach for `wholeString.normalize('NFD').replace(...)` as one line, since that is the standard/documented idiom [CITED: MDN via WebSearch this session] — but that idiom is for *display/search normalization*, not for a pipeline that must preserve a `struck[i].index` back-reference to the *original* statement.

**How to avoid:** Fold character-by-character, in a loop over the *original* (unfolded) string. For each original character, independently: check the literal map first, else NFD-normalize *that single character* and strip its own combining marks. Carry `{ original, originalIndex, folded }` forward into the classification step instead of a flat folded string.

**Warning signs:** A single `.normalize('NFD')` call applied to the whole `statement` variable before any indexed loop; a `struck[i].index` field that was computed by indexing into the post-fold string rather than the pre-fold one.

### Pitfall 2: Consecutive-Repeat Detection on Letters Instead of Numbers

Directly from `.planning/research/PITFALLS.md` Pitfall 7 — restated here because it is the single highest-risk correctness bug in this phase's PATH-02 work. Detection MUST run over `numbers[]` inside `buildPath()`, independent of and after `normalize()`'s letter-level dedup. Test with two different letters mapping to the same digit (the codebase already has the fixture: `normalize('BK')` keeps both letters — feed `['B','K']` → digits and confirm the *number* sequence, not letter sequence, is what repeat-detection inspects). Also test 3+ consecutive repeats and repeats landing on the first/last point.

### Pitfall 3: `ß`/`ẞ` Case Asymmetry in Native `toUpperCase()`

[VERIFIED: ran in Node 24.4.1 this session] `'ß'.toUpperCase()` returns `'SS'` (JS's built-in Unicode special-casing already does this), but `'ẞ'.toUpperCase()` returns `'ẞ'` unchanged — the capital sharp-s does not map to `SS` via native case conversion. An implementation that relies on `normalize.js`'s existing `.toUpperCase()` call to "already handle" `ß` will work by accident for the common lowercase form and silently fail for the rare capital form. The explicit D-23 literal map must cover both `ß` and `ẞ` as separate, case-sensitive keys — do not assume `toUpperCase()` pre-normalizes case before the map runs.

### Pitfall 4: Non-Decomposable Letters Silently Passing Through as "Struck, No Reason Given"

[VERIFIED: ran in Node 24.4.1 this session] `Æ`, `Œ`, `Ø`, `Þ`, `Ð` (and their lowercase forms) do **not** change under `.normalize('NFD')` — there is no combining-mark decomposition for these six letter-forms (they are precomposed ligatures/letters-with-stroke, not base+diacritic pairs). An implementation that folds *only* via NFD+strip (correct for é/ñ/ü/à/ç) and forgets the explicit D-23 map will pass these six letters straight through to the `NON_LETTER` check unchanged, where they get struck as `non-letter` — which is a plausible-looking but *wrong* result (D-23 requires they fold to `SS`/`AE`/`OE`/`O`/`TH`/`D` and then classify normally as consonant/vowel, not get struck outright).

**Warning signs:** No test statement containing `ß`, `Æ`, `Œ`, `Ø`, `Þ`, or `Ð`; a fold implementation with only one strategy (NFD-strip) and no literal-map branch.

### Pitfall 5: Loop-Marker Geometry Silently Duplicating or Suppressing Existing Nodes

D-06 (Phase 1, unchanged) already draws a `circle.sigil-node` at *every* visited cell, including revisits — the new `sigil-loop` element is an *addition* alongside the existing node at a repeated cell, never a replacement for it. An implementation that "notices" a repeat and decides to draw only one node instead of the existing per-visit nodes would silently violate D-06's already-locked, already-tested behavior (`test/render/svg.test.js:29-32`, quoted: `'emits exactly five sigil-node elements, including both at the twice-visited cell'`). [VERIFIED: test/render/svg.test.js:29-32]

### Pitfall 6: Astral (Surrogate-Pair) Characters Split by Simple Index Iteration

[VERIFIED: ran in Node 24.4.1 this session] `normalize.js`'s current loop (`for (let index = 0; index < upper.length; index += 1)`) walks UTF-16 code *units*, not Unicode code *points*. All of the non-Latin scripts D-24 explicitly names (Greek, Cyrillic, Hebrew, CJK common characters) are single-UTF-16-unit (Basic Multilingual Plane) and are handled correctly today — confirmed by testing `Я`, `Ω`, `א`, `你` all report `.length === 1` this session. However, any *astral* character (rare CJK Extension B+ ideographs, all emoji) is a surrogate *pair* (`.length === 2`), and the current simple-index loop would split it into two lone-surrogate "characters," each independently struck as `non-letter` with a technically-invalid half-character in the struck entry. This is a low-priority edge case for an intention-statement tool (out of D-24's explicitly named scripts) but worth one defensive test case given the phase's "trustworthy sigil or a clear error" goal — a lone surrogate should not crash the pipeline or corrupt the struck trail.

## Code Examples

### Fold-then-classify pipeline structure (recommended shape — ASSUMED, not a locked decision; ordering and map are grounded in this session's Node verification)

```js
// src/text/fold.js (recommended new module)
const TRANSLITERATION_MAP = {
  'ß': 'SS', 'ẞ': 'SS',
  'æ': 'AE', 'Æ': 'AE',
  'œ': 'OE', 'Œ': 'OE',
  'ø': 'O',  'Ø': 'O',
  'þ': 'TH', 'Þ': 'TH',
  'ð': 'D',  'Ð': 'D',
};

const COMBINING_MARKS = /[̀-ͯ]/g; // [CITED: MDN diacritic-stripping idiom]

/**
 * @param {string} statement
 * @returns {{ original: string, originalIndex: number, folded: string }[]}
 */
function foldStatement(statement) {
  const chars = [...statement]; // code-point aware — avoids Pitfall 6
  return chars.map((original, originalIndex) => {
    if (original in TRANSLITERATION_MAP) {
      return { original, originalIndex, folded: TRANSLITERATION_MAP[original] };
    }
    const folded = original.normalize('NFD').replace(COMBINING_MARKS, '');
    return { original, originalIndex, folded };
  });
}
```

### Consecutive-repeat detection (recommended shape — inside `buildPath`)

```js
// Independent pass over the NUMBER sequence, per Pitfall 7 — never over `kept` letters.
function detectRepeats(numbers) {
  const repeats = [];
  let runLength = 1;
  for (let i = 1; i <= numbers.length; i += 1) {
    if (i < numbers.length && numbers[i] === numbers[i - 1]) {
      runLength += 1;
      continue;
    }
    if (runLength > 1) {
      repeats.push({ atPoint: i - 1, count: runLength - 1 }); // D-18: one loop per extra visit
    }
    runLength = 1;
  }
  return repeats;
}
```

### Loop marker as an open arc (SVG technique — [CITED: MDN / Smashing Magazine via WebSearch this session])

```js
// Recommended technique, exact radius/offset left to implementation discretion:
// a single elliptical-arc command draws an open "hook" that reads as a loop
// without closing back to its own start point (distinct from the closed
// sigil-start circle).
// M startX,startY A radiusX,radiusY 0 1,1 endX,endY
`<path class="sigil-loop" d="M${x1},${y1} A${r},${r} 0 1,1 ${x2},${y2}" ` +
  `stroke="var(--sigil-marker-stroke, currentColor)" stroke-width="var(--sigil-stroke-width, 2)" fill="none" />`
```

### Seven-planet determinism/snapshot matrix (Vitest 4 pattern — [CITED: vitest.dev via WebSearch this session])

```js
import { describe, expect, it } from 'vitest';
import { generateSigil } from '../src/index.js';

const PLANETS = ['saturn', 'jupiter', 'mars', 'sun', 'venus', 'mercury', 'moon']; // [VERIFIED: src/data/kamea.js:72 — quoted: `['saturn', 'jupiter', 'mars', 'sun', 'venus', 'mercury', 'moon']`]
const STATEMENT = 'I WILL SUCCEED';

describe.each(PLANETS)('determinism matrix — %s', (planet) => {
  it('produces byte-identical SVG across two calls', () => {
    const first = generateSigil(STATEMENT, planet);
    const second = generateSigil(STATEMENT, planet);
    expect(first.svg).toBe(second.svg);
  });

  it('matches its own committed file snapshot', async ({ expect: localExpect }) => {
    // Use the test-context expect for snapshot assertions inside a
    // parameterized/concurrent suite, per Vitest guidance, so the snapshot
    // name resolves to the correct per-planet case.
    const { svg } = generateSigil(STATEMENT, planet);
    await localExpect(svg).toMatchFileSnapshot(`./__file_snapshots__/matrix-${planet}.svg`);
  });
});

it('produces seven visibly distinct sigils for the same statement (success criterion 1)', () => {
  const svgs = PLANETS.map((planet) => generateSigil(STATEMENT, planet).svg);
  expect(new Set(svgs).size).toBe(PLANETS.length);
});
```

### Error enrichment for E_EMPTY_SEQUENCE (D-26 — recommended `SigilError` extension)

```js
// src/errors.js — extend the constructor with an optional details payload,
// keeping the existing (code, message) call sites unchanged elsewhere.
export class SigilError extends Error {
  constructor(code, message, details) {
    super(message);
    this.name = 'SigilError';
    this.code = code;
    if (details !== undefined) this.details = details;
  }
}

// src/generate.js — at the existing E_EMPTY_SEQUENCE throw site:
const counts = struck.reduce((acc, s) => {
  acc[s.reason] = (acc[s.reason] ?? 0) + 1;
  return acc;
}, {});
const summary = Object.entries(counts)
  .map(([reason, n]) => `${n} ${reason}${n === 1 ? '' : 's'}`)
  .join(', ');
throw new SigilError(
  E_EMPTY_SEQUENCE,
  `Statement reduced to zero kept letters: all ${struck.length} characters struck (${summary}).`,
  { struck },
);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| Jest's `describe.each`/`test.each` as the only parameterized-test API | Vitest 4 also offers `describe.for`/`test.for` with simplified argument typing | Vitest 4.x (current locked version) | Either API works for the seven-planet matrix; `for` variants are newer and slightly less magic about array-spreading, `each` remains fully supported for Jest-migration familiarity |

**Deprecated/outdated:** Nothing in this phase's scope is deprecated — this is greenfield extension of a Phase-1-locked pipeline, not a migration.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Recommended fold-then-classify architecture (new `src/text/fold.js` module, per-character `{original, originalIndex, folded}` records) | Architecture Patterns, Pattern 1 | Low — this is Claude's/planner's explicit discretion per 02-CONTEXT.md ("How the transliteration map and fold logic are structured... must respect the ARCHITECTURE.md boundary" is discretion, not a locked decision); the underlying Node/Unicode behavior it's built on is VERIFIED, only the module shape is a recommendation |
| A2 | Recommended `repeats: [{ atPoint, count }]` PathModel field shape | Architecture Patterns, Pattern 2 | Low — CONTEXT.md explicitly marks "exact working field names for repeat/fold data" as discretion; any shape carrying D-18's content (count of extra visits per cell) satisfies the decision |
| A3 | Recommended open-arc `<path class="sigil-loop">` technique for the loop marker, rather than a closed circle or Bézier-based coil | Architecture Patterns, Pattern 3; Code Examples | Low-Medium — exact geometry is explicit Claude's-discretion per CONTEXT.md, but choosing a *closed* shape or a heavier Bézier approach instead would still satisfy D-17/D-20's "own SVG element with a semantic class" requirement; only the specific visual read of "loop" vs. "circle" could differ from what a human reviewer expects on sign-off |
| A4 | `SigilError` constructor extended with an optional third `details` parameter (rather than setting `.details`/`.struck` as a property after construction) | Code Examples | Low — either approach satisfies D-26's "structured struck list on the error object"; the constructor-parameter form is a style recommendation only |
| A5 | Astral-character (surrogate-pair) handling flagged as a defensive test case, not a required behavior change | Common Pitfalls, Pitfall 6 | Low — D-24 only names BMP scripts (Greek/Cyrillic/Hebrew/CJK), all verified single-code-unit this session; if a future statement legitimately needs emoji/rare-ideograph support, the current simple-index loop would need to switch to code-point iteration (`[...string]`), a small, contained fix |

## Open Questions (RESOLVED)

1. **Should the loop marker's geometry constants live in `render/svg.js` alongside `NODE_RADIUS_FRACTION`/`START_RADIUS_FRACTION`/`END_BAR_LENGTH_FRACTION`, or in a new sub-module?**
   - What we know: the existing three geometry constants (src/render/svg.js:25-31) all live as top-level module constants in `svg.js` itself, with no separate `render/svg/` subdirectory yet created despite `.planning/research/ARCHITECTURE.md`'s recommended structure showing one (`render/svg/markers.js` etc.) — Phase 1 did not split into that structure.
   - What's unclear: whether Phase 2 should introduce the `render/svg/` split now (as ARCHITECTURE.md's recommended structure anticipates) or continue flat-file `svg.js` growth for one more phase.
   - RESOLVED: Continue flat (add `loopLayer()` as a new function in the existing `svg.js`, matching `pathLayer`/`nodeLayer`/`startMarker`/`endMarker`'s existing pattern) — Phase 3 (which adds grid + glyph layers, explicitly larger in scope) is the more natural point to introduce the `render/svg/` directory split, since it adds two more layers on top of Phase 2's one.

2. **Does D-25's "record both original character and folded form" apply per-original-character or per-folded-character for the two-character expansions (ß→S,S)?**
   - What we know: D-25 says the working "records both the original character and its folded form... on kept and struck entries" — for a single input `ß` that expands to two classified letters (first S kept, second S struck as repeat, per the existing global-dedup `seen` Set logic), both derived entries plausibly need to point back to the same one original `ß` and its one original index.
   - What's unclear: whether the working should show `ß` twice (once per derived S) or represent the one-to-two expansion as a single working entry with two children.
   - RESOLVED: Simplest-first — attach `{original: 'ß', originalIndex: N}` to *both* derived S entries (kept and struck alike); this keeps the working schema flat (an array of per-classified-character entries, consistent with the existing `struck`/`kept` shapes) rather than introducing a nested structure, and still lets a teaching page narrate "ß became S, S — the first S was kept, the second struck as a repeat" from two flat entries sharing one `originalIndex`.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Entire runtime, `String.prototype.normalize`, Unicode property escapes | ✓ | v24.4.1 [VERIFIED: ran `node --version` this session] | — |
| Vitest | Seven-planet determinism/snapshot matrix (INT-03), all test work | ✓ | 4.1.10 [VERIFIED: ran `npx vitest --version` this session, matches `package.json`'s `^4.1.10`] | — |
| npm scripts (`test`, `typecheck`, `lint`) | CI/local verification loop | ✓ | unchanged from Phase 1 (`package.json` scripts: `vitest run`, `tsc --allowJs --checkJs --noEmit`, `eslint .`) [VERIFIED: read package.json this session] | — |

**Missing dependencies with no fallback:** None.
**Missing dependencies with fallback:** None — this phase needs nothing beyond what Phase 1 already established and locked.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-------------------|
| V2 Authentication | No | No auth surface exists or is added — local CLI/library, no accounts |
| V3 Session Management | No | No sessions — stateless pure-function calls |
| V4 Access Control | No | No access boundaries — single-user local tool |
| V5 Input Validation | Yes | Existing pattern (unchanged posture): validation lives in the library (`generate.js`/`text/`), never the CLI (Anti-Pattern 3, INT-04). Phase 2 extends this to Unicode-fold edge cases — malformed/lone-surrogate input, zero-length statements, and the six explicit transliteration-map characters must all resolve to either a valid sigil or a `SigilError`, never an uncaught exception or `undefined` propagating downstream |
| V6 Cryptography | No | No cryptographic operations in this or any phase — pure text/geometry transform |
| V12 Files and Resources | Partial | `--output <file>` writes (Phase 1, unchanged this phase) remain non-atomic and documented as such; Phase 2 adds no new file I/O |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|----------------------|
| Regex catastrophic backtracking (ReDoS) via crafted statement input | Denial of Service | The fold/classification regexes recommended in this research (`/[̀-ͯ]/g`, `/\p{M}/gu`, the existing `NON_LETTER`/`VOWELS` character-class regexes) are all simple bracket/property-class matches with no nested quantifiers or alternation — not ReDoS-prone. Keep any new regex in this family (character classes only); avoid introducing nested-quantifier patterns for any future text-processing addition |
| "Zalgo text" — statements with an unbounded number of stacked combining marks per base character | Denial of Service (resource exhaustion) | The recommended per-character fold strips all combining marks for a given base character in one bounded regex pass (`O(marks)`, no combinatorial blowup) — no additional mitigation needed, but include one stress-test statement with many stacked combining marks on a single base letter to confirm no performance cliff, since this is untested territory for the current codebase |
| XML/markup injection via the optional `<title>` element (D-16, Phase 1, unchanged) | Tampering | Already mitigated — `escapeXml()` (src/render/escapeXml.js) runs on the statement before embedding it in `<title>`; Phase 2 adds no new raw-text-into-SVG paths (loop markers are pure geometry, no text content) |
| Unicode homograph/confusable-character ambiguity (visually similar sigils from different raw inputs that fold to the same letters) | Repudiation (weak, not a real project risk) | Not a security boundary for this tool — determinism (INT-03) is the actual contract, and it is explicitly *desired* that visually-similar inputs (e.g. `café` vs `CAFE`) fold identically; no mitigation needed, noting only to avoid mis-scoping this as a vulnerability during review |

## Sources

### Primary (HIGH confidence)
- `src/text/normalize.js`, `src/path/buildPath.js`, `src/errors.js`, `src/generate.js`, `src/render/svg.js`, `src/render/json.js`, `src/render/coords.js`, `src/data/kamea.js`, `src/data/pythagorean.js`, `bin/sigil-spinner.js`, `src/index.js` — read in full this session; all quoted claims cite exact line ranges
- `test/text/normalize.test.js`, `test/path/buildPath.test.js`, `test/render/svg.test.js`, `test/cli/cli.test.js`, `test/determinism.test.js` — read in full this session; existing coverage and gaps informed the Common Pitfalls and Code Examples sections
- Node 24.4.1 runtime behavior for `.normalize('NFD')`, `.toUpperCase()`, and Unicode property escapes on 19 test characters — executed directly via `node -e` this session (not recalled from training data)
- `.planning/research/PITFALLS.md`, `.planning/research/ARCHITECTURE.md`, `.planning/phases/01-first-sigil-end-to-end/01-CONTEXT.md`, `.planning/phases/02-every-planet-every-statement/02-CONTEXT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/STATE.md`, `.claude/CLAUDE.md`, `package.json` — read in full this session

### Secondary (MEDIUM confidence)
- [MDN — SVG Paths tutorial](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths) — via WebSearch this session, corroborates elliptical-arc (`A`) command syntax for loop/hook geometry
- [Vitest — Writing Tests guide](https://vitest.dev/guide/learn/writing-tests.html) and [Vitest describe API](https://vitest.dev/api/describe) — via WebSearch this session, corroborates `describe.each`/`describe.for` parameterized-test pattern and test-context `expect` guidance for snapshot assertions inside parameterized suites
- [Tomas Listiak — Removing diacritics in JavaScript](https://listiak.dev/blog/removing-diacritics-in-javascript-universal-solution) — via WebSearch this session, corroborates the `normalize('NFD')` + combining-mark-strip idiom independently of this session's own Node verification

### Tertiary (LOW confidence)
- None — every claim in this document is either read directly from repository source this session, executed directly in Node this session, or corroborated by an official-documentation source (MDN, vitest.dev) surfaced via WebSearch.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new packages; the only "stack" question (Node/Vitest versions) was directly verified via `node --version`/`npx vitest --version` this session
- Architecture: HIGH — extends an existing, already-implemented, already-tested pipeline; every extension point was located by reading the actual source this session, not inferred
- Unicode-folding correctness details (D-22/D-23 interaction, `ß`/`ẞ` asymmetry, NFD non-decomposition of the six ligature/stroke letters): HIGH — verified by direct Node execution this session, not recalled
- Pitfalls: HIGH — Pitfall 7 (cross-letter number collision) is directly grounded in an existing, already-passing test in this codebase; the two Unicode pitfalls (whole-string folding, `ß`/`ẞ` asymmetry) are grounded in this session's Node verification
- Loop-marker exact geometry: MEDIUM — the *mechanism* (reuse `perpendicularUnit`, arc-based `<path>`) is well-grounded, but exact radius/offset/nesting values are explicit CONTEXT.md discretion, not researchable facts

**Research date:** 2026-08-06
**Valid until:** No external time-decay risk — this phase adds zero new packages and extends locked, already-tested internal code; re-research only needed if the underlying Node/Vitest versions change or if 02-CONTEXT.md's decisions are revisited
