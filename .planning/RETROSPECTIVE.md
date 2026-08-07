# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP

**Shipped:** 2026-08-07
**Phases:** 4 | **Plans:** 14 | **Tasks:** 27 | **Commits:** 138 | **Elapsed:** 4 days (2026-08-04 → 2026-08-07)

### What Was Built

- A zero-dependency Node CLI + ESM library turning any intention statement and any of the seven classical planets into a deterministic, traditionally-constructed sigil — self-contained inline SVG plus a complete JSON working.
- All seven `agrippa` kamea grids (Saturn 3×3 → Moon 9×9) hard-coded with honest documented provenance, and a Pythagorean encoder derived from the 1–9 cycling formula rather than transcribed — making Chaldean-table contamination structurally impossible rather than merely tested-against.
- A full theming surface: hand-rolled centripetal Catmull-Rom → cubic Bézier curves, an always-emitted CSS-revealable kamea grid layer, an opt-in planetary glyph layer, 15 `--sigil-*` custom properties, and caller-supplied `idPrefix` namespacing for multi-embed safety.
- 1,453 tests across 18 files including 48 byte-pinned snapshots; `tsc --checkJs` and `eslint` both at exit 0; zero runtime dependencies.

### What Worked

- **Vertical slices, hard.** Phase 1 drove one statement end to end through every layer before Phase 2 widened to seven planets. The spine never needed redesigning. The alternative — building normalize, then encode, then render as horizontal layers — would have deferred the integration risk to the end, which is where it is most expensive.
- **Locking the riskiest data first, with a human in the loop.** All seven kameas were source-verified and signed off at the D-04 `approve-candidate` checkpoint in the very first plan, though only Saturn was exercised for another two phases. That data was never revisited, and the milestone audit's provenance review had exactly one artifact to check.
- **Honest provenance beat delayed provenance.** The kamea citation states precisely what was verified (magic-sum on all seven, second-source on Saturn and Jupiter) and claims nothing more. KAMEA-03 passed the audit *because* the citation was honest about its limits — an overclaim would have failed the requirement it was trying to satisfy.
- **Tracer-first plan decomposition.** Phase 3's original 2-plan hypothesis bundled three independent features; restructuring to 4 tracer-led plans surfaced that all four were strictly sequential anyway (shared `src/render/svg.js`), which was better to know before execution than during it.
- **A dedicated tech-debt phase before shipping.** Phase 4 turned an eleven-item audit register into eleven written dispositions. Two turned out to be non-issues *only because someone checked* — the `-0` guard would have been dead code, since `String(-0)` and `JSON.stringify(-0)` already return `"0"`.

### What Was Inefficient

- **G-02-1: the loop markers shipped visibly wrong and a human caught them.** `loopLayer` drew detached 180° arcs offset away from the cell — not loops at all. Three compounding geometry decisions plus dead direction code, and *none* of the existing tests caught it, because they asserted counts, radii distinctness, and `var()` paints rather than connectedness. The root cause was a misread decision record: the implementer's JSDoc claimed the open arc avoided "a closed ring (D-17)," but D-17 actually said "small loop (circular curl at the cell)." The anti-closed-shape reading was invented. Cost: a full diagnostic session plus gap-closure plan 02-03.
- **G-03-1: the same shape again, in CSS.** Two `--sigil-*` font-size properties were wired into markup that *looked* correct and silently fell back to `inherit` at computed-value time. Every structural test passed. Matt found it by looking at a page. Cost: a fix commit plus the suite's only browser-rendering test.
- **Phase 4's own remediation invalidated Phase 2's verification.** The D-56 frontmatter backfill touched four SUMMARY files, making them newer than `02-VERIFICATION.md` and flipping the phase to `stale` — for a change that transcribed content *from that very verification file*. Closing the milestone required an explicit written override for a defect that did not exist.
- **A resolved debug session sat open for a day.** `g-02-1-loops-are-detached-arcs` ran in diagnose-only mode; the fix landed in plan 02-03 and the session file was never flipped to `resolved`, so it surfaced as the sole blocker at milestone close.

### Patterns Established

- **Byte-pinned file snapshots as the determinism contract.** 48 committed SVG snapshots across seven planets × option combinations. A change either leaves them byte-identical or announces itself. Snapshot churn was predicted in advance for every plan that caused it (Phase 3's one reviewed rebase of 31 files) and was zero everywhere else.
- **Validation lives in the library; the CLI is genuinely thin.** Domain errors carry stable `E_*` codes owned by `src/errors.js`; CLI-syntax failures use CLI-local codes that never enter that taxonomy. Programmatic callers and CLI users get identical guarantees.
- **Artifact to stdout, diagnostics to stderr, exit codes by error class** — usage-class 2, derivation-class 3. Makes the tool composable in a build pipeline without parsing prose.
- **Decision IDs (`D-NN`) cited in source comments, traceable to plans.** High-value — and the G-02-1 post-mortem showed the failure mode: a cited ID with a *misquoted* claim is worse than no citation, because it looks verified.
- **Hand-roll before depending.** The curve math was the one place a dependency (`d3-shape`) was pre-approved in the stack research. Writing ~30 lines in-repo kept `dependencies: {}` intact and kept float formatting under the project's own control, which is what the byte-pins require.

### Key Lessons

1. **Structural tests do not see rendering.** Both real defects in this milestone (G-02-1, G-03-1) passed every assertion in a green suite and were caught by a human looking at output. Tests that assert "an arc exists with radius r" and "the attribute contains `var()`" verify wiring, not appearance. **Forward:** for any visual claim, either render it (the browser computed-style test) or assert the property that makes it *true* rather than *present* — e.g. "the loop's path data begins at the cell point," which is connectedness, not decoration.
2. **"The attribute maps to a CSS property" is necessary and not sufficient.** The substituted value must also be valid *for that property*. A presentation attribute containing `var()` is parsed as a CSS declaration, so `font-size="var(--x, 13.333)"` dies at computed-value time and falls back silently — for the default as well as every override.
3. **Quote the decision record; don't paraphrase it from memory.** G-02-1's root cause was an implementer's gloss that inverted what D-17 actually said, then cited D-17 as authority for the inversion. Citing an ID is a claim about the source and should be verified like one.
4. **Honest scope on unverifiable claims passes audits; overclaiming fails them.** State exactly what was checked and by what method. KAMEA-03's provenance limit was approved at a checkpoint, documented in code and README, and re-confirmed at UAT — and satisfied the requirement as written.
5. **Metadata maintenance is real work with real ordering constraints.** Backfilling four SUMMARY files from a verification report invalidated that report's freshness check. Remediation that touches artifacts the verification system timestamps against should be sequenced before verification, or the staleness it creates must be explained in writing at close.
6. **Close diagnose-only sessions explicitly.** A diagnose-only debug session records `fix: not applied` by design. Nothing flips it when the fix lands in a later plan, so it lingers as a false-open artifact until milestone close forces the question.

### Cost Observations

- **Model mix:** not instrumented this milestone — the `actuals` frontmatter block records token counts on only 3 of 14 summaries (01-01: 26.5k, 01-03: 9.85k), so no reliable aggregate exists. **Forward:** either populate `actuals` on every summary or drop the field; partial data is worse than none, since it invites false averages.
- **Sessions:** not tracked. Elapsed wall-clock was 4 days across 138 commits.
- **Notable:** the two gap-closure plans (02-03, 02-04) and the entire Phase 4 (3 plans) — 5 of 14 plans, ~36% — were remediation rather than new capability. That is not obviously bad for a milestone that shipped audit-clean, but it is the number to watch: if v1.1 also runs ~a third remediation, the front-loaded verification is not paying for itself.

---

## Cross-Milestone Trends

*One milestone so far — trends need a second data point before they mean anything. Tables seeded for v1.1.*

### Process Evolution

| Milestone | Phases | Plans | Remediation share | Key Change |
|-----------|--------|-------|-------------------|------------|
| v1.0 | 4 | 14 | 36% (5/14) | Baseline: vertical MVP slices, tracer-first decomposition, dedicated pre-ship tech-debt phase |

### Cumulative Quality

| Milestone | Tests | Snapshots | Runtime deps | Typecheck | Lint |
|-----------|-------|-----------|--------------|-----------|------|
| v1.0 | 1,453 | 48 | 0 | exit 0 | exit 0 |

### Defects Found By

| Milestone | Automated suite | Human/UAT | Audit |
|-----------|-----------------|-----------|-------|
| v1.0 | 0 shipped-defect catches | 2 (G-02-1, G-03-1) | 11 tech-debt items |

### Top Lessons (Verified Across Milestones)

*Needs a second milestone to verify. v1.0 candidates, in order of expected durability:*

1. Structural tests verify wiring, not appearance — visual claims need rendering or a truth-shaped assertion.
2. Honest scope on unverifiable claims passes audits; overclaiming fails them.
3. Lock the highest-cost-to-fix data first, with a human sign-off, even when downstream work does not yet exercise it.

---
*Retrospective started: 2026-08-07 (v1.0 MVP)*
