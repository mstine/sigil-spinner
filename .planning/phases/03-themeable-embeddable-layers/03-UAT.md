---
status: testing
phase: 03-themeable-embeddable-layers
source: [03-VERIFICATION.md]
started: 2026-08-06T20:35:00Z
updated: 2026-08-06T20:35:00Z
---

## Current Test

number: 1
name: Embed 2+ sigils in a real HTML page and restyle each from CSS alone
expected: |
  Each sigil restyles independently and correctly from CSS alone, with no markup edits.
  Revealing the grid via `--sigil-grid-opacity` shows a visible lattice AND visible cell
  numbers, with no black square painted over the viewBox (backstop B5). No two sigils'
  visuals collide or bleed into each other.
awaiting: user response

## Tests

### 1. Embed 2+ sigils in a real HTML page and restyle each from CSS alone

expected: Each sigil restyles independently from CSS alone, with no markup edits. Revealing the grid via `--sigil-grid-opacity` shows a visible lattice and visible numbers with no black square over the viewBox (B5). No visual collision or bleed between sigils.
why_human: No test in the suite renders the SVG into a DOM or browser. All 1405 automated tests operate on the raw SVG *string* — regex and substring checks on attribute values — never on rendered pixels or computed CSS. This is the literal, load-bearing claim of the phase goal ("restyle every one of them entirely from CSS") and string inspection cannot prove it.
result: [pending]

### 2. Visually inspect curve-mode output across all seven planets

expected: Curves read as smooth, traditionally-plausible sigil paths. The documented `sun` + `"I WILL SUCCEED"` overshoot (control point at y = −0.916) is visually minor and does not clip in a way that looks broken.
why_human: The B1 test proves every control point stays within a stated numeric tolerance (independently re-confirmed during verification), but a centripetal Catmull-Rom curve's analytic extremum *between* control points — and whether the shape "looks right" — is a visual judgment the plan's own test doc comments explicitly disclaim proving.
result: [pending]

### 3. Visually inspect a boundary-repeat render in curve mode

expected: With a repeat landing on the start or end cell, the start marker, end crossbar, and loop markers are all legible and non-overlapping; the boundary-bumped loop radius (D-19) reads correctly.
why_human: The B3 test proves element counts and that no two elements share identical geometry attribute sets (mechanically confirmed), not visual non-overlap in rendered space — which the plan's own test doc comment explicitly disclaims proving.
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
