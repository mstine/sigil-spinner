---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: Distribution
current_phase: 8
status: completed
stopped_at: Completed 08-04-PLAN.md — Phase 8 code-complete; D-118/D-119 cold-session check outstanding
last_updated: "2026-08-09T20:38:51.472Z"
last_activity: 2026-08-09
last_activity_desc: Phase 6 complete, transitioned to Phase 7
progress:
  total_phases: 4
  completed_phases: 4
  total_plans: 16
  completed_plans: 16
  percent: 100
current_phase_name: The Sigil Skill
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-08-07 after v1.0)

**Core value:** Given any intention statement and any of the seven classical planets, the tool deterministically produces a correct, traditionally-constructed sigil as embeddable, fully CSS-stylable SVG.
**Current focus:** Phase 8 — The Sigil Skill

## Current Position

Phase: 8
Plan: Not started
Status: All phases complete
Last activity: 2026-08-09 — Phase 8 complete

Progress: [██████████] 100% (0 of 4 v1.1 phases complete)

## v1.1 Roadmap at a Glance

| Phase | Goal | Requirements | Wave |
|-------|------|--------------|------|
| 5. Publish-Ready Source | Source correct before a version number becomes permanent | PKG-02, INT-05, INT-06, MAINT-01 | 1 |
| 6. Published Package | `npm install` works from a fresh project, with provenance | PKG-03, PKG-04, PKG-01, PKG-05 | 2 |
| 7. The sigil-spinner Element | `<sigil-spinner>` renders themeable, no build step | WRAP-01, WRAP-02, WRAP-03 | 3 (parallel with 8) |
| 8. The Sigil Skill | Any Claude Code session picks the right planet unprompted | SKILL-01, SKILL-02, SKILL-03 | 3 (parallel with 7) |

Ordered by irreversibility, not by feature. `npm publish` cannot be taken back — everything that changes what the artifact *is* lands before the publish. Phases 7 and 8 share zero files and are deliberately not braided: the element serves Matt's pages, the skill serves Claude sessions.

## Shipped

**v1.0 MVP** — 4 phases, 14 plans, 27 tasks, 138 commits, 2026-08-04 → 2026-08-07.

| Check at close | Result |
|---|---|
| Full suite | 1,453 passed / 18 files |
| `typecheck` | exit 0 |
| `lint` | exit 0 |
| Runtime dependencies | 0 |
| v1 requirements | 21/21 |

Details: [`MILESTONES.md`](MILESTONES.md) · Retrospective: [`RETROSPECTIVE.md`](RETROSPECTIVE.md)
Archives: [`milestones/v1.0-ROADMAP.md`](milestones/v1.0-ROADMAP.md), [`milestones/v1.0-REQUIREMENTS.md`](milestones/v1.0-REQUIREMENTS.md), [`milestones/v1.0-MILESTONE-AUDIT.md`](milestones/v1.0-MILESTONE-AUDIT.md), [`milestones/v1.0-phases/`](milestones/v1.0-phases/)

## Performance Metrics

**v1.0 velocity:**

- Plans completed: 14 across 4 phases
- Elapsed: 4 days

| Phase | Plans | Notes |
|-------|-------|-------|
| 01 First Sigil, End to End | 3 | 45min / 40min / 20min |
| 02 Every Planet, Every Statement | 4 | 45min / ~35min / 45min / ~50min — includes 2 gap-closure plans |
| 03 Themeable, Embeddable Layers | 4 | 15min / 25min / 12min / 15min |
| 04 v1.0 Tech Debt Closeout | 3 | 8min / 3min / 6min |

Token `actuals` were recorded on only 3 of 14 summaries — no reliable aggregate. See RETROSPECTIVE.md § Cost Observations.
**Per-Plan Metrics:**

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| Phase 05 P01 | 15min | 3 tasks | 13 files |
| Phase 05 P02 | 10min | 2 tasks | 10 files |
| Phase 05 P03 | 20min | 3 tasks | 6 files |
| Phase 05 P04 | 12min | 2 tasks | 1 files |
| Phase 6 P01 | 25min | 2 tasks | 4 files |
| Phase 06 P02 | 35min | 3 tasks | 5 files |
| Phase 06 P03 | 35min | 5 tasks | 1 files |
| Phase 06 P04 | 5min | 2 tasks | 1 files |
| Phase 07 P01 | 20min | 3 tasks | 2 files |
| Phase 08 P01 | 35min | 3 tasks | 5 files |
| Phase 08 P02 | 15min | 2 tasks | 2 files |
| Phase 08 P03 | 25min | 2 tasks | 2 files |
| Phase 08-the-sigil-skill P04 | ~15min | 1 tasks | 2 files |

## Accumulated Context

### Decisions

Full decision log with outcomes lives in [`PROJECT.md`](PROJECT.md) § Key Decisions (20 entries, all v1.0 decisions dispositioned with outcomes). Per-plan decision detail is archived under `milestones/v1.0-phases/*/`.

No decisions pending.

- [Phase ?]: Citation checker's window resolution prefers enclosing parenthetical, falls back to ±200-char span; text inside matched quotes excluded from further R1/R2 scanning to avoid false positives on self-referential headings
- [Phase ?]: PKG-02: kameaVersion doc comment cites the phase's live 05-CONTEXT.md (D-57–D-61), not an archived milestone document, since that is where the decision record currently lives and it satisfies the citation checker
- [Phase ?]: 05-03: role/aria-labelledby/title-id emitted only when title AND idPrefix are both present — title-only stays a bare <title> with no synthesized id, matching D-44's id-free-by-construction discipline
- [Phase ?]: 05-03: rejected a browser-test fail-first design that diverges only the aria-labelledby value from the title's own id — Chromium's SVG-AAM native <title>-child naming is an unconditional fallback independent of aria-labelledby resolution; used a genuinely discriminating corruption (removing <title> entirely) instead
- [Phase ?]: 05-04: MAINT-01 R1 evidence rule uses prefix match, not a length floor — 48/185 cited headings are under 19 chars, so any adequate length floor would reject legitimate short-heading citations
- [Phase ?]: 05-04: MAX_EXCERPT_TOKEN_DISTANCE=20 with nearest-first, first-match-wins candidate ordering closes WR-01 without breaking the chained citation in src/path/buildPath.js:51-53
- [Phase ?]: 06-01: version 1.0.0 and author 'Matt Stine (https://github.com/mstine)' with no email confirmed by human at Task 1 checkpoint; name/license/repository.url approved as specified
- [Phase ?]: 06-01: PKG-04 publication metadata complete — package.json, root LICENSE, README npm pass, and a mechanical drift guard (test/package-identity.test.js) binding README's specifier to package.json's name
- [Phase ?]: 06-02: pack-and-scratch-install smoke test (test/pack-install.test.js) resolves the package from outside its own boundary; Assumption A1 disproven by observation, resolved via a dedicated vitest.pack.config.js
- [Phase ?]: 06-02: .github/workflows/release.yml built — workflow_dispatch only, two closed-option choice inputs, action SHAs pinned and verified live, six D-77 gates before publish, promote reads version from manifest not input
- [Phase ?]: Approved the publish freeze after reviewing all nine frozen coordinates; published @falkensmage/sigil-spinner@1.0.0 via GitHub Actions with verified provenance
- [Phase ?]: npm assigned latest to 1.0.0 on this first-ever publish despite --tag next (a first-publish-only registry behavior); accepted rather than removed the tag since removal would break ROADMAP success criteria 1 and 2
- [Phase ?]: 06-04: dist-tag add already satisfied by npm's first-publish latest auto-assignment (recorded in 06-03); re-verified live (unchanged shasum/timestamp, surviving attestation, zero-dependency bare install) instead of dispatching a redundant promote
- [Phase ?]: 07-01: D-80 (show-title) and D-82 (light DOM, no shadow root) confirmed by Matt at the pre-execution gate; both checkpoint tasks resolved without re-prompting
- [Phase ?]: 07-01: Playwright visibility assertion uses locator.waitFor + isVisible(), not expect().toBeVisible() — the latter is a @playwright/test-only matcher this repo's vitest-based expect() does not have
- [Phase ?]: 07-01: getBBox() width/height destructured into a plain object inside page.evaluate — DOMRect accessor properties are dropped by Playwright's structured-clone serialization otherwise
- [Phase ?]: 08-01: D-99 confirmed by Matt at pre-execution gate — repo-canonical skill/, one-directional install, parity guard (option-a)
- [Phase ?]: 08-01: D-100 confirmed by Matt at pre-execution gate — package.json files array not extended, skill/ stays repo-only (option-a)
- [Phase ?]: 08-01: allowed-tools declares all six of Bash/Read/Write/Edit/Glob/Grep as a same-turn permission pre-approval, not a restriction, to avoid a mid-cold-session prompt
- [Phase ?]: 08-01: flag table stays inline in SKILL.md rather than delegating to --help (which does not exist on this CLI) — amends PITFALLS.md Pitfall 11 per D-104
- [Phase ?]: SKILL-03's drift guard proven bidirectional and fail-first via live mutation proofs (fabricated skill row, omitted CLI-documented row), not just fixture-backed soundness tests
- [Phase ?]: Install-parity guard's absent-destination case is this suite's one stated conditional no-op, printing why it did nothing rather than skipping silently (D-101)
- [Phase ?]: 08-03: D-116 discharged by live re-query — npm view returned 1.0.0 with no ./element export subpath, so the skill documents inline-SVG embedding only and names the observed version inline
- [Phase ?]: 08-03: Embedding checklist authored as a numbered list, not a second markdown table, so the drift guard's row-anchored regex cannot misread a prose flag mention as a documented one
- [Phase ?]: 08-03: skill/VERIFY.md states the session-restart precondition explicitly (a top-level skills directory created after a session starts is not watched by that session) so a first-run false negative is not mistaken for a real routing failure
- [Phase ?]: 08-04: Ratified with Saturn both-poles amendment ('It's both') — the row holds stability and restriction as one working rather than resolving to one pole; Moon row and verb-over-subject heuristic ratified unchanged
- [Phase ?]: 08-04: D-118/D-119 cold-session human check recorded as OUTSTANDING, not self-certified — requires a human in a fresh Claude Code session per skill/VERIFY.md Procedure 1

### Pending Todos

v1.1 scope lives in REQUIREMENTS.md; phase mapping lives in ROADMAP.md. Full traceability table is populated — 14/14 mapped, zero orphans.

**Human gates — neither can be automated, both are on the roadmap rather than waiting to be discovered:**

| Gate | Blocks | Does not block | Phase |
|------|--------|----------------|-------|
| npm automation token — created on npmjs.com, added as a GitHub Actions secret | PKG-01 (the publish), PKG-05 (provenance) | All of Phase 5; the metadata and smoke-test rehearsal that precede the publish | 6 |
| Matt's planet correspondences — lineage knowledge, not researchable | SKILL-02 | Skill scaffolding, SKILL-01, SKILL-03 | 8 |

**Open decisions deferred to discuss-phase** (not resolved in the roadmap, each with a named owner):

| Decision | Owner |
|----------|-------|
| Kamea-version scheme — semver vs. provenance date tied to the D-04 sign-off | Phase 5 |
| Web-component attribute name for the title (`title` is a global HTML attribute — collides) | Phase 7 |
| Formally locking the light-DOM choice | Phase 7 |
| Skill content-capture format for the correspondences | Phase 8 |

### Blockers/Concerns

No blockers. Carried forward as known, documented, non-blocking state:

- **Curve overshoot on one input.** `sun` + "I WILL SUCCEED" in curve mode puts a Bézier control point at `y = -0.916`, just past the viewBox top edge — real centripetal Catmull-Rom behavior on a ~180° reversal. Documented in README, deliberately not clamped. Visually confirmed acceptable at UAT.
- **Glyph font coverage.** Rendering depends on the viewer's font stack covering U+2600–26FF; no code-level fallback by design (an embedded font would violate the zero-dependency constraint). Mitigated by `--sigil-glyph-font` and a README disclosure.
- **The suite needs a browser.** `test/browser/theming-resolution.test.js` requires a one-time `npx playwright install chromium` and fails loudly rather than skipping when absent — deliberate, but a fresh clone or CI runner must install it before `npm test` is green.
- **Not published.** The package has never been `npm pack`'d and installed from a clean tree. Now committed as v1.1's PKG-01, and the reason the milestone exists.
- **[v1.1] Zero-dependency vs. a build step — reassessed, largely defused.** The `<sigil-spinner>` web component (WRAP-01) was framed as the first thing in this project that plausibly wants bundling. Three independent research passes concluded a build step is **not required**: `src/` is already browser-safe (zero `node:` imports; every Node import lives in `bin/`). "The source is what runs" holds. What remains a discuss-phase decision is narrower — whether to *also* publish an optional bundled convenience artifact (PKG-06, deferred out of v1.1).
- **[v1.1] Publish is irreversible.** 72-hour conditional unpublish window, 24-hour name lock after full unpublish, versions never reusable. A wrong `repository.url` at publish time forces a version bump to fix. This is why Phase 6 gates the publish behind a five-step rehearsal ladder and why Phase 5 exists at all.
- **[v1.1] Structural tests verify wiring, not appearance.** Both real v1.0 defects passed a fully green suite and were caught by a human looking at rendered output. An element whose tests assert only "registers and reflects attributes" would pass while rendering nothing visible. Phase 7's success criteria require a browser-rendering check, using the Playwright harness from Phase 3 (`test/browser/theming-resolution.test.js`) as the pattern.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260808-lu1 | fix the null options SigilError bug | 2026-08-08 | 35df4ec | [260808-lu1-fix-the-null-options-sigilerror-bug](./quick/260808-lu1-fix-the-null-options-sigilerror-bug/) |

### Roadmap Evolution

- v1.0 shipped as 4 phases. Phase 4 (v1.0 Tech Debt Closeout) was inserted after the milestone audit rather than planned up front — it converted an 11-item audit register into 11 written dispositions before shipping.
- v1.1 planned as 4 phases (5-8), numbering continued rather than reset. Structured around irreversibility rather than feature grouping: everything that changes the artifact lands before `npm publish`.
- **v1.1 has genuine parallelism; v1.0 had none.** v1.0's phases were strictly sequential because every plan touched `src/render/svg.js` and `src/generate.js`. File-conflict analysis across v1.1 found exactly one shared file in the whole milestone — `package.json`, between Phases 6 and 7 — and the overlap there is additive (different keys). Phases 7 and 8 can run in parallel.

## Deferred Items

Deferred at v1.0 close, each with a stated reopen condition (full detail in `MILESTONES.md`):

| Category | Item | Status | Reopen when | Deferred At |
|----------|------|--------|-------------|-------------|
| test-coverage | `E_CLI_STDIN` has no deterministic test | deferred — no known fix | The suite gains pseudo-terminal capability | 2026-08-07 |
| docs | Misleading "unreachable" doc comment on `perpendicularUnit`'s zero-length fallback | deferred — reproduction needed first | A reproduction exists | 2026-08-07 |
| cosmetic | `D-12` cited for two unrelated topics in source comments | deferred — condition not met | Any of `src/errors.js:20`, `src/generate.js:163`, `src/generate.js:238`, `bin/sigil-spinner.js:20` is edited for another reason | 2026-08-07 |

## Known Verification Overrides

Recorded at v1.0 close — closeout type `override_closeout`:

| Phase | Override | Reason |
|-------|----------|--------|
| 02 | `verification_status: stale` accepted without re-running `/gsd-verify-work 2` | `02-VERIFICATION.md` (2026-08-06, `passed`, 33/33, `gaps_remaining: []`) predates its four SUMMARY files, which Phase 4's D-56 backfill touched on 2026-08-07 — adding only `requirements-completed` frontmatter transcribed *from that same verification file*. No code, claim, or evidence changed; the staleness is an mtime artifact of the remediation itself. Two independent sources already carry the conclusion: the verification's own live-executed Requirements Coverage table, and the milestone audit's integration check (run after the backfill), which re-confirmed all six Phase 2 requirements with independent reproductions. |

## Session Continuity

Last session: 2026-08-09T19:58:18.170Z
Stopped at: Completed 08-04-PLAN.md — Phase 8 code-complete; D-118/D-119 cold-session check outstanding
Next: `/gsd-plan-phase 5`
Resume file: None
