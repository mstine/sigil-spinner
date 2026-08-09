---
phase: 07-the-sigil-spinner-element
plan: 03
subsystem: packaging-and-docs
tags: [exports-map, npm-pack, custom-elements, drift-guard, readme]

# Dependency graph
requires:
  - phase: 07-the-sigil-spinner-element
    provides: "07-01's src/element/sigil-spinner-element.js and its observedAttributes — the source of truth this plan's exports entry and drift guard both key off"
provides:
  - "package.json exports[\"./element\"] and exports[\"./package.json\"] — the published-contract shape D-84 locked, additive only"
  - "test/pack-install.test.js's resolve-only ./element probe — proves the subpath resolves through exports AND the file shipped, from outside the package boundary, without evaluating the element module in Node"
  - "README.md § The <sigil-spinner> Custom Element — the full embedding contract: load snippet, attribute table, both documented footguns, sizing recipe, theming reach, inert/error states, multi-instance id policy, Node/server note"
  - "test/element-docs.test.js — mechanical drift guard binding the README's attribute table to observedAttributes in both directions (D-97)"
affects: []

actuals:
  tokens: 4448
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "ENTRY_POINTS row discriminator (resolveOnly: true) branches the existing probe-generation loop instead of rewriting it — D-72's 'data, not procedure' principle extended to a row whose probe body must never import the specifier"
    - "import.meta.resolve() paired with existsSync(fileURLToPath(...)) — resolution alone is not proof of shipping since Node 20.6.0 stopped throwing for missing file: targets"
    - "README/observedAttributes drift guard parses the element source as TEXT (regex against the static get observedAttributes() literal), never imports it — same read-as-text-not-as-module methodology as test/citations.test.js, required because the module dereferences HTMLElement at class-definition time"

key-files:
  created:
    - test/element-docs.test.js
  modified:
    - package.json
    - test/pack-install.test.js
    - README.md

key-decisions:
  - "D-84 (exports map shape) was preconfirmed by Matt at the pre-execution gate on 2026-08-09 and recorded in 07-CONTEXT.md — the checkpoint:decision task was resolved to d84-as-written without re-prompting, per the executor's preconfirmed-decision instructions."
  - "The README element section is inserted between § Multi-Embed Safety and § The JSON Working — the element's theming/id-policy prose directly cross-references Multi-Embed Safety's existing claims rather than restating them, and JSON Working is a build-time-only API section the element (a runtime DOM wrapper) has no relationship to."
  - "The README's script-load snippet uses a local node_modules-relative src path rather than a jsdelivr CDN URL pinned to a specific version — the CDN example in STACK.md pins @1.1.0, which is not yet published this phase (D-98); documenting a version that doesn't exist yet would be dishonest. The node_modules-relative path is accurate today and remains accurate once 1.1.0 ships."
  - "The drift guard's README table parser scopes its regex to the text between '### Attributes' and the next '###' heading, then matches backtick-wrapped first-column cells — this avoids accidentally matching backtick-wrapped tokens elsewhere in the README (e.g. in Multi-Embed Safety's cross-references)."

requirements-completed: [WRAP-01, WRAP-02]

coverage:
  - id: D1
    description: "@falkensmage/sigil-spinner/element resolves through the installed package's exports map AND the file it resolves to exists on disk in the installed tree, proven from a real pack-and-install outside the package boundary, without ever evaluating the module in Node"
    requirement: WRAP-01
    verification:
      - kind: automated
        ref: "test/pack-install.test.js rung 2 — resolve-only ./element probe (npm run test:pack)"
        status: pass
    human_judgment: false
  - id: D2
    description: "npm pack --dry-run ships src/element/sigil-spinner-element.js and nothing under examples/; the installed tarball declares zero runtime dependencies"
    requirement: WRAP-01
    verification:
      - kind: automated
        ref: "test/pack-install.test.js rung 1 (EXPECTED_TARBALL_FILES + examples/ exclusion assertion) and rung 2 (node_modules top-level === ['@falkensmage'])"
        status: pass
    human_judgment: false
  - id: D3
    description: "The README's documented element attribute set and SigilSpinnerElement.observedAttributes match exactly in both directions, derived from the source of truth"
    requirement: WRAP-02
    verification:
      - kind: automated
        ref: "test/element-docs.test.js — both assertions pass; fail-first mutation confirmed in both directions (extra README row, missing README row) before restoring"
        status: pass
    human_judgment: false
  - id: D4
    description: "package.json's version is still 1.0.0 and no publish occurred in this phase"
    requirement: WRAP-01
    verification:
      - kind: other
        ref: "node -e manifest inspection (version, dependencies, files, exports); .github/workflows/release.yml unmodified (git status --short)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The README documents the element's full contract including both footguns (D-80 naming exception, D-81 curve=\"false\"), the sizing recipe, the light-DOM reach, and the caller-owned id responsibility"
    requirement: WRAP-02
    verification:
      - kind: other
        ref: "grep checks: curve=\"false\" (3), display: inline-block (2), aspect-ratio: 1 / 1 (2), data-sigil-error (3); prose review of the SOLE-exception and SAME-id-prefix paragraphs"
        status: pass
    human_judgment: false

duration: 35min
completed: 2026-08-09
status: complete
---

# Phase 7 Plan 03: Ship and Document the Element — `exports`, the pack-install probe, and the README Summary

**Additive `package.json` `exports` entries for `./element` and `./package.json`, a resolve-only Node smoke-test row proving the subpath resolves AND the file shipped, and a full README section for `<sigil-spinner>` bound to `observedAttributes` by a mechanical drift guard — no publish, `version` still `1.0.0`.**

## Performance

- **Duration:** ~35 min
- **Completed:** 2026-08-09
- **Tasks:** 2 (1 preconfirmed checkpoint + 2 auto tasks)
- **Files modified:** 4 (1 new, 3 modified)

## Accomplishments

- Added exactly two keys to `package.json`'s `exports` object per the preconfirmed D-84 shape (`./element` → `./src/element/sigil-spinner-element.js`, `./package.json` → `./package.json`) — `main`, `bin`, `files`, `version`, `scripts`, `dependencies`, `devDependencies` all byte-identical, confirmed by `git diff`.
- Extended `test/pack-install.test.js`'s `ENTRY_POINTS` with a `resolveOnly: true` row for `./element`, branching the existing probe-generation loop rather than rewriting it. The generated probe pairs `import.meta.resolve()` with `existsSync(fileURLToPath(...))` — resolution alone cannot prove the file shipped since Node 20.6.0 stopped throwing for missing `file:` targets — and never `import`s the element specifier, since `class extends HTMLElement` would throw `ReferenceError` under Node for a correctly published package.
- Added `src/element/sigil-spinner-element.js` to `EXPECTED_TARBALL_FILES` and a new rung-1 assertion that no manifest path begins with `examples/` (D-95 — the demo page stays repo-only).
- Wrote a complete README section (`## The <sigil-spinner> Custom Element`) covering the script-load snippet with the client-JS-required framing, a full attribute table, the D-80 `show-title` naming exception stated in prose with its reason, the D-81 `curve="false"` presence-semantics footgun stated explicitly, the sizing recipe (`display: inline-block` + `aspect-ratio: 1 / 1`), the light-DOM/no-shadow-root theming-reach paragraph, the verbatim inert-state and error-state copy from the UI-SPEC's Copywriting Contract, the caller-owned same-`id-prefix`-collides responsibility stated in both directions, and the "`./element` requires a DOM" Node/server note.
- Wrote `test/element-docs.test.js`, a mechanical drift guard that parses `observedAttributes` from the element's source as text (never imports it) and the README's attribute table, asserting Set equality in both directions with a non-empty floor assertion on each side.
- Performed and recorded both required fail-first mutations against the drift guard, then restored the README to its correct state (see Deviations/Verification below).

## Task Commits

Each task was committed atomically:

1. **Checkpoint: lock the exports map shape (D-84)** — preconfirmed at the pre-execution gate on 2026-08-09 (`d84-as-written`), no separate commit; recorded in `07-CONTEXT.md`'s header table before this plan's execution.
2. **Task 1: Add the ./element exports subpath and prove it from an installed tarball** — `44a421e` (feat)
3. **Task 2: Document the element in README and bind the docs to the code with a drift guard** — `9904b63` (docs)

**Plan metadata:** commit pending (this SUMMARY + orchestrator-owned STATE.md/ROADMAP.md updates — this is a worktree-isolated parallel plan; per its execution instructions it does not touch STATE.md/ROADMAP.md itself)

## Files Created/Modified

- `package.json` — additive `exports` edit: `./element` and `./package.json` entries added, nothing else changed
- `test/pack-install.test.js` — one new resolve-only `ENTRY_POINTS` row, one new `EXPECTED_TARBALL_FILES` entry, one new rung-1 `examples/`-exclusion assertion
- `README.md` — new `## The <sigil-spinner> Custom Element` section (script load, attributes table, sizing, theming reach, inert/error states, multi-instance ids, Node/server note)
- `test/element-docs.test.js` — new file, README ↔ `observedAttributes` drift guard (D-97)

## Decisions Made

- D-84 was already confirmed by Matt before execution (per `07-CONTEXT.md`'s header table); the `checkpoint:decision` task was resolved to `d84-as-written` rather than re-prompted, per this executor's explicit preconfirmed-decision instructions.
- The README's script-load snippet uses `./node_modules/@falkensmage/sigil-spinner/src/element/sigil-spinner-element.js` rather than a pinned jsdelivr CDN URL — STACK.md's own CDN example pins a `@1.1.0` that this phase deliberately does not publish (D-98); documenting a not-yet-real published version would misrepresent the current state. The node_modules-relative path is honest today and stays honest once `1.1.0` ships.
- Placed the new README section between `## Multi-Embed Safety` and `## The JSON Working` — the element section cross-references Multi-Embed Safety's existing id-collision prose rather than duplicating it, and the JSON Working section (a build-time-only API concept) has no relationship to a runtime DOM wrapper.

## Deviations from Plan

None — plan executed exactly as written. One plan-mandated verification step is worth restating here rather than as a deviation: the plan's acceptance criteria required performing the drift guard's fail-first mutation test in both directions and recording the observed failures, then restoring the README. Both were performed:

- **Mutation 1 (extra attribute):** added a `bogus-mutation-test-attribute` row to the README table. `npx vitest run test/element-docs.test.js` FAILED with `README documents attribute(s) not in observedAttributes: bogus-mutation-test-attribute`.
- **Mutation 2 (missing attribute):** removed the `glyph` row from the README table. `npx vitest run test/element-docs.test.js` FAILED with `observedAttributes has attribute(s) undocumented in README: glyph`.
- Both mutations were reverted; the guard passes cleanly against the restored README (confirmed by a subsequent full test run: 23 files / 1501 tests, all green).

## Issues Encountered

- `tsc --allowJs --checkJs` required explicit JSDoc typing for `ENTRY_POINTS`'s two now-heterogeneous row shapes (`{ subpath, namedExports }` vs. `{ subpath, resolveOnly }`) — without a `@typedef` making both fields optional, TypeScript would either reject property access across the union or fail to narrow `namedExports` back to non-`undefined` after the `resolveOnly` branch's `continue`. Fixed by adding an `EntryPointRow` typedef with both `namedExports` and `resolveOnly` optional, plus an explicit runtime guard (`if (!entry.namedExports) throw ...`) that also satisfies TypeScript's control-flow narrowing. Caught by `npm run typecheck` before it could ship as a silent type hole; not a deviation from the locked contract, just an implementation-shape detail the plan left to discretion.

## User Setup Required

None — no external service configuration required. `npm run test:pack` and `npm test` both run locally with no new prerequisites (Chromium was already required and already installed from Plan 01).

## Next Phase Readiness

- `package.json`'s `exports` map, `test/pack-install.test.js`'s packaging proof, and the README's documentation contract are all complete and committed. Full suite (23 files / 1501 tests), `typecheck`, `lint`, and the citation checker all pass with the new/modified files included.
- Publishing `1.1.0` to the registry remains a named milestone-close action (D-98) — this plan does not touch `.github/workflows/release.yml` and does not bump `version`, confirmed by `git status --short .github/workflows/release.yml` (clean) and a direct `package.json` manifest inspection (`version: "1.0.0"`).
- No blockers. This plan's declared file scope (`package.json`, `test/pack-install.test.js`, `README.md`, `test/element-docs.test.js`) had zero overlap with the parallel 07-02 plan's scope (`examples/element.html`, `test/browser/element.test.js`), confirmed throughout — neither file was read or touched by this plan's tasks.

## Self-Check: PASSED

- FOUND: `package.json` (exports edit present)
- FOUND: `test/pack-install.test.js` (resolve-only row present)
- FOUND: `README.md` (element section present)
- FOUND: `test/element-docs.test.js`
- FOUND: `.planning/phases/07-the-sigil-spinner-element/07-03-SUMMARY.md`
- FOUND: commit `44a421e`
- FOUND: commit `9904b63`

---
*Phase: 07-the-sigil-spinner-element*
*Completed: 2026-08-09*
