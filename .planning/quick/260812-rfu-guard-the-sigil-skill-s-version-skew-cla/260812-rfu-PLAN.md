---
phase: quick-260812-rfu
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - test/skill-version-skew.test.js
autonomous: true
requirements: [SKILL-VER-GUARD-01]
estimate:
  tokens: 42000
  raw_tokens: 42000
  tasks: 3
  confidence: low
must_haves:
  truths:
    - "`test/skill-version-skew.test.js` reads `package.json`'s `version` as the source of truth and never restates it as a transcribed literal — continuing the D-55/D-61/D-65/D-107 'guards are keyed, not transcribed' precedent that `test/package-identity.test.js` established for `name`."
    - "The guard classifies each version-bearing region of `skill/SKILL.md` as either LIVE (must equal `package.json`'s version) or HISTORICAL (deliberately pinned, must NOT track `package.json`). The three live regions are the `--planet` flag-table row, the Published-Surface Boundary opening paragraph, and the **Planet-list skew.** paragraph. The one historical region is the paragraph beginning `Prior to `."
    - "The historical region's assertion is keyed to a transcribed constant, NOT to `package.json` — so bumping `package.json`'s version leaves the historical test green. This is the one deliberate, commented transcription exception in the file, and its reason is stated where it lives."
    - "Every semver-shaped token in `skill/SKILL.md` is accounted for by exactly one region. A version literal added anywhere outside the four known regions fails the coverage test by name and line number, so a fourth live claim cannot be introduced silently and go unguarded."
    - "Region extraction is anchored on stable surrounding text, never on line numbers. A missing anchor and a duplicated anchor each throw a distinct named error rather than degrading into a vacuous pass."
    - "The live-claim failure message names `package.json`'s version, every mismatched claim with its line number, and explicitly warns that the pre-1.1.0 paragraph is intentionally pinned and must be left alone — plus the `skill:install` re-sync step an editor of `skill/SKILL.md` will otherwise miss."
    - "The guard is PROVEN to discriminate by live mutation, not merely by fixture: with `package.json`'s version temporarily bumped, the live-claim test FAILS and the historical-pin test PASSES in the same run — evidence captured mechanically from vitest's own report, not from a human reading terminal output."
    - "After the mutation proof, `git diff --exit-code -- package.json` exits 0 and `git status --porcelain -- package.json` is empty. No dirty manifest is left behind."
    - "`CI=true npm test` is green, `npm run typecheck` exits 0, `npm run lint` exits 0."
    - "Zero snapshot movement, proven mechanically: `git diff --exit-code -- test/__file_snapshots__ test/render/__snapshots__` exits 0 and `git status --porcelain -- test/__file_snapshots__ test/render/__snapshots__` is empty."
    - "Nothing under `skill/`, `src/`, `bin/`, or `package.json` changed: `git status --porcelain -- skill src bin package.json` reports nothing. `test/skill-install-parity.test.js` is green without a reinstall."
  artifacts:
    - test/skill-version-skew.test.js
  key_links:
    - "`package.json` `version` ↔ the three LIVE claims in `skill/SKILL.md`. This is the binding the task exists to create; it did not exist before and depended on a human remembering at release time."
    - "The transcribed historical pin ↔ the `Prior to ` paragraph in `skill/SKILL.md`. Deliberately NOT bound to `package.json` — binding it would push a developer to corrupt a correct statement about the past."
    - "`test/package-identity.test.js` (PKG-04, D-65) is the pattern: source-of-truth read from `package.json`, claim extracted from a doc by regex, failure message naming both sides. The new guard is its sibling, not a new approach."
    - "`test/skill-cli-parity.test.js` (D-107/D-109) supplies two conventions this guard reuses: the line-anchored table-row regex `^\\|\\s*`--([a-z-]+)`\\s*\\|` for reaching the `--planet` row, and the soundness-block discipline of proving each named error and each difference direction against synthetic fixtures."
    - "`skill/` ↔ `~/.claude/skills/sigil/`, bound byte-for-byte by `test/skill-install-parity.test.js`. This task changes nothing under `skill/`, so no reinstall is required — but the invariant is re-verified at close rather than assumed."
    - "`tsconfig.json` `include` covers `test/**/*.js` under `strict: true` + `checkJs`. The new test file is a typecheck gate input, not just a runtime one."
---

<objective>
Replace a memory dependency with a loud failure.

Quick task 260812-n36 added version-dependent claims to `skill/SKILL.md`: the seven classical planets work on every published version; uranus, neptune and pluto require a version later than the currently-published `1.1.0`. Those claims are true today and become **wrong — not merely stale** — the moment a release publishes the three modern planets. Nothing catches that today. It depends on a human remembering at release time.

Purpose: bind the live claims to `package.json` mechanically, so the next version bump fails loudly on whoever makes it, with a message that says exactly what to change.

**The crux, and the whole difficulty of the task.** `skill/SKILL.md` carries nine semver-shaped tokens across four regions. Three regions are LIVE claims that must track `package.json`. One is a HISTORICAL claim about pre-`1.1.0` behaviour that must stay pinned. A guard that demanded the historical paragraph change on a version bump would be actively wrong — it would push a developer to corrupt a correct statement about the past. Getting that distinction explicit and testable *is* the deliverable.

Output: one new test file, `test/skill-version-skew.test.js`, plus executed evidence that it discriminates.

**Scope is a hard boundary.** ADDING A TEST ONLY. Do not change `skill/SKILL.md`'s wording. Do not change `package.json` (Task 2's temporary bump is a proof step that is reverted and verified reverted within the same task). Do not touch `src/` or `bin/`.

**Why no tracer task.** Tracer-first proves an architecture end-to-end before expanding it. There is no architecture here — one test file, one source of truth, one document. Task 1 IS the end-to-end path; Task 2 proves it discriminates; Task 3 proves it costs nothing. All three are `auto`.
</objective>

<execution_context>
@$HOME/.claude/gsd-core/workflows/execute-plan.md
@$HOME/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@test/package-identity.test.js
@skill/SKILL.md
@package.json
@.claude/CLAUDE.md

Read only if a task needs them; do not re-read what is already above:

- `test/skill-cli-parity.test.js` — the closest structural sibling. Its header comment states the "guards are keyed, not transcribed" precedent (D-55, D-61, D-65, D-97, D-107); its `parseSkillFlagTokens` (around line 215) is the line-anchored table-row regex to reuse for reaching the `--planet` row; its `describe('Skill/CLI flag parity soundness (D-109)')` block (around line 255) is the fixture-driven soundness discipline to reuse. **Do not edit this file.** Its comment at line 56 says "all seven current options" — that is seven CLI *flags*, not seven planets, and is unrelated to this task.
- `test/skill-install-parity.test.js` — the repo↔install byte-identity guard, and the repo's precedent for collect-then-report-once failure messages. Read only for message style. Do not edit.
- `scripts/skill-install.js` — read only to confirm the exact re-sync invocation named in the guard's failure message. Line 133 already prints it; quote it as the script itself does rather than inventing a form.

**Facts established at planning time against the live tree — do not re-derive, do not re-measure:**

| Fact | Value |
|---|---|
| `package.json` `version` | `1.1.0` |
| Semver-shaped tokens in `skill/SKILL.md` | 9 total, on 4 lines: L63 ×1, L126 ×2, L135 ×3, L137 ×3 |
| Incidental semver-shaped noise in `skill/SKILL.md` | none — a whole-file `\d+\.\d+\.\d+` scan is clean, no viewBox/codepoint false positives |
| Anchor uniqueness (each occurs exactly once) | `^\| \`--planet\` \|` · `The published package resolves to version` · `**Planet-list skew.**` · ``Prior to ` `` |
| `test/citations.test.js` scan scope | `SOURCE_DIRS = ['src', 'bin']` — `test/` is OUT of scope, so the new file's doc comment is not citation-checked. Cite accurately anyway. |
| `tsconfig.json` `include` | covers `test/**/*.js`, `strict: true`, `checkJs: true` — the new file is a typecheck gate input |
| `vitest.config.js` `include` | flat `test/**/*.test.js` — the new file is picked up by `npm test` automatically, no registration step |
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Build the version-skew guard, live-vs-historical aware</name>
  <files>test/skill-version-skew.test.js</files>
  <read_first>
    `test/package-identity.test.js` in full (44 lines — the pattern: source of truth read from `package.json`, claim extracted from a doc by regex, failure message naming both sides). Then `test/skill-cli-parity.test.js` lines 205–400 for `parseSkillFlagTokens`'s row anchor and the soundness-block shape. Do not read either file twice.
  </read_first>
  <behavior>
    Expressed as the tests the file must contain. Every assertion below runs against pure functions that take the markdown text and the current version as parameters, so the same function the live tests call is the one the fixtures exercise — the `subtractAllowlist` precedent from `test/skill-cli-parity.test.js`, where a re-derived equivalent computation would be free to drift from what actually runs.

    Live-tree assertions:
    - Region parsing yields exactly four regions from the real `skill/SKILL.md`, three classified live and one historical.
    - Every semver token inside every live region equals `package.json`'s `version`.
    - The historical region's semver tokens equal the transcribed pinned set, and that assertion is independent of `package.json`'s value.
    - Every semver token in the whole file belongs to exactly one region; the count of accounted-for tokens equals the count of tokens found by a whole-file scan.

    Fixture assertions (synthetic markdown, never the real file):
    - A live region whose version differs from the supplied current version produces exactly one finding, naming that region.
    - A live region whose version matches produces zero findings (the control — without it the mismatch test proves only that the function returns something).
    - The historical check returns zero findings when the supplied current version differs from the pin. **This is the exemption proof: the historical paragraph is correct precisely when it disagrees with a bumped `package.json`.**
    - The historical check returns a finding when the historical region's own version literal is altered — so a find-and-replace sweep across the file is caught.
    - A semver token placed outside every region produces a coverage finding naming its line number.
    - A missing anchor throws a distinct named error.
    - A duplicated anchor throws a distinct, differently-named error (ambiguity, not absence).
  </behavior>
  <action>
    Create `test/skill-version-skew.test.js`. ESM, `node:fs`/`node:url`/`node:path` + `vitest` imports in the same order `test/package-identity.test.js` uses. JSDoc-type every function — `tsconfig.json` type-checks `test/**/*.js` under `strict`, so an untyped parameter fails `npm run typecheck`.

    **Module-level constants.**

    Read `package.json` and `skill/SKILL.md` with `readFileSync` at module scope, exactly as the two sibling guards do. Never import `skill/SKILL.md`'s content by any other route and never restate the version as a literal for the live comparison.

    Declare a semver scanner as a single shared regex source used by every scan, so the live path and the fixture path cannot diverge in what counts as a version token.

    Declare a `LIVE_CLAIMS` table of three entries. Each carries: a stable `id`; the anchor text; whether the region is a single table `row` or a `paragraph`; and a short human-readable `description` that will appear in the failure message. The three anchors, each verified unique at planning time:
      - the `--planet` flag-table row — reach it with the line-anchored row regex from `test/skill-cli-parity.test.js`, not a bare substring search, because `--planet` also appears in prose in the Invocation section
      - the Published-Surface Boundary opening paragraph, anchored on the sentence stem about what the published package resolves to
      - the Planet-list skew paragraph, anchored on its bolded lead-in

    Declare a `HISTORICAL_PINS` constant listing the two version literals the historical paragraph legitimately contains, each with a written `reason` string beside it. **Comment this constant as the file's one deliberate transcription exception**, and say why in the comment: these are facts about the past — the release at which the published `exports` map widened, and the earlier version a pinned consumer may still be on — and a historical fact does not move when `package.json` moves. Binding them to `package.json` would make the guard demand the corruption of a correct statement.

    Declare the historical region's anchor alongside them.

    **Extraction helpers.**

    Write one region extractor that takes the markdown, an anchor, and a region kind. It must:
      - locate occurrences of the anchor; throw a named error when there are zero (the anchor text was rewritten — the guard cannot verify anything and must not pass vacuously) and a *differently* named error when there is more than one (ambiguous anchor). Two distinct messages, because the two repairs are different.
      - for `row`, return the single matched line; for `paragraph`, return from the anchor line's start forward to the next blank line or end of file — so a future reflow that wraps a currently-single-line paragraph keeps working.
      - return the region's text together with the 1-based line number of its first line, computed by counting newlines before the match index. Line numbers are for the failure message only; never for locating anything.

    Write a token scanner returning each semver token in a text along with its absolute line number in the containing document.

    **The three comparison functions**, each pure and each taking its inputs as parameters:
      - one returning live-claim findings, given the markdown and the current version
      - one returning historical-pin findings, given the markdown (and NOT the current version — its signature is the exemption, made structural rather than merely commented)
      - one returning coverage findings: tokens present in the document but inside no known region, given the markdown

    **The failure message for the live-claim test** is a deliverable in its own right. Build it from the findings, collect-then-report-once as `test/citations.test.js` and `test/skill-install-parity.test.js` both do, stably sorted. It must carry, in this order:
      1. the value read from `package.json`, labelled as the source of truth
      2. one line per mismatched claim: region id, its human-readable description, the version literal(s) it currently states, and its line number
      3. the instruction to update those claims in `skill/SKILL.md` to the source-of-truth value
      4. an explicit warning that the paragraph opening with the pre-release-history sentence is a HISTORICAL claim, is deliberately pinned, must be left exactly as written, and that a blind find-and-replace across the file will corrupt it — noting that a separate test in this same file guards it and will fail if it is swept
      5. the `skill/` re-sync instruction, quoted as `scripts/skill-install.js` itself prints it, because editing `skill/SKILL.md` without re-syncing turns a correct fix into a red install-parity test and a confusing second failure

    Someone hitting this months from now must not have to reconstruct any of that reasoning. Write the message for them, not for the developer who already has this plan open.

    **Fixture builder.** Write a small helper that assembles a minimal synthetic document containing all four anchors, parameterised by the version each region should state. It must contain only the anchors plus a version token — it must NOT transcribe the real file's prose, which would create a second copy free to drift. If the builder's anchors ever diverge from the real file's, the live tests fail with the named missing-anchor error, so the coupling is self-checking.

    **Test layout.** Two `describe` blocks, mirroring `test/skill-cli-parity.test.js`: the live-tree guard block, then a soundness block covering every fixture assertion listed in `<behavior>`.

    **Naming contract — Task 2 asserts on these names via vitest's report, so they are load-bearing, not cosmetic.** In the live-tree block: the test asserting the three live claims match `package.json` must have `live` in its full name (describe + test) and must NOT contain `historical` or `pinned`; the test asserting the historical region must contain `historical` or `pinned` in its full name. Soundness-block test names are free, but must not collide with that contract — keep `live` out of soundness test names, since a fixture test named with `live` would be read by Task 2 as a live-tree test.

    Do not modify any other file.
  </action>
  <verify>
    <automated>npx vitest run test/skill-version-skew.test.js && npm run typecheck && npx eslint test/skill-version-skew.test.js && test "$(grep -cE "['\"]1\.1\.0['\"]" test/skill-version-skew.test.js)" -ge 1 && test "$(grep -vE '^\s*(\*|//)' test/skill-version-skew.test.js | grep -cE "version['\"]?\s*[:=]\s*['\"]1\.1\.0['\"]")" -le 2 && node -e "const s=require('node:fs').readFileSync('test/skill-version-skew.test.js','utf-8'); const req=['package.json','HISTORICAL','skill/SKILL.md']; const missing=req.filter(t=>!s.includes(t)); if(missing.length){console.error('missing required token(s): '+missing.join(', '));process.exit(1)}"</automated>
  </verify>
  <done>
    `test/skill-version-skew.test.js` exists and is green on its own. `npm run typecheck` and `eslint` both pass on it. It reads `package.json` for the live source of truth and contains no transcribed literal serving as the live comparison value — the only version literals in it are the commented `HISTORICAL_PINS` entries and message/fixture text. All four anchors resolve against the real `skill/SKILL.md`; the coverage test accounts for all nine semver tokens; the soundness block covers both anchor error modes, both directions of the live comparison, the historical-exemption case, the historical-sweep case, and the outside-every-region case.
  </done>
</task>

<task type="auto">
  <name>Task 2: Prove the guard discriminates — live mutation, then verified revert</name>
  <files>package.json (temporarily mutated and reverted; net zero change), test/skill-version-skew.test.js</files>
  <precondition>`git status --porcelain -- package.json` prints nothing. The revert step below uses `git checkout -- package.json`, which restores HEAD's content exactly — and would therefore destroy any unrelated uncommitted edit to that file. If it prints anything, HALT and report rather than proceeding; do not attempt to preserve the edit by hand-editing the version back.</precondition>
  <action>
    A guard that passes vacuously is worse than no guard: it reads as coverage while providing none. Fixtures alone do not settle this — they prove the functions behave, not that they are wired to the real files. Prove it against the live tree.

    Work in a `mktemp -d` scratch directory; leave nothing in the repo.

    1. Confirm the precondition above.
    2. Record HEAD's version value for the report.
    3. Bump `package.json`'s `version` to a value that cannot collide with anything real — `9.9.9`. Change that field only; preserve formatting and every other key. Prefer a targeted edit over a JSON round-trip, which would reformat the file.
    4. Run the guard alone, capturing a machine-readable report:
       `npx vitest run test/skill-version-skew.test.js --reporter=json --outputFile=$SCRATCH/skew.json` (if the JSON reporter is unavailable on this vitest version, fall back to capturing combined stdout/stderr to `$SCRATCH/skew.txt` and parsing the per-test result markers — but try JSON first; a human eyeballing terminal output is not evidence).
    5. From that report, assert THREE things mechanically with `node -e`, not by reading:
       - the run failed overall
       - the live-claim test FAILED
       - **the historical-pin test PASSED in the same run** — this is the exemption proof. With the version bumped, the historical paragraph is correct precisely because it disagrees with `package.json`, and the guard must agree.
       Also assert the captured failure message contains the source-of-truth value, the mismatched claims, and the pinned-paragraph warning — so message quality is proven under real failure conditions, not just inspected in the source.
    6. Revert with `git checkout -- package.json`. Do not hand-edit the version back; `git checkout` restores HEAD's bytes exactly and is the only revert that cannot introduce a formatting delta.
    7. Verify the revert mechanically and explicitly: `git diff --exit-code -- package.json` exits 0 AND `git status --porcelain -- package.json` prints nothing. A dirty manifest left behind would be a worse outcome than the missing guard this task exists to add.
    8. Re-run the guard and confirm it is green again.

    Record in the summary: the bumped value used, which test failed, which passed, and the revert verification result. If the historical-pin test fails under the bump, the guard is mis-designed — HALT and report; do not "fix" it by relaxing the historical assertion.
  </action>
  <verify>
    <automated>export SCRATCH=$(mktemp -d) && test -z "$(git status --porcelain -- package.json)" && ORIG=$(node -p "require('./package.json').version") && node -e "const fs=require('node:fs');const p='package.json';const s=fs.readFileSync(p,'utf-8');const o=s.replace(/(\"version\":\s*\")[^\"]+(\")/, '\$19.9.9\$2');if(o===s){console.error('version field not matched');process.exit(1)}fs.writeFileSync(p,o)" && test "$(node -p "require('./package.json').version")" = "9.9.9" && (npx vitest run test/skill-version-skew.test.js --reporter=json --outputFile=$SCRATCH/skew.json > $SCRATCH/run.log 2>&1; echo $? > $SCRATCH/exit) && test "$(cat $SCRATCH/exit)" != "0" && node -e "const fs=require('node:fs');const r=JSON.parse(fs.readFileSync(process.env.SCRATCH+'/skew.json','utf-8'));const all=r.testResults.flatMap(f=>f.assertionResults);const hist=all.filter(a=>/historical|pinned/i.test(a.fullName));const live=all.filter(a=>/live/i.test(a.fullName)&&!/historical|pinned/i.test(a.fullName));if(!hist.length){console.error('no historical/pinned test found by name');process.exit(1)}if(!live.length){console.error('no live-claim test found by name');process.exit(1)}const histFailed=hist.filter(a=>a.status==='failed');const liveFailed=live.filter(a=>a.status==='failed');if(histFailed.length){console.error('EXEMPTION BROKEN: historical test failed under a version bump: '+histFailed.map(a=>a.fullName).join('; '));process.exit(1)}if(!liveFailed.length){console.error('VACUOUS GUARD: no live-claim test failed under a version bump');process.exit(1)}const msg=liveFailed.map(a=>(a.failureMessages||[]).join('\n')).join('\n');for(const t of ['9.9.9','SKILL.md']){if(!msg.includes(t)){console.error('failure message missing expected content: '+t);process.exit(1)}}console.log('discrimination proven: live failed, historical passed')" && git checkout -- package.json && git diff --exit-code -- package.json && test -z "$(git status --porcelain -- package.json)" && test "$(node -p "require('./package.json').version")" = "$ORIG" && npx vitest run test/skill-version-skew.test.js</automated>
  </verify>
  <done>
    Under a temporary `9.9.9` bump the live-claim test failed and the historical-pin test passed in the same run, both established from vitest's own report rather than from terminal reading. The captured failure message carried the source-of-truth value and named `skill/SKILL.md`. `package.json` is byte-identical to HEAD: `git diff --exit-code` exits 0, `git status --porcelain` is empty, and the version reads back as the original. The guard is green again. The scratch directory is outside the repo and nothing was left in the working tree.
  </done>
</task>

<task type="auto">
  <name>Task 3: Prove the addition costs nothing — full suite, snapshots, install parity</name>
  <files>test/skill-version-skew.test.js</files>
  <action>
    Close the scope boundary mechanically rather than by assertion.

    1. `CI=true npm test` — the full suite. If `test/browser/*` fails for a missing chromium, that is a pre-existing environment condition documented in `.planning/STATE.md`, not a regression from this task: run `npx playwright install chromium` once and re-run. Do not conflate the two, and do not skip or exclude the browser tests to get green.
    2. `npm run typecheck` and `npm run lint` — both exit 0.
    3. Snapshot immobility, both halves — a `git diff` alone misses a NEW untracked snapshot file, which is exactly how snapshot drift hides:
       - `git diff --exit-code -- test/__file_snapshots__ test/render/__snapshots__`
       - `git status --porcelain -- test/__file_snapshots__ test/render/__snapshots__` prints nothing
    4. Scope proof: `git status --porcelain -- skill src bin package.json` prints nothing. Nothing under `skill/` changed, so no reinstall is required — but confirm `test/skill-install-parity.test.js` is green in the full run rather than assuming it, since a stale install from earlier work would surface here.
    5. `git status --porcelain` overall shows exactly one added path: `test/skill-version-skew.test.js` (plus this plan's own `.planning/` artifacts).

    Report the suite's passed count against the 1,532 recorded in `.planning/STATE.md` as a sanity check — the delta should be the new file's test count and nothing else.
  </action>
  <verify>
    <automated>CI=true npm test && npm run typecheck && npm run lint && git diff --exit-code -- test/__file_snapshots__ test/render/__snapshots__ && test -z "$(git status --porcelain -- test/__file_snapshots__ test/render/__snapshots__)" && test -z "$(git status --porcelain -- skill src bin package.json)" && test -z "$(git status --porcelain -- . ':!.planning' ':!test/skill-version-skew.test.js')"</automated>
  </verify>
  <done>
    `CI=true npm test` green, `typecheck` and `lint` exit 0. Both snapshot directories are untouched by diff AND by status. `skill/`, `src/`, `bin/` and `package.json` are all clean — the change is a single added test file. `test/skill-install-parity.test.js` passed inside the full run without a reinstall. The suite's passed count exceeds the recorded 1,532 by exactly the new file's test count.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| `package.json` → published npm artifact | The version field this guard keys on is the same field a release publishes; a wrong value here propagates to consumers |
| `skill/SKILL.md` → any Claude Code session | The skill's instructions are executed by sessions on arbitrary machines; a false version claim sends a session to an invocation that fails, or worse, to one it believes is safe |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-rfu-01 | Tampering | `package.json` during Task 2's mutation proof | medium | mitigate | Revert via `git checkout --` (restores HEAD bytes exactly, no formatting delta), gated behind a clean-file precondition and followed by a two-part mechanical revert verification (`git diff --exit-code` + `git status --porcelain`) |
| T-rfu-02 | Repudiation | The guard itself passing vacuously | high | mitigate | Live mutation proof asserted from vitest's JSON report, not terminal reading; plus a whole-file coverage test so a version claim added outside the four known regions cannot go unguarded |
| T-rfu-03 | Information disclosure | `skill/SKILL.md` version claims read by sessions | low | accept | The claims are public package metadata already visible via `npm view`; the risk is incorrectness, not disclosure, and incorrectness is what this guard addresses |
| T-rfu-04 | Denial of service | A brittle guard blocking unrelated work | low | mitigate | Anchors are stable prose, never line numbers; missing and duplicated anchors throw distinct named errors that state the repair rather than failing opaquely |
| T-rfu-SC | Tampering | npm/pip/cargo installs | high | mitigate | Not applicable — this task installs no packages. `npx vitest` and `npx eslint` resolve the already-present devDependencies pinned in `package.json`; no new dependency enters the tree, and `git status --porcelain -- package.json` being empty at close proves it |
</threat_model>

<verification>
- `test/skill-version-skew.test.js` exists, is green, typechecks, and lints.
- The live comparison value is read from `package.json` at runtime; the only version literals in the file are the commented historical pins plus message and fixture text.
- Four anchors resolve against the real `skill/SKILL.md`; all nine semver tokens are accounted for by exactly one region each.
- Live mutation proof executed: live-claim test failed, historical-pin test passed, both read from vitest's report.
- `package.json` byte-identical to HEAD after the proof, verified by `git diff --exit-code` and `git status --porcelain`.
- `CI=true npm test` green; zero snapshot movement by diff and by status.
- `git status --porcelain -- skill src bin package.json` empty.
</verification>

<success_criteria>
The next release that publishes uranus, neptune and pluto cannot ship a `skill/SKILL.md` that still tells sessions those planets are unavailable — the suite fails on whoever bumps the version, names the three claims to update, and warns them off the one paragraph that must not change. That outcome is proven by executed mutation, not by inspection.
</success_criteria>

<output>
Create `.planning/quick/260812-rfu-guard-the-sigil-skill-s-version-skew-cla/260812-rfu-SUMMARY.md` when done.
</output>
