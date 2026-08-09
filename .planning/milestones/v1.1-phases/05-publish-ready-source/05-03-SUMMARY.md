---
phase: 05-publish-ready-source
plan: 03
subsystem: cli-and-rendering
tags: [accessibility, aria, cli-parity, playwright, svg]

# Dependency graph
requires:
  - phase: 05-01
    provides: "test/citations.test.js — the new svg.js doc-comment edits in this plan satisfy that checker"
  - phase: 05-02
    provides: "clean, fully-cited src/render/svg.js and bin/sigil-spinner.js for this plan to build on"
provides:
  - "--title CLI flag (bin/sigil-spinner.js) — parity with the library's existing options.title (INT-05)"
  - "Conditional role=\"img\" / aria-labelledby on the root <svg>, and an id on <title>, emitted only when title and a non-empty idPrefix are both present (INT-06)"
  - "test/browser/accessible-name.test.js — real-Chromium accessible-name resolution via Playwright's role+name locator"
  - "Phase-wide snapshot-attribution seal: exactly 2 of 48 committed snapshots rebased across the whole phase, both JSON-shaped, both traceable to 05-02 (PKG-02)"
affects: [published-package, wrap-01-sigil-spinner-element]

# Actuals (#2632) — pairs with the plan's estimate to calibrate future estimates.
actuals:
  tokens: 5319
  tasks: 3
  commits: 3

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Hoisted escaped-value local (escapedIdPrefix) reused across multiple emitted attribute values, keeping escapeXml's call-site count fixed even as the number of attributes it feeds grows — extends D-44's original single-attribute pattern to two attributes plus one ARIA reference"
    - "role/aria-labelledby gated on the conjunction of two independent options (title AND idPrefix), not either alone — an accessible-name claim is only made to assistive technology when it can actually resolve"

key-files:
  created:
    - test/browser/accessible-name.test.js
  modified:
    - src/render/svg.js
    - bin/sigil-spinner.js
    - README.md
    - test/render/svg.test.js
    - test/cli/cli.test.js

key-decisions:
  - "role=\"img\"/aria-labelledby/title-id are emitted ONLY when title AND a non-empty idPrefix are both present — title-only stays a bare <title> with no synthesized id, matching D-44's id-free-by-construction discipline and the plan's own resolved discretion point"
  - "Title id derived as escaped idPrefix + literal suffix '-title', computed from the same escapedIdPrefix local the root id already uses — keeps escapeXml at exactly two invocation call sites, which test/render/svg.test.js asserts mechanically"
  - "Rejected a corruption-based 'fail-first' browser test that diverges the aria-labelledby value from the title's own id while leaving <title> itself intact — verified empirically that Chromium's SVG-AAM native <title>-child accessible-name mapping is an UNCONDITIONAL fallback, independent of whether aria-labelledby resolves, so that specific corruption cannot demonstrate test teeth. Used a genuinely discriminating corruption instead: removing the <title> element while keeping role/aria-labelledby, which correctly returns zero matches"

patterns-established:
  - "Pattern: gate an ARIA claim on the conjunction of every option required for it to resolve, not on the primary option alone — a role or label announced to assistive technology must ship together with what makes it true, or not at all (T-05-10's own framing)"

requirements-completed: [INT-05, INT-06]

coverage:
  - id: D1
    description: "--title is a seventh presence-only boolean CLI flag with library parity — CLI output with the flag is byte-identical to the library's { title: true } output, and without it is byte-identical to a no-options library call"
    requirement: "INT-05"
    verification:
      - kind: unit
        ref: "test/cli/cli.test.js#CLI --title flag (INT-05, INT-06, D-46) > produces byte-identical SVG through --title as through the library { title: true } option"
        status: pass
      - kind: unit
        ref: "test/cli/cli.test.js#CLI --title flag (INT-05, INT-06, D-46) > running the CLI without --title still produces output byte-identical to a library call with no options at all"
        status: pass
      - kind: unit
        ref: "test/cli/cli.test.js#CLI --title flag (INT-05, INT-06, D-46) > the JSON working from --title --json records render.title as true at its authored fourth position"
        status: pass
    human_judgment: false
  - id: D2
    description: "A sigil with both a title and a non-empty idPrefix carries role=\"img\" and aria-labelledby on the root <svg>, and an id on <title> that aria-labelledby references — resolved by a real browser's accessibility tree, not just markup shape"
    requirement: "INT-06"
    verification:
      - kind: unit
        ref: "test/render/svg.test.js#renderSvg — accessible name wiring (INT-06) > emits role=\"img\" on the root, a matching id on <title>, and an aria-labelledby reference equal to it, when both title and idPrefix are present"
        status: pass
      - kind: e2e
        ref: "test/browser/accessible-name.test.js#accessible name resolves in a real browser accessibility tree (INT-06) > resolves the accessible name to the statement for a plain idPrefix"
        status: pass
      - kind: e2e
        ref: "test/browser/accessible-name.test.js#accessible name resolves in a real browser accessibility tree (INT-06) > resolves the accessible name to the statement for an idPrefix containing XML metacharacters (INT-06 encoding edge)"
        status: pass
      - kind: e2e
        ref: "test/browser/accessible-name.test.js#accessible name resolves in a real browser accessibility tree (INT-06) > is proven fail-first: an SVG missing its <title> element, despite still carrying role=\"img\" and aria-labelledby, has no accessible name matching the statement"
        status: pass
    human_judgment: false
  - id: D3
    description: "A hostile or metacharacter-bearing idPrefix cannot terminate or inject into either the title id or the aria-labelledby attribute value; the title-only and idPrefix-only paths stay byte-identical to the pre-phase tree; the public API rejects an empty statement even with title on"
    requirement: "INT-06"
    verification:
      - kind: unit
        ref: "test/render/svg.test.js#renderSvg — accessible name wiring (INT-06) > escapes a hostile idPrefix so it cannot terminate the title id or the aria-labelledby attribute, and the reference still resolves"
        status: pass
      - kind: unit
        ref: "test/render/svg.test.js#renderSvg — accessible name wiring (INT-06) > escapes ampersand, single quote, and less-than in idPrefix to entity form in both the title id and the aria-labelledby reference"
        status: pass
      - kind: unit
        ref: "test/render/svg.test.js#renderSvg — accessible name wiring (INT-06) > emits a bare <title> with no id, no role, and no aria-labelledby when title is on but idPrefix is absent — byte-identical to the pre-phase title-only tree"
        status: pass
      - kind: unit
        ref: "test/render/svg.test.js#renderSvg — accessible name wiring (INT-06) > the public entry point rejects an empty statement before rendering, even with the title option on"
        status: pass
    human_judgment: false
  - id: D4
    description: "Phase-wide seal: full suite, typecheck, lint, and citation checker all pass; zero runtime dependencies; exactly 2 of 48 committed snapshots rebased across the whole phase, both JSON-shaped and traceable to 05-02; determinism holds across two consecutive CLI runs in both output modes"
    requirement: "INT-06"
    verification:
      - kind: other
        ref: "npm test (1474/1474 passing, 20 files), npm run typecheck (exit 0), npm run lint (exit 0), npx vitest run test/citations.test.js (exit 0)"
        status: pass
      - kind: other
        ref: "git diff --name-only 7eda6a95..HEAD -- test/__file_snapshots__ test/render/__snapshots__ lists exactly worked-example.working.json and json.test.js.snap"
        status: pass
    human_judgment: false

duration: 20min
completed: 2026-08-08
status: complete
---

# Phase 05 Plan 03: Accessible Titled Sigils, CLI Parity, and the Phase Seal Summary

**Wired `--title` to full CLI/library parity, added conditional `role="img"`/`aria-labelledby`/title-`id` to the SVG renderer so a titled sigil with an id prefix resolves its accessible name in a real browser, and sealed the phase by verifying the two-of-forty-eight snapshot-attribution claim from git.**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-08-08T14:00:00Z (approx.)
- **Completed:** 2026-08-08T14:07:00Z (approx.)
- **Tasks:** 3
- **Files modified:** 6 (1 new file, 5 modified)

## Accomplishments

- `bin/sigil-spinner.js` gained `--title` as a seventh presence-only boolean `parseArgs` flag (matching `--glyph`/`--curve`'s shape, no negated form), threaded as `title: titleArg` into `generateSigil` — the library already validated `title` (`resolveOptions`'s `KNOWN_OPTIONS` table), so the CLI adds zero new validation, per the project's "Anti-Pattern 3: CLI-Only Validation" convention. Confirmed `git diff -U0` on this file contains no hunk covering line 20 — the deferred D-12 item's reopen condition stays untriggered.
- `src/render/svg.js`'s title/id construction was restructured: `idPrefix`'s `escapeXml` call is hoisted into one `escapedIdPrefix` local, reused for both the root `id` and a new `titleId` (`${escapedIdPrefix}-title`). `role="img"` and `aria-labelledby="${titleId}"` on the root, and `id="${titleId}"` on `<title>`, are emitted only when `options.title` AND a non-empty `idPrefix` are both present — title-only and idPrefix-only paths are byte-identical to the pre-phase tree. `escapeXml` stays at exactly two invocation call sites (title text, id prefix), which `test/render/svg.test.js` asserts mechanically.
- One real CLI invocation confirmed end to end: `node bin/sigil-spinner.js "I WILL SUCCEED" --planet saturn --title --id-prefix sig-a` emits `role="img"`, `aria-labelledby="sig-a-title"`, and `<title id="sig-a-title">` — the reference and the id are the identical string.
- `test/render/svg.test.js` gained a new INT-06 describe block: role/aria/title-id assertion via derived comparison (not two independent hardcoded literals), the 2-vs-1 `id="` occurrence contrast between both-present and idPrefix-only, hostile and metacharacter idPrefix escaping in the new attributes, both negative-case byte checks (title-only and idPrefix-only unchanged from pre-phase), and a guard that the public entry point throws `E_MISSING_STATEMENT` for an empty statement even with `title: true` — proving a role-bearing SVG with an empty accessible name can never ship through the public API.
- `test/cli/cli.test.js` gained an INT-05 describe block: `--title` byte-parity with the library, no-flag byte-parity with a no-options call, `render.title` at its authored fourth JSON key position, and `--title` + `--id-prefix` producing the role/aria/title-id triple through the CLI surface.
- `test/browser/accessible-name.test.js` (new, 105 lines) drives real Chromium via Playwright, following `theming-resolution.test.js`'s harness pattern exactly (same `beforeAll` launch, same loud failure message, same teardown). Asserts the accessible name resolves to the statement for a plain idPrefix and for one containing XML metacharacters, using `page.getByRole('img', { name, exact: true })` — the actual accessible-name computation algorithm, not a markup-shape proxy.
- README.md documents `--title` in the CLI synopsis and flag list, adds an "Accessible name (INT-06)" paragraph to Multi-Embed Safety naming the both-present behavior and the title-only limit explicitly (not left implicit), and names `--title` alongside `options.title` in Data Handling's opt-in framing.
- Phase seal: `npm test` (1474/1474, 20 files), `npm run typecheck` (exit 0), `npm run lint` (exit 0), `npx vitest run test/citations.test.js` (exit 0), `package.json` `dependencies` still `{}`, no `dist`/build directory. Snapshot attribution verified from git, not restated: `git diff --name-only 7eda6a9581cf0c288b6868638cc7d9087f3a3305..HEAD -- test/__file_snapshots__ test/render/__snapshots__` returns exactly `test/__file_snapshots__/worked-example.working.json` and `test/render/__snapshots__/json.test.js.snap` — both with `git diff --numstat` showing 1 insertion / 0 deletions, both traceable to 05-02's `kameaVersion` field. Zero SVG-shaped snapshots moved because no committed snapshot exercises `title: true`. Two consecutive `node bin/sigil-spinner.js "I WILL SUCCEED" --planet saturn` runs are byte-identical in both plain-SVG and `--json` mode.

## Task Commits

Each task was committed atomically:

1. **Task 1: Accessible titled sigil end to end, from one CLI invocation** — `80c8fa4` (feat)
2. **Task 2: Parity, edge-case, and real-browser accessible-name test surface** — `c2310f2` (test)
3. **Task 3: Document the flag and the accessible name, then seal the phase** — `99f9866` (docs)

**Plan metadata:** commit pending (this SUMMARY + STATE/ROADMAP/REQUIREMENTS update)

## Files Created/Modified

- `bin/sigil-spinner.js` - `title` added as the seventh `parseArgs` boolean option; `titleArg` local; `title: titleArg` threaded into `generateSigil`. Line 20 (the D-12 deferred-item marker) untouched.
- `src/render/svg.js` - Hoisted `escapedIdPrefix`; new `titleId`, `hasAccessibleTitle`, `titleIdAttr`, `roleAttr`, `ariaLabelledByAttr` locals; conditional `role`/`aria-labelledby` on the root, conditional `id` on `<title>`.
- `test/render/svg.test.js` - New "renderSvg — accessible name wiring (INT-06)" describe block (7 tests); reworded the `escapeXml` call-site-count assertion's description.
- `test/cli/cli.test.js` - New "CLI --title flag (INT-05, INT-06, D-46)" describe block (4 tests).
- `test/browser/accessible-name.test.js` - New file (105 lines, 3 tests): real-browser accessible-name resolution.
- `README.md` - `[--title]` in the CLI synopsis; `--title` flag bullet; "Accessible name (INT-06)" paragraph in Multi-Embed Safety; `--title` named in Data Handling.

## Decisions Made

- Emitted `role`/`aria-labelledby`/title-`id` only when title AND idPrefix are both present, exactly as the plan's resolved discretion point specified — title-only stays a bare `<title>`, deliberately not augmented with a synthesized id nobody asked for right before an irreversible publish.
- Derived the title id from the same hoisted `escapedIdPrefix` local the root id already used, rather than calling `escapeXml` a second time — keeps the module's call-site count assertion (exactly two) trivially satisfiable and avoids a second escaping code path to keep in sync.
- Rejected a browser-test "fail-first" design that corrupts only the `aria-labelledby` value while leaving `<title>` intact (see Deviations below) — verified empirically that this specific corruption does not actually break resolution in Chromium, then designed a corruption that does.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The plan's specified "fail-first" browser-test corruption does not produce a failing test in Chromium**

- **Found during:** Task 2, while writing `test/browser/accessible-name.test.js`'s fail-first proof.
- **Issue:** The plan's acceptance criteria specified proving the browser test has teeth by "temporarily changing the title id suffix in `src/render/svg.js` so it no longer matches the ARIA reference." I performed this literally — temporarily editing `src/render/svg.js` so the `aria-labelledby` value diverged from the `<title>` element's own `id` (e.g. `aria-labelledby="sig-a-title-BROKEN"` while `<title id="sig-a-title">` stayed correct) — and ran the two required positive tests plus a corruption-based test against it. Both required positive tests still PASSED against the broken source. Independent empirical verification (multiple constructed cases: nonexistent-id reference, self-referencing root id, reference to a real but unrelated empty element) confirmed the cause: Chromium's SVG-AAM accessible-name computation treats the `<title>` child element as an unconditional fallback naming source, applied *regardless* of whether `aria-labelledby` resolves. A `<title>` descendant with the right text supplies the accessible name even when the explicit ARIA wiring pointing at it is completely broken or absent — even a bare `<title>` with no `role`/`aria-labelledby` at all already resolves via Chromium's implicit role mapping.
- **Fix:** Reverted the temporary source corruption (confirmed `git diff` was clean against the Task 1 commit afterward — no residual change landed). Designed a corruption that IS genuinely discriminating: removing the `<title>` element entirely while leaving `role="img"` and `aria-labelledby` intact. This reproduces T-05-10's exact concern (a graphic role announced to assistive technology with an unresolvable name) and correctly returns zero accessible-name matches. This is the test committed in `test/browser/accessible-name.test.js`.
- **Files modified:** `test/browser/accessible-name.test.js` only — no production code changed as a result of this finding; `src/render/svg.js`'s actual shipped wiring is unaffected and was verified clean before commit.
- **Verification:** `npx vitest run test/browser/accessible-name.test.js` — 3/3 passing, including the corrected fail-first test. Re-ran the original corrupted-source experiment one more time immediately before writing this summary to confirm the finding is reproducible, then confirmed `git diff --stat src/render/svg.js` against the Task 1 commit was empty.
- **Committed in:** `c2310f2` (Task 2 commit) — no separate commit needed since the correction was made before any commit landed.

---

**Total deviations:** 1 auto-fixed (Rule 1 — a test-design assumption in the plan's acceptance criteria that didn't hold empirically against real browser behavior; corrected with a test that genuinely discriminates the regression it exists to catch). No production code was affected; INT-06's actual accessible-name guarantee is unaffected and independently verified by the two required positive browser tests plus the corrected fail-first test.

## Issues Encountered

- The plan's acceptance criterion for proving browser-test teeth assumed a specific corruption mechanism (diverging the id/aria-labelledby correspondence) that turns out not to be discriminating in Chromium, due to SVG-AAM's native `<title>`-child fallback naming being unconditional. Documented above as a deviation with the actual empirical finding, since it's relevant to anyone extending this test file later — corrupting the ARIA plumbing alone will not make this class of test fail; the `<title>` element's presence and text content is what the browser actually keys on.

## User Setup Required

None - no external service configuration required. Chromium was already installed on this machine from Phase 3's `theming-resolution.test.js` setup; the plan's `<precondition>` on Task 2 was met with no action needed.

## Next Phase Readiness

- Phase 5 (Publish-Ready Source) is complete: all three plans (05-01 citation integrity, 05-02 kamea version, 05-03 this plan) executed, all four phase success criteria satisfied — reachability parity (criterion 2), accessible name via real browser (criterion 3), determinism and snapshot-attribution review (criterion 5), zero-dependency/no-build-step intact.
- 1474 tests passing, typecheck and lint clean, citation checker clean, `package.json` `dependencies` still `{}`.
- Phase 6 (Published Package) can proceed — it is gated on the npm automation token human gate (documented in STATE.md), not on anything this plan leaves open.
- No blockers.

---
*Phase: 05-publish-ready-source*
*Completed: 2026-08-08*

## Self-Check: PASSED

- FOUND: test/browser/accessible-name.test.js
- FOUND: .planning/phases/05-publish-ready-source/05-03-SUMMARY.md
- FOUND: src/render/svg.js
- FOUND: bin/sigil-spinner.js
- FOUND: README.md
- FOUND: test/render/svg.test.js
- FOUND: test/cli/cli.test.js
- FOUND commit: 80c8fa4
- FOUND commit: c2310f2
- FOUND commit: 99f9866
