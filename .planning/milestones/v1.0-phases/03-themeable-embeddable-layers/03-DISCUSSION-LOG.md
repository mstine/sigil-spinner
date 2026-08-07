# Phase 3: Themeable, Embeddable Layers - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-06
**Phase:** 3-Themeable, Embeddable Layers
**Mode:** `--auto` — no questions were put to the user. Every option below was auto-selected as the recommended default, grounded in the roadmap success criteria, `.planning/research/`, and the existing code. Review and override anything that reads wrong.
**Areas discussed:** Curve rendering, Kamea grid layer, Planetary glyph layer, CSS custom-property surface, Multi-embed id safety, Option surface and interface

---

## Curve rendering (REND-02)

### Q1 — Which curve algorithm?

| Option | Description | Selected |
|--------|-------------|----------|
| Hand-rolled centripetal Catmull-Rom (α = 0.5) → cubic Bézier | ~30 lines in-repo, zero dependency, full control over float formatting | ✓ |
| Hand-rolled uniform Catmull-Rom (α = 0) | Simpler math, but prone to cusps/self-intersection on sharp direction changes | |
| `d3-path` + `d3-shape` `curveCatmullRom.alpha(0.5)` | Battle-tested, but adds runtime deps and makes their float precision an invisible dependency of the determinism contract | |

**Choice:** centripetal, hand-rolled (**D-28**).
**Notes:** STACK.md names centripetal specifically because kamea traversal jumps around a grid — exactly the input uniform parameterization handles worst. d3 stays documented as the fallback.

### Q2 — What shape is the option?

| Option | Description | Selected |
|--------|-------------|----------|
| Boolean `curve`, default `false`, `--curve` flag | Matches the existing `--json` boolean and the flag name already in `.claude/CLAUDE.md` | ✓ |
| Enum `path: 'straight' \| 'smooth'` | More extensible if more curve styles arrive | |

**Choice:** boolean (**D-29**). Straight stays default and byte-identical to Phase 2 output.

### Q3 — Does curve mode move the markers?

| Option | Description | Selected |
|--------|-------------|----------|
| Only `sigil-path`'s `d` changes; all markers keep straight-segment geometry | Minimal blast radius; D-05/D-17–D-19 geometry stays byte-pinned | ✓ |
| End bar follows the spline's terminal tangent | Marginally better visual perpendicularity | |

**Choice:** path only (**D-30**).
**Notes:** A Catmull-Rom terminal tangent is derived from the last two points, so it already tracks the final straight segment closely — the visual cost of the simpler option is small, and it keeps every marker constant off the spline math.

### Q4 — Determinism treatment of curved output?

| Option | Description | Selected |
|--------|-------------|----------|
| Same single-rounding discipline at `GEOMETRY_PRECISION` 3; curved snapshots join the 7-planet matrix | Extends the existing contract unchanged | ✓ |
| Higher precision for curve control points | Smoother rendering, but a second precision rule to keep in sync | |

**Choice:** same discipline (**D-31**).

---

## Kamea grid layer (REND-03)

### Q1 — Always emitted or behind a flag?

| Option | Description | Selected |
|--------|-------------|----------|
| Always emitted, hidden by default, no flag | Success Criterion 2 says "present in the output, hidden by default, revealed by CSS alone" | ✓ |
| `--grid` opt-in flag | Matches `.claude/CLAUDE.md`'s anticipated flag list | |

**Choice:** always emitted (**D-32**).
**Notes:** This deliberately drops the `--grid` flag that the stack doc anticipated. SC2's wording wins; the plan should note the divergence rather than silently contradict `.claude/CLAUDE.md`.

### Q2 — How is "hidden by default" achieved?

| Option | Description | Selected |
|--------|-------------|----------|
| `opacity="var(--sigil-grid-opacity, 0)"` on a wrapping `<g class="sigil-grid">` | Exactly the D-06 node mechanism, already proven in the codebase | ✓ |
| `display`/`visibility` toggling | Removes it from hit-testing too, but breaks the established pattern | |

**Choice:** opacity custom property (**D-32**).

### Q3 — Lattice geometry?

| Option | Description | Selected |
|--------|-------------|----------|
| One `<path class="sigil-grid-lines">` with all horizontals, verticals, and the border | 20 line commands on Moon instead of 81 elements; one stroke contract | ✓ |
| One `<rect>` per cell | Per-cell styling possible, but 81 elements on Moon and a duplicated stroke surface | |
| Separate `<line>` elements | Individually addressable, still ~20 elements | |

**Choice:** single path (**D-33**).

### Q4 — Cell numbers?

| Option | Description | Selected |
|--------|-------------|----------|
| The kamea's actual magic-square values, one centered `<text class="sigil-grid-number">` per cell | This is what "cell numbers" means for a kamea | ✓ |
| Only the 1–9 cells the sigil can land on | Fewer elements, but a partial grid misrepresents the square | |

**Choice:** full magic-square values (**D-34**).
**Notes:** `text-anchor="middle"` and `dominant-baseline="central"` are typographic layout, not themeable presentation — the D-42 guard must not flag them.

### Q5 — How does the grid data reach the renderer?

| Option | Description | Selected |
|--------|-------------|----------|
| Through the render options object, like `statement` already travels | Established precedent; no cross-layer import, no PathModel change | ✓ |
| Add `grid` to the PathModel | One less parameter, but grid values are data, not path geometry | |
| Import `kameaGrid` directly in `render/svg.js` | Simplest, but breaks ARCHITECTURE.md's "`generate.js` is the only cross-layer importer" | |

**Choice:** render options object (**D-35**).

---

## Planetary glyph layer (REND-04)

### Q1 — Opt-in or always present?

| Option | Description | Selected |
|--------|-------------|----------|
| Opt-in `glyph` boolean, default `false`, `--glyph` flag | SC3 says "can be included as an optional layer" | ✓ |
| Always present, hidden by default (symmetric with the grid) | Consistent with D-32, but contradicts SC3's wording | |

**Choice:** opt-in (**D-36**).
**Notes:** The asymmetry with the grid is intentional and comes from the success criteria. The glyph is a visible mark; the grid is scaffolding.

### Q2 — Unicode text or vector outlines?

| Option | Description | Selected |
|--------|-------------|----------|
| `<text>` with the Unicode astrological character from a cited code-point map | Zero dependency, no font licensing exposure | ✓ |
| Hand-authored `<path>` outlines per planet | Font-independent rendering, but seven outlines to author, license, and verify | |

**Choice:** Unicode text (**D-37**), map in `src/render/glyphs.js`.
**Notes:** Trade-off accepted and documented — rendering depends on the viewer's font covering the astrological block; `--sigil-glyph-font` is the escape hatch.

### Q3 — Positioning?

| Option | Description | Selected |
|--------|-------------|----------|
| Anchored at viewBox center (50, 50); repositioned via CSS `transform`, sized/colored via `--sigil-glyph-*` | SVG `x`/`y` on `<text>` are not reliably CSS-settable; `transform` is | ✓ |
| Emit `x`/`y` as `var()` references | Reads like theming but silently does nothing in most engines | |

**Choice:** center anchor + CSS transform (**D-38**).

### Q4 — Layer order?

| Option | Description | Selected |
|--------|-------------|----------|
| grid → glyph → path → nodes → start → end → loops | Both backdrop layers behind the traced sigil, per REND-03's "behind" | ✓ |
| glyph on top of the path | Glyph as an overlay watermark | |

**Choice:** backdrop order (**D-39**).

---

## CSS custom-property surface (REND-05)

### Q1 — Naming convention?

| Option | Description | Selected |
|--------|-------------|----------|
| Flat `--sigil-<element>-<property>`, existing names frozen | Extends the five names already shipped; no breaking rename | ✓ |
| Reorganize into a nested/scoped scheme now | Cleaner long-term, but renames a live public contract | |

**Choice:** flat, frozen (**D-40**).

### Q2 — What gets a `var()`?

| Option | Description | Selected |
|--------|-------------|----------|
| Only CSS-mapped attributes (paint, opacity, stroke-width, font-size, font-family); geometry stays literal, with SVG 2 CSS geometry properties documented as the escape hatch | Honest — a `var()` in a non-CSS-mapped attribute silently does nothing | ✓ |
| Wrap geometry in `var()` too for surface completeness | Looks more themeable; is not | |

**Choice:** CSS-mapped only (**D-41**).

### Q3 — Enforcement?

| Option | Description | Selected |
|--------|-------------|----------|
| Guard test: no `style=`, no bare color literals, and every emitted `--sigil-*` name appears in the README theming table | Catches code/doc drift, not just markup regressions | ✓ |
| Regex test on `style=` only | Cheaper; misses hardcoded colors and doc drift entirely | |

**Choice:** full guard (**D-42**).

---

## Multi-embed id safety (REND-06)

### Q1 — Do ids exist at all?

| Option | Description | Selected |
|--------|-------------|----------|
| Stay id-free by construction; guard test asserts zero `id=` across all planets × option combos | Zero collisions because there is nothing to collide | ✓ |
| Emit a root id derived from a hash of the inputs | Satisfies REND-06's literal wording, but identical inputs → identical ids → the exact collision Pitfall 9 warns about | |

**Choice:** id-free, enforced (**D-43**).

### Q2 — Is there any namespacing mechanism?

| Option | Description | Selected |
|--------|-------------|----------|
| Optional caller-supplied `idPrefix`; no ids at all when absent | Uniqueness is guaranteed only where it can be — at the call site | ✓ |
| Deterministic hash of `(statement, planet, options)` per Pitfall 9's advice | Provides false safety under this project's own determinism guarantee | |

**Choice:** caller-supplied prefix, no hash (**D-44**).
**Notes:** This is a deliberate, documented departure from PITFALLS.md Pitfall 9's suggested fix. The reasoning is in CONTEXT.md so verification does not read it as an oversight.

### Q3 — Test shape for SC5?

| Option | Description | Selected |
|--------|-------------|----------|
| Two different sigils in one document string → zero id overlap; same input twice → byte-identical | Covers both halves: collision safety and determinism | ✓ |

**Choice:** both tests (**D-45**).

---

## Option surface and interface

### Q1 — CLI flags?

| Option | Description | Selected |
|--------|-------------|----------|
| `--curve`, `--glyph`, `--id-prefix <string>`; build an options object and pass it as `generateSigil`'s third argument | The CLI currently passes no options at all — this phase creates the seam | ✓ |
| Keep options library-only | Smaller diff; leaves the CLI unable to reach REND-02/REND-04 | |

**Choice:** three flags + options threading (**D-46**). No `--grid` (D-32).

### Q2 — Option validation?

| Option | Description | Selected |
|--------|-------------|----------|
| Library-side, new stable `SigilError` code `E_INVALID_OPTION` with structured data; unknown keys ignored; CLI maps to exit 2 | INT-04 and the D-15/D-26 posture | ✓ |
| Per-option error codes | More granular branching, more codes to keep stable | |
| Silently coerce bad option values | Smallest surface; hides caller mistakes | |

**Choice:** single library-owned code (**D-47**).

### Q3 — Does the working record the options?

| Option | Description | Selected |
|--------|-------------|----------|
| Add a `render` block with resolved option values | D-14's full-trail posture; a consumer can reproduce the exact SVG from the working alone | ✓ |
| Leave the working untouched | No snapshot rebase, but the working stops fully describing its own artifact | |

**Choice:** add the block (**D-48**). Construction fields untouched — that is what makes SC1 testable.

---

## Claude's Discretion

Auto-mode resolved the decisions above; these were left open for the planner and executor on purpose:

- Catmull-Rom endpoint convention (phantom endpoints vs. duplicated terminals) and tension clamping.
- All new default values — grid stroke-width, grid-number font-size fraction, glyph size fraction, and every new custom property's fallback — following the existing `cellSize`-derived `*_FRACTION` constant pattern.
- Exact new custom-property names within the D-40 convention, including whether grid numbers get their own opacity property.
- Whether `sigil-grid-number` elements sit in a nested `<g>`.
- Snapshot matrix shape for the new option combinations (all seven planets, both curve states required).
- README theming-table structure, so long as D-42's drift guard can read it.
- Whether curve math lives in `src/render/curve.js` or inside `src/render/svg.js` — never in `src/path/`.

## Deferred Ideas

- **`--title` CLI flag** exposing the existing library `title` option (D-16). Nearly free once D-46's options seam exists, but a new CLI capability outside REND-02..REND-06. Backlog alongside PKG-01.
- **`d3-path` / `d3-shape`** for curve interpolation — STACK.md's named fallback. Revisit only if D-28's hand-rolled math fights back.
- **Skinner / Golden Dawn kamea sets** (Phase 1's D-02) — still on the backlog, untouched here.
