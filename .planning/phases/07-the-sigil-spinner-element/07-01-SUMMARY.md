---
phase: 07-the-sigil-spinner-element
plan: 01
subsystem: ui
tags: [custom-elements, web-components, html5, playwright, esm, no-build-step]

# Dependency graph
requires:
  - phase: 03-themeable-embeddable-layers
    provides: the seven semantic CSS classes and 15 --sigil-* custom properties the element's light-DOM output must reach identically to a hand-pasted <svg>
  - phase: 06-published-package
    provides: playwright devDependency already pinned, test/browser/ established as the browser-test home
provides:
  - "src/element/sigil-spinner-element.js — the first HTMLElement subclass in the tree; renders a real sigil into light DOM from statement/planet/curve/glyph/id-prefix/show-title attributes"
  - "test/browser/element.test.js — a node:http-served ESM tracer proving the element renders a visible, non-zero-geometry sigil in a real browser with no build step"
affects: [07-02-the-sigil-spinner-element, 07-03-the-sigil-spinner-element]

actuals:
  tokens: 3586
  tasks: 3
  commits: 1

tech-stack:
  added: []
  patterns:
    - "Custom-element render gated on isConnected in attributeChangedCallback, unconditional in connectedCallback (D-88) — absorbs pre-insertion attribute writes without a diffing/batching layer"
    - "Library-owns-validation posture extended to the element: attributes are assembled into generateSigil options and passed through unvalidated, mirroring bin/sigil-spinner.js"
    - "node:http static file server in a test fixture, explicit Content-Type MIME map plus Access-Control-Allow-Origin: '*', for loading real ESM with resolving relative imports into a Playwright page"
    - "/* global HTMLElement, customElements, console */ directive comment scopes browser globals to one file without touching eslint.config.js"

key-files:
  created:
    - src/element/sigil-spinner-element.js
    - test/browser/element.test.js
  modified: []

key-decisions:
  - "D-80 (show-title attribute name) and D-82 (light DOM, no shadow root, ever) were confirmed by Matt at the pre-execution gate on 2026-08-09, recorded in 07-CONTEXT.md's header table — both checkpoint tasks in this plan were resolved to their recommended options without re-prompting, per the executor's preconfirmed-decision instructions."
  - "Playwright visibility assertion uses locator.waitFor({ state: 'visible' }) + isVisible(), not expect(locator).toBeVisible() — the latter is a @playwright/test-only matcher extension and does not exist on vitest's own expect(), which this suite uses throughout."
  - "getBBox() width/height are destructured into a plain object inside page.evaluate before returning to Node — DOMRect's width/height are prototype accessors, not own enumerable properties, so Playwright's structured-clone serialization silently drops them otherwise."

patterns-established:
  - "Custom-element source files declare browser globals via a single /* global ... */ directive comment rather than editing eslint.config.js, keeping the lint-config surface untouched per-file"

requirements-completed: [WRAP-01, WRAP-02]

coverage:
  - id: D1
    description: "A <sigil-spinner> carrying a real statement and planet, loaded through the real ESM module in Chromium with no build step, renders a visible .sigil-path with non-zero getBBox() geometry"
    requirement: WRAP-01
    verification:
      - kind: automated_ui
        ref: "test/browser/element.test.js#a real statement and planet produce a visible .sigil-path with non-zero geometry"
        status: pass
    human_judgment: false
  - id: D2
    description: "The element attaches no shadow root, ever — the SVG lands in the element's own light-DOM children, reachable by page CSS through both custom properties and semantic classes, identically to a hand-pasted <svg>"
    requirement: WRAP-02
    verification:
      - kind: other
        ref: "grep -vE '^\\s*(\\*|//|/\\*)' src/element/sigil-spinner-element.js | grep -c attachShadow  (returns 0)"
        status: pass
    human_judgment: false

duration: 20min
completed: 2026-08-09
status: complete
---

# Phase 7 Plan 01: The Tracer — `<sigil-spinner>` Renders Through Real ESM Summary

**`<sigil-spinner>` custom element (light DOM, no build step) that reads `statement`/`planet`/`curve`/`glyph`/`id-prefix`/`show-title` attributes, calls `generateSigil`, and renders a real, visible sigil in Chromium — proven end-to-end by a `node:http`-served Playwright tracer.**

## Performance

- **Duration:** ~20 min
- **Completed:** 2026-08-09T17:28:20Z
- **Tasks:** 3 (2 pre-confirmed checkpoints + 1 tracer)
- **Files modified:** 2 (both new)

## Accomplishments
- Built `src/element/sigil-spinner-element.js` — the first `HTMLElement` subclass in the tree — implementing the full locked contract: six observed attributes (D-79/D-80/D-87), presence-based booleans (D-81), light-DOM-only rendering (D-82), public-surface-only import (D-85), whole-string-only `innerHTML` writes (D-86), `isConnected`-gated re-render (D-88), synchronous whole-content replacement (D-89), guarded `customElements.define` (D-90), silent inert state on a missing required attribute (D-91), and full-fidelity `SigilError` reflection via `data-sigil-error` (D-92).
- Built `test/browser/element.test.js` with a from-scratch `node:http` static file server (MIME-correct, CORS-permissive, path-traversal-safe) that serves the repository root so the element's `../index.js` import chain resolves exactly as it would from a CDN — then proved a real page loads the module, upgrades a pre-parsed `<sigil-spinner>`, and renders a `.sigil-path` that Playwright reports visible with non-zero `getBBox()` geometry.
- Confirmed both one-way checkpoint decisions (D-80 `show-title`, D-82 light DOM) at implementation time per the pre-confirmed record in `07-CONTEXT.md`, without re-prompting.
- Verified the tracer's `<verify>` end-to-end after the commit (auto-mode tracer feedback gate) — passed, no expansion task follows within this plan.

## Task Commits

Each task was committed atomically:

1. **Checkpoint: lock the title-toggle attribute name (D-80)** — preconfirmed, no separate commit (recorded in 07-CONTEXT.md prior to this plan's execution).
2. **Checkpoint: lock the light-DOM choice (D-82)** — preconfirmed, no separate commit (recorded in 07-CONTEXT.md prior to this plan's execution).
3. **Tracer: End-to-end "a real page renders a real sigil through the element"** - `6d4547f` (feat)

**Plan metadata:** commit pending (this SUMMARY + STATE.md)

## Files Created/Modified
- `src/element/sigil-spinner-element.js` - the `<sigil-spinner>` custom element: attribute read, option assembly, `generateSigil` call, light-DOM injection, error reflection, guarded registration
- `test/browser/element.test.js` - Playwright/Chromium tracer with an in-file `node:http` static server; proves real-ESM evaluation and visible, non-zero-geometry rendering

## Decisions Made
- D-80 and D-82 were already confirmed by Matt before execution (per `07-CONTEXT.md`'s header table); both `checkpoint:decision` tasks were resolved to their recorded confirmations rather than re-prompted, per this executor's explicit pre-confirmed-decision instructions.
- Chose `locator.waitFor({ state: 'visible' }) + isVisible()` over `expect(locator).toBeVisible()` for the visibility assertion — the latter belongs to `@playwright/test`'s `expect`, not vitest's, and this repo's browser tests import `expect` from `vitest` throughout. Confirmed by a live typecheck failure (`TS2339: Property 'toBeVisible' does not exist`) before it could have shipped as a broken assertion.
- Destructured `getBBox()`'s `width`/`height` into a plain object inside `page.evaluate` rather than returning the `DOMRect` directly — its accessor properties are dropped by Playwright's structured-clone serialization back to Node, which a first pass surfaced as `width: undefined` at runtime.

## Deviations from Plan

None - plan executed exactly as written. The two fixes above were corrections made entirely within the single tracer task, before its one commit, discovered via the task's own acceptance criteria (`npm run typecheck`, `npx vitest run test/browser/element.test.js`) rather than after-the-fact — not deviations from the locked contract in `07-CONTEXT.md`/`07-01-PLAN.md`, which is implemented exactly as specified.

## Issues Encountered
- `expect(locator).toBeVisible()` is not part of vitest's `expect()` — it is a Playwright-`test`-specific matcher extension this repo doesn't have installed (only the `playwright` library, not `@playwright/test`). Caught by `npm run typecheck` before it could ship; replaced with `locator.waitFor({ state: 'visible' }) + isVisible()`, which is part of the `playwright` library's own `Locator` API and needs no extra dependency.
- `SVGGraphicsElement.getBBox()`'s returned `DOMRect`-like object serializes as `{ width: undefined, height: undefined, ... }` across Playwright's `evaluate()` boundary (prototype accessors, not own enumerable properties) — fixed by destructuring into a plain object inside the page-context callback before returning.
- Module-script fetches are always CORS-mode regardless of the `crossorigin` attribute, and the test page's `page.setContent()` document sits at a different origin (`about:blank`) than the `node:http` fixture server. Resolved proactively by sending `Access-Control-Allow-Origin: '*'` on every server response, rather than discovering it as a failure — this was anticipated from Assumption A2 in `07-RESEARCH.md` and verified correct on the first live run.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- The element's implementation and its module-loading Playwright harness are both proven and committed. Plan 07-02 can extend `test/browser/element.test.js` with its remaining eight owed D-94 assertions (class-selector reach, custom-property override, double-registration, upgrade-timing equivalence across all three paths, attribute-mutation re-render, multi-instance zero-id, and the `curve="false"` footgun) against the same static-server harness built here.
- `examples/element.html` (D-95), the `package.json` `exports` map edit (D-84), and the `test/pack-install.test.js` resolve-only row (D-96) remain for later plans in this phase — none of this plan's files touch `package.json`, `src/index.js`, or `vitest.config.js`.
- No blockers. Full suite (22 files / 1499 tests), `typecheck`, `lint`, and the citation checker all pass with the new files included.

## Self-Check: PASSED

- FOUND: `src/element/sigil-spinner-element.js`
- FOUND: `test/browser/element.test.js`
- FOUND: `.planning/phases/07-the-sigil-spinner-element/07-01-SUMMARY.md`
- FOUND: commit `6d4547f`

---
*Phase: 07-the-sigil-spinner-element*
*Completed: 2026-08-09*
