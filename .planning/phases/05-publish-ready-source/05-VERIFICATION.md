---
phase: 05-publish-ready-source
verified: 2026-08-08T15:40:00Z
status: passed
score: 5/5 must-haves verified
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 4/5
  gaps_closed:
    - "Success criterion 4: durable citation-checker soundness — CR-01 (whitespace/single-character/mid-heading excerpt vacuously satisfying R1) and WR-01 (a ±200-char window letting an unrelated citation's excerpt back a different token) both closed in test/citations.test.js via plan 05-04, with fail-first-proven fixtures."
  gaps_remaining: []
  regressions: []
human_verification: []
---

# Phase 05: Publish-Ready Source Verification Report

**Phase Goal:** The code that is about to be published is already correct — every output field, CLI flag, and source citation is what it will need to be, before a version number becomes permanent.
**Verified:** 2026-08-08
**Status:** passed
**Re-verification:** Yes — after gap closure (plan 05-04)

## Goal Achievement

### Observable Truths (Phase Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Saved JSON working names both the kamea set and its version | ✓ VERIFIED (regression-checked) | Live CLI run: `node bin/sigil-spinner.js "I WILL SUCCEED" --planet saturn --json` emits 16 keys, `kameaSet` at index 2 (`"agrippa"`), `kameaVersion` at index 3 (`"2026-08-04"`) — unchanged since prior round. `src/data/kamea.js` declares `KAMEA_SET_VERSIONS = Object.freeze({...})`. |
| 2 | `sigil-spinner --title ...` produces the same titled SVG the library produces for `{ title: true }` | ✓ VERIFIED (regression-checked) | Live CLI run with `--title --id-prefix sig-a` emits `role="img"`, `aria-labelledby="sig-a-title"`, `<title id="sig-a-title">I WILL SUCCEED</title>` — unchanged since prior round. `bin/sigil-spinner.js` threads `title: titleArg` straight into `generateSigil`'s options object with no CLI-side reinterpretation. |
| 3 | A sigil with both a title and an id prefix exposes its accessible name to assistive technology without hand-authored ARIA | ✓ VERIFIED (regression-checked) | Same live CLI output as above; `test/browser/accessible-name.test.js` (real Chromium via Playwright) still present and part of the 1482-passing full suite. |
| 4 | Every decision or pitfall citation in shipped source resolves to a document that still says what the citation claims — durably, via a committed checker | ✓ VERIFIED (gap closed by 05-04) | Independently re-ran `npx vitest run test/citations.test.js`: 10/10 passing (was 2/2 pre-gap-closure; 8 new soundness fixtures added). Read the shipped `excerptMatchesHeading` (test/citations.test.js:291-295) — confirms `trimmed.length === 0` is checked and returns `false` **before** any `startsWith` call, closing the `''.includes('')`-style vacuity that produced the prior round's CR-01. Read `orderedCandidateExcerpts` (lines 320-342) — confirms candidates are filtered to `MAX_EXCERPT_TOKEN_DISTANCE = 20` and sorted nearest-first, closing WR-01's cross-citation borrowing. Read the fixture bodies directly (lines 522-580): each fixture calls `checkSource` — the same non-mocked function `checkFile` (used by the live-tree assertions) delegates to — with a synthetic comment string reproducing the exact CR-01/WR-01 defect shapes (whitespace-only excerpt, single-character excerpt, mid-heading substring, borrowed-neighbour excerpt ~90 chars away) and asserts exactly one `R1` finding for each, plus zero findings for the clean/adjacent/chained controls. This is genuine behavioral proof, not presence-only: the fail-first evidence captured in 05-04-SUMMARY.md shows 3-then-1 fixtures failing against the pre-fix code and passing after (independently corroborated by the fact that these fixtures are the only new tests and the suite grew from 429 to 580 lines and from 2 to 10 `it` blocks in this file). `git diff --name-only -- src bin` for 05-04's commits (`1595a82`, `57d3e13`) is empty — no citation site was rewritten to dodge the checker; the guard itself was repaired. `MINIMUM_CITATION_SITE_COUNT` (still `34`) and `SOURCE_DIRS` (still `['src', 'bin']`) are unchanged — the anti-appeasement floor was not weakened to make this pass. |
| 5 | Determinism holds: byte-identical repeat runs, version stamp identical dev-tree vs. installed, every snapshot rebase reviewed | ✓ VERIFIED (regression-checked) | `npm test`: 1482/1482 passing (20 files; +8 vs. prior round's 1474, all new soundness fixtures from 05-04). `npm run typecheck`: exit 0. `npm run lint`: exit 0. `git diff --name-only -- test/__file_snapshots__ test/render/__snapshots__` for 05-04's commit range is empty — no snapshot moved by the gap-closure plan. Dev-tree-vs-installed identity remains explicitly deferred to Phase 6's PKG-03, per 05-02-PLAN.md's boundary note — unchanged from prior round, not part of this phase's scope. |

**Score:** 5/5 truths verified. The previously-partial truth 4 is now fully verified: the durability mechanism itself was repaired and proven fail-first, not merely re-affirmed as true-today.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `test/citations.test.js` | Sound R1 evidence rules + fixture-driven soundness suite | ✓ VERIFIED | 580 lines (was 429). `excerptMatchesHeading`, `orderedCandidateExcerpts`, `checkSource` (extracted seam), `MAX_EXCERPT_TOKEN_DISTANCE = 20` all present and wired into the R1 loop. `MINIMUM_CITATION_SITE_COUNT` still `34`; `SOURCE_DIRS` still `['src', 'bin']` — floor and inspection scope unweakened. |
| `src/data/kamea.js` | `KAMEA_SET_VERSIONS` frozen sidecar map | ✓ VERIFIED (unchanged since prior round) | `Object.freeze({ agrippa: '2026-08-04' })`; D-61 parity test present. |
| `src/render/json.js` | `kameaVersion` emitted after `kameaSet` | ✓ VERIFIED (unchanged since prior round) | Confirmed via live CLI output. |
| `bin/sigil-spinner.js` | `--title` flag threaded | ✓ VERIFIED (unchanged since prior round) | `title: titleArg` passed straight through. |
| `src/render/svg.js` | Conditional `role`/`aria-labelledby`/title-`id` | ✓ VERIFIED (unchanged since prior round) | Gated on title AND idPrefix both present. |
| `test/browser/accessible-name.test.js` | Real-browser accessible-name test | ✓ VERIFIED (unchanged since prior round) | 3/3 passing against live Chromium. |
| `README.md` | Flag/field/behavior docs | ✓ VERIFIED (unchanged since prior round) | |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `test/citations.test.js` soundness fixtures | `test/citations.test.js` checker logic | `checkSource(source, relPath)` seam | ✓ WIRED | Confirmed by direct read: fixtures call `checkSource` directly, the same function `checkFile` (used by the live-tree assertions) delegates to after reading a real file from disk. No mock, no parallel implementation. |
| `test/citations.test.js` | `.planning/milestones/v1.0-research/ARCHITECTURE.md`, `.planning/milestones/v1.0-research/PITFALLS.md`, `src/path/buildPath.js`'s real chained citation | Fixture citations reference genuine archived headings and mirror a real multi-citation source shape | ✓ WIRED | Clean-control and chained-citation-control fixtures cite real on-disk headings (`Internal Boundaries`, `Pitfall 7`/`Pitfall 2`), so acceptance/rejection is measured against real disk state, not synthetic mocks. |
| `test/citations.test.js` | `src/**/*.js`, `bin/**/*.js` | `readdirSync`/`readFileSync` walk via `checkFile` | ✓ WIRED (unchanged since prior round) | |
| `src/generate.js` | `src/data/kamea.js` | `KAMEA_SET_VERSIONS[DEFAULT_KAMEA_SET]` | ✓ WIRED (unchanged since prior round) | |
| `bin/sigil-spinner.js` | `src/generate.js` | `title: titleArg` in options object | ✓ WIRED (unchanged since prior round) | |
| `src/render/svg.js` | `src/render/escapeXml.js` | `escapeXml(idPrefix)` hoisted, reused for root id + title id + aria-labelledby | ✓ WIRED (unchanged since prior round) | |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Citation checker soundness suite (gap closure) | `npx vitest run test/citations.test.js` | 10/10 passing | ✓ PASS |
| Whitespace-only excerpt is rejected | fixture: `checkSource` on synthetic comment citing a real doc with `"  "` excerpt | 1 R1 finding (was 0 pre-fix, per 05-04-SUMMARY's captured fail-first output) | ✓ PASS |
| Single-character excerpt is rejected | fixture: `"a"` excerpt against the same doc | 1 R1 finding (was 0 pre-fix) | ✓ PASS |
| Borrowed-neighbour excerpt (WR-01) is rejected | fixture: unbacked token ~90 chars from a valid neighbouring excerpt | 1 R1 finding (was 0 pre-fix) | ✓ PASS |
| Clean/adjacent/chained controls still pass | 3 control fixtures | 0 findings each | ✓ PASS (guard discriminates, doesn't reject everything) |
| Live tree still clean after the fix | citation-integrity `it` blocks (unchanged) | 0 findings, site count ≥34 | ✓ PASS |
| JSON working carries kameaVersion at correct position | `node bin/sigil-spinner.js ... --json` | 16 keys, kameaSet@2, kameaVersion@3 | ✓ PASS (regression) |
| CLI/library SVG accessible-name markup | `node bin/sigil-spinner.js ... --title --id-prefix sig-a` | `role="img"`, `aria-labelledby="sig-a-title"`, matching `<title id>` | ✓ PASS (regression) |
| Full suite / typecheck / lint | `npm test && npm run typecheck && npm run lint` | 1482/1482, exit 0, exit 0 | ✓ PASS |
| `git diff --name-only -- src bin` empty for 05-04 | git diff | empty | ✓ PASS — no production code touched by the gap-closure plan |
| `package.json` dependencies still empty | `node -e ...` | no `dependencies` key present / effectively empty | ✓ PASS |
| Debt-marker scan | `grep -n "TBD\|FIXME\|XXX\|TODO\|HACK\|PLACEHOLDER"` across phase-touched files | no matches | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|--------------|--------|----------|
| PKG-02 | 05-02 | JSON working carries kamea set version as static in-source constant | ✓ SATISFIED | Verified live (regression). |
| INT-05 | 05-03 | `--title` CLI flag exposes `options.title` | ✓ SATISFIED | Verified live (regression). |
| INT-06 | 05-03 | Title + id prefix wires `aria-labelledby` automatically | ✓ SATISFIED | Verified live (regression) + real-browser Playwright test in full suite. |
| MAINT-01 | 05-01, 05-04 | Every citation resolves; durable via committed checker | ✓ SATISFIED | Citations correct today (unchanged); durability mechanism (CR-01, WR-01) repaired and fail-first-proven in 05-04. |

No orphaned requirements: PKG-02, INT-05, INT-06, and MAINT-01 are the complete set REQUIREMENTS.md's Traceability table maps to Phase 5, and each appears in exactly one plan's `requirements` frontmatter field (PKG-02→05-02, INT-05/INT-06→05-03, MAINT-01→05-01 and 05-04).

### Anti-Patterns Found

None (blocker-level) in phase-05-touched files. Debt-marker scan clean.

## Out-of-Scope Finding, Explicitly Assessed (Not Silently Absorbed)

**05-REVIEW.md's Critical finding (that report's own "CR-01" — a different, unrelated defect from the prior VERIFICATION.md's citation-checker gap, which happened to also be labeled CR-01 in an earlier review round): `generateSigil(statement, planet, null)` throws a raw `TypeError` instead of a `SigilError`.**

Independently reproduced against the current tree:

```
$ node -e "import('./src/index.js').then(({generateSigil}) => { try { generateSigil('I WILL SUCCEED','saturn', null); } catch (e) { console.log(e.constructor.name, e.message); } });"
TypeError Cannot read properties of null (reading 'curve')
```

**Assessment: this finding is OUTSIDE Phase 5's declared must-haves and requirements.**

- The defect lives in `src/generate.js`'s `resolveOptions`/`generateSigil` default-parameter handling (`options = {}`, which JavaScript does not apply to an explicitly-passed `null`).
- `git blame src/generate.js` traces the `options = {}` default parameter to commit `6336c67` ("feat(01-02): tracer — statement to Saturn sigil SVG, every layer wired"), dated 2026-08-04 — **Phase 1**, four phases before Phase 5 existed.
- `git log --oneline -- src/generate.js` (limited to Phase 5's commit range) shows exactly two Phase-5 commits touching this file: `8d84e3b` (05-01, citation-comment repair only) and `5b459ed` (05-02, threading `kameaVersion`/`kameaSet` — a different function, around line 296). Neither commit touches `resolveOptions` or the `options = {}` default at line 209.
- None of Phase 5's four requirements (PKG-02, INT-05, INT-06, MAINT-01) concern options-object null-handling, and none of the three ROADMAP success criteria for this phase (JSON kamea version, `--title` CLI/library parity, accessible-name wiring) touch it either.

This is a genuine, pre-existing, latent defect (a real-world caller doing `generateSigil(s, p, opts || null)` will hit it), and it should be tracked and fixed — but doing so is not required for Phase 5's goal to be considered achieved, since Phase 5 never claimed to own general options-contract input-validation robustness. Recommend opening it as a fix task against its true point of origin (Phase 1's surface) — e.g. a standalone `gsd-quick`/backlog item — rather than folding it into this phase's gap ledger.

**Also noted, same treatment (informational, not a Phase 5 gap):** 05-REVIEW.md's fresh Warnings against the just-shipped `test/citations.test.js` — its own WR-01 (`excerptMatchesHeading` has no minimum-length floor beyond the prefix/non-empty rule, so a future short-but-coincidentally-matching excerpt could still pass), WR-02 (R2's label-backing check doesn't confirm the backing excerpt's target document matches the bare label's intended document), WR-03 (trailing same-line `//` comments are invisible to the scanner), and WR-04 (the file's own header doc comment says R1 requires a "substring" match while the code enforces a stricter "prefix" match). None of these were part of 05-04's declared must-haves, which named the CR-01 empty/single-character/mid-heading-substring family and the WR-01 adjacency-pairing family specifically — both closed and fixture-proven above. These four are real hardening opportunities on the same file, in the same spirit as the phase's own already-explicitly-deferred WR-02/IN-01 items (05-04-PLAN.md § Deferred), but expanding MAINT-01's scope to also cover them was not requested by this phase's must-haves. Flagging them here so they are visible for a future gap-closure round or backlog item, not silently dropped.

## Human Verification Required

None. All must-haves for this phase are verifiable programmatically and were verified against the running code.

## Gaps Summary

None remaining. The single gap from the prior verification round (citation-checker durability — CR-01/WR-01 in `test/citations.test.js`) was closed by plan 05-04 and independently re-verified here: the fix is present, correctly implemented, fixture-proven fail-first-then-green, does not touch production code, and does not weaken the anti-appeasement floor or inspection scope. All 33 real citations still resolve and the R2 label-backing set is unshifted. Full suite (1482 tests), typecheck, and lint are all green.

Two categories of findings from the fresh `05-REVIEW.md` were assessed and are explicitly out of this phase's declared scope (see section above) rather than silently absorbed: (1) a pre-existing Critical defect in `generateSigil`'s null-options handling, dating to Phase 1 and untouched by any Phase 5 plan; and (2) four new Warnings against the just-repaired citation checker representing further hardening opportunities beyond what MAINT-01's gap-closure plan was scoped to fix. Neither blocks Phase 5's goal achievement.

---

_Verified: 2026-08-08_
_Verifier: Claude (gsd-verifier)_
