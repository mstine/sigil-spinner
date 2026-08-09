# Phase 5: Publish-Ready Source - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-08
**Phase:** 5-Publish-Ready Source
**Areas offered:** Kamea version scheme & field shape; `--title` flag shape; ARIA wiring rules; Citation repair scope
**Areas discussed:** Kamea version scheme & field shape

---

## Area selection

| Option | Description | Selected |
|--------|-------------|----------|
| Kamea version scheme & field shape | The roadmap's named open decision — semver vs. provenance date, and sibling field vs. object restructure | ✓ |
| `--title` flag shape | INT-05 — boolean parity vs. string variant, `--no-title`, `working.render.title` threading | |
| ARIA wiring rules | INT-06 — title id derivation, `role="img"`, the no-`idPrefix` case under D-44 | |
| Citation repair scope | MAINT-01 — one citation vs. all 10, repoint vs. inline, drift check now or later | |

**User's choice:** Kamea version scheme & field shape only.
**Notes:** The three unselected areas go to research and planning with no locked decisions. Constraints for each are recorded in CONTEXT.md § Claude's Discretion.

---

## Kamea version scheme & field shape

### Q1 — What value does the kamea version carry?

| Option | Description | Selected |
|--------|-------------|----------|
| Provenance date `'2026-08-04'` | The D-04 sign-off date. D-02 makes this set's cells immutable, so semver has no second version to express; what can change is verification strength, which a sign-off date names | ✓ |
| Semver `'1.0.0'` | Familiar and sorts, but under D-02 there is no 1.0.1 for this set — a constant that never increments isn't versioning anything | |
| Combined `'agrippa@2026-08-04'` | Self-describing in isolation, but duplicates `kameaSet` in the same object and forces string parsing | |

**User's choice:** Provenance date `'2026-08-04'` (recommended option).
**Notes:** Captured as D-57. Rated one-way — the value ships in published JSON working output from v1.0.0.

### Q2 — How does the version land in the JSON working's key set?

| Option | Description | Selected |
|--------|-------------|----------|
| New sibling field, right after `kameaSet` | Key set 15 → 16, purely additive; existing consumers reading `kameaSet` as a string are unaffected; rebases exactly the 2 JSON-shaped snapshots the roadmap predicted | ✓ |
| `kameaSet` becomes `{ name, version }` | Groups related facts, but breaks a documented field, the README working table, and the round-trip guarantee | |
| Nested `kamea: { set, version }` | Cleanest namespace, mirrors `render: {}`, but is the object option's breaking change plus a key relocation | |

**User's choice:** New sibling field (recommended option).
**Notes:** Captured as D-58. Rated one-way — becomes part of the documented 16-field contract at publish.

### Q3 — Where does the constant live, given D-02 guarantees a second kamea set?

| Option | Description | Selected |
|--------|-------------|----------|
| Sidecar map `KAMEA_SET_VERSIONS = { agrippa: '2026-08-04' }` | Keyed by set name, so a second set gets its own entry with nothing restructured; leaves `KAMEA_SETS` as the plain map every accessor already indexes | ✓ |
| Restructure `KAMEA_SETS` entries to `{ version, grids }` | Impossible to add a set and forget its version, but changes the shape indexed at `kamea.js:183`, `:256`, and in `kamea.test.js` — a data-layer refactor riding a field addition | |
| Standalone `DEFAULT_KAMEA_VERSION` | Simplest, but a single global version for a multi-set structure — would silently report the agrippa date for a corrected set | |

**User's choice:** Sidecar map (recommended option).
**Notes:** Captured as D-60. Rated reversible — internal module shape, not public surface.

### Q4 — What happens when a set is added with no version entry?

| Option | Description | Selected |
|--------|-------------|----------|
| Test-enforced key parity | `Object.keys()` of both maps must match; fails loudly at introduction rather than silently in a published working. Same discipline as D-55's exit-map keying | ✓ |
| Throw at resolve time | Runtime-correct, but the failure lands on a consumer rather than on whoever added the set, and adds a throw path to a function that currently only throws for bad input | |
| Both | Belt and braces, but the test alone makes the runtime case unreachable in practice | |

**User's choice:** Test-enforced key parity (recommended option).
**Notes:** Captured as D-61.

### Q5 — What is the field named in the JSON working?

| Option | Description | Selected |
|--------|-------------|----------|
| `kameaVersion` | Shortest reading of the pair; matches the roadmap's own phrasing ("names both the kamea set and its version") | ✓ |
| `kameaSetVersion` | Unambiguous and matches the constant name, but reads bureaucratic beside fifteen short field names | |
| `kameaSetDate` | Names what the value is, but welds the field name to the current scheme — if a later set versions differently, the name lies | |

**User's choice:** `kameaVersion` (recommended option).
**Notes:** Captured as D-59. Rated one-way — published contract string.

### Wrap check

| Option | Description | Selected |
|--------|-------------|----------|
| I'm ready for context | Write CONTEXT.md with the five decisions locked | ✓ |
| Explore more gray areas | Circle back to the three skipped areas | |

**User's choice:** Ready for context.

---

## Claude's Discretion

- INT-05 (`--title` flag shape) — not discussed; research and planning own it
- INT-06 (ARIA wiring rules) — not discussed; research and planning own it
- MAINT-01 (citation repair scope) — not discussed; the scout's finding that 10 citations are affected rather than 1 is recorded in CONTEXT.md § Integration Points
- Snapshot rebase commit sequencing

## Deferred Ideas

- `PACKAGE_VERSION` in-source constant + CI assertion against `package.json` — recommended by Pitfall 10, outside PKG-02's stated scope
- A mechanical citation drift check — same instrument as Phase 8's SKILL-03; planning may fold it into MAINT-01
- Watch the `D-12` reopen condition: it triggers if `bin/sigil-spinner.js:20` lands in INT-05's diff
