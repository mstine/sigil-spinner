# Phase 6: Published Package - Context

**Gathered:** 2026-08-08
**Status:** Ready for planning
**Mode:** `--auto` — every gray area was auto-resolved to the recommended option. No decision below was confirmed by Matt in conversation. The four rated `one-way` become permanent the moment `npm publish` succeeds; planning should surface them at a `checkpoint:decision` before the publish task, not after.

<domain>
## Phase Boundary

Anyone — including a Claude Code session that has never seen this repo — can `npm install @falkensmage/sigil-spinner` from a fresh project and use both surfaces without extra configuration. Four requirements, in a non-negotiable order:

- **PKG-04** — complete, correct publication metadata: MIT + a real `LICENSE` file, `author`, `repository.url` matching `github.com/mstine/sigil-spinner` character-for-character, `publishConfig.access: "public"`
- **PKG-03** — a repeatable pack-and-scratch-install smoke test that resolves `exports`, runs the `bin`, and generates one real sigil from an installed tarball (`npm link` is disqualified — it symlinks the working tree and masks exactly these faults)
- **PKG-01** — the actual publish to the public npm registry
- **PKG-05** — a GitHub Actions release workflow publishing with npm provenance, so the published version carries a verifiable attestation

**Ordering is a requirement, not a preference:** PKG-04 and PKG-03 both complete before PKG-01 executes. PKG-05's live-documentation check happens before the publish too, so `1.0.0` ships attested rather than needing a version bump to gain attestation.

**Not in this phase:** the `<sigil-spinner>` element and its `./element` exports subpath (Phase 7); the Claude Code skill (Phase 8); any change to sigil construction, rendering, or the JSON working's field set (closed in Phase 5).

</domain>

<decisions>
## Implementation Decisions

Six gray areas, all auto-resolved. Decision IDs continue from Phase 5's D-61.

### Version and package identity

- **D-62: The first published version is `1.0.0`.** `package.json` currently says `0.1.0` — a scaffold leftover that was never touched because the package has never been published. Rejected: `1.1.0` (which `.planning/research/PITFALLS.md` uses in its illustrative commands, and which reads as "matches the v1.1 milestone label") — the registry's semver line describes the *public API surface*, not GSD milestone numbering, and the API being published is the one v1.0 stabilized. Rejected: publishing `0.1.0` as-is, which signals pre-release instability for a surface that is byte-pinned by 48 snapshots and 1,482 tests. The sequencing also comes out clean: Phase 7 adds an `./element` subpath, which is additive and therefore `1.1.0`. — **Reversibility:** one-way — a published version number can never be reused, even after an unpublish. Getting this wrong means the first version anyone sees is permanently wrong and the correction is a bump, not an edit.

- **D-63: `name` becomes `@falkensmage/sigil-spinner`; the `bin` key stays `sigil-spinner`.** Success criterion 2 asks for `npx sigil-spinner "..." --planet saturn`, which is the bin *command* name and is independent of the scope. Do not scope the bin key. — **Reversibility:** one-way — the package name is the registry identity; a rename means publishing a second package and deprecating the first.

- **D-64: Every bare `sigil-spinner` module specifier in shipped docs moves to the scoped name in the same commit as `package.json`.** Known site: `README.md`'s library example (`import { generateSigil } from 'sigil-spinner'`). Planning must sweep rather than trusting that list — the README is the npm package page, so a stale specifier there is the first thing a new consumer copy-pastes and the first thing that fails. Relative imports inside `src/`, `bin/`, and `test/` are untouched: they never go through `exports` resolution and must stay relative.

- **D-65: A mechanical guard asserts the README's documented install/import specifier matches `package.json`'s `name`.** Same instrument, same reason as D-55 (exit map keyed from imported constants), D-61 (kamea set/version key parity), and MAINT-01's citation checker: the mistake fails on whoever introduces it rather than surfacing in a consumer's copy-paste. Cheap — a string read and a regex over one file.

### Publication metadata (PKG-04)

- **D-66: `license` becomes `MIT` and a root `LICENSE` file is added carrying the MIT text, `Copyright (c) 2026 Matt Stine`.** The current `ISC` is a scaffold default that contradicts PROJECT.md's stated intent. npm auto-includes a root-level `LICENSE` in the tarball without it being listed in `files`, but only if the file exists — and the smoke test's manifest assertion (D-70) must confirm it actually shipped, not assume it. — **Reversibility:** one-way once published — the license under which a version was distributed cannot be retroactively narrowed for anyone who already installed it.

- **D-67: The `repository` field names the live remote in `git+https` form.** The exact value is `{ "type": "git", "url": "git+https://github.com/mstine/sigil-spinner.git" }`. Verified against the live remote (`git@github.com:mstine/sigil-spinner.git`). STACK.md's finding that this value is validated character-for-character is load-bearing for provenance: a mismatch between `repository.url` and the workflow's own repository breaks the attestation, and the fix is a version bump. — **Reversibility:** one-way in effect — a wrong value that reaches the registry forces a bump to correct.

- **D-68: `author` is `"Matt Stine (https://github.com/mstine)"` — name and URL, no email address.** The npm author field is scraped; the GitHub profile is already the public identity and reaches the same person. Planning should treat this as the one metadata field Matt may want to override before the publish task runs — it is trivially editable up to that moment and permanent after. — **Reversibility:** one-way once published.

- **D-69: The metadata set is the required four plus `publishConfig`, `homepage`, and `bugs`.** Concretely: `license`, `author`, `repository`, `publishConfig: { "access": "public" }`, `homepage` (the repo URL), `bugs` (the issues URL). `description`, `keywords`, `engines`, `files`, `exports`, and `type` stay as they are — Phase 5 already made them correct. `publishConfig.access` is the belt; `--access public` on the publish command is the suspenders (Pitfall 1 records tooling that has honored the flag while ignoring `publishConfig` on a package's *first* publish, and this is a first publish of a scoped package, which npm defaults to private).

### Smoke test (PKG-03)

- **D-70: The smoke test lives at `test/pack-install.test.js` and follows the existing `test/e2e/` pattern** — a vitest file shelling out with `execFileSync`, since that is how the three tracer tests already drive `bin/sigil-spinner.js`. It does the full ladder rungs 1 and 2: `npm pack --dry-run --json` to assert the tarball manifest against a declared expected file set (including `LICENSE`), then a real `npm pack` into a scratch directory under `os.tmpdir()`, `npm install <abs>.tgz --no-audit --no-fund` into an empty project, and three assertions against the *installed* copy — `import { generateSigil }` resolves through `exports`, the `bin` runs end to end, and one generated sigil is byte-identical to output produced from the dev tree. Rejected: `scripts/smoke-install.mjs` invoked by an npm script (works, but re-implements assertion and reporting machinery the repo already has); rejected: a CI-only job (unrunnable locally, so the pre-publish rehearsal could not be exercised before it matters).

- **D-71: It is excluded from the default `npm test` include and exposed as a named script.** That script is `npm run test:pack`. It is the only test whose fixture is a build artifact of the repo itself; making every inner-loop run pay for a pack plus an install is a real cost for a check whose failures only matter at publish time. The rot risk this opens is closed by D-75 — the release workflow runs it as a hard gate, which is exactly where a stale smoke test would otherwise let a broken tarball through.

- **D-72: The entry points under test are declared as data, not procedure.** A table — `[{ subpath: '.', namedExports: ['generateSigil', 'SigilError', 'E_EMPTY_SEQUENCE', …] }]` plus the `bin` entry — that the test iterates. This is what makes success criterion 5 true: Phase 7 adds one row for `./element` instead of editing control flow, and Pitfall 4's `ERR_PACKAGE_PATH_NOT_EXPORTED` class of failure gets caught by construction rather than by someone remembering to check.

- **D-73: The scratch directory is created fresh per run and removed on success, kept on failure.** A kept tree is the only way to diagnose an `exports` resolution failure after the fact; a reused tree would let a stale `node_modules` mask exactly the misconfiguration the test exists to catch.

### Publish execution path (PKG-01 + PKG-05)

- **D-74: The GitHub Actions release workflow is built and exercised before any real publish, and the first real registry write is performed by that workflow.** So `1.0.0` is attested from its first byte on the registry. Rejected: publish manually now and let CI attest from `1.0.1` onward — the roadmap forbids it in as many words ("take whichever path attests version 1.0.0 rather than leaving it un-attested"), and it burns a version number to buy nothing. Rejected: deferring the real publish out of this phase, which is the phase's goal.
  - **Credential path:** assume the roadmap's stated human gate — an **npm automation token** stored as a GitHub Actions secret (`NPM_TOKEN`). Provenance works with a token, provided the workflow grants `id-token: write` and runs in a public repo; the token and the attestation are separate mechanisms.
  - **The live-docs check PKG-05 mandates is narrow and must still happen:** whether npm's Trusted Publishing (OIDC, no stored token) can be configured for a package that *does not yet exist* on the registry. If it can, take it and drop the secret. If configuring a trusted publisher requires the package to already exist, the token path stands and OIDC becomes a post-1.0.0 upgrade. Research must resolve this against live npm documentation, not recall.
  - **Reversibility:** one-way — this is the irreversible step the entire phase ordering exists to protect. 72-hour conditional unpublish window, 24-hour name lock after a full unpublish, versions never reusable.

- **D-75: The full rehearsal ladder is the acceptance criterion, executed in order.** `npm pack --dry-run` → tarball scratch-install (D-70) → `npm publish --dry-run` (logged in, real registry, catches scope-access and name conflicts that neither pack rung can see) → `npm publish --tag next --provenance --access public` from the workflow → verify live (`npm view`, a real install from a clean directory via `@next`, and confirmation that the provenance attestation renders on the npm page) → promote with `npm dist-tag add @falkensmage/sigil-spinner@1.0.0 latest`. A bare `npm install @falkensmage/sigil-spinner` must not resolve to `1.0.0` until the promote step, which is what buys a live-infrastructure review window on an irreversible artifact.

### Release workflow (PKG-05)

- **D-76: Trigger is `workflow_dispatch` only, with a `dist-tag` input (`next` | `latest`) and a separate `promote` mode.** Rejected: a `push: tags: v*` trigger — it makes the one irreversible command in the toolchain a side effect of a git push, and the ladder's step 4/5 split requires human-controlled timing between the `next` publish and the promotion. A tag trigger is a reasonable later addition once the path is proven; it is not how a first publish should be driven. Keeping promotion in the same workflow keeps the npm credential in exactly one place.

- **D-77: The workflow gates the publish behind the full local quality suite, in a fixed order.** That order is `npm ci` → `npm run lint` → `npm run typecheck` → `npx playwright install --with-deps chromium` → `npm test` → `npm run test:pack` → publish. The playwright install is not optional — `test/browser/theming-resolution.test.js` fails loudly rather than skipping when chromium is absent (a deliberate v1.0 choice, recorded in STATE.md § Blockers/Concerns), so a runner without it fails the suite for the wrong reason. `test:pack` runs last before publish because it is the rung that proves the artifact, not the source.

### README npm pass

- **D-78: The README gets one pass in this phase, scoped to what the npm package page needs.** That means the scoped install and import specifier (D-64), and an unmissable ESM-only disclosure in the opening section. Pitfall 5's point is not that ESM-only is wrong — v1.0 chose it deliberately and correctly — but that shipping the choice undocumented hands a `ERR_REQUIRE_ESM` to a first-time CommonJS consumer with no explanation. The audience widens at publish; the README is what they read. No other README restructuring in this phase.

### Claude's Discretion

Everything not locked above. Specifically:

- **Plan decomposition and commit granularity.** The requirement ordering (PKG-04 + PKG-03 → PKG-01 → PKG-05's live check before the publish) is fixed; how it splits across plans is a planning call.
- **The smoke test's byte-identity fixture** — whether the installed-copy output is compared against a freshly generated dev-tree result in-process, or against a committed snapshot. Constraint: it must catch a real `files`/`exports` fault, not merely prove the tarball unpacks.
- **The expected-tarball-manifest assertion's strictness** — exact set versus required-subset. Consider that Phase 7 will add files.
- **Workflow hardening details** — action pinning, `permissions` block minimization beyond the required `id-token: write` and `contents: read`, concurrency group, Node version matrix.
- **Whether `npm run test:pack` also appears in a PR-triggered CI workflow.** No CI exists today; adding one is not a phase requirement, and the release-workflow gate (D-77) already covers the moment that matters.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and requirements
- `.planning/ROADMAP.md` § Phase 6: Published Package — goal, five success criteria, the non-negotiable intra-phase ordering, the rehearsal ladder, the `npm link` disqualification, and the npm-automation-token human gate
- `.planning/ROADMAP.md` § Milestone-Wide Constraints — zero runtime dependencies, no build step, byte-determinism, light DOM. No phase may violate these
- `.planning/REQUIREMENTS.md` — PKG-01, PKG-03, PKG-04, PKG-05 verbatim; § Out of Scope names the refusals (any runtime dependency, including any publish-helper package); § Human-Blocking Steps
- `.planning/PROJECT.md` § Current State and § Key Decisions — what the published surface actually is, and the 20 dispositioned v1.0 decisions the package contract rests on

### The publish itself — load-bearing research
- `.planning/research/PITFALLS.md` § Pitfall 1 (lines 13-32) — scoped packages default to **private**; tooling has been observed to honor `--access public` while ignoring `publishConfig.access` on a first publish. Belt *and* suspenders, both required
- `.planning/research/PITFALLS.md` § Pitfall 2 (lines 34-53) — the five-rung rehearsal ladder verbatim, and the unpublish-window mechanics (72h conditional, 24h name lock, versions never reusable) that make the ordering non-negotiable
- `.planning/research/PITFALLS.md` § Pitfall 3 (lines 55-71) — the current license/metadata drift, confirmed against this repo rather than hypothesized: `ISC` in `package.json`, no `LICENSE` file, empty `author`, no `repository`
- `.planning/research/PITFALLS.md` § Pitfall 4 (lines 73-91) — why `exports` faults are invisible to all 1,482 existing tests (they run inside the package boundary, where `exports` does not apply) and why the tarball install is the only thing that catches them
- `.planning/research/PITFALLS.md` § Pitfall 5 (lines 93-106) — ESM-only is correct but must be documented; D-78's scope
- `.planning/research/SUMMARY.md` § Corrected Premise — GitHub and provenance (lines 37-45) — provenance is **not blocked**; the remote exists at `github.com/mstine/sigil-spinner`; `repository.url` is validated character-for-character
- `.planning/research/STACK.md` — ESM-only packaging rationale and the dual-package hazard that keeps CJS out

### Contract surfaces this phase touches
- `package.json` — the file PKG-04 edits; also the one file this milestone shares with Phase 7, additively (different keys)
- `README.md` — becomes the npm package page at publish; carries the bare `sigil-spinner` specifier D-64 must sweep
- `src/index.js:1-25` — the entire public surface, with the header comment stating the rule (`bin/` imports only from here, never from an internal module). D-72's export table is derived from this file
- `.planning/phases/05-publish-ready-source/05-CONTEXT.md` — Phase 5's locked decisions (D-57–D-61) and its deferred `PACKAGE_VERSION` idea, which this phase inherits the decision on
- `.planning/STATE.md` § Blockers/Concerns — why the suite needs a browser (D-77's playwright step) and the carried v1.1 irreversibility note

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`test/e2e/phase2-tracer.test.js:1-20`** — the established pattern for driving the real CLI from a test: `execFileSync` against an absolute `CLI_PATH` resolved via `fileURLToPath(import.meta.url)`. D-70's smoke test is the same shape with the path pointed at the scratch install's `node_modules/.bin` instead of the repo's `bin/`.
- **`test/citations.test.js`** — the mechanical drift-guard precedent from MAINT-01: a test that reads a shipped artifact and fails when a documented claim stops resolving. D-65's README-specifier guard is the same instrument, one string wide.
- **`vitest.config.js`** — `include: ['test/**/*.test.js']`, one flat include. D-71's exclusion needs an explicit `exclude` entry (or a second vitest project) plus a `test:pack` script; there is no existing exclusion to copy.
- **`package.json` scripts** — `test:browser` already establishes the "named subset script" convention; `test:pack` follows it, with the difference that `test:pack` is *not* in the default run.

### Established Patterns

- **`dependencies: {}` is load-bearing and milestone-wide.** No publish-helper package. `np`, `release-it`, `semantic-release`, `changesets` are all refusals by the same rule that refused `commander` and `d3-shape` — the workflow calls `npm` directly.
- **No `node:` imports in `src/`, ever.** All Node imports live in `bin/` and in `test/`. The smoke test is a test file, so `node:fs`/`node:os`/`node:child_process` are fine there; nothing in this phase touches `src/`.
- **The suite fails loudly rather than skipping** when a prerequisite is missing (the chromium case). Any environment assumption the smoke test makes should follow that convention rather than silently skipping.
- **Guards are keyed, not transcribed** — D-55 keys the CLI exit map from imported constants, D-61 asserts key parity between two maps. D-65 and D-72 continue it: derive the assertion from the source of truth rather than restating it.

### Integration Points

- **`package.json` is the whole of PKG-04's surface** and this phase's only production-file edit. Current gaps, read directly: `name: "sigil-spinner"` (unscoped), `version: "0.1.0"`, `license: "ISC"`, `author: ""`, no `repository`, no `publishConfig`, no `homepage`, no `bugs`. `files`, `exports`, `bin`, `type`, and `engines` are already correct for the current surface.
- **No `.github/` directory exists.** The release workflow is net-new — `.github/workflows/` is created by this phase, not modified.
- **No `scripts/` directory exists.** D-70 puts the smoke test in `test/` instead, which is also where the harness already is.
- **`git remote origin` is `git@github.com:mstine/sigil-spinner.git`** — confirmed live, and the source of D-67's `repository.url`. Note the SSH form of the remote versus the `git+https://` form in `package.json`: they describe the same repo, and `git+https` is what npm and the provenance check expect.
- **README is shipped** (`files: ["src", "bin", "README.md"]`), so every specifier in it reaches consumers.

</code_context>

<specifics>
## Specific Ideas

- The phase's shape is a ladder whose rungs get progressively less recoverable — `--dry-run` costs nothing, a scratch install costs a temp directory, `publish --tag next` costs a version number, and the promote costs the default install path for everyone. Planning should keep that ordering visible in the plan structure rather than flattening it into "do the publish."
- The smoke test's real value is that it exercises the one code path 1,482 existing tests structurally cannot reach: resolution from *outside* the package boundary. Framing it as "does the tarball work" undersells it — it is the only test in the suite with a different vantage point.
- Continuity with the v1.0 verification lesson: both real v1.0 defects passed a fully green suite and were caught by a human looking at output. The analog here is the `publish --tag next` window — a live `npm view` and a real install from a clean directory before anyone gets it by default.

</specifics>

<deferred>
## Deferred Ideas

- **`PACKAGE_VERSION` as a second in-source constant, plus a CI assertion that it matches `package.json`'s `version`** — carried forward from Phase 5's deferred list, which named Phase 6 as the place to revisit it. **Decision: still deferred.** Adding the emitting package's version to the JSON working is a second contract field on a 16-field working that was just locked, and Phase 6's success criteria do not ask for it. Reopen if a consumer ever needs to identify which package version produced a captured working.
- **A `push: tags: v*` release trigger** — deliberately not this phase (D-76). Reasonable once the manual-dispatch path has published successfully at least once.
- **A PR-triggered CI workflow** running lint/typecheck/test on every push. Not a phase requirement; the repo has functioned without CI through four phases. The release workflow is the only one PKG-05 asks for.
- **Dual ESM+CJS publishing** — a standing refusal, not a deferral. STACK.md chose ESM-only to avoid the dual-package hazard; D-78 documents the choice instead of reversing it.
- **The `./element` exports subpath and its `files` coverage** — Phase 7 owns it. D-72 exists so that Phase 7 adds a table row rather than rewriting the smoke test.
- **npm README badges** (version, license, provenance) — cosmetic, and the README pass in D-78 is deliberately scoped to what a consumer needs to not fail.
- **The three v1.0 items deferred with written reopen conditions** (`E_CLI_STDIN` coverage, the `perpendicularUnit` doc comment, the `D-12` ID collision) remain deferred. The `D-12` condition names `bin/sigil-spinner.js:20` among its triggers — Phase 6 is not expected to edit `bin/` at all, so the condition should stay unmet, but planning should confirm rather than assume.

</deferred>

---

*Phase: 6-Published Package*
*Context gathered: 2026-08-08*
