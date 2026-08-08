---
phase: 05-publish-ready-source
reviewed: 2026-08-08T15:35:00Z
depth: standard
files_reviewed: 21
files_reviewed_list:
  - README.md
  - bin/sigil-spinner.js
  - src/data/kamea.js
  - src/generate.js
  - src/index.js
  - src/path/buildPath.js
  - src/render/coords.js
  - src/render/curve.js
  - src/render/glyphs.js
  - src/render/json.js
  - src/render/svg.js
  - src/text/fold.js
  - src/text/normalize.js
  - test/__file_snapshots__/worked-example.working.json
  - test/browser/accessible-name.test.js
  - test/citations.test.js
  - test/cli/cli.test.js
  - test/data/kamea.test.js
  - test/determinism.test.js
  - test/render/__snapshots__/json.test.js.snap
  - test/render/json.test.js
  - test/render/svg.test.js
findings:
  critical: 1
  warning: 5
  info: 0
  total: 6
status: issues_found
---

# Phase 05: Code Review Report

**Reviewed:** 2026-08-08T15:35:00Z
**Depth:** standard
**Files Reviewed:** 21
**Status:** issues_found

## Summary

This is a re-review of the phase, overwriting the prior 05-REVIEW.md. The
prior round's CR-01 (whitespace-excerpt defeats R1) and WR-01
(unrelated-neighbour excerpt validates a token) findings against
`test/citations.test.js` are confirmed **remediated**:
`excerptMatchesHeading` now requires a non-empty, real-prefix match against
an actual heading (not `String.includes('')`'s always-true trap), and
`orderedCandidateExcerpts`'s `MAX_EXCERPT_TOKEN_DISTANCE = 20` window,
tried in distance order and checked against the *correct* target file's own
headings, closes the "any nearby quote from an unrelated citation can back
this token" gap. All nine new soundness tests pass, and the primary guard
(`npx vitest run test/citations.test.js`) is green against the live
`src/`/`bin/` tree (34+ real citation sites, zero findings).

Tracing the remediated logic against inputs the checker's own test suite
does not exercise turned up further soundness/coverage gaps in the checker
(none currently exploited, all latent), plus one confirmed crash-class
defect elsewhere in the library surfaced while probing input-validation
boundaries the citation-checker work drew attention to. The prior review's
WR-02 (`kameaVersion` hardcoded to `DEFAULT_KAMEA_SET`) and IN-01
(`escapeXml`'s non-stripping of control characters) remain valid,
unaddressed observations from the last round and are not re-litigated here
in full — see the prior commit history for their original write-ups; both
are still low-severity/no-currently-reachable-path items, not re-included
below to keep this report focused on what's new.

## Critical Issues

### CR-01: `generateSigil(statement, planet, null)` crashes with a raw `TypeError`, not a `SigilError`

**File:** `src/generate.js:148-178` (`resolveOptions`), called from `src/generate.js:224`
**Issue:** `generateSigil`'s third parameter defaults to `{}` only when the
argument is `undefined` (`options = {}`) — JavaScript default parameters do
not apply to an explicitly passed `null`. When a caller passes `null` for
`options` (a common, reasonable JS pattern for "no options" — e.g.
`generateSigil(s, p, opts || null)`), `resolveOptions` immediately evaluates
`options[name]` on `null` and throws an unhandled `TypeError: Cannot read
properties of null (reading 'curve')`. Reproduced directly against the
current tree:

```
$ node -e "import('./src/index.js').then(({generateSigil}) => { try { generateSigil('I WILL SUCCEED','saturn', null); } catch (e) { console.log(e.constructor.name, e.message); } });"
TypeError Cannot read properties of null (reading 'curve')
```

This directly contradicts the library's own documented contract — README's
"Errors and Exit Codes" states "Every library error is a `SigilError` with a
stable `.code`," and the architecture doc's "Anti-Pattern 3: CLI-Only
Validation" posture is that all input validation, including malformed
options, belongs in the library and must surface as a typed, catchable
error, never a raw engine exception. This is exactly the review's own
Critical bucket language: "crashes... null pointer dereferences that
crash."

**Fix:** Normalize `null` to `{}` before it is ever indexed:

```js
function resolveOptions(options) {
  const opts = options ?? {};
  const resolved = {};
  for (const [name, expected] of Object.entries(KNOWN_OPTIONS)) {
    const value = opts[name];
    // ...
```

or widen the guard at the `generateSigil` call site itself:

```js
export function generateSigil(statement, planet, options = {}) {
  const safeOptions = options ?? {};
  // ... resolveOptions(safeOptions) below
```

Add a regression test alongside the existing `E_INVALID_OPTION` suite in
`test/cli/cli.test.js` asserting `generateSigil(STATEMENT, 'saturn', null)`
either resolves under options-absent semantics or throws `SigilError` with a
`.code` — never a bare `TypeError`.

## Warnings

### WR-01: `excerptMatchesHeading` enforces no minimum excerpt length — the guard against short, coincidentally-matching excerpts is convention, not code

**File:** `test/citations.test.js:276-295`
**Issue:** R1's evidence rule accepts any excerpt that is non-empty
(`trimmed.length === 0` is the only length check) and a `startsWith` prefix
of *some* heading in the target file. The function's own doc comment
justifies the absence of a length floor by observing "the shortest excerpt
any real citation uses is 19 characters" — that is an empirical fact about
today's tree, not an enforced invariant. A future citation with a short
excerpt (3-6 characters — plausible for an abbreviation, acronym, or
truncated paste) that happens to be a prefix of some unrelated heading in
the same target file would pass R1 silently; nothing in the code
distinguishes that from a genuine citation. The CR-01-lineage fixture tests
("a", "  ") only prove the checker rejects the *degenerate* extreme against
one specific fixture's headings — they do not establish a length floor that
generalizes to future citations in the live tree.
**Fix:** Add an explicit minimum-length floor derived from measurement, the
same way `MAX_EXCERPT_TOKEN_DISTANCE` was derived from the 4-5 character
observed citation distance:

```js
const MIN_EXCERPT_LENGTH = 10; // headroom under the observed 19-char floor

function excerptMatchesHeading(excerpt, headings) {
  const trimmed = excerpt.trim();
  if (trimmed.length < MIN_EXCERPT_LENGTH) return false;
  return headings.some((h) => h.startsWith(trimmed));
}
```

### WR-02: R2's label-backing check does not verify the backing citation targets the same document the bare label refers to

**File:** `test/citations.test.js:429-456`
**Issue:** `backed = validExcerpts.some((excerpt) => excerpt.startsWith(label))`
checks only that *some* R1-valid excerpt anywhere in the file begins with
the bare label's literal text (e.g. `"Pitfall 7"`). It never checks which
target document that excerpt was resolved against. A file could establish a
valid citation for `"Pitfall 7: <heading from PITFALLS.md>"` once, then
later use a bare `Pitfall 7` label intending an entirely different document
(a different research doc that happens to number its own pitfalls
identically) — R2 would accept it as "backed" on pure string-prefix
coincidence, never confirming the label and its backing excerpt agree on
which file is actually being cited. Not hit by the current tree (spot-check:
no duplicate-numbered-but-different-document labels exist today), but it is
a real soundness gap in a tool whose entire purpose is verifying that
citations point at what they claim to.
**Fix:** Thread the target file path through to `validExcerpts` (store
`{ excerpt, targetPath }` pairs instead of bare strings) and require R2's
`backed` check to also confirm a matching excerpt's `targetPath` is
consistent with the document(s) cited near the bare label — or, at minimum,
document this as an accepted scope limitation in the file's own header
comment rather than leaving it implicit.

### WR-03: Citation checker only scans full-line comments — a trailing inline comment on a code line is entirely invisible to R1/R2

**File:** `test/citations.test.js:142-177` (`extractCommentBlobs`)
**Issue:** The block-comment branch only fires when a *trimmed line* starts
with `/*`/`/**`, and the `//`-run branch only fires when a trimmed line
starts with `//`. A trailing comment sharing a line with code — e.g.
`const x = compute(); // see .planning/foo.md "Some Heading"` — never enters
either branch (the line starts with `const`, not `/*` or `//`), so the
`i++` fallthrough silently skips it entirely. Any citation placed as a
trailing comment — correct or malformed — is therefore completely exempt
from both R1 and R2; the guard the checker exists to provide can be
bypassed just by attaching the comment to the end of a code line instead of
giving it its own line. Not currently exploited (the codebase consistently
uses full-line JSDoc/`//` comments), but it is an unenforced assumption
about comment placement, not a checked one, and the file's own header
comment (lines 6-29) describes the extraction as if it were exhaustive.
**Fix:** Either (a) document this explicitly as an accepted scope
limitation in the header comment, or (b) extend `extractCommentBlobs` to
also capture trailing `//...` content following code on the same line.

### WR-04: The file's own top-of-file rule description (R1) no longer matches its implementation — "substring" vs. actual "prefix"

**File:** `test/citations.test.js:13-17` vs. `test/citations.test.js:291-295`
**Issue:** The header doc comment states R1 requires "a double-quoted
excerpt in the same citation window whose text is a substring of a real
heading line in that target file." The actual implementation
(`excerptMatchesHeading`) is strictly narrower: it requires the excerpt to
be a **prefix** of a heading (`heading.startsWith(trimmed)`), not merely a
substring anywhere within it — confirmed by the "rejects an excerpt that
appears mid-heading but does not start it" test (line 535: `"Boundaries"`,
a real substring of `"Internal Boundaries"`, is correctly rejected). In a
file whose entire purpose is enforcing that comments describe reality
precisely, having its own top-level rule description drift out of sync with
its own enforced behavior is a maintainability hazard for whoever next
touches this checker and trusts the header over the code.
**Fix:** Update the header comment's R1 description to say "is a prefix of
a real heading line," matching `excerptMatchesHeading`'s actual (and
stricter, correct) behavior.

### WR-05: `--output ''` (explicit empty string) silently falls back to stdout instead of erroring, inconsistent with `--id-prefix ''`'s explicit rejection

**File:** `bin/sigil-spinner.js:181-188`
**Issue:**

```js
if (outputArg) {
  writeFileSync(outputArg, artifact);
} else {
  process.stdout.write(artifact);
}
```

treats an empty string the same as "flag not supplied" because an empty
string is falsy. `node:util.parseArgs` accepts `--output ''` as a valid
`type: 'string'` flag with an empty value (it only rejects a flag with *no*
value at all, already caught as `E_CLI_USAGE`). So `sigil-spinner "..."
--planet saturn --output ""` silently writes the artifact to stdout rather
than reporting a usage error about an invalid empty output path —
inconsistent with `--id-prefix ''`, which is explicitly validated and
rejected in the library layer with `E_INVALID_OPTION`. This is a minor
surprise rather than data loss (nothing is destroyed), but it is unvalidated
input silently changing observable behavior in a way the user almost
certainly did not intend.
**Fix:** Distinguish "flag absent" from "flag present but empty" using
`!== undefined` rather than truthiness, and diagnose the empty case
explicitly:

```js
if (outputArg !== undefined) {
  if (outputArg.length === 0) {
    diagnose(E_CLI_USAGE, '--output requires a non-empty file path', CLI_USAGE_EXIT_CODE);
  }
  writeFileSync(outputArg, artifact);
} else {
  process.stdout.write(artifact);
}
```

---

_Reviewed: 2026-08-08T15:35:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
