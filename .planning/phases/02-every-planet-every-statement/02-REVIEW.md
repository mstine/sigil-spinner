---
phase: 02-every-planet-every-statement
reviewed: 2026-08-06T16:55:04Z
depth: standard
files_reviewed: 10
files_reviewed_list:
  - src/text/fold.js
  - src/text/normalize.js
  - src/path/buildPath.js
  - src/render/svg.js
  - src/render/json.js
  - src/generate.js
  - src/errors.js
  - test/e2e/phase2-tracer.test.js
  - test/text/fold.test.js
  - test/determinism.test.js
findings:
  critical: 0
  warning: 6
  info: 4
  total: 10
status: issues-found
---

# Phase 2: Code Review Report

**Reviewed:** 2026-08-06T16:55:04Z
**Depth:** standard
**Files Reviewed:** 10
**Status:** issues-found

## Summary

Reviewed the Phase 2 fold/repeat/loop pipeline: accent folding (`fold.js`), classification provenance (`normalize.js`), repeat detection (`buildPath.js`), loop rendering (`svg.js`), working serialization (`json.js`), the enriched `E_EMPTY_SEQUENCE` path (`generate.js`, `errors.js`), and the three new/extended test suites. Findings below were verified by executing the actual code, not just reading it.

The core contracts hold: `toWorking()` remains a thin serializer (no computation added), the text layer imports nothing from path/kamea, folding is per-character with original-index provenance, `detectRepeats` runs over the number sequence (never letters) and its run-length logic is correct at all boundaries (empty, single, trailing run), key order in the working is fixed and byte-stable, `renderSvg` is not exported from `src/index.js` so the unescaped `sigil--${planet}` class attribute is unreachable with attacker-controlled input, and the `<title>` path XML-escapes the statement's five reserved characters. No injection path, no prototype-pollution path via user strings (strike-count keys are fixed literals), no hardcoded secrets, no locale-sensitive operations (`toUpperCase`/`toLowerCase`, not the `toLocale*` variants).

However, six Warning-level defects survive: dead perpendicular-direction logic in `loopLayer` whose documented behavior can mathematically never occur; an undocumented second fold path through `toUpperCase()` that expands compatibility ligatures (ﬁ→FI) outside the citable D-23 rule and breaks D-25 provenance for them; Latin stroke letters (Ł, Đ) silently struck as `non-letter` while the visually near-identical Ð transliterates to D; an `E_EMPTY_SEQUENCE` message that miscounts characters for multi-letter folds; a determinism-critical regex written with raw invisible combining characters; and XML-invalid output when a control-character statement meets `title: true`.

## Warnings

### WR-01: `loopLayer`'s perpendicular-direction logic is dead code — the incoming segment to a repeat's `atPoint` is always zero-length

**File:** `src/render/svg.js:213-216` (doc claim at 183-186)
**Issue:** `loopLayer` computes the loop's offset direction from "the segment entering that point": `segments.find((segment) => segment.to === repeat.atPoint)`. But `repeat.atPoint` is the LAST index of a run of consecutive equal digits (per `RepeatEvent`'s contract in `buildPath.js:27`), and segments are strictly consecutive (`{from: i, to: i+1}`). The segment entering the run's last point therefore always comes from the previous point *in the same run* — same digit, same cell, same rounded x/y — so `perpendicularUnit(0, 0)` fires its zero-magnitude fallback `{x: 1, y: 0}` on **every** repeat, always. Verified empirically: the CLARITÉ/Jupiter loop is offset purely in +x. The `find`/`from`/`perp` machinery can never produce anything but the fallback; the JSDoc's described behavior ("Offset outward … along the `perpendicularUnit` of the segment entering that point") is unreachable. Output is still deterministic and stays inside the cell, so this is not a rendering break — but it is a logic error masquerading as geometry, and the next maintainer will trust a comment that is false.
**Fix:** Either (a) implement the evident intent — use the segment entering the *run*, not the run's last point: `segments.find((s) => s.to === repeat.atPoint - repeat.count)` (the run occupies indices `atPoint - count … atPoint`), or (b) delete the `incoming`/`from`/`perp` computation, hardcode the fixed `{x: 1, y: 0}` direction, and rewrite the JSDoc to say the direction is a fixed deterministic constant. Note option (a) changes bytes of every repeat-carrying snapshot — it must be a deliberate, snapshot-regenerating change.

### WR-02: `toUpperCase()` in `normalize()` is an undocumented second fold path — compatibility ligatures expand outside the D-23 rule and break D-25 provenance

**File:** `src/text/normalize.js:83` (contradicts the claim in `src/text/fold.js:53-54`)
**Issue:** `fold.js` documents that folding is exactly `TRANSLITERATION_MAP` + NFD-strip and "Never relies on native `toUpperCase` to fold ß." But `normalize()` calls `folded.toUpperCase()`, and `toUpperCase` performs its own multi-character expansions for characters NFD cannot touch: verified, `normalize('ﬁ')` (U+FB01) yields kept `F` plus struck `I` (reason `vowel`). Two problems: (1) the effective folding rule is no longer the citable map + NFD — it silently includes whatever the Unicode uppercase mapping does to ﬂ, ﬆ, ǆ, ı, etc., contradicting the "documented literal table is the citable rule" posture of D-23; (2) the D-25 provenance breaks for these characters — the kept entry is `{char: 'F', original: 'ﬁ', folded: 'ﬁ'}`, so a teaching page narrating the trail shows "ﬁ → ﬁ" yet letters F and I appear in the classification, with nothing in the record explaining the expansion. The `folded` field's contract ("the full fold output") is violated: the actual fold output was `FI`.
**Fix:** Make the fold total in `fold.js`: after the map/NFD step, apply the uppercase expansion *inside* `foldStatement` so `folded` records the true final output (`{original: 'ﬁ', folded: 'FI'}`), and have `normalize()` consume `folded` without further case transformation (or with a per-code-point assert that uppercasing is length-preserving). Add ﬁ/ǆ/ı vectors to `fold.test.js`.

### WR-03: Latin stroke letters (Ł/ł, Đ/đ, Ħ/ħ, Ŧ/ŧ) are struck as `non-letter` — contradicting the documented "accents are ignored" rule, and Đ is a confusable of the mapped Ð

**File:** `src/text/fold.js:21-34`
**Issue:** These are Latin letters whose diacritic is a stroke, so NFD cannot decompose them and they are not in `TRANSLITERATION_MAP` — verified: `normalize('Ł')` strikes it with reason `non-letter`. This contradicts the D-22 README rule ("accents are ignored; the base letter is used" — a hand-derivation of Polish MIŁOŚĆ keeps L) and mislabels a Latin letter with the reason reserved for digits/punctuation/non-Latin scripts (D-24's category). Worst case: Croatian **Đ** (U+0110) is struck as `non-letter` while the visually near-identical Icelandic **Ð** (U+00D0) transliterates to D — a user cannot tell which one they typed, and identical-looking statements produce different sigils. The D-23 map is a locked decision listing exactly six letters, so this may need a decision amendment rather than a silent code change — but as shipped, the implementation does not deliver the documented rule for a real class of inputs.
**Fix:** Either extend `TRANSLITERATION_MAP` with the stroke letters (Ł→L, ł→L, Đ→D, đ→D, Ħ→H, ħ→H, Ŧ→T, ŧ→T) under a D-23 amendment, or narrow the README's "accents are ignored; the base letter is used" claim to explicitly name stroke letters as out of scope and add a test vector pinning `Ł → non-letter` so the behavior is at least a chosen, cited line item rather than an accident.

### WR-04: `E_EMPTY_SEQUENCE` message counts derived letters, not original characters

**File:** `src/generate.js:85`
**Issue:** The message interpolates `struck.length` as "all N **characters** struck", but `struck` holds one entry per *derived classified letter*, and one original character can produce several (Æ→AE yields two entries). Verified: `generateSigil('Ææ', 'saturn')` — a two-character statement — throws "Statement reduced to zero kept letters: all **4** characters struck (4 vowels)." D-26's contract is explicitly a count of the statement's characters ("all 9 characters struck: …"); for any statement containing a mapped ligature the message states a character count that is provably wrong, in the one place whose whole purpose is an accurate human explanation.
**Fix:** Count distinct original characters: `const originalCount = new Set(struck.map((e) => e.index)).size;` and use it for the "all N characters struck" figure (the per-reason breakdown can keep counting derived entries, or switch consistently — but say which). Add an `'Ææ'` test vector asserting the message's count.

### WR-05: `COMBINING_MARKS` regex is written with raw invisible combining characters instead of `\u` escapes

**File:** `src/text/fold.js:37`
**Issue:** `const COMBINING_MARKS = /[̀-ͯ]/g;` — the character class endpoints are literal U+0300 and U+036F combining marks, invisible or near-invisible in most editors and rendered attached to the `[` bracket. In the module that defines the byte-determinism-critical fold behavior, this is a hazard: any tool that Unicode-normalizes source files (editor setting, `.gitattributes` filter, a future formatter) could silently alter the class, and no human reviewer can visually verify the range is what it claims to be. The whole point of D-22/D-23 is a *citable, inspectable* rule; this line is neither.
**Fix:** `const COMBINING_MARKS = /[̀-ͯ]/g;` — behavior-identical (confirm via existing fold tests), reviewable, and immune to source-file normalization.

### WR-06: Control characters in a statement produce XML-invalid SVG when `title: true`

**File:** `src/render/svg.js:271` (with `src/render/escapeXml.js:22`)
**Issue:** `escapeXml` handles only the five reserved characters. XML 1.0 forbids most C0 control characters entirely (U+0000–U+0008, U+000B, U+000C, U+000E–U+001F) — they are invalid even as character references. `generateSigil('FIAT\u0007LUX', planet, { title: true })` passes the non-empty-string guard, the BEL is struck as `non-letter` (correct), but the *raw statement* is embedded in `<title>`, producing an SVG that XML parsers and browsers reject. This breaches the phase boundary's promise ("any statement … produces either a trustworthy sigil or a clear, actionable error") — this input produces a silently broken artifact. Only library callers can reach it today (the CLI exposes no `--title` flag), which is why this is a Warning rather than Critical.
**Fix:** In `escapeXml` (or a wrapper used by the `<title>` path), strip or replace XML-invalid code points: `str.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')` before entity escaping. Document the stripping in the `RenderOptions.title` JSDoc and add a control-character test vector.

## Info

### IN-01: `in` operator for `TRANSLITERATION_MAP` lookup traverses the prototype chain

**File:** `src/text/fold.js:62`
**Issue:** `original in TRANSLITERATION_MAP` matches inherited properties (`'constructor' in TRANSLITERATION_MAP` is `true`). Unexploitable today — `original` is always a single code point and no `Object.prototype` key is single-character — but the safety depends on that invariant holding forever.
**Fix:** `Object.hasOwn(TRANSLITERATION_MAP, original)`, or build the map with `Object.create(null)` / a `Map`.

### IN-02: `roundGeometry` in svg.js duplicates the private `round` in coords.js, with a separate precision constant

**File:** `src/render/svg.js:44-53` (duplicates `src/render/coords.js:44-47`)
**Issue:** `coords.js` declares itself the single rounding point ("no other module computes cell size or cell center independently" — Pitfall 10), yet svg.js carries an identical `10 ** PRECISION` round with its own `GEOMETRY_PRECISION = 3`. If either constant changes without the other, SVG marker geometry and working-JSON coordinates drift apart silently. (Pre-existing shape from Phase 1, but Phase 2's loop code widened its use.)
**Fix:** Export a `roundCoord(n)` from `coords.js` and delete `roundGeometry`/`GEOMETRY_PRECISION` from svg.js.

### IN-03: `endMarker`'s single-node offset reuses `LOOP_OFFSET_FRACTION`

**File:** `src/render/svg.js:160`
**Issue:** The D-27 single-node crossbar offset borrows the repeat-loop constant. Tuning loop aesthetics (D-17 discretion) would silently change the byte output of every single-letter sigil — an invisible coupling between two unrelated pieces of the visual contract.
**Fix:** Introduce `SINGLE_NODE_END_OFFSET_FRACTION = 0.14` (same value today, byte-identical output) so the two knobs can move independently.

### IN-04: The seven-planet determinism matrix statement contains no consecutive repeats — `sigil-loop` byte-stability is never exercised across kamea sizes

**File:** `test/determinism.test.js:18,78-89`
**Issue:** `'I WILL SUCCEED'` keeps W,L,S,C,D → digits 5,3,1,3,4 — zero consecutive repeats — so none of the seven `matrix-*.svg` snapshots contains a `sigil-loop`, and loop geometry (which scales with `cellSize`) is byte-pinned only on Jupiter (tracer) and the unit tests. A regression in loop math on, say, the 9×9 moon grid would pass the entire matrix. Statement × planet choice was Claude's-discretion (INT-03), so this is a coverage note, not a violation.
**Fix:** Add a second matrix statement carrying a repeat (e.g. `'CLARITÉ'`) across all seven planets, or at least snapshot it on saturn and moon (smallest/largest cells).

---

_Reviewed: 2026-08-06T16:55:04Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
