---
status: complete
phase: 02-every-planet-every-statement
source: [02-VERIFICATION.md]
started: 2026-08-06T12:20:00Z
updated: 2026-08-06T20:06:56Z
---

## Current Test

[testing complete]

## Tests

### 1. Repeat loop marker reads as a loop at render scale
expected: Open the SVG produced by `node bin/sigil-spinner.js 'CLARITÉ' --planet jupiter` in a browser and confirm the repeat marker reads as a small loop or curl at the cell (per D-17), not a notch/chevron/closed ring. Then run a triple-repeat statement (any statement whose Pythagorean digits contain a run of 3 identical digits) and confirm the two nested loops are individually countable rather than overlapping into one shape.
result: pass
first_run:
  at: 2026-08-06T13:05:00Z
  result: issue
  reported: "These 'loops' aren't loops. They are half circle arcs that aren't even connected to the sigil itself."
  severity: major
  produced_gap: G-02-1
retest:
  at: 2026-08-06T20:06:56Z
  after: "02-03 gap-closure execution (loopLayer rewritten as a cell-anchored, travel-perpendicular full loop)"
  method: "Browser harness rendering three cases side by side at 100px (actual viewBox scale), 200px, and 420px, plus a tinted diagnostic pass isolating the sigil-loop elements. Sources: live `node bin/sigil-spinner.js 'CLARITÉ' --planet jupiter`; committed byte-pins `test/__file_snapshots__/matrix-repeat-saturn.svg` (r=6, r=10.667) and `matrix-repeat-moon.svg` (9x9 kamea, r=2, r=3.556 — worst case, stroke-width equals the inner radius)."
  result: pass
  observed:
    - "CLARITÉ/jupiter: loop reads as a curl with a visible interior hole at 100px — not a notch, chevron, or filled blob; coincident sigil-start marker remains separately legible (D-19)."
    - "matrix-repeat-saturn: the two nested loops are individually countable at 100px, not merged."
    - "matrix-repeat-moon (tightest grid): both loops still resolve as two and each retains a visible hole at 100px."
  signed_off_by: user

### 2. Phase prohibitions hold in shipped code
expected: Independent confirmation of the three prohibitions from the plans' `must_haves.prohibitions` blocks — (1) no character is silently discarded during folding (`normalize()` records a struck entry even for empty folds); (2) no existing marker is suppressed or merged to make room for a repeat loop (`loopLayer` only adds geometry); (3) no accent-folding/Y-handling/transliteration rule exists in code that is not documented in README's "Letter Handling Rules" section. Verifier code-reading found no violations; descriptor-less prohibitions route to human sign-off per the fail-closed contract.
result: pass

## Summary

total: 2
passed: 2
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

- gap_id: G-02-1
  truth: "The sigil-loop element(s) render as visually distinct loops/curls at the cell — a loop being a curl in the line's travel, connected to the sigil path — legible and countable at the 100x100 viewBox scale (D-17)"
  status: closed
  closed_at: 2026-08-06T20:06:56Z
  closed_by: "02-03 (implementation) + user retest of test 1 (visual sign-off)"
  closure_evidence: "Two independent legs. (1) Geometry: 02-VERIFICATION.md re-derived the emitted `d` string live and proved the two-arc idiom is a genuine closed circle whose endpoints are diametrically opposite about the implied center, anchored at the exact coordinate `sigil-path` visits — connectedness provable from the SVG alone. (2) Legibility: user retested all three cases in a browser at 100px actual scale, including the 9x9 moon worst case, and confirmed curl-with-hole and countable nesting. This discharges plan 02-03 must_haves.truths #9, the phase's last `verification: backstop` item."
  original_report:
    reason: "User reported: These 'loops' aren't loops. They are half circle arcs that aren't even connected to the sigil itself."
    severity: major
  test: 1
  root_cause: "Three compounding geometry choices in loopLayer (src/render/svg.js:202-243): (1) the path is an exactly-180° open arc (M(cx-r),cy A r,r 0 1,1 (cx+r),cy); (2) the arc center is translated off the cell by LOOP_OFFSET_FRACTION x cellSize, doubled at start/end coincidence, so it touches nothing; (3) the perpendicular-direction lookup always matches the zero-length within-run hop, so perpendicularUnit(0,0) fires its {x:1,y:0} fallback on every repeat (WR-01) and nested arcs share a left endpoint, reading as a fan. The JSDoc's anti-closed-shape gloss inverted D-17's actual wording. buildPath.js and the working schema are correct — renderer-only bug."
  debug_session: .planning/debug/g-02-1-loops-are-detached-arcs.md
  artifacts:
    - src/render/svg.js  # rewrite loopLayer geometry, fix direction lookup, split IN-03 constant, correct JSDoc
    - test/render/svg.test.js  # add connectedness pin (loop d begins at cell point)
    - test/e2e/phase2-tracer.test.js  # add d-startpoint assertion
    - test/determinism.test.js  # optional IN-04 companion (repeat-carrying matrix statement)
  missing:
    - "Loop anchored at the cell point: full circle through p via two-arc idiom (M p A r,r 0 1,1 antipode A r,r 0 1,1 p), bulging perpendicular to the run's real travel direction"
    - "D-18 nesting by radius growth from the shared cell-point anchor (countable tangent circles)"
    - "D-19 boundary handling by radius increment, never translation"
    - "Real direction derivation: incoming segment at runStart (atPoint-count), fallback outgoing segment, final fallback {x:1,y:0}"
    - "SINGLE_NODE_END_OFFSET_FRACTION decoupled from LOOP_OFFSET_FRACTION so D-27 single-letter sigils stay byte-identical"
