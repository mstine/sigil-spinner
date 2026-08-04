<!-- GSD:project-start source:PROJECT.md -->

## Project

**Sigil Spinner**

A Node CLI + importable library that generates planetary sigils from intention statements using the traditional Western esoteric method: strike vowels and repeating letters, encode the remainder through the Pythagorean Number Table, and trace the resulting number sequence across the chosen planet's kamea (magic square). Output is fully CSS-stylable inline SVG plus a JSON "working" — built so Claude Code can invoke it during website builds and embed living sigils directly into pages it creates for Matt.

**Core Value:** Given any intention statement and any of the seven classical planets, the tool deterministically produces a correct, traditionally-constructed sigil as embeddable, fully CSS-stylable SVG.

### Constraints

- **Tech stack**: Node.js, no runtime dependencies for the embed artifact — output is plain inline SVG; the generator itself should stay light
- **Output**: SVG must be self-contained (no external refs), viewBox-based, and stylable purely via CSS classes and custom properties
- **Correctness**: Kamea layouts and the Pythagorean table are canonical — they must match the traditional sources exactly, no "close enough"
- **Consumer**: CLI interface must be scriptable/composable (stdout-friendly) so Claude Code and build pipelines can pipe output

<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->

## Technology Stack

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Node.js | `>=20.0.0` (target/test on 22 & 24) | Runtime | `node:util.parseArgs` has been stable since Node 20 (experimental from 18.3); Node 22 is current Maintenance LTS and Node 24 is current Active LTS as of Aug 2026, with Node 26 entering LTS Oct 2026. `>=20` is the right floor — old enough to be nearly ubiquitous, new enough that every built-in this stack leans on is stable. |
| `node:util.parseArgs` (built-in) | ships with Node | CLI argument parsing | Zero dependency, stable since Node 20. This CLI's surface is one verb (`generate`) plus a handful of flags (`--planet`, `--curve`, `--grid`, `--glyph`, `--out`) — exactly the shape the ecosystem now agrees `parseArgs` is sufficient for; frameworks "earn their place" only once you need subcommands, generated `--help`, or shell completion. None of that applies yet. |
| Hand-rolled SVG string templating (internal module, no package) | n/a | SVG generation | The output is deterministic markup built from known geometry (kamea cell coordinates, path commands) — this is string templating with escaping, not DOM manipulation. No library beats a small internal `buildSvg()`/`el()` helper for this: zero dependency weight, zero abstraction mismatch, full control over attribute ordering (matters for stable snapshot tests). |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None (hand-rolled Catmull-Rom → cubic-Bézier conversion) | n/a | Curved/smoothed path variant | **Primary recommendation.** The uniform Catmull-Rom → cubic-Bézier conversion is a well-documented, ~30-line, dependency-free algorithm. Writing it in-repo gives full control over floating-point formatting/rounding, which matters because the project's core value is byte-for-byte determinism across runs — a library's internal precision choices become an invisible external dependency on your snapshot tests otherwise. |
| `d3-path` | `3.1.0` | Serializes `CanvasPathMethods` calls (`moveTo`, `lineTo`, `bezierCurveTo`, …) to an SVG path-data string, no DOM required | Fallback if the hand-rolled Bézier math proves more fragile than expected, or if a contributor prefers a battle-tested primitive over custom math. Confirmed via registry + docs: `d3-path`'s whole purpose is exactly "build an SVG `d` string without a DOM," so if you do reach for a library, this (not `svg.js`) is the correct one. |
| `d3-shape` | `3.2.0` | Provides `curveCatmullRom` (and other curve interpolators) on top of `d3-path`/a line generator | Only pull this in alongside `d3-path` if you want `curveCatmullRom.alpha(0.5)` (centripetal Catmull-Rom, the variant least prone to loops/cusps) instead of hand-rolling. Import `d3-shape` and `d3-path` directly by name — never the `d3` meta-package (`7.9.0`), which bundles ~30 unrelated modules (scales, axes, force layout, etc.) you will never touch. |
| `commander` | `15.0.0` | Full CLI framework: subcommands, auto-generated `--help`, coercion, completion | Not needed for v1. Reconsider only if the CLI grows a second verb (e.g. `sigil validate`, `sigil kamea list`) or you want generated `--help`/man-page output for the standalone-practitioner audience mentioned in Context. If adopted, pair with `@commander-js/extra-typings` (`15.0.0`) for typed option parsing under the JSDoc/TS-checked approach below. |
| `vitest` | `4.1.10` | Test runner with built-in snapshot testing | Dev-only dependency (never ships in the published package). This is the one place a "library" belongs in the stack even under a minimal-dependency bias: the project's core value ("same input → same sigil, byte for byte") is *directly* testable via Vitest's `toMatchSnapshot()`/`toMatchFileSnapshot()` against the generated SVG string and JSON working. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| JSDoc + `tsc --checkJs` (TypeScript as a dev-only type-checker, not a compiler) | Type safety without a build step | Run `tsc --allowJs --checkJs --noEmit` (or `--emitDeclarationOnly` to also produce a `.d.ts`) against plain `.js` source annotated with JSDoc `@param`/`@returns`/`@typedef`. Gives editor autocomplete and CI type-checking — which matters because the primary consumer is Claude Code invoking this library programmatically and benefits from accurate types — without adding a compile/bundle step to a tool whose whole point is being trivially invocable. TypeScript itself is at `7.0.2` (the native Go-ported compiler, ~8–12x faster than the old `tsc`), so even the `--checkJs` pass is now fast. |
| Vitest snapshot testing | Regression-proof deterministic output | Snapshot both the raw SVG string and the JSON "working" per test case (one intention × each of the 7 planets, plus curve/straight and grid on/off variants). `node:test` (built into Node) was considered and rejected for this specifically because it has no native snapshot-testing support as of this research — you'd be hand-rolling snapshot diffing, which defeats the point. |
| Prettier | Source formatting only — **never** run on generated SVG output | `3.9.6`. Format the repo's own `.js`/`.md`/`.json` files. Do not pipe generated SVG through Prettier or any formatter at runtime — formatting must not become a hidden source of output drift between environments. |
| ESLint | Lint the hand-rolled JS source | `10.8.0`+ (flat config). Standard hygiene; not load-bearing for this research but worth pinning early since there's no build step to catch errors otherwise. |

## Installation

# Runtime dependencies

# — none required for the default (straight-segment) path —

# If you adopt the d3 fallback for curve smoothing instead of hand-rolling:

# Dev dependencies

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|--------------------------|
| Hand-rolled SVG string builder | `@svgdotjs/svg.js` (`3.2.8`) | Never for this project. `svg.js` is designed to manipulate a live DOM/SVG document (browser, or `jsdom`/`linkedom` in Node) — it exists to *mutate* an SVG element tree interactively, not to emit a static string. Using it here means carrying a DOM-emulation dependency purely to string-serialize something you already know the final shape of. |
| Hand-rolled SVG string builder | `svg-builder` (`3.0.4`) | If you specifically want a typed fluent builder API over raw template literals and don't mind the extra dependency for what's ultimately still just string concatenation with escaping. Marginal value here — the kamea/path geometry is generated by your own code either way, so the builder saves little. |
| `node:util.parseArgs` | `commander` (`15.0.0`) / `yargs` (`18.1.0`) | Once the CLI needs subcommands, auto-generated `--help` text, shell-completion scripts, or coercion/validation pipelines beyond simple flags. `yargs` in particular is heavier and more middleware-oriented than this project needs; if you do graduate past `parseArgs`, `commander` is the better fit given its smaller surface and closer match to a single-verb-plus-flags CLI. |
| Hand-rolled Catmull-Rom → Bézier | `d3-path` + `d3-shape` | If custom spline math turns out more error-prone in practice than expected, or a contributor strongly prefers a well-tested library curve interpolator over in-repo math. Import the two modules directly (`3.1.0` / `3.2.0`), never the `d3` meta-package. |
| JSDoc + `tsc --checkJs` (no build step) | Full TypeScript source + `tsup`/`esbuild` bundler | If the project later ships as a larger multi-file package with a real public API surface where hand-authoring a `.d.ts` becomes error-prone, or if strict TS features (discriminated unions, branded types for e.g. `PlanetId`) become load-bearing enough that JSDoc's syntax gets awkward. `tsup` (`8.5.1`) is the right bundler choice if you cross that bridge — it wraps esbuild with sane dual-format defaults. |
| ESM-only packaging | Dual ESM+CJS via `exports` conditions | Only if a consumer specifically needs `require()` (e.g. an older internal tool that hasn't migrated). Dual-publishing means either a build step (bundler) or hand-maintained `.cjs`/`.mjs` pairs, plus the dual-package hazard (two module instances if both formats get loaded in the same process). Given the primary consumer (Claude Code / modern build pipelines) is ESM-native, this complexity isn't earned yet. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|--------------|
| `svg.js`, `d3-selection`, or any DOM-manipulation SVG library | These require a DOM to attach to — in Node that means pulling in `jsdom` (`30.0.1`) or `linkedom` (`0.18.13`) as a transitive dependency just to have something to call `.appendChild()` on. That's tens of KB of DOM emulation in service of producing a string you could template directly. | Hand-rolled string templating, or `d3-path`/`d3-shape` if you specifically want curve-interpolation math (they render to a string/context, no DOM involved). |
| The `d3` meta-package | Importing `d3` (`7.9.0`) pulls in ~30 modules — scales, axes, force simulation, geo projections, zoom/drag behavior, none of which this project touches. | Import `d3-path` and `d3-shape` directly by name if you need them at all. |
| `commander`/`yargs` as a day-one dependency | The CLI has one verb and a handful of flags — a full CLI framework is solving a problem this project doesn't have yet, and adds a runtime dependency the project's own constraints explicitly want to avoid. | `node:util.parseArgs` (built-in, zero dependency, stable since Node 20). |
| Full TypeScript compilation + bundler (`tsc` emitting JS, or `tsup`/`esbuild`) for v1 | Adds a build step and a `dist/` output to a tool whose core value proposition is being trivially invocable by Claude Code / build pipelines. A build step means "the source isn't what runs," which is friction for a project this size. | Plain ESM `.js` with JSDoc types, checked (not compiled) by `tsc --checkJs`. |
| `svgo` as a runtime/default dependency | SVGO exists to optimize *designer-exported* SVG (Illustrator/Figma cruft — redundant groups, editor metadata, excessive precision). This tool emits already-lean, hand-authored markup from known geometry; there's nothing to clean up by default, and running an optimizer over deterministic output risks the optimizer's own version becoming a silent second source of output drift between environments. | Nothing, by default. If a `--minify` convenience flag is wanted later, wire `svgo` (`4.0.2`) in as an explicit opt-in, documented as changing output determinism guarantees when enabled. |
| Prettier/any formatter applied to generated SVG at runtime | Formatting output at runtime is an invisible dependency on formatter version/config for a project whose entire point is byte-identical reproducibility. | Format the source code, never the generated artifact. Control output formatting entirely inside the SVG-building code itself. |

## Stack Patterns by Variant

- Migrate from `node:util.parseArgs` to `commander@^15`
- Because `parseArgs` has no concept of subcommands or auto-generated per-command help — you'd be reimplementing a dispatcher by hand at that point, which is exactly what a CLI framework is for.
- Switch to `d3-shape`'s `curveCatmullRom.alpha(0.5)` (centripetal parameterization) via `d3-path`
- Because centripetal Catmull-Rom is specifically the parameterization that avoids self-intersection/cusp artifacts that uniform (alpha=0) parameterization is prone to on paths with sharp direction changes — which is exactly what kamea traversal paths (jumping around a grid) will produce.
- That's a separate package/app consuming this one as a library — it does not change anything in this stack. Keep the core generator dependency-free regardless of what UI layer eventually wraps it.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|------------------|-------|
| `node:util.parseArgs` | Node `>=20.0.0` (stable); Node `>=18.3.0` (experimental, flagged) | Do not target below Node 20 unless you explicitly want to support the experimental-flag era. |
| `d3-path@3.1.0` | `d3-shape@3.2.0` | Both are part of the D3 v7/v9-era modular split; install matching majors — do not mix a v3 `d3-path` with a `d3-shape` from a different D3 major, the `Context` interface between them can shift across majors. |
| `vitest@4.1.10` | Node `>=20.0.0` | Vitest 4.x targets modern Node/ESM; no CJS story needed here since the whole stack is ESM-only. |
| `typescript@7.0.2` (`tsc --checkJs`) | Plain `.js` + JSDoc | TS 7 is the now-stable native (Go-compiled) compiler line — `--checkJs` type-checking is meaningfully faster than the pre-7.0 JS-hosted `tsc`, which matters if this becomes a CI gate. |

## Sources

- Direct npm registry lookups (`npm view <pkg> version`) for all version numbers cited above — HIGH confidence, this is the authoritative source for "what's currently published," not an interpreted/secondary claim.
- Web search, cross-checked across multiple independent results — MEDIUM confidence — for: `node:util.parseArgs` stability timeline and parseArgs-vs-commander guidance; `d3-path`/`d3-shape` server-side (no-DOM) SVG path generation pattern; Vitest-vs-`node:test` snapshot-testing capability gap; TypeScript 7.0 native-compiler GA status; Node.js LTS schedule as of Aug 2026; ESM `bin`/shebang cross-platform CLI packaging practice.
- [TypeScript 7.0 RC announcement — Microsoft DevBlogs](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0-rc/)
- [Node.js — Evolving the Node.js Release Schedule](https://nodejs.org/en/blog/announcements/evolving-the-nodejs-release-schedule)
- [d3-path — npm](https://www.npmjs.com/package/d3-path)
- [d3-shape curve docs — d3/d3 GitHub](https://github.com/d3/d3/blob/main/docs/d3-shape/curve.md)
- [node:test vs Vitest vs Jest 2026 — PkgPulse Guides](https://www.pkgpulse.com/guides/node-test-vs-vitest-vs-jest-native-test-runner-2026)
- [Simplify Command-Line Argument Parsing with Node.js util.parseArgs() — Schalk Neethling](https://schalkneethling.com/posts/simplify-command-line-argument-parsing-with-nodejs-util-parseargs/)
- [TypeScript in 2025 with ESM and CJS npm publishing is still a mess — Liran Tal](https://lirantal.com/blog/typescript-in-2025-with-esm-and-cjs-npm-publishing)

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
