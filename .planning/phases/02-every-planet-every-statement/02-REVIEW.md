---
phase: 02-every-planet-every-statement
reviewed: 2026-08-06T18:20:00Z
depth: standard
files_reviewed: 29
files_reviewed_list:
  - bin/sigil-spinner.js
  - src/data/kamea.js
  - src/data/pythagorean.js
  - src/errors.js
  - src/generate.js
  - src/index.js
  - src/path/buildPath.js
  - src/render/coords.js
  - src/render/escapeXml.js
  - src/render/json.js
  - src/render/svg.js
  - src/text/fold.js
  - src/text/normalize.js
  - test/cli/cli.test.js
  - test/data/kamea.test.js
  - test/data/pythagorean.test.js
  - test/determinism.test.js
  - test/e2e/phase2-tracer.test.js
  - test/e2e/saturn-tracer.test.js
  - test/path/buildPath.test.js
  - test/render/coords.test.js
  - test/render/json.test.js
  - test/render/svg.test.js
  - test/text/fold.test.js
  - test/text/normalize.test.js
  - package.json
  - eslint.config.js
  - tsconfig.json
  - vitest.config.js
  - README.md
findings:
  critical: 2
  warning: 7
  info: 3
  total: 12
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-08-06T18:20:00Z
**Depth:** standard
**Files Reviewed:** 29
**Status:** issues_found

## Summary

This review covers the full Phase 2 file set (`bin/`, `src/`, `test/`, and config/README) at standard depth. It supersedes a narrower-scope prior pass on this same path: three previously-flagged items (dead perpendicular-direction logic in `loopLayer`, the single-node end-bar offset sharing the loop-radius constant, and thin repeat-carrying coverage in the determinism matrix) have since been fixed in the current code — `loopDirection` now implements a real three-step travel-based fallback, `SINGLE_NODE_END_OFFSET_FRACTION` is its own constant, and `test/determinism.test.js` now runs a second `'BKT RISES'` repeat-carrying matrix across all seven planets. Those are confirmed resolved and are not repeated below.

The core derivation pipeline (`text/normalize.js`, `text/fold.js`, `data/kamea.js`, `data/pythagorean.js`, `path/buildPath.js`, `render/*.js`, `generate.js`) is careful and internally consistent with its own documented contracts, and no `Date`/`Math.random`/locale-sensitive nondeterminism sources were found. However, real defects remain in two places: `bin/sigil-spinner.js` has two argv/stdin-handling code paths that sit **outside** its own `try/catch`, so an ordinary usage mistake (a typo'd flag, or `-` with nothing piped into stdin) crashes with a raw Node stack trace instead of the module's own documented clean-diagnostic contract (D-12) — the most user-facing defect in the phase. Separately, the text-folding/classification layer has a genuine, verifiable provenance bug: `normalize()` calls `.toUpperCase()` on already-folded text, which silently expands certain Unicode ligatures (e.g. U+FB01 `ﬁ` → `FI`) into multiple classified letters whose provenance record still claims a single-character fold — contradicting `fold.js`'s own stated "never relies on native `toUpperCase` to fold" rule and breaking the D-25 provenance guarantee for that input class. A related gap (Latin stroke letters silently struck as `non-letter`, with one of them a visual confusable of an already-mapped letter) and a miscounted `E_EMPTY_SEQUENCE` message round out the Warning tier.

## Critical Issues

### CR-01: `parseArgs()` is not exception-safe — any malformed CLI invocation crashes with a raw stack trace instead of a clean usage error

**File:** `bin/sigil-spinner.js:49-56`
**Issue:** `parseArgs({ allowPositionals: true, options: {...} })` runs at module top level, entirely outside the script's `try { ... } catch (err) { ... }` block (which only starts at line 68). Node's `parseArgs` defaults to `strict: true`, so it **throws** for an unrecognized flag (e.g. a typo like `--planett`), a missing value for a `type: 'string'` option (e.g. `sigil-spinner "text" --planet` with nothing after `--planet`, or a bare trailing `--output`), or any other malformed invocation. None of that is caught here, so the process crashes with Node's default uncaught-exception handling — a raw JS stack trace on stderr — instead of going through the tool's own documented diagnostic contract (the module's own header comment: "every error/warning/usage message goes to `process.stderr`", plus the `EXIT_CODES`/`DEFAULT_ERROR_EXIT_CODE` scheme). This is a very common real-world trigger (any mistyped flag) and it is untested: `test/cli/cli.test.js`'s "missing `--planet`" case never passes `--planet`  at all (which `parseArgs` accepts fine, since `planet` isn't `required` at the parse layer) — it never exercises a genuinely malformed flag.
**Fix:**
```js
let values, positionals;
try {
  ({ values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      planet: { type: 'string' },
      json: { type: 'boolean', default: false },
      output: { type: 'string' },
    },
  }));
} catch (err) {
  process.stderr.write(`E_USAGE: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(2);
}
```

### CR-02: Reading stdin for the `-` sentinel happens outside the try/catch, so a stdin read failure crashes the process

**File:** `bin/sigil-spinner.js:65-66`
**Issue:** `readFileSync(0, 'utf-8')` runs before the `try` block starts (line 68). If this call throws — e.g. the well-documented Node.js behavior where `fs.readFileSync(0)` can throw `EAGAIN` when stdin is a TTY and nothing was piped in (a plausible mistake: running `sigil-spinner - --planet saturn` interactively without piping input), or any other stdin read error (closed/broken pipe, permission error) — the exception is unhandled and crashes with a raw stack trace, bypassing the CLI's documented `CODE: message` diagnostic format and controlled exit-code contract entirely.
**Fix:**
```js
const rawStatement = positionals[0];

try {
  const statement = rawStatement === '-' ? readFileSync(0, 'utf-8') : rawStatement;
  const { svg, working } = generateSigil(statement, planetArg);
  // ...
} catch (err) {
  // existing catch body
}
```

## Warnings

### WR-01: `process.exit()` immediately after `process.stderr.write()` risks truncating the diagnostic message

**File:** `bin/sigil-spinner.js:82-83, 85, 87-89`
**Issue:** In every error branch, `process.stderr.write(...)` is immediately followed by `process.exit(...)`. `Writable.write()` is not guaranteed to have flushed by the time it returns, particularly when stderr is a pipe (e.g. `sigil-spinner ... 2>&1 | tee log.txt`, exactly the kind of composition this tool is designed for). `process.exit()` terminates the process immediately and can truncate output that hasn't finished writing to a non-blocking pipe, undermining the tool's own diagnostic-reliability contract (D-12).
**Fix:** Set `process.exitCode` and let the event loop drain naturally instead of forcing an immediate exit:
```js
process.stderr.write(`${err.code}: ${err.message}\n`);
process.exitCode = EXIT_CODES[err.code] ?? DEFAULT_ERROR_EXIT_CODE;
```

### WR-02: Extra positional CLI arguments are silently discarded — a forgotten quote silently changes the statement instead of failing loudly

**File:** `bin/sigil-spinner.js:65`
**Issue:** `const rawStatement = positionals[0];` only reads the first positional; `positionals[1..]` are silently dropped with no warning. A user who forgets to quote a multi-word statement — `sigil-spinner I will succeed --planet saturn` instead of `sigil-spinner "I will succeed" --planet saturn` — silently gets a sigil generated from just `"I"` instead of an error. Given the project's stated correctness bar ("no 'close enough'"), silently truncating the intention statement without any diagnostic is a real footgun at the CLI boundary.
**Fix:**
```js
if (positionals.length > 1) {
  process.stderr.write(
    `E_USAGE: unexpected extra argument(s) after the statement: ${JSON.stringify(positionals.slice(1))}. Did you forget to quote the statement?\n`,
  );
  process.exit(2);
}
```

### WR-03: `normalize()`'s `.toUpperCase()` is an undocumented second fold path — it silently expands compatibility ligatures and breaks D-25 provenance

**File:** `src/text/normalize.js:83` (contradicts the claim in `src/text/fold.js:53-54`)
**Issue:** `fold.js`'s doc comment states folding is exactly `TRANSLITERATION_MAP` + NFD-strip and explicitly "Never relies on native `toUpperCase` to fold ß." But `normalize()` calls `folded.toUpperCase()`, and JS's `toUpperCase()` performs its own Unicode special-casing expansions that NFD canonical decomposition does not touch — for example `'ﬁ'.toUpperCase()` (LATIN SMALL LIGATURE FI) yields the two-character string `'FI'`. Since `ﬁ` isn't in `TRANSLITERATION_MAP` and NFD (canonical, not compatibility, decomposition) leaves it untouched, `foldStatement` returns `folded: 'ﬁ'` for it — then `normalize()`'s `.toUpperCase()` silently expands that single character into two classified letters (F kept, I struck as a vowel). Two problems follow: (1) the effective folding rule is no longer the citable map+NFD rule — it silently inherits whatever Unicode's uppercase mapping does to other ligatures (ﬂ, ﬆ, ǆ, etc.), undermining the "documented literal table is the citable rule" posture of D-23; (2) the D-25 provenance record breaks for these inputs — the kept entry ends up `{char: 'F', original: 'ﬁ', folded: 'ﬁ'}`, so a consumer reading the `folded` field (documented as "the full fold output") sees a single unchanged character even though the statement was actually reduced to two different classified letters.
**Fix:** Move the uppercase expansion into `foldStatement` itself so `folded` records the true final output (`{original: 'ﬁ', folded: 'FI'}`), and have `normalize()` consume `folded` without any further case transformation. Add `ﬁ`/`ǆ`/similar vectors to `fold.test.js` and `normalize.test.js`.

### WR-04: Latin stroke letters (Ł/ł, Đ/đ, Ħ/ħ, Ŧ/ŧ) are struck as `non-letter`, contradicting the documented "accents are ignored" rule — and Đ is a visual confusable of the already-mapped Ð

**File:** `src/text/fold.js:21-34`
**Issue:** These are Latin letters whose diacritic is a stroke, not a combining mark, so NFD cannot decompose them and they are absent from `TRANSLITERATION_MAP`. `normalize('Ł')` therefore strikes it with reason `non-letter` — contradicting the README's D-22 rule ("accents are ignored; the base letter is used") and misclassifying a Latin letter under the reason reserved for digits/punctuation/non-Latin scripts (D-24's category). Worst case: Croatian **Đ** (U+0110) is struck as `non-letter` while the visually near-identical Icelandic **Ð** (U+00D0) is already in the map and transliterates to `D` — two statements that look identical to most readers silently produce different sigils depending on which code point was actually typed.
**Fix:** Either extend `TRANSLITERATION_MAP` with the stroke letters (Ł→L, ł→L, Đ→D, đ→D, Ħ→H, ħ→H, Ŧ→T, ŧ→T) under a D-23 amendment, or explicitly narrow the README's "accents are ignored" claim to name stroke letters as out of scope and add a pinned test vector so the behavior is a deliberate, cited line item rather than an accident.

### WR-05: `E_EMPTY_SEQUENCE` message counts derived classified letters, not original statement characters

**File:** `src/generate.js:83-87`
**Issue:** The thrown message interpolates `struck.length` as "all N **characters** struck", but `struck` holds one entry per *derived classified letter*, and a single original character can produce more than one entry (e.g. `Æ` transliterates to `AE`, producing two struck vowel entries). For the two-character statement `'Ææ'`, `generateSigil('Ææ', 'saturn')` throws `"...all 4 characters struck (4 vowels)."` — but the statement contains only 2 characters. D-26's stated contract is an accurate count of the statement's characters (the class doc example: "all 9 characters struck: …"); for any statement containing a mapped multi-letter fold, the message reports a count that is provably wrong, in the one message whose entire purpose is giving the user an accurate accounting.
**Fix:**
```js
const originalCount = new Set(struck.map((entry) => entry.index)).size;
```
Use `originalCount` for the "all N characters struck" figure (the per-reason breakdown can keep counting derived entries, or switch consistently — pick one and document it). Add an `'Ææ'`-style test vector asserting the message's count.

### WR-06: `COMBINING_MARKS` regex is written with raw invisible Unicode combining characters instead of `\u`-escapes

**File:** `src/text/fold.js:37`
**Issue:** `const COMBINING_MARKS = /[̀-ͯ]/g;` — the character-class endpoints are literal U+0300 and U+036F combining marks, invisible or near-invisible in most editors and rendered attached to the preceding bracket. In the one module that defines the byte-determinism-critical fold behavior, this is a real hazard: any tool that Unicode-normalizes source files (an editor setting, a `.gitattributes` filter, a future formatter run over a file type Prettier doesn't already own) could silently alter the character class with no visible diff, and no reviewer can eyeball-verify the range matches the doc comment above it. The stated goal of D-22/D-23 is a citable, inspectable rule; this line is neither citable nor inspectable as written.
**Fix:**
```js
const COMBINING_MARKS = /[̀-ͯ]/g;
```
Behavior-identical (confirm via the existing `fold.test.js` suite), but reviewable and immune to source-file Unicode normalization.

### WR-07: `escapeXml` doesn't strip XML-invalid control characters or handle lone surrogates — `title: true` can still emit non-well-formed XML

**File:** `src/render/escapeXml.js:21-23` (consumed at `src/render/svg.js:391`)
**Issue:** `escapeXml` escapes only the five XML-reserved characters (`& < > " '`). XML 1.0 forbids most C0 control characters outright in character data — even as numeric character references (U+0000–U+0008, U+000B, U+000C, U+000E–U+001F) — and a lone/unpaired UTF-16 surrogate is likewise invalid. `foldStatement`'s own test suite explicitly exercises lone-surrogate input and expects no throw, confirming this is a reachable input shape. Since `options.title` embeds the raw statement (after only this five-character escaping) into the SVG's `<title>` element, a statement whose text contains a BEL control character (code point 7) between the letters FIAT and LUX passed with `{ title: true }` produces an SVG that XML parsers and browsers will reject as not well-formed — directly contradicting this module's own stated purpose ("so a statement ... cannot break XML well-formedness of the generated SVG"). Only library callers can reach this today (the CLI exposes no `--title` flag), which limits blast radius but doesn't remove the defect.
**Fix:**
```js
// Decimal code-point bounds (not literal escapes) for the XML 1.0
// disallowed C0 control range: 0-8, 11, 12, 14-31.
function isXmlInvalidCodePoint(code) {
  return code <= 8 || code === 11 || code === 12 || (code >= 14 && code <= 31);
}

export function escapeXml(str) {
  const escaped = str.replace(/[&<>"']/g, (ch) => XML_ESCAPES[ch]);
  return [...escaped].filter((ch) => !isXmlInvalidCodePoint(ch.codePointAt(0))).join('');
}
```
Consider also replacing lone surrogates (e.g. with `�`) if statement text sourced from untrusted external input (rather than a human typing directly) is a realistic scenario for this project. Add a control-character test vector.

## Info

### IN-01: `@types/node` version is far ahead of the declared `engines.node` floor

**File:** `package.json:18-19, 38`
**Issue:** `engines.node` is `>=20.0.0`, but `devDependencies["@types/node"]` is pinned to `^26.1.2`. Type-checking (`tsc --allowJs --checkJs --noEmit`) against Node 26's type surface means a future contributor could call a Node 24/25/26-only API and have `tsc --checkJs` accept it as valid, even though it would throw at runtime on the documented minimum-supported Node 20. No such call exists in the current source (only long-stable APIs are used: `node:util.parseArgs`, `node:fs.readFileSync/writeFileSync`, `node:child_process.execFileSync`), so this is a latent CI gap, not an active bug.
**Fix:** Pin `@types/node` to a major matching the `engines.node` floor (e.g. `^20.x`), or document the intentional choice to type-check against a newer Node surface than the supported floor.

### IN-02: `in` operator for `TRANSLITERATION_MAP` lookup traverses the prototype chain

**File:** `src/text/fold.js:62`
**Issue:** `if (original in TRANSLITERATION_MAP)` matches inherited properties too (`'constructor' in TRANSLITERATION_MAP` is `true`). Unexploitable today — `original` is always exactly one code point, and no `Object.prototype` key is a single character — but the safety of this line depends on that invariant holding forever, and nothing enforces it.
**Fix:** `Object.hasOwn(TRANSLITERATION_MAP, original)`, or construct the map with `Object.create(null)` / a `Map`.

### IN-03: `roundGeometry` in `svg.js` duplicates the rounding algorithm in `coords.js`, with its own separate precision constant

**File:** `src/render/svg.js:77, 83-86` (duplicates `src/render/coords.js:18, 44-47`)
**Issue:** `coords.js` positions itself as the project's single rounding authority (its own doc comment: "no other module computes cell size or cell center independently... this is the determinism contract"), yet `svg.js` implements an independent, identical `Math.round(n * 10**PRECISION) / 10**PRECISION` helper with its own `GEOMETRY_PRECISION = 3` constant for marker-geometry values (radii, offsets). Both constants currently hold the same value, so output doesn't diverge today, but the two implementations can drift silently if either precision constant is changed without the other — SVG marker geometry and any future geometry exposed in the JSON working would then round differently for no documented reason.
**Fix:** Export a shared `roundTo(n, precision)` (or a fixed `roundCoord`) from `coords.js` and have `svg.js` consume it, deleting the duplicate `roundGeometry`/`GEOMETRY_PRECISION`.

---

_Reviewed: 2026-08-06T18:20:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
