# Phase 6: Published Package - Research

**Researched:** 2026-08-08
**Domain:** First-ever publish of a scoped, zero-dependency ESM npm package, with a GitHub Actions release workflow producing a verifiable npm provenance attestation.
**Confidence:** HIGH for npm-mechanics claims fetched live this session from docs.npmjs.com (Q1–Q4 below); MEDIUM for GitHub Actions workflow patterns (cross-checked web search, consistent across multiple independent sources, not fetched from a single canonical GH Actions doc page); HIGH for project-specific claims (read directly from this repo's files this session).

**This document does not re-derive `.planning/research/PITFALLS.md` Pitfalls 1, 2, 3, 4, 5, 10** — it cites them and goes deeper only on the four questions the roadmap flagged as requiring a live-documentation check before the irreversible publish. Read PITFALLS.md first; this document assumes it.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

Six gray areas, all auto-resolved (D-62 through D-78). Copied verbatim from `06-CONTEXT.md`:

- **D-62:** The first published version is `1.0.0`. `package.json` currently says `0.1.0`. **Reversibility: one-way.**
- **D-63:** `name` becomes `@falkensmage/sigil-spinner`; the `bin` key stays `sigil-spinner`. **Reversibility: one-way.**
- **D-64:** Every bare `sigil-spinner` module specifier in shipped docs moves to the scoped name in the same commit as `package.json`. Known site: `README.md` line 15 (`import { generateSigil } from 'sigil-spinner'`). Relative imports inside `src/`, `bin/`, `test/` are untouched.
- **D-65:** A mechanical guard asserts the README's documented install/import specifier matches `package.json`'s `name`. Same instrument as `test/citations.test.js`.
- **D-66:** `license` becomes `MIT`, root `LICENSE` file added, `Copyright (c) 2026 Matt Stine`. **Reversibility: one-way once published.**
- **D-67:** `repository` is `{ "type": "git", "url": "git+https://github.com/mstine/sigil-spinner.git" }`. Verified against the live remote (`git@github.com:mstine/sigil-spinner.git`). **Reversibility: one-way in effect.**
- **D-68:** `author` is `"Matt Stine (https://github.com/mstine)"` — name and URL, no email. **Reversibility: one-way once published.**
- **D-69:** Metadata set is the required four plus `publishConfig`, `homepage`, `bugs`. `description`, `keywords`, `engines`, `files`, `exports`, `type` stay as-is.
- **D-70:** Smoke test lives at `test/pack-install.test.js`, follows the `test/e2e/` pattern (vitest + `execFileSync`). Full ladder rungs 1–2: `npm pack --dry-run --json` manifest assertion, then real `npm pack` into a scratch dir under `os.tmpdir()`, `npm install <abs>.tgz --no-audit --no-fund` into an empty project, three assertions: `exports` resolution, `bin` runs end to end, byte-identical output vs. dev tree. `npm link` disqualified.
- **D-71:** Excluded from default `npm test`, exposed as `npm run test:pack`. Rot risk closed by D-75 (release workflow runs it as a hard gate).
- **D-72:** Entry points under test declared as data (a table), not procedure — `[{ subpath: '.', namedExports: [...] }]` plus `bin`.
- **D-73:** Scratch directory created fresh per run, removed on success, kept on failure.
- **D-74:** GitHub Actions release workflow built and exercised before any real publish; first real registry write performed by that workflow. Credential path: npm automation token as a GitHub Actions secret (`NPM_TOKEN`), `id-token: write`, public repo. Live-docs check: whether Trusted Publishing (OIDC) can be configured for a package that does not yet exist. **Reversibility: one-way** — 72h conditional unpublish, 24h name lock after full unpublish, versions never reusable.
- **D-75:** Full rehearsal ladder is the acceptance criterion, in order: `npm pack --dry-run` → tarball scratch-install (D-70) → `npm publish --dry-run` → `npm publish --tag next --provenance --access public` from the workflow → verify live (`npm view`, real install via `@next`, provenance attestation renders) → promote with `npm dist-tag add @falkensmage/sigil-spinner@1.0.0 latest`.
- **D-76:** Trigger is `workflow_dispatch` only, with a `dist-tag` input (`next` | `latest`) and a separate `promote` mode. No `push: tags: v*` trigger this phase.
- **D-77:** Workflow gates the publish behind the full local quality suite, in order: `npm ci` → `npm run lint` → `npm run typecheck` → `npx playwright install --with-deps chromium` → `npm test` → `npm run test:pack` → publish.
- **D-78:** README gets one pass scoped to the scoped install/import specifier (D-64) and an unmissable ESM-only disclosure in the opening section.

### Claude's Discretion

- Plan decomposition and commit granularity (ordering PKG-04+PKG-03 → PKG-01 → PKG-05's live check before publish is fixed; splitting across plans is not).
- The smoke test's byte-identity fixture — in-process fresh-generate comparison vs. committed snapshot.
- The expected-tarball-manifest assertion's strictness — exact set vs. required subset (Phase 7 will add files).
- Workflow hardening details — action pinning, `permissions` minimization beyond `id-token: write`/`contents: read`, concurrency group, Node version matrix.
- Whether `npm run test:pack` also appears in a PR-triggered CI workflow (no CI exists today; not a phase requirement).

### Deferred Ideas (OUT OF SCOPE)

- `PACKAGE_VERSION` as a second in-source constant with a CI parity assertion — still deferred, reopen if a consumer needs to identify which package version produced a working.
- A `push: tags: v*` release trigger — reasonable once manual-dispatch has published successfully once.
- A PR-triggered CI workflow running lint/typecheck/test on every push.
- Dual ESM+CJS publishing — standing refusal, not a deferral.
- The `./element` exports subpath and its `files` coverage — Phase 7 owns it.
- npm README badges (version, license, provenance) — cosmetic.
- The three v1.0 items deferred with written reopen conditions (`E_CLI_STDIN` coverage, `perpendicularUnit` doc comment, `D-12` ID collision) — planning should confirm `bin/sigil-spinner.js:20` stays untouched this phase (confirmed this session: this phase's only production-file edit is `package.json`, per `06-CONTEXT.md` Integration Points; `bin/` is not touched).

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PKG-04 | Complete, correct publication metadata (MIT + `LICENSE`, `author`, `repository.url` char-for-char, `publishConfig.access: public`) | § Standard Stack (metadata fields), § Code Examples (`package.json` diff), Q1's `repository.url` case-sensitivity finding (new, not in PITFALLS.md) |
| PKG-03 | Repeatable pack-and-scratch-install smoke test | § Q2 answers below — `npm pack --json` schema, scratch-install mechanics, `.mjs` harness trick, vitest exclusion config |
| PKG-01 | The actual publish to the public npm registry | § Q1 (credential path), § Q4 (verification, irreversibility bounds) |
| PKG-05 | GitHub Actions release workflow with npm provenance | § Q1 (blocking determination), § Q3 (workflow mechanics), § State of the Art (token-model changes affecting this exact month) |

</phase_requirements>

## Summary

The roadmap's central open question — can npm Trusted Publishing (OIDC) bootstrap `@falkensmage/sigil-spinner`'s first-ever publish — is answered **no**, confirmed live against `docs.npmjs.com/trusted-publishers` this session: a trusted publisher is configured from an *existing* package's settings page on npmjs.com, and there is no scope- or org-level pre-configuration path. D-74's stated fallback (a stored token) is therefore the only viable path for `1.0.0`, exactly as D-74 already anticipated ("If configuring a trusted publisher requires the package to already exist, the token path stands and OIDC becomes a post-1.0.0 upgrade").

**What research adds beyond that determination, and why it matters now specifically:** the roadmap's phrase "npm automation token" describes a token type that **no longer exists**. npm permanently revoked all classic/long-lived tokens (including the classic "Automation" type) in December 2025; the only token type creatable in 2026 is a **Granular Access Token (GAT)**, and the artifact the human gate must actually create is a GAT with **"Bypass 2FA for publishing" checked**, scoped to write access on the `@falkensmage` scope (or the specific package). This is a same-shape substitution — the plan's human-gate task description just needs the current noun, not a different mechanism — but there is a second, sharper finding: npm is **actively restricting** bypass-2FA tokens on the calendar this phase is executing in. As of "early August 2026" (npm's own stated rollout window — i.e., now), bypass-2FA GATs lose account/package/org-management actions; direct-publish capability for those tokens is scheduled to end **around January 2027**, at which point npm shifts CI publishing to OIDC trusted publishing or a 2FA-approved "staged publish" flow. None of this blocks Phase 6 — direct publish via a bypass-2FA GAT still works today — but it sharpens D-74's own deferred plan: **configuring OIDC trusted publishing immediately after the first publish succeeds is not a nice-to-have, it is the thing that keeps this workflow from needing another rewrite before Q1 2027.** Recommend the plan add this as an explicit near-term follow-on (see Open Questions).

The pack-and-scratch-install smoke test (Q2) has one load-bearing mechanical detail not obvious from the CLI docs: the scratch-install harness script should use a `.mjs` file extension rather than relying on a scratch `package.json`'s `"type": "module"` field — Node treats `.mjs` as ESM unconditionally, verified against Node's own module docs this session, which removes one moving part (no need to author or assert on a synthetic scratch `package.json`) from D-73's fresh-per-run scratch directory.

The release workflow (Q3) is a standard `permissions: { id-token: write, contents: read }` + `actions/setup-node` + `npm publish --provenance` shape, gated behind D-77's ordered quality suite. The one detail worth flagging: `npm dist-tag add ... latest` is confirmed (live docs) to be a pure registry metadata operation — it does not republish and does not regenerate or invalidate the `next` publish's provenance attestation, which is exactly what D-75's promote step assumes.

**Primary recommendation:** Build and exercise the full rehearsal ladder with a Granular Access Token (bypass-2FA, write, scoped to `@falkensmage`) as `NPM_TOKEN`; do not attempt to configure a Trusted Publisher before the first publish exists. Immediately after `1.0.0` promotes to `latest`, configure OIDC trusted publishing on the now-existing package as a fast follow, and let the token become the emergency fallback rather than the standing credential.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Package identity/metadata correctness (PKG-04) | Package manifest (`package.json`) | Registry (npm) | The manifest is the single source; the registry only reflects what's published, and a wrong value there is a version bump to fix |
| Pack/install verification (PKG-03) | Test harness (vitest, `test/pack-install.test.js`) | Filesystem (`os.tmpdir()` scratch dir) | The test owns the assertions; the filesystem is disposable staging, never source of truth |
| Publish execution (PKG-01) | CI/CD (GitHub Actions) | Registry (npm) | The workflow is the only actor permitted to write to the registry per D-74/D-76 — no local/manual publish path |
| Provenance attestation (PKG-05) | CI/CD OIDC + Registry (Sigstore/npm) | Package manifest (`repository` field) | The attestation is minted by the registry from the CI run's OIDC claims, but is only valid if `package.json`'s `repository.url` matches (case-sensitive) the repo the workflow runs in — a manifest field gates a registry-side cryptographic check |
| Credential custody (`NPM_TOKEN`) | GitHub Actions Secrets | — | Human-created, human-rotated (npm's own bypass-2FA write-token expiration ceiling applies); never committed, never logged |

## Standard Stack

### Core

No new runtime or dev dependencies are added by this phase. The publish toolchain is npm's own CLI (already present: `npm 11.4.2` on this machine, confirmed via `npm --version`) plus GitHub Actions' own first-party actions.

| Tool | Version (verified) | Purpose | Why Standard |
|------|---------------------|---------|---------------|
| `npm` CLI | `11.4.2` (this machine, `npm --version`, confirmed live) | pack, publish, dist-tag, audit signatures | The only tool capable of writing to the npm registry or producing a provenance attestation; no alternative exists that doesn't violate the zero-publish-helper-dependency constraint |
| `actions/checkout` | `v5`/`v6` (pin exact SHA or major at plan time — see Code Examples) | Checks out the repo in the workflow runner | First-party GitHub action, the standard first step of every workflow |
| `actions/setup-node` | `v4` or later (v5/v6 current as of this research window per search results; confirm exact latest tag at plan time) | Installs Node, configures `registry-url` and writes the runner's `.npmrc` so `NODE_AUTH_TOKEN` is picked up | First-party GitHub action; this is *the* documented mechanism for wiring an npm auth token into a workflow — hand-rolling `.npmrc` construction is unnecessary and the kind of thing this repo's own Don't-Hand-Roll discipline would refuse |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `os`, `fs`, `child_process`, `path` (Node built-ins) | ships with Node ≥20 | Scratch-directory creation, tarball pack/install orchestration, `execFileSync` for CLI invocation in the smoke test | Already the pattern in `test/e2e/phase2-tracer.test.js` (`fileURLToPath`, `execFileSync`) — the smoke test is the same shape pointed at an installed copy instead of the repo tree |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-written `.npmrc`/auth wiring | `actions/setup-node`'s `registry-url` input | Never — `setup-node` is the documented, maintained mechanism; hand-rolling it duplicates first-party tooling for no benefit |
| Token-based publish for `1.0.0` | OIDC Trusted Publishing for `1.0.0` | Not available — confirmed live this session: trusted publishing requires the package to already exist on the registry. Token is the only path for the first publish |
| `npm publish` (plain) with a separate promotion command | `npm publish --tag next` then `npm dist-tag add ... latest` | The ladder's whole point (D-75) — buys a live-infrastructure review window; a plain `npm publish` skips that window entirely |

**Installation:** No `npm install` of new packages required for this phase. `.github/workflows/` is a new directory (confirmed: `ls .github` finds nothing in this repo, verified this session), created by this phase, not modified.

## Package Legitimacy Audit

**Not applicable this phase.** PKG-01/PKG-03/PKG-04/PKG-05 add zero new runtime or dev dependencies — `dependencies: {}` stays empty and no new `devDependencies` entries are introduced. The only "package" installed during this phase's own work is this project's own tarball, into a disposable scratch directory, which is not a third-party supply-chain surface. `npm view`/`npm pack`/`actions/checkout`/`actions/setup-node` are not npm registry packages subject to slopsquatting risk — they are the npm CLI itself and first-party GitHub Actions.

## Architecture Patterns

### System Architecture Diagram

```
 developer / CI trigger
        |
        v
 [package.json + LICENSE + README]  (PKG-04: metadata correctness)
        |
        v
 npm pack --dry-run --json  ---->  [assert declared manifest == expected files, incl. LICENSE]
        |
        v
 npm pack (real tarball)  ---->  os.tmpdir()/scratch/*.tgz
        |
        v
 npm install <abs tarball> --no-audit --no-fund  ---->  os.tmpdir()/scratch-project/node_modules/
        |                                                     |
        |                                                     v
        |                                          [exports resolve? bin runs? output byte-identical?]
        |                                                     |  (PKG-03: test/pack-install.test.js)
        v                                                     v
 npm publish --dry-run  (logged in, real registry) ---->  [scope-access / name-conflict check]
        |
        v
 GitHub Actions workflow_dispatch (dist-tag=next)  ---->  npm ci -> lint -> typecheck -> playwright install
        |                                                  -> npm test -> npm run test:pack -> publish
        |                                                        |
        |                                                        v
        |                                          npm publish --tag next --provenance --access public
        |                                          (auth: NPM_TOKEN secret; attestation: OIDC id-token: write)
        v                                                        |
 npm view / npm audit signatures / real install via @next  <-----+   (PKG-05: verify attestation live)
        |
        v
 GitHub Actions workflow_dispatch (mode=promote)  ---->  npm dist-tag add @falkensmage/sigil-spinner@1.0.0 latest
        |                                                  (metadata-only; does not republish or re-attest)
        v
 bare `npm install @falkensmage/sigil-spinner` now resolves to 1.0.0 for everyone
```

### Recommended Project Structure

```
.github/
└── workflows/
    └── release.yml        # workflow_dispatch only (D-76); publish + promote modes in one file
test/
└── pack-install.test.js   # PKG-03 smoke test (D-70); excluded from default `npm test` (D-71)
LICENSE                     # PKG-04 (D-66); root-level, npm auto-includes in tarball
package.json                 # PKG-04 edits: name, version, license, author, repository, publishConfig, homepage, bugs
```

### Pattern 1: The `.mjs` scratch harness (avoids a synthetic scratch `package.json`)

**What:** When the smoke test needs to prove `import { generateSigil }` resolves through the installed package's `exports` map the way a *real* external consumer would — not the way an in-process dynamic `import()` from inside the vitest process would — write a tiny `.mjs` file into the scratch project directory and execute it with `execFileSync(process.execPath, [scratchEntryPath], { cwd: scratchDir })`.

**Why it matters:** `.mjs` is unconditionally ES module regardless of any `package.json` `"type"` field — confirmed this session against Node's own module docs: *"Regardless of the value of the `"type"` field, `.mjs` files are always treated as ES modules and `.cjs` files are always treated as CommonJS."* This means the scratch project directory doesn't need its own `package.json` at all for the *import* assertion to be meaningful — Node resolves `import '@falkensmage/sigil-spinner'` by walking up from the `.mjs` file's location to find `node_modules/@falkensmage/sigil-spinner/package.json` and its `exports` map, which is exactly the resolution algorithm a real consumer's `import` goes through. (A `package.json` in the scratch dir may still be wanted for `npm install <tarball>` itself to behave predictably — see Q2 below — but its `"type"` field is not load-bearing for this specific assertion.)

**When to use:** The `import` and `exports`-resolution assertions in `test/pack-install.test.js` (D-70, D-72).

**Example:**
```js
// Source: Node.js docs (nodejs.org/api/packages.html, fetched live this session)
// scratchDir/probe-import.mjs — written by the test, not committed
import { generateSigil } from '@falkensmage/sigil-spinner';
const { svg } = generateSigil('I WILL SUCCEED', 'saturn');
process.stdout.write(svg);
```
```js
// test/pack-install.test.js — invoking it
const output = execFileSync(process.execPath, [probeImportPath], {
  cwd: scratchDir,
  encoding: 'utf-8',
});
```

### Pattern 2: `npm dist-tag add` as a pure metadata promotion (no republish, no re-attestation)

**What:** D-75's final rung, `npm dist-tag add @falkensmage/sigil-spinner@1.0.0 latest`, only moves which version a bare `npm install @falkensmage/sigil-spinner` resolves to. It does not create a new package version, does not re-run the publish pipeline, and does not touch the provenance attestation already attached to the `1.0.0` version published under the `next` tag.

**Source:** `docs.npmjs.com/cli/v11/commands/npm-dist-tag/` — fetched live this session. Quoted: *"Tags the specified version of the package with the specified tag"* — no mention of republishing, and 2FA/OTP is the only authentication nuance the docs call out for the command (`--otp <one-time password>` if the account has 2FA on auth-and-writes).

**When to use:** The promote mode of the `workflow_dispatch` release workflow (D-76).

### Anti-Patterns to Avoid

- **Treating `npm publish --dry-run` output as sufficient without reading it:** PITFALLS.md Pitfall 1 already documents that some tooling honors `--access public` on the CLI while ignoring `publishConfig.access` on a first publish — the dry-run's printed access line must be read, not just its exit code.
- **Assuming the classic "Automation" token type is what npm's UI still calls "automation token":** it is not. As of December 2025, classic tokens (including the "Automation" type) are gone; the plan's human-gate instructions should say "Granular Access Token with Bypass 2FA enabled," not "automation token," so whoever executes the human gate isn't hunting for a UI option that no longer exists.
- **Configuring a Trusted Publisher before the first publish:** it will not work — npm's trusted-publisher configuration UI lives on an existing package's settings page. Do not spend time on this before `1.0.0` exists on the registry.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| npm auth token wiring into a CI runner's `.npmrc` | A custom `echo "//registry.npmjs.org/:_authToken=..." > .npmrc` step | `actions/setup-node`'s `registry-url` input + `NODE_AUTH_TOKEN` env var on the publish step | This is exactly what `setup-node` exists for; a hand-written `.npmrc` step risks leaking the token into workflow logs if any step echoes file contents for debugging |
| Publish orchestration / semantic versioning automation | `np`, `release-it`, `semantic-release`, `changesets` | Direct `npm` CLI invocations inside the workflow | Named refusal in both ROADMAP.md Milestone-Wide Constraints and this phase's non-negotiable constraints — any of these would be a devDependency the zero-runtime-dependency ethos doesn't exempt from scrutiny, and none of them are needed for a `workflow_dispatch`-only, manually-versioned release process this small |
| Verifying "no transitive runtime dependencies" | A hand-rolled recursive `node_modules` walker | `npm ls --all --json` (or simply `ls node_modules/@falkensmage/sigil-spinner` plus `ls node_modules` at the top level) in the scratch project after install | `npm ls` is the CLI's own dependency-tree inspector; for a zero-dependency package the scratch `node_modules/` should contain exactly one entry (the scoped package itself) and nothing else — trivially checkable without reimplementing npm's resolution logic |

**Key insight:** Every tool this phase needs (pack, publish, dist-tag, audit signatures, setup-node) already exists as first-party tooling. The entire phase can be built with zero new dependencies of any kind — the same "hand-roll only when nothing standard exists" discipline this repo already applies to Catmull-Rom curves and argv parsing applies here to publish orchestration too: there is nothing to hand-roll, and nothing standard to add either.

## Common Pitfalls

> Pitfalls 1, 2, 3, 4, 5, and 10 from `.planning/research/PITFALLS.md` apply directly and are not repeated here. The pitfalls below are new findings from this session's live-documentation research, not previously documented.

### Pitfall A: "npm automation token" is a stale noun — the UI has no such option anymore

**What goes wrong:** Whoever executes the human gate (create an npm automation token, add as a GitHub Actions secret) goes looking for a token type literally labeled "Automation" on npmjs.com's token-creation UI, per the roadmap's and REQUIREMENTS.md's own wording, and doesn't find it.

**Why it happens:** npm permanently revoked all classic/long-lived tokens — including the classic "Automation," "Publish," and "Read-only" types — as part of a security migration completed in December 2025 (`github.blog/changelog/2025-12-09-npm-classic-tokens-revoked...`, cross-checked search). As of 2026, `docs.npmjs.com/creating-and-viewing-access-tokens` documents only **Granular Access Tokens (GATs)**: *"You cannot create granular access tokens from the CLI currently. You must use the website to generate these types of tokens."*

**How to avoid:** The human-gate task instructions (and the plan's `checkpoint:human-verify` prose) should say: create a **Granular Access Token**, scope it to **Read and write** access on the `@falkensmage` scope (or narrowed to the single package once it exists), and **check "Bypass 2FA for publishing."** Without the bypass-2FA checkbox, a CI publish from a 2FA-protected account will fail requesting an interactive one-time password that a non-interactive workflow cannot supply.

**Warning signs:** The token-creation UI showing only "Granular Access Token" as an option with no "Automation" label anywhere; a CI publish failing with an OTP-required error despite a valid token being present in the secret.

**Phase to address:** PKG-01/PKG-05 human gate, before the workflow is exercised for real.

### Pitfall B: The bypass-2FA token's publish capability is on a countdown this exact month

**What goes wrong:** A plan that treats the `NPM_TOKEN` secret as a permanent, install-once credential will need an unplanned rewrite in a matter of months.

**Why it happens:** npm's own stated rollout: bypass-2FA GATs lose account/package/organization-management actions "in early August 2026" (i.e., now, per `docs.npmjs.com/requiring-2fa-for-package-publishing-and-settings-modification`, fetched live: *"As of August 2026, bypass-2FA tokens cannot be used for account-identity or account-governance actions. Those actions always require an interactive 2FA challenge."*) — and separately, direct-publish capability for bypass-2FA tokens is scheduled to end "around January 2027" (`github.blog/changelog/2026-07-08-npm-install-time-security-and-gat-bypass2fa-deprecation`, cross-checked search: *"We expect this change to take effect around January 2027"*), after which npm shifts CI publishing to OIDC trusted publishing or a 2FA-approved staged-publish flow.

**How to avoid:** Direct token-based publish **still works today** for this phase's purposes — this is not a blocker. But the plan should treat "configure OIDC Trusted Publishing on the now-existing package" as a near-term follow-on immediately after `1.0.0` promotes to `latest`, not as an open-ended someday item. D-74 already names this exact fallback sequencing ("OIDC becomes a post-1.0.0 upgrade") — this finding is confirmation that the upgrade has a real deadline, not idle housekeeping.

**Warning signs:** None yet observable in this project (too early); the generic warning sign across the ecosystem is CI publishes starting to fail with account-governance-style errors on tokens that used to work, as npm's phased restrictions roll forward.

**Phase to address:** Flagged here for the plan to schedule as a fast-follow; not a blocking requirement for Phase 6 itself.

### Pitfall C: `repository.url` case-sensitivity is a real, documented attestation-breaking failure — not hypothetical

**What goes wrong:** D-67 already specifies the exact `repository.url` value and PITFALLS.md's own "Corrected Premise" section (SUMMARY.md § lines 37-45, cited in `06-CONTEXT.md`) already treats this as validated character-for-character. This session's live-doc fetch corroborates it with an external failure report: a real project's provenance publish failed with a Sigstore 422 error because `package.json`'s normalized `repository.url` (`git+https://github.com/frontenddev-org/create-creator.git`) didn't match the GitHub org's actual casing (`FrontEndDev-org`) — confirmed via `docs.npmjs.com/generating-provenance-statements`: *"Ensure your `package.json` is configured with a public `repository` that matches (case-sensitive) where you are publishing with provenance from."*

**Why it happens:** GitHub organization/user names and repo names are case-preserving but not case-sensitive for git operations, so a `package.json` author can type a different case than the canonical GitHub casing and never notice locally — `git clone` and `git push` both still work. Only the provenance attestation check cares.

**How to avoid:** This repo's remote is `git@github.com:mstine/sigil-spinner.git` — confirmed live this session (`git remote -v`) — and D-67's chosen value (`git+https://github.com/mstine/sigil-spinner.git`) matches that casing exactly. No action needed beyond not changing the casing later. Flagging this as a **verification step** the plan's `<verify>` block should include explicitly: diff `package.json`'s `repository.url` against `git remote get-url origin`, normalized for the `git+https://.../.git` vs `git@...:.../.git` transform, case-sensitive.

**Phase to address:** PKG-04 (metadata), verified again at PKG-05 (before the real publish).

## Code Examples

### `package.json` diff (PKG-04) — fields this phase touches, current values read live this session

Current state, read from `package.json` this session (lines 1–46, quoted verbatim where load-bearing):
```json
"name": "sigil-spinner",
"version": "0.1.0",
"author": "",
"license": "ISC",
```
No `repository`, no `publishConfig`, no `homepage`, no `bugs` keys exist today (confirmed by reading the full file — none of those four keys appear anywhere in it).

Target state per D-62/D-63/D-66/D-67/D-68/D-69:
```json
{
  "name": "@falkensmage/sigil-spinner",
  "version": "1.0.0",
  "license": "MIT",
  "author": "Matt Stine (https://github.com/mstine)",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/mstine/sigil-spinner.git"
  },
  "homepage": "https://github.com/mstine/sigil-spinner",
  "bugs": {
    "url": "https://github.com/mstine/sigil-spinner/issues"
  },
  "publishConfig": {
    "access": "public"
  }
}
```
(`description`, `keywords`, `engines`, `files`, `exports`, `bin`, `type`, `scripts`, `devDependencies` are unchanged per D-69 — all already correct, read directly from the current file this session.)

### Release workflow skeleton (PKG-05, D-76, D-77)

```yaml
# Source: docs.npmjs.com/generating-provenance-statements (permissions block, fetched
# live this session) + GitHub Actions workflow_dispatch choice-input syntax
# (docs.github.com, cross-checked search this session).
name: Release

on:
  workflow_dispatch:
    inputs:
      mode:
        description: 'publish (new version) or promote (existing next -> latest)'
        required: true
        type: choice
        options:
          - publish
          - promote
        default: publish
      dist-tag:
        description: 'dist-tag for a publish run (ignored for promote)'
        required: false
        type: choice
        options:
          - next
          - latest
        default: next

permissions:
  contents: read
  id-token: write   # required for provenance attestation (OIDC to Sigstore)

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: '24'
          registry-url: 'https://registry.npmjs.org'
      - if: inputs.mode == 'publish'
        run: npm ci
      - if: inputs.mode == 'publish'
        run: npm run lint
      - if: inputs.mode == 'publish'
        run: npm run typecheck
      - if: inputs.mode == 'publish'
        run: npx playwright install --with-deps chromium
      - if: inputs.mode == 'publish'
        run: npm test
      - if: inputs.mode == 'publish'
        run: npm run test:pack
      - if: inputs.mode == 'publish'
        run: npm publish --tag ${{ inputs.dist-tag }} --provenance --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
      - if: inputs.mode == 'promote'
        run: npm dist-tag add @falkensmage/sigil-spinner@${{ github.event.inputs.version || '1.0.0' }} latest
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Notes on this skeleton (not prescriptive on exact structure — Claude's Discretion per `06-CONTEXT.md`):
- The `if: inputs.mode == 'publish'` gating on every quality-gate step is one way to keep "promote" from re-running the whole suite in the same workflow file, per D-76's requirement that both modes live in one workflow without promote re-running publish. A `needs:`-based two-job structure with a mode-check gate job is an equally valid alternative — this is exactly the kind of workflow-hardening detail left to Claude's Discretion.
- `actions/checkout@v6` and `actions/setup-node@v6` version tags should be confirmed against the actions marketplace at plan/implementation time — this research surfaced `v5`/`v6` as current in web search results during this session but pinning exact SHAs (not just major tags) is a workflow-hardening decision explicitly left to Claude's Discretion.
- `node-version: '24'` matches this repo's own STACK.md framing of Node 24 as "current Active LTS as of Aug 2026." `engines.node` in `package.json` is `>=20.0.0` (read live this session) — either 22 or 24 satisfies it; 24 is recommended for parity with the researched STACK.md guidance already in this repo.

### `vitest.config.js` exclusion (PKG-03, D-71)

Current file (read in full this session, 8 lines):
```js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.js'],
  },
});
```

Target — add an `exclude` entry (Vitest's own `exclude` config option, confirmed via `vitest.dev/config/exclude` this session):
```js
import { defineConfig, configDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.js'],
    exclude: [...configDefaults.exclude, 'test/pack-install.test.js'],
  },
});
```
Plus a `package.json` script addition (mirroring the existing `test:browser` convention — read live this session, `"test:browser": "vitest run test/browser"`):
```json
"test:pack": "vitest run test/pack-install.test.js"
```
Running `vitest run test/pack-install.test.js` directly targets a file even though it's globally excluded — Vitest's CLI file-path arguments are resolved independently of the `exclude` config's effect on the default (argument-less) run. (This specific interaction — an explicit CLI target overriding a config-level `exclude` — is standard Vitest behavior consistent with how `include`/`exclude` are documented to interact with CLI filters, but was not independently re-verified against a worked example this session; flagged in Assumptions Log.)

### Smoke test skeleton (PKG-03, D-70, D-72, D-73)

```js
// Source: pattern from test/e2e/phase2-tracer.test.js (read live this session,
// lines 1-20) — same execFileSync-against-an-absolute-path shape, pointed at
// a scratch install instead of the repo tree.
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { describe, expect, it } from 'vitest';

// D-72: entry points declared as data, not procedure.
const ENTRY_POINTS = [
  { subpath: '.', namedExports: ['generateSigil', 'SigilError',
      'E_EMPTY_SEQUENCE', 'E_UNKNOWN_PLANET', 'E_MISSING_STATEMENT',
      'E_MISSING_PLANET', 'E_INVALID_OPTION'] },
  // Phase 7 adds: { subpath: './element', namedExports: [...] }
];

describe('pack-and-scratch-install smoke test (PKG-03)', () => {
  it('npm pack --dry-run manifest includes LICENSE and no unintended files', () => {
    const result = execFileSync('npm', ['pack', '--dry-run', '--json'], { encoding: 'utf-8' });
    // npm 12+ --json output is an object keyed by package name (not an array) —
    // confirmed via search this session (npm/expo#48091); read defensively.
  });

  it('installs a real tarball into a scratch dir and resolves exports/bin/output', () => {
    const scratchDir = mkdtempSync(path.join(os.tmpdir(), 'sigil-spinner-pack-'));
    // npm pack --pack-destination <scratchDir>  (real tarball)
    // npm install <abs tarball path> --no-audit --no-fund --ignore-scripts
    // execFileSync a .mjs probe file for the import/exports assertion (Pattern 1)
    // execFileSync node_modules/.bin/sigil-spinner (portable across POSIX; see Q2 Windows note)
    // on success: rmSync(scratchDir, { recursive: true, force: true });  (D-73)
    // on failure: leave scratchDir in place, throw with its path in the message
  });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| Classic npm tokens (`npm token create --type=automation`, "Automation"/"Publish"/"Read-only" types) | Granular Access Tokens (GATs) only, created via npmjs.com UI, with an optional "Bypass 2FA for publishing" checkbox | Classic tokens permanently revoked December 9, 2025 (`github.blog` changelog, cross-checked) | Any documentation, including this project's own roadmap/REQUIREMENTS.md, that says "automation token" needs to be read as "GAT with bypass-2FA" |
| Long-lived CI publish tokens as the default automation pattern | npm Trusted Publishing (OIDC), GA as of a 2025-07-31 GitHub changelog | Rolled out through 2025–2026; bypass-2FA token direct-publish sunset scheduled ~January 2027 | New packages still must bootstrap with a token (OIDC can't configure against a nonexistent package), but every subsequent publish should move to OIDC as soon as possible |
| Assuming a stored write token works indefinitely once created | npm actively restricting bypass-2FA token capability on a phased 2026–2027 timeline (account/package actions restricted "early August 2026"; direct publish restricted "around January 2027") | In progress, live during this exact research session | The plan should not treat `NPM_TOKEN` as "set once, forget" — note the OIDC-upgrade follow-on explicitly |

**Deprecated/outdated:**
- Classic npm access tokens (including the "Automation" type the roadmap's wording references) — replaced by Granular Access Tokens.
- Treating `npm link` as an acceptable substitute for a real install-from-tarball smoke test — already correctly disqualified by D-70/the roadmap; PITFALLS.md Pitfall 4 explains why (it symlinks the working tree, bypassing `exports` resolution entirely).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|----------------|
| A1 | Vitest's CLI file-path argument (`vitest run test/pack-install.test.js`) overrides a config-level `exclude` entry for that same file | Code Examples § vitest.config.js exclusion | If wrong, `npm run test:pack` would run zero tests (silently "passing" with nothing exercised) — the plan should add a trivial assertion (e.g., a deliberately-failing placeholder run during development) to confirm the script actually executes the file before relying on it as a release gate |
| A2 | `actions/checkout@v6` and `actions/setup-node@v6` are current major versions worth pinning as of this research window | Code Examples § Release workflow skeleton | Low risk — pinning a slightly stale major still works; verify against the GitHub Marketplace listing at plan/implementation time rather than trusting this document's version numbers, since action majors bump independently of this research |
| A3 | GAT write-token expiration is capped at a maximum (search-synthesized figure: "90 days"), requiring periodic rotation | Summary, Pitfall B | If the actual ceiling differs, the rotation cadence assumption in any human-gate documentation could be wrong; this was not confirmed via a direct fetch of `docs.npmjs.com/creating-and-viewing-access-tokens`'s expiration-options section (that fetch returned token-type information but not the exact expiration ceiling) — the human executing the token-creation step should read the actual expiration dropdown live, not rely on this figure |
| A4 | The exact npm 12+ `npm pack --dry-run --json` output shape (object keyed by package name, `files: [{ path }]`) matches what this repo's pinned npm version (11.4.2, confirmed live) actually produces | Code Examples § Smoke test skeleton, Q2 | The cited GitHub issue (`expo/expo#48091`) describes the npm 12.x change; this repo currently has npm 11.4.2 installed (confirmed live via `npm --version`) — the plan's implementation step should print and inspect real `npm pack --dry-run --json` output from this exact environment before writing the manifest assertion, rather than trusting the shape described here |

**If this table is empty:** N/A — four items above need confirmation at plan/implementation time via direct inspection rather than further research-phase web search, since they are all "run the actual command in this actual environment and read its actual output" checks cheaper than another doc fetch.

## Open Questions

1. **Should Phase 6 (or an immediate fast-follow) configure OIDC Trusted Publishing on `@falkensmage/sigil-spinner` right after `1.0.0` promotes to `latest`?**
   - What we know: OIDC cannot bootstrap the first publish (confirmed live). Token-based direct publish works today but has a real, npm-stated deprecation trajectory landing around January 2027.
   - What's unclear: whether this falls inside Phase 6's own scope (a same-phase "and now configure trusted publishing" plan) or is better left as a distinct, later piece of work once the package has a real publish history to point the trusted-publisher UI at.
   - Recommendation: keep it out of Phase 6's success criteria (none of the five criteria require it), but record it explicitly as a near-term todo in STATE.md so it doesn't silently fall off — this is exactly the kind of "the system should remember, not re-discover" item Design Principle 8 exists for.

2. **Exact GAT write-token expiration ceiling and rotation cadence.**
   - What we know: npm's docs describe an optional expiration setting on Granular Access Tokens generally; search results (not a direct docs fetch) surface a "90 days maximum for write tokens" figure.
   - What's unclear: whether that ceiling is still accurate as of this exact week, given npm's active token-policy changes described in State of the Art above.
   - Recommendation: the human-gate task should read the live expiration options in npmjs.com's token-creation UI at the moment of creating `NPM_TOKEN`, and whoever executes it should note the chosen expiration in STATE.md or the phase's own notes so the eventual rotation isn't a surprise.

3. **Exact current `actions/checkout` / `actions/setup-node` major versions and whether to pin to a commit SHA.**
   - What we know: v5/v6-era tags appeared across this session's search results for both actions.
   - What's unclear: the precise latest major as of implementation time, and whether this project's security posture (already ASVS-aware per `security_enforcement: true` in config) wants SHA-pinning over tag-pinning for supply-chain hygiene on the one workflow with registry-write credentials.
   - Recommendation: confirm at implementation time via the GitHub Marketplace; SHA-pinning is a reasonable hardening step explicitly left to Claude's Discretion in `06-CONTEXT.md`.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|--------------|-----------|---------|----------|
| `npm` CLI | PKG-01, PKG-03, PKG-05 | Yes | `11.4.2` (confirmed live, `npm --version`) | — |
| `node` runtime | All of Phase 6 | Yes | `v24.4.1` (confirmed live, `node --version`) | — |
| `git` remote configured | D-67 (`repository.url` derivation) | Yes | `git@github.com:mstine/sigil-spinner.git` (confirmed live, `git remote -v`) | — |
| `.github/workflows/` directory | PKG-05 | No — does not exist yet | — | Created by this phase; not a blocker, just confirms this is genuinely new surface |
| `package-lock.json` | `npm ci` in the release workflow (D-77) | Yes | present at repo root (confirmed via `ls`) | — |
| npm account with 2FA / `@falkensmage` scope ownership | PKG-01, PKG-05 human gate | Not verifiable from this session — requires npmjs.com login | — | Human gate: confirm `npm whoami` resolves to the scope owner before the first real publish attempt (per PITFALLS.md Pitfall 1) |
| npm Trusted Publisher configuration | PKG-05 (deferred) | No — cannot be configured pre-publish (confirmed live) | — | Token-based publish for `1.0.0`; configure OIDC as a fast-follow (see Open Questions #1) |

**Missing dependencies with no fallback:** None — every gap above has a documented fallback or is expected new-this-phase surface.

**Missing dependencies with fallback:** `.github/workflows/` (created by this phase); Trusted Publisher config (deferred to post-1.0.0, per D-74's own built-in fallback).

## Security Domain

`security_enforcement: true`, `security_asvs_level: 1` per `.planning/config.json` (read live this session).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|----------------|---------|-------------------|
| V2 Authentication | Yes — narrowly | The `NPM_TOKEN` GitHub Actions secret is the authentication credential for a highly privileged action (registry write to a public package). Standard control: GAT scoped to minimum necessary access (write on `@falkensmage` scope, not full account), bypass-2FA checked only because CI cannot supply an interactive OTP, expiration set to the shortest practical window and rotated on that cadence |
| V3 Session Management | No | Not applicable — no user sessions in this phase's surface |
| V4 Access Control | Yes — narrowly | `publishConfig.access: "public"` is itself an access-control declaration (Pitfall 1); `workflow_dispatch`-only trigger (D-76) restricts who can invoke the publish action to repo collaborators with workflow-dispatch permission, rather than any push event |
| V5 Input Validation | No | Not applicable — this phase adds no new user-facing input surface (metadata fields and a CI workflow are not attacker-reachable inputs) |
| V6 Cryptography | Yes — indirectly | npm provenance attestation *is* a cryptographic mechanism (Sigstore-backed OIDC signing) — but this phase consumes it via `--provenance` rather than implementing any cryptography itself; no hand-rolled crypto anywhere in scope |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|-----------------------|
| Compromised CI secret used to publish a malicious version under a trusted package name | Spoofing / Tampering | Scope the GAT narrowly (single scope/package, write-only, no account-management rights); rotate before expiration; the "Mini Shai-Hulud" incident cited in this session's live research (a single compromised npm token pushing 639 malicious versions across 323 packages in 22 minutes) is npm's own stated motivation for the entire 2026–2027 token-restriction rollout described in State of the Art |
| Provenance attestation spoofing / mismatch exploited to make a malicious build look attested | Spoofing | `repository.url` case-sensitive match (Pitfall C) is itself part of what makes the attestation trustworthy — a mismatch fails loudly (422) rather than silently passing, which is the correct failure mode |
| Workflow secret exfiltration via a compromised or malicious step (e.g., a third-party action) | Information Disclosure | This phase's workflow uses only first-party GitHub actions (`checkout`, `setup-node`) plus direct `npm`/`npx` CLI calls — no third-party marketplace actions in the publish path, minimizing supply-chain exposure to the credential |
| Unintended publish trigger (e.g., accidental push to a branch triggering a release) | Elevation of Privilege | D-76's `workflow_dispatch`-only trigger (explicitly rejecting a `push: tags: v*` trigger for this phase) already closes this — a human must deliberately invoke the workflow |

## Sources

### Primary (HIGH confidence) — fetched live this session

- [Trusted publishing for npm packages — npm Docs](https://docs.npmjs.com/trusted-publishers/) — confirms trusted publisher configuration requires an existing package
- [Generating provenance statements — npm Docs](https://docs.npmjs.com/generating-provenance-statements/) — permissions block, CLI version floor, `repository.url` case-sensitive matching requirement
- [Unpublish policy — npm Docs](https://docs.npmjs.com/policies/unpublish/) — 72h window, 24h name lock, permanent version non-reuse (verbatim quotes captured)
- [npm-pack CLI docs — npm Docs](https://docs.npmjs.com/cli/v11/commands/npm-pack/) — `--dry-run`, `--json`, `--pack-destination`, tarball naming
- [npm-dist-tag CLI docs — npm Docs](https://docs.npmjs.com/cli/v11/commands/npm-dist-tag/) — confirms `dist-tag add` is metadata-only, no republish
- [Viewing package provenance — npm Docs](https://docs.npmjs.com/viewing-package-provenance/) — `npm audit signatures`, npm page provenance badge details
- [Creating and viewing access tokens — npm Docs](https://docs.npmjs.com/creating-and-viewing-access-tokens/) — GAT-only token model, bypass-2FA checkbox
- [Requiring 2FA for package publishing and settings modification — npm Docs](https://docs.npmjs.com/requiring-2fa-for-package-publishing-and-settings-modification/) — "As of August 2026, bypass-2FA tokens cannot be used for account-identity or account-governance actions" (verbatim)
- [Node.js Packages docs](https://nodejs.org/api/packages.html) — `.mjs` unconditional-ESM rule, `ERR_PACKAGE_PATH_NOT_EXPORTED` behavior
- This repo's own `package.json`, `src/index.js`, `bin/sigil-spinner.js`, `README.md`, `vitest.config.js`, `test/e2e/phase2-tracer.test.js`, `.planning/config.json` — read directly this session, not inferred

### Secondary (MEDIUM confidence) — web search, cross-checked across multiple independent results

- npm classic token revocation (December 2025) and GAT-only token model — cross-checked across `github.blog` changelog, InfoWorld, and community discussion threads
- Bypass-2FA token direct-publish sunset (~January 2027) and "Mini Shai-Hulud" incident context — `github.blog/changelog/2026-07-08-npm-install-time-security-and-gat-bypass2fa-deprecation`, cross-checked
- `actions/setup-node` `registry-url`/`NODE_AUTH_TOKEN` wiring pattern — cross-checked across `docs.github.com`, `actions/setup-node` GitHub repo, and independent tutorials
- `npx playwright install --with-deps chromium` on `ubuntu-latest`, caching pattern — cross-checked across Playwright's own GitHub issues and multiple CI-caching writeups
- Vitest `exclude` config option and `configDefaults.exclude` pattern — `vitest.dev/config/exclude` referenced in search results (not independently WebFetch'd this session)
- `npm pack --dry-run --json` output shape change in npm 12.x (object keyed by package name) — `github.com/expo/expo#48091`, not independently reproduced against this repo's npm 11.4.2 this session (flagged in Assumptions Log A4)

### Tertiary (LOW confidence) — search-only, flagged for validation at plan/implementation time

- GAT write-token 90-day expiration ceiling (Assumption A3) — search-synthesized, not confirmed via direct docs fetch
- Exact current major versions of `actions/checkout`/`actions/setup-node` (Assumption A2)

## Metadata

**Confidence breakdown:**
- Q1 (Trusted Publishing bootstrap determination): HIGH — directly fetched and quoted from `docs.npmjs.com/trusted-publishers` and cross-checked against two independent third-party writeups, neither of which contradicts the docs
- Q2 (pack/scratch-install mechanics): MEDIUM-HIGH — core mechanics (pack, dry-run, tarball naming, `.mjs` ESM rule) verified live; the exact `npm pack --json` schema for this repo's specific npm version (11.4.2) was not directly reproduced this session and should be confirmed at implementation time
- Q3 (release workflow): MEDIUM — permissions/CLI-version requirements verified live against npm docs; the GitHub Actions YAML shape itself is a well-established, widely cross-checked pattern but was assembled from search results rather than a single canonical GitHub Actions doc fetch
- Q4 (verification/irreversibility): HIGH — unpublish policy and provenance-viewing mechanics both fetched live with verbatim quotes
- The token-model finding (State of the Art, Pitfalls A/B): HIGH for the fact of classic-token revocation and GAT-only model (multiple independent confirmations including a direct docs fetch); MEDIUM for the exact expiration-ceiling figure (search-only)

**Research date:** 2026-08-08
**Valid until:** Treat the token-policy findings (State of the Art, Pitfalls A/B) as valid for **7 days only** — npm's own stated rollout is actively in motion this exact month ("early August 2026"), and re-checking `docs.npmjs.com/requiring-2fa-for-package-publishing-and-settings-modification` immediately before executing the human gate is cheap insurance against a policy change landing between this research and plan execution. All other findings (unpublish policy, provenance mechanics, `.mjs` ESM rule, `dist-tag` semantics) are stable npm/Node platform behavior — treat as valid for 30 days.
