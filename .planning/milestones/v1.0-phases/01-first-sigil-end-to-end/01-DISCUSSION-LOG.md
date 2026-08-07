# Phase 1: First Sigil, End to End - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-04
**Phase:** 1-First Sigil, End to End
**Areas discussed:** Kamea source & verification, Sigil anatomy & markers, CLI surface, Library API & JSON working

---

## Kamea source & verification

| Option | Description | Selected |
|--------|-------------|----------|
| Agrippa Book II (Recommended) | De Occulta Philosophia Book II tables — the root of the lineage | ✓ (via free text) |
| Skinner's Complete Magician's Tables | Vetted scholarly secondary compilation | |
| Golden Dawn (Regardie) | GD redrawing of the squares | |

**User's choice:** Free text — "Is it possible to do all of these and default to Agrippa but allow switching between them as an input?" Resolved to: set-aware architecture (default `agrippa`), only the Agrippa set verified/shipped in Phase 1, Skinner/GD sets deferred until each gets full verification. User confirmed ("sure").
**Notes:** Set name appears in the JSON working; aligns with v2 PKG-02 kamea-set version field.

| Option | Description | Selected |
|--------|-------------|----------|
| All seven, both sources (Recommended) | Cell-by-cell diff of every grid against both sources | ✓ |
| Saturn deep, rest single-source | Roadmap minimum | |
| Saturn deep + spot checks | Middle ground | |

**User's choice:** All seven, both sources.

| Option | Description | Selected |
|--------|-------------|----------|
| Claude verifies, Matt signs off (Recommended) | Side-by-side presentation with citations; human gate before commit | ✓ |
| Claude verifies autonomously | No human gate | |
| Matt supplies the grids | Manual transcription from Matt's sources | |

**User's choice:** Claude verifies, Matt signs off.

| Option | Description | Selected |
|--------|-------------|----------|
| Tyson/Llewellyn + Skinner (Recommended) | Tyson-edited Agrippa primary; Skinner cross-check | ✓ |
| 1533 Latin + Tyson | Original woodcuts primary | |
| Let research decide | Researcher proposes the pair | |

**User's choice:** Tyson/Llewellyn + Skinner.

---

## Sigil anatomy & markers

| Option | Description | Selected |
|--------|-------------|----------|
| Circle start, bar end (Recommended) | Traditional convention; each its own classed element | ✓ |
| Circle start, arrowhead end | Directional reading | |
| Same shape both ends | Geometry-neutral, CSS decides | |

**User's choice:** Circle start, bar end.

| Option | Description | Selected |
|--------|-------------|----------|
| In markup, hidden by default (Recommended) | sigil-node at every visited cell, revealable via CSS | ✓ |
| No intermediate nodes | Only start/end markers | |
| Visible by default | Diagram-like | |

**User's choice:** In markup, hidden by default.

| Option | Description | Selected |
|--------|-------------|----------|
| Fixed 100×100 all planets (Recommended) | Consistent scale across the seven | ✓ |
| Unit-per-cell viewBox | Integer math, per-planet stroke scaling issues | |
| Fixed 100×100 + padding option | Configurable margin | |

**User's choice:** Fixed 100×100 all planets. (Edge-clip handling noted as internal renderer detail, not config.)

| Option | Description | Selected |
|--------|-------------|----------|
| BEM-ish + planet modifier (Recommended) | `sigil sigil--saturn` root, `sigil-*` children | ✓ |
| Flat classes + data attributes | Attribute selectors + machine-readable metadata | |
| Both | Modifier classes and data attrs | |

**User's choice:** BEM-ish + planet modifier.

---

## CLI surface

| Option | Description | Selected |
|--------|-------------|----------|
| Positional arg + stdin via '-' (Recommended) | Normal positional; '-' reads stdin | ✓ |
| Positional arg only | Simplest surface | |
| Flag: --statement | All named flags | |

**User's choice:** Positional arg + stdin via '-'.

| Option | Description | Selected |
|--------|-------------|----------|
| SVG default, --json swaps (Recommended) | Raw artifact per stream | ✓ |
| --format svg\|json\|both | Enum flag with envelope for 'both' | |
| Always JSON envelope | Machine-friendly, human-hostile | |

**User's choice:** SVG default, --json swaps.

| Option | Description | Selected |
|--------|-------------|----------|
| Two invocations (Recommended) | Determinism guarantees consistency | ✓ |
| --output writes both | Basename magic | |
| Separate --json-output flag | Explicit dual-file flags | |

**User's choice:** Two invocations.

| Option | Description | Selected |
|--------|-------------|----------|
| --planet required, case-insensitive (Recommended) | No default planet; clear stderr error; bin name sigil-spinner | ✓ |
| Positional planet | Ambiguous with stdin '-' | |
| --planet with saturn default | Silent default planet | |

**User's choice:** --planet required, case-insensitive.

---

## Library API & JSON working

| Option | Description | Selected |
|--------|-------------|----------|
| Plain object, both eager (Recommended) | { svg, working } from one call | ✓ |
| Result with toSVG()/toJSON() | Lazy re-render methods | |
| Model + free functions | Three exports | |

**User's choice:** Plain object, both eager.

| Option | Description | Selected |
|--------|-------------|----------|
| Full trail + letter map (Recommended) | Complete derivation record incl. struck letters | ✓ |
| OUT-01 minimum | Letters kept, numbers, cells only | |
| Full trail, no struck letters | Strike step invisible | |

**User's choice:** Full trail + letter map.

| Option | Description | Selected |
|--------|-------------|----------|
| Typed errors with stable codes (Recommended) | SigilError with .code taxonomy | ✓ |
| Plain Error with message | No code taxonomy | |
| Result union, never throw | { ok } discriminated union | |

**User's choice:** Typed errors with stable codes.

| Option | Description | Selected |
|--------|-------------|----------|
| Omit by default, opt-in flag (Recommended) | No statement in SVG unless { title: true }; XML-escaped when present | ✓ |
| Always embed <title> | Intention public by design | |
| Never in the SVG | A11y is embedder's job | |

**User's choice:** Omit by default, opt-in flag.
**Notes:** Framed and decided as a practitioner-posture question (release the intention once sigilized), not a technical one.

---

## Claude's Discretion

- Exact `--sigil-*` custom-property names/defaults (Phase 1 just avoids hardcoded presentation values)
- Exact JSON working field names/nesting (content list is locked, shape is not)
- Internal module layout (follow ARCHITECTURE.md unless better emerges)
- Precise marker geometry within the 100×100 viewBox

## Deferred Ideas

- Skinner and Golden Dawn kamea sets as switchable named sets — architecture supports from day one; each ships only after full seven-grid verification against its own source.
