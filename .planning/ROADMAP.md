# Roadmap: Sigil Spinner

## Milestones

- ✅ **v1.0 MVP** — Phases 1-4 (shipped 2026-08-07) — [archive](milestones/v1.0-ROADMAP.md)

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

### 📋 v1.1 — Not yet planned

Run `/gsd-new-milestone` to define the next milestone's requirements and phases.

Candidates carried out of v1.0 (from `REQUIREMENTS.md` v2 section and the deferred register — not yet committed to a milestone):

- **PKG-01** — Published npm package with a clean-install smoke test (`npm pack && npm install`) across platforms
- **PKG-02** — Kamea-set version field in the JSON output for long-term reproducibility contracts
- **WRAP-01** — `<sigil-spinner>` web component as a thin wrapper over the library
- **WRAP-02** — Hosted web UI layered on the stable library

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. First Sigil, End to End | v1.0 | 3/3 | Complete | 2026-08-06 |
| 2. Every Planet, Every Statement | v1.0 | 4/4 | Complete | 2026-08-06 |
| 3. Themeable, Embeddable Layers | v1.0 | 4/4 | Complete | 2026-08-07 |
| 4. v1.0 Tech Debt Closeout | v1.0 | 3/3 | Complete | 2026-08-07 |

**v1.0 requirement coverage:** 21/21 v1 requirements mapped and satisfied. No orphans, no duplicates. Phase 4 carried phase-local `TD-*` debt IDs rather than REQUIREMENTS.md IDs — a visible choice, since the v1 requirement set closed with the milestone.

---
*Roadmap created: 2026-08-04*
*v1.0 archived: 2026-08-07*
