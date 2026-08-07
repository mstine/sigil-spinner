# Pitfalls Research — v1.1 Distribution

**Domain:** Publishing a zero-dependency ESM library to npm for the first time, wrapping it in a `<sigil-spinner>` web component, and authoring a global Claude Code skill — without breaking the two guarantees v1.0 shipped: byte-identical determinism and zero runtime dependencies.
**Researched:** 2026-08-07
**Confidence:** HIGH for npm-mechanics claims (npm's own docs, cross-checked); MEDIUM for web-platform claims (cross-checked web search, consistent with MDN/web.dev consensus, not independently re-verified against spec text); HIGH for project-specific claims (read directly from this repo's `package.json`, `src/`, `PROJECT.md`, `RETROSPECTIVE.md`).

**Note on scope:** This supersedes the v1.0-era `PITFALLS.md` at this same path (kamea provenance/dihedral-orientation pitfalls). `src/data/kamea.js:26` still contains a comment pointing at "Pitfall 1 in .planning/research/PITFALLS.md" referring to that v1.0 content — **that comment is now stale and needs updating or the old file needs archiving alongside the v1.0 milestone**, flagged here so the orchestrator can decide (not a call for a research subagent to make silently).

---

## Critical Pitfalls

### Pitfall 1: Scoped package publishes private (or fails outright) on first publish

**What goes wrong:**
`@falkensmage/sigil-spinner` is a *scoped* package. npm defaults every scoped package to **private** unless told otherwise — a free account cannot even complete a private publish, so the failure is usually loud (`npm ERR! 402 Payment Required` / "You must sign up for private packages"). But the more dangerous failure mode is silent: some tooling has been observed to respect `--access public` on the CLI but *ignore* `publishConfig.access` in `package.json` on the very first publish of a new package (subsequent publishes then honor it), so a `package.json`-only fix that looks correct in review can still fail — or in the worst case, succeed as private if the account happens to have paid-org privileges, quietly shipping a package `npx` cannot fetch.

**Why it happens:**
Unscoped packages default to public; scoped packages default to private. This asymmetry is the single most common first-time-scoped-publish mistake in the ecosystem, and this is this project's *first-ever* publish of *any* kind, scoped from day one.

**How to avoid:**
- Add `"publishConfig": { "access": "public" }` to `package.json` (belt).
- Always pass `--access public` explicitly on the actual first `npm publish` invocation regardless of what `publishConfig` says (suspenders).
- Confirm `npm whoami` resolves to the account that owns the `@falkensmage` scope before publishing, so the scope itself isn't blocked by an auth mismatch.

**Warning signs:**
- `npm publish --dry-run` (see Pitfall 2) either errors with a payment/access message, or succeeds silently without printing "public" access anywhere in its output — read the dry-run output, don't just check the exit code.
- `package.json` currently has no `publishConfig` key at all (confirmed by reading it) — this is a required addition, not already present.

**Phase to address:** PKG-01 (npm publish), as the very first sub-step before any real publish attempt.

---

### Pitfall 2: npm publish is (almost) permanent — treat the rehearsal path as mandatory, not optional

**What goes wrong:**
Once a version is published, it cannot be silently corrected. Unpublish is only unconditionally available for **72 hours** after first publish, and only if no other published package depends on it. After that window, removal requires contacting npm support and is not guaranteed. Even within the window, unpublishing an entire package name reserves it for **24 hours** before republish is possible, and npm replaces a fully-unpublished name with a security placeholder — meaning a bad publish followed by a panic-unpublish can still cost a full day of "the package doesn't exist" before a corrected version can go up again. A version number, once published, can never be reused even after unpublishing (semver is monotonic on the registry regardless of local git history).

**Why it happens:**
`npm publish` reads like a normal build step, but it's the one command in this project's entire toolchain with no `git revert` equivalent. Everything else in this repo (48 byte-pinned snapshots, 1,453 tests, tsc/eslint) is designed to be safely re-run and corrected; the registry is not.

**How to avoid — the rehearsal ladder, cheapest and most-local first:**
1. **`npm pack --dry-run`** — lists exactly which files *would* ship, without creating a file or touching the network. Catches `files`/`.gitignore` mismatches and confirms `LICENSE` will (or won't) be included. Does **not** prove the package works when installed.
2. **`npm pack`** (real tarball) → **install it into a throwaway scratch directory** (`npm install /abs/path/to/falkensmage-sigil-spinner-1.1.0.tgz` in an empty dir with its own `package.json`) → run the actual smoke test against that installed copy: `import`, run the `bin`, run `generateSigil`, diff against a known snapshot. This is the **only** step in the ladder that proves what PROJECT.md's PKG-01 literally asks for — "npm pack'd and installed from a clean tree" — because it's the only step that resolves `exports`/`bin` the way a real consumer's `node_modules` would, rather than the repo's own convenient relative paths.
3. **`npm publish --dry-run`** (requires being logged in) — simulates the actual publish request against the real registry, including auth, scope-access, and name/version-conflict checks, without uploading. Catches registry-side problems (Pitfall 1's access errors, a version that already exists) that neither `pack` step can see, since packing never talks to the registry.
4. **`npm publish --tag next`** — the real, irreversible first publish, but pointed at a dist-tag that a bare `npm install @falkensmage/sigil-spinner` will **not** resolve to (only `@next` will). This buys a live-infrastructure review window — real registry metadata, real `npm view`, a real install from a second machine or directory via `@next` — before anyone (including future-you via `npx`) gets it by default.
5. Only after step 4 checks out: promote via `npm dist-tag add @falkensmage/sigil-spinner@1.1.0 latest` (or run a normal `npm publish` for the real release).

**Warning signs:** any temptation to skip straight to `npm publish` because "the test suite is green" — the test suite has never once exercised the package as an installed dependency; that gap is exactly what PKG-01 exists to close, and exactly what step 2 above tests that steps 3–5 do not.

**Phase to address:** PKG-01, as the phase's own acceptance criterion (the "clean-install smoke test" PROJECT.md already names) — this ladder *is* that smoke test, formalized into discrete steps rather than one script.

---

### Pitfall 3: License/metadata drift — the package currently claims the wrong license and is missing required files

**What goes wrong:**
This is not hypothetical for this repo — it's the current state. `package.json` right now says `"license": "ISC"` (a scaffold default) while PROJECT.md's stated goal is `MIT`, and there is **no `LICENSE` file anywhere in the repository** (confirmed: `ls LICENSE*` finds nothing). `author` is an empty string and there is no `repository` field. None of these block a publish — npm will happily publish a package with a mismatched license field and no LICENSE file — but the mismatch ships permanently in whatever version goes out first, and "no LICENSE file, license field says MIT" is exactly the kind of thing that erodes trust in a package meant for other practitioners to discover later (PROJECT.md: "built for Matt's sites, shaped so other practitioners can use it later").

**Why it happens:** These fields are invisible during local development — nothing in the test/type/lint suite checks them, because they don't affect runtime behavior at all. They only matter at the moment of first publish, which is precisely the moment this project has never yet reached.

**How to avoid:**
- Update `"license": "MIT"` in `package.json`.
- Add an actual `LICENSE` file with the correct copyright holder and year — npm auto-includes a root-level `LICENSE`/`LICENCE` file in the published tarball even if it's not listed in `files`, but only if it exists.
- Fill `author` (or add a `contributors` array) and add a `repository` field pointing at wherever this repo will actually live publicly — both are read by npmjs.com's package page and by tooling that reports license compliance.

**Warning signs:** `npm pack --dry-run` output not listing a `LICENSE` entry; any external license-scanner or `npm view @falkensmage/sigil-spinner license` disagreeing with what's actually in the tarball.

**Phase to address:** PKG-01, as a pre-flight checklist item — cheap, mechanical, and should be resolved before the first `npm pack --dry-run` rehearsal (Pitfall 2) is even run, so the dry-run output can be checked against the corrected expectation.

---

### Pitfall 4: `files` array and `exports` map silently under- or over-scope what consumers can reach

**What goes wrong:**
Two related but distinct failure modes:
- **`files`** currently lists `["src", "bin", "README.md"]`. That's correct for v1.0's surface, but v1.1 adds a web component (WRAP-01) and possibly a build artifact if bundling is chosen for it (see Pitfall 10/12). If the web component's source or built file lands somewhere not covered by `files` (e.g., a new top-level `web/` or `dist/` directory), it silently never ships — the package works in the repo, fails for every consumer, and nothing in the existing test suite catches it because those tests run against the repo tree, not the packed tarball.
- **`exports`** currently maps only `"."` → `./src/index.js`. If the web component needs to import an internal module directly (e.g., a shared render helper) rather than going through the public `generateSigil` surface, that import will work fine in-repo (relative paths inside `src/` don't go through `exports` resolution) but will throw `ERR_PACKAGE_PATH_NOT_EXPORTED` for any *external* consumer trying to reach the same subpath — including the web component itself, once it's a separate published entry point consuming the library as a real dependency rather than a sibling file.

**Why it happens:** `exports` only governs resolution from *outside* the package boundary. Everything inside `src/` importing from other files in `src/` via relative paths is completely unaffected by the `exports` map, so a broken external-consumer path is invisible to every test that runs from within the repo — which is 100% of the current 1,453 tests.

**How to avoid:**
- Before adding any new entry point (web component build output, a `working`-schema JSON file, etc.), decide explicitly whether it's part of the public surface. If yes, add it to both `files` and `exports` deliberately — mirroring the project's own Design Principle of "full coverage by default, opt out with a reason" rather than "whatever the first use case happened to touch."
- Keep the web component's *own* internal implementation importing only from the package's public `.` export (`generateSigil`, `SigilError`, the `E_*` constants) — the same "thin CLI over stable library API" pattern already used for `bin/sigil-spinner.js` (per `src/index.js`'s own header comment: "this is the entire public surface... never from an internal module"). If the web component only ever needs what the CLI already needs, it never needs a new `exports` subpath at all.
- Verify with the tarball-install rehearsal (Pitfall 2, step 2), not `npm link` — `npm link` symlinks the repo directly and does not exercise `exports` resolution the way a real installed copy does.

**Warning signs:** any `import` statement in web-component code that reaches past `src/index.js` into a specific file (e.g., `from '@falkensmage/sigil-spinner/src/render/svg.js'`); `ERR_PACKAGE_PATH_NOT_EXPORTED` in the tarball-install smoke test.

**Phase to address:** WRAP-01 primarily (this is where a second real "external consumer" of the package first exists); PKG-02/`--title` are unlikely to touch this since they extend the existing single entry point.

---

### Pitfall 5: ESM-only package produces a confusing error for CommonJS consumers

**What goes wrong:**
`"type": "module"` with no CJS entry means any consumer calling `require('@falkensmage/sigil-spinner')` gets `ERR_REQUIRE_ESM`, a real but genuinely confusing error to anyone who doesn't already know the package is ESM-only. This is a deliberate, already-accepted tradeoff (STACK.md's "ESM-only packaging" section explicitly chose this over dual-publishing to avoid the dual-package hazard) — the pitfall isn't the choice itself, it's **shipping the choice undocumented**, since the audience widens the moment the package leaves this repo. Today the only consumer is Claude Code (ESM-native); after PKG-01, the audience is "any practitioner who finds it on npm," some fraction of whom will be on older CommonJS tooling.

**Why it happens:** The error Node throws is accurate but assumes the reader already knows what ESM/CJS interop means — it doesn't say "add `\"type\": \"module\"`" or "use `import()` instead," it just fails.

**How to avoid:** Document ESM-only status prominently in the README's first paragraph and in `npm view`-visible metadata (`description` can't say much, but the README is what renders on the npm package page). No code change needed — this is a documentation gap, not a technical one, since v1.0 already made the ESM-only call deliberately and correctly.

**Warning signs:** none automatable — this is purely a "will a first-time CJS consumer understand the failure" question. Resolve by having someone unfamiliar with the project read the README's opening section and confirm the ESM requirement is unmissable.

**Phase to address:** PKG-01, as a README pass alongside the license fix (Pitfall 3) — cheap, same review pass.

---

### Pitfall 6: `<sigil-spinner>` re-registration throws `NotSupportedError` with no recovery API

**What goes wrong:**
`customElements.define('sigil-spinner', SigilSpinnerElement)` throws `NotSupportedError` if the registry already has an entry under that tag name *or* that exact constructor — and there is **no unregister/redefine API** in the platform. This bites in exactly the situations most likely for this project's actual usage: Claude Code re-running a build script that includes the component's `<script>` tag twice on one generated page (easy to do accidentally when assembling multiple sigil-bearing sections), a dev-server hot-reload during iteration on Matt's sites, or a page that simply includes the script both directly and via a bundler that also inlines it.

**Why it happens:** The custom-element registry is a platform-level singleton with no lifecycle hooks for "replace this definition" — it was designed assuming one `define()` call per tag name per page load, which doesn't match iterative build/reload workflows.

**How to avoid:** Guard every `define()` call: `if (!customElements.get('sigil-spinner')) { customElements.define('sigil-spinner', SigilSpinnerElement); }`. This is a one-line, zero-dependency fix — no library needed, just the guard.

**Warning signs:** `Uncaught DOMException: Failed to execute 'define' on 'CustomElementRegistry': the name "sigil-spinner" has already been used with this registry` in the browser console; any generated page that includes the component's script tag more than once.

**Phase to address:** WRAP-01, and it should be a **structural test**, not just code review — per the v1.0 retrospective lesson (below), this is exactly the kind of thing that "looks wired" in a code read but needs an actual browser assertion: load the script twice in one test page and assert no throw.

---

### Pitfall 7: Shadow DOM would silently break half of this project's entire embedding value proposition

**What goes wrong — and why this is the highest-severity web-component pitfall in this milestone:**
The project's stated core value for embedding is explicit and specific: *"pages restyle the SVG via `--sigil-*` custom properties and semantic classes."* Two different theming mechanisms, both load-bearing. If `<sigil-spinner>` is implemented with `this.attachShadow({ mode: 'open' })` and the generated SVG is injected inside that shadow root:
- **CSS custom properties (`--sigil-*`) will still work**, because custom properties are inherited properties by nature and cross shadow boundaries by default *as long as the shadow-side styles only `use` them via `var()` and never redefine their value internally.*
- **Class-based selectors from the page's own stylesheet will NOT work.** A page rule like `.sigil-path { stroke-width: 3; }` written in the light DOM cannot see into a shadow root at all without `::part()`/`exportparts` wiring on every element the page wants to select — and this project's SVG output uses many semantic classes (`sigil-path`, `sigil-grid`, `sigil-node`, etc., per README), which would each need an explicit `part` attribute and an `exportparts` declaration to remain reachable. That's a large, easy-to-under-scope surface, and any class the author forgets to `part`-expose becomes silently unreachable from outside — exactly the kind of "looks correctly wired in the markup" failure the retrospective already flagged once (the `font-size` `var()` bug).

**Why it happens:** Shadow DOM is the *default* mental model reached for when building "a real web component" — it's what gives style encapsulation, which is usually the entire point of using Shadow DOM at all. But this project's embedding value proposition is the *opposite* of encapsulation: the whole point of the inline-SVG approach validated in Phase 3 (26 co-embedded sigils, zero `style=` attributes, restyled entirely from page CSS) was maximum external stylability. A component that shadow-DOM-encapsulates the same SVG partially reverses that decision without anyone deciding to.

**How to avoid:**
- **Render into light DOM** (`this.innerHTML = svg`, or append the parsed SVG as light-DOM children) rather than a shadow root. This preserves both theming mechanisms exactly as they work today with zero new CSS wiring, and keeps the component a genuinely "thin wrapper" — it doesn't need to re-invent `::part()` coverage for 15 custom properties and every semantic class the SVG already carries. The tradeoff (no style encapsulation *of* the component's own non-SVG chrome, if any) is a non-issue here because the component has no non-SVG chrome — it wraps exactly one SVG.
- If Shadow DOM is chosen anyway for some other reason (event isolation, avoiding ID/`<title>` collisions with the surrounding page — though `idPrefix` namespacing already solves the ID case per D-44), the decision must come with an explicit `part`/`exportparts` inventory covering every existing `--sigil-*` property and every semantic class, verified against the README's own list so nothing quietly falls out of reach.
- **This must be decided openly, the same way PROJECT.md already flags the build-step question as a sharp edge requiring a discuss-phase decision** — it is not a default to fall into.

**Warning signs:** any web-component implementation draft that calls `attachShadow` without an explicit, written answer to "how does `--sigil-glyph-font` (or any of the other 14 custom properties) and `.sigil-path` (or any other semantic class) still work from outside?"

**Phase to address:** WRAP-01, at discuss-phase — before any implementation code, per the project's own established pattern for sharp-edge decisions (see also Pitfall 10).

---

### Pitfall 8: Verifying the web component the way v1.0's real defects were actually caught — not the way the existing structural tests would catch them

**What goes wrong:**
The v1.0 retrospective is unambiguous on this point and it generalizes directly to WRAP-01: **both real production defects (G-02-1 detached loop arcs, G-03-1 the `font-size` `var()` fallback) passed every assertion in a green 1,453-test suite and were caught only by a human looking at rendered output.** The common thread: structural tests asserted that things existed and were wired ("an arc exists with radius r," "the attribute contains `var()`") rather than that they were *true* in the way that matters ("the loop connects to the cell," "the computed style actually resolves to the intended value"). A web component adds an entirely new class of "looks wired, isn't" risk on top of the SVG-generation risk that already bit twice: DOM upgrade timing, attribute-to-property wiring, and (per Pitfall 7) shadow-boundary CSS reachability are all things that can appear structurally correct in source review while being invisibly broken at render time.

**Why it happens:** Assertions about DOM/CSS wiring are cheap to write and look thorough, but "the attribute exists" and "the CSS custom property is declared" are necessary, not sufficient — the same lesson the retrospective already states in almost these exact words about `font-size`.

**How to avoid:** For every claim about the web component that is fundamentally a *rendering* claim, either (a) assert it against a real rendered browser page — this project already has the infrastructure for this (`test/browser/theming-resolution.test.js`, `npx playwright install chromium`), so extend that pattern rather than inventing a new one — or (b) if a full browser test is disproportionate, assert the property that makes the claim *true*, not merely *present* (the retrospective's own reframe: "the loop's path data begins at the cell point" instead of "an arc exists"). Concretely for WRAP-01, render the actual custom element in Playwright and assert:
- a page-level `--sigil-*` override on the *host* element actually changes computed style on the rendered SVG's descendants (the exact class of bug that shipped once already, now one DOM layer deeper);
- a page-level class selector targeting a semantic SVG class actually matches and applies (directly tests the Shadow-DOM-vs-light-DOM decision from Pitfall 7, empirically, rather than trusting the implementation choice);
- double-registration doesn't throw (Pitfall 6);
- setting an attribute *before* the element is upgraded (element created via `document.createElement` and attributes set prior to `document.body.appendChild`) produces the same final render as setting it after.

**Warning signs:** any WRAP-01 test file that only asserts against the *component's* output (e.g., "the shadow root contains an SVG") without ever asserting from the *page's* perspective (e.g., "a stylesheet I control actually changed what's on screen").

**Phase to address:** WRAP-01 — this should be written into the phase's own verification/UAT criteria explicitly, not left implicit, precisely because implicit is what failed twice already in v1.0.

---

### Pitfall 9: Attribute-supplied content reaching the DOM outside the library's own escaping path

**What goes wrong:**
The library already treats attacker-controlled string injection seriously — `idPrefix` escaping (`escapeXml`) and a hostile-prefix test exist specifically because D-44 identified that surface. The new `--title` flag and the web component's `title`/`statement` *attributes* reopen a version of the same question one layer up the stack: a web component typically reads attribute values (`el.getAttribute('statement')`, `el.getAttribute('title')`) and must get them into the DOM somehow. If the component's own glue code does *any* independent string-building into `innerHTML` — e.g., wrapping the library's SVG output in a hand-built `<figure><figcaption>${title}</figcaption>${svg}</figure>` template literal — that concatenation is a **second, separate injection surface** that the library's own `escapeXml` never touches, because it never passes through `generateSigil` at all.

**Why it happens:** It's natural to reach for a small amount of "wrapper HTML" around the generated SVG (a caption, a loading state, a wrapper `<div>`) and just as natural to build it with a template literal, which is exactly how the library's own SVG builder does *not* work internally (it uses attribute/text escaping deliberately) — the web component is new code that hasn't inherited that discipline by default.

**How to avoid:**
- Every piece of user-supplied string content that reaches the DOM through the web component must go through one of: (a) `generateSigil`'s own output (already escaped/tested), or (b) `textContent` assignment (never parsed as markup) for anything the component adds itself — never (c) template-literal string interpolation into `innerHTML`.
- If a caption/title needs to render as its own DOM node distinct from the SVG's internal `<title>`, create it via `document.createElement` + `.textContent =`, not markup concatenation.

**Warning signs:** any `` `<div>${someAttributeValue}</div>` `` pattern, or any `.innerHTML = ` assignment in the web-component source that isn't assigning the *entire, unmodified* output of `generateSigil`.

**Phase to address:** WRAP-01 and the `--title` CLI flag phase jointly — the CLI flag itself is lower risk (stdout, not DOM), but the pattern this pitfall guards against is exactly the kind of thing that should be named once, in whichever phase lands first, so the other doesn't reinvent it.

---

### Pitfall 10: A version/provenance field in the JSON `working` becomes a silent determinism leak

**What goes wrong:**
PKG-02 asks for a kamea-set identifier and version stamped into the JSON working. This is exactly the kind of field that, sourced carelessly, destroys the project's entire determinism contract — the same contract 48 committed byte-pinned snapshots exist to enforce. The classic failure modes, in order of how quickly they'd be noticed:
- **Embedding a build timestamp** (`new Date().toISOString()`, `Date.now()`) — breaks byte-identical output on *every single run*, would fail all 48 snapshots immediately and obviously. Unlikely to ship silently, but worth naming as the anchor example of the failure class.
- **Embedding a git SHA** (`execSync('git rev-parse HEAD')` or reading `process.env.GIT_SHA`/`VERCEL_GIT_COMMIT_SHA`-style CI env vars) — differs between every commit (breaks snapshots on every commit that touches unrelated files), is **unavailable entirely in an installed npm package** (no `.git` directory ships in the tarball — see `files`, Pitfall 4), and introduces a subprocess call into what is currently pure, synchronous, dependency-free computation.
- **Reading `package.json`'s `version` field at runtime** — the subtle one, because it looks reasonable and would pass local tests: `import pkg from '../../package.json' with { type: 'json' }` (or `JSON.parse(readFileSync(...))`). This drifts silently between contexts: the git working tree's `package.json` can be ahead of (or behind) whatever was actually last published, so two checkouts of the *same commit* could report different "versions" if `package.json` was hand-edited without a corresponding release; the relative path resolution differs between running from `src/` in the repo vs. running from inside `node_modules/@falkensmage/sigil-spinner/` once installed, which is exactly the kind of path-fragility this project has otherwise avoided entirely (no runtime `fs` reads at all today); and if the package is ever vendored or bundled into something else without its `package.json` alongside, the read fails or returns stale data.

**Why it happens:** "Just read it from `package.json`, that's the single source of truth" is genuinely good advice for *build tooling* — it is bad advice for a value baked into a *deterministic runtime output artifact*, because it makes that artifact's content depend on something outside the pure function's own inputs, sourced by I/O the library has never needed before.

**How to avoid:**
Source both the kamea-set identifier and the package version as **hardcoded literal constants checked into source** — e.g., `export const PACKAGE_VERSION = '1.1.0';` and `export const KAMEA_SET = 'agrippa-v1';` in a small dedicated module, imported by `generate.js` the same way `KAMEA_SETS` is already keyed by name per D-02 ("add it under a new key... rather than mutating this one, since determinism is a published contract"). This guarantees the *same* value in the git working tree and the installed npm package, because it's just source code — no runtime I/O, no environment dependence, no context-sensitive path resolution. The literal is bumped manually as a single deliberate line in the release process (the same discipline already used for kamea-set keys), and its correctness relative to `package.json`'s own `version` field should be enforced by one cheap CI/test assertion (`PACKAGE_VERSION === require('../package.json').version` — this check itself is allowed to read `package.json`, since it runs in CI/dev, never at library-consumer runtime) so the two never drift.

**Determinism-rebase discipline:** the moment this field is added, all 48 snapshots need a **single, reviewed, deliberate rebase commit** — exactly the pattern the retrospective already validated once ("Phase 3's one reviewed rebase of 31 files") — not incidental churn scattered across the PKG-02 phase's commits.

**Warning signs:** any `readFileSync`, `import ... from '../package.json'`, `process.env`, `Date.now()`, or `execSync`/`child_process` appearing anywhere in `src/` for the first time — none of these exist in the codebase today (confirmed: v1.0 "reads nothing dynamic"), so any of them appearing in a PKG-02 diff is itself the warning sign, independent of what it's being used for.

**Phase to address:** PKG-02, and specifically at its plan/design step before implementation — this is the one pitfall in this document where the *wrong* answer is easy to write, tests fine locally (dev tree `package.json` will usually match dev expectations), and only fails once installed from the tarball, which is exactly the gap PKG-01's clean-install smoke test exists to close. **PKG-02 should be sequenced so its own new snapshot output gets exercised by that same clean-install smoke test, not just the in-repo suite.**

---

### Pitfall 11: The Claude Code skill drifts from the CLI it describes, or never fires, or fires on everything

**What goes wrong — three distinct failure modes bundled into one artifact:**
- **Too narrow / mismatched trigger language** → the skill exists but Claude Code sessions never invoke it because its description doesn't contain the phrasing a real request would use ("make me a sigil," "embed a planetary sigil," "what planet fits this intention"). The tool becomes "discoverable" in name only, which is the entire stated point of building the skill at all (PROJECT.md: "so the tool is discoverable rather than merely available").
- **Too broad** → the description is written generically enough ("helps with symbolic/esoteric work") that it fires on unrelated requests — tarot readings, astrology, other RitualSync tools — creating noise and eroding trust in skill-surfacing generally (this environment already has dedicated `oracle`/`decide` skills for adjacent symbolic work; overlap here is a real, not hypothetical, risk).
- **Stale relative to the CLI** → the skill is the *one place in this entire system* that will duplicate CLI knowledge outside of `--help` and the README. `--title` is being added this milestone; any future flag addition, rename, or exit-code change silently orphans whatever the skill says about it, mirroring the exact class of problem this project already solved once for its own exit-code table (D-55: "the CLI hardcoded code strings... a rename would silently orphan an exit-status entry" — now fixed by importing the `E_*` constants instead of re-stringing them).

**Why it happens:** A skill file is prose, not code — nothing type-checks or lints it against the CLI surface it describes, and (per the global skill-authoring context available to this environment) global skills are especially prone to drifting from a specific project's CLI because they're written once, installed globally, and then the project moves on without the skill file being in the same review loop as the code.

**How to avoid:**
- Write the skill's trigger description narrowly and concretely (project name, "planetary sigil," "kamea," explicit invocation phrasing) rather than broadly — model it on how other narrowly-scoped skills in this environment describe themselves (e.g., domain-specific TRIGGER/SKIP framing), not on a generic "helps with X" description.
- **Do not duplicate flag syntax in the skill.** The skill's differentiated value is the *esoteric judgment* PROJECT.md calls out explicitly — planet correspondence for a given intention, which `--help` categorically cannot provide (`sigil-spinner --help` will never know that an intention about grief work traditionally fits Saturn). Everything mechanical should be a single delegating line ("run `sigil-spinner --help` or `npx @falkensmage/sigil-spinner --help` for the current flag list") rather than a hand-copied table of flags that will drift the moment `--title` becomes `--caption` or a new flag ships.
- **Never hardcode a local repo path.** The skill is installed globally (`~/.claude/skills/sigil/SKILL.md`) and must work from *any* project directory on *any* machine where the package is installed — invocation instructions must use the published form (`npx @falkensmage/sigil-spinner ...`) exclusively, never a path like `node ~/RitualSync/sigil-spinner/bin/sigil-spinner.js` that only exists on the machine where it was authored.
- Add one mechanical drift check: a test (in this repo, run at CI time, not shipped) that greps the skill file's `.claude/skills/` copy (or wherever it's synced from) for `--`-prefixed flag mentions and asserts each one still exists among `bin/sigil-spinner.js`'s actual `parseArgs` option keys. Cheap, catches exactly the rename-drift case.

**Warning signs:** the skill file containing a literal `--planet`/`--curve`/`--grid`/`--glyph`/`--title` table with descriptions (rather than "see `--help`"); any absolute path under `/Users/` or a specific repo name inside the skill's invocation instructions; a skill description shorter than the actual trigger phrases a real request would use.

**Phase to address:** the Claude Code skill phase — write the drift-check test in the same phase the skill ships, not deferred, since there's no other point in the roadmap that naturally revisits it.

---

### Pitfall 12: The zero-dependency invariant breaks invisibly through a bundler or base-class, not through `dependencies` alone

**What goes wrong — this is the single highest-value invariant in the whole milestone, per PROJECT.md's own framing, and it can break in a way that `dependencies: {}` doesn't catch:**
- **Most visible failure:** reaching for a web-component convenience base class (Lit, FAST, Stencil's runtime, `@lit-labs/*`) to get reactive properties/templating for `<sigil-spinner>` — the natural ergonomic default for "building a web component" in 2026. If added as a normal npm dependency, this correctly (and loudly) shows up in `dependencies`, which is good — it's caught immediately by inspection or a CI check.
- **Invisible failure, and the one worth actually worrying about:** if a bundler (esbuild/rollup/tsup — all currently absent, all plausible additions the moment WRAP-01 wants a browser-ready single file) is introduced for the web component's build output, the *bundler itself* stays a devDependency correctly — but the **bundled output file** can silently inline runtime helper code (a base class's runtime, decorator-polyfill helpers, `tslib`-style interop shims) directly into the shipped artifact. `dependencies: {}` in `package.json` stays true, a `grep` of `package.json` finds nothing wrong, and the invariant is broken anyway — the actual code that runs in a consumer's browser now includes third-party runtime logic that was never reviewed as "the source," which is precisely what "the source is what runs" (PROJECT.md's stated v1.0 commitment) was written to prevent.
- **Mundane failure:** a future contributor adds a new dev tool with `npm install some-tool` instead of `npm install -D some-tool`, landing it in `dependencies` by accident. Boring, but the most statistically likely of the three over the package's lifetime, and the easiest to catch automatically.

**Why it happens:** WRAP-01 is, per PROJECT.md's own words, "the first thing in this project's history that plausibly wants bundling" — every dependency-adjacent decision up to now (hand-rolled Catmull-Rom curves instead of `d3-shape`, `node:util.parseArgs` instead of `commander`) has had an easy zero-dependency answer; a browser-consumable custom element is the first feature where "just write it in plain JS" and "use the ergonomic ecosystem default" genuinely pull in different directions.

**How to avoid, in order of leverage:**
1. **Prefer not needing a base class or bundler at all.** A thin wrapper around an already-stable `generateSigil()` call plus `observedAttributes`/`attributeChangedCallback`/`connectedCallback` is a well-worn, framework-free pattern for exactly this shape of component (read attributes, call a pure function, set `innerHTML`) — this mirrors the project's own established "hand-roll before depending" pattern (the curve math, per the retrospective's own "Patterns Established" list), applied to a new surface.
2. **If a build step is decided (PROJECT.md already flags this as needing an open discuss-phase decision, not a default) — inspect the output, don't just trust the dependency list.** Add a test/CI assertion that scans the built artifact for known helper/polyfill signatures (`tslib`, `__decorate`, a specific base-class's marker strings) and fails if found.
3. **Make the `dependencies: {}` invariant structurally enforced, not advisory.** Add a `prepublishOnly` script (or equivalent CI gate) that fails the build if `package.json`'s `dependencies` object is non-empty — this makes the mundane failure mode (a tool landing in the wrong field) impossible to publish, not just easy to notice in review.
4. **Extend the clean-install smoke test (Pitfall 2 / PKG-01) to prove the negative directly:** `npm install @falkensmage/sigil-spinner` into an empty scratch directory and assert that the resulting `node_modules/` contains *only* the package itself — no transitive runtime dependencies pulled in at all. This is the check that would have caught a Lit dependency even if someone forgot to look at `package.json` by hand, and it's the only check in this list that verifies the *installed reality* rather than the *declared intent*.

**Warning signs:** any new top-level directory appearing for build output (`dist/`, `lib/`) without a corresponding `files`/`.gitignore` decision made explicitly; any `import` in web-component source from a package not already in `devDependencies` with a documented reason; `dependencies` in `package.json` becoming non-empty for the first time in this project's history.

**Phase to address:** the `dependencies: {}` CI gate (item 3 above) should land at the *start* of v1.1, in PKG-01, before WRAP-01 is even planned — it's cheap, has zero cost to existing work, and then stands guard for every subsequent phase in the milestone rather than being bolted on reactively after WRAP-01 introduces the actual risk. The output-inspection check (item 2) is WRAP-01-specific and only needed if/when that phase's discuss-phase step actually chooses to bundle.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|-----------------|------------------|
| Skip the local tarball-install rehearsal step and go straight from `npm pack --dry-run` to `npm publish` | Saves one manual scratch-directory setup | The only step that proves `bin`/`exports` resolve correctly for a real consumer is skipped; a broken `bin` shebang or `exports` map ships permanently on the first version | Never — this project has never once been installed from a clean tree; PKG-01 exists specifically to close that gap |
| Reach for a web-component base class (Lit/FAST) instead of hand-rolling `<sigil-spinner>` | Faster to write, more ergonomic reactive-property handling | Breaks the zero-runtime-dependency guarantee that is this project's other stated core value alongside determinism | Only if the constraint is explicitly renegotiated at discuss-phase with a written reason, not defaulted into |
| Copy the CLI's flag table into the Claude Code skill for completeness | Skill reads as more thorough on first write | Silently drifts the next time a flag is renamed or added; nothing catches it automatically unless a drift test is written | Never for flag *syntax* (delegate to `--help`); acceptable for planet-correspondence *judgment*, which changes far less often |
| Read `package.json`'s version at runtime for the JSON working's version field | Feels like "the single source of truth," avoids a second literal to keep in sync | Breaks byte-identical determinism between dev tree and installed package, the project's other core value | Never for the runtime-read path; a hardcoded literal kept in sync by a CI assertion is the correct version of "single source of truth" here |
| Ship WRAP-01 with Shadow DOM by default because "that's how web components are supposed to work" | Matches generic web-component tutorials/expectations | Silently breaks class-based CSS theming, half of this project's stated embedding value proposition | Never as a default; only with an explicit, complete `part`/`exportparts` inventory covering every existing custom property and semantic class |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|-----------------|-------------------|
| npm registry (first publish) | Publishing without `--access public` on a scoped package, or trusting `publishConfig.access` alone on the very first publish | Set `publishConfig.access: "public"` in `package.json` **and** pass `--access public` explicitly on the first real `npm publish` |
| npm registry (irreversibility) | Treating `npm publish` like any other reversible build/deploy step | Rehearse via the full ladder (pack → tarball install → `publish --dry-run` → `publish --tag next` → promote to `latest`) before the first real publish |
| Browser `CustomElementRegistry` | Calling `customElements.define()` unconditionally, assuming it only ever runs once per page | Guard every `define()` call with `customElements.get(name)` |
| Browser CSS cascade / Shadow DOM | Assuming custom-property theming *and* class-based theming both survive a shadow root by default | Only custom properties inherit across the boundary by default; class selectors need light DOM or explicit `part`/`exportparts` wiring |
| `package.json` `exports` | Letting a new consumer (the web component) reach into an internal `src/` file directly | Route all internal consumption through the same public entry point (`src/index.js`) the CLI already uses |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Web-component glue code builds `innerHTML` via template-literal string interpolation of an attribute value (e.g., a caption wrapping the SVG) | Script injection via a hostile `title`/`statement` attribute value, bypassing the library's own `escapeXml` path entirely since it never touches `generateSigil` | Only ever assign the *unmodified* output of `generateSigil` via `innerHTML`; anything else the component itself adds must go through `textContent`, never markup concatenation |
| Publishing under the wrong npm account/without 2FA before the first-ever publish of a new scoped package | A compromised publish account can push a malicious version under a name users will trust once it's established; this is the package's very first exposure to the registry | Confirm `npm whoami` and account 2FA status before the first `npm publish`; this is a one-time setup cost paid once, ever |
| Assuming the `--title` CLI flag and web-component `title` attribute get the same escaping guarantees automatically because they're "the same field" | The CLI already routes everything through the library's validated `resolveOptions`/`generateSigil` path; a web-component implementation that reimplements attribute handling instead of delegating to the same function could silently diverge | Route the web component's attribute reads directly into the same `generateSigil(statement, planet, options)` call the CLI uses — no parallel validation/escaping logic |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-------------------|
| Flash of unstyled/undefined content before `<sigil-spinner>` upgrades (script loaded async/deferred, or slow-parsing page) | Visible empty space or raw attribute text where a sigil should render, especially jarring on a design-forward site (RitualSync/Falkens Labyrinth brand work) | A `:not(:defined) { visibility: hidden }` (or a minimal inline placeholder) CSS rule shipped in the README's embed snippet, so consuming pages get FOUC mitigation by default rather than by luck |
| Skill fires on unrelated tarot/astrology requests because its description is too broad | Wrong tool surfaces, user has to correct Claude Code mid-conversation, erodes trust in skill-surfacing generally | Narrow, concrete trigger language specific to "planetary sigil"/"kamea," not generic "esoteric/symbolic" framing |
| `--title` flag added to the CLI but not documented in the same pass as the web-component `title` attribute, leaving them subtly inconsistent (e.g., different escaping, different default behavior) | A user who learns the CLI's `--title` behavior gets a surprise when the same concept behaves differently via the web component | Design and document both surfaces from the same `options.title` code path in the same phase/PR, exactly as the CLI/library parity was already validated for every other option in Phase 3 |

## "Looks Done But Isn't" Checklist

- [ ] **`npm publish` readiness:** Often missing an actual `LICENSE` file even when `license` in `package.json` says the right SPDX identifier — verify `npm pack --dry-run` lists `LICENSE` in its output.
- [ ] **Scoped-package public access:** Often "done" because `publishConfig.access: public` is in `package.json`, but the first-ever publish for a new scoped name can still fail or misbehave without `--access public` passed explicitly on the command itself — verify by reading the actual `npm publish --dry-run` output, not just the exit code.
- [ ] **Clean-install smoke test:** Often "done" as "the tests pass," which only proves the *repo tree* works — verify by installing the packed tarball into an empty scratch directory with no relationship to this repo and running the CLI/library from there.
- [ ] **Web-component CSS theming:** Often "done" as "the SVG renders inside the element," which says nothing about whether a page-level stylesheet can still reach it — verify with a real browser test that sets a page-level `--sigil-*` override *and* a page-level class rule and asserts both actually apply to the rendered output, from outside the component.
- [ ] **JSON working version field:** Often "done" as "the field is present and correct in dev," which says nothing about whether it's *derived the same way* in an installed package — verify the field's value is identical between a repo-tree run and a tarball-installed run of the exact same input.
- [ ] **Zero-dependency invariant:** Often "done" as "`dependencies` is empty in `package.json`," which says nothing about whether the *built artifact* (if any bundling was introduced for the web component) still inlines zero third-party runtime code — verify by inspecting the actual shipped file content, not just the manifest.
- [ ] **Claude Code skill invocation instructions:** Often "done" as "the skill mentions `npx @falkensmage/sigil-spinner`," but still contains a leftover local dev-path example from testing — verify every code example in the skill file resolves from a machine that has never cloned this repo.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|----------------|-------------------|
| Published with wrong license/no `LICENSE` file | LOW | Publish a patch version with the correct `license` field and file — this is a metadata-only fix, no functional break, no need to touch the broken version |
| Published a scoped package as private by mistake | LOW–MEDIUM | Within 72 hours: unpublish and republish with `--access public`. After 72 hours: publish a new patch version with correct access (the old private version stays orphaned but is no longer the `latest` resolution) |
| Published a version with a determinism-breaking version field (e.g., accidentally sourced from `package.json` at runtime and it drifted) | MEDIUM | Cannot fix in place (immutable version). Publish a corrected patch version with the hardcoded-literal approach; document the bad version's behavior in the README changelog so consumers pinned to it understand why it differs |
| `<sigil-spinner>` shipped with Shadow DOM and broke class-based theming for early adopters | MEDIUM–HIGH | Requires a semver-major or clearly-flagged breaking release switching to light DOM (or backfilling full `part`/`exportparts` coverage) — this is exactly why Pitfall 7 should be resolved *before* the first web-component publish, since after publish it's a breaking change either way |
| A bundler silently inlined a base-class runtime, discovered post-publish | MEDIUM | Publish a corrected version built without the bundler/base-class (per the hand-rolled approach); this is a size/purity regression, not a functional break, so urgency depends on how quickly consumers notice the dependency-free claim was inaccurate |
| npm name (`@falkensmage/sigil-spinner`) never squatted (low risk since it's under the user's own scope), but a version number was consumed by a bad publish | LOW | Version numbers are permanently burned but harmless — just bump past it; no recovery action needed beyond documenting why a version is skipped, if anyone asks |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|--------------------|-----------------|
| 1. Scoped package publishes private | PKG-01 | `npm publish --dry-run` output explicitly shows public access; `npm whoami` matches the `@falkensmage` scope |
| 2. Publish irreversibility | PKG-01 | Full rehearsal ladder executed and its output reviewed before the real `npm publish`; tarball-install smoke test passes from a scratch directory |
| 3. License/metadata drift | PKG-01 (pre-flight, before Pitfall 2's rehearsal) | `npm pack --dry-run` lists `LICENSE`; `license` field reads `MIT`; `author`/`repository` populated |
| 4. `files`/`exports` under/over-scope | PKG-01 (baseline), WRAP-01 (new surface) | Tarball-install smoke test imports every intended public entry point and fails on any unintended one |
| 5. ESM-only confusing CJS errors | PKG-01 | README's opening section states ESM-only requirement unmissably (manual review) |
| 6. Custom-element re-registration throws | WRAP-01 | Browser test loads the component's script twice on one page and asserts no throw |
| 7. Shadow DOM breaks CSS theming | WRAP-01 (discuss-phase decision, before implementation) | Browser test sets a page-level `--sigil-*` override and a page-level class rule from *outside* the component and asserts both apply |
| 8. Structural tests miss rendering reality | WRAP-01 | Phase's own verification/UAT criteria explicitly require Playwright-rendered assertions, not just DOM-presence assertions, per the retrospective's own lesson |
| 9. Attribute-supplied content bypasses escaping | WRAP-01, `--title` flag phase | Code review confirms no `innerHTML` template-literal concatenation of attribute values anywhere in web-component source |
| 10. Version-stamping breaks determinism | PKG-02 | Hardcoded-literal version/kamea-set constants (not runtime `package.json`/env/timestamp reads); tarball-install run produces byte-identical `working.meta` (or equivalent field) vs. repo-tree run; single reviewed snapshot-rebase commit |
| 11. Skill drift/vagueness/over-broadness | Claude Code skill phase | Drift-check test greps skill file for `--flag` mentions and asserts each exists in the CLI's actual option keys; trigger description reviewed for specificity |
| 12. Zero-dependency invisible breakage | PKG-01 (CI gate, day one of milestone), WRAP-01 (output inspection if bundling chosen) | `prepublishOnly` (or CI-equivalent) gate fails on non-empty `dependencies`; tarball-install scratch-directory `node_modules` contains only the package itself |

## Sources

- [npm Unpublish Policy — npm Docs](https://docs.npmjs.com/policies/unpublish/) — MEDIUM confidence (web search, cross-checked against npm's own docs page appearing in results)
- [Creating and publishing scoped public packages — npm Docs](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/) — MEDIUM confidence
- [CustomElementRegistry: define() method — MDN](https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry/define) — MEDIUM confidence
- [Styling: Styles Piercing Shadow DOM — Open Web Components](https://open-wc.org/guides/knowledge/styling/styles-piercing-shadow-dom/) — MEDIUM confidence
- [How Nordhealth uses Custom Properties in Web Components — web.dev](https://web.dev/articles/custom-properties-web-components) — MEDIUM confidence
- [Node.js Modules: Packages (`exports` field, `ERR_PACKAGE_PATH_NOT_EXPORTED`) — Node.js Docs](https://nodejs.org/api/packages.html) — MEDIUM confidence
- This repo's own `package.json`, `src/index.js`, `src/data/kamea.js`, `bin/sigil-spinner.js`, `.planning/PROJECT.md`, `.planning/RETROSPECTIVE.md` — HIGH confidence (read directly, not inferred)

---
*Pitfalls research for: Sigil Spinner v1.1 Distribution*
*Researched: 2026-08-07*
