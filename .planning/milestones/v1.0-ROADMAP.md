# Roadmap: Sigil Spinner

## Overview

Sigil Spinner is built as three widening vertical slices. Phase 1 drives one intention statement all the way through the pipeline to a rendered Saturn sigil — text normalization, canonical kamea data, path tracing, SVG, JSON working, library, and CLI — so the riskiest work (kamea correctness) is locked and source-verified before anything downstream trusts it. Phase 2 widens the same spine to all seven classical planets and hardens the input surface: degenerate statements, non-ASCII letters, consecutive-repeat markers, and byte-identical determinism. Phase 3 makes the output an embeddable design element: curve rendering, grid and glyph layers, `--sigil-*` custom properties, and multi-embed id safety. Each phase ships something Matt (or Claude Code in a build context) can actually run.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: First Sigil, End to End** - Statement + Saturn → correct SVG sigil and JSON working, via library and CLI, on source-verified kamea data (completed 2026-08-06)
- [x] **Phase 2: Every Planet, Every Statement** - All seven classical planets selectable, with degenerate/non-ASCII inputs and repeat markers handled deterministically (completed 2026-08-06)
- [x] **Phase 3: Themeable, Embeddable Layers** - Grid, glyph, and curve layers fully restylable from CSS, with multiple sigils safely on one page (completed 2026-08-07)
- [x] **Phase 4: v1.0 Tech Debt Closeout** - `working.render` round-trip, CLI diagnostics, and README working-field documentation — the debt carried out of the v1.0 audit (completed 2026-08-07)

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

**Plans**: 4/4 plans executed

Plans:

- [x] 02-01-PLAN.md — Accent folding + consecutive-repeat loop marker, traced end to end on a non-Saturn kamea
- [x] 02-02-PLAN.md — Degenerate-input errors, documented letter-handling rules, and the seven-planet determinism matrix
- [x] 02-03-PLAN.md — Gap closure (G-02-1): repeat marker rewritten as a cell-anchored full loop, plus loop byte-pinning on all seven kameas
- [x] 02-04-PLAN.md — Gap closure (CONS-03/CONS-04): accurate character vs. strike counts in the degenerate-input error, Latin stroke/bar letter folding with a scoped README rule, and CLI exception safety

**Wave 1**

- [x] 02-01: Tracer — accented statement with a consecutive repeat renders a `sigil-loop` sigil on Jupiter through library and CLI (fold.js, PathModel repeats, loopLayer), then countable multi-loops, coincident boundary markers, and the single-node dual marker (D-17 through D-20, D-22, D-25, D-27)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 02-02: Enriched E_EMPTY_SEQUENCE with strike counts and structured data (D-26), README letter-handling rule table (D-21 through D-24), and the all-seven-planet byte-equality + file-snapshot matrix (KAMEA-02, INT-03, INT-04)

**Wave 2 (gap closure)** *(from UAT gap G-02-1)*

- [x] 02-03: Repeat marker rewritten as a full loop anchored at the cell point, bulging perpendicular to the run's real travel; radius-only nesting (D-18) and boundary handling (D-19); D-27 offset decoupled (IN-03); repeat-carrying snapshot matrix on all seven kameas (IN-04)

**Wave 3 (gap closure)** *(from verification gaps on CONS-03 / CONS-04, plus promoted CR-01/CR-02)*

- [x] 02-04: `E_EMPTY_SEQUENCE` counts original characters and derived strikes separately (CONS-03/SC3); `TRANSLITERATION_MAP` extended to the full Latin stroke/bar class under a ratified D-23 amendment, resolving the `Đ`/`Ð` confusable, with README rules 2-3 scoped to what the code implements and the excluded classes opted out by name (CONS-04/SC4); stroke-letter snapshot matrix on all seven kameas (INT-03); `bin/` argv-parse and stdin-read made exception-safe with CLI-local usage codes, no domain validation relocated (CR-01, CR-02, INT-04)

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

**Plans**: 4/4 plans executed

Plans:

- [x] 03-01-PLAN.md — Tracer: the option seam proven end to end through the optional planetary glyph layer
- [x] 03-02-PLAN.md — Kamea grid layer, always emitted and hidden by default
- [x] 03-03-PLAN.md — Curved path rendering, with construction proven untouched
- [x] 03-04-PLAN.md — `idPrefix` multi-embed safety and the full theming enforcement suite

**Wave 1**

- [x] 03-01: Tracer — `--glyph` from CLI flag through library option validation (`E_INVALID_OPTION`, D-47), `src/render/glyphs.js`, the `renderSvg` layer-array head (D-39), and the working's new `render` block (D-48); plus the seven-planet glyph matrix and the README theming table (REND-04)

**Wave 2** *(blocked on Wave 1)*

- [x] 03-02: `gridLayer` — one lattice path plus `order²` cell numbers inside a hidden `<g class="sigil-grid">` (D-32, D-33, D-34), kamea matrix threaded through the render-options seam (D-35), and the one-time SVG snapshot rebase (REND-03)

**Wave 3** *(blocked on Wave 2)*

- [x] 03-03: `src/render/curve.js` — hand-rolled centripetal Catmull-Rom to cubic Bézier (D-28), `pathLayer` dispatcher and `--curve` flag (D-29, D-30), with the JSON working proving letters, numbers, and cells are unchanged (REND-02, Success Criterion 1)

**Wave 4** *(blocked on Wave 3)*

- [x] 03-04: Caller-supplied `idPrefix` escaped into the root element (D-43, D-44), the seven-planets × every-option-combination guard suite for `--sigil-*` and id-freedom (D-42), and D-45's two Success-Criterion-5 multi-embed tests (REND-05, REND-06)

**Note on the plan count:** the original 2-plan hypothesis bundled three independent features into one plan. Restructured to 4 under tracer-first decomposition. All four waves are strictly sequential regardless, because every slice modifies `src/render/svg.js` and `src/generate.js` — no two plans in this phase can share a wave without a `files_modified` conflict.

**UI hint**: yes

### Phase 4: v1.0 Tech Debt Closeout

**Goal**: Address the tech debt carried out of the v1.0 milestone audit — make `working.render` round-trip back into `generateSigil`, give the CLI diagnostics for the argv cases it currently swallows, and document the JSON working's fields in the README.
**Depends on**: Phase 3
**Requirements**: TD-WR01, TD-WR04, TD-DOC, TD-ORD, TD-EXP, TD-META — phase-local
debt IDs traceable to `.planning/v1.0-MILESTONE-AUDIT.md`. The v1 requirement set
(21/21) closed with the milestone, so no REQUIREMENTS.md ID maps to this phase.
**Success Criteria** (what must be TRUE):

  1. A consumer holding only a JSON working can pass `working.render` straight back into `generateSigil` and get byte-identical SVG — on all seven planets, with and without an `idPrefix` — and that call typechecks under `tsc --checkJs` with no cast at the call site. `{ glyph: null }` still throws `E_INVALID_OPTION`, proving the fix is scoped to string-typed options rather than to `null` in general.
  2. `sigil-spinner.js 'A' 'EXTRA' --planet saturn` exits 2 with exactly one `E_CLI_USAGE` stderr line naming the rejected argument and empty stdout, while the single-positional and `-` stdin paths remain byte-identical.
  3. The README documents all fifteen fields the JSON working actually carries — including `keptTrail`, `repeats`, and the whole `render` block — plus the two CLI-local diagnostic codes, which appeared zero times before this phase.
  4. `generateSigil('AEIOU','pluto')` reports `E_UNKNOWN_PLANET` rather than masking it behind `E_EMPTY_SEQUENCE`, and every single-fault case still reports exactly the code it reported before.
  5. All five `E_*` constants import from the package root, and the CLI's exit-status map is keyed from those constants so a rename cannot silently orphan an entry.
  6. All four Phase 2 SUMMARY files carry `requirements-completed`, restoring the milestone audit's third cross-reference source for six requirements.
  7. All eleven items in the v1.0 tech-debt register end the phase decided — six fixed, two closed as verified non-issues with evidence, three deferred with a written reason and a reopen condition. Zero silent drops.
  8. Every one of the 48 committed snapshot files is byte-unchanged, and the suite stays green above its 1405-test baseline with `typecheck` and `lint` at exit 0.

**Scope seeds** (from `.planning/v1.0-MILESTONE-AUDIT.md`, 11 open items):

- **WR-01** — `working.render` round-trip is broken. `working.render.idPrefix` serializes as JSON `null` when absent (correct per D-48), but `resolveOptions` treats only strictly-`undefined` as absent, so `generateSigil(s, p, working.render)` throws `E_INVALID_OPTION` in the default case — contradicting `src/render/json.js`'s own doc comment. The audit names this "the one to fix first."
- **WR-04** — the CLI silently discards extra positional arguments; `sigil-spinner.js 'A' 'EXTRA' --planet saturn` renders the first statement with no diagnostic.
- **README working fields** — the JSON working's field set (`kameaSet`, `lettersKept`, `lettersStruck`, `letterNumbers`, `cells`, `segments`, `render`, …) is executor-discretion naming from 01-03 and is not documented for consumers.

**Plans**: 3/3 plans executed

Plans:

- [x] 04-01-PLAN.md — Tracer: `working.render` round-trips back into `generateSigil` (WR-01)
- [x] 04-02-PLAN.md — CLI extra-positional diagnostic (WR-04) and the README working-field reference
- [x] 04-03-PLAN.md — Validation ordering, public error-code constants, SUMMARY frontmatter backfill, and the register's final disposition

**Wave 1**

- [x] 04-01: Widen `resolveOptions`'s absent-check to the type-keyed sentinel (D-49) and the `GenerateOptions.idPrefix` typedef to `string | null` (D-50) — the runtime fix alone leaves the round-trip failing `tsc --checkJs` with TS2345, verified during planning. Inverts one existing test deliberately (D-49a); the boolean-null guard stays untouched as the scoping proof.

**Wave 2** *(blocked on Wave 1 — shares `test/cli/cli.test.js`, and the README can only document a round-trip that works)*

- [x] 04-02: Third use of the CLI's existing `diagnose()`/`E_CLI_USAGE` pattern for extra positionals (D-51), plus a fifteen-row JSON-working field table sourced from the `SigilWorking` typedef (D-52) and the CLI-local diagnostic codes (D-53).

**Wave 3** *(blocked on Wave 2 — shares `src/generate.js` with 04-01 and `bin/sigil-spinner.js` with 04-02)*

- [x] 04-03: Planet identity validated before statement content (D-54), `E_*` constants published and the CLI exit map rekeyed to them (D-55), Phase 2 SUMMARY frontmatter backfilled from `02-VERIFICATION.md` (D-56), and all eleven register items dispositioned in writing.

**Note on the wave shape:** all three waves are strictly sequential, for the same
reason Phase 3's four were — every plan touches `test/cli/cli.test.js`, and two of
them touch `src/generate.js`. Splitting the tests into a new file purely to unlock
parallelism would break the in-file `runCli()`/`STATEMENT` convention the pattern
map named as the analog, which is a worse trade than three short waves.

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. First Sigil, End to End | 3/3 | Complete    | 2026-08-06 |
| 2. Every Planet, Every Statement | 4/4 | Complete    | 2026-08-06 |
| 3. Themeable, Embeddable Layers | 4/4 | Complete    | 2026-08-07 |
| 4. v1.0 Tech Debt Closeout | 3/3 | Complete    | 2026-08-07 |

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

**Phase 4 carries no rows in this table, deliberately.** The v1 requirement set
closed with the v1.0 milestone; Phase 4 is debt closeout against
`.planning/v1.0-MILESTONE-AUDIT.md`, so its plans carry phase-local `TD-*` IDs
that trace to audit register items rather than to REQUIREMENTS.md. This is a
visible choice, not a coverage gap — fabricating REQ-IDs to fill the table would
be worse than leaving it honest.

---
*Roadmap created: 2026-08-04*
