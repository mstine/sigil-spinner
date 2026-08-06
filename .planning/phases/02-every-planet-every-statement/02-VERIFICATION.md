---
phase: 02-every-planet-every-statement
verified: 2026-08-06T12:15:00Z
status: human_needed
score: 22/23 must-haves verified
behavior_unverified: 1
overrides_applied: 0
behavior_unverified_items:
  - truth: "Coincident markers at a single cell (start circle, end bar, and one or more repeat loops) read as separate, countable shapes rather than merging into one indistinguishable blob at the fixed 100x100 viewBox scale (D-18, D-19, D-27)."
    test: "Open the SVG produced by `node bin/sigil-spinner.js 'CLARITÉ' --planet jupiter` in a browser and confirm the repeat marker reads as a small loop or curl at the cell, per D-17, and not as a notch, chevron, or closed ring. For a triple-repeat statement, confirm the two loops are individually countable rather than overlapping into one shape."
    why_human: "This is a visual-legibility claim at a fixed 100x100 viewBox render scale — bounding-box geometry can be computed and was (loop clears the start circle by 2.25 viewBox units in the CLARITÉ/jupiter tracer case), but 'reads as separate, countable shapes' to a human eye in an actual renderer is not something grep/geometry math alone can certify. The plan itself deferred this to an explicit `<human-check>` block on Task 2 rather than an automated assertion."
human_verification:
  - test: "Open the SVG produced by `node bin/sigil-spinner.js 'CLARITÉ' --planet jupiter` in a browser and confirm the repeat marker reads as a small loop or curl at the cell (per D-17), not a notch/chevron/closed ring. Then run a triple-repeat statement (e.g. any statement whose Pythagorean digits contain a run of 3 identical digits) and confirm the two nested loops are individually countable rather than overlapping into one shape."
    expected: "The sigil-loop element(s) render as visually distinct open arcs/curls, legible and countable at the 100x100 viewBox scale, with no boundary marker or loop obscured by another."
    why_human: "Visual legibility at final render scale; the plan's own PLAN.md carries this as a `<human-check>` block (Task 2), not an automated assertion. Computed geometry (bounding boxes) confirms no overlap in the one worked case checked, but this is not the same as human-legible 'reads as a loop, not a blob'."
  - test: "Confirm the three prohibitions declared in the phase plans' `must_haves.prohibitions` blocks hold in the shipped code: (1) no character is silently discarded during folding, (2) no existing marker is suppressed/merged to make room for a repeat loop, (3) no accent-folding/Y-handling/transliteration rule exists in code that is not documented in README."
    expected: "Independent code reading confirms all three: `normalize()` pushes a struck entry (reason `non-letter`) even when a character folds to an empty string, so nothing vanishes unaccounted-for; `loopLayer` only ever adds offset/geometry, never a conditional that skips emitting a marker; and README's 'Letter Handling Rules' section documents exactly the transliteration table, NFD path, Y rule, and non-Latin rule that `fold.js`/`normalize.js` implement, with no undocumented rule found by inspection. These prohibitions carried no `verification: test|judgment` tier marker in the plan frontmatter (descriptor-less), so per the fail-closed default they are recorded here as flagged for human sign-off rather than silently marked passed, despite the code-reading evidence above being consistent with compliance."
    why_human: "Prohibitions were declared without a verification-tier marker in the plan frontmatter; the fail-closed contract routes descriptor-less prohibitions to human review rather than an automated pass, regardless of how strong the supporting code-reading evidence looks."
---

# Phase 2: Every Planet, Every Statement Verification Report

**Phase Goal:** Any of the seven classical planets and any statement — including the degenerate and the accented ones — produce either a trustworthy sigil or a clear, actionable error, identically from library and CLI.
**Verified:** 2026-08-06T12:15:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

Merged from ROADMAP.md Phase 2 Success Criteria and both plans' `must_haves.truths`.

#### Roadmap Success Criteria

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| R1 | Any of the seven planets + same statement → seven visibly distinct sigils, each traced on that planet's geometry | ✓ VERIFIED | `generateSigil('I WILL SUCCEED', planet).svg` for all 7 planets collected into a `Set` yields size 7 (`test/determinism.test.js` + reproduced live); each contains `sigil--<planet>` |
| R2 | Consecutive repeats render the traditional loop/notch marker at that cell, only on consecutive repeats | ✓ VERIFIED | `detectRepeats` walks the NUMBER sequence only (never letters), confirmed `normalize('BK')` still keeps both B and K despite both encoding to digit 2 (Pitfall 7 boundary); CLARITÉ/jupiter live run: exactly 1 `sigil-loop` for one non-consecutive-adjacent repeat |
| R3 | Statement reducing to nothing → clear error naming cause; single letter → valid single-node sigil | ✓ VERIFIED | Live run: `AEIOU`/saturn → exit 3, `E_EMPTY_SEQUENCE: ... (5 vowels)`; `B`/moon → exit 0, valid single-node SVG |
| R4 | Accented/non-ASCII + Y follow a documented, deterministic rule, readable in README and observed in output | ✓ VERIFIED | README `## Letter Handling Rules` states all 4 rules with the 12-row transliteration table; live `normalize('RHYTHM')`/`normalize('YES')`/`normalize('ÑU')`/`normalize('ΩЯא你')` all match documented behavior |
| R5 | Same statement+planet+options twice → byte-identical SVG+JSON; invalid input → same error from library and CLI | ✓ VERIFIED | Live run: CLI stdout byte-identical (`diff` exit 0) to library SVG for `CLARITÉ`/jupiter and for `B` on all 7 planets; `test/cli/cli.test.js` asserts paired library/CLI `.code` identity |

#### Plan 02-01 must_haves.truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Accented letter → base letter kept, on any planet (D-22) | ✓ VERIFIED | `foldStatement('ßÉ')` → `SS`/`E`; `normalize('CLARITÉ').kept` = `['C','L','R','T']`, struck entry `original: 'É', char: 'E', reason: 'vowel'` — live-executed, matches |
| 2 | Consecutive-equal-digit pair → exactly one `sigil-loop` at that cell, additive to node circles (D-17, D-20) | ✓ VERIFIED | Live: `generateSigil('CLARITÉ','jupiter').svg` has exactly 1 `sigil-loop` element and still 4 `sigil-node` circles |
| 3 | Run of k equal digits → k-1 loop elements (D-18) | ✓ VERIFIED | `test/render/svg.test.js` "renders two sigil-loop elements with distinct arc radii for a run of three equal digits" — passing, radii distinct (2 elements for k=3) |
| 4 | Repeat at first/last point → loop AND boundary marker, neither suppressed (D-19) | ✓ VERIFIED | `test/render/svg.test.js` two dedicated tests (start-boundary, end-boundary) both assert 1 boundary marker + 1 loop present simultaneously — passing |
| 5 | Single-kept-letter statement → one node, one start, one end, all present (D-27) | ✓ VERIFIED | Live: `generateSigil('B','saturn')`/`moon` renders exactly 1 each of `sigil-node`/`sigil-start`/`sigil-end`; `test/render/svg.test.js` asserts end-bar midpoint differs from start-circle center |
| 6 | Every digit 1-9 resolves to a valid in-bounds cell for all 7 planets; orders 3 (saturn) and 9 (moon) trace without error | ✓ VERIFIED | Live exhaustive check: `cellForNumber(planet, n)` for n=1..9 across all 7 planets, all row/col within `[0, order)` |
| 7 | Every coordinate rounds exactly once (cellCenter for centers, roundGeometry for markers incl. loops); no second rounding site for loop geometry | ✓ VERIFIED | Code read: `loopLayer` routes every derived value (offset, radius, cx, cy, x1/y1/x2/y2) through the same `roundGeometry` helper `nodeLayer`/`startMarker`/`endMarker` already use — no new rounding function introduced |
| 8 | Struck/kept entries in original order; ß→SS derived entries share original char/index (D-25) | ✓ VERIFIED | Live: `normalize('WEIß')` → keptEntries has `{char:'S', index:3, original:'ß', folded:'SS'}` and struck has `{char:'S', index:3, original:'ß', folded:'SS', reason:'repeat'}` — same original/index, fold order preserved |
| 9 (backstop) | Coincident markers read as separate, countable shapes, not a blob, at 100x100 viewBox | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Geometry computed and non-overlapping in the one case checked (see Human Verification), but this is a `verification: backstop` truth requiring visual confirmation the plan itself deferred to a `<human-check>` block |

#### Plan 02-02 must_haves.truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Zero kept letters → `E_EMPTY_SEQUENCE` naming total struck + per-reason breakdown + `.details.struck` (D-26) | ✓ VERIFIED | Live: `AEIOU`/saturn → `E_EMPTY_SEQUENCE: Statement reduced to zero kept letters: all 5 characters struck (5 vowels).`; `.details.struck` populated per test |
| 2 | Exactly one kept letter → valid sigil on every planet (CONS-03) | ✓ VERIFIED | Live exhaustive check across all 7 planets: `generateSigil('B', planet)` succeeds, `lettersKept: ['B']`, byte-identical across 2 calls and CLI |
| 3 | Empty/whitespace/non-string → correct SigilError codes, never partial/undefined | ✓ VERIFIED | Live: `''`→`E_MISSING_STATEMENT`, `null`→`E_MISSING_STATEMENT`, `'   '`→`E_EMPTY_SEQUENCE` |
| 4 | Y kept as consonant unless struck as repeat; stated as a rule in code + README (D-21) | ✓ VERIFIED | `src/text/normalize.js` module header states the rule as resolved; README `## Letter Handling Rules` item 1; `normalize('RHYTHM').kept` = `['R','H','Y','T','M']` |
| 5 | Non-Latin struck with reason `non-letter`, appears in struck trail; fully non-Latin → `E_EMPTY_SEQUENCE` (D-24) | ✓ VERIFIED | `normalize('ΩЯא你')` — all 4 struck, reason `non-letter`; `generateSigil('ΩЯא你','saturn')` throws `E_EMPTY_SEQUENCE` |
| 6 | README states accent-folding rule + 6-letter (12-row) transliteration table as citable rule, same posture as kamea lineage | ✓ VERIFIED | README `## Letter Handling Rules` section reproduces all 12 case-sensitive rows and cites D-22/D-23; posture matches `## Kamea Source Lineage` |
| 7 | Two calls, same statement/planet/options → byte-equal SVG and `JSON.stringify(working)`, via `toBe` (INT-03) | ✓ VERIFIED | `test/determinism.test.js` `describe.each(PLANETS)` uses `toBe` for both, for all 7 planets — passing |
| 8 | Byte-identical holds for degenerate cases: single-kept-letter + every one of seven planets, and CLI subprocess (INT-03) | ✓ VERIFIED | Live exhaustive check (beyond the plan's own saturn/moon-only test scope): `generateSigil('B', planet)` byte-identical across 2 calls AND CLI subprocess for all 7 planets |
| 9 | JSON working key order fixed; `keptTrail`/`repeats` appended after pre-existing keys (INT-03) | ✓ VERIFIED | `test/determinism.test.js` "appends the Phase 2 working keys after the unchanged Phase 1 key order" — passing; live `Object.keys(working)` confirms |
| 10 | Same invalid input → same error identity from library and CLI (INT-04) | ✓ VERIFIED | `test/cli/cli.test.js` paired library/CLI `.code` assertions; live: CLI exit 3 for all-vowel matches library `E_EMPTY_SEQUENCE` |

**Score:** 22/23 truths verified (1 present-but-behavior-unverified — routes to human review, not counted toward score)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/text/fold.js` | Per-character, origin-tracked accent folding + D-23 transliteration map | ✓ VERIFIED | Exists, exports `foldStatement`, 12-entry `TRANSLITERATION_MAP`, `COMBINING_MARKS` regex, never throws |
| `src/path/buildPath.js` | PathModel extended with `repeats` event array | ✓ VERIFIED | `detectRepeats` internal function, `RepeatEvent` typedef, `repeats` field on returned PathModel |
| `src/render/svg.js` | `loopLayer` emitting `sigil-loop`, coincident-marker offsetting | ✓ VERIFIED | `loopLayer`, `sigil-loop` class, `LOOP_RADIUS_FRACTION`/`LOOP_OFFSET_FRACTION`/`LOOP_NEST_STEP_FRACTION` all present |
| `test/e2e/phase2-tracer.test.js` | End-to-end accented + repeat statement on non-Saturn kamea | ✓ VERIFIED | Exists, exercises CLARITÉ/jupiter |
| `README.md` | Documented CONS-04 rule surface | ✓ VERIFIED | Contains `## Letter Handling Rules`, `ẞ`, `sigil-loop`, `E_EMPTY_SEQUENCE` |
| `src/errors.js` | `SigilError` with optional `details` | ✓ VERIFIED | Third constructor param, assigned only when defined; existing 2-arg call sites unaffected |
| `test/text/fold.test.js` | Transliteration/NFD/non-Latin/astral/stacked-mark vectors | ✓ VERIFIED | Exists, covers all 12 table rows + NFD path + non-Latin + defensive edge cases |
| `test/determinism.test.js` | Seven-planet byte-equality + snapshot matrix | ✓ VERIFIED | `describe.each` + `PLANETS` constant with all 7 canonical names |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `src/text/normalize.js` | `src/text/fold.js` | `normalize` drives its loop from `foldStatement` | ✓ WIRED | Automated pattern check confirmed; also manually verified via live `normalize()` output |
| `src/render/svg.js` | `src/path/buildPath.js` | `loopLayer` maps over `pathModel.repeats` | ✓ WIRED (manual override) | Automated literal-string check reported "not found" because the field is destructured (`const { ..., repeats, ... } = pathModel`) rather than accessed as `pathModel.repeats` verbatim. Manual grep confirms `repeats` destructured at line 203 and iterated at line 211 (`repeats.map(...)`); live execution confirms correct loop events flow from `buildPath` through to rendered `sigil-loop` elements. |
| `src/render/json.js` | `src/path/buildPath.js` | `toWorking` reads `path.repeats` straight through | ✓ WIRED | Automated check confirmed literal match at line 103 (`repeats: path.repeats,`) |
| `src/generate.js` | `src/errors.js` | `E_EMPTY_SEQUENCE` throw passes `details` | ✓ WIRED | Automated pattern check confirmed |
| `bin/sigil-spinner.js` | `src/errors.js` | CLI branches on `.code`, no CLI-side validation | ✓ WIRED (manual override) | Automated check reported "not found" for pattern `\.code`; manual grep confirms `err.code` used twice (lines 82-83) to select stderr message and exit status. Live CLI runs confirm correct exit-status mapping (2/3/0). |
| `test/determinism.test.js` | `src/data/kamea.js` | Planet list matches canonical order | ✓ WIRED | Automated pattern check confirmed |

Two automated key-link checks reported false negatives due to the literal-substring matcher not tolerating destructuring/property-access variance; both were manually confirmed wired and functioning via source inspection and live execution, so they are recorded as ✓ WIRED (manual override), not as gaps.

### Data-Flow Trace (Level 4)

Not applicable in the traditional sense (no persisted store/DB) — the pipeline is pure-function transform. Data flow from `buildPath.repeats` → `svg.js loopLayer` → rendered markup, and → `json.js toWorking` → `working.repeats`, was traced end-to-end via live execution (`generateSigil('CLARITÉ','jupiter')` producing consistent `repeats: [{atPoint:1,count:1}]` in both the rendered SVG's single `sigil-loop` element and the JSON working) — confirmed flowing, not hollow/disconnected.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full suite passes | `npx vitest run` | 170/170 tests pass | ✓ PASS |
| Typecheck clean | `npm run typecheck` | exit 0 | ✓ PASS |
| Lint clean | `npm run lint` | exit 0 | ✓ PASS |
| CLARITÉ/jupiter CLI = library, byte-identical | `diff` of CLI stdout vs. library `svg` | identical | ✓ PASS |
| All 7 planets produce distinct sigils | Set-size check on 7 SVGs | size 7 | ✓ PASS |
| All 7 planets, digits 1-9 resolve in-bounds | exhaustive `cellForNumber` check | all in-bounds | ✓ PASS |
| Degenerate errors match documented codes | `AEIOU`→3, `''`→2 (E_MISSING_STATEMENT), `'   '`→3 (E_EMPTY_SEQUENCE) | as documented | ✓ PASS |
| Single-letter statement, all 7 planets, CLI+library byte-identical | loop over 7 planets, `diff` per planet | all MATCH | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|--------------|-------------|--------------|--------|----------|
| KAMEA-02 | 02-01, 02-02 | Select any of 7 planets; number sequence maps via direct 1-9 cell lookup | ✓ SATISFIED | Determinism matrix + live exhaustive cell-bounds check across all 7 planets |
| PATH-02 | 02-01 | Consecutive repeats produce traditional loop marker, only on consecutive repeats | ✓ SATISFIED | `detectRepeats` over numbers only; `normalize('BK')` boundary test preserved; live CLARITÉ/jupiter proof |
| CONS-03 | 02-02 | Degenerate inputs handled — empty → clear error, single-letter → valid sigil | ✓ SATISFIED | Live checks across all 7 planets for both empty-reduction and single-letter cases |
| CONS-04 | 02-01, 02-02 | Non-ASCII/accented + Y-handling follow documented, deterministic rule in code + README | ✓ SATISFIED | README `## Letter Handling Rules`; `src/text/fold.js`/`normalize.js` doc comments; `test/text/fold.test.js` |
| INT-03 | 02-02 | Identical input → byte-identical output, verified by snapshot tests across all 7 planets | ✓ SATISFIED | `test/determinism.test.js` `describe.each` matrix + live checks |
| INT-04 | 02-02 | Input validation lives in library, not CLI; identical guarantees/errors | ✓ SATISFIED | `bin/sigil-spinner.js` git-diff-verified untouched by Task 1; paired library/CLI `.code` assertions in `test/cli/cli.test.js` |

No orphaned requirements — REQUIREMENTS.md maps exactly these 6 IDs to Phase 2, and all 6 appear across the two plans' `requirements` frontmatter fields.

### Anti-Patterns Found

None. Scanned all files listed in both plans' `files_modified` for `TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER`/"not yet implemented"/"coming soon" — zero matches in `src/`, `test/`, or `README.md`. No empty-implementation stubs (`return null`/`return {}`/`return []`/`=> {}`) found in the modified files that aren't legitimate degenerate-case handling (e.g. `pathLayer` returning `''` for a <2-point PathModel is a documented, tested behavior, not a stub).

### Human Verification Required

1. **Visual legibility of coincident/nested loop markers (backstop truth, D-17/D-18/D-19/D-27)**
   **Test:** Open the SVG from `node bin/sigil-spinner.js 'CLARITÉ' --planet jupiter` in a browser; separately generate and view a triple-repeat statement's SVG.
   **Expected:** The loop renders as a small curl/arc (not a notch, chevron, or closed ring); nested loops from a 3+ run are individually countable, not stacked into one shape.
   **Why human:** This is the plan's own deferred `<human-check>` (Task 2, Plan 02-01) — a visual-legibility judgment at final render scale that bounding-box math cannot fully certify, and the must-have itself carries an explicit `verification: backstop` marker.

2. **Sign-off on the three descriptor-less prohibitions**
   **Test:** Confirm by reading `src/text/normalize.js`, `src/render/svg.js`, and README.md that (a) no character is silently discarded during folding, (b) no existing marker is suppressed to make room for a loop, (c) no undocumented folding/transliteration rule exists in code.
   **Expected:** All three hold — code inspection performed during this verification found no violation in any of the three.
   **Why human:** These prohibitions were declared in the plan frontmatter without a `verification: test|judgment` tier marker (descriptor-less). Per the fail-closed default, a descriptor-less prohibition routes to human sign-off rather than an automated pass — this verification's code-reading evidence is consistent with compliance but does not substitute for that sign-off.

### Gaps Summary

No gaps. All 22 non-backstop truths across both plans, plus all 5 ROADMAP success criteria, are verified against the live codebase (not just SUMMARY claims) — through direct code reading, exhaustive execution across all 7 planets, byte-level CLI/library diffs, and the full passing test suite (170/170, typecheck 0, lint 0). Two automated key-link checks produced false negatives from literal-string matching against destructured code; both were manually confirmed wired via source inspection and live execution.

The phase is not cleared to `passed` status only because: (1) one must-have truth is explicitly marked `verification: backstop` and was itself deferred by the plan to a human `<human-check>` step never executed in this headless environment, and (2) three prohibitions were declared without a verification-tier marker, which per the fail-closed contract routes them to human review rather than a silent pass, notwithstanding that this verification's own code inspection found no violations.

---

*Verified: 2026-08-06T12:15:00Z*
*Verifier: Claude (gsd-verifier)*
