# Milestones

## v1.1 Distribution (Shipped: 2026-08-09)

**Delivered:** The tool left the repo. `@falkensmage/sigil-spinner` is on the public npm registry with a verifiable provenance attestation, wrapped as a `<sigil-spinner>` custom element that a page's own CSS fully controls, and discoverable to any Claude Code session in any directory through a personal skill carrying Matt's own planet correspondences. Still zero runtime dependencies, still no build step.

**Phases completed:** 4 phases, 16 plans, 35 tasks
**Timeline:** 2026-08-07 → 2026-08-09 (3 days, 121 commits)
**Code delta since v1.0:** 37 files changed, +4,240 / −100; 16 new files
**Published:** `1.1.0`, MIT, `latest` and `next` both at 1.1.0
**Closeout type:** `verified_closeout`

**Key accomplishments:**

- **Ordered by irreversibility, and it paid.** `npm publish` cannot be taken back, so everything that changes what the artifact *is* landed before the publish. Phase 5 caught four artifact-level corrections while they were still free edits — `kameaVersion` as the working's 16th field from a frozen in-source constant, `--title` at full CLI/library parity, automatic `role="img"`/`aria-labelledby` wiring, and 33 stale source citations repaired behind a mechanical checker so the rot cannot recur silently. Nothing in Phases 6-8 needed a version bump to fix.
- **Published from CI, attested from the first byte.** A `workflow_dispatch` release workflow with six quality gates in a fixed order, SHA-pinned first-party actions, and step-scoped credentials published `1.0.0` and then `1.1.0` with Sigstore provenance. The rehearsal ladder — `pack --dry-run` → tarball scratch-install → `publish --dry-run` → `--tag next` → promote — was treated as an acceptance criterion, not a suggestion. `npm link` was explicitly disqualified for symlinking the working tree and masking exactly the `files`/`exports` faults the smoke test exists to catch.
- **An element that CSS can actually reach.** Light DOM, no shadow root, no build step, no runtime dependencies — because custom properties pierce shadow boundaries but semantic class selectors do not, and half the theming surface is classes. Seventeen real-Chromium tests cover rendering, both theming mechanisms, all three custom-element upgrade orderings, the error round trip, and multi-instance independence. The decisive check was still a human looking at a rendered page.
- **A skill that fires without being named.** A cold Claude Code session, in a scratch directory, from ordinary phrasing — routed to the skill, produced a correct sigil, and chose a planet with the reasoning stated. Matt's seven correspondences were ratified in conversation with one amendment (Saturn holds stability and restriction as one working, not collapsed to either pole). A bidirectional drift guard binds the skill's documented flags to the CLI's real surface, mutation-proven in both directions.
- **Two verification gates were closed by fixing, not by accepting.** Phase 7's "re-renders" test could not distinguish a real re-render from a same-value skip; rather than carry the residual, the assertion was replaced with a `MutationObserver` signal and *proven to discriminate* by injecting the exact short-circuit it guards against. Phase 8's cold-session claim was the one thing no test, agent, or subagent could honestly certify — every executor and the verifier correctly declined to self-certify it, and it was closed by an actual observation instead.
- **A security pass that was late, and earned its cost anyway.** The milestone shipped four phases with `security_enforcement: true` and zero SECURITY.md. The gap was caught by the milestone audit and closed retroactively for Phase 6 — which found a dispatch input substituted into a `run:` shell line in the only job holding the publish credential, and a promote step that would silently demote `latest` to a stale version and exit 0 looking green. Both fixed, both behaviorally proven, both live at the time.

**Verification at close:**

| Check | Result |
|---|---|
| Full suite | 1,532/1,532 passed, 25 files |
| `npm run test:pack` | 2/2 passed |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 |
| Runtime dependencies | none declared |
| v1.1 requirements | 14/14 satisfied |
| Phase verifications | 4/4 `passed`, 0 overrides, 0 behavior-unverified |
| Cross-phase integration | 5/6 seams clean (sixth was the deliberate publish boundary) |
| Security (Phase 6) | 20 threats — 17 closed, 3 accepted, 0 open |
| Published artifact | `1.1.0` attested, zero transitive deps, `./element` resolves from a clean install |

**Known verification overrides: 0.** All four phases carry `phase_complete: true` and `verification_status: passed`.

One item was flagged by the pre-close artifact audit and **deliberately not acknowledged as deferred**: it binned Phase 08's UAT into `uat_gaps` while simultaneously reporting `status: passed` and `open_scenario_count: 0`. The file records total 1 / passed 1 / pending 0 and its own Gaps section reads "None." That is a tooling false positive, not an open item, and recording a completed human-run UAT as deferred would have misrepresented it.

**Known gaps:** None. All 14 v1.1 requirements satisfied.

**Deferred (carried into v1.2+ with stated conditions):**

| Item | Reason | Reopen when |
|---|---|---|
| ~~Security passes for Phases 5, 7, 8~~ — **completed 2026-08-09** | All four v1.1 phases now audited at `threats_open: 0`. Worth doing: Phase 8's pass found a proven command-injection path in the skill's primary invocation example, fixed by promoting the stdin-sentinel form to the default | Closed. Residuals recorded in each phase's SECURITY.md |
| Seventeen open review items across Phases 5-8 | All low-severity, all confirmed still open against the tree at close, none contradicting a requirement | Catalogued in `milestones/v1.1-MILESTONE-AUDIT.md`; address opportunistically |
| `NPM_TOKEN` scope and expiration unrecorded | Not observable from the repo; needs a browser session on npmjs.com. The planned "narrow to a single package" follow-up was never done | Tracked at [issue #1](https://github.com/mstine/sigil-spinner/issues/1), bounded by npm's ~January 2027 removal of direct-publish for 2FA-bypassing credentials |
| Trusted Publishing (OIDC) migration | Could not bootstrap a first publish; that constraint is now gone | Same issue #1 |
| The skill names the element but does not teach it | A documented element surface in the skill needs its own drift guard, and that was not built | When element usage from a cold session becomes a real want |

**Carried-forward known state (documented, not defects):**

- **The publish is two rungs, and the second is not optional.** npm seeds `latest` only on a package's *first* publish. Every version after that, published with `--tag next`, leaves `latest` behind until a promote runs — so "published" and "what a bare `npm install` gets" are different facts. This was predicted before the 1.1.0 release and confirmed exactly: `next: 1.1.0, latest: 1.0.0` until the promote.
- **`examples/element.html` ships in the repo, not the tarball.** The human-verification instrument is real and was used; a consumer installing from npm does not get it.
- **`title` remains library-and-CLI, element-side named `show-title`.** `title` is a global HTML attribute that renders a browser tooltip, so the element needed a different name — locked before publish because changing it after breaks a public contract.
- **The suite still needs a browser.** The Playwright tests fail loudly rather than skipping when Chromium is absent; a fresh clone must run `npx playwright install chromium` first. The release workflow installs it as one of its six gates.

**Archived:**

- `.planning/milestones/v1.1-ROADMAP.md`
- `.planning/milestones/v1.1-REQUIREMENTS.md`
- `.planning/milestones/v1.1-MILESTONE-AUDIT.md`
- `.planning/milestones/v1.1-phases/` (all four phase directories, including `06-SECURITY.md`)

---

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
