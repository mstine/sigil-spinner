# Research Summary — Sigil Spinner v1.1 Distribution

**Project:** Sigil Spinner (planetary sigil generator)
**Milestone:** v1.1 Distribution (npm publish, Claude Code skill, web component, CLI flag, kamea-set provenance)
**Researched:** 2026-08-07
**Confidence:** HIGH overall

> Supersedes the v1.0-scoped research summary of 2026-08-04, archived at `.planning/milestones/v1.0-research/SUMMARY.md`.

## Executive Summary

v1.1 is a **distribution and discoverability layer** over an already-shipped, deterministic, zero-dependency ESM library. The research converges on one architectural principle: **every new feature is an addition to a stable core, not a replacement of it.** No build step is needed (three independent sources concluded this). The web component ships as light DOM to preserve the existing CSS-theming model. npm publishing follows a formal rehearsal ladder because publish is effectively irreversible. The Claude Code skill carries judgment content — planet correspondences — that is explicitly Matt's lineage knowledge and not synthesizable by research.

Two **strict human blockers** (npm login; planet-correspondence capture) and **three parallel-capable tracks** in Wave 1, before sequential publish and web-component work in Wave 2.

The highest risk is **publishing irreversibly with wrong metadata.** A five-step rehearsal ladder de-risks this entirely.

## Key Findings

### Recommended Stack

v1.0's stack unchanged, plus at most two devDependencies:

1. **`publint@^0.3.23`** — pre-publish validation of `exports`/`bin`/`files` consistency. Recommended.
2. **`esbuild@^0.28.1`** — only if bundling is ever chosen. **Explicitly deferred for v1.1**; the zero-build path is viable.

**No runtime dependency is needed anywhere in this milestone.** Flagged as CONSTRAINT VIOLATIONS if introduced: Lit/Stencil or any web-component library, `commander`/`yargs` for the one new CLI flag, any SVG helper, any "publish helper" package.

### Resolved Contradiction — version sourcing

STACK.md recommended reading the version from `package.json` at runtime via `fs.readFileSync` (avoiding the Node ≥23 import-attributes requirement). ARCHITECTURE.md established that `src/` contains zero `node:` imports, and that this browser-safety is exactly what makes the buildless web component possible. FEATURES.md independently recommended a static constant.

**RESOLVED: the static constant wins.** Orchestrator-verified by grep — the only `node:` occurrence in `src/` is prose inside a doc comment at `src/generate.js:92`; every real `node:` import lives in `bin/sigil-spinner.js` alone. A `readFileSync` in the library path would (a) introduce the first `node:` import into `src/`, breaking browser-safety and the buildless web component with it, and (b) allow dev-tree/installed-package drift, violating byte-determinism.

`kameaSetVersion` is a hardcoded literal in `src/data/kamea.js`. **STACK.md's `readFileSync` suggestion is SUPERSEDED for anything reachable from `src/`.**

### Corrected Premise — GitHub and provenance

STACK.md concluded that npm provenance and OIDC trusted publishing were blocked because the repo had no GitHub remote. **That premise is no longer true.** The repo was created public at `github.com/mstine/sigil-spinner` during this planning session and `origin` is wired over SSH.

Provenance is therefore **not blocked — only ungated work remains.** It requires publishing from a cloud CI runner, so it needs a GitHub Actions workflow that does not exist yet.

- v1.1's **first publish is still manual** (`npm login` + `npm publish --access public`), because no CI exists.
- Provenance is a genuine **fast-follow**, not an impossibility. Treat as deferred-pending-work, not deferred-pending-decision.
- STACK.md's warning that `repository.url` is validated **character-for-character** against the real repo becomes *more* important, not less. The correct value is now known: `github.com/mstine/sigil-spinner`. Getting it wrong means a forced version bump later, since published versions are never reusable.

### Expected Features

1. **PKG-01 — npm publish + clean-install smoke test.** Scoped public MIT package via the five-step rehearsal ladder. Also closes the license gap (see Pitfalls).
2. **Claude Code skill** — `~/.claude/skills/sigil/SKILL.md`, mechanics plus planet-correspondence judgment. Blocked on Matt.
3. **PKG-02 — kamea-set version** in the JSON working, as a hardcoded constant. `kameaSet` already ships; only the version is missing.
4. **`--title` CLI flag** — exposes existing library semantics. Single change in `bin/`, zero `src/` changes.
5. **WRAP-01 — `<sigil-spinner>` web component.** Light DOM, reactive attributes, no build step.

### Architecture Approach

**Every feature is additive.** Browser-safety audit confirms `src/` has zero `node:` imports; `bin/` holds them all, and `bin` and `exports` are separate Node resolution namespaces, so the CLI's `node:util.parseArgs` is already structurally unreachable from any browser path.

**No build step — converged finding from three sources**, each via a different route: CDN relative-import mechanics (Stack), dependency-surface equivalence (Features), module-graph audit (Architecture). Independent convergence makes this materially stronger evidence than any single source's opinion.

**Light DOM — resolved decision.** No shadow root. CSS custom properties pierce shadow boundaries, but semantic class selectors do not, and roughly half this project's documented theming surface is classes. Shadow DOM would silently make the web-component embed path *worse* than the raw-SVG path that already works. **Must be locked at discuss-phase** — reversing it later breaks a published attribute contract.

**Exports map** gains one entry (`./element`) plus the conventional `"./package.json"`. No `browser` condition needed — the same file serves both runtimes for `.`.

**Asymmetry worth documenting rather than fixing:** `src/index.js` is universal (Node and browser); the element file is browser-*only*, since it references `HTMLElement`/`customElements`.

**Snapshot rebase impact is exactly 2 of 48** — orchestrator-verified by direct count: 46 file snapshots (45 SVG + 1 JSON) plus 2 `.snap` files. The two JSON-shaped artifacts rebase; the 46 SVG-shaped ones do not. Two test files need hand-edits to hardcoded key-order assertions.

### Critical Pitfalls

1. **Scoped packages publish private by default** — set `publishConfig.access: "public"` *and* pass `--access public`.
2. **npm publish is effectively permanent** — 72-hour conditional unpublish window, 24-hour name lock after full unpublish, versions never reusable. The five-step ladder (`pack --dry-run` → tarball scratch-install → `publish --dry-run` → `publish --tag next` → promote to `latest`) is PKG-01's acceptance criterion, not a suggestion.
3. **License/metadata drift is real, not hypothetical** — `package.json` says `ISC`, PROJECT.md targets MIT, and no `LICENSE` file exists anywhere in the repo. Orchestrator-confirmed.
4. **`npm link` is disqualified as the smoke test** — it symlinks the working tree, masking precisely the `files`/`exports` misconfigurations the test exists to catch. Use `npm pack` plus a scratch-directory install.
5. **Zero-dependency drift can hide behind a green `dependencies: {}`** if a bundler inlines runtime helpers. Only a `prepublishOnly` gate plus a tarball-install `node_modules`-emptiness check verify *installed reality* rather than *declared intent*.
6. **Version-stamping is the most likely silent determinism regression** — see the resolved contradiction above.
7. **Stale citation in shipped code** — `src/data/kamea.js:26` cites "Pitfall 1" from the v1.0 `PITFALLS.md`, whose content at that path is now v1.1 research. The v1.0 content is preserved at `.planning/milestones/v1.0-research/`, so nothing is lost, but a code comment now points at a document saying something different. This is the same failure mode the v1.0 retrospective named as a top lesson: a citation that looks verified but points at changed content. Small, real, in scope.

### Carried-Forward Verification Lesson

The v1.0 retrospective's top finding applies directly to WRAP-01: **structural tests verify wiring, not appearance.** Both real v1.0 defects passed a fully green suite and were caught by a human looking at rendered output. A web component whose tests assert "the element registers and reflects attributes" would pass while rendering nothing visible. WRAP-01's verification must include actually rendering it in a browser and looking — the project already has the Playwright harness from Phase 3's theming test.

## Implications for Roadmap

### Wave Structure

**Wave 1 — fully parallel, zero file overlap:**
- PKG-02 (kamea-set version) — no dependencies
- `--title` CLI flag — no dependencies
- Claude Code skill content authoring — gated on Matt's correspondences

**Wave 2 — sequential:**
- PKG-01 (npm publish + smoke test + license/metadata fixes)
- WRAP-01 (web component) — soft prerequisite on PKG-01's settled `package.json`

Only `package.json` is shared, between PKG-01 and WRAP-01, and even there the overlap is additive (different keys). **This is a real departure from v1.0**, where every phase was strictly sequential because all plans touched `src/render/svg.js` and `src/generate.js`.

### Human-Blocking Steps

1. **`npm login`** — interactive, cannot be automated. Blocks the publish itself.
2. **Planet correspondences** — Matt's lineage knowledge. Blocks skill implementation, not skill scaffolding.

### Research Flags by Phase

- **Needs deeper research:** skill content-capture format (discuss-phase); bundling *if* ever chosen.
- **Standard patterns, skip research:** PKG-02 (direct D-02 follow-on), `--title` (existing flag pattern), PKG-01 (settled npm practice).

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Versions verified live against the npm registry, not recalled |
| Features | MEDIUM–HIGH | npm/CLI conventions stable; **Agent Skills format is young and may still shift**; Shadow DOM claims converge across sources but were not re-verified against WHATWG spec text |
| Architecture | HIGH | Exhaustive `src/` audit; three-source convergence on the build-step question; snapshot counts verified directly |
| Pitfalls | HIGH / MEDIUM | npm mechanics from official docs; project-specific claims from direct source reads; unpublish-window policy specifics sourced via web search rather than a fetched policy page |

**Overall: HIGH**, with the two MEDIUM caveats carried forward honestly rather than laundered into certainty.

## Gaps to Address

1. **Planet correspondences** — explicit human capture at discuss-phase.
2. **Web-component attribute naming** — `title` collides with the global HTML `title` attribute (renders a tooltip). Needs a distinct name; a design decision, not a research question.
3. **Kamea-version scheme** — semver-style (`'1.0.0'`) versus a provenance-date stamp tied to the D-04 sign-off. The seam accepts either; naming is a discuss-phase call.
4. **Skill drift-check** — a mechanical test that the skill's documented flags still match the CLI's real surface. Should ship in the same phase as the skill.
5. **Optional bundled convenience artifact** for WRAP-01 — technically unblocked, product decision unresolved.
6. **Stale `src/data/kamea.js:26` citation** — see Pitfalls.

## Sources

- `.planning/research/STACK.md` — npm publishing and provenance mechanics, smoke-test pattern, buildless web component viability, devDependency additions, constraint-violation callouts. Versions verified live via `npm view`.
- `.planning/research/FEATURES.md` — table stakes / differentiators / anti-features across all five features, Shadow DOM decision section, feature dependency graph, prioritization matrix.
- `.planning/research/ARCHITECTURE.md` — browser-safety audit, exports-map design, kamea-version seam, `--title` threading, file-conflict-grounded build order.
- `.planning/research/PITFALLS.md` — 12 pitfalls across npm first-publish mechanics, irreversibility, web-component registration/timing/theming/XSS, determinism regression, skill authoring, and zero-dependency drift.
- Orchestrator direct verification (2026-08-07): `grep -rn "node:" src/` (browser-safety), `src/generate.js:280` and `src/render/json.js:94` (`kameaSet` already shipping), snapshot inventory count, absence of any `LICENSE` file, `gh auth status`, repo creation at `github.com/mstine/sigil-spinner`.
- Prior milestone context: `.planning/milestones/v1.0-research/` (v1.0 research, archived), `.planning/RETROSPECTIVE.md` (v1.0 lessons, especially the structural-tests-verify-wiring finding).

---
*Synthesized 2026-08-07 for milestone v1.1 Distribution.*
