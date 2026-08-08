---
phase: 05-publish-ready-source
reviewed: 2026-08-08T00:00:00Z
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
  warning: 2
  info: 1
  total: 4
status: issues_found
---

# Phase 05: Code Review Report

**Reviewed:** 2026-08-08T00:00:00Z
**Depth:** standard
**Files Reviewed:** 21
**Status:** issues_found

## Summary

This phase's actual code delta (verified against `git diff 9d05e225d^..HEAD`)
is small and precise: `src/data/kamea.js` gains a frozen
`KAMEA_SET_VERSIONS` sidecar and threads `kameaVersion` through
`src/generate.js` and `src/render/json.js`; `bin/sigil-spinner.js` and
`src/render/svg.js` gain `--title`/`options.title`-driven `role="img"` /
`aria-labelledby` / `<title id="...">` wiring; `test/citations.test.js` is a
new mechanical citation-integrity checker; and six other `src/` files
(`buildPath.js`, `coords.js`, `curve.js`, `glyphs.js`, `fold.js`,
`normalize.js`, `index.js`) received comment-only citation-repair edits with
zero functional diff (confirmed by direct diff inspection).

The runtime code is sound. I traced every new attribute-value construction
in `renderSvg` (`idAttr`, `titleId`, `titleIdAttr`, `roleAttr`,
`ariaLabelledByAttr`, `title`) and confirmed the single escaped value
(`escapedIdPrefix`) correctly feeds every derived attribute, that
`escapeXml` is invoked at exactly the two call sites the test suite pins,
and that a hostile `idPrefix` (`x"><script>a</script>`) cannot terminate any
of the four attributes it now feeds. `kameaVersion` is a static in-source
literal with no filesystem/env/clock/subprocess/manifest read anywhere in
its three producing files, guarded by a dedicated regex-based test, and
never varies by resolved kamea `set` today because no public API exposes
one. All 242 tests across the reviewed files pass locally.

The one real defect is in the phase's other deliverable: the citation
integrity checker itself (`test/citations.test.js`, MAINT-01) can be
satisfied by a citation that provides no actual verification, because its
R1 rule accepts a whitespace-only quoted excerpt as proof that a markdown
target was checked. This directly undermines the anti-appeasement purpose
the checker was built for — see CR-01.

## Critical Issues

### CR-01: Citation checker's R1 rule is defeated by a whitespace-only quoted excerpt

**File:** `test/citations.test.js:329-347`
**Issue:** R1 requires that a cited markdown token be paired, in its
citation window, with a double-quoted excerpt that is "a substring of a
real heading line in that target file." The check is:

```js
while ((quoteMatch = QUOTE_RE.exec(windowText)) !== null) {
  const excerpt = quoteMatch[1].trim();
  if (headings.some((h) => h.includes(excerpt))) {
    resolved = true;
    resolvedExcerpt = excerpt;
    break;
  }
}
```

`QUOTE_RE` (`/"([^"]+)"/g`) matches any quoted span with one or more
non-quote characters — including a quote containing only whitespace, e.g.
`"  "`. After `.trim()`, `excerpt` becomes the empty string `''`. Because
`String.prototype.includes('')` is **always `true`** for any non-empty
string (verified directly: `'Kamea Source Lineage'.includes('') === true`),
`headings.some((h) => h.includes(''))` resolves to `true` against *any*
heading in the target file, as long as the target file has at least one
heading (true for every real `.md` file this checker validates against).

Concretely: a comment reading `... per .planning/foo.md ("  ") ...` — a
fully-qualified path to a real file, paired with a quote that trims to
empty — passes R1 unconditionally, with **zero** verification that any real
excerpt was ever checked against a real heading. This is exactly the
"citation rot" failure mode MAINT-01 exists to prevent: a stale or
never-accurate citation can be written once with a throwaway blank quote and
will pass this guard forever, silently, regardless of what happens to the
target document's headings. It is not currently exploited anywhere in
`src/`/`bin/` (grepped for whitespace-only quoted spans — none found), but
nothing in the checker prevents it, and the anti-appeasement floor
(`MINIMUM_CITATION_SITE_COUNT`) does not catch it either, since the token
still counts toward `siteCount` and is marked "resolved."

**Fix:** Reject a trimmed excerpt that is empty (or below some minimum
length) before running the `headings.some(...)` check, e.g.:

```js
const excerpt = quoteMatch[1].trim();
if (excerpt.length === 0) continue; // never treat a blank quote as a valid excerpt
if (headings.some((h) => h.includes(excerpt))) {
  resolved = true;
  resolvedExcerpt = excerpt;
  break;
}
```

Add a regression case (a synthetic fixture file, or an inline string test
against the extraction logic) asserting that a `"path.md" ("  ")`-shaped
comment is rejected, so this loophole cannot silently reopen.

## Warnings

### WR-01: R1's fallback citation window can validate a token against an unrelated neighboring quote

**File:** `test/citations.test.js:202-230`, `272-347`
**Issue:** When a markdown token does not sit inside an enclosing
parenthetical, `citationWindow` falls back to a ±200-character span of the
*normalized comment blob* around the token — not scoped to only the
citation the author intended. If two separate citations to two different
target files sit within 200 characters of each other (plausible in this
codebase's dense multi-citation JSDoc blocks, e.g. `curve.js`'s header,
which cites three different documents within a few lines), the window for
token A can contain a quoted excerpt that was actually written for citation
B. If that excerpt happens to also be a substring of some heading in A's
target file (more likely than it sounds, since many headings share common
short phrases), R1 will validate token A using an excerpt that was never
actually about A. This is not proven to fire on any current citation (all
242 tests pass), but it is a live design gap distinct from CR-01's
empty-string case, and the checker's own stated purpose ("every markdown
token... have a double-quoted excerpt in the same citation window") relies
on the window being scoped to the citation, not to "whatever text happens
to be nearby."
**Fix:** Prefer a tighter default window (fall back only within the same
comment-line run the token appears on, or require the excerpt to be the
*nearest* quote to the token rather than the first one that happens to
resolve), or require each md-token + quote pairing to be positionally
adjacent (e.g., quote immediately follows the token, allowing only a short
separator) rather than "anywhere within 200 characters."

### WR-02: `kameaVersion` is hardcoded to the default kamea set, not the resolved one

**File:** `src/generate.js:295-296`
**Issue:**

```js
kameaSet: DEFAULT_KAMEA_SET,
kameaVersion: KAMEA_SET_VERSIONS[DEFAULT_KAMEA_SET],
```

`kameaVersion` is looked up by the constant `DEFAULT_KAMEA_SET`, not by
whatever kamea set the sigil was actually traced against. Today this is
harmless — `generateSigil`'s public `GenerateOptions`/`KNOWN_OPTIONS` expose
no `set` selector, so `DEFAULT_KAMEA_SET` and "the resolved set" are always
the same value, and `kameaSet: DEFAULT_KAMEA_SET` on the line above has the
identical latent issue. But `src/data/kamea.js`'s own `resolveSet`/`opts.set`
plumbing (and its header comment: "the shape exists so a future verified set
... can be added without reshaping this API") signals that a `set` option is
an anticipated future addition. If/when a `set` option is threaded onto
`GenerateOptions`, this line will silently continue reporting the
*default* set's provenance date even when a different, resolved set
produced the sigil — a `kameaVersion` that lies about which set's
verification state it names is worse than a missing one, since a consumer
would reasonably trust it as accurate. Nothing in the current test suite
(`kamea.test.js`'s `KAMEA_SET_VERSIONS names exactly the same set of keys as
KAMEA_SETS` guard) would catch this, since it only checks key parity, not
that `generate.js` reads the *resolved* key.
**Fix:** No code change needed today (there is no reachable path that
disagrees), but leave a load-bearing comment at this call site — matching
this codebase's own convention elsewhere (e.g. `generate.js`'s "a future
reorder of this spread is visibly a security-relevant change" note) —
flagging that `kameaSet`/`kameaVersion` must be re-derived from the actual
resolved set the moment a `set` option is added, not left pointing at
`DEFAULT_KAMEA_SET`.

## Info

### IN-01: `escapeXml` does not strip XML-illegal control characters, and the new ARIA wiring widens where that matters

**File:** `src/render/svg.js:642-686` (new call sites), `src/render/escapeXml.js:12-27` (pre-existing)
**Issue:** `escapeXml` only escapes the five reserved XML characters
(`&<>"'`). It performs no filtering of C0 control characters (e.g. U+0000,
U+0001) that are outright illegal in well-formed XML 1.0 content and
*cannot* be made legal via entity escaping (`&#0;` is itself disallowed).
This limitation pre-dates this phase (it already applied to `idPrefix`'s
root `id` and the `<title>` text content), but this phase's new wiring
means the same unescaped `escapedIdPrefix` value now also flows into two
*additional* attribute positions — `<title id="...">` and
`aria-labelledby="..."` — so the blast radius of a caller supplying a
control character in `idPrefix` (a non-empty string, not otherwise
restricted by `E_INVALID_OPTION`) is now four attribute values instead of
one. In practice this requires a caller to deliberately pass a control
character in `idPrefix`, which is a low-likelihood, low-impact input (no
plausible way to reach XSS through it, since the five HTML/XML-structural
characters remain correctly escaped) — hence Info rather than a security
finding — but it means the artifact's "self-contained... viewBox-based"
well-formedness guarantee is not fully closed for this input class.
**Fix:** Not required for this phase; if pursued, strip or reject C0
control characters (outside `\t`, `\n`, `\r`) in `escapeXml`, or validate
`idPrefix` against an XML `Name`-safe character class at the
`E_INVALID_OPTION` boundary in `src/generate.js`.

---

_Reviewed: 2026-08-08T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
