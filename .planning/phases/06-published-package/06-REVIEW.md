---
phase: 06-published-package
reviewed: 2026-08-09T00:00:00Z
depth: standard
files_reviewed: 8
files_reviewed_list:
  - package.json
  - LICENSE
  - README.md
  - test/package-identity.test.js
  - test/pack-install.test.js
  - vitest.config.js
  - vitest.pack.config.js
  - .github/workflows/release.yml
findings:
  critical: 0
  warning: 2
  info: 3
  total: 5
status: issues_found
---

# Phase 6: Code Review Report

**Reviewed:** 2026-08-09
**Depth:** standard
**Files Reviewed:** 8
**Status:** issues_found

## Summary

Reviewed all eight source files touched by Phase 6 (Published Package): the publication
metadata in `package.json`, the new `LICENSE`, the README's scoped-specifier sweep, the two
new drift-guard/smoke tests, the vitest exclusion split, and the release workflow.

`src/` and `bin/` are confirmed untouched (`git diff --stat 8080a34..HEAD -- src/ bin/` is
empty). Zero runtime dependencies, no build step, and no `prepack`/`prepare`/`prepublishOnly`
lifecycle scripts — all milestone-wide constraints hold. The action pins in
`.github/workflows/release.yml` were verified live against GitHub's tag refs
(`actions/checkout@3d3c42e...` → `v7.0.1`, `actions/setup-node@820762...` → `v7.0.0`) and both
match exactly. The vitest exclusion mechanism was executed directly, not just read: `npm test`
runs 21 files / 1498 tests (pack-install genuinely excluded), `npx vitest run
test/pack-install.test.js` against the default config reproduces the documented
"No test files found" failure, and `npm run test:pack` runs the file for real (1 file, 2
tests, passing). `test/package-identity.test.js`'s guard is not vacuous — it fails closed
(`not.toBeNull()`) if either README pattern is absent, and asserts equality against
`package.json`'s name rather than a restated literal.

This package is already published (`1.0.0`, live, attested — see `06-RELEASE-LOG.md`), so any
finding that would require touching `package.json`'s published surface costs a version bump.
None of the findings below rise to that bar — they are all workflow-file (not manifest)
concerns, fixable in a follow-up commit with no version implication.

No critical/blocker findings. Two warnings, both in `.github/workflows/release.yml`'s promote
and publish paths — real gaps, but neither is exploitable without repo write access, and
neither blocks the already-completed `1.0.0` publish. Three info-level items, all optional
cleanup.

## Warnings

### WR-01: Promote step has no guard against demoting `latest` to a stale version

**File:** `.github/workflows/release.yml:72-85`
**Issue:** The "Promote to latest" step derives `PKG_NAME`/`PKG_VERSION` from `npm pkg get`
against whatever ref was checked out for that dispatch — `workflow_dispatch` lets the caller
pick any branch or tag, not just the default branch's HEAD. Nothing in the step checks that
the derived version is actually the version currently sitting under the `next` dist-tag, or
that it's semver-greater-than-or-equal to the current `latest`. Dispatching `mode=promote`
against a stale ref (an old release branch, an old tag, or simply a `main` that hasn't been
fast-forwarded since a newer version was published) would silently run `npm dist-tag add
pkg@<old-version> latest` and succeed — pointing the registry's default install target at an
older, already-superseded version. The code comment at lines 72-77 asserts "the version
coordinate is read from the manifest, never from a caller-supplied input" as its safety
argument, which is true for *free-text* input but says nothing about *ref-selection* as an
attack/mistake surface — the ref itself controls which manifest gets read.
This is inert today (only `1.0.0` has ever been published — `versions --json` confirms a
single entry), but it is the mechanism that will matter the first time a second version
exists.
**Fix:** Before the `dist-tag add`, fetch the registry's current `next` tag and require the
derived version to match it (or at minimum, require it to be semver `>=` the current
`latest`), aborting otherwise:
```yaml
      - name: Promote to latest
        if: inputs.mode == 'promote'
        run: |
          PKG_NAME=$(npm pkg get name | tr -d '"')
          PKG_VERSION=$(npm pkg get version | tr -d '"')
          NEXT_VERSION=$(npm view "$PKG_NAME" dist-tags.next)
          if [ "$PKG_VERSION" != "$NEXT_VERSION" ]; then
            echo "::error::checked-out manifest version ($PKG_VERSION) does not match the" \
                 "registry's current 'next' tag ($NEXT_VERSION) — refusing to promote"
            exit 1
          fi
          npm dist-tag add "${PKG_NAME}@${PKG_VERSION}" latest
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```
**Cost to fix:** whenever — workflow-only change, no version bump, no impact on the already-
published `1.0.0`.

### WR-02: `inputs.dist_tag` is interpolated directly into a `run:` shell command

**File:** `.github/workflows/release.yml:66-70`
**Issue:** `run: npm publish --tag ${{ inputs.dist_tag }} --provenance --access public`
substitutes the `workflow_dispatch` input directly into the shell command text via `${{ }}`
expression syntax, rather than passing it through an `env:` var and referencing `$DIST_TAG`.
GitHub's own Actions security-hardening guidance calls this pattern out generally: any
`${{ inputs.* }}` expression interpolated into `run:` is textually substituted *before* the
shell parses the line, so if the value is ever attacker- or mistake-influenced, it doesn't just
become a bad argument — it can break out into a second shell command. The task brief for this
review asked specifically to verify that "`type: choice` with closed options" is a sufficient
mitigation here. It substantially reduces risk (values submitted through the GitHub *web UI*
are constrained to the dropdown), but `workflow_dispatch` can also be triggered through the
REST API / `gh workflow run` / GraphQL — and GitHub does not document (nor did this review find
authoritative confirmation) that those paths perform server-side enum validation against a
`choice` input's `options` list the way the UI form does. Given that ambiguity, relying on
`type: choice` alone as the *sole* mitigation for a direct shell interpolation is weaker than
the belt-and-suspenders posture the rest of this workflow otherwise takes (e.g.
`publishConfig.access` + `--access public`, D-77's fixed gate ordering).
Practically: exploiting this requires `workflow_dispatch` permission, which already implies
push access to the repo — an attacker at that trust level could edit the workflow file
directly, so this is not a privilege-escalation path today. It is, however, exactly the pattern
that becomes dangerous the moment this workflow (or one copied from it) ever gains a trigger
with a lower trust boundary (`pull_request_target`, `repository_dispatch` from a bot, etc.).
**Fix:** Route the input through `env:` so the shell only ever sees a variable expansion, and
add an explicit case-statement validation as a second line of defense that doesn't depend on
trusting the trigger surface:
```yaml
      - name: Publish
        if: inputs.mode == 'publish'
        env:
          DIST_TAG: ${{ inputs.dist_tag }}
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
        run: |
          case "$DIST_TAG" in
            next|latest) ;;
            *) echo "::error::unrecognized dist_tag: $DIST_TAG"; exit 1 ;;
          esac
          npm publish --tag "$DIST_TAG" --provenance --access public
```
**Cost to fix:** whenever — workflow-only change, no version bump.

## Info

### IN-01: `bin["sigil-spinner"]` retains a leading `./`, triggering a benign npm auto-correction warning on every publish

**File:** `package.json:10-12`
**Issue:** `"bin": { "sigil-spinner": "./bin/sigil-spinner.js" }` — npm normalizes `bin` paths
and strips the leading `./` at pack/publish time, which is why `06-RELEASE-LOG.md` records the
CLI runner's npm printing `"bin[sigil-spinner]" script name ... was invalid and removed` during
the real publish. The release log already investigated this and confirmed it's cosmetic (the
published manifest's `bin` field survives intact), so this is not a defect — just noise that
will repeat on every future publish and could look alarming to someone who hasn't read that
investigation.
**Fix:** `"sigil-spinner": "bin/sigil-spinner.js"` (drop the leading `./`) the next time
`package.json` is touched for an unrelated reason. Not worth a dedicated version bump on its
own.

### IN-02: No `timeout-minutes` on the release job

**File:** `.github/workflows/release.yml:32-33`
**Issue:** The `release` job has no `timeout-minutes`, so a hang anywhere in the D-77 gate
(most plausibly `npx playwright install --with-deps chromium`, which downloads a browser
binary and can stall on a flaky network) would run until GitHub's platform default (360
minutes) before failing, holding the `release` concurrency group and the `NPM_TOKEN`-bearing
job open the whole time.
**Fix:** Add `timeout-minutes: 20` (or similar) at the job level.

### IN-03: `test/package-identity.test.js`'s README regexes match the first occurrence anywhere in the document, not a scoped section

**File:** `test/package-identity.test.js:26,36`
**Issue:** `readme.match(/npm install ([^\s`]+)/)` and
`readme.match(/import\s*\{[^}]*\}\s*from\s*'([^']+)'/)` search the whole README body and take
the first match. Today this is correct and unambiguous — the README has exactly one `npm
install` command and one `import { ... } from '...'` block — but the guard is not scoped to the
Installation/Library sections specifically. A future README edit that adds an earlier,
unrelated code sample containing either pattern (e.g. an `npm install`-flavored troubleshooting
note, or a demo `import` from a different package) would silently change which text this test
validates, potentially masking real drift in the intended example while spuriously failing on
the wrong one.
**Fix:** Not urgent — no current false-pass or false-fail. If the README grows more code
samples, anchor the regex to the `## Installation` / `### Library` headings (e.g. split the
README on `## ` sections first, then search within the relevant section) rather than scanning
the whole document.

---

_Reviewed: 2026-08-09_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
