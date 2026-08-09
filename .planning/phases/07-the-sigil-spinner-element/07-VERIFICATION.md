---
phase: 07-the-sigil-spinner-element
verified: 2026-08-09T13:15:00Z
status: human_needed
score: 27/28 must-haves verified
behavior_unverified: 1 # "idempotent re-render" truth (07-02 must_haves.truths #3) — present + wired, but the wired browser test cannot distinguish a real re-render from a future short-circuit that skips rendering (WR-02). Detailed in behavior_unverified_items below.
overrides_applied: 0
behavior_unverified_items:
  - truth: "Setting an observed attribute to the value it already holds re-renders and yields byte-identical innerHTML (07-02 must_haves.truths #3a)."
    test: "Re-set `planet` on a rendered `<sigil-spinner>` to the value it already holds. Attach an independent re-render signal — e.g. a `MutationObserver` on the element's children — before the re-set, and confirm it actually fires at least one mutation record (not just that innerHTML-before equals innerHTML-after)."
    expected: "The MutationObserver fires at least one childList mutation, proving `#render()` genuinely re-ran (D-89: no diffing, no batching, no coalescing) rather than being short-circuited by some future same-value skip that would coincidentally produce the same passing assertion."
    why_human: "Code Review finding WR-02 (07-REVIEW.md) is correct and remains unfixed on the merged tree: `test/browser/element.test.js:481-497`'s only assertion is `expect(after).toBe(before)` on innerHTML strings. That equality holds identically whether a real re-render occurred or whether nothing rendered at all — the test cannot discriminate the two. Direct reading of `src/element/sigil-spinner-element.js` confirms today's code has no such short-circuit (attributeChangedCallback calls `#render()` unconditionally when connected, and `#render()` performs no old-vs-new value comparison), so the underlying behavior is correct right now — but that is source inspection, not the behavioral proof the truth claims, and this project's own verification lesson (both real v1.0 defects passed a fully green suite) is exactly the reason a grep/read-through is not treated as sufficient evidence for a state-transition claim."
gaps: []
human_verification:
  - test: "Confirm 'idempotent re-render' is a real re-render, not just a stable equality (see behavior_unverified_items above)."
    expected: "A MutationObserver-based (or equivalent independent-signal) assertion fires on same-value re-set."
    why_human: "The existing automated test cannot distinguish the two cases; WR-02's suggested fix was not applied."
---

# Phase 7: The sigil-spinner Element Verification Report

**Phase Goal:** Matt can drop `<sigil-spinner statement="..." planet="...">` into a page and get a sigil his own CSS fully controls, with no build step and no runtime dependencies.
**Verified:** 2026-08-09T13:15:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

This phase is substantively real, not a stub. All four plans landed as claimed: a genuine `HTMLElement` subclass with no shadow root, a 17-test real-Chromium suite exercising rendering/theming/lifecycle/error/multi-instance behavior against `generateSigil` as an oracle, an additive `exports` map proven from a real pack-and-install, a bidirectional README↔`observedAttributes` drift guard with a recorded fail-first mutation in both directions, and a recorded human verdict on the rendered example page. One genuine, honestly-disclosed gap remains: the code review's WR-02 finding (a test whose assertion is weaker than its own claim) was not fixed, and it lands on exactly the kind of state-transition truth this verification framework treats as unprovable by presence alone.

### Observable Truths

**ROADMAP § Phase 7 success criteria (the roadmap contract):**

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| SC1 | A plain HTML page loading the element as ESM renders a visibly correct sigil, confirmed by a human, not only a green test | ✓ VERIFIED | `npm run test:browser` (3 files / 38 tests, incl. 17 in `element.test.js`) all pass, re-run independently; AND Matt's recorded human verdict "all pass" on `examples/element.html` served locally (2026-08-09), per already-established evidence and `07-04-SUMMARY.md` D4 |
| SC2 | Page CSS restyles the element through both `--sigil-*` custom properties AND semantic class selectors, identical reach to raw SVG | ✓ VERIFIED | `test/browser/element.test.js` "D-82: a `--sigil-*` override on an ancestor changes computed style..." and "D-82: a page-level `.sigil-path` rule authored outside the element matches its light-DOM children" — both pass (re-run, confirmed). Human look confirms the class-selector demo instance visibly differs (the empirical proof of the light-DOM lock) |
| SC3 | Attribute changes after insertion re-render correctly | ✓ VERIFIED (with one caveat) | "WRAP-03: changing planet after insertion re-renders to the new planet, proven against the oracle" passes. The narrower "re-render on a same-value re-set" claim is PRESENT_BEHAVIOR_UNVERIFIED — see `behavior_unverified_items` |
| SC4 | Several elements on one page render independently, no id collisions | ✓ VERIFIED | "D-93: several elements co-render independently with zero id attributes..." passes; README documents the converse (same `id-prefix` DOES collide) at `README.md:439` |
| SC5 | Installed package still declares zero runtime dependencies and ships no build output | ✓ VERIFIED | `package.json` `dependencies` is `undefined`; `npm run test:pack` passes (2/2); `npm pack --dry-run --json` lists the element file and nothing under `examples/`; no `dist/`, no `build`/`prepare`/`prepublishOnly` script |

**Requirement-level and edge-probe truths (PLAN frontmatter must_haves, lifted from the seven edge-probes and nine UI-SPEC items):**

| # | Truth (paraphrased) | Status | Evidence |
|---|---|---|---|
| 1 | Present-but-empty vs. absent attribute distinguishable (D-91) | ✓ VERIFIED | `element.test.js`: "D-91: an element carrying only one required attribute..." and "present-but-empty statement is not coerced to absent..." — both pass |
| 2 | Statement passed verbatim, no element-local normalization | ✓ VERIFIED | "verbatim encoding: a non-ASCII statement reaches generateSigil unmodified" passes; source has no `.trim()`/`.normalize()`/case-folding on `getAttribute('statement')` (`sigil-spinner-element.js:72`) |
| 3a | Idempotent re-render — same value re-set yields byte-identical innerHTML, proving a real re-render occurred | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | See `behavior_unverified_items`. WR-02 (07-REVIEW.md) is correct and unfixed |
| 3b | Guarded double registration does not throw | ✓ VERIFIED | "D-90: loading the element module twice does not throw and leaves exactly one registered definition" — uses a `pageerror` listener, a real behavioral check, passes |
| 4 | Fully synchronous render, no re-entrancy | ✓ VERIFIED | Source-level: `grep -cE "\bawait\b|setTimeout|queueMicrotask|requestAnimationFrame|MutationObserver"` on the element source returns 0; `data-sigil-error` absent from `observedAttributes` (line 41) — this claim is structurally provable by the total absence of async primitives, not a dynamic behavior needing a runtime test |
| 5 | Identical statement+planet, no id-prefix, cannot collide; same id-prefix DOES collide (documented) | ✓ VERIFIED | "D-93: ...zero id attributes..." passes; `README.md:439` states the SAME-id-prefix converse explicitly |
| 6 | Zero-instance page still registers the definition | ✓ VERIFIED | "D-90: a page with zero `<sigil-spinner>` tags loads the module without error, and a later-appended instance renders" passes |
| 7 | All three upgrade orderings converge on identical final content | ✓ VERIFIED | "D-88: parsed-HTML-already-defined, deferred-upgrade, and createElement-before-append agree on final content" passes, using three independent `browser.newPage()` instances (confirmed necessary and used, per 07-02-SUMMARY.md) |
| UI-1..6 (explicit) | Inert state; error round trip; byte-identity to oracle; long-statement bounded geometry; served example page loads its module; multi-instance zero-id independence | ✓ VERIFIED (all 6) | Each has a directly corresponding passing test in `element.test.js`, confirmed by re-run |
| B1/B2/B3 (backstop) | Sizing recipe holds; theming mechanisms visibly distinguishable; grid reflows without clipping | ✓ VERIFIED (human evidence) | Matt's recorded "all pass" verdict on `examples/element.html`, 2026-08-09 — satisfies the backstop's abstain-unless-human-confirmed rule |
| exports/pack | `./element` resolves through `exports` map AND file exists on disk, probe never evaluates the module in Node | ✓ VERIFIED | `npm run test:pack` (2/2, re-run); `test/pack-install.test.js` generated probe uses `import.meta.resolve` + `existsSync`, no `import {...} from '@falkensmage/sigil-spinner/element'` (grep confirms 0 matches) |
| tarball | `npm pack --dry-run` includes element file, excludes `examples/`; zero deps in installed tree | ✓ VERIFIED | Confirmed via orchestrator evidence (19 files, includes element, no `examples/`) and independent `npm run test:pack` re-run |
| docs-drift | README attribute table ↔ `observedAttributes` match bidirectionally | ✓ VERIFIED | `test/element-docs.test.js` passes; 07-03-SUMMARY.md records both fail-first mutations observed and reverted (extra-attribute and missing-attribute cases) |
| D-98 | version 1.0.0, no publish, `release.yml` unmodified | ✓ VERIFIED | Independently re-confirmed: `package.json.version === "1.0.0"`, `git status --porcelain .github/workflows/release.yml` empty, `git log` for the last release-workflow-touching commit predates this phase |
| D-12 | `bin/`, `src/errors.js`, `src/generate.js` untouched this phase | ✓ VERIFIED | `git diff --name-only 422d6ba..HEAD -- bin/ src/errors.js src/generate.js` returns empty (independently re-run) |

**Score:** 27/28 truths verified (1 present-and-wired-but-behaviorally-unproven)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/element/sigil-spinner-element.js` | `HTMLElement` subclass, light DOM, public-surface-only import | ✓ VERIFIED | Single import from `../index.js` (line 21); no `attachShadow`; no `node:` import; guarded `customElements.define` (lines 141-143) |
| `test/browser/element.test.js` | Real-Chromium suite proving D-94's 9 assertions + edges | ✓ VERIFIED | 17/17 tests pass on independent re-run |
| `examples/element.html` | Human-verification instrument | ✓ VERIFIED | Exists, loaded via `<script type="module">`, three theming demos, live control, error instance, grid/glyph instances — confirmed by source assertions and the served-page browser test |
| `package.json` `exports` | `./element`, `./package.json` additive entries | ✓ VERIFIED | Exactly 3 keys, `main`/`bin`/`files`/`version`/`dependencies` byte-unchanged |
| `test/pack-install.test.js` | resolve-only `./element` probe | ✓ VERIFIED | `npm run test:pack` 2/2 |
| `README.md` § element | Full documented contract incl. both footguns | ✓ VERIFIED | All required call-outs present (grep-confirmed: `show-title` exception, `curve="false"` footgun, sizing recipe, `data-sigil-error` hook ×2+, same-id-prefix collision, DOM-required note) |
| `test/element-docs.test.js` | Bidirectional drift guard | ✓ VERIFIED | Passes; fail-first mutation recorded both directions in 07-03-SUMMARY.md |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `src/element/sigil-spinner-element.js` | `src/index.js` | public-surface import | ✓ WIRED | `import { generateSigil, SigilError } from '../index.js'` — the only import statement |
| attribute names | `observedAttributes` → camelCase option keys | call-boundary mapping | ✓ WIRED | `#render()` maps kebab-case attrs to camelCase `generateSigil` options at lines 98-103 |
| `test/browser/element.test.js` static server | element's relative import chain | `node:http` fixture | ✓ WIRED | Confirmed via passing tracer + expanded suite; MIME-correct, CORS-permissive |
| `examples/element.html` | served over `node:http` test server | `Content-Type: text/javascript` | ✓ WIRED | "the served examples/element.html actually loads its module" test passes |
| `package.json` `exports["./element"]` | `src/element/sigil-spinner-element.js` | resolve-only probe | ✓ WIRED | `npm run test:pack` proves both resolution and on-disk existence |
| `test/element-docs.test.js` | `observedAttributes` (parsed as text) ↔ README table | drift guard | ✓ WIRED | Bidirectional Set-equality assertion, non-empty floor, fail-first mutation recorded |

### Data-Flow Trace (Level 4)

Not applicable in the conventional sense (no backend/DB) — the equivalent trace here is "does the element's rendered content actually come from `generateSigil`, not a static/mock string." Confirmed: `element.test.js`'s byte-identity test compares the element's live `innerHTML` against a live `generateSigil()` call (never a hardcoded literal — `grep -c "<svg" test/browser/element.test.js` in the plan's acceptance criteria enforces no hardcoded SVG). ✓ FLOWING.

### Behavioral Spot-Checks / Probe Execution

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full suite | `npm test` | 23 files / 1517 tests passed | ✓ PASS |
| Browser suite | `npm run test:browser` | 3 files / 38 tests passed (element.test.js: 17/17) | ✓ PASS |
| Pack/install smoke | `npm run test:pack` | 1 file / 2 tests passed | ✓ PASS |
| Typecheck | `npm run typecheck` | exit 0 | ✓ PASS |
| Lint | `npm run lint` | exit 0 | ✓ PASS |
| No shadow root | `grep -rn "attachShadow" src/` | no matches | ✓ PASS |
| No `node:` import in `src/` | `grep -rln "from 'node:" src/` | no matches | ✓ PASS |
| README drift guard + citations | `npx vitest run test/element-docs.test.js test/package-identity.test.js test/citations.test.js` | 3 files / 14 tests passed | ✓ PASS |
| `bin/`/`errors.js`/`generate.js` untouched | `git diff --name-only 422d6ba..HEAD -- bin/ src/errors.js src/generate.js` | empty | ✓ PASS |

All commands above were re-run independently in this verification pass, not copied from SUMMARY.md claims.

### Requirements Coverage

| Requirement | Description | Status | Evidence |
|---|---|---|---|
| WRAP-01 | Custom element renders a sigil in the browser, loaded as plain ESM | ✓ SATISFIED | Tracer + expanded suite + human verdict |
| WRAP-02 | Light DOM, page CSS reaches through both theming mechanisms | ✓ SATISFIED | No `attachShadow`; both computed-style tests pass; human verdict confirms visible distinguishability |
| WRAP-03 | Attribute changes re-render correctly; multiple elements independent, no id collisions | ⚠️ SATISFIED with one caveat | The "changes to a *new* value re-render correctly" half is fully proven (oracle-backed test). The narrower "same-value re-set is a genuine re-render, not a coincidental no-op" half is present and wired but not behaviorally proven — see `behavior_unverified_items` |

No orphaned requirements: WRAP-01/02/03 are the only IDs REQUIREMENTS.md and ROADMAP.md assign to Phase 7, and all three appear in at least one plan's frontmatter `requirements` field.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/element/sigil-spinner-element.js` | 126-129 | Non-`SigilError` catch branch re-throws without clearing `innerHTML` first (Code Review WR-01, confirmed still present on the merged tree) | ⚠️ Warning (info-level, out-of-contract) | Stale sigil content could remain visible after an unrelated (non-`SigilError`) exception mid-render. This does **not** violate any locked decision or must-have — D-92 explicitly specifies "re-throw anything that is not a SigilError," and no must-have truth claims the non-`SigilError` path clears content. It is a genuine robustness gap flagged by code review and left unaddressed, but it is residual risk outside this phase's contracted scope, not a phase-blocking gap. Recommend a follow-up quick-task. |

No debt markers (`TBD`/`FIXME`/`XXX`) found in phase-modified files. No `TODO`/`HACK`/`PLACEHOLDER` found. No empty-implementation or hardcoded-empty-data stub patterns found — the element's two `innerHTML = ''` assignments are the documented inert/error-clearing states (D-91/D-92), not stubs.

### Human Verification Required

### 1. Idempotent re-render — prove a real re-render, not just a stable equality

**Test:** Attach an independent re-render signal (e.g. a `MutationObserver` on `#idem`'s children) before re-setting `planet` on a rendered `<sigil-spinner>` to the value it already holds. Confirm the observer actually fires.

**Expected:** At least one mutation record fires, proving `#render()` genuinely re-ran per D-89 ("no diffing, no batching, no coalescing") — not merely that before/after `innerHTML` strings happen to match.

**Why human:** Code Review finding WR-02 is correct and remains unaddressed on the merged tree. The existing test (`element.test.js:481-497`) asserts `expect(after).toBe(before)` on innerHTML, which passes identically whether a real re-render happened or whether a hypothetical future same-value short-circuit skipped it entirely. Direct source reading confirms today's code has no such short-circuit — the underlying behavior is currently correct — but this project's central verification lesson (both real v1.0 defects passed a fully green suite) is exactly why source inspection is not accepted as a substitute for a discriminating behavioral test on a state-transition claim. This is a genuine, disclosed test-quality gap, not a functional defect today.

### Gaps Summary

No BLOCKER-level gaps. The phase goal is achieved: the element renders correctly, both theming mechanisms reach it, attribute mutation re-renders to new values (oracle-proven), multiple instances are independent with no id collisions by construction, packaging is real and proven from outside the package boundary, documentation is mechanically bound to the code, and a human confirmed the rendered result on screen — closing precisely the defect class ("technically correct, visibly nothing") that both real v1.0 defects belonged to.

One WARNING-level item is carried forward, both disclosed by code review and independently re-confirmed here:

1. **WR-02 (test-quality, unfixed):** the "idempotent re-render" browser test cannot discriminate a genuine re-render from a same-value skip. Routed to human verification above; does not block the phase, since the current source has no such skip (confirmed by direct code inspection) — but the regression protection for this specific claim is weaker than its stated title, exactly as the reviewer found.
2. **WR-01 (robustness, unfixed, out-of-contract):** a non-`SigilError` exception mid-render leaves stale DOM content instead of clearing it. This does not violate WRAP-01's prohibition (which is scoped to the `SigilError` path) or any must-have truth, but is worth a follow-up.

Recommendation: accept the phase as complete (status `human_needed`, not `gaps_found`) and either (a) get an explicit human/maintainer sign-off on the WR-02 residual risk, or (b) file it as a quick follow-up task to add the MutationObserver-based discriminating assertion WR-02 already specifies as a fix. Given the underlying code is currently correct, this is a reasonable one to accept and move forward on rather than reopen the phase for.

---

_Verified: 2026-08-09T13:15:00Z_
_Verifier: Claude (gsd-verifier)_
