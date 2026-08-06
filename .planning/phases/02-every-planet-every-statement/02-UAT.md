---
status: testing
phase: 02-every-planet-every-statement
source: [02-VERIFICATION.md]
started: 2026-08-06T12:20:00Z
updated: 2026-08-06T12:20:00Z
---

## Current Test

number: 1
name: Repeat loop marker reads as a loop at render scale
expected: |
  The sigil-loop element(s) render as visually distinct open arcs/curls, legible and
  countable at the 100x100 viewBox scale, with no boundary marker or loop obscured by
  another.
awaiting: user response

## Tests

### 1. Repeat loop marker reads as a loop at render scale
expected: Open the SVG produced by `node bin/sigil-spinner.js 'CLARITÉ' --planet jupiter` in a browser and confirm the repeat marker reads as a small loop or curl at the cell (per D-17), not a notch/chevron/closed ring. Then run a triple-repeat statement (any statement whose Pythagorean digits contain a run of 3 identical digits) and confirm the two nested loops are individually countable rather than overlapping into one shape.
result: [pending]

### 2. Phase prohibitions hold in shipped code
expected: Independent confirmation of the three prohibitions from the plans' `must_haves.prohibitions` blocks — (1) no character is silently discarded during folding (`normalize()` records a struck entry even for empty folds); (2) no existing marker is suppressed or merged to make room for a repeat loop (`loopLayer` only adds geometry); (3) no accent-folding/Y-handling/transliteration rule exists in code that is not documented in README's "Letter Handling Rules" section. Verifier code-reading found no violations; descriptor-less prohibitions route to human sign-off per the fail-closed contract.
result: [pending]

## Summary

total: 2
passed: 0
issues: 0
pending: 2
skipped: 0
blocked: 0

## Gaps
