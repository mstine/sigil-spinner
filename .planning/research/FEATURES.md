# Feature Research

**Domain:** Planetary kamea sigil generator (Node CLI + library, CSS-stylable SVG output)
**Researched:** 2026-08-04
**Confidence:** MEDIUM

## Feature Landscape

Sigil Spinner sits at the intersection of two established but very different feature traditions:

1. **Occult sigil-generator web apps** (chaostarot.com's kamea/rose-cross/word-method generators, planetarysigils.com, explicit.name's angel-sigil tool, various chaos-magic mobile apps) — these define what "correct" and "expected" looks like *symbolically*: letter-elimination rules, kamea layouts, repeat-number handling, planetary correspondences.
2. **Programmatic SVG / diagram-generator CLIs and libraries** (bytefield-svg, svg-builder, svg-sprite, svgicons2svgfont) — these define what "correct" and "expected" looks like *as developer tooling*: stdin/stdout defaults, `--output` flags, dual CLI+library exports, embeddable vs. full-document SVG, CSS-first styling.

None of the surveyed occult tools are CLI/library-first, scriptable, or CSS-custom-property themeable — they are all hosted web UIs producing PNG/SVG for direct human download. None of the surveyed SVG-generator libraries know anything about kamea geometry or numerology. **Sigil Spinner's differentiation is structural, not symbolic: it's the first tool in this space built to be invoked programmatically and styled by the consuming site rather than downloaded as a finished image.** That reframes most "differentiators" below as "table stakes it's the *only* one that has."

### Table Stakes (Users Expect These)

Features any credible planetary/kamea sigil tool must have, drawn from the occult-tool tradition. Missing these makes the construction "wrong," which is disqualifying for a tool whose Core Value is traditional correctness.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Statement/intention text input | Every surveyed generator (chaostarot.com, planetarysigils.com, explicit.name) starts here — it's the whole premise | LOW | Already an Active requirement |
| Vowel + repeat-letter elimination, first-occurrence order preserved | Universal across every method description (Spare's technique, chaostarot.com, planetarysigils.com all describe "duplicates removed, then vowels stripped, unique consonants remain") | LOW | Order of operations varies by source (vowels-then-dupes vs. dupes-then-vowels) — PROJECT.md already commits to a specific rule; document it explicitly since practitioners will check | 
| Pythagorean number-table letter encoding (1–9) | Standard numerology substrate for this lineage; every planetary-kamea generator that isn't pure Spare-method glyph-drawing uses a number table | LOW | Canonical table must match traditional sources exactly per PROJECT.md constraint |
| All seven classical planetary kameas (Saturn 3×3 → Moon 9×9) | Table-stakes breadth — chaostarot.com and planetarysigils.com both offer the full classical set (planetarysigils.com goes further, to Pluto) | MEDIUM | Correctness-critical: each square's cell layout must be canonical, not just "a magic square of the right order" |
| Number-sequence path tracing across the kamea | This *is* the sigil — every kamea-based generator traces a line/path connecting the mapped cells in sequence | MEDIUM | Core rendering logic; already an Active requirement |
| Start marker / end marker on the path | Traditional sigils distinguish where the working begins and ends (commonly a small circle at start, a stroke/arrow at end) — present in classical Golden-Dawn-style renderings and implied by chaostarot's kamea diagrams | LOW | Already an Active requirement; needs semantic CSS classes so consumers can style distinctly |
| Repeat-number handling (loop/notch when the sequence revisits the same cell) | A traditional convention (a small loop or tick mark when consecutive letters map to the same number) — distinguishes "correct" kamea sigils from naive line-only renderings | MEDIUM | Already an Active requirement; genuinely easy to get wrong (must trigger only on *consecutive* repeats, not any repeat in the sequence) |
| Grid/kamea square visibility (numbers + cell borders) | Every surveyed web tool shows the sigil overlaid on its kamea grid by default — it's how practitioners verify the tracing is correct | LOW | PROJECT.md scopes this as hidden-by-default/CSS-revealable, which is a deliberate embed-context deviation from the norm (see Differentiators) — still table stakes that the *capability* exists |
| Planetary glyph (♄ ♃ ♂ ☉ ♀ ☿ ☽) | Present on every planetary-correspondence site (planetarysigils.com pairs sigils with "planetary correspondence data"); the glyph identifies which working the sigil belongs to | LOW | Already an Active requirement; simple to implement as an optional SVG layer/text glyph |
| SVG output | Both chaostarot.com and planetarysigils.com offer SVG export alongside PNG; SVG is non-negotiable for a design-element tool meant for web embedding | LOW | Already the project's core output format |
| Deterministic output (same input → same sigil) | Implicit in every method description — sigil magic requires the construction to be reproducible/verifiable, not generative art | LOW | Already a PROJECT.md constraint; mostly a testing/discipline concern, not new code |

### Differentiators (Competitive Advantage)

Features that set Sigil Spinner apart from the surveyed occult-web-tool tradition. These map almost 1:1 onto PROJECT.md's Active requirements — the research validates that the project's instincts are the actual differentiators, not table stakes elsewhere.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| CLI + importable library, stdout-by-default | No surveyed sigil generator is scriptable — all are hosted forms. This is the single biggest gap Sigil Spinner fills, matching conventions from `bytefield-svg` (stdin/stdout default, `--output` flag, `--embedded` mode) rather than anything in the occult-tool space | LOW–MEDIUM | Directly enables the "Claude Code invokes this during site builds" use case from PROJECT.md; `bytefield-svg`'s `generate(source, {embedded: true})` API is a good structural precedent for a `generateSigil(statement, planet, opts)` export |
| Semantic CSS classes on every SVG element (path, nodes, markers, layers) | No competitor ships classed, stylable SVG — chaostarot/planetarysigils SVGs are static exports meant to be downloaded, not themed. This is what makes Sigil Spinner an embeddable *design element* rather than an image file | LOW | Already an Active requirement; mostly naming discipline (`.sigil-path`, `.sigil-node`, `.sigil-start`, `.sigil-end`, `.sigil-grid`, `.sigil-glyph`) |
| CSS custom-property theming hooks (stroke color, width, grid opacity, glyph size, etc.) | Lets embedding sites theme sigils per-brand without touching markup or regenerating SVG — a pattern documented as best practice for themeable SVG icon systems but absent from every sigil tool surveyed | LOW–MEDIUM | Pairs with semantic classes; define a small, documented set of `--sigil-*` custom properties rather than exposing every SVG attribute |
| Toggleable/hidden-by-default kamea grid layer | Inverts the web-tool default (grid always visible for verification) in favor of a clean embed by default, revealable via one CSS rule for teaching/explanation contexts | LOW | Already an Active requirement; low complexity, high UX payoff for the "embed in a finished page" use case |
| Configurable path rendering: straight (default) vs. curved/smoothed | No surveyed generator offers a rendering-style toggle — they render one fixed line style. Gives embedding sites a stylistic knob without altering the underlying construction | MEDIUM | Curve smoothing (e.g., Catmull-Rom → cubic Bézier conversion) is the one real algorithmic complexity spike in the rendering pipeline — flag for phase-specific research |
| JSON "working" output (letters kept, number sequence, cell coordinates) | No surveyed tool exposes structured intermediate data — they show a picture. Enables downstream teaching pages, debugging, and programmatic decisions about how to embed/caption the sigil | LOW | Already an Active requirement; nearly free since the pipeline already computes this data before rendering — just don't discard it |
| Zero runtime dependencies for the embed artifact | No competitor publishes as an npm package at all, so this has no direct precedent in-domain, but it's standard practice for design-element libraries (`svg-builder`, `bytefield-svg`) and matters for a tool meant to be invoked inside arbitrary build pipelines | LOW | Constraint already set in PROJECT.md; mainly a discipline about what goes in `dependencies` vs `devDependencies` |

### Anti-Features (Commonly Requested, Often Problematic)

Features that a sigil generator "could" have, that competitors partially offer, but that would work against this project's scope and Core Value.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|------------------|-------------|
| Hosted web UI / interactive form | Every competitor (chaostarot.com, planetarysigils.com, explicit.name) leads with this — it's the "normal" shape of a sigil tool, and it's the most legible way for non-technical practitioners to try it | Directly contradicts PROJECT.md Out of Scope; building it now would compete for scope with the CLI/library core and delay the actual primary consumer (Claude Code build-time invocation) | Ship CLI + library first; a thin UI can be layered on top of the library later without changing the core |
| PNG/raster export | chaostarot.com and planetarysigils.com both offer PNG alongside SVG, since most practitioners want a "download and print/save" artifact | Raster baking is a solved, generic problem (any SVG-to-PNG converter handles it) and pulls in image-processing dependencies that conflict with the zero-runtime-dependency constraint | Consumers rasterize downstream with existing tools (`sharp`, `resvg`, browser canvas) if they need PNG — explicitly deferred in PROJECT.md |
| Extended kamea set (Uranus, Neptune, Pluto, or other non-classical squares) | planetarysigils.com goes to 10 kameas including Pluto — more planets look like "more complete" coverage | Non-classical planets don't have a canonical historical kamea in the Agrippa lineage this project is built on; adding modern/invented squares breaks the "traditionally correct, not approximated" constraint and doubles the surface area to verify | Stay at seven classical kameas per PROJECT.md; if demand emerges later, treat as a distinct, explicitly-researched addition, not a default extension |
| Scaled/multi-digit number-to-cell mapping for larger kameas | Some practitioners debate whether an 8×8 or 9×9 kamea should map letters 1–9 directly onto its low cell values or spread the alphabet's fuller numeric range across the square's full cell-value range | This is a live methodological disagreement across sources — chasing "the other" mapping scheme multiplies construction logic per kamea and reopens a decision PROJECT.md already closed deliberately | Direct 1–9 cell mapping on every kamea, per PROJECT.md Key Decisions — document the rationale so it reads as a choice, not an oversight |
| Rose Cross / circular sigil layout as an alternative to kamea tracing | chaostarot.com offers this as a parallel method (Golden Dawn's circular diagram instead of a square grid) — looks like a natural "mode" to add | Different geometry, different construction rules, different correctness constraints — folding it in as a "flag" would double the rendering/pipeline surface for a method PROJECT.md never scoped in | Out of scope for v1; if pursued, treat as a genuinely separate output mode with its own research pass, not a kamea variant |
| Real-time interactive preview / live-editing | Web competitors update the sigil as you type — feels like a natural "nice to have" | Sigil Spinner has no UI layer at all in v1; building "live preview" logic implies a UI that doesn't exist yet, and pulls interactive-state concerns into what should be a pure, deterministic generation function | Determinism + fast single-shot generation makes any future UI layer trivially able to fake "live preview" by re-invoking the library on each keystroke — no special support needed in core |
| Web component wrapper (`<sigil-spinner>` custom element) | Natural-feeling packaging for "drop this into any site" | Already explicitly deferred in PROJECT.md — inline SVG with semantic classes already covers the embed case with zero dependencies; a web component adds a runtime dependency and a second API surface to maintain | Ship inline SVG output; treat the custom element as a possible future thin wrapper around the same library, not a v1 concern |

## Feature Dependencies

```
Vowel/repeat-letter elimination
    └──requires──> nothing (pure string processing, first stage of pipeline)

Pythagorean number encoding
    └──requires──> Vowel/repeat-letter elimination (operates on the reduced letter string)

Kamea layout data (all 7 planets)
    └──requires──> nothing (static reference data, can be built independently/in parallel)

Number-sequence path tracing
    └──requires──> Pythagorean number encoding (needs the number sequence)
    └──requires──> Kamea layout data (needs cell coordinates for the chosen planet)

Repeat-number loop/notch markers
    └──requires──> Number-sequence path tracing (markers are drawn relative to consecutive-repeat points on the traced path)

Start/end markers
    └──requires──> Number-sequence path tracing (markers anchor to the first/last point)

SVG rendering (path + markers + layers)
    └──requires──> Number-sequence path tracing
    └──requires──> Repeat-number loop/notch markers
    └──requires──> Start/end markers

Curved/smoothed path rendering option
    └──enhances──> SVG rendering (alternate line-drawing algorithm over the same traced points; does not change earlier stages)

Toggleable kamea grid layer
    └──requires──> Kamea layout data (needs cell positions/numbers to draw the grid)
    └──enhances──> SVG rendering (an additional independent layer, not on the sigil-path critical chain)

Planetary glyph layer
    └──requires──> nothing beyond planet selection (static per-planet symbol; independent of the tracing pipeline)
    └──enhances──> SVG rendering

Semantic CSS classes on all elements
    └──requires──> SVG rendering (classes are attached as elements are emitted; not a separable phase)

CSS custom-property theming hooks
    └──requires──> Semantic CSS classes (custom properties are consumed inside the same style rules that reference the classes)

JSON "working" output
    └──requires──> Number-sequence path tracing (captures letters kept, number sequence, cell coordinates — data that already exists by this stage)
    └──conflicts with nothing──> can be emitted alongside SVG from the same generation call

CLI (stdout/file)
    └──requires──> Library API (generateSigil(statement, planet, opts) — CLI is a thin wrapper)

Library API surface
    └──requires──> everything above except the CLI itself (CLI depends on the library, not vice versa)
```

### Dependency Notes

- **Path tracing requires both number encoding and kamea layout data:** the traced path is literally "look up each number in the sequence within the chosen planet's kamea and connect the cells in order" — neither input alone is sufficient, and both can be built/tested independently before being wired together.
- **Repeat-number markers and start/end markers both require path tracing to exist first**, but do not depend on each other — they can be built in either order or in parallel once tracing is done.
- **CSS custom-property hooks require semantic classes to already exist:** custom properties are typically declared as fallback values inside class-scoped style rules (e.g., `.sigil-path { stroke: var(--sigil-stroke-color, currentColor); }`), so classing is a hard prerequisite, not a nice-to-have that can be retrofitted painlessly.
- **The CLI depends entirely on the library API, never the reverse:** this ordering matters for roadmap phasing — build and stabilize `generateSigil()` (or equivalent) as a pure function first, then wrap it in a CLI, mirroring the `bytefield-svg` precedent (`generate()` exported, CLI is a separate thin binary).
- **Curved rendering and the grid/glyph layers "enhance" rather than "require" the critical path:** they read from data the core pipeline already produces (traced points, kamea layout, planet selection) without altering upstream stages — good candidates for a later phase or an MVP-plus increment, not blockers for a first working sigil.
- **Extended kamea set and Rose Cross layout (anti-features) would each introduce a *new* dependency chain in parallel to the existing one** rather than extending it — which is exactly why they're flagged as scope risks rather than natural next steps.

## MVP Definition

### Launch With (v1)

Minimum viable product — matches PROJECT.md's Active requirements almost exactly; this list exists to confirm the research doesn't surface a gap.

- [ ] Intention-statement input, vowel + repeat-letter elimination (first occurrence kept, order preserved) — the whole method is worthless without correct reduction
- [ ] Pythagorean number-table encoding — the bridge between letters and kamea cells
- [ ] All seven classical planetary kameas with canonical cell layouts — table stakes; partial coverage would ship a tool that's "wrong" for 6/7 use cases
- [ ] Number-sequence path tracing with straight-segment default rendering — the core visual output
- [ ] Start/end markers and repeat-number loop/notch markers — without these it's a generic connect-the-dots line, not a traditionally-recognizable sigil
- [ ] Semantic CSS classes on every element — the structural differentiator; retrofitting classes later touches every renderer call site
- [ ] JSON working output alongside SVG — essentially free once the pipeline exists, and the primary consumer (Claude Code) benefits immediately
- [ ] CLI (stdout default, `--output` file flag) + library export of the same generation function — this *is* the product per PROJECT.md's Core Value

### Add After Validation (v1.x)

Features to add once the core pipeline is proven correct and is actually being invoked in real site builds.

- [ ] Curved/smoothed path rendering flag — add once straight-line output is validated as traditionally correct; smoothing is a rendering-layer concern that shouldn't block core correctness work
- [ ] CSS custom-property theming hooks (documented `--sigil-*` variables) — add once the class taxonomy has been used in a couple of real embeds and the actual variables worth exposing are clear from usage, not guessed upfront
- [ ] Toggleable kamea grid layer — trigger: first real teaching/explanation page that wants to show the grid
- [ ] Planetary glyph layer — trigger: first embed that wants the glyph without hand-adding an SVG `<text>` or `<use>` element

### Future Consideration (v2+)

Features to defer until the CLI/library is established as the correct, trusted construction tool.

- [ ] Web component wrapper (`<sigil-spinner>`) — defer until it's clear consumers actually want a runtime element instead of build-time SVG generation (already deferred in PROJECT.md)
- [ ] Hosted web UI — defer until the library is stable enough that a UI would be a thin, low-risk layer rather than parallel scope competing with core correctness work
- [ ] Rose Cross / circular sigil construction mode — defer as a genuinely separate research + implementation effort, not a flag on the existing kamea pipeline
- [ ] Extended/non-classical kameas — defer indefinitely unless a specific, researched demand emerges; conflicts with the "traditionally correct" constraint as currently scoped

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Vowel/repeat-letter elimination | HIGH | LOW | P1 |
| Pythagorean number encoding | HIGH | LOW | P1 |
| Seven classical kamea layouts | HIGH | MEDIUM | P1 |
| Number-sequence path tracing | HIGH | MEDIUM | P1 |
| Start/end markers | HIGH | LOW | P1 |
| Repeat-number loop/notch markers | HIGH | MEDIUM | P1 |
| Semantic CSS classes | HIGH | LOW | P1 |
| JSON working output | MEDIUM | LOW | P1 |
| CLI (stdout/file) + library API | HIGH | LOW–MEDIUM | P1 |
| CSS custom-property theming hooks | MEDIUM | LOW–MEDIUM | P2 |
| Toggleable kamea grid layer | MEDIUM | LOW | P2 |
| Planetary glyph layer | MEDIUM | LOW | P2 |
| Curved/smoothed path rendering | LOW–MEDIUM | MEDIUM | P2 |
| Web component wrapper | LOW | MEDIUM | P3 |
| Hosted web UI | LOW (for stated primary consumer) | HIGH | P3 |
| Rose Cross construction mode | LOW | HIGH | P3 |
| Extended/non-classical kameas | LOW | MEDIUM–HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | chaostarot.com (kamea/rose-cross generators) | planetarysigils.com | Sigil Spinner Approach |
|---------|------------------------------------------------|----------------------|-------------------------|
| Kamea coverage | Full classical 7, Hebrew-letter support added later | 10 kameas (adds Uranus, Neptune, Pluto) | Classical 7 only, deliberately — see Anti-Features |
| Letter elimination | Configurable (multiple removal-order options exposed to user) | Fixed: duplicates removed, then vowels stripped | Fixed, single traditional rule (vowels + repeats struck, first occurrence kept) — determinism over configurability |
| Construction methods offered | Multiple: kamea tracing, Rose Cross, word-method/Spare glyph, "Trinary" generator | Kamea tracing only | Kamea tracing only for v1; Rose Cross explicitly deferred |
| Output formats | SVG (implied via web rendering; export details thin in available docs) | PNG + SVG | SVG + JSON working; PNG explicitly out of scope |
| Grid visibility | Always visible (grid is the primary UI) | Always visible (grid + traced path shown together) | Hidden by default, CSS-revealable — inverts the web-tool norm for a clean embed |
| Styling/theming | None documented — output is a finished image for download | None documented — PNG/SVG export, not living markup | Semantic CSS classes + custom-property hooks — the core differentiator |
| Programmatic access | None found — hosted web forms only | None found — hosted web form only | CLI + library, stdout-first — the only tool in this survey built for scripted/build-time invocation |
| Educational/correspondence data | Present (planetary kamea pages include background per-planet) | Strongly present (timing calculations, archangel associations, ritual framework) | Out of scope — JSON working output gives consumers raw data to build their own teaching pages, but the tool itself doesn't editorialize |

## Sources

- [Chaos Tarot — Magic Squares Sigil Generator](https://www.chaostarot.com/magic-squares-sigil-generator/) — MEDIUM confidence (single-source WebFetch, thin on rendering/export detail)
- [Chaos Tarot — Saturn/Mars/Sun/Venus/Mercury/Moon Kamea pages](https://www.chaostarot.com/magic-square-saturn-kamea/) — MEDIUM confidence, cross-checked across multiple planet pages via search snippets
- [Chaos Tarot — Rose Cross Sigil Generator](https://www.chaostarot.com/app/rose-cross-sigil-generator/) — LOW-MEDIUM confidence, search-snippet only
- [Chaos Tarot — Word Method Sigil Generator](https://www.chaostarot.com/word-method-sigil-generator/) — LOW-MEDIUM confidence, search-snippet only
- [Planetary Sigils](https://planetarysigils.com/) — MEDIUM confidence (direct WebFetch of homepage)
- [explicit.name — Kamea Angel Sigil Generator](https://explicit.name/) — LOW confidence, search-snippet only
- [Deep-Symmetry/bytefield-svg (GitHub)](https://github.com/Deep-Symmetry/bytefield-svg) — HIGH confidence (direct WebFetch of README-derived content), used as the primary structural precedent for CLI/library dual-surface design
- [bytefield-svg CLI/library conventions](https://github.com/Deep-Symmetry/bytefield-svg) — informed the recommended `--output`/stdout default and `generate(source, opts)` API shape
- [svg-builder (npm)](https://www.npmjs.com/package/svg-builder) — LOW confidence, search-snippet only; general precedent for programmatic SVG builder APIs
- [svg-sprite (npm/GitHub)](https://www.npmjs.com/package/svg-sprite) — LOW confidence, search-snippet only
- [Adaptive SVGs with CSS Custom Properties — SVG Genie Blog](https://www.svggenie.com/blog/adaptive-svg-css-custom-properties) — MEDIUM confidence, general web best-practice source for the custom-property theming pattern
- General web search results on Austin Osman Spare's letter-elimination method (magickalspot.com, juniperdivination.com, mysticryst.com, and others) — MEDIUM confidence, cross-checked across multiple independent descriptions of the same traditional method

**Gap flagged for phase-specific research:** none of the surveyed sources gave a fully authoritative, single-source description of the *exact* canonical Agrippa kamea cell-value layouts for all seven planets, or a definitive citation for the traditional repeat-number notch/loop convention. Both are correctness-critical per PROJECT.md's constraint that kamea layouts must match traditional sources exactly — treat kamea layout data and repeat-marker convention as needing a dedicated, higher-rigor research or verification pass against primary/canonical sources (e.g., Agrippa's *Three Books of Occult Philosophy*) before implementation, not just this ecosystem survey.

---
*Feature research for: planetary kamea sigil generator (Node CLI + library)*
*Researched: 2026-08-04*
