# Phase 3: Themeable, Embeddable Layers - Context

**Gathered:** 2026-08-06
**Status:** Ready for planning
**Mode:** `--auto` — every gray area auto-resolved to its recommended option; see `03-DISCUSSION-LOG.md` for the per-question audit trail.

<domain>
## Phase Boundary

A site can embed several sigils on one page and restyle every one of them entirely from CSS — grid, glyph, and curve options included — without touching the generated markup. Covers REND-02 (configurable curve rendering), REND-03 (kamea grid layer), REND-04 (planetary glyph layer), REND-05 (full `--sigil-*` custom-property surface), REND-06 (no id collisions across multiple embeds).

The construction pipeline is finished and frozen: text normalization, folding, Pythagorean encoding, kamea lookup, PathModel, repeat detection, and the error taxonomy all shipped in Phases 1–2 and this phase must not alter any of them. Phase 3 is a *render-layer and option-surface* phase. Nothing here changes which letters are kept, which numbers they encode to, or which cells they land on — REND-02 says so explicitly, and SC1 makes it testable.

Out of this phase: new kamea sets (D-02 backlog), web component / hosted UI (v2 WRAP-01/WRAP-02), npm publication (v2 PKG-01), raster output.

</domain>

<decisions>
## Implementation Decisions

Decision IDs continue the project-wide sequence — Phase 1 ended at D-16, Phase 2 at D-27.

### Curve rendering (REND-02)

- **D-28:** Curve math is **hand-rolled centripetal Catmull-Rom (α = 0.5) converted to cubic Bézier**, written in-repo with zero runtime dependency. Centripetal parameterization specifically, not uniform (α = 0): kamea traversal jumps around a grid and produces exactly the sharp direction changes that uniform Catmull-Rom turns into cusps and self-intersecting loops. `d3-path` + `d3-shape` remain the documented fallback if the in-repo math proves fragile, but they are not the plan. — **Reversibility:** costly — the emitted curve geometry becomes part of the visual contract for sigils already embedded on live sites; swapping the interpolator changes output bytes for identical inputs.
- **D-29:** Option surface is a **boolean `curve`, default `false`**, plus a `--curve` CLI flag. Straight segments stay the default and stay **byte-identical to Phase 2 output** — the existing determinism snapshots must not need rebasing because a new option exists. A boolean (not a `'straight' | 'smooth'` enum) matches the existing `--json` flag shape and the flag name already documented in `.claude/CLAUDE.md`.
- **D-30:** Curve mode changes **only the `sigil-path` element's `d` attribute**. The start circle, the end crossbar, the per-visit nodes, and the repeat loops all keep deriving their geometry from the straight-segment travel vectors exactly as they do today. Rationale: REND-02 is a path-rendering option, not a re-anatomy of the sigil; keeping markers off the spline math means D-05/D-17/D-18/D-19 geometry stays byte-pinned in curve mode, and a Catmull-Rom terminal tangent tracks the final straight segment closely enough that the end bar still reads perpendicular. — **Reversibility:** costly — marker geometry is a published visual contract; making markers tangent-aware later changes bytes for every curved sigil.
- **D-31:** Curved output carries the **same determinism guarantee as straight output** — single-rounding discipline at the existing `GEOMETRY_PRECISION` of 3, all control points rounded exactly once at the point of computation, never re-derived from already-rounded values in a way that drifts. A curved snapshot for all seven planets joins the existing determinism matrix.

### Kamea grid layer (REND-03)

- **D-32:** The grid layer is **always emitted, never flagged, hidden by default** — Success Criterion 2 says "present in the output, hidden by default, and made visible by a CSS rule alone," so there is deliberately **no `--grid` flag**. Hiding uses the established D-06 node mechanism: `opacity="var(--sigil-grid-opacity, 0)"` on a wrapping `<g class="sigil-grid">`. One CSS declaration from the embedding site reveals it.
- **D-33:** The lattice is **one `<path class="sigil-grid-lines">`** carrying all `order + 1` horizontal and `order + 1` vertical lines plus the outer border as a single `d` string — 20 line commands on Moon's 9×9 instead of 81 rect elements. One element, one stroke contract, one place theming applies.
- **D-34:** Cell numbers are the **kamea's actual magic-square values** (1..order²), one `<text class="sigil-grid-number">` per cell, centered with `text-anchor="middle"` and `dominant-baseline="central"`. Those two attributes are typographic layout, not themeable presentation — the REND-05 enforcement test (D-42) must not flag them.
- **D-35:** The kamea grid reaches the renderer **through the render options object**, the same seam `statement` already travels (`renderSvg(path, { ...options, statement })` in `generate.js`). Not via a `render/` → `data/` import (ARCHITECTURE.md keeps `generate.js` as the only cross-layer importer) and not by widening the PathModel (grid values are data, not path geometry).

### Planetary glyph layer (REND-04)

- **D-36:** The glyph layer is **opt-in** — a boolean `glyph` option defaulting to `false`, plus a `--glyph` CLI flag. The asymmetry with the always-present grid is deliberate and comes straight from the success criteria: SC2 says the grid is "present… hidden by default," SC3 says the glyph "can be included as an optional layer." The glyph is a visible mark that changes what the sigil *is*; the grid is scaffolding that explains it.
- **D-37:** Rendered as **`<text class="sigil-glyph">` carrying the Unicode astrological character**, from a literal code-point map — Saturn U+2644 ♄, Jupiter U+2643 ♃, Mars U+2642 ♂, Sun U+2609 ☉, Venus U+2640 ♀, Mercury U+263F ☿, Moon U+263D ☽ — with the code points cited in the source, same posture as the kamea data lock. Not hand-authored vector outlines: seven glyph paths would mean font-licensing exposure and accuracy risk for no gain under a zero-dependency constraint. The map lives in **`src/render/glyphs.js`** — presentation data belongs to the render layer, and putting it there means no new cross-layer import.
- **D-38:** The glyph is **anchored at the viewBox center (50, 50)** and is styled *and repositioned* entirely from CSS. `x`/`y` are anchors, not a theming surface; the documented repositioning route is a CSS `transform` on `.sigil-glyph`, with `--sigil-glyph-size`, `--sigil-glyph-fill`, `--sigil-glyph-opacity`, and `--sigil-glyph-font` covering the rest. The README must state plainly that glyph rendering depends on the viewer having a font covering the astrological block, and that `--sigil-glyph-font` is how a site points at one it ships.
- **D-39:** **Layer order is grid → glyph → path → nodes → start → end → loops.** SVG paints in document order, so grid and glyph land behind the traced sigil (REND-03 says "behind"), and the `renderSvg` layer array — already built as independent per-layer functions joined in a fixed order, explicitly anticipating this phase — grows two entries at its head.

### CSS custom-property surface (REND-05)

- **D-40:** Naming stays **flat `--sigil-<element>-<property>`**, extending the four names already shipped (`--sigil-stroke`, `--sigil-stroke-width`, `--sigil-marker-stroke`, `--sigil-node-fill`, `--sigil-node-opacity`). Existing names are **frozen** — they are the public CSS contract embedding sites already write against, same posture as D-08's class taxonomy. Every `var()` carries an inline sane default so a bare `<svg>` with zero CSS still renders correctly. — **Reversibility:** costly — property names join the published theming contract; renaming breaks consumer stylesheets silently.
- **D-41:** **Only CSS-mapped presentation attributes carry `var()`** — paint (`fill`, `stroke`), `opacity`, `stroke-width`, `font-size`, `font-family`. Geometry stays a literal derived from `cellSize`, exactly as the existing renderer does it, because `var()` inside a non-CSS-mapped attribute silently does nothing. The README documents the honest escape hatch instead: SVG 2 exposes `r`, `cx`, `cy`, `x`, `y` as real CSS properties in modern browsers, so a site that wants a different node radius sets it in CSS directly — the tool does not fake a custom property that would not resolve.
- **D-42:** **Enforcement is a guard test, not a convention.** Across all seven planets × every option combination, the generated SVG must contain no `style=` substring, no bare color literal in a paint attribute, and — the drift guard that matters — every `--sigil-*` name it emits must appear in the README theming table. Code and docs cannot diverge without the suite going red.

### Multi-embed id safety (REND-06)

- **D-43:** **The SVG stays id-free by construction**, and that becomes an enforced invariant: a guard test across all seven planets × every option combination asserts zero `id=` attributes anywhere in the output. This is the primary REND-06 guarantee — zero collisions because there is nothing to collide. The renderer is already id-free today (D-05 chose plain shapes over `<marker>` defs precisely to defer this); Phase 3 makes it a tested contract instead of an accident.
- **D-44:** The **only** route to an emitted id is a **caller-supplied `idPrefix` option**. When absent (the default), no ids are emitted; when present, it names the root `<svg id="…">` and would prefix any internal id a future layer needs. Deliberately **no derived hash**: determinism means identical inputs produce identical bytes, so a hash of `(statement, planet, options)` produces *identical ids* for two identical sigils on one page — the exact collision Pitfall 9 warns about, dressed as a fix. Uniqueness under identical inputs is the caller's responsibility and the README says so.
- **D-45:** Two tests carry SC5: render two *different* sigils into one document string and assert zero id overlap; render the *same* input twice and assert byte-identical output — proving the id work did not break determinism.

### Option surface and interface (INT-02 / INT-04 continuity)

- **D-46:** The CLI grows **`--curve`, `--glyph`, and `--id-prefix <string>`**, and — for the first time — actually builds an options object and passes it as `generateSigil`'s third argument. `bin/sigil-spinner.js` currently calls `generateSigil(statement, planetArg)` with no options at all, so this phase creates that seam. No `--grid` flag (D-32).
- **D-47:** **Option validation lives in the library** (INT-04, ARCHITECTURE.md Anti-Pattern 3). A wrong-typed known option throws `SigilError` with a new stable code **`E_INVALID_OPTION`**, naming the offending option in the message and attaching structured data — the D-26 posture: humans read the message, programs introspect the data. Unknown option keys are ignored for forward compatibility. The CLI maps `E_INVALID_OPTION` to exit status 2, joining the existing usage class.
- **D-48:** The JSON working gains a **`render` block recording the resolved option values** (`curve`, `glyph`, `idPrefix`, `title`), so a consumer holding only the working can reproduce the exact SVG — D-14's full-trail posture applied to the option surface. Construction fields (`lettersKept`, `numbers`, `cells`, `segments`) are untouched, which is what makes SC1 testable. — **Reversibility:** costly — the working is a consumed data contract (D-14) and this rebases every existing JSON snapshot.

### Claude's Discretion

- Catmull-Rom endpoint handling (phantom endpoints vs. duplicated terminal points) and any tension clamping — D-28 fixes the algorithm and α, not the terminal convention.
- All new default values: grid stroke-width, grid-number font-size fraction, glyph size fraction, and every new custom property's fallback — consistent with the existing `cellSize`-derived fraction constants pattern, never hardcoded absolute units.
- Exact new custom-property names within D-40's convention, including whether grid numbers get their own opacity property nested under the grid group's.
- Whether `sigil-grid-number` elements are wrapped in their own nested `<g>` inside `sigil-grid`.
- Snapshot matrix shape for the new option combinations, so long as all seven planets and both curve states are covered (INT-03).
- Where the README theming table sits structurally, so long as D-42's drift guard can read it.
- Whether the curve math lives in `src/render/curve.js` or inside `src/render/svg.js` — must not leak into `src/path/` (ARCHITECTURE.md Anti-Pattern 1: no markup or render math in the path builder).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project research (in-repo)

- `.planning/research/PITFALLS.md` — **Pitfall 8** (no `style=""`, no hardcoded presentation values; the inheritance asymmetry between paint properties and geometry attributes) is the spine of REND-05 and directly grounds D-41. **Pitfall 9** (id collisions when multiple sigils share a page) grounds D-43/D-44 — read its "deterministic hash" advice alongside D-44, which deliberately declines it and says why. **Pitfall 10** (fixed viewBox, one shared coordinate transform, never duplicated math) binds the grid-layer geometry to `src/render/coords.js`.
- `.planning/research/ARCHITECTURE.md` — internal boundaries and Anti-Patterns 1 (no markup or render math in the path builder), 2 (no kamea literals outside `data/kamea.js`), 3 (no CLI-only validation), 4 (no mutable options object threaded through the pipeline). D-35 and D-37 exist to respect the layer boundary; D-47 exists to respect Anti-Pattern 3.
- `.planning/research/STACK.md` — the curve-rendering stack decision: hand-rolled Catmull-Rom → cubic Bézier as primary, `d3-path@3.1.0` + `d3-shape@3.2.0` as the named fallback (direct imports, never the `d3` meta-package), and the explicit ban on DOM-emulating SVG libraries and on running any formatter over generated output.

### Prior phase decisions

- `.planning/phases/01-first-sigil-end-to-end/01-CONTEXT.md` — **D-05** (markers as plain shapes, no `<marker>` defs, id-free), **D-06** (hidden-by-default-via-custom-property posture the grid layer copies), **D-07** (fixed `0 0 100 100` viewBox, cell size `100/order`), **D-08** (class taxonomy — `sigil-grid` and `sigil-glyph` were *named there*, this phase implements them), **D-13** (`{ svg, working }` eager return), **D-14** (working-as-full-trail, costly to change), **D-15** (`SigilError` stable-code contract that `E_INVALID_OPTION` joins), **D-16** (`title` option semantics).
- `.planning/phases/02-every-planet-every-statement/02-CONTEXT.md` — **D-17 through D-20** (the repeat-loop visual contract that D-30 pins in place under curve mode), plus the "draw every fact, offset geometry for legibility, suppress nothing" posture that governs marker-collision edge cases.

### Planning

- `.planning/REQUIREMENTS.md` — REND-02 through REND-06, the 5 Phase 3 requirement IDs and their exact wording. REND-02's "without altering the underlying construction" and REND-06's "deterministically namespaced per instance" are the two clauses D-30 and D-44 interpret.
- `.planning/ROADMAP.md` — Phase 3's 5 success criteria and the 2-plan breakdown (03-01 layers + curve, 03-02 custom properties + id namespacing). Note the phase carries **`UI hint: yes`**, and `workflow.ui_phase` is enabled in `.planning/config.json` — a `/gsd-ui-phase` design contract is available before planning if the layer aesthetics warrant one.
- `.planning/PROJECT.md` — Key Decisions table; "Straight segments default, curves behind a flag" is listed there as Pending (Phase 3) and D-29 resolves it.

### Repo contracts

- `README.md` (283 lines) — already carries the kamea source citations, the Letter Handling Rules table, and the determinism statement. The REND-05 theming table lands here and D-42's drift guard reads it.
- `.claude/CLAUDE.md` — locked stack: Node ≥20, ESM-only, `node:util.parseArgs` (no CLI framework), hand-rolled SVG string templating (no DOM libraries), Vitest snapshots, JSDoc + `tsc --checkJs` with no build step. It also already names `--curve`, `--grid`, and `--glyph` as the anticipated flag surface — D-32 deliberately drops `--grid`, and the plan should note the divergence rather than silently contradict the stack doc.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `src/render/svg.js` — **built for this phase.** Its header comment already says layers are "assembled from independent per-layer functions in one fixed order… so a future layer (grid, glyph — Phase 3) can be added at this seam without touching existing ones," and that "REND-06's collision-avoidance work is Phase 3." The `renderSvg` layer array is the exact insertion point for D-39.
- `src/render/coords.js` — `cellSize(order)` and `cellCenter(row, col, order)` are the single shared transform (Pitfall 10). The grid lattice and the glyph anchor must both go through them; no new coordinate math anywhere.
- `src/render/svg.js` fraction constants (`NODE_RADIUS_FRACTION`, `START_RADIUS_FRACTION`, `LOOP_RADIUS_FRACTION`, …) plus `roundGeometry`/`GEOMETRY_PRECISION` — the established pattern for every new default in D-40: a named `*_FRACTION` of `cellSize`, rounded once, never an absolute unit.
- `src/data/kamea.js` — exports `kameaGrid(planet, opts)` returning the full number matrix, which is exactly what the grid-number layer needs. `generate.js` calls it and forwards the result per D-35; the renderer never imports it.
- `src/render/json.js` — `toWorking()` and the `SigilWorking` typedef are where D-48's `render` block lands.
- `test/determinism.test.js` + `test/__file_snapshots__/` — an existing 7-planet × 3-variant snapshot matrix (`matrix-*`, `matrix-repeat-*`, `matrix-stroke-*`) to extend with curve/grid/glyph variants.

### Established Patterns

- **`var()` only on CSS-mapped attributes.** Existing code already gets this right — `fill="var(--sigil-node-fill, currentColor)"`, `opacity="var(--sigil-node-opacity, 0)"`, `stroke-width="var(--sigil-stroke-width, 2)"` — while radii and coordinates stay literal. D-41 codifies what the code already does.
- **Zero `id` attributes anywhere**, stated explicitly in the `svg.js` header. D-43 turns the comment into a test.
- **Extra render-time data travels through the options object**, not through the PathModel — `generate.js` does `renderSvg(path, { ...options, statement })`. D-35 follows that precedent exactly.
- **Semantic class per element, no wrapper groups so far** — Phase 3 introduces the first `<g>` (the grid group) purely so one opacity declaration toggles lines and numbers together.
- Fixed layer emission order with `.filter(Boolean).join('')` — empty layers vanish cleanly, which is how the opt-in glyph layer contributes nothing when off.

### Integration Points

- `src/generate.js` — the only cross-layer importer. It gains the `kameaGrid` call (D-35) and option resolution/validation (D-47), and forwards resolved options into both `renderSvg` and `toWorking`.
- `bin/sigil-spinner.js` — `parseArgs` options block gains three entries; the `generateSigil(statement, planetArg)` call gains a third argument. `EXIT_CODES` gains `E_INVALID_OPTION: 2`. The CLI adds **no** validation — codes and messages come from the library (INT-04, and the 02-04 precedent that `E_CLI_*` codes are CLI-local while domain codes are library-owned).
- `src/errors.js` — `E_INVALID_OPTION` is a domain code and belongs here, not in the CLI's local code set.

</code_context>

<specifics>
## Specific Ideas

- Two success criteria that look like ordinary phrasing are actually load-bearing and pull in opposite directions: SC2 says the grid is **"present in the output, hidden by default"** while SC3 says the glyph **"can be included as an optional layer."** That asymmetry is the reason D-32 has no flag and D-36 does. Any planner tempted to make them symmetric is contradicting the roadmap.
- REND-06's wording ("all internal SVG ids are deterministically namespaced per instance") assumes ids exist. They do not, and D-43/D-44 satisfy the requirement's *intent* — zero collisions between co-embedded sigils — by keeping the artifact id-free and refusing a deterministic hash that cannot actually guarantee uniqueness. Verification should score SC5 against zero-collision behavior, not against the presence of a namespacing scheme.
- The visual posture Matt set in Phase 2 carries forward as the tie-breaker for anything not decided here: **draw every fact, offset geometry for legibility, suppress nothing.** The grid layer being always-present-but-transparent is the same principle — the information is in the markup, the site decides whether to show it.
- Sigils are reproducible design elements, not random art. Every new option must land in the determinism matrix, and "straight, no glyph" output must stay byte-identical to what Phase 2 already ships.

</specifics>

<deferred>
## Deferred Ideas

- **`--title` CLI flag exposing the existing library `title` option (D-16).** The CLI options-threading seam is built in this phase (D-46), so wiring one more flag would be nearly free — but it is a new CLI capability, not one of REND-02..REND-06. Backlog: a small CLI-surface phase alongside PKG-01.
- **`d3-path` / `d3-shape` adoption for curve interpolation.** Named in STACK.md as the fallback if hand-rolled spline math proves fragile. Not a plan; revisit only if D-28's implementation fights back.
- **Skinner and Golden Dawn kamea sets** (from Phase 1's D-02) remain on the backlog, untouched by this phase.

</deferred>

---

*Phase: 3-Themeable, Embeddable Layers*
*Context gathered: 2026-08-06*
