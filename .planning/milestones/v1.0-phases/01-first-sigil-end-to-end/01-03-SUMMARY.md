---
phase: 01-first-sigil-end-to-end
plan: 03
subsystem: core-pipeline
tags: [node, esm, json, cli, parseargs, determinism, vitest-file-snapshot]

# Dependency graph
requires:
  - phase: 01-02
    provides: "generateSigil() orchestrator, SigilError taxonomy, and the full text/data/path/render pipeline returning { svg, working }"
provides:
  - "src/render/json.js — toWorking(result), a thin D-14 serializer computing nothing, reading cell x/y straight off the PathModel points the SVG renderer consumed"
  - "src/generate.js — library-side statement/planet validation (E_MISSING_STATEMENT, E_MISSING_PLANET) before any pipeline work, and canonical-lowercase planet resolution threaded through cellForNumber/buildPath (not just the JSON working)"
  - "bin/sigil-spinner.js — full CLI surface: positional statement, stdin via '-' (D-09), --json/--output artifact selection (D-10/D-11), code-to-exit-status map distinguishing usage-class (2) from derivation-class (3) errors (D-15)"
  - "test/determinism.test.js + two committed file snapshots — byte-equality assertions for the tool's core value proposition"
  - "README.md — Usage, Determinism, Worked Example, Errors and Exit Codes, Data Handling, and Phase 1 scope-limit sections"
affects: []

# Actuals (#2632)
actuals:
  tokens: 9850
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "JSON-working-as-thin-serializer: render/json.js computes nothing — every field is a direct read or re-pairing of values generate.js already retained, enforced by a grep-checked absence of Math./cellCenter/division in the file"
    - "Canonical-casing resolved once: generate.js lowercases the planet argument a single time and threads that one value through cellForNumber/buildPath/working, rather than re-lowercasing at each call site — this is what keeps the SVG's sigil--<planet> class stable under D-12's case-insensitivity guarantee"
    - "CLI exit-status-as-contract: a code-to-exit-status map (usage-class errors exit 2, derivation-class errors exit 3) lets a calling script branch on exit status alone, without parsing stderr text"
    - "Byte-equality determinism testing via Vitest's toMatchFileSnapshot — two committed file snapshots (worked-example SVG, worked-example working) fail loudly on any drift in coordinate rounding, attribute ordering, or field ordering, rather than relying on 'ran it twice, looked the same'"

key-files:
  created:
    - src/render/json.js
    - test/render/json.test.js
    - test/cli/cli.test.js
    - test/determinism.test.js
    - test/__file_snapshots__/worked-example.svg
    - test/__file_snapshots__/worked-example.working.json
  modified:
    - src/generate.js
    - src/errors.js
    - src/index.js
    - bin/sigil-spinner.js
    - README.md

key-decisions:
  - "Working field names (executor discretion per CONTEXT.md): statement, planet, kameaSet, gridSize, lettersKept, lettersStruck, letterNumbers, numbers, cells, segments, start, end — chosen to read naturally alongside the D-14 content list without inventing new nesting."
  - "kameaSet in the working is always DEFAULT_KAMEA_SET ('agrippa') for this phase — options.set is not yet wired through generateSigil's public surface (only one set ships in Phase 1, per D-02); a future phase adding a second set will thread the caller's choice through generate.js rather than changing the working's shape."
  - "CLI exit-status map: usage-class codes (E_MISSING_STATEMENT, E_MISSING_PLANET, E_UNKNOWN_PLANET) exit 2; the derivation-class code (E_EMPTY_SEQUENCE) exits 3; any other error exits 1 — chosen so a script can branch on 'did I use the tool wrong' vs. 'did my input degenerate' without parsing stderr."
  - "--output writes are documented as non-atomic in README rather than made atomic via a temp-file-plus-rename — the backstop truth item in the plan's threat model required documentation either way, and no test could reach human_needed status with a documented answer."

patterns-established:
  - "Pattern: no module other than render/json.js may claim to serialize the working, and render/json.js itself may perform zero coordinate arithmetic — enforced by the plan's grep acceptance criterion and now a durable convention for any future working-schema field."

requirements-completed: [OUT-01, INT-01, INT-02]

coverage:
  - id: D1
    description: "One generateSigil() call returns both the SVG string and the JSON working, with the working's cell coordinates provably identical to the ones the SVG path was drawn from (no independent recomputation)"
    requirement: "OUT-01"
    verification:
      - kind: unit
        ref: "test/render/json.test.js#reports each cell's x and y strictly equal to the corresponding PathModel point's x and y"
        status: pass
      - kind: unit
        ref: "test/render/json.test.js#matches the worked-example working snapshot"
        status: pass
    human_judgment: false
  - id: D2
    description: "The working carries the full D-14 field set (statement, kept/struck letters with reasons, letter-number pairs, number sequence, planet, kamea set, grid size, cells as row/col AND x/y, path segments/start/end) so a teaching page can narrate the whole derivation"
    requirement: "OUT-01"
    verification:
      - kind: unit
        ref: "test/render/json.test.js#gives lettersKept, letterNumbers, numbers, and cells identical length (5)"
        status: pass
      - kind: unit
        ref: "test/render/json.test.js#pairs each kept letter with its Pythagorean digit"
        status: pass
    human_judgment: false
  - id: D3
    description: "generateSigil holds no module-level mutable state — interleaved calls with different inputs return the same results they would return standalone (INT-02 concurrency edge)"
    requirement: "INT-02"
    verification:
      - kind: unit
        ref: "test/determinism.test.js#returns identical results for interleaved calls as for standalone calls (no shared mutable state, INT-02)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The CLI accepts a positional statement or stdin via '-', selects its artifact with --json, redirects with --output leaving stdout empty, and requires --planet case-insensitively with library-side validation"
    requirement: "INT-02"
    verification:
      - kind: integration
        ref: "test/cli/cli.test.js#produces the same SVG for a statement piped via a dash positional as for an argument"
        status: pass
      - kind: integration
        ref: "test/cli/cli.test.js#writes the artifact to --output and leaves stdout empty"
        status: pass
      - kind: integration
        ref: "test/cli/cli.test.js#matches --planet case-insensitively, producing identical stdout for SATURN and saturn"
        status: pass
    human_judgment: false
  - id: D5
    description: "--planet is required with no default; an unknown or missing planet produces a SigilError with a stable code, a stderr message listing the seven valid names, a nonzero exit, and empty stdout; validation lives in the library so a programmatic caller gets identical guarantees"
    requirement: "INT-01"
    verification:
      - kind: integration
        ref: "test/cli/cli.test.js#exits nonzero with empty stdout and a stderr message naming all seven planets for an unknown planet"
        status: pass
      - kind: integration
        ref: "test/cli/cli.test.js#exits nonzero with empty stdout when --planet is missing"
        status: pass
      - kind: other
        ref: "grep -cE \"saturn.*jupiter|'saturn'\" bin/sigil-spinner.js reports 0"
        status: pass
    human_judgment: false
  - id: D6
    description: "Running the same statement + planet + options twice produces byte-identical SVG and byte-identical JSON, asserted with byte-equality checks and committed file snapshots, not eyeballed sameness"
    requirement: "OUT-01"
    verification:
      - kind: unit
        ref: "test/determinism.test.js#produces strictly equal svg strings across two identical calls"
        status: pass
      - kind: unit
        ref: "test/determinism.test.js#produces the same svg through the library call as through the CLI subprocess"
        status: pass
      - kind: other
        ref: "test/__file_snapshots__/worked-example.svg and worked-example.working.json match on a second npm test run"
        status: pass
    human_judgment: false
  - id: D7
    description: "README.md documents the determinism guarantee, the worked example derivation, the error code to exit status map, and that working.statement is untrusted input a consumer must HTML-escape before display"
    requirement: "OUT-01"
    verification:
      - kind: other
        ref: "grep -ci 'byte-identical' README.md (2), grep -c 'WLSCD' README.md (1), grep -c 'E_UNKNOWN_PLANET|E_EMPTY_SEQUENCE' README.md (2 each), grep -ci 'escape' README.md (4)"
        status: pass
    human_judgment: false

duration: ~20min
completed: 2026-08-04
status: complete
---

# Phase 1 Plan 3: JSON Working, Full CLI Surface, and the Determinism Contract Summary

**`generateSigil()` now returns a complete D-14 working alongside the SVG; the CLI reads a positional statement or stdin, selects SVG/JSON with `--json`, redirects with `--output`, validates `--planet` in the library with a code-to-exit-status map, and byte-equality tests plus two committed file snapshots lock the tool's determinism contract.**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-08-04T22:12:00Z (approximate — session began reading context/plan files before the first commit)
- **Completed:** 2026-08-04T22:16:25Z
- **Tasks:** 3
- **Files modified:** 11 (5 created source/config, 6 created/modified test artifacts, plus README.md)

## Accomplishments

- `src/render/json.js` exports `toWorking(result)` — a thin serializer computing nothing itself (`grep -cE '(Math\.|cellCenter|/ *[0-9])' src/render/json.js` reports 0). Cell x/y values are read straight off the PathModel's points, so the JSON working and the SVG can never disagree about geometry.
- `generateSigil()` guards `statement` and `planet` before any pipeline work, throwing `E_MISSING_STATEMENT`/`E_MISSING_PLANET` — validation now lives entirely in the library, so a programmatic caller gets identical guarantees to the CLI (ARCHITECTURE.md Anti-Pattern 3).
- `bin/sigil-spinner.js` grew from a Saturn-only tracer stub to the full D-09/D-10/D-11/D-12 surface: positional statement or stdin-via-`-`, `--json` artifact selection, `--output <file>` with empty stdout, and a `SigilError.code` → exit-status map (usage-class errors exit 2, `E_EMPTY_SEQUENCE` exits 3).
- `test/determinism.test.js` asserts byte equality — not "ran it twice, looked the same" — across repeated library calls, library-vs-CLI-subprocess parity, and ten interleaved calls across two statements, plus two committed file snapshots of the worked-example SVG and working that will fail loudly on any future drift.
- `test/cli/cli.test.js` drives the binary as a real subprocess (never by importing it) across all nine required behaviors: stdout purity, `--json`, stdin composition, `--output`, case-insensitive `--planet`, and all three error paths.
- README.md now states the determinism contract, reproduces the "I WILL SUCCEED" worked example step by step, documents every error code's exit status, and states the untrusted-statement HTML-escape requirement plus Phase 1's known scope limits.

## Task Commits

Each task was committed atomically:

1. **Task 1: The JSON working — the full derivation trail (OUT-01, D-14)** - `6c7d8d6` (feat)
2. **Task 2: Full CLI surface — stdin, --json, --output, and library-side validation** - `4a315c3` (feat)
3. **Task 3: Determinism suite and README — state the contract the tool is bought for** - `984afef` (docs)

**Plan metadata:** (this commit) `docs(01-03): complete JSON Working, Full CLI Surface, and Determinism Contract plan`

## Files Created/Modified

- `src/render/json.js` - `toWorking(result)`, the D-14 JSON working serializer; computes nothing, reads only
- `src/generate.js` - statement/planet guards (`E_MISSING_STATEMENT`/`E_MISSING_PLANET`), canonical-lowercase planet resolved once and threaded through `cellForNumber`/`buildPath`/the working, calls `toWorking` instead of hand-assembling the working object
- `src/errors.js` - adds `E_MISSING_STATEMENT`/`E_MISSING_PLANET` to the D-15 taxonomy
- `bin/sigil-spinner.js` - full flag surface (`--planet`, `--json`, `--output`), stdin-via-`-`, code-to-exit-status map
- `test/render/json.test.js` - unit tests for `toWorking` against the worked example, plus a snapshot
- `test/cli/cli.test.js` - subprocess-level CLI tests for every required behavior
- `test/determinism.test.js` - byte-equality determinism assertions + two `toMatchFileSnapshot` cases
- `test/__file_snapshots__/worked-example.svg`, `worked-example.working.json` - committed determinism-lock snapshots
- `README.md` - Usage, Determinism, Worked Example, Errors and Exit Codes, Data Handling, and Phase 1 scope-limit sections

## Decisions Made

- **Working field names:** `statement, planet, kameaSet, gridSize, lettersKept, lettersStruck, letterNumbers, numbers, cells, segments, start, end` — executor discretion per CONTEXT.md, chosen to read naturally next to the D-14 content list.
- **`kameaSet` is always `'agrippa'` in Phase 1's working** — `options.set` isn't wired through `generateSigil`'s public surface yet, since only one kamea set ships this phase (D-02). A future phase adding a second set threads the caller's choice through `generate.js` without changing the working's shape.
- **CLI exit-status map:** usage-class codes (`E_MISSING_STATEMENT`, `E_MISSING_PLANET`, `E_UNKNOWN_PLANET`) exit `2`; the derivation-class code (`E_EMPTY_SEQUENCE`) exits `3`; anything else exits `1` — lets a calling script branch on exit status alone.
- **`--output`'s write is documented as non-atomic** rather than made atomic via temp-file-plus-rename — the plan's threat model carried this as a backstop truth requiring documentation either way; documenting it in README's Usage section resolves that requirement without adding write-path complexity this phase doesn't need.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed the SVG's `sigil--<planet>` class leaking the caller's raw casing**
- **Found during:** Task 2 (writing the case-insensitive `--planet SATURN` vs `--planet saturn` CLI test)
- **Issue:** `generate.js` passed the caller's raw (possibly mixed-case) `planet` argument straight into `buildPath(numbers, cells, planet, order)`, which set `PathModel.planet` — the field `render/svg.js` reads to build the `sigil sigil--<planet>` class. So `--planet SATURN` rendered `class="sigil sigil--SATURN"` instead of the canonical `sigil--saturn`, silently breaking D-08's per-planet CSS selector contract and D-12's case-insensitivity guarantee for anything downstream of planet resolution (the JSON working's `planet` field was already correctly lowercased — only the SVG class leaked the raw casing).
- **Fix:** Resolved `planet.toLowerCase()` once into a `canonicalPlanet` local and used that single value for `cellForNumber`, `buildPath`, and the working — matching the pattern already used for `working.planet`.
- **Files modified:** `src/generate.js`
- **Verification:** `test/cli/cli.test.js#matches --planet case-insensitively, producing identical stdout for SATURN and saturn` passes; full `npm test`/`typecheck`/`lint` all exit 0.
- **Committed in:** `4a315c3` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — bug, found via the CLI test I wrote for the acceptance criterion the plan already specified)
**Impact on plan:** No scope creep — this was a correctness bug in code written earlier in this same plan (Task 1), caught and fixed before the CLI feature it affected was committed.

## Issues Encountered

A `tsc --checkJs` error initially flagged `bin/sigil-spinner.js`'s `generateSigil(statement, planetArg)` call because `planetArg` was typed `string | undefined` while `generateSigil`'s JSDoc signature requires `string`. Resolved by casting `planetArg` to `string` (matching the pre-existing convention already used in this file for `values.planet`) since the runtime guard for a missing/empty planet lives in `generateSigil` itself (`E_MISSING_PLANET`), not in the CLI — this is a type-annotation fix only, no behavior change.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 1's full success criteria are met: one `generateSigil()` call returns the SVG and the complete D-14 working, provably describing the same sigil; the CLI accepts a positional statement or stdin, selects its artifact with `--json`, and redirects with `--output`; `--planet` is required, case-insensitive, validated in the library, and errors list all seven names; byte-identity is asserted, not assumed; and the README states the full contract.
- `render/json.js`'s "computes nothing" discipline and the `GeneratePipelineResult` shape it consumes give Phase 2/3 a stable seam — adding CONS-03/CONS-04 (degenerate-input polish, Y-rule), PATH-02 (repeat markers), or REND-05 (custom-property surface) means extending what `generate.js` retains, not touching the serializer's logic.
- No blockers carried forward. The KAMEA-03 provenance gap (candidate grids not yet checked against the physical Tyson/Llewellyn and Skinner sources) remains documented as a known limitation from Plan 01-01, unchanged by this plan.

---
*Phase: 01-first-sigil-end-to-end*
*Completed: 2026-08-04*

## Self-Check: PASSED

All created/modified files verified present on disk; all three task commit hashes (`6c7d8d6`, `4a315c3`, `984afef`) verified present in git history.
