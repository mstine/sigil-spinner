# Research Summary: Sigil Spinner

**Project:** Sigil Spinner (planetary kamea sigil generator)
**Domain:** Node.js CLI + library, deterministic SVG generation
**Researched:** 2026-08-04
**Confidence:** HIGH

## Executive Summary

Sigil Spinner is a deterministic, text-to-SVG generator for planetary kamea sigils—a dual CLI + library package built for programmatic invocation (specifically: Claude Code during site builds). This is not a web app or UI tool; it's a pure computation library that transforms an intention statement into a traditionally-correct kamea sigil rendered as semantic, CSS-stylable SVG with accompanying JSON "working" data.

The research reveals a well-scoped project with clear differentiators from existing occult sigil-generator web tools: while competitors are hosted forms that output PNGs for download, Sigil Spinner is the only tool designed to be scriptable, zero-dependency, and embeddable-with-theming. The architecture is a standard pipe-and-filter pipeline with established patterns and no architectural risk.

The primary risk surface is **correctness and edge cases**, not complexity. Critical concerns are: (1) kamea orientation—choosing and verifying the canonical Agrippa-attributed grids before any rendering work; (2) numerology table implementation—deriving from the Pythagorean cycling formula rather than copy-pasting to avoid Chaldean/legacy-I-J/U-V table contamination; (3) text-processing edge cases—vowel-only/single-letter statements, accented characters, Y-vowel ambiguity. All are flagged, documented, and preventable with discipline.

## Key Findings

### Recommended Stack

Node.js runtime (`>=20.0.0`, test against 22 & 24), `node:util.parseArgs` for CLI argument parsing (built-in, zero dependencies), and hand-rolled SVG string templating with no DOM dependencies are the three core decisions. Development uses JSDoc + `tsc --checkJs` for type safety without a build step, and Vitest for snapshot testing of deterministic output.

**Core technologies:**
- **Node.js (>=20.0.0):** Runtime with stable `node:util.parseArgs` API (stable since 20)
- **Hand-rolled SVG string generation:** No DOM emulation, no unnecessary abstractions
- **JSDoc + TypeScript type-checking:** Type safety without compilation via `tsc --checkJs`
- **Vitest snapshot testing:** Regression-proofing for byte-identical deterministic output

**Optional fallbacks:** `d3-path@^3` + `d3-shape@^3` for curve smoothing if hand-rolled Catmull-Rom proves fragile (hand-rolled preferred for v1).

### Expected Features

**Table stakes (correctness requirements):**
- Vowel + repeat-letter elimination (first occurrence, order preserved)—every surveyed generator uses this
- Pythagorean number-table encoding (1–9 cycling)—standard numerology substrate
- All seven classical planetary kameas (Saturn 3×3 → Moon 9×9)—missing any breaks the tool for that planet
- Number-sequence path tracing with start/end and repeat markers—this *is* the sigil
- Grid visibility (toggleable, hidden by default)—capability must exist even if UI default differs
- Planetary glyphs (♄♃♂☉♀☿☽)—identifies the working
- SVG + JSON output—for embedding and audit trails
- Deterministic output—required for reproducibility

**Differentiators:**
- CLI + library, stdout-by-default—no competitor is scriptable
- Semantic CSS classes on every element—enables theming without markup changes
- CSS custom-property hooks—standard best practice for SVG theming
- Configurable straight vs. curved rendering—stylistic knob without altering construction
- Zero runtime dependencies—matches design-element library best practice

**Defer to v1.x or v2+:**
- Curved path rendering, advanced CSS hooks, hosted UI, extended kameas, Rose Cross methods

### Architecture Approach

Pure pipe-and-filter pipeline: text → letters → numbers → cells → path → SVG/JSON. Key insight: **renderer-agnostic PathModel** (plain object, not SVG) feeds both SVG and JSON renderers, guaranteeing they describe the same sigil.

**Major components:**
1. Text normalization—strike vowels/repeats, preserve order, edge-case handling
2. Data modules—static kamea/numerology/glyph data, isolated, zero dependencies
3. Path builder—number sequence + planet → abstract PathModel (points, segments, markers)
4. SVG renderer—PathModel → SVG string with semantic classes and CSS custom-property hooks
5. JSON renderer—pipeline intermediates → "working" JSON (letters, numbers, cells)
6. Orchestrator—chains stages, retains intermediates, exposes public API
7. CLI—thin wrapper: argv → orchestrator → stdout/file

### Critical Pitfalls (Top 5 by Impact)

1. **Kamea orientation ambiguity:** Eight dihedral variants per square exist mathematically; sources disagree. **Mitigation:** Pick ONE primary source (Agrippa edition or vetted secondary), hard-code all seven grids as literal arrays, document source explicitly, cross-check Saturn 3×3 against independent source before Phase 1 completion.

2. **Numerology table conflation:** Chaldean (1–8, non-alphabetical) and Pythagorean (1–9, cycling) are incompatible; web sources mix them. **Mitigation:** Derive Pythagorean table programmatically from cycling formula, bake test vectors (A=1, I=9, J=1, R=9, S=1, Z=8) to reject Chaldean variants structurally.

3. **Degenerate text inputs:** Vowel-only or single-letter statements reduce to empty or single-point sigils. **Mitigation:** Define behavior upfront (empty → clear error; single → valid single-node output), add both as first-class test fixtures.

4. **CSS-styleability broken:** Inline `style=""` or hardcoded presentation attributes defeat theming. **Mitigation:** Never emit `style=""`; express every themeable value as CSS class or `attribute="var(--sigil-x, <default>)"`.

5. **ID collisions on multi-embed:** Fixed element ids cause reference breakage when two sigils are on the same page. **Mitigation:** Namespace all ids with deterministic per-instance prefix (hash of statement+planet); test two embedded sigils asserting zero id overlap.

## Implications for Roadmap

**Suggested 5-phase structure:**

### Phase 1: Core Data & Text Normalization (BLOCKING)
- Lock canonical kamea grids (hard-coded, sourced, verified)
- Derive Pythagorean table from cycling formula
- Text normalization (vowels, repeats, edge cases, accented chars, Y-handling)
- **Avoids:** Pitfalls 1–6
- **Critical:** Kamea data locked before any downstream work begins

### Phase 2: Path Building & Geometry
- Number-sequence path tracing
- Repeat-detection logic (cross-letter collisions)
- Start/end/repeat marker positioning
- Abstract PathModel (plain object feeding both renderers)
- **Avoids:** Pitfall 7
- **Depends on:** Phase 1

### Phase 3: SVG Rendering & Styling
- SVG string generation (template literals)
- Semantic CSS classes on all elements
- CSS custom-property hooks with defaults
- Per-layer sub-renderers (grid, path, markers, glyph)
- Unified coordinate transform (scales all 7 planets)
- Optional: curved path rendering (hand-rolled or d3-shape fallback)
- **Avoids:** Pitfalls 8–10
- **Depends on:** Phase 2

### Phase 4: CLI Wrapper & Library Export
- `generateSigil(statement, planet, options)` orchestrator
- Public library API via `src/index.js`
- CLI argument parsing + I/O
- Validation in library (not CLI-only)
- **Avoids:** Anti-pattern 3
- **Depends on:** Phases 1–3

### Phase 5: Testing, Packaging & Distribution
- Snapshot tests (SVG + JSON for all 7 planets)
- Edge-case test fixtures (vowel-only, single-letter, accented)
- Multi-sigil scenario test (two inputs, zero id overlap)
- Determinism verification (byte-equality)
- ESM-only packaging, `.gitattributes` (LF on bin script)
- Smoke test via `npm pack && npm install <tarball> -g`
- **Avoids:** Pitfalls 11–12
- **Depends on:** Phases 1–4

**Ordering rationale:** Phases 1–2 are strictly sequential (data must lock before path logic). Phase 3 is independent but logically grouped. Phases 4–5 are post-completion hardening. Feature MVP = phases 1–4 complete. v1.x additions (curves, advanced CSS) come from phase 3 deferral.

**Research flags:**
- **Phase 1 (BLOCKS ALL):** Must identify canonical kamea source (Agrippa edition or verified scholarly secondary) and cross-verify Saturn 3×3 before hard-coding grids
- **Phase 3 (OPTIONAL):** Curve smoothing research only if hand-rolled Catmull-Rom artifacts appear on real kamea paths; centripetal parameterization (d3-shape alpha=0.5) is documented fallback

**Standard patterns (no research needed):**
- Phase 2: Geometric path building is standard compute
- Phase 3: SVG rendering and CSS custom properties are standard web practices
- Phase 4: CLI/library dual-export is established Node.js pattern (bytefield-svg precedent)
- Phase 5: Vitest snapshots and npm packaging are standard tooling

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Versions verified against npm registry; all major choices corroborated (parseArgs stability, server-side SVG, Vitest snapshots) |
| Features | MEDIUM-HIGH | Feature table aligns with PROJECT.md; uncertainty is in canonical Agrippa grids and repeat-marker convention needing primary source verification |
| Architecture | HIGH | Pure pipeline is proven pattern; low architectural risk; challenge is engineering discipline not rework |
| Pitfalls | HIGH | All 12 pitfalls corroborated by multiple independent sources with clear, actionable prevention strategies |
| **Overall** | HIGH | Research is comprehensive, consistent, achievable within one sprint. No showstoppers. |

### Gaps to Address During Planning

1. **Canonical kamea grid source:** Identify specific primary source (Agrippa edition/reprint or vetted scholarly compilation) and cross-verify Saturn 3×3 before Phase 1 implementation. Document source in code comments and README.

2. **Repeat-marker convention:** Review existing generators (chaostarot.com, planetarysigils.com) for visual reference on marker geometry on 3+ consecutive repeats and at sequence boundaries. Lock rule in CODE_STANDARDS.md.

3. **Y-vowel handling rule:** Lock "always consonant" convention explicitly (or choose alternative based on traditional sources) and cite in code and README during Phase 1.

4. **Curve smoothing verification:** Low-priority; only trigger research if Phase 3 testing reveals artifacts. d3-shape centripetal parameterization is documented fallback.

## Sources

**High Confidence (verified):**
- npm registry (Node.js, Vitest, TypeScript versions)
- Microsoft DevBlogs (TypeScript 7.0)
- Node.js release schedule
- d3-path npm docs
- bytefield-svg GitHub (CLI/library pattern)
- Aeternum.fr (kamea orientation variants)
- bostjanlovrat.com (Chaldean vs. Pythagorean numerology)
- MDN/Aspose (SVG CSS specificity)
- GitHub issues: site-kit-wp#6146 (ID collisions), npm#4607 (CRLF shebang issues)

**Medium Confidence:**
- chaostarot.com, planetarysigils.com (feature survey)
- General web search on Austin Osman Spare method (cross-checked across sources)

**Needs Validation During Phase 1:**
- Exact canonical Agrippa kamea layouts
- Repeat-marker geometric convention
- Y-vowel handling rule

---

*Research synthesized: 2026-08-04*
*All 4 research files analyzed*
*Ready for roadmap planning: YES*
