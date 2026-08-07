---
status: resolved
trigger: "G-02-1: These 'loops' aren't loops. They are half circle arcs that aren't even connected to the sigil itself."
created: 2026-08-06T00:00:00Z
updated: 2026-08-07T00:00:00Z
resolved: 2026-08-07T00:00:00Z
symptoms_prefilled: true
goal: find_root_cause_only
resolved_by: 02-03-PLAN.md
---

## Current Focus

hypothesis: CONFIRMED — loopLayer draws a detached 180° semicircular arc offset away from the cell instead of a loop anchored at the cell point; three compounding geometry decisions plus WR-01's dead direction code produce the reported rendering
test: reproduced CLARITÉ/jupiter and BKT RISES/jupiter, traced every constant through loopLayer arithmetic
expecting: n/a — diagnosis complete
next_action: return ROOT CAUSE FOUND to orchestrator (diagnose-only mode)
bug_class: Bohrbug (fully deterministic — byte-identical every run by design)

reasoning_checkpoint:
  hypothesis: "loopLayer's marker geometry is a semicircular open arc translated LOOP_OFFSET (+boundary doubling) along a direction that is always the {x:1,y:0} fallback (WR-01), so it never touches the cell point or any path segment — structurally incapable of reading as a connected cursive loop"
  confirming_evidence:
    - "Reproduced: CLARITÉ/jupiter emits M67.25,87.5 A2.25,2.25 0 1,1 71.75,87.5 — endpoints on a horizontal diameter = 180° arc; nearest point is 4.75 units from cell (62.5,87.5)"
    - "Arithmetic traced: offset 7 = baseOffset 3.5 (0.14×25) + boundaryExtra 3.5 (repeat run includes the start cell); x1 = 62.5+7−2.25 = 67.25 ✓"
    - "BKT RISES: nested arcs share left endpoint 42.25 because offset and radius both grow by nestStep 1.25, so cx−r is constant — arcs fan from one point rather than nest countably"
    - "WR-01 verified in code: segments.find(s => s.to === repeat.atPoint) always finds the zero-length within-run hop → perpendicularUnit(0,0) → {x:1,y:0} fallback on every repeat"
  falsification_test: "If the arc's d attribute started at the cell point (62.5,87.5) or subtended >180°, the hypothesis would be wrong — it does neither"
  fix_rationale: "diagnosis-only; fix direction specified for planner"
  blind_spots: "Did not render visually in a browser; relied on path-data math (unambiguous for A commands). Stroke-width-vs-radius legibility on 9×9 moon grid untested."
  candidate_causes:
    - "code: arc geometry spec (semicircle, translated off-cell) — confirmed primary"
    - "code: WR-01 dead perpendicular logic — confirmed contributing"
    - "config/data: LOOP_OFFSET_FRACTION / boundaryExtra constants — contributing (they are the detachment magnitude)"
    - "environment: ruled out — output deterministic, no renderer/browser variance involved"
  and_gate: "yes — the failure is the conjunction of (a) open-semicircle shape, (b) off-cell translation, (c) always-+x direction. Any one alone would still look wrong but differently; all three must change for the marker to read as a connected loop."

## Symptoms

expected: "D-17: consecutive-repeat marker is a small loop — a circular curl at the cell, part of the sigil's visual language. UAT expectation: a curl in the line's travel, connected to the sigil path, like a cursive loop in handwriting."
actual: "Rendered marker is an open semicircular arc floating beside the cell, touching neither the cell point nor any path segment. Multi-repeats render as concentric arcs sharing one endpoint."
errors: none — output is well-formed, deterministic, passes all tests; this is a geometry-vs-intent gap
reproduction: "generateSigil('CLARITÉ','jupiter') → sigil-loop d=\"M67.25,87.5 A2.25,2.25 0 1,1 71.75,87.5\" vs repeat cell (62.5,87.5); generateSigil('BKT RISES','jupiter') → two arcs sharing left anchor 42.25"
started: shipped this way in Phase 2 (loopLayer's first implementation)

## Eliminated

- hypothesis: "detectRepeats emits wrong repeat data (wrong cell/index)"
  evidence: "working.repeats = [{atPoint:1,count:1}] for CLARITÉ — correct run detection; points/cells correct. Bug is purely in loopLayer rendering."
  timestamp: 2026-08-06
- hypothesis: "environment/renderer variance"
  evidence: "byte-deterministic output; path-data math alone explains the exact reported coordinates"
  timestamp: 2026-08-06

## Evidence

- timestamp: 2026-08-06
  checked: knowledge base (.planning/debug/knowledge-base.md)
  found: does not exist — first debug session in this project
  implication: no prior-pattern candidates
- timestamp: 2026-08-06
  checked: src/render/svg.js loopLayer (202-243), constants (34-44), perpendicularUnit (128-134)
  found: "arc d = M(cx−r,cy) A r,r 0 1,1 (cx+r,cy) — endpoints diametrically opposite on the horizontal → exactly 180°; cx = point.x + perp.x×offset with perp always {x:1,y:0} (WR-01); offset = 0.14×cellSize, doubled when run's cell coincides with start/end cell (D-19 branch)"
  implication: marker is a half-circle translated +x off the cell — matches user's words verbatim
- timestamp: 2026-08-06
  checked: src/path/buildPath.js detectRepeats + RepeatEvent contract
  found: "atPoint = LAST index of run; segments strictly consecutive {from:i,to:i+1}; run occupies indices [atPoint−count, atPoint]; run's first-point incoming segment is s.to === atPoint−count"
  implication: renderer can derive real travel direction without any PathModel/working-schema change
- timestamp: 2026-08-06
  checked: reproduction via node (CLARITÉ/jupiter, BKT RISES/jupiter)
  found: exact reported coordinates reproduced; nested arcs share cx−r because offset and radius both grow by nestStep
  implication: confirmed; nesting also fails D-18's 'countable' intent visually
- timestamp: 2026-08-06
  checked: snapshot inventory (grep sigil-loop over test/**.svg, **.snap)
  found: "ZERO snapshot files contain sigil-loop — 'I WILL SUCCEED' (digits 5,3,1,3,4) has no consecutive repeats, so all seven matrix-*.svg, worked-example.svg, and both .snap files are loop-free (IN-04)"
  implication: a loopLayer-only fix leaves every existing snapshot byte-identical, including Phase 1's worked-example.svg
- timestamp: 2026-08-06
  checked: test/render/svg.test.js (113-164), test/e2e/phase2-tracer.test.js
  found: "loop tests assert counts, radii distinctness (regex expects 'M… A<r>,'), var() paints, byte-determinism — none pin absolute loop coordinates; tracer asserts loop COUNT only"
  implication: radii-regex and count assertions survive a two-arc d shape if it still opens 'M… A…'; add a connectedness assertion (M point === cell point)
- timestamp: 2026-08-06
  checked: endMarker (149-175) coupling
  found: "endMarker's D-27 single-point offset reuses LOOP_OFFSET_FRACTION (IN-03)"
  implication: removing the loop offset must split the constant (SINGLE_NODE_END_OFFSET_FRACTION = 0.14) or single-letter sigils change bytes

## Resolution

root_cause: "Three compounding geometry choices in loopLayer (src/render/svg.js:202-243): (1) the marker is a 180° open arc — M(cx−r,cy) A r,r 0 1,1 (cx+r,cy) has diametrically opposite endpoints, i.e. literally a half circle; (2) the arc is translated LOOP_OFFSET_FRACTION×cellSize (doubled at boundary cells per D-19) away from the cell point, so no part of it touches the cell or any path segment — detached; (3) WR-01: the perpendicular-direction code is dead (incoming segment to atPoint is always the zero-length within-run hop), so the offset is always +x regardless of path travel, and nested loops' left endpoints coincide (offset and radius grow by the same step). The implementation also mis-glossed D-17: the JSDoc claims the open arc avoids 'a closed ring (D-17)', but D-17 says 'small loop (circular curl at the cell)' — the anti-closed-shape reading was the implementer's invention, and it produced the opposite of the locked intent."
fix: "Applied in plan 02-03 (not by this session — this session ran in diagnose-only mode and returned the geometry spec to the planner). loopLayer rewritten as a two-arc closed circle whose path data literally begins and ends at the cell point, removing the LOOP_OFFSET translation entirely; loopDirection() extracted with a three-step real-travel fallback and a centre-ward sign rule, replacing the dead always-{x:1,y:0} lookup (WR-01 root cause); D-18 nesting made countable by growing radius only; D-19 boundary handling compares cell coincidence (row/col) rather than atPoint index equality; D-27's single-node end-bar offset split out as SINGLE_NODE_END_OFFSET_FRACTION so it no longer rides the loop constant (IN-03)."
verification: "Phase 2 UAT test 1 retest, signed off by user 2026-08-06T20:06:56Z — browser harness at 100px actual viewBox scale (plus 200px/420px and a tinted diagnostic pass) over live CLARITÉ/jupiter output and the committed byte-pins matrix-repeat-saturn.svg and matrix-repeat-moon.svg (9x9 worst case, stroke-width equal to inner radius). Loop reads as a curl with a visible interior hole; nested loops individually countable. Recorded in 02-UAT.md; 02-VERIFICATION.md re-verified the phase to 33/33 must-haves with gaps_remaining: []. Independently re-confirmed in .planning/v1.0-MILESTONE-AUDIT.md (seam 1, integration WIRED). Snapshot prediction held: the loop-only fix left every pre-existing snapshot byte-identical, and seven new matrix-repeat-<planet>.svg byte-pins were added."
files_changed:
  - src/render/svg.js
  - test/render/svg.test.js
  - test/e2e/phase2-tracer.test.js
  - test/determinism.test.js
