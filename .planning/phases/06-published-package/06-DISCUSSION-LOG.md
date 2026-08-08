# Phase 6: Published Package - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-08
**Phase:** 6-published-package
**Mode:** `--auto` — no interactive prompts were shown. Claude selected the recommended option for every question and logged it here. Nothing below was confirmed by Matt.
**Areas discussed:** Version and package identity, Publication metadata, Smoke-test shape, Publish execution path, Release workflow, README npm pass

---

## Version and package identity

| Option | Description | Selected |
|--------|-------------|----------|
| First publish as `1.0.0` | Matches the roadmap's own success criterion; the API being published is the one v1.0 stabilized. Leaves `1.1.0` free for Phase 7's additive `./element` subpath | ✓ |
| First publish as `1.1.0` | Matches the v1.1 milestone label; the form used in PITFALLS.md's illustrative commands | |
| Publish `0.1.0` as-is | Current `package.json` value; no edit needed | |

**Selection:** `1.0.0` (recommended default)
**Notes:** Registry semver describes the public API surface, not GSD milestone numbering. `0.1.0` signals pre-release instability for a surface pinned by 48 snapshots. Name scoping (`@falkensmage/sigil-spinner`) and the unscoped `bin` key were treated as forced by the requirements rather than as open choices. Follow-on: sweep every bare `sigil-spinner` specifier in shipped docs, and guard it mechanically.

---

## Publication metadata

| Option | Description | Selected |
|--------|-------------|----------|
| Required four plus `publishConfig`, `homepage`, `bugs` | MIT + LICENSE file, author, repository, access:public, plus the two fields that make the npm page usable | ✓ |
| Strict minimum only | Just the four fields PKG-04 names verbatim | |
| Full metadata sweep | Also `funding`, `contributors`, expanded `keywords`, badges | |

**Selection:** required four plus `publishConfig`, `homepage`, `bugs` (recommended default)
**Notes:** `author` locked as `"Matt Stine (https://github.com/mstine)"` — name and URL, no email, since the npm author field is scraped. Flagged in CONTEXT.md as the one field Matt may want to override before the publish task runs; trivially editable until then, permanent after. `repository.url` set to `git+https://github.com/mstine/sigil-spinner.git`, verified against the live remote.

---

## Smoke-test shape

| Option | Description | Selected |
|--------|-------------|----------|
| `test/pack-install.test.js`, vitest, excluded from default run | Follows the existing `test/e2e/` `execFileSync` pattern; reuses the repo's assertion and reporting machinery; exposed as `npm run test:pack` | ✓ |
| `scripts/smoke-install.mjs` + `npm run smoke` | Standalone script, no vitest coupling | |
| CI-only job | Lives entirely in the release workflow | |

**Selection:** vitest file, excluded from default `npm test` (recommended default)
**Notes:** Rejected the standalone script for re-implementing assertion machinery the repo already has; rejected CI-only because the pre-publish rehearsal must be runnable locally. Exclusion from the default run trades inner-loop speed against rot risk; the rot risk is closed by making it a hard gate in the release workflow. Entry points declared as an iterable table rather than procedural assertions, so Phase 7 adds a row for `./element` instead of editing control flow — this is what makes success criterion 5 true.

---

## Publish execution path

| Option | Description | Selected |
|--------|-------------|----------|
| CI publishes `1.0.0` from the start | Release workflow built and exercised before any real publish; first registry write is attested | ✓ |
| Manual first publish, CI attests from `1.0.1` | Simpler; defers the workflow | |
| Dry-run only, defer the real publish | Zero irreversibility this phase | |

**Selection:** CI publishes `1.0.0` (recommended default)
**Notes:** Option 2 is forbidden by the roadmap in as many words and burns a version number to buy nothing. Option 3 abandons the phase goal. Credential path assumes the roadmap's stated human gate — an npm automation token as a GitHub Actions secret — because provenance works with a token given `id-token: write` on a public repo. PKG-05's mandated live-docs check was narrowed to one question: can npm Trusted Publishing (OIDC) be configured for a package that does not yet exist on the registry? If yes, drop the secret; if configuring a trusted publisher requires the package to already exist, the token path stands and OIDC becomes a post-1.0.0 upgrade.

---

## Release workflow

| Option | Description | Selected |
|--------|-------------|----------|
| `workflow_dispatch` only, with `dist-tag` input and a `promote` mode | Human-controlled timing between the `next` publish and the promotion; credential in one place | ✓ |
| `push: tags: v*` | Conventional; publish on tag push | |
| Both triggers | Dispatch for the first publish, tags thereafter | |

**Selection:** `workflow_dispatch` only (recommended default)
**Notes:** A tag trigger makes the one irreversible command in the toolchain a side effect of a git push, and the rehearsal ladder's step 4/5 split requires a deliberate pause between them. Noted as a reasonable addition once the path has published successfully at least once. Pre-publish gates locked in order: `npm ci` → lint → typecheck → `npx playwright install --with-deps chromium` → `npm test` → `npm run test:pack` → publish. The playwright step is required because the browser test fails loudly rather than skipping when chromium is absent.

---

## README npm pass

| Option | Description | Selected |
|--------|-------------|----------|
| Scoped specifier + ESM-only disclosure only | Exactly what a new consumer needs to not fail on first contact | ✓ |
| Full README restructure for the npm page | Badges, reordered sections, install-first layout | |

**Selection:** scoped specifier + ESM-only disclosure (recommended default)
**Notes:** Pitfall 5's point is not that ESM-only is wrong — v1.0 chose it deliberately — but that shipping it undocumented hands `ERR_REQUIRE_ESM` to a first-time CommonJS consumer with no explanation. The audience widens at publish; the README becomes the package page. Restructuring deferred as cosmetic.

---

## Claude's Discretion

Recorded in CONTEXT.md § Claude's Discretion. Summary: plan decomposition and commit granularity; the smoke test's byte-identity fixture (in-process comparison vs. committed snapshot); tarball-manifest assertion strictness (exact set vs. required subset); workflow hardening details (action pinning, permissions minimization, concurrency, Node matrix); whether `test:pack` also appears in a PR-triggered CI workflow.

## Deferred Ideas

- `PACKAGE_VERSION` in-source constant plus a CI match assertion — carried from Phase 5, which named Phase 6 as the revisit point. Decision: still deferred.
- `push: tags: v*` release trigger.
- A PR-triggered CI workflow.
- Dual ESM+CJS publishing — a standing refusal, not a deferral.
- The `./element` exports subpath and its `files` coverage — Phase 7 owns it.
- npm README badges.
- The three v1.0 items with written reopen conditions; the `D-12` condition names `bin/sigil-spinner.js:20`, which Phase 6 is not expected to touch.
