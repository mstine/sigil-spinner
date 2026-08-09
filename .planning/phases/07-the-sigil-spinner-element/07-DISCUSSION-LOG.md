# Phase 7: The sigil-spinner Element - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-09
**Phase:** 7-The sigil-spinner Element
**Mode:** `--auto` — all gray areas auto-selected, every question resolved to the recommended option. Matt confirmed nothing in conversation.
**Areas discussed:** Attribute contract, Boolean semantics, Light-DOM lock, Module placement & exports, Lifecycle & re-render, Failure behavior, Multi-instance & id policy, Verification surface, Publish boundary

---

## Attribute contract

| Option | Description | Selected |
|--------|-------------|----------|
| CLI flags minus `--`, kebab preserved | `statement`, `planet`, `curve`, `glyph`, `id-prefix` — mirrors `bin/sigil-spinner.js` exactly | ✓ |
| Library camelCase names as attributes | `idPrefix` as an attribute — matches `KNOWN_OPTIONS` but violates HTML convention | |
| A `sigil-` prefixed namespace | `sigil-statement`, `sigil-planet` — redundant on an element already named `sigil-spinner` | |

**Choice:** CLI-mirroring kebab-case (D-79). **Notes:** `--json` and `--output` deliberately have no element analog — CLI transport concerns, not rendering options.

### Sub-question: the `title` collision

| Option | Description | Selected |
|--------|-------------|----------|
| `show-title` | HTML boolean-toggle idiom; first name research proposed | ✓ |
| `embed-title` | Mirrors the library's own verb (`svg.js:602` "embed the … statement") but less idiomatic as a boolean | |
| `sigil-title` | Redundant prefix; reads like it takes a string value | |
| `title` (reuse the global) | Rejected outright — it is a global HTML attribute rendering a browser tooltip, meaning something else entirely | |

**Choice:** `show-title` (D-80). **Notes:** rated `one-way`. This is the open decision ROADMAP.md and REQUIREMENTS.md both assign to this phase. It is also the single exception to D-79's drop-the-dashes rule and must be documented as such.

---

## Boolean attribute semantics

| Option | Description | Selected |
|--------|-------------|----------|
| Presence-based (HTML convention) | Attribute present = true regardless of value, like `disabled`/`hidden` | ✓ |
| Value-based with `"false"` honored | Friendlier when someone writes `curve="false"`, diverges from every platform boolean | |

**Choice:** presence-based (D-81). **Notes:** the footgun is real and accepted — `curve="false"` enables curves; removal is the off switch. Documented explicitly and pinned by a browser test rather than smoothed over.

---

## Light-DOM lock

| Option | Description | Selected |
|--------|-------------|----------|
| No shadow root, ever | SVG written into the element's own children; page CSS reaches it identically to a hand-pasted `<svg>` | ✓ |
| Open shadow root | Standard web-component encapsulation; custom properties still inherit in | |
| Shadow root + `::part()` re-exposure | Claws back class-selector reach at the cost of a parallel `part` scheme for 15 properties + 7 classes | |

**Choice:** light DOM, formally locked (D-82). **Notes:** rated `one-way`. The deciding fact: custom properties pierce a shadow boundary, **class selectors do not** — and roughly half this project's documented theming surface is classes. A shadow root would make the element strictly less themeable than the raw-SVG path it wraps. Accepted cost: no encapsulation, symmetric with raw SVG.

---

## Module placement, exports, and what ships

| Option | Description | Selected |
|--------|-------------|----------|
| `src/element/sigil-spinner-element.js` + `exports["./element"]` | New leaf under `src/`, already covered by `files: ["src", …]` | ✓ |
| Top-level `web/` or `element/` directory | Would need a `files` edit and risks the silent never-ships fault Pitfall 4 describes | |
| Fold into `src/index.js` | Would make the universal entry point browser-only — breaks Node consumers | |

**Choice:** `src/element/` (D-83), the three-entry `exports` map (D-84), public-surface-only imports (D-85), no `innerHTML` concatenation (D-86). **Notes:** D-84 rated `one-way`. Four deliberate non-choices recorded inside it: no `browser` condition on `.`, no `browser`/`node` condition on `./element`, no wildcard export, `main`/`bin` untouched. `./package.json` added as the conventional third entry.

---

## Lifecycle and re-render

| Option | Description | Selected |
|--------|-------------|----------|
| Render in `connectedCallback`; `attributeChangedCallback` gated on `isConnected` | Absorbs pre-insertion attribute writes so the first render is the correct one | ✓ |
| Render on every `attributeChangedCallback` unconditionally | Renders half-configured sigils when attributes are set before `appendChild` | |
| Full replace, no batching | `generateSigil` is pure and fast; a diff serves nothing | ✓ |
| Microtask-batched re-render | Coalesces multi-attribute writes; machinery ahead of a measured need | |
| Guarded `customElements.define` | `if (!customElements.get(...))` — one line; there is no unregister API | ✓ |

**Choice:** D-87 through D-90. **Notes:** the upgrade-timing trap is not hypothetical — `createElement` upgrades immediately when the element is defined, so `attributeChangedCallback` fires *before* `connectedCallback`. Both the gating and the double-registration guard get structural browser tests rather than code review.

---

## Failure behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Inert until required attributes present; `SigilError` → clear + `console.error` + `data-sigil-error` | Visible three ways, observable by tests and page CSS, error object intact | ✓ |
| Throw from the lifecycle callback | Noise during normal mid-construction states the page author cannot act on | |
| Render a placeholder/error graphic | Invents a second rendering path and a visual vocabulary the element does not have | |

**Choice:** D-91, D-92. **Notes:** the attribute is removed on the next successful render. The element never swallows the error silently.

---

## Multi-instance and the id policy

| Option | Description | Selected |
|--------|-------------|----------|
| Synthesize nothing — id-free by construction | Default output emits zero `id` attributes, so WRAP-03 holds without machinery | ✓ |
| Mirror the host element's own `id` into `idPrefix` | Unique by HTML rules, but makes element output differ from raw-SVG output for identical inputs | |
| Derived hash of `(statement, planet, options)` | Pitfall 9 recommended it; D-44 refused it — under this project's determinism, two identical sigils get identical ids | |

**Choice:** synthesize nothing (D-93). **Notes:** upholds D-44 and, more importantly, keeps the element's output identical to the raw-SVG path. Identical caller-supplied `id-prefix` on two elements remains the caller's documented responsibility, same as today.

---

## Verification surface

| Option | Description | Selected |
|--------|-------------|----------|
| `test/browser/element.test.js` over a local `node:http` static server | Loads the real module with working relative imports; doubles as the example page's server | ✓ |
| `page.setContent` / `addScriptTag({path})` | Both break the module's relative imports (`about:blank` has no base to resolve against) | |
| `file://` page | ESM module loading blocked outright | |
| Resolve-only `./element` row in `pack-install` | Proves `exports` resolution + the file shipped, without evaluating a browser-only module in Node | ✓ |
| Evaluate `./element` under a minimal DOM shim in Node | Proves more, but couples the packaging test to element internals and puts a DOM shim in Node | |

**Choice:** D-94 through D-97. **Notes:** the existing probe would `ReferenceError` on a *correctly published* package, because `class extends HTMLElement` dereferences an undefined global at class-definition time — so the row needs a discriminator, not just an append. Two vantage points kept deliberately separate: Node proves resolution and shipping, the browser proves rendering and page-CSS reach.

---

## Publish boundary

| Option | Description | Selected |
|--------|-------------|----------|
| No publish; `version` stays `1.0.0` | Success criteria need a tarball, not a registry write; a bumped-but-unpublished version is a window with no gain | ✓ |
| Bump to `1.1.0` and publish via the release workflow | The milestone is "Distribution" and the workflow is proven — but no Phase 7 success criterion asks for it | |
| Bump to `1.1.0`, do not publish | Worst of both: the tree claims a version the registry does not have | |

**Choice:** no publish (D-98). **Notes:** flagged rather than buried — at Phase 7's close, `npm install` still resolves to `1.0.0` and gets no element. Publishing `1.1.0` is recorded as a named milestone-close action. If Matt wants it inside Phase 7, that is a scope call at plan time, not a discovery afterward.

---

## Claude's Discretion

- Plan decomposition and commit granularity
- The element class's internal shape (option assembly, the `data-sigil-error` write path)
- The static server helper's form and port strategy
- The example page's visual arrangement (planets, layout, composition)
- Whether the README attribute drift guard extends `test/package-identity.test.js` or gets its own file
- The mechanism of the browser test's visibility assertion (geometry read vs. bounding box vs. computed style)

## Deferred Ideas

- Publishing `1.1.0` to npm — milestone-close action
- A bundled single-file browser artifact (PKG-06) — already deferred out of v1.1
- JS property accessors reflecting to attributes
- Microtask batching of re-renders
- A `push: tags: v*` release trigger
- A PR-triggered CI workflow — slightly more attractive now that a second chromium-dependent test file exists, not enough to change the answer
- The three v1.0 items with written reopen conditions; the `D-12` trigger names `bin/sigil-spinner.js:20`, which this phase is not expected to touch — planning should confirm rather than assume
