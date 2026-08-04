---
phase: 01-first-sigil-end-to-end
plan: 01
subsystem: data
tags: [node, esm, vitest, typescript-checkjs, eslint, kamea, pythagorean-numerology]

# Dependency graph
requires: []
provides:
  - "ESM package skeleton (package.json, tsconfig.json, eslint.config.js, vitest.config.js) with zero runtime dependencies"
  - "src/data/kamea.js — KAMEA_SETS registry (agrippa set, seven planets) + cellForNumber/gridSize/planetNames/kameaGrid resolvers"
  - "src/data/pythagorean.js — toPythagoreanDigit, cycling-formula-derived letter encoder"
  - "D-04 kamea data lock decision recorded (approve-candidate) with honest provenance"
affects: [01-02, 01-03]

# Actuals (#2632)
actuals:
  tokens: 26500
  tasks: 4
  commits: 2

tech-stack:
  added: [vitest@4.1.10, typescript@7.0.2, "@types/node@26.1.2", eslint@10.8.0, prettier@3.9.6]
  patterns:
    - "Data-as-literal-lookup, never generated: kamea grids are hard-coded arrays, checked against exact-value tests, with magic-sum tests as a non-authoritative supplement"
    - "Derive-never-transcribe for numerology tables: toPythagoreanDigit computed from a cycling formula so it's structurally incapable of reproducing a Chaldean or legacy merged I/J-U/V table"
    - "Set-aware data registry (KAMEA_SETS keyed by set name) so a future verified kamea set can be added without reshaping the API"

key-files:
  created:
    - src/data/kamea.js
    - src/data/pythagorean.js
    - test/data/kamea.test.js
    - test/data/pythagorean.test.js
    - package.json
    - vitest.config.js
    - tsconfig.json
    - eslint.config.js
    - .prettierrc.json
    - .gitattributes
    - .gitignore
  modified:
    - README.md

key-decisions:
  - "D-04 resolved as approve-candidate: the seven-grid candidate set from 01-RESEARCH.md (magic-sum verified for all seven, Saturn fully and Jupiter partially cross-checked against a second web source) was signed off as-is rather than corrected against the physical Tyson/Llewellyn and Skinner sources named in D-01."
  - "Citations in src/data/kamea.js and README.md describe the verification that actually happened (single secondary web source + magic-sum checks + partial cross-check), not a claim of physical-book verification the data hasn't earned — per the plan's citation-integrity prohibition."
  - "Package legitimacy checkpoint (Task 1) approved all five dev dependencies as false-positive SUS (too-new heuristic on well-established, high-download packages)."

patterns-established:
  - "Pattern: no kamea grid literal may exist outside src/data/kamea.js — enforced by grep in acceptance criteria and honored by all test/data fixtures being explicit copies used only for exact-value comparison."
  - "Pattern: RangeError guards on all data-layer resolvers (unknown planet, unknown set, out-of-range digit) — never return undefined."

requirements-completed: [CONS-02, KAMEA-01, KAMEA-03]

coverage:
  - id: D1
    description: "Seven canonical kamea grids (agrippa set) locked as literal row-major arrays, resolvable via cellForNumber/gridSize/planetNames"
    requirement: "KAMEA-01"
    verification:
      - kind: unit
        ref: "test/data/kamea.test.js#kamea exact-value assertions"
        status: pass
      - kind: unit
        ref: "test/data/kamea.test.js#resolver behavior"
        status: pass
    human_judgment: false
  - id: D2
    description: "Kamea grid provenance honestly documented in code header and README, describing the verification actually performed (D-04 approve-candidate) rather than claiming unearned physical-source verification"
    requirement: "KAMEA-03"
    verification: []
    human_judgment: true
    rationale: "Whether the shipped grids truly match the physical Tyson/Llewellyn and Skinner sources cannot be settled by any automated check — it depends on human sign-off against physical books, which D-04's approve-candidate outcome explicitly deferred. No mechanical check can confirm a human read a book."
  - id: D3
    description: "Pythagorean cycling-formula encoder (toPythagoreanDigit) rejecting Chaldean and legacy merged I/J-U/V tables"
    requirement: "CONS-02"
    verification:
      - kind: unit
        ref: "test/data/pythagorean.test.js#toPythagoreanDigit"
        status: pass
    human_judgment: false
  - id: D4
    description: "ESM package scaffold runs test/typecheck/lint clean with zero runtime dependencies"
    verification:
      - kind: other
        ref: "npm test && npm run typecheck && npm run lint"
        status: pass
    human_judgment: false

duration: 45min
completed: 2026-08-04
status: complete
---

# Phase 1 Plan 1: Repository Scaffold and Kamea Data Lock Summary

**Seven-grid `agrippa` kamea set and a cycling-formula Pythagorean encoder, locked and tested against exact-value, magic-sum, and Chaldean-rejection suites.**

## Performance

- **Duration:** 45 min (across two sessions, resuming after the D-04 checkpoint)
- **Started:** 2026-08-04T19:53:30Z
- **Completed:** 2026-08-04T21:52:48Z
- **Tasks:** 4 (1 legitimacy checkpoint, 1 scaffold, 1 decision checkpoint, 1 data-lock implementation)
- **Files modified:** 13

## Accomplishments
- ESM package skeleton stood up: `node:util.parseArgs`-ready, zero runtime dependencies, `vitest`/`tsc --checkJs`/`eslint`/`prettier` all wired and passing.
- D-04 kamea data lock resolved (`approve-candidate`) with the honest provenance framing preserved in both code and README — no citation claims verification that didn't happen.
- `src/data/kamea.js` ships all seven classical kameas (Saturn 3×3 through Moon 9×9) under the `agrippa` set, with `cellForNumber`, `gridSize`, `planetNames`, and `kameaGrid` as the only route to kamea geometry.
- `src/data/pythagorean.js` derives `toPythagoreanDigit` from the A-Z cycling formula — structurally incapable of reproducing a Chaldean table or a legacy merged I/J-U/V table.
- 47 tests pass across exact-value, magic-sum-supplement, resolver-behavior, and Chaldean-rejection groups.

## Task Commits

Each task was committed atomically:

1. **Task 1: Package legitimacy confirmation before first install** - approval recorded (checkpoint, no commit — nothing built yet)
2. **Task 2: Repository scaffold — ESM package, test runner, type-check, lint** - `a50c88e` (feat)
3. **Task 3: Kamea data lock — sign off the seven grids (D-04)** - decision recorded (checkpoint, no commit — resolution consumed by Task 4)
4. **Task 4: Canonical data modules — seven locked kameas and the Pythagorean encoder** - `b452dd0` (feat)

**Plan metadata:** (this commit) `docs(01-01): complete Repository Scaffold and Kamea Data Lock plan`

## Files Created/Modified
- `package.json` - ESM manifest, bin entry, engines floor, test/typecheck/lint/format scripts, zero runtime deps
- `package-lock.json` - locked dev dependency tree
- `.gitattributes` - forces LF on `bin/*` to guard against CRLF-shebang breakage
- `.gitignore` - node_modules, coverage, editor cruft
- `vitest.config.js` - node environment, `test/**/*.test.js`
- `tsconfig.json` - `allowJs`/`checkJs`/`noEmit`, NodeNext, ES2022, strict, node types
- `eslint.config.js` - flat config for ESM sources
- `.prettierrc.json` - repo formatting defaults (source only, never applied to generated SVG)
- `src/data/kamea.js` - KAMEA_SETS registry + resolvers, module header documents D-01/D-04 provenance
- `src/data/pythagorean.js` - `toPythagoreanDigit`, cycling-formula derived
- `test/data/kamea.test.js` - exact-value, magic-sum, resolver-behavior test groups
- `test/data/pythagorean.test.js` - Chaldean-rejection vectors, boundary cases, full A-Z table check
- `README.md` - `## Kamea Source Lineage` section with matching citations

## Decisions Made
- **D-04 (approve-candidate):** Signed off the seven-grid candidate set from research as the canonical `agrippa` kamea set rather than requesting physical-book corrections or a Saturn-only partial lock. This unblocks the phase immediately; the citation in code/README states plainly what was and wasn't verified, and a future corrected set can be added as a new `KAMEA_SETS` key (D-02) without touching the API shape.
- **Package legitimacy (Task 1):** All five dev dependencies (`vitest`, `typescript`, `@types/node`, `eslint`, `prettier`) approved despite the `too-new` SUS flag — verified as false positives (hundred-million-plus weekly downloads, canonical repos, no deprecation).

## Deviations from Plan

None — plan executed exactly as written, including the honest-provenance instruction for Task 4's citations.

## Issues Encountered

`tsc --checkJs` initially flagged implicit-`any` errors on string-keyed object indexing in both `src/data/kamea.js` (the `KAMEA_SETS`/set-lookup helpers) and `test/data/kamea.test.js` (the local `SIGNED_OFF_GRIDS`/`MAGIC_CONSTANTS` fixtures and the `sumsToConstant` helper). Resolved by adding explicit JSDoc `@typedef`/`@type` annotations (`Record<string, number[][]>`, `Record<string, number>`) rather than loosening `tsconfig.json`'s strictness — this is a Rule 1 (auto-fix bug) fix scoped entirely to type annotations, no behavior change. Verified: `npm run typecheck` now exits 0 alongside `npm test` and `npm run lint`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `src/data/kamea.js` and `src/data/pythagorean.js` are the locked, tested foundation every downstream module (text normalization, path building, SVG/JSON rendering) will treat as a black-box source of truth.
- Plan 01-02 can proceed with `src/errors.js` (`SigilError` taxonomy, D-15) and the text/path/render pipeline without any data-layer ambiguity remaining.
- Carried forward: the KAMEA-03 provenance gap (candidate grids not yet checked against the physical Tyson/Llewellyn and Skinner sources) is documented as a known limitation in both `src/data/kamea.js` and `README.md`, not hidden — a future milestone can add a corrected set under a new `KAMEA_SETS` key if the physical-book check is ever performed.

---
*Phase: 01-first-sigil-end-to-end*
*Completed: 2026-08-04*
