---
phase: 06
slug: published-package
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
block_on: high
created: 2026-08-09
audit_type: retroactive
register_authored_at_plan_time: true
---

# Phase 06 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

**Audit type:** retroactive. Phase 6 executed and closed without a `/gsd-secure-phase` pass, despite `workflow.security_enforcement: true` and an active `verify:post` step hook. The gap was surfaced by the v1.1 milestone audit and closed here. The threat register itself *was* authored at plan time across all four plans — what was missing was verification of it, not the modelling.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| dispatcher → workflow job | A `workflow_dispatch` caller supplies inputs that reach a job holding a registry-write credential | Dispatch inputs (`mode`, `dist_tag`) — untrusted by type, closed by construction |
| GitHub Actions secret → npm registry | `secrets.NPM_TOKEN` authorizes a permanent public write under the `@falkensmage` scope | Publish credential — high sensitivity |
| third-party action → job environment | Any action in this job shares the environment with `NODE_AUTH_TOKEN` and the OIDC `id-token` grant | Credential + OIDC claims |
| repo working tree → public tarball | `npm pack` decides what leaves the machine, permanently, per version | Source, metadata, license |
| repo → npm provenance check (Sigstore) | `repository.url` is compared case-sensitively against the workflow's own repo; it gates whether an attestation can be minted | Repository identity |
| npm registry → every future consumer | Whatever `1.0.0` contains is what every install of that version gets, forever | Published artifact |
| `latest` dist-tag → every future consumer | The tag a bare `npm install` resolves to, for everyone | Version pointer |
| local machine → npm registry | The one boundary D-74 explicitly refuses to cross for a real write | (refused) |

---

## Threat Register

20 threats, deduplicated across the four plans' `<threat_model>` blocks (`T-06-02` appears in 06-02 and 06-04; `T-06-SC` in all four).

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-06-01 | Elevation of Privilege | `release.yml` trigger surface | high | mitigate | `workflow_dispatch` only (D-76) — no `push`, tag, `schedule`, or `pull_request_target`, so no event a non-collaborator can cause reaches the credential | closed |
| T-06-02 | Tampering | dispatch input reaching a `run:` command in the token-holding job | high | mitigate | **Fixed in this audit.** `dist_tag` now reaches the shell via `env: DIST_TAG` instead of `${{ }}` substitution into the `run:` line, behind a `case next\|latest` allowlist that exits 1 on anything else | closed |
| T-06-03 | Information Disclosure | third-party actions sharing a job with `id-token: write` + `NODE_AUTH_TOKEN` | high | mitigate | Only `actions/checkout` and `actions/setup-node`, both first-party, both pinned to full 40-char commit SHAs. `NPM_TOKEN` appears only in step-level `env:` blocks, never job- or workflow-level. `setup-node`'s `registry-url` writes `.npmrc` rather than a hand-rolled echo that could leak the token into logs | closed |
| T-06-04 | Spoofing | `package.json` `repository.url` | high | mitigate | `git+https://github.com/mstine/sigil-spinner.git` — byte-exact and case-exact against both the live git remote and the registry packument. A mis-cased value fails attestation with a Sigstore 422, after the version is permanent | closed |
| T-06-05 | Information Disclosure | `author`, `bugs.url`, `LICENSE` | medium | mitigate | `author` is name plus public GitHub URL, no email (D-68). Regex sweep of `package.json` and `LICENSE` finds no contact address | closed |
| T-06-06 | Repudiation | `LICENSE` vs `package.json` `license` | medium | mitigate | Both MIT and in agreement; `LICENSE` confirmed present in the real published tarball | closed |
| T-06-07 | Tampering | `publishConfig.access` | high | mitigate | `public` in the manifest (belt) **and** `--access public` on the publish command (suspenders). npm defaults scoped packages to private, and PITFALLS.md § Pitfall 1 records tooling honoring the flag while ignoring the manifest key on a first publish | closed |
| T-06-08 | Tampering | tarball contents | high | mitigate | `test/pack-install.test.js` asserts a required-subset manifest **and** a prefix allowlist. The real published tarball was inspected: 18 files, all within `src/`, `bin/`, or three named root files; no `.planning/` content | closed |
| T-06-09 | Spoofing | provenance attestation | high | mitigate | `id-token: write` + `--provenance` on a public repo mints a Sigstore attestation from the run's OIDC claims. Verified live: `npm audit signatures` reports a verified attestation; `predicateType` is `https://slsa.dev/provenance/v1` | closed |
| T-06-10 | Denial of Service | concurrent dispatches racing the registry | low | mitigate | `concurrency: {group: release, cancel-in-progress: false}` — runs serialize, and a publish in flight is never cancelled mid-write | closed |
| T-06-11 | Spoofing | `NPM_TOKEN` scope and lifetime | high | **accept** | Mitigation **not evidenced** — see Accepted Risks R-06-02. Retirement path tracked at [issue #1](https://github.com/mstine/sigil-spinner/issues/1) | closed — accepted risk |
| T-06-12 | Information Disclosure | token handling during the human gate | high | mitigate | No task in any plan reads or prints the secret; creation was browser-side and storage went through the GitHub secrets UI / `gh secret set` interactive prompt | closed |
| T-06-13 | Tampering | the published `1.0.0` artifact | high | mitigate | Built and published by the workflow from the reviewed commit, not uploaded from a laptop. `gh run list` shows exactly one `release.yml` run (`31321177328`, `workflow_dispatch`, `success`); packument `gitHead` is `c360ba4`, matching the reviewed commit | closed |
| T-06-14 | Repudiation | an un-attested `1.0.0` | high | mitigate | D-74's ordering exists so `1.0.0` is attested from its first byte; attestation verified live from a fresh scratch install | closed |
| T-06-15 | Elevation of Privilege | premature `latest` assignment | high | **accept** *(was `mitigate`)* | Mitigation **failed** — see Accepted Risks R-06-01. Forward risk is separately covered by T-06-17's new guard | closed — accepted risk |
| T-06-16 | Tampering | the artifact behind `latest` | high | mitigate | `dist.shasum` `e1e3cc4cd676d8e38dd47bec2968bc213f4e34fd` byte-identical before and after the (non-)promote; publish timestamp unchanged | closed |
| T-06-17 | Elevation of Privilege | promoting an unreviewed or superseded artifact | high | mitigate | **Fixed in this audit.** The plan-time `checkpoint:decision` was honored but expired with its plan, leaving the durable capability uncontrolled. The promote step now asserts the manifest version equals the registry's current `next` and exits 1 on mismatch or on a missing `next` tag | closed |
| T-06-18 | Repudiation | attestation lost or invalidated by the promote | high | mitigate | `npm dist-tag add` is metadata-only per npm's CLI documentation; attestation re-verified from a bare install after the (non-)promote rather than trusting that documentation | closed |
| T-06-19 | Denial of Service | a promote racing a publish | low | mitigate | Same `concurrency` group serializes the two modes | closed |
| T-06-SC | Tampering | package-manager installs | low | accept | No third-party install surface — see Accepted Risks R-06-03 | closed — accepted risk |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above `workflow.security_block_on` count toward `threats_open`*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| R-06-01 | T-06-15 | The registry auto-seeded `latest` at first publish despite `--tag next`, so the planned review window between `next` and `latest` never existed for `1.0.0`. Matt reviewed all three remedies — accept, `dist-tag rm latest`, or unpublish-and-redo — and chose accept: removing `latest` would break ROADMAP success criteria 1 and 2, the publish ladder is a process safeguard rather than a success criterion, and the verification it was meant to protect happened in substance. Full reasoning at `06-RELEASE-LOG.md:177-194`. **Residual, not covered by this acceptance:** the auto-seed is first-publish-only, so a second publish with `--tag next` leaves `latest` pinned to the older version — a different failure mode, addressed by T-06-17's guard and the forward-risk note below | Matt | 2026-08-09 |
| R-06-02 | T-06-11 | All three mitigation clauses are unevidenced and two are unverifiable from the repo. Token scope is asserted in plan prose only (`06-03-PLAN.md:176-183`); the expiration is explicitly recorded as **unknown** (`06-RELEASE-LOG.md:224-228`, restated unresolved at `:301`); and "narrow it to the single package after 06-04" dropped out of the follow-on list entirely. Accepted rather than mitigated because the remaining work requires a browser session on npmjs.com — the credential's real scope and expiry are not observable from here, and the token's value must never be read. **This is a carried risk, not a fix.** What changed in this audit is that it now has an owner, a written retirement path, and an outside deadline: [issue #1](https://github.com/mstine/sigil-spinner/issues/1), bounded by npm's stated ~January 2027 removal of direct-publish capability for 2FA-bypassing credentials. Blast radius if the credential leaks is a malicious publish under the `@falkensmage` scope; the compensating controls are that the only job holding it is `workflow_dispatch`-only and the repo has exactly one collaborator | Claude (gsd-security-auditor), pending Matt's confirmation on scope/expiry | 2026-08-09 |
| R-06-03 | T-06-SC | No package-manager supply-chain surface exists to audit. `dependencies` is empty and no `devDependencies` entry was added by this phase; the only installs performed are of this project's own tarball into disposable scratch directories. Recorded as not-applicable in `06-RESEARCH.md` § Package Legitimacy Audit rather than skipped silently | Plan-time (06-01 through 06-04) | 2026-08-08 |

---

## Mitigations Applied During This Audit

Both are workflow-file-only. No version bump, no `package.json` change, no effect on the published `1.0.0`.

### T-06-02 — dispatch input no longer reaches a shell line by substitution

`${{ inputs.dist_tag }}` was substituted textually into the `run:` line of the only job holding `NPM_TOKEN`. The plan-time mitigation argued no free text can exist because the input is `type: choice` — but that rests on platform behavior that is undocumented for the REST/`gh` dispatch path, with no in-repo second line of defense, in a workflow that is otherwise deliberately belt-and-suspenders.

The input now arrives through `env: DIST_TAG` and is checked against a `case next|latest` allowlist that exits 1 on anything else.

Proven behaviorally: `next` → allowed, `latest` → allowed, `evil; curl x` → blocked, empty string → blocked.

**No privilege boundary was crossed in practice.** `gh api repos/.../collaborators` returns exactly one principal (`mstine`, admin), `main` is unprotected, and anyone able to dispatch could already edit `release.yml` directly. This is defense-in-depth against a future second collaborator or a compromised session, not the closure of a live exploit.

### T-06-17 — the promote path can no longer demote `latest`

`npm dist-tag add "${PKG_NAME}@${PKG_VERSION}" latest` assigned `latest` to whatever version the dispatched ref's manifest happened to hold. Against a stale ref — an unmerged version bump, an out-of-date `main`, a release branch — that silently pins the default install target to a superseded version and **exits 0, so the run looks green.**

The step now reads the registry's current `next` and refuses to proceed unless the manifest version matches it, with a distinct error for a missing `next` tag.

Proven behaviorally: manifest `1.1.0` vs next `1.1.0` → allowed; manifest `1.0.0` vs next `1.1.0` → **blocked** (the exact stale-`main` scenario); no `next` tag → blocked.

The plan-time control was a `checkpoint:decision` — real, and honored at the time, but a planning artifact that expired with its plan. This is the durable form of the same constraint.

---

## Audit Findings Beyond the Register

**The executor threat-flag channel was empty for all four plans.** No `## Threat Flags` section exists in any of `06-01-SUMMARY.md` through `06-04-SUMMARY.md`. This phase stood up a CI job holding a registry-write credential and performed an irreversible public publish; both real gaps found here (the `dist_tag` interpolation and the unguarded promote) reached this audit through `06-REVIEW.md`, not through the channel designed to surface new attack surface. The v1.1 milestone audit named the same pattern independently — "caught by adjacent processes doing security's job part-time."

**Not folded into this audit, flagged for visibility:** `06-REVIEW.md`'s IN-02 (no `timeout-minutes` on the release job) is arguably adjacent to T-06-10/T-06-19 — a hung job holds the credential and blocks the concurrency group indefinitely — but it is not in the register, and expanding scope mid-audit is how registers stop meaning anything. Worth a one-line fix in a later pass.

---

## Forward Risk — the 1.1.0 release through this same workflow

Recorded here because the v1.1 milestone audit names publishing `1.1.0` as the milestone-close action, so these are live, not retrospective.

1. **The auto-`latest` quirk will not recur, which is the problem.** The registry seeds `latest` only when there is none to preserve. Publishing `1.1.0` with `--tag next` leaves `next → 1.1.0` and `latest → 1.0.0`, so every bare `npm install` keeps resolving to `1.0.0` — whose published `exports` is `{".": "./src/index.js"}`, with no `./element` subpath. **Phase 7's element surface stays invisible to default consumers until a promote runs.** R-06-01's acceptance does not cover this; it covered a first-publish artifact, not the `1.1.0` tagging path.
2. **The promote path will execute for the first time ever.** It has never been dispatched — 06-04's promote was a documented no-op. T-06-17's new guard is what stands between a stale ref and a silent demotion, and it has never run in CI.
3. **`dist_tag: latest` remains one dropdown selection away.** The choice list still offers it, and selecting it publishes straight onto the default install path with no review window. In 06-03 the correct value was chosen by hand and the registry overrode it anyway; for `1.1.0` the selection actually determines the outcome. This is deliberate — the ladder is a process discipline, not a mechanical lock — but it is worth naming before the dispatch.

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Accepted | Open | Run By |
|------------|---------------|--------|----------|------|--------|
| 2026-08-09 | 20 | 17 | 3 | 0 | Claude (gsd-security-auditor, retroactive State B) |

Audit sequence: preliminary grep-depth classification closed 16 of 20 and referred 4 high-severity threats for verification. The auditor returned `OPEN_THREATS` with 3 open (T-06-02, T-06-11, T-06-17) and 1 reclassified `mitigate` → `accept` (T-06-15). T-06-02 and T-06-17 were then fixed in `release.yml` with behavioral proof of both guards; T-06-11 was accepted with a tracked retirement path.

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-08-09

**Outstanding for Matt, not blocking:** R-06-02 records the credential's scope and expiration as unverified. Confirming both on npmjs.com — and narrowing the token to this single package — closes the substance of T-06-11 rather than carrying it. Tracked at [issue #1](https://github.com/mstine/sigil-spinner/issues/1).
