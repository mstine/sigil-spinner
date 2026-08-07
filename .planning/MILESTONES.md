# Milestones

## v1.0 MVP (Shipped: 2026-08-07)

**Delivered:** A zero-dependency Node CLI and ESM library that turns any intention statement and any of the seven classical planets into a correct, traditionally-constructed sigil — deterministic, self-contained inline SVG plus a complete JSON working.

**Phases completed:** 4 phases, 14 plans, 27 tasks
**Timeline:** 2026-08-04 → 2026-08-07 (4 days, 138 commits)
**Codebase:** 6,271 LOC JavaScript across `src/`, `bin/`, `test/` — 15 source files, zero runtime dependencies
**Closeout type:** `override_closeout` (see Known Verification Overrides below)

**Key accomplishments:**

- **Canonical data locked first.** All seven `agrippa` kamea grids (Saturn 3×3 through Moon 9×9) hard-coded as literal arrays with honest, documented provenance — magic-sum verified on all seven, independently cross-checked on Saturn and Jupiter — plus a Pythagorean encoder derived from the 1–9 cycling formula, making it structurally immune to Chaldean-table contamination.
- **The whole spine, then widened.** Phase 1 drove one statement through every layer to a rendered Saturn sigil (normalize → encode → kamea lookup → PathModel → layered SVG + JSON working, via both library and CLI). Phases 2–3 widened that same spine rather than layering horizontally.
- **Every planet, every statement.** All seven planets byte-pinned at kamea orders 3 through 9; consecutive-repeat loop markers as cell-anchored closed curls; degenerate inputs (all-vowel, single-letter) and the full Latin stroke/bar class (84-entry transliteration table) handled by documented, deterministic rules — with the deliberately-excluded classes named in the README rather than left silent.
- **Embeddable as a design element.** Hand-rolled centripetal Catmull-Rom → cubic Bézier curve rendering, an always-emitted CSS-revealable kamea grid layer, an opt-in planetary glyph layer, 15 `--sigil-*` custom properties with inline defaults, and caller-supplied `idPrefix` namespacing verified across 26 sigils co-embedded on one page with zero id collisions and zero `style=` attributes.
- **Determinism as a tested contract, not a claim.** Byte-equality suites and 48 committed file snapshots across all seven planets and every option combination; the CLI is a genuinely thin wrapper, with all validation owned by the library so programmatic callers get identical guarantees and error codes.
- **v1.0 tech debt closed before shipping, not after.** All eleven items from the milestone audit dispositioned in Phase 4 — six fixed (`working.render` round-trip, CLI extra-positional diagnostic, README's 15-field working table, validation ordering, public `E_*` constants, Phase 2 SUMMARY frontmatter backfill), two closed as verified non-issues with live evidence, three deferred with a written reopen condition. Zero silent drops.

**Verification at close:**

| Check | Result |
|---|---|
| Full suite | 1453/1453 passed, 18 files |
| `npm run typecheck` (`tsc --checkJs`) | exit 0 |
| `npm run lint` | exit 0 |
| Runtime dependencies | `{}` |
| v1 requirements | 21/21 satisfied |
| Cross-phase integration | 6/6 seams wired, 5/5 E2E flows |
| Security | 3/3 phases, ASVS L1, 46 threats closed, 0 open |

**Known verification overrides: 1**

- **Phase 2 verification projects `stale`.** `02-VERIFICATION.md` (2026-08-06 16:43, `passed`, 33/33 must-haves, `gaps_remaining: []`) predates its four SUMMARY files, which were touched 2026-08-07 09:30 by Phase 4's D-56 backfill. That backfill added only the `requirements-completed` frontmatter key, transcribed *from that same verification file* — no code, claim, or evidence changed. The staleness is an mtime artifact of the remediation itself. Accepted rather than re-verified because two independent sources already carry the conclusion: `02-VERIFICATION.md`'s Requirements Coverage table with live-executed evidence, and the milestone audit's own integration check (2026-08-07, after the backfill), which re-confirmed all six Phase 2 requirements end-to-end with independent reproductions.

**Known gaps:** None. All 21 v1 requirements satisfied.

**Deferred (carried into v1.1+ with stated reopen conditions):**

| Item | Reason | Reopen when |
|---|---|---|
| `E_CLI_STDIN` has no deterministic test | The `EAGAIN`-on-TTY trigger is not reproducible in a non-TTY subprocess harness — a structural property of the harness, disclosed in `02-04-SUMMARY.md`, not a silent hole | The suite gains pseudo-terminal capability |
| Misleading "unreachable" doc comment on `perpendicularUnit`'s zero-length fallback | Reachability was reasoned by code-reading, never reproduced; documentation accuracy only — the fallback returns a deterministic, sane value either way | A reproduction exists |
| `D-12` cited for two unrelated topics in source comments | Cosmetic, comment text only; Phase 4's own condition ("if touching those lines for another reason") was not met | Any of `src/errors.js:20`, `src/generate.js:163`, `src/generate.js:238`, `bin/sigil-spinner.js:20` is edited for another reason |

**Carried-forward known state (documented, not defects):**

- **Curve overshoot on one input.** `sun` + "I WILL SUCCEED" in curve mode puts a Bézier control point at `y = -0.916`, just past the viewBox top edge — real centripetal Catmull-Rom behavior on a ~180° reversal. Documented in the README and deliberately not clamped, since clamping is a curve-shape design decision. Visually confirmed acceptable at UAT.
- **Glyph font coverage.** Rendering depends on the viewer's font stack covering U+2600–26FF; no code-level fallback by design, since an embedded font would violate the zero-dependency constraint. Mitigated by the `--sigil-glyph-font` override and a README disclosure.
- **Browser-dependent test.** `test/browser/theming-resolution.test.js` requires a one-time `npx playwright install chromium` and fails loudly rather than skipping when absent — deliberate, but a fresh clone or CI runner must install it before `npm test` is green.
- **`title` is library-only.** `options.title` works programmatically; there is no `--title` CLI flag. Deliberate, recorded in the Phase 3 summaries.
- **No UI-REVIEW.md for Phase 3.** The `verify:post` `ui-review` hook is gated on `workflow.ui_review`, absent from `config.json`, so it never fired. Visual claims were covered by hand at UAT instead — including the pass that surfaced and closed G-03-1.

**Archived:**

- `.planning/milestones/v1.0-ROADMAP.md`
- `.planning/milestones/v1.0-REQUIREMENTS.md`
- `.planning/milestones/v1.0-MILESTONE-AUDIT.md`
- `.planning/milestones/v1.0-phases/` (all four phase directories)

---
