# Sigil Spinner

## What This Is

A Node CLI + importable library that generates planetary sigils from intention statements using the traditional Western esoteric method: strike vowels and repeating letters, encode the remainder through the Pythagorean Number Table, and trace the resulting number sequence across the chosen planet's kamea (magic square). Output is fully CSS-stylable inline SVG plus a JSON "working" — built so Claude Code can invoke it during website builds and embed living sigils directly into pages it creates for Matt.

## Core Value

Given any intention statement and any of the seven classical planets, the tool deterministically produces a correct, traditionally-constructed sigil as embeddable, fully CSS-stylable SVG.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Accept an intention/affirmation statement as input
- [ ] Strike vowels and repeating letters (keep first occurrence, preserve order)
- [ ] Encode remaining letters via the Pythagorean Number Table (1–9)
- [ ] Accept one of the seven classical planets (Saturn, Jupiter, Mars, Sun, Venus, Mercury, Moon)
- [ ] Trace the number sequence across the planet's kamea using direct 1–9 cell mapping
- [ ] Emit inline SVG with semantic classes on every element (path, nodes, start marker, end marker, layers)
- [ ] Configurable path rendering: straight segments (default) or curved/smoothed
- [ ] Toggleable kamea grid layer (square + cell numbers) behind the sigil, hidden by default, revealable via CSS
- [ ] Traditional repeat-number loop/notch markers where the sequence hits the same number consecutively
- [ ] Optional planetary glyph layer (♄ ♃ ♂ ☉ ♀ ☿ ☽)
- [ ] JSON metadata output: letters kept, number sequence, cell coordinates — the full working
- [ ] Invocable as a CLI (statement + planet + flags → SVG/JSON to stdout or file)
- [ ] Importable as a JS library with the same capabilities
- [ ] CSS custom-property hooks so embedding sites theme sigils without touching markup

### Out of Scope

- Web app / hosted UI — the primary consumer is Claude Code during site builds; a UI can come later once the core is shareable
- Web component wrapper — inline SVG is zero-dependency and covers the embed case; a `<sigil-spinner>` element is a possible future layer, not v1
- Non-classical planets, non-planetary squares, or other numerological tables — the seven classical kameas + Pythagorean table define this tool's lineage
- Scaled/spread number-to-cell mapping — direct 1–9 cell mapping chosen deliberately; larger kameas differ by geometry (cell positions), not by mapping scheme
- Raster output (PNG etc.) — SVG is the artifact; rasterization is the consumer's problem

## Context

- Matt is a practicing symbolic worker (tarot, astrology, ritual) — the construction method must be traditionally correct, not approximated. The lineage is the Agrippa-style planetary kamea approach filtered through the common modern letter-elimination + Pythagorean reduction technique.
- The seven kameas: Saturn 3×3, Jupiter 4×4, Mars 5×5, Sun 6×6, Venus 7×7, Mercury 8×8, Moon 9×9. Cells 1–9 exist in every kamea, so direct digit-to-cell mapping works universally; the visual character of each planet's sigil comes from where those cells sit in its square.
- Primary consumer is Claude Code building websites for Matt (Falkens Labyrinth / brand work) — the tool must be trivially invocable from a build context and its output trivially embeddable. "Both, mine first": built for Matt's sites, shaped so other practitioners can use it later.
- Determinism matters: same statement + planet + options → identical sigil. Sigils as reproducible design elements, not random art.
- Lives in `~/RitualSync/sigil-spinner` — part of the RitualSync constellation.

## Constraints

- **Tech stack**: Node.js, no runtime dependencies for the embed artifact — output is plain inline SVG; the generator itself should stay light
- **Output**: SVG must be self-contained (no external refs), viewBox-based, and stylable purely via CSS classes and custom properties
- **Correctness**: Kamea layouts and the Pythagorean table are canonical — they must match the traditional sources exactly, no "close enough"
- **Consumer**: CLI interface must be scriptable/composable (stdout-friendly) so Claude Code and build pipelines can pipe output

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| CLI + library, no UI for v1 | Primary consumer is Claude Code in build contexts; UI adds surface without serving the core use | — Pending |
| Inline SVG with semantic classes (no web component) | Zero-dependency, embeds anywhere, maximally CSS-stylable; wrapper can layer on later | — Pending |
| Direct 1–9 cell mapping on all kameas | Traditional for letter-value work; every kamea contains cells 1–9; planet character comes from geometry | — Pending |
| Straight segments default, curves behind a flag | Classic angular sigil is the canonical form; per-site character via config, not forked logic | — Pending |
| Emit JSON working alongside SVG | Claude needs structured data for embedding decisions; also enables teaching/explanation pages | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-08-04 after initialization*
