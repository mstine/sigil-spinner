---
phase: 06-published-package
plan: 01
subsystem: infra
tags: [npm, package.json, license, provenance, publishing]

# Dependency graph
requires:
  - phase: 05-publish-ready-source
    provides: byte-pinned, publish-ready source surface (PKG-02, INT-05, INT-06, MAINT-01)
provides:
  - Complete, correct npm publication metadata (name, version, license, author, repository, homepage, bugs, publishConfig)
  - Root LICENSE file (MIT, Copyright (c) 2026 Matt Stine)
  - README npm-package-page pass (scoped install/import specifier, ESM-only disclosure)
  - Mechanical drift guard binding README's documented specifier to package.json's name (D-65)
affects: [06-02-pack-install-smoke-test, 06-03-publish, 06-04-provenance-promote]

actuals:
  tokens: 1316
  tasks: 2
  commits: 1

tech-stack:
  added: []
  patterns: ["mechanical drift guard reading a shipped artifact and failing on divergence (extends the MAINT-01/D-55/D-61 'guards are keyed, not transcribed' precedent to package identity)"]

key-files:
  created:
    - LICENSE
    - test/package-identity.test.js
  modified:
    - package.json
    - README.md

key-decisions:
  - "D-62: first published version is 1.0.0 (human-confirmed at Task 1 checkpoint, over 1.1.0 and over publishing 0.1.0 as-is)"
  - "D-63: name becomes @falkensmage/sigil-spinner; bin key stays unscoped as sigil-spinner"
  - "D-66: license becomes MIT with a root LICENSE file, Copyright (c) 2026 Matt Stine"
  - "D-67: repository.url is git+https://github.com/mstine/sigil-spinner.git, verified byte-exact and case-matched against the live git remote"
  - "D-68: author is 'Matt Stine (https://github.com/mstine)' — name and GitHub profile URL only, no email (human-confirmed at Task 1 checkpoint, explicitly declining the with-email variant)"
  - "D-69: homepage, bugs.url, and publishConfig.access: public added alongside the required four"
  - "D-64/D-65: README's bare sigil-spinner module specifiers swept to the scoped name in the same commit as package.json, bound by a mechanical guard so the two can never silently diverge"
  - "D-78: README documents ESM-only status as a plain declarative fact in its opening section, not an apology"

patterns-established:
  - "Publication metadata is a one-way door: Task 1 was a blocking checkpoint:decision that froze five permanent values before writing, rather than writing first and asking forgiveness."

requirements-completed: [PKG-04]

coverage:
  - id: D1
    description: "package.json carries complete PKG-04 metadata (name, version, license, author, repository.url, homepage, bugs.url, publishConfig.access) with repository.url byte-exact and case-matched against the live git remote"
    requirement: "PKG-04"
    verification:
      - kind: unit
        ref: "manual acceptance-criteria script (node -e ...) run against live package.json and git remote — see plan 06-01-PLAN.md Task 2 acceptance_criteria"
        status: pass
    human_judgment: false
  - id: D2
    description: "Root LICENSE ships MIT text with Copyright (c) 2026 Matt Stine, agreeing with package.json's license field"
    requirement: "PKG-04"
    verification:
      - kind: unit
        ref: "grep -c 'Copyright (c) 2026 Matt Stine' LICENSE; grep -c 'MIT License' LICENSE"
        status: pass
    human_judgment: false
  - id: D3
    description: "README documents the scoped install command and library import specifier, and discloses ESM-only status in its opening section"
    requirement: "PKG-04"
    verification:
      - kind: unit
        ref: "test/package-identity.test.js#Package identity (PKG-04, D-65)"
        status: pass
    human_judgment: false
  - id: D4
    description: "test/package-identity.test.js runs in the default suite and fails when package.json's name is perturbed (fail-first confirmed by hand)"
    requirement: "PKG-04"
    verification:
      - kind: unit
        ref: "npx vitest run test/package-identity.test.js (2 passing); manually confirmed failure with a temporarily wrong name, then restored"
        status: pass
    human_judgment: false

duration: 25min (includes a blocking human checkpoint wait; hands-on execution time was under 10min)
completed: 2026-08-08
status: complete
---

# Phase 6 Plan 1: Publication Metadata and LICENSE Summary

**Froze the five one-way npm identity fields at a human checkpoint, then wrote complete PKG-04 metadata, a root MIT LICENSE, a scoped-specifier README pass, and a mechanical drift guard — all in one commit.**

## Performance

- **Duration:** ~25min total (Task 1 checkpoint required a human decision round-trip; hands-on execution for Task 2 was under 10 minutes)
- **Completed:** 2026-08-08
- **Tasks:** 2 completed (1 checkpoint:decision, 1 auto)
- **Files modified:** 4 (2 created, 2 modified)

## Accomplishments

- Presented the five one-way metadata values (`version`, `name`, `license`, `repository.url`, `author`) at a blocking `checkpoint:decision`, with a cost-of-undoing table for each, and did not self-approve — Matt reviewed and explicitly confirmed `version: 1.0.0` and `author: Matt Stine (https://github.com/mstine)` with no email, over a with-email alternative he was shown.
- Wrote complete PKG-04 publication metadata into `package.json`: scoped name, `1.0.0`, MIT license, confirmed author string, plus `repository`, `homepage`, `bugs`, and `publishConfig.access: "public"`. Verified `repository.url` byte-exact and case-matched against `git remote get-url origin` before writing it, rather than retyping the plan's transcription.
- Added a root `LICENSE` file with the standard MIT text and `Copyright (c) 2026 Matt Stine`, confirmed to agree with `package.json`'s `license` field.
- Swept the README for bare `sigil-spinner` module specifiers, updating the install command and the library `import` example to the scoped name while leaving the CLI usage line, the stdin example, and the `bin/sigil-spinner.js` path reference alone (those are the bin command name and a repo file path, not module specifiers). Added an `## Installation` section carrying the scoped `npm install` command and an unmissable ESM-only disclosure, phrased as a declarative fact rather than a caveat.
- Created `test/package-identity.test.js`, a mechanical drift guard that reads `package.json`'s name and regex-extracts the README's documented install command and import specifier, asserting both match. Confirmed by hand that it fails when the name is perturbed, then restored the correct state before committing.
- Confirmed `npm test` (1498 tests, 21 files), `npm run lint`, and `npm run typecheck` all exit 0 with the new test included in the default suite, and that `git diff --name-only -- src/` is empty.

## Task Commits

Task 1 was a `checkpoint:decision` — no code change, no commit; it produced a human decision that unblocked Task 2.

1. **Task 2: Write the metadata, the LICENSE, the README npm pass, and the identity guard** - `d714228` (feat)

**Plan metadata commit:** pending (this SUMMARY + STATE.md update, committed separately per the sequential-executor protocol)

## Files Created/Modified

- `package.json` - name, version, license, author changed; repository, homepage, bugs, publishConfig added
- `LICENSE` - new root MIT license file, Copyright (c) 2026 Matt Stine
- `README.md` - scoped install/import specifier, new Installation section, ESM-only disclosure
- `test/package-identity.test.js` - new mechanical guard (D-65) binding README's specifier to package.json's name

## Decisions Made

- **`version: 1.0.0`** — human-confirmed at the Task 1 checkpoint, over `1.1.0` (which would have matched the GSD milestone label but conflated milestone numbering with the public API's semver line) and over publishing `0.1.0` as-is (which would misrepresent a byte-pinned, 1,498-test-covered surface as pre-release).
- **`author: "Matt Stine (https://github.com/mstine)"`, no email** — human-confirmed at the Task 1 checkpoint; Matt was shown a with-email variant and explicitly did not take it. This constraint is now permanent for `1.0.0`.
- **`name`, `license`, `repository.url`** approved exactly as specified in the plan — `repository.url` verified against the live `git remote get-url origin` (`git@github.com:mstine/sigil-spinner.git`, normalized to `git+https://github.com/mstine/sigil-spinner.git`) rather than trusting the plan's transcription, per the plan's own instruction and the milestone's Sigstore-422 case-sensitivity concern.

## Deviations from Plan

None - plan executed exactly as written, with the two open checkpoint choices resolved by explicit human confirmation rather than auto-approval (per the orchestrator's override of standard auto-mode checkpoint behavior for this specific plan).

## Issues Encountered

During manual fail-first verification of the drift guard, a `git checkout -- package.json` used to "restore" the file after temporarily perturbing its name reverted to the last **committed** state (pre-edit, `0.1.0`/unscoped/`ISC`) rather than the working-tree edits made earlier in this task, since those edits were not yet committed. A file backup taken immediately before the perturbation (`/tmp/package.json.bak`) allowed exact restoration of the correct edited state with no data loss; the mistake was caught immediately by reviewing the restored file's contents rather than assuming the restore succeeded. No incorrect state was ever committed. Lesson for future tasks: prefer `cp` round-trip backups over `git checkout --` for restoring uncommitted edits mid-task, since the latter silently targets HEAD, not the working tree's own prior state.

## User Setup Required

None - no external service configuration required. (The npm automation token gate is later, in plan 06-03.)

## Next Phase Readiness

`package.json` and `README.md` now carry the identity the smoke test in plan 06-02 will assert against (scoped `exports` resolution, `LICENSE` in the tarball manifest). All five one-way fields are human-confirmed and correct; nothing in this plan touched `src/`, kept the zero-runtime-dependency guarantee intact (`dependencies: {}`), and left the full suite green. No blockers for 06-02.

---
*Phase: 06-published-package*
*Completed: 2026-08-08*

## Self-Check: PASSED

All created/modified files confirmed present on disk (`package.json`, `LICENSE`, `README.md`, `test/package-identity.test.js`, this SUMMARY). Both commits (`d714228`, `6cb9974`) confirmed present in `git log`.
