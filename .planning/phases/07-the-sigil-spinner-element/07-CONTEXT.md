# Phase 7: The sigil-spinner Element - Context

**Gathered:** 2026-08-09
**Status:** Ready for planning
**Mode:** `--auto` — every gray area below was auto-resolved to the recommended option. With one exception noted immediately below, **no decision here was confirmed by Matt in conversation.**

**The three `one-way` decisions WERE confirmed by Matt, 2026-08-09, before execution began.** Asked directly at the pre-execution gate, Matt selected the recommended option for each:

| Decision | Confirmed as | Alternatives declined |
|---|---|---|
| **D-80** | `show-title` | `embed-title`, `sigil-title` |
| **D-82** | Light DOM locked — no shadow root, permanently | "reconsider before locking" |
| **D-84** | `exports` shipped as specified, including `./package.json` | dropping the `./package.json` entry |

These three carry the published-contract risk, which is why they were surfaced first. The remaining 17 decisions remain auto-resolved and unconfirmed; the `checkpoint:decision` gates in the plans stand as written.

<domain>
## Phase Boundary

Matt can drop `<sigil-spinner statement="..." planet="...">` into a hand-authored page and get a sigil his own CSS fully controls — no build step, no runtime dependencies, no shadow root. Three requirements:

- **WRAP-01** — the custom element renders a sigil in the browser, loaded as plain ESM
- **WRAP-02** — light DOM, so page CSS reaches it through both `--sigil-*` custom properties **and** semantic class selectors, with identical theming reach to a hand-pasted `<svg>`
- **WRAP-03** — attribute changes after insertion re-render correctly; several elements on one page render independently with no id collisions

**The load-bearing verification constraint, restated because it is the reason this phase can fail while green:** both real v1.0 defects (G-02-1 detached loop arcs, G-03-1 the `font-size` `var()` fallback) passed a fully green 1,453-test suite and were caught by a human looking at rendered output. An element whose tests assert only "registers and reflects attributes" would pass while rendering nothing visible. Success criterion 1 is a browser-rendering check and a human look, not a green test.

**Not in this phase:**

- The Claude Code skill and its correspondences (Phase 8 — zero file overlap with this phase by design)
- Any change to sigil construction, rendering, the JSON working's field set, or the `--sigil-*` surface. The element generates nothing new; it calls `generateSigil` and injects the result
- Publishing `1.1.0` to the registry (see D-98)
- A bundled single-file browser artifact (PKG-06, deferred out of v1.1 in REQUIREMENTS.md)

</domain>

<decisions>
## Implementation Decisions

Nine gray areas, all auto-resolved. Decision IDs continue from Phase 6's D-78.

### Attribute contract

- **D-79: Attributes are the CLI's flag names with the leading `--` dropped, kebab-case preserved.** The full set is `statement`, `planet`, `curve`, `glyph`, `id-prefix`, plus the title attribute named in D-80. This is already the least-surprising mapping available: HTML custom-element convention is kebab-case, and the CLI is *already* kebab-case (`--id-prefix`), so anyone who knows one surface knows the other. The element maps `id-prefix` → `options.idPrefix` at the call boundary; the library's camelCase names are never exposed as attributes. `--json` and `--output` have no element analog (they are CLI transport concerns, not rendering options) and are deliberately absent. — **Reversibility:** one-way per attribute once published — a shipped custom-element attribute name is a public contract; renaming it breaks every page that used it.

- **D-80: The title toggle is the `show-title` attribute, not `title`.** `title` is a global HTML attribute on every element that renders a browser tooltip, and it means something entirely different from `options.title` (embed the XML-escaped statement in the SVG's `<title>` element, per D-16). Leaving them to collide means a consumer who sets `title="My sigil"` expecting a tooltip silently triggers sigil-specific behavior, or the reverse. Rejected: `embed-title` — accurate to the library's own verb (`svg.js:602` says "embed the … statement in a `<title>` element") but less idiomatic as an HTML boolean toggle. Rejected: `sigil-title` — redundant prefixing on an element already named `sigil-spinner`, and it reads like it takes a string value rather than being a flag. **This is the one place the drop-the-dashes rule of D-79 has an exception, and the README must say so in as many words.** — **Reversibility:** one-way — this is the open decision REQUIREMENTS.md and ROADMAP.md both assign to this phase precisely because renaming a shipped custom-element attribute is a breaking change.

- **D-81: Boolean attributes use HTML presence semantics, not value semantics.** `curve` and `glyph` (and `show-title`) are true when the attribute is present, regardless of its value, exactly like `disabled` and `hidden`. `<sigil-spinner curve>` and `<sigil-spinner curve="">` both enable curves. **The footgun this creates is real and must be documented explicitly rather than smoothed over: `curve="false"` also enables curves — the way to turn it off is to remove the attribute.** Rejected: value-based parsing where the literal string `"false"` means false — it is friendlier in the one case someone writes it, and it diverges from every boolean attribute the platform ships, which costs more the other 99% of the time. Pin the presence semantics in a browser test so the choice is enforced rather than merely stated.

### The light-DOM lock

- **D-82: `<sigil-spinner>` attaches no shadow root. Ever.** The element writes the generated SVG string directly into its own children. This is the formal lock ROADMAP.md and REQUIREMENTS.md both assign to this phase. The reasoning, stated once so it is not relitigated: this project's entire theming surface is *both* mechanisms together — 15 `--sigil-*` custom properties **and** seven semantic classes (`.sigil-path`, `.sigil-grid`, `.sigil-node`, `.sigil-loop`, `.sigil-start`, `.sigil-end`, `.sigil-glyph`). Custom properties pierce a shadow boundary by inheritance; **class-selector rules from the outer document do not.** A shadow root would silently break roughly half the documented theming surface for anyone who reached for the element instead of pasting raw SVG — meaning the same statement and planet would produce a *less themeable* result depending on which of two equally-documented embedding paths a consumer chose. That is not an edge case; it is the default way classes get used. Accepted, symmetric cost: no encapsulation. A careless global `path { stroke: red }` on the host page can break a `<sigil-spinner>` exactly as it can break a hand-pasted `<svg>` today. That exposure is the value proposition, not a new risk. — **Reversibility:** one-way — reversing it after publish is a breaking change to the element's theming contract; every page styling by class silently loses its styling.

### Module placement, `exports`, and what ships

- **D-83: The element lives at `src/element/sigil-spinner-element.js`.** A new leaf directory under `src/`, which the existing `files: ["src", "bin", "README.md"]` already covers with no `package.json` `files` edit. This file is the **one place in the tree allowed to reference `HTMLElement` and `customElements`** — the inverse of every other module's constraint. Note the asymmetry precisely: `src/index.js` is *universal* (runs unmodified in Node and the browser); `src/element/sigil-spinner-element.js` is *browser-only*, because those two globals do not exist in Node. That is the correct and expected shape for a custom-element wrapper, and it is why the element's tests belong in `test/browser/`, never in a plain Vitest `test/` file.

- **D-84: The `exports` map gains two new entries — `"./element"` and `"./package.json"`.** Final shape: `{ ".": "./src/index.js", "./element": "./src/element/sigil-spinner-element.js", "./package.json": "./package.json" }`. Four deliberate non-choices inside that: **no `browser` condition on `.`** (there is no divergence to encode — a condition pointing at the same file reads as "there must be a difference" to a future maintainer who then goes looking for one); **no `browser` condition on `./element` and no `node` condition excluding it** (conditions exist to pick between *interchangeable* implementations, and there is no Node-compatible alternative custom element to fall back to — the correct signal is documentation, per D-97); **no wildcard `"./*"`** (it would silently promote every internal module to public API, destroying the single-entry-point discipline `src/index.js`'s own header states); **`main` and `bin` untouched.** The `./package.json` entry is conventional and cheap — a populated `exports` map otherwise blocks *all* unlisted subpaths, `package.json` included, which breaks tooling that reasonably expects to read a package's own manifest. — **Reversibility:** one-way once published — removing or repointing a published `exports` subpath breaks every consumer importing it.

- **D-85: The element imports only from the package's public surface — `import { generateSigil } from '../index.js'`.** Same "thin wrapper over a stable library API" rule that `bin/sigil-spinner.js` already follows, and that `src/index.js`'s own header comment states as a rule. This is not stylistic: an element reaching into an internal module works fine in-repo (relative paths inside `src/` never go through `exports` resolution) and throws `ERR_PACKAGE_PATH_NOT_EXPORTED` for any external consumer. Importing only the public surface means the element never needs a second `exports` subpath and can never develop this fault.

- **D-86: No string concatenation into `innerHTML`, ever — the element assigns the entire, unmodified `generateSigil` output or it assigns nothing.** Anything the element adds on its own (it should add nothing, but this binds the rule if it ever does) goes through `document.createElement` + `.textContent =`. Attribute values are attacker-reachable strings, and the library's `escapeXml` only protects what passes through `generateSigil`; a hand-built `` `<figure><figcaption>${title}</figcaption>${svg}</figure>` `` wrapper would be a **second injection surface the library's escaping never touches**. Warning sign for review, stated so it is greppable: any `.innerHTML =` in the element source whose right-hand side is not exactly the whole `svg` string.

### Lifecycle and re-render

- **D-87: `observedAttributes` is the full attribute set from D-79 and D-80** — `['statement', 'planet', 'curve', 'glyph', 'id-prefix', 'show-title']`. Every attribute that changes the output is observed; nothing else is.

- **D-88: Render happens in `connectedCallback`, and in `attributeChangedCallback` only when `this.isConnected`.** This is the fix for the upgrade-timing trap, which is not hypothetical: `document.createElement('sigil-spinner')` upgrades immediately if the element is already defined, so `setAttribute` calls made *before* `appendChild` fire `attributeChangedCallback` **before** `connectedCallback`. Ungated, that renders a half-configured sigil and then renders again. Gated, the pre-insertion attribute writes are absorbed and the first render is the correct one. **Set-before-upgrade and set-after-insertion must produce the same final render, and that equivalence gets a browser test** — it is exactly the "looks wired in a code read, invisibly broken at render" class the v1.0 lesson names.

- **D-89: Re-render is a synchronous, whole-content replacement — no diffing, no batching, no microtask coalescing.** `generateSigil` is pure, synchronous, and fast, and the output is a single self-contained SVG string; a diff would be machinery serving nothing. Cost accepted knowingly: setting three attributes in a row renders three times. Deferred, not refused — see Deferred Ideas.

- **D-90: The `define()` call is guarded — `if (!customElements.get('sigil-spinner')) customElements.define(...)`.** `customElements.define` throws `NotSupportedError` if the tag name **or that exact constructor** is already registered, and the platform ships **no unregister or redefine API** — so an unguarded double-registration is unrecoverable within the page. The situations that trigger it are this project's actual usage, not exotic: Claude Code assembling a generated page that includes the module's `<script>` twice, a dev-server hot reload while Matt iterates on a site, or a page that pulls the module both directly and through something that also inlines it. One line, zero dependencies. **Structural test, not code review** — load the module twice in one browser page and assert no throw.

### Failure behavior

- **D-91: A missing `statement` or `planet` renders nothing and throws nothing.** The element sits inert and empty until both required attributes are present. An element mid-construction — created, one attribute set, not yet the other — is a normal transient state, not an error, and throwing from a lifecycle callback in that window would be noise the page author cannot act on.

- **D-92: A thrown `SigilError` clears the element's content, logs the error to `console.error`, and reflects `data-sigil-error="<code>"` on the host.** So an unknown planet or an empty derived sequence is visible three ways: nothing rendered (the page author sees a gap), a real error object in the console with the library's `.code` and `.details` intact (a human debugging gets the actual diagnostic), and an observable DOM signal a test or a page's own CSS can select on. The attribute is removed on the next successful render. The element never swallows the error silently and never renders a placeholder graphic — it has no visual vocabulary of its own, and inventing one here would be a second rendering path to maintain.

### Multi-instance and the id policy

- **D-93: The element synthesizes nothing — no derived `id-prefix`, no hash, no counter.** WRAP-03's "no id collisions" is satisfied *by construction*, not by machinery: the default artifact emits zero `id` attributes at all (D-44's id-free-by-construction discipline, validated in Phase 3 across 26 co-embedded sigils). Rejected: mirroring the host element's own `id` into `idPrefix` — it is genuinely unique by HTML rules and superficially elegant, but it makes the element's output *differ* from the raw-SVG path for identical inputs, which is precisely the two-incompatible-embedding-models outcome D-82 exists to prevent. Rejected: a derived hash of `(statement, planet, options)` — Pitfall 9 from v1.0 recommended it and D-44 refused it for a reason that still holds: under this project's determinism guarantee, two identical sigils on one page get *identical* ids, which is the collision it claims to fix. Supplying the same `id-prefix` to two elements remains the caller's documented responsibility, identically to the raw-SVG path. The browser test asserts zero `id` attributes across several co-rendered elements plus independent re-render.

### Verification surface

- **D-94: The element's browser test is `test/browser/element.test.js`, and it loads the real module over a local static server built on Node's own built-in HTTP module.** That server is a `node:http` fixture inside the test file. Following `test/browser/theming-resolution.test.js` as the pattern (Playwright + Chromium, fail loudly rather than skip when the browser is absent) — but with one necessary divergence: that test injects an SVG *string* via `page.setContent` and never loads a module, while this one must load real ESM whose relative imports resolve. `page.setContent` on `about:blank` and `addScriptTag({path})` both break those relative imports; a `file://` page has them blocked outright. A ~20-line `node:http` static server in the fixture is the honest fix, costs no dependency (`node:http` in a test file is already normal here — `test/pack-install.test.js` uses `node:fs`/`node:os`/`node:child_process`), and doubles as the way to serve D-95's example page for the human look. The assertions this file owes, each one a *rendering* claim rather than a wiring claim:
  1. a sigil is actually **visible** — a rendered `.sigil-path` with non-zero geometry, not merely an `<svg>` in the DOM (success criterion 1's automated half; the human look is the other half and does not substitute for it)
  2. a page-level `--sigil-*` override on the host changes **computed** style on the SVG's descendants (the G-03-1 defect class, now one DOM layer deeper)
  3. a page-level **class selector** (`.sigil-path { … }`) actually matches and applies — the empirical test of D-82, rather than trusting the implementation choice
  4. double-registration does not throw (D-90)
  5. set-before-upgrade and set-after-insertion produce the same final render (D-88)
  6. attribute mutation re-renders (WRAP-03); several elements co-render independently with zero `id` attributes (D-93)
  7. `curve="false"` enables curves (D-81's documented footgun, pinned)

- **D-95: A human-facing example page lives at `examples/element.html`, repo-only — not added to `files`, not shipped in the tarball.** This is the artifact success criterion 1's human check is performed against, and the reason it is a file rather than an ad-hoc page is that the v1.0 lesson is about *repeating* the look, not performing it once. It carries: several sigils across different planets, both theming mechanisms exercised side by side (custom-property overrides **and** class selectors, visibly distinguishable), the grid layer revealed, a glyph example, and a live control that mutates an attribute after load. Served by the same local http server (`python3 -m http.server` or the test's own server — documented as a dev instruction, never a dependency). Keeping it out of `files` keeps the tarball surface exactly as Phase 6 froze it.

- **D-96: `test/pack-install.test.js` gains one `ENTRY_POINTS` row for `./element`, and that row is resolve-only.** This is D-72 working as designed — a new subpath is a new row, not a control-flow rewrite — with one necessary refinement the existing row shape does not anticipate: **the current probe `import`s the specifier and Node cannot evaluate the element module** (`class extends HTMLElement` dereferences an undefined global at class-definition time, so the probe would `ReferenceError` on a *correctly published* package). So the row carries a discriminator — resolve the specifier through `exports` and confirm the resolved file actually exists in the installed tree, without evaluating it. That proves exactly what this test exists to prove from its unique vantage point: the subpath resolves through `exports` (catching `ERR_PACKAGE_PATH_NOT_EXPORTED`) and the file genuinely shipped (catching a `files` omission). Evaluation and registration are the browser test's job (D-94) — two vantage points, cleanly separated, and **no DOM shim in Node**. `EXPECTED_TARBALL_FILES` also gains `src/element/sigil-spinner-element.js`; `ALLOWED_TARBALL_ROOTS` already covers it via the `src/` prefix and needs no edit.

- **D-97: The README gains an element section, bound to the code by a mechanical drift guard.** The section documents: the `<script type="module">` load, the full attribute table, the D-80 exception and the D-81 presence-semantics footgun stated explicitly, the light-DOM contract from D-82 (both theming mechanisms reach it, and page CSS can break it — symmetric with raw SVG), the "`./element` requires a DOM; import `.` directly for Node/server use" note that D-84 deliberately does not encode in `exports` conditions, and the client-JS-required framing (anyone needing a no-JS or SSR guarantee should call `generateSigil` at build time and paste the static SVG — which is what the library already is). The guard asserts the README's documented attribute set matches the element's `observedAttributes` exactly, in both directions. Same instrument and same reason as D-55 (exit map keyed from imported constants), D-61 (kamea key parity), D-65 (README specifier ↔ `package.json` name), and MAINT-01's citation checker: **the mistake fails on whoever introduces it rather than surfacing in a consumer's copy-paste.** Any new citation the element source carries must satisfy `test/citations.test.js`.

### The publish boundary

- **D-98: Phase 7 does not publish, and `version` stays `1.0.0` in the tree.** The phase's five success criteria are all about the element working, theming, re-rendering, co-rendering, and shipping no build output — none require a registry write, and "Reuses: Phase 6's repeatable smoke test, extended to verify the new `./element` subpath resolves from an **installed tarball**" is satisfied by D-96's local pack-and-install, not by a publish. Bumping `version` without publishing is worse than leaving it: it opens a window where the tree claims a version the registry does not have, for no gain. D-62 already predicted the eventual number (`./element` is additive, therefore `1.1.0`) — that bump belongs to whatever act publishes it. **Flagged rather than buried:** this means that at Phase 7's close, `npm install @falkensmage/sigil-spinner` still resolves to `1.0.0` and gets no element. Publishing `1.1.0` via the proven release workflow is a named milestone-close action (see Deferred Ideas), and if Matt wants it inside Phase 7 instead, that is a scope call to make at plan time — not a discovery to make afterward.

### Claude's Discretion

Everything not locked above. Specifically:

- **Plan decomposition and commit granularity.** The dependency shape is narrow — the element file and its browser test can land before the `package.json` `exports` edit and the pack-install row — but how that splits across plans is a planning call.
- **The element class's internal shape** — whether option assembly is a small pure helper or inline in the render method; whether the `data-sigil-error` write goes through a tiny private method. No contract depends on it.
- **The static server helper's exact form** — inline in `test/browser/element.test.js` versus a shared fixture module, and the port strategy (ephemeral port via `server.listen(0)` is the obvious choice, but it is not a locked one).
- **The example page's visual arrangement** — how many sigils, which planets, layout. The requirement is that both theming mechanisms are visibly distinguishable and that a live attribute mutation is exercisable; the composition is open.
- **Whether the README drift guard lives in `test/package-identity.test.js` or its own file.** Either satisfies D-97; the existing file is already the README-binding guard, which argues for it, but a separate file keeps the two assertions independently readable.
- **Whether the browser test's visibility assertion (D-94 #1) uses a geometry read, a bounding-box check, or a computed-style read.** The constraint is that it must distinguish "an `<svg>` is in the DOM" from "a sigil is on screen" — the mechanism is open.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and requirements

- `.planning/ROADMAP.md` § Phase 7: The sigil-spinner Element (lines 134-152) — goal, the five success criteria, the verification lesson marked load-bearing, the two open decisions this phase owns, the constraints (light DOM, zero dependencies, no build step), and the "Reuses Phase 6's smoke test" line
- `.planning/ROADMAP.md` § Milestone-Wide Constraints (lines 195-203) — zero runtime dependencies with Lit/Stencil named as refusals, no build step, byte-determinism, light DOM. No phase may violate these
- `.planning/REQUIREMENTS.md` — WRAP-01, WRAP-02, WRAP-03 verbatim (lines 29-31); § Out of Scope (lines 58-66) names shadow DOM and any runtime dependency as refusals with reasons; § Open Decisions for Discuss-Phase (lines 68-77) assigns the title-attribute name and the light-DOM lock to this phase; § Deferred (line 56) records PKG-06, the bundled artifact, as out of v1.1
- `.planning/PROJECT.md` § Key Decisions (lines 137-158) — the 20 dispositioned v1.0 decisions the element inherits, especially D-44 (caller-supplied ids, no derived hash) and the `font-size` `var()` entry that is the anchor example for D-94

### The element's design — load-bearing research

- `.planning/research/FEATURES.md` § The Shadow DOM Decision (lines 57-72) — the full light-DOM argument behind D-82, including the enumeration of both theming mechanisms and the accepted cost
- `.planning/research/FEATURES.md` (line 42) — the kebab-case attribute convention behind D-79 and the `title` collision that D-80 resolves
- `.planning/research/FEATURES.md` (line 53) — why a bundler is not needed: the element's dependency surface is identical to the library's
- `.planning/research/ARCHITECTURE.md` § (a) Where the Web Component Lives (lines 37-81) — the browser-safety audit, the `src/element/` placement behind D-83, the universal-vs-browser-only asymmetry, and the reassessment that no build step is required
- `.planning/research/ARCHITECTURE.md` § (b) `exports` Map Design (lines 82-109) — the exact map shape D-84 locks and the reasoning for each of its four non-choices
- `.planning/research/PITFALLS.md` § Pitfall 6 (lines 108-121) — `NotSupportedError` on re-registration, no unregister API, the guard behind D-90
- `.planning/research/PITFALLS.md` § Pitfall 7 (lines 123-141) — shadow DOM silently breaking half the embedding value proposition; the counter-argument D-82 answers
- `.planning/research/PITFALLS.md` § Pitfall 8 (lines 143-159) — the v1.0 verification lesson generalized to this element, and the four concrete browser assertions D-94 adopts
- `.planning/research/PITFALLS.md` § Pitfall 9 (lines 162-176) — attribute-supplied content reaching the DOM outside the library's escaping path; the rule D-86 binds
- `.planning/research/PITFALLS.md` § Pitfall 4 (lines 73-91) — why `files`/`exports` faults are invisible to the in-repo suite and visible only from a tarball install; the reason D-96's row exists
- `.planning/research/STACK.md` § (c) Web components with zero runtime dependencies, no build step (lines 103-138) — the committed "plain ESM, no build step, no library" answer and the CDN full-file-tree mechanism
- `.planning/research/STACK.md` § What NOT to Use (lines 214-225) — Lit/Stencil/FAST as constraint violations

### Prior phase decisions this phase builds on

- `.planning/phases/06-published-package/06-CONTEXT.md` — D-62 (the `1.1.0` prediction behind D-98), D-72 (`ENTRY_POINTS` as data — the contract D-96 extends), D-77 (the release workflow's gate order, relevant if the publish moves in-scope), and its Deferred Ideas entry naming `./element` as Phase 7's to own
- `.planning/phases/05-publish-ready-source/05-CONTEXT.md` — D-57–D-61, and the `--title`/`aria-labelledby` wiring the `show-title` attribute reaches

### Contract surfaces this phase touches

- `package.json` (lines 6-15) — `main`, `exports`, `bin`, `files`. D-84 edits `exports` additively; `files` needs no change because `src` already covers `src/element/`. This is the milestone's only file shared with Phase 6, and the overlap is different keys
- `src/index.js:1-21` — the entire public surface, with the header comment stating the rule D-85 follows
- `src/render/svg.js:596-686` — the option JSDoc (`title` embeds the escaped statement per D-16), the id/`aria-labelledby` derivation, and the seven semantic class names D-82's argument rests on
- `bin/sigil-spinner.js:115-180` — the CLI flag names D-79 mirrors (`--planet`, `--curve`, `--glyph`, `--id-prefix`, `--title`) and the library-owns-validation posture the element must also follow
- `src/generate.js:68-77` — `KNOWN_OPTIONS`, the four options the element maps attributes onto, and the forward-compatible unknown-key behavior
- `test/browser/theming-resolution.test.js` — the Playwright pattern D-94 extends, including the fail-loudly-when-chromium-is-absent convention
- `test/pack-install.test.js:37-75, 165-198` — `ENTRY_POINTS`, `EXPECTED_TARBALL_FILES`, `ALLOWED_TARBALL_ROOTS`, and the probe loop D-96 must extend rather than rewrite
- `README.md` § CSS Custom Properties (lines 163-222) — the 15-property table and the class mapping the element must preserve reach to; also the drift-guard precedent
- `.planning/STATE.md` § Blockers/Concerns (lines 134-144) — the chromium prerequisite and the carried "structural tests verify wiring, not appearance" note

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`test/browser/theming-resolution.test.js`** — the only test in the suite that renders. Establishes Playwright/Chromium usage, the 120s `beforeAll` launch budget, the explicit fail-with-install-instructions error rather than a skip, and the `computed()` helper shape (set content → query selector → read `getComputedStyle`). D-94 reuses all of it and adds a module-loading server, which that file does not need.
- **`test/browser/accessible-name.test.js`** — a second browser test already exists, so the directory is an established home rather than a new convention.
- **`test/pack-install.test.js`** — D-72's `ENTRY_POINTS` table with an in-file comment already reserving the Phase 7 row (`test/pack-install.test.js:54-55`). The extension point was built for this.
- **`test/package-identity.test.js`** and **`test/citations.test.js`** — the two existing mechanical drift guards. D-97's attribute-table guard is the same instrument in the same idiom.
- **`escapeXml` (`src/render/escapeXml.js`)** — already applied to every attacker-reachable string that reaches SVG markup. The element inherits this protection **only** for content passing through `generateSigil`, which is exactly why D-86 exists.

### Established Patterns

- **`dependencies: {}` is load-bearing and milestone-wide.** Lit, Stencil, FAST, `@lion/*` are named refusals by the same rule that already refused `svg.js` and `d3-shape`.
- **No `node:` imports in `src/`, ever.** Confirmed exhaustively by research: `src/` is browser-safe today, all Node imports live in `bin/` (and in `test/`). The element is in `src/`, so this binds it. `node:http` in the *test* is fine and consistent with `test/pack-install.test.js`.
- **The suite fails loudly rather than skipping** when a prerequisite is missing. The element's browser test must follow this, not silently opt out when chromium is absent.
- **Guards are keyed, not transcribed.** D-55 keys the CLI exit map from imported constants; D-61 asserts key parity between two maps; D-65 binds README to `package.json`. D-97 continues it — derive the assertion from `observedAttributes`, do not restate the list.
- **Options are validated by the library, never by the surface.** `bin/sigil-spinner.js:157-159` states it explicitly: a missing `--id-prefix` is a valid runtime state guarded by `generateSigil`'s own `E_INVALID_OPTION`, not by the CLI. The element takes the same posture — it maps attributes and lets `generateSigil` reject what is wrong (D-92 handles the throw).

### Integration Points

- **`package.json`'s `exports`** is this phase's only production-file edit outside the new `src/element/` directory. `files` needs no change (`src` covers it), `main` and `bin` are untouched.
- **`src/index.js`** is the element's sole import. No new export is added to it — the element is a *consumer* of the public surface, not a member of it.
- **`test/pack-install.test.js`** is extended, not rewritten — one `ENTRY_POINTS` row plus one `EXPECTED_TARBALL_FILES` entry. The row needs the resolve-only discriminator D-96 describes, which is the one place the existing shape genuinely does not stretch.
- **`vitest.config.js`** — `include: ['test/**/*.test.js']` is one flat include, so `test/browser/element.test.js` is picked up by the default `npm test` automatically. Note the consequence: **`npm test` will now require chromium for two files instead of one**, and the release workflow's `npx playwright install --with-deps chromium` step (D-77) already covers it.
- **No `examples/` directory exists.** D-95 creates it; it is repo-only and stays out of `files`.

</code_context>

<specifics>
## Specific Ideas

- The element's job description is "be a value-neutral convenience wrapper around the raw-SVG embed path that already works" — not "be a second, safer, different embedding model." Every decision above that could go two ways went the way that keeps the two paths identical in behavior. That framing is the single best test to apply to any question this context did not anticipate: **if the element's output or theming reach would differ from a hand-pasted `<svg>` for the same inputs, the answer is wrong.**
- The verification shape is deliberately two-vantage-point and should stay that way in planning: the Node smoke test proves *resolution and shipping* from outside the package boundary; the browser test proves *evaluation, rendering, and page-CSS reach*. Neither can see what the other sees, and collapsing them (a DOM shim in Node, or trusting the browser test to cover packaging) loses a real vantage point.
- Success criterion 1 has a human in it on purpose. The example page (D-95) is not documentation that happens to be viewable — it is the instrument the human check is performed with, and it should be planned as a deliverable with that job, not as a nice-to-have that gets cut if the phase runs long.

</specifics>

<deferred>
## Deferred Ideas

- **Publishing `1.1.0` to npm.** Named as a milestone-close action rather than lost (see D-98). The release workflow is built and proven; the bump and the publish travel together. If Matt wants it inside Phase 7, that is a scope decision to make at plan time.
- **A bundled single-file browser artifact (PKG-06).** Already deferred out of v1.1 in `REQUIREMENTS.md`. Technically unblocked — research confirmed no build step is *required* — but a product decision that was not made. If ever taken, it must not become the only shipped form, or "the source is what runs" breaks for real.
- **JS property accessors on the element** (`el.statement = '...'` reflecting to the attribute). WRAP-03 asks only that *attribute* changes re-render, and both actual consumers — Matt hand-authoring HTML and Claude Code generating it — write attributes. Reopen if a framework integration ever needs property binding.
- **Microtask batching of re-renders.** D-89 accepts three renders for three attribute writes. Reopen if a real page is observed doing enough rapid attribute mutation for it to be a measured cost rather than a hypothetical one.
- **A `push: tags: v*` release trigger** — deliberately not taken in Phase 6 (D-76), still reasonable once the manual-dispatch path has published successfully more than once.
- **A PR-triggered CI workflow.** Still not a requirement. Worth noting that this phase adds a second chromium-dependent test file, which raises the cost of *not* having CI slightly — not enough to change the answer.
- **The three v1.0 items deferred with written reopen conditions** (`E_CLI_STDIN` coverage, the `perpendicularUnit` doc comment, the `D-12` ID collision). The `D-12` condition names `bin/sigil-spinner.js:20` among its triggers; this phase is not expected to edit `bin/` at all, so the condition should stay unmet — planning should confirm rather than assume.

</deferred>

---

*Phase: 7-The sigil-spinner Element*
*Context gathered: 2026-08-09*
