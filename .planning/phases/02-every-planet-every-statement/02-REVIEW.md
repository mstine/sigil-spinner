---
phase: 02-every-planet-every-statement
reviewed: 2026-08-06T21:34:15Z
depth: standard
files_reviewed: 31
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
  - README.md
  - package.json
  - tsconfig.json
  - vitest.config.js
  - eslint.config.js
  - .prettierrc.json
  - .gitattributes
  - .gitignore
findings:
  critical: 0
  warning: 4
  info: 2
  total: 6
status: issues_found
---

# Phase 02: Code Review Report (Re-Review)

**Reviewed:** 2026-08-06T21:34:15Z
**Depth:** standard
**Files Reviewed:** 31
**Status:** issues_found

## Summary

This is a re-review of plan 02-04's gap-closure work. The prior report (02-REVIEW.md, 2026-08-06T18:20:00Z) raised two BLOCKERs — `CR-01` (unhandled `parseArgs` exceptions producing raw Node stack traces) and `CR-02` (unhandled stdin-read exceptions doing the same) — plus seven WARNINGs and three INFO items. **CR-01 and CR-02 are verified fixed.** `bin/sigil-spinner.js` now wraps `parseArgs` and the `readFileSync(0, ...)` stdin read in their own `try/catch` blocks, routes failures through a new `diagnose()` helper that writes one `CODE: message` line to stderr and exits with `CLI_USAGE_EXIT_CODE` (2), and never lets a raw exception escape to the top level. The full test suite (240 tests, 12 files) passes, `npm run lint` is clean, and `npm run typecheck` is clean. `test/cli/cli.test.js`'s "CLI exception safety" describe block specifically exercises the `CR-01` path (unrecognized flag, missing option value) end to end as a real subprocess and asserts exactly one diagnostic line with no stack trace.

The other 02-04 change under review — extending `TRANSLITERATION_MAP` from 12 to 84 entries and deriving `characterCount` separately from `strikeCount` in `generate.js`'s `E_EMPTY_SEQUENCE` message — is also correct on inspection: the `characterCount`/`strikeCount` divergence logic was traced by hand against the `"Ææ"` and `"Æ"` test cases and matches; the 72 new transliteration entries were cross-checked programmatically (code points, NFD/NFKD non-decomposability, case-completeness against V8's actual case-folding tables, not just the test's own logic) and no functional errors were found.

No BLOCKER-level findings resulted from this re-review. Four WARNINGs remain — one is a genuine reachability/documentation bug in `src/render/svg.js` (pre-existing, newly surfaced by tracing the repeat-loop code paths against the CR fix), one is that the just-shipped CR-02 fix itself has zero test coverage, and two are documentation/UX completeness gaps.

## Warnings

### WR-01: `E_CLI_STDIN` path (the CR-02 fix) has zero test coverage

**File:** `bin/sigil-spinner.js:117-121`
**Issue:** The stdin-read `try/catch` added to fix CR-02 is not exercised by any test. `test/cli/cli.test.js`'s "CLI exception safety" describe block thoroughly tests the `E_CLI_USAGE` path (unrecognized flag, missing `--planet`/`--output` value) but has no case for `E_CLI_STDIN`. Manually verifying this in this review shows `readFileSync(0, 'utf-8')` does **not** throw when stdin is `/dev/null` or an ignored fd (it returns `''`), which is presumably why no test was written — the original CR-02 trigger (a `readFileSync(0)` `EAGAIN` when fd 0 is an interactive TTY in non-blocking mode) is a real, documented Node.js gotcha but is awkward to reproduce deterministically in CI. That doesn't make the gap acceptable: a future refactor that removes or breaks this specific `try/catch` would regress CR-02 silently, with nothing in the suite to catch it.
**Fix:** Add a test that forces `readFileSync(0, ...)` to throw deterministically — e.g. spawn the CLI with stdin set to a pipe whose write end is closed immediately (`stdio: ['pipe', 'pipe', 'pipe']`, then `child.stdin.end()`/destroy before any data is written, forcing an early read error), or extract the stdin-read into a small importable function and unit-test it with a mocked `readFileSync` — and assert on the `E_CLI_STDIN` diagnostic and exit code, mirroring the existing `E_CLI_USAGE` tests.

### WR-02: Misleading "unreachable" claim on `perpendicularUnit`'s zero-length fallback — it is reachable from `endMarker` in real output

**File:** `src/render/svg.js:152-171` (doc comment), consumed at `src/render/svg.js:186-212` (`endMarker`)
**Issue:** The doc comment on `perpendicularUnit` states: *"Every call site in this module guarantees a non-degenerate (dx, dy) before calling — `endMarker` only calls this for a real multi-point incoming segment... so the zero-length branch is a defensive fallback for a case that should not occur under the current call sites, not a live code path."* This is incorrect. `endMarker` computes `dx, dy` as `last.x - points[points.length - 2].x` / `...y`. When the traced statement's *last two kept letters map to the same Pythagorean digit* (a genuine, ordinary number-level repeat landing exactly at the end of the sequence — e.g. digits `[..., 5, 5]`), the last two points sit on the identical kamea cell, so `dx === 0 && dy === 0`. Verified directly:
```
node --input-type=module -e '
import { buildPath } from "./src/path/buildPath.js";
import { cellForNumber, gridSize } from "./src/data/kamea.js";
const cells = [cellForNumber("saturn",3), cellForNumber("saturn",5), cellForNumber("saturn",5)];
const model = buildPath([3,5,5], cells, "saturn", gridSize("saturn"));
// model.points[1] and model.points[2] are both { x: 50, y: 50 } -- dx=dy=0
'
```
`test/render/svg.test.js`'s existing `repeatAtLastPointPath()` fixture (digits `[3, 5, 5]`) exercises exactly this shape and passes only because the "defensive, should not occur" fallback branch actually fires. Current behavior is fine (deterministic, no crash) — but the comment's reachability claim is false, which is a real maintenance hazard: a contributor who trusts the comment and "cleans up" the supposedly-dead branch (e.g. removing the `magnitude === 0` guard as unreachable) would reintroduce a live `0/0` (`NaN`) bug in the end marker's coordinates for any statement whose last two kept letters share a Pythagorean digit.
**Fix:** Correct the comment to state plainly that `endMarker`'s zero-length case is reachable whenever a number-level repeat lands on the sequence's final two points, and that the fixed `{x: 1, y: 0}` fallback is intentional degenerate-case behavior, not dead code. Consider adding an explicit unit test on `endMarker`/`renderSvg` that names this reachability directly, so it's pinned rather than only incidentally covered by `repeatAtLastPointPath`.

### WR-03: README's documented `working` field list omits `keptTrail` and `repeats`

**File:** `README.md:26-29`
**Issue:** The "Library" usage section's bullet list of `working`'s keys reads: `statement, planet, kameaSet, gridSize, lettersKept, lettersStruck, letterNumbers, numbers, cells, segments, start, end` — the Phase 1 field set only. It never mentions `keptTrail` or `repeats`, both of which are real, documented (in JSDoc) fields of `SigilWorking` that ship in every `working` object today (see `src/render/json.js`'s `toWorking`, and `test/determinism.test.js`'s "appends the Phase 2 working keys after the unchanged Phase 1 key order" test, which pins `keys.slice(phase1Order.length)` to `['keptTrail', 'repeats']`). A consumer reading only the top-level README API description would not know these fields exist, even though the "Consecutive-repeat loops" section later describes the *concept* of repeats without ever naming the `working.repeats` field.
**Fix:** Add `keptTrail` and `repeats` to the bullet list (with a one-line description each, matching the style of the existing entries), so the README stays a complete citable description of the public `working` shape.

### WR-04: CLI silently discards extra positional arguments

**File:** `bin/sigil-spinner.js:113` (`const rawStatement = positionals[0];`)
**Issue:** `parseArgs` is called with `allowPositionals: true` and no positional-count validation. `positionals[0]` is used as the statement; any additional positional arguments (e.g. an unquoted multi-word statement typed as `sigil-spinner I will succeed --planet saturn`) are silently dropped with no diagnostic — the tool quietly generates a sigil from just `"I"` instead of failing loudly. Given the project's stated correctness bar ("no 'close enough'"), silently truncating the intention statement without any diagnostic is a real footgun at the CLI boundary.
**Fix:** After parsing, check `positionals.length > 1` and route through the same `diagnose(E_CLI_USAGE, ...)` helper used for the other CLI-local usage failures, e.g. `` `unexpected extra argument(s): ${positionals.slice(1).join(', ')}. Did you forget to quote the statement?` ``.

## Info

### IN-01: One "stroke/bar class" table entry may be misclassified by name (base letter unaffected)

**File:** `src/text/fold.js:106-108` (comment + `Ꞥ`/`ꞥ` entries), `README.md:162`
**Issue:** Low confidence, flagged for verification rather than asserted as fact: `U+A7A4`/`U+A7A5` (mapped here to `N`) sit in the same Unicode Latin Extended-D range as the surrounding G/K/R/S "with oblique stroke" additions from the Uralic Phonetic Alphabet block, but this reviewer's recollection is that this specific codepoint pair's official Unicode name is *LATIN CAPITAL/SMALL LETTER N WITH DESCENDER*, not "...WITH STROKE" or "...WITH OBLIQUE STROKE" — i.e. it may not strictly belong to the "stroke/bar overlay" class the table's own doc comment and README table claim to enumerate exhaustively and precisely. This does not change the derived output (folding to base letter `N` is unambiguous and correct either way), so it is not a functional defect — only a possible precision gap in a comment/README that otherwise claims a very exact classification boundary (the D-23 amendment's own text distinguishes stroke/bar letters from other diacritic classes specifically to justify excluding lookalikes like the hooked/tailed phonetic letters).
**Fix:** Independently verify this codepoint pair's official Unicode character name (e.g. against the Unicode NamesList or a canonical reference) before the next revision of this table; if it is indeed "N WITH DESCENDER" rather than a stroke/bar variant, either move it to its own documented micro-class or adjust the comment's classification language so the "stroke/bar class" description stays exact.

### IN-02: `diagnose()` (and the pre-existing exit paths it's modeled on) write-then-`process.exit()` is a documented Node anti-pattern

**File:** `bin/sigil-spinner.js:84-87`, and the pre-existing pattern reused at `136-138`
**Issue:** Node's own docs caution against calling `process.exit()` immediately after `process.stdout.write()`/`process.stderr.write()`, because on some platforms writes to non-TTY streams (files, pipes) are asynchronous and can be truncated by an immediate exit. Every diagnostic branch in this file — including the two new `E_CLI_USAGE`/`E_CLI_STDIN` branches added by the CR-01/CR-02 fix — follows this shape. In practice the messages here are short single lines, so truncation risk is low, but it's a known-fragile pattern worth being aware of, especially if a future change grows the diagnostic payload (e.g. embedding `.details` JSON in the CLI's error output).
**Fix:** No action required at current message sizes; if diagnostic payloads grow, consider `process.exitCode = n` plus a natural `return`/fallthrough instead of `process.exit(n)`, which lets Node's normal event-loop drain (and stream flush) complete before the process exits.

---

_Reviewed: 2026-08-06T21:34:15Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
