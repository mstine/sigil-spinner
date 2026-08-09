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

## Milestone: v1.1 — Distribution

**Shipped:** 2026-08-09
**Phases:** 4 | **Plans:** 16 | **Commits:** 121 | **Elapsed:** 3 days

### What Was Built

The tool left the repo. `@falkensmage/sigil-spinner@1.1.0` on the public npm registry, published by CI with a Sigstore provenance attestation, zero transitive dependencies. A `<sigil-spinner>` custom element in light DOM, no build step, that a page's own CSS fully controls through both custom properties and class selectors. A personal Claude Code skill that a cold session routes to unprompted, carrying Matt's own ratified planet correspondences. And, before any of it, a phase that made the artifact correct while corrections were still free.

### What Worked

- **Ordering by irreversibility instead of by feature.** This was the milestone's central bet and it paid directly. Phase 5 fixed four artifact-level things — a missing output field, a CLI parity gap, ARIA wiring, 33 rotted citations — that would each have cost a version bump after the publish. Nothing in Phases 6-8 needed one.
- **The rehearsal ladder treated as an acceptance criterion.** `pack --dry-run` → tarball scratch-install → `publish --dry-run` → `--tag next` → promote. Explicitly disqualifying `npm link` as the smoke test was the sharpest call in it: it symlinks the working tree and masks precisely the `files`/`exports` faults the test exists to catch.
- **Refusing to self-certify the un-certifiable.** Phase 8's cold-session routing claim could not be honestly verified by any test, agent, or subagent — a subagent spawned from a session that has already loaded the repo inherits that context and proves nothing. Every executor declined, the verifier declined, and it was closed by an actual human observation with its preconditions recorded. That is the process working, not stalling.
- **Fixing at the verification gate rather than carrying residual risk.** Phase 7's "re-renders" test could not distinguish a real re-render from a same-value skip. Instead of accepting the reviewer's finding as noted-and-deferred, the assertion was replaced and then *proven to discriminate* by injecting the exact regression it guards against — which also demonstrated the original assertion would have stayed green. Proof of discrimination, not just presence.
- **`actuals` populated on every summary.** v1.0's retrospective asked for exactly this ("either populate `actuals` on every summary or drop the field"). 16/16 this milestone, against 3/14 last time. The recommendation was followed and the data is now usable.

### What Was Inefficient

- **Security ran last instead of never — but only by luck.** Four phases shipped with `security_enforcement: true` and an active `verify:post` hook with `onError: halt`, and produced zero SECURITY.md. Nothing caught it during execution. It surfaced only because the milestone audit went looking, and the retroactive pass then found two genuine defects in the release workflow — a dispatch input substituted into a shell line in the token-holding job, and a promote step that would silently demote `latest` and exit 0. Both were live. An enforcing gate that four phases walked past is not an enforcing gate.
- **The executor threat-flag channel was empty for all four Phase 6 plans.** No `## Threat Flags` section in any summary, on the phase that stood up credentialed CI and performed an irreversible public write. Both real defects reached the audit through code review instead — an adjacent process doing security's job part-time.
- **The deliberate publish boundary was invisible where it mattered.** D-98 correctly scoped Phase 7 to build the element without publishing it. But the repo then described a surface the registry did not serve, and nothing said so where an auditor would read it — so the milestone audit's integration check read it as three blocked requirements. The decision was right; its bookkeeping was not.
- **A shipped artifact carried a statement that went false on release.** `skill/SKILL.md` documented the published surface as `1.0.0` with no element subpath. Correct when written, false the moment 1.1.0 shipped, and caught at milestone close rather than by anything mechanical. The file even predicted its own staleness in prose — which is not a guard.

### Patterns Established

- **Fail-first proof as the standard for a guard, not a nicety.** Every drift guard this milestone was mutation-proven red-then-green before its plan closed, in both directions where the guard was bidirectional. The citation checker's own soundness bug is the argument: a guard that has never been observed failing is an assumption wearing a test's clothes.
- **Re-query live state at authoring time rather than assuming it.** Phase 8's D-116 checked the registry before writing what the published surface was, instead of inferring it from the repo. That is why the skill documented the correct surface for its whole life — and why the one thing that did go stale was a *dated snapshot* rather than a wrong inference.
- **Human gates placed last in the phase, by design.** Phase 8 put the correspondences plan last so a "no" or "not now" would cost one plan rather than the phase, with an explicit pending-marker fallback. The gate landed, but the structure meant it did not have to.
- **Read-only verification against live external state.** The Phase 6 verifier and the milestone audit both verified against the real registry and the real GitHub repo from scratch directories they created and destroyed, running no mutating command. Verification of a published artifact does not require re-publishing it.

### Key Lessons

1. **An enforcing gate that nothing enforces is documentation.** `security_enforcement: true` with `onError: halt` did not halt anything for four phases. Config that asserts a guarantee needs something that observes the guarantee — the same lesson the drift guards learned, applied one level up.
2. **A deliberate boundary needs to be legible to the process that will audit it.** D-98's "we are not publishing" was a good call recorded where the auditor did not look, and it cost an integration check three false blockers.
3. **Prose that predicts its own staleness does not prevent it.** "If a future publish adds that subpath, this section is the place to extend the skill" was written *in* the file that went stale. Only a mechanical binding would have caught it — the same file's flag table has one, and the flag table did not drift.
4. **Remediation did not shrink; it moved.** v1.0 ran 36% of plans as remediation. v1.1 ran 1 of 16 (6%) — but that is not a fourfold improvement, because the remediation relocated to a quick task, a verification-gate fix, and a retroactive security pass with two fixes. Counting only in-plan remediation would flatter the number. The honest read is that the work is similar and the *accounting* changed.
5. **The registry has behaviors your plan does not.** npm auto-seeded `latest` on the first publish despite `--tag next`, invalidating a mitigation. It then did *not* recur on the second publish — which was the more dangerous case, because it silently leaves `latest` behind on the old version. Both were predicted only after someone went and read how the registry actually behaves.

### Cost Observations

- **Model mix:** not instrumented. Worth a `model` field in `actuals` if this ever matters.
- **Plan execution:** 62,842 tokens recorded across 16/16 plans (v1.0: 3/14 populated). Mean ~3.9k, range 1.2k (06-04, a verify-only close) to 10.1k (07-02, the nine-assertion browser suite).
- **Sessions:** not tracked. 121 commits over 3 days.
- **Notable:** the two most expensive plans (07-02 at 10.1k, 05-01 at 8.8k) were both *test-writing* plans, not feature plans. The feature work was cheap; proving it was not.

---

## Cross-Milestone Trends

*Two milestones. Trends are now suggestive, not yet established.*

### Process Evolution

| Milestone | Phases | Plans | Remediation share | Key Change |
|-----------|--------|-------|-------------------|------------|
| v1.0 | 4 | 14 | 36% (5/14) | Baseline: vertical MVP slices, tracer-first decomposition, dedicated pre-ship tech-debt phase |
| v1.1 | 4 | 16 | 6% in-plan (1/16), but see Lesson 4 — remediation moved to quick tasks, verification gates, and a retroactive audit rather than shrinking | Ordering by irreversibility; rehearsal ladder as acceptance criterion; fail-first proof as the standard for every guard |

### Cumulative Quality

| Milestone | Tests | Snapshots | Runtime deps | Typecheck | Lint |
|-----------|-------|-----------|--------------|-----------|------|
| v1.0 | 1,453 | 48 | 0 | exit 0 | exit 0 |
| v1.1 | 1,532 (+ 2 pack-install) | 48 | 0 | exit 0 | exit 0 |

### Defects Found By

| Milestone | Automated suite | Human/UAT | Audit | Code review | Security pass |
|-----------|-----------------|-----------|-------|-------------|---------------|
| v1.0 | 0 shipped-defect catches | 2 (G-02-1, G-03-1) | 11 tech-debt items | — | 0 open (3 phases) |
| v1.1 | 0 shipped-defect catches | 1 (Phase 7 rendered-page verdict) | 1 process gap (missing security passes) + 17 open items catalogued | 5 fixed in-phase (Phase 8), 2 carried (Phase 6) | 2 live defects in the release workflow |

**The pattern holds and sharpens.** Across two milestones the automated suite has caught **zero** shipped defects. Everything real was found by a human looking at output, an audit going looking, a code review, or a security pass. The suite's job is preventing regression, not discovering defects — and both milestones are consistent about that.

### Top Lessons (Verified Across Milestones)

*Now with a second data point. Verified = held or strengthened in v1.1.*

1. **Structural tests verify wiring, not appearance** — ✅ **verified.** v1.1's Phase 7 was designed around this lesson from the start (criterion 1 was explicitly a human-rendering check), and the WR-02 fix generalized it: a test can assert the right *value* and still not prove the *event* happened.
2. **Honest scope on unverifiable claims passes audits; overclaiming fails them** — ✅ **verified, twice.** Phase 8's refusal to self-certify cold-session routing, and Phase 6's three truths accepted as documented historical evidence rather than dressed as re-verified, both passed on the strength of being honest about their limits.
3. **Lock the highest-cost-to-fix data first, with human sign-off** — ✅ **verified in a new domain.** v1.0 applied it to kamea provenance; v1.1 applied the same shape to the five one-way npm identity fields, frozen at a human checkpoint before the publish made them permanent.
4. **A guard that has never been seen failing is an assumption** — 🆕 **new in v1.1, strong candidate.** The citation checker passed a green suite while being unsound in two ways. Every guard built afterward was mutation-proven.

---
*Retrospective started: 2026-08-07 (v1.0 MVP)*
*Updated: 2026-08-09 (v1.1 Distribution)*
