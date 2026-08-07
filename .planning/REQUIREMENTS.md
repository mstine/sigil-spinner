# Requirements: Sigil Spinner

**Defined:** 2026-08-04
**Core Value:** Given any intention statement and any of the seven classical planets, the tool deterministically produces a correct, traditionally-constructed sigil as embeddable, fully CSS-stylable SVG.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Construction (text → numbers)

- [x] **CONS-01**: User can supply an intention statement; the tool strikes vowels and repeating letters, keeping the first occurrence of each letter in order
- [x] **CONS-02**: The tool encodes the remaining letters via the Pythagorean Number Table, derived from the 1–9 cycling formula (structurally immune to Chaldean/legacy-table contamination)
- [x] **CONS-03**: Degenerate inputs are handled with defined behavior — empty result (all vowels/repeats) produces a clear error; a single-letter result produces a valid single-node sigil
- [x] **CONS-04**: Non-ASCII/accented letters and Y-handling follow a documented, deterministic rule cited in code and README

### Kamea (planetary squares)

- [x] **KAMEA-01**: All seven classical planetary kameas (Saturn 3×3, Jupiter 4×4, Mars 5×5, Sun 6×6, Venus 7×7, Mercury 8×8, Moon 9×9) are hard-coded as literal arrays from a single cited canonical source
- [x] **KAMEA-02**: User can select any of the seven classical planets; number sequence maps to cells via direct 1–9 cell lookup on the chosen kamea
- [x] **KAMEA-03**: Kamea layouts are verified against an independent source before lock (orientation/dihedral-variant check), with the source lineage documented

### Path (sigil geometry)

- [x] **PATH-01**: The tool traces the number sequence across the kamea as an ordered path with a start marker at the first cell and an end marker at the last
- [x] **PATH-02**: Consecutive repeat numbers produce the traditional loop/notch marker at that cell (triggered only on consecutive repeats, not any recurrence)
- [x] **PATH-03**: Path geometry is produced as a renderer-agnostic PathModel consumed identically by SVG and JSON outputs

### Rendering (SVG output)

- [x] **REND-01**: The tool emits self-contained, viewBox-based inline SVG with semantic CSS classes on every element (path, nodes, start/end markers, layers)
- [ ] **REND-02**: Path rendering is configurable — straight segments by default, curved/smoothed via flag, without altering the underlying construction
- [x] **REND-03**: A kamea grid layer (cell borders + numbers) renders behind the sigil, hidden by default and revealable via CSS
- [x] **REND-04**: A planetary glyph layer (♄ ♃ ♂ ☉ ♀ ☿ ☽) is available as an optional SVG layer
- [ ] **REND-05**: All themeable values are expressed as CSS custom properties (`--sigil-*`) with defaults — no inline `style=""` attributes, no hardcoded presentation values that defeat theming
- [ ] **REND-06**: Multiple sigils embedded on one page do not collide — all internal SVG ids are deterministically namespaced per instance

### Output (working data)

- [x] **OUT-01**: The tool emits a JSON "working" alongside the SVG — letters kept, number sequence, cell coordinates — from the same generation call, guaranteed consistent with the rendered sigil

### Interface (CLI + library)

- [x] **INT-01**: The tool is importable as an ESM library exposing a pure `generateSigil(statement, planet, options)` function returning SVG + JSON
- [x] **INT-02**: The tool is invocable as a CLI — statement + planet + flags → SVG/JSON to stdout by default, file via `--output` — as a thin wrapper over the library
- [x] **INT-03**: Identical input always produces byte-identical output (determinism verified by snapshot tests across all seven planets)
- [x] **INT-04**: Input validation lives in the library (not the CLI), so programmatic consumers get identical guarantees and clear errors

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Packaging & Distribution

- **PKG-01**: Published npm package with clean-install smoke test (`npm pack && npm install`) across platforms
- **PKG-02**: Kamea-set version field in JSON output for long-term reproducibility contracts

### Wrappers

- **WRAP-01**: `<sigil-spinner>` web component as a thin wrapper over the library
- **WRAP-02**: Hosted web UI layered on the stable library

## Out of Scope

| Feature | Reason |
|---------|--------|
| Hosted web UI / interactive form | Primary consumer is Claude Code in build contexts; UI competes with core correctness work (v2 candidate at most) |
| PNG/raster export | Solved generic problem; conflicts with zero-runtime-dependency constraint — consumers rasterize downstream |
| Extended kameas (Uranus/Neptune/Pluto) | No canonical Agrippa-lineage kamea exists; breaks "traditionally correct, not approximated" |
| Scaled/multi-digit number-to-cell mapping | Live methodological dispute; direct 1–9 mapping chosen deliberately in PROJECT.md Key Decisions |
| Rose Cross / circular sigil layout | Different geometry and construction rules — a separate method, not a kamea variant |
| Real-time interactive preview | No UI layer exists; determinism + fast generation makes any future UI trivially able to fake it |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CONS-01 | Phase 1 | Complete |
| CONS-02 | Phase 1 | Complete |
| CONS-03 | Phase 2 | Complete |
| CONS-04 | Phase 2 | Complete |
| KAMEA-01 | Phase 1 | Complete |
| KAMEA-02 | Phase 2 | Complete |
| KAMEA-03 | Phase 1 | Complete |
| PATH-01 | Phase 1 | Complete |
| PATH-02 | Phase 2 | Complete |
| PATH-03 | Phase 1 | Complete |
| REND-01 | Phase 1 | Complete |
| REND-02 | Phase 3 | Pending |
| REND-03 | Phase 3 | Complete |
| REND-04 | Phase 3 | Complete |
| REND-05 | Phase 3 | Pending |
| REND-06 | Phase 3 | Pending |
| OUT-01 | Phase 1 | Complete |
| INT-01 | Phase 1 | Complete |
| INT-02 | Phase 1 | Complete |
| INT-03 | Phase 2 | Complete |
| INT-04 | Phase 2 | Complete |

**Coverage:**

- v1 requirements: 21 total
- Mapped to phases: 21 ✓
- Unmapped: 0

**Per-phase counts:**

- Phase 1 (First Sigil, End to End): 10 requirements
- Phase 2 (Every Planet, Every Statement): 6 requirements
- Phase 3 (Themeable, Embeddable Layers): 5 requirements

---
*Requirements defined: 2026-08-04*
*Last updated: 2026-08-04 after roadmap creation (traceability populated)*
