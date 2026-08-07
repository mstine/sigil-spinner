---
phase: 03-themeable-embeddable-layers
reviewed: 2026-08-06T00:00:00Z
depth: standard
files_reviewed: 9
files_reviewed_list:
  - src/render/curve.js
  - src/render/glyphs.js
  - src/render/svg.js
  - src/render/coords.js
  - src/render/json.js
  - src/render/escapeXml.js
  - src/generate.js
  - src/errors.js
  - bin/sigil-spinner.js
findings:
  critical: 0
  warning: 2
  info: 1
  total: 3
status: issues
---

# Phase 3: Code Review Report

**Reviewed:** 2026-08-06
**Depth:** standard
**Files Reviewed:** 9
**Status:** issues_found

## Summary

This is a clean phase. The layer-boundary discipline holds (`render/` never imports `data/kamea.js`; the grid matrix and glyph map both arrive/emit exactly as D-35/D-37 specify), the theming contract is intact (no `style=`, no bare paint literals, and every one of the 15 `var(--sigil-*, ...)` names the code emits is exactly the set the README's theming table claims — cross-checked name-for-name), `idPrefix` is routed through `escapeXml` on its one emission path, and the `roundGeometry`/`GEOMETRY_PRECISION` hoist to `coords.js` is a real fix for a real import cycle (`svg.js` → `curve.js` → `svg.js`) without silently merging it into `COORDINATE_PRECISION`. The hand-rolled centripetal Catmull-Rom math in `curve.js` matches the standard non-uniform tangent formula, and its coincident-point guard (`t12 === 0`) correctly covers both the documented cases (mid-run repeats and duplicated path terminals) without any reachable division-by-zero or `NaN` path I could construct.

I found two real Warnings and one Info-level documentation-drift item — no Critical findings. The most interesting one is a genuine API asymmetry: the JSON working's own `render` block can't be round-tripped back into `generateSigil`'s options in the (default, most common) case where no `idPrefix` was used, despite `json.js`'s own doc comment claiming the block is "sufficient to reproduce the exact SVG from the working alone."

## Warnings

### WR-01: `working.render.idPrefix === null` cannot be round-tripped back into `generateSigil`'s options

**File:** `src/generate.js:126-131` (also `src/render/json.js:49`, `src/generate.js:75-78`, `src/generate.js:268`)

**Issue:** `SigilWorking.render.idPrefix` is typed and documented as `string | null` (`src/render/json.js:49`), and its doc comment states the `render` block is recorded "so a consumer holding only the working can reproduce the exact SVG." When no `idPrefix` was supplied, `generateSigil` resolves it to the literal `null` (`ABSENT_DEFAULT_BY_TYPE.string = null`, `src/generate.js:77`) and that `null` is exactly what lands in `working.render.idPrefix` (`src/generate.js:268`) and survives `JSON.stringify` as `null`.

But `resolveOptions`'s type check (`src/generate.js:117-147`) only treats a value as "absent" when it is strictly `undefined` (line 122: `if (value === undefined)`). A caller who takes the natural next step — feeding `working.render` straight back into `generateSigil`'s third argument to reproduce the sigil — hits `typeof null !== 'string'` at line 126 and gets a thrown `SigilError(E_INVALID_OPTION, ...)` for the *default*, most common case (no `idPrefix` ever used). The one field the library itself uses to represent "no `idPrefix`" is rejected by the library's own option resolver.

This directly undercuts the stated purpose of the `render` block (D-48's "full-trail posture applied to the option surface") for exactly the case that matters most — reproducing output from a stored working when the caller never used `idPrefix` in the first place.

**Fix:** Treat `null` the same as `undefined` for any known option (or at minimum for `idPrefix`, the only nullable one) in `resolveOptions`:
```js
// src/generate.js, inside the KNOWN_OPTIONS loop
const value = options[name];
if (value === undefined || value === null) {
  resolved[name] = ABSENT_DEFAULT_BY_TYPE[expected];
  continue;
}
```

---

### WR-02: `formatCoord`/`roundGeometry` are unguarded against `-0`, and the new curve math is exactly the kind of computation likely to produce it

**File:** `src/render/coords.js:51-54` (`roundGeometry`), `src/render/coords.js:112-114` (`formatCoord`); exercised by `src/render/curve.js:169-177`

**Issue:** `roundGeometry(n)` is `Math.round(n * factor) / factor`. For any `n` that is a genuinely negative number whose magnitude is smaller than half the rounding step (e.g. `-1e-13`, the kind of residual floating-point subtraction/division chains routinely leave behind when the "true" mathematical answer is exactly `0`), `Math.round` returns `-0` (this is a well-documented JS/IEEE-754 behavior: `Math.round(-0.0000001) === -0`), and `-0 / 1000` is still `-0`. `formatCoord` then does `String(n)`, and `String(-0) === '-0'` — not `'0'`.

`formatCoord`'s own doc comment (`coords.js:104-111`) claims it formats "the shortest exact decimal string" for an already-rounded value; a stray `-0` token silently violates that. This isn't hypothetical for this phase specifically: `curve.js`'s new Bezier control-point math (`b1x`/`b1y`/`b2x`/`b2y`, `curve.js:169-172`) computes each coordinate through a chain of subtractions and divisions (`tangentAtQ1`/`tangentAtQ2`, `curve.js:86-112`) that is exactly the shape of computation prone to leaving a tiny negative residual where the geometrically "correct" answer is precisely zero (e.g. any curve segment whose tangent is meant to land exactly on an axis or a path terminal near `x = 0`/`y = 0`). The existing `roundGeometry` call sites in `svg.js` (marker offsets, loop-marker `q` coordinates) carry the identical exposure — this isn't new to `curve.js`, but the hoist this phase makes it the shared, load-bearing rounding point for both.

Note this is distinct from the already-documented, accepted `y = -0.916` viewBox-overshoot finding in the README's Curve Rendering section — that is a real, non-zero, intentionally-undocumented-as-a-defect overshoot. This finding is about the specific `-0` formatting artifact, which is cosmetic (SVG parsers treat `-0` as `0`, so nothing visually breaks) but violates the module's own stated "shortest exact decimal string" contract and is worth closing off cheaply.

**Fix:** Normalize `-0` to `0` at the single shared formatting point:
```js
// src/render/coords.js
export function formatCoord(n) {
  return String(n === 0 ? 0 : n); // n === 0 is true for both +0 and -0; normalizes to '0'
}
```

## Info

### IN-01: Decision ID `D-12` is cited for two unrelated decisions

**File:** `src/generate.js:163`, `src/generate.js:237`, `bin/sigil-spinner.js:20`

**Issue:** `src/generate.js` cites `D-12` twice for planet-argument handling ("there is no default planet," line 163; canonical-lowercase "must not vary with the caller's casing," line 237) — plausibly the same original Phase 1 decision covering both facets of planet handling. `bin/sigil-spinner.js:20`, however, cites the same `D-12` for a completely unrelated topic: stdout/stderr diagnostic-stream purity ("every error/warning/usage message goes to `process.stderr`"). Decision IDs are this project's own audit trail (per the CONTEXT.md canonical-refs convention); one of these two topics is very likely mislabeled, and as written the comment can't be trusted to trace back to the right entry in Phase 1's decision log.

**Fix:** Cross-check both citations against `.planning/phases/01-first-sigil-end-to-end/01-CONTEXT.md`'s actual decision list and correct whichever comment cites the wrong ID.

---

_Reviewed: 2026-08-06_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
