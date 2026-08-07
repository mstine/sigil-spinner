# Spec-less Edge Probe — resolved report (Phase 3)

Source: `edge-probe.cjs` over the five phase requirement IDs (no SPEC.md exists → `EDGE_ABSENT=1`).
18 applicable edges raised, 18 dispositioned: **16 covered, 2 backstop, 0 dismissed, 0 unresolved.**
(Never auto-dismissed — every row below is either a writable acceptance criterion or an explicit backstop.)

## Covered → lift each into `must_haves.truths` as a plain string

| # | req | category | truth |
|---|-----|----------|-------|
| 1 | REND-02 | boundary | With `curve:true`, a two-point path (the minimum that emits a path at all) produces a `sigil-path` with a well-formed non-empty `d` containing no `NaN`; a one-point path emits zero `sigil-path` elements, identically in both curve modes. |
| 2 | REND-02 | precision | Every curve control point is rounded exactly once at computation time via the existing `roundGeometry` at `GEOMETRY_PRECISION` 3, never re-rounded from an already-rounded value, and serialized through the existing `formatCoord`. |
| 3 | REND-03 | boundary | The grid layer renders at both kamea extremes: 4 horizontal + 4 vertical lines and 9 numbers at order 3 (Saturn); 10 + 10 lines and 81 numbers at order 9 (Moon). No order outside 3–9 is reachable — `gridSize` throws `E_UNKNOWN_PLANET` first. |
| 4 | REND-03 | adjacency | The lattice `d` emits each boundary line exactly once — the outer border is not redrawn on top of the first and last lattice lines. Total line count is exactly `2 * (order + 1)`. |
| 5 | REND-03 | empty | There is no empty-grid state: every planet's kamea is complete, so the grid group always holds exactly one `sigil-grid-lines` path and exactly `order²` `sigil-grid-number` elements. |
| 6 | REND-03 | encoding | Grid-number text content is ASCII digits only (values 1–81); it requires no XML escaping and its byte length equals its code-point length. |
| 7 | REND-03 | ordering | Grid-number elements are emitted in fixed row-major order (row 0 col 0 → row `order-1` col `order-1`) for every planet, so output is stable across runs. |
| 8 | REND-03 | precision | Lattice line positions are computed as `i * cellSize` (multiplication from index), never by accumulated addition, and rounded once at precision 3 — so Venus (100/7) and Moon (100/9) emit identical bytes across runs and platforms. |
| 9 | REND-04 | empty | With `glyph` absent or `false` the output contains zero occurrences of `sigil-glyph`; with `glyph:true` it contains exactly one, for every one of the seven planets. |
| 10 | REND-04 | encoding | Each glyph map entry is exactly two code points — the astrological character plus U+FE0E — emitted raw into the SVG. None of the seven is `<`, `>`, `&`, or a quote, so no XML escaping is required, and the emitted string is UTF-8 with no XML declaration. |
| 11 | REND-05 | empty | Every emitted `var(--sigil-*, …)` reference carries a non-empty inline fallback, so the artifact renders correctly with no stylesheet applied at all. |
| 12 | REND-05 | encoding | All custom-property names match `^--sigil-[a-z0-9-]+$` (ASCII kebab-case); comparison against the README theming table is exact string equality after trimming. |
| 13 | REND-05 | ordering | Attribute order within every emitted element is fixed by the template literal that builds it and is never derived from object-key iteration, so output is byte-stable. |
| 14 | REND-06 | adjacency | Two sigils rendered with the **same** `idPrefix` into one document DO collide — by design. Uniqueness under identical prefixes is the caller's responsibility and is documented in the README; the library never invents a per-call unique value because that would break determinism (D-44). |
| 15 | REND-06 | empty | With `idPrefix` absent, the generated SVG contains zero `id` attributes for every planet × every option combination — asserted by a guard test that matches `id=` on an attribute boundary so `stroke-width=`, `grid=`, and similar cannot false-positive. |
| 16 | REND-06 | ordering | Layer emission order is fixed (grid → glyph → path → nodes → start → end → loops) independent of every option, so an id-bearing render and an id-free render differ only by the root element's attribute list. |

## Backstop → lift as flat-scalar `{ statement, verification: backstop }` in `must_haves.truths`

| # | req | category | statement | verification |
|---|-----|----------|-----------|--------------|
| B-E1 | REND-05 | adjacency | The D-42 README drift guard matches custom-property names on exact token boundaries, not substring containment — `--sigil-grid-number-font` must not be reported as satisfied merely because `--sigil-grid-number-font-size` appears in the README table. *(One proposed name is a strict prefix of another; a naive `readme.includes(name)` check passes vacuously and the guard silently stops guarding.)* | backstop |
| B-E2 | REND-02 | precision | No emitted curve coordinate serializes as `-0` or in exponential notation (e.g. `1e-7`) in any of the seven planets' curve-mode snapshots. *(`String(n)` is the project's serializer; `String(-0)` → `"0"` is benign but `String(1e-7)` → `"1e-7"` is not valid SVG path syntax in that position and would break byte-determinism comparisons. Spline math can produce sub-precision magnitudes that straight-segment math never did.)* | backstop |

## Additional security-relevant edge (REND-06, encoding) — feeds the threat model

| # | req | category | truth |
|---|-----|----------|-------|
| 17 | REND-06 | encoding | A caller-supplied `idPrefix` is XML-escaped through the existing `escapeXml` before being emitted into the `id` attribute, so a prefix containing `"`, `'`, `<`, `>`, or `&` cannot terminate the attribute or inject markup into the generated SVG. |

*(Row 17 is the resolution of the REND-06 `encoding` probe row. `idPrefix` is the first and only caller-controlled string this project has ever emitted into SVG **markup** — the statement itself was previously the only untrusted input and it is `escapeXml`'d and off by default (D-16). This is the phase's single genuine injection surface and must appear in the `<threat_model>`.)*

## No-silent-drop equality check

Probe-surfaced applicable edges: **18**. Authored into `must_haves`: **18** (16 truths + 2 backstops), with row 17 authored as the REND-06/encoding resolution. 0 dismissed, 0 dropped.
