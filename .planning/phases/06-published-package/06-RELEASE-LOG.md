# Release Log — @falkensmage/sigil-spinner@1.0.0

Live evidence for the irreversible rungs of plan 06-03. This is the record 06-04 re-reads
to prove its promote step did not republish anything.

## Summary

| Field | Value |
|---|---|
| Package | `@falkensmage/sigil-spinner` |
| Version | `1.0.0` |
| Published by | GitHub Actions workflow `.github/workflows/release.yml`, run [31321177328](https://github.com/mstine/sigil-spinner/actions/runs/31321177328) |
| Run conclusion | `success` — all six D-77 gates green, in order |
| Dispatch inputs | `mode=publish`, `dist_tag=next` |
| Publish timestamp (registry) | `2026-08-09T15:28:50.078Z` (npm `time` field for `1.0.0`) |
| gitHead embedded in published manifest | `c360ba4855e23dd06a27674cd8c31389b6323eb2` — matches the reviewed commit exactly |
| dist-tags at close of this plan | `next: 1.0.0`, `latest: 1.0.0` (see "First-publish `latest` finding" below) |
| Published shasum | `e1e3cc4cd676d8e38dd47bec2968bc213f4e34fd` |
| Published integrity | `sha512-RafivM/zi8thxUJhgyupgtUN0dYtDw5wfHY8ir3zARKmlSBckG5KBPUDTmr3uiS9o6D3J5H/W652Hw/s0akHUg==` |
| Sigstore transparency log | index `2395887803` — https://search.sigstore.dev/?logIndex=2395887803 |
| Attestation status | **Verified on all three legs** — `npm audit signatures` cryptographic check, packument `dist.attestations.provenance` predicate, and the rendered npmjs.com provenance panel (Matt, by eye) |
| npm provenance page panel | **Verified** — Matt opened `https://www.npmjs.com/package/@falkensmage/sigil-spinner` and confirmed the panel; see "Provenance panel — human-check closed" below |

## Rung 3 — `npm publish --dry-run --access public` (Task 2, real registry, read not just exit-checked)

Run against the real registry, logged in as `falkensmage` (`npm whoami` confirmed before running).

- Access line: `Publishing to https://registry.npmjs.org/ with tag latest and public access (dry-run)` — contains `public`, confirming `publishConfig.access` and the explicit `--access public` flag both took (belt-and-suspenders against Pitfall 1).
- Name/version: `@falkensmage/sigil-spinner@1.0.0` — exact match.
- Tarball: 18 files, 51.2 kB packed / 155.9 kB unpacked.
- **Dry-run shasum:** `8cf9f9d1381eaca988a162d78709e2c0ce3384b2`
- File list matched `npm pack --dry-run --json` exactly (byte-for-byte same 18 paths).
- One benign npm warning investigated and traced into npm's own `@npmcli/package-json/lib/normalize.js`: `"bin[sigil-spinner]" script name was cleaned` — npm stripping the leading `./` from `"./bin/sigil-spinner.js"`. Cosmetic, not a defect.
- `git remote get-url origin` normalized matched `package.json`'s `repository.url` case-exactly.
- `gh repo view mstine/sigil-spinner --json visibility` → `PUBLIC`.
- `npm run test:pack` → 1 file, 2 tests, passed.
- Pre-flight fix: `origin/main` was 45 commits behind local `main` (stale since before this phase). Pushed (`git push origin main`, fast-forward, no force) before the dry-run so the workflow's checkout target matched the reviewed tree. Confirmed after: `git rev-parse HEAD` == `git rev-parse origin/main` == `c360ba4855e23dd06a27674cd8c31389b6323eb2`.

## Rung 4 — the real publish (Task 4)

Dispatched: `gh workflow run release.yml --repo mstine/sigil-spinner --ref main -f mode=publish -f dist_tag=next`.

All six D-77 gate steps passed in order before Publish ran: Install dependencies → Lint → Typecheck →
Install Chromium for the browser suite → Test → Pack-and-scratch-install smoke test.

Publish step log (verbatim, key lines):
```
npm warn publish npm auto-corrected some errors in your package.json when publishing.
npm warn publish "bin[sigil-spinner]" script name bin/sigil-spinner.js was invalid and removed
npm notice 📦  @falkensmage/sigil-spinner@1.0.0
npm notice shasum: e1e3cc4cd676d8e38dd47bec2968bc213f4e34fd
npm notice integrity: sha512-RafivM/zi8thx[...]8h9U/c8si6fNw==
npm notice total files: 18
npm notice Publishing to https://registry.npmjs.org/ with tag next and public access
npm notice publish Signed provenance statement with source and build information from GitHub Actions
npm notice publish Provenance statement published to transparency log: https://search.sigstore.dev/?logIndex=2395887803
+ @falkensmage/sigil-spinner@1.0.0
```

**On the alarming CI warning wording:** the CI runner's npm (`11.16.0` on Node `24.18.0`) worded the
bin-path normalization differently than my local npm did during the dry-run ("was invalid and removed"
vs. "was cleaned") — different npm CLI versions producing different log text for the same underlying
cosmetic operation. I did not take the log text at face value; I fetched the live published manifest
directly and confirmed `bin` survived intact: `{"sigil-spinner": "bin/sigil-spinner.js"}`. `npx
sigil-spinner` from a fresh registry install (below) produces a real SVG, which is the actual proof
that mattered.

**"Promote to latest" step:** confirmed via `gh run view ... --json jobs` as `"conclusion":"skipped"` —
it never ran, correctly gated on `mode == 'promote'`, which was not the dispatch mode.

**Why the published shasum (`e1e3cc4cd676d8e38dd47bec2968bc213f4e34fd`) differs from the dry-run
shasum (`8cf9f9d1381eaca988a162d78709e2c0ce3384b2`):** these are two independent `npm pack`/publish
build events — one on my local machine, one on the GitHub Actions runner — and npm does not guarantee
byte-identical tarballs across separate pack invocations from the same source tree (tar header
metadata, npm CLI version differences, etc. can vary). This is expected and not a defect. The real
identity guarantee is the `gitHead` field embedded in the published manifest, which reads
`c360ba4855e23dd06a27674cd8c31389b6323eb2` — the exact commit that was reviewed at the Task 3
checkpoint and that `origin/main` pointed to when the workflow checked it out. **This is independently
confirmed, not just self-reported by the manifest:** the provenance attestation's own `Source Commit`
field (verified by Matt on the npmjs.com panel — see below) reads the identical `c360ba4`. Two
independent sources — npm's packument `gitHead` and Sigstore's signed attestation — agree on the same
commit. A future reader who notices the shasum mismatch should treat that agreement, not the shasum,
as the identity proof; the differing shasums are resolved and not worth re-investigating.

### Provenance panel — human-check closed

The plan reserved one check for a human's own eyes: whether the npmjs.com provenance panel actually
renders, since the executor had no browser tool available in this session. Matt opened
`https://www.npmjs.com/package/@falkensmage/sigil-spinner` directly and confirmed it, supplying a
screenshot read verbatim into this log:

- "Built and signed on **GitHub Actions**" with a green verified check
- **Source Commit:** `github.com/mstine/sigil-spinner@c360ba4`
- **Build File:** `.github/workflows/release.yml`
- **Public Ledger:** Transparency log entry (linked)

This establishes two things worth stating explicitly rather than just ticking a box:

1. **The attested Source Commit is `c360ba4` — the exact commit reviewed at the publish freeze**, and
   it is the answer to the shasum discrepancy above: the tarball shasum alone could not prove identity
   between the dry-run and the published artifact, but the attested source commit does, independently
   of the tarball's own `gitHead` field.
2. **The attestation names the exact build file** (`.github/workflows/release.yml`), so the workflow
   that produced the artifact is itself attested, not merely the source tree — closing the loop on
   T-06-13 (Tampering, the published artifact) from this plan's threat register.

PKG-05 / ROADMAP success criterion 4 is now verified on all three legs: `npm audit signatures`
(cryptographic), the packument `provenance` predicate (registry metadata), and the rendered panel with
correct source and build attribution (human-visible). No leg remains open.

## Task 5 — Live verification

**Registry propagation note:** the full packument (`GET /@falkensmage%2fsigil-spinner`) returned
404 for approximately 4 minutes after the publish completed, while the version-specific packument
(`GET /@falkensmage%2fsigil-spinner/1.0.0`) was already live and correct. `npm access list packages`
also confirmed `@falkensmage/sigil-spinner: read-write` on the account immediately. This was CDN
cache lag on the aggregate document, not a publish failure — confirmed by polling until the full
packument returned 200.

**`npm view @falkensmage/sigil-spinner@1.0.0`:**
- version: `1.0.0`
- license: `MIT`
- author: `Matt Stine (https://github.com/mstine)`
- repository.url: `git+https://github.com/mstine/sigil-spinner.git`
- dependencies: `{}` (empty — zero runtime dependencies)
- bin: `{"sigil-spinner": "bin/sigil-spinner.js"}`

**Attestation, verified three ways — all three legs now closed:**
1. `npm audit signatures` (clean scratch install) → *"1 package has a verified registry signature"* /
   *"1 package has a verified attestation"*.
2. The packument's `dist.attestations` field: `{"url": "https://registry.npmjs.org/-/npm/v1/attestations/@falkensmage%2fsigil-spinner@1.0.0", "provenance": {"predicateType": "https://slsa.dev/provenance/v1"}}`.
3. **The human-visible provenance panel on `https://www.npmjs.com/package/@falkensmage/sigil-spinner` — verified by Matt.** No browser tool was available in this executor session (only Bash/curl, which returned `HTTP 403` on the SPA page — expected, npm's package page is client-rendered and 403s bots), so this was left as an open `<human-check>` at first. Matt opened the page directly and supplied a screenshot, read verbatim:
   - "Built and signed on **GitHub Actions**" with a green verified check
   - **Source Commit:** `github.com/mstine/sigil-spinner@c360ba4`
   - **Build File:** `.github/workflows/release.yml`
   - **Public Ledger:** Transparency log entry (linked)

   See "Provenance panel — human-check closed" below for what this independently establishes.

**Fresh registry install, `@falkensmage/sigil-spinner@next`, throwaway scratch directory:**
- `npm install @falkensmage/sigil-spinner@next --no-audit --no-fund` → exit 0, "added 1 package".
- `npm ls --all --json` → exactly one dependency, no nested dependencies. Zero transitive runtime
  dependencies confirmed (ROADMAP success criterion 1).
- `import { generateSigil } from '@falkensmage/sigil-spinner'` resolved; `generateSigil('I WILL SUCCEED', 'saturn')` returned an object with `svg` (string, starts with `<svg`) and `working` (object) (ROADMAP success criterion 2, library half).
- `npx sigil-spinner "I WILL SUCCEED" --planet saturn` → exit 0, wrote a real `<svg ...>` document to stdout (ROADMAP success criterion 2, CLI half).

**Bare install (no tag) — second throwaway scratch directory:**
- `npm install @falkensmage/sigil-spinner` (no `@next`) → installed `1.0.0`. See "First-publish `latest` finding" below — this was expected to fail per the original plan text and did, for a reason outside the plan's control.

## First-publish `latest` behavior — first-class finding, not a footnote

**What the plan expected (D-74, D-75, Task 3, Task 5's must_haves):** dispatching with `dist_tag=next`
would leave `@falkensmage/sigil-spinner` published only under the `next` dist-tag, with `latest`
unassigned, so that a bare `npm install @falkensmage/sigil-spinner` would resolve to nothing until
plan 06-04's separate "promote" dispatch (`npm dist-tag add ... latest`) ran. That gap was meant to be
a live-infrastructure review window on an irreversible artifact — the phase's own stated rationale,
directly descended from the v1.0 lesson that real defects passed a green suite and were caught by a
human looking at output.

**What actually happened:** the npm registry assigned `latest` to `1.0.0` **at publish time**, despite
`--tag next` being passed and despite the workflow's "Promote to latest" step never running (confirmed
`"conclusion":"skipped"` in the run's job JSON — gated on `mode == 'promote'`, not satisfied by this
dispatch). `npm view @falkensmage/sigil-spinner dist-tags --json` reports `{"next": "1.0.0", "latest": "1.0.0"}`,
and `npm view @falkensmage/sigil-spinner versions --json` confirms `["1.0.0"]` is the only version ever
published — i.e. this is genuinely a first-ever publish for this package. This matches a long-documented
npm registry behavior: on a scoped package's very first published version, the registry seeds `latest`
to that version regardless of the `--tag` flag, because no prior `latest` exists to preserve. It is a
first-publish-only quirk.

**Why no rung before this one could have caught it:** `npm pack --dry-run` never contacts the registry
at all. `npm publish --dry-run` simulates the publish request but does not perform (or simulate) tag
assignment — dry-runs don't touch tag logic. `npm run test:pack` tests the tarball's installability, not
registry tag state. Only Task 5's "verify live" rung — install for real, then check the actual dist-tags
and attempt a genuinely bare install — could surface this, and it did. `06-RESEARCH.md`'s pitfall list
(Pitfalls 1–5) did not anticipate this specific first-publish tag-assignment behavior.

**Decision (Matt, explicit, after reviewing three options — accept / remove the `latest` tag /
unpublish-and-redo):** **accept.** Reasoning, recorded here because it is the substantive finding of
this plan:

- ROADMAP § Phase 6 success criterion 1 requires a **bare** `npm install @falkensmage/sigil-spinner`
  into a fresh project to succeed. A bare install resolves through `latest`. Removing the `latest` tag
  would leave the package with no `latest` at all and break success criteria 1 and 2 — the two criteria
  the phase exists to satisfy. npm has no client-side guard against `dist-tag rm latest`; the command
  would have gone through and done exactly that.
- The `--tag next` ladder (D-75, from `PITFALLS.md`) is a **process safeguard**, not itself a success
  criterion. Its purpose — verify the live artifact before consumers get it by default — has already
  been served in substance: the attestation verified two independent ways, both consumer surfaces
  confirmed from a genuinely fresh registry install, all metadata matched the frozen coordinates, and
  zero transitive dependencies were confirmed. The verification happened; it simply happened with
  `latest` already pointing at `1.0.0` rather than in the gap the ladder intended.
- Nothing found during verification warrants spending the `1.0.0` version number on a redo.

No dist-tag mutation was performed. `npm dist-tag rm` was explicitly withheld per this decision.

## Consequence for plan 06-04 — read this before executing that plan

**06-04's `dist-tag add @falkensmage/sigil-spinner@1.0.0 latest` action is now a no-op.** `latest`
already points at `1.0.0` as of this publish — running `npm dist-tag add` again will succeed trivially
(idempotent, harmless) but changes nothing. This is a **deviation from the plan as written, caused by
observed npm registry behavior, not by choice** — see the finding above.

**06-04's verification work still stands and still matters.** It should still prove:
- No republish occurred: shasum unchanged from `e1e3cc4cd676d8e38dd47bec2968bc213f4e34fd`, publish
  timestamp unchanged from `2026-08-09T15:28:50.078Z` (registry `time["1.0.0"]`).
- The provenance attestation survived: `npm audit signatures` still reports a verified attestation.

**Already closed by this plan, not carried forward as open work for 06-04:** the human-visible
provenance panel on `https://www.npmjs.com/package/@falkensmage/sigil-spinner` was verified by Matt
during this plan (see "Provenance panel — human-check closed" above) — Source Commit `c360ba4`, Build
File `.github/workflows/release.yml`, green verified check. 06-04 does not need to re-open this check;
it only needs to confirm the panel still reflects the same commit and hasn't changed, which the shasum
and timestamp checks above already cover indirectly.

## Dated follow-ons — do not let these fall off

1. **Configure npm Trusted Publishing (OIDC) on `@falkensmage/sigil-spinner` as a fast-follow, now
   possible for the first time.** It could not bootstrap this publish — a trusted publisher is
   configured from an existing package's settings page, and the package did not exist until this plan
   ran. It exists now, so this is newly unblocked. **Deadline pressure:** npm has stated that
   bypass-2FA tokens (the credential type used for this publish) lose direct-publish capability around
   January 2027. After OIDC is configured, `NPM_TOKEN` becomes the emergency fallback rather than the
   standing credential.
2. **`NPM_TOKEN` expiration date: unknown.** Matt was asked to record the expiration he selected when
   creating the Granular Access Token; he did not volunteer a date in this session, so it is recorded
   here as unknown rather than invented. Confirm and update this line before the token's actual
   expiration, since a silent expiry would fail the next release with an auth error rather than a
   scheduled rotation.

## Credential state at close of this plan

- `npm whoami` → `falkensmage`, confirmed owning the `@falkensmage` scope.
- `gh secret list --repo mstine/sigil-spinner` → `NPM_TOKEN` present (value never read, per the plan's
  own constraint — presence only).
- `npm access list packages falkensmage` → `@falkensmage/sigil-spinner: read-write`.
