---
phase: 07-the-sigil-spinner-element
plan: 02
subsystem: ui
tags: [custom-elements, web-components, playwright, esm, no-build-step, theming]

# Dependency graph
requires:
  - phase: 07-01
    provides: "src/element/sigil-spinner-element.js and the tracer's node:http static-server harness in test/browser/element.test.js"
provides:
  - "examples/element.html — the repo-only human-verification instrument for plan 07-04's visual check"
  - "test/browser/element.test.js expanded from 1 to 17 tests, covering all nine of D-94's owed assertions plus the edge/state-coverage predicates in must_haves.truths"
affects: [07-03-the-sigil-spinner-element, 07-04-the-sigil-spinner-element]

actuals:
  tokens: 10100
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Browser-serialization round trip as the byte-identity oracle: comparing a custom element's rendered innerHTML against a raw generateSigil() string directly fails, because the HTML fragment serialization algorithm always writes an explicit end tag for a non-void SVG-namespace element (self-closing <path ... /> in the raw string always reads back as <path ...></path>). Round-tripping the oracle through the identical innerHTML-assignment-then-read-back on a plain scratch <div> before comparing preserves the real claim (the element adds/removes nothing) without asserting something the DOM serialization spec makes impossible."
    - "Upgrade-ordering equivalence tested across three genuinely fresh browser pages (browser.newPage() per case), not three snippets on one shared page — a shared page's customElements registry persists across page.setContent() calls (confirmed empirically), so reusing one page for all three orderings would silently collapse case (a) and case (c) into the same already-defined scenario instead of exercising the deferred-upgrade path"
    - "In-page console.error capture hook (monkey-patch console.error before triggering the render, push serializable {message, code} objects to a page-global array) instead of relying on Playwright's page.on('console') event — avoids depending on how a thrown Error/SigilError structured-clones across the Playwright protocol boundary, which is unspecified for non-own-enumerable properties"

key-files:
  created:
    - examples/element.html
  modified:
    - test/browser/element.test.js
    - eslint.config.js

key-decisions:
  - "Rule 1/3 deviation: the plan's literal 'innerHTML byte-identical to generateSigil(...).svg' claim cannot hold via direct string comparison in a real browser (confirmed by running the comparison and tracing the first diff to self-closing-vs-explicit-closing SVG tag serialization). Fixed by round-tripping the oracle through the same innerHTML assignment/read-back before comparing, preserving the claim's intent."
  - "Rule 3 deviation: added customElements and window to the existing test/browser/**/*.js ESLint globals block in eslint.config.js — this plan's D-90/D-92 tests are the first to reference them outside a page.evaluate callback, and lint failed with no-undef otherwise. Narrow, blocking-only edit to a file not owned by plan 07-03's declared scope."
  - "D-88's three upgrade orderings are exercised on three independent browser.newPage() instances rather than reusing the shared page/module-level fixture, so each case starts with a genuinely empty customElements registry — required to actually distinguish 'module already defined at parse time' from 'module defined later by a deferred script'."

patterns-established:
  - "browserSerialize(markup) and computedStyle(selector, cssProperty) test helpers in test/browser/element.test.js, reused across both new describe blocks — the same instrument any future browser-rendering assertion in this file should reach for rather than re-deriving getComputedStyle/innerHTML boilerplate per test"

requirements-completed: [WRAP-01, WRAP-02, WRAP-03]

coverage:
  - id: D1
    description: "examples/element.html — repo-only demo page with the sizing recipe, three labelled theming-mechanism instances (unstyled/custom-property/class-selector), a planet gallery including a grid-revealed and a glyph instance, a live planet-mutation control, and a deliberate error-state instance styled with the documented data-sigil-error hook"
    requirement: WRAP-02
    verification:
      - kind: other
        ref: "node -e source-assertion script checking sigil-spinner/display:inline-block/aspect-ratio/--sigil-stroke/.sigil-path/stroke-dasharray/live-planet/data-sigil-error/type=module all present"
        status: pass
      - kind: automated_ui
        ref: "test/browser/element.test.js#the served examples/element.html actually loads its module (strict-MIME dependency, D-94 #7)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Rendered innerHTML is byte-identical (via the browser-serialization round trip) to a direct generateSigil() call — the pure-pass-through claim of D-85/D-86"
    requirement: WRAP-01
    verification:
      - kind: automated_ui
        ref: "test/browser/element.test.js#D-85/D-86: rendered innerHTML is byte-identical to a direct generateSigil call"
        status: pass
    human_judgment: false
  - id: D3
    description: "A page-level --sigil-* override and a page-level .sigil-path class rule both reach the element's light-DOM children, proven by computed style (not markup presence) — the empirical test of D-82"
    requirement: WRAP-02
    verification:
      - kind: automated_ui
        ref: "test/browser/element.test.js#D-82: a --sigil-* override on an ancestor changes computed style on a rendered descendant"
        status: pass
      - kind: automated_ui
        ref: "test/browser/element.test.js#D-82: a page-level .sigil-path rule authored outside the element matches its light-DOM children"
        status: pass
    human_judgment: false
  - id: D4
    description: "D-81's curve=\"false\" presence-semantics footgun pinned against both the curve-enabled and curve-disabled oracle"
    requirement: WRAP-01
    verification:
      - kind: automated_ui
        ref: "test/browser/element.test.js#D-81: curve=\"false\" still enables curves — presence, not value, decides the boolean"
        status: pass
    human_judgment: false
  - id: D5
    description: "Non-ASCII statement pass-through unmodified, and a >=500 character statement stays bounded by the fixed viewBox with non-degenerate .sigil-path geometry"
    requirement: WRAP-01
    verification:
      - kind: automated_ui
        ref: "test/browser/element.test.js#verbatim encoding: a non-ASCII statement reaches generateSigil unmodified — no trim, fold, or normalization"
        status: pass
      - kind: automated_ui
        ref: "test/browser/element.test.js#long statement (>=500 chars): geometry stays bounded by kamea order, not statement length"
        status: pass
    human_judgment: false
  - id: D6
    description: "D-90: loading the module twice does not throw and leaves one registration; a zero-instance page loads cleanly and a later-appended instance upgrades and renders"
    requirement: WRAP-01
    verification:
      - kind: automated_ui
        ref: "test/browser/element.test.js#D-90: loading the element module twice does not throw and leaves exactly one registered definition"
        status: pass
      - kind: automated_ui
        ref: "test/browser/element.test.js#D-90: a page with zero <sigil-spinner> tags loads the module without error, and a later-appended instance renders"
        status: pass
    human_judgment: false
  - id: D7
    description: "D-88: all three upgrade orderings (already-defined-at-parse, deferred-script-upgrade, createElement-before-append) agree on final rendered content — never a render-call-count assertion"
    requirement: WRAP-03
    verification:
      - kind: automated_ui
        ref: "test/browser/element.test.js#D-88: parsed-HTML-already-defined, deferred-upgrade, and createElement-before-append agree on final content"
        status: pass
    human_judgment: false
  - id: D8
    description: "Idempotent re-render (same value re-set yields byte-identical innerHTML) and WRAP-03's attribute-mutation re-render proven against the generateSigil oracle for the new planet"
    requirement: WRAP-03
    verification:
      - kind: automated_ui
        ref: "test/browser/element.test.js#setting an observed attribute to its current value re-renders and yields byte-identical innerHTML"
        status: pass
      - kind: automated_ui
        ref: "test/browser/element.test.js#WRAP-03: changing planet after insertion re-renders to the new planet, proven against the oracle"
        status: pass
    human_judgment: false
  - id: D9
    description: "D-93: several co-rendered elements each carry exactly one svg root and zero id attributes anywhere in their rendered subtree; two identical instances render byte-identical output; mutating one leaves the others unchanged"
    requirement: WRAP-03
    verification:
      - kind: automated_ui
        ref: "test/browser/element.test.js#D-93: several elements co-render independently with zero id attributes anywhere in their rendered subtrees"
        status: pass
    human_judgment: false
  - id: D10
    description: "D-91: an element carrying only one required attribute (or neither) stays inert — zero children, no thrown error, no console error, no data-sigil-error — then renders once the missing attribute is set on the same instance"
    requirement: WRAP-01
    verification:
      - kind: automated_ui
        ref: "test/browser/element.test.js#D-91: an element carrying only one required attribute, or neither, stays inert until the missing one is set"
        status: pass
      - kind: automated_ui
        ref: "test/browser/element.test.js#present-but-empty statement is not coerced to absent, and an absent statement is not coerced to present-but-empty"
        status: pass
    human_judgment: false
  - id: D11
    description: "D-92: an unknown planet reflects data-sigil-error=\"E_UNKNOWN_PLANET\" and logs the full error object with its code intact; setting a valid planet afterwards removes the attribute and restores an svg child — the full round trip"
    requirement: WRAP-01
    verification:
      - kind: automated_ui
        ref: "test/browser/element.test.js#D-92: an unknown planet reflects data-sigil-error and logs the full error; setting a valid planet restores rendering"
        status: pass
    human_judgment: false

duration: 17min
completed: 2026-08-09
status: complete
---

# Phase 7 Plan 02: The sigil-spinner Element — Rendering, Theming, and Lifecycle Verification Summary

**Expanded `examples/element.html` (the phase's human-verification instrument) and `test/browser/element.test.js` from the tracer's single assertion to 17 real-browser tests covering all nine of D-94's owed rendering claims plus the edge/state-coverage predicates (inert, present-but-empty, error round trip, multi-instance zero-id, all three custom-element upgrade orderings).**

## Performance

- **Duration:** ~17 min
- **Completed:** 2026-08-09T17:48:18Z
- **Tasks:** 3
- **Files modified:** 3 (1 created, 2 modified)

## Accomplishments
- Built `examples/element.html` — a repo-only, no-build-step, no-dependency demo page carrying the load-bearing sizing recipe, three labelled theming-mechanism instances (unstyled/`--sigil-stroke` teal/`.sigil-path` class-selector orange-dashed), a six-planet gallery including a grid-revealed instance and a glyph instance, a live planet-mutation `<select>` control wired only via `setAttribute`, and a deliberately-erroring instance styled with the documented `data-sigil-error` CSS hook.
- Extended `test/browser/element.test.js`'s rendering/theming half: byte-identity between the element's `innerHTML` and a direct `generateSigil` call (via a browser-serialization round trip, see Deviations), custom-property and class-selector computed-style reach, the `curve="false"` presence-semantics footgun pinned against both oracles, non-ASCII verbatim pass-through, `>=500`-character bounded geometry, and the served example page's own module-load assertion.
- Extended the lifecycle/failure/multi-instance half: double-registration silence, all three custom-element upgrade orderings (already-defined-at-parse, deferred-script-upgrade, `createElement`-before-`appendChild`) proven on final content only across three independently fresh browser pages, idempotent re-render, `WRAP-03`'s attribute-mutation re-render against the oracle, `D-93`'s zero-id multi-instance independence, `D-91`'s inert state, the present-but-empty-vs-absent statement distinction, and `D-92`'s full error round trip with an in-page `console.error` capture hook.
- Test count grew from 1 (07-01's tracer) to 17; full suite grew from 1,499 to 1,515 tests, all green, with `typecheck` and `lint` both exit 0.

## Task Commits

Each task was committed atomically:

1. **Task 1: Build examples/element.html — the instrument the human check uses** - `347c542` (feat)
2. **Task 2: Browser assertions — rendering, theming reach, and pass-through fidelity** - `e2a32c6` (feat)
3. **Task 3: Browser assertions — lifecycle, error contract, and multi-instance independence** - `6e1e222` (feat)

**Plan metadata:** commit pending (this SUMMARY + STATE.md, owned by the orchestrator in worktree mode)

## Files Created/Modified
- `examples/element.html` - repo-only human-verification demo page (D-95); not in `package.json`'s `files`
- `test/browser/element.test.js` - expanded from 1 to 17 tests across two new `describe` blocks, plus shared `renderPage`/`browserSerialize`/`computedStyle` test helpers
- `eslint.config.js` - added `customElements` and `window` to the `test/browser/**/*.js` globals block (Rule 3 deviation, see below)

## Decisions Made
- Round-tripped the `generateSigil` oracle through the same `innerHTML` assignment/read-back the element itself performs before comparing, rather than comparing against the raw string — the only way to make the byte-identity claim true in an actual browser (see Deviations).
- Exercised each of D-88's three upgrade orderings on its own fresh `browser.newPage()` rather than reusing the shared module-level `page` — confirmed empirically that a shared page's `customElements` registry persists across `page.setContent()` calls, which would have silently collapsed the "already defined at parse time" and "createElement" cases into indistinguishable scenarios.
- Captured `console.error`'s arguments via an in-page monkey-patch pushing serializable `{message, code}` objects to a page-global array, rather than relying on Playwright's `page.on('console')` event and inspecting `ConsoleMessage` args — sidesteps depending on unspecified structured-clone behavior for a thrown `Error`/`SigilError` instance crossing the Playwright protocol boundary.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1/3 - Bug/Blocking] The plan's literal innerHTML byte-identity claim is unachievable via direct string comparison in a real browser**
- **Found during:** Task 2 (pass-through equality assertion)
- **Issue:** `generateSigil`'s raw SVG string self-closes empty elements (`<path ... />`), matching common hand-authored SVG convention. The HTML fragment serialization algorithm (spec-mandated) always writes an explicit end tag for a non-void, SVG-namespace element regardless of how it was created — so reading `element.innerHTML` back after `this.innerHTML = svg` always normalizes `<path ... />` to `<path ...></path>`. A direct `expect(rendered).toBe(svg)` therefore fails on every run for a reason unrelated to the element's correctness, confirmed by running the comparison and tracing the exact first-diff byte offset to this normalization.
- **Fix:** Added a `browserSerialize(markup)` helper that round-trips a raw markup string through the identical `scratch.innerHTML = markup; return scratch.innerHTML;` assignment on a plain, unconnected `<div>` — never through the custom element — then compares the element's rendered `innerHTML` against `browserSerialize(oracleSvg)` instead of the raw oracle string. This preserves the real claim ("the element adds and removes nothing beyond what assigning the raw SVG would do") without asserting something the DOM serialization spec makes structurally impossible.
- **Files modified:** test/browser/element.test.js
- **Verification:** All three affected assertions (pass-through equality, `curve="false"` footgun, non-ASCII verbatim pass-through) pass after the fix; `npx vitest run test/browser/element.test.js` green.
- **Committed in:** e2a32c6 (Task 2 commit)

**2. [Rule 3 - Blocking] ESLint `no-undef` on `customElements`/`window` referenced outside `page.evaluate`**
- **Found during:** Task 3 (double-registration and error-capture assertions)
- **Issue:** `npm run lint` failed with `no-undef` for `customElements` (used in `page.evaluate(() => Boolean(customElements.get(...)))`, which ESLint still statically parses even though it executes in the browser realm) and `window` (used in the D-92 `console.error` capture hook). Neither global was previously declared in `eslint.config.js`'s `test/browser/**/*.js` block, because no prior test in the file referenced them.
- **Fix:** Added `customElements: 'readonly'` and `window: 'readonly'` to the existing `test/browser/**/*.js` globals block.
- **Files modified:** eslint.config.js
- **Verification:** `npm run lint` exits 0.
- **Committed in:** 6e1e222 (Task 3 commit)

---

**Total deviations:** 2 auto-fixed (1 Rule 1/3 test-methodology correction, 1 Rule 3 blocking lint fix)
**Impact on plan:** Both fixes were necessary to make the plan's own acceptance criteria achievable in a real browser and to keep `npm run lint` green. No scope creep — neither touches `package.json`, `README.md`, or any file 07-03 owns.

## Issues Encountered
- Confirmed empirically (via a throwaway script, not committed) that a shared Playwright `page`'s `customElements` registry persists across `page.setContent()` calls within the same browsing context — this is what necessitated three independent `browser.newPage()` instances for D-88's upgrade-ordering test, since reusing one page would have made every ordering after the first look like "module already defined."

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All nine of D-94's owed browser assertions, plus every `must_haves.truths` predicate this plan owned, are proven by a passing test in `test/browser/element.test.js` (17/17 green).
- `examples/element.html` is built and ready to be the instrument for plan 07-04's human visual check (ROADMAP success criterion 1) — it was not itself visually inspected by a human in this plan, only proven to load and render via the automated served-page assertion.
- Plan 07-03 (`package.json` `exports` map, `test/pack-install.test.js` resolve-only row, `README.md` element section, `test/element-docs.test.js` drift guard) remains untouched by this plan — no file overlap, confirmed by `git diff --name-only -- package.json` returning empty throughout.
- No blockers. Full suite (22 files / 1,515 tests), `typecheck`, and `lint` all pass with this plan's changes included.

## Self-Check: PASSED

- FOUND: `examples/element.html`
- FOUND: `test/browser/element.test.js` (733 lines, 17 tests)
- FOUND: `eslint.config.js` modification
- FOUND: commit `347c542`
- FOUND: commit `e2a32c6`
- FOUND: commit `6e1e222`

---
*Phase: 07-the-sigil-spinner-element*
*Completed: 2026-08-09*
