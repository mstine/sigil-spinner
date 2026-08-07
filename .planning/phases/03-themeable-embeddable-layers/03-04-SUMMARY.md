---
phase: 03-themeable-embeddable-layers
plan: 04
subsystem: rendering
tags: [svg, css-custom-properties, xml-escaping, id-namespacing, vitest-guard-tests]

# Dependency graph
requires:
  - phase: 03-themeable-embeddable-layers
    provides: "03-01's option seam (resolveOptions()/KNOWN_OPTIONS table), 03-02's grid layer, and 03-03's curve rendering plus GEOMETRY_PRECISION/roundGeometry in coords.js — all extended here rather than re-derived"
provides:
  - "idPrefix end to end (REND-06, D-43/D-44) — the sole route to an emitted id, XML-escaped through the existing escapeXml before emission, validated in the library (E_INVALID_OPTION for wrong type or empty string)"
  - "The full REND-05/REND-06 guard suite (D-42) — test/render/theming.test.js, one generator yielding 128 renders across the 7-planet x curve x glyph x title x idPrefix cross-product plus repeat-carrying/B4/single-letter fixtures, feeding nine mechanical guards (no style=, paint-attribute whitelist, geometry-attribute converse, non-empty var() fallbacks, kebab-case names, README drift with a teeth test, id-free-by-default/single-id-with-prefix, fixed D-39 layer order, no-statement-leak)"
  - "Success Criterion 5 proven by test in both id-free and prefixed modes, plus the documented same-prefix-collides exception (edge row 14)"
  - "The working's render block reaches its final shape: { curve, glyph, idPrefix, title }, idPrefix serializing as JSON null (never dropped) when absent, proven invariant across every option combination"
  - "README completion: Multi-Embed Safety section (the declined-hash reasoning cited to Pitfall 9), --id-prefix in Usage, E_INVALID_OPTION table row, theming-table guard-contract paragraph — closing the phase goal"
affects: []

# Actuals (#2632)
actuals:
  tokens: 14754
  tasks: 3
  commits: 5

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ABSENT_DEFAULT_BY_TYPE: resolveOptions' per-type default table (false for boolean, null for string) — the first KNOWN_OPTIONS entry whose type isn't boolean, generalizing what was previously a single hardcoded false default"
    - "Value check layered onto D-47's type check: a correctly-typed but empty string is still rejected (idPrefix specifically), documented as a Planner Note extension rather than a silent addition"
    - "Root-element id emitted via a conditional string fragment interpolated immediately after the class attribute, so the default (idPrefix absent) byte sequence is untouched — same idiom pathLayer/glyphLayer already use for their own empty-string vanishing case"
    - "Guard-suite generator pattern: ONE function (allRenders) yields every combination with a descriptive label; every guard iterates the same array via it.each, so a future option is a one-line generator change that automatically extends all nine guards"
    - "README drift matched by Set membership on backtick-delimited capture groups, never by readme.includes(name) — this is what makes exact-token-boundary matching structural rather than a convention two engineers could get wrong differently"

key-files:
  created:
    - test/render/theming.test.js
  modified:
    - src/generate.js
    - src/render/svg.js
    - src/render/escapeXml.js
    - src/render/json.js
    - bin/sigil-spinner.js
    - test/render/svg.test.js
    - test/render/json.test.js
    - test/e2e/phase3-glyph-tracer.test.js
    - test/cli/cli.test.js
    - test/determinism.test.js
    - test/__file_snapshots__/worked-example.working.json
    - test/render/__snapshots__/json.test.js.snap
    - README.md

key-decisions:
  - "idPrefix's absent-default is null, not false — the only KNOWN_OPTIONS entry whose type isn't boolean, requiring ABSENT_DEFAULT_BY_TYPE (a per-type default table) rather than the previous single hardcoded default"
  - "Empty-string idPrefix rejected via a value check layered onto D-47's type check (Planner Note extension), not a contradiction of 'validation lives in the library' — documented inline as a deliberate discretion point, not silently added"
  - "Id attribute interpolated after class, not appended at the end of the template literal, so the byte sequence up to that point is provably untouched when idPrefix is absent — verified via git diff --stat on every committed .svg snapshot being empty across all three tasks"
  - "theming.test.js uses generateSigil (the real public seam) rather than renderSvg directly, so every guard exercises actual option resolution/validation including idPrefix escaping, not just the render layer in isolation"
  - "Folded the superseded per-file paint-attribute/style/README-drift assertions out of svg.test.js (default, glyph, and loop mode) rather than leaving both — removed now-unused sevenPlanetPaths/paintAttrValues/STYLE_ATTR/PAINT_ATTRS/README_PATH helpers to keep lint clean"
  - "README's declined-hash reasoning explicitly cites Pitfall 9 by name (not just paraphrased) so a reader can see the deterministic-hash idea was considered and rejected for a stated reason, not overlooked"

patterns-established:
  - "Per-type absent-default table (ABSENT_DEFAULT_BY_TYPE) as the generalization point when KNOWN_OPTIONS gains its first non-boolean entry — future string/number-typed options extend this table, not a growing if/else chain"
  - "Guard-suite-from-one-generator: a single allRenders()-shaped helper feeding it.each across every guard describe, so guard count scales with option count without duplicated fixture-building logic"

requirements-completed: [REND-05, REND-06]

coverage:
  - id: D1
    description: "idPrefix is the only route to an emitted id, XML-escaped through escapeXml before emission; a hostile prefix (quote, angle brackets, script tag) cannot terminate the attribute or inject markup; a non-string or empty-string idPrefix throws E_INVALID_OPTION"
    requirement: "REND-06"
    verification:
      - kind: unit
        ref: "test/render/svg.test.js#renderSvg — idPrefix (REND-06, D-43, D-44) (6 tests)"
        status: pass
      - kind: unit
        ref: "test/cli/cli.test.js#CLI --id-prefix flag (REND-06, D-44, D-46) and #Option validation — E_INVALID_OPTION and library/CLI parity (D-47) (7 tests)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The full REND-05/REND-06 guard suite runs across 128 renders (7 planets x curve x glyph x title x idPrefix cross-product plus repeat-carrying/B4/single-letter fixtures): no style=, paint-attribute whitelist, geometry-attribute converse, non-empty var() fallbacks, kebab-case names, README drift (with a teeth test proving exact-token-boundary matching), id-free-by-default/single-id-with-prefix, fixed D-39 layer order (with a real all-layers-on B4 case), no-statement-leak"
    requirement: "REND-05"
    verification:
      - kind: unit
        ref: "test/render/theming.test.js (973 tests total across all describe blocks)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The README drift guard was manually observed to FAIL (naming the removed property via a failed Set-membership assertion) when the --sigil-grid-number-font row was deleted from README.md, and to PASS once restored"
    requirement: "REND-05"
    verification:
      - kind: manual_procedural
        ref: "Manual deliberate-break check: deleted README.md line 154, ran npx vitest run test/render/theming.test.js (FAILED as expected), restored the line, re-ran (973 passed)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Success Criterion 5: two different sigils with no idPrefix share zero ids; two distinct prefixes produce two distinct ids; the same input with a shared prefix is byte-identical across two calls; two different sigils with the SAME prefix DO collide (documented, not a defect)"
    requirement: "REND-06"
    verification:
      - kind: unit
        ref: "test/determinism.test.js#Success Criterion 5 — multi-embed id safety (REND-06, D-43, D-44, D-45) (4 tests)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The working's render block reaches its final shape { curve, glyph, idPrefix, title }, idPrefix serializing as JSON null (never dropped) when absent, proven invariant across every option combination in both the library and CLI"
    requirement: "REND-06"
    verification:
      - kind: unit
        ref: "test/render/json.test.js#toWorking — render block (D-48) (4 tests); test/determinism.test.js#working.render key order is curve, glyph, idPrefix, title for every option combination (D-48)"
        status: pass
    human_judgment: false
  - id: D6
    description: "README documents the complete multi-embed and theming contract: Multi-Embed Safety section citing Pitfall 9's declined deterministic-hash recommendation, --id-prefix in Usage, E_INVALID_OPTION table row naming idPrefix, and the theming table's guard-contract paragraph; exactly fifteen --sigil-* properties documented"
    requirement: "REND-05"
    verification:
      - kind: other
        ref: "grep -cE '^\\| .--sigil-' README.md returns 15; grep -q -- '--id-prefix'/'E_INVALID_OPTION'/'Pitfall 9' README.md all succeed"
        status: pass
    human_judgment: false

duration: ~15min
completed: 2026-08-06
status: complete
---

# Phase 3 Plan 4: Themeable, Embeddable Layers — idPrefix and Guard Suite Completion Summary

**`idPrefix` wired end to end and XML-escaped against markup injection, the full REND-05/REND-06 guard suite proven across a 128-render cross-product with a demonstrated-to-fail README drift guard, Success Criterion 5 tests in both id-free and prefixed modes, and the README's Multi-Embed Safety section closing the phase goal.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-08-06T19:44:00-05:00 (approx, first file reads)
- **Completed:** 2026-08-06T19:55:32-05:00 (final commit)
- **Tasks:** 3 (Task 1 idPrefix TDD; Task 2 guard suite; Task 3 SC5 tests + README)
- **Files modified:** 14 (1 new test file, 13 modified — no new source files)

## Accomplishments

- `idPrefix` is the ONLY route to an emitted `id` anywhere in the output (D-43/D-44) — absent by default (zero ids), and when supplied names the root `<svg>` element's `id` attribute, routed through the existing `escapeXml` before emission. A hostile prefix containing `"><script>a</script>` cannot terminate the attribute or inject an element — proven mechanically (T-03-16, the phase's one high-severity threat)
- `resolveOptions` generalized to a per-type absent-default table (`ABSENT_DEFAULT_BY_TYPE`) — `idPrefix` defaults to `null`, not `false`, so it survives `JSON.stringify` as a real `null` value rather than being dropped as `undefined` would be; a correctly-typed but empty string is rejected with `E_INVALID_OPTION` as a value check layered onto D-47's type check
- `bin/sigil-spinner.js` gains `--id-prefix <string>`, completing D-46's three-flag CLI surface; no validation added to the CLI — the library's `E_INVALID_OPTION` check is the sole source of truth
- `test/render/theming.test.js` is the phase's enforcement suite (D-42, D-43): ONE generator (`allRenders`) yields 128 renders — the full 7-planet x curve x glyph x title x idPrefix cross-product (112) plus repeat-carrying, B4 all-layers-on, and single-kept-letter fixtures — feeding nine guard describes covering every REND-05/REND-06 claim the phase makes
- The README drift guard was manually deleted-and-restored to prove it actually fails (not just "would fail in theory") — deleting the `--sigil-grid-number-font` row produced a real assertion failure naming the gap; restoring it passed 973 tests again
- Success Criterion 5 is proven in both directions: zero ids when co-embedding two different sigils with no prefix; two distinct ids with two distinct prefixes; byte-identical output for the same input rendered twice with a shared prefix; and the documented exception that two DIFFERENT sigils sharing the SAME prefix DO collide, asserted explicitly as intentional behavior rather than left implicit
- README gains a Multi-Embed Safety section that names and declines the deterministic-hash alternative by citing `PITFALLS.md` Pitfall 9 directly — the reasoning (identical inputs would produce identical ids, the exact collision a hash would claim to prevent) is now public documentation, not just an internal design note
- Zero pre-existing `.svg` snapshots changed across all three tasks (verified via `git diff --stat` after every task) — `idPrefix` absent contributes nothing to default output, exactly as planned

## Task Commits

Each task was committed atomically, following the plan's `tdd="true"` RED/GREEN gate for Task 1:

1. **Task 1: `idPrefix` — the only route to an emitted id, escaped and validated** (TDD) — RED `abfebbc` (test), GREEN `fb50045` (feat)
2. **Task 2: The full REND-05/REND-06 guard suite across seven planets times every option combination** — `fdf54a7` (test)
3. **Task 3: Success Criterion 5 multi-embed tests, final working shape, and README completion** — `fe01f52` (docs)

## Files Created/Modified

- `test/render/theming.test.js` - New: `allRenders()` cross-product generator plus nine guard describes (style, paint-attribute whitelist, geometry converse, non-empty fallbacks, kebab-case names, README drift + teeth, id-free/single-id, layer order + B4, no-statement-leak)
- `src/generate.js` - `KNOWN_OPTIONS` gains `idPrefix: 'string'`; `ABSENT_DEFAULT_BY_TYPE` per-type default table; `resolveOptions` gains the empty-string value check; `working.render` gains `idPrefix` at its authored third position
- `src/render/svg.js` - Root `<svg>` element conditionally emits ` id="..."` (escaped) after `class`; module header rewritten to state the id-free-by-construction contract and why a derived hash is declined; `RenderOptions.idPrefix` typedef entry
- `src/render/escapeXml.js` - Doc comment updated: two call sites now (title, root id), not one
- `src/render/json.js` - `SigilWorking`/`GeneratePipelineResult` `render` typedef extended with `idPrefix: string | null`
- `bin/sigil-spinner.js` - `--id-prefix` flag, `idPrefixArg` cast, threaded into `generateSigil`'s options object; EXIT_CODES doc comment note
- `test/render/svg.test.js` - New idPrefix describe block (6 tests); superseded paint-attribute/style/README-drift assertions removed with pointer comments to `theming.test.js`; now-unused helpers removed
- `test/render/json.test.js`, `test/e2e/phase3-glyph-tracer.test.js` - `render` block expectations updated to include `idPrefix`; new render-block-invariance-across-combinations test
- `test/cli/cli.test.js` - `--id-prefix` library/CLI parity, empty-prefix rejection (exit 2, one stderr line), non-string/null idPrefix validation tests
- `test/determinism.test.js` - New Success Criterion 5 describe block (4 tests); render-key-order-across-combinations test
- `test/__file_snapshots__/worked-example.working.json`, `test/render/__snapshots__/json.test.js.snap` - Rebased for the new `render.idPrefix` key (the only committed artifacts Task 1 touches, per the plan's Planner Note)
- `README.md` - New Multi-Embed Safety section; `--id-prefix`/`options.idPrefix` documented in Usage; `E_INVALID_OPTION` table row updated; theming-table guard-contract paragraph added; "What This Tool Does Not Yet Do" marks the phase goal fully shipped

## Decisions Made

- `idPrefix`'s absent-default is `null`, not `false` — required generalizing `resolveOptions` from a single hardcoded boolean default to a per-type table (`ABSENT_DEFAULT_BY_TYPE`), since `idPrefix` is the first `KNOWN_OPTIONS` entry whose type isn't boolean.
- Empty-string `idPrefix` rejection is a value check layered onto D-47's type check, exactly as the plan's Planner Note directed — documented inline as a deliberate extension of the locked decision, not a silent addition.
- `theming.test.js` drives every guard through `generateSigil` (the real public seam) rather than `renderSvg` directly, so the suite proves the actual caller-facing contract including option validation and escaping, not just the render layer in isolation.
- Folded the superseded per-file guards out of `svg.test.js` (default mode, glyph mode, loop mode) rather than leaving duplicate coverage — removed the now-unused `sevenPlanetPaths`/`paintAttrValues`/`STYLE_ATTR`/`PAINT_ATTRS`/`README_PATH` helpers to keep `eslint` clean (`no-unused-vars`).

## Deviations from Plan

None — plan executed exactly as written. The one place requiring judgment (the empty-string idPrefix rejection) was already flagged in the plan's own Planner Note as "executor discretion... decided here rather than left to be rediscovered mid-implementation," so implementing it is following the plan, not deviating from it.

## Issues Encountered

**Own test-authoring bug caught before commit (not a product defect):** an early draft of the "escapes ampersand, single quote, and less-than" test asserted the id attribute value should not match `/id="[^"]*[<&][^"]*"/` — but the CORRECT escaped output for a literal ampersand is the entity `&amp;`, which itself contains an ampersand character. The regex was testing for the wrong thing (my test's negative assertion, not the production escaping). Fixed by asserting the exact expected escaped id value directly (`id="a&amp;b&apos;c&lt;d"`) instead of a negative character-class check. Caught during the GREEN run of Task 1, before any commit — not a deviation, a normal test-writing correction.

**TypeScript narrowing gap after generalizing `resolveOptions`'s return type:** widening `resolveOptions`'s return type to `Record<string, boolean | string | null>` (to accommodate `idPrefix`) broke `tsc --checkJs`'s narrowing for the `curve`/`glyph`/`title` fields in the `working.render` object literal, since TS could no longer infer they were specifically boolean. Fixed with three explicit `/** @type {boolean} */` casts alongside the existing `idPrefix` cast — each one documents that the runtime `typeof` check in `resolveOptions` already proved the type, TS just can't see through the generic `Object.entries` loop. Caught by `npm run typecheck` during Task 1, fixed before commit.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- This is the final plan of Phase 3. All five phase requirements (REND-02 through REND-06) are now complete and guard-tested: curve rendering (03-03), the grid layer (03-02), the glyph layer (03-01), the full `--sigil-*` theming surface (this plan, completing REND-05), and multi-embed id safety (this plan, completing REND-06).
- The phase's closing goal — "a site can embed several sigils on one page and restyle every one of them entirely from CSS — grid, glyph, and curve options included — without touching the generated markup" — is fully shipped and enforced: `test/render/theming.test.js`'s 128-render cross-product guards every claim mechanically, and `test/determinism.test.js`'s Success Criterion 5 suite proves the multi-embed contract directly.
- The `render` block's final shape (`{ curve, glyph, idPrefix, title }`) is frozen and proven invariant — any future option addition to `KNOWN_OPTIONS` is a one-line generator change in `theming.test.js` (`allRenders`) that automatically extends all nine guards, per the pattern this plan established.
- No blockers identified. Phase 3 is complete; orchestrator-level requirement/roadmap sign-off and phase-close verification are the next steps.

## Self-Check: PASSED

All claimed files verified present on disk (test/render/theming.test.js, src/generate.js, src/render/svg.js, src/render/escapeXml.js, src/render/json.js, bin/sigil-spinner.js, README.md, and all listed test files). All claimed commit hashes verified present in git history (abfebbc, fb50045, fdf54a7, fe01f52).

---
*Phase: 03-themeable-embeddable-layers*
*Completed: 2026-08-06*
