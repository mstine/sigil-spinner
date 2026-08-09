# Roadmap: Sigil Spinner

## Milestones

- ✅ **v1.0 MVP** — Phases 1-4 (shipped 2026-08-07) — [archive](milestones/v1.0-ROADMAP.md)
- ✅ **v1.1 Distribution** — Phases 5-8 (shipped 2026-08-09) — [archive](milestones/v1.1-ROADMAP.md)
- 📋 **v1.2** — not planned. Candidates in [`PROJECT.md`](PROJECT.md) § Next Milestone

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

<details>
<summary>✅ v1.1 Distribution (Phases 5-8) — SHIPPED 2026-08-09</summary>

Ordered by irreversibility rather than by feature. `npm publish` cannot be taken back, so everything that changes what the artifact *is* landed first (Phase 5), the publish rehearsal and the publish itself second (Phase 6), and the two consumers of the published package fanned out third (Phases 7 and 8, in parallel, sharing zero files).

- [x] Phase 5: Publish-Ready Source (4/4 plans) — completed 2026-08-08
- [x] Phase 6: Published Package (4/4 plans) — completed 2026-08-09
- [x] Phase 7: The sigil-spinner Element (4/4 plans) — completed 2026-08-09
- [x] Phase 8: The Sigil Skill (4/4 plans) — completed 2026-08-09

Full phase details, success criteria, and wave structure: [`milestones/v1.1-ROADMAP.md`](milestones/v1.1-ROADMAP.md)
Requirements as shipped: [`milestones/v1.1-REQUIREMENTS.md`](milestones/v1.1-REQUIREMENTS.md)
Audit: [`milestones/v1.1-MILESTONE-AUDIT.md`](milestones/v1.1-MILESTONE-AUDIT.md)
Security (Phase 6, retroactive): [`milestones/v1.1-phases/06-published-package/06-SECURITY.md`](milestones/v1.1-phases/06-published-package/06-SECURITY.md)

</details>

## Shipped Surface

What exists today, after two milestones:

| Surface | Reach |
|---|---|
| Library | `import { generateSigil } from '@falkensmage/sigil-spinner'` |
| CLI | `npx sigil-spinner "<statement>" --planet <planet>` |
| Element | `import '@falkensmage/sigil-spinner/element'` → `<sigil-spinner statement="…" planet="…">` |
| Skill | `~/.claude/skills/sigil/` — any Claude Code session, any directory |
| Release | `.github/workflows/release.yml` — `workflow_dispatch`, publish + promote, npm provenance |

Registry: `@falkensmage/sigil-spinner`, MIT, `latest` = `1.1.0`, zero runtime dependencies.

## Carried Debt

Not blocking anything; catalogued so it does not become invisible.

- ~~**Security coverage is uneven.**~~ **Closed 2026-08-09.** All four v1.1 phases now carry a SECURITY.md, all four at `threats_open: 0`. The passes were not a formality: Phase 6 found two live defects in the release workflow, and Phase 8 found a proven command-injection path in the skill's primary example. Both fixed. Three low-severity residuals carried — see the phase SECURITY.md files.
- **Seventeen open review items** across phases 5-8, all low-severity, all confirmed still open against the tree at v1.1 close. Enumerated in the v1.1 audit.
- **Guard-coverage residuals (Phase 7).** The `exports` key set and the element's `.innerHTML =` source rule are both in a verified-correct state with no standing test defending them. A future `"./*"` addition would fail no gate.
- **The release credential is carried risk** — scope and expiration unrecorded, retirement tracked at [issue #1](https://github.com/mstine/sigil-spinner/issues/1) against npm's ~January 2027 deadline.
- **The skill names the element but does not teach it** — extending it needs a drift guard alongside, or it goes stale the way the published-surface boundary did.

---
*Roadmap created: 2026-08-04*
*v1.0 archived: 2026-08-07*
*v1.1 archived: 2026-08-09 — 4 phases, 16 plans, 14/14 requirements, published to npm as 1.1.0*
