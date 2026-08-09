# Sigil Spinner

## What This Is

A Node CLI + importable ESM library that generates planetary sigils from intention statements using the traditional Western esoteric method: strike vowels and repeating letters, encode the remainder through the Pythagorean Number Table, and trace the resulting number sequence across the chosen planet's kamea (magic square). Output is fully CSS-stylable inline SVG plus a JSON "working" — built so Claude Code can invoke it during website builds and embed living sigils directly into pages it creates for Matt.

**Shipped v1.0 on 2026-08-07** — all seven classical planets, curve/grid/glyph layers, multi-embed safety, a documented determinism contract. **Shipped v1.1 on 2026-08-09** — the tool left the repo: published to npm as `@falkensmage/sigil-spinner` with a verifiable provenance attestation, wrapped as a `<sigil-spinner>` custom element, and made discoverable to any Claude Code session through a personal skill that carries Matt's own planet correspondences. Still zero runtime dependencies.

## Current State

**Version:** v1.1 Distribution (shipped 2026-08-09) — see [`MILESTONES.md`](MILESTONES.md)
**Status:** `npm install @falkensmage/sigil-spinner` resolves to `1.1.0` from the public registry, attested, with zero transitive dependencies.

| | |
|---|---|
| Published | `@falkensmage/sigil-spinner@1.1.0`, MIT, `latest` and `next` both at 1.1.0, Sigstore provenance attestation verified |
| Codebase | ~9,460 LOC JavaScript across `src/`, `bin/`, `test/`, `scripts/` — 2,738 in `src/` + `bin/` |
| Tests | 1,532 passing across 25 files, plus a separate pack-and-scratch-install smoke suite (`npm run test:pack`) |
| Type safety | JSDoc + `tsc --allowJs --checkJs --noEmit`, exit 0 (still no build step) |
| Runtime dependencies | none (`dependencies` absent) — dev-only: vitest, typescript, eslint, prettier, playwright |
| Public surface | `generateSigil`, `SigilError`, five `E_*` constants; CLI `sigil-spinner`; **`./element`** custom-element subpath |
| Distribution | npm registry · GitHub Actions release workflow (`workflow_dispatch`, provenance) · personal Claude Code skill at `~/.claude/skills/sigil/` |
| Node floor | `>=20` (`node:util.parseArgs` stable) |

**Where it stands:** both halves of the original intent are now real. The generator is correct and byte-deterministic (v1.0), and it is reachable — a Claude Code session in any directory can `npx` it without being told the tool exists, and a page can drop in an element that the page's own CSS fully controls. What is *not* done is the assurance sweep: only Phase 6 has a security pass, and phases 5, 7, and 8 carry seventeen open low-severity review items.

## Next Milestone — candidates, not commitments

No v1.2 scope is committed. The live candidates, in rough order of pull:

- **Finish the security sweep** — `/gsd-secure-phase` on 5, 7, and 8. Phase 6's retroactive pass found two real defects in the release workflow, which is the argument for doing the other three rather than assuming they are clean.
- **Trusted Publishing (OIDC)** — [issue #1](https://github.com/mstine/sigil-spinner/issues/1). The `1.0.0` publish needed a token because OIDC cannot bootstrap a first publish; that constraint is gone now. Outside bound is npm's ~January 2027 removal of direct-publish for 2FA-bypassing credentials.
- **Teach the skill the element** — the skill now names both embedding paths but still only walks through inline SVG. Extending it needs a drift guard alongside, or it goes stale the way the boundary statement did.
- **WRAP-04 hosted web UI** and **MCP-01** — both still deferred, both with their v1.1 reasoning intact.

## Core Value

Given any intention statement and any of the seven classical planets, the tool deterministically produces a correct, traditionally-constructed sigil as embeddable, fully CSS-stylable SVG.

**Still the right priority after shipping.** Nothing in v1.0 displaced it. If anything, the milestone sharpened *which half carries the weight*: correctness and determinism were the expensive parts (kamea provenance, the Chaldean-immune encoder, 48 byte-pins), and "embeddable" turned out to be mostly a CSS-discipline problem — one that failed exactly once, at `font-size`, and was caught by a human looking at a page rather than by any test.

## Requirements

### Validated

**v1.0 MVP — all 21 v1 requirements satisfied.** Full traceability in [`milestones/v1.0-REQUIREMENTS.md`](milestones/v1.0-REQUIREMENTS.md); independent audit in [`milestones/v1.0-MILESTONE-AUDIT.md`](milestones/v1.0-MILESTONE-AUDIT.md).

- ✓ **Construction** — statement in, vowels and repeats struck (first occurrence kept, order preserved), remainder encoded via a cycling-formula Pythagorean table; degenerate and non-ASCII inputs handled by documented deterministic rules — v1.0
- ✓ **Kamea** — all seven classical grids (Saturn 3×3 → Moon 9×9) hard-coded from a cited source, magic-sum verified, provenance documented honestly rather than overclaimed; any planet selectable via direct 1–9 cell mapping — v1.0
- ✓ **Path** — ordered traversal with start/end markers and traditional loop markers on *consecutive* repeats, expressed as a renderer-agnostic PathModel consumed identically by SVG and JSON — v1.0
- ✓ **Rendering** — self-contained viewBox SVG with semantic classes; straight default and opt-in curves; CSS-revealable grid layer; opt-in glyph layer; 15 `--sigil-*` custom properties with no `style=` attributes; deterministic id namespacing for multi-embed — v1.0
- ✓ **Output** — complete JSON working (letters kept, number sequence, cell coordinates, render block) from the same call, guaranteed consistent with the SVG, and round-trippable back into `generateSigil` — v1.0
- ✓ **Interface** — importable ESM library and thin CLI wrapper, byte-identical output between them, with all validation owned by the library — v1.0

<details>
<summary>Per-phase validation detail (v1.0)</summary>

Phase 1 — First Sigil, End to End: statement input; vowel/repeat striking; Pythagorean encoding; kamea traversal (Saturn exercised, all seven locked); JSON working; CLI; library import; semantic-class inline SVG.

Phase 2 — Every Planet, Every Statement: all seven planets byte-pinned at orders 3 through 9; cell-anchored loop markers on consecutive repeats only; degenerate and non-ASCII statements yielding either a trustworthy sigil or a clear actionable error identically from both surfaces; documented letter-handling rules including what is deliberately *not* folded.

Phase 3 — Themeable, Embeddable Layers: hand-rolled centripetal Catmull-Rom → cubic Bézier curves with construction provably unchanged between modes; grid layer always emitted at `opacity: 0` and revealed by one CSS declaration; opt-in glyph layer (seven cited code points, U+FE0E-suffixed for deterministic text presentation); 15 `--sigil-*` properties each with an inline default, guarded against README drift and verified to *resolve* in a real browser.

Phase 4 — v1.0 Tech Debt Closeout (no new v1 requirements; contract and documentation debts from the audit): `working.render` round-trips and typechecks with no cast (D-49/D-50); CLI rejects extra positionals with `E_CLI_USAGE` (D-51); README documents the full fifteen-field working plus both CLI-local diagnostic codes (D-52/D-53); planet identity validated before statement content so `E_UNKNOWN_PLANET` is no longer masked (D-54); all five `E_*` constants importable from the package root with the CLI exit map keyed from them (D-55); Phase 2 SUMMARY frontmatter backfilled (D-56).

</details>

**v1.1 Distribution — all 14 requirements satisfied (2026-08-09).** Full traceability in [`milestones/v1.1-REQUIREMENTS.md`](milestones/v1.1-REQUIREMENTS.md); independent audit in [`milestones/v1.1-MILESTONE-AUDIT.md`](milestones/v1.1-MILESTONE-AUDIT.md).

- ✓ **Packaging (PKG-01…05)** — published to the public registry as `@falkensmage/sigil-spinner`, MIT, complete metadata with a case-exact `repository.url`, published *by a GitHub Actions workflow* rather than from a laptop, carrying a Sigstore provenance attestation from its first byte. A repeatable pack-and-scratch-install smoke test proves the tarball from outside its own boundary — `npm link` was explicitly disqualified for symlinking the working tree and masking exactly the `files`/`exports` faults the test exists to catch — v1.1 (Phase 6)
- ✓ **Embedding (WRAP-01…03)** — `<sigil-spinner statement="…" planet="…">` renders as plain ESM with no build step, into light DOM so page CSS reaches it through both `--sigil-*` properties *and* semantic class selectors, re-rendering on attribute change with multiple instances independent and id-free. Verified in real Chromium and, decisively, by a human looking at a rendered page — v1.1 (Phase 7)
- ✓ **Discoverability (SKILL-01…03)** — a personal skill makes the tool findable to any cold Claude Code session, carrying Matt's own ratified planet correspondences so the planet is a reasoned choice with the reasoning stated, never a question bounced back. Bound to the CLI by a bidirectional drift guard. Confirmed by an actual cold-session run, not by proxy — v1.1 (Phase 8)
- ✓ **Interface + source correctness (INT-05, INT-06, MAINT-01, PKG-02)** — see the Phase 5 detail below — v1.1 (Phase 5)

<details>
<summary>Phase 5 detail — Publish-Ready Source (2026-08-08)</summary>

Four requirements, verified 5/5 must-haves.

- ✓ **PKG-02** — the JSON working carries `kameaVersion` alongside `kameaSet`, from a static in-source constant, so a working saved today still names the exact data that produced it and byte-identical output holds between the dev tree and an installed package — Phase 5 (05-02)
- ✓ **INT-05** — `--title` reaches the CLI, closing the last library/CLI parity gap left open in v1.0; no option is now reachable from one surface and not the other — Phase 5 (05-03)
- ✓ **INT-06** — a title plus an id prefix wires the SVG's accessible name via `aria-labelledby` automatically, so assistive technology resolves it with no hand-authored ARIA from the embedder — Phase 5 (05-03)
- ✓ **MAINT-01** — every citation in shipped source resolves to a document that still says what the citation claims, enforced by a mechanical checker so the rot cannot recur silently on the next research refresh. The checker's own R1 rule was then proven unsound by code review (a blank excerpt satisfied it vacuously; a ±200-char window let one citation's excerpt back a different citation's token) and repaired in a dedicated gap-closure plan — Phase 5 (05-01, 05-04)

</details>

### Active

**Nothing committed.** v1.1 closed its full requirement set; v1.2 scope is unplanned. Candidates are listed under *Next Milestone* above.

Closed as a defect, outside the requirement set:

- [x] **The `SigilError` contract held everywhere except five reachable inputs** — closed 2026-08-08 by quick task [`260808-lu1`](quick/260808-lu1-fix-the-null-options-sigilerror-bug/). Phase 5's code review reported one instance (`generateSigil(s, p, null)` throwing a raw `TypeError`, because a `= {}` default parameter never applies to an explicitly-passed `null`); the fix audit found four more, and the four were worse in kind — a BigInt or circular value in either the options bag or the statement crashed `JSON.stringify` *inside the `SigilError` constructor*, so the library's own diagnostic machinery was the thing violating the diagnostic contract. All five now resolve correctly: `null` options coerces to absent per D-49/D-50 (so omitted, `null`, and `{}` produce byte-identical output), and every other case throws a proper `SigilError` with an existing code. A present-but-non-object bag, previously accepted silently and resolved to all-defaults, now gets `E_INVALID_OPTION`. No new `E_*` code. Origin traced to Phase 1 (`6336c67`) — pre-existing, not a Phase 5 regression, which is why it was never absorbed into Phase 5's scope.

Deferred beyond v1.1:

- [ ] **WRAP-02** — Hosted web UI layered on the stable library.
- [ ] **MCP server** — stdio wrapper exposing `generateSigil` to Claude Desktop. Deliberately excluded from v1.1: the primary consumer is Claude Code in build contexts, where `npx` plus a skill covers it with less machinery. Revisit if the Desktop want proves real. If built, it must live in a **separate package** — adding `@modelcontextprotocol/sdk` to this one would break the zero-dependency guarantee.

### Out of Scope

Audited at v1.0 close — all reasons still hold, with two sharpened by what shipping revealed:

- **Web app / hosted UI** — primary consumer is Claude Code during site builds. Still true, but now a *deferred candidate* (WRAP-02) rather than a refusal: the library is stable enough to layer on.
- ~~**Web component wrapper**~~ — **no longer out of scope.** Inline SVG covered the embed case for v1, and Phase 3 proved multi-embed safety without an element. Promoted into v1.1 as WRAP-01.
- **Non-classical planets (Uranus/Neptune/Pluto), non-planetary squares, other numerological tables** — no canonical Agrippa-lineage kamea exists for them. Reason strengthened by Phase 1: the provenance work showed how hard honest sourcing is even for the seven that *do* have a lineage.
- **Scaled/multi-digit number-to-cell mapping** — live methodological dispute; direct 1–9 mapping chosen deliberately. Phase 2 confirmed the payoff: planet character genuinely does come from cell geometry, visibly, across all seven.
- **Rose Cross / circular sigil layout** — different geometry and construction rules; a separate method, not a kamea variant.
- **Raster output (PNG etc.)** — SVG is the artifact; rasterization is the consumer's problem and conflicts with the zero-dependency constraint.
- **Real-time interactive preview** — no UI layer exists, and generation is fast and deterministic enough that any future UI can trivially fake it.

## Context

- Matt is a practicing symbolic worker (tarot, astrology, ritual) — the construction method must be traditionally correct, not approximated. The lineage is the Agrippa-style planetary kamea approach filtered through the common modern letter-elimination + Pythagorean reduction technique.
- The seven kameas: Saturn 3×3, Jupiter 4×4, Mars 5×5, Sun 6×6, Venus 7×7, Mercury 8×8, Moon 9×9. Cells 1–9 exist in every kamea, so direct digit-to-cell mapping works universally; the visual character of each planet's sigil comes from where those cells sit in its square.
- Primary consumer is Claude Code building websites for Matt (Falkens Labyrinth / brand work) — the tool must be trivially invocable from a build context and its output trivially embeddable. "Both, mine first": built for Matt's sites, shaped so other practitioners can use it later.
- Determinism matters: same statement + planet + options → identical sigil. Sigils as reproducible design elements, not random art.
- Lives in `~/RitualSync/sigil-spinner` — part of the RitualSync constellation.

**Known state carried past v1.0** (documented, not defects):

- **Curve overshoot on one input.** `sun` + "I WILL SUCCEED" in curve mode puts a Bézier control point at `y = -0.916`, just past the viewBox top edge — real centripetal Catmull-Rom behavior on a ~180° reversal. Documented in the README, deliberately not clamped (clamping is a curve-shape design decision). Visually confirmed acceptable at UAT.
- **Glyph font coverage.** Rendering depends on the viewer's font stack covering U+2600–26FF; no code-level fallback by design, since an embedded font would violate the zero-dependency constraint. Mitigated by `--sigil-glyph-font` and a README disclosure.
- **The suite needs a browser.** `test/browser/theming-resolution.test.js` requires a one-time `npx playwright install chromium` and fails loudly rather than skipping — deliberate, but a fresh clone or CI runner must install it first.
- Three low-severity items deferred with written reopen conditions (`E_CLI_STDIN` test coverage, a `perpendicularUnit` doc comment, a `D-12` ID collision) — see `MILESTONES.md`.

**Known state carried past v1.1** (documented, not defects):

- **Assurance is uneven across the milestone.** Only Phase 6 has a SECURITY.md. Phases 5, 7, and 8 were never threat-modelled, and seventeen low-severity review items are confirmed still open against the current tree. None contradicts a requirement; all are catalogued in `milestones/v1.1-MILESTONE-AUDIT.md`.
- **The release credential is a carried risk.** `NPM_TOKEN`'s scope and expiration are unrecorded and unverifiable from the repo, and the planned "narrow it to a single package" follow-up was never done. Accepted as R-06-02 with a written retirement path at [issue #1](https://github.com/mstine/sigil-spinner/issues/1), bounded by npm's ~January 2027 deadline.
- **The publish is two rungs, and the second is not optional.** npm seeds `latest` only on a package's *first* publish. Every subsequent version published with `--tag next` leaves `latest` behind until a promote runs — so "published" and "what a bare `npm install` gets" are different facts, and the second needs checking.
- **The skill names the element but does not teach it.** `skill/SKILL.md`'s Published-Surface Boundary now correctly describes both embedding paths, but the walked-through checklist still covers inline SVG only, pointing at the README for element usage. Deliberate: a documented element surface in the skill needs its own drift guard, and that was not built.
- **`examples/element.html` ships in the repo, not the tarball.** The human-verification instrument is real and was used, but a consumer installing from npm does not get it.

## Constraints

Unchanged through v1.0; all four held without needing an exception:

- **Tech stack**: Node.js, no runtime dependencies for the embed artifact — output is plain inline SVG; the generator itself should stay light. *Held: `dependencies: {}` at ship, including the curve math, which was hand-rolled rather than pulling `d3-shape`.*
- **Output**: SVG must be self-contained (no external refs), viewBox-based, and stylable purely via CSS classes and custom properties. *Held, with one near-miss — see the `font-size` decision below.*
- **Correctness**: Kamea layouts and the Pythagorean table are canonical — they must match the traditional sources exactly, no "close enough". *Held, and the honest version of it: provenance is documented at exactly the strength it was verified, no more.*
- **Consumer**: CLI interface must be scriptable/composable (stdout-friendly) so Claude Code and build pipelines can pipe output. *Held: artifact to stdout, diagnostics to stderr, distinct exit codes for usage vs. derivation failures.*

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| CLI + library, no UI for v1 | Primary consumer is Claude Code in build contexts; UI adds surface without serving the core use | ✓ Validated in Phase 3 — the full option surface (`curve`, `glyph`, `idPrefix`, `title`) is reachable identically from both, with validation owned by the library so programmatic callers get the same guarantees |
| Inline SVG with semantic classes (no web component) | Zero-dependency, embeds anywhere, maximally CSS-stylable; wrapper can layer on later | ✓ Validated in Phase 3 — 26 sigils co-embedded in one page restyled entirely from CSS, zero id collisions, zero `style=` attributes |
| Direct 1–9 cell mapping on all kameas | Traditional for letter-value work; every kamea contains cells 1–9; planet character comes from geometry | ✓ Validated in Phase 2 — all seven kameas traced and byte-pinned |
| Straight segments default, curves behind a flag | Classic angular sigil is the canonical form; per-site character via config, not forked logic | ✓ Validated in Phase 3 — `curve` defaults false and straight output stayed byte-identical; curve changes only the `sigil-path` `d`, never marker geometry |
| Emit JSON working alongside SVG | Claude needs structured data for embedding decisions; also enables teaching/explanation pages | ✓ Validated in Phase 2 — fixed key order, byte-identical across runs; round-trippable as of Phase 4 |
| Vertical MVP slices, not horizontal layers | Kamea correctness is the highest-cost failure; lock it end to end before anything downstream trusts it | ✓ Good — the riskiest data was source-verified and human-signed-off in Phase 1 plan 01, and never needed revisiting. Widening in Phases 2–3 never forced a redesign of the spine. |
| Lock all seven kameas in Phase 1 though only Saturn is exercised | Data correctness is the one thing that cannot be fixed cheaply later | ✓ Good — Phase 2's seven-planet widening was mechanical, and the audit's provenance review had a single artifact to check |
| Accept honest partial provenance (D-04, `approve-candidate`) rather than delay for physical sources | Magic-sum verified on all seven, second-source cross-checked on Saturn and Jupiter; citation states exactly that and claims nothing more | ✓ Good — the requirement ("verified against an independent source before lock, with lineage documented") is met *because* the citation is honest about its limits. Overclaiming would have failed it. |
| Fold the complete Latin stroke/bar class, not the reported instances (amends D-23) | `Đ` and `Ð` produced different sigils from visually identical statements. Adding only the eight reported letters would have left 64 more failing identically, with an opt-out boundary of "what someone noticed" rather than a rule. Ratified by Matt at plan 02-04's blocking decision checkpoint, 2026-08-06. | ✓ Validated in Phase 2 — table 12 → 84 entries, case-complete, excluded classes documented with reason |
| `idPrefix` is caller-supplied; no derived hash (D-44) | Pitfall 9 recommends hashing `(statement, planet, options)` to namespace ids. Under this project's own determinism guarantee that produces *identical* ids for two identical sigils on one page — the exact collision it claims to fix. The artifact stays id-free by construction; uniqueness under identical prefixes is the caller's documented responsibility. | ✓ Validated in Phase 3 — zero `id` attributes by default across every planet × option combination; the one high-severity threat (attribute injection via `idPrefix`) closed with `escapeXml` and a hostile-prefix test |
| Grid is always emitted and hidden; glyph is opt-in | An asymmetry the success criteria imposed: the grid is scaffolding that explains the sigil (present, revealable), the glyph is a visible mark that changes what the sigil *is* (absent unless asked for). Deliberately dropped the `--grid` flag that `.claude/CLAUDE.md` anticipated — a flag would mean *absent* by default, which is a different contract from *hidden*. | ✓ Validated in Phase 3 |
| Numeric `--sigil-*` values are unitless user units, emitted as `calc(var(…) * 1px)` where the CSS property needs a length | A presentation attribute containing `var()` is parsed as a CSS declaration, so the substituted value must be valid for that property. `stroke-width`/`opacity` accept a bare number; `font-size` needs a unit. Emitting `font-size="var(--x, 13.333)"` dies at computed-value time and silently falls back to `inherit` — for the default as well as every override — while still looking correctly wired in the markup. | ✓ Validated in Phase 3, the hard way — shipped broken for two properties, found by Matt during UAT, fixed in `b3c8b6a`. **Lesson: "the attribute maps to a CSS property" is necessary and not sufficient; the substituted value must also be valid for it.** Now guarded by a real-browser computed-style test, the only test in the suite that renders. |
| Type-keyed absent-sentinel in `resolveOptions` (D-49/D-50) rather than a blanket `null`-is-absent rule | `working.render` serializes an absent `idPrefix` as JSON `null` (correct per D-48), but the option check treated only `undefined` as absent — breaking the round-trip the code's own doc comment promised. Widening per-type keeps the fix scoped: `{ glyph: null }` still throws. | ✓ Good — round-trip verified byte-identical on all seven planets with and without a prefix, and typechecks with no cast at the call site |
| Validate planet identity before statement content (D-54) | `generateSigil('AEIOU','pluto')` reported `E_EMPTY_SEQUENCE` and masked the also-invalid planet — the cheaper, more actionable error was hidden behind the more expensive one | ✓ Good — every single-fault case still reports exactly the code it reported before |
| Publish the five `E_*` constants from the package root (D-55) | The CLI hardcoded code strings as object keys with no drift protection; a rename would silently orphan an exit-status entry | ✓ Good — the exit map is now keyed from the imported constants, so a rename propagates or fails loudly at import |
| CLI-local diagnostic codes (`E_CLI_USAGE`, `E_CLI_STDIN`) stay out of `src/errors.js` (D-53) | CLI-syntax failures are not domain errors; the library remains the sole owner of error identity (INT-04) | ✓ Good — three uses of the pattern by v1.0 close, with the taxonomy boundary intact |
| Close audit tech debt in a dedicated Phase 4 rather than shipping with a register | Eleven open items with no written disposition is a register that quietly becomes permanent | ✓ Good — six fixed, two closed as verified non-issues with live evidence, three deferred with reopen conditions. Two of the eleven turned out to be non-issues *only because* someone checked (the `-0` guard would have been dead code). |
| **v1.1** — Order phases by irreversibility, not by feature | `npm publish` cannot be taken back: a wrong `repository.url` or a missing output field forces a version bump, and published versions are never reusable. So everything that changes *what the artifact is* lands before the publish | ✓ Good — Phase 5 caught four artifact-level corrections while they were still free edits. Nothing in Phases 6–8 required a version bump to fix |
| **v1.1** — Publish from CI, never from a laptop (D-74) | The first registry write is the one that cannot be undone, and a local publish produces no attestation and no reviewable record | ✓ Good — `gh run list` shows exactly one publish run per version, and each packument's `gitHead` matches a reviewed commit |
| **v1.1** — Light DOM for the element, no shadow root (D-82) | CSS custom properties pierce shadow boundaries but semantic class selectors do not, and roughly half the documented theming surface is classes. Shadow DOM would make the element strictly worse than the raw-SVG path that already worked | ✓ Validated in Phase 7 — a page-level `.sigil-path` rule authored outside the element matches its children, proven by computed style in real Chromium |
| **v1.1** — The skill's canonical source lives in the repo, not in `~/.claude/skills/` (D-99) | A drift check that reads only the installed home copy is a no-op on every machine but one | ✓ Good — the byte-identity guard fired for real at v1.1 close when the Published-Surface Boundary was corrected, catching the divergence before the reinstall |
| **v1.1** — Ship the element without publishing it in Phase 7 (D-98) | Publishing is a milestone-close action; a phase that both builds and publishes has two irreversible surfaces in one scope | ⚠️ Revisit the *bookkeeping*, not the call. The boundary was correct and deliberate, but it left the repo describing a surface the registry did not serve, and the milestone audit's integration check misread that as three blocked requirements. A phase that deliberately withholds a publish should say so where the audit will read it |
| **v1.1** — Retroactive security pass on the phase that published (2026-08-09) | The milestone shipped with `security_enforcement: true` and zero SECURITY.md, on the milestone whose central act was a public registry write with a credentialed CI workflow | ✓ Good, and it earned its cost — found a dispatch input substituted into a `run:` line in the token-holding job, and a promote step that would silently demote `latest` to a stale version and exit 0. Both fixed before the 1.1.0 release, both live at the time |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context and Current State with shipped reality

---
*Last updated: 2026-08-09 after the v1.1 Distribution milestone — 4 phases, 16 plans, 40 tasks, 14/14 requirements, 1,532 tests, zero runtime dependencies. `@falkensmage/sigil-spinner@1.1.0` is live on npm with a verified provenance attestation. Next: no milestone committed — see Next Milestone above.*
