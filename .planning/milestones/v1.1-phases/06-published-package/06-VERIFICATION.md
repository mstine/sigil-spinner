---
phase: 06-published-package
verified: 2026-08-09T11:05:00Z
status: passed
score: 5/5 ROADMAP success criteria verified; 32/32 plan-level must_haves.truths verified or accepted as documented historical evidence
behavior_unverified: 0
overrides_applied: 0
---

# Phase 6: Published Package Verification Report

**Phase Goal:** Anyone — including a Claude Code session that has never seen this repo — can install the package from npm and use both surfaces without extra configuration.
**Verified:** 2026-08-09
**Status:** passed
**Re-verification:** No — initial verification

## Method

This phase's deliverable is a live, published artifact, not just code — so verification ran
against the real npm registry and the real GitHub repository, from a scratch directory this
verifier created and destroyed, in addition to reading every file the four plans touched. No
registry-mutating command was run (`npm view`, `npm audit signatures`, `npm install`, `npm
pack` against the live tarball, `gh` read commands, and one local `npm run test:pack` /
`npx vitest run` invocation only). One fail-first behavioral probe was run against the local
working tree to close a cleanup/preservation invariant that presence-checking alone cannot
prove (see Truth 5b below); the source was restored immediately and `git status --porcelain`
confirmed clean afterward.

## Goal Achievement

### Observable Truths — ROADMAP § Phase 6 Success Criteria (the real bar)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `npm install @falkensmage/sigil-spinner` into a fresh, empty project succeeds; `node_modules` has zero transitive runtime dependencies | ✓ VERIFIED | Live: fresh scratch dir, `npm install @falkensmage/sigil-spinner` (bare, no tag) → exit 0; `node_modules` contains exactly `@falkensmage/sigil-spinner`; `npm ls --all --json` shows one dependency, no nesting; `npm view ...@1.0.0 dependencies` empty |
| 2 | `import { generateSigil }` resolves and `npx sigil-spinner "..." --planet saturn` writes a real sigil to stdout, no extra configuration | ✓ VERIFIED | Live, same install: `.mjs` probe imports `generateSigil`, returns `{ svg (starts `<svg`), working (16 keys) }`; `npx sigil-spinner "I WILL SUCCEED" --planet saturn` exits 0 and writes a well-formed `<svg>` document |
| 3 | npm page shows MIT + matching `LICENSE` in tarball, an author, a repository link resolving to `github.com/mstine/sigil-spinner`, public access | ✓ VERIFIED | Registry metadata independently re-checked by this verifier: `npm view` → license `MIT`, author `Matt Stine (https://github.com/mstine)`, `repository.url` → `git+https://github.com/mstine/sigil-spinner.git`; `gh repo view` → `visibility: PUBLIC`; downloaded the real published tarball and confirmed `LICENSE` present with matching MIT text/copyright line. Visual npm-page confirmation was closed by Matt in 06-03 (Source Commit `c360ba4`, screenshot transcribed into `06-RELEASE-LOG.md`) — per verification brief, that human-check is treated as closed and was not reopened |
| 4 | A published version carries a verifiable npm provenance attestation from a GitHub Actions release workflow | ✓ VERIFIED | Live: `npm audit signatures` (fresh scratch install) → "1 package has a verified attestation"; packument `dist.attestations.provenance.predicateType` = `https://slsa.dev/provenance/v1`; packument `gitHead` = `c360ba4855e23dd06a27674cd8c31389b6323eb2`, matching the commit Matt confirmed on the npm provenance panel; `gh run list --workflow=release.yml` shows exactly one run (`31321177328`, `workflow_dispatch`, `success`) |
| 5 | The smoke test is repeatable — a later phase can add an `exports` subpath by adding a data-table row, not rewriting control flow | ✓ VERIFIED | Read `test/pack-install.test.js`: `ENTRY_POINTS` is a literal array of `{subpath, namedExports}` objects consumed by a single `for` loop that both builds the `.mjs` probe and asserts on it; a code comment immediately after the `'.'` row states "Phase 7 adds a row here for the `./element` subpath." Ran `npm run test:pack` locally — passes cleanly (1 file, 2 tests), proving the check is a live, non-destructive, re-runnable gate (`mkdtempSync` scratch dir, cleaned up on success), not a one-time manual check |

### Plan-Level `must_haves.truths` — 06-01 (PKG-04)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `package.json` carries name/version/license/author/repository/homepage/bugs/publishConfig.access complete and correct | ✓ VERIFIED | Read `package.json` directly: all fields present, byte-match D-62/D-63/D-66/D-67/D-68/D-69 exactly |
| 2 | Root `LICENSE` carries MIT text, `Copyright (c) 2026 Matt Stine`, agrees with `package.json`'s `license` | ✓ VERIFIED | Read `LICENSE` directly — standard MIT text, correct copyright line |
| 3 | `repository.url` byte-exact, case-matched against the live git remote | ✓ VERIFIED | `package.json repository.url` = `git+https://github.com/mstine/sigil-spinner.git`; matches `gh repo view` URL and the registry's own `repository.url` |
| 4 | No metadata field this plan writes is empty/null/absent | ✓ VERIFIED | Read `package.json` — every field (name, version, license, author, homepage, repository.url, bugs.url, publishConfig.access) is a non-empty string |
| 5 | README documents scoped install/import specifier, guarded mechanically against drift | ✓ VERIFIED | Read `README.md` (`npm install @falkensmage/sigil-spinner`, `import { generateSigil } from '@falkensmage/sigil-spinner'`); ran `npx vitest run test/package-identity.test.js` — 2/2 pass |
| 6 | README discloses ESM-only in its opening section | ✓ VERIFIED | Read `README.md` lines 9-13 — explicit `ERR_REQUIRE_ESM` disclosure before Installation |
| 7 | `bin` command name stays unscoped `sigil-spinner` | ✓ VERIFIED | `package.json bin` = `{"sigil-spinner": "./bin/sigil-spinner.js"}`; registry packument confirms same |

### Plan-Level `must_haves.truths` — 06-02 (PKG-03, PKG-05 build half)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Tarball installs into fresh scratch project, zero transitive deps | ✓ VERIFIED | Live install (this verifier, above) + local `npm run test:pack` pass |
| 2 | `.mjs` probe resolves `generateSigil` from scoped specifier through `exports`, returns `svg`+`working` | ✓ VERIFIED | Live install (this verifier) + code read of `test/pack-install.test.js` assertion 2 |
| 3 | Installed `bin` byte-identical to dev-tree CLI output | ✓ VERIFIED | Automated assertion 3 in `test/pack-install.test.js` (installed vs. dev-tree `execFileSync` comparison) passes on every `npm run test:pack` run, confirmed live |
| 4 | `npm pack --dry-run` manifest contains required files, nothing outside the allowlist | ✓ VERIFIED | Downloaded the real published tarball — 18 files, exactly matching `EXPECTED_TARBALL_FILES` + `src/`/`bin/` prefixes, no `.planning/` or scratch content |
| 5 | `npm run test:pack` re-runs the full check, exits 0, excluded from default `npm test` | ✓ VERIFIED | Ran both: `npm run test:pack` (2/2 pass), `npm test` (1498/1498 pass, 21 files) with `grep -c 'pack-install'` on its output returning `0` |
| 6 | Entry points declared as a data table, not procedure | ✓ VERIFIED | Code read — see ROADMAP criterion 5 above |
| 7 | Concurrent `test:pack` runs cannot interfere (`mkdtempSync` + `--pack-destination`) | ✓ VERIFIED | Code read confirms both calls present (`grep -c` = 3 hits); `mkdtemp`'s documented per-call-unique-directory guarantee makes two concurrent invocations structurally non-colliding by construction |
| 8 | Scratch dir created fresh, removed on success, preserved on failure with path in the thrown error | ✓ VERIFIED (behavioral) | This verifier ran a fail-first probe: temporarily renamed `generateSigil`'s export, ran `npx vitest run --config vitest.pack.config.js`, confirmed the test failed with a thrown error message containing the absolute scratch path (`/var/folders/.../sigil-spinner-pack-wMVx1s`), confirmed the directory existed on disk at that path, then restored the source and re-ran to confirm cleanup-on-success (directory removed, `npm run test:pack` green again). `git status --porcelain` clean afterward |
| 9 | `workflow_dispatch` inputs are `type: choice` with declared defaults, no empty-string path | ✓ VERIFIED | Read `.github/workflows/release.yml` — `mode` and `dist_tag` both `type: choice`, both `default:` set |
| 10 | Publish step preceded by the six D-77 gates in exact order | ✓ VERIFIED | Read `.github/workflows/release.yml` — `npm ci` → lint → typecheck → chromium install → `npm test` → `npm run test:pack` → Publish, all `if: inputs.mode == 'publish'` |
| 11 | `release.yml` triggers on `workflow_dispatch` only | ✓ VERIFIED | Read file — only trigger under `on:` |
| 12 | `permissions: contents: read, id-token: write`; `NPM_TOKEN` referenced only in publish/promote `env` blocks | ✓ VERIFIED | Read file; `grep -c 'NPM_TOKEN'` = 2 (Publish step, Promote step, both in their own `env:`) |

### Plan-Level `must_haves.truths` — 06-03 (PKG-01, PKG-05 attestation half)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `npm whoami` resolves; `NPM_TOKEN` secret exists | ✓ VERIFIED | Re-confirmed live by this verifier: `npm whoami` → `falkensmage`; `gh secret list` → `NPM_TOKEN` present |
| 2 | `npm publish --dry-run` read (not just exit-checked) at the time, reported public access | Accepted as documented | Historical, point-in-time rehearsal event; verbatim output transcribed in `06-RELEASE-LOG.md` (`Publishing to ... with tag latest and public access (dry-run)`). Not independently re-runnable without a second dry-run against now-different state; the claim it exists to support (public access actually took) is independently reconfirmed by live registry state below |
| 3 | `1.0.0` published under `next` by the workflow (not a local publish) | ✓ VERIFIED | `gh run list` shows exactly one `release.yml` run, `workflow_dispatch`, `success`; packument `gitHead` matches the reviewed commit; no second run exists |
| 4 | `npm view ...@1.0.0` reports MIT, correct author, repository resolving to `github.com/mstine/sigil-spinner` | ✓ VERIFIED | Re-confirmed live (see ROADMAP criterion 3 above) |
| 5 | Provenance attestation verifiable via `npm audit signatures` and the npm-page panel | ✓ VERIFIED | Re-confirmed live (`npm audit signatures`) + already-closed human-check (panel, Matt, 06-03) |
| 6 | A bare install did NOT resolve to `1.0.0` at that point (review window) | Accepted as documented | This is a point-in-time claim about state that no longer exists (npm's first-publish quirk auto-assigned `latest` at publish time — see Known Deviation 1 below, confirmed honestly recorded in `06-RELEASE-LOG.md` and `06-03-SUMMARY.md`, not something to re-verify or re-litigate) |
| 7 | Fresh `@next` install: zero deps, both surfaces work | ✓ VERIFIED (superseded-equivalent) | `@next` and bare install both resolve to `1.0.0` now; this verifier's own bare-install check (ROADMAP criteria 1-2) is the same proof against the now-current default path |

### Plan-Level `must_haves.truths` — 06-04 (PKG-01 final rung)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `dist-tag add` assigns `latest` via the workflow's promote mode | Known deviation, honestly recorded | npm's first-publish behavior already assigned `latest` at publish time (06-03 finding); 06-04 correctly identified the planned action as a no-op and declined to dispatch a redundant registry-mutating command. Documented in both `06-04-SUMMARY.md` and `06-RELEASE-LOG.md` § Wave 4 — this is a pre-cleared known deviation per the verification brief, not a new finding |
| 2 | After promote, `next` and `latest` both report `1.0.0`, coexisting | ✓ VERIFIED | Live: `npm view @falkensmage/sigil-spinner dist-tags --json` → `{"next":"1.0.0","latest":"1.0.0"}` |
| 3 | No republish: shasum and publish timestamp unchanged | ✓ VERIFIED | Live packument fetch: `dist.shasum` = `e1e3cc4cd676d8e38dd47bec2968bc213f4e34fd`, byte-identical to the value recorded in `06-RELEASE-LOG.md` before and after the (non-)promote |
| 4 | Bare `npm install` resolves `1.0.0`, zero deps, both surfaces work | ✓ VERIFIED | This verifier's own live bare-install check (ROADMAP criteria 1-2) |
| 5 | Release log records promote evidence | ✓ VERIFIED | `06-RELEASE-LOG.md` § "Wave 4 (06-04) — verify-only close" present and complete |

**Score:** 5/5 ROADMAP success criteria verified. 0 behavior-unverified (the one genuinely behavior-dependent truth — D-73 cleanup/preservation — was closed with a live fail-first probe rather than left on presence alone). 3 truths accepted as documented historical evidence of point-in-time rehearsal events that cannot be re-run without a second irreversible registry write, and whose underlying claims are independently reconfirmed by current live state.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `package.json` | Complete PKG-04 metadata | ✓ VERIFIED | All 9 fields present, correct, non-empty |
| `LICENSE` | MIT text, correct copyright | ✓ VERIFIED | Present, correct, ships in the real published tarball |
| `README.md` | Scoped specifiers, ESM-only disclosure | ✓ VERIFIED | Both present |
| `test/package-identity.test.js` | D-65 drift guard | ✓ VERIFIED | 2/2 passing, in default `npm test` run |
| `test/pack-install.test.js` | PKG-03 smoke test | ✓ VERIFIED | 2/2 passing via `npm run test:pack`; fail-first behavior for the cleanup invariant reconfirmed by this verifier |
| `vitest.config.js` / `vitest.pack.config.js` | D-71 exclusion split | ✓ VERIFIED | Default `npm test` never runs `pack-install.test.js`; `test:pack` runs it via a dedicated config (the documented Assumption-A1 fallback) |
| `.github/workflows/release.yml` | PKG-05 release workflow | ✓ VERIFIED | `workflow_dispatch` only, 2 closed-choice inputs, correct permissions, 6-gate order, single successful run on record |
| `.planning/phases/06-published-package/06-RELEASE-LOG.md` | Live evidence record | ✓ VERIFIED | Complete: dry-run output, run URL, `npm view` output, attestation legs, shasum comparisons, both dated follow-ons |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `package.json repository.url` | provenance attestation | case-sensitive match against workflow's repo | ✓ WIRED | Attestation minted successfully; packument `gitHead` and the human-confirmed panel `Source Commit` both read `c360ba4`, agreeing |
| `.github/workflows/release.yml` Publish step | npm registry | `npm publish --tag next --provenance --access public` | ✓ WIRED | Single successful run, `1.0.0` live, attested |
| `test/pack-install.test.js` | `node_modules/@falkensmage/sigil-spinner` | `execFileSync` of a `.mjs` probe from outside the package boundary | ✓ WIRED | Confirmed passing locally and equivalent to this verifier's independent live-registry install test |
| `vitest.config.js` `exclude` | `test/pack-install.test.js` | keeps the pack test out of the default run | ✓ WIRED | `npm test` output has zero mentions of `pack-install`; file/test counts match summaries (21 files, 1498 tests) |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| PKG-04 | 06-01 | Complete, correct publication metadata | ✓ SATISFIED | See truths above |
| PKG-03 | 06-02 | Repeatable pack-and-scratch-install smoke test | ✓ SATISFIED | See truths above |
| PKG-01 | 06-03, 06-04 | Published to public npm registry, both surfaces work with no extra config | ✓ SATISFIED | See truths above |
| PKG-05 | 06-02, 06-03 | GitHub Actions release workflow with npm provenance | ✓ SATISFIED | See truths above |

Cross-referenced against `.planning/REQUIREMENTS.md`: all four IDs marked `[x]` and mapped to Phase 6 in its coverage table, matching this verification. No orphaned requirements found mapped to Phase 6 outside the four claimed by these plans.

### `must_haves.prohibitions` — disposition check

All five prohibitions across the four plans were authored descriptor-less (`verification: judgment`, no wired mechanical check) and correctly dispose as flagged-unverified by design per the verification brief — this is the intended framework behavior for judgment-tier prohibitions, not a defect. Practical honoring of each, checked by evidence gathered above:

| Plan | Prohibition | Practically honored? | Evidence |
|------|-------------|----------------------|----------|
| 06-01 | No email/contact info beyond name + GitHub URL in `author`/`bugs`/`LICENSE` | Yes | `author` = `Matt Stine (https://github.com/mstine)`, no email; `LICENSE` carries only the copyright name, no contact info |
| 06-01 | License on the npm page must agree with the shipped `LICENSE` text | Yes | `package.json license: MIT`, `LICENSE` title `MIT License` — agree |
| 06-02 | Tarball must not ship anything outside the declared `files` allowlist | Yes | Downloaded the real published tarball — 18 files, all within `src/`, `bin/`, or the three named root files; no `.planning/` content |
| 06-03 | Must not perform the first registry write from a local machine | Yes | `gh run list` confirms the sole publish came from the workflow (`workflow_dispatch`, `success`); no evidence of a preceding local `npm publish` |
| 06-04 | Must not assign `latest` before the live verification of `@next` was actually performed and reviewed | Honored in substance, not in the letter — pre-cleared known deviation | npm's registry auto-assigned `latest` at publish time regardless of `--tag next`, before 06-03's live-verification task ran. This is the documented first-publish quirk (Known Deviation 1 below) — Matt reviewed it explicitly after the fact and chose accept, with full reasoning recorded in `06-RELEASE-LOG.md`. Per the verification brief, this is a known, human-decided deviation and is not reported here as a new finding |

### Anti-Patterns Found

None. Scanned every file touched by this phase (`package.json`, `LICENSE`, `README.md`,
`test/package-identity.test.js`, `test/pack-install.test.js`, `vitest.config.js`,
`vitest.pack.config.js`, `.github/workflows/release.yml`) for `TBD|FIXME|XXX|TODO|HACK|PLACEHOLDER`
— zero matches. No empty-implementation stubs (this is an infra/publishing phase; nothing here
renders UI or holds mock data). `06-REVIEW.md` (code review, run separately, 2026-08-09) found
0 critical, 2 warning, 3 info — all in `.github/workflows/release.yml`'s promote/publish
shell-interpolation and job-timeout hygiene, none blocking, none touching the already-published
`1.0.0` artifact, all independently confirmed present in the current file by this verifier
(WR-01's missing next-tag-match guard on promote, WR-02's `${{ inputs.dist_tag }}` direct
interpolation). These are legitimate, real, low-severity findings — carried forward for
awareness, not gaps against this phase's goal.

### Known Deviations (pre-cleared per verification brief — not reported as new findings)

1. **npm auto-assigned `latest` on first publish despite `--tag next`.** Confirmed still true
   and honestly recorded in `06-RELEASE-LOG.md` and both `06-03-SUMMARY.md`/`06-04-SUMMARY.md`.
   Matt reviewed accept/remove/redo and explicitly chose accept. `06-04`'s planned
   `dist-tag add` correctly became a documented no-op.
2. **`vitest run <path>` does not override a config-level `exclude`.** Confirmed still true —
   `vitest.pack.config.js` exists as the documented fallback and is wired via
   `"test:pack": "vitest run --config vitest.pack.config.js"`.
3. **Published tarball shasum differs from the local dry-run shasum.** Confirmed as expected —
   independent pack events are not byte-reproducible; identity is carried by the attested
   `gitHead`/Source Commit `c360ba4`, which this verifier independently reconfirmed via the
   live packument, agreeing with the human-confirmed provenance panel.

### Human Verification Required

None. The one item that genuinely required a human's own eyes — the rendered npm provenance
panel — was closed by Matt during plan 06-03 (Source Commit `c360ba4`, Build File
`.github/workflows/release.yml`, green verified check, transcribed verbatim into
`06-RELEASE-LOG.md`). Per the verification brief this is treated as closed and was not
reopened; this verifier independently corroborated the underlying claim (packument `gitHead`
and attestation predicate) rather than asking for a second look.

### Gaps Summary

No gaps. All five ROADMAP § Phase 6 success criteria are independently verified against the
live npm registry and the live GitHub repository, not merely against the summaries' claims.
All four requirement IDs (PKG-01, PKG-03, PKG-04, PKG-05) are satisfied and cross-referenced
cleanly against `REQUIREMENTS.md` with no orphans. The three documented deviations (first-publish
`latest` quirk, the Assumption-A1 disproof, and the shasum mismatch) were all handled honestly —
surfaced as decisions or explained with evidence, never silently absorbed or misrepresented as
"as planned." The one genuinely behavior-dependent must-have (D-73's cleanup/preserve-on-failure
invariant) was closed with a fresh fail-first probe by this verifier rather than accepted on
code presence alone. Code review's two warnings (WR-01, WR-02) are real but non-blocking,
workflow-hardening items unrelated to whether the phase goal is achieved — carried forward for
awareness, not phase-blocking. Phase 6's goal — "anyone, including a Claude Code session that
has never seen this repo, can install the package from npm and use both surfaces without extra
configuration" — is demonstrably true right now, verified from outside this repository against
the real registry.

---

*Verified: 2026-08-09*
*Verifier: Claude (gsd-verifier)*
