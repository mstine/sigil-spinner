---
phase: 02-every-planet-every-statement
verified: 2026-08-06T21:40:00Z
status: gaps_found
score: 31/33 must-haves verified
behavior_unverified: 0
overrides_applied: 0
human_verification_closed:
  - at: 2026-08-06T20:06:56Z
    truth: "Plan 02-03 must_haves.truths #9 (verification: backstop) — loop reads as a curl with a visible interior hole; nested loops individually countable at the 100x100 viewBox scale, moon grid included"
    result: pass
    signed_off_by: user
    method: "Browser harness at 100px actual viewBox scale (plus 200px/420px and a tinted diagnostic pass) over live `CLARITÉ`/jupiter output and the committed byte-pins matrix-repeat-saturn.svg and matrix-repeat-moon.svg (9x9 worst case, stroke-width equal to the inner radius)."
    recorded_in: 02-UAT.md (test 1 retest, gap G-02-1 closed)
re_verification:
  previous_status: human_needed
  previous_score: 22/23
  gaps_closed:
    - "G-02-1: consecutive-repeat marker was a detached, off-cell, always-+x half-arc — now a full circle whose path data literally begins and ends at the repeated cell's own center, geometrically confirmed connected to the traced line"
  gaps_remaining: []
  regressions: []
gaps:
  - truth: "A statement that reduces to nothing produces a clear error naming the cause (roadmap SC3 / CONS-03)"
    status: partial
    reason: "For a degenerate statement containing a multi-character transliteration fold (e.g. Æ, æ, ß, œ, þ, ð, all of which fold to two letters per D-23), the E_EMPTY_SEQUENCE message reports the wrong character count. `generateSigil('Ææ', 'saturn')` throws \"Statement reduced to zero kept letters: all 4 characters struck (4 vowels)\" — but the original statement has 2 characters, not 4. The message counts derived classified letters (struck.length) and labels them 'characters', which is only accurate when no fold expands one character into several. This is exactly the overlap the phase goal itself names ('degenerate AND accented' statements) and directly contradicts the criterion's 'clear error naming the cause' — the cause as stated is factually wrong about the input."
    artifacts:
      - path: "src/generate.js"
        issue: "Line ~83-87: interpolates struck.length (count of derived classified letters) into a message that labels the number 'characters', without deduplicating by original character index."
    missing:
      - "Count distinct original character indices (e.g. `new Set(struck.map(e => e.index)).size`) for the 'all N characters struck' figure, or relabel the message to name what is actually being counted."
  - truth: "Accented/non-ASCII input follows a documented, deterministic rule observed applied consistently in output (roadmap SC4 / CONS-04)"
    status: partial
    reason: "README's Letter Handling Rules state a general principle ('Accents are ignored; the base letter is used... every character is folded via NFD') and then list six specific non-decomposable exceptions requiring an explicit table. In practice, other Latin letters whose diacritic is a stroke rather than a combining mark (Ł, ł, Đ, đ, Ħ, ħ, Ŧ, ŧ) are NEITHER decomposed by NFD NOR in the six-entry table, so they are struck with reason 'non-letter' — the same treatment as punctuation or non-Latin scripts (D-24), not the promised 'accents are ignored' treatment. Verified live: `normalize('Đ')` strikes it as non-letter while `normalize('Ð')` (its visual near-twin, already in the D-23 table) keeps it and folds to 'D' — two visually near-identical accented letters produce inconsistent, undocumented treatment, which is precisely what the criterion's 'observe applied consistently in output' language guards against."
    artifacts:
      - path: "src/text/fold.js"
        issue: "TRANSLITERATION_MAP (D-23) omits stroke letters Ł/ł/Đ/đ/Ħ/ħ/Ŧ/ŧ, which NFD also cannot resolve, so they fall through to the non-Latin 'non-letter' strike path despite being Latin letters."
      - path: "README.md"
        issue: "'Letter Handling Rules' rule 2 states the general 'accents are ignored' claim without scoping it away from the stroke-letter class that rule 3's 'six' framing implicitly excludes."
    missing:
      - "Either extend TRANSLITERATION_MAP with the stroke letters under a documented amendment, or narrow README rule 2's general claim to explicitly exclude stroke letters, with a pinned test vector either way so the behavior is a deliberate, cited line item."
human_verification: []
---

# Phase 2: Every Planet, Every Statement Verification Report

**Phase Goal:** Any of the seven classical planets and any statement — including the degenerate and the accented ones — produce either a trustworthy sigil or a clear, actionable error, identically from library and CLI.
**Verified:** 2026-08-06T21:40:00Z
**Status:** gaps_found
**Re-verification:** Yes — after G-02-1 gap closure (plan 02-03)

## Goal Achievement

### G-02-1 Closure Verification (primary focus of this pass)

The prior UAT recorded: *"These 'loops' aren't loops. They are half circle arcs that aren't even connected to the sigil itself."* This verification independently re-derived and executed the fix — not just read the SUMMARY.

| Check | Method | Result |
|---|---|---|
| Loop path begins and ends at the repeated cell's own center | Live `node bin/sigil-spinner.js 'CLARITÉ' --planet jupiter` | `sigil-loop` `d="M62.5,87.5 A4.5,4.5 0 1,1 68.864,81.136 A4.5,4.5 0 1,1 62.5,87.5"` — matches the plan's exact worked-anchor byte value; `sigil-path` also visits `M62.5,87.5 L62.5,87.5` at that same coordinate, so the loop is anchored exactly where the traced line touches the cell |
| The two arcs form a genuine closed circle (not two disconnected semicircles that merely share label text) | Independent geometry computation: center = midpoint(p, q); distance(p, center) and distance(q, center) both computed | Both equal 4.500028 ≈ 4.5 (the declared radius) — p and q are diametrically opposite points on one true circle of the stated radius, confirming the two-arc idiom is mathematically a closed loop |
| Nested loops (run of k=3) share one anchor, differ only by radius | Live `node bin/sigil-spinner.js 'BKT RISES' --planet saturn` | Two `sigil-loop` elements, both `M83.333,16.667 ... 83.333,16.667`; radii 6 and 10.667 — matches the plan's worked example exactly, byte-for-byte |
| Boundary coincidence (repeat lands on start cell) shows both boundary marker and loop, anchor unmoved | Same CLARITÉ/jupiter run | `sigil-start` circle at `62.5,87.5` and `sigil-loop` anchored at the identical `62.5,87.5` both present in one SVG |
| Renderer-only fix (buildPath.js/json.js/generate.js untouched) | `git diff --exit-code -- src/path/buildPath.js src/render/json.js src/generate.js` | exit 0 — clean |
| Every pre-existing snapshot byte-identical | `git status --short` on `test/__file_snapshots__/` and `test/render/__snapshots__` | No changes — only unrelated `.planning/` files are dirty in the working tree |
| Seven-planet byte-pinned repeat matrix | `grep -o sigil-loop test/__file_snapshots__/matrix-repeat-<planet>.svg \| wc -l` for all 7 planets | Exactly 2 per file, all 7 planets, including the tightest 9x9 moon grid (radii 2 and 3.556, both anchored at `61.111,72.222`) |
| Full suite | `npx vitest run` | 184/184 pass, 0 skipped (matches orchestrator's independent count) |
| Typecheck / lint | `npm run typecheck && npm run lint` | Both exit 0 |

**Verdict: G-02-1 is genuinely closed.** The marker is now a mathematically real closed circle whose path data starts and ends at the exact coordinate the traced line visits — connectedness is provable from the emitted `d` string alone, not just claimed. The one remaining item — whether the circle *reads* as a legible curl to a human eye at final render scale — is the plan's own declared `verification: backstop` truth and is carried to human verification below, unchanged in kind from the prior cycle but now backed by disproof of the actual reported defect (disconnection) rather than an untested assumption.

### Observable Truths — Roadmap Success Criteria

| # | Truth | Status | Evidence |
|---|---|---|---|
| SC1 | Any of 7 planets + same statement → 7 visibly distinct sigils on that planet's geometry | ✓ VERIFIED | Live: `Set` of 7 SVGs for `'I WILL SUCCEED'` across all planets has size 7; each contains its own `sigil--<planet>` class |
| SC2 | Consecutive repeats render the loop marker, only on consecutive repeats | ✓ VERIFIED | Live: worked example `'I WILL SUCCEED'`/saturn revisits cell `(1,0)` non-consecutively → 0 `sigil-loop` elements; `normalize('BK')` keeps both letters despite equal encoding (boundary preserved); G-02-1 closure confirms the loop that DOES fire is geometrically real |
| SC3 | Empty reduction → clear error naming cause; single letter → valid single-node sigil | ⚠️ PARTIAL — see gap | Live: `AEIOU`/saturn → `E_EMPTY_SEQUENCE: ... all 5 characters struck (5 vowels)` (accurate for this case); `B`/moon → exit 0, valid single-node sigil (1 node, 1 start, 1 end). **But** `Ææ`/saturn → `"all 4 characters struck"` for a 2-character statement — the count is wrong for any degenerate statement containing a D-23 multi-char fold. See Gaps. |
| SC4 | Accented/non-ASCII + Y follow a documented, deterministic, consistently-observed rule | ⚠️ PARTIAL — see gap | README's `## Letter Handling Rules` documents the Y rule and the D-23 six-entry transliteration table accurately for the cases it covers (live-verified: `RHYTHM`, `YES`, `ÑU`, `ΩЯא你` all match documented behavior exactly). **But** stroke-diacritic Latin letters (Ł, Đ, Ħ, Ŧ and lowercase) are neither decomposed by NFD nor in the table, so they're struck as `non-letter` — contradicting the README's general "accents are ignored" framing, and inconsistent with the visually near-identical `Ð` (already mapped, kept as `D`). See Gaps. |
| SC5 | Byte-identical repeat output; identical errors from library and CLI | ✓ VERIFIED for domain input | Live: two `CLARITÉ`/jupiter runs `diff`-clean; library `svg` value byte-identical to CLI stdout; `AEIOU`/saturn throws the identical `E_EMPTY_SEQUENCE` message and struck-count from both entry points |

**Score:** 31/33 truths verified across roadmap SCs + all three plans' `must_haves.truths` (0 behavior-unverified, 2 partial/gap). See full breakdown below.

> **Update 2026-08-06T20:06:56Z — the one backstop truth is now closed.** Plan 02-03's `must_haves.truths` #9 (loop legibility at render scale) was the sole `PRESENT_BEHAVIOR_UNVERIFIED` item at the time of the original pass. The user performed the specified human check in a browser — all three cases at 100px actual viewBox scale, including the 9x9 moon worst case — and signed off `pass`. Score moves 30/33 → 31/33; `human_verification` is now empty. The two remaining items are the CONS-03 and CONS-04 gaps below, addressed by plan 02-04.

### Plan 02-01 must_haves.truths (carried forward, re-confirmed — no regressions)

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | Accented letter → base letter kept, on any planet (D-22) | ✓ VERIFIED | `foldStatement('ßÉ')` → `SS`/`E`; unchanged from prior cycle |
| 2 | Consecutive-equal-digit pair → exactly one `sigil-loop`, additive to node circles (D-17, D-20) | ✓ VERIFIED | CLARITÉ/jupiter: 1 `sigil-loop`, still 4 `sigil-node` |
| 3 | Run of k equal digits → k-1 loop elements (D-18) | ✓ VERIFIED | BKT RISES/saturn: 2 loops for a run of 3 |
| 4 | Repeat at first/last point → loop AND boundary marker, neither suppressed (D-19) | ✓ VERIFIED | CLARITÉ/jupiter: `sigil-start` + `sigil-loop` both present |
| 5 | Single-kept-letter statement → one node, one start, one end (D-27) | ✓ VERIFIED | `B`/saturn, `B`/moon: 1 each |
| 6 | Every digit 1-9 resolves in-bounds for all 7 planets | ✓ VERIFIED | Unchanged from prior cycle (code-level exhaustive check) |
| 7 | Every coordinate rounds exactly once | ✓ VERIFIED | `loopLayer` routes through the single `roundGeometry` point |
| 8 | Struck/kept entries in original order; ß→SS derived entries share original char/index (D-25) | ✓ VERIFIED | Unchanged from prior cycle |

### Plan 02-02 must_haves.truths (carried forward, re-confirmed — no regressions)

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | Zero kept letters → `E_EMPTY_SEQUENCE` naming total struck + breakdown + `.details.struck` (D-26) | ⚠️ PARTIAL | Message names the total struck DERIVED-LETTER count accurately, but labels it "characters" — wrong when a D-23 multi-char fold is present. See Gaps. |
| 2 | Exactly one kept letter → valid sigil on every planet (CONS-03) | ✓ VERIFIED | Unchanged |
| 3 | Empty/whitespace/non-string → correct SigilError codes | ✓ VERIFIED | Unchanged |
| 4 | Y kept as consonant unless struck as repeat (D-21) | ✓ VERIFIED | Unchanged |
| 5 | Non-Latin struck `non-letter`; fully non-Latin → `E_EMPTY_SEQUENCE` (D-24) | ✓ VERIFIED | Unchanged |
| 6 | README states accent-folding rule + transliteration table as citable rule | ⚠️ PARTIAL | Documented rule is accurate for the six D-23 letters, but is stated more generally than the code actually implements — stroke letters silently fall outside both NFD and the table. See Gaps. |
| 7 | Two calls → byte-equal SVG/JSON via `toBe` (INT-03) | ✓ VERIFIED | Unchanged |
| 8 | Byte-identical for degenerate cases across all 7 planets + CLI (INT-03) | ✓ VERIFIED | Unchanged |
| 9 | JSON working key order fixed | ✓ VERIFIED | Unchanged |
| 10 | Same invalid input → same error identity from library and CLI (INT-04) | ✓ VERIFIED | Unchanged |

### Plan 02-03 must_haves.truths (new — gap-closure plan)

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | Every `sigil-loop` `d` begins and ends at the repeated cell's exact center (G-02-1) | ✓ VERIFIED | Live-confirmed, see G-02-1 table above |
| 2 | Each loop is a full closed circle via exactly two equal-radius arc commands (D-17) | ✓ VERIFIED | Confirmed both textually (`d` string format) and mathematically (p, q equidistant from implied center) |
| 3 | Bulge direction from real travel, never the zero-length within-run hop | ✓ VERIFIED | Code read confirms `loopDirection` searches for segment ending at `atPoint - count`; both worked examples (CLARITÉ, BKT RISES) reproduce the plan's exact predicted byte values, which is only possible if the direction/sign logic is implemented as specified |
| 4 | Run of k → k-1 loops sharing anchor, differing only by radius (D-18) | ✓ VERIFIED | BKT RISES/saturn: both loops anchor `83.333,16.667`, radii 6 vs 10.667 |
| 5 | Boundary repeat → both markers present, loop radius incremented, anchor unmoved (D-19) | ✓ VERIFIED | CLARITÉ/jupiter: anchor `62.5,87.5` matches both the plain base-radius+boundaryStep prediction (0.14+0.04)*25=4.5 and the start-marker's own center |
| 6 | `SINGLE_NODE_END_OFFSET_FRACTION` independent of loop constants; single-letter output byte-identical (IN-03) | ✓ VERIFIED | `grep -c SINGLE_NODE_END_OFFSET_FRACTION src/render/svg.js` shows declaration + 1 consumer only; `git diff` on `single-letter-*.svg` snapshots clean |
| 7 | Every pre-existing committed snapshot byte-identical after this plan | ✓ VERIFIED | `git status --short` shows zero changes under `test/__file_snapshots__/` or `test/render/__snapshots__` |
| 8 | Repeat-carrying statement byte-pinned on all 7 planets (IN-04, INT-03) | ✓ VERIFIED | `matrix-repeat-<planet>.svg` exists and contains exactly 2 `sigil-loop` elements for all 7 planets, confirmed by direct grep count |
| 9 (backstop) | Visual: loop reads as curl w/ visible interior; nested loops individually countable at 100x100 viewBox, moon grid included | ✓ VERIFIED (human sign-off 2026-08-06T20:06:56Z) | Two independent legs. Geometry: underlying defect (disconnection) disproven via independent math — the two arc endpoints are equidistant from their implied center, so the `d` string is a genuine closed circle anchored where the traced path visits the cell. Legibility: user retested all three cases in a browser at 100px actual viewBox scale — live `CLARITÉ`/jupiter, `matrix-repeat-saturn.svg`, and the 9x9 `matrix-repeat-moon.svg` worst case — and confirmed curl-with-visible-hole on all three and countable nesting on both nested cases. Recorded in 02-UAT.md (test 1 retest). |

### Plan 02-03 must_haves.prohibitions (all `verification: test` tier)

| # | Prohibition | Status | Evidence |
|---|---|---|---|
| 1 | MUST NOT modify `buildPath.js`/`json.js`/`generate.js` | ✓ PASSED | `git diff --exit-code` on those three files exits 0 |
| 2 | MUST NOT translate loop anchor away from cell center for any reason | ✓ PASSED | All anchors verified to equal exact cell centers in both worked examples, including boundary and nested cases |
| 3 | MUST NOT suppress/shrink/merge/omit start/end/node markers to make room for a loop | ✓ PASSED | CLARITÉ/jupiter SVG carries `sigil-node` x4, `sigil-start`, `sigil-end`, `sigil-loop` simultaneously — nothing dropped |

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `src/render/svg.js` | `loopLayer` rewritten as cell-anchored, travel-perpendicular full loop; `loopDirection` extracted | ✓ VERIFIED | Read in full; matches the locked geometry spec exactly, byte-reproduced via live execution |
| `test/render/svg.test.js` | Connectedness pin (anchor equality) | ✓ VERIFIED | Included in the 184-test passing suite |
| `test/e2e/phase2-tracer.test.js` | Tracer anchor assertion | ✓ VERIFIED | Included in passing suite |
| `test/determinism.test.js` | Repeat-carrying seven-planet snapshot matrix | ✓ VERIFIED | Second `describe.each(PLANETS)` block confirmed present and passing |
| `test/__file_snapshots__/single-letter-{saturn,moon}.svg` | D-27 byte-neutrality goldens | ✓ VERIFIED | Both present, git-clean |
| `test/__file_snapshots__/matrix-repeat-<planet>.svg` (x7) | Repeat-carrying byte pins per kamea order | ✓ VERIFIED | All 7 present, each with exactly 2 `sigil-loop` elements |

### Key Link Verification

All key links from the prior verification cycle remain wired and are unaffected by this plan (renderer-only change, verified by the clean `git diff` on `buildPath.js`/`json.js`/`generate.js`). New for 02-03:

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `src/render/svg.js` `loopLayer` | `src/path/buildPath.js` `RepeatEvent` | `loopDirection` resolves `atPoint - repeat.count` against `segments` | ✓ WIRED | Confirmed by exact byte reproduction of both worked examples, which is only achievable if the index arithmetic and fallback chain are implemented as specified |
| `src/render/svg.js` `loopLayer` | `src/render/coords.js` | Every loop coordinate rounds once through `roundGeometry` before `formatCoord` | ✓ WIRED | Emitted values match the plan's hand-derived expected values to 3 decimal places, consistent with the single-rounding-point contract |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Full suite passes | `npx vitest run` | 184/184 pass, 0 skipped | ✓ PASS |
| Typecheck clean | `npm run typecheck` | exit 0 | ✓ PASS |
| Lint clean | `npm run lint` | exit 0 | ✓ PASS |
| G-02-1 worked example, exact byte match | CLARITÉ/jupiter | `d` starts/ends `62.5,87.5`, radius `4.5` — matches plan spec exactly | ✓ PASS |
| G-02-1 nested-run worked example, exact byte match | BKT RISES/saturn | Two loops, radii 6 and 10.667, both anchored `83.333,16.667` — matches plan spec exactly | ✓ PASS |
| Repeat-matrix loop count, all 7 planets | `grep -o sigil-loop \| wc -l` per `matrix-repeat-<planet>.svg` | 2 for every planet | ✓ PASS |
| All 7 planets produce distinct sigils | Set-size check | size 7 | ✓ PASS |
| Determinism (2 runs, CLI = library) | `diff` | identical | ✓ PASS |
| Degenerate error, simple case | `AEIOU`/saturn | `E_EMPTY_SEQUENCE`, count accurate (5 chars, 5 struck) | ✓ PASS |
| Degenerate error, multi-char-fold case | `Ææ`/saturn | `E_EMPTY_SEQUENCE`, **count inaccurate** (2 chars, message says 4) | ✗ FAIL — see Gaps |
| CLI malformed-flag exception safety | `sigil-spinner.js 'test' --planett saturn` | Raw Node `ERR_PARSE_ARGS_UNKNOWN_OPTION` stack trace to stderr, not the tool's `CODE: message` diagnostic format | ✗ Confirms CR-01 (advisory — see below) |
| Stroke-letter consistency | `normalize('Đ')` vs `normalize('Ð')` | `Đ` struck `non-letter`; `Ð` kept, folds to `D` | ✗ FAIL — see Gaps |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|---|---|---|---|---|
| KAMEA-02 | 02-01, 02-02 | Select any of 7 planets; direct 1-9 cell lookup | ✓ SATISFIED | Distinctness + exhaustive cell-bounds checks |
| PATH-02 | 02-01, 02-03 | Consecutive repeats produce loop marker, only on consecutive repeats | ✓ SATISFIED | G-02-1 closure confirms the marker is now geometrically real; non-consecutive recurrence confirmed inert |
| CONS-03 | 02-02 | Degenerate inputs handled — empty → clear error, single-letter → valid sigil | ⚠️ PARTIALLY SATISFIED | Simple degenerate case correct; multi-char-fold degenerate case reports a wrong character count — see Gaps |
| CONS-04 | 02-01, 02-02 | Non-ASCII/accented + Y-handling follow documented, deterministic rule | ⚠️ PARTIALLY SATISFIED | Documented rule accurate for the six D-23 table letters and Y; stroke letters fall outside both NFD and the table, contradicting the README's general framing — see Gaps |
| INT-03 | 02-02, 02-03 | Byte-identical output, verified across all 7 planets | ✓ SATISFIED | Determinism matrix now includes a repeat-carrying case per planet in addition to the original |
| INT-04 | 02-02 | Input validation lives in library, not CLI; identical guarantees | ✓ SATISFIED for domain input | Library/CLI error identity confirmed for statement/planet validation. CLI-syntax-level failures (malformed flags) are a separate, CLI-only failure mode not covered by this requirement's literal scope — flagged advisory below, not counted against INT-04. |

No orphaned requirements — all 6 IDs mapped to Phase 2 in REQUIREMENTS.md appear in the `requirements` frontmatter across the three plans.

### Anti-Patterns Found

None of the blocker class (`TBD`/`FIXME`/`XXX`) in any file touched by 02-03. No stub patterns in `loopLayer` or its helpers.

### Advisory: Code Review Findings Not Counted as Gaps

Per this verification's scope, code review findings are advisory unless they verifiably contradict a stated success criterion. Two (WR-04, WR-05 in the review's numbering) were independently reproduced and DO contradict SC3/SC4 — they are promoted to gaps above. The remaining findings do not contradict any of the 5 numbered success criteria directly, but two are worth flagging because they bear on the phase's overarching goal sentence ("a clear, actionable error... identically from library and CLI"):

- **CR-01/CR-02 (CLI exception safety):** Independently reproduced. `bin/sigil-spinner.js`'s `parseArgs()` call and its `readFileSync(0, ...)` stdin read both execute outside the script's own `try/catch`. A malformed CLI invocation — a typo'd flag (`--planett`) or a `type: 'string'` option with no value (`--planet` at end of argv) — crashes with Node's raw, unhandled-exception stack trace on stderr instead of the tool's documented `CODE: message` diagnostic format. Confirmed live: `node bin/sigil-spinner.js 'test' --planett saturn` and `node bin/sigil-spinner.js 'test' --planet` both produce `ERR_PARSE_ARGS_*` stack traces, not a clean usage error. This is a CLI-syntax failure mode (not a statement/planet *domain* input failure), so it does not contradict SC5's literal text or INT-04's "input validation lives in the library" contract — the library has no equivalent concept of CLI flags. It does undermine the phase goal's general promise of "a clear, actionable error... from... the CLI" for any failure mode, and is recorded here as a known, tracked (02-REVIEW.md CR-01/CR-02), not-yet-fixed defect that a future gap-closure or Phase-3 plan should address.

Not independently re-verified in this pass (accepted on the review's own evidence, since they don't bear on the phase's stated success criteria): WR-01/WR-02 (extra positional args silently truncate the statement), WR-03 (`.toUpperCase()` ligature-expansion provenance gap), WR-06 (invisible-character regex hazard), WR-07 (`escapeXml` doesn't strip XML-invalid control chars), IN-01/IN-02/IN-03.

## Gaps Summary

**G-02-1 (loop geometry) is closed — fully, on both legs.** This verification independently reproduced the exact byte values the gap-closure plan specified, and went further — it mathematically confirmed the two-arc `d` string is a genuine closed circle (not merely two strings sharing an endpoint label) and that the anchor coincides with where the traced path itself visits the cell. Every pre-existing snapshot is untouched, the renderer-only constraint holds, and the full 184-test suite plus typecheck and lint are clean. **The remaining backstop truth (final-render legibility) was subsequently signed off by the user on 2026-08-06T20:06:56Z** — browser retest at 100px actual viewBox scale across live `CLARITÉ`/jupiter and the two committed nested-loop byte-pins, moon 9x9 worst case included. Nothing about G-02-1 is outstanding.

**Two new gaps surfaced by cross-referencing 02-REVIEW.md against the phase's own success-criteria wording, both independently reproduced by live execution (not accepted on the review's word alone):**

1. **CONS-03 / SC3 partial failure:** `E_EMPTY_SEQUENCE`'s message miscounts the original statement's characters whenever the statement contains a D-23 multi-character fold (Æ, æ, ß, œ, þ, ð and their case variants). `generateSigil('Ææ', 'saturn')` reports "all 4 characters struck" for a 2-character input. This directly contradicts "produces a clear error naming the cause" for exactly the input class the phase goal names as in-scope ("the degenerate and the accented ones").
2. **CONS-04 / SC4 partial failure:** Latin stroke letters (Ł, Đ, Ħ, Ŧ and lowercase) are neither NFD-decomposable nor present in the D-23 transliteration table, so they're struck as `non-letter` — contradicting the README's general "accents are ignored" framing and producing an observably inconsistent result against the visually near-identical, already-mapped `Ð`.

Both are narrow-input-class defects (uncommon Unicode characters), not core-path failures — the primary English/common-accent flows, all 7 planets, determinism, and the phase's headline G-02-1 fix are all solid. But per the instruction to weigh review findings against the literal success-criteria text, both are verified, reproducible contradictions of explicit criteria and are structured as gaps rather than absorbed into a `passed` verdict.

---

*Verified: 2026-08-06T21:40:00Z*
*Verifier: Claude (gsd-verifier)*
