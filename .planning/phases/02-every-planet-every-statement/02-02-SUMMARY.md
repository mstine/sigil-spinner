---
phase: 02-every-planet-every-statement
plan: 02
subsystem: contract-hardening-determinism-matrix
tags: [error-handling, documentation, determinism, testing, kamea]

dependency-graph:
  requires:
    - foldStatement
    - normalize.keptEntries
    - buildPath.repeats
    - svg.sigil-loop
    - working.keptTrail
    - working.repeats
  provides:
    - SigilError.details
    - test/text/fold.test.js
    - test/determinism.test.js (seven-planet matrix)
    - README "Letter Handling Rules"
  affects:
    - src/errors.js
    - src/generate.js
    - src/text/normalize.js
    - test/cli/cli.test.js
    - test/determinism.test.js
    - README.md

tech-stack:
  added: []
  patterns:
    - "Optional third constructor parameter, assigned only when defined, to extend an error type without disturbing existing call sites"
    - "Per-reason strike-count breakdown built in the orchestrator (generate.js), never in normalize.js or errors.js"
    - "describe.each planet matrix reusing per-planet file snapshots, test-context expect for per-case snapshot resolution"

key-files:
  created:
    - test/text/fold.test.js
    - test/__file_snapshots__/matrix-saturn.svg
    - test/__file_snapshots__/matrix-jupiter.svg
    - test/__file_snapshots__/matrix-mars.svg
    - test/__file_snapshots__/matrix-sun.svg
    - test/__file_snapshots__/matrix-venus.svg
    - test/__file_snapshots__/matrix-mercury.svg
    - test/__file_snapshots__/matrix-moon.svg
  modified:
    - src/errors.js
    - src/generate.js
    - src/text/normalize.js
    - README.md
    - test/cli/cli.test.js
    - test/text/normalize.test.js
    - test/determinism.test.js

decisions:
  - "For 'AAA', normalize.js's branch order (non-letter, then vowel, then repeat) classifies every repeated vowel as reason 'vowel', never 'repeat' — a repeat-reason strike is structurally impossible in an E_EMPTY_SEQUENCE case, since any consonant's first occurrence is always kept. Test written to assert the real per-reason tally (3 vowels) rather than the plan behavior text's literal phrasing ('distinguishing vowel from repeat'), which described an outcome the codebase's existing, unmodified classification order cannot produce."
  - "Degenerate-case determinism (one-kept-letter statement) asserted on saturn and moon only, per the task's own action text ('at least the smallest and largest kameas') rather than all seven planets — the frontmatter must_haves phrasing is the broader aspiration; the task's explicit scope is the authority followed here."

actuals:
  tokens: 7792
  tasks: 3
  commits: 3
metrics:
  duration: "~35min"
  completed: 2026-08-06

status: complete
---

# Phase 2 Plan 2: Every Planet, Every Statement — Contract Hardening Summary

Degenerate statements now fail with a named, countable reason; the folding rules Plan 02-01 built are documented as a citable public contract; and all seven kameas are proven byte-stable and mutually distinct, closing out Phase 2.

## What Was Built

**Task 1 — Enriched `E_EMPTY_SEQUENCE` with a strike-count breakdown and structured `details` (D-26):**

- `src/errors.js` — `SigilError`'s constructor gained an optional third `details` parameter, assigned to `.details` only when not `undefined`. Every existing two-argument call site is unchanged — `Object.hasOwn(err, 'details')` is `false` for them, verified by test.
- `src/generate.js` — the existing `E_EMPTY_SEQUENCE` throw site now reduces `struck` into per-reason counts, builds a pluralized breakdown fragment (`"5 vowels"`, `"4 non-letters"`), and passes `{ struck }` as the error's `details`. The guard order (statement → planet → normalize → empty → kamea lookup) is untouched; the enrichment logic lives entirely in `generate.js`, the sole cross-layer orchestrator.
- `bin/sigil-spinner.js` — untouched (verified via `git diff --stat`), since the CLI already forwards the library's `.message` to stderr and maps `.code` to an exit status; the enriched message and INT-04 error-identity parity arrived for free.
- `test/cli/cli.test.js` — added library-side assertions (all-vowel, repeated-vowel, whitespace-only, empty/null, single-letter) and a paired library/CLI assertion proving the same input produces the same error `.code` from both entry points.

**Task 2 — Letter-handling rules promoted to a citable contract (D-21 through D-24):**

- `src/text/normalize.js` — module header rewritten: Y's consonant rule (CONS-04) is now stated as resolved and documented rather than deferred. Doc-only change — `VOWELS` already excluded Y, so no logic changed.
- `README.md` — new `## Letter Handling Rules` section (placed between Worked Example and Errors and Exit Codes) stating all four rules — Y-as-consonant, NFD accent-folding, the twelve-row transliteration table, and non-Latin-as-non-letter — in the same citable-lineage posture as `## Kamea Source Lineage`. Added a loop-marker subsection documenting `sigil-loop` behavior at boundaries. Updated the Errors table's `E_EMPTY_SEQUENCE` row to mention the strike-count message and `.details.struck`. Renamed and trimmed `## What Phase 1 Does Not Yet Do` to remove items this phase delivered.
- `test/text/fold.test.js` (new) — covers all twelve transliteration rows individually, the NFD path for é/É/ñ/Ñ/ü/à/ç, non-Latin script folding (Greek/Cyrillic/Hebrew/CJK fold to themselves, never to Latin), a defensive lone-surrogate vector, a fifty-stacked-combining-mark stress vector, and fold provenance (`original`/`originalIndex`/`folded`).
- `test/text/normalize.test.js` — added Y vectors (`RHYTHM`, `YES`), an accent-fold vector (`ÑU`), and a non-Latin vector (`ΩЯא你`).
- All new tests passed without any change to `src/text/fold.js` or the classification logic in `normalize.js` — Plan 02-01 had already implemented the full behavior; this task's code footprint is documentation plus test coverage.

**Task 3 — Seven-planet determinism matrix and distinctness proof (KAMEA-02, INT-03):**

- `test/determinism.test.js` — added a `PLANETS` constant (canonical Saturn-to-Moon order matching `src/data/kamea.js`) and a `describe.each(PLANETS)` block asserting, per planet: two-call byte-equal SVG (`toBe`), two-call byte-equal `JSON.stringify(working)` (`toBe`), and a match against a committed file snapshot at `./__file_snapshots__/matrix-<planet>.svg` (using the test-context `expect` for correct per-case snapshot resolution). All pre-existing assertions in the file (two-call equality, CLI subprocess parity, interleaved-call independence, both worked-example snapshots) are unchanged.
- Added three standalone assertions: (1) distinctness — mapping all seven planets to their SVG for `"I WILL SUCCEED"` yields a `Set` of size 7; (2) degenerate-case determinism — a one-kept-letter statement (`"A B"`) is byte-identical across two calls on both saturn and moon; (3) key-order stability — `Object.keys(working)` begins with the unchanged twelve-key Phase 1 order and ends with `keptTrail`, `repeats`.
- Seven new snapshot files committed under `test/__file_snapshots__/matrix-*.svg`, each inspected before commit and confirmed to carry the correct `sigil--<planet>` class and `viewBox="0 0 100 100"`.
- `test/__file_snapshots__/worked-example.svg` confirmed byte-unchanged (`git diff --exit-code` exits 0).

## Deviations from Plan

None requiring a code fix — all three tasks' behavior was either already fully implemented by Plan 02-01 (letter-handling logic) or implemented exactly as the plan's action text specified (error enrichment, determinism matrix). Two interpretive clarifications are recorded above under Decisions: the 'AAA' test case's actual breakdown (all-vowel, not vowel+repeat) and the choice to limit degenerate-case determinism testing to saturn/moon per the task's own "at least" phrasing.

## Known Stubs

None — every must-have truth and acceptance criterion in the plan is implemented and covered by a passing test.

## Threat Flags

None — no new network endpoints, auth paths, or trust-boundary changes. `SigilError.details.struck` (T-02-06) echoes only the caller's own struck characters back to that same caller via a thrown exception, never to a log file or network sink — matching the plan's disposition. No new regex was added (T-02-08 unaffected). No new packages were installed (T-02-SC).

## Verification

- `npx vitest run` — 170/170 tests pass (up from 160 pre-plan, 125 pre-phase).
- `npm run typecheck` — exits 0.
- `npm run lint` — exits 0.
- `node bin/sigil-spinner.js 'AEIOU' --planet saturn` — exits 3, stderr: `E_EMPTY_SEQUENCE: Statement reduced to zero kept letters: all 5 characters struck (5 vowels).`
- `node bin/sigil-spinner.js 'B' --planet moon` — exits 0, writes a valid single-node SVG to stdout.
- `generateSigil('B', planet)` returns a valid sigil with `lettersKept: ['B']` on all seven planets (manually verified beyond the plan's saturn/moon-only test requirement).
- `README.md` contains `## Letter Handling Rules`, `ẞ` (transliteration table), `sigil-loop`, and `E_EMPTY_SEQUENCE`.
- `git diff --stat bin/sigil-spinner.js` — empty, confirming the CLI was untouched by Task 1.
- `test/__file_snapshots__/worked-example.svg` — byte-unchanged.

## Self-Check: PASSED

- `test/text/fold.test.js` — FOUND
- `test/__file_snapshots__/matrix-saturn.svg` through `matrix-moon.svg` (all seven) — FOUND
- Commit `3773eea` — FOUND in `git log --oneline`
- Commit `2a993a9` — FOUND in `git log --oneline`
- Commit `a968dd4` — FOUND in `git log --oneline`
- All 170 tests passing, typecheck and lint both exit 0 — confirmed by direct re-run above.
