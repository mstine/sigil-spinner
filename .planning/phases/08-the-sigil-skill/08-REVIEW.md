---
phase: 08-the-sigil-skill
reviewed: 2026-08-09T20:05:57Z
depth: standard
files_reviewed: 9
files_reviewed_list:
  - scripts/skill-install.js
  - test/skill-cli-parity.test.js
  - test/skill-install-parity.test.js
  - package.json
  - eslint.config.js
  - tsconfig.json
  - skill/SKILL.md
  - skill/VERIFY.md
  - skill/references/correspondences.md
findings:
  critical: 1
  warning: 3
  info: 1
  total: 5
status: fixed
fixed_at: 2026-08-09T22:15:00Z
dispositions:
  CR-01: "fixed — parseCliOptionKeys now throws a named error on any options: entry it cannot reduce to a key; soundness test added (spread-entry fixture)"
  WR-01: "fixed — listFilesRecursive (both copies) now checks directory-ness at every walked level and fails with a clean E_SKILL_INSTALL: diagnostic instead of a raw ENOTDIR stack trace"
  WR-02: "fixed — parseCliOptionKeys's depth/comma scan is now string-literal-aware; a benign string is skipped transparently, a string containing a structural {, }, or , throws a named ambiguous-case error; soundness tests added for both the failure and the clean-string control"
  WR-03: "fixed — the options: { block-start match now uses matchAll and asserts exactly one occurrence, throwing a named error otherwise; soundness test added with a decoy comment occurrence"
  IN-01: "skipped — did not fall out of the WR-01 fix for free (wording-only, unrelated code path); left for a future pass per fix_context scope"
---

# Phase 08: The Sigil Skill Code Review Report

**Reviewed:** 2026-08-09T20:05:57Z
**Depth:** standard
**Files Reviewed:** 9
**Status:** issues_found

## Summary

Reviewed `scripts/skill-install.js` (the new one-directional install script), its two drift-guard test files, the lint/typecheck glob edits that bring `scripts/` under coverage, the one `package.json` scripts-key addition, and the three markdown skill files. Verified empirically rather than by inspection alone: `eslint`/`tsc` actually pick up `scripts/skill-install.js` (confirmed via `--listFiles` / `--print-config` and a deliberately injected lint error); the install script's two-pass "nothing written if anything diverges without `--force`" contract holds under a live repro against a scratch `$HOME`; `--force` correctly overwrites and names every replaced path; no absolute `/Users/` or repo-local path leaks into `skill/*.md`; and the full 1528-test suite plus the two new guard files pass clean.

The one finding worth blocking on: `test/skill-cli-parity.test.js`'s CLI-side parser (`parseCliOptionKeys`) silently drops any `options:` entry it cannot match to a `key:` shape, with no error — reproduced concretely below. That is precisely the "parser can silently return a wrong-but-equal set" failure mode SKILL-03 exists to prevent, since the whole guard's job is to fail when the CLI grows an option the skill doesn't document. Everything else found is a robustness/polish gap, not a correctness failure in the current, real state of the repo.

Hard project constraints checked and confirmed intact: `dependencies` unaffected (script only adds `skill:install`), `files`/`exports`/`bin`/`version` untouched, no `node:` import added to `src/` (nothing under `src/` changed at all — confirmed via `git diff --stat`), byte-determinism untouched (no `src/` diff).

## Critical Issues

### CR-01: The CLI-side flag parser silently drops unparseable `options` entries instead of failing loudly — defeats SKILL-03's purpose on exactly the input it exists to catch

**File:** `test/skill-cli-parity.test.js:114-131` (entry-splitting loop, key-match at 124-125)

**Issue:** `parseCliOptionKeys` walks the `options: { ... }` block, splits it into entries at depth-zero commas, and for each entry tries `entry.match(/^(?:'([^']+)'|([A-Za-z_$][\w$-]*))\s*:/)`. When that match fails, the code does nothing — no error, no key added, and no change to `keys.size`:

```js
if (entry.length > 0) {
  const keyMatch = entry.match(/^(?:'([^']+)'|([A-Za-z_$][\w$-]*))\s*:/);
  if (keyMatch) keys.add(keyMatch[1] ?? keyMatch[2]);
}
```

Any entry that isn't a bare-identifier-or-quoted-key-then-colon — an object spread (`...SHARED_DEFAULTS,`), a shorthand property, or a leading same-line comment before the key — is silently dropped. Reproduced against a plausible future edit (a new CLI option added via spread):

```
parsed keys: [ 'curve', 'glyph', 'id-prefix', 'json', 'output', 'planet', 'title' ]
size: 7 (no error thrown despite an unparseable entry silently dropped)
```

The dropped 8th key produces the *same* set size as today (7), so the file's own "parses a non-empty flag set" soundness guard (`skill-cli-parity.test.js:157-162`) does not catch it either. If that new option is also — as is likely for something brand new — not yet documented in `SKILL.md`, `cliKeysAfterAllowlist` and `skillTokens` end up **equal sets**, and `skill-cli-parity.test.js`'s main assertion (`skill-cli-parity.test.js:164-180`) **passes** while the CLI genuinely has an undocumented option. This is the exact "silently disable a guard that is supposed to fail loudly" class this review was asked to weight as Critical.

**Fix:** Throw a named error when an entry can't be resolved to a key, matching the file's existing fail-loud idiom (`could not find an \`options: {\` literal`, `unterminated \`options: { ... }\` block`):

```js
if (entry.length > 0) {
  const keyMatch = entry.match(/^(?:'([^']+)'|([A-Za-z_$][\w$-]*))\s*:/);
  if (!keyMatch) {
    throw new Error(
      `could not parse a key from an options entry in bin/sigil-spinner.js: ${JSON.stringify(entry)}`,
    );
  }
  keys.add(keyMatch[1] ?? keyMatch[2]);
}
```

Add a D-109-style fail-first soundness test that feeds a fixture containing a spread or shorthand entry and asserts the throw — the same discipline already applied to the "no `options:` anchor" and "no flag-table rows" cases in this file.

## Warnings

### WR-01: `listFilesRecursive` crashes with a raw, undocumented stack trace instead of a clean diagnostic when the destination path exists but is not a directory

**File:** `scripts/skill-install.js:53-73` (and the duplicated helper at `test/skill-install-parity.test.js:53-73`)

**Issue:** Both files guard only with `existsSync(INSTALLED_ROOT)` before calling `listFilesRecursive`, which calls `readdirSync` unconditionally. If `~/.claude/skills/sigil` (or a nested path such as `references`) exists as a plain file rather than a directory — a plausible accident, not the rejected-symlink scenario D-99 discusses — the script/test crashes with a raw Node `ENOTDIR` stack trace instead of the script's own consistent `E_SKILL_INSTALL:`-prefixed message. Reproduced directly:

```
$ echo "i am a file, not a dir" > "$TMPHOME2/.claude/skills/sigil"
$ HOME="$TMPHOME2" node scripts/skill-install.js
node:fs:1564
  const result = binding.readdir(
Error: ENOTDIR: not a directory, scandir '.../.claude/skills/sigil'
    at readdirSync (node:fs:1564:26)
    at walk (file:///.../scripts/skill-install.js:61:25)
```

The process does still exit non-zero (so it isn't a silent failure), but it breaks the script's own documented diagnostic contract ("every error/usage message... under the `E_SKILL_INSTALL:` format") and would read, to a user, like a script bug rather than a "your destination path is wrong" state.

**Fix:** Check the entry type before recursing:

```js
function listFilesRecursive(root) {
  if (!statSync(root).isDirectory()) {
    throw new Error(`E_SKILL_INSTALL: expected a directory at ${root}, found a non-directory entry`);
  }
  /* ...existing walk... */
}
```

Since this helper is duplicated verbatim in both files, consider factoring it into one shared module (`scripts/skill-fs-util.js` or similar) so this fix — and any future one — only has to land once.

### WR-02: Brace/comma-depth scanning in `parseCliOptionKeys` is not string-literal-aware

**File:** `test/skill-cli-parity.test.js:93-131`

**Issue:** The block-boundary scan (line ~102-105) and the entry-splitting scan (line ~117-121) count `{`/`}` and depth-zero `,` characters without ever skipping over string literals. A future option whose `default` value is a string containing a literal brace or comma (e.g. a JSON-shaped default, or a default string like `'a, b'`) would corrupt either the block-end detection or the entry boundaries — most likely surfacing as a confusing "unterminated block" throw or a spuriously split/garbled key, rather than the clean, named failure the rest of the file aims for. Not reachable today (every current option value is `{ type: 'string'|'boolean'[, default: true|false] }`), but the file's own header comment explicitly frames this parser's job as staying correct "across a Prettier reformat" and "a future option whose default spans multiple lines" — string-embedded delimiters are the same class of future-format risk and aren't covered.

**Fix:** Either make the scan string-literal-aware (skip over `'...'`/`"...'`/`` `...` `` spans when counting depth/commas), or add an explicit code comment documenting the limitation so a future author extending the parser knows the boundary of what it's proven against.

### WR-03: The `options:` block-start match is unanchored to the actual `parseArgs(` call site

**File:** `test/skill-cli-parity.test.js:93-98`

**Issue:** `source.match(/options:\s*\{/)` returns the **first** occurrence of that literal text anywhere in `bin/sigil-spinner.js`, including inside a comment. Today there is exactly one occurrence (verified: `grep -n "options" bin/sigil-spinner.js` returns only the real `options: {` at line 118), so the guard is correct as of this phase. But nothing prevents a later doc-comment edit (e.g. a header note that says "the `options: { ... }` object below covers...") from introducing an earlier match, which would either misparse against comment text or throw a confusing "unterminated block" error depending on brace balance in the surrounding prose — not the clean, purpose-stated error this file otherwise favors.

**Fix:** Cheap and consistent with the file's existing fail-loud style — assert there is exactly one match before proceeding:

```js
const allMatches = [...source.matchAll(/options:\s*\{/g)];
if (allMatches.length === 0) throw new Error('could not find an `options: {` literal...');
if (allMatches.length > 1) throw new Error('found more than one `options: {` literal — anchor is ambiguous');
```

## Info

### IN-01: "already up to date" message overclaims when an orphan is present

**File:** `scripts/skill-install.js:136-139`

**Issue:** When `toWrite.length === 0`, the script prints `[skill-install] already up to date — ${INSTALLED_ROOT} matches skill/ exactly.` This message is reachable even when an orphan file was just reported a few lines earlier (destination has an extra file with no repo counterpart) — in that state the two trees are not "exactly" matching, only every repo-sourced file is present and correct. Functionally harmless (orphans are already surfaced separately and correctly), but the wording slightly overclaims tree equivalence.

**Fix:** Minor wording tweak, e.g. `already up to date — every file in skill/ is present and correct at ${INSTALLED_ROOT}.` (drop "matches ... exactly" when orphans were just printed, or always word it in terms of "every repo file," not tree equality).

---

## Fix Pass Disposition (2026-08-09T22:15:00Z)

- **CR-01 — fixed.** `parseCliOptionKeys` now throws a named error (`could not parse a key from an options entry...`) on any `options:` entry it can't reduce to a key, instead of silently dropping it. Fail-first soundness test added using an object-spread fixture, following the `test/citations.test.js` soundness-describe idiom.
- **WR-01 — fixed.** Both copies of `listFilesRecursive` (`scripts/skill-install.js`, `test/skill-install-parity.test.js`) now check directory-ness at every walked level (including the root) and raise a clean, consistent diagnostic instead of a raw `ENOTDIR` stack trace. Live-repro'd against a scratch `$HOME` with a file at the destination path.
- **WR-02 — fixed.** `parseCliOptionKeys`'s depth/comma scan is now string-literal-aware via a minimal scanner: a benign quoted string is skipped transparently, but a string whose raw content contains a structural `{`, `}`, or `,` triggers a named, loud failure rather than a silent miscount — the "detect the ambiguous case and fail" option, per this phase's governing principle. Soundness tests added for both the failure case and a clean-string control.
- **WR-03 — fixed.** The `options: {` block-start match now uses `matchAll` and asserts exactly one occurrence, throwing a named "anchor is ambiguous" error if zero or more than one match is found. Soundness test added with a decoy comment occurrence containing the same literal text.
- **IN-01 — skipped.** Did not fall out of the WR-01 fix for free (unrelated wording-only overclaim in a different code path); left out of scope per the fix pass's explicit instruction not to stretch for it.

Verification after all fixes: `npm test` (1532/1532 passing, up from 1528 — 4 new soundness tests), `npm run typecheck` (clean), `npm run lint` (clean), `npm run test:pack` (2/2 passing). `src/` and `skill/` untouched this phase; `bin/sigil-spinner.js` untouched (read-only parse target); no runtime dependency added; `INTENTIONALLY_UNDOCUMENTED` still ships empty.

_Reviewed: 2026-08-09T20:05:57Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
_Fix pass: 2026-08-09T22:15:00Z_
_Fixer: Claude (gsd-code-fixer)_
