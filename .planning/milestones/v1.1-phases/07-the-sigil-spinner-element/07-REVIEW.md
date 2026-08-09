---
phase: 07-the-sigil-spinner-element
reviewed: 2026-08-09T00:00:00Z
depth: standard
files_reviewed: 8
files_reviewed_list:
  - src/element/sigil-spinner-element.js
  - test/browser/element.test.js
  - test/pack-install.test.js
  - test/element-docs.test.js
  - examples/element.html
  - package.json
  - README.md
  - eslint.config.js
findings:
  critical: 0
  warning: 2
  info: 2
  total: 4
status: issues_found
---

# Phase 07: Code Review Report

**Reviewed:** 2026-08-09T00:00:00Z
**Depth:** standard
**Files Reviewed:** 8
**Status:** issues_found

## Summary

This phase wraps the existing, stable `generateSigil` library in a `<sigil-spinner>` custom element. The core areas this review was asked to scrutinize hardest — the `innerHTML` injection surface, lifecycle re-entrancy via `data-sigil-error`, the `customElements.define` guard, error-handling honesty, and the resolve-only `./element` pack-install probe — all check out. Verified concretely, not just read:

- Both `this.innerHTML =` assignments on the success/inert paths are either `''` or the exact, unmodified `svg` returned by `generateSigil` — no template-literal concatenation anywhere (`src/element/sigil-spinner-element.js:87,113,123`).
- `data-sigil-error` is correctly excluded from `observedAttributes` (`sigil-spinner-element.js:41`), so writing it from inside `#render()` cannot re-enter `attributeChangedCallback`. Manually verified with a scripted Playwright probe (set invalid planet → error attribute set and logged; remove the attribute → error clears; remove `statement`/`planet` after a successful render → element goes inert with zero children and no stale error attribute).
- The `customElements.define` guard is correctly `if (!customElements.get(TAG_NAME))`.
- `test/pack-install.test.js`'s `./element` row is genuinely resolve-only: it builds a probe script that calls `import.meta.resolve()` and then `existsSync()` on the resolved path, and never `import`s the specifier — confirmed by reading the generated probe source, not just the row's `resolveOnly: true` flag.
- `test/element-docs.test.js` derives both the code side (regex over the `observedAttributes` array literal, read as text, never imported) and the README side (regex over the `### Attributes` table) and diffs in both directions — it cannot pass while one side drifts from the other.
- Ran `npm run typecheck`, `npx eslint` on all seven JS files, the non-browser test files, and the full `test/browser/element.test.js` suite (17 tests, all passing, including a from-scratch install/probe smoke test) — all green, and a set of hand-written Playwright probes for scenarios the suite doesn't directly exercise also produced correct behavior.

Two real gaps remain, both robustness/test-quality issues rather than incorrect current behavior: an unexpected (non-`SigilError`) exception mid-render leaves stale content in the DOM instead of clearing it, and one browser test's assertion is weaker than the "re-renders" claim in its own title. Both are detailed below with concrete fixes.

## Warnings

### WR-01: Unexpected (non-`SigilError`) render failures leave stale content in the DOM

**File:** `src/element/sigil-spinner-element.js:115-131`
**Issue:** The catch block only clears `this.innerHTML` on the `SigilError` branch. When `generateSigil` throws anything else — e.g. a genuine bug in the library, or a future regression — the element rethrows (correctly, per the comment: "not this element's failure mode to own"), but does **not** clear the previously-rendered content first. The result: the page keeps showing the *old* sigil for a planet/statement combination that no longer matches current attribute state, with no `data-sigil-error` and no visual signal that anything is wrong — only a console-level uncaught exception a developer might see. For a tool whose whole purpose is "this SVG is the correct, deterministic representation of this exact statement," silently continuing to display stale geometry after a failed re-render is a real correctness gap for anyone driving the page rather than the console (this project's own history: both prior production defects were caught by a human looking at rendered output, not by the console).

Confirmed by reading the code path: the only two `this.innerHTML = ''` calls are on the inert branch (line 87) and the `SigilError` branch (line 123); the `else` branch (lines 126-130) rethrows without touching `innerHTML`.

**Fix:**
```js
} catch (err) {
  if (err instanceof SigilError) {
    this.innerHTML = '';
    console.error('<sigil-spinner> failed to render:', err);
    this.setAttribute('data-sigil-error', err.code);
  } else {
    // Not a SigilError — not this element's failure mode to own.
    // Never swallowed silently, but never leave stale content either.
    this.innerHTML = '';
    throw err;
  }
}
```

### WR-02: "re-renders" test doesn't actually prove a re-render happened

**File:** `test/browser/element.test.js:481-497`
**Issue:** The test titled *"setting an observed attribute to its current value re-renders and yields byte-identical innerHTML"* only compares `innerHTML` before and after re-setting `planet` to its current value. That assertion is satisfied identically whether `attributeChangedCallback` actually re-ran `#render()` (the documented, current behavior — D-89 explicitly says "no diffing, no batching, no coalescing") **or** whether some future change added a same-value short-circuit that skips rendering entirely. In other words, the test cannot distinguish "re-rendered idempotently" from "did not render at all," despite its title asserting the former. This is exactly the failure mode the phase brief calls out: a test whose assertion is weaker than its stated claim, on a project whose history is that a green suite has twice missed a real rendering defect.

**Fix:** Add an independent signal that a render actually occurred — e.g. a `MutationObserver` on the element's children, asserted to have fired at least one mutation record:
```js
const mutationCount = await page.evaluate(() => {
  return new Promise((resolve) => {
    const el = document.getElementById('idem');
    const observer = new MutationObserver((records) => {
      observer.disconnect();
      resolve(records.length);
    });
    observer.observe(el, { childList: true, subtree: true });
    el.setAttribute('planet', 'saturn');
    // resolve(0) if nothing fires within a tick, so the promise can't hang
    setTimeout(() => { observer.disconnect(); resolve(0); }, 500);
  });
});
expect(mutationCount, 'setting an already-current attribute value must still trigger a re-render').toBeGreaterThan(0);
```

## Info

### IN-01: No regression guard asserting `data-sigil-error` stays out of `observedAttributes`

**File:** `src/element/sigil-spinner-element.js:40-42`
**Issue:** The non-recursion property the phase brief specifically asks reviewers to confirm ("`data-sigil-error` is intentionally NOT included [in `observedAttributes`], so writing it from inside a render cannot re-enter `attributeChangedCallback`") is currently protected only by a code comment and by the fact that the existing tests happen not to hang if it regresses. There is no direct, fast, unit-level assertion that would catch a future PR accidentally adding `'data-sigil-error'` to the array (e.g., during a refactor that "helpfully" observes everything the element writes).
**Fix:** A cheap addition to `test/element-docs.test.js` (which already parses `observedAttributes` from source text) or a small new unit test:
```js
it('data-sigil-error is never observed (prevents attributeChangedCallback re-entrancy)', () => {
  const codeAttributes = parseObservedAttributes(elementSource);
  expect(codeAttributes.has('data-sigil-error')).toBe(false);
});
```

### IN-02: No automated coverage of "error state clears when the triggering attribute is removed"

**File:** `test/browser/element.test.js:639-700`
**Issue:** The D-92 test covers the error path (invalid planet → `data-sigil-error` set) and the recovery path (setting a *valid* planet afterwards clears the error). It does not cover the adjacent, equally real transition of removing `statement`/`planet` entirely after an error, which routes through the inert branch (`sigil-spinner-element.js:86-90`) rather than a second `generateSigil` call. I manually verified this transition behaves correctly (error attribute clears, content stays empty, no exception) with a scripted Playwright probe, but the automated suite doesn't exercise it, so a regression there wouldn't be caught by `npm test`.
**Fix:** Extend the existing D-92 test (or add a sibling case) with:
```js
await page.evaluate(() =>
  document.getElementById('errored').removeAttribute('planet'),
);
const afterRemoval = await page.evaluate(() => {
  const el = document.getElementById('errored');
  return { errorCode: el.getAttribute('data-sigil-error'), children: el.children.length };
});
expect(afterRemoval.errorCode).toBeNull();
expect(afterRemoval.children).toBe(0);
```

---

_Reviewed: 2026-08-09T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
