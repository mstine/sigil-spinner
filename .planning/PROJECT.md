# Sigil Spinner

## What This Is

A Node CLI + importable ESM library that generates planetary sigils from intention statements using the traditional Western esoteric method: strike vowels and repeating letters, encode the remainder through the Pythagorean Number Table, and trace the resulting number sequence across the chosen planet's kamea (magic square). Output is fully CSS-stylable inline SVG plus a JSON "working" — built so Claude Code can invoke it during website builds and embed living sigils directly into pages it creates for Matt.

**Shipped v1.0 on 2026-08-07.** All seven classical planets, curve/grid/glyph layers, multi-embed safety, and a documented determinism contract. Zero runtime dependencies.

## Current State

**Version:** v1.0 MVP (shipped 2026-08-07) — see [`MILESTONES.md`](MILESTONES.md)
**Status:** Feature-complete for v1. Not yet published to npm.

| | |
|---|---|
| Codebase | 6,271 LOC JavaScript — 15 source files across `src/`, `bin/`, plus `test/` |
| Tests | 1,453 passing across 18 files, including 48 committed byte-pinned snapshots |
| Type safety | JSDoc + `tsc --allowJs --checkJs --noEmit`, exit 0 (no build step) |
| Runtime dependencies | none (`dependencies: {}`) — dev-only: vitest, typescript, eslint, prettier, playwright |
| Public surface | `generateSigil(statement, planet, options)`, `SigilError`, five `E_*` code constants; CLI `sigil-spinner` |
| Node floor | `>=20` (`node:util.parseArgs` stable) |

**Where it stands:** the core is done and trustworthy. What's missing is distribution — the package has never been `npm pack`'d and installed from a clean tree, which is the single highest-value next step and the reason PKG-01 leads v1.1.

## Current Milestone: v1.1 Distribution

**Goal:** Get Sigil Spinner out of the repo — published, discoverable by any Claude Code session, and embeddable as a custom element — without breaking the zero-runtime-dependency guarantee.

**Target features:**

- Publish to npm as `@falkensmage/sigil-spinner` under MIT, with a clean-install smoke test proving the tarball actually works (PKG-01)
- A global Claude Code skill at `~/.claude/skills/sigil/` carrying both mechanics and esoteric judgment (planet correspondences), so a session that has never seen the README can pick a planet correctly and embed the result well
- Kamea-set identifier and version stamped into the JSON working, so a captured working still names the data it was built from (PKG-02)
- `--title` CLI flag, closing the library/CLI parity gap left deliberately in v1.0
- `<sigil-spinner>` web component — thin custom-element wrapper over the library (WRAP-01)

**Two distinct consumers under one theme.** The skill serves Claude sessions; the web component serves Matt's pages. They share the published package as substrate and nothing else — worth keeping in separate phases rather than braided together.

**The sharp edge: the zero-dependency constraint meets a build step.** The web component is the first thing in this project's history that plausibly wants bundling, and there is no `dist/` today. "The source is what runs" was a deliberate v1.0 commitment (see Constraints). If WRAP-01 needs a build target, that must be decided openly at discuss-phase, not discovered mid-implementation.

**Explicitly not in scope: MCP.** Claude Desktop and claude.ai web stay unserved this milestone. A deliberate line — the primary consumer is Claude Code in build contexts, and an MCP server is strictly more machinery than `npx` for that case. Revisit if the want turns out to be real.

**Human-dependent steps:** `npm login` is interactive and cannot be automated. The planet correspondences are Matt's lineage knowledge and must come from Matt, not from general training.

## Core Value

Given any intention statement and any of the seven classical planets, the tool deterministically produces a correct, traditionally-constructed sigil as embeddable, fully CSS-stylable SVG.

**Still the right priority after shipping.** Nothing in v1.0 displaced it. If anything, the milestone sharpened *which half carries the weight*: correctness and determinism were the expensive parts (kamea provenance, the Chaldean-immune encoder, 48 byte-pins), and "embeddable" turned out to be mostly a CSS-discipline problem — one that failed exactly once, at `font-size`, and was caught by a human looking at a page rather than by any test.

## Requirements

### Validated

**v1.0 MVP — all 21 v1 requirements satisfied.** Full traceability in [`milestones/v1.0-REQUIREMENTS.md`](milestones/v1.0-REQUIREMENTS.md); independent audit in [`milestones/v1.0-MILESTONE-AUDIT.md`](milestones/v1.0-MILESTONE-AUDIT.md).

- ✓ **Construction** — statement in, vowels and repeats struck (first occurrence kept, order preserved), remainder encoded via a cycling-formula Pythagorean table; degenerate and non-ASCII inputs handled by documented deterministic rules — v1.0
- ✓ **Kamea** — all seven classical grids (Saturn 3×3 → Moon 9×9) hard-coded from a cited source, magic-sum verified, provenance documented honestly rather than overclaimed; any planet selectable via direct 1–9 cell mapping — v1.0
- ✓ **Path** — ordered traversal with start/end markers and traditional loop markers on *consecutive* repeats, expressed as a renderer-agnostic PathModel consumed identically by SVG and JSON — v1.0
- ✓ **Rendering** — self-contained viewBox SVG with semantic classes; straight default and opt-in curves; CSS-revealable grid layer; opt-in glyph layer; 15 `--sigil-*` custom properties with no `style=` attributes; deterministic id namespacing for multi-embed — v1.0
- ✓ **Output** — complete JSON working (letters kept, number sequence, cell coordinates, render block) from the same call, guaranteed consistent with the SVG, and round-trippable back into `generateSigil` — v1.0
- ✓ **Interface** — importable ESM library and thin CLI wrapper, byte-identical output between them, with all validation owned by the library — v1.0

<details>
<summary>Per-phase validation detail (v1.0)</summary>

Phase 1 — First Sigil, End to End: statement input; vowel/repeat striking; Pythagorean encoding; kamea traversal (Saturn exercised, all seven locked); JSON working; CLI; library import; semantic-class inline SVG.

Phase 2 — Every Planet, Every Statement: all seven planets byte-pinned at orders 3 through 9; cell-anchored loop markers on consecutive repeats only; degenerate and non-ASCII statements yielding either a trustworthy sigil or a clear actionable error identically from both surfaces; documented letter-handling rules including what is deliberately *not* folded.

Phase 3 — Themeable, Embeddable Layers: hand-rolled centripetal Catmull-Rom → cubic Bézier curves with construction provably unchanged between modes; grid layer always emitted at `opacity: 0` and revealed by one CSS declaration; opt-in glyph layer (seven cited code points, U+FE0E-suffixed for deterministic text presentation); 15 `--sigil-*` properties each with an inline default, guarded against README drift and verified to *resolve* in a real browser.

Phase 4 — v1.0 Tech Debt Closeout (no new v1 requirements; contract and documentation debts from the audit): `working.render` round-trips and typechecks with no cast (D-49/D-50); CLI rejects extra positionals with `E_CLI_USAGE` (D-51); README documents the full fifteen-field working plus both CLI-local diagnostic codes (D-52/D-53); planet identity validated before statement content so `E_UNKNOWN_PLANET` is no longer masked (D-54); all five `E_*` constants importable from the package root with the CLI exit map keyed from them (D-55); Phase 2 SUMMARY frontmatter backfilled (D-56).

</details>

### Active

Committed to **v1.1 Distribution** (requirement IDs assigned in REQUIREMENTS.md):

- [ ] **PKG-01** — Publish to npm as `@falkensmage/sigil-spinner` (MIT) with a clean-install smoke test. The one thing standing between "it works here" and "Claude Code can `npx` it during a site build," which is the stated primary use case.
- [ ] **PKG-02** — Kamea-set identifier and version in the JSON working, so a captured working still names the data it was built from years later.
- [ ] **Claude Code skill** — global skill carrying invocation mechanics *and* planet correspondences, so the tool is discoverable rather than merely available.
- [ ] **`--title` CLI flag** — `options.title` works programmatically but has no CLI exposure. Small, deliberate v1 omission now being closed.
- [ ] **WRAP-01** — `<sigil-spinner>` web component as a thin wrapper over the library.

Deferred beyond v1.1:

- [ ] **WRAP-02** — Hosted web UI layered on the stable library.
- [ ] **MCP server** — stdio wrapper exposing `generateSigil` to Claude Desktop. Deliberately excluded from v1.1: the primary consumer is Claude Code in build contexts, where `npx` plus a skill covers it with less machinery. Revisit if the Desktop want proves real. If built, it must live in a **separate package** — adding `@modelcontextprotocol/sdk` to this one would break the zero-dependency guarantee.

### Out of Scope

Audited at v1.0 close — all reasons still hold, with two sharpened by what shipping revealed:

- **Web app / hosted UI** — primary consumer is Claude Code during site builds. Still true, but now a *deferred candidate* (WRAP-02) rather than a refusal: the library is stable enough to layer on.
- ~~**Web component wrapper**~~ — **no longer out of scope.** Inline SVG covered the embed case for v1, and Phase 3 proved multi-embed safety without an element. Promoted into v1.1 as WRAP-01.
- **Non-classical planets (Uranus/Neptune/Pluto), non-planetary squares, other numerological tables** — no canonical Agrippa-lineage kamea exists for them. Reason strengthened by Phase 1: the provenance work showed how hard honest sourcing is even for the seven that *do* have a lineage.
- **Scaled/multi-digit number-to-cell mapping** — live methodological dispute; direct 1–9 mapping chosen deliberately. Phase 2 confirmed the payoff: planet character genuinely does come from cell geometry, visibly, across all seven.
- **Rose Cross / circular sigil layout** — different geometry and construction rules; a separate method, not a kamea variant.
- **Raster output (PNG etc.)** — SVG is the artifact; rasterization is the consumer's problem and conflicts with the zero-dependency constraint.
- **Real-time interactive preview** — no UI layer exists, and generation is fast and deterministic enough that any future UI can trivially fake it.

## Context

- Matt is a practicing symbolic worker (tarot, astrology, ritual) — the construction method must be traditionally correct, not approximated. The lineage is the Agrippa-style planetary kamea approach filtered through the common modern letter-elimination + Pythagorean reduction technique.
- The seven kameas: Saturn 3×3, Jupiter 4×4, Mars 5×5, Sun 6×6, Venus 7×7, Mercury 8×8, Moon 9×9. Cells 1–9 exist in every kamea, so direct digit-to-cell mapping works universally; the visual character of each planet's sigil comes from where those cells sit in its square.
- Primary consumer is Claude Code building websites for Matt (Falkens Labyrinth / brand work) — the tool must be trivially invocable from a build context and its output trivially embeddable. "Both, mine first": built for Matt's sites, shaped so other practitioners can use it later.
- Determinism matters: same statement + planet + options → identical sigil. Sigils as reproducible design elements, not random art.
- Lives in `~/RitualSync/sigil-spinner` — part of the RitualSync constellation.

**Known state carried past v1.0** (documented, not defects):

- **Curve overshoot on one input.** `sun` + "I WILL SUCCEED" in curve mode puts a Bézier control point at `y = -0.916`, just past the viewBox top edge — real centripetal Catmull-Rom behavior on a ~180° reversal. Documented in the README, deliberately not clamped (clamping is a curve-shape design decision). Visually confirmed acceptable at UAT.
- **Glyph font coverage.** Rendering depends on the viewer's font stack covering U+2600–26FF; no code-level fallback by design, since an embedded font would violate the zero-dependency constraint. Mitigated by `--sigil-glyph-font` and a README disclosure.
- **The suite needs a browser.** `test/browser/theming-resolution.test.js` requires a one-time `npx playwright install chromium` and fails loudly rather than skipping — deliberate, but a fresh clone or CI runner must install it first.
- Three low-severity items deferred with written reopen conditions (`E_CLI_STDIN` test coverage, a `perpendicularUnit` doc comment, a `D-12` ID collision) — see `MILESTONES.md`.

## Constraints

Unchanged through v1.0; all four held without needing an exception:

- **Tech stack**: Node.js, no runtime dependencies for the embed artifact — output is plain inline SVG; the generator itself should stay light. *Held: `dependencies: {}` at ship, including the curve math, which was hand-rolled rather than pulling `d3-shape`.*
- **Output**: SVG must be self-contained (no external refs), viewBox-based, and stylable purely via CSS classes and custom properties. *Held, with one near-miss — see the `font-size` decision below.*
- **Correctness**: Kamea layouts and the Pythagorean table are canonical — they must match the traditional sources exactly, no "close enough". *Held, and the honest version of it: provenance is documented at exactly the strength it was verified, no more.*
- **Consumer**: CLI interface must be scriptable/composable (stdout-friendly) so Claude Code and build pipelines can pipe output. *Held: artifact to stdout, diagnostics to stderr, distinct exit codes for usage vs. derivation failures.*

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| CLI + library, no UI for v1 | Primary consumer is Claude Code in build contexts; UI adds surface without serving the core use | ✓ Validated in Phase 3 — the full option surface (`curve`, `glyph`, `idPrefix`, `title`) is reachable identically from both, with validation owned by the library so programmatic callers get the same guarantees |
| Inline SVG with semantic classes (no web component) | Zero-dependency, embeds anywhere, maximally CSS-stylable; wrapper can layer on later | ✓ Validated in Phase 3 — 26 sigils co-embedded in one page restyled entirely from CSS, zero id collisions, zero `style=` attributes |
| Direct 1–9 cell mapping on all kameas | Traditional for letter-value work; every kamea contains cells 1–9; planet character comes from geometry | ✓ Validated in Phase 2 — all seven kameas traced and byte-pinned |
| Straight segments default, curves behind a flag | Classic angular sigil is the canonical form; per-site character via config, not forked logic | ✓ Validated in Phase 3 — `curve` defaults false and straight output stayed byte-identical; curve changes only the `sigil-path` `d`, never marker geometry |
| Emit JSON working alongside SVG | Claude needs structured data for embedding decisions; also enables teaching/explanation pages | ✓ Validated in Phase 2 — fixed key order, byte-identical across runs; round-trippable as of Phase 4 |
| Vertical MVP slices, not horizontal layers | Kamea correctness is the highest-cost failure; lock it end to end before anything downstream trusts it | ✓ Good — the riskiest data was source-verified and human-signed-off in Phase 1 plan 01, and never needed revisiting. Widening in Phases 2–3 never forced a redesign of the spine. |
| Lock all seven kameas in Phase 1 though only Saturn is exercised | Data correctness is the one thing that cannot be fixed cheaply later | ✓ Good — Phase 2's seven-planet widening was mechanical, and the audit's provenance review had a single artifact to check |
| Accept honest partial provenance (D-04, `approve-candidate`) rather than delay for physical sources | Magic-sum verified on all seven, second-source cross-checked on Saturn and Jupiter; citation states exactly that and claims nothing more | ✓ Good — the requirement ("verified against an independent source before lock, with lineage documented") is met *because* the citation is honest about its limits. Overclaiming would have failed it. |
| Fold the complete Latin stroke/bar class, not the reported instances (amends D-23) | `Đ` and `Ð` produced different sigils from visually identical statements. Adding only the eight reported letters would have left 64 more failing identically, with an opt-out boundary of "what someone noticed" rather than a rule. Ratified by Matt at plan 02-04's blocking decision checkpoint, 2026-08-06. | ✓ Validated in Phase 2 — table 12 → 84 entries, case-complete, excluded classes documented with reason |
| `idPrefix` is caller-supplied; no derived hash (D-44) | Pitfall 9 recommends hashing `(statement, planet, options)` to namespace ids. Under this project's own determinism guarantee that produces *identical* ids for two identical sigils on one page — the exact collision it claims to fix. The artifact stays id-free by construction; uniqueness under identical prefixes is the caller's documented responsibility. | ✓ Validated in Phase 3 — zero `id` attributes by default across every planet × option combination; the one high-severity threat (attribute injection via `idPrefix`) closed with `escapeXml` and a hostile-prefix test |
| Grid is always emitted and hidden; glyph is opt-in | An asymmetry the success criteria imposed: the grid is scaffolding that explains the sigil (present, revealable), the glyph is a visible mark that changes what the sigil *is* (absent unless asked for). Deliberately dropped the `--grid` flag that `.claude/CLAUDE.md` anticipated — a flag would mean *absent* by default, which is a different contract from *hidden*. | ✓ Validated in Phase 3 |
| Numeric `--sigil-*` values are unitless user units, emitted as `calc(var(…) * 1px)` where the CSS property needs a length | A presentation attribute containing `var()` is parsed as a CSS declaration, so the substituted value must be valid for that property. `stroke-width`/`opacity` accept a bare number; `font-size` needs a unit. Emitting `font-size="var(--x, 13.333)"` dies at computed-value time and silently falls back to `inherit` — for the default as well as every override — while still looking correctly wired in the markup. | ✓ Validated in Phase 3, the hard way — shipped broken for two properties, found by Matt during UAT, fixed in `b3c8b6a`. **Lesson: "the attribute maps to a CSS property" is necessary and not sufficient; the substituted value must also be valid for it.** Now guarded by a real-browser computed-style test, the only test in the suite that renders. |
| Type-keyed absent-sentinel in `resolveOptions` (D-49/D-50) rather than a blanket `null`-is-absent rule | `working.render` serializes an absent `idPrefix` as JSON `null` (correct per D-48), but the option check treated only `undefined` as absent — breaking the round-trip the code's own doc comment promised. Widening per-type keeps the fix scoped: `{ glyph: null }` still throws. | ✓ Good — round-trip verified byte-identical on all seven planets with and without a prefix, and typechecks with no cast at the call site |
| Validate planet identity before statement content (D-54) | `generateSigil('AEIOU','pluto')` reported `E_EMPTY_SEQUENCE` and masked the also-invalid planet — the cheaper, more actionable error was hidden behind the more expensive one | ✓ Good — every single-fault case still reports exactly the code it reported before |
| Publish the five `E_*` constants from the package root (D-55) | The CLI hardcoded code strings as object keys with no drift protection; a rename would silently orphan an exit-status entry | ✓ Good — the exit map is now keyed from the imported constants, so a rename propagates or fails loudly at import |
| CLI-local diagnostic codes (`E_CLI_USAGE`, `E_CLI_STDIN`) stay out of `src/errors.js` (D-53) | CLI-syntax failures are not domain errors; the library remains the sole owner of error identity (INT-04) | ✓ Good — three uses of the pattern by v1.0 close, with the taxonomy boundary intact |
| Close audit tech debt in a dedicated Phase 4 rather than shipping with a register | Eleven open items with no written disposition is a register that quietly becomes permanent | ✓ Good — six fixed, two closed as verified non-issues with live evidence, three deferred with reopen conditions. Two of the eleven turned out to be non-issues *only because* someone checked (the `-0` guard would have been dead code). |

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
4. Update Context and Current State with shipped reality

---
*Last updated: 2026-08-07 — v1.1 Distribution started. v1.0 MVP shipped: 4 phases, 14 plans, 21/21 v1 requirements, 1,453 tests, zero runtime dependencies.*
