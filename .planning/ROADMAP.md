# Roadmap: Sigil Spinner

## Overview

Sigil Spinner is built as three widening vertical slices. Phase 1 drives one intention statement all the way through the pipeline to a rendered Saturn sigil — text normalization, canonical kamea data, path tracing, SVG, JSON working, library, and CLI — so the riskiest work (kamea correctness) is locked and source-verified before anything downstream trusts it. Phase 2 widens the same spine to all seven classical planets and hardens the input surface: degenerate statements, non-ASCII letters, consecutive-repeat markers, and byte-identical determinism. Phase 3 makes the output an embeddable design element: curve rendering, grid and glyph layers, `--sigil-*` custom properties, and multi-embed id safety. Each phase ships something Matt (or Claude Code in a build context) can actually run.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: First Sigil, End to End** - Statement + Saturn → correct SVG sigil and JSON working, via library and CLI, on source-verified kamea data (completed 2026-08-06)
- [ ] **Phase 2: Every Planet, Every Statement** - All seven classical planets selectable, with degenerate/non-ASCII inputs and repeat markers handled deterministically
- [ ] **Phase 3: Themeable, Embeddable Layers** - Grid, glyph, and curve layers fully restylable from CSS, with multiple sigils safely on one page

## Phase Details

### Phase 1: First Sigil, End to End

**Goal**: A single invocation turns an intention statement into a correct, traditionally-constructed Saturn sigil — self-contained inline SVG plus its JSON working — built on kamea data locked against a cited canonical source.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: CONS-01, CONS-02, KAMEA-01, KAMEA-03, PATH-01, PATH-03, REND-01, OUT-01, INT-01, INT-02
**Success Criteria** (what must be TRUE):

  1. User runs the CLI with a statement and `--planet saturn` and gets self-contained, viewBox-based inline SVG on stdout that traces the sigil with a start marker at the first cell and an end marker at the last.
  2. User importing `generateSigil(statement, planet, options)` gets that same SVG plus a JSON working — letters kept, number sequence, cell coordinates — from one call, guaranteed to describe the same sigil.
  3. All seven kamea grids exist in the codebase as literal arrays with their canonical source cited in code and README, and Saturn's grid is documented as cross-checked against an independent source.
  4. A documented worked example (statement → letters kept → number sequence) matches what a practitioner would derive by hand, and the Pythagorean encoding rejects Chaldean-table values on known test vectors.

**Plans**: 3/3 plans executed

Plans:

- [x] 01-01-PLAN.md
- [x] 01-02-PLAN.md
- [x] 01-03-PLAN.md

**Wave 1**

- [x] 01-01: Repo scaffold + canonical kamea data lock (all seven grids, D-04 human sign-off) + Pythagorean table derivation

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 01-02: Walking-skeleton tracer — statement → Saturn sigil SVG on stdout through every layer — plus sigil anatomy (start/end markers, nodes, class taxonomy)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 01-03: JSON working (full D-14 derivation trail) + full CLI surface (stdin, `--json`, `--output`, planet validation) + determinism suite and README

### Phase 2: Every Planet, Every Statement

**Goal**: Any of the seven classical planets and any statement — including the degenerate and the accented ones — produce either a trustworthy sigil or a clear, actionable error, identically from library and CLI.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: KAMEA-02, PATH-02, CONS-03, CONS-04, INT-03, INT-04
**Success Criteria** (what must be TRUE):

  1. User can select any of the seven classical planets and the same statement produces seven visibly distinct sigils, each traced on that planet's kamea geometry.
  2. A statement whose number sequence contains consecutive repeats renders the traditional loop/notch marker at that cell — and only on consecutive repeats, not on any recurrence of a number.
  3. A statement that reduces to nothing (all vowels/repeats) produces a clear error naming the cause; a statement that reduces to a single letter produces a valid single-node sigil.
  4. Accented/non-ASCII input and the letter Y follow a documented, deterministic rule that a user can read in the README and observe applied consistently in output.
  5. Running the same statement + planet + options twice produces byte-identical SVG and JSON, and invalid input produces the same error whether called from the library or the CLI.

**Plans**: 2 plans

Plans:

- [ ] 02-01-PLAN.md — Accent folding + consecutive-repeat loop marker, traced end to end on a non-Saturn kamea
- [ ] 02-02-PLAN.md — Degenerate-input errors, documented letter-handling rules, and the seven-planet determinism matrix

**Wave 1**

- [ ] 02-01: Tracer — accented statement with a consecutive repeat renders a `sigil-loop` sigil on Jupiter through library and CLI (fold.js, PathModel repeats, loopLayer), then countable multi-loops, coincident boundary markers, and the single-node dual marker (D-17 through D-20, D-22, D-25, D-27)

**Wave 2** *(blocked on Wave 1 completion)*

- [ ] 02-02: Enriched E_EMPTY_SEQUENCE with strike counts and structured data (D-26), README letter-handling rule table (D-21 through D-24), and the all-seven-planet byte-equality + file-snapshot matrix (KAMEA-02, INT-03, INT-04)

### Phase 3: Themeable, Embeddable Layers

**Goal**: A site can embed several sigils on one page and restyle every one of them entirely from CSS — grid, glyph, and curve options included — without touching the generated markup.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: REND-02, REND-03, REND-04, REND-05, REND-06
**Success Criteria** (what must be TRUE):

  1. User can switch path rendering between straight segments (default) and curved/smoothed, and the underlying letters, number sequence, and cell coordinates are unchanged.
  2. The kamea grid layer (cell borders + cell numbers) is present in the output, hidden by default, and made visible by a CSS rule alone.
  3. The planetary glyph layer (♄ ♃ ♂ ☉ ♀ ☿ ☽) can be included as an optional layer and is styled and positioned entirely from CSS.
  4. Every themeable value is exposed as a `--sigil-*` custom property with a default, and the generated SVG contains no `style=""` attributes or hardcoded presentation values that defeat theming.
  5. Two sigils embedded in one page render independently with zero id collisions between them.

**Plans**: 2 plans

Plans:

- [ ] 03-01: Layer sub-renderers (grid, glyph) + curved path option
- [ ] 03-02: CSS custom-property surface + deterministic per-instance id namespacing

**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. First Sigil, End to End | 3/3 | Complete    | 2026-08-06 |
| 2. Every Planet, Every Statement | 0/2 | Not started | - |
| 3. Themeable, Embeddable Layers | 0/2 | Not started | - |

## Requirement Coverage

| Requirement | Phase |
|-------------|-------|
| CONS-01 | Phase 1 |
| CONS-02 | Phase 1 |
| CONS-03 | Phase 2 |
| CONS-04 | Phase 2 |
| KAMEA-01 | Phase 1 |
| KAMEA-02 | Phase 2 |
| KAMEA-03 | Phase 1 |
| PATH-01 | Phase 1 |
| PATH-02 | Phase 2 |
| PATH-03 | Phase 1 |
| REND-01 | Phase 1 |
| REND-02 | Phase 3 |
| REND-03 | Phase 3 |
| REND-04 | Phase 3 |
| REND-05 | Phase 3 |
| REND-06 | Phase 3 |
| OUT-01 | Phase 1 |
| INT-01 | Phase 1 |
| INT-02 | Phase 1 |
| INT-03 | Phase 2 |
| INT-04 | Phase 2 |

**Coverage:** 21/21 v1 requirements mapped. No orphans, no duplicates.

---
*Roadmap created: 2026-08-04*
