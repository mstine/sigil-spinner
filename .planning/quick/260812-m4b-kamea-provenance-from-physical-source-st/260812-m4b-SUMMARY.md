---
phase: quick-260812-m4b
plan: 01
subsystem: data
tags: [kamea, provenance, data-integrity, uranus, neptune, pluto, attestation]

requires: []
provides:
  - "src/data/kamea.js's SOURCE LINEAGE header records the 2026-08-12 cell-by-cell diff against Rankine & d'Este's printed appendix, the Mercury divergence with both proofs, the Sun's non-associativity exemption, and the empirically-fitted (not Agrippa-attributed) construction rules"
  - "Standing permutation/full-magic-sum/associativity invariant probes over the live KAMEA_SETS, iterating automatically rather than a hardcoded planet list"
  - "Uranus, Neptune, and Pluto ship as first-class planets through the same code path as the classical seven, carrying PLANET_ATTESTATION labels"
affects: []

actuals:
  tokens: 13972
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "PLANET_ATTESTATION sidecar map (mirrors the existing KAMEA_SET_VERSIONS precedent) — traditional:boolean plus an optional attestation string, scoped to non-traditional planets only, bound to planetNames() by a lockstep test"
    - "Structural invariant probes (isPermutationOfRange, sumsToConstant, isAssociative) iterate Object.entries(KAMEA_SETS) rather than a hardcoded planet array, so a kamea or planet added later is covered with no new test written"
    - "validPlanetsMessage() derives the classical/modern-separated unknown-planet error message from PLANET_ORDER + PLANET_ATTESTATION rather than transcribing either list"

key-files:
  created: []
  modified:
    - src/data/kamea.js
    - src/render/glyphs.js
    - src/render/coords.js
    - src/render/svg.js
    - src/render/json.js
    - src/path/buildPath.js
    - test/data/kamea.test.js
    - test/render/glyphs.test.js
    - test/cli/cli.test.js
    - test/render/grid.test.js
    - test/browser/element.test.js
    - test/citations.test.js
    - skill/VERIFY.md
    - examples/element.html
    - README.md

key-decisions:
  - "attestation is scoped to the three non-traditional planets only — no classical planet carries it. The developer ruled on this directly after the plan was written, vetoing an earlier attestation:'corrected' label for mercury. Mercury's divergence from the printed book belongs in the citation prose (which can be accurate about it in full sentences), not a one-word enum that would flatten 'the book is wrong' into the same bucket as 'there is no book to check against.' Settled, not an open call."
  - "Neptune ships, labelled 'derived' — the generated square contradicts the printed book (which has its own uncorrectable typo-plus-structural defects), but is clean on every structural test. Recorded as the weakest link in the chain, with the full rationale immediately above its grid literal."
  - "The pluto-as-invalid-planet test fixture (15 sites across 6 files) was swept to nibiru — a name that can never be promoted the way pluto just was, since it names no real body."
  - "Two doc comments outside the plan's listed files (src/path/buildPath.js and src/render/json.js, both saying gridSize order '3-9') were fixed as a Rule 1 deviation — they were directly invalidated by this task's own extension of gridSize's range to 3-13."

requirements-completed: [KAM-PROV-01, KAM-INV-01, KAM-MODERN-01]

coverage:
  - id: D1
    description: "src/data/kamea.js's header records the physical-source verification honestly: source with pages, six exact matches, the Mercury divergence with both proofs (anti-diagonal 257, associativity break at 8 cells), the Sun exemption reason, and the empirically-fitted construction rules with the Agrippa/de la Loubère dating"
    requirement: "KAM-PROV-01"
    verification:
      - kind: unit
        ref: "test/citations.test.js#Citation integrity (MAINT-01)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Permutation, full magic-sum (rows/columns/both diagonals), and associativity are standing tests iterating the live KAMEA_SETS; the Sun is exempted from associativity alone, with a written reason and a guard against the exemption going vacuous"
    requirement: "KAM-INV-01"
    verification:
      - kind: unit
        ref: "test/data/kamea.test.js#kamea structural invariants (standing probes over the live KAMEA_SETS, T-m4b-01)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Uranus, Neptune, and Pluto generate sigils through the same code path as the classical seven, carry traditional:false plus an attestation label, and Neptune's divergence is documented at the point of divergence"
    requirement: "KAM-MODERN-01"
    verification:
      - kind: unit
        ref: "test/cli/cli.test.js#Trans-Saturnian planets — uranus, neptune, pluto work through the same code path as the classical seven"
      - kind: unit
        ref: "test/data/kamea.test.js#PLANET_ATTESTATION marks the classical seven traditional with no attestation key, and the three modern additions non-traditional with an attestation label"
        status: pass
    human_judgment: false
  - id: D4
    description: "Every generated artifact for the existing seven planets is byte-identical to its pre-change bytes: no committed snapshot file changes, and none is regenerated"
    verification:
      - kind: other
        ref: "git diff --exit-code -- test/__file_snapshots__ test/render/__snapshots__ (clean after every task)"
        status: pass
    human_judgment: false

duration: ~15min
completed: 2026-08-12
status: complete
---

# Quick Task 260812-m4b: Kamea Provenance from Physical Source, Structural Invariants, and Three New Planets Summary

**Replaced the honest-but-stale "single secondary web source" kamea provenance with the state established by a 2026-08-12 cell-by-cell diff against a physical printed source (which found and proved the repo's Mercury correct against the book's defective printing), added standing permutation/magic-sum/associativity invariant probes that catch the exact defect class magic-sum-only checking cannot, and shipped Uranus, Neptune, and Pluto as first-class planets carrying honest attestation labels — all with zero movement in any existing generated artifact.**

## Performance

- **Duration:** ~15 min
- **Tasks:** 3 completed
- **Files modified:** 15

## Accomplishments

- Rewrote `src/data/kamea.js`'s `SOURCE LINEAGE` header: names the printed source with page numbers (Rankine & d'Este, *Practical Planetary Magick*, Appendix 2, pp. 177-181), records the 2026-08-12 diff and its four structural properties, documents the Mercury divergence with both proofs (book's anti-diagonal sums 257 not 260; breaks associativity at 8 cells), records the Sun's expected non-associativity (order 6 is singly-even), and reframes the construction rules as empirically fitted rather than attributable to Agrippa (who predates de la Loubère's Siamese method by ~150 years).
- Added standing structural invariant tests (`test/data/kamea.test.js`) that iterate the live `KAMEA_SETS` contents rather than a hardcoded planet list — permutation of 1..n², full magic-sum (rows/columns/both diagonals, derived from order rather than transcribed), and associativity, with the Sun exempted from associativity alone by an explicit named key set and a companion test proving the exemption isn't vacuous. Ran the fail-first mutation proof manually (a within-row swap on Saturn: row sums stayed 15/15/15 while associativity flipped to false — the exact defect class the Mercury finding proved magic-sum-only checking cannot see) and reverted it before committing.
- Added Uranus (11×11, M=671), Neptune (12×12, M=870), and Pluto (13×13, M=1105) to `KAMEA_SETS.agrippa`, copied verbatim from the verified reference data and byte-diffed against it programmatically to confirm an exact transcription. All three pass permutation, full magic-sum, and associativity with zero exemption.
- Added `PLANET_ATTESTATION`, a frozen sidecar map (mirroring the `KAMEA_SET_VERSIONS` precedent): the classical seven carry `traditional: true` with no `attestation` key at all; Uranus and Pluto are `traditional: false, attestation: 'attested'` (book and generated rule agree, zero differing cells); Neptune is `traditional: false, attestation: 'derived'` (generated only, contradicts the printed book). Bound to `planetNames()`'s key set by a lockstep test.
- Recorded Neptune's divergence and rationale immediately above its grid literal: the book's printed Neptune has uncorrectable typos plus a structural defect (columns 8/9 sum 869/871 against magic constant 870, 4 cells break associativity even after typo repair); the generated square is clean on every test but is the weakest link in the chain, extrapolating a rule fitted at smaller orders out to n=12.
- Added the three planets' glyphs (U+2645/2646/2647 ♅♆♇ + VS15) to `PLANET_GLYPHS`, and re-verified (via the `emoji` Python package's Unicode emoji-data, not just renumbering) that none of the three carries the `Emoji` property — Venus and Mars remain the only two emoji-risk entries, out of ten total.
- Separated classical from modern in `resolvePlanetKey`'s `E_UNKNOWN_PLANET` message (D-3), derived mechanically from `PLANET_ORDER` + `PLANET_ATTESTATION` rather than transcribed, since this CLI has no `--help` and this thrown message is the real surface where a caller meets the planet enumeration.
- Swept the `pluto`-as-invalid-planet fixture across 6 files (`test/data/kamea.test.js`, `test/cli/cli.test.js`, `test/render/grid.test.js`, `test/browser/element.test.js`, `skill/VERIFY.md`, `examples/element.html`) — promoting Pluto to a real planet would have silently inverted every one of them. Replaced with `nibiru`, verified by repo-wide grep that every remaining `pluto` occurrence is a genuine reference to the planet.
- Added CLI and library smoke tests proving `generateSigil` succeeds end-to-end for all three new planets, with clean coordinate output (no `NaN`, `Infinity`, or exponential notation) at Pluto's 13×13 — the finest grid the renderer has ever been given.
- Updated `README.md` (planet parameter list, `E_UNKNOWN_PLANET` table row, and the full Kamea Source Lineage section) and `examples/element.html` (gallery cards and the live-planet `<select>`) to match.
- Reinstalled `skill/` to `~/.claude/skills/sigil/` after editing `VERIFY.md`, per that file's own documented maintenance step, keeping the install-parity guard green.

## Task Commits

1. **Task A: Rewrite the SOURCE LINEAGE block in src/data/kamea.js** - `65fcb2b` (docs)
2. **Task B: Structural invariant probes over every kamea in every set** - `04b11ac` (test)
3. **Task C: Add uranus, neptune, and pluto as first-class planets** - `c0b3150` (feat)

## Files Created/Modified

- `src/data/kamea.js` — rewritten provenance header, extended `PLANET_ORDER` (10 entries), new `PLANET_ATTESTATION` sidecar map, three new grid literals with the Neptune divergence note, `validPlanetsMessage()` helper for the D-3 classical/modern-separated error message.
- `src/render/glyphs.js` — three new glyph entries, re-verified emoji-risk count.
- `src/render/coords.js`, `src/render/svg.js`, `src/render/json.js`, `src/path/buildPath.js` — doc-comment range updates (3-9 → 3-13), no logic changes (order-generic arithmetic).
- `test/data/kamea.test.js` — new structural invariant `describe` block; `PLANET_ATTESTATION` lockstep and content tests; fixed the stale 7-planet `planetNames()` assertion; swept the `pluto` fixture.
- `test/render/glyphs.test.js`, `test/render/grid.test.js`, `test/cli/cli.test.js`, `test/browser/element.test.js` — extended for ten planets, swept the `pluto` fixture, added trans-Saturnian smoke tests.
- `test/citations.test.js` — `MINIMUM_CITATION_SITE_COUNT` raised 34 → 42.
- `skill/VERIFY.md`, `examples/element.html`, `README.md` — documentation and demo-page updates matching the code changes.

## Decisions Made

See `key-decisions` in frontmatter — all three (attestation scope, Neptune shipping as derived, the nibiru fixture rename) were locked by the developer before or during plan authorship (CONTEXT.md § "Design decisions (locked)"), not decided during execution.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Two stale gridSize range doc comments outside the plan's file list**
- **Found during:** Task C, while sweeping doc comments for the "3 for saturn through 9 for moon" pattern
- **Issue:** `src/path/buildPath.js` and `src/render/json.js` both carried a `gridSize` JSDoc comment reading "(3-9)" — directly invalidated by this task's own extension of `gridSize`'s range to include Pluto (order 13). Neither file was in Task C's `<files>` list.
- **Fix:** Updated both to "(3-13)".
- **Files modified:** `src/path/buildPath.js`, `src/render/json.js`
- **Commit:** `c0b3150` (part of Task C's commit)

**2. [Rule 3 - Blocking] Accidental citation-checker regression in the new D-3 doc comment**
- **Found during:** Task C, running `CI=true npm test`
- **Issue:** A doc comment on the new `validPlanetsMessage()` helper referenced `skill/SKILL.md:59` as a citation, which isn't `.planning/`-prefixed and fails `test/citations.test.js` R1.
- **Fix:** Reworded to describe the skill's own documentation without an unqualified `.md` token.
- **Files modified:** `src/data/kamea.js`
- **Commit:** `c0b3150` (part of Task C's commit)

**3. [Rule 3 - Blocking] Skill install-parity test failed after editing skill/VERIFY.md**
- **Found during:** Task C, running `CI=true npm test`
- **Issue:** `test/skill-install-parity.test.js` compares `~/.claude/skills/sigil/` (already installed on this machine from a prior session) byte-for-byte against the repo's `skill/` — editing `VERIFY.md` in the repo without reinstalling made the two diverge.
- **Fix:** Ran `npm run skill:install -- --force`, per `skill/VERIFY.md`'s own documented maintenance step ("After Running Either Procedure").
- **Files modified:** none in-repo (writes to `~/.claude/skills/sigil/VERIFY.md`, outside the repository)
- **Verification:** `npx vitest run test/skill-install-parity.test.js` passed after the reinstall

---

**Total deviations:** 3 auto-fixed (1 Rule 1, 2 Rule 3)
**Impact on plan:** All three were necessary for the full suite to stay green after this task's own extensions; no scope creep beyond doc-comment accuracy and mechanical test-infrastructure upkeep.

## Deferred Items

Both deliberately deferred by the plan (CONTEXT.md D-1 through D-5), not omissions:

1. **`skill/SKILL.md`'s `--planet` flag row and Planet Selection correspondence table.** The skill invokes `@falkensmage/sigil-spinner@latest`, which resolves to `1.1.0` (seven planets). Listing ten there would instruct sessions to pass a planet the published CLI rejects. **Reopen when:** a version containing these three planets is published to npm. Independently, the correspondence table itself is Matt's lineage knowledge (STATE.md § Pending Todos: "Matt's planet correspondences — lineage knowledge, not researchable") and cannot be invented here regardless of publish state.
2. **`test/skill-cli-parity.test.js`.** Confirmed (not assumed) that this test binds `SKILL.md`'s flag table to the CLI's `parseArgs` *option keys* (`--planet`, `--json`, etc.), never to planet *values* — it stays green either way, so no reopen condition applies.

## Known Stubs

None — this task is pure data/documentation/test work with no UI or wired-data surface.

## Issues Encountered

None beyond the three auto-fixed deviations above.

## Mechanical Evidence — No Snapshot Moved

`git diff --exit-code -- test/__file_snapshots__ test/render/__snapshots__` and `git status --porcelain -- test/__file_snapshots__ test/render/__snapshots__` were run and confirmed clean after every task (A, B, and C), and again in the final combined verification pass. `CI=true npm test` was used throughout so vitest refuses to write snapshots. `package.json`'s `dependencies` field remains `undefined` (no runtime dependencies added); `npm run test:pack` passed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

The kamea data layer now carries an honest, current, physically-sourced provenance record and standing structural defenses strong enough to catch the exact defect class (a value-pair swap that preserves row/column sums) that shipped in the printed source's Mercury square. Uranus, Neptune, and Pluto are fully wired through the existing code path with no special-casing anywhere in the renderer, CLI, or element. No blockers for a future milestone. The two deferred SKILL.md items are the only remaining surface gap, and both have concrete, external reopen conditions (npm publish; Matt's own lineage capture).

---
*Quick task: 260812-m4b*
*Completed: 2026-08-12*

## Self-Check: PASSED

All 15 modified files confirmed present on disk via `ls -la`. All 3 task commit hashes (`65fcb2b`, `04b11ac`, `c0b3150`) confirmed present in `git log --oneline --all`.
