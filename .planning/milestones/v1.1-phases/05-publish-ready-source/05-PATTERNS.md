# Phase 5: Publish-Ready Source - Pattern Map

**Mapped:** 2026-08-08
**Files analyzed:** 13 (all modified, zero new files)
**Analogs found:** 13 / 13 (self-analog — every file extends its own existing pattern; RESEARCH.md already pinpointed exact insertion lines)

**Note on method:** This phase creates no new files — every change is a small, surgical extension of an existing pattern already present in the same file (or an immediately adjacent file). The "analog" for each edit is therefore the existing sibling code in the same module, not a different module. RESEARCH.md's Code Examples section already extracted verbatim current-state excerpts with line numbers; this document reorganizes them by file for planner consumption and adds the one cross-file pattern (fully-qualified citation style) that MAINT-01 needs.

## File Classification

| File | Role | Data Flow | Change | Analog (same-file sibling pattern) | Match Quality |
|------|------|-----------|--------|--------------------------------------|----------------|
| `src/data/kamea.js` | model/data | CRUD (static registry) | PKG-02: add `KAMEA_SET_VERSIONS` sidecar map; MAINT-01: 2 citation fixes | `PLANET_GLYPHS = Object.freeze({...})` in `src/render/glyphs.js:50` | exact |
| `src/generate.js` | service/orchestrator | transform (pipeline) | PKG-02: thread `kameaVersion` into `toWorking()` call; MAINT-01: 7 citation fixes | existing `kameaSet: DEFAULT_KAMEA_SET` sibling field, same object literal | exact |
| `src/render/json.js` | transform/serializer | transform (object → fixed-key JSON) | PKG-02: destructure + emit `kameaVersion`; MAINT-01: 1 citation fix | existing `kameaSet` destructure/emit pair, same function | exact |
| `bin/sigil-spinner.js` | CLI/controller | request-response (argv → stdout) | INT-05: add `title` to `parseArgs` options + thread to `generateSigil`; MAINT-01: 1 citation fix | existing `glyph`/`curve` boolean flags, same options block | exact |
| `src/render/svg.js` | transform/renderer | transform (model → SVG string) | INT-06: `role`/`aria-labelledby`/title-id wiring; MAINT-01: 2 citation fixes | existing `title`/`idAttr` template-literal construction, same function | exact |
| `src/path/buildPath.js` | transform | transform | MAINT-01: 3 citation fixes | — | citation-only |
| `src/render/coords.js` | transform | transform | MAINT-01: 1 citation fix | — | citation-only |
| `src/render/curve.js` | transform | transform | MAINT-01: 6 citation fixes | — | citation-only |
| `src/render/glyphs.js` | model/data | CRUD (static registry) | MAINT-01: 2 citation fixes | — | citation-only |
| `src/text/fold.js` | transform | transform | MAINT-01: 3 citation fixes | — | citation-only |
| `src/text/normalize.js` | transform | transform | MAINT-01: 1 citation fix | — | citation-only |
| `src/index.js` | public API surface | request-response (export barrel) | MAINT-01: 1 citation fix | — | citation-only |
| `test/data/kamea.test.js` | test | CRUD (assertion) | PKG-02: add D-61 key-parity test | existing `KAMEA_SETS.agrippa[planet]` assertion pattern in same file | exact |
| `test/determinism.test.js` | test | CRUD (assertion) | PKG-02: hand-edit hardcoded key-order array (~line 243) | — | direct edit, no new pattern |
| `test/render/json.test.js` | test | CRUD (assertion) | PKG-02: hand-edit pipeline-result fixture (~line 27) | — | direct edit, no new pattern |
| `test/render/__snapshots__/json.test.js.snap` | test fixture | batch (snapshot) | PKG-02: rebase (1 of 48) | — | mechanical rebase |
| `test/__file_snapshots__/worked-example.working.json` | test fixture | batch (snapshot) | PKG-02: rebase (1 of 48) | — | mechanical rebase |
| `README.md` | docs | — | PKG-02: `kameaVersion` table row; INT-05: `--title` in Usage/flag list | existing fifteen-field working table (~line 294) | exact |

## Pattern Assignments

### `src/data/kamea.js` (model, PKG-02 + MAINT-01)

**Analog:** `src/render/glyphs.js:50` (`Object.freeze` closed lookup map, identical string→string shape)

**Insertion point** (exact current state, `kamea.js:74-89`):
```js
export const DEFAULT_KAMEA_SET = 'agrippa';

// ◄── KAMEA_SET_VERSIONS goes here (D-60)

export const KAMEA_SETS = {
  agrippa: { saturn: [...], /* ... */ },
};
```

**Pattern to copy** (from `glyphs.js:50` freeze convention):
```js
export const PLANET_GLYPHS = Object.freeze({ /* ... */ });
```
Apply identically:
```js
export const KAMEA_SET_VERSIONS = Object.freeze({ agrippa: '2026-08-04' });
```

**MAINT-01 citation fixes** — 2 sites (`kamea.js:26`, `kamea.js:65`). See Shared Pattern "Citation repair" below for the required fully-qualified-path form.

---

### `src/generate.js` (orchestrator, PKG-02 + MAINT-01)

**Analog:** the existing `kameaSet: DEFAULT_KAMEA_SET` line in the same `toWorking({...})` call — the new field is a direct sibling, same construction, same import statement extended.

**Current exact state** (`generate.js:277-293`, `kameaSet` sibling insertion per D-58):
```js
const working = toWorking({
  statement,
  planet: canonicalPlanet,
  kameaSet: DEFAULT_KAMEA_SET,
  gridSize: order,
  kept,
  struck,
  keptEntries,
  numbers,
  path,
  render: { curve: ..., glyph: ..., idPrefix: ..., title: ... },
});
```
Import line to extend (`generate.js:14`):
```js
import { cellForNumber, gridSize, planetNames, DEFAULT_KAMEA_SET, kameaGrid } from './data/kamea.js';
```
Add `KAMEA_SET_VERSIONS` to this same import, then insert `kameaVersion: KAMEA_SET_VERSIONS[DEFAULT_KAMEA_SET],` immediately after the `kameaSet` line.

**MAINT-01 citation fixes** — 7 sites (`generate.js:3, 9, 87, 128, 187`, plus the two noted separately in RESEARCH.md's table rows 22-26).

---

### `src/render/json.js` (serializer, PKG-02 + MAINT-01)

**Analog:** the existing `kameaSet` destructure/emit pair inside `toWorking()` — same function, same fixed-key-order discipline.

**Current exact state** (`json.js:77-108`):
```js
export function toWorking(result) {
  const { statement, planet, kameaSet, gridSize, kept, struck, keptEntries, numbers, path, render } = result;
  // ...
  return {
    statement, planet, kameaSet, gridSize,
    lettersKept: kept, lettersStruck: struck, letterNumbers, numbers,
    cells, segments: path.segments, start: path.start, end: path.end,
    keptTrail: keptEntries, repeats: path.repeats, render,
  };
}
```
D-58 insertion: add `kameaVersion` immediately after `kameaSet` in **both** the destructure and the returned object literal. Also update the `SigilWorking`/`GeneratePipelineResult` JSDoc typedefs above the function (lines ~34-66) with a `@property {string} kameaVersion` line after the existing `kameaSet` property line.

**MAINT-01**: 1 citation fix at `json.js:4`.

---

### `bin/sigil-spinner.js` (CLI controller, INT-05 + MAINT-01)

**Analog:** the existing `glyph`/`curve` boolean flags in the same `parseArgs` options block — direct structural copy, no new flag shape.

**Current exact state** (`bin/sigil-spinner.js:114-124`):
```js
parsed = parseArgs({
  allowPositionals: true,
  options: {
    planet: { type: 'string' },
    json: { type: 'boolean', default: false },
    output: { type: 'string' },
    glyph: { type: 'boolean', default: false },
    curve: { type: 'boolean', default: false },
    'id-prefix': { type: 'string' },
  },
});
```
Add: `title: { type: 'boolean', default: false },` — same shape as `glyph`/`curve`, presence-only, **no negated form** (Node floor forecloses `allowNegative`, landed v22.4 vs. this project's `>=20.0.0` floor — see RESEARCH.md Pitfall 2).

**Threading pattern** (`bin/sigil-spinner.js:168-173`):
```js
const { svg, working } = generateSigil(statement, planetArg, {
  glyph: glyphArg,
  curve: curveArg,
  idPrefix: idPrefixArg,
});
```
Add `title: titleArg,` following the identical destructure-and-pass convention.

**MAINT-01**: 1 citation fix at `bin/sigil-spinner.js:3`.

**D-12 reopen check**: `bin/sigil-spinner.js:20` is comment prose unrelated to the `options` block (line 116+) — a minimal `title` addition does not touch line 20, so the D-12 deferred-item reopen condition is avoidable by construction. Verify the final diff doesn't touch line 20.

---

### `src/render/svg.js` (renderer, INT-06 + MAINT-01)

**Analog:** the existing `title`/`idAttr` template-literal construction in the same function — `escapeXml` discipline already established for `idPrefix` (D-44) must be copy-pasted onto the new `titleId`, not assumed inherited.

**Current exact state** (`svg.js:636-651`):
```js
const title = options.title ? `<title>${escapeXml(options.statement ?? '')}</title>` : '';

const idAttr =
  typeof options.idPrefix === 'string' && options.idPrefix.length > 0
    ? ` id="${escapeXml(options.idPrefix)}"`
    : '';

return `<svg xmlns="${SVG_NAMESPACE}" viewBox="0 0 100 100" class="sigil sigil--${pathModel.planet}"${idAttr}>${title}${layers}</svg>`;
```

**Recommended extension pattern** (illustrative per RESEARCH.md — exact id scheme is Claude's Discretion):
```js
const hasIdPrefix = typeof options.idPrefix === 'string' && options.idPrefix.length > 0;
const titleId = hasIdPrefix ? `${escapeXml(options.idPrefix)}-title` : null;
const title = options.title
  ? `<title${titleId ? ` id="${titleId}"` : ''}>${escapeXml(options.statement ?? '')}</title>`
  : '';
const ariaAttrs =
  options.title && titleId ? ` role="img" aria-labelledby="${titleId}"` : '';
// idAttr unchanged
return `<svg xmlns="${SVG_NAMESPACE}" viewBox="0 0 100 100" class="sigil sigil--${pathModel.planet}"${idAttr}${ariaAttrs}>${title}${layers}</svg>`;
```

**Security note (inherited control, must be re-applied, not assumed):** any string derived from `idPrefix` and interpolated into the new `id="..."` / `aria-labelledby="..."` attributes MUST go through `escapeXml`, exactly matching the existing `idAttr` construction two lines above. This is new code independently subject to D-44's discipline.

**MAINT-01**: 2 citation fixes at `svg.js:13`, `svg.js:28`.

**Snapshot impact**: this is the *only* requirement permitted to move the 46 SVG-shaped snapshots (per CONTEXT.md D-decision boundary). Any SVG snapshot movement in the diff must trace to INT-06.

---

### `test/data/kamea.test.js` (test, PKG-02 / D-61)

**Analog:** existing `KAMEA_SETS.agrippa[planet]` assertion pattern already in this file.

**Pattern to add:**
```js
it('KAMEA_SET_VERSIONS has an entry for every KAMEA_SETS key', () => {
  expect(Object.keys(KAMEA_SET_VERSIONS).sort()).toEqual(Object.keys(KAMEA_SETS).sort());
});
```
Same discipline as D-55's exit-map key-parity test elsewhere in the suite — fails loudly on the person adding a kamea set, not on a downstream consumer.

---

### `test/determinism.test.js`, `test/render/json.test.js`, snapshot fixtures

Direct hand-edits, not new patterns: insert `kameaVersion` into the hardcoded key-order array (`determinism.test.js:~243`) and the pipeline-result fixture (`json.test.js:~27`); rebase the 2 of 48 snapshots that contain `"kameaSet": "agrippa",` (`json.test.js.snap:39`, `worked-example.working.json:4`) by adding the sibling `"kameaVersion": "2026-08-04",` line immediately after, per D-58's ordering.

---

### `README.md` (docs, PKG-02 + INT-05)

**Analog:** the existing fifteen-field working table (~line 294) — add `kameaVersion` as the sixteenth row, positioned after `kameaSet` to match D-58's key order. Add `--title` to the CLI flag list / Usage section, following the existing `--glyph`/`--curve` documentation style.

## Shared Patterns

### Citation repair (MAINT-01) — applies to 8 source files, 30 sites

**Source of correct form:** `PROJECT.md`/`D-NN` citations in this codebase already use the fully-qualified, milestone-stable path and had **zero rot** (RESEARCH.md's negative-control finding). That is the pattern to replicate everywhere else.

**Rule:** every citation of the form `(FILENAME.md, ...)` with a bare filename must become a fully-qualified path to the archived, milestone-stable location — never a bare filename, never a `.planning/research/*.md` live path (that path is replaced-in-place every milestone and is the root cause of all 29 rotted sites).

**Before → after example** (`src/data/kamea.js:26`):
```js
// before
// See Pitfall 1 in .planning/research/PITFALLS.md
// after
// See Pitfall 1 ("Kamea Orientation Ambiguity") in
// .planning/milestones/v1.0-research/PITFALLS.md
```

**Full 30-site resolution table**: see `05-RESEARCH.md` § Common Pitfalls → Pitfall 1, which lists every `File:Line`, the verbatim current (wrong) citation text, what it currently resolves to, and the exact correct fully-qualified target — this table is copy-ready for the plan, no further research needed.

**Scope correction:** CONTEXT.md's Code Context section names ~10 sites; the actual verified scope is 30 sites across `PITFALLS.md`, `ARCHITECTURE.md`, and `STACK.md` (a third document CONTEXT.md's scout pass missed). Plan MAINT-01 against the 30-site table, not the 10-site estimate.

**Optional drift guard (deferred-idea, cheap):** a grep-based test asserting no bare `FILENAME.md` citation exists anywhere in `src/`/`bin/` (every `.md` mention must be preceded by a `.planning/` path) would have caught 29 of 30 sites without needing content-level resolution. Fold into MAINT-01 only if planning judges it worth the marginal cost — not required to satisfy the requirement's literal text.

### Determinism guard (PKG-02) — applies to `src/data/kamea.js`, `src/generate.js`, `src/render/json.js`

**Rule:** none of `readFileSync`, `process.env`, `Date.now()`, `execSync`, or `import ... from '../package.json'` may appear in any of these three files. `kameaVersion` must be a literal read from the `KAMEA_SET_VERSIONS` sidecar map, never computed at runtime.

**Verification command** (from RESEARCH.md, run before and after the diff):
```
grep -nE "readFileSync|process\.env|Date\.now|execSync" src/data/kamea.js src/generate.js src/render/json.js
```
Expected output: nothing, both times.

### `escapeXml` gating — applies to `src/render/svg.js`

Any string reaching an emitted attribute value (`id`, `aria-labelledby`, or any future attribute derived from user input) must be passed through `escapeXml`, matching the existing `idAttr` construction (`svg.js:646-649`). This is D-44's discipline, and INT-06 is new code that must independently re-apply it.

## No Analog Found

None — every file in scope for this phase already has an established sibling pattern in the same module (PKG-02/INT-05/INT-06) or a well-defined mechanical fix template (MAINT-01's fully-qualified-path rule). No file requires reaching outside the existing codebase conventions.

## Metadata

**Analog search scope:** `src/`, `bin/`, `test/`, `README.md` — every file named in RESEARCH.md's "Recommended Project Structure" blast-radius list.
**Files scanned:** 18 (13 source/doc + 5 test/fixture)
**Pattern extraction date:** 2026-08-08
**Primary source:** `05-RESEARCH.md` (all code excerpts, line numbers, and the 30-site citation table were already verified against live source this session by the researcher; this document reorganizes that material by file for planner consumption and adds no new code reads).
