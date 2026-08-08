# Roadmap: Sigil Spinner

## Milestones

- ✅ **v1.0 MVP** — Phases 1-4 (shipped 2026-08-07) — [archive](milestones/v1.0-ROADMAP.md)
- 🚧 **v1.1 Distribution** — Phases 5-8 (planned 2026-08-07) — get the tool out of the repo: published to npm, discoverable by any Claude Code session, embeddable as a custom element, without breaking the zero-runtime-dependency guarantee

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-4) — SHIPPED 2026-08-07</summary>

Built as widening vertical slices. Phase 1 drove one intention statement all the way through the pipeline to a rendered Saturn sigil, locking the riskiest work (kamea correctness) before anything downstream trusted it. Phase 2 widened the same spine to all seven classical planets and hardened the input surface. Phase 3 made the output an embeddable design element. Phase 4 closed the tech debt the milestone audit surfaced, before shipping rather than after.

- [x] Phase 1: First Sigil, End to End (3/3 plans) — completed 2026-08-06
- [x] Phase 2: Every Planet, Every Statement (4/4 plans) — completed 2026-08-06
- [x] Phase 3: Themeable, Embeddable Layers (4/4 plans) — completed 2026-08-07
- [x] Phase 4: v1.0 Tech Debt Closeout (3/3 plans) — completed 2026-08-07

Full phase details, success criteria, and wave structure: [`milestones/v1.0-ROADMAP.md`](milestones/v1.0-ROADMAP.md)
Requirements as shipped: [`milestones/v1.0-REQUIREMENTS.md`](milestones/v1.0-REQUIREMENTS.md)
Audit: [`milestones/v1.0-MILESTONE-AUDIT.md`](milestones/v1.0-MILESTONE-AUDIT.md)

</details>

### 🚧 v1.1 Distribution (Phases 5-8)

Four phases, ordered by irreversibility rather than by feature. `npm publish` cannot be taken back — a wrong `repository.url` or a missing output field at publish time forces a version bump to fix, and published versions are never reusable. So everything that changes what the artifact *is* lands first (Phase 5), the publish rehearsal and the publish itself land second (Phase 6), and the two consumers of the published package fan out third (Phases 7 and 8).

- [ ] **Phase 5: Publish-Ready Source** - Every output field, CLI flag, and source citation is correct before a version number becomes permanent
- [ ] **Phase 6: Published Package** - `npm install @falkensmage/sigil-spinner` works from a fresh project, with provenance
- [ ] **Phase 7: The sigil-spinner Element** - `<sigil-spinner statement="..." planet="...">` renders a themeable sigil in a page, no build step
- [ ] **Phase 8: The Sigil Skill** - Any Claude Code session, anywhere, picks the right planet and embeds a correct sigil without being told how

## Wave Structure

**This milestone is not strictly sequential, and v1.0 was.** v1.0's phases all converged on `src/render/svg.js` and `src/generate.js`, so nothing could overlap. v1.1 is five mostly-orthogonal additions to an already-stable pipeline. File-conflict analysis found exactly one shared file across the whole milestone — `package.json`, between Phases 6 and 7 — and even there the overlap is additive (different keys).

| Wave | Runs | Notes |
|------|------|-------|
| 1 | Phase 5 | Sequential internally — 3 plans in 3 waves. The parallel-track plan was superseded at plan time once MAINT-01's real 12-file footprint was enumerated (see phase detail) |
| 2 | Phase 6 | Sequential within itself; the publish is the gate |
| 3 | Phase 7 **and** Phase 8, in parallel | Zero file overlap between them. Two distinct consumers, one shared substrate |

Phases 7 and 8 are deliberately not braided. The element serves Matt's pages; the skill serves Claude sessions. They share the published package and nothing else.

## Human Gates

Two steps cannot be automated. Both are visible here rather than discovered mid-phase.

| Gate | Blocks | Does not block |
|------|--------|----------------|
| **npm automation token** — created on npmjs.com, added as a GitHub Actions secret | PKG-01 (the publish) and PKG-05 (provenance) in Phase 6 | Everything in Phase 5; the smoke-test rehearsal and metadata work that precede the publish |
| **Matt's planet correspondences** — lineage knowledge, not researchable | SKILL-02 in Phase 8 | Skill scaffolding, SKILL-01, and SKILL-03 — Phase 8 is structured so those proceed while this input is pending |

## Phase Details

### Phase 5: Publish-Ready Source

**Goal**: The code that is about to be published is already correct — every output field, CLI flag, and source citation is what it will need to be, before a version number becomes permanent.
**Depends on**: Nothing (v1.0 complete)
**Requirements**: PKG-02, INT-05, INT-06, MAINT-01
**Success Criteria** (what must be TRUE):

  1. A saved JSON working names both the kamea set and its version, so someone reading that file years later can identify exactly which data produced the sigil.
  2. `sigil-spinner --title ...` produces the same titled SVG the library produces for `{ title: true }` — no option is reachable from one surface and not the other.
  3. A sigil generated with both a title and an id prefix exposes its accessible name to assistive technology without the embedder hand-authoring any ARIA.
  4. Every decision or pitfall citation in shipped source resolves to a document that still says what the citation claims.
  5. Determinism holds through all of it: the same statement and planet still produce byte-identical output on repeat runs, the version stamp is identical whether run from the dev tree or an installed package, and every snapshot rebase is a reviewed consequence of a named requirement rather than a surprise.

**Parallel tracks — superseded at plan time (2026-08-08).** The original plan was: (a) PKG-02 + MAINT-01 ride together since both edit `src/data/kamea.js`; (b) INT-05 + INT-06 in `bin/sigil-spinner.js` and `src/render/svg.js`; zero file overlap between the tracks. That analysis assumed MAINT-01 was a one-to-two-site fix in `src/data/kamea.js`. The plan-time enumeration found **34 citation sites across 12 files**, including `src/render/svg.js` and `bin/sigil-spinner.js` — which are track (b)'s own files. **MAINT-01 conflicts with all three other requirements, so the phase has no genuine parallelism.** The phase runs sequentially in three waves instead: MAINT-01 first (so the citation drift guard is enforcing the canonical form before any other requirement authors a new citation), then PKG-02, then INT-05 + INT-06. Sequencing is also strictly better for snapshot attribution than the parallel plan would have been — concurrent rebasing in one tree is the surprise churn success criterion 5 forbids.
**Known blast radius — refined at plan time.** PKG-02 rebases exactly 2 of 48 snapshots (the JSON-shaped ones — confirmed: `test/render/__snapshots__/json.test.js.snap` and `test/__file_snapshots__/worked-example.working.json` are the only two snapshot-shaped files containing the working's keys), one added line each. `test/determinism.test.js`'s hardcoded key-order assertion needs a **semantic rewrite, not a hand-edit** — it asserts a Phase-1 prefix plus later appends, a framing an *inserted* key contradicts, so it becomes a single whole-order assertion over all 16 keys. `test/render/json.test.js`'s pipeline fixture needs the field added. **INT-06 moves zero SVG snapshots**: no committed snapshot exercises `title: true`, and the ARIA wiring is emitted only when a title and an id prefix are both present, so there is no committed snapshot for it to move. The phase-wide expectation is therefore exactly 2 of 48 rebased, all 46 SVG-shaped snapshots byte-unchanged, verified from git in plan 05-03's seal.
**Owns open decision**: kamea-version scheme — semver (`'1.0.0'`) vs. a provenance date tied to the D-04 sign-off. The seam accepts either; the value ships in published output and is awkward to change later.
**Constraint**: the version must be a static in-source constant. Never a runtime read of `package.json`, never a timestamp, never a git SHA — that would put the first `node:` import into `src/` and break both browser-safety and byte-determinism.
**Plans:** 2/3 plans executed, one per wave (sequential — see the superseded parallel-tracks note above)

Plans:
**Wave 1**

- [x] 05-01-PLAN.md — MAINT-01: repair all 34 enumerated citation sites across 12 files and install `test/citations.test.js` as a mechanical drift guard

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 05-02-PLAN.md — PKG-02: `KAMEA_SET_VERSIONS` sidecar map, `kameaVersion` threaded and emitted after `kameaSet`, D-61 parity guard, committed determinism guard, two-snapshot rebase

**Wave 3** *(blocked on Wave 2 completion)*

- [ ] 05-03-PLAN.md — INT-05 + INT-06: the `--title` flag at CLI/library parity, `role`/`aria-labelledby`/title-`id` wiring, a real-browser accessible-name test, and the phase seal

**Cross-cutting constraints:**

- `package.json` `dependencies` remains an empty object

### Phase 6: Published Package

**Goal**: Anyone — including a Claude Code session that has never seen this repo — can install the package from npm and use both surfaces without extra configuration.
**Depends on**: Phase 5
**Requirements**: PKG-03, PKG-04, PKG-01, PKG-05
**Success Criteria** (what must be TRUE):

  1. `npm install @falkensmage/sigil-spinner` into a fresh, empty project succeeds, and the resulting `node_modules` contains no transitive runtime dependencies.
  2. From that fresh install, `import { generateSigil }` resolves and `npx sigil-spinner "..." --planet saturn` writes a real sigil to stdout — neither needs additional configuration.
  3. The package's npm page shows MIT with a matching `LICENSE` file in the tarball, an author, a repository link that resolves to `github.com/mstine/sigil-spinner`, and public rather than private access.
  4. A published version carries a verifiable npm provenance attestation produced by a GitHub Actions release workflow.
  5. The smoke test is repeatable — a later phase can re-run it against a new tarball to verify a new `exports` subpath, rather than it being a one-time manual check.

**Intra-phase ordering (non-negotiable)**: PKG-04 (metadata correctness) and PKG-03 (the pack-and-scratch-install smoke test) both complete *before* PKG-01 executes the publish. PKG-05's determination — whether provenance on a package's first publish requires an automation token rather than keyless OIDC — must be verified against live npm documentation *before* the publish, so version 1.0.0 ships attested rather than needing a version bump to gain attestation.
**Rehearsal ladder**: `npm pack --dry-run` → tarball scratch-install → `npm publish --dry-run` → `publish --tag next` → promote to `latest`. This is the acceptance criterion, not a suggestion — publish has a 72-hour conditional unpublish window, a 24-hour name lock after full unpublish, and versions are never reusable.
**Disqualified**: `npm link` as the smoke test. It symlinks the working tree and masks precisely the `files`/`exports` misconfigurations the test exists to catch.
**Human gate**: npm automation token, created on npmjs.com and added as a GitHub Actions secret.
**Plans**: TBD

### Phase 7: The sigil-spinner Element

**Goal**: Matt can drop `<sigil-spinner statement="..." planet="...">` into a page and get a sigil his own CSS fully controls, with no build step and no runtime dependencies.
**Depends on**: Phase 6 (soft — `package.json`'s identity fields settled, and the element's install path verified against the published package). Runs in parallel with Phase 8.
**Requirements**: WRAP-01, WRAP-02, WRAP-03
**Success Criteria** (what must be TRUE):

  1. A plain HTML page that loads the element as ESM renders a **visibly correct sigil** — confirmed by a human looking at the rendered page in a browser, not only by a green test.
  2. The page's own CSS restyles the element through both `--sigil-*` custom properties **and** semantic class selectors, with the same theming reach as embedding the raw SVG.
  3. Changing the element's attributes after it is in the document re-renders it correctly.
  4. Several elements on one page render independently, with no id collisions.
  5. The installed package still declares zero runtime dependencies and ships no build output — the source is still what runs.

**Verification lesson carried from v1.0 — this one is load-bearing**: both real v1.0 defects passed a fully green suite and were caught by a human looking at rendered output. Structural tests verify wiring, not appearance. An element whose tests assert only "registers and reflects attributes" would pass while rendering nothing visible. Criterion 1 is a browser-rendering check, using the existing Playwright harness (`test/browser/theming-resolution.test.js`) as the pattern.
**Owns open decisions**: (a) the web-component attribute name for the title — `title` is a global HTML attribute that renders a browser tooltip, so the element needs a different name, and changing it after publish breaks a public contract; (b) formally locking the light-DOM choice — reversing it after publish is a breaking change to the element's theming contract.
**Constraints**: light DOM, no shadow root. Zero runtime dependencies — Lit, Stencil, and any web-component base library are named refusals. No build step; `src/` is already browser-safe (zero `node:` imports; all Node imports live in `bin/`).
**Reuses**: Phase 6's repeatable smoke test, extended to verify the new `./element` subpath resolves from an installed tarball.
**Plans**: TBD
**UI hint**: yes

### Phase 8: The Sigil Skill

**Goal**: A Claude Code session in any directory, that has never seen this repo, picks the right planet for the intent and embeds a correct sigil — without the user naming the tool first.
**Depends on**: Phase 6 (the skill's documented invocation must be verified against the *published* package, not a local path). Runs in parallel with Phase 7.
**Requirements**: SKILL-01, SKILL-02, SKILL-03
**Success Criteria** (what must be TRUE):

  1. In a fresh Claude Code session in an unrelated directory, asking for a sigil produces a correct one — the user never has to name the tool, the package, or the flags.
  2. The planet chosen is a reasoned choice grounded in Matt's own correspondences, with the reasoning stated — not a guess, and not a question bounced back to the user.
  3. The skill's documented invocation runs against the published package, verified live, not against a local path that only works on this machine.
  4. A mechanical drift check fails loudly when the skill's documented flags or options stop matching the CLI's actual surface.

**Human gate**: Matt's planet correspondences. Structure the phase so scaffolding, SKILL-01, and SKILL-03 proceed while that input is pending — SKILL-02 is the only requirement it blocks.
**Owns open decision**: the skill content-capture format for the correspondences. Blocked on Matt; determines the skill's structure.
**Note**: the skill's files live at `~/.claude/skills/sigil/`, entirely outside this repository. SKILL-03's drift check is the one piece that lands in-repo, which is why it has zero file overlap with Phase 7.
**Plans**: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. First Sigil, End to End | v1.0 | 3/3 | Complete | 2026-08-06 |
| 2. Every Planet, Every Statement | v1.0 | 4/4 | Complete | 2026-08-06 |
| 3. Themeable, Embeddable Layers | v1.0 | 4/4 | Complete | 2026-08-07 |
| 4. v1.0 Tech Debt Closeout | v1.0 | 3/3 | Complete | 2026-08-07 |
| 5. Publish-Ready Source | v1.1 | 2/3 | In Progress|  |
| 6. Published Package | v1.1 | 0/? | Not started | - |
| 7. The sigil-spinner Element | v1.1 | 0/? | Not started | - |
| 8. The Sigil Skill | v1.1 | 0/? | Not started | - |

**v1.0 requirement coverage:** 21/21 v1 requirements mapped and satisfied. No orphans, no duplicates. Phase 4 carried phase-local `TD-*` debt IDs rather than REQUIREMENTS.md IDs — a visible choice, since the v1 requirement set closed with the milestone.

**v1.1 requirement coverage:** 14/14 mapped. No orphans, no duplicates.

| Phase | Requirements | Count |
|-------|--------------|-------|
| 5. Publish-Ready Source | PKG-02, INT-05, INT-06, MAINT-01 | 4 |
| 6. Published Package | PKG-03, PKG-04, PKG-01, PKG-05 | 4 |
| 7. The sigil-spinner Element | WRAP-01, WRAP-02, WRAP-03 | 3 |
| 8. The Sigil Skill | SKILL-01, SKILL-02, SKILL-03 | 3 |

## Milestone-Wide Constraints

No phase may violate these. Carried from PROJECT.md and confirmed by v1.1 research.

- **Zero runtime dependencies.** `dependencies: {}` stays empty. Named refusals: Lit, Stencil, any web-component base library, `commander`/`yargs` for the new CLI flag, any SVG helper, any publish-helper package.
- **No build step.** Three independent research passes confirmed `src/` is already browser-safe — zero `node:` imports, all Node imports confined to `bin/`. "The source is what runs" stays true.
- **Byte-determinism.** The kamea version is a static in-source constant. No timestamp, no git SHA, no runtime read of `package.json`.
- **Light DOM for the element.** No shadow root. Class selectors do not pierce shadow boundaries, and roughly half the documented theming surface is classes.

---
*Roadmap created: 2026-08-04*
*v1.0 archived: 2026-08-07*
*v1.1 Distribution planned: 2026-08-07 — Phases 5-8, 14 requirements*
