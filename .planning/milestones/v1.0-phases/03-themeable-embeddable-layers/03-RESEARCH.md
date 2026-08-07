# Phase 3: Themeable, Embeddable Layers - Research

**Researched:** 2026-08-06
**Domain:** SVG render-layer engineering — hand-rolled centripetal Catmull-Rom curve math, CSS custom-property theming surface, multi-embed id safety, in a zero-runtime-dependency Node CLI/library
**Confidence:** MEDIUM-HIGH — the project-specific architecture/pitfalls/stack are HIGH (already locked, re-read this session from the actual source files). The web-platform specifics this phase turns on (Catmull-Rom degenerate-case guards, `var()` resolution rules, SVG2 CSS geometry property support, emoji-presentation defaults for the seven glyphs, JS float-formatting edge cases) are individually cross-checked (MEDIUM) but drawn from general web-platform research, not a domain-specific "sigil renderer" corpus.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

Decision IDs continue the project-wide sequence — Phase 1 ended at D-16, Phase 2 at D-27.

**Curve rendering (REND-02)**
- **D-28:** Curve math is **hand-rolled centripetal Catmull-Rom (α = 0.5) converted to cubic Bézier**, written in-repo with zero runtime dependency. Centripetal parameterization specifically, not uniform (α = 0). `d3-path` + `d3-shape` remain the documented fallback if the in-repo math proves fragile, but they are not the plan. — **Reversibility:** costly.
- **D-29:** Option surface is a **boolean `curve`, default `false`**, plus a `--curve` CLI flag. Straight segments stay the default and stay **byte-identical to Phase 2 output**.
- **D-30:** Curve mode changes **only the `sigil-path` element's `d` attribute**. Start circle, end crossbar, per-visit nodes, and repeat loops all keep deriving their geometry from the straight-segment travel vectors exactly as today. — **Reversibility:** costly.
- **D-31:** Curved output carries the **same determinism guarantee as straight output** — single-rounding discipline at the existing `GEOMETRY_PRECISION` of 3, all control points rounded exactly once at the point of computation, never re-derived from already-rounded values in a way that drifts.

**Kamea grid layer (REND-03)**
- **D-32:** The grid layer is **always emitted, never flagged, hidden by default** — no `--grid` flag. Hiding uses `opacity="var(--sigil-grid-opacity, 0)"` on a wrapping `<g class="sigil-grid">`.
- **D-33:** The lattice is **one `<path class="sigil-grid-lines">`** carrying all `order + 1` horizontal and `order + 1` vertical lines plus the outer border as a single `d` string.
- **D-34:** Cell numbers are the **kamea's actual magic-square values** (1..order²), one `<text class="sigil-grid-number">` per cell, centered with `text-anchor="middle"` and `dominant-baseline="central"`. Those two attributes are typographic layout, not themeable presentation — the D-42 enforcement test must not flag them.
- **D-35:** The kamea grid reaches the renderer **through the render options object** (`renderSvg(path, { ...options, statement })` in `generate.js`). Not via a `render/` → `data/` import and not by widening the PathModel.

**Planetary glyph layer (REND-04)**
- **D-36:** The glyph layer is **opt-in** — a boolean `glyph` option defaulting to `false`, plus a `--glyph` CLI flag.
- **D-37:** Rendered as **`<text class="sigil-glyph">` carrying the Unicode astrological character**, from a literal code-point map — Saturn U+2644 ♄, Jupiter U+2643 ♃, Mars U+2642 ♂, Sun U+2609 ☉, Venus U+2640 ♀, Mercury U+263F ☿, Moon U+263D ☽ — with the code points cited in the source. The map lives in **`src/render/glyphs.js`**.
- **D-38:** The glyph is **anchored at the viewBox center (50, 50)** and is styled *and repositioned* entirely from CSS. The documented repositioning route is a CSS `transform` on `.sigil-glyph`, with `--sigil-glyph-size`, `--sigil-glyph-fill`, `--sigil-glyph-opacity`, and `--sigil-glyph-font` covering the rest. The README must state plainly that glyph rendering depends on the viewer having a font covering the astrological block.
- **D-39:** **Layer order is grid → glyph → path → nodes → start → end → loops.**

**CSS custom-property surface (REND-05)**
- **D-40:** Naming stays **flat `--sigil-<element>-<property>`**, extending the four names already shipped. Existing names are **frozen**. Every `var()` carries an inline sane default. — **Reversibility:** costly.
- **D-41:** **Only CSS-mapped presentation attributes carry `var()`** — paint (`fill`, `stroke`), `opacity`, `stroke-width`, `font-size`, `font-family`. Geometry stays a literal derived from `cellSize`. The README documents the honest escape hatch: SVG 2 exposes `r`, `cx`, `cy`, `x`, `y` as real CSS properties in modern browsers.
- **D-42:** **Enforcement is a guard test, not a convention.** Across all seven planets × every option combination, the generated SVG must contain no `style=` substring, no bare color literal in a paint attribute, and every `--sigil-*` name it emits must appear in the README theming table.

**Multi-embed id safety (REND-06)**
- **D-43:** **The SVG stays id-free by construction**, enforced by a guard test across all seven planets × every option combination asserting zero `id=` attributes anywhere in the output.
- **D-44:** The **only** route to an emitted id is a **caller-supplied `idPrefix` option**. Deliberately **no derived hash** — determinism means identical inputs produce identical bytes, so a hash of `(statement, planet, options)` produces identical ids for two identical sigils on one page.
- **D-45:** Two tests carry SC5: render two *different* sigils into one document string and assert zero id overlap; render the *same* input twice and assert byte-identical output.

**Option surface and interface (INT-02 / INT-04 continuity)**
- **D-46:** The CLI grows **`--curve`, `--glyph`, and `--id-prefix <string>`**, and — for the first time — actually builds an options object and passes it as `generateSigil`'s third argument. No `--grid` flag (D-32).
- **D-47:** **Option validation lives in the library.** A wrong-typed known option throws `SigilError` with a new stable code **`E_INVALID_OPTION`**, naming the offending option and attaching structured data. Unknown option keys are ignored for forward compatibility. The CLI maps `E_INVALID_OPTION` to exit status 2.
- **D-48:** The JSON working gains a **`render` block recording the resolved option values** (`curve`, `glyph`, `idPrefix`, `title`). — **Reversibility:** costly.

### Claude's Discretion

- Catmull-Rom endpoint handling (phantom endpoints vs. duplicated terminal points) and any tension clamping — D-28 fixes the algorithm and α, not the terminal convention.
- All new default values: grid stroke-width, grid-number font-size fraction, glyph size fraction, and every new custom property's fallback — consistent with the existing `cellSize`-derived fraction constants pattern, never hardcoded absolute units.
- Exact new custom-property names within D-40's convention, including whether grid numbers get their own opacity property nested under the grid group's.
- Whether `sigil-grid-number` elements are wrapped in their own nested `<g>` inside `sigil-grid`.
- Snapshot matrix shape for the new option combinations, so long as all seven planets and both curve states are covered (INT-03).
- Where the README theming table sits structurally, so long as D-42's drift guard can read it.
- Whether the curve math lives in `src/render/curve.js` or inside `src/render/svg.js` — must not leak into `src/path/` (ARCHITECTURE.md Anti-Pattern 1: no markup or render math in the path builder).

### Deferred Ideas (OUT OF SCOPE)

- **`--title` CLI flag exposing the existing library `title` option (D-16).** Not one of REND-02..REND-06. Backlog: a small CLI-surface phase alongside PKG-01.
- **`d3-path` / `d3-shape` adoption for curve interpolation.** Named in STACK.md as the fallback if hand-rolled spline math proves fragile. Not a plan; revisit only if D-28's implementation fights back.
- **Skinner and Golden Dawn kamea sets** (from Phase 1's D-02) remain on the backlog, untouched by this phase.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|--------------------|
| REND-02 | Path rendering is configurable — straight segments by default, curved/smoothed via flag, without altering the underlying construction | Architecture Patterns 1-3 (local 4-point window, exact-zero knot guard, tangent→Bézier conversion) give the exact arithmetic; Common Pitfalls A and E cover the two edge cases (coincident points, float formatting) most likely to break byte-determinism (D-29/D-31) |
| REND-03 | A kamea grid layer (cell borders + numbers) renders behind the sigil, hidden by default and revealable via CSS | Architecture Pattern 4 (grid lattice `d`-string construction, multiplication-not-accumulation) and Pattern 5 (text-centering idiom for grid numbers, already partially locked by D-34) |
| REND-04 | A planetary glyph layer (♄ ♃ ♂ ☉ ♀ ☿ ☽) is available as an optional SVG layer | Common Pitfall C (emoji-presentation risk for 2 of 7 glyphs + VS15 mitigation) and Pattern 5 (centering + CSS `transform` repositioning) directly inform the `src/render/glyphs.js` map and the glyph sub-renderer |
| REND-05 | All themeable values are expressed as CSS custom properties (`--sigil-*`) with defaults — no inline `style=""` attributes, no hardcoded presentation values that defeat theming | Common Pitfall B (`var()` resolution rules — which attributes it silently no-ops in) and the Code Examples' guard-test patterns directly implement D-42's enforcement requirement |
| REND-06 | Multiple sigils embedded on one page do not collide — all internal SVG ids are deterministically namespaced per instance | Security Domain (idPrefix escaping) and Common Pitfall D (guard-test regex false-positive avoidance) cover the two things the D-43/D-44 id-free contract needs to get right in its test suite |
</phase_requirements>

## Summary

Phase 3 adds three render-layer features (curved paths, a grid layer, a glyph layer) and two cross-cutting contracts (a `--sigil-*` CSS custom-property surface, multi-embed id safety) on top of a pipeline that CONTEXT.md has already frozen in every particular that matters: hand-rolled centripetal Catmull-Rom (D-28), grid always-on/glyph opt-in asymmetry (D-32/D-36), flat property naming (D-40), and an id-free-by-construction contract with only a caller-supplied `idPrefix` escape hatch (D-43/D-44). Nothing here is architecturally ambiguous — the research value of this document is entirely in the *concrete arithmetic and platform facts* an executor needs and cannot get right by intuition: the exact centripetal-to-Bézier conversion formula and its degenerate-point guard, which SVG attributes `var()` actually resolves in, which of the seven planetary glyphs carry real emoji-presentation risk, and the float-formatting edge cases that could silently break the single-rounding determinism discipline this project has enforced since Phase 1.

The single most important structural finding: because every coordinate in this codebase passes through `cellCenter()`'s one rounding point before it is ever used again (`src/render/coords.js:59-65`), two points that "coincide" in this codebase (a repeated digit landing on the same cell) are **exactly** equal as floating-point values, not merely close. That turns the classic Catmull-Rom coincident-point guard (usually an epsilon threshold, e.g. three.js's `1e-4`) into an exact `=== 0` check here — simpler and gives the plan a precise, testable branch condition instead of a fuzzy tolerance to tune.

**Primary recommendation:** Implement curve math as a self-contained `src/render/curve.js` module (Claude's Discretion in CONTEXT.md permits either `curve.js` or inline in `svg.js`; a separate file keeps `pathLayer()` in `svg.js` a thin dispatcher between straight/curved `d`-string builders) that (1) builds the local 4-point Catmull-Rom window per segment with duplicated-endpoint terminal handling, (2) computes knot intervals via the centripetal `|Δ|^0.5` formula with an **exact-zero** substitution guard (not an epsilon), (3) converts to Bézier control points via the standard Hermite-to-Bézier third-scaling, and (4) rounds every emitted control-point coordinate exactly once through the existing `roundGeometry` before formatting. Layer new grid/glyph rendering as two more functions in the existing `renderSvg` layer array (the file's own header comment names this exact seam), reusing `cellSize`/`cellCenter` for all new geometry — never new coordinate math. Guard tests should use scoped regexes (`\sstyle\s*=`, `\sid\s*=\s*"`) rather than bare substring checks, since the codebase's own guard-test fixture statements could theoretically produce a false positive inside an XML-escaped `<title>` if a test statement happened to literally contain the word "style" or "id" followed by `=`.

## Architectural Responsibility Map

This project has no browser/server/API/DB tiers — it is a pure-function library plus a thin CLI plus, at the far end, an *embedding site's own CSS* that this phase must not assume anything about. Tiers below are project-specific, adapted from `ARCHITECTURE.md`'s own component map.

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Curve interpolation (straight vs. Catmull-Rom→Bézier) | `render/svg.js` (or new `render/curve.js`) | — | REND-02 is explicitly a render-time decision (D-30); `path/buildPath.js` stays untouched (frozen per CONTEXT.md's Phase Boundary) |
| Kamea grid lattice + numbers | `render/svg.js` (new grid sub-renderer) | `data/kamea.js` (read-only, via `kameaGrid()`) | D-35: grid data travels through the options object into the renderer; renderer never imports `data/` directly except through the seam `generate.js` already opened |
| Planetary glyph | `render/glyphs.js` (new data module) + `render/svg.js` (glyph sub-renderer) | — | D-37 places the code-point map in `render/`, not `data/`, because it is presentation data, not canonical kamea data |
| `--sigil-*` CSS custom-property contract | `render/svg.js` (emits `var()` hooks) | **Embedding site's CSS** (consumes them) | The library's job stops at emitting a correct hook with a sane fallback; actual visual theming happens entirely outside this codebase, in CSS this project never sees or tests |
| Id namespacing (`idPrefix`) | `generate.js` (option resolution) → `render/svg.js` (id emission) | `bin/sigil-spinner.js` (`--id-prefix` flag) | D-47: validation lives in the library; CLI only threads the flag through, same as every other option (D-46) |
| Option validation (`E_INVALID_OPTION`) | `generate.js` | `src/errors.js` (code constant) | ARCHITECTURE.md Anti-Pattern 3 — CLI never validates |
| Determinism (byte-identical output under the new options) | Cross-cutting — every render sub-function | `test/determinism.test.js` (verification) | D-29/D-31/D-45: this is the phase's actual hard constraint, not a nice-to-have |

## Standard Stack

No new runtime dependency is added in this phase. `STACK.md` (already locked, Phase 0 research) governs; this phase exercises exactly the parts of it CONTEXT.md's D-28 already chose.

### Core (unchanged from STACK.md)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|---------------|
| Hand-rolled centripetal Catmull-Rom → cubic Bézier (new, in-repo) | n/a | REND-02 curve rendering | D-28 locks this; `d3-path@3.1.0`/`d3-shape@3.2.0` remain the documented fallback only, not adopted this phase (explicitly out of scope per the phase brief) |
| `node:util.parseArgs` | ships with Node ≥20 | CLI flag parsing (`--curve`, `--glyph`, `--id-prefix`) | Already the project's CLI layer (D-46 extends it, doesn't replace it) |

### Supporting

Nothing new. `vitest@^4.1.10` (already a devDependency per `package.json`) is the test runner for every guard test and snapshot this phase adds — no new test tooling required.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-rolled Catmull-Rom | `d3-path@3.1.0` + `d3-shape@3.2.0` (`curveCatmullRom.alpha(0.5)`) | Only if the hand-rolled math proves fragile in practice (visible cusps/self-intersections on real kamea traversal data) — STACK.md and CONTEXT.md both name this as the fallback, not a day-one option. Adding it now would violate the phase's explicit "do NOT propose adding runtime dependencies" instruction. |

**Installation:** none — this phase adds zero packages.

**Version verification:** Not applicable — no new packages this phase. `STACK.md`'s existing verified versions (`vitest@4.1.10`, `d3-path@3.1.0`, `d3-shape@3.2.0` as the *unused* fallback) were confirmed against the npm registry on 2026-08-04 and are not re-verified here since none are being installed.

## Package Legitimacy Audit

**Not applicable to this phase.** Phase 3 installs zero new packages — D-28 locks curve math as hand-rolled, in-repo, zero-dependency; every other Phase 3 requirement (grid layer, glyph layer, CSS custom properties, id namespacing) is pure render-layer code using only what's already in `package.json`. The zero-runtime-dependency constraint (`.claude/CLAUDE.md`) is honored by construction, not by an install-time check.

**Packages removed due to `[SLOP]` verdict:** none (none proposed).
**Packages flagged as suspicious `[SUS]`:** none (none proposed).

## Architecture Patterns

### System Architecture Diagram

```
                    generate.js (orchestrator — unchanged shape, D-35/D-46/D-47)
                          │
        ┌─────────────────┼───────────────────────────────┐
        │                 │                                │
   normalize/encode   buildPath()                    resolveOptions()
   (FROZEN, unused    (FROZEN — no curve/grid/         { curve, glyph,
    by this phase)     glyph awareness added)           idPrefix, title }
                          │                                │
                          ▼                                │
                     PathModel (plain object,               │
                     points/segments/repeats)                │
                          │                                │
                          ▼                                ▼
              ┌──────────────────────────────────────────────────┐
              │              renderSvg(pathModel, options)         │
              │  layer array, SVG paint order = document order:    │
              │                                                    │
              │   [ gridLayer(kameaGrid, opts) ]  ◄─ NEW (D-39 head)│
              │   [ glyphLayer(planet, opts) ]     ◄─ NEW, opt-in   │
              │   [ pathLayer(pathModel, opts) ]   ◄─ curve branch  │
              │        │                                            │
              │        ├─ opts.curve===false → straight `L` cmds   │
              │        └─ opts.curve===true  → curve.js: Catmull-  │
              │                                Rom→Bézier `C` cmds │
              │   [ nodeLayer / startMarker / endMarker / loopLayer]│
              │        (UNCHANGED geometry — D-30)                 │
              │                                                    │
              │  every var()-eligible attribute wraps a            │
              │  --sigil-* custom property with an inline fallback │
              │  idPrefix (if supplied) namespaces the root <svg>  │
              └──────────────────────────────────────────────────┘
                          │
                          ▼
                self-contained SVG string  ──► embedding page's own CSS
                                                (theming happens ENTIRELY
                                                 outside this codebase)
```

### Recommended Project Structure

```
src/render/
├── svg.js          # renderSvg() — layer composition, straight-path builder unchanged
├── curve.js         # NEW — centripetal Catmull-Rom → cubic Bézier, isolated so it's
│                     #   independently unit-testable against known control-point outputs
│                     #   without needing a full PathModel/SVG round-trip
├── glyphs.js        # NEW (D-37) — planet → Unicode code-point literal map, presentation data
├── coords.js         # UNCHANGED — cellSize()/cellCenter() remain the only coordinate transform;
│                     #   grid lattice and glyph anchor both call through here, never duplicate
├── json.js           # gains the `render` block (D-48) — no new computation, still a thin serializer
└── escapeXml.js      # UNCHANGED — new glyph/grid-number text nodes are literal, non-user-controlled
                       #   values and do not need it (see Common Pitfalls)
```

### Pattern 1: Local 4-Point Catmull-Rom Window with Duplicated Terminal Points

**What:** For a PathModel with points `P[0..n-1]`, each drawn curve segment `k` (from `P[k]` to `P[k+1]`, for `k = 0..n-2`) needs a local 4-point window `[Q0, Q1, Q2, Q3] = [P[k-1], P[k], P[k+1], P[k+2]]`. At the true ends of the path, the missing neighbor is the **duplicated endpoint** — `Q0 = P[k]` when `k===0`, `Q3 = P[k+1]` when `k+1===n-1`.

**When to use:** Every curved segment. This is CONTEXT.md's "Claude's Discretion" item (phantom vs. duplicated endpoints) — this research recommends **duplicated**, not phantom-reflected, for a concrete architectural reason below.

**Why duplicated over phantom-reflected:** A duplicated terminal point (`Q0 = Q1`) produces a knot interval of **exactly 0** (`|Q1-Q0| = 0`), which is *the same degenerate case* PATH-02 repeat-runs already produce mid-path (two consecutive identical cells). Choosing duplicated endpoints means the coincident-point guard (Pattern 2 below) is the **only** degenerate-case branch the implementation needs — one guard, exercised by two different real inputs (true path ends AND mid-path repeats), rather than two separate code paths (a reflection formula for ends, a guard for mid-path repeats). Phantom-reflected endpoints (`Q0 = 2*P[k] - P[k+1]`) avoid the zero-knot-interval case at the true ends but require a second, unrelated branch of logic that is only ever exercised at exactly two points in the whole path (the very first and very last segment) — more code, for a rarer case, that still doesn't eliminate the guard the mid-path repeats already force you to write.

**Example (concrete arithmetic):**
```js
// src/render/curve.js
function localWindow(points, k) {
  const Q0 = k === 0 ? points[k] : points[k - 1];
  const Q1 = points[k];
  const Q2 = points[k + 1];
  const Q3 = (k + 2 === points.length) ? points[k + 1] : points[k + 2];
  return [Q0, Q1, Q2, Q3];
}
```

### Pattern 2: Centripetal Knot Intervals with Exact-Zero Guard (not epsilon)

**What:** Compute `t01 = |Q1-Q0|^0.5`, `t12 = |Q2-Q1|^0.5`, `t23 = |Q3-Q2|^0.5` (the centripetal, α=0.5 parameterization — `t_{i+1} = t_i + |P_{i+1}-P_i|^{0.5}` [CITED: qroph.github.io/2018/07/30/smooth-paths-using-catmull-rom-splines.html, MEDIUM confidence, cross-checked against Wikipedia's Centripetal Catmull–Rom Spline formula t_{i+1} = [(x_{i+1}-x_i)² + (y_{i+1}-y_i)²]^α + t_i with α=0.5]).

Reference implementations (three.js's `CatmullRomCurve3`) guard the resulting knot intervals with an **epsilon** threshold — `if (dt1 < 1e-4) dt1 = 1.0; if (dt0 < 1e-4) dt0 = dt1; if (dt2 < 1e-4) dt2 = dt1;` [CITED: github.com/mrdoob/three.js/blob/master/src/extras/curves/CatmullRomCurve3.js, fetched this session, MEDIUM confidence] — because three.js's inputs are arbitrary unrounded floats where "coincident" really means "very close."

**This codebase can use an exact check instead.** Every point this renderer ever sees is the direct output of `cellCenter(row, col, order)`, which rounds once via `round()` before returning (`src/render/coords.js:59-65`, quoted verbatim: `export function cellCenter(row, col, order) { const size = cellSize(order); return { x: round(col * size + size / 2), y: round(row * size + size / 2), }; }`). Two points representing the **same** `(row, col)` are therefore bit-identical floats, not merely close — and two points representing **different** cells differ by at least one `cellSize` unit (≥ 100/9 ≈ 11.1 on the tightest kamea), several orders of magnitude above any rounding noise. So `t12 === 0` is a sufficient, exact test for "this segment is a zero-length repeat hop" — no epsilon tuning needed.

**Guard logic:**
```js
const EXACT_ZERO_KNOT = 0; // not an epsilon — see rationale above
if (t12 === EXACT_ZERO_KNOT) {
  // The segment itself is zero-length (a repeat run's coincident hop).
  // Emit a no-op 'L' to the same point rather than attempting Bezier
  // math with an undefined tangent direction — matches D-30 (markers/
  // loops, not the path, carry the repeat's visual weight anyway).
  return `L${formatCoord(Q1.x)},${formatCoord(Q1.y)}`;
}
if (t01 === EXACT_ZERO_KNOT) t01 = t12; // borrow the real neighboring interval
if (t23 === EXACT_ZERO_KNOT) t23 = t12;
```

**Trade-offs:** None significant — this is strictly simpler than three.js's epsilon approach and is exact rather than approximate, which is a determinism *asset* here (INT-03), not a risk.

### Pattern 3: Centripetal Tangent → Hermite → Bézier Control Points

**What:** With guarded `t01, t12, t23` in hand, compute tangents at `Q1` and `Q2` (tension = 0, this project has no tension knob):

```
m1 = (Q2 - Q1) + t12 * ( (Q1 - Q0)/t01 - (Q2 - Q0)/(t01 + t12) )
m2 = (Q2 - Q1) + t12 * ( (Q3 - Q2)/t23 - (Q3 - Q1)/(t12 + t23) )
```
[CITED: qroph.github.io/2018/07/30/smooth-paths-using-catmull-rom-splines.html, fetched this session, MEDIUM confidence — the `(1-tension)` factor is dropped here since tension=0 makes it 1]

Then convert to cubic Bézier control points via the standard Hermite→Bézier relationship (the tangent is scaled by ⅓ into a control-point offset — this is elementary Bézier/Hermite basis-function algebra, not a domain-specific formula; corroborated across multiple independent course-note sources) [CITED: multiple CS-course sources (CMU 15-462, CS 536 Drexel) converge on the same B1 = P1 + t0/3, B2 = P2 - t1/3 relationship, MEDIUM confidence]:

```
B0 = Q1
B1 = Q1 + m1/3
B2 = Q2 - m2/3
B3 = Q2
```

**Rounding discipline (D-31):** Round `B1.x, B1.y, B2.x, B2.y` **exactly once**, through the existing `roundGeometry` (`src/render/svg.js:83-86`, `GEOMETRY_PRECISION = 3`), computed from the already-rounded `Q0..Q3` inputs. `B0` and `B3` are literally `Q1`/`Q2` — already-rounded PathModel points, re-emit them unchanged, never recompute or re-round. This is the same "round once, at the point of computation" discipline `coords.js`'s own header comment states as the whole codebase's determinism contract.

**Emit as a `C` command:**
```js
`C${formatCoord(B1.x)},${formatCoord(B1.y)} ${formatCoord(B2.x)},${formatCoord(B2.y)} ${formatCoord(B3.x)},${formatCoord(B3.y)}`
```

### Pattern 4: Grid Lattice as One `d` String, Multiplication Not Accumulation

**What:** D-33 requires `order + 1` horizontal + `order + 1` vertical lines in one `<path>`. For line index `i` (0..order), the position is `i * cellSize(order)` — **compute it the same way `cellCenter` computes cell positions** (multiplication against the raw unrounded `cellSize()`, rounded once at the end via `roundGeometry`), not by accumulating (`position += cellSize` in a loop). `cellCenter` itself uses `col * size` (`src/render/coords.js:62`, quoted: `x: round(col * size + size / 2)`) — multiplication, not accumulation — so matching that exact pattern for grid lines keeps the codebase's one arithmetic convention singular instead of introducing a second, subtly different way to derive a position from `cellSize`. Accumulated addition and direct multiplication are NOT guaranteed to produce identical rounded results for the two non-terminating cell sizes this project has (`100/7` for Venus, `100/9` for Moon) — IEEE-754 addition is not perfectly associative, so 9 accumulated additions of `100/9` can drift from `9 * (100/9)` in the last bit before rounding, occasionally landing on a different 3-decimal value. Multiplication is also simpler to reason about and test (`gridLine(i, order) === roundGeometry(i * cellSize(order))`, a pure function of `i`, no loop-carried state).

**Example:**
```js
function gridLatticeD(order) {
  const size = cellSize(order);
  const lines = [];
  for (let i = 0; i <= order; i += 1) {
    const pos = roundGeometry(i * size);
    lines.push(`M0,${formatCoord(pos)} L100,${formatCoord(pos)}`); // horizontal
  }
  for (let i = 0; i <= order; i += 1) {
    const pos = roundGeometry(i * size);
    lines.push(`M${formatCoord(pos)},0 L${formatCoord(pos)},100`); // vertical
  }
  return lines.join(' ');
}
```
2×(order+1) commands — 20 for Moon (9×9), matching D-33's stated count exactly.

### Pattern 5: Glyph and Grid-Number Text Centering

**What:** `text-anchor="middle"` + `dominant-baseline="central"` is the established idiom for centering a mark inside a cell/viewBox point — D-34 already locks this exact pair for grid numbers; D-38's glyph layer (anchored at `(50,50)`) should use the identical pair for consistency, not `dominant-baseline="middle"` or the default `alphabetic`. `central` and `middle` differ only in font baseline-table fallback priority order when the active font lacks certain baseline tables [CITED: MDN dominant-baseline docs, MEDIUM confidence] — for the astrological symbol block, which is not typical alphabetic text, `central`'s ideographic-first fallback priority is the more conservative, glyph-agnostic choice, and it is also what D-34 already committed to for the grid layer, so using anything else for the glyph layer would introduce a second centering convention for no documented reason.

**Repositioning route (D-38):** a plain CSS `transform` on `.sigil-glyph` (e.g. `transform: translate(5px, -3px)`) is well-supported in evergreen browsers — this has shipped since ~2018 across Chrome/Firefox/Safari/Edge [CITED: multiple sources, MEDIUM confidence — exact current caniuse percentage not independently re-verified this session, see Assumptions Log]. Because the glyph's `x`/`y` anchor is a fixed absolute point `(50,50)`, not a percentage, there is no `transform-origin`/`geometry-box` percentage-resolution subtlety to document — a `translate()` in CSS px maps directly to SVG user units inside this project's fixed `0 0 100 100` viewBox.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Deterministic multi-embed id uniqueness | A hash of `(statement, planet, options)` as an implicit id prefix | Caller-supplied `idPrefix` option, id-free by default (D-44) | A hash of identical inputs produces identical ids for two identical sigils on one page — the exact collision Pitfall 9 warns about, just dressed up as a fix. D-44 already declined this; this research finds no reason to revisit it. |
| Curve smoothing | A general-purpose spline/curve-fitting library, or a second bespoke smoothing algorithm (e.g. Bezier fit via least squares) | The one specific, well-documented centripetal-Catmull-Rom-to-Bézier conversion (Pattern 2/3 above) | D-28 already locked the algorithm; there is exactly one correct formula to implement, not a design space to explore. |
| Astrological glyph rendering | Hand-authored vector glyph paths (7 custom outline drawings) | Literal Unicode code points from the astrological block, rendered as `<text>` | D-37's own rationale: font-licensing exposure and accuracy risk for no gain under the zero-dependency constraint; this research adds the corollary that the block is well-covered by mainstream system fonts (see Common Pitfalls) so the risk of a missing glyph is low. |

**Key insight:** every "don't hand-roll" temptation in this phase has already been pre-empted by a locked CONTEXT.md decision — the actual engineering risk in Phase 3 is not *whether* to hand-roll (the curve math, deliberately, is hand-rolled per D-28) but *getting the hand-rolled math's edge cases right*, which is what Patterns 1-4 above exist to specify precisely.

## Common Pitfalls

### Pitfall A: Coincident-Point Division by Zero in Curve Math (extends PITFALLS.md's general spline guidance)

**What goes wrong:** Computing `m1`/`m2` (Pattern 3) without first guarding `t01`, `t12`, `t23` against zero produces `NaN` coordinates the moment a PATH-02 repeat run or a path terminus is drawn in curve mode — `NaN` propagates silently into the `d` attribute as the literal string `"NaN"`, which browsers typically ignore/skip rather than crash on, so the bug can look like "the curve is just missing a bit" rather than an obvious hard failure.

**Why it happens:** Centripetal Catmull-Rom's knot-interval formula divides by the very distance term that goes to zero at coincident points — a well-documented general property of the algorithm [CITED: ScienceDirect "Parameterization and applications of Catmull-Rom curves" abstract, sciencedirect.com/science/article/abs/pii/S0010448510001533, MEDIUM confidence — confirms centripetal is cusp/self-intersection-safe WITHIN segments but says nothing about the zero-distance degenerate input case, which is a separate, well-known implementation concern general spline literature is largely silent on]. This project is *unusually* likely to hit it in normal use, not as a rare edge case — PATH-02 repeats are a shipped, common feature (the existing `matrix-repeat-*` snapshot fixtures exercise it on all seven planets already).

**How to avoid:** Pattern 2 above — the exact-zero guard, which this codebase can use instead of an epsilon because of the pre-rounding discipline in `coords.js`.

**Warning signs:** Any curved-mode snapshot containing the literal substring `NaN`; a curve-mode test using the existing `BKT RISES` repeat fixture failing or producing visually broken output around the repeat cell.

### Pitfall B: `var()` Silently No-Op-ing Inside Geometry Attributes

**What goes wrong:** Writing `d="M{x},{y}..."` or `cx="var(--sigil-node-x, ...)"` and expecting CSS to control it. `var()` only resolves inside attributes that map to an actual CSS property; `d`, and pre-SVG2 `cx`/`cy`/`r`/`x`/`y` as bare XML attributes, do not [CITED: MDN fill/stroke docs, cross-checked against multiple SVG-styling references, MEDIUM confidence]. Paint-family attributes (`fill`, `stroke`, `stroke-width`, `opacity`, `font-size`, `font-family`) DO resolve `var()` because they map onto real CSS properties.

**Why it happens:** The existing codebase already gets this right everywhere (D-41 codifies existing practice) — the risk is a Phase 3 executor reaching for `var()` on a *new* geometry-ish attribute the grid/glyph layers introduce (e.g., a tempting `font-size="var(--sigil-grid-number-size, ...)"` is fine — `font-size` is paint-family — but `x="var(--sigil-glyph-x, ...)"` would silently do nothing).

**How to avoid:** Every new attribute this phase adds must be classified before use: paint-family → `var()`-eligible; geometry-family → literal, derived from `cellSize`, per the existing fraction-constant pattern. D-41 already states the honest fallback for geometry theming: document that SVG2 CSS geometry properties (`r`, `cx`, `cy`, `x`, `y`) are settable directly from CSS in modern browsers — `rx` carries "Baseline 2024" status [CITED: MDN, MEDIUM confidence; extrapolated to sibling properties `cx`/`cy`/`r`/`x`/`y` which share the same SVG2 Geometry Properties spec section — see Assumptions Log A2] — so a site wanting different node geometry sets it in CSS directly rather than the tool faking a hook that wouldn't resolve.

**Warning signs:** A guard test asserting "every var()-wrapped attribute is paint-family" would catch this mechanically — worth adding alongside the no-`style=` and no-bare-color guards (D-42).

### Pitfall C: Two of Seven Glyphs Carry Real Emoji-Presentation Risk

**What goes wrong:** ♀ (Venus, U+2640) and ♂ (Mars, U+2642) are the only two of the seven glyphs (Saturn ♄ U+2644, Jupiter ♃ U+2643, Mars ♂ U+2642, Sun ☉ U+2609, Venus ♀ U+2640, Mercury ☿ U+263F, Moon ☽ U+263D) that carry the Unicode `Emoji` property at all [CITED: unicode.org/Public/17.0.0/ucd/emoji/emoji-data.txt, fetched this session, MEDIUM confidence]. Both **default to text presentation** (no `Emoji_Presentation` flag — they only become colorful emoji if explicitly suffixed with Variation Selector-16, U+FE0F, which this codebase's literal code-point map does not emit) [CITED: same source; cross-checked against Emojipedia's "female sign" entry, MEDIUM confidence]. So in principle, emitting the bare code point is already safe by default. In practice, some platforms' font-fallback chains (most notably Android/Chrome with Noto Color Emoji) have been documented to render default-text-presentation characters with a color-emoji glyph anyway, depending on which font in the fallback stack claims coverage first [CITED: chromium blink-dev "Intent to Prototype: CSS font-variant-emoji" thread + googlefonts/noto-emoji issue #290, MEDIUM confidence — this is a real, if second-order, platform inconsistency, not a spec violation].

**Why it happens:** Emoji-vs-text presentation is a font-fallback race, not a pure Unicode-property lookup, on some platforms — the spec says one thing, real font stacks occasionally do another.

**How to avoid:** Append **Variation Selector-15** (U+FE0E) after every glyph code point in `src/render/glyphs.js`'s map. VS15 forces text presentation deterministically, overriding any font-fallback ambiguity, and is a no-op (renders identically) on the five glyphs that were never emoji-eligible in the first place — so it is a strictly safe, uniform addition across all seven entries rather than a special case for just Venus/Mars. This does not conflict with D-37's locked code points — the visible character is unchanged; only an invisible presentation-selector codepoint is added.

**Warning signs:** A glyph rendering in color/multi-glyph style on Android Chrome when every other platform renders it monochrome; a `--sigil-glyph-fill` CSS override appearing to do nothing (a color-emoji glyph ignores `fill` entirely, since it's not a text-painted glyph).

### Pitfall D: Guard-Test Regexes That False-Positive Inside `<title>`

**What goes wrong:** `expect(svg).not.toContain('style=')` or a bare `id=` substring check can be defeated (made to falsely FAIL, i.e. flag a nonexistent violation) by a test fixture statement whose `title:true` output happens to literally contain those substrings — e.g. a statement like `"grid-id=1"` XML-escapes to nothing special (none of its characters are XML-reserved) and would land verbatim inside `<title>grid-id=1</title>`, tripping a naive `id=` substring guard even though no `id` *attribute* exists anywhere in the document.

**Why it happens:** A bare substring check doesn't distinguish "this text is an XML attribute" from "this text is prose that happens to contain the same characters."

**How to avoid:** Scope the regex to require the syntactic shape of an attribute: `/\sstyle\s*=/` (style) and `/\sid\s*=\s*"/` (id — requiring the opening quote specifically, since every real attribute in this codebase's output is double-quoted). Additionally, choose the D-42/D-43 guard-test statement fixtures deliberately (the existing `I WILL SUCCEED` / `BKT RISES` / `ŁĐĦŦ` fixtures already don't contain these substrings) rather than introducing a new fixture that does.

**Warning signs:** A guard test failing on a specific new statement fixture but not on the existing ones — check the fixture text itself before assuming the renderer regressed.

### Pitfall E: Exponential Float Notation — Verified Non-Issue, Not a Real Risk Here

**What goes wrong (in general):** `String()` on a JS number switches to exponential notation below roughly `1e-6` [CITED: MDN Number docs + Big.js docs cross-check, MEDIUM-HIGH confidence — ECMA-262 `Number::toString` uses exponential form for magnitudes with exponent ≤ -7], which would break the "shortest exact decimal string" contract `formatCoord` documents.

**Why it's not actually a risk in this codebase:** `GEOMETRY_PRECISION = 3` (`src/render/svg.js:77`, quoted verbatim: `const GEOMETRY_PRECISION = 3;`) means every geometry value this renderer emits is rounded to a multiple of `0.001` before formatting. The smallest possible nonzero magnitude under that rounding regime is `0.001` — four orders of magnitude above the `1e-6` exponential threshold. **As long as the new curve-control-point code rounds through the same `roundGeometry` before calling `formatCoord`** (Pattern 3's explicit instruction), exponential notation cannot occur. This is documented here specifically so an executor doesn't spend time building an unnecessary defensive check — the existing precision constant already makes this a non-issue, *provided* the single-rounding discipline is actually followed for the new Bézier control points.

**Warning signs:** Only a concern if a future change increases `GEOMETRY_PRECISION` past roughly 6, or if new code formats an *unrounded* intermediate value directly instead of routing it through `roundGeometry` first.

### Pitfall F (from PITFALLS.md, re-confirmed relevant): Negative Zero Is a Non-Issue

`Math.round()` can produce `-0` for small negative inputs (e.g. a Bézier control point computed as slightly negative before rounding). `String(-0) === '0'` in JS [CITED: multiple corroborating sources, HIGH confidence — this is settled, uncontroversial JS behavior] — the existing `formatCoord(n) { return String(n); }` pipeline already handles this correctly with zero special-casing needed. Documented here only so a Phase 3 executor doesn't add an unnecessary `Object.is(n, -0) ? 0 : n` guard that the codebase doesn't need.

## Code Examples

### Full curved-segment builder (composing Patterns 1-3)

```js
// src/render/curve.js
import { roundGeometry } from './svg.js'; // or hoist roundGeometry to coords.js if that's cleaner
import { formatCoord } from './coords.js';

function dist2(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return dx * dx + dy * dy;
}

function knotInterval(a, b) {
  return dist2(a, b) ** 0.25; // == sqrt(distance) == distance^0.5, avoids a separate sqrt call
}

function tangent(Q0, Q1, Q2, t01, t12) {
  return {
    x: (Q2.x - Q1.x) + t12 * ((Q1.x - Q0.x) / t01 - (Q2.x - Q0.x) / (t01 + t12)),
    y: (Q2.y - Q1.y) + t12 * ((Q1.y - Q0.y) / t01 - (Q2.y - Q0.y) / (t01 + t12)),
  };
}

/** One cubic Bezier 'C' command for the segment points[k] -> points[k+1]. */
function curvedSegment(points, k) {
  const Q0 = k === 0 ? points[k] : points[k - 1];
  const Q1 = points[k];
  const Q2 = points[k + 1];
  const Q3 = (k + 2 === points.length) ? points[k + 1] : points[k + 2];

  let t01 = knotInterval(Q0, Q1);
  const t12 = knotInterval(Q1, Q2);
  let t23 = knotInterval(Q2, Q3);

  if (t12 === 0) {
    return `L${formatCoord(Q2.x)},${formatCoord(Q2.y)}`; // coincident repeat hop, no-op
  }
  if (t01 === 0) t01 = t12;
  if (t23 === 0) t23 = t12;

  const m1 = tangent(Q0, Q1, Q2, t01, t12);
  const m2 = tangent(Q3, Q2, Q1, t23, t12); // mirrored: swap roles for the P2-side tangent

  const b1x = roundGeometry(Q1.x + m1.x / 3);
  const b1y = roundGeometry(Q1.y + m1.y / 3);
  const b2x = roundGeometry(Q2.x - m2.x / 3);
  const b2y = roundGeometry(Q2.y - m2.y / 3);

  return `C${formatCoord(b1x)},${formatCoord(b1y)} ${formatCoord(b2x)},${formatCoord(b2y)} ${formatCoord(Q2.x)},${formatCoord(Q2.y)}`;
}

/** Full curved 'd' string for a PathModel with >=2 points. */
export function curvedPathD(points) {
  const [first, ...rest] = points;
  const segments = rest.map((_, i) => curvedSegment(points, i));
  return [`M${formatCoord(first.x)},${formatCoord(first.y)}`, ...segments].join(' ');
}
```
*(Illustrative — final variable/module placement is executor discretion per CONTEXT.md; the arithmetic above is the load-bearing part.)*

### Guard test patterns

```js
// test/render/svg.test.js additions
const STYLE_ATTR = /\sstyle\s*=/;
const ID_ATTR = /\sid\s*=\s*"/;
const PAINT_ATTRS = ['fill', 'stroke', 'opacity', 'stroke-width', 'font-size', 'font-family'];

function paintAttrValues(svg, attr) {
  return [...svg.matchAll(new RegExp(`\\s${attr}="([^"]*)"`, 'g'))].map((m) => m[1]);
}

it('never emits a style attribute across all option combinations', () => {
  for (const svg of allCombinations()) {
    expect(STYLE_ATTR.test(svg)).toBe(false);
  }
});

it('every paint-family attribute value is var(--sigil-*) or a bare non-color keyword (none)', () => {
  for (const svg of allCombinations()) {
    for (const attr of PAINT_ATTRS) {
      for (const value of paintAttrValues(svg, attr)) {
        expect(value === 'none' || value.startsWith('var(--sigil-')).toBe(true);
      }
    }
  }
});

it('every --sigil-* property emitted also appears in the README theming table', () => {
  const readme = readFileSync('README.md', 'utf-8');
  const documented = new Set([...readme.matchAll(/\|\s*(--sigil-[a-z0-9-]+)\s*\|/g)].map((m) => m[1]));
  const emitted = new Set();
  for (const svg of allCombinations()) {
    for (const m of svg.matchAll(/var\((--sigil-[a-z0-9-]+)/g)) emitted.add(m[1]);
  }
  for (const name of emitted) expect(documented.has(name)).toBe(true);
});

it('emits zero id attributes when idPrefix is not supplied', () => {
  for (const svg of allCombinations({ idPrefix: undefined })) {
    expect(ID_ATTR.test(svg)).toBe(false);
  }
});
```

### Grid lattice construction

See Pattern 4 above (`gridLatticeD`).

### Glyph text element with VS15 mitigation (Pitfall C)

```js
// src/render/glyphs.js
export const PLANET_GLYPHS = {
  saturn: '♄︎',   // ♄ + VS15 (text presentation)
  jupiter: '♃︎',  // ♃ + VS15
  mars: '♂︎',     // ♂ + VS15 (real emoji risk without this)
  sun: '☉︎',      // ☉ + VS15
  venus: '♀︎',    // ♀ + VS15 (real emoji risk without this)
  mercury: '☿︎',  // ☿ + VS15
  moon: '☽︎',     // ☽ + VS15
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| SVG geometry (cx, cy, r, x, y) only settable as XML attributes | SVG2 defines them as CSS **Geometry Properties**, settable from a stylesheet | `rx` reached "Baseline 2024" (widely available across major engines since ~March 2024) [CITED: MDN, MEDIUM confidence] | This is D-41's documented escape hatch for geometry theming — accurate to state in the README as "modern browsers," not universally guaranteed, and not implementable via this tool's own `var()` hooks (Pitfall B) |
| Uniform Catmull-Rom for arbitrary point sequences | Centripetal (α=0.5) parameterization | Long-established (2008 Yuksel/Schaefer/Keyser SIGGRAPH paper on centripetal Catmull-Rom) | D-28 already made this choice for exactly the reason the literature gives — cusp/self-intersection avoidance on sharp direction changes, which kamea traversal produces constantly |

**Deprecated/outdated:** nothing in this phase's scope is deprecated — the whole surface (curve rendering, CSS custom properties, id-free SVG) is current, mainstream practice.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|----------------|
| A1 | Apple Symbols / macOS system font fallback has adequate coverage of the U+2600-26FF Miscellaneous Symbols block (the block containing all 7 planetary glyphs) | Common Pitfalls / Code Examples (glyph layer) | LOW-MEDIUM — could not find a directly cited macOS-specific coverage source this session (only Segoe UI Symbol/Windows and Noto Sans Symbols/cross-platform were directly confirmed). If macOS coverage is actually poor for some of the seven glyphs, users on Mac would see missing-glyph boxes (tofu) for the glyph layer specifically — cosmetic, not a correctness bug, and the README already documents "glyph rendering depends on the viewer having a font covering the astrological block" (D-38), so this assumption's blast radius is bounded by that existing disclosure. |
| A2 | SVG2 CSS Geometry Properties `cx`, `cy`, `r`, `x`, `y` share the same "Baseline 2024" browser-support status directly confirmed only for the sibling property `rx` | Common Pitfalls (Pitfall B), State of the Art | LOW — all these properties are defined in the same SVG2 spec section and typically ship together in browser engines' implementations; if one lagged behind the others the README's D-41 escape-hatch language ("modern browsers") would still be directionally correct, just imprecise about which specific browser versions |
| A3 | `dominant-baseline: central` cross-engine rendering reliability in 2026 (no specific caniuse-style compatibility matrix retrieved this session, only spec-level baseline-table-priority behavior) | Architecture Patterns (Pattern 5) | LOW — this exact attribute pair is already locked and shipping for the grid-number layer per D-34 (a prior, already-accepted decision); this research only extends the same pattern to the glyph layer, so any residual cross-browser risk is inherited from an existing, already-approved choice, not newly introduced |
| A4 | CSS `transform` on SVG `<text>` elements has current (2026) support across all evergreen browsers without caveats beyond the historical EdgeHTML-17-added-support (2018) data point found this session | Architecture Patterns (Pattern 5) | LOW — this feature has been broadly supported for 7+ years across Chrome/Firefox/Safari/Edge; the risk of a regression or holdout is very low, but no current-year caniuse percentage was independently pulled this session |

## Open Questions

1. **Should `perpendicularUnit`/`loopDirection`'s existing zero-length-vector fallback pattern in `svg.js` inform the curve module's error-handling style?**
   - What we know: `svg.js` already has an established idiom for "defensive fallback for a case that should not occur under current call sites" (see `perpendicularUnit`'s doc comment).
   - What's unclear: whether the curve module should adopt identical doc-comment phrasing/structure for its own exact-zero guard, purely for codebase consistency.
   - Recommendation: match the existing file's documentation voice when the plan is written — not a technical question, a style-consistency one, left to the plan/executor.

2. **Exact new custom-property names and default fraction constants** (grid stroke-width, grid-number font-size, glyph size) are explicitly Claude's Discretion in CONTEXT.md — this research does not attempt to pre-select specific numeric values, since CONTEXT.md defers that to the planner/executor and no research finding constrains the choice beyond "must be a `*_FRACTION` of `cellSize`, never a hardcoded absolute unit" (the existing pattern).

## Environment Availability

Skipped — this phase has no external tool/service dependencies beyond the Node.js runtime already established in Phase 1 (`>=20.0.0`, already verified available in this environment by the existing, passing test suite). No new CLI tools, databases, or services are introduced.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-------------------|
| V5 Input Validation | Yes | New options (`curve: boolean`, `glyph: boolean`, `idPrefix: string`) validated in the library per D-47 (`E_INVALID_OPTION`), not the CLI — continuing the existing INT-04/Anti-Pattern-3 posture. `idPrefix`, if supplied, is caller-controlled text that gets embedded directly into the `id="..."` attribute — this is new relative to Phase 1/2, since prior phases never interpolated caller-supplied strings into XML attribute values. |
| V6 Cryptography | No | Not applicable — no hashing/randomness is introduced (D-44 explicitly declines a hash-based id scheme) |
| Other categories | No | This library performs no auth, session management, or network I/O — same posture as Phase 1/2's threat model |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|-----------------------|
| `idPrefix` containing XML-reserved characters (`<`, `&`, `"`) breaking well-formedness, or containing characters that make the emitted `id` attribute value itself invalid/ambiguous when embedded raw | Tampering (malformed output) | `idPrefix` is caller-supplied *library* input (a build-time argument the embedding site's own developer controls), not end-user statement text — but it is still new: prior phases never interpolated any option value directly into an attribute value. Recommend XML-escaping `idPrefix` the same way `escapeXml()` already handles the `<title>` statement (`src/render/escapeXml.js`), on the same "never emit unescaped text into an attribute" principle, even though the practical risk is low (this is a programmatic library argument, not adversarial end-user input in the classic web sense). |
| Glyph/grid-number text nodes | Tampering | Not user-controlled — literal code points from a fixed map (`glyphs.js`) and integers from `kameaGrid()` (`data/kamea.js`). No escaping needed (Pitfall research question 4) since neither source can ever contain XML-reserved characters (`&<>"'`) — confirmed by inspection: the seven glyph code points (U+2609 through U+2644 range) and the digits 1..81 fall nowhere near the ASCII-range reserved characters. |
| Statement text still flows through unchanged from Phase 1/2 | (unchanged) | `escapeXml()` already covers the one place raw statement text can land in SVG (`<title>`, D-16) — Phase 3 adds no new place where statement text touches output, so no new escaping surface exists there. |

## Sources

### Primary (HIGH confidence — in-repo, read this session)
- `src/render/svg.js` — full file read, quoted verbatim for `GEOMETRY_PRECISION`, `roundGeometry`, existing layer composition pattern, `perpendicularUnit`/`loopDirection` fallback idiom
- `src/render/coords.js` — full file read, quoted verbatim for `cellCenter`'s single-rounding discipline (the basis of Pitfall A's exact-zero-guard argument)
- `src/generate.js`, `src/render/json.js`, `src/data/kamea.js`, `src/errors.js`, `bin/sigil-spinner.js`, `src/render/escapeXml.js`, `src/path/buildPath.js` — full files read, confirming existing seams D-35/D-46/D-47/D-16 attach to
- `test/determinism.test.js` — full file read, confirming existing snapshot-matrix conventions (`describe.each(PLANETS)`) the plan should extend
- `.planning/phases/03-themeable-embeddable-layers/03-CONTEXT.md`, `.planning/REQUIREMENTS.md`, `.planning/STATE.md`, `.planning/research/PITFALLS.md`, `.planning/research/ARCHITECTURE.md`, `.planning/research/STACK.md`, `README.md`, `.claude/CLAUDE.md`, `package.json` — full files read

### Secondary (MEDIUM confidence — cross-checked web sources, fetched this session)
- [Centripetal Catmull–Rom spline — Wikipedia](https://en.wikipedia.org/wiki/Centripetal_Catmull%E2%80%93Rom_spline) — knot parameter formula
- [Smooth Paths Using Catmull-Rom Splines — Mika's Coding Bits](https://qroph.github.io/2018/07/30/smooth-paths-using-catmull-rom-splines.html) — tangent formula, load-bearing for Pattern 3
- [three.js CatmullRomCurve3.js source, mrdoob/three.js](https://github.com/mrdoob/three.js/blob/master/src/extras/curves/CatmullRomCurve3.js) — reference epsilon-guard implementation, fetched directly
- [MDN: fill CSS property](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/fill), [MDN: Fills and strokes](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorials/SVG_from_scratch/Fills_and_strokes) — `var()` resolution rules
- [MDN: dominant-baseline](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/dominant-baseline) — central/middle/alphabetic baseline-table priority
- [SVGWG: Geometry Properties — SVG 2](https://svgwg.org/svg2-draft/geometry.html), MDN `rx` CSS property (Baseline 2024) — SVG2 CSS geometry properties
- [Unicode emoji-data.txt, 17.0.0](https://www.unicode.org/Public/17.0.0/ucd/emoji/emoji-data.txt) — fetched directly, confirms Venus/Mars-only Emoji property, no Emoji_Presentation flag
- [Emojipedia: Female Sign](https://emojipedia.org/female-sign) — cross-check for text-default-presentation claim
- [Chromium blink-dev: "Intent to Prototype: CSS font-variant-emoji"](https://groups.google.com/a/chromium.org/g/blink-dev/c/MaXgbE4vTbk), [googlefonts/noto-emoji#290](https://github.com/googlefonts/noto-emoji/issues/290) — font-fallback presentation-race risk
- Segoe UI Symbol block coverage — [fileformat.info blockview](https://www.fileformat.info/info/unicode/font/segoe_ui_symbol/blockview.htm?block=miscellaneous_symbols) — full 256/256 coverage of U+2600-26FF
- MDN Number reference + Big.js docs — JS exponential-notation threshold (~1e-6/exponent ≤ -7)
- Multiple corroborating sources — `String(-0) === '0'` (settled JS behavior, HIGH confidence)

### Tertiary (LOW confidence / not independently re-verified)
- Apple Symbols/macOS-specific glyph coverage (Assumption A1)
- Exact current-year caniuse percentages for `cx`/`cy`/`r` CSS properties beyond the `rx` Baseline-2024 data point, and for CSS `transform` on SVG `<text>` (Assumptions A2, A4)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new stack decisions, this phase adds zero packages, everything is re-confirmation of already-locked STACK.md/CONTEXT.md decisions
- Architecture: HIGH — layer seam, coordinate transform, and options-threading patterns are all pre-established and read directly from source this session
- Curve math (Patterns 1-3): MEDIUM — formula cross-checked across 2+ independent sources plus a reference implementation (three.js), but not independently re-derived from first principles or numerically tested this session
- Pitfalls (Common Pitfalls A-F): MEDIUM-HIGH — grounded in direct source reads (in-repo) combined with cross-checked web sources; the emoji-presentation and var()-resolution findings in particular are corroborated by 2+ independent sources each

**Research date:** 2026-08-06
**Valid until:** ~30 days for the in-repo/architecture findings (stable, locked decisions); ~90 days for the general web-platform facts (Catmull-Rom math, `var()` resolution rules, Unicode emoji-data semantics) since these are slow-moving standards, not fast-evolving library APIs — browser CSS-geometry-property support (Assumptions A2/A4) is the one sub-area worth re-checking if this phase's execution slips past a few months, since that specific corner of SVG2 support was still actively landing across engines as of the "Baseline 2024" data point found this session.
