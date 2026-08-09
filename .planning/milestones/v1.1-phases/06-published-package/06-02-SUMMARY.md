---
phase: 06-published-package
plan: 02
subsystem: infra
tags: [npm, vitest, github-actions, provenance, testing, release]

# Dependency graph
requires:
  - phase: 06-published-package (plan 01)
    provides: scoped package identity (@falkensmage/sigil-spinner), root LICENSE, README npm pass — the metadata this plan's tracer asserts against
provides:
  - Pack-and-scratch-install smoke test (test/pack-install.test.js) resolving the package from outside its own boundary — the vantage point exports faults are invisible from to all 1,498 in-process tests
  - npm run test:pack as a named, non-default script (D-71), backed by a dedicated vitest.pack.config.js after Assumption A1 was disproven by observation
  - .github/workflows/release.yml — workflow_dispatch-only release workflow with publish/promote modes, npm provenance, and a six-gate quality sequence (D-76, D-77)
affects: [06-03-publish, 06-04-provenance-promote]

actuals:
  tokens: 3600
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "External-boundary resolution test: a .mjs probe written into a scratch install directory, executed via execFileSync, proves `exports` resolution the way a real consumer's `import` would — no in-repo test can reach this vantage point"
    - "Dedicated vitest config file as the fallback for excluding a test from the default run while still exposing it as a directly-runnable named script, once a CLI-path-overrides-config-exclude assumption is disproven by observation"

key-files:
  created:
    - test/pack-install.test.js
    - vitest.pack.config.js
    - .github/workflows/release.yml
  modified:
    - vitest.config.js
    - package.json

key-decisions:
  - "D-70/D-72/D-73: pack-install smoke test built as one describe with one it per rehearsal-ladder rung, ENTRY_POINTS declared as data (a table Phase 7 extends with a row, not a rewrite), scratch dir removed on success and preserved with its path in the thrown error on failure"
  - "Assumption A1 (06-RESEARCH.md) disproven by observation: `vitest run <path>` does NOT override a config-level `test.exclude` for that path — confirmed live, `npm run test:pack` returned 'No test files found, exiting with code 1' before the fix"
  - "Fallback per the plan's own contingency: a dedicated vitest.pack.config.js scoped to only the smoke test, rather than removing the exclusion — D-71's requirement (excluded from default run) held while the mechanism changed"
  - "D-76/D-77: release.yml triggers on workflow_dispatch only, with two closed-option choice inputs (mode, dist_tag) each carrying a declared default — no free-text input exists that could reach a shell command in the job holding NPM_TOKEN"
  - "Action SHAs (actions/checkout@3d3c42e..., actions/setup-node@820762...) resolved live via `gh api` against the actions marketplace rather than trusted from research, confirming the plan's stated v7.0.1/v7.0.0 coordinates exactly"

patterns-established:
  - "A tracer whose fail-first behavior was hand-verified for three independent fault classes (renamed export, missing LICENSE, widened files allowlist) before being trusted as a release gate"

requirements-completed: [PKG-03, PKG-05]

coverage:
  - id: D1
    description: "A tarball packed from this repo installs into a fresh scratch project with zero transitive runtime dependencies, exports resolves via a plain .mjs probe from outside the package, and the installed bin's stdout is byte-identical to the dev tree's for the same statement and planet"
    requirement: "PKG-03"
    verification:
      - kind: unit
        ref: "test/pack-install.test.js#rung 2 — a real tarball installs into a scratch project and resolves from outside the package (D-70, D-72, D-73)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The npm pack --dry-run manifest ships LICENSE, package.json, README.md, and every src/bin file, and nothing outside that allowlist — no .planning/ content or scratch output can reach the tarball"
    requirement: "PKG-03"
    verification:
      - kind: unit
        ref: "test/pack-install.test.js#rung 1 — the npm pack --dry-run manifest ships LICENSE and nothing outside the allowlist (D-70)"
        status: pass
    human_judgment: false
  - id: D3
    description: "npm run test:pack runs the smoke test for real (non-vacuous, Assumption A1 closed by observation) and is excluded from the default npm test run"
    requirement: "PKG-03"
    verification:
      - kind: unit
        ref: "npm run test:pack (2 passing) and npm test (1498 passing, 21 files, zero mentions of pack-install)"
        status: pass
    human_judgment: false
  - id: D4
    description: ".github/workflows/release.yml triggers only on workflow_dispatch, exposes two closed-option choice inputs with declared defaults, holds only contents:read and id-token:write, pins both actions to full 40-char SHAs, runs the six D-77 gates in order before publish, and promotes from a manifest-read version rather than an input"
    requirement: "PKG-05"
    verification:
      - kind: unit
        ref: "the plan's structural node -e checks (trigger-exclusivity, choice-input count, default count, dist_tag underscore, SHA-pinning, NPM_TOKEN scope, npm pkg get version, concurrency) — all print 'ok' or the expected count"
        status: pass
    human_judgment: false
  - id: D5
    description: "Nothing in this plan touches src/, introduces a runtime dependency, or adds a build-step lifecycle script"
    verification:
      - kind: unit
        ref: "git diff --name-only -- src/ (empty); node -p require('./package.json').dependencies (empty object); scripts list carries no prepack/prepare/prepublishOnly"
        status: pass
    human_judgment: false

duration: 35min
completed: 2026-08-08
status: complete
---

# Phase 6 Plan 2: Pack-Install Smoke Test and Release Workflow Summary

**Built the one test that resolves the package from outside its own boundary, and the workflow_dispatch release machine that gates a real npm publish behind it.**

## Performance

- **Duration:** ~35 min
- **Completed:** 2026-08-08
- **Tasks:** 3 completed (1 tracer, 2 auto)
- **Files modified:** 5 (3 created, 2 modified)

## Accomplishments

- Built `test/pack-install.test.js` as the phase tracer: `npm pack --dry-run --json` manifest assertion (required-subset + prefix-allowlist, catches a widened `files` shipping `.planning/` content), then a real `npm pack` into an `mkdtempSync` scratch directory, a real `npm install` of the tarball into an empty project, and three assertions against the installed copy — zero transitive dependencies, `exports` resolution via a `.mjs` probe for every `ENTRY_POINTS` row, and byte-identical installed-`bin` output compared against the dev tree's CLI.
- Hand-verified fail-first behavior for three independent fault classes before trusting the tracer as a gate: a renamed `generateSigil` export threw a module-resolution `SyntaxError` (not a silent pass), a removed `LICENSE` failed rung 1 naming `LICENSE`, and a `files` entry widened to include `.planning` failed rung 1 and printed the full list of offending paths — including real `.planning/research/.cache/*` and `.planning/STATE.md` paths, confirming the guard catches exactly the privacy leak it exists to prevent. All three perturbations were restored before committing.
- Confirmed the scratch directory is removed on a passing run and preserved with its absolute path in the thrown error on a failing run (D-73), observed directly for both outcomes.
- Closed Assumption A1 by observation rather than trusting the research document: `vitest run test/pack-install.test.js` against the excluding `vitest.config.js` printed `No test files found, exiting with code 1` — the CLI path argument does **not** override a config-level `exclude`. Followed the plan's own named contingency and added `vitest.pack.config.js`, a dedicated config scoped to only the smoke test, and pointed `npm run test:pack` at it via `--config`. `npm test`'s file/test counts are unchanged (21 files, 1498 tests) and never mention `pack-install`.
- Built `.github/workflows/release.yml` from scratch (`.github/` did not exist in this repo before this plan): `workflow_dispatch` only, two closed-option `type: choice` inputs (`mode`: publish/promote, `dist_tag`: next/latest) each with a declared default, `contents: read` + `id-token: write` at workflow level, both first-party actions pinned to full 40-character commit SHAs resolved live via `gh api` (`actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1` / v7.0.1, `actions/setup-node@820762786026740c76f36085b0efc47a31fe5020` / v7.0.0 — both matched the plan's stated coordinates exactly), a `concurrency` group serializing dispatches, the six D-77 gate steps in fixed order (`npm ci` → lint → typecheck → chromium install → `npm test` → `npm run test:pack`), a publish step using `--tag ${{ inputs.dist_tag }} --provenance --access public` with `NODE_AUTH_TOKEN` scoped to that step's own `env`, and a promote step reading the version from `npm pkg get version` rather than from any caller-supplied input.
- Ran every structural `node -e` acceptance check from the plan against the finished workflow file — trigger-exclusivity, choice-input count, default count, `dist_tag` underscore usage, SHA-pinning of both actions, `NPM_TOKEN` appearing exactly twice, `npm pkg get version` present, and `concurrency` present — all passed.
- Confirmed the full plan-level verification block: `npm run test:pack` exits 0, `npm test` exits 0 and does not include the pack test, `npm run lint` and `npm run typecheck` both exit 0, `dependencies` is an empty object, `git diff --name-only -- src/` is empty, and no lifecycle build hook exists in `scripts`.

## Task Commits

1. **Task 1 (TRACER): Pack, install into a scratch project, and prove the package from outside its own boundary** - `cee676b` (feat)
2. **Task 2: Take the smoke test out of the default run and expose it as test:pack (D-71)** - `d6d809f` (feat)
3. **Task 3: Build the workflow_dispatch release workflow with npm provenance (D-76, D-77)** - `c34d8a0` (feat)

**Plan metadata commit:** pending (this SUMMARY + STATE.md update, committed separately per the sequential-executor protocol)

## Files Created/Modified

- `test/pack-install.test.js` - new: the PKG-03 pack-and-scratch-install smoke test, the only test resolving the package from outside its own boundary
- `vitest.config.js` - added `test.exclude` spreading `configDefaults.exclude` plus `test/pack-install.test.js`
- `vitest.pack.config.js` - new: dedicated config scoped to only the smoke test, the fallback for Assumption A1's disproof
- `package.json` - added `scripts.test:pack: "vitest run --config vitest.pack.config.js"`
- `.github/workflows/release.yml` - new: `workflow_dispatch`-only publish/promote release workflow with npm provenance

## Decisions Made

- **Assumption A1 closed as false, by direct observation.** `06-RESEARCH.md` flagged this as unverified; running the actual command against the actual config proved the CLI-path-overrides-exclude behavior does not hold in this Vitest version. Took the plan's own named fallback (a dedicated config file) rather than removing the exclusion, keeping D-71's requirement intact while changing only the mechanism.
- **Action SHAs verified live rather than trusted from the plan/research text**, via `gh api repos/actions/{checkout,setup-node}/git/refs/tags` — both matched the plan's stated `v7.0.1`/`v7.0.0` coordinates exactly, so no correction was needed, but the verification itself was not skipped.
- **Fail-first checks performed by hand for all three of Task 1's perturbations** (renamed export, missing LICENSE, widened `files`) before trusting the tracer, each restored immediately via a file-copy backup rather than `git checkout --` (per the lesson recorded in `06-01-SUMMARY.md`'s Issues Encountered, since none of Task 1's edits were committed yet at perturbation time either).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `npm run test:pack` script target changed from a direct file path to `--config vitest.pack.config.js`, and a new file was introduced**
- **Found during:** Task 2 (verifying Assumption A1 empirically, as the task's own action text required)
- **Issue:** The plan's literal acceptance criteria specified `"test:pack": "vitest run test/pack-install.test.js"` and no new config file, on the assumption that a CLI file-path argument overrides a config-level `exclude`. Running it for real showed `vitest run test/pack-install.test.js` against the excluding `vitest.config.js` prints `No test files found, exiting with code 1` — a silently "passing" release gate that exercises nothing, exactly the failure mode the plan itself flagged as the worst possible outcome.
- **Fix:** Added `vitest.pack.config.js`, a dedicated config with no `exclude` entry, `include: ['test/pack-install.test.js']` only. Changed `package.json`'s `test:pack` script to `"vitest run --config vitest.pack.config.js"`. This is the exact fallback the plan's own action text names for this case ("fall back to a second named Vitest project (or a dedicated config file targeting only that path) rather than removing the exclusion — the exclusion is the requirement, the mechanism is not").
- **Files modified:** `package.json`, `vitest.pack.config.js` (new)
- **Verification:** `npm run test:pack` now reports 2 real passing tests; `npm test`'s file/test counts are unchanged (21 files, 1498 tests) and grep for `pack-install` in its output returns 0.
- **Committed in:** `d6d809f` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking — a plan-anticipated contingency, not a novel discovery)
**Impact on plan:** The plan's `files_modified` frontmatter did not list `vitest.pack.config.js`, but the plan's own Task 2 action text explicitly named this exact fallback for exactly this failure mode. No scope creep — D-71's requirement (excluded from default run, runnable as a named script) is fully satisfied; only the implementation mechanism changed.

## Issues Encountered

None beyond the Assumption A1 disproof documented above, which the plan anticipated and provided a named resolution path for.

## User Setup Required

None - no external service configuration required in this plan. The `NPM_TOKEN` Granular Access Token human gate (PKG-01's actual publish) is a later plan; nothing in this plan needs it, and `npm whoami` / registry credentials were never touched.

## Next Phase Readiness

The full rehearsal ladder's first two rungs (`npm pack --dry-run`, tarball scratch-install) are now a repeatable, gated check, and the release workflow that will execute the third rung (`npm publish --tag next --provenance --access public`) exists and is structurally verified. Nothing in this plan required `NPM_TOKEN` — the human gate for the actual publish (creating a Granular Access Token with Bypass 2FA, per `06-RESEARCH.md`'s Pitfall A finding that "automation token" is a stale UI noun) remains squarely in the next plan. `src/` is untouched, `dependencies: {}` still holds, and the full suite (1498 tests, 21 files) plus the new smoke test (2 tests) are both green.

---
*Phase: 06-published-package*
*Completed: 2026-08-08*

## Self-Check: PASSED

All created files confirmed present on disk (`test/pack-install.test.js`, `vitest.pack.config.js`, `.github/workflows/release.yml`, this SUMMARY) and both modified files (`vitest.config.js`, `package.json`) carry the expected content. All three task commits (`cee676b`, `d6d809f`, `c34d8a0`) confirmed present in `git log`.
