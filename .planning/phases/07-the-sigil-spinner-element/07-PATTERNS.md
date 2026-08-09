# Phase 7: The sigil-spinner Element - Pattern Map

**Mapped:** 2026-08-09
**Files analyzed:** 7 (2 new production, 1 new test, 1 new example page, 3 modified)
**Analogs found:** 7 / 7

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/element/sigil-spinner-element.js` | component (custom element) | request-response (attributes in → render out) | `bin/sigil-spinner.js` (thin-wrapper-over-library role match) | role-match |
| `test/browser/element.test.js` | test (browser/Playwright) | event-driven (DOM lifecycle) + streaming (http server) | `test/browser/theming-resolution.test.js` | role-match, one required divergence (module server) |
| `examples/element.html` | static page / fixture | request-response (served HTML) | none (no `examples/` dir exists) | no analog — build fresh per UI-SPEC |
| `package.json` | config | CRUD (manifest edit) | itself (existing `exports` map, D-72/D-84 pattern) | exact — additive edit only |
| `test/pack-install.test.js` | test (packaging/Node smoke) | batch (probe generation loop) | itself, extended | exact — new `ENTRY_POINTS` row |
| `README.md` | documentation | transform (attribute table + prose) | itself, existing CSS Custom Properties section | exact — new section, same doc |
| README/element drift guard | test (mechanical drift guard) | transform (derive assertion from source of truth) | `test/package-identity.test.js` | exact |

## Pattern Assignments

### `src/element/sigil-spinner-element.js` (component, request-response)

**Analog:** `bin/sigil-spinner.js` (option-assembly + library-owns-validation posture) and `src/index.js` (the only allowed import surface)

**Imports pattern** — public-surface-only import, per D-85 (mirrors `bin/sigil-spinner.js:1-20` pattern of importing only from `../src/index.js`, never an internal module):
```js
import { generateSigil, SigilError } from '../index.js';
```
No other imports. No `node:*` imports are permitted in this file (milestone-wide constraint, `src/` is browser-safe).

**Option-assembly pattern** — `bin/sigil-spinner.js:172-178`:
```js
try {
  const { svg, working } = generateSigil(statement, planetArg, {
    glyph: glyphArg,
    curve: curveArg,
    idPrefix: idPrefixArg,
    title: titleArg,
  });
  const artifact = jsonArg ? JSON.stringify(working, null, 2) : svg;
  ...
} catch (err) { ... }
```
This is the direct analog for the element's render method: read attribute values, assemble them into a `generateSigil(statement, planet, options)` call with camelCase option keys (`idPrefix` from `id-prefix`, `title` from `show-title`), and let `generateSigil` own all validation. Copy the shape, not the CLI's stdin/output branches.

**"library owns validation" comment pattern** — `bin/sigil-spinner.js:148-150, 157-159`:
```js
// Cast rather than leave as `string | undefined`: a missing/empty planet is
// a valid runtime state, guarded by generateSigil's E_MISSING_PLANET check
// below, not by this CLI (Anti-Pattern 3 — validation lives in the library).
```
```js
// A missing --id-prefix is a valid runtime state (idPrefix is optional),
// guarded by generateSigil's E_INVALID_OPTION check for an empty string —
// not by this CLI (Anti-Pattern 3 — validation lives in the library).
```
Reuse this exact citation idiom (`Anti-Pattern 3`) in the element's own comments — `test/citations.test.js` enforces that any bare `Anti-Pattern <N>` label be backed by a full R1-valid citation somewhere in the same file, so the first such reference in the element file must fully cite its source document, not just repeat the label.

**Error handling pattern** — synthesize from `bin/sigil-spinner.js`'s catch-and-diagnose shape (below, lines 189+ not fully shown but pattern is `try { generateSigil(...) } catch (err) { ... diagnose(err.code, ...) }`) plus D-92's element-specific contract:
```js
try {
  const { svg } = generateSigil(statement, planet, options);
  this.innerHTML = svg;              // D-86: whole, unmodified string only
  this.removeAttribute('data-sigil-error');
} catch (err) {
  this.innerHTML = '';
  if (err instanceof SigilError) {
    console.error('<sigil-spinner> failed to render:', err);
    this.setAttribute('data-sigil-error', err.code);
  } else {
    throw err; // unexpected, non-SigilError errors are not swallowed
  }
}
```
Note: `SigilError` must be imported from `../index.js` (already exported per `src/index.js:13`) to support the `instanceof` check D-92 implies.

**No-innerHTML-concatenation rule (D-86)** — greppable warning sign stated in CONTEXT.md: any `.innerHTML =` whose right-hand side is not exactly the whole `svg` string is a defect. There is no existing source file in this repo with this exact idiom to copy — this is a new, element-specific rule, not an extension of an existing pattern. State it as a code comment near the render method, citing D-86.

**Custom-element skeleton (no direct analog in-repo — first `HTMLElement` subclass in the tree)**. Shape to follow, informed by D-87/D-88/D-90:
```js
const TAG_NAME = 'sigil-spinner';

class SigilSpinnerElement extends HTMLElement {
  static get observedAttributes() {
    return ['statement', 'planet', 'curve', 'glyph', 'id-prefix', 'show-title'];
  }

  connectedCallback() {
    this.#render();
  }

  attributeChangedCallback() {
    if (this.isConnected) this.#render();
  }

  #render() { /* option-assembly + error-handling pattern above */ }
}

if (!customElements.get(TAG_NAME)) {
  customElements.define(TAG_NAME, SigilSpinnerElement);
}
```

---

### `test/browser/element.test.js` (test, event-driven + streaming)

**Analog:** `test/browser/theming-resolution.test.js` (Playwright harness shape) — reuse verbatim; diverge only on module loading.

**Imports + fail-loud beforeAll/afterAll pattern** — `test/browser/theming-resolution.test.js:26-52`:
```js
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium } from 'playwright';
import { generateSigil } from '../../src/index.js';

let browser;
let page;

beforeAll(async () => {
  try {
    browser = await chromium.launch();
  } catch (err) {
    throw new Error(
      'Chromium is not installed — the <specific guard name> cannot run.\n' +
        'Install it with:  npx playwright install chromium\n' +
        'This guard is not optional: it is the only test that proves <specific claim>.\n' +
        `Underlying error: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  page = await browser.newPage();
}, 120_000);

afterAll(async () => {
  await browser?.close();
});
```
Copy this exactly, adjusting the error message text to name the element's own claim (real ESM module evaluation + rendering), and ADD the static-server startup/teardown alongside it (see RESEARCH.md § Architecture Patterns 1 for the `startStaticServer` helper — that is the one piece with no in-repo analog, since `theming-resolution.test.js` never loads a module and has no server).

**`computed()`-style helper pattern** — `test/browser/theming-resolution.test.js:54-85`: set content → query selector → `page.evaluate` + `getComputedStyle`. The element test's class-selector/custom-property assertions (D-94 #2, #3) should follow this exact helper shape, but the "set content" step becomes "load the real module via `page.goto()`/`addScriptTag({url})` against the local server" instead of `page.setContent(svg)`.

**Second reference point** — `test/browser/accessible-name.test.js` establishes no additional shared harness beyond duplicating the same `beforeAll`/`afterAll` block a second time (there is no shared fixture module in this repo yet). Do not assume a shared harness exists; the new test either duplicates the pattern a third time or is the first to extract a shared fixture — Claude's Discretion per CONTEXT.md.

**Docstring/header comment pattern** — both existing browser tests open with a block comment naming: what gap the test closes (with a ticket-style ID like `G-03-1`/`INT-06`), why it's the *only* test that can prove the claim, the "fails loudly rather than skipping" rule stated explicitly, and the `npx playwright install chromium` prerequisite. Follow this shape for `element.test.js`'s header, referencing WRAP-01/WRAP-02/WRAP-03 and D-94's nine owed assertions (per UI-SPEC.md, the assertion count is 9, not 7 — the two `explicit` state-coverage rows #1/#2 fold in).

---

### `package.json` (config, additive)

**Analog:** itself — current `exports` block, `package.json:7-9`:
```json
"exports": {
  ".": "./src/index.js"
}
```
Target shape per D-84:
```json
"exports": {
  ".": "./src/index.js",
  "./element": "./src/element/sigil-spinner-element.js",
  "./package.json": "./package.json"
}
```
`files` (`package.json:13-17`) needs no edit — `"src"` already covers `src/element/`. `main`/`bin` untouched.

---

### `test/pack-install.test.js` (test, extended)

**Analog:** itself — the `ENTRY_POINTS` table and probe loop.

**`ENTRY_POINTS` table with reserved comment** — `test/pack-install.test.js:39-56`:
```js
const ENTRY_POINTS = [
  {
    subpath: '.',
    namedExports: [ 'generateSigil', 'SigilError', /* ... */ ],
  },
  // Phase 7 adds a row here for the `./element` subpath — a new entry point
  // is a new row in ENTRY_POINTS, not a rewrite of this test.
];
```
The reserved comment at line 54-55 IS the extension point; the row it anticipates needs a shape the current table has no field for (`resolveOnly: true` or similar), because the current probe-generation loop (`test/pack-install.test.js:168-198`) always does `import { ... } from '<specifier>'` and evaluates the module — which throws `ReferenceError: HTMLElement is not defined` in Node for the element module. Per RESEARCH.md § Architecture Patterns 2, the new row's probe must be:
```js
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

let resolvedUrl;
try {
  resolvedUrl = import.meta.resolve('@falkensmage/sigil-spinner/element');
} catch (err) {
  throw new Error(`exports subpath './element' did not resolve: ${err.message}`);
}
const resolvedPath = fileURLToPath(resolvedUrl);
if (!existsSync(resolvedPath)) {
  throw new Error(`./element resolved to ${resolvedPath}, but that file does not exist on disk`);
}
process.stdout.write('OK');
```
This means the probe-generation loop (lines 168-198) needs a conditional branch keyed on the new field (e.g. `entry.resolveOnly`), not a full rewrite — generate this resolve-only probe body instead of the `import { ${bindingNames} } ...; generateSigil(...)` body when the flag is set.

**`EXPECTED_TARBALL_FILES`** — `test/pack-install.test.js:58-64` gains one line: `'src/element/sigil-spinner-element.js'`. `ALLOWED_TARBALL_ROOTS` (line 68) needs no edit — `'src/'` already covers it.

---

### `README.md` (documentation, new section)

**Analog:** itself — § CSS Custom Properties (README.md lines 163-222, per CONTEXT.md's canonical refs) is the precedent for a locked-contract table documented in prose-plus-table form. The new element section should follow the same shape: a short intro paragraph, an attribute table (columns: Attribute | Maps to | Type | Notes), then explicit prose call-outs for the two footguns (D-80's `show-title` exception, D-81's `curve="false"` still-enables-curves gotcha) — UI-SPEC.md's Copywriting Contract section has the exact required wording for both, and for the empty/error-state sentences. Also include the `<script type="module">` load snippet, the light-DOM/theming-reach paragraph (D-82), the sizing recipe from UI-SPEC.md § Host Element Sizing Contract (`display: inline-block; width: 240px; aspect-ratio: 1 / 1;`), and the "`./element` requires a DOM; import `.` directly for Node/server use" note.

---

### README/element drift guard (test, mechanical)

**Analog:** `test/package-identity.test.js` in full — the exact idiom to copy.

```js
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, '..');
const readme = readFileSync(path.join(REPO_ROOT, 'README.md'), 'utf-8');

describe('README/element attribute-table drift guard (D-97)', () => {
  it('documents every attribute in observedAttributes, and no others', async () => {
    const mod = await import('../src/element/sigil-spinner-element.js'); // needs a DOM shim, or read source statically instead
    // ... derive README's documented attribute set via regex/table-parse,
    // assert Set equality against SigilSpinnerElement.observedAttributes,
    // in BOTH directions (README has extra OR code has extra both fail).
  });
});
```
Caveat worth flagging to the planner: because the element module dereferences `HTMLElement` at class-definition time (same constraint as D-96), this guard CANNOT `import` the element module directly in a plain Node/Vitest test — it must either (a) statically parse `src/element/sigil-spinner-element.js`'s source text for the `observedAttributes` array literal (regex/string-match, consistent with how `test/citations.test.js` already parses `.js` source as text rather than executing it — see `test/citations.test.js:1-33` for the read-as-text-not-as-module precedent), or (b) live in `test/browser/element.test.js` itself where a real DOM is available. Per CONTEXT.md's Claude's Discretion, either location is acceptable; the read-as-text approach is the closer analog to `citations.test.js`'s existing methodology and avoids adding a second file that needs Chromium.

**Guard idiom stated explicitly** — from `test/package-identity.test.js:6-16`:
```js
/**
 * Package-identity drift guard (PKG-04, D-65, 06-01-PLAN.md).
 *
 * Reads ... from `package.json` (the source of truth — never restated as a
 * literal here, per the D-55/D-61 "guards are keyed, not transcribed"
 * precedent) and asserts the README's documented ... matches ... exactly.
 * A drift ... fails here, on whoever introduces it, rather than surfacing
 * as a broken copy-paste for a new consumer.
 */
```
Copy this doc-comment shape, substituting `observedAttributes` as the source of truth and D-97 as the citation.

---

## Shared Patterns

### Fail-loudly-not-skip for Chromium prerequisite
**Source:** `test/browser/theming-resolution.test.js:35-48`, `test/browser/accessible-name.test.js:34-47` (identical pattern in both)
**Apply to:** `test/browser/element.test.js`
```js
beforeAll(async () => {
  try {
    browser = await chromium.launch();
  } catch (err) {
    throw new Error(
      'Chromium is not installed — <this test's specific claim> cannot run.\n' +
        'Install it with:  npx playwright install chromium\n' +
        `Underlying error: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  page = await browser.newPage();
}, 120_000);
```

### Guards are keyed, not transcribed
**Source:** `test/package-identity.test.js` (README ↔ `package.json` name), `test/pack-install.test.js` `ENTRY_POINTS` (data-driven, not hardcoded per-entry-point control flow)
**Apply to:** the README/element drift guard, and to `test/pack-install.test.js`'s new `ENTRY_POINTS` row — never hand-transcribe the attribute list or the entry-point specifier as a second, driftable literal.

### Library owns validation; surface only assembles options
**Source:** `bin/sigil-spinner.js:148-150, 157-159` (`Anti-Pattern 3` citation)
**Apply to:** `src/element/sigil-spinner-element.js`'s render method — map attributes to `generateSigil` options, throw nothing itself, let `SigilError` propagate from the library and handle it per D-92.

### Citation discipline for bare Pitfall/Pattern/Anti-Pattern labels
**Source:** `test/citations.test.js:1-29` (R1/R2 rules)
**Apply to:** any new comment in `src/element/sigil-spinner-element.js` or its test that references `Anti-Pattern 3`, `Pitfall 6`/`7`/`8`/`9`, etc. — the first such reference in a given file must be a fully qualified, quote-verified citation (`.planning/...` path + a `"quoted excerpt"` matching a real heading), or `test/citations.test.js` will fail the build.

### Thin-wrapper-over-stable-library-API rule
**Source:** `src/index.js:1-10` (header comment) — "This is the entire public surface of the package — `bin/sigil-spinner.js` imports only from here, never from an internal module"
**Apply to:** `src/element/sigil-spinner-element.js` must import only `import { generateSigil, SigilError } from '../index.js'` (D-85) — never a deeper relative path like `../render/svg.js` or `../generate.js`.

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `examples/element.html` | static page | request-response | No `examples/` directory exists anywhere in the repo; this is the first human-facing demo page. Build directly from UI-SPEC.md's Typography/Color/Spacing/Copywriting Contract sections (already fully specified there) rather than from an in-repo analog. |
| The `node:http` static-file server fixture | test utility | streaming | No existing test in this repo serves files over HTTP — `test/pack-install.test.js` uses `node:fs`/`node:child_process`/`node:os` but never `node:http`. Build directly from RESEARCH.md § Architecture Patterns 1's verified `startStaticServer` recipe (already a complete, ready-to-copy code block, quoted in that document lines 130-154). |
| The `HTMLElement` subclass skeleton itself | component | event-driven | First custom element in the tree — `src/element/` did not exist before this phase. No in-repo analog for the class shell; assembled above from the locked decisions (D-87/D-88/D-90) directly, since no existing file exercises `customElements`/`HTMLElement`/lifecycle callbacks. |

## Metadata

**Analog search scope:** `test/browser/`, `test/pack-install.test.js`, `test/package-identity.test.js`, `test/citations.test.js`, `src/index.js`, `bin/sigil-spinner.js`, `package.json`, `vitest.config.js`/`vitest.pack.config.js` (config-only, not modified this phase)
**Files scanned:** 9
**Pattern extraction date:** 2026-08-09
