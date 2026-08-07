# Walking Skeleton — Sigil Spinner

**Phase:** 1
**Generated:** 2026-08-04

## Capability Proven End-to-End

`sigil-spinner "I WILL SUCCEED" --planet saturn` writes a correct, traditionally-constructed Saturn
sigil to stdout as self-contained inline SVG, and the same call through the library returns that SVG
plus the JSON working that narrates its derivation.

This is a CLI + library project, not a web app. The stack it must prove end-to-end is:
**canonical data table → text normalization → numeric encoding → kamea cell lookup → geometry →
serialized artifact → process stdout.** The tracer slice (plan 01-02, Task 1) touches every one of
those layers with a real call on one real statement.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Runtime | Node.js `>=20.0.0`, ESM-only (`type: module`) | `node:util.parseArgs` stable since Node 20; the primary consumer (Claude Code in build pipelines) is ESM-native, so dual CJS publishing is unearned complexity |
| Build step | None — plain `.js` is what runs | The core value is being trivially invocable; "the source isn't what runs" is friction at this size |
| Type safety | JSDoc + `tsc --allowJs --checkJs --noEmit` | Editor and CI type coverage for a programmatic consumer without a compile step |
| Canonical data | Seven kamea grids as literal row-major arrays in `src/data/kamea.js`, keyed by set name, default `agrippa` (D-01, D-02) | 8 dihedral variants of every magic square are mathematically valid but traditionally distinct; generated squares are *a* magic square, not *the* kamea. Provenance is the asset, so the data is human-signed-off (D-04) before commit |
| Numeric encoding | Derived from the cycling formula, never transcribed (CONS-02) | Structural immunity to Chaldean and legacy I/J-U/V contamination — the wrong-system bug becomes impossible rather than merely tested-against |
| Rendering | Hand-rolled string templating, zero runtime dependencies | Output is deterministic markup from known geometry; a DOM library would drag in `jsdom`-class emulation to string-serialize something whose final shape is already known |
| Geometry | Fixed `viewBox="0 0 100 100"` for all planets, cell size = 100 / order, ONE shared `cellCenter()` (D-07) | All seven planets render at consistent scale side by side; duplicated coordinate math is how the path, grid, and marker renderers silently drift apart |
| Determinism | Coordinates rounded exactly once, in `cellCenter()`; fixed attribute and key emission order; snapshot tests assert byte equality | "Same statement + planet + options → identical sigil" is a published contract, not an aspiration; sigils are reproducible design elements, not random art |
| Theming | Semantic BEM-ish classes plus `var(--sigil-*, fallback)` on every paint attribute; no inline styling attributes, no ids in Phase 1 (D-05, D-08) | Inline styles beat all embedding-site CSS including `!important`; ids collide when two sigils share a page |
| Error contract | `SigilError` with a stable `.code`; validation lives in the library, never in the CLI (D-15) | The library is a first-class consumer surface — a programmatic caller must get identical guarantees to a CLI caller |
| Directory layout | `src/{data,text,path,render}/` + `src/generate.js` + `src/index.js` + `bin/sigil-spinner.js` | `generate.js` is the only module importing across `data/`, `text/`, and `path/`; every other module stays legible in isolation |
| Test runner | Vitest with snapshot testing | The phase's success criteria are literally snapshot-shaped: byte-identical SVG and JSON for identical input |

## Stack Touched in Phase 1

- [ ] Project scaffold — ESM `package.json`, `bin` entry, Vitest, `tsc --checkJs`, ESLint, Prettier, `.gitattributes` LF guard *(plan 01-01, Task 2)*
- [ ] Canonical data layer — all seven kamea grids and the Pythagorean encoder, human-signed-off and cited *(plan 01-01, Tasks 3 and 4)*
- [ ] Pipeline — normalize → encode → cell lookup → PathModel, every stage a pure function *(plan 01-02, Task 1)*
- [ ] Renderer — PathModel → self-contained inline SVG string with full class and custom-property hooks *(plan 01-02, Tasks 1 and 2)*
- [ ] Second consumer of the same model — PathModel → JSON working, proving the renderer-agnostic seam is real *(plan 01-03, Task 1)*
- [ ] Entry points — importable `generateSigil()` and an executable `sigil-spinner` CLI *(plans 01-02 and 01-03)*
- [ ] Full-stack run command — `node bin/sigil-spinner.js "I WILL SUCCEED" --planet saturn` and `npm test` *(plan 01-03, Task 3)*

## Out of Scope (Deferred to Later Slices)

Explicit, so later phases do not re-litigate Phase 1's minimalism:

- Planet selection beyond Saturn — all seven grids ship and are tested, but only Saturn is exercised end-to-end (KAMEA-02, Phase 2)
- Consecutive-repeat loop/notch markers (PATH-02, Phase 2)
- Degenerate-input UX polish — Phase 1 carries only a crash guard: a one-letter sequence renders a single-node sigil and an empty sequence throws `E_EMPTY_SEQUENCE` (CONS-03, Phase 2)
- Non-ASCII/accented normalization and the documented Y rule — Y is a consonant in Phase 1 and that choice is Phase 2's to formalize (CONS-04, Phase 2)
- Byte-identical determinism verified across all seven planets (INT-03, Phase 2) — Phase 1 asserts it for Saturn
- Curved/smoothed path rendering (REND-02, Phase 3)
- Kamea grid layer and planetary glyph layer (REND-03, REND-04, Phase 3)
- The full `--sigil-*` custom-property surface with documented defaults (REND-05, Phase 3) — Phase 1 only guarantees it never hardcodes a presentation value
- Per-instance id namespacing for multi-embed pages (REND-06, Phase 3) — Phase 1 sidesteps it by emitting no ids at all
- npm publication and clean-install smoke tests (PKG-01, v2)
- Kamea-set version field in the JSON output (PKG-02, v2)
- Skinner and Golden Dawn kamea sets — the set-aware data layer supports them structurally from day one, but each ships only after its own full seven-grid verification (CONTEXT Deferred Ideas)

## Subsequent Slice Plan

Each later phase adds one vertical slice on top of this skeleton without altering its architectural
decisions:

- **Phase 2 — Every Planet, Every Statement:** widen the exercised path from Saturn to all seven
  planets (the data layer already answers `cellForNumber(planet, n)` for every one, so this is a
  library and CLI widening, not a data change), add the consecutive-repeat marker as a new PathModel
  segment type consumed by the existing renderer, harden the input surface, and prove byte-identical
  determinism across all seven.
- **Phase 3 — Themeable, Embeddable Layers:** add grid and glyph layers as new sub-renderers composed
  by the existing `renderSvg` seam, add curve rendering as a render-time option over the unchanged
  PathModel, publish the full `--sigil-*` surface, and introduce deterministic per-instance id
  namespacing.
