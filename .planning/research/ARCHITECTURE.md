# Architecture Research — v1.1 Distribution

**Domain:** Integration research for adding npm publication, a global Claude Code skill, kamea-set provenance metadata, a `--title` CLI flag, and a `<sigil-spinner>` web component onto an existing, shipped, zero-dependency Node library.
**Researched:** 2026-08-07
**Confidence:** HIGH — every claim below is grounded in a direct read of the actual v1.0 source tree (`src/`, `bin/`, `test/`, `package.json`), not inference from file names or generic Node/web-component patterns. Where the milestone's "sharp edge" (build step vs. zero-dependency) is addressed, the audit is exhaustive: every file under `src/` was grep'd for `node:` imports and Node globals, not sampled.

This supersedes the pre-build `ARCHITECTURE.md` written 2026-08-04 (v1.0 planning, before a line of code existed — it described `commander` and a different file layout that v1.0 did not end up using). That document's core patterns (pipe-and-filter pipeline, renderer-agnostic PathModel, thin-CLI-over-library, no cross-imports outside the orchestrator) held and are **not restated here** except where a v1.1 feature interacts with them directly. Read the shipped `src/generate.js`, `src/data/kamea.js`, and `src/render/json.js` doc-comments for the current, accurate version of those patterns — they are more precise than the pre-build document because they were written and refined against real code and a real audit (Phase 4).

## Existing System (as shipped, v1.0)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  bin/sigil-spinner.js  (Node-only: node:util, node:fs)                   │
│    argv/stdin → generateSigil() → stdout/file                             │
└──────────────────────────────┬────────────────────────────────────────────┘
                                 │ imports only
┌────────────────────────────────▼───────────────────────────────────────────┐
│  src/index.js  (public surface — browser-safe, zero node: imports)        │
│    generateSigil, SigilError, five E_* constants                          │
└────────────────────────────────┬───────────────────────────────────────────┘
                                   │
┌────────────────────────────────▼───────────────────────────────────────────┐
│  src/generate.js  (orchestrator — browser-safe)                           │
│    resolveOptions() → normalize → encode → cell lookup → buildPath →      │
│    renderSvg + toWorking                                                   │
└──┬───────────┬────────────┬────────────┬─────────────┬────────────────────┘
   │            │            │            │             │
┌──▼──────┐ ┌──▼──────┐ ┌──▼─────────┐ ┌▼───────────┐ ┌▼────────────────┐
│text/     │ │data/     │ │path/       │ │render/svg   │ │render/json       │
│normalize │ │kamea,    │ │buildPath   │ │+coords+curve│ │(toWorking)        │
│+fold     │ │pythagorean│ │            │ │+glyphs+esc  │ │                  │
└──────────┘ └──────────┘ └────────────┘ └─────────────┘ └──────────────────┘
   all of the above: zero `node:` imports, zero Node globals — confirmed by
   direct grep, see "Browser-Safety Audit" below
```

## (a) Where the Web Component Lives

### Browser-safety audit (concrete, exhaustive — not inferred)

```bash
grep -rn "require(\|from 'node:\|from \"node:" src/ bin/
# bin/sigil-spinner.js:34:import { parseArgs } from 'node:util';
# bin/sigil-spinner.js:35:import { readFileSync, writeFileSync } from 'node:fs';

grep -rn "process\.\|Buffer\.\|__dirname\|__filename\|import.meta\|global\." src/
# (no matches)
```

**Result: every file under `src/` is browser-safe today, with zero exceptions.** `node:util` and `node:fs` appear exactly twice, both in `bin/sigil-spinner.js`, which is reachable only via the package's `bin` field (i.e., only as the `sigil-spinner` executable) — never through `src/index.js` or any deeper import. The full import graph confirms the isolation is real, not just undocumented luck:

| File | Imports | Node-specific? |
|---|---|---|
| `src/index.js` | `generate.js`, `errors.js` | No |
| `src/generate.js` | `text/normalize.js`, `data/pythagorean.js`, `data/kamea.js`, `path/buildPath.js`, `render/svg.js`, `render/json.js`, `errors.js` | No |
| `src/data/kamea.js` | `../errors.js` | No |
| `src/data/pythagorean.js` | (none) | No |
| `src/text/normalize.js` | `./fold.js` | No |
| `src/text/fold.js` | (none) | No |
| `src/path/buildPath.js` | `../render/coords.js` | No |
| `src/render/svg.js` | `./coords.js`, `./curve.js`, `./escapeXml.js`, `./glyphs.js` | No |
| `src/render/coords.js`, `curve.js`, `escapeXml.js`, `glyphs.js`, `json.js` | (leaves) | No |
| `src/errors.js` | (none) | No |
| `bin/sigil-spinner.js` | `node:util`, `node:fs`, `../src/index.js` | **Yes** |

So `src/index.js` — the entire published library surface, `generateSigil` included — already runs unmodified in a browser. This is a stronger starting position than "needs isolation": the isolation already exists, by construction, because `src/generate.js` performs no I/O (INT-02 concurrency edge, documented in its own header) and every SVG-building step is template-literal string assembly with no DOM dependency (the pre-build research's Anti-Pattern 1/pattern already ruled out DOM-based SVG libraries for exactly this reason).

### Placement decision

**Same package, new directory `src/element/`, exposed via a second `exports` entry.** Not a separate package. Reasons, all concrete:

1. **No isolation work is required** — the audit above is the isolation work, and it's already done. A separate package would exist only to *express* a boundary that the code already enforces; it would add publish/version-sync overhead (two `package.json`s to bump in lockstep, two changelogs, a peer-dependency edge between them) for zero safety gain.
2. **One determinism guarantee, one source.** The project's core value is "same input → same sigil." A second package importing the first as a dependency reintroduces exactly the kind of external-version drift the zero-runtime-dependency constraint exists to prevent (`d3-shape`'s internal precision choices becoming an invisible dependency, per `STACK.md`) — except now the "external" package is your own, published separately, and can drift out of lockstep with itself.
3. **`files: ["src", "bin", "README.md"]` already covers a new `src/element/` directory** with no `package.json` change beyond the `exports` map (below) — the packaging mechanism was already general enough.

**New file:** `src/element/sigil-spinner-element.js` — a `customElements.define('sigil-spinner', class extends HTMLElement { ... })` wrapper that imports `generateSigil` from `../generate.js` (or `../index.js`) and injects the returned SVG string into itself (light DOM, so the project's existing "style purely via CSS classes and custom properties" contract keeps working unchanged — a shadow DOM would need `::part()`/`::slotted()` plumbing to preserve that, which is unnecessary complexity this milestone doesn't need).

**Critical asymmetry worth naming explicitly:** `src/index.js` (the main entry) is universal — it runs in Node *and* browser unmodified. `src/element/sigil-spinner-element.js` is the **inverse** — it is browser-*only*, because it references `HTMLElement` and `customElements`, which do not exist in Node. This is the correct, expected shape (matches how Lit, Shoelace, and other custom-element libraries ship: the element wrapper is DOM-coupled by definition; the underlying logic module is not) — but it means `./element` must never be required/imported from Node code, including this project's own tests, without a DOM shim. `test/browser/` already exists and already requires `npx playwright install chromium` (documented in PROJECT.md's "Known state carried past v1.0") — the element's tests belong there, not in a plain Vitest `test/` file, for the same reason `theming-resolution.test.js` does: they need a real DOM.

**The "sharp edge" flagged in PROJECT.md — reassessed:** PROJECT.md frames the web component as "the first thing in this project's history that plausibly wants bundling" and says the build-step-vs-zero-dependency tension "must be decided openly at discuss-phase, not discovered mid-implementation." This research's finding: **a build step is not technically required.** The element file is plain ESM with a relative import into an already-browser-safe module graph — exactly the shape modern CDNs (`esm.sh`, `unpkg`, `jsdelivr` with `?module`) and native browser `<script type="module">` + import maps already resolve correctly without a bundler. A single-file bundle (e.g. via `esbuild`) remains a legitimate *optional* convenience for consumers who want one `<script src="…/sigil-spinner-element.bundled.js">` tag with no import-map setup — but it is a nice-to-have layered on top of a working unbundled path, not a prerequisite. This reframes the discuss-phase question from "do we need a build step" (no) to "do we also want to publish a bundled convenience artifact" (optional, deferrable, and — if taken — must not become the *only* shipped form, or the "source is what runs" commitment breaks for real this time).

## (b) `exports` Map Design

Current state (`package.json`):
```json
"main": "./src/index.js",
"exports": { ".": "./src/index.js" },
"bin": { "sigil-spinner": "./bin/sigil-spinner.js" }
```

`bin` and `exports` are separate resolution namespaces in Node's package resolution — a bundler resolving `@falkensmage/sigil-spinner` or any of its subpaths **never** touches `bin/sigil-spinner.js`, regardless of what the `exports` map contains, because `bin/sigil-spinner.js` is not reachable through any `exports` key today and adding `./element` doesn't change that. This is already the correct isolation; it just needs to be preserved, not built.

**Recommended v1.1 shape:**
```json
"exports": {
  ".": "./src/index.js",
  "./element": "./src/element/sigil-spinner-element.js",
  "./package.json": "./package.json"
}
```

Design notes, each a deliberate choice:

- **No `browser` condition on `.`** — would be redundant. A `browser` condition exists to let a package serve a *different* file to browser bundlers than it serves to Node (typically to swap out a Node-only dependency for a browser-compatible shim). This package has no such divergence to encode: `src/index.js` is identical-and-correct for both runtimes, confirmed by the audit above. Adding a `browser` condition that points at the same file as the unconditional export is pure noise — a future maintainer would reasonably read it as "there must be a difference" and go looking for one that doesn't exist.
- **No `browser` condition on `./element`, and no `node` condition excluding it** — the element module's Node-incompatibility isn't something `exports` conditions are the right tool for. Node conditions exist to pick between *interchangeable* implementations; there's no Node-compatible alternative implementation of a custom element to fall back to. The correct signal is documentation (README: "`./element` requires a DOM; import `.` directly for Node/server use"), matching how comparable custom-element packages handle it. This keeps the `exports` map legible instead of encoding a policy it wasn't designed to express.
- **`"./package.json": "./package.json"`** — a now-conventional third entry (tooling like `npm ls`, some bundler introspection, and monorepo tools expect to resolve a package's own `package.json` through `exports` once any `exports` map is present, since a populated `exports` map otherwise blocks *all* subpaths not explicitly listed, `package.json` included). Small, standard, avoids a class of "why can't my tool read the version" support requests.
- **No wildcard export** (e.g. `"./*": "./src/*"`). Deliberately keeps every internal module (`src/render/svg.js`, `src/data/kamea.js`, etc.) unreachable from outside the package, preserving the existing single-entry-point discipline ("this is the entire public surface of the package," per `src/index.js`'s own header) — a wildcard would silently promote every internal module to public API, which is exactly the kind of scope creep `exports` maps exist to prevent.
- **`main`/`bin` fields are untouched.** `main` stays `./src/index.js` (legacy-resolver fallback for tools that predate `exports`); `bin` stays exactly as today.

## (c) Kamea-Set Version Seam

### Where it lives, threading it through

The identifier already exists — `kameaSet: 'agrippa'` is already a field in the shipped `SigilWorking` (confirmed live in `src/render/json.js` line 94 and `test/__file_snapshots__/worked-example.working.json`). **PKG-02's actual gap is the *version*, not the identifier.** The seam to extend is the exact one that put `kameaSet` there in the first place — three files, in this order:

1. **`src/data/kamea.js`** — add a version export co-located with the set registry, mirroring `KAMEA_SETS`'s shape so a future second set (`skinner`, per `DEFAULT_KAMEA_SET`'s own doc comment: "the shape exists so a future verified set... can be added without reshaping this API") carries its own version without restructuring:
   ```js
   /** @type {Record<string, string>} */
   export const KAMEA_SET_VERSIONS = {
     agrippa: '1.0.0', // bump only per D-02: a corrected set gets a NEW KEY, not a mutated version
   };
   ```
   A small resolver (`kameaSetVersion(setName)`) alongside the existing `resolveSet`/`resolvePlanetKey` pattern keeps the "unknown set" error path consistent with `gridSize`/`kameaGrid`'s existing `E_UNKNOWN_PLANET`-on-bad-set behavior.

2. **`src/generate.js`** — `DEFAULT_KAMEA_SET` is already imported and already flows straight into the object passed to `toWorking()` (the `kameaSet: DEFAULT_KAMEA_SET` line, immediately above the `kameaGrid(canonicalPlanet)` call). Import `KAMEA_SET_VERSIONS` (or the resolver) alongside it and add one line — `kameaVersion: KAMEA_SET_VERSIONS[DEFAULT_KAMEA_SET]` — to the same object literal. This is not a new pattern; it's the same line, written a second time.

3. **`src/render/json.js`** — add the field to both the `SigilWorking` and `GeneratePipelineResult` JSDoc typedefs, destructure it in `toWorking()`, and add it to the returned object. **Key-order placement:** the file's own header states fields are emitted "in a fixed key order" (a determinism contract, not a style preference). The natural slot is immediately after `kameaSet` — the two fields describe the same fact (which data produced this sigil) and belong adjacent, before `gridSize`. This changes the *documented* key order, which is itself covered by an explicit test (see below).

**No other file needs to change.** `render/svg.js`, `path/buildPath.js`, `render/coords.js`, `render/curve.js`, `render/glyphs.js` never consume `kameaSet` today and have no reason to consume its version — the field is JSON-working-only, exactly like `kameaSet` itself. This is a three-file, single-direction change with no fan-out.

### Determinism / snapshot-rebase impact, quantified

PROJECT.md states 48 committed byte-pinned snapshots. Verified directly:

| Snapshot type | Count | Contains `kameaSet`/JSON working? | Affected by PKG-02? |
|---|---|---|---|
| `test/__file_snapshots__/*.svg` (file snapshots) | 45 | No — SVG output carries no kamea provenance data | **No** |
| `test/__file_snapshots__/worked-example.working.json` (file snapshot) | 1 | Yes | **Yes — rebases** |
| `test/render/__snapshots__/svg.test.js.snap` (inline vitest snapshot) | 1 export | No — SVG string only | **No** |
| `test/render/__snapshots__/json.test.js.snap` (inline vitest snapshot) | 1 export | Yes — full `working` object | **Yes — rebases** |
| **Total** | **48** | — | **2 of 48 rebase; 46 of 48 untouched** |

Additionally, two test files assert the key order/shape explicitly and need editing (not auto-rebasing — these are hand-written expectations that must be updated deliberately, or the PR is asserting a stale contract):

- `test/determinism.test.js` (`'appends the Phase 2 working keys after the unchanged Phase 1 key order'`, ~line 237–260) — a hardcoded array of key names; needs `'kameaVersion'` inserted after `'kameaSet'`.
- `test/render/json.test.js` (~line 27, the hand-built `GeneratePipelineResult` fixture used to unit-test `toWorking()` directly, and its key-order assertion ~line 116) — needs the new field added to the fixture and the order assertion.

This is a small, fully enumerable blast radius: 2 snapshot artifacts to regenerate, 2 test files to hand-edit, 3 source files to touch. It is not the kind of change that risks silently drifting the other 46 snapshots — those are generated from SVG rendering, which this change never touches.

## (d) `--title` Flag Threading

**Library side: already done.** `options.title` is already a `KNOWN_OPTIONS` entry (`title: 'boolean'`, `src/generate.js` line 64), already validated by `resolveOptions()`, already flows into `renderSvg`'s options spread (which drives the `<title>` element per `GenerateOptions.title`'s doc comment), and already appears in `working.render.title` (`src/render/json.js`'s `render` block, key order `curve, glyph, idPrefix, title` per D-48). Nothing in `src/` changes.

**Minimal CLI change — `bin/sigil-spinner.js` only, three edits:**

1. Add to the `parseArgs` options object (alongside `glyph`/`curve`/`'id-prefix'`): `title: { type: 'boolean', default: false }`.
2. Extract the value: `const titleArg = /** @type {boolean} */ (values.title);`
3. Pass it through: add `title: titleArg` to the `generateSigil(statement, planetArg, { glyph: glyphArg, curve: curveArg, idPrefix: idPrefixArg, title: titleArg })` call.

That's the entire change. It touches nothing in `src/`, has zero interaction with kamea data, zero interaction with the web component, and zero interaction with `package.json`. README's CLI flag table needs a documentation update to match (out of scope for this architecture document but worth flagging as a companion doc-touch). This is the smallest, most fully-isolated feature of the five.

## (e) Suggested Build Order

### File-level conflict analysis (the actual dependency graph, not intuition)

| Feature | Files touched |
|---|---|
| **PKG-02** (kamea version) | `src/data/kamea.js`, `src/generate.js`, `src/render/json.js`, `test/render/json.test.js`, `test/determinism.test.js`, `test/__file_snapshots__/worked-example.working.json`, `test/render/__snapshots__/json.test.js.snap` |
| **`--title` flag** | `bin/sigil-spinner.js` (+ README CLI docs) |
| **Claude Code skill** | `~/.claude/skills/sigil/*` — entirely outside this repository |
| **PKG-01** (npm publish) | `package.json` (`license` ISC→MIT, `name` scope, `version`, `author`, possibly `files`/base `exports`), new `LICENSE` file (does not exist today — confirmed), a clean-install smoke-test script/workflow, README publish/install docs |
| **WRAP-01** (web component) | new `src/element/sigil-spinner-element.js`, new browser test(s) under `test/browser/`, `package.json` (`exports["./element"]`), README usage docs |

**Overlap: exactly one file, `package.json`, shared between PKG-01 and WRAP-01** — and even there the overlap is additive (different keys: PKG-01 owns `license`/`name`/`version`/`author`/base `exports`; WRAP-01 adds one new `exports` subpath) rather than the same lines being contended, the way v1.0's phases all converged on the same logic inside `src/render/svg.js` and `src/generate.js`. Every other pair of features shares zero files.

**This is a materially different shape from v1.0.** PROJECT.md notes v1.0 was strictly sequential because every phase touched `src/render/svg.js` and `src/generate.js` — a real, load-bearing coupling from building one rendering pipeline outward in vertical slices. v1.1 is five mostly-orthogonal *additions* to an already-stable pipeline, not further slices through it: PKG-02 is the only feature touching the core pipeline files at all, and it touches a different pair of files (`data/kamea.js`, `render/json.js`) than `--title` touches (`bin/` only) or WRAP-01 touches (a new leaf directory). Genuine parallelism is available and should be reflected in the roadmap's wave structure.

### Recommended order

**Wave 1 — fully parallel, zero file overlap between any pair:**
- PKG-02 (kamea version in JSON working)
- `--title` CLI flag
- Claude Code skill (content authoring) — can draft mechanics and planet-correspondence content immediately; the one place it references the package name/`npx` invocation can use a placeholder until Wave 2 lands, since drafting has no file dependency on anything else in this repo

**Wave 2 — sequential within itself, and should follow Wave 1's PKG-02 loosely (soft, not hard):**
1. **PKG-01 first.** It establishes `package.json`'s stable v1.1 shape — corrected `license`, `name`, `version`, `files`, and the base `exports["."]` entry — that WRAP-01 needs to build on top of rather than risk clobbering. It also needs a genuinely new artifact (`LICENSE` — confirmed absent from the repo today) and a clean-install smoke test, neither of which any other feature depends on.
2. **WRAP-01 second.** Its source file (`src/element/sigil-spinner-element.js`) has no file dependency on PKG-01 and could be *authored* in Wave 1 in principle — the sequencing reason is narrower than "needs PKG-01's code": it's that the `exports["./element"]` entry is cleanest to add onto a `package.json` that has already had its core identity fields (name/license/version) settled, and the milestone's own smoke test (PKG-01) is the natural place to also verify the `./element` subpath resolves correctly post-`npm pack` — which requires WRAP-01's file to exist. In practice this means: WRAP-01's element file can be drafted anytime, but the `package.json` merge and the "does this actually work when installed from a tarball" verification are cleaner done after PKG-01's package.json changes land, avoiding two features racing to edit the same file's `exports` block.

**Final step — depends on PKG-01 completion, not on file overlap:** verify the Claude Code skill's documented invocation (`npx @falkensmage/sigil-spinner ...`) actually works against the *published* package, not a local path. This is a verification-order dependency (the skill's claims need something real to test against), not a code dependency — the skill's files never touch anything PKG-01 touches.

**Net effect for the roadmapper:** three of five features (PKG-02, `--title`, skill drafting) can run as one wave with no waiting. The other two (PKG-01, WRAP-01) have a real but narrow coupling through `package.json` and are best sequenced PKG-01 → WRAP-01, with WRAP-01's source authoring allowed to overlap Wave 1 if a phase wants to parallelize implementation work while reserving the `package.json` merge and final verification for after PKG-01 lands.

## Integration Points Summary

### New components

| Component | New/Modified | Files |
|---|---|---|
| Web-component wrapper | New | `src/element/sigil-spinner-element.js` (+ browser test) |
| Kamea-set version registry | New | `src/data/kamea.js` (new export `KAMEA_SET_VERSIONS` + resolver) |
| `LICENSE` file | New | repo root (does not exist today) |
| Clean-install smoke test | New | test/CI script, exercised against `npm pack` output |
| Claude Code skill | New | `~/.claude/skills/sigil/*` (outside repo) |

### Modified components

| Component | Change | Files |
|---|---|---|
| `toWorking()` / `SigilWorking` shape | Add `kameaVersion` field after `kameaSet` | `src/render/json.js` |
| Pipeline orchestration | Pass kamea version into the `toWorking()` call | `src/generate.js` |
| CLI argument surface | Add `--title` flag, thread through to `generateSigil` | `bin/sigil-spinner.js` |
| Package metadata | `license` ISC→MIT, `name` scope, `exports["./element"]`, `exports["./package.json"]` | `package.json` |
| Determinism/key-order tests | Insert `kameaVersion` into the asserted key list | `test/determinism.test.js`, `test/render/json.test.js` |

### Internal boundaries (v1.1 additions on top of the existing table)

| Boundary | Communication | Notes |
|---|---|---|
| `src/element/` ↔ `src/generate.js` | Direct import of `generateSigil` (or via `src/index.js`) | The element module is the one place in the tree allowed to reference `HTMLElement`/`customElements` — every other module, including this one's *logic*, stays DOM-free. |
| `bin/sigil-spinner.js` ↔ `exports` map | None — `bin` and `exports` are separate resolution namespaces | Adding `./element` to `exports` cannot expose `bin/sigil-spinner.js` (and its `node:util`/`node:fs` imports) to a browser bundler; this isolation is structural, not a discipline that has to be maintained by convention. |
| `src/data/kamea.js` ↔ `src/render/json.js` | One new field, routed through `src/generate.js` — no direct import between them | Preserves the existing rule that `generate.js` is the only module allowed to import across `data/`, `text/`, `path/`, and consume `render/` — PKG-02 doesn't need and shouldn't create a new cross-import. |

## Sources

- Direct read of shipped source: `src/index.js`, `src/generate.js`, `src/data/kamea.js`, `src/render/json.js`, `bin/sigil-spinner.js`, `package.json` — HIGH confidence, ground truth for this project, not a researched/interpreted claim.
- Direct grep audit of `src/` and `bin/` for `node:` imports and Node globals (`process.`, `Buffer.`, `__dirname`, `__filename`, `import.meta`, `global.`) — HIGH confidence, exhaustive not sampled.
- Direct read of `test/__file_snapshots__/` directory listing, `test/render/__snapshots__/json.test.js.snap`, `test/render/__snapshots__/svg.test.js.snap`, `test/__file_snapshots__/worked-example.working.json`, and `test/determinism.test.js`/`test/render/json.test.js` grep for key-order assertions — HIGH confidence, the quantified snapshot-rebase count (2 of 48) is counted directly from these files, not estimated.
- `.planning/PROJECT.md` — source of truth for v1.1 scope, constraints, and the "sharp edge" framing this document directly addresses. Treated as HIGH confidence / authoritative for this project.
- General ecosystem knowledge of `package.json` `exports` conditional-exports conventions (browser/node conditions, the `"./package.json"` convenience entry, `bin` vs. `exports` as separate resolution namespaces) and custom-element packaging conventions (Lit/Shoelace-style browser-only wrapper modules over framework-agnostic logic) — MEDIUM confidence, standard/uncontroversial ecosystem practice, not project-specific.

---
*Architecture research for: v1.1 Distribution — integrating npm publication, a global skill, kamea-set provenance, a CLI flag, and a web component onto the shipped v1.0 architecture*
*Researched: 2026-08-07*
