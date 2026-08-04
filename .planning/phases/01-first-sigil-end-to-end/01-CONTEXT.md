# Phase 1: First Sigil, End to End - Context

**Gathered:** 2026-08-04
**Status:** Ready for planning

<domain>
## Phase Boundary

A single invocation turns an intention statement into a correct, traditionally-constructed Saturn sigil — self-contained inline SVG plus its JSON working — built on kamea data locked against a cited canonical source. Covers CONS-01, CONS-02, KAMEA-01, KAMEA-03, PATH-01, PATH-03, REND-01, OUT-01, INT-01, INT-02. All seven kameas are hard-coded and verified in this phase even though only Saturn renders; degenerate-input hardening, non-Saturn planet selection, repeat markers, and theming layers belong to Phases 2–3.

</domain>

<decisions>
## Implementation Decisions

### Kamea source & verification
- **D-01:** Primary source: Agrippa, *Three Books of Occult Philosophy*, Donald Tyson ed. (Llewellyn). Independent cross-check: Skinner, *The Complete Magician's Tables*. These two citations go in the data module header and README. — **Reversibility:** one-way — determinism is a published contract; changing grid data after sigils are embedded on live sites changes output for identical inputs and would require the v2 kamea-set-version escape hatch (PKG-02).
- **D-02:** Data layer is **kamea-set-aware from day one**: grids keyed by set name, default `agrippa`; the JSON working names the set that produced the sigil. Only the `agrippa` set ships in Phase 1. Skinner and Golden Dawn sets are deferred (see Deferred Ideas) — each lands only after its own full seven-grid verification. — **Reversibility:** costly — the set key threads through the data API, working schema, and options surface.
- **D-03:** Verification scope: **all seven grids, cell-by-cell, against BOTH sources** — deliberately exceeding the roadmap's Saturn-only cross-check minimum. Programmatic magic-sum checks are a supplement, never the source of truth (generation-as-verification only, per pitfalls research).
- **D-04:** Lock ritual: **Claude verifies, Matt signs off.** Research pulls both sources, builds all seven grids, presents them side-by-side with citations; Matt eyeballs and blesses before the data module is committed. This is a human checkpoint gate in the plan — the canonical data does not commit without it.

### Sigil anatomy & markers
- **D-05:** Start marker: small circle at the first cell (`sigil-start`). End marker: short perpendicular bar/crossbar at the last cell (`sigil-end`). Each is its own element with a semantic class — plain shapes, not SVG `<marker>` defs (also keeps Phase 1 id-free, sidestepping REND-06 collisions until Phase 3).
- **D-06:** A `circle.sigil-node` is emitted at **every visited cell**, hidden by default via its custom-property default, revealable with one CSS rule — same posture as the Phase 3 grid layer.
- **D-07:** Fixed `viewBox="0 0 100 100"` for **all planets**; cell size = 100/order. All seven planets render at consistent scale side-by-side and CSS sizing behaves identically per planet. Renderer may apply a small internal inset in the cell-center math so edge-cell markers don't clip — implementation detail, not a config surface.
- **D-08:** Class taxonomy: BEM-ish with planet modifier. Root `<svg class="sigil sigil--saturn">`; children `sigil-path`, `sigil-node`, `sigil-start`, `sigil-end` (Phase 3 adds `sigil-grid`, `sigil-glyph`). Per-planet theming is one selector (`.sigil--mars { --sigil-stroke: … }`). — **Reversibility:** costly — class names are the public CSS contract embedding sites write against.

### CLI surface
- **D-09:** Statement comes in as a positional argument; a statement of `-` reads stdin (pipeline composition). Bin name: `sigil-spinner`.
- **D-10:** stdout carries **raw SVG by default**; `--json` swaps stdout to the JSON working. One artifact per stream — no envelopes on the default path. `--output <file>` writes the selected artifact to a file (INT-02).
- **D-11:** Getting both artifacts from the CLI = **two invocations** (once plain, once `--json`); determinism guarantees they describe the same sigil. No dual-file CLI surface in v1. (The library returns both from one call regardless.)
- **D-12:** `--planet` is **required with no default** — choosing the planet is part of the working, not a fallback. Case-insensitive match against the seven; unknown planet → stderr error listing valid names + nonzero exit. All diagnostics to stderr; stdout is reserved strictly for the artifact.

### Library API & JSON working
- **D-13:** `generateSigil(statement, planet, options)` returns a **plain eager object `{ svg, working }`** — SVG string plus working object from one call, plain JSON-able data, no methods. (Internally the PathModel remains the renderer-agnostic seam per PATH-03/ARCHITECTURE.md; the eager return is the public face.)
- **D-14:** The working is the **full trail + letter map**: statement, letters kept AND struck, per-letter letter→number pairs, number sequence, planet, kamea set, grid size, cells as row/col AND viewBox x/y, path segments. A teaching page can narrate the entire derivation from the working alone. — **Reversibility:** costly — the working schema is a consumed data contract; removing fields later breaks consumers.
- **D-15:** Error contract: throw a `SigilError` subclass with a **stable `.code`** (`E_UNKNOWN_PLANET`, `E_EMPTY_SEQUENCE`, …) plus human message. CLI maps code→exit status + stderr. Consumers branch on `.code`, never message text. Phase 2's INT-04 (identical CLI/library errors) builds on this shape.
- **D-16:** The intention statement is **omitted from the SVG by default** — no `<title>`/`<desc>`/data attributes carrying it unless the caller opts in (e.g. `{ title: true }`), honoring the release-the-intention posture of classic sigil practice. When opted in, the statement is XML-escaped. The working always carries the statement (documented as untrusted input consumers must HTML-escape).

### Claude's Discretion
- Exact `--sigil-*` custom-property names and their defaults (full surface is Phase 3's REND-05; Phase 1 just must never hardcode presentation values or emit `style=""`).
- Exact JSON working field names and nesting — honor D-14's content list; shape is planner/executor's call.
- Internal module layout — follow `.planning/research/ARCHITECTURE.md`'s structure unless something better emerges.
- Precise marker geometry (circle radius, bar length/angle) within the fixed 100×100 viewBox.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project research (in-repo)
- `.planning/research/PITFALLS.md` — Pitfalls 1–4 (kamea orientation, no algorithmic generation, Chaldean contamination, I/J-U/V contamination) are the Phase 1 correctness core; Pitfall 8 (no `style=""`, no hardcoded presentation values) and Pitfall 10 (fixed-viewBox coordinate math, single shared transform function) bind the renderer; integration gotchas bind CLI stdout/stderr discipline.
- `.planning/research/ARCHITECTURE.md` — pipeline structure (text → encode → resolve → path → render), PathModel shape, module layout, and anti-patterns (no SVG in path builder, no kamea literals outside `data/kamea.js`, no CLI-only validation).
- `.planning/research/STACK.md` — locked tech stack detail (mirrored in `.claude/CLAUDE.md`).

### External sources (for the kamea data lock — D-01)
- Agrippa, *Three Books of Occult Philosophy*, Donald Tyson ed. (Llewellyn) — primary source for all seven grids. Physical/scanned reference, not in repo; researcher must locate and cite the specific tables.
- Skinner, *The Complete Magician's Tables* — independent cross-check source. Same handling.

### Planning
- `.planning/REQUIREMENTS.md` — the 10 Phase 1 requirement IDs and their wording.
- `.planning/ROADMAP.md` — Phase 1 success criteria (4) and the 3-plan breakdown.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — the repo contains no source code yet; Phase 1 is greenfield. `.planning/research/` is the only prior art and functions as the design guide.

### Established Patterns
- Tech stack is locked in `.claude/CLAUDE.md`: Node ≥20, ESM-only, `node:util.parseArgs` (no commander), hand-rolled SVG string templating (no DOM libs), Vitest snapshots, JSDoc + `tsc --checkJs` (no build step).
- Pythagorean table must be **derived from the cycling formula** (`((charCode - 65) % 9) + 1`), never transcribed — structural immunity to Chaldean/legacy-table contamination (CONS-02).
- Kameas are **literal arrays only**; any magic-square generation code is test-time verification, never the shipped source.

### Integration Points
- Primary consumer is Claude Code invoking the CLI/library during site builds — stdout purity (artifact only) and deterministic output are the integration contract.

</code_context>

<specifics>
## Specific Ideas

- The set-aware kamea architecture came from Matt's ask: "default to Agrippa but allow switching between them as an input" — honored structurally now, verified-sets-later.
- D-16 (statement omitted from SVG by default) is a practitioner-posture call, not a technical one: classic practice releases the intention once sigilized. Keep that framing in any docs about the flag.
- Sigils as reproducible design elements, not random art — determinism language belongs in the README from day one.

</specifics>

<deferred>
## Deferred Ideas

- **Skinner and Golden Dawn kamea sets as switchable named sets** — architecture supports them from day one (D-02); each ships only after full seven-grid verification against its own source. Future phase / backlog.

</deferred>

---

*Phase: 1-First Sigil, End to End*
*Context gathered: 2026-08-04*
