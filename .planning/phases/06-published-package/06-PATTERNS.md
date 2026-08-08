# Phase 6: Published Package - Pattern Map

**Mapped:** 2026-08-08
**Files analyzed:** 6 (3 created, 3 modified)
**Analogs found:** 4 / 6

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|-----------------|---------------|
| `test/pack-install.test.js` | test | file-I/O (subprocess + tarball scratch install) | `test/e2e/phase2-tracer.test.js` | role-match (CLI/subprocess shape); no analog for pack/install itself |
| `package.json` | config | CRUD (field edits) | `package.json` (self, current state) | exact — this is a metadata diff, not a new-file pattern |
| `vitest.config.js` | config | CRUD (field edit) | `vitest.config.js` (self, current 8-line file) | exact |
| `README.md` | config/doc | transform (specifier + disclosure edits) | `README.md` (self, current state) | exact |
| `LICENSE` | config | n/a (static text) | none in repo | no analog |
| `.github/workflows/release.yml` | config (CI) | event-driven (workflow_dispatch → publish) | none in repo (`.github/` does not exist) | no analog |

## Pattern Assignments

### `test/pack-install.test.js` (test, file-I/O + subprocess)

**Analog:** `test/e2e/phase2-tracer.test.js` (full file read above, 71 lines)

**Imports pattern** (lines 1-5 of the analog):
```js
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { generateSigil } from '../../src/index.js';
```
For the new file, drop the `generateSigil` import (the whole point is testing the *installed* copy, not the dev-tree source) and add the scratch-directory tools per RESEARCH.md's Code Examples § Smoke test skeleton:
```js
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
```
Note the relative-import depth changes: `phase2-tracer.test.js` lives in `test/e2e/` (two `..` levels to repo root); `pack-install.test.js` lives directly in `test/` (one `..` level). Do not copy the `../../` depth verbatim — use `path.join(__dirname, '..', 'bin', 'sigil-spinner.js')` for any repo-tree path this file still needs (only the CLI-comparison rung needs it; the installed-copy paths are scratch-relative).

**Path-resolution pattern** (lines 15-16):
```js
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI_PATH = path.join(__dirname, '..', '..', 'bin', 'sigil-spinner.js');
```
This is the exact idiom to reuse for resolving the repo root (for invoking `npm pack`/`npm publish --dry-run` with `cwd: REPO_ROOT`) and for the dev-tree CLI path used in the byte-identity comparison rung.

**Core pattern — subprocess invocation + assertion** (lines 64-70, the CLI-parity test):
```js
it('produces byte-identical stdout through the CLI subprocess as through the library (INT-02)', () => {
  const { svg } = generateSigil(STATEMENT, PLANET);
  const cliOutput = execFileSync(process.execPath, [CLI_PATH, STATEMENT, '--planet', PLANET], {
    encoding: 'utf-8',
  });
  expect(cliOutput).toBe(svg);
});
```
This is the direct template for D-70's third assertion (installed `bin` runs end to end, output byte-identical to dev-tree output) — same `execFileSync(process.execPath, [path, ...args], { encoding: 'utf-8' })` shape, just pointed at the scratch-installed `node_modules/.bin/sigil-spinner` instead of `bin/sigil-spinner.js`, and at `npm pack`/`npm install` invocations for the setup steps that have no existing in-repo analog (see "No Analog Found" below for what to build fresh, per RESEARCH.md's own skeleton).

**Structure pattern — `describe`/`it` with one behavior asserted per `it`, doc-comment above `describe` naming the decision IDs it traces:**
```js
/**
 * Phase 2 tracer: one accented statement carrying a consecutive-digit repeat,
 * traced end to end on a non-Saturn kamea. ...(D-17, D-18, D-20, D-22, D-25,
 * KAMEA-02, PATH-02).
 */
...
describe('generateSigil — Phase 2 tracer ("CLARITÉ" on Jupiter)', () => {
  it('folds É to E and keeps C, L, R, T (D-22, D-25)', () => { ... });
```
Follow this for `pack-install.test.js`: a top doc-comment naming D-70/D-72/D-73, then one `describe` block, one `it` per rung of the ladder (manifest assertion; scratch install + exports resolution; bin execution; byte-identity comparison), each `it`'s title citing the decision ID it enforces — matches this repo's established self-documenting-test convention (also seen in `test/citations.test.js`'s `describe('Citation integrity (MAINT-01)', ...)`).

**Error handling / cleanup pattern:** Neither `phase2-tracer.test.js` nor any other repo test performs teardown (they're pure and read-only), so there's no existing "cleanup on failure" idiom to copy. D-73's "keep scratch dir on failure, remove on success" is new machinery — write it as a `try { ... } catch (err) { throw new Error(\`scratch dir preserved at ${scratchDir}: ${err.message}\`) }` wrapping the assertions, with `rmSync(scratchDir, { recursive: true, force: true })` only reached on the success path. RESEARCH.md's skeleton (Code Examples § Smoke test skeleton) confirms this exact shape as the intended target — build it fresh, no in-repo precedent exists.

---

### `package.json` (config, CRUD field edits)

**Analog:** the file's own current state (read live this session — see excerpt below). This is a metadata diff against a known-good target already fully specified in `06-CONTEXT.md` D-62–D-69 and `06-RESEARCH.md` Code Examples § `package.json` diff — no other file in the repo demonstrates "how to add a `repository`/`publishConfig`/`homepage`/`bugs` block," so the analog is the research document's own worked diff, not a codebase file.

**Current state** (full file read this session):
```json
{
  "name": "sigil-spinner",
  "version": "0.1.0",
  "author": "",
  "license": "ISC",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:browser": "vitest run test/browser",
    "typecheck": "tsc --allowJs --checkJs --noEmit",
    "lint": "eslint .",
    "format": "prettier --write ."
  }
}
```
No `repository`, `publishConfig`, `homepage`, or `bugs` keys exist anywhere in the file — confirmed by reading it in full.

**Named-subset-script pattern to follow for `test:pack`** (existing `test:browser` entry):
```json
"test:browser": "vitest run test/browser",
```
`test:pack` follows the identical shape — a `vitest run <path>` invocation targeting the excluded file directly — but is NOT added to `test`, since D-71 requires it excluded from the default run:
```json
"test:pack": "vitest run test/pack-install.test.js"
```

**Target metadata block** (from RESEARCH.md Code Examples, D-62/63/66/67/68/69 verbatim):
```json
{
  "name": "@falkensmage/sigil-spinner",
  "version": "1.0.0",
  "license": "MIT",
  "author": "Matt Stine (https://github.com/mstine)",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/mstine/sigil-spinner.git"
  },
  "homepage": "https://github.com/mstine/sigil-spinner",
  "bugs": {
    "url": "https://github.com/mstine/sigil-spinner/issues"
  },
  "publishConfig": {
    "access": "public"
  }
}
```
`description`, `keywords`, `engines`, `files`, `exports`, `bin`, `type`, `devDependencies` stay untouched per D-69 — confirmed already correct by direct read.

---

### `vitest.config.js` (config, CRUD field edit)

**Analog:** the file's own current state — 8 lines, read in full:
```js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.js'],
  },
});
```
No existing `exclude` entry anywhere in the repo to copy — this is genuinely new surface, but the target shape is fully specified in RESEARCH.md Code Examples § `vitest.config.js` exclusion (uses Vitest's own `configDefaults.exclude` spread, not a hand-rolled array):
```js
import { defineConfig, configDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.js'],
    exclude: [...configDefaults.exclude, 'test/pack-install.test.js'],
  },
});
```

---

### `README.md` (doc, transform — specifier + disclosure edit)

**Analog:** the file's own current state. Line 15 is the known site (D-64):
```js
import { generateSigil } from 'sigil-spinner';
```
becomes:
```js
import { generateSigil } from '@falkensmage/sigil-spinner';
```
D-64 requires a **sweep**, not a single-line fix — grep the whole file for the bare `sigil-spinner` specifier before editing, since this list is explicitly "known site," not "only site." Do not touch relative imports under `src/`, `bin/`, `test/` — those never resolve through `exports` and are out of scope.

D-78's ESM-only disclosure has no existing analog anywhere in this README (no "CommonJS" or "ESM" language currently appears in the first 40 lines read) — this is new prose, not a pattern-copy; keep it in the opening section per the decision, phrased as a plain declarative fact (this package is ESM-only; a bare `require()` will throw `ERR_REQUIRE_ESM`), consistent with the README's existing direct, declarative technical register (e.g. "`generateSigil(statement, planet, options)` is a pure, synchronous function — no I/O, no module-level mutable state.").

---

## Shared Patterns

### Subprocess-driven CLI testing
**Source:** `test/e2e/phase2-tracer.test.js:1-5, 15-16, 64-70` (also present identically in `test/e2e/phase3-glyph-tracer.test.js` and `test/e2e/saturn-tracer.test.js` — not re-read, same shape confirmed by directory listing and by RESEARCH.md's own citation of this pattern)
**Apply to:** `test/pack-install.test.js`'s bin-execution and byte-identity assertions.
```js
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI_PATH = path.join(__dirname, '..', '..', 'bin', 'sigil-spinner.js');
...
const cliOutput = execFileSync(process.execPath, [CLI_PATH, STATEMENT, '--planet', PLANET], {
  encoding: 'utf-8',
});
```

### Mechanical drift-guard (read-a-shipped-artifact-and-assert)
**Source:** `test/citations.test.js:1-29, 508-513` (describe/it structure; full R1/R2 machinery not relevant to D-65's much narrower one-string check, but the *shape* — read real file text, extract a token, assert it resolves — is)
**Apply to:** D-65's README-specifier guard. Minimal version: read `package.json`, read `README.md`, regex out the import specifier, `expect(specifierFromReadme).toBe(packageJson.name)`. No need for citations.test.js's full window/label machinery — that solves a much harder N-to-M citation-matching problem this guard doesn't have.
```js
describe('Citation integrity (MAINT-01)', () => {
  it('has zero findings across src/ and bin/, and at least the plan-time-enumerated site count', () => {
    const { findings, totalSiteCount } = collectFindings();
    expect(totalSiteCount).toBeGreaterThanOrEqual(MINIMUM_CITATION_SITE_COUNT);
    expect(findings, `Citation findings:\n${formatFindings(findings)}`).toHaveLength(0);
  });
});
```
(structure to imitate, not machinery to reuse — D-65's guard is one string comparison, best placed either as its own small test file, e.g. `test/readme-specifier.test.js`, or as an additional `it` inside `test/pack-install.test.js` since both concern package-identity consistency; this split is Claude's Discretion per CONTEXT.md and not fixed by this pattern map)

### Named-subset test script convention
**Source:** `package.json` `scripts.test:browser: "vitest run test/browser"`
**Apply to:** the new `test:pack` script — same shape, targets a file instead of a directory:
```json
"test:pack": "vitest run test/pack-install.test.js"
```

### `node:` imports confined to `bin/` and `test/`
**Source:** repo-wide convention, stated explicitly in `06-CONTEXT.md` § Established Patterns and confirmed by `test/citations.test.js`'s own `node:fs`/`node:url`/`node:path` imports (lines 1-3) and `test/e2e/phase2-tracer.test.js`'s `node:url`/`node:path`/`node:child_process` imports (lines 1-3).
**Apply to:** `test/pack-install.test.js` freely uses `node:fs`, `node:os`, `node:child_process`, `node:path`, `node:url` — nothing in this phase adds a `node:` import to `src/`.

## No Analog Found

Files/sections with no close in-repo match — build from RESEARCH.md's worked examples rather than an in-repo analog:

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `LICENSE` | config (static legal text) | n/a | No license file exists anywhere in the repo today (`license: "ISC"` in `package.json` with no corresponding file — confirmed live). Use standard MIT license boilerplate with `Copyright (c) 2026 Matt Stine` per D-66; there is nothing to derive from repo conventions since this is pure external boilerplate. |
| `.github/workflows/release.yml` | config (CI, event-driven) | event-driven (workflow_dispatch) | `.github/` does not exist in this repo at all — confirmed via `ls .github` in RESEARCH.md's Standard Stack section. No prior workflow file, no CI convention to inherit. Build directly from RESEARCH.md's Code Examples § Release workflow skeleton (full YAML given, lines 299-358 of `06-RESEARCH.md`), which is already vetted against D-76/D-77's ordering and the `permissions: { contents: read, id-token: write }` requirement. |
| `test/pack-install.test.js`'s `npm pack`/`npm install`-into-scratch-dir logic specifically (as distinct from its subprocess-testing shape, which *does* have an analog above) | test (setup/fixture logic) | file-I/O | No existing test in this repo creates a scratch directory, packs a tarball, or does a real `npm install`. RESEARCH.md's Code Examples § Smoke test skeleton (lines 397-435) is the only available reference — treat it as the pattern source for this specific sub-behavior, cross-checked against Assumptions Log A4 (verify the actual `npm pack --dry-run --json` shape against this repo's installed npm 11.4.2 before writing the manifest assertion, since the skeleton's shape is inferred from an npm 12.x-era GitHub issue). |

## Metadata

**Analog search scope:** `test/`, `test/e2e/`, root config files (`package.json`, `vitest.config.js`, `README.md`), `.github/` (confirmed absent), `src/index.js` (read only to confirm D-72's export table, not as a pattern source — nothing in this phase touches `src/`).
**Files scanned:** `test/e2e/phase2-tracer.test.js` (full, 71 lines), `test/citations.test.js` (full, 581 lines), `package.json` (full), `vitest.config.js` (full, 8 lines), `README.md` (lines 1-40), `src/index.js` (lines 1-21).
**Pattern extraction date:** 2026-08-08
