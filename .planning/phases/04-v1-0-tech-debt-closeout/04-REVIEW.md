---
phase: 04-v1-0-tech-debt-closeout
reviewed: 2026-08-07T00:00:00Z
depth: deep
files_reviewed: 5
files_reviewed_list:
  - src/generate.js
  - src/index.js
  - bin/sigil-spinner.js
  - test/cli/cli.test.js
  - README.md
findings:
  critical: 0
  warning: 2
  info: 1
  total: 3
status: issues_found
---

# Phase 4: Code Review Report

**Reviewed:** 2026-08-07T00:00:00Z
**Depth:** deep
**Files Reviewed:** 5
**Status:** issues_found

## Summary

Reviewed the five source files touched by Phase 4 (v1.0 Tech Debt Closeout) against the
diff `af07b8e..HEAD`, cross-referencing plans 04-01/02/03, the decisions they record
(D-49 through D-56), and the STRIDE threat registers attached to each plan. Verified
behavior by running the full suite (`1435 passed`, 0 failures), `tsc --checkJs`
(clean), `eslint` (clean), and by hand-executing the `resolveOptions`/validation-order/
exit-map claims directly against the running code rather than trusting the plan's
prose.

The four highest-risk items called out for this review all check out as correctly
implemented and correctly scoped:

1. **`resolveOptions` absent-check widening** (`src/generate.js:139`) — the check
   `value === undefined || value === ABSENT_DEFAULT_BY_TYPE[expected]` is genuinely
   type-scoped for the current `KNOWN_OPTIONS` table. For boolean options
   (`curve`, `glyph`, `title`) the absent-sentinel is `false`; treating an
   explicit `false` as "absent" is a no-op because the resolved value is `false`
   either way, and there is no code anywhere downstream that distinguishes
   "explicitly `false`" from "defaulted to `false`" — so no legitimate boolean
   value is silently swallowed. For the one string option (`idPrefix`), the
   sentinel is `null`; an empty string (`''`) is *not* equal to `null`, so it
   still falls through to the type/empty-string checks and still throws
   `E_INVALID_OPTION` (verified live and by the existing `idPrefix: ''` test).
   `{ glyph: null }` still throws (verified live, and the pre-existing regression
   test at `test/cli/cli.test.js:506-517` is byte-identical to the pre-phase
   version — confirmed via `git show af07b8e:test/cli/cli.test.js`, only its line
   number shifted). No BLOCKER here. See WR-01 below for a forward-looking design
   note.
2. **Validation reordering** (`src/generate.js:218`) — confirmed via diff that the
   *only* structural change is relocating the `gridSize(planet)` call from after
   the empty-sequence block to before it. Its position relative to
   `resolveOptions` (option validation) is unchanged in both the before and after
   versions — `resolveOptions` still runs first in both. I traced every guard
   pair by hand: statement-presence, planet-presence, and option-validity all
   report exactly the same codes as before for every single-fault input, and the
   *only* observable change is the documented one — a statement that is both an
   unknown planet and an empty sequence now reports `E_UNKNOWN_PLANET` instead of
   `E_EMPTY_SEQUENCE`. No other input combination's reported code changed.
3. **The inverted `idPrefix: null` test** — the new assertion at
   `test/cli/cli.test.js:583-591` doesn't just assert `not.toThrow()`; it also
   asserts `working.render.idPrefix` is `null` after the call, which actually
   proves the round-trip contract rather than merely no longer failing. The
   sibling boolean-null guard (`glyph: null` throws) is verified byte-identical
   to its pre-phase source.
4. **The rekeyed `EXIT_CODES` map** (`bin/sigil-spinner.js:64-70`) — now keyed by
   computed properties from the imported `E_*` constants rather than string
   literals. Reasoned through both drift scenarios: renaming the *export name* in
   `src/errors.js` fails loudly at ESM import time (a `SyntaxError` before the
   script even runs); renaming the *string value* while keeping the export name
   propagates automatically to both the map key and the thrown error's `.code`,
   which is strictly better than the pre-phase behavior (a hardcoded literal key
   would have silently mismatched and fallen through to the generic exit-1
   default). This is the fix working as intended.

Two WARNING-level findings and one INFO-level finding follow — none blocks
shipping this phase, but they're real gaps.

## Warnings

### WR-01: `resolveOptions`'s absent-sentinel table conflates "absent" with "equals the type's default," which is only safe by accident of the current option set

**File:** `src/generate.js:80-83, 139`
**Issue:** `ABSENT_DEFAULT_BY_TYPE` doubles as both (a) the value substituted when
an option is genuinely absent, and (b) the sentinel `resolveOptions` treats as
proof an option is absent. For the two types that exist today (`boolean` →
`false`, `string` → `null`) this is provably harmless, per the Summary above. But
the pattern itself — "a caller-supplied value that happens to equal the type's
default is indistinguishable from omission" — is a general-purpose landmine: the
first time a `number`-typed option is added with a semantically meaningful `0`
default (or a string-typed option whose valid domain legitimately includes its
own sentinel), a caller explicitly passing that value will be silently coerced
through the "absent" branch instead of being validated as "present." Nothing in
`resolveOptions`'s code or JSDoc would need to change for that regression to
happen — it would be introduced entirely by adding a row to `KNOWN_OPTIONS`.
**Fix:** Not urgent to change now (D-49's chosen approach is correct for the
current table), but worth a one-line JSDoc caveat on `ABSENT_DEFAULT_BY_TYPE`
flagging the constraint explicitly, e.g.:
```js
// CONSTRAINT: any type added here must have an absent-sentinel that is NOT
// also a value a caller could legitimately want to pass explicitly — the
// resolveOptions absent-check cannot otherwise distinguish "omitted" from
// "explicitly set to the default."
```
so the next person extending `KNOWN_OPTIONS` inherits the constraint on purpose
rather than rediscovering it as a bug report.

### WR-02: No regression test proves option-validation still outranks the *relocated* planet-identity check

**File:** `test/cli/cli.test.js`
**Issue:** The new "Validation ordering" describe block (`test/cli/cli.test.js:377-460`)
proves `E_INVALID_OPTION` still outranks `E_EMPTY_SEQUENCE` (both statement/content
faults), and proves `E_UNKNOWN_PLANET` now outranks `E_EMPTY_SEQUENCE`. But no test
exercises the interaction the reorder actually introduces risk around: an
invocation that is *both* an invalid option *and* an unknown planet (e.g.
`generateSigil('AEIOU', 'pluto', { glyph: 'yes' })`). I traced this by hand — the
code is unambiguous, since `resolveOptions(options)` is called before
`gridSize(planet)` in both the pre- and post-phase versions — so it currently
resolves to `E_INVALID_OPTION`, correctly. But that is exactly the kind of
"provably fine today, silently wrong after the next refactor" gap this phase's own
threat model (T-04-08) exists to prevent, and it is the one two-way combination the
reorder task actually touches that has zero test coverage.
**Fix:** Add one case to the "Validation ordering" describe block:
```js
it('still throws E_INVALID_OPTION for an unknown planet with an invalid option — option validation outranks planet identity', () => {
  expect(() =>
    generateSigil('AEIOU', 'pluto', /** @type {any} */ ({ glyph: 'yes' })),
  ).toThrowError(expect.objectContaining({ code: 'E_INVALID_OPTION' }));
});
```

## Info

### IN-01: README.md:414 — one continuation line lost its list-item indentation during the prettier reformat pass

**File:** `README.md:412-415`
**Issue:** Inside the numbered list item documenting the `Đ`/`Ð` confusable
equivalence, every line of the paragraph is indented 3 spaces to align under the
list marker except the mid-sentence continuation line:
```
   The visual confusables `Đ` (U+0110) and `Ð` (U+00D0) are deliberately
   equivalent under this table — both fold to `D` — so `generateSigil('ĐHT',
planet)` and `generateSigil('ÐHT', planet)` produce byte-identical SVG on
   every planet.
```
This is harmless to rendering — CommonMark strips leading whitespace on soft-wrapped
paragraph continuation lines regardless, and `npx prettier --check README.md`
passes clean — but it's a visible inconsistency in the source that doesn't match
the surrounding lines' indentation, and it's the only line in the whole diff where
this happened (every other continuation line in the reformatted tables/lists kept
its indent). Worth a one-line fix for source hygiene.
**Fix:** Re-indent the line to match its paragraph:
```
   The visual confusables `Đ` (U+0110) and `Ð` (U+00D0) are deliberately
   equivalent under this table — both fold to `D` — so `generateSigil('ĐHT',
   planet)` and `generateSigil('ÐHT', planet)` produce byte-identical SVG on
   every planet.
```

---

_Reviewed: 2026-08-07T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: deep_
