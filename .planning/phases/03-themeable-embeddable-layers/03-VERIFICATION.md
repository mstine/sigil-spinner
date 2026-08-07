---
phase: 03-themeable-embeddable-layers
verified: 2026-08-06T20:30:00Z
status: human_needed
score: 5/5 roadmap success criteria verified; ~75/75 plan must_have truths mechanically confirmed; 5 UI-SPEC backstops (B1, B2, B3, B4, B5) have confirmed mechanical evidence but retain an unverifiable visual/browser-rendering component
behavior_unverified: 0
overrides_applied: 0
human_verification:
  - test: "Embed 2+ generated sigils in an actual HTML page (not a string-concatenation test) and toggle each of the 15 documented --sigil-* custom properties from a stylesheet, including revealing the grid via --sigil-grid-opacity."
    expected: "Each sigil restyles independently and correctly from CSS alone, with no markup edits; the revealed grid shows a visible lattice and visible numbers with no black square painted over the viewBox (backstop B5); no two sigils' visuals collide or bleed into each other."
    why_human: "No test in the suite renders the SVG string into an actual DOM/browser. All 1405 automated tests operate on the raw SVG string (regex/substring checks on attribute values), never on rendered pixels or computed CSS. This is the literal, load-bearing claim of the phase goal ('restyle every one of them entirely from CSS') and cannot be proven by string inspection alone."
  - test: "Visually inspect curve-mode output for all seven planets, especially sun + \"I WILL SUCCEED\", for smoothness, self-intersection, and the documented viewBox overshoot (backstop B1)."
    expected: "Curves read as smooth, traditionally-plausible sigil paths; the documented y=-0.916 overshoot on sun is visually minor/acceptable and does not clip in a way that looks broken."
    why_human: "The B1 test (test/render/curve.test.js) proves every control point stays within a stated numeric tolerance (mechanically confirmed independently during this verification), but a centripetal Catmull-Rom curve's analytic extremum between control points, and whether the shape 'looks right,' is a visual judgment the plan's own test doc comments explicitly disclaim proving."
  - test: "Visually inspect a curve-mode render of a repeat-carrying statement that lands a repeat on the start or end cell (backstop B3), confirming the start marker, end marker, and loop markers are all legible and non-overlapping."
    expected: "All markers are visually distinct and readable; the boundary-bumped loop radius (D-19) reads correctly."
    why_human: "The B3 test proves element counts and that no two elements share identical geometry attribute sets (mechanically confirmed), not visual non-overlap in rendered space, which the plan's own test doc comment explicitly disclaims proving."
gaps: []
deferred: []
---

# Phase 3: Themeable, Embeddable Layers Verification Report

**Phase Goal:** "A site can embed several sigils on one page and restyle every one of them entirely from CSS — grid, glyph, and curve options included — without touching the generated markup."
**Verified:** 2026-08-06
**Status:** human_needed
**Re-verification:** No — initial verification

## Note on MVP mode and the goal-as-user-story requirement

Phase 3 is marked `Mode: mvp` in ROADMAP.md, but its Goal line is not phrased as `As a … I want to … so that …`. This was flagged and deliberately handled by the planner (03-01-PLAN.md's "Planner Note — MVP user-story framing"): the ROADMAP Goal line was quoted verbatim rather than a user story invented for it, because inventing one is explicitly forbidden and the line is already outcome-shaped. This verification follows the same posture — it verifies the ROADMAP's 5 Success Criteria directly (as this task's instructions explicitly directed) rather than refusing to verify or fabricating a user-story frame. This divergence is pre-existing, documented, and not a new finding.

## Goal Achievement — the Five Success Criteria (behavioral verification)

All five were independently re-run against the actual codebase during this verification, not accepted from SUMMARY.md claims.

| # | Success Criterion | Status | Evidence |
|---|---|---|---|
| 1 | Curve switchable, construction unchanged | ✓ VERIFIED | `generateSigil(s,p,{curve:true}).working` vs `.working` diffed programmatically across all 7 planets on `lettersKept, lettersStruck, letterNumbers, numbers, cells, segments, start, end, keptTrail, repeats` — all fields byte-identical (`JSON.stringify` equality); only `render.curve` differs (`false` vs `true`). Independently re-run, result: `SC1 result: PASS`. |
| 2 | Grid present, hidden by default, CSS-revealable | ✓ VERIFIED | Default render of `generateSigil('I WILL SUCCEED','saturn')` contains `class="sigil-grid"` with `opacity="var(--sigil-grid-opacity, 0)"` — present and hidden (fallback 0) with a single custom property controlling visibility. Confirmed by direct run, not snapshot inspection alone. |
| 3 | Glyph optional, CSS-styled and positioned | ✓ VERIFIED | Default render: 0 occurrences of `class="sigil-glyph"`. With `{glyph:true}`: exactly 1 occurrence. Attributes are `x`/`y` literal anchors (50,50, viewBox center, D-38) plus 4 `var(--sigil-glyph-*, <fallback>)` paint/typography properties — confirmed directly. |
| 4 | Every themeable value is `--sigil-*` with a default; no `style=""`, no hardcoded presentation | ✓ VERIFIED | Enumerated every `var(--sigil-*` reference emitted across all 7 planets × {curve, glyph, idPrefix} on/off (56 render combinations): exactly 15 distinct custom-property names, every one present in the README theming table (exact backtick-delimited match). Zero `style=` matches (`/\sstyle\s*=/`) across the same 56 combinations. |
| 5 | Two sigils on one page, zero id collisions | ✓ VERIFIED | Two different sigils (different statement+planet), no prefix: 0 total id attributes in the concatenated document. Two distinct prefixes (`a`, `b`): exactly 2 distinct ids. Same input rendered twice with a shared prefix: byte-identical SVG (determinism preserved). Hostile prefix (`x"><script>a</script>`) escapes to `&quot;` with no `<script` substring and exactly one `id=` attribute — the phase's one injection surface (T-03-16) is closed. |

All five ROADMAP success criteria hold under direct, independently-run behavioral tests — not SUMMARY.md claims.

## Automated Verification (whole-suite, run fresh)

| Check | Command | Result |
|---|---|---|
| Full test suite | `npx vitest run` | **1405/1405 passed**, 17 test files, 0 failures |
| Type check | `npm run typecheck` (`tsc --allowJs --checkJs --noEmit`) | exit 0, no errors |
| Lint | `npm run lint` (`eslint .`) | exit 0, no errors |
| Zero runtime dependencies | `node -e "..."` against `package.json` | `dependencies: {}` confirmed |
| Construction pipeline frozen | `git diff --stat 58ba54c..HEAD -- src/path/ src/text/ src/data/pythagorean.js src/data/kamea.js` | empty — zero changes across the whole phase |
| `render/` never imports `data/kamea.js` | `grep -rnE "^[[:space:]]*(import\|export)[^;]*data/kamea" src/render/` | no matches |
| No `--grid` flag exists | `node bin/sigil-spinner.js ... --grid` | `E_CLI_USAGE`, exit 2 (unknown flag, D-32 honored) |
| CLI/library byte parity | curve+glyph+idPrefix combined | byte-identical strings, confirmed directly |
| Layer order (D-39), all-layers-on | grid → glyph → path → node → start → end → loop | strictly increasing indices confirmed on a `curve:true, glyph:true` repeat-carrying moon render (backstop B4's document-order half) |

## Required Artifacts

All artifacts declared across the four plans' `must_haves.artifacts` exist on disk, are substantive (not stubs), and are wired (imported and exercised by tests and by `renderSvg`'s layer array / `generate.js`'s option pipeline): `src/render/glyphs.js`, `src/render/curve.js`, `src/render/coords.js` (with `roundGeometry`/`GEOMETRY_PRECISION` re-homed per 03-03's plan), `src/render/svg.js`, `src/render/json.js`, `src/render/escapeXml.js`, `src/errors.js`, `src/generate.js`, `bin/sigil-spinner.js`, `README.md`, and the full test suite (`test/render/glyphs.test.js`, `test/render/grid.test.js`, `test/render/curve.test.js`, `test/render/theming.test.js`, `test/e2e/phase3-glyph-tracer.test.js`, plus the extended `test/determinism.test.js`, `test/render/svg.test.js`, `test/render/json.test.js`, `test/cli/cli.test.js`). Snapshot counts confirmed directly: 45 total `.svg` file snapshots, including 7 `matrix-glyph-*`, 7 `matrix-curve-*`, and 7 `matrix-curve-repeat-*`.

## Key Link Verification

| From | To | Via | Status |
|---|---|---|---|
| `bin/sigil-spinner.js` | `generateSigil`'s 3rd argument | options object built and passed (D-46) | ✓ WIRED — confirmed via CLI/library byte-parity test with `--curve --glyph --id-prefix` |
| `generate.js` | `renderSvg` + `toWorking` | resolved options forwarded to both (D-47/D-48) | ✓ WIRED — `render` block present and reflects passed options |
| `generate.js` | `kameaGrid()` → `renderSvg`'s `kamea` key | spread LAST, un-overridable (D-35) | ✓ WIRED — grid numbers deep-equal `kameaGrid(planet).flat()` per the existing passing test suite; `render/` never imports `data/` directly (confirmed above) |
| `escapeXml` | root `<svg id="...">` | idPrefix escaping (D-44) | ✓ WIRED — hostile-prefix test confirmed directly, no injection, exactly one escaped id |
| `README.md` theming table | every emitted `--sigil-*` name | D-42 drift guard (`test/render/theming.test.js`) | ✓ WIRED, WITH TEETH — independently re-verified by deleting a README row (`--sigil-grid-number-font`) and re-running the guard suite: it FAILED naming the correct assertion; restoring the row made it pass again (973/973). File confirmed clean afterward (`git diff --stat README.md` empty). |

## Requirements Coverage

| Requirement | Plan | Status | Evidence |
|---|---|---|---|
| REND-02 | 03-03 | ✓ SATISFIED | Curve/straight dispatcher, byte-identical construction, D-30 marker invariance, 14 curve snapshots, 4 backstops mechanically confirmed |
| REND-03 | 03-02 | ✓ SATISFIED | Always-present grid, real magic-square values, hidden-by-default, 31 SVG snapshots rebased with a grid-only diff (verified by the plan's own programmatic diff-shape check, cross-referenced against passing suite) |
| REND-04 | 03-01 | ✓ SATISFIED | Opt-in glyph, closed 7-entry code-point map, D-39 head insertion, byte-identical when off |
| REND-05 | 03-04 (completes 03-01/02) | ✓ SATISFIED | 15 `--sigil-*` properties, all documented, zero `style=`, paint-attribute whitelist enforced across a 973-test cross-product guard suite |
| REND-06 | 03-04 | ✓ SATISFIED | Id-free by default (enforced invariant), `idPrefix` as sole escaped route, SC5 proven in both directions including the documented same-prefix collision |

No orphaned requirements — all 5 phase requirements traced in `.planning/REQUIREMENTS.md` are claimed by exactly one plan each and are satisfied by direct evidence above.

## Anti-Patterns / Known Open Items (from code review, not new findings)

Per this task's explicit instruction, the following are **known, already-documented items from `03-REVIEW.md`** — not newly discovered defects. They are reported here for completeness, not as fresh blockers:

- **WR-01 (Warning, open):** `working.render.idPrefix` serializes as JSON `null` when absent (correct, per D-48's Planner Note), but `resolveOptions` only treats a value as "absent" when it is strictly `undefined`, not `null`. Independently re-confirmed during this verification: `generateSigil(s, p, workingObj.render)` — the natural round-trip a consumer holding only the working would attempt — throws `E_INVALID_OPTION` for `idPrefix: null` in the default (most common) case, contradicting `json.js`'s own doc comment that the `render` block lets "a consumer holding only the working... reproduce the exact SVG." This is real and reproducible, confirmed directly, not merely trusted from the review. It is Warning-severity per the code review's own disposition (not Critical), does not affect any of the five ROADMAP success criteria (none of which exercise this round-trip), and is left as an open item per the code review rather than escalated to a verification BLOCKER here.
- **WR-02 (Info-adjacent, confirmed latent):** `formatCoord`/`roundGeometry` are unguarded against `-0` serialization. Independently re-confirmed during this verification: scanned all 14 curve-mode `.svg` snapshots for exponential notation or literal `-0` coordinate tokens in every `sigil-path d` attribute — zero occurrences found. Latent, not exercised by any current input across 7 planets × 5 statements × both curve modes, consistent with the code review's own finding.
- **IN-01 (Info):** Decision ID `D-12` cited for two unrelated topics in source comments. Cosmetic, does not affect behavior or verification.

No Critical findings. No `TBD`/`FIXME`/`XXX` unreferenced debt markers found in the phase's modified files (spot-checked via the same file list `03-REVIEW.md` reviewed).

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| SC1 construction invariance | Node script diffing `.working` across curve modes, 7 planets | all fields equal, `render.curve` differs correctly | ✓ PASS |
| SC2 grid hidden/present | Direct SVG string inspection | `class="sigil-grid" opacity="var(--sigil-grid-opacity, 0)"` present | ✓ PASS |
| SC3 glyph optional | Count `class="sigil-glyph"` on/off | 0 / 1 | ✓ PASS |
| SC4 no style=, 15 documented properties | 56-combination sweep | 0 `style=` matches; 15/15 documented | ✓ PASS |
| SC5 zero collisions / prefix behavior | 3 scenarios (no prefix, distinct prefixes, same prefix) | 0 ids / 2 distinct ids / 1 shared id (documented collision) | ✓ PASS |
| Hostile idPrefix injection | quote+script-tag prefix | escaped, no injected element, exactly 1 id | ✓ PASS |
| No `--grid` flag (D-32) | `--grid` on CLI | `E_CLI_USAGE`, exit 2 | ✓ PASS |
| Empty statement + glyph:true | `generateSigil('AEIOU', 'saturn', {glyph:true})` | throws `E_EMPTY_SEQUENCE` before any markup | ✓ PASS |
| README drift guard has teeth | delete/restore a theming-table row | independently reproduced: FAILS naming the gap, PASSES restored | ✓ PASS |
| B1 backstop (viewBox containment, widened tolerance) | all 7 planets × 2 fixtures, curve mode | zero violations within [-1, 100.5] (covers the documented sun overshoot at -0.916) | ✓ PASS (mechanical half only — see human verification) |
| B2 backstop (degenerate/finite) | repeat-carrying statement, curve mode, all planets | no `NaN`/`Infinity`/malformed tokens | ✓ PASS (mechanical half only) |
| B3 backstop (boundary repeat under curve) | element-count check, all planets | 1 start, 1 end, 2 loops per planet | ✓ PASS (mechanical half only — see human verification) |
| B4 backstop (all-layers-on document order) | grid+glyph+curve+repeat render, moon | strictly increasing indices grid<glyph<path<node<start<end<loop | ✓ PASS |
| B5 backstop (grid reveal mechanics) | opacity fallback + literal `fill="none"` + numbers reference a fill var, all planets | all three hold | ✓ PASS (mechanical half only — see human verification) |
| B-E1 backstop (README drift exact-boundary matching) | independently re-run by this verifier | confirmed has teeth (see above) | ✓ PASS |
| B-E2 backstop (no `-0`/exponential) | scanned all curve snapshots directly | zero occurrences | ✓ PASS |

## Gaps Summary

None. Every must-have truth across all four plans' frontmatter, the five ROADMAP success criteria, all requirement IDs (REND-02 through REND-06), and every key link resolved to VERIFIED against direct, independently-run evidence — not SUMMARY.md claims. The full automated suite (1405 tests), typecheck, and lint are all green. Zero runtime dependencies. Construction pipeline (`src/path/`, `src/text/`, `src/data/`) is byte-for-byte unchanged across the whole phase.

The reason overall status is `human_needed` rather than `passed` is that five of the phase's own UI-SPEC backstop truths (B1, B3, B5, and to a lesser extent the general multi-embed/CSS-restyling claim underlying the whole phase goal) explicitly and by design have a visual/rendered-in-a-browser component that no automated test in this suite — or this verification — exercises. This is not a defect: the plan's own test doc comments state plainly, for each of these backstops, what they do and do not prove ("this proves presence and non-coincidence, not visual legibility, which stays a backstop truth for end-of-phase human verification"). This verification confirms every mechanical half directly and surfaces the remaining visual halves as the three human-verification items above.

---

_Verified: 2026-08-06_
_Verifier: Claude (gsd-verifier)_
