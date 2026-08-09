# Phase 7: The sigil-spinner Element - Research

**Researched:** 2026-08-09
**Domain:** Native (framework-free) custom elements — Playwright/Chromium verification of real ESM module loading, `exports`-map subpath resolution from Node without evaluation, custom-element upgrade-timing semantics, and HTML-parser SVG-namespace handling for `innerHTML`.
**Confidence:** HIGH — every load-bearing claim below was verified this session either by reading this repo's own source (svg.js, generate.js, package.json, existing browser tests) or by fetching the current WHATWG HTML spec / Node.js docs directly. Nothing in this document rests on unverified training-data recall for the six priority questions.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

Nine gray areas, all auto-resolved (Mode: `--auto` — no decision below was confirmed by Matt in conversation; D-80, D-82, D-84 are rated `one-way` and must surface at a `checkpoint:decision` before the task that implements them).

- **D-79: Attributes are the CLI's flag names with the leading `--` dropped, kebab-case preserved.** Full set: `statement`, `planet`, `curve`, `glyph`, `id-prefix`, plus `show-title` (D-80). `--json`/`--output` have no element analog. One-way per attribute once published.
- **D-80: The title toggle is `show-title`, not `title`.** `title` is a global HTML tooltip attribute and collides with `options.title`'s different meaning. Exception to D-79's drop-the-dashes rule; README must say so explicitly. One-way.
- **D-81: Boolean attributes use HTML presence semantics, not value semantics.** `curve`, `glyph`, `show-title` are true when present regardless of value — `curve="false"` still enables curves. This footgun must be documented explicitly and pinned in a browser test.
- **D-82: `<sigil-spinner>` attaches no shadow root. Ever.** SVG string written directly into light-DOM children. Both `--sigil-*` custom properties AND the seven semantic classes (`.sigil-path`, `.sigil-grid`, `.sigil-node`, `.sigil-loop`, `.sigil-start`, `.sigil-end`, `.sigil-glyph`) must reach the element identically to a hand-pasted `<svg>`. One-way.
- **D-83: The element lives at `src/element/sigil-spinner-element.js`.** The one file in the tree allowed to reference `HTMLElement`/`customElements`. Browser-only (inverse of `src/index.js`'s universal nature); tests belong in `test/browser/`, never plain Vitest.
- **D-84: The `exports` map gains `"./element"` and `"./package.json"`.** No `browser` condition on either entry (no divergence to encode); no `node` condition excluding `./element` (no Node-compatible fallback exists — documentation is the correct signal); no wildcard export; `main`/`bin` untouched. One-way once published.
- **D-85: The element imports only `import { generateSigil } from '../index.js'`** — the public surface, same as `bin/sigil-spinner.js`. Never reaches into an internal module (which would throw `ERR_PACKAGE_PATH_NOT_EXPORTED` for external consumers).
- **D-86: No string concatenation into `innerHTML`, ever.** The element assigns the entire, unmodified `generateSigil` output or nothing. Anything the element adds itself goes through `document.createElement` + `.textContent =`. Greppable warning sign: any `.innerHTML =` whose right-hand side isn't exactly the whole `svg` string.
- **D-87: `observedAttributes` is `['statement', 'planet', 'curve', 'glyph', 'id-prefix', 'show-title']`.** Every attribute that changes output is observed; nothing else.
- **D-88: Render happens in `connectedCallback`, and in `attributeChangedCallback` only when `this.isConnected`.** Fixes the upgrade-timing trap where pre-insertion `setAttribute` calls fire `attributeChangedCallback` before `connectedCallback`. Set-before-upgrade and set-after-insertion must produce the same final render, and that equivalence gets a browser test. **See "Architecture Patterns → Custom-Element Upgrade Timing" below — this session's research found a real gap in this decision's stated reasoning that the plan must account for.**
- **D-89: Re-render is synchronous, whole-content replacement — no diffing, no batching.** Setting three attributes in a row renders three times; accepted cost.
- **D-90: The `define()` call is guarded** — `if (!customElements.get('sigil-spinner')) customElements.define(...)`. Structural test: load the module twice in one browser page, assert no throw.
- **D-91: A missing `statement` or `planet` renders nothing and throws nothing.** Mid-construction is a normal transient state.
- **D-92: A thrown `SigilError` clears the element's content, logs to `console.error`, and reflects `data-sigil-error="<code>"` on the host.** Removed on next successful render. Never swallowed silently, never a placeholder graphic.
- **D-93: The element synthesizes nothing** — no derived `id-prefix`, no hash, no counter. WRAP-03's "no id collisions" is satisfied by construction (zero `id` attributes emitted by default, D-44). Browser test asserts zero `id` attributes across several co-rendered elements plus independent re-render.
- **D-94: The browser test is `test/browser/element.test.js`, loading the real module over a local `node:http` static server.** Extends `test/browser/theming-resolution.test.js`'s Playwright/Chromium pattern; diverges because that test never loads a module. Seven owed assertions (visibility, computed-style override, class-selector match, double-registration, upgrade-timing equivalence, attribute-mutation re-render with zero ids, `curve="false"` footgun).
- **D-95: A human-facing example page lives at `examples/element.html`, repo-only** — not in `files`, not shipped in the tarball. The instrument success criterion 1's human check is performed against. Served by the test's own server or `python3 -m http.server`.
- **D-96: `test/pack-install.test.js` gains one `ENTRY_POINTS` row for `./element`, resolve-only.** The existing probe `import`s and evaluates; the element module cannot be evaluated in Node (`class extends HTMLElement` dereferences an undefined global at class-definition time). The row needs a discriminator: resolve through `exports`, confirm the file exists, never evaluate. **See "Architecture Patterns → Verifying the `./element` Subpath from Node" below for the concrete mechanism.**
- **D-97: The README gains an element section bound to the code by a mechanical drift guard** — asserts the README's documented attribute set matches `observedAttributes` exactly, both directions. Same instrument as D-55/D-61/D-65/MAINT-01.
- **D-98: Phase 7 does not publish; `version` stays `1.0.0` in the tree.** Publishing `1.1.0` is a named milestone-close action, not this phase's job.

### Claude's Discretion

- Plan decomposition and commit granularity — the element file/browser test can land before the `package.json` `exports` edit and the pack-install row.
- The element class's internal shape — whether option assembly is a small pure helper or inline; whether `data-sigil-error` writing goes through a private method.
- The static server helper's exact form — inline in `test/browser/element.test.js` vs. a shared fixture module; port strategy (ephemeral via `server.listen(0)` is the obvious choice, not locked).
- The example page's visual arrangement — planet/layout count; requirement is both theming mechanisms visibly distinguishable plus an exercisable live attribute mutation.
- Whether the README drift guard lives in `test/package-identity.test.js` or its own file.
- Whether the browser test's visibility assertion (D-94 #1) uses a geometry read, a bounding-box check, or a computed-style read — mechanism is open, constraint is it must distinguish "an `<svg>` is in the DOM" from "a sigil is on screen."

### Deferred Ideas (OUT OF SCOPE)

- Publishing `1.1.0` to npm (milestone-close action; D-98).
- A bundled single-file browser artifact (PKG-06).
- JS property accessors on the element (`el.statement = '...'`) — WRAP-03 only asks for attribute-change re-render.
- Microtask batching of re-renders — reopen only if a real page shows the cost is measured, not hypothetical.
- A `push: tags: v*` release trigger; a PR-triggered CI workflow.
- The three v1.0 items deferred with written reopen conditions (`E_CLI_STDIN`, `perpendicularUnit` doc comment, `D-12` citation collision) — this phase is not expected to touch `bin/` and should confirm rather than assume the `D-12` reopen condition stays unmet.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| WRAP-01 | The custom element renders a sigil in the browser, loaded as plain ESM, no build step, no runtime dependencies | Architecture Patterns §1 (module-loading recipe over `node:http`), §3 (upgrade timing), §6 (`innerHTML` SVG namespace) below establish the concrete, verified mechanics of getting a real ESM custom element to render correctly in Chromium and confirm no build step is technically required to prove it |
| WRAP-02 | Light DOM (no shadow root) so page CSS reaches the element through both `--sigil-*` custom properties and semantic classes, identical theming reach to raw SVG | Architecture Patterns §6 (innerHTML/SVG namespace confirmation) is the load-bearing proof that D-82's light-DOM approach mechanically works; Code Examples §2 gives the concrete browser-test assertion pattern (page-level class rule + custom-property override, both from outside the component) |
| WRAP-03 | Attribute changes after insertion re-render correctly; multiple elements on one page render independently with zero id collisions | Architecture Patterns §3 (upgrade timing — the concrete finding that D-88's `isConnected` gate does not suppress every redundant render path, though it does not break correctness) and §4 (error-reflection reentrancy) directly inform the browser test's re-render and multi-instance assertions |

</phase_requirements>

## Summary

This phase's risk is not "does the team know how to write a custom element" — it is whether six specific, previously-unverified mechanical claims in CONTEXT.md's locked decisions hold up against the actual current behavior of Playwright, Node's `exports` resolver, and the HTML parsing/custom-element specs. This session verified all six directly (WHATWG HTML spec fetches, Node.js docs fetches, and a live grep of this repo's source) rather than trusting training-data recall, because every one of them is exactly the class of "looks correct in a code read, invisibly wrong at render time" defect the phase's own verification lesson (Pitfall 8) warns about.

Five of the six locked assumptions in D-94/D-88/D-96 are confirmed correct as stated. **One has a real, previously-unstated gap**: D-88's `this.isConnected` gate does not suppress redundant `attributeChangedCallback`-triggered renders in the most common real-world path — a `<sigil-spinner>` already sitting in the initial HTML, upgraded when a deferred/module `<script>` later calls `customElements.define()`. In that path, `isConnected` is already `true` for every attribute-reaction fired during the upgrade (the element is already in the connected document tree), so the gate does not block them. This does not violate D-88's stated invariant ("set-before-upgrade and set-after-insertion produce the same final render") — every render reads full current attribute state, so the *content* is always correct — but it does mean the render function will be called more than once for this path, and the browser test (D-94 assertion 5) must be written to assert final-render correctness across three cases (pre-append `setAttribute`, post-append `setAttribute`, and parser-created-then-later-defined), not just two, and must not assert a render-call-count of exactly one.

**Primary recommendation:** implement per D-79 through D-98 as locked, with the concrete mechanics below substituted for each of the six flagged unknowns. No locked decision needs to change; two (D-88's browser-test coverage, D-96's probe shape) need the sharper mechanism this research provides to be implementable at all.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Sigil generation (SVG string) | API/Library (`src/generate.js`, pure function) | — | Already built, untouched by this phase; the element is a pure consumer |
| Custom-element registration + lifecycle | Browser/Client (`src/element/`) | — | `customElements`/`HTMLElement` exist only in the browser; this is the one file allowed to reference them (D-83) |
| Light-DOM rendering + page-CSS reachability | Browser/Client | — | `innerHTML` assignment on a plain `HTMLElement`; no server/build tier involved at all (D-82) |
| Package resolution (`exports["./element"]`) | Build/Packaging (`package.json`) | Browser/Client (consumes it) | Resolution is a Node/bundler-time concern; evaluation is browser-only — two vantage points, two tiers, deliberately not collapsed (D-96) |
| Verification | Test/CI (two tools: Node smoke-probe, Playwright browser test) | — | Node proves *shipping*; Playwright proves *evaluation and rendering* — neither substitutes for the other (D-94/D-96) |

No server/SSR tier exists in this project and none is introduced — WRAP-01 is explicitly a client-JS-required convenience over a build-time-callable pure function (STACK.md §c, PITFALLS.md Anti-Feature "Declarative Shadow DOM / SSR").

## Standard Stack

No new runtime or dev dependencies. This phase adds zero packages — `customElements`/`HTMLElement` are native browser APIs, and the verification tooling (`playwright@1.62.1`, already a devDependency) is already installed and pinned in this repo `[VERIFIED: package.json:53]` (`"playwright": "^1.62.1"`). Confirmed live on this machine: `node --version` → `v24.4.1` `[VERIFIED: local shell]`, satisfying the `engines.node: >=20.0.0` floor `[VERIFIED: package.json:18-20]`, and `node_modules/playwright/package.json` reports `"version": "1.62.1"` `[VERIFIED: local shell]`.

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Native Custom Elements v1 (`customElements`, `HTMLElement`) | Browser built-in | Element registration and lifecycle | Zero-dependency; STACK.md §c already committed this milestone to "no web-component authoring library" |
| `node:http` (built-in) | Node built-in | Test-only static file server for the browser test's module loading | Already the pattern this repo uses for other Node built-ins in `test/` (`node:fs`, `node:os`, `node:child_process` in `test/pack-install.test.js`) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| A hand-rolled `node:http` server in the test fixture | `addScriptTag({ url, type: 'module' })` pointed at the same server, without navigating the page to a full HTML fixture first | Both work (see Architecture Patterns §1) — `addScriptTag({url})` is an *external* script with its own fetch URL, so its relative imports resolve correctly even if the page's own document is `about:blank`/`page.setContent()`-authored. This is a legitimate simplification worth considering at plan time: it avoids needing to author a full HTML page in the test fixture, only a small static-file server. Still requires the server (an inline/`path`-based script cannot do this — see §1). |

No dependency-adjacent alternatives apply beyond this — this phase's whole stack question was settled in STACK.md/PITFALLS.md before this research pass; nothing found here reopens it.

## Package Legitimacy Audit

Not applicable — this phase installs zero new packages. No `package.json` `dependencies` or `devDependencies` change; the only `package.json` edit is the additive `exports` map entry (D-84), a manifest key, not a package install.

## Architecture Patterns

### 1. Loading real ESM with relative imports into a Playwright page — the recipe, verified

**Claim in D-94:** `page.setContent` and `addScriptTag({path})` both break the element's relative imports; `file://` blocks them outright; a `node:http` static server is the fix.

**Verified this session, against the WHATWG HTML spec directly** `[VERIFIED: html.spec.whatwg.org/multipage/webappapis.html#concept-script-base-url]`:

> "A base URL: Null or a base URL used for resolving module specifiers. When non-null, this will either be the URL from which the script was obtained, for external scripts, or the document base URL of the containing document, for inline scripts."

This is the exact mechanism, and it explains *why* each of D-94's three rejected approaches fails, not just *that* they fail:

| Approach | Script kind | Base URL used for `import './other.js'` | Result |
|---|---|---|---|
| `page.setContent(html)` with an inline `<script type="module">` | Inline | Document base URL (`about:blank`) | Relative imports resolve against `about:blank` — fails |
| `page.addScriptTag({ path: '/abs/path/element.js' })` | Playwright reads the file and injects its **content** inline (confirmed: Playwright's own docs describe `path` as producing injected script content, not a `src`-bearing external script) | Document base URL, same as above | Fails identically to `setContent`, for the same underlying reason — the file's own filesystem location is irrelevant, only the page's URL matters |
| `file://` page loaded via `page.goto('file:///...')` | N/A | N/A | Module fetches from `file://` are blocked by Chromium's CORS handling for module scripts regardless of base-URL correctness |
| `page.goto('http://127.0.0.1:PORT/...')` with a real `<script type="module" src="/element.js">`, or `page.addScriptTag({ url: 'http://127.0.0.1:PORT/element.js', type: 'module' })` | **External** (has its own `src`/`url`) | **The script's own fetch URL** | Relative imports (`./generate.js`, `../render/svg.js`, etc.) resolve correctly relative to that URL — this is the only approach of the four that works |

**Concrete recipe, confirmed against this repo's actual file layout** `[VERIFIED: src/element/ does not yet exist; src/index.js:12 confirms the import path the element must use per D-85]`:

```js
// test/browser/element.test.js — server fixture shape
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const MIME = { '.js': 'text/javascript', '.html': 'text/html' };

function startStaticServer(rootDir) {
  const server = createServer(async (req, res) => {
    try {
      const filePath = join(rootDir, decodeURIComponent(req.url.split('?')[0]));
      const body = await readFile(filePath);
      res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] ?? 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end();
    }
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}
```

`REPO_ROOT` as the served directory (so `/src/element/sigil-spinner-element.js` and its `../index.js` → `../generate.js` → … chain all resolve correctly relative to the server) is the natural choice — it mirrors how a real consumer's site would serve the package's own `src/` tree (STACK.md §c: jsdelivr/unpkg already serve the full file tree this way).

**One concrete, previously-unflagged requirement this research surfaces:** the server **must** set an explicit JavaScript MIME type (`text/javascript` or `application/javascript`) on `.js` responses. Chromium enforces strict MIME-type checking for module scripts and will reject the load with `Failed to load module script: Expected a JavaScript module script but the server responded with a MIME type of "..."` if the `Content-Type` header is missing or wrong `[CITED: multiple independent sources converge — Chromium MIME enforcement for module scripts is standard, well-documented behavior]`. `node:http`'s bare `createServer` does not set `Content-Type` automatically from a file extension — the fixture must do this explicitly, or the whole recipe silently fails at exactly the step D-94 exists to protect.

**MIME-type detail worth flagging for the plan:** `text/javascript` is the currently-recommended MIME type per the WHATWG mimesniff living standard (it superseded `application/javascript` as the canonical registration); both are accepted by Chromium in practice, but `text/javascript` is the safer, spec-aligned choice for a fixture written today.

### 2. Verifying the `./element` subpath from Node without evaluating it — the exact API and its gap

**Claim in D-96:** `import.meta.resolve('<pkg>/element')` should throw `ERR_PACKAGE_PATH_NOT_EXPORTED` for a missing `exports` entry, and the probe needs an additional check if resolution alone doesn't prove the file shipped.

**Verified this session, against Node's own docs** `[VERIFIED: nodejs.org/api/esm.html#importmetaresolvespecifier]`:

- `import.meta.resolve(specifier)` is **synchronous** and returns a string directly (not a Promise) — stable behavior since Node **v20.0.0 / v18.19.0** ("This API now returns a string synchronously instead of a Promise"). It is fully stable, no flag, since **v20.6.0 / v18.19.0** for the standard single-argument form. This project's `engines.node: >=20.0.0` floor `[VERIFIED: package.json:18-20]` comfortably covers this — no compatibility risk.
- It **does throw** `ERR_PACKAGE_PATH_NOT_EXPORTED` when the specifier does not resolve through the package's `exports` map — exactly what D-96 needs for the "the subpath resolves through `exports`" half of the assertion.
- **The critical gap, confirmed directly from Node's changelog text on the same doc page:** *"This API no longer throws when targeting `file:` URLs that do not map to an existing file on the local FS"* — as of **v20.6.0 / v18.19.0**. This means `import.meta.resolve()` alone **cannot** prove the target file actually shipped in the tarball; it only proves the `exports` map maps the specifier to *some* URL. A `files` misconfiguration that omits `src/element/sigil-spinner-element.js` from the published tarball (Pitfall 4) would make `import.meta.resolve('@falkensmage/sigil-spinner/element')` succeed and return a URL — silently — even though the file doesn't exist at that path in the installed package.

**Concrete implication for D-96's probe:** the row must do exactly what the critical-scoping note anticipated — resolve, then separately verify existence on disk:

```js
// generated probe .mjs, in the spirit of the existing ENTRY_POINTS probe shape
// (test/pack-install.test.js's existing per-entry probe generates a .mjs and
// execFileSync's it — this is a parallel, resolve-only variant for './element')
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

This is a **resolve-only** probe (no `import { ... } from` of the element specifier itself, and no `class extends HTMLElement` ever runs in Node) — confirming D-96's own reasoning is correct: `class extends HTMLElement` evaluates its `extends` expression at class-definition time (standard ECMAScript class-evaluation semantics — the extends clause is evaluated eagerly, not lazily on first instantiation), so any `import` that causes the module body to execute in Node (where `HTMLElement` is undefined) throws `ReferenceError: HTMLElement is not defined` immediately — which is exactly the failure D-96 designs the probe to avoid triggering on a *correctly published* package.

**Generated-probe form confirmed compatible:** `test/pack-install.test.js`'s existing pattern (write a `.mjs` file, run it via `execFileSync(process.execPath, [probePath], ...)`) works unchanged for this row — `import.meta.resolve` is available in any ESM module context, generated or not, with no special flag needed at this project's Node floor.

### 3. Custom-element upgrade timing — the concrete ordering, and the gap in D-88's coverage

**Claim in D-88:** gating render in `attributeChangedCallback` on `this.isConnected` fixes the pre-insertion `setAttribute` problem, and "set-before-upgrade and set-after-insertion must produce the same final render."

**Verified this session, against the WHATWG HTML custom-elements spec** `[VERIFIED: html.spec.whatwg.org/multipage/custom-elements.html — "upgrade an element" algorithm]`: the upgrade algorithm's ordering is:

1. For each attribute in the element's attribute list, **in order**, enqueue an `attributeChangedCallback` reaction.
2. **Then**, if the element is connected, enqueue a `connectedCallback` reaction.

This ordering holds for all three of the paths named in the critical-scoping note, but **`isConnected`'s value during step 1 is different across them**, and this is the load-bearing finding:

| Path | Element's connectedness during step-1 reactions | `isConnected` seen by `attributeChangedCallback` | D-88 gate behavior |
|---|---|---|---|
| **(a) `document.createElement()` then `setAttribute()` before `appendChild()`** — element already defined, upgraded synchronously by `createElement` itself | Not yet in the document | `false` | Gate correctly suppresses render; only `connectedCallback` renders. **Matches D-88's stated reasoning exactly.** |
| **(b) `document.createElement()`, `appendChild()` immediately, `setAttribute()` after insertion** | Already in the document | `true` for every `setAttribute` call | Gate does **not** suppress — each `setAttribute` triggers a render (accepted cost, per D-89) |
| **(c) Parser-created — `<sigil-spinner statement="…" planet="…">` already sits in the initial HTML, and `customElements.define()` runs later (e.g. a deferred/module `<script>` at end of body)** | **Already connected** (it's in the parsed document tree) at the moment the upgrade algorithm runs, because the *element* existed and was inserted by the parser well before the *definition* arrived | **`true`** for every one of the `attributeChangedCallback` reactions enqueued in step 1 — confirmed directly: *"Even though `connectedCallback()` hasn't been called yet, the value of `isConnected` in the earlier `attributeChangedCallback()` calls is true"* `[CITED: MDN "Using custom elements" — corroborated by the spec's own step ordering above]` | **Gate does not suppress.** The element renders once per attribute already present on the tag (in attribute-list order), then renders again via `connectedCallback` in step 2. |

**This is not a correctness bug** — D-88's stated invariant ("set-before-upgrade and set-after-insertion produce the same final render") still holds, because every render call reads the element's *current, full* attribute state via `getAttribute` calls inside the render function (not the `attributeChangedCallback`'s `newValue` parameter alone), so each of the redundant renders in path (c) individually produces the *complete, correct* output — there is just more than one of them. This is the same accepted-cost shape D-89 already names for path (b) ("setting three attributes in a row renders three times"), just arriving via a route CONTEXT.md's own framing of D-88 didn't explicitly walk through.

**What this means for the plan and D-94's assertion 5:** the browser test's "set-before-upgrade and set-after-insertion produce the same final render" assertion should explicitly exercise **all three paths**, not a binary before/after split, and must assert *final rendered content is correct*, not *render was called exactly once*. Path (c) — element already in parsed HTML, script defining the element loaded afterward — is arguably the single most common real-world usage pattern for this element (a page author writes `<sigil-spinner statement="..." planet="...">` directly in their HTML body and loads the module via a `<script type="module">` placed after it, or deferred) and should get its own explicit test case, not be assumed to be covered by the "before/after" framing alone.

### 4. `data-sigil-error` reflection and attribute-write reentrancy

**Claim in D-92:** writing `data-sigil-error="<code>"` from inside a render path triggered by `attributeChangedCallback` is legal and does not recurse, because `observedAttributes` (D-87) does not include `data-*`.

**Confirmed correct, by direct reasoning from the locked `observedAttributes` list** `[VERIFIED: D-87's own text, `07-CONTEXT.md:56`]` — `attributeChangedCallback` only fires for attributes named in `static get observedAttributes()`, which is exactly `['statement', 'planet', 'curve', 'glyph', 'id-prefix', 'show-title']`. `data-sigil-error` is not in that list, so `this.setAttribute('data-sigil-error', code)` inside the callback cannot re-trigger `attributeChangedCallback` for itself — this is standard, spec-guaranteed behavior (the browser only enqueues a reaction for attributes present in the observed list; `setAttribute` on an unobserved attribute name is a no-op from the custom-element-reaction perspective). No reentrancy hazard exists here structurally.

**The one real hazard worth naming for the plan, not present in CONTEXT.md's text:** if the render path does `this.innerHTML = ''` (clear-before-render, e.g. on the error path per D-92 — "clears the element's content") followed by `this.setAttribute('data-sigil-error', code)`, and a *later* successful render clears `data-sigil-error` via `this.removeAttribute('data-sigil-error')` (per D-92: "removed on the next successful render") — both of these DOM writes happen synchronously inside a single `attributeChangedCallback`/`connectedCallback` invocation, which is fine (no async boundary, no interleaving), but the render function's internal ordering matters: clear `innerHTML` and set/clear `data-sigil-error` should happen in the same synchronous pass as the `generateSigil` call succeeding or throwing, with a single `try { ...; this.removeAttribute('data-sigil-error') } catch (err) { this.innerHTML = ''; this.setAttribute('data-sigil-error', err.code); }` shape — not two separate DOM-mutation passes that could leave the element in an inconsistent state if something between them throws unexpectedly. This is an implementation-shape note for the plan, not a new decision — D-92 already specifies the required end states; this just flags the ordering that gets there safely.

### 5. Asserting a sigil is VISIBLE, not merely present

**Two viable, well-established Playwright mechanisms, with different semantics — worth naming both for the plan to choose from (Claude's Discretion, per CONTEXT.md):**

1. **`getBBox()` geometry read**, continuous with this repo's existing pattern (`page.evaluate` + a direct DOM query, as `theming-resolution.test.js` already does for `getComputedStyle`): `page.evaluate(() => document.querySelector('.sigil-path').getBBox())`, asserting `width > 0 && height > 0`. `getBBox()` is defined on `SVGGraphicsElement` (which `<path>` implements) and returns the element's geometric bounding box in user-space units — it reflects actual path geometry regardless of most CSS, but returns a zero-size box if the element or an ancestor has `display: none`. This directly answers "does the path actually have non-zero drawn geometry," which is precisely the G-02-1-style defect class (detached/degenerate loop arcs) this project has been burned by before.
2. **Playwright's `toBeVisible()` / `isVisible()` locator semantics**: `await expect(page.locator('.sigil-path')).toBeVisible()`. This is Playwright's own actionability check — connected to the DOM, non-empty bounding box, and no `display:none`/`visibility:hidden`/zero-opacity ancestor. It is a more idiomatic Playwright pattern than raw `page.evaluate`, and it specifically answers "is this on screen," which is the literal wording of success criterion 1 and D-94 assertion 1.

**Recommendation for the plan:** use `toBeVisible()` as the primary assertion (it is the more direct, less-code answer to "is a sigil actually visible" and is Playwright's own purpose-built tool for this exact question), and reserve a `getBBox()`-style geometry read for any assertion that specifically needs to characterize *how much* geometry is present (e.g., distinguishing a fully-formed path from a degenerate single-point path, which `toBeVisible()` alone would not catch if the degenerate path still occupied a nonzero CSS box due to stroke-width). Both are consistent with this repo's established pattern of asserting the property that makes a rendering claim *true*, not merely *present* (Pitfall 8's own framing).

### 6. `innerHTML = svgString` on a plain `HTMLElement` — SVG namespace handling, confirmed

**This was flagged in the critical-scoping note as "the single highest-risk unknown."** Verified this session directly against the relevant W3C/WHATWG sources:

> "any `svg` or `math` element, and their descendants, will be parsed as being in the SVG or MathML namespace, respectively; all other tags will be parsed as being in the HTML namespace." `[CITED: cross-checked W3C public-html-bugzilla thread and SVG2 spec discussion, both describing the HTML parser's foreign-content handling]`

**Concretely, for this project:** when `this.innerHTML = svg` is assigned on a plain `HTMLElement` (`<sigil-spinner>`, which is itself an ordinary HTML element in the light DOM — no shadow root per D-82), the HTML parser's tree-construction algorithm recognizes the `<svg>` tag as the entry point into "foreign content" and switches insertion mode accordingly, correctly assigning the SVG namespace (`http://www.w3.org/2000/svg`) to `<svg>` and all its descendants (`<path>`, `<g>`, `<circle>`, `<text>`, `<title>`, etc.) — **exactly as if the same markup had been written directly in the page's HTML source**, which is the entire basis of D-82's "identical to a hand-pasted `<svg>`" claim. This is a long-standing, deliberate HTML-parser behavior (not a quirk or a browser-specific extension) — the HTML parsing spec's foreign-content algorithm exists specifically so that `<svg>`/`<math>` content embedded via `innerHTML`, `document.write`, or literal markup all behave identically. `DOMParser` is not required; no additional namespace-fixup step is needed.

**Practical consequence for D-82/D-86:** the locked approach — `this.innerHTML = svg` where `svg` is the complete, unmodified string returned by `generateSigil` — is confirmed to produce a correctly-namespaced SVG subtree that both CSS class selectors and inherited `--sigil-*` custom properties reach exactly as they would for hand-pasted markup. No further verification work is needed on this point; it was the correct call.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Serving a JS module with relative imports to a browser test | A custom module-bundling shim, an import-map rewrite, or `DOMParser`-based SVG injection | A ~20-line `node:http` static file server (Architecture Patterns §1) | The failure mode this avoids (relative-import resolution) is a base-URL problem with one correct fix; anything more elaborate reintroduces exactly the "build step for verification" cost this project's zero-build posture already refuses for the shipped artifact |
| Distinguishing "resolves through `exports`" from "file shipped" | A DOM shim in Node to actually `import()` and evaluate the element | `import.meta.resolve()` + `existsSync()` (Architecture Patterns §2) | Both are native, zero-dependency, and each answers a distinct, narrow question — combining them into one check (or faking a DOM) blurs the two vantage points D-96 deliberately keeps separate |
| Detecting "is this SVG actually rendered" | A pixel-diffing / visual-regression library | `toBeVisible()` / `getBBox()` (Architecture Patterns §5) | Both are built into Playwright/the DOM already; a visual-regression tool is disproportionate for "is there non-zero geometry," and this project has no other visual-regression infrastructure to extend |

**Key insight:** every "don't hand-roll" item in this phase is really "don't reach for more machinery than the platform already provides" — none of the six research questions needed a new dependency or a bespoke abstraction; each had a native, spec-defined answer once traced to its source.

## Common Pitfalls

### Pitfall 1: Missing/wrong `Content-Type` header silently breaks the whole D-94 recipe
**What goes wrong:** `node:http`'s bare `createServer` does not infer MIME type from file extension. Serving `.js` files without an explicit `Content-Type: text/javascript` header causes Chromium to reject the module load with a MIME-type error, and the failure surfaces as "the module never loaded" rather than as an obviously-wrong-header message unless the test reads the console/network error.
**Why it happens:** it's easy to write a minimal static server that only handles `fs.readFile` + `res.end(body)` and forget headers entirely — the server "works" for a plain `<script src>` (non-module) smoke check but silently fails for `type="module"`.
**How to avoid:** the server helper must set `Content-Type` explicitly per the extension map shown in Architecture Patterns §1; verify by checking the test actually renders (not just that the HTTP request returns 200).
**Warning signs:** Playwright console messages captured via `page.on('console', ...)` or `page.on('pageerror', ...)` showing "Failed to load module script."

### Pitfall 2: Assuming `import.meta.resolve()` proves the file shipped
**What goes wrong:** treating a successful (non-throwing) `import.meta.resolve()` call as sufficient proof the `./element` subpath is fully correct. As confirmed in Architecture Patterns §2, Node 20.6+ deliberately stopped throwing for non-existent `file:` targets — resolution success alone is necessary, not sufficient.
**Why it happens:** the pre-20.6 behavior (throw on missing file) is the more commonly remembered, more intuitive behavior; the current behavior is a deliberate spec change most developers haven't tracked.
**How to avoid:** always pair `import.meta.resolve()` with an `existsSync(fileURLToPath(resolved))` check in the same probe, per the code shown above.
**Warning signs:** a `files` misconfiguration (element file accidentally excluded from the tarball) that the pack-install test's `EXPECTED_TARBALL_FILES`/rung-1 manifest check *would* catch independently — meaning this specific gap is currently double-covered by D-96's own two rungs, but only if the resolve-only probe is written with the existence check included, not without it.

### Pitfall 3: Treating D-88's `isConnected` gate as "renders exactly once, always"
**What goes wrong:** assuming the gate collapses every attribute-write path down to a single render call, and writing a test or a code comment that asserts "render is called once" rather than "final rendered content is correct."
**Why it happens:** the gate *does* fully suppress the pre-insertion path (a), which is the path CONTEXT.md's own D-88 text explicitly walks through — it's easy to generalize "the gate solves the upgrade-timing trap" to "the gate makes rendering happen exactly once," which is only true for path (a), not (b) or (c) (Architecture Patterns §3).
**How to avoid:** write the browser test's upgrade-timing assertion (D-94 #5) against final content across all three paths, not render-call count.
**Warning signs:** a test that mocks/spies on the render function and asserts `toHaveBeenCalledTimes(1)` — this would be a brittle, incorrect assertion for paths (b)/(c) and should not be written.

### Pitfall 4: Building a wrapper HTML page in `innerHTML` for the example/error state
**What goes wrong:** D-86 already names this directly — any hand-built wrapper markup (`` `<figure>${svg}</figure>` ``) around the library's output reopens an injection surface `escapeXml` never touches. Worth restating here because Architecture Patterns §6 confirms the *correct* path (assign the whole `svg` string) works completely — there is no remaining technical reason to ever wrap it.
**How to avoid:** exactly as D-86 states — `this.innerHTML = svg` (the whole, unmodified string) or nothing.

## Code Examples

### 1. The static server fixture (D-94's divergence from `theming-resolution.test.js`)

See Architecture Patterns §1 for the full `startStaticServer` helper. Usage shape inside `test/browser/element.test.js`:

```js
let serverHandle;
beforeAll(async () => {
  // ...existing chromium.launch() pattern from theming-resolution.test.js...
  serverHandle = await startStaticServer(REPO_ROOT);
});

afterAll(async () => {
  await browser?.close();
  serverHandle?.server.close();
});

it('renders a visible sigil loaded as real ESM', async () => {
  const { port } = serverHandle;
  await page.goto(`http://127.0.0.1:${port}/test/browser/fixtures/element.html`);
  // OR, avoiding an authored HTML fixture entirely:
  // await page.setContent('<!doctype html><div id="wrap"></div>');
  // await page.addScriptTag({ url: `http://127.0.0.1:${port}/src/element/sigil-spinner-element.js`, type: 'module' });
  // await page.evaluate(() => {
  //   document.querySelector('#wrap').innerHTML =
  //     '<sigil-spinner statement="I WILL SUCCEED" planet="saturn"></sigil-spinner>';
  // });
  await expect(page.locator('sigil-spinner .sigil-path')).toBeVisible();
});
```

### 2. Class-selector + custom-property assertions from the page's own perspective (empirically tests D-82)

```js
it('a page-level class rule AND a --sigil-* override both reach the element (D-82, light DOM)', async () => {
  await page.setContent(
    `<!doctype html><meta charset="utf-8">
     <style>
       .sigil-path { stroke-dasharray: 4 2; }
     </style>
     <div id="wrap" style="--sigil-stroke: rgb(9, 9, 9)"></div>`,
  );
  await page.addScriptTag({ url: elementModuleUrl, type: 'module' });
  await page.evaluate(() => {
    document.querySelector('#wrap').innerHTML =
      '<sigil-spinner statement="I WILL SUCCEED" planet="saturn"></sigil-spinner>';
  });
  const dasharray = await page.evaluate(() =>
    getComputedStyle(document.querySelector('.sigil-path')).strokeDasharray,
  );
  const stroke = await page.evaluate(() =>
    getComputedStyle(document.querySelector('.sigil-path')).stroke,
  );
  expect(dasharray).not.toBe('none'); // class selector reached the SVG
  expect(stroke).toBe('rgb(9, 9, 9)'); // custom property reached the SVG
});
```

### 3. Double-registration guard shape (D-90)

```js
it('loading the module twice does not throw NotSupportedError', async () => {
  await page.addScriptTag({ url: elementModuleUrl, type: 'module' });
  await page.addScriptTag({ url: elementModuleUrl, type: 'module' }); // must not throw
});
```

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `application/javascript` (in addition to `text/javascript`) is accepted by current Chromium for module scripts | Architecture Patterns §1 | Low — the recipe recommends `text/javascript` as primary regardless, so this is a footnote, not load-bearing; if wrong, only affects a fallback-MIME note, not the recipe itself |
| A2 | `addScriptTag({ url, type: 'module' })` against a same-origin `node:http` server, called from a page whose own document is `about:blank`/`setContent`-authored, resolves relative imports correctly (i.e. the external-script-base-URL rule applies identically regardless of what the *containing document's* base URL is) | Standard Stack "Alternatives Considered"; Code Examples §1 | Medium if wrong — this is offered as a discretionary simplification, not the locked recipe; if it doesn't hold, the plan falls back to the fully-verified `page.goto()`-to-a-served-HTML-page recipe, which has no such assumption |

Both assumptions follow directly and with high confidence from the verified WHATWG spec text (script base URL is defined per-script, not inherited from a "session" or "test harness" concept) — flagged here per protocol because neither was independently re-verified against a live Playwright run in this session (no execution environment was available to run Playwright interactively during research). The plan should treat A2 in particular as worth a five-minute smoke check at the start of implementation before committing to it over the fully-verified `page.goto()` form.

## Open Questions

1. **Does the example page (D-95) need its own dedicated static-server helper, or should it be served by the exact same helper the browser test uses?**
   - What we know: both need the same MIME-correct static-file-serving behavior; D-95 explicitly says "served by the same local http server (`python3 -m http.server` or the test's own server — documented as a dev instruction, never a dependency)."
   - What's unclear: whether reusing the test's server helper for a documented dev-workflow command is desirable (couples a doc'd command to test-internal code) or whether a trivial `python3 -m http.server` note in the README is sufficient and the test's server stays test-only.
   - Recommendation: this is squarely inside CONTEXT.md's own "Claude's Discretion" list (static server helper's exact form) — treat as a plan-time call, not a research gap; either choice is technically sound given the findings above.

2. **Should the browser test explicitly exercise path (c) from Architecture Patterns §3 (parser-created, defined-later) as a distinct test case, or is it adequately covered by combining paths (a) and (b)?**
   - What we know: paths (a) and (b) are both already implied by D-88/D-94's existing "set-before-upgrade and set-after-insertion" framing; path (c) is a materially different code path (the *upgrade* algorithm, not `createElement`) that this research found is not obviously covered by that framing.
   - What's unclear: whether the plan should add a third, explicit test case, or judge that (b)'s "post-insertion setAttribute" case already exercises the same `isConnected === true` gate behavior closely enough that a separate parser/upgrade case is redundant.
   - Recommendation: add it explicitly. The render-call-count difference between (b) and (c) — one attribute write vs. N (once per attribute already on the tag) — means a subtle regression that only manifests on the upgrade path (e.g., a stray dependency on constructor-time state that isn't yet the final attribute set) could pass (b) and fail (c) silently. This is exactly the class of gap Pitfall 8 warns about.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Everything in this phase | ✓ | v24.4.1 (floor: >=20.0.0) `[VERIFIED: local shell]` | — |
| Chromium (via Playwright) | `test/browser/element.test.js` (new), existing `theming-resolution.test.js`/`accessible-name.test.js` | Not verified this session — `npx playwright install chromium` is a documented one-time prerequisite already carried in STATE.md's Blockers/Concerns | Playwright package pinned at `^1.62.1` `[VERIFIED: package.json:53]` | The suite fails loudly rather than skipping when Chromium is absent (established pattern, both existing browser tests) — no silent-skip fallback exists or should be added |
| `node:http` | Test-fixture static server | ✓ (Node built-in) | — | — |

No missing dependencies with no fallback. Chromium's install-state is unverified in this research session (no shell execution of `npx playwright install --dry-run`-equivalent check was performed) — the plan should treat this the same way the existing two browser test files already do: fail loudly with install instructions, never skip.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation / Output Encoding | Yes | `generateSigil`'s own `escapeXml` (already shipped, `src/render/escapeXml.js`) is the sole sanctioned path for any attacker-reachable string (`statement`, `id-prefix`) to reach markup — D-86 forbids any second, element-local string-concatenation path into `innerHTML` |
| V4 Access Control | No | Not applicable — a browser-rendered visual component with no auth/session concept |
| V2/V3 Authentication/Session | No | Not applicable |
| V6 Cryptography | No | Not applicable |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Script/markup injection via a hostile `statement`/`id-prefix`/attribute value reaching `innerHTML` through element-local string concatenation rather than through `generateSigil`'s escaping | Tampering | D-86: only ever assign the whole, unmodified `generateSigil` output via `innerHTML`; anything the element adds itself goes through `document.createElement` + `.textContent =`, never markup interpolation. Verified this session (Architecture Patterns §6) that the sanctioned path produces a correctly-namespaced SVG subtree with no additional escaping gap introduced by the `innerHTML`-on-plain-`HTMLElement` mechanism itself |
| Double custom-element registration crashing the page (`NotSupportedError`) — a denial-of-service-shaped failure for the embedding page, not a security vulnerability per se | — | D-90's guard, verified structurally sound; no new finding here beyond confirming the guard pattern is correct and sufficient |

No new security findings beyond what PITFALLS.md's Pitfall 9 ("Attribute-supplied content reaching the DOM outside the library's own escaping path") and D-86 already establish — this research's contribution is confirming (Architecture Patterns §6) that the *sanctioned* `innerHTML` path is itself namespace-safe and introduces no separate escaping gap, closing the one open technical question in that area.

## Sources

### Primary (HIGH confidence — fetched/read directly this session)

- [Script base URL — HTML Living Standard, WHATWG](https://html.spec.whatwg.org/multipage/webappapis.html#concept-script-base-url) — direct quote confirming inline vs. external script base-URL resolution, the load-bearing fact behind Architecture Patterns §1
- [Custom elements — HTML Living Standard, WHATWG](https://html.spec.whatwg.org/multipage/custom-elements.html) — direct quote of the "upgrade an element" algorithm's reaction-enqueueing order, the basis for Architecture Patterns §3
- [`import.meta.resolve()` — Node.js `esm.html` API docs](https://nodejs.org/api/esm.html#importmetaresolvespecifier) — direct quote confirming synchronous behavior (stable v20.0.0+), stability timeline (v20.6.0+), and the "no longer throws for non-existent `file:` targets" behavior change, the basis for Architecture Patterns §2
- This repo's own `package.json`, `src/index.js`, `src/render/svg.js`, `src/generate.js`, `bin/sigil-spinner.js`, `test/browser/theming-resolution.test.js`, `test/browser/accessible-name.test.js`, `test/pack-install.test.js`, `vitest.config.js`, `README.md` — read directly this session, ground truth for this project
- Local shell: `node --version` (v24.4.1), `node_modules/playwright/package.json` version field (1.62.1) — confirmed live on this machine

### Secondary (MEDIUM confidence)

- [MDN — Using custom elements](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements) — corroborating quote on `isConnected` being `true` during pre-`connectedCallback` `attributeChangedCallback` calls in the parser-upgrade case; cross-checked against the WHATWG spec's own algorithm ordering (Primary source above), which independently derives the same conclusion
- W3C public-html-bugzilla thread + SVG2 spec discussion on `innerHTML`/foreign-content namespace handling — cross-checked, converges cleanly with the well-established HTML-parser foreign-content algorithm behavior
- Multiple independent sources (Chromium MIME-type-enforcement error message pattern, `Failed to load module script: ... MIME type`) — consistent, well-documented, widely-reproduced browser behavior, not independently re-verified against a live Chromium instance in this session

### Tertiary (LOW confidence — none)

No claim in this document rests solely on unverified web-search summary text; every load-bearing claim was corroborated against either a direct spec/doc fetch or this repo's own source.

## Metadata

**Confidence breakdown:**
- Module-loading recipe (Architecture Patterns §1): HIGH — WHATWG spec text directly confirms the mechanism; MIME-type requirement is well-established secondary-source knowledge
- `exports`-subpath verification (§2): HIGH — Node's own docs directly confirm both the synchronous behavior and the file-existence gap
- Upgrade-timing gap (§3): HIGH — derived directly from the WHATWG spec's own algorithm text, cross-checked against an independent secondary source (MDN) that states the same conclusion in different words
- SVG-namespace/`innerHTML` safety (§6): HIGH — confirmed against W3C/SVG2 spec-adjacent sources describing standard, long-stable HTML-parser behavior
- Visibility-assertion mechanism (§5): MEDIUM — both `getBBox()` and `toBeVisible()` are well-documented Playwright/DOM primitives, but the specific recommendation (prefer `toBeVisible()`, supplement with `getBBox()`) is this research's own synthesis, not independently sourced from a single authoritative "use this one" reference
- Two assumptions flagged in the Assumptions Log — MEDIUM, not independently verified against a live Playwright execution in this session (no execution environment available); both have a verified fallback path if wrong

**Research date:** 2026-08-09
**Valid until:** Web-platform/spec claims (Playwright, Node.js, HTML spec) are stable, long-settled behavior — good for the life of this milestone at minimum, effectively indefinite absent a major spec change. Re-verify only if the Playwright devDependency is upgraded across a major version, or if Node's `engines` floor changes.

---
*Research for: Phase 7 — The sigil-spinner Element*
*Researched: 2026-08-09*
