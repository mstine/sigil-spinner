---
phase: 06-published-package
plan: 03
subsystem: infra
tags: [npm, publish, provenance, github-actions, ci-cd, sigstore]

# Dependency graph
requires:
  - phase: 06-published-package/06-01
    provides: corrected publication metadata (MIT license, author, repository, homepage, bugs, publishConfig.access) and the LICENSE file
  - phase: 06-published-package/06-02
    provides: the pack-and-scratch-install smoke test (test:pack) and .github/workflows/release.yml with npm provenance
provides:
  - "@falkensmage/sigil-spinner@1.0.0 live on the public npm registry, published by GitHub Actions run 31321177328, attested with a verified Sigstore provenance statement"
  - .planning/phases/06-published-package/06-RELEASE-LOG.md — live evidence record: dry-run output, workflow run URL, npm view output, attestation status, shasum comparison, and the first-publish latest finding
  - "the first-publish latest finding: npm assigns latest to a scoped package's very first published version regardless of --tag, invalidating the plan's assumed next-only review-window mechanism"
affects: [06-04-promote-and-verify]

# Actuals (#2632)
actuals:
  tokens: 3644
  tasks: 5
  commits: 1

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Live-registry verification as a distinct rung after dry-run/pack rehearsals — only a real publish surfaces registry-side tag-assignment behavior that no dry-run or pack rehearsal can simulate"

key-files:
  created:
    - .planning/phases/06-published-package/06-RELEASE-LOG.md
  modified: []

key-decisions:
  - "Matt approved the publish freeze (Task 3) after reviewing all nine frozen coordinates (name, version, license, author, repository.url, homepage, bugs.url, publishConfig.access, tarball contents) and the amend/hold alternatives."
  - "Pushed 45 unpushed local commits to origin/main before the dry-run, since the release workflow checks out origin/main, not the local machine — otherwise the workflow would have published from stale source."
  - "npm assigned the latest dist-tag to 1.0.0 on this first-ever publish despite --tag next being passed and the workflow's promote step never running — a first-publish-only npm registry behavior, confirmed empirically via a genuinely bare npm install and via versions --json showing 1.0.0 as the only version ever published."
  - "Matt reviewed three options (accept / remove the latest tag / unpublish-and-redo) and chose accept: removing latest would break ROADMAP success criteria 1 and 2 (a bare install must succeed), the --tag next ladder was a process safeguard already served in substance by the live verification that ran, and nothing found during verification warranted spending the 1.0.0 version number on a redo."
  - "No dist-tag mutation was performed. npm dist-tag rm was explicitly withheld per Matt's decision."
  - "Matt closed the provenance-panel human-check personally, confirming Source Commit c360ba4 and Build File .github/workflows/release.yml on the npmjs.com panel — independently corroborating the packument's own gitHead field and resolving the dry-run/published shasum discrepancy without further investigation."

patterns-established:
  - "Registry propagation lag on a package's first-ever full packument (aggregate document) can trail the version-specific packument by several minutes even after the publish itself succeeds and the version-specific document is already correct — poll the version-specific endpoint, not just the aggregate one, when diagnosing an apparent post-publish 404."

requirements-completed: [PKG-01, PKG-05]

coverage:
  - id: D1
    description: "@falkensmage/sigil-spinner@1.0.0 published to the public npm registry by the GitHub Actions release workflow (never a local npm publish), with all six D-77 quality gates passing before the publish step ran"
    requirement: PKG-01
    verification:
      - kind: other
        ref: "gh run view 31321177328 --json conclusion → success; gh run view --json jobs shows all six gate steps and Publish as success, Promote to latest as skipped"
        status: pass
      - kind: other
        ref: "npm view @falkensmage/sigil-spinner@1.0.0 version/license/author/repository.url/dependencies — all match frozen coordinates"
        status: pass
    human_judgment: false
  - id: D2
    description: "Published 1.0.0 carries a verifiable npm provenance attestation binding it to the GitHub Actions workflow run (cryptographic verification)"
    requirement: PKG-05
    verification:
      - kind: other
        ref: "npm audit signatures (clean scratch install) → '1 package has a verified registry signature' / '1 package has a verified attestation'; packument dist.attestations.provenance.predicateType == https://slsa.dev/provenance/v1"
        status: pass
    human_judgment: false
  - id: D3
    description: "The npm provenance panel on the package's public npmjs.com page renders and is human-visible confirmation of the attestation"
    requirement: PKG-05
    verification:
      - kind: manual_procedural
        ref: "Matt opened https://www.npmjs.com/package/@falkensmage/sigil-spinner and confirmed the panel by eye (screenshot): 'Built and signed on GitHub Actions' green verified check, Source Commit c360ba4, Build File .github/workflows/release.yml, transparency log entry linked"
        status: pass
    human_judgment: false
  - id: D4
    description: "Fresh registry install (via @next) exposes both consumer surfaces (library import and CLI binary) with zero transitive runtime dependencies and no additional configuration"
    requirement: PKG-01
    verification:
      - kind: e2e
        ref: "npm install @falkensmage/sigil-spinner@next in a throwaway scratch dir; npm ls --all --json shows exactly one dependency; a .mjs file importing generateSigil returns {svg, working} with svg starting '<svg'; npx sigil-spinner \"I WILL SUCCEED\" --planet saturn writes a real SVG to stdout, exit 0"
        status: pass
    human_judgment: false
  - id: D5
    description: "The npm first-publish latest-assignment finding is recorded as a first-class deviation with full reasoning, and 06-04 is warned that its dist-tag add action is now a no-op"
    verification:
      - kind: other
        ref: ".planning/phases/06-published-package/06-RELEASE-LOG.md § First-publish latest behavior, § Consequence for plan 06-04"
        status: pass
    human_judgment: false

duration: ~35min (active work; excludes async human time for Task 1's npm token creation)
completed: 2026-08-09
status: complete
---

# Phase 06 Plan 03: Published Package — Publish Summary

**`@falkensmage/sigil-spinner@1.0.0` published live to the public npm registry by GitHub Actions with a verified Sigstore provenance attestation — and a genuine, unanticipated npm first-publish quirk assigned `latest` alongside `next`, which Matt reviewed and accepted rather than reversing.**

## Performance

- **Duration:** ~35 min active work across three conversational turns (excludes the async human time Matt spent creating the npm token, which happened between turns)
- **Completed:** 2026-08-09
- **Tasks:** 5/5
- **Files modified:** 1 (`.planning/phases/06-published-package/06-RELEASE-LOG.md`, new)

## Accomplishments

- Closed the human credential gate: `npm whoami` resolves to `falkensmage`, `NPM_TOKEN` exists as a GitHub Actions repository secret — both re-verified directly rather than trusted from the "done" message.
- Took rung 3 (`npm publish --dry-run --access public` against the real registry) and read the output rather than trusting the exit code: `public` access confirmed, name/version/file-list all matched, `git remote`/`repository.url` and `gh repo view` visibility both re-checked.
- Presented and closed the Task 3 publish-freeze checkpoint naming all nine frozen coordinates; Matt chose "publish."
- Dispatched `.github/workflows/release.yml` with `mode=publish dist_tag=next`; all six D-77 gates passed in order; `npm publish --tag next --provenance --access public` succeeded; provenance signed and logged to Sigstore (`logIndex=2395887803`).
- Verified live against reality, not against the absence of an error: metadata matches, attestation verified on all three legs (`npm audit signatures`, packument `dist.attestations`, and the rendered npmjs.com provenance panel confirmed by Matt), both consumer surfaces (library import, CLI binary) work from a genuinely fresh registry install with zero transitive dependencies.
- Discovered and investigated the npm first-publish `latest`-assignment behavior, brought it to Matt as a decision rather than silently working around it, and recorded his accept decision with full reasoning in the release log.

## Task Commits

1. **Tasks 1–3 (human gate, dry-run rehearsal, publish-freeze decision):** no repository commit — read-only rehearsal and external state changes only. One incidental action: `git push origin main` (fast-forward, no new content authored — pushed 45 already-committed local commits that had never reached `origin/main`, required so the workflow's checkout target matched the reviewed tree).
2. **Task 4 (workflow dispatch and publish):** no repository commit — the artifact written is the npm registry entry itself, produced by `.github/workflows/release.yml`.
3. **Task 5 (live verification and release log):** `154a7b4` (docs) — creates `.planning/phases/06-published-package/06-RELEASE-LOG.md`.

**Plan metadata:** this summary's own commit (docs: complete plan).

## Files Created/Modified

- `.planning/phases/06-published-package/06-RELEASE-LOG.md` - Live evidence record: dry-run output, workflow run URL and conclusion, `npm view` output, shasum comparison (dry-run vs. published, and why they legitimately differ), attestation status, the first-publish `latest` finding with full reasoning, dated follow-ons (OIDC trusted publishing, token expiration), and the explicit consequence for plan 06-04.

No source file (`src/`, `bin/`, `package.json`, `.github/workflows/release.yml`) was modified by this plan — exactly as scoped.

## Decisions Made

- **Push before dry-run:** `origin/main` was 45 commits behind local `main` (stale since before this phase started). Since the release workflow checks out `origin/main`, this had to be fixed before Task 2's dry-run could mean anything — a fast-forward push, no force, no new authored content.
- **Publish freeze approved as-is:** Matt reviewed all nine frozen coordinates and the amend/hold alternatives, and chose to publish without amending any field.
- **Accept the first-publish `latest` assignment rather than remove it:** see "Deviations from Plan" below — this is the substantive decision of the plan.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Pushed stale `origin/main` before the dry-run rehearsal**
- **Found during:** Task 2
- **Issue:** Task 2's acceptance criteria require `git rev-parse HEAD` to equal `git rev-parse origin/main`, since the release workflow checks out what's on GitHub. `origin/main` was 45 commits behind local `main`.
- **Fix:** `git push origin main` (fast-forward, no force).
- **Files modified:** none (no new content; existing commits made visible on the remote).
- **Verification:** `git rev-parse HEAD` == `git rev-parse origin/main` == `c360ba4855e23dd06a27674cd8c31389b6323eb2`, confirmed before proceeding.
- **Committed in:** n/a (a push, not a new commit).

### Not auto-fixed — surfaced to Matt as a decision (Rule 4-adjacent)

**2. [Architectural-adjacent] npm assigned `latest` to `1.0.0` despite `--tag next`, invalidating the plan's next-only review window**
- **Found during:** Task 5 (live verification)
- **Issue:** `npm view @falkensmage/sigil-spinner dist-tags --json` reported both `next` and `latest` pointing at `1.0.0`, even though the workflow's "Promote to latest" step never ran (confirmed `"conclusion":"skipped"` in the run's job JSON). A genuinely bare `npm install @falkensmage/sigil-spinner` (second scratch directory, no tag specified) installed `1.0.0` — confirming the review window the plan's ordering was built to buy did not exist for this publish. Root cause: a well-documented npm registry behavior where a package's very first published version is auto-tagged `latest` regardless of the `--tag` flag, because no prior `latest` exists to preserve. `06-RESEARCH.md`'s pitfall list did not anticipate this — no dry-run or pack rehearsal touches registry tag-assignment logic, so only a live publish could surface it.
- **Not fixed automatically:** this touches the one irreversible artifact in the phase and directly affects the premise of plan 06-04 (which was written assuming `latest` would be unassigned until its own promote step ran). Per the plan's explicit instruction ("if any rung fails, STOP and report... do not improvise a workaround"), this was surfaced as a decision rather than silently corrected with `npm dist-tag rm`.
- **Decision:** Matt reviewed three options (accept / remove the `latest` tag / unpublish-and-redo) and chose **accept**. Reasoning: ROADMAP success criterion 1 requires a bare install to succeed, which requires `latest` to be assigned — removing it would have broken the very criteria the phase exists to satisfy. The `--tag next` ladder was a process safeguard whose purpose (verify the live artifact before consumers get it by default) had already been served in substance by the verification that did run. Nothing found warranted spending the `1.0.0` version number.
- **Full reasoning recorded:** `.planning/phases/06-published-package/06-RELEASE-LOG.md` § "First-publish `latest` behavior — first-class finding, not a footnote"
- **Files modified:** none (no dist-tag mutation was performed)

---

**Total deviations:** 1 auto-fixed (blocking, routine), 1 surfaced-and-decided (architectural-adjacent, human decision required and given)
**Impact on plan:** The auto-fix was necessary for the workflow to check out the right commit at all. The surfaced decision changes what plan 06-04 needs to do — see below — but does not compromise anything this plan's own success criteria required; PKG-01 and PKG-05 are both satisfied.

## Issues Encountered

- **Registry propagation lag:** the aggregate packument (`GET /@falkensmage%2fsigil-spinner`) 404'd for roughly 4 minutes after the publish completed, while the version-specific packument (`GET /@falkensmage%2fsigil-spinner/1.0.0`) was already correct and live, and `npm access list packages` already showed ownership. Resolved by polling until the aggregate document caught up — not a publish failure, pure CDN cache lag on a first-ever publish. Recorded as a pattern for future diagnosis.
- **Alarming-but-benign CI warning:** the workflow's publish step logged `"bin[sigil-spinner]" script name bin/sigil-spinner.js was invalid and removed` — worded as if the binary entry point had been dropped. Verified directly against the live published manifest rather than trusting the log text: `bin` is intact (`{"sigil-spinner": "bin/sigil-spinner.js"}`), and `npx sigil-spinner` from a fresh install produces real output. Different npm CLI versions between my local machine and the GitHub Actions runner worded the same cosmetic path-normalization operation differently.

## User Setup Required

None beyond what Task 1 already completed and this plan re-verified: `npm login` done, Granular Access Token created with "Bypass 2FA for publishing," stored as the `NPM_TOKEN` repository secret. **Outstanding, not blocking:** the token's expiration date was not volunteered in this session and is recorded as "unknown" in the release log — Matt should supply and record it before it silently expires and fails the next release.

## Next Phase Readiness

**Plan 06-04 needs to be told before it runs, and this summary is that notice:** its planned `npm dist-tag add @falkensmage/sigil-spinner@1.0.0 latest` action is now a no-op — `latest` already points at `1.0.0` as of this plan. This is a **deviation caused by observed npm registry behavior, not by choice**. 06-04's verification work still matters and should still run: confirm no republish occurred (shasum `e1e3cc4cd676d8e38dd47bec2968bc213f4e34fd` and publish timestamp `2026-08-09T15:28:50.078Z` unchanged), and confirm the attestation survived. The visual provenance-panel check is **already closed** — Matt confirmed it during this plan (Source Commit `c360ba4`, Build File `.github/workflows/release.yml`, green verified check) — 06-04 does not need to re-open it, only confirm the panel still reflects the same commit if it re-checks at all.

Two dated follow-ons recorded in the release log and repeated here so they don't fall off the roadmap: (1) configure npm Trusted Publishing (OIDC) on the now-existing package as a fast-follow, ahead of npm's stated ~January 2027 bypass-2FA deprecation; (2) confirm and record the `NPM_TOKEN` expiration date.

Phases 7 and 8, which depend on the published package, are now unblocked.

---
*Phase: 06-published-package*
*Completed: 2026-08-09*
