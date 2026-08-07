# Phase 4: v1.0 Tech Debt Closeout - Research

**Researched:** 2026-08-07
**Domain:** Existing-codebase defect remediation (Node ESM library + CLI) — no new external technology
**Confidence:** HIGH (every claim below is either read from source this session or live-reproduced against the actual code)

## Summary

This phase has no unknowns in the "what library should we use" sense — the stack is settled and CLAUDE.md already documents it. The entire risk surface is **behavioral**: eleven tech-debt items were recorded in `.planning/v1.0-MILESTONE-AUDIT.md`, and this research re-confirmed all eleven against the live codebase, read every file each one touches, and live-reproduced the three the ROADMAP names explicitly (WR-01 round-trip, WR-04 extra positionals, WR-03 validation-ordering masking). All eleven are still open exactly as described; none has been fixed since the audit.

The eleven items split cleanly into three tiers by cost and payoff:

- **Fix now (3 items, all small, all additive or narrowly-scoped):** WR-01 (`working.render` round-trip — the audit's "fix first"), WR-04 (CLI silently discards extra positional args), README working-field documentation gap (`keptTrail`, `repeats`, and the whole `render` block are undocumented).
- **Cheap and low-risk, worth bundling (3 items):** Phase 1's WR-03 (validation-ordering that masks `E_UNKNOWN_PLANET` behind `E_EMPTY_SEQUENCE`), Phase 1's WR-02 (error codes not re-exported from `src/index.js`), the cross-cutting SUMMARY frontmatter backfill (mechanical, and this research already derived the exact per-file values from `02-VERIFICATION.md`).
- **Defer (5 items):** Phase 1's WR-04 (raw `TypeError` on an unreachable partial-kamea-set scenario), Phase 2's WR-01 (`E_CLI_STDIN` untestable in this harness — already disclosed, not silent), Phase 2's WR-02 (a doc-comment accuracy issue, verified genuinely inaccurate but cosmetic), Phase 3's WR-02 (`-0` serialization — live-verified in this session to be a non-issue: JS's own `String()`/`JSON.stringify` already collapse `-0` to `"0"`), Phase 3's IN-01 (a decision-ID citation collision in comments).

**Primary recommendation:** Structure the phase as two waves. Wave 1 fixes WR-01 with a **type-keyed absent-normalization** in `resolveOptions` (accept `null` as absent specifically for options whose `ABSENT_DEFAULT_BY_TYPE` is `null` — currently only `idPrefix`), which is the smallest change that satisfies `json.js`'s own doc comment without touching D-48's "always serialize `null`, never drop the key" contract. This requires flipping one existing test (`test/cli/cli.test.js:461-472`, "throws E_INVALID_OPTION for a null idPrefix") — that inversion is not a regression, it's the fix. Wave 2 fixes WR-04 (extra-positional diagnostic via the existing `E_CLI_USAGE`/`diagnose()` pattern) and the README documentation gap, since both are independent of Wave 1 and of each other. If time budget allows, fold in the three "cheap" items as a third wave; they touch different files than Waves 1–2 (`generate.js`'s ordering, `src/index.js`'s exports, and four SUMMARY.md frontmatter blocks) so there's no file-conflict reason to exclude them from the same phase.

No new packages, no new external dependencies, no snapshot churn expected from any of the "fix now" items (verified reasoning below, per item).

## Architectural Responsibility Map

This project is a single-tier Node library + thin CLI wrapper, not a multi-tier web app — the standard Browser/SSR/API/CDN/Database tiers don't apply. Adapted to this project's actual architecture (`ARCHITECTURE.md`'s internal boundaries, confirmed by reading `src/generate.js`'s own header comment):

| Capability | Primary Owner | Secondary Owner | Rationale |
|------------|---------------|------------------|-----------|
| Option validation / round-trip contract (WR-01) | `src/generate.js` (`resolveOptions`) | `src/render/json.js` (serialization shape) | `generate.js` is "the only module allowed to import across `text/`, `data/`, and `path/`" (its own header comment, `src/generate.js:1-10`) and owns all option validation per Anti-Pattern 3; `json.js` only serializes what `generate.js` already resolved — it computes nothing (`src/render/json.js:1-15`) |
| Argv parsing and diagnostics (WR-04) | `bin/sigil-spinner.js` | — | CLI-local; the file's own header states "Zero domain logic lives here" (`bin/sigil-spinner.js:1-28`) — the extra-positional check is argv-shape validation, not domain validation, so it belongs in the CLI, not the library |
| Error taxonomy / exports (Phase 1 WR-02) | `src/errors.js` (source of truth) | `src/index.js` (public re-export surface) | `src/index.js` is "the entire public surface of the package" (`src/index.js:1-5`) — currently exports only `SigilError`/`generateSigil`, not the `E_*` constants |
| Kamea data guards (Phase 1 WR-04) | `src/data/kamea.js` | — | "No other module in this repository may contain a kamea grid literal" (`src/data/kamea.js:64-66`) — the guard belongs where the data lives |
| Documentation (README gap) | `README.md` | `src/render/json.js` (JSDoc is the source of truth for field list) | The README's field list at `README.md:27-29` must track `SigilWorking`'s typedef in `src/render/json.js:34-50`, which is authoritative |
| SUMMARY frontmatter (cross-cutting) | `.planning/phases/02-*/02-0N-SUMMARY.md` | `.planning/phases/02-*/02-VERIFICATION.md` (source of truth for the mapping) | Doc metadata only — the correct values are already derivable from `02-VERIFICATION.md`'s Requirements Coverage table, read this session |

## Standard Stack

No new stack decisions — this phase modifies existing code only. `.claude/CLAUDE.md`'s "Recommended Stack" and "What NOT to Use" tables already govern this repo and apply unchanged: Node `>=20`, `node:util.parseArgs`, hand-rolled SVG templating, Vitest, JSDoc + `tsc --checkJs`, zero runtime dependencies. Confirmed current via `package.json` read this session — `devDependencies` unchanged since Phase 3 (`vitest@^4.1.10`, `typescript@^7.0.2`, `eslint@^10.8.0`, `prettier@^3.9.6`, `playwright@^1.62.1`, `@types/node@^26.1.2`).

**Version verification:** not applicable — no packages added or upgraded by this phase.

## Package Legitimacy Audit

**Not applicable.** This phase installs zero new packages. Every fix touches existing source files (`src/generate.js`, `src/index.js`, `src/data/kamea.js`, `bin/sigil-spinner.js`) or documentation (`README.md`, `.planning/phases/02-*/02-0N-SUMMARY.md`). If a plan later discovers a need for a package, treat that as a plan defect per the existing Phase 3 precedent (`03-04-PLAN.md`'s threat model: "This phase installs ZERO packages... If any task in this phase is found to require an install, that is a plan defect and execution must halt rather than install").

## Architecture Patterns

### The type-keyed absent-default table (already established, WR-01's fix extends it)

`src/generate.js:56-78` establishes two parallel tables:

```js
// [VERIFIED: src/generate.js:56-61]
const KNOWN_OPTIONS = {
  curve: 'boolean',
  glyph: 'boolean',
  title: 'boolean',
  idPrefix: 'string',
};
```

```js
// [VERIFIED: src/generate.js:75-78]
const ABSENT_DEFAULT_BY_TYPE = {
  boolean: false,
  string: null,
};
```

`resolveOptions` (`src/generate.js:117-147`) currently treats only `value === undefined` as absent:

```js
// [VERIFIED: src/generate.js:120-125]
for (const [name, expected] of Object.entries(KNOWN_OPTIONS)) {
  const value = options[name];
  if (value === undefined) {
    resolved[name] = ABSENT_DEFAULT_BY_TYPE[expected];
    continue;
  }
```

**This is the exact root cause of WR-01.** `json.js`'s doc comment (`src/render/json.js:49`, quoted verbatim below) promises the `render` block is "sufficient to reproduce the exact SVG from the working alone," but `working.render.idPrefix` serializes as JSON `null` (by design, D-48), and `null !== undefined`, so `resolveOptions` falls through to the type check, sees `typeof null !== 'string'`, and throws.

**Recommended fix — extend the absent check to recognize each type's own designated absent-sentinel:**

```js
if (value === undefined || value === ABSENT_DEFAULT_BY_TYPE[expected]) {
  resolved[name] = ABSENT_DEFAULT_BY_TYPE[expected];
  continue;
}
```

Why this is the right scope, not a broader one: `ABSENT_DEFAULT_BY_TYPE.boolean` is `false`, not `null` — so this change does **not** make `{ glyph: null }` newly valid (it still fails the `typeof` check exactly as before, preserving `test/cli/cli.test.js:389-400`'s existing "null is a wrong type, not absent, for a boolean option" assertion, which must NOT change). It only makes `{ idPrefix: null }` equivalent to omitting `idPrefix` — which is precisely the shape `working.render` emits and precisely what the round-trip needs. If a future string-typed option is added whose absent-default is also `null`, this fix automatically covers it too, with no further changes — consistent with the existing type-keyed-table discipline this file already uses for D-47/D-48.

**One existing test must flip, not merely pass unmodified:** `test/cli/cli.test.js:461-472` ("throws E_INVALID_OPTION for a null idPrefix (wrong type, not absent)") currently asserts the broken behavior. Under the fix, `generateSigil(STATEMENT, 'saturn', { idPrefix: null })` must NOT throw — it must resolve `idPrefix` to `null`/absent, identical to omitting it. This test's assertion must be inverted to assert the round-trip succeeds; treat this as the fix's regression coverage, not a byproduct to work around.

**Recommended new coverage:** a direct round-trip test — `generateSigil(s, p).working.render` fed straight back into a second `generateSigil` call, asserting no throw and (per the construction-invariance pattern already established in Phase 3's curve-mode tests, `README.md:117-127`) that the resulting `svg` is byte-identical to the first call's `svg`. Run across at least one option combination with `idPrefix` present and one without, since the null-normalization path only fires in the absent case.

**No snapshot churn expected.** This fix only changes what `resolveOptions` accepts as *input* on the round-trip path — the CLI's own invocation always passes `idPrefix: undefined` when `--id-prefix` is omitted (`bin/sigil-spinner.js:122`, unchanged), so no default-invocation output shape or byte sequence changes. Verified by reasoning from the code path, not by running the suite post-fix (the fix has not been implemented yet as of this research).

### The CLI-local diagnostic pattern (already established, WR-04's fix reuses it)

`bin/sigil-spinner.js` has a complete, working pattern for "malformed argv → one stderr line → exit 2" that the WR-04 fix should reuse verbatim rather than invent a new convention:

```js
// [VERIFIED: bin/sigil-spinner.js:56-89]
const E_CLI_USAGE = 'E_CLI_USAGE';
// ...
const CLI_USAGE_EXIT_CODE = 2;

function diagnose(code, message, exitCode) {
  process.stderr.write(`${code}: ${message}\n`);
  process.exit(exitCode);
}
```

This is already used for `parseArgs` throwing on an unrecognized flag (`bin/sigil-spinner.js:93-107`) and for `readFileSync(0)` failing under the `-` stdin sentinel (`bin/sigil-spinner.js:128-132`). WR-04's fix is a straight third use of the same `diagnose()` call:

```js
// [VERIFIED: bin/sigil-spinner.js:109, 124 — insertion point]
const { values, positionals } = parsed;
// candidate insertion, right after this line:
if (positionals.length > 1) {
  diagnose(E_CLI_USAGE, `unexpected extra argument(s): ${positionals.slice(1).join(', ')}`, CLI_USAGE_EXIT_CODE);
}
```

Live-verified this session that `parseArgs({ allowPositionals: true, ... })` does NOT throw on extra positionals — it silently accumulates them into the `positionals` array (`node -e` repro: `args: ['A','EXTRA','--planet','saturn']` → `{"values":{"planet":"saturn"},"positionals":["A","EXTRA"]}`), confirming this must be an explicit post-parse check, not something `parseArgs`'s own option config can reject.

**No existing test exercises more than one positional**, per a full read of `test/cli/cli.test.js` (531 lines) this session — so this addition cannot break any currently-passing assertion. New test coverage needed: the exact reproduction from the ROADMAP scope seed (`sigil-spinner.js 'A' 'EXTRA' --planet saturn` exits 2 with an `E_CLI_USAGE` line), plus confirmation that a single positional plus `-` for stdin still works (i.e., don't accidentally reject `positionals[0] === '-'` with nothing after it — that's `positionals.length === 1`, unaffected).

### Documentation-gap pattern (README working fields)

`README.md:27-29` lists the working's fields but the list is stale relative to `src/render/json.js`'s `SigilWorking` typedef:

```
// [VERIFIED: README.md:27-29]
- `working` — the full JSON derivation trail (see Worked Example below):
  `statement`, `planet`, `kameaSet`, `gridSize`, `lettersKept`,
  `lettersStruck`, `letterNumbers`, `numbers`, `cells`, `segments`, `start`,
  `end`.
```

The authoritative field list, read from `SigilWorking`'s JSDoc typedef this session:

```
// [VERIFIED: src/render/json.js:34-50]
@property {string} statement
@property {string} planet
@property {string} kameaSet
@property {number} gridSize
@property {string[]} lettersKept
@property {import('../text/normalize.js').StruckEntry[]} lettersStruck
@property {LetterNumberPair[]} letterNumbers
@property {number[]} numbers
@property {WorkingCell[]} cells
@property {import('../path/buildPath.js').PathSegment[]} segments
@property {number} start
@property {number} end
@property {import('../text/normalize.js').KeptEntry[] | undefined} keptTrail
@property {import('../path/buildPath.js').RepeatEvent[]} repeats
@property {{ curve: boolean, glyph: boolean, idPrefix: string | null, title: boolean }} render
```

Missing from the README's field list: `keptTrail` and `repeats` (this exact gap was already flagged as Phase 2's own WR-03 — confirmed live this session, `grep -c keptTrail README.md` → `0`) and — new to this phase's scope — `render` (the entire Phase 3 addition). This is a straight documentation-completeness task: extend the field list at `README.md:27-29` and (recommended) promote it from an inline prose list into a proper field-reference table near the Worked Example section (`README.md:268` onward), with one row per field, its type, and a one-line description — since the field count has grown from 11 to 15 and prose lists don't scale.

## Don't Hand-Roll

Not applicable to this phase in the traditional sense — there is no third-party-vs-hand-rolled decision anywhere in these eleven items. The closest analog is a discipline point: WR-01's fix must NOT hand-roll a bespoke "reproduce from working" helper function that special-cases `idPrefix` — the type-keyed table extension shown above is the existing pattern's natural generalization and should be preferred over a one-off shim.

## Tech Debt Register — All 11 Open Items

Every item re-confirmed against the live codebase this session (not transcribed from the audit). Exact current file:line, since the audit's own line numbers have drifted slightly from Phase-3-era references (files have grown since some items were first recorded).

| # | ID | Phase | Severity | Location (verified this session) | Observed vs. intended | Output-affecting? | Disposition |
|---|-----|-------|----------|-----------------------------------|------------------------|--------------------|--------------|
| 1 | WR-01 | 3 | Warning — "fix first" | `src/generate.js:117-147` (`resolveOptions`); doc contract at `src/render/json.js:49` | `working.render.idPrefix` serializes `null`; `resolveOptions` only treats `undefined` as absent → round-trip throws `E_INVALID_OPTION`. Live-reproduced this session: `generateSigil('I WILL SUCCEED','saturn', <its own working.render>)` → `E_INVALID_OPTION: option "idPrefix" must be a string, got: null` | No (validation-path only) | **Fix now** |
| 2 | WR-04 | 2 | Warning | `bin/sigil-spinner.js:109-124` | `positionals[0]` used unconditionally; `positionals[1+]` silently dropped. Live-reproduced this session: `sigil-spinner.js 'I WILL SUCCEED' 'EXTRA ARG' --planet saturn --json` → statement used is `"I WILL SUCCEED"`, no diagnostic | No (new diagnostic path only) | **Fix now** |
| 3 | (unlabeled) | 2 | Warning | `README.md:27-29` vs. `src/render/json.js:34-50` | README field list omits `keptTrail`, `repeats` (confirmed: `keptTrail` appears 0 times in README), and — newly in scope — `render` (whole Phase 3 block undocumented as a field reference) | No (docs only) | **Fix now** |
| 4 | WR-03 | 1 | Warning | `src/generate.js:178-233` — statement check (178), planet type check (185), `resolveOptions` (192), `normalize`+empty-sequence check (194-229), THEN `gridSize(planet)` (233) | `generateSigil('AEIOU','pluto')` throws `E_EMPTY_SEQUENCE`, masking the also-invalid planet. Live-reproduced this session: code is `E_EMPTY_SEQUENCE`, not `E_UNKNOWN_PLANET` | No (error-identity only; each path individually tested and correct) | **Cheap, bundle if room** |
| 5 | WR-02 | 1 | Info | `src/index.js:1-8` | Exports only `SigilError`, `generateSigil` — `E_*` constants stay private; `bin/sigil-spinner.js:44-50`'s `EXIT_CODES` map hardcodes code strings as object keys with no drift protection if a code is renamed | No (widens public API surface, purely additive) | **Cheap, bundle if room** |
| 6 | (metadata) | cross-cutting | metadata | `.planning/phases/02-every-planet-every-statement/02-0{1,2,3,4}-SUMMARY.md` frontmatter | All four omit `requirements-completed`. Correct values already derivable from `02-VERIFICATION.md`'s Requirements Coverage table (read this session, see table below) | No (planning docs only) | **Cheap, bundle if room** |
| 7 | WR-04 | 1 | Warning, latent | `src/data/kamea.js:209-226` (`gridSize`, `kameaGrid`) | `set[key].length` / `set[key]` returns raw `undefined` → `TypeError`, not `SigilError`, if a future kamea set is registered missing a planet. Unreachable today — `agrippa` (`src/data/kamea.js:89-148`) is the only set and is complete for all seven planets | No (unreachable with current data) | **Defer** — cheap guard if bundled, but genuinely zero live risk |
| 8 | WR-01 | 2 | Warning, disclosed | `bin/sigil-spinner.js:126-132` (current line numbers; audit cited 117-121, drifted from file growth since Phase 3) | `E_CLI_STDIN`'s `EAGAIN`-on-TTY trigger has no deterministic test — not reproducible in a non-TTY subprocess harness. Already disclosed in `02-04-SUMMARY.md`, not a silent gap | No | **Defer** — no known fix; a disclosed, structural test-harness limitation |
| 9 | WR-02 | 2 | Warning | `src/render/svg.js:376-394` (`perpendicularUnit` doc comment + `endMarker` caller at line 415) | Doc comment claims the zero-length fallback branch is unreachable ("every call site... guarantees a non-degenerate (dx, dy)"). Read this session: `endMarker`'s call site (`src/render/svg.js:415`) only guards `points.length >= 2`, NOT that the vector itself is non-zero — a statement whose kept-letter sequence ends in two different letters that both encode to the same Pythagorean digit places two adjacent points at an identical cell, producing a genuine zero-length incoming vector at the sigil's last point. This appears to be a live, reachable path, not the documented "defensive fallback for a case that should not occur" — verified by code-reading and reasoning, not by an executed repro this session | No (the fallback already returns a sane deterministic value; this is a documentation-accuracy defect only) | **Defer** — fix the doc comment if bundled, cheap; not worth a dedicated task on its own |
| 10 | WR-02 | 3 | Info, latent | `src/render/coords.js:51-54` (`roundGeometry`), `112-114` (`formatCoord`) | No `-0` guard. Live-verified this session: `JSON.stringify(-0)` → `"0"`, `String(-0)` → `"0"`, `` `${-0}` `` → `"0"` — JS's own stringification already collapses `-0` to `"0"` in every path this code uses (both `formatCoord`'s `String(n)` and `json.js`'s direct `JSON.stringify` of `cells[].x/y`). The only place this could theoretically matter is a downstream consumer doing `Object.is(x, -0)` directly on the *numeric* (pre-stringification) value, which no code in this repo does | No | **Defer** — live-verified to be a non-issue for current call paths; not worth a task |
| 11 | IN-01 | 3 | Info, cosmetic | `src/errors.js:20`, `src/generate.js:163`, `src/generate.js:238`, `bin/sigil-spinner.js:20` | `D-12` decision ID cited for what appear to be two distinct topics: "no default planet" (`src/errors.js:20`, `src/generate.js:163`, and the casing-invariance note at `src/generate.js:238`) vs. "diagnostics go to stderr" (`bin/sigil-spinner.js:20`) | No (comment text only) | **Defer** — cosmetic; fix trivially if touching any of these four lines for another reason, otherwise skip |

### SUMMARY frontmatter backfill — exact values (item 6)

Derived directly from `.planning/phases/02-every-planet-every-statement/02-VERIFICATION.md:182-187`'s Requirements Coverage table (read this session — verbatim source: `| KAMEA-02 | 02-01, 02-02 | ... |`, `| PATH-02 | 02-01, 02-03 | ... |`, `| CONS-03 | 02-02, 02-04 | ... |`, `| CONS-04 | 02-01, 02-02, 02-04 | ... |`, `| INT-03 | 02-02, 02-03, 02-04 | ... |`, `| INT-04 | 02-02, 02-04 | ... |`), inverted from requirement→plans to plan→requirements:

| File | `requirements-completed` value to add |
|------|----------------------------------------|
| `02-01-SUMMARY.md` | `[KAMEA-02, PATH-02, CONS-04]` |
| `02-02-SUMMARY.md` | `[KAMEA-02, CONS-03, CONS-04, INT-03, INT-04]` |
| `02-03-SUMMARY.md` | `[PATH-02, INT-03]` |
| `02-04-SUMMARY.md` | `[CONS-03, CONS-04, INT-03, INT-04]` |

This is fully mechanical — no judgment calls remain, the mapping is already authoritative in `02-VERIFICATION.md`. Match the exact frontmatter key/format already used by the four correctly-populated SUMMARY.md files, e.g. `requirements-completed: [CONS-02, KAMEA-01, KAMEA-03]` (`01-01-SUMMARY.md:54`, verified this session).

## The Round-Trip Contract (WR-01) — Full Analysis

Already covered in depth under Architecture Patterns above. Summary of the decision trail:

- **D-48** (`03-04-PLAN.md:108-112`, read this session) locked "emit JSON `null` for an absent `idPrefix`, so the `render` block's key set is invariant across every option combination" — this is correct and must NOT be reopened. The bug is entirely on the *consuming* side (`resolveOptions`), not the *producing* side (`toWorking`).
- **D-47** (`03-01-PLAN.md`/`03-04-PLAN.md`, cross-referenced) locked "a known option present with a non-`undefined` value of the wrong type throws" — the WR-01 fix must preserve this for every option EXCEPT the specific null-as-absent-sentinel case, which is why the fix is scoped to `value === ABSENT_DEFAULT_BY_TYPE[expected]`, not a blanket `value == null`.
- **Candidate fixes considered:**
  1. **Recommended: type-keyed absent-normalization in `resolveOptions`** (shown above). Smallest diff, reuses the existing table-driven pattern, self-documenting, automatically extends to any future string-typed option whose absent-default is also `null`.
  2. **Omit the key at serialize time instead of emitting `null`.** Rejected — directly reopens D-48, which was deliberately decided against `undefined`-dropping specifically because it makes the block's shape option-dependent (`03-04-PLAN.md:110`, read this session: "`JSON.stringify` **drops** undefined-valued keys, so the block would serialize with three keys in the default case and four when a prefix is supplied"). Reversing this is a locked-decision regression, not a fix.
  3. **A dedicated `reproduceFromWorking(working)` helper that pre-processes `render` before calling `generateSigil`.** Rejected as the primary fix — it patches over the contract instead of fixing it, leaves `generateSigil(s, p, working.render)` (the exact call `json.js`'s own doc comment describes) still broken, and adds a second, redundant entry point. Could be added later as an ergonomic convenience, but does not close WR-01 on its own.

## Common Pitfalls

### Pitfall 1: Fixing WR-01 by loosening validation too broadly
**What goes wrong:** A fix that treats `null` as absent for ALL options (not just string-typed ones whose default IS `null`) silently makes `{ glyph: null }` valid, breaking `test/cli/cli.test.js:389-400`'s explicit "null is a wrong type, not absent" contract for booleans.
**Why it happens:** `null == undefined` is tempting to reach for as a one-line fix (`value == null` with loose equality), but it doesn't respect the type-keyed absent-default table already in place.
**How to avoid:** Scope the check to `value === ABSENT_DEFAULT_BY_TYPE[expected]`, exactly as shown above — this is type-specific by construction.
**Warning signs:** If `test/cli/cli.test.js:389-400` ("treats null as a wrong type (not absent) for a boolean option and throws") starts failing after the WR-01 fix, the fix was scoped too broadly.

### Pitfall 2: Treating the SUMMARY frontmatter backfill as needing re-derivation
**What goes wrong:** Re-deriving which requirements each Phase 2 plan satisfies from scratch (by re-reading all four PLAN.md/SUMMARY.md files) risks a different, possibly less accurate mapping than the one already audited and locked into `02-VERIFICATION.md`.
**Why it happens:** The audit doesn't hand you the mapping directly — you have to know to invert `02-VERIFICATION.md`'s requirement→plans table into plan→requirements.
**How to avoid:** Use the table already derived in this research (above) rather than re-deriving.
**Warning signs:** A backfilled value that doesn't match a row in `02-VERIFICATION.md:182-187`.

### Pitfall 3: Assuming WR-04's fix needs to touch the library
**What goes wrong:** Extra-positional-argument handling belongs entirely in the CLI (`bin/sigil-spinner.js`) — `generateSigil` has no concept of "extra arguments," it takes exactly `(statement, planet, options)`. Routing this through the library would violate Anti-Pattern 3 (validation lives in the library) in reverse — this specific validation is CLI-shape, not domain-shape, and belongs in the CLI.
**Why it happens:** The project's strong "validation lives in the library" convention (D-47, INT-04) can be over-applied.
**How to avoid:** `E_CLI_USAGE` already exists as the CLI-local-only error class precisely for this kind of argv-shape problem (`bin/sigil-spinner.js:56-60`'s own doc comment: "Has no library analog — it is never constructed as `SigilError`").

## Code Examples

### WR-01 fix — the full `resolveOptions` diff shape

```js
// src/generate.js — inside resolveOptions, replacing the current absent-check
for (const [name, expected] of Object.entries(KNOWN_OPTIONS)) {
  const value = options[name];
  if (value === undefined || value === ABSENT_DEFAULT_BY_TYPE[expected]) {
    resolved[name] = ABSENT_DEFAULT_BY_TYPE[expected];
    continue;
  }
  // ...rest unchanged (type check, empty-string check, assignment)
}
```

### WR-04 fix — the extra-positional check

```js
// bin/sigil-spinner.js — immediately after `const { values, positionals } = parsed;`
if (positionals.length > 1) {
  diagnose(
    E_CLI_USAGE,
    `unexpected extra argument(s): ${positionals.slice(1).join(', ')} (only one statement positional is accepted; use - to read from stdin)`,
    CLI_USAGE_EXIT_CODE,
  );
}
```

### Round-trip regression test shape (new coverage for WR-01)

```js
// test/cli/cli.test.js or test/determinism.test.js — new describe block
it('round-trips working.render straight back into generateSigil without throwing', () => {
  const first = generateSigil('I WILL SUCCEED', 'saturn');
  expect(() => generateSigil('I WILL SUCCEED', 'saturn', first.working.render)).not.toThrow();
  const second = generateSigil('I WILL SUCCEED', 'saturn', first.working.render);
  expect(second.svg).toBe(first.svg);
});

it('round-trips working.render with idPrefix present', () => {
  const first = generateSigil('I WILL SUCCEED', 'saturn', { idPrefix: 'sig-a' });
  const second = generateSigil('I WILL SUCCEED', 'saturn', first.working.render);
  expect(second.svg).toBe(first.svg);
});
```

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|----------------|
| A1 | Phase 2's WR-02 (`perpendicularUnit` zero-length fallback reachability) is a genuinely live code path, not just a documentation nit | Tech Debt Register item 9 | Reasoned from static code reading (the `endMarker` call site's `points.length >= 2` guard doesn't check vector magnitude) but NOT confirmed by an executed repro this session — if wrong, the item is purely cosmetic (doc-comment wording) rather than a latent behavioral gap worth a repro test. Low risk either way since severity is already "defer" and the fallback's return value is deterministic and sane regardless. |
| A2 | The three "fix now" items produce zero snapshot churn | Tech Debt Register, WR-01/WR-04/README sections | Reasoned from code-path analysis (validation-path-only for WR-01, new-diagnostic-only for WR-04, docs-only for README) rather than by running the suite post-fix, since the fixes don't exist yet. If wrong for WR-01 specifically, the executor will see it immediately as a snapshot-diff at `npx vitest run` and must treat it as a plan-scope violation requiring a stop, not a silent accept. |

**If this table is empty:** N/A — two low-risk assumptions logged above; both are reasoning-based extrapolations from live-read source, not claims requiring user confirmation before planning proceeds.

## Open Questions

1. **Should the phase's success criteria include all three "cheap, bundle if room" items (WR-03 ordering, WR-02 exports, SUMMARY backfill), or only the three ROADMAP-named items?**
   - What we know: The ROADMAP's scope seeds name only WR-01, WR-04, and the README gap explicitly. The other 8 audit items are real, confirmed-open, and (for 3 of them) cheap to fix in the same phase with no file-conflict risk against Waves 1–2.
   - What's unclear: Whether "closing the tech debt carried out of the v1.0 milestone audit" (the phase's stated goal, verbatim from ROADMAP.md) means "the register in full" or "the three items the audit itself flagged as worth prioritizing."
   - Recommendation: Treat the 3 ROADMAP-named items as the phase's mandatory success criteria, and the 3 "cheap, bundle" items as a stretch wave the planner can include if it keeps the plan a clean single- or two-wave shape — do NOT force the 5 "defer" items into scope; each has an explicit, verified reason to stay out (unreachable, disclosed-not-silent, live-verified-non-issue, or purely cosmetic).

2. **Does the WR-01 fix's existing-test inversion (`test/cli/cli.test.js:461-472`) need a CONTEXT.md-style explicit sign-off, given it changes asserted behavior rather than just adding coverage?**
   - What we know: No CONTEXT.md exists for this phase (confirmed — `/gsd-discuss-phase` was not run). The test currently asserts the broken behavior as correct.
   - What's unclear: Whether flipping an existing assertion needs a distinct decision record (a new D-number) the way D-47/D-48 were recorded in Phase 3, or whether "fixes the bug the audit named as priority #1" is self-justifying.
   - Recommendation: The planner should record this inversion as an explicit decision in the plan (not silently change the assertion), since a reviewer scanning the diff should see "this test's meaning changed on purpose" rather than discover it by accident.

## Environment Availability

Not applicable — this phase adds no new external dependencies, tools, or services. All required tooling (`node`, `npx vitest`, `tsc`, `eslint`) is already installed and was exercised live this session: `npx vitest run --exclude test/browser` → **1405/1405 passed**, 17 files, confirming the baseline is green before any Phase 4 change is made. (The audit's 1423 figure includes the 18 browser-only tests in `test/browser/theming-resolution.test.js`, which require a one-time `npx playwright install chromium` per the project's documented Blockers/Concerns in `STATE.md:127` — not re-verified this session since no Phase 4 item touches rendering/theming.)

## Validation Architecture

Skipped. `.planning/config.json`'s `workflow.nyquist_validation` is explicitly `false` (confirmed by reading the file this session), matching the same configuration the v1.0 milestone audit itself noted ("Nyquist Compliance: Skipped... which is correct for this configuration — not a coverage gap").

For ordinary phase verification (not Nyquist-specific), the existing test commands remain: `npx vitest run` (full suite, currently 1405 non-browser + 18 browser = 1423), `npm run typecheck` (`tsc --allowJs --checkJs --noEmit`), `npm run lint` (`eslint .`) — all three were the automated verification gate for every prior phase per `v1.0-MILESTONE-AUDIT.md`'s own "Automated Verification" table, and should remain the gate for Phase 4's plans.

## Security Domain

`security_enforcement` is `true`, ASVS level 1, block on `high` (confirmed from `.planning/config.json` this session). None of the eleven tech-debt items introduce a new untrusted-input surface — they are internal-correctness and diagnostics fixes over an already-closed threat model (Phase 3's `03-04-PLAN.md` threat model, T-03-16 through T-03-22, already covers the one caller-controlled string this project emits into markup, `idPrefix`, via `escapeXml`).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|----------------|---------|-------------------|
| V2 Authentication | No | No auth surface in this CLI/library |
| V3 Session Management | No | No sessions |
| V4 Access Control | No | No access boundaries |
| V5 Input Validation | Yes | The existing `SigilError` taxonomy (`src/errors.js`) and `resolveOptions`'s type-keyed validation table (`src/generate.js:56-147`) — WR-01's fix must extend this table's discipline, not bypass it. WR-04's fix extends the CLI-local `E_CLI_USAGE` diagnostic pattern (`bin/sigil-spinner.js:56-89`) to a new malformed-argv shape (extra positionals) — this is additive hardening of the existing input-validation posture, not a new surface. |
| V6 Cryptography | No | Not applicable — no crypto in this project |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|-----------------------|
| Re-exporting error code constants from `src/index.js` (WR-02 fix) | Information disclosure (theoretical, not real) | None needed — `E_*` values are already visible in every thrown error's `.code` property and in the public README's Errors and Exit Codes table (`README.md:401-421`); re-exporting the constants themselves discloses nothing not already public. No threat. |
| Extra-positional CLI diagnostic (WR-04 fix) | Tampering (theoretical) | The new diagnostic only echoes back the caller's own already-supplied argv values (`positionals.slice(1).join(', ')`) to stderr — same posture as every other existing diagnostic in this file (e.g., the existing `E_UNKNOWN_PLANET` message already echoes the caller's planet string). No new escaping requirement, since stderr text output was never an XML/HTML sink. |

No new threats introduced by this phase; no SECURITY.md changes anticipated beyond re-affirming the existing register is unchanged.

## Sources

### Primary (HIGH confidence — read directly this session)
- `src/generate.js` (full file, 274 lines) — `resolveOptions`, `KNOWN_OPTIONS`, `ABSENT_DEFAULT_BY_TYPE`, validation ordering
- `src/render/json.js` (full file, 108 lines) — `SigilWorking` typedef, `toWorking`, the round-trip doc-comment contract
- `src/errors.js` (full file, 46 lines) — error taxonomy, `SigilError`
- `src/index.js` (full file, 8 lines) — public export surface
- `bin/sigil-spinner.js` (full file, 160 lines) — CLI argv handling, `EXIT_CODES`, `E_CLI_USAGE`/`E_CLI_STDIN`, `diagnose()`
- `src/data/kamea.js` (full file, 257 lines) — `gridSize`, `kameaGrid`, `resolvePlanetKey`, `resolveSet`
- `src/render/coords.js` (full file, 114 lines) — `roundGeometry`, `formatCoord`, `-0` handling
- `src/render/svg.js` (relevant sections, lines 360-511) — `perpendicularUnit`, `endMarker`, `loopDirection`
- `src/path/buildPath.js` (full file, 103 lines) — `PathModel`, point retention for consecutive repeats
- `test/cli/cli.test.js` (full file, 531 lines) — existing CLI/option-validation test conventions
- `test/render/json.test.js` (full file, 153 lines) — existing `toWorking`/render-block test conventions
- `README.md` (relevant sections, lines 1-90, 268-297, 401-448) — field documentation, error table, worked example
- `.planning/v1.0-MILESTONE-AUDIT.md` (full file) — the tech-debt register itself
- `.planning/REQUIREMENTS.md`, `.planning/STATE.md`, `.planning/ROADMAP.md` (full files) — project/phase context
- `.planning/phases/03-themeable-embeddable-layers/03-04-PLAN.md` (relevant sections) — D-47/D-48 decision text
- `.planning/phases/02-every-planet-every-statement/02-VERIFICATION.md` (relevant sections) — Requirements Coverage table for SUMMARY backfill
- `.planning/phases/02-every-planet-every-statement/02-0{1,2,3,4}-SUMMARY.md` (frontmatter) — confirmed all four omit `requirements-completed`
- `.planning/phases/01-first-sigil-end-to-end/01-01-SUMMARY.md` (frontmatter) — confirmed correct-format example
- `.planning/config.json` (full file) — `nyquist_validation: false`, `security_enforcement: true`, ASVS level 1
- `package.json`, `vitest.config.js` — tooling/scripts confirmation
- Live command execution this session: `npx vitest run --exclude test/browser` (1405/1405 passed), three live-reproduced `node -e` repros for WR-01/WR-04/WR-03, and a direct JS `-0` serialization check

### Secondary / Tertiary
None used — every claim in this document traces to a file read or a command executed this session.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new stack; existing CLAUDE.md stack table applies unchanged
- Architecture: HIGH — every pattern cited is read directly from source with line numbers, not inferred
- Tech-debt register: HIGH — all 11 items re-confirmed against live code this session; 3 of them additionally live-reproduced by executing actual code paths
- Pitfalls: HIGH — derived directly from the existing test suite's own assertions (`test/cli/cli.test.js:389-400`, `461-472`)

**Research date:** 2026-08-07
**Valid until:** Until the codebase changes — this is a point-in-time snapshot of an existing repo's defect state, not time-decaying external-library research. Re-verify file:line citations if any Phase 4 plan sits unexecuted for more than a few days while other work lands on `main`.
