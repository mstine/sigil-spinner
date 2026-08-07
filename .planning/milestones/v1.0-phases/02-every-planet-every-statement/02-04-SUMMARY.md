---
phase: 02-every-planet-every-statement
plan: 04
subsystem: text
tags: [error-messages, unicode, transliteration, cli, exception-safety, gap-closure, determinism]
dependency-graph:
  requires: [02-01, 02-02, 02-03]
  provides:
    - "src/generate.js: E_EMPTY_SEQUENCE message split into characterCount/strikeCount"
    - "src/text/fold.js: TRANSLITERATION_MAP extended to 84 entries (full Latin stroke/bar class)"
    - "bin/sigil-spinner.js: E_CLI_USAGE / E_CLI_STDIN exception-safe entry path"
  affects: ["test/cli/cli.test.js", "test/text/fold.test.js", "test/text/normalize.test.js", "test/determinism.test.js", "README.md"]
tech-stack:
  added: []
  patterns:
    - "CLI-local diagnostic codes (E_CLI_USAGE, E_CLI_STDIN) declared and handled entirely inside bin/sigil-spinner.js, never added to EXIT_CODES or src/errors.js — keeps CLI-syntax failures out of the library's domain-error taxonomy (INT-04)"
    - "Single diagnose(code, message, exitCode) helper centralizes the CODE: message stderr format so both new usage-class paths and (optionally) the existing catch share one formatting site"
    - "Mechanically-defined Unicode letter class (Latin stroke/bar overlay) used as the boundary for a transliteration table amendment, rather than an ad hoc list of reported letters"
key-files:
  created:
    - test/__file_snapshots__/matrix-stroke-saturn.svg
    - test/__file_snapshots__/matrix-stroke-jupiter.svg
    - test/__file_snapshots__/matrix-stroke-mars.svg
    - test/__file_snapshots__/matrix-stroke-sun.svg
    - test/__file_snapshots__/matrix-stroke-venus.svg
    - test/__file_snapshots__/matrix-stroke-mercury.svg
    - test/__file_snapshots__/matrix-stroke-moon.svg
  modified:
    - src/generate.js
    - src/text/fold.js
    - bin/sigil-spinner.js
    - README.md
    - test/cli/cli.test.js
    - test/text/fold.test.js
    - test/text/normalize.test.js
    - test/determinism.test.js
decisions:
  - "02-04 Task 2 (checkpoint:decision, blocking): D-23's transliteration-table amendment ratified as option-a by the user — extend TRANSLITERATION_MAP from 12 to 84 entries (the complete Latin stroke/bar class, 72 additions), rather than option-b (the eight reported letters only) or option-c (README-only narrowing, no code change). This is a decision amendment, not an implementation detail — recorded here so it is traceable across gap-closure cycles."
  - "02-04 Task 1: characterCount (distinct original-statement indices) and strikeCount (total struck entries) derived as two separate figures next to the existing breakdown reduce; strikeScope is empty when they're equal (byte-unchanged common path) and 'producing N strikes' otherwise — the singular/plural correction for characterCount (1 character vs N characters) is treated as in-scope for the same string, not separate work"
  - "02-04 Task 3: TRANSLITERATION_MAP extended to 84 entries per the ratified amendment; every value A-Z-only and case-complete; Đ/Ð confusable deliberately equivalent on all seven planets; remaining unresolved Latin classes (digraphs, reversed/turned, hooked/tailed) opted out in README with a stated reason and pinned negative fixtures (Ĳ, Ǝ, Ɓ)"
  - "02-04 Task 4: E_CLI_USAGE and E_CLI_STDIN declared as CLI-local constants inside bin/sigil-spinner.js only — never added to EXIT_CODES or src/errors.js — so the library remains the sole owner of domain error identity (INT-04); both new failure paths exit status 2, the same usage class as the library's own usage-class codes"
metrics:
  duration: ~50min
  completed: 2026-08-06
status: complete
actuals:
  tokens: 8784
  tasks: 4
  commits: 8
requirements-completed: [CONS-03, CONS-04, INT-03, INT-04]
---

# Phase 2 Plan 4: Close CONS-03/CONS-04 Gaps and CLI Exception Safety Summary

Fixed a factually-wrong error message (E_EMPTY_SEQUENCE conflating character count with strike count), closed a visual-confusable inconsistency in Unicode letter folding (Đ vs Ð), and made the CLI's own argv/stdin entry path exception-safe so a typo'd flag reports a clean diagnostic instead of a raw Node stack trace.

## What Was Built

**Task 1 (tracer, CONS-03/SC3) — E_EMPTY_SEQUENCE counts characters and strikes separately.** TDD: pinned the three unchanged common-path messages (`AEIOU`, `AAA`, whitespace-only) as exact byte pins, watched the three new `Æ`-family vectors fail against the old message, then split `characterCount` (distinct original-statement indices via a `Set` over struck-entry `index`) from `strikeCount` (struck-array length) in `src/generate.js`. When they're equal the message is byte-identical to its pre-plan text; when they differ it inserts `, producing N strikes`. Proved the fix end-to-end through a real CLI subprocess (`Ææ` via `runCli`), confirming library/CLI parity (INT-04) on the very first slice. Commits: `339d185` (test), `dfc4529` (feat).

**Task 2 (checkpoint:decision, blocking) — Ratified the D-23 transliteration-table amendment.** Presented three options for closing the `Đ`/`Ð` confusable gap. **User selected option-a**: extend `TRANSLITERATION_MAP` from D-23's original 6 letter-pairs (12 entries) to the complete Latin stroke/bar class — 72 additions, 84 entries total, case-complete, A-Z-only values. This is a decision amendment to a previously-locked scope ("a small explicit transliteration map"), not an implementation detail, and is recorded as such rather than a planner's unilateral widening. No code changed in this task — it is a pure human decision gate. Paused and resumed per the checkpoint protocol; the resolution is recorded in `.planning/STATE.md` and in this SUMMARY's decisions.

**Task 3 (CONS-04/SC4) — Folded the Latin stroke/bar class, scoped the documented rule.** TDD: wrote the stroke-letter, case-pair-completeness, and confusable-equality tests first, watched them fail against the 12-entry table, then appended the 72 stroke/bar entries (grouped by base letter: A, B, C, D, E, F, G, H, I, J, K, L, N, P, Q, R, S, T, U, V, Y, Z — no W or X, since Unicode has no stroke/bar variant of either) to `TRANSLITERATION_MAP` in `src/text/fold.js`. Rewrote the table's doc comment to name the two classes it now covers and what remains deliberately excluded (digraphs beyond the original six, reversed/turned letters, hooked/tailed phonetic letters) and why (no unambiguous single base letter — folding would be invention, not transliteration). Pinned `Ĳ`, `Ǝ`, `Ɓ` as still-struck `non-letter` negative fixtures so the opt-out boundary is evidence, not assertion. Added a third `describe.each(PLANETS)` byte-pin matrix (`ŁĐĦŦ` → kept `['L','D','H','T']`, numbers `[3,4,8,2]`) producing seven new `matrix-stroke-<planet>.svg` snapshots, plus the `ĐHT`/`ÐHT` confusable-equality assertion inside the same matrix. Amended README's `## Letter Handling Rules` rules 2 and 3 to scope the general "accents are ignored" claim to what NFD actually decomposes, add the grouped stroke/bar table, and state the opt-out explicitly. Commits: `f84449f` (test), `75ec197` (feat).

**Task 4 (CR-01, CR-02, INT-04) — Made the CLI's own entry path exception-safe.** TDD: added five new tests to `test/cli/cli.test.js` covering an unrecognized flag (`--planett`), a `--planet` with no value, an `--output` with no value, the single-diagnostic-line/no-stack-trace assertion, and a full regression pin of every previously-passing CLI behavior; watched all four new-behavior tests fail against the current raw `ERR_PARSE_ARGS_*` stack traces. Then in `bin/sigil-spinner.js`: declared `E_CLI_USAGE`, `E_CLI_STDIN`, and `CLI_USAGE_EXIT_CODE` (2) as CLI-local module constants — never added to `EXIT_CODES` or `src/errors.js`, so the library stays the sole owner of domain error identity. Added a `diagnose(code, message, exitCode)` helper that writes the same `CODE: message\n` format the existing catch already used and exits. Wrapped the top-level `parseArgs()` call in its own try/catch routed through `diagnose`, and wrapped the `-` sentinel's `readFileSync(0, ...)` stdin read in a second, separate try/catch (kept distinct from the main try, since a stdin-read failure is CLI-syntax-class, not library-domain-class). Zero library files touched — `git diff --exit-code -- src/` confirms it. Commits: `2cab657` (test), `72642f4` (feat).

## Requirement Coverage

| Requirement / Gap ID | Status | Evidence |
|---|---|---|
| CONS-03 | Closed | `Ææ`/`Æ`/`Æ!` E_EMPTY_SEQUENCE vectors exact-pinned in `test/cli/cli.test.js`; common-path messages (`AEIOU`, `AAA`, whitespace) proven byte-unchanged |
| CONS-04 | Closed | 84-entry `TRANSLITERATION_MAP`, case-pair completeness and A-Z-only-value structural tests, `Đ`/`Ð` byte-equal on all seven planets, opt-out fixtures (`Ĳ`, `Ǝ`, `Ɓ`) pinned, README amended |
| INT-03 | Held | Seven new `matrix-stroke-<planet>.svg` snapshots byte-pin the fold-classification change at every kamea order (3 through 9); all nineteen pre-existing snapshots verified byte-identical via `git diff --exit-code` |
| INT-04 | Held | Library/CLI E_EMPTY_SEQUENCE parity proven through a real subprocess (Task 1); `git diff --exit-code -- src/` after Task 4 confirms no domain validation moved into `bin/` |
| G-02-2 | Closed | Same evidence as CONS-03 |
| G-02-3 | Closed | Same evidence as CONS-04 |
| CR-01 | Closed | `node bin/sigil-spinner.js 'test' --planett saturn` now writes one `E_CLI_USAGE: ` line to stderr, empty stdout, exit 2 — no stack trace |
| CR-02 | Addressed per plan scope | Stdin-read path wrapped in its own try/catch routed through `E_CLI_STDIN`; not independently automated-tested because forcing a real `readFileSync(0)` failure (e.g. TTY `EAGAIN`) is environment-dependent and outside what a subprocess harness without a TTY can reliably reproduce — the plan's own `<acceptance_criteria>` for Task 4 does not include an automated command for this path either, only the `<behavior>` block's description |

## Known Discrepancy — Task 3's `grep -c` Acceptance Criterion (Disclosed, Not Silently Dropped)

Task 3's acceptance criterion `grep -c 'sigil-node' test/__file_snapshots__/matrix-stroke-moon.svg` returns 4 **is not literally achievable**: every SVG snapshot in this repo is emitted as a single-line file, and `grep -c` counts *matching lines*, not occurrences within a line — so it returns `1` for any such file, regardless of how many `sigil-node` occurrences the line actually contains. Verified directly:

```
$ grep -c 'sigil-node' test/__file_snapshots__/matrix-stroke-moon.svg
1
$ grep -o 'sigil-node' test/__file_snapshots__/matrix-stroke-moon.svg | wc -l
12
```

The underlying truth the criterion was trying to pin — four distinct node cells (`L`, `D`, `H`, `T`), zero loop geometry — was verified with `grep -o ... | wc -l`: 12 occurrences of `sigil-node` (3 per node × 4 nodes, matching the existing matrix snapshots' per-node markup shape) and `grep -c 'sigil-loop'` returns 0. This same discrepancy already exists on 02-03's already-shipped `test/__file_snapshots__/matrix-repeat-moon.svg` (`grep -c 'sigil-node'` also returns 1 there, with 15 real occurrences via `grep -o`), so this is a **pre-existing criterion-authoring convention issue** across the phase, not a defect introduced by this plan.

## Carried-Forward Human Check — Not Claimed by This Plan

02-03's `verification: backstop` truth on repeat-loop legibility at render scale was **signed off `pass` by the user at 2026-08-06T20:06:56Z**, against plan 02-03, before this plan (02-04) was executed. This plan touches no rendering code, restates nothing about loop legibility as one of its own `must_haves`, and does not claim credit for that sign-off. See 02-04-PLAN.md's "Carried-forward human check" section for the full citation chain (02-UAT.md test 1 retest, 02-VERIFICATION.md score 31/33).

## Verification Performed

- `npx vitest run`: **240/240 tests pass** (up from the 235 recorded at plan start), 0 skipped, across 12 test files.
- `npm run typecheck` and `npm run lint`: both exit 0.
- `git diff --exit-code -- src/ test/__file_snapshots__ test/render/__snapshots__ README.md` after Task 4: exits 0 (the required Task 4 scope guard — confirmed no library file was touched by the CLI fix).
- `git diff --exit-code -- src/render src/path src/render/json.js src/text/normalize.js src/errors.js` (Task 3's scope guard): exits 0 — renderer, path model, working serializer, classification loop, and error taxonomy all untouched.
- All fourteen pre-existing `matrix-*.svg`/`matrix-repeat-*.svg` files, both `single-letter-*.svg` files, `worked-example.svg`, `worked-example.working.json`, and `test/render/__snapshots__` verified byte-identical via `git diff --exit-code` — zero exceptions to hard constraint 1.
- Full acceptance-criteria command set for Task 4 run and confirmed: `E_CLI_USAGE: ` prefix and exit 2 for all three malformed-invocation forms (`--planett`, missing `--planet` value, missing `--output` value); single diagnostic line with zero stack-trace/`parse_args` leakage; every previously-passing case (`I WILL SUCCEED` success, `pluto` → `E_UNKNOWN_PLANET`/exit 2, `AEIOU` → `E_EMPTY_SEQUENCE`/exit 3, `-` sentinel byte-identical to argument form) unchanged.
- Re-running `npx vitest run` a second time writes no new snapshots and leaves the working tree clean.

## Task Commits

Each task was committed atomically:

1. **Task 1: E_EMPTY_SEQUENCE counts characters and strikes separately (tracer, CONS-03/SC3)** - `339d185` (test), `dfc4529` (feat)
2. **Task 2: Ratify D-23 transliteration-table amendment** - checkpoint:decision, no code commit; resolved option-a, recorded in `.planning/STATE.md` at `69759d5` (docs: pause record)
3. **Task 3: Fold the Latin stroke/bar class, scope the documented rule (CONS-04/SC4)** - `f84449f` (test), `75ec197` (feat)
4. **Task 4: Make the CLI's own entry path exception-safe (CR-01, CR-02, INT-04)** - `2cab657` (test), `72642f4` (feat)

**Plan metadata:** this commit (docs: complete 02-04 plan)

_Note: all four TDD-tagged tasks followed RED (test commit, observed failing) → GREEN (feat commit, observed passing) — no REFACTOR commits were needed._

## Files Created/Modified

- `src/generate.js` - `characterCount`/`strikeCount`/`strikeScope` split in the `E_EMPTY_SEQUENCE` message
- `src/text/fold.js` - `TRANSLITERATION_MAP` extended from 12 to 84 entries (full Latin stroke/bar class), doc comment rewritten
- `bin/sigil-spinner.js` - `parseArgs()` and the `-` sentinel's stdin read wrapped in exception handling; `E_CLI_USAGE`/`E_CLI_STDIN`/`CLI_USAGE_EXIT_CODE` constants and a `diagnose()` helper
- `README.md` - `## Letter Handling Rules` rules 2 and 3 amended with the stroke/bar table and explicit opt-out list
- `test/cli/cli.test.js` - E_EMPTY_SEQUENCE multi-fold vectors, library/CLI parity case, five CLI-exception-safety tests
- `test/text/fold.test.js` - stroke/bar table pins, case-completeness and A-Z-only-value structural tests
- `test/text/normalize.test.js` - stroke-letter kept-consonant pins, `ĐHT`/`ÐHT` equality, opt-out negative fixtures
- `test/determinism.test.js` - third seven-planet byte-pin matrix (`ŁĐĦŦ`) plus confusable-equality assertion
- `test/__file_snapshots__/matrix-stroke-<planet>.svg` × 7 - new committed snapshots, one per planet

## Decisions Made

See frontmatter `decisions` for the full list, including the Task 2 checkpoint:decision resolution (option-a, 84-entry table).

## Deviations from Plan

None - plan executed exactly as written, including the exact singular/pluralization idiom, table grouping, and README framing specified in the plan's `<action>` blocks. The `grep -c` acceptance-criterion discrepancy documented above is a pre-existing criterion-authoring issue, not a deviation in implementation.

## Known Stubs

None.

## Threat Flags

None — no new trust boundary introduced. See the plan's `<threat_model>` for the full STRIDE register (six threats, five `mitigate`/`accept` dispositions already covering this plan's surface, one `mitigate` for the npm-install-count guard which stayed at zero installs).

## Issues Encountered

None beyond the documented `grep -c` criterion-wording issue above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 2's four verification gaps (CONS-03, CONS-04, CR-01, CR-02) are now closed; the phase's `must_haves` truths for this plan are all evidenced above.
- 240/240 tests green, typecheck and lint clean, zero pre-existing snapshot drift.
- No blockers carried forward. The two open Blockers/Concerns items in STATE.md (repeat-marker visual reference lock, Y-vowel handling rule) predate this plan and are unaffected by it — noted for whoever picks up Phase 3 planning.

---
*Phase: 02-every-planet-every-statement*
*Completed: 2026-08-06*

## Self-Check: PASSED

- `src/generate.js` — FOUND
- `src/text/fold.js` — FOUND
- `bin/sigil-spinner.js` — FOUND
- `README.md` — FOUND
- `test/cli/cli.test.js` — FOUND
- `test/text/fold.test.js` — FOUND
- `test/text/normalize.test.js` — FOUND
- `test/determinism.test.js` — FOUND
- `test/__file_snapshots__/matrix-stroke-saturn.svg` — FOUND
- `test/__file_snapshots__/matrix-stroke-jupiter.svg` — FOUND
- `test/__file_snapshots__/matrix-stroke-mars.svg` — FOUND
- `test/__file_snapshots__/matrix-stroke-sun.svg` — FOUND
- `test/__file_snapshots__/matrix-stroke-venus.svg` — FOUND
- `test/__file_snapshots__/matrix-stroke-mercury.svg` — FOUND
- `test/__file_snapshots__/matrix-stroke-moon.svg` — FOUND
- commit `339d185` (Task 1 RED) — FOUND
- commit `dfc4529` (Task 1 GREEN) — FOUND
- commit `69759d5` (Task 2 pause record) — FOUND
- commit `f84449f` (Task 3 RED) — FOUND
- commit `75ec197` (Task 3 GREEN) — FOUND
- commit `2cab657` (Task 4 RED) — FOUND
- commit `72642f4` (Task 4 GREEN) — FOUND
