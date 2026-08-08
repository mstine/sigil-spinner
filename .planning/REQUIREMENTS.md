# Requirements: Sigil Spinner — v1.1 Distribution

**Defined:** 2026-08-07
**Milestone:** v1.1 Distribution
**Core Value:** Given any intention statement and any of the seven classical planets, the tool deterministically produces a correct, traditionally-constructed sigil as embeddable, fully CSS-stylable SVG.

**Milestone goal:** Get Sigil Spinner out of the repo — published, discoverable by any Claude Code session, and embeddable as a custom element — without breaking the zero-runtime-dependency guarantee.

> v1.0's 21 requirements shipped and are archived at `.planning/milestones/v1.0-REQUIREMENTS.md`. Requirement IDs continue from that set: the `INT-*` series resumes at `INT-05`.

## v1.1 Requirements

### Packaging & Distribution (PKG)

- [ ] **PKG-01**: The package is published to the public npm registry as `@falkensmage/sigil-spinner`, and a user can install it into a fresh project and both `import { generateSigil }` and run the `sigil-spinner` binary without additional configuration
- [ ] **PKG-02**: The JSON working carries the kamea set's version alongside its existing `kameaSet` name, sourced from a static in-source constant — so identical input still produces byte-identical output whether run from the dev tree or an installed package
- [ ] **PKG-03**: A repeatable smoke test packs the tarball, installs it into a scratch directory, and verifies ESM `exports` resolution, the `bin` entry, and one real generated output — catching `files`/`exports` misconfiguration before any irreversible publish (`npm link` is explicitly disqualified: it symlinks the working tree and masks exactly these faults)
- [ ] **PKG-04**: The package declares complete, correct publication metadata — MIT license with a matching `LICENSE` file, `author`, `repository.url` matching `github.com/mstine/sigil-spinner` character-for-character, and `publishConfig.access: "public"` so the scoped package does not publish private
- [ ] **PKG-05**: A GitHub Actions release workflow publishes the package with npm provenance, so every published version carries a verifiable attestation. The phase must first verify against live npm documentation whether provenance on a package's *first* publish requires an automation token rather than keyless OIDC, and take whichever path attests version 1.0.0 rather than leaving it un-attested

### Discoverability (SKILL)

- [ ] **SKILL-01**: A personal Claude Code skill at `~/.claude/skills/sigil/` makes the tool discoverable to any Claude Code session in any directory — a session that has never seen this repo can generate and embed a correct sigil without the user naming the tool first
- [ ] **SKILL-02**: The skill carries planet-correspondence judgment sourced from Matt directly — which planet suits which kind of intent — so planet selection is a reasoned choice rather than a guess or a question bounced back to the user
- [ ] **SKILL-03**: A mechanical drift check fails when the skill's documented flags or options no longer match the CLI's actual surface, so the skill cannot silently go stale as the tool evolves

### Embedding (WRAP)

- [ ] **WRAP-01**: A `<sigil-spinner statement="..." planet="...">` custom element renders a sigil in the browser, loaded as plain ESM with no build step and no runtime dependencies
- [ ] **WRAP-02**: The element renders into light DOM (no shadow root), so the page's own CSS restyles it through both `--sigil-*` custom properties **and** semantic class selectors — identical theming reach to embedding the raw SVG
- [ ] **WRAP-03**: Changing the element's attributes after it is in the document re-renders it correctly, and multiple elements on one page render independently with no id collisions

### Interface (INT — continues from v1.0)

- [ ] **INT-05**: A `--title` CLI flag exposes the library's existing `options.title`, giving the generated SVG an accessible name from the command line
- [ ] **INT-06**: When a title and an id prefix are both present, the SVG's accessible name is wired automatically via `aria-labelledby`, so assistive technology resolves the name without the consumer hand-authoring ARIA

### Source Correctness (MAINT)

- [x] **MAINT-01**: Every decision or pitfall citation in shipped source resolves to a document that still says what the citation claims — specifically, `src/data/kamea.js:26` cites "Pitfall 1" from a research file whose content at that path has since been replaced

## Deferred to Future Releases

Tracked, not in the v1.1 roadmap.

### Wrappers

- **WRAP-04**: Hosted web UI layered on the stable library (formerly WRAP-02 in the v1.0 candidate list; renumbered to avoid collision with this milestone's WRAP-02)

### Integrations

- **MCP-01**: An MCP server exposing `generateSigil` to Claude Desktop and other non-shell Claude surfaces. Deliberately excluded from v1.1 — the primary consumer is Claude Code in build contexts, where `npx` plus a skill covers the case with less machinery. If built, it must live in a **separate package**: adding `@modelcontextprotocol/sdk` to this one would break the zero-runtime-dependency guarantee.

### Distribution

- **PKG-06**: An optional pre-bundled single-file browser artifact for WRAP-01. Technically unblocked (research confirmed no build step is *required*), but a product decision that was not made for v1.1.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Bundling the library or web component | Three independent research passes confirmed no build step is needed — `src/` is already browser-safe with zero `node:` imports. A bundler would add risk (inlined runtime helpers silently violating the zero-dependency guarantee) for no benefit, and would break the "the source is what runs" commitment |
| Shadow DOM for the web component | CSS custom properties pierce shadow boundaries but semantic class selectors do not, and roughly half the documented theming surface is classes. Shadow DOM would make the component embed path strictly worse than the raw-SVG path that already works |
| Any timestamp, git SHA, or runtime-read version in the JSON working | Destroys byte-determinism, the project's core guarantee. Provenance data must be a static, source-controlled constant |
| Any runtime dependency, for any feature | The zero-dependency guarantee is load-bearing for the embed story. Named violations to refuse: Lit/Stencil or any web-component base library, `commander`/`yargs` for the new CLI flag, any SVG helper, any publish-helper package |
| Non-classical planets, alternative kameas, scaled cell mapping | Unchanged from v1.0 — no canonical Agrippa-lineage source exists, and the direct 1–9 mapping was a deliberate decision |

## Open Decisions for Discuss-Phase

Not requirements — design calls that must be made explicitly rather than discovered during implementation.

| Decision | Why it must be decided up front |
|----------|--------------------------------|
| Web-component attribute name for the title | `title` is a global HTML attribute that renders a browser tooltip. The component needs a different name, and changing it after publish breaks a public contract |
| Kamea-version scheme — semver (`'1.0.0'`) vs. a provenance date tied to the D-04 sign-off | The architectural seam accepts either; the value ships in published output and is awkward to change later |
| Light-DOM decision must be *locked*, not left implicit | Reversing it after publish is a breaking change to the element's theming contract |
| Skill content-capture format for the correspondences | Blocked on Matt; determines the skill's structure |

## Human-Blocking Steps

Neither can be automated. Both gate real work.

1. **npm automation token** — created on npmjs.com and added as a GitHub Actions secret, so CI can publish with provenance. Blocks PKG-01 and PKG-05.
2. **Planet correspondences** — Matt's lineage knowledge, not researchable. Blocks SKILL-02; does not block skill scaffolding.

## Traceability

Populated during roadmap creation (2026-08-07). Phase numbering continues from v1.0, which ended at Phase 4.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PKG-02 | Phase 5 — Publish-Ready Source | Not started |
| INT-05 | Phase 5 — Publish-Ready Source | Not started |
| INT-06 | Phase 5 — Publish-Ready Source | Not started |
| MAINT-01 | Phase 5 — Publish-Ready Source | Complete (05-01) |
| PKG-03 | Phase 6 — Published Package | Not started |
| PKG-04 | Phase 6 — Published Package | Not started |
| PKG-01 | Phase 6 — Published Package | Not started |
| PKG-05 | Phase 6 — Published Package | Not started |
| WRAP-01 | Phase 7 — The sigil-spinner Element | Not started |
| WRAP-02 | Phase 7 — The sigil-spinner Element | Not started |
| WRAP-03 | Phase 7 — The sigil-spinner Element | Not started |
| SKILL-01 | Phase 8 — The Sigil Skill | Not started |
| SKILL-02 | Phase 8 — The Sigil Skill | Not started |
| SKILL-03 | Phase 8 — The Sigil Skill | Not started |

**Coverage:**

- v1.1 requirements: 14 total
- Mapped to phases: 14
- Unmapped: 0
- Duplicates (a requirement in more than one phase): 0

**Open decision ownership** (from the section above — resolved at each phase's discuss-phase, not in the roadmap):

| Decision | Owned by |
|----------|----------|
| Kamea-version scheme — semver vs. provenance date | Phase 5 |
| Web-component attribute name for the title | Phase 7 |
| Locking the light-DOM choice | Phase 7 |
| Skill content-capture format for the correspondences | Phase 8 |

**Human-blocking step ownership:**

| Gate | Blocks | Phase |
|------|--------|-------|
| npm automation token | PKG-01, PKG-05 | Phase 6 |
| Matt's planet correspondences | SKILL-02 only — not skill scaffolding | Phase 8 |

---
*Requirements defined: 2026-08-07 for milestone v1.1 Distribution*
