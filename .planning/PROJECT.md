# Sigil Spinner

## What This Is

A Node CLI + importable library that generates planetary sigils from intention statements using the traditional Western esoteric method: strike vowels and repeating letters, encode the remainder through the Pythagorean Number Table, and trace the resulting number sequence across the chosen planet's kamea (magic square). Output is fully CSS-stylable inline SVG plus a JSON "working" — built so Claude Code can invoke it during website builds and embed living sigils directly into pages it creates for Matt.

## Core Value

Given any intention statement and any of the seven classical planets, the tool deterministically produces a correct, traditionally-constructed sigil as embeddable, fully CSS-stylable SVG.

## Requirements

### Validated

Validated in Phase 1: First Sigil, End to End —

- [x] Accept an intention/affirmation statement as input
- [x] Strike vowels and repeating letters (keep first occurrence, preserve order)
- [x] Encode remaining letters via the Pythagorean Number Table (1–9)
- [x] Trace the number sequence across the planet's kamea using direct 1–9 cell mapping (Saturn exercised end to end; all seven kameas locked and tested)
- [x] JSON metadata output: letters kept, number sequence, cell coordinates — the full working
- [x] Invocable as a CLI (statement + planet + flags → SVG/JSON to stdout or file)
- [x] Importable as a JS library with the same capabilities
- [x] Emit inline SVG with semantic classes on path, nodes, start/end markers

Validated in Phase 2: Every Planet, Every Statement —

- [x] Accept one of the seven classical planets rendering end to end (all seven byte-pinned at kamea orders 3 through 9)
- [x] Traditional repeat-number loop/notch markers where the sequence hits the same number consecutively (full cell-anchored loop, only on *consecutive* repeats)
- [x] Degenerate and non-ASCII statements yield either a trustworthy sigil or a clear, actionable error, identically from library and CLI
- [x] Documented, deterministic letter-handling rules a practitioner can read in the README and observe applied consistently — including what is deliberately *not* folded

The three requirements below were validated in Phase 1 and re-exercised in Phase 2 across all seven planets and both surfaces; the duplicate Active entries were stale and have been removed: JSON metadata output, CLI invocation, library import.

Validated in Phase 3: Themeable, Embeddable Layers —

- [x] Configurable path rendering: straight segments (default) or curved/smoothed — hand-rolled centripetal Catmull-Rom → cubic Bézier, zero dependency, with the construction (letters, numbers, cells) provably unchanged between modes
- [x] Toggleable kamea grid layer (square + cell numbers) behind the sigil, hidden by default, revealable via CSS — always emitted at `opacity: 0`, revealed by one declaration
- [x] Optional planetary glyph layer (♄ ♃ ♂ ☉ ♀ ☿ ☽) — opt-in, seven cited code points suffixed U+FE0E for deterministic text presentation
- [x] CSS custom-property hooks so embedding sites theme sigils without touching markup — 15 `--sigil-*` properties, each with an inline default, guarded against README drift and verified to *resolve* in a real browser

Closed in Phase 4: v1.0 Tech Debt Closeout — no new v1 requirements; these are contract and documentation debts carried out of the v1.0 milestone audit:

- [x] `working.render` round-trips back into `generateSigil` — a consumer holding only a JSON working can regenerate byte-identical SVG, and the call typechecks under `tsc --checkJs` with no cast (WR-01, D-49/D-50)
- [x] The CLI rejects extra positional arguments instead of silently rendering the first — `E_CLI_USAGE`, exit 2, empty stdout (WR-04, D-51)
- [x] The JSON working's full fifteen-field surface, including the `render` block, is documented in the README alongside the two CLI-local diagnostic codes (D-52/D-53)
- [x] Planet identity is validated before statement content, so `E_UNKNOWN_PLANET` is no longer masked by `E_EMPTY_SEQUENCE` (WR-03, D-54)
- [x] All five `E_*` error-code constants are importable from the package root, with the CLI exit-status map keyed from them rather than duplicated literals (WR-02, D-55)

All eleven items in the v1.0 tech-debt register end the phase decided: six fixed, two closed as verified non-issues with evidence, three deferred with a written reason and reopen condition.

### Active

- [ ] Nothing outstanding for v1. All 21 v1 requirements are validated, and the v1.0 tech-debt register is fully dispositioned.

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
| CLI + library, no UI for v1 | Primary consumer is Claude Code in build contexts; UI adds surface without serving the core use | ✓ Validated in Phase 3 — the full option surface (`curve`, `glyph`, `idPrefix`, `title`) is reachable identically from both, with validation owned by the library so programmatic callers get the same guarantees |
| Inline SVG with semantic classes (no web component) | Zero-dependency, embeds anywhere, maximally CSS-stylable; wrapper can layer on later | ✓ Validated in Phase 3 — 26 sigils co-embedded in one page restyled entirely from CSS, zero id collisions, zero `style=` attributes |
| Direct 1–9 cell mapping on all kameas | Traditional for letter-value work; every kamea contains cells 1–9; planet character comes from geometry | ✓ Validated in Phase 2 — all seven kameas traced and byte-pinned |
| Straight segments default, curves behind a flag | Classic angular sigil is the canonical form; per-site character via config, not forked logic | ✓ Validated in Phase 3 — `curve` defaults false and straight output stayed byte-identical; curve changes only the `sigil-path` `d`, never marker geometry |
| Emit JSON working alongside SVG | Claude needs structured data for embedding decisions; also enables teaching/explanation pages | ✓ Validated in Phase 2 — fixed key order, byte-identical across runs |
| Fold the complete Latin stroke/bar class, not the reported instances (amends D-23) | `Đ` and `Ð` produced different sigils from visually identical statements. Adding only the eight reported letters would have left 64 more failing identically, with an opt-out boundary of "what someone noticed" rather than a rule. Ratified by Matt at plan 02-04's blocking decision checkpoint, 2026-08-06. | ✓ Validated in Phase 2 — table 12 → 84 entries, case-complete, excluded classes documented with reason |
| `idPrefix` is caller-supplied; no derived hash (D-44) | Pitfall 9 recommends hashing `(statement, planet, options)` to namespace ids. Under this project's own determinism guarantee that produces *identical* ids for two identical sigils on one page — the exact collision it claims to fix. The artifact stays id-free by construction; uniqueness under identical prefixes is the caller's documented responsibility. | ✓ Validated in Phase 3 — zero `id` attributes by default across every planet × option combination; the one high-severity threat (attribute injection via `idPrefix`) closed with `escapeXml` and a hostile-prefix test |
| Grid is always emitted and hidden; glyph is opt-in | An asymmetry the success criteria imposed: the grid is scaffolding that explains the sigil (present, revealable), the glyph is a visible mark that changes what the sigil *is* (absent unless asked for). Deliberately dropped the `--grid` flag that `.claude/CLAUDE.md` anticipated — a flag would mean *absent* by default, which is a different contract from *hidden*. | ✓ Validated in Phase 3 |
| Numeric `--sigil-*` values are unitless user units, emitted as `calc(var(…) * 1px)` where the CSS property needs a length | A presentation attribute containing `var()` is parsed as a CSS declaration, so the substituted value must be valid for that property. `stroke-width`/`opacity` accept a bare number; `font-size` needs a unit. Emitting `font-size="var(--x, 13.333)"` dies at computed-value time and silently falls back to `inherit` — for the default as well as every override — while still looking correctly wired in the markup. | ✓ Validated in Phase 3, the hard way — shipped broken for two properties, found by Matt during UAT, fixed in `b3c8b6a`. **Lesson: "the attribute maps to a CSS property" is necessary and not sufficient; the substituted value must also be valid for it.** Now guarded by a real-browser computed-style test, the only test in the suite that renders. |

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
*Last updated: 2026-08-07 — Phase 4 complete (v1.0 tech debt closed: `working.render` round-trips, the CLI diagnoses extra positionals, the JSON working's fields are documented, and the `E_*` constants are public). Milestone v1.0 is 100% complete — all 21 v1 requirements validated and all 11 audit tech-debt items dispositioned. Suite at 1435 tests, zero snapshot churn.*
