# Stack Research — v1.1 Distribution

**Domain:** npm publishing, pre-publish verification, and zero-build-step web components for an already-shipped, zero-runtime-dependency ESM library
**Researched:** 2026-08-07
**Confidence:** HIGH (all version numbers verified live against the npm registry via `npm view`; publishing/provenance mechanics cross-checked against current npm docs and a July 2025 GitHub changelog announcing OIDC trusted publishing GA)

## Scope note

This is an **additive** research pass for v1.1 only. v1.0's stack (Node ≥20, `node:util.parseArgs`, hand-rolled SVG templating, Vitest, JSDoc+`tsc --checkJs`, zero runtime dependencies) is locked and unchanged — see `.claude/CLAUDE.md`. Nothing below touches that. The findings here are organized to answer the four milestone questions directly, then summarized into the standard tables.

**Repo state that changes the answer:** `git remote -v` returns nothing — this repo has never been pushed to GitHub. That single fact is load-bearing for part (a) below: it rules out CI-based provenance/trusted publishing for the *first* v1.1 publish, regardless of what's technically best-practice in the abstract.

---

## (a) npm publishing in 2026 — scoped, ESM-only, public package

### package.json fields that must change

| Field | Current | Needed | Why |
|---|---|---|---|
| `name` | `sigil-spinner` | `@falkensmage/sigil-spinner` | Scoped per PROJECT.md decision |
| `version` | `0.1.0` | `1.1.0` (or whatever the milestone lands on) | Signal a real, stable public release — `0.x` on first publish undersells a package with 1,453 tests and a shipped v1.0 |
| `license` | `ISC` (scaffold default, never chosen deliberately) | `MIT` | Per PROJECT.md decision. **Also add a `LICENSE` file** — npm shows a license badge from the field, but the file is what people actually read, and its absence is a well-known trust smell on a first-publish scoped package |
| `author` | `""` | Filled in (name + optionally email/url) | Empty author is another first-publish trust smell; costs nothing to fix |
| `repository` | *(missing entirely)* | `{ "type": "git", "url": "git+https://github.com/<owner>/sigil-spinner.git" }` | **Not just cosmetic.** npm provenance/trusted-publishing *validates this field character-for-character against the actual GitHub repo* it's publishing from. Get it wrong now and provenance silently can't be added later without a version bump. |
| `publishConfig.access` | *(missing)* | `"public"` | **Required for scoped packages.** Scoped packages default to `restricted` (private, requires a paid org) unless access is explicitly set to public — either via this field or via `--access public` on every publish. Baking it into `publishConfig` means every future `npm publish` (including from CI, later) is public by default with no flag to remember. |

`files` (already `["src", "bin", "README.md"]`) does **not** need to change in kind, but confirm it stays accurate as `src/` grows a web-component entry point (see part c) — npm also *always* includes `package.json`, `README*`, and `LICENSE*` regardless of the `files` array, so the new `LICENSE` file needs no explicit listing.

### Provenance / attestation — the real 2026 landscape

There are two distinct mechanisms, and this repo currently qualifies for **neither** on day one:

1. **Trusted Publishing (OIDC)** — went GA July 2025. No `NPM_TOKEN` at all; instead you register a "Trusted Publisher" on the npmjs.com package settings page (GitHub owner/repo/workflow filename), your GitHub Actions workflow requests an OIDC token via `permissions: id-token: write`, and `npm publish` from that workflow auto-generates a provenance attestation with **no `--provenance` flag needed**. Requires **npm CLI ≥11.5.1 and Node ≥22.14.0 in the CI job specifically** — this is independent of the package's own `engines: >=20.0.0`, which only constrains *consumers*, not the publish pipeline.
2. **Classic provenance flag** (`npm publish --provenance --access public`) — predates trusted publishing, still works, but **only runs from a supported cloud CI provider (GitHub Actions or GitLab CI) on a cloud-hosted runner.** It cannot be generated from a local `npm publish` on a laptop — there's no CI-issued OIDC identity to attest to.

**Both require the package to already be pushed to GitHub with a workflow file.** This repo has no remote yet. So for the *actual first v1.1 publish*, the only viable path is the plain one PROJECT.md already anticipated ("`npm login` is interactive and cannot be automated"):

```bash
npm login                          # human, interactive — cannot be scripted
npm publish --access public        # or omit --access if publishConfig.access is set
```

**No provenance attestation on this first release.** That's a real (if modest) supply-chain-trust gap, not a nitpick — recommend treating "push to GitHub + add a `publish.yml` workflow + register Trusted Publisher" as an explicit fast-follow phase, not a silent gap. It costs one YAML file and one npmjs.com settings page once the repo exists on GitHub — genuinely cheap once the prerequisite (a GitHub remote) is met, which is presumably coming regardless for a package meant to be publicly discoverable.

If/when that fast-follow happens, the reference workflow shape (verified action versions, MEDIUM confidence — GitHub Actions majors move fast):

```yaml
permissions:
  id-token: write
  contents: read
steps:
  - uses: actions/checkout@v7
  - uses: actions/setup-node@v7
    with:
      node-version: 22
      registry-url: 'https://registry.npmjs.org'
  - run: npm ci
  - run: npm publish
```

### `.npmignore` vs `files` — keep `files`, don't add `.npmignore`

`files` is an allow-list; `.npmignore` is a deny-list layered *on top of* whatever `files`/default-includes would otherwise ship. Introducing `.npmignore` now would create a second place that has to be kept in sync with reality — exactly the kind of drift-prone dual-source-of-truth the project's own zero-dependency, no-build posture already avoids elsewhere. **Recommendation: do not add `.npmignore`.** Keep `files` authoritative and update it when the web-component entry point lands.

### Verifying tarball contents before publishing — no new tooling needed

Both built into the npm CLI already installed, zero-cost:

```bash
npm pack --dry-run       # lists exactly what would ship, without writing a .tgz
npm publish --dry-run    # runs the full publish-time checks (incl. provenance eligibility) without uploading
npm pack                 # writes the real tarball
tar -tzf falkensmage-sigil-spinner-1.1.0.tgz   # physically inspect the archive
```

---

## (b) Clean-install smoke testing

**Direct answer: a plain shell script, no new devDependency.** This is consistent with — not a departure from — the project's existing minimal-tooling posture (v1.0 rejected `commander`/`yargs` for a CLI with one verb; the same judgment applies here to a smoke-test task this small).

**Why `npm link` is not an acceptable substitute:** `npm link` symlinks the working tree straight into a consumer's `node_modules`. It will "pass" even if `files` were misconfigured to omit a required source file, because the symlink exposes the *entire repo* regardless of what the real tarball would contain. The whole point of PKG-01's smoke test is to catch exactly that class of bug, so the test must install the **actual packed tarball**, not a symlink to source.

Recommended script shape (`scripts/smoke-test.sh` or similar), three checks, each targeting a distinct failure mode:

1. **`npm pack`** → produces the real tarball.
2. Fresh scratch directory *outside* the repo (e.g. under `os.tmpdir()` / `mktemp -d`) → `npm init -y` → `npm install <absolute-path-to-tarball>`.
3. **ESM `exports` resolution**: `node -e "import('@falkensmage/sigil-spinner').then(m => { ...assert generateSigil exists... })"` — proves the `exports` map in `package.json` actually resolves for a real external consumer under Node's package-resolution algorithm, which is stricter than a relative import inside the repo and is exactly what breaks silently when `exports` and `files` drift apart.
4. **`bin` entry**: `npx sigil-spinner --help` (or call the linked binary directly out of the scratch tree's `node_modules/.bin/`) — proves the shebang, executable bit, and `bin` mapping survive a real `npm install`, which `npm link` can mask.
5. **Behavioral check, not just presence**: run one real `generateSigil(...)` call through the installed package and diff its SVG against a known-good snapshot — proves the *shipped* files are complete and byte-correct, not merely that *some* file exists at the resolved path.

**Tools considered and explicitly not recommended:**

| Tool | Version | Verdict |
|---|---|---|
| `packtester` | `0.2.1` | A purpose-built package for exactly this task exists — but at this download/adoption tier, a ~20-line script the project already owns and understands is lower supply-chain risk than a sparse third-party devDependency for a job this size. Not recommended. |
| `publint` | `0.3.23` | **Recommended** (devDependency) — see below. Complements the runtime smoke test rather than replacing it: it statically validates `package.json` shape (exports/main/bin/files consistency) without needing a real install, catching a class of bug *before* you even get to the smoke-test step. |
| `@arethetypeswrong/cli` | `0.18.5` | Not recommended for v1.1. `attw` audits how TypeScript consumers resolve a package's shipped `.d.ts` files across module resolution modes — this project ships **no `.d.ts`** (JSDoc + `tsc --checkJs` is dev-only type-checking, never emitted into `files`). `attw` would have nothing to check. Revisit only if a future milestone decides to ship generated types (the door v1.0's own stack research left open). |

---

## (c) Web components with zero runtime dependencies, no build step

**Committed answer: yes, ship as plain ESM, no build step, no library.** Not "it depends" — the underlying browser APIs are sufficient and the mechanism is already proven at scale by other zero-dependency web components.

**Why it works:**

- `customElements.define()` and Shadow DOM are **native browser APIs** (Custom Elements v1) — defining `<sigil-spinner>` requires zero external code, so there's nothing to bundle *for the component's own logic*.
- The natural implementation is one more plain ESM file — e.g. `src/web-component.js` exporting a class `SigilSpinnerElement extends HTMLElement` that does a normal relative import: `import { generateSigil } from './index.js'`. That's an import *within the same package* the project already ships, not a new external dependency.
- Add it to the `exports` map as a subpath, e.g. `"./element": "./src/web-component.js"`, so Node/bundler consumers write `import '@falkensmage/sigil-spinner/element'`.
- **Browser-direct consumers** (the actual target for embedding on Matt's sites) load it straight from a CDN with no build step at all:
  ```html
  <script type="module" src="https://cdn.jsdelivr.net/npm/@falkensmage/sigil-spinner@1.1.0/src/web-component.js"></script>
  <sigil-spinner statement="I will succeed" planet="sun"></sigil-spinner>
  ```
  jsdelivr and unpkg both serve the **full file tree** of a published npm package, preserving relative paths — so `web-component.js`'s `./index.js` import (and whatever `index.js` transitively imports — `generate.js`, `render/*`, `data/*`) resolves correctly with **no import map needed**, because every internal import is relative within the one package. This is the exact mechanism other zero-dependency web components (and Lit's own documented "no bundler" quickstart) already rely on in production.

**What "no build step" actually costs here, concretely:**

- **More HTTP requests** — the browser fetches `web-component.js`, `index.js`, and each transitively-imported module (roughly a dozen small files across `render/`, `data/`, `path/`, `text/`) as separate requests instead of one bundle. Over HTTP/2 or HTTP/3 — which every practical host for this use case (jsdelivr, unpkg, or Matt's own site infra) already serves over — these are multiplexed in parallel, not serial round trips. For a dozen small, mostly-non-repetitive source files, this is a real but genuinely minor cost, not a hidden landmine.
- **No minification** — slightly larger total transfer than a minified bundle; CDN-level gzip/brotli compression claws most of that back for hand-authored (non-generated, non-repetitive) source.
- **No legacy-browser fallback** — irrelevant here; this is explicitly an evergreen-browser target (no IE, no old Safari), and Custom Elements + native ESM `<script type="module">` have been broadly supported for years.

**If a build step becomes wanted later** (e.g. a single-file drop-in for a page embedding many sigils, or a site builder that specifically wants one `<script src>` convenience file), the lightest option, verified on the registry:

- **`esbuild` `0.28.1`** as a devDependency, invoked as a single CLI call with **no config file**:
  ```bash
  esbuild src/web-component.js --bundle --format=esm --minify --outfile=dist/sigil-spinner-element.min.js
  ```
  This buys exactly one thing: one minified file instead of a dozen. It does **not** add a runtime dependency — `esbuild` only runs at author-time to produce a static artifact; the artifact itself still ships zero dependencies, so the constraint holds either way. It's a strict performance/convenience optimization, not a correctness requirement.

**Explicitly deferred, not recommended for v1.1**: PROJECT.md itself names the build-step question as "the sharp edge" of this milestone. Given the finding above — no build step is genuinely viable, not just tolerable — the recommendation is to **not** introduce `esbuild` or a `dist/` output in v1.1 at all. There's no evidence yet that any real page embeds enough sigils for the request-count cost to matter. Add the bundler only in response to an observed cost, not preemptively.

**Do not reach for a web-component authoring library** (Lit, Stencil, FAST, `@lion/*`, etc.) for a single custom element this simple — see What NOT to Use below.

---

## (d) New devDependencies — and the explicit non-negotiable

**Recommended new devDependency:**

| Package | Version | Why |
|---|---|---|
| `publint` | `^0.3.23` | Pre-publish static validation of `package.json` shape (`exports`/`main`/`bin`/`files` consistency) — exactly the class of bug this milestone is trying to prevent (PKG-01's whole premise is "it's never been packed and installed clean"), and it runs before you even get to the smoke test. Zero runtime footprint; devDependency only. |

**Optional, explicitly deferred:**

| Package | Version | Trigger to actually add it |
|---|---|---|
| `esbuild` | `^0.28.1` | Only if/when a bundled single-file `dist/` web-component artifact is wanted — see part (c). Not needed for v1.1 ship. |

**Nothing else requires a new dependency of any kind.** Specifically:
- Publishing itself needs no package — `npm` is a globally-available CLI tool, not a project dependency.
- The clean-install smoke test is a shell script (part b).
- The web component needs no library (part c).
- The Claude Code skill is a markdown file at `~/.claude/skills/sigil/SKILL.md` — outside the package entirely, touches no `package.json`.
- The `--title` CLI flag is wiring through the existing `node:util.parseArgs` surface already in `bin/sigil-spinner.js` and the existing `options.title` the library already accepts — no new parsing capability needed.
- The kamea-set identifier + version field (PKG-02) needs no new package **but has one real implementation constraint worth flagging**: do **not** read the version via `import pkg from '../package.json' with { type: 'json' }`. That JSON-module-import syntax only became stable *unflagged* in Node 23+ (Node 20 and 22 both require `--experimental-json-modules`), and this project's `engines` floor is Node `>=20`. Use `fs.readFileSync(new URL('../package.json', import.meta.url)) + JSON.parse()` instead — built into `node:fs`/`node:url`, works unflagged on every supported Node version, zero dependency either way. (Alternative: hard-code the kamea-set identifier as a constant co-located with the kamea data module rather than deriving it from `package.json` at all, if the "kamea-set version" is conceptually separate from the npm package version — a design question for discuss-phase, not a stack question, but the JSON-import pitfall applies either way if `package.json`'s own `version` field is what gets stamped.)

**CONSTRAINT VIOLATION callout:** Any of the following would break the project's zero-runtime-dependency guarantee and must not be added as a `dependency` (only as a `devDependency`, if at all, and only where noted above):
- **Lit**, Stencil, FAST, `@lion/*`, or any other web-component authoring library — the native Custom Elements API is sufficient; see part (c).
- `commander`/`yargs` for the `--title` flag or any other CLI surface change — no new parsing complexity is introduced by one flag; `node:util.parseArgs` already covers it, per the locked v1.0 stack decision.
- `svgo`, `d3-shape`, or any SVG/rendering helper library for the web component — the component is a thin wrapper calling the already-hand-rolled `generateSigil`; it renders nothing new.
- Any "npm publish helper" or "provenance helper" npm package — provenance/trusted publishing is entirely an `npm` CLI + GitHub Actions + npmjs.com-settings mechanism (part a); no npm package mediates it.

---

## Recommended Stack (summary table)

### Core Technologies

*(unchanged from v1.0 — Node ≥20, `node:util.parseArgs`, hand-rolled SVG templating; not re-listed here, see `.claude/CLAUDE.md`)*

### Supporting Libraries / Dev Tools (new for v1.1)

| Tool | Version | Purpose | When to Use |
|---|---|---|---|
| `publint` | `^0.3.23` | Static `package.json`/exports/bin/files validation, pre-publish | Add now as a devDependency; run in the same script/CI step that runs the clean-install smoke test |
| `esbuild` | `^0.28.1` | Single-command, config-free bundling for an optional minified `dist/` web-component file | **Defer.** Only add if/when a real page embedding many sigils shows the multi-file-request cost actually matters |

### npm CLI / registry facts relevant to this milestone

| Fact | Value | Source confidence |
|---|---|---|
| Current npm CLI registry version | `12.0.2` | HIGH — direct `npm view npm version` |
| Minimum npm CLI for Trusted Publishing (OIDC) | `≥11.5.1` | MEDIUM — npm docs via WebFetch, cross-checked against GitHub changelog |
| Minimum Node version for Trusted Publishing *in the CI job* | `≥22.14.0` | MEDIUM — same sources; independent of this package's own `engines: >=20` for consumers |
| `repository.url` matching requirement for provenance | Case-sensitive exact match to the GitHub repo being published from | HIGH — stated directly in npm's own provenance docs |
| Scoped-package default registry visibility | `restricted` (private) unless `publishConfig.access: "public"` or `--access public` is set | HIGH — standard, long-documented npm behavior |

## Installation

```bash
# Dev dependencies (v1.1 additions only)
npm install -D publint@^0.3.23

# esbuild — only if/when the deferred dist/ bundle decision is actually made:
# npm install -D esbuild@^0.28.1
```

No `npm install` for runtime dependencies — none are added or needed.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|---|---|---|
| Plain shell-script clean-install smoke test | `packtester@0.2.1` | If the smoke-test surface grows significantly beyond "install tarball, check exports, check bin, diff one output" — at that point a purpose-built harness earns its keep over a hand-rolled script. Not the case for v1.1's scope. |
| `publint` only, no `attw` | `@arethetypeswrong/cli@0.18.5` | If a future milestone starts shipping generated `.d.ts` files in `files` — `attw` audits exactly that surface and has nothing to check while the project stays JSDoc-only/no-emit. |
| No build step for the web component | `esbuild@0.28.1` single-file bundle | Once a real page is observed embedding enough sigils that the multi-file request waterfall is a measured (not hypothetical) cost, or a consumer specifically wants one `<script src>` convenience file |
| Classic manual `npm publish --access public` for the first release | OIDC Trusted Publishing via GitHub Actions | As soon as the repo is pushed to GitHub and a `publish.yml` workflow exists — genuinely the better long-term posture (no long-lived `NPM_TOKEN`), just not available for the very first publish given the repo's current state |
| `fs.readFileSync(...package.json...) + JSON.parse()` for reading version at runtime | `import pkg from '../package.json' with { type: 'json' }` | Only once the `engines` floor moves to Node ≥23 — the import-attributes JSON syntax isn't stable unflagged before that |

## What NOT to Use

| Avoid | Why | Use Instead |
|---|---|---|
| Lit, Stencil, FAST, or any web-component authoring library **as a `dependency`** | CONSTRAINT VIOLATION — adds a real runtime dependency for a single custom element that native Custom Elements v1 + Shadow DOM already handle completely. Same judgment v1.0 already applied to `svg.js` for SVG generation. | Plain `class extends HTMLElement`, native `customElements.define()` |
| `.npmignore` | Second source of truth alongside `files`, prone to silent drift; the project already has a working allow-list | Keep `files` in `package.json` as the single source of truth |
| `npm link` as the PKG-01 smoke test | Symlinks the working tree in, masking exactly the `files`/`exports` misconfiguration bugs the smoke test exists to catch | Real `npm pack` + `npm install <tarball>` in a scratch directory |
| `packtester@0.2.1` | Low-adoption third-party devDependency for a task a ~20-line owned script covers just as well, at lower supply-chain surface | Hand-rolled `scripts/smoke-test.sh` |
| `@arethetypeswrong/cli` for v1.1 | Audits `.d.ts` resolution; this project ships no `.d.ts` in `files`, so it has nothing to check yet | `publint` alone; revisit if generated types are ever shipped |
| `--provenance` flag on a local/manual `npm publish` | Silently unavailable outside a supported CI provider (GitHub Actions/GitLab CI) on a cloud-hosted runner — will not work from a laptop regardless of npm CLI version | Plain `npm publish --access public` for the first release; add CI-based provenance as a fast-follow once the repo is on GitHub |
| Reading `package.json` via `import ... with { type: 'json' }` | Requires Node ≥23 unflagged; this project's `engines` floor is `>=20`, so this would silently break (or require an experimental flag) on the project's own stated minimum supported Node version | `fs.readFileSync(new URL('../package.json', import.meta.url)) + JSON.parse()` |

## Stack Patterns by Variant

**If the repo gets pushed to GitHub before the v1.1 publish:**
- Set up OIDC Trusted Publishing immediately rather than manual `npm login`/`npm publish`
- Because it removes the long-lived-token risk entirely and provenance becomes automatic with no extra flag — genuinely strictly better once the prerequisite (a GitHub remote + workflow file) exists, and Node 24 / npm 12+ (already the live registry version) comfortably clears the `≥22.14.0`/`≥11.5.1` CI-side requirement

**If a future page embeds many sigils via the web component on one screen:**
- Add the deferred `esbuild` single-file bundle (part c)
- Because the multi-file-request cost becomes real and measurable rather than hypothetical, and `esbuild` buys the fix in one config-free CLI invocation without touching the zero-dependency guarantee

**If a future milestone ships generated TypeScript declaration files:**
- Add `@arethetypeswrong/cli` alongside `publint`
- Because at that point there's an actual `.d.ts` resolution surface for `attw` to audit — there isn't one today

## Version Compatibility

| Package A | Compatible With | Notes |
|---|---|---|
| `publint@0.3.23` | Node `>=20.0.0` (this project's floor) | No special constraint; static analysis tool, runs fine on any currently-supported Node |
| `esbuild@0.28.1` (if adopted later) | Node `>=20.0.0` | esbuild's own Node floor is well below this project's; no compatibility risk if/when adopted |
| npm CLI `12.0.2` (current registry/bundled-with-Node-24 version) | Trusted Publishing requires `>=11.5.1` | Already comfortably cleared — the *publishing-time* npm CLI version, distinct from anything a consumer needs |
| Node `>=22.14.0` (CI-job requirement for Trusted Publishing) | This project's own `engines: >=20.0.0` | These are different constraints for different actors — the CI job that *publishes* the package can run a newer Node than the floor the package *promises to consumers* |

## Sources

- Direct npm registry lookups (`npm view <pkg> version`) — HIGH confidence — for `npm` (12.0.2), `esbuild` (0.28.1), `tsup` (8.5.1), `publint` (0.3.23), `@arethetypeswrong/cli` (0.18.5), `rollup` (4.62.4), `vite` (8.2.1), `lit` (4.1.0), `packtester` (0.2.1), `npm-packlist` (11.3.0)
- [Trusted publishing for npm packages — npm Docs](https://docs.npmjs.com/trusted-publishers/) — MEDIUM/HIGH, fetched directly, cross-checked
- [Generating provenance statements — npm Docs](https://docs.npmjs.com/generating-provenance-statements/) — MEDIUM/HIGH, fetched directly
- [npm trusted publishing with OIDC is generally available — GitHub Changelog, 2025-07-31](https://github.blog/changelog/2025-07-31-npm-trusted-publishing-with-oidc-is-generally-available/) — MEDIUM, web search
- [Things you need to do for npm trusted publishing to work — Phil Nash, 2026-01-28](https://philna.sh/blog/2026/01/28/trusted-publishing-npm/) — MEDIUM, web search, recency-relevant
- [publint vs arethetypeswrong vs Knip — PkgPulse Guides](https://www.pkgpulse.com/guides/publint-vs-arethetypeswrong-vs-knip-2026) — MEDIUM, web search
- Web search (cross-checked, MEDIUM confidence): npm pack/tarball smoke-testing patterns; custom-elements no-build-step CDN (jsdelivr/unpkg relative-import resolution) patterns; `actions/checkout`/`actions/setup-node` current major versions; Node.js JSON-module-import stability timeline (stable unflagged from Node 23+)
- Repo inspection (`git remote -v`, `ls .github/workflows/`, `ls LICENSE*`) — HIGH confidence, direct — confirmed no GitHub remote, no CI workflows, no LICENSE file exist yet in this repo

---
*Stack research for: Sigil Spinner v1.1 Distribution (npm publish, Claude Code skill, web component, small library additions)*
*Researched: 2026-08-07*
