# Phase 3: Themeable, Embeddable Layers - Pattern Map

**Mapped:** 2026-08-06
**Files analyzed:** 9 (created/modified)
**Analogs found:** 9 / 9 — this phase is unusual in that every new file's closest analog lives inside the same file or the same small module set already in the repo.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `src/render/svg.js` (MODIFIED — add `gridLayer()`, `glyphLayer()`, curve branch in `pathLayer()`) | render/transform | transform (PathModel → SVG string) | `loopLayer()` / `nodeLayer()` / `renderSvg()` layer array — **same file** | exact |
| `src/render/curve.js` (NEW) | utility (pure geometry) | transform | `src/render/coords.js` (single-purpose pure geometry module, one documented rounding point) | role-match |
| `src/render/glyphs.js` (NEW) | model/config (literal data module) | CRUD (read-only lookup) | `src/data/kamea.js` (`KAMEA_SETS` literal + accessor functions + cited-source header) | exact |
| `src/generate.js` (MODIFIED — option resolution/validation, `kameaGrid()` call) | controller/orchestrator | request-response | itself — the existing `renderSvg(path, { ...options, statement })` seam | exact |
| `src/errors.js` (MODIFIED — add `E_INVALID_OPTION`) | model (error taxonomy) | n/a | itself — existing `E_*` constants + `SigilError` structured-data convention | exact |
| `src/render/json.js` (MODIFIED — add `render` block) | service (serializer) | transform | itself — `toWorking()` field-ordering discipline | exact |
| `bin/sigil-spinner.js` (MODIFIED — 3 new `parseArgs` options, options object as 3rd arg) | CLI/controller | request-response | itself — existing `options: { planet, json, output }` block + `EXIT_CODES` map | exact |
| `test/*.test.js` (NEW test files/extensions) | test | batch/snapshot | `test/determinism.test.js` + `test/__file_snapshots__/matrix-*.svg` matrix convention | exact |
| `README.md` (MODIFIED — add `--sigil-*` theming table) | docs/config | n/a | existing "Letter Handling Rules" table (README.md:94) | role-match |

## Pattern Assignments

### `src/render/svg.js` (render, transform) — gains `gridLayer()`, `glyphLayer()`, curve branch

**Analog:** same file — `loopLayer()`, `nodeLayer()`, and the `renderSvg()` layer-array assembly.

**Header/module doc-comment voice** (lines 1-14): every new sub-renderer and constant must match this density — a rationale paragraph, not just a type signature. The header already anticipates this phase explicitly ("a future layer (grid, glyph — Phase 3) can be added at this seam") and states the id-free/no-`style=` invariants that D-42/D-43 turn into tests.

**`*_FRACTION` constant convention** (lines 21-77) — copy this exact shape for every new constant (`GRID_STROKE_WIDTH_FRACTION`, `GRID_NUMBER_FONT_SIZE_FRACTION`, `GLYPH_SIZE_FRACTION` per UI-SPEC):
```js
/**
 * Fraction of a cell's side length used for the (hidden-by-default) node
 * radius. Derived from `cellSize`, never a hardcoded unit constant, so
 * marker geometry stays consistent across all seven kamea orders (D-07).
 */
const NODE_RADIUS_FRACTION = 0.06;
```
Every fraction constant carries a paragraph explaining *why* that specific number, referencing the tightest kamea (moon, 9×9) as the stress case — new constants must do the same (UI-SPEC's `GRID_NUMBER_FONT_SIZE_FRACTION` rationale already models this: "Verified arithmetically... to fit 2-digit numbers... at every order").

**Single-rounding discipline** (lines 79-86):
```js
const GEOMETRY_PRECISION = 3;
function roundGeometry(n) {
  const factor = 10 ** GEOMETRY_PRECISION;
  return Math.round(n * factor) / factor;
}
```
Every new geometry value (grid line positions, grid-number anchor, glyph anchor) must route through this exact function, once, per D-31/D-41's discipline — never re-round an already-rounded value.

**Per-collection layer pattern — copy `nodeLayer()` for `gridLayer()`'s number sub-part** (lines 124-134):
```js
function nodeLayer(pathModel) {
  const radius = roundGeometry(cellSize(pathModel.gridSize) * NODE_RADIUS_FRACTION);
  return pathModel.points
    .map(
      (point) =>
        `<circle class="sigil-node" cx="${formatCoord(point.x)}" cy="${formatCoord(point.y)}" ` +
        `r="${formatCoord(radius)}" fill="var(--sigil-node-fill, currentColor)" ` +
        `opacity="var(--sigil-node-opacity, 0)" />`,
    )
    .join('');
}
```
This is the exact `.map().join('')` shape for emitting `order²` `sigil-grid-number` `<text>` elements from `kameaGrid()`'s row-major grid.

**Single-element-with-composed-`d`-string pattern — copy `pathLayer()` for `gridLayer()`'s lattice** (lines 97-113):
```js
function pathLayer(pathModel) {
  if (pathModel.points.length < 2) {
    return '';
  }
  const [first, ...rest] = pathModel.points;
  const d = [
    `M${formatCoord(first.x)},${formatCoord(first.y)}`,
    ...rest.map((point) => `L${formatCoord(point.x)},${formatCoord(point.y)}`),
  ].join(' ');
  return (
    `<path class="sigil-path" d="${d}" ` +
    `stroke="var(--sigil-stroke, currentColor)" ` +
    `stroke-width="var(--sigil-stroke-width, 2)" fill="none" />`
  );
}
```
`sigil-grid-lines` (D-33, one `<path>` carrying all lattice lines) follows this same "build an array of `d` command fragments, `.join(' ')`, emit one element" shape — but per UI-SPEC's implementation note, must add `fill="none"` explicitly (an M/L-only path defaults to filled black otherwise — this is new territory `pathLayer` doesn't need to guard because its stroke-only intent is identical but the existing code already sets `fill="none"` too, so the convention already covers it; just don't drop it for the grid).

**`var()` attribute idiom — concrete emitted-string examples to copy verbatim, extending with new property names:**
```js
stroke="var(--sigil-stroke, currentColor)"
stroke-width="var(--sigil-stroke-width, 2)"
fill="var(--sigil-node-fill, currentColor)"
opacity="var(--sigil-node-opacity, 0)"
```
New attributes per D-40/UI-SPEC theming table: `opacity="var(--sigil-grid-opacity, 0)"` on the wrapping `<g class="sigil-grid">`, `stroke="var(--sigil-grid-stroke, currentColor)"`, `stroke-width="var(--sigil-grid-stroke-width, <computed-fallback>)"`, `fill="var(--sigil-grid-number-fill, currentColor)"`, `font-size="var(--sigil-grid-number-font-size, <computed-fallback>)"`, `font-family="var(--sigil-grid-number-font, sans-serif)"`, and the glyph equivalents (`--sigil-glyph-fill`, `--sigil-glyph-opacity`, `--sigil-glyph-size`, `--sigil-glyph-font`). Only paint-family attributes (`fill`, `stroke`, `stroke-width`, `opacity`, `font-size`, `font-family`) get `var()` — geometry (`cx`, `cy`, `x`, `y`, `d` contents) stays literal, exactly as the existing code already does (Pitfall B).

**Text-centering idiom (new to this file, but locked by D-34/D-38 and UI-SPEC Pattern 5):**
```js
`<text class="sigil-grid-number" x="${formatCoord(x)}" y="${formatCoord(y)}" ` +
  `text-anchor="middle" dominant-baseline="central" ` +
  `fill="var(--sigil-grid-number-fill, currentColor)" ` +
  `font-size="var(--sigil-grid-number-font-size, ${fallback})" ` +
  `font-family="var(--sigil-grid-number-font, sans-serif)">${value}</text>`
```
Same pair (`text-anchor="middle" dominant-baseline="central"`) for `sigil-glyph`.

**Layer-array assembly — the exact insertion point (D-39)** (lines 380-394):
```js
export function renderSvg(pathModel, options = {}) {
  const layers = [
    pathLayer(pathModel),
    nodeLayer(pathModel),
    startMarker(pathModel),
    endMarker(pathModel),
    loopLayer(pathModel),
  ]
    .filter(Boolean)
    .join('');

  const title = options.title ? `<title>${escapeXml(options.statement ?? '')}</title>` : '';

  return `<svg xmlns="${SVG_NAMESPACE}" viewBox="0 0 100 100" class="sigil sigil--${pathModel.planet}">${title}${layers}</svg>`;
}
```
D-39 grows this array at its **head**: `[gridLayer(pathModel, options), glyphLayer(pathModel, options), pathLayer(pathModel, options), nodeLayer(pathModel), startMarker(pathModel), endMarker(pathModel), loopLayer(pathModel)]`. `gridLayer` always contributes (D-32 — no flag, hidden via opacity); `glyphLayer` returns `''` when `options.glyph` is falsy, following the exact `.filter(Boolean)` empty-layer-vanishes convention `pathLayer` already established for the sub-two-point case. `pathLayer` itself needs a new `options.curve` parameter threaded in — note it currently takes only `pathModel`; every layer function's signature will need `options` added, matching how `renderSvg` already receives it.

**Error/fallback idiom for degenerate geometry — copy `perpendicularUnit()`'s doc-comment posture** (lines 152-171) for the curve module's exact-zero knot-interval guard: state explicitly which call sites guarantee the non-degenerate input and why the fallback branch is defensive, not a live path. This is the file's established voice for "this guard exists but should not normally trigger."

---

### `src/render/curve.js` (NEW) — Catmull-Rom → Bézier curve math

**Analog:** `src/render/coords.js` — single-purpose pure geometry module, one documented rounding contract, no side effects, functions exported individually.

**Module header pattern to copy** (`coords.js` lines 1-18):
```js
/**
 * The single shared (row, col) -> viewBox (x, y) coordinate transform
 * (Pitfall 10 — duplicated coordinate math is how renderers silently drift
 * apart). Every module that needs a coordinate goes through this file; no
 * other module computes cell size or cell center independently.
 * ...
 */
const COORDINATE_PRECISION = 3;
```
`curve.js` should open with an equivalent header naming its single responsibility (centripetal Catmull-Rom → cubic Bézier control points for one segment) and explicitly cross-reference `svg.js`'s `roundGeometry`/`GEOMETRY_PRECISION` as the rounding point it must route through (per D-31, round once, at computation, never re-derive from already-rounded values — the exact same discipline `coords.js`'s header states for its own module).

**Format-only, never-round function pattern** (`coords.js` lines 67-78):
```js
export function formatCoord(n) {
  return String(n);
}
```
`curve.js` should NOT duplicate a formatter — import `formatCoord` from `coords.js`, matching how `svg.js` already does (`import { cellSize, formatCoord } from './coords.js';`, line 16). Keep formatting singular across the codebase, per the file's own "no duplicated math" mandate.

**No direct precedent for the Bézier arithmetic itself** — RESEARCH.md Patterns 1-3 and the "Full curved-segment builder" code example are the load-bearing reference here since no existing file in the repo does spline math. Follow research's `curvedSegment`/`curvedPathD` shape but route every emitted coordinate through `svg.js`'s `roundGeometry` (or hoist it to `coords.js` if that reads cleaner — CONTEXT.md leaves this as discretion).

---

### `src/render/glyphs.js` (NEW) — planet → Unicode glyph literal map

**Analog:** `src/data/kamea.js` — `KAMEA_SETS` literal + citation-in-header + case-insensitive accessor functions (`resolvePlanetKey`, `gridSize`, `cellForNumber`).

**Citation-header posture to copy** (`kamea.js` lines 1-67): cite the exact source for every code point (D-37 already supplies these: Saturn U+2644, Jupiter U+2643, Mars U+2642, Sun U+2609, Venus U+2640, Mercury U+263F, Moon U+263D), plus the VS15 (U+FE0E) mitigation rationale from RESEARCH.md Pitfall C. State plainly, as `kamea.js` does, "No other module ... may contain a ... literal" — for glyphs, the equivalent invariant per D-37 is: this map lives in `render/`, not `data/`, and nothing outside `svg.js`'s glyph sub-renderer should read it directly except through an exported lookup function.

**Literal map + accessor shape to copy** (`kamea.js` lines 89-148 for the data shape; lines 157-172 for the case-insensitive accessor):
```js
const PLANET_ORDER = ['saturn', 'jupiter', 'mars', 'sun', 'venus', 'mercury', 'moon'];

export const KAMEA_SETS = {
  agrippa: {
    saturn: [ ... ],
    ...
  },
};

function resolvePlanetKey(planet) {
  if (typeof planet !== 'string') { throw new SigilError(...); }
  const key = planet.toLowerCase();
  if (!PLANET_ORDER.includes(key)) { throw new SigilError(...); }
  return key;
}
```
`glyphs.js` should export a flat `PLANET_GLYPHS` object (planet → code-point-plus-VS15 string, per RESEARCH.md's Code Examples section) plus a `glyphFor(planet)` accessor doing the identical case-insensitive lowercase-and-validate dance — but note `glyphs.js` must NOT import from `errors.js`'s `E_UNKNOWN_PLANET` machinery unless truly warranted; since `svg.js` only ever calls this with the already-canonicalized `pathModel.planet` (lowercased in `generate.js`, line 113), a defensive validation branch is likely unnecessary — follow `kamea.js`'s posture only where it actually applies.

**Important boundary note (D-37):** unlike `kamea.js`, this file must NOT be imported by `generate.js` or `data/` — it is read only from within `render/svg.js`'s glyph sub-renderer, keeping the render layer self-contained per ARCHITECTURE.md's cross-layer-import rule (only `generate.js` crosses layers).

---

### `src/generate.js` (MODIFIED) — option resolution/validation, `kameaGrid()` call

**Analog:** itself — the existing `statement` render-time-data-through-options-object seam.

**The exact precedent to extend** (line 117):
```js
const svg = renderSvg(path, { ...options, statement });
```
D-35 says grid data travels the same route: `renderSvg(path, { ...options, statement, grid: kameaGrid(canonicalPlanet, ...) })` (exact key name is executor discretion, but the *mechanism* — spread `options`, append computed render-time data — is locked by this precedent). Do not widen `PathModel` (`buildPath.js` stays untouched per Phase Boundary) and do not have `render/svg.js` import `data/kamea.js` directly.

**Validation-throw pattern to copy** (lines 53-66, the `E_MISSING_STATEMENT` / `E_MISSING_PLANET` guards):
```js
if (typeof statement !== 'string' || statement.length === 0) {
  throw new SigilError(
    E_MISSING_STATEMENT,
    `generateSigil: statement is required and must be a non-empty string, got: ${JSON.stringify(statement)}`,
  );
}
```
D-47's `E_INVALID_OPTION` guard for `curve`/`glyph`/`idPrefix`/`title` type-checking should follow this exact shape: a `typeof` check, a `SigilError` throw naming the offending option in the message, with structured `.details` attached (see `errors.js` pattern below). Unknown option keys are silently ignored (forward compatibility) — no guard needed for those, only for known-but-wrong-typed values.

**Structured-data throw precedent** (lines 98-103, `E_EMPTY_SEQUENCE`):
```js
throw new SigilError(
  E_EMPTY_SEQUENCE,
  `Statement reduced to zero kept letters: all ${characterCount} character${characterCount === 1 ? '' : 's'} struck${strikeScope} (${breakdown}).`,
  { struck },
);
```
`E_INVALID_OPTION` should attach `{ option: '<name>', value: <received>, expected: '<type>' }` or similar as its third-argument `details` object — same "humans read the message, programs introspect the data" posture (D-26/D-47).

---

### `src/errors.js` (MODIFIED) — add `E_INVALID_OPTION`

**Analog:** itself — the existing `E_*` constant block + `SigilError` class.

**Exact pattern to copy** (lines 11-21):
```js
/** The kept-letter sequence reduced to zero letters after normalization. */
export const E_EMPTY_SEQUENCE = 'E_EMPTY_SEQUENCE';

/** An unknown planet name (or unknown kamea set name) was requested. */
export const E_UNKNOWN_PLANET = 'E_UNKNOWN_PLANET';
```
Add:
```js
/** A known render option was supplied with the wrong type (D-47). */
export const E_INVALID_OPTION = 'E_INVALID_OPTION';
```
`SigilError`'s constructor (lines 23-43) needs no changes — it already supports the `{ details }` third argument this new code will use.

---

### `src/render/json.js` (MODIFIED) — add `render` block to `SigilWorking`

**Analog:** itself — `toWorking()`'s field-ordering discipline and the `SigilWorking`/`GeneratePipelineResult` typedefs.

**Exact pattern to copy** (lines 75-105): the function destructures a fixed input shape and returns an object literal with **fixed key order** — "Fields are emitted in a fixed key order so `JSON.stringify` output is byte-stable" (line 69-70). D-48's `render` block (`{ curve, glyph, idPrefix, title }`) must be appended as a new key at the **end** of the returned object (after `repeats`, matching how `test/determinism.test.js`'s key-order test at line 172-191 asserts `keptTrail`/`repeats` were appended after the frozen Phase 1 key order — `render` continues that same append-only convention). `generate.js` must pass the resolved option values into `toWorking()`'s input (extend `GeneratePipelineResult`'s typedef, lines 52-64, with a `render` or individual option fields).

**Typedef-extension pattern** (lines 33-49, `SigilWorking`): add
```
* @property {{ curve: boolean, glyph: boolean, idPrefix: string | undefined, title: boolean }} render - Resolved option values (D-48), sufficient to reproduce the exact SVG from the working alone.
```

---

### `bin/sigil-spinner.js` (MODIFIED) — `--curve`, `--glyph`, `--id-prefix` flags; options object as 3rd arg

**Analog:** itself — the existing `parseArgs` options block and `EXIT_CODES` map.

**Exact pattern to copy for new flags** (lines 92-99):
```js
parsed = parseArgs({
  allowPositionals: true,
  options: {
    planet: { type: 'string' },
    json: { type: 'boolean', default: false },
    output: { type: 'string' },
  },
});
```
Extend to:
```js
options: {
  planet: { type: 'string' },
  json: { type: 'boolean', default: false },
  output: { type: 'string' },
  curve: { type: 'boolean', default: false },
  glyph: { type: 'boolean', default: false },
  'id-prefix': { type: 'string' },
},
```
(No `--grid` flag — D-32.)

**Value-extraction cast pattern** (lines 106-111):
```js
const planetArg = /** @type {string} */ (values.planet);
const jsonArg = /** @type {boolean} */ (values.json);
const outputArg = /** @type {string | undefined} */ (values.output);
```
Add matching casts for `curveArg`, `glyphArg`, `idPrefixArg`.

**Call-site change** (line 124): `generateSigil(statement, planetArg)` becomes `generateSigil(statement, planetArg, { curve: curveArg, glyph: glyphArg, idPrefix: idPrefixArg })` — this is D-46's "for the first time — actually builds an options object" seam.

**`EXIT_CODES` map extension** (lines 43-48):
```js
const EXIT_CODES = {
  E_MISSING_STATEMENT: 2,
  E_MISSING_PLANET: 2,
  E_UNKNOWN_PLANET: 2,
  E_EMPTY_SEQUENCE: 3,
};
```
Add `E_INVALID_OPTION: 2,` — joins the existing usage-class exit code, per D-47.

---

### `test/*.test.js` (NEW/extended) — determinism, guard tests, snapshot matrices

**Analog:** `test/determinism.test.js` — the `describe.each(PLANETS)` matrix convention and the `matrix-${planet}.svg` naming scheme.

**Exact matrix pattern to copy** (lines 78-89):
```js
describe.each(PLANETS)('Determinism matrix — %s (KAMEA-02, INT-03)', (planet) => {
  it('produces strictly equal SVG and working across two calls, and matches its committed snapshot', async (ctx) => {
    const first = generateSigil(STATEMENT, planet);
    const second = generateSigil(STATEMENT, planet);
    expect(first.svg).toBe(second.svg);
    expect(JSON.stringify(first.working)).toBe(JSON.stringify(second.working));
    await ctx.expect(first.svg).toMatchFileSnapshot(`./__file_snapshots__/matrix-${planet}.svg`);
  });
});
```
Extend for curve/grid/glyph combinations following the same `matrix-repeat-${planet}.svg` / `matrix-stroke-${planet}.svg` naming convention (lines 107-118, 131-145) — e.g. `matrix-curve-${planet}.svg`, `matrix-glyph-${planet}.svg`. `PLANETS` constant (line 22) is reused verbatim.

**Assertion-not-just-snapshot pattern** (lines 112-115): `expect(first.svg.match(/class="sigil-loop"/g) ?? []).toHaveLength(2);` — copy this "assert element count directly via regex match, not only via snapshot diff" idiom for D-42's guard tests (no `style=`, no bare color, every `--sigil-*` name documented) and D-43's id-free guard.

**Guard-test regex scoping** — use RESEARCH.md's `STYLE_ATTR = /\sstyle\s*=/` and `ID_ATTR = /\sid\s*=\s*"/` (scoped, not bare substring) per Pitfall D — this is new to the test suite but the "Code Examples" section of RESEARCH.md already supplies the exact test code to adapt; the file-snapshot infra doesn't need to change, just add new `it()` blocks to a guard-test file (new `test/render/svg.test.js` per RESEARCH.md's Recommended Project Structure, or an extension of an existing test file — CONTEXT.md leaves shape to discretion).

**CLI/library parity test pattern** (lines 37-43):
```js
it('produces the same svg through the library call as through the CLI subprocess', () => {
  const { svg } = generateSigil(STATEMENT, PLANET);
  const cliOutput = execFileSync(process.execPath, [CLI_PATH, STATEMENT, '--planet', PLANET], {
    encoding: 'utf-8',
  });
  expect(cliOutput).toBe(svg);
});
```
Extend with `--curve`, `--glyph`, `--id-prefix` flags for D-46's new CLI surface.

**Multi-embed id-collision test (D-45)** — no direct existing analog (new assertion type); write as a plain `it()` using two `generateSigil()` calls concatenated into one string and a regex match count, following the same `expect(...).toHaveLength(n)` idiom as line 115.

---

### `README.md` (MODIFIED) — `--sigil-*` theming table

**Analog:** existing "Letter Handling Rules" section (README.md:94-114) — the established citable-rule-table convention.

**Structural pattern to copy:** a numbered/tabular section with a framing sentence stating its purpose as "the tool's public statement of its own [X] — a practitioner should be able to read this section and predict [Y]" (lines 96-99). The theming table's framing sentence should state the equivalent: "every `--sigil-*` custom property this tool emits is documented here — this table is what D-42's guard test reads to verify code and docs cannot silently diverge."

**Exact table content** is specified verbatim in UI-SPEC.md (lines 149-167) — 15 rows covering the 5 existing + ~10 new custom properties, one row per property with columns `Property | Default | Element | Controls`. Use that table as-is; only its structural placement in the README is discretion (Claude's Discretion item in CONTEXT.md).

---

## Shared Patterns

### Single-rounding geometry discipline
**Source:** `src/render/svg.js:76-86` (`GEOMETRY_PRECISION`, `roundGeometry`) and `src/render/coords.js:12-18, 44-47` (`COORDINATE_PRECISION`, `round`)
**Apply to:** `src/render/curve.js` (Bézier control points), the grid-lattice line positions, and the glyph anchor computation. Every new geometry value must be rounded exactly once, at the point of computation, through the existing rounding functions — never introduce a second rounding point or re-round an already-rounded value.
```js
const factor = 10 ** GEOMETRY_PRECISION; // 3
return Math.round(n * factor) / factor;
```

### `var(--sigil-*, <fallback>)` theming idiom, paint-family attributes only
**Source:** `src/render/svg.js` throughout (e.g. lines 110-111, 130-131, 147-148)
**Apply to:** every new attribute in `gridLayer()` and `glyphLayer()`. Only `fill`, `stroke`, `stroke-width`, `opacity`, `font-size`, `font-family` get `var()` — geometry attributes (`cx`, `cy`, `x`, `y`, `d`) stay literal, computed from `cellSize`.
```js
stroke="var(--sigil-stroke, currentColor)"
opacity="var(--sigil-node-opacity, 0)"
```

### `SigilError` stable-code + structured-details contract
**Source:** `src/errors.js` (whole file) and `src/generate.js:53-103`
**Apply to:** `src/generate.js`'s new `E_INVALID_OPTION` throw and `bin/sigil-spinner.js`'s `EXIT_CODES` map extension.
```js
throw new SigilError(CODE, 'human-readable message', { structuredDetails });
```

### Fixed layer-array composition with `.filter(Boolean).join('')`
**Source:** `src/render/svg.js:380-389` (`renderSvg`)
**Apply to:** the two new layers (`gridLayer`, `glyphLayer`) slotting into the array's head per D-39 — empty/opt-out layers return `''` and vanish cleanly, no conditional branching needed at the call site.

### Options-object-as-third-argument seam
**Source:** `src/generate.js:117` (`renderSvg(path, { ...options, statement })`)
**Apply to:** `bin/sigil-spinner.js`'s new call to `generateSigil(statement, planetArg, { curve, glyph, idPrefix })` and `generate.js`'s forwarding into both `renderSvg` and `toWorking`.

### `describe.each(PLANETS)` snapshot matrix with `matrix-<variant>-<planet>.svg` naming
**Source:** `test/determinism.test.js:78-89, 107-118, 131-145`
**Apply to:** every new curve/grid/glyph test variant this phase adds.

## No Analog Found

None. Every file this phase touches has an exact or role-match analog already in the repo, which is the expected shape per the phase-specific guidance — this is a render-layer-extension phase on an already-fully-scaffolded codebase, not greenfield work.

## Metadata

**Analog search scope:** `src/render/`, `src/data/`, `src/`, `bin/`, `test/`, `README.md` — entire repo (13 source files, small enough for exhaustive read rather than sampled search)
**Files scanned:** `src/render/svg.js`, `src/render/coords.js`, `src/generate.js`, `src/errors.js`, `src/render/json.js`, `bin/sigil-spinner.js`, `src/data/kamea.js`, `test/determinism.test.js`, `README.md` (partial)
**Pattern extraction date:** 2026-08-06
