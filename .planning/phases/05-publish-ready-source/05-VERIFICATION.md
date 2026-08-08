---
phase: 05-publish-ready-source
verified: 2026-08-08T14:30:00Z
status: gaps_found
score: 4/5 must-haves verified
behavior_unverified: 0
overrides_applied: 0
gaps:
  - truth: "Success criterion 4: every decision or pitfall citation in shipped source resolves to a document that still says what the citation claims — durably, via a committed checker, not just as a one-time repair"
    status: partial
    reason: >
      The current state of every citation in src/ and bin/ is genuinely correct (independently
      re-verified below) — this part of criterion 4 is TRUE today. But the mechanism the phase
      built to keep it true durably (test/citations.test.js, MAINT-01's stated purpose: "so the
      same rot cannot recur silently on the next milestone's research refresh") contains an
      unremediated Critical defect documented in the phase's own 05-REVIEW.md (CR-01): R1's rule
      that a quoted excerpt must match a real heading is defeated by a whitespace-only quote,
      because `String.prototype.includes('')` is always true after `.trim()` on an empty string.
      A future citation authored as `... per some/real.md ("  ") ...` would pass R1 unconditionally
      and permanently, with zero verification ever performed — silently reopening exactly the rot
      MAINT-01 exists to close. Confirmed present in the shipped test/citations.test.js at the
      commit under review (44c01fa) — no fix landed after the review that identified it, and no
      regression test guards the loophole itself.
    artifacts:
      - path: "test/citations.test.js"
        issue: "Lines 329-336: `QUOTE_RE.exec` + `.trim()` + `headings.some((h) => h.includes(excerpt))` accepts an empty/whitespace-only excerpt as a match against any heading, because `''.includes('')` is vacuously true. No `if (excerpt.length === 0) continue` guard exists."
    missing:
      - "Reject a trimmed excerpt of length 0 (or below a sane minimum) before running the `headings.some(...)` check in test/citations.test.js's R1 loop"
      - "A regression test/fixture proving a `\"path.md\" (\"  \")`-shaped comment is rejected, so the loophole cannot silently reopen"
human_verification: []
---

# Phase 05: Publish-Ready Source Verification Report

**Phase Goal:** The code that is about to be published is already correct — every output field, CLI flag, and source citation is what it will need to be, before a version number becomes permanent.
**Verified:** 2026-08-08
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (Phase Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Saved JSON working names both the kamea set and its version | ✓ VERIFIED | Live CLI run: `node bin/sigil-spinner.js "I WILL SUCCEED" --planet saturn --json` emits 16 keys, `kameaSet` at index 2 (`"agrippa"`), `kameaVersion` at index 3 (`"2026-08-04"`). `src/data/kamea.js:95` declares `export const KAMEA_SET_VERSIONS = Object.freeze({...})`. |
| 2 | `sigil-spinner --title ...` produces the same titled SVG the library produces for `{ title: true }` | ✓ VERIFIED | Direct in-process comparison: `execSync('node bin/sigil-spinner.js ... --title')` vs `generateSigil(stmt, planet, { title: true }).svg` — byte-identical (4226 bytes both). No-flag case also byte-identical against a no-options library call (4197 bytes both). |
| 3 | A sigil with both a title and an id prefix exposes its accessible name to assistive technology without hand-authored ARIA | ✓ VERIFIED | Live CLI run with `--title --id-prefix sig-a` emits `role="img"`, `aria-labelledby="sig-a-title"`, `<title id="sig-a-title">I WILL SUCCEED</title>` — the reference and the id are the identical string. `npx vitest run test/browser/accessible-name.test.js` — 3/3 passing, a real-Chromium Playwright accessibility-tree query (`getByRole('img', {name, exact:true})`), including one metacharacter-hostile-idPrefix case. |
| 4 | Every decision or pitfall citation in shipped source resolves to a document that still says what the citation claims | ⚠️ PARTIAL (see gap) | **Citations-as-they-stand: TRUE.** Independently re-verified `src/data/kamea.js:26`'s "Pitfall 1: Kamea Orientation Ambiguity" citation resolves to a real, matching heading in `.planning/milestones/v1.0-research/PITFALLS.md`; `bin/sigil-spinner.js` citations resolve to real ARCHITECTURE.md headings; grepped every raw `"..."` span in `src/`/`bin/` against the checker's own `QUOTE_RE` and found zero whitespace-only excerpts — nothing currently exploits the loophole. **The durable guard is NOT sound.** CR-01 (Critical, `05-REVIEW.md`) — the checker's R1 rule accepts a whitespace-only quoted excerpt as proof of a real citation, because `''.includes('')` is vacuously true — is confirmed present in the shipped `test/citations.test.js` (lines 329-336), unfixed as of the latest commit (`44c01fa`, the review-report commit itself). See Gap below. |
| 5 | Determinism holds: byte-identical repeat runs, version stamp identical dev-tree vs. installed, every snapshot rebase reviewed | ✓ VERIFIED | Two consecutive `--json` CLI runs on identical input: byte-identical stdout. `npm test`: 1474/1474 passing (20 files). `npm run typecheck`: exit 0. `npm run lint`: exit 0. `git diff --name-only 7eda6a9..HEAD -- test/__file_snapshots__ test/render/__snapshots__` lists exactly the two JSON-shaped files (`worked-example.working.json`, `json.test.js.snap`), each `+1/-0` via `--numstat` — matches the phase's own claimed attribution exactly. Zero of 46 SVG-shaped snapshots moved. (Dev-tree-vs-installed identity is explicitly deferred to Phase 6's PKG-03 smoke test per 05-02-PLAN.md's own boundary note — not claimed complete here, and not part of this phase's scope.) |

**Score:** 4/5 truths fully verified; 1 partially true with a documented, unremediated durability gap in its enforcement mechanism.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `test/citations.test.js` | Mechanical citation checker, ≥80 lines, R1+R2+floor | ✓ EXISTS, ⚠️ DEFECTIVE | 429 lines. R1/R2/34-site floor all implemented and exercised (1474 tests green). Contains the CR-01 whitespace-excerpt defect (see gap). |
| `src/data/kamea.js` | `KAMEA_SET_VERSIONS` frozen sidecar map | ✓ VERIFIED | `Object.freeze({ agrippa: '2026-08-04' })`; `KAMEA_SETS` shape unchanged; D-61 parity test present (`test/data/kamea.test.js:158`). |
| `src/render/json.js` | `kameaVersion` emitted after `kameaSet` + JSDoc | ✓ VERIFIED | Confirmed via live CLI output; two `@property {string} kameaVersion` occurrences present. |
| `bin/sigil-spinner.js` | `--title` seventh boolean flag, threaded, no CLI-side validation | ✓ VERIFIED | `title` boolean option present; `title: titleArg` passed to `generateSigil`; line 20 (deferred D-12 marker) confirmed untouched via `git diff -U0`. |
| `src/render/svg.js` | Conditional `role`/`aria-labelledby`/title-`id`, `escapeXml` hoisted to one call reused | ✓ VERIFIED | Live output confirms conditional emission gated on title AND idPrefix; `escapeXml` call-site-count assertion (exactly 2) passes in `test/render/svg.test.js`. |
| `test/browser/accessible-name.test.js` | Real-browser accessible-name test, ≥60 lines | ✓ VERIFIED | 105 lines (per SUMMARY), 3/3 passing against live Chromium via Playwright. |
| `README.md` | `--title` flag docs, `kameaVersion` table row, accessible-name behavior documented | ✓ VERIFIED | All three present and consistent with shipped behavior. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `test/citations.test.js` | `src/**/*.js`, `bin/**/*.js` | `readdirSync`/`readFileSync` walk | ✓ WIRED | Confirmed via source read; walks both dirs recursively. |
| `test/citations.test.js` | `.planning/milestones/v1.0-research/`, `.planning/milestones/v1.0-phases/` | Path resolution + heading match | ⚠️ WIRED BUT UNSOUND | Resolves correctly for every current citation, but the heading-match check itself has the CR-01 gap — see truth 4. |
| `src/generate.js` | `src/data/kamea.js` | `KAMEA_SET_VERSIONS[DEFAULT_KAMEA_SET]` | ✓ WIRED | `src/generate.js:296` confirmed. |
| `src/render/json.js` | `src/generate.js` | Destructure/re-emit `kameaVersion` | ✓ WIRED | Confirmed in live JSON output, correct position. |
| `bin/sigil-spinner.js` | `src/generate.js` | `title: titleArg` in options object | ✓ WIRED | Confirmed via CLI/library byte-parity test above. |
| `src/render/svg.js` | `src/render/escapeXml.js` | `escapeXml(idPrefix)` hoisted, reused for root id + title id + aria-labelledby | ✓ WIRED | Confirmed via live output (all three attributes share `sig-a`/`sig-a-title` derivation) and the call-site-count test. |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| JSON working carries kameaVersion at correct position | `node bin/sigil-spinner.js ... --json \| node -e ...` | 16 keys, kameaSet@2, kameaVersion@3, `"2026-08-04"` | ✓ PASS |
| Repeat-run determinism | Two consecutive `--json` invocations | byte-identical stdout | ✓ PASS |
| CLI/library SVG parity, `--title` on and off | In-process `execSync` vs `generateSigil().svg` | byte-identical in both cases | ✓ PASS |
| Accessible-name markup wiring | `node bin/sigil-spinner.js ... --title --id-prefix sig-a` | `role="img"`, `aria-labelledby="sig-a-title"`, `<title id="sig-a-title">` | ✓ PASS |
| Real-browser accessible-name resolution | `npx vitest run test/browser/accessible-name.test.js` | 3/3 passing | ✓ PASS |
| Citation checker's own suite | `npx vitest run test/citations.test.js` | 2/2 passing, zero findings | ✓ PASS (but see CR-01 — passing does not mean sound) |
| Full suite / typecheck / lint | `npm test && npm run typecheck && npm run lint` | 1474/1474, exit 0, exit 0 | ✓ PASS |
| Whitespace-only quote exploit search | Custom scan using the checker's exact `QUOTE_RE` against every raw `"..."` span in `src/`/`bin/` | zero matches | ✓ PASS (confirms criterion 4 true *today*, independent of REVIEW.md's own grep) |
| Debt-marker scan | `grep -n "TBD\|FIXME\|XXX\|TODO\|HACK\|PLACEHOLDER"` across all phase-touched source files | no matches | ✓ PASS |
| Snapshot attribution | `git diff --name-only`/`--numstat` from phase start commit | exactly 2 files, +1/-0 each, 0 SVG snapshots moved | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|--------------|--------|----------|
| PKG-02 | 05-02 | JSON working carries kamea set version as static in-source constant | ✓ SATISFIED | Verified live, plus D-61 parity guard and source-introspection determinism guard both present and exercised. |
| INT-05 | 05-03 | `--title` CLI flag exposes `options.title` | ✓ SATISFIED | Verified byte-parity both directions. |
| INT-06 | 05-03 | Title + id prefix wires `aria-labelledby` automatically | ✓ SATISFIED | Verified via markup and real-browser accessibility-tree query. |
| MAINT-01 | 05-01 | Every citation resolves; durable via committed checker | ⚠️ PARTIALLY SATISFIED | Citations correct today; checker has an unremediated Critical soundness gap (CR-01) threatening durability, the requirement's own explicit purpose. |

No orphaned requirements: all four IDs traced in `.planning/REQUIREMENTS.md`'s Traceability table map to Phase 5 and to exactly one plan each (PKG-02→05-02, INT-05→05-03, INT-06→05-03, MAINT-01→05-01); no additional Phase-5-mapped IDs exist in REQUIREMENTS.md beyond these four.

### Anti-Patterns Found

None (TBD/FIXME/XXX/TODO/HACK/PLACEHOLDER scan across all phase-modified source files returned zero matches). CR-01 is not a comment-marker debt signal — it is a logic defect identified by the phase's own code review and independently re-confirmed in the current source by this verification.

### Human Verification Required

None required for automated gating. CR-01 is a mechanically-confirmed code defect, not a subjective/visual judgment call — routed as a structured gap rather than a human-verification item.

## Gaps Summary

Four of five phase success criteria are unconditionally verified against the live codebase — including via direct execution (CLI invocations, in-process library comparisons, a real Playwright/Chromium browser test), not just markup inspection or trust in SUMMARY.md.

The fifth (criterion 4, MAINT-01) resolves into **two distinct verdicts**, as the task requested:

1. **Is criterion 4 true for the code as it stands today?** Yes. Every citation in `src/` and `bin/` was independently spot-checked or scanned; none exploits the checker's flaw; the citations genuinely resolve to documents that say what they claim.
2. **Is the guard that is supposed to keep it true sound?** No. `test/citations.test.js`'s R1 rule can be satisfied by a whitespace-only quoted excerpt (CR-01, Critical severity, raised in the phase's own `05-REVIEW.md` and confirmed still present in the shipped file at the latest commit). MAINT-01's and 05-01-PLAN.md's explicitly stated purpose is durability — "so the same rot cannot recur silently on the next milestone's research refresh." A checker that can be silently defeated by a one-character-different citation form does not deliver that durability guarantee, even though nothing today exploits it.

This is reported as a gap rather than a pass-with-note because the phase's own committed review already identified it as Critical and no follow-up commit remediated it — carrying an unresolved Critical finding past phase verification is exactly the kind of drift this verification step exists to catch, even though the immediate, observable behavior of the shipped code is correct.

**This looks close to intentional-but-deferred rather than missed.** If the developer's judgment is that CR-01 is acceptable to carry forward (e.g., fixed in a fast-follow before Phase 6, or accepted as a known, documented, low-likelihood gap since nothing in `src/`/`bin/` exploits it today), an override can be recorded:

```yaml
overrides:
  - must_have: "Success criterion 4: durable citation-checker soundness (CR-01 — whitespace-only excerpt loophole)"
    reason: "No current citation exploits the loophole; fix tracked as fast-follow before next research refresh"
    accepted_by: "<name>"
    accepted_at: "<ISO timestamp>"
```

Otherwise, the minimal fix is small and contained entirely within `test/citations.test.js` (add `if (excerpt.length === 0) continue;` before the `headings.some(...)` check at line ~330, plus a regression fixture) — no production code, no snapshot, and no other requirement is touched by closing it.

---

_Verified: 2026-08-08_
_Verifier: Claude (gsd-verifier)_
