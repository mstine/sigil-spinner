---
status: testing
phase: 03-themeable-embeddable-layers
source: [03-VERIFICATION.md]
started: 2026-08-06T20:35:00Z
updated: 2026-08-07T13:06:40Z
---

## Current Test

[testing complete]

## Tests

### 1. Embed 2+ sigils in a real HTML page and restyle each from CSS alone

expected: Each sigil restyles independently from CSS alone, with no markup edits. Revealing the grid via `--sigil-grid-opacity` shows a visible lattice and visible numbers with no black square over the viewBox (B5). No visual collision or bleed between sigils.
why_human: No test in the suite renders the SVG into a DOM or browser. All 1405 automated tests operate on the raw SVG *string* — regex and substring checks on attribute values — never on rendered pixels or computed CSS. This is the literal, load-bearing claim of the phase goal ("restyle every one of them entirely from CSS") and string inspection cannot prove it.
result: issue
reported: "the --sigil-grid-number-font-size sliderbar wasn.t having any noticeable affect"
severity: major

### 2. Visually inspect curve-mode output across all seven planets

expected: Curves read as smooth, traditionally-plausible sigil paths. The documented `sun` + `"I WILL SUCCEED"` overshoot (control point at y = −0.916) is visually minor and does not clip in a way that looks broken.
why_human: The B1 test proves every control point stays within a stated numeric tolerance (independently re-confirmed during verification), but a centripetal Catmull-Rom curve's analytic extremum *between* control points — and whether the shape "looks right" — is a visual judgment the plan's own test doc comments explicitly disclaim proving.
result: pass

### 3. Visually inspect a boundary-repeat render in curve mode

expected: With a repeat landing on the start or end cell, the start marker, end crossbar, and loop markers are all legible and non-overlapping; the boundary-bumped loop radius (D-19) reads correctly.
why_human: The B3 test proves element counts and that no two elements share identical geometry attribute sets (mechanically confirmed), not visual non-overlap in rendered space — which the plan's own test doc comment explicitly disclaims proving.
result: pass

## Summary

total: 3
passed: 2
issues: 1
pending: 0
skipped: 0
blocked: 0

## Gaps

- gap_id: G-03-1
  truth: "Every themeable value is exposed as a `--sigil-*` custom property with a default, and a site can change it from CSS alone (REND-05 / SC4)."
  status: failed
  reason: |
    User reported during Test 1 that the `--sigil-grid-number-font-size` slider had no
    noticeable effect. Investigation confirms it never can: 2 of the 15 documented custom
    properties are structurally inert.

    A presentation attribute whose value contains `var()` is parsed as a CSS declaration,
    not by the SVG attribute grammar. CSS `font-size` requires a <length>; a bare unitless
    number is invalid. Both affected properties emit exactly that:

      font-size="var(--sigil-grid-number-font-size, 13.333)"   <- invalid at computed-value time
      font-size="var(--sigil-glyph-size, 30)"                  <- same

    Consequences, both unverified until now:
      1. No override of either property has any effect (any unitless value is equally invalid).
      2. The documented per-planet DEFAULTS never apply either. font-size resolves to `inherit`,
         so grid numbers and glyphs render at the inherited page font-size mapped into user
         units — not 0.4 x cellSize / 0.9 x cellSize. The UI-SPEC's Moon fit check
         ("two-digit text at ~48% of cell width") therefore does not describe what renders.

    The 13 other properties are unaffected: `stroke-width` and `opacity` accept a bare
    <number> in CSS, and `fill`/`stroke`/`font-family` take non-numeric values.
  severity: major
  test: 1
  artifacts:
    - src/render/svg.js  # the two font-size emission sites
    - test/render/theming.test.js  # 53 font-size assertions, all string-level
  missing:
    - "A unit-safe emission for both font-size properties. Candidate fixes, in preference order: (a) calc(var(--x, 13.333) * 1px) — keeps the unitless ergonomics that match --sigil-stroke-width and needs no README change to the value column; (b) append px to both fallbacks and document that overrides must carry a unit."
    - "A resolution-level guard. Every existing font-size test asserts the var() string is PRESENT, never that it RESOLVES — which is why research, UI-SPEC, planner, executor, code review, and verification all passed it. The guard must compare computed values, not markup."
  why_missed: |
    Every gate checked the necessary condition ("is font-size a CSS-mapped property?" — yes)
    and none checked the sufficient one ("is the substituted value valid for that property?"
    — no). Pitfall 8 names this exact failure mode: the theming contract appears wired and
    silently is not. It was reachable only by rendering, which no automated test does.
