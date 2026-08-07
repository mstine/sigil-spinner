# Phase 2: Every Planet, Every Statement - Pattern Map

**Mapped:** 2026-08-06
**Files analyzed:** 10 (5 new/extended source, 5 new/extended test)
**Analogs found:** 10 / 10 — this phase is almost entirely extension of existing modules, so every file's own current-state IS its own closest analog. No cross-project search was needed; the "analog" for each extended file is itself, read before modification.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `src/text/fold.js` (NEW) | utility (text transform) | transform | `src/text/normalize.js` (sibling module, same layer) | role-match (new file, but same layer/boundary conventions) |
| `src/text/normalize.js` (EXTENDED) | utility (text transform) | transform | itself (current version) | exact |
| `src/path/buildPath.js` (EXTENDED) | transform/model-builder | transform | itself (current version) | exact |
| `src/render/svg.js` (EXTENDED) | component (markup renderer) | transform | itself (current version) — new `loopLayer()` follows existing `nodeLayer()`/`startMarker()`/`endMarker()` shape | exact |
| `src/render/json.js` (EXTENDED) | service (serializer) | transform | itself (current version) | exact |
| `src/errors.js` (EXTENDED) | model (error type) | transform | itself (current version) | exact |
| `src/generate.js` (EXTENDED) | controller/orchestrator | request-response (pure function call) | itself (current version) | exact |
| `test/text/fold.test.js` (NEW) | test | transform | `test/text/normalize.test.js` | exact |
| `test/text/normalize.test.js` (EXTENDED) | test | transform | itself (current version) | exact |
| `test/path/buildPath.test.js` (EXTENDED) | test | transform | itself (current version, not read this pass — mirrors `normalize.test.js` structure) | role-match |
| `test/render/svg.test.js` (EXTENDED) | test | transform | itself (current version, referenced via research citations at lines 29-32) | role-match |
| `test/determinism.test.js` (EXTENDED) | test | batch/snapshot | itself (current version, see excerpt below) | exact |

## Pattern Assignments

### `src/text/fold.js` (NEW — utility, transform)

**Analog:** `src/text/normalize.js` (sibling module in the same layer; establishes the doc-comment and boundary conventions this new file must follow)

**Module-header doc-comment pattern** (normalize.js lines 1-15):
```js
/**
 * Text normalization (CONS-01) — strike vowels and repeating letters, keep
 * first occurrence, preserve order.
 *
 * This module has zero knowledge of numbers or kamea geometry (ARCHITECTURE.md
 * internal boundary) — it never imports from `src/data/kamea.js`.
 * ...
 */
```
`fold.js` must open with an equivalent header stating: (a) which requirement it satisfies (CONS-04), (b) that it has zero knowledge of numbers/kamea (same ARCHITECTURE.md boundary normalize.js states), and (c) that it never throws — folding always succeeds, structurally similar to normalize.js's "never throws" contract (line 39-41).

**Typedef pattern** (normalize.js lines 20-35): declare `@typedef` blocks for the per-character record shape (`{ original, originalIndex, folded }`) exactly as `StruckEntry`/`NormalizeResult` are declared — plain JSDoc typedefs, no runtime schema library.

**Core transform pattern — pure function, no throw, ordered pass** (normalize.js lines 46-77): `foldStatement(statement)` should mirror this shape — a single exported pure function, one linear pass, building up parallel arrays/records, returning a plain object. Regex-based classification (`VOWELS`, `NON_LETTER` as module-level constants at lines 17-18) is the established idiom for lookup tables — the six-entry `TRANSLITERATION_MAP` (per RESEARCH.md Code Examples) should be a module-level constant object in the same position.

**Given exact code recommendation** (RESEARCH.md lines 308-333) — this is the concrete scaffold to copy from directly (already vetted against the codebase's conventions):
```js
const TRANSLITERATION_MAP = {
  'ß': 'SS', 'ẞ': 'SS',
  'æ': 'AE', 'Æ': 'AE',
  'œ': 'OE', 'Œ': 'OE',
  'ø': 'O',  'Ø': 'O',
  'þ': 'TH', 'Þ': 'TH',
  'ð': 'D',  'Ð': 'D',
};

const COMBINING_MARKS = /[̀-ͯ]/g;

function foldStatement(statement) {
  const chars = [...statement]; // code-point aware — avoids Pitfall 6 (astral surrogate pairs)
  return chars.map((original, originalIndex) => {
    if (original in TRANSLITERATION_MAP) {
      return { original, originalIndex, folded: TRANSLITERATION_MAP[original] };
    }
    const folded = original.normalize('NFD').replace(COMBINING_MARKS, '');
    return { original, originalIndex, folded };
  });
}
```

**Critical ordering rule (Pitfall 1):** fold per-original-character in a loop over the *original* string (`[...statement]`, not `statement.normalize('NFD')` applied whole) — the whole-string shortcut breaks `originalIndex` provenance the moment any fold changes length.

---

### `src/text/normalize.js` (EXTENDED — utility, transform)

**Analog:** itself (current version, read in full above)

**What changes:** `normalize()`'s loop (lines 54-74) currently iterates `upper[index]` directly. It must be extended to iterate `foldStatement(statement)`'s output instead, classifying each record's `.folded` character(s) while still tagging `struck`/`kept` entries with the record's `.original`/`.originalIndex` (D-25). The existing branch order — non-letter check, then vowel check, then repeat-via-`seen`-Set check — stays unchanged; only the iteration source changes.

**Existing branch structure to preserve exactly** (lines 54-74):
```js
for (let index = 0; index < upper.length; index += 1) {
  const char = upper[index];

  if (NON_LETTER.test(char)) {
    struck.push({ char, index, reason: 'non-letter' });
    continue;
  }

  if (VOWELS.test(char)) {
    struck.push({ char, index, reason: 'vowel' });
    continue;
  }

  if (seen.has(char)) {
    struck.push({ char, index, reason: 'repeat' });
    continue;
  }

  seen.add(char);
  kept.push(char);
}
```
Add `original`/`folded` fields onto each pushed `struck`/`kept` record (D-25) without disturbing this branch order — Y-as-consonant (D-21) requires zero code change here, only a comment/README citation, since `VOWELS = /[AEIOU]/` already excludes Y.

**Existing test-fixture proving the letter/number boundary** (`test/text/normalize.test.js` lines 54-60) — do not violate this: `normalize('BK')` must keep `['B', 'K']` unchanged; consecutive-number-repeat detection is explicitly NOT this module's concern (Pitfall 7).

---

### `src/path/buildPath.js` (EXTENDED — transform/model-builder)

**Analog:** itself (current version, read in full above)

**Existing PathModel-construction pattern to extend, not replace** (lines 48-66):
```js
export function buildPath(numbers, cells, planet, order) {
  const points = numbers.map((n, index) => {
    const { row, col } = cells[index];
    const { x, y } = cellCenter(row, col, order);
    return { n, row, col, x, y };
  });

  const segments = [];
  for (let index = 0; index < points.length - 1; index += 1) {
    segments.push({ from: index, to: index + 1 });
  }

  const start = 0;
  const end = points.length - 1;

  return { planet, gridSize: order, points, segments, start, end };
}
```
Add a new independent `detectRepeats(numbers)` pass (RESEARCH.md lines 340-355) and attach its output as a new `repeats` field on the returned object — following the exact same "compute a plain array, attach as one more object field" idiom already used for `points`/`segments`.

**Recommended repeat-detection function** (RESEARCH.md Code Examples, verbatim-ready):
```js
function detectRepeats(numbers) {
  const repeats = [];
  let runLength = 1;
  for (let i = 1; i <= numbers.length; i += 1) {
    if (i < numbers.length && numbers[i] === numbers[i - 1]) {
      runLength += 1;
      continue;
    }
    if (runLength > 1) {
      repeats.push({ atPoint: i - 1, count: runLength - 1 }); // D-18
    }
    runLength = 1;
  }
  return repeats;
}
```

**Doc-comment convention to follow** (lines 1-6, 36-40): explain the new pass's boundary responsibility the same way the module already explains its own ("this module emits no markup," "must not throw") — state explicitly that repeat detection runs on `numbers[]`, never on letters (Pitfall 7 / Pitfall 2 in CONTEXT.md numbering), citing the `normalize('BK')` test fixture as the reason this can't live in `normalize.js`.

---

### `src/render/svg.js` (EXTENDED — component/renderer)

**Analog:** itself (current version, read in full above) — new `loopLayer()` function follows the exact shape of `nodeLayer()`/`startMarker()`/`endMarker()`

**Layer-function convention** (lines 81-91, `nodeLayer`, is the closest structural analog — one shape per data-array entry, geometry as a fraction of `cellSize`, semantic class, CSS-variable paint):
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
`loopLayer(pathModel)` should: map over `pathModel.repeats` (new field from `buildPath.js`), emit one `<path class="sigil-loop">` per repeat event (D-18: `count` extra loops per event, nested/offset), and slot into the existing fixed layer order in `renderSvg()` (line 170) — append after `endMarker(pathModel)` in the `.filter(Boolean).join('')` array, per the module header's stated seam ("a future layer... can be added at this seam without touching existing ones," lines 4-6).

**Geometry-constant convention to extend** (lines 25-31):
```js
const NODE_RADIUS_FRACTION = 0.06;
const START_RADIUS_FRACTION = 0.1;
const END_BAR_LENGTH_FRACTION = 0.32;
```
Add a new `LOOP_*_FRACTION` constant (radius/offset/nesting-spacing) in the same position, same naming convention, same "fraction of cellSize, never a hardcoded unit" posture (comment at lines 21-24).

**Coincident-marker offset mechanism to reuse** (lines 118-124, `perpendicularUnit`, and its zero-length fallback usage at lines 139-140):
```js
function perpendicularUnit(dx, dy) {
  const magnitude = Math.hypot(dx, dy);
  if (magnitude === 0) {
    return { x: 1, y: 0 };
  }
  return { x: -dy / magnitude, y: dx / magnitude };
}
```
This exact helper (already exported/used internally) is the mechanism for offsetting loop markers away from coincident start/end/node markers (D-19, D-27) — call it with the same fallback-to-`{1,0}` pattern `endMarker` already uses for the one-point case (lines 139-140).

**Loop path markup technique** (RESEARCH.md Code Examples, arc-based open hook):
```js
`<path class="sigil-loop" d="M${x1},${y1} A${r},${r} 0 1,1 ${x2},${y2}" ` +
  `stroke="var(--sigil-marker-stroke, currentColor)" stroke-width="var(--sigil-stroke-width, 2)" fill="none" />`
```
Note the existing paint-attribute convention (`var(--sigil-marker-stroke, currentColor)`) — reuse the same CSS custom property already used by `startMarker`/`endMarker` (lines 104-105, 150) rather than introducing a new one, unless the loop needs independent styling (not indicated by any decision).

**Anti-pattern to avoid (Pitfall 5):** do not suppress or merge the existing `nodeLayer` circle at a repeated cell — `sigil-loop` is additive alongside it, never a replacement. `test/render/svg.test.js` lines 29-32 already locks "exactly five sigil-node elements, including both at the twice-visited cell."

**Single-letter dual-marker geometry (D-27):** `startMarker`/`endMarker` already read `pathModel.points[pathModel.start]`/`[pathModel.end]` independently (lines 100, 136) — for a one-point PathModel these resolve to the same point already, so both markers already render at the coincident cell; the extension needed is purely offsetting their geometry for legibility using the same `perpendicularUnit` fallback, not new marker logic.

---

### `src/render/json.js` (EXTENDED — service/serializer)

**Analog:** itself (current version, read in full above)

**Thin-serializer pattern to preserve** (lines 72-100) — the file's own header states its constraint explicitly (lines 1-9: "computes nothing itself... every field below is a direct read"):
```js
export function toWorking(result) {
  const { statement, planet, kameaSet, gridSize, kept, struck, numbers, path } = result;

  const letterNumbers = kept.map((letter, index) => ({ letter, number: numbers[index] }));

  const cells = path.points.map((point) => ({
    row: point.row,
    col: point.col,
    x: point.x,
    y: point.y,
  }));

  return {
    statement, planet, kameaSet, gridSize,
    lettersKept: kept, lettersStruck: struck, letterNumbers, numbers,
    cells, segments: path.segments, start: path.start, end: path.end,
  };
}
```
New fields for Phase 2 (repeats from `path.repeats`, fold data already embedded in `struck`/`kept` per D-25) are added as additional straight read-throughs in the same fixed-key-order return object — **never** compute derived values here (that would violate the module's own stated contract). Fixed key order matters for `JSON.stringify` byte-stability (INT-03) — new fields append at the end, don't reorder existing keys.

---

### `src/errors.js` (EXTENDED — model/error type)

**Analog:** itself (current version, read in full above)

**Current constructor to extend** (lines 23-34):
```js
export class SigilError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'SigilError';
    this.code = code;
  }
}
```

**Recommended extension** (RESEARCH.md Code Examples, D-26) — add an optional third parameter, preserving every existing two-arg call site unchanged:
```js
export class SigilError extends Error {
  constructor(code, message, details) {
    super(message);
    this.name = 'SigilError';
    this.code = code;
    if (details !== undefined) this.details = details;
  }
}
```
Doc-comment convention to preserve (lines 1-9): the module header states the stable `.code`-not-`.message` contract — add one sentence noting `.details` is an optional structured payload (D-26), still never branched on by consumers, same posture as `.message`.

---

### `src/generate.js` (EXTENDED — controller/orchestrator)

**Analog:** itself (current version, read in full above)

**Existing E_EMPTY_SEQUENCE throw site to enrich** (lines 68-75):
```js
const { kept, struck } = normalize(statement);

if (kept.length === 0) {
  throw new SigilError(
    E_EMPTY_SEQUENCE,
    `Statement reduced to zero kept letters after striking vowels and repeats: ${JSON.stringify(statement)}`,
  );
}
```

**Recommended enrichment** (RESEARCH.md Code Examples, D-26 — ready to adapt):
```js
const counts = struck.reduce((acc, s) => {
  acc[s.reason] = (acc[s.reason] ?? 0) + 1;
  return acc;
}, {});
const summary = Object.entries(counts)
  .map(([reason, n]) => `${n} ${reason}${n === 1 ? '' : 's'}`)
  .join(', ');
throw new SigilError(
  E_EMPTY_SEQUENCE,
  `Statement reduced to zero kept letters: all ${struck.length} characters struck (${summary}).`,
  { struck },
);
```

**Orchestrator boundary rule to preserve** (module header, lines 1-10): `generate.js` remains "the only module allowed to import across `text/`, `data/`, and `path/`" — the enrichment logic (strike-count summary) belongs here, not inside `normalize.js` or `errors.js`, consistent with the existing pattern where all guard/throw logic already lives in this one orchestrator function (lines 53-75).

**Fold integration point:** `normalize(statement)` call at line 68 is the single seam through which `fold.js`'s output must flow — per RESEARCH.md's Architecture Diagram, `fold.js` sits *ahead of* `normalize()`'s classification loop, called *from inside* `normalize.js`, not from `generate.js` directly (keeps `generate.js`'s existing single call to `normalize()` unchanged).

---

## Shared Patterns

### Doc-comment header convention
**Source:** every existing `src/*.js` file (see `normalize.js` lines 1-15, `buildPath.js` lines 1-6, `svg.js` lines 1-13, `json.js` lines 1-15, `errors.js` lines 1-9, `generate.js` lines 1-10)
**Apply to:** all new/extended files, including the new `fold.js`
```js
/**
 * <One-line purpose statement, citing the requirement ID if applicable>
 *
 * <Architectural boundary this module respects — what it does NOT import/know>
 * <Throw/no-throw contract, if applicable>
 */
```
Every module in this codebase opens with a comment stating its architectural boundary explicitly (what it does NOT do/import) — this is the strongest convention in the codebase and must be matched for `fold.js`.

### JSDoc typedefs over runtime schemas
**Source:** `normalize.js` lines 20-35, `buildPath.js` lines 10-33, `json.js` lines 17-47
**Apply to:** all new data shapes (fold records, repeat events)
No runtime validation library is used anywhere — every data shape is documented via `@typedef` JSDoc blocks only, checked by `tsc --checkJs` (per CLAUDE.md stack notes), never enforced at runtime beyond what the plain JS naturally does.

### Pure functions, no shared mutable state
**Source:** `generate.js` header (lines 6-10): "Holds no module-level mutable state and performs no I/O, so concurrent calls are independent (INT-02)"
**Apply to:** `fold.js`, extended `buildPath.js`, extended `normalize.js`
New functions (`foldStatement`, `detectRepeats`) must be pure — same input always produces the same output object, no caching, no module-level mutable accumulators (the existing `test/determinism.test.js` "interleaved calls" test, lines 42-60, would catch a violation).

### CSS custom-property paint convention (no inline `style=`, no bare colors)
**Source:** `svg.js` module header (lines 8-10) and every marker function (`fill="var(--sigil-node-fill, currentColor)"`, `stroke="var(--sigil-marker-stroke, currentColor)"`)
**Apply to:** the new `sigil-loop` element in `loopLayer()`
Never emit a literal color or an inline `style=""` attribute — always `var(--sigil-*, <fallback>)`, matching Pitfall 8 from PITFALLS.md.

### Fixed-order, filter-then-join layer assembly
**Source:** `svg.js` `renderSvg()`, line 170:
```js
const layers = [pathLayer(pathModel), nodeLayer(pathModel), startMarker(pathModel), endMarker(pathModel)]
  .filter(Boolean)
  .join('');
```
**Apply to:** adding `loopLayer(pathModel)` to this array
New layers append to this array in a fixed position (documented in the module header as the intended extension seam) — never conditionally reorder existing entries.

### Parameterized test matrices (`describe.each`)
**Source:** RESEARCH.md Code Examples (Vitest 4 pattern, citing `vitest.dev`), extending existing `test/determinism.test.js` style (single-case assertions, `toBe`/`toMatchFileSnapshot`)
**Apply to:** widening `test/determinism.test.js` into the seven-planet matrix (INT-03)
```js
const PLANETS = ['saturn', 'jupiter', 'mars', 'sun', 'venus', 'mercury', 'moon'];
describe.each(PLANETS)('determinism matrix — %s', (planet) => {
  it('produces byte-identical SVG across two calls', () => {
    const first = generateSigil(STATEMENT, planet);
    const second = generateSigil(STATEMENT, planet);
    expect(first.svg).toBe(second.svg);
  });
});
```
Existing single-statement style (`test/determinism.test.js` lines 21-73) stays as-is for the two-call/CLI-parity/interleaved-call assertions; the matrix widening is additive, not a rewrite.

### Struck-entry / kept-entry data shape (D-25 extension point)
**Source:** `normalize.js` `StruckEntry` typedef (lines 24-29) and its construction sites (lines 58, 63, 68)
**Apply to:** adding `original`/`folded` fields to both `struck` and `kept` entries
Existing shape: `{ char, index, reason }`. D-25 extension keeps this shape and adds fields — does not replace `char`/`index` with anything renamed, since `test/text/normalize.test.js` lines 26-30 already assert on `{ char, index, reason }` via `toMatchObject` (additive fields don't break `toMatchObject` assertions).

## No Analog Found

None. Every file in this phase's scope is an extension of an existing, already-read module, or a same-layer sibling test file with a directly analogous existing test file. No new architectural pattern is being introduced.

## Metadata

**Analog search scope:** `src/text/`, `src/path/`, `src/render/`, `src/errors.js`, `src/generate.js`, `test/text/`, `test/path/`, `test/render/`, `test/determinism.test.js` — all read in full this session (no Glob/Grep search needed; RESEARCH.md had already enumerated every file in scope with exact line-number citations).
**Files scanned:** 10 source/test files read in full (svg.js, normalize.js, buildPath.js, errors.js, generate.js, json.js, determinism.test.js, normalize.test.js — plus errors.js and json.js cross-referenced for shared patterns).
**Pattern extraction date:** 2026-08-06
