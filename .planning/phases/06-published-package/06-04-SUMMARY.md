---
phase: 06-published-package
plan: 04
subsystem: infra
tags: [npm, publish, provenance, dist-tag, verification]

# Dependency graph
requires:
  - phase: 06-published-package/06-03
    provides: "@falkensmage/sigil-spinner@1.0.0 live on the public npm registry, attested, with the first-publish latest finding recorded and Matt's accept decision"
provides:
  - "Live re-verification that latest and next both resolve to 1.0.0, the shasum and publish timestamp are unchanged from 06-03 (no republish), the attestation still verifies, and a bare npm install works end to end with zero transitive dependencies"
  - "The already-made Task 1 decision (accept) recorded in the release log without re-asking it"
  - "06-RELEASE-LOG.md closed with the full ladder evidence through rung 5, plus the OIDC follow-on marked now-actionable"
affects: [phase-07-sigil-spinner-element, phase-08-sigil-skill]

# Actuals (#2632)
actuals:
  tokens: 1216
  tasks: 2
  commits: 1

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Verify-only wave: when a prior wave's registry side effect already satisfied a planned mutating step, re-verify the end state live rather than re-running a now-redundant registry-mutating command"

key-files:
  created: []
  modified:
    - .planning/phases/06-published-package/06-RELEASE-LOG.md

key-decisions:
  - "Task 1's checkpoint:decision was already resolved by Matt during 06-03 (accept the first-publish latest assignment) — recorded here as closed, not re-asked."
  - "Task 2's planned npm dist-tag add ... latest workflow dispatch was identified as a no-op (latest already pointed at 1.0.0) and was deliberately not run — dispatching it would have been a registry-mutating command with nothing left to mutate, and this wave's own constraints prohibit registry-mutating commands regardless of idempotency."

patterns-established:
  - "When a plan's core action turns out to already be satisfied by an upstream side effect, verify the end state live against the plan's original acceptance criteria rather than silently rewriting the plan's intent or skipping verification."

requirements-completed: [PKG-01]

coverage:
  - id: D1
    description: "latest and next dist-tags both resolve to 1.0.0, confirmed live against the registry"
    requirement: PKG-01
    verification:
      - kind: other
        ref: "npm view @falkensmage/sigil-spinner dist-tags --json → {\"next\":\"1.0.0\",\"latest\":\"1.0.0\"}"
        status: pass
    human_judgment: false
  - id: D2
    description: "No republish occurred: shasum and 1.0.0 publish timestamp unchanged from the 06-03 baseline"
    requirement: PKG-05
    verification:
      - kind: other
        ref: "npm view @falkensmage/sigil-spinner@1.0.0 dist.shasum == e1e3cc4cd676d8e38dd47bec2968bc213f4e34fd; time[\"1.0.0\"] == 2026-08-09T15:28:50.078Z — both unchanged vs. 06-RELEASE-LOG.md baseline"
        status: pass
    human_judgment: false
  - id: D3
    description: "Provenance attestation still verifies after the (non-)promote, from a clean scratch install"
    requirement: PKG-05
    verification:
      - kind: other
        ref: "npm audit signatures (fresh scratch dir) → '1 package has a verified registry signature' / '1 package has a verified attestation'"
        status: pass
    human_judgment: false
  - id: D4
    description: "Bare npm install (no tag) resolves 1.0.0 with zero transitive dependencies; both consumer surfaces work without additional configuration"
    requirement: PKG-01
    verification:
      - kind: e2e
        ref: "fresh scratch dir: npm install @falkensmage/sigil-spinner (no tag) exit 0, resolves 1.0.0; npm ls --all --json shows exactly one dependency, no nesting; generateSigil() import returns {svg, working} with svg starting '<svg'; npx sigil-spinner \"I WILL SUCCEED\" --planet saturn exit 0, writes a real SVG to stdout"
        status: pass
    human_judgment: false
  - id: D5
    description: "Release log closed with the wave 4 verification evidence and the OIDC follow-on marked now-actionable"
    verification:
      - kind: other
        ref: ".planning/phases/06-published-package/06-RELEASE-LOG.md § Wave 4 (06-04) — verify-only close, no promote dispatched"
        status: pass
    human_judgment: false

duration: 5min
completed: 2026-08-09
status: complete
---

# Phase 06 Plan 04: Published Package — Promote-and-Verify Summary

**No promote was dispatched — npm's first-publish quirk had already put `latest` on `1.0.0` in 06-03, so this wave re-verified the end state live (unchanged shasum/timestamp, surviving attestation, zero-dependency bare install) instead of running a redundant registry-mutating command.**

## Performance

- **Duration:** ~5 min
- **Completed:** 2026-08-09
- **Tasks:** 2/2
- **Files modified:** 1

## Accomplishments

- Recorded Task 1's checkpoint:decision as already resolved by Matt in 06-03 (accept), without re-asking it.
- Confirmed the plan's `npm dist-tag add ... latest` step was a no-op and deliberately did not dispatch it — no registry-mutating command was run this wave.
- Re-verified live: `dist-tags` unchanged (`next`/`latest` both `1.0.0`), `dist.shasum` and the `1.0.0` publish timestamp byte-identical to the 06-03 baseline (proving no republish occurred).
- Re-ran `npm audit signatures` from a clean scratch install — attestation still verifies.
- Ran a genuinely bare `npm install @falkensmage/sigil-spinner` (no tag) end to end in a fresh scratch directory: resolves `1.0.0`, exactly one dependency with no nesting, `generateSigil()` import works, `npx sigil-spinner "I WILL SUCCEED" --planet saturn` writes a real SVG. Scratch directory removed on success.
- Closed `06-RELEASE-LOG.md` with the wave 4 findings and marked the OIDC trusted-publishing follow-on as now-actionable (the package existing on the registry was the blocking condition, now satisfied).

## Task Commits

1. **Task 1 (decision recorded) + Task 2 (verify-only close):** `6a3153e` (docs) — appends the Wave 4 section to `06-RELEASE-LOG.md`. No dist-tag mutation, no other file touched.

**Plan metadata:** this summary's own commit (docs: complete plan).

## Files Created/Modified

- `.planning/phases/06-published-package/06-RELEASE-LOG.md` - Appended "Wave 4 (06-04) — verify-only close, no promote dispatched": the already-made Task 1 decision, the identified no-op, the before/after shasum and timestamp comparison table, the re-verified attestation, the re-verified bare-install end-to-end proof, and the OIDC follow-on marked now-actionable.

No source file (`src/`, `bin/`, `package.json`, `vitest.config.js`) was modified — `git diff --name-only -- src/ bin/ package.json vitest.config.js` returned empty.

## Decisions Made

- **Do not dispatch the promote workflow.** `latest` already pointed at `1.0.0` per 06-03's finding. Dispatching `gh workflow run release.yml -f mode=promote` would have executed `npm dist-tag add ... latest` against the live registry for no effect — a registry-mutating command this wave's own constraints explicitly prohibit ("Run NO registry-mutating command... not dist-tag add"). Verified the end state live instead of creating it.
- **Do not reopen the provenance-panel human-check.** Matt closed it during 06-03 (Source Commit `c360ba4`, Build File `.github/workflows/release.yml`, green verified check). The shasum/timestamp comparison in this wave confirms the attested artifact is unchanged, which is sufficient corroboration without re-asking Matt to look at the page again.

## Deviations from Plan

### Not auto-fixed — plan invalidated by an upstream side effect, not by an error

**1. [Plan superseded by observed registry behavior] Task 2's `dist-tag add` promote action was a no-op**
- **Found during:** Pre-execution read of `06-RELEASE-LOG.md` (flagged explicitly by the orchestrator's briefing before this plan started, and independently confirmed live)
- **Issue:** The plan as written expects `latest` to be unassigned going into this wave, with Task 2 promoting it via `gh workflow run release.yml -f mode=promote`. 06-03 discovered that npm auto-assigns `latest` to a scoped package's very first published version regardless of the `--tag` flag passed at publish time — a first-publish-only registry behavior no dry-run or pack rehearsal could have surfaced. `latest` was already `1.0.0` before this wave began.
- **Fix:** Did not dispatch the promote workflow. Re-verified live that `dist-tags`, `dist.shasum`, and the `1.0.0` publish timestamp all matched the pre-existing 06-03 baseline exactly — the evidence a real promote's Task 2 acceptance criteria call for — without performing any registry write.
- **Files modified:** `.planning/phases/06-published-package/06-RELEASE-LOG.md` only, as scoped.
- **Verification:** `npm view @falkensmage/sigil-spinner dist-tags --json`, `dist.shasum`, `time --json`, `npm audit signatures`, and a genuinely bare scratch install — all re-run live in this wave, all matching or passing.
- **Committed in:** `6a3153e`

---

**Total deviations:** 1 (plan-invalidating, caused by observed npm registry behavior carried forward from 06-03 — not a bug, not scope creep)
**Impact on plan:** The plan's verification intent is fully preserved; only the mechanism (dispatch-then-verify vs. verify-only) changed, because the thing Task 2 was going to create already existed.

## Issues Encountered

None beyond the pre-flagged deviation above.

## User Setup Required

None. Two dated follow-ons remain open and are repeated here so they don't fall off between phases:
1. Configure npm Trusted Publishing (OIDC) on `@falkensmage/sigil-spinner` — now actionable, since the package existing on the registry was the blocking condition.
2. Confirm and record the `NPM_TOKEN` expiration date — still "unknown" in the release log.

## Next Phase Readiness

PKG-01 and PKG-05 are both fully closed: `latest` and `next` coexist on `1.0.0`, the artifact is proven byte-identical to what was reviewed, the attestation survives, and a bare `npm install @falkensmage/sigil-spinner` works end to end with zero transitive dependencies and both consumer surfaces usable with no additional configuration — ROADMAP success criteria 1 and 2, verified against the actual default install path.

Phase 06 (Published Package) is complete. Phases 7 and 8, both of which consume the published package, are unblocked.

---
*Phase: 06-published-package*
*Completed: 2026-08-09*
