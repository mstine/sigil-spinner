# Phase 2: Every Planet, Every Statement - Context

**Gathered:** 2026-08-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Any of the seven classical planets and any statement — including the degenerate and the accented ones — produce either a trustworthy sigil or a clear, actionable error, identically from library and CLI. Covers KAMEA-02, PATH-02, CONS-03, CONS-04, INT-03, INT-04. All seven kameas were already locked and tested in Phase 1 (D-02/D-03), so planet selection is largely exercising and verifying existing data across the full render pipeline, not building new data. Curve rendering, grid/glyph layers, custom-property theming, and multi-embed id safety belong to Phase 3.

</domain>

<decisions>
## Implementation Decisions

### Repeat marker convention (PATH-02)
- **D-17:** Consecutive-repeat marker is a **small loop** (circular curl at the cell), not a notch/chevron, and not configurable. — **Reversibility:** costly — the loop's rendered form becomes part of the visual contract for sigils embedded on live sites; determinism means changing the shape changes output for identical inputs.
- **D-18:** **One loop per extra visit**: a triple repeat (5,5,5) draws two loops at the cell, nested/offset so they're countable. The drawn sigil stays a faithful encoding of the number sequence — every number has a visible consequence.
- **D-19:** When a repeat lands on the start or end cell, **both the boundary marker and the loop render**, with geometry offset for legibility. Nothing is suppressed — same "every fact visible" posture as D-06's nodes.
- **D-20:** Each loop is its **own SVG element with a semantic class** (naming per D-08 taxonomy, e.g. `sigil-loop` — exact name Claude's discretion), independently CSS-stylable like `sigil-start`/`sigil-end`. Repeats are recorded as data in the PathModel and the JSON working. — **Reversibility:** costly — the class joins the public CSS contract (D-08) and the working schema is a consumed data contract (D-14).

### Y rule (CONS-04)
- **D-21:** **Y is always a consonant** — kept unless struck as a repeat. This is current `normalize()` behavior promoted to a documented rule: cited in code (replacing the Phase 1 "deferred to CONS-04" comment) and stated in the README, with test vectors (e.g. RHYTHM, YES).

### Non-ASCII / accents (CONS-04)
- **D-22:** Accented Latin letters **fold to their base letter** via Unicode decomposition (NFD, strip combining marks): É→E (then struck as vowel), Ñ→N (kept as consonant). README rule: "accents are ignored; the base letter is used" — matching hand derivation.
- **D-23:** Non-decomposable Latin letters use a **small explicit transliteration map**: ß→SS, Æ→AE, Œ→OE, Ø→O, Þ→TH, Ð→D. The map is a documented literal table in code and README — the citable rule, same posture as the kamea data lock.
- **D-24:** **Non-Latin script letters** (Greek, Cyrillic, Hebrew, CJK, …) are **struck as `non-letter`** and recorded in the struck trail — consistent with digits/punctuation. A fully non-Latin statement reduces to zero and hits E_EMPTY_SEQUENCE (which names the cause per D-26). No dedicated non-Latin error.
- **D-25:** The working **records both the original character and its folded form** (É→E) on kept and struck entries, so a teaching page can narrate exactly what happened to every character. — **Reversibility:** costly — extends the working schema, which is a consumed data contract (D-14); removing the fields later breaks consumers.

### Degenerate inputs (CONS-03)
- **D-26:** The empty-reduction error (E_EMPTY_SEQUENCE) carries **a human message with strike counts** ("all 9 characters struck: 5 vowels, 2 repeats, 2 non-letters") **and the structured struck list on the error object** — CLI users read the message, programmatic consumers introspect the data. Builds on D-15's stable-code contract.
- **D-27:** A single-letter sigil renders **both the start circle and end crossbar at its one cell**, geometry offset for legibility. Every sigil has a uniform anatomy: a start and an end, even when they coincide.

### Claude's Discretion
- Exact loop geometry (radius, offset direction, nesting spacing for multi-repeats) within the fixed 100×100 viewBox — consistent with Phase 1's marker-geometry discretion.
- Exact semantic class name for the loop element (within the D-08 BEM-ish taxonomy).
- Exact working field names for repeat/fold data — honor D-18/D-25 content; shape is planner/executor's call (mirrors D-14 discretion).
- How the transliteration map and fold logic are structured in `src/text/` — must respect the ARCHITECTURE.md boundary (text layer knows nothing of numbers/kameas).
- Determinism snapshot suite structure (INT-03) — which statements × planets × options matrix, so long as all seven planets are covered.
- Whitespace-only and empty-string statement edge handling — existing E_MISSING_STATEMENT / E_EMPTY_SEQUENCE plumbing covers these; exact boundary is planner's call.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project research (in-repo)
- `.planning/research/PITFALLS.md` — Pitfall 3 (Chaldean contamination) and Pitfall 4 (I/J-U/V contamination) bound any change to the text layer; Pitfall 8 (no `style=""`, no hardcoded presentation) and Pitfall 10 (fixed-viewBox coordinate math) bind the loop-marker renderer work; integration gotchas bind CLI stdout/stderr discipline for the new error surface.
- `.planning/research/ARCHITECTURE.md` — pipeline structure and internal boundaries: fold/transliteration logic lives in `src/text/`, loop detection in the path layer, markup only in renderers; no CLI-only validation (INT-04).

### Prior phase decisions
- `.planning/phases/01-first-sigil-end-to-end/01-CONTEXT.md` — D-05–D-08 (marker anatomy, node posture, viewBox, class taxonomy), D-14 (working-as-full-trail), D-15 (SigilError stable codes) are the contracts Phase 2 extends.

### Planning
- `.planning/REQUIREMENTS.md` — the 6 Phase 2 requirement IDs and their wording.
- `.planning/ROADMAP.md` — Phase 2 success criteria (5) and the 2-plan breakdown.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/data/kamea.js` — all seven grids already locked, verified, and case-insensitively addressable (`cellForNumber`, `gridSize`, `planetNames`); KAMEA-02 needs pipeline exercise + tests, not new data.
- `src/text/normalize.js` — the struck-trail structure (`{char, index, reason}`) extends naturally to fold recording (D-25); Y-as-consonant already implemented, needs its comment/README promotion (D-21).
- `src/path/buildPath.js` — PathModel already handles single-point paths without throwing; repeat detection slots in as new model data (loops derived from consecutive-equal numbers).
- `src/errors.js` + `src/generate.js` — SigilError taxonomy and E_EMPTY_SEQUENCE throw site exist; D-26 enriches the message and attaches structured data.
- `test/determinism.test.js` — existing determinism suite to widen into the all-seven-planets snapshot matrix (INT-03).

### Established Patterns
- Markers are plain shapes with semantic classes, no `<marker>` defs, no ids (D-05) — the loop element follows this exactly.
- `sigil--<planet>` class from canonical lowercase planet (D-08/D-12) — already threads through `generate.js` for all planets.
- CLI code→exit-status map exists (usage errors 2, E_EMPTY_SEQUENCE 3, unmapped 1) — new behavior surfaces through it, no new CLI validation.
- Nothing silently discarded: every struck character carries a reason — folding must preserve this (D-25).

### Integration Points
- `normalize()` is the single seam for fold/transliteration — `generate.js` and the working consume its output; no other module touches raw statement text.
- PathModel is the renderer-agnostic seam (PATH-03) — loop data added there is consumed identically by `render/svg.js` and `render/json.js`.

</code_context>

<specifics>
## Specific Ideas

- The repeat-loop and single-node decisions share one posture Matt chose consistently: **draw every fact, offset geometry for legibility, suppress nothing** — the same transparency principle as the struck trail. Planner should treat this as the tie-breaker for any marker-collision edge case not covered here.
- The transliteration map is a **citable rule table**, presented in README like the kamea sources — a lineage document, not an implementation detail.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. (Phase 1's deferred Skinner/Golden Dawn kamea sets remain on the backlog, untouched by this phase.)

</deferred>

---

*Phase: 2-Every Planet, Every Statement*
*Context gathered: 2026-08-06*
