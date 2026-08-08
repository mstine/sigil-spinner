# Phase 5: Publish-Ready Source - Context

**Gathered:** 2026-08-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Every output field, CLI flag, and source citation is correct **before** a version number becomes permanent. Four requirements, three parallel tracks:

- **PKG-02** — the JSON working carries the kamea set's version alongside `kameaSet`, from a static in-source constant
- **INT-05** — a `--title` CLI flag exposes the library's existing `options.title`
- **INT-06** — when a title and an id prefix are both present, the SVG's accessible name is wired via `aria-labelledby`
- **MAINT-01** — every decision/pitfall citation in shipped source resolves to a document that still says what the citation claims

**Not in this phase:** publishing, package metadata, the smoke test (Phase 6); the `<sigil-spinner>` element (Phase 7); the Claude Code skill (Phase 8).

</domain>

<decisions>
## Implementation Decisions

Only one of the four gray areas was discussed. **PKG-02's design is fully locked below.** INT-05, INT-06, and MAINT-01 carry no locked decisions from this discussion — research and planning own those calls, subject to the constraints in Code Context.

### PKG-02 — Kamea version scheme and field shape

- **D-57: The kamea version value is the D-04 provenance date, `'2026-08-04'`** — not semver. Rationale: D-02 already establishes that a corrected kamea set becomes a *new key* in `KAMEA_SETS` rather than mutating `agrippa`, so this set's cells can never change and semver has no second version to express. What *can* change is the verification strength behind them (Mars, Sun, Venus, Mercury, and Moon rest on a single web source, magic-sum verified but not independently cross-checked — see `src/data/kamea.js:16-42`). A sign-off date names exactly that state: these cells, verified this much, as of this date. — **Reversibility:** one-way — the value ships in published JSON working output from v1.0.0 onward; changing the scheme after publish means every previously captured working carries a value in a format the tool no longer emits, with no way to migrate artifacts already embedded in pages.

- **D-58: The version lands as a new sibling field immediately after `kameaSet`** — `kameaSet: 'agrippa', kameaVersion: '2026-08-04', gridSize: 3, …`. The working's key set goes 15 → 16, purely additive. Rejected: making `kameaSet` an object `{ name, version }`, and introducing a nested `kamea: { set, version }` block — both are breaking changes to a documented field that existing consumers read as a string, and Phase 5 exists specifically to avoid shipping a shape we would want back. — **Reversibility:** one-way — `kameaVersion` becomes part of the documented 16-field working contract at publish; removing or restructuring it later breaks every consumer reading it and invalidates the round-trip guarantee (D-48).

- **D-59: The JSON field is named `kameaVersion`** — chosen over `kameaSetVersion` (unambiguous but bureaucratic beside the other fifteen short field names: `statement`, `planet`, `gridSize`, `kept`, `struck`, `numbers`, `path`, `render`) and over `kameaSetDate` (names what the value *is* today, but welds the field name to the current scheme — if a later set ever versions differently, the name lies; "version" stays true regardless of what the version looks like). — **Reversibility:** one-way — published contract string.

- **D-60: The constant is a sidecar map keyed by set name — `KAMEA_SET_VERSIONS = { agrippa: '2026-08-04' }` — living in `src/data/kamea.js` beside `DEFAULT_KAMEA_SET`.** Rationale: D-02 guarantees a second kamea set eventually exists, and the seam must survive that. A sidecar map gives the corrected set its own entry with nothing restructured. Rejected: restructuring `KAMEA_SETS` entries into `{ version, grids }` (correct, but changes the shape every existing accessor indexes — `kamea.js:183`, `kamea.js:256`, and `test/data/kamea.test.js`'s `KAMEA_SETS.agrippa[planet]` assertion — turning a field addition into a data-layer refactor); and a standalone `DEFAULT_KAMEA_VERSION` constant (simplest line of code, but a single global version for a multi-set structure — it would silently report the agrippa date for a Tyson-corrected set). — **Reversibility:** reversible — internal module shape, not part of the public surface.

- **D-61: A test asserts key parity between `KAMEA_SETS` and `KAMEA_SET_VERSIONS`** — `Object.keys()` of both must be identical sets. This closes the one gap the sidecar shape opens: adding a kamea set without a version fails the suite loudly at the moment it is introduced, rather than silently in someone's published working years later. Same discipline as D-55's exit-map keying — a rename propagates or fails. Rejected: a runtime throw in `resolveSet` (correct, but the failure lands on a consumer rather than on whoever added the set, and adds a new throw path to a function that currently only throws for genuinely bad input); and doing both (the test alone makes the runtime case unreachable in practice).

### Claude's Discretion

Everything not locked above. Specifically:

- **INT-05 (`--title` flag)** — flag shape (boolean parity with `options.title` vs. a string variant), whether `--no-title` is needed, how it threads into `working.render.title`. Constraint: the library owns validation (INT-04), and CLI/library output must stay byte-identical.
- **INT-06 (ARIA wiring)** — the `<title>` element's id derivation, whether `role="img"` is also emitted, and the rule for title-present-but-no-`idPrefix` (where D-44 keeps the artifact id-free by construction). This is the **only** requirement permitted to move the 46 SVG-shaped snapshots; any SVG snapshot movement must trace to it and be reviewed as such.
- **MAINT-01 (citation repair)** — repair strategy and scope. See Code Context: the problem is larger than the single line the requirement names.
- **Snapshot rebase sequencing** — the roadmap requires each rebase be a reviewed consequence of a named requirement, not incidental churn. How that is split across commits is a planning call.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and requirements
- `.planning/ROADMAP.md` § Phase 5: Publish-Ready Source — goal, five success criteria, parallel-track structure, known blast radius, and the milestone-wide constraints that no phase may violate
- `.planning/REQUIREMENTS.md` — PKG-02, INT-05, INT-06, MAINT-01 verbatim; also § Out of Scope, which names the refusals (timestamps, git SHAs, runtime `package.json` reads, any runtime dependency)
- `.planning/PROJECT.md` § Key Decisions — the 20 dispositioned v1.0 decisions, including D-02, D-16, D-44, D-48, D-53, D-55

### PKG-02 — the determinism trap
- `.planning/research/PITFALLS.md` § Pitfall 10 (lines 179-198) — "A version/provenance field in the JSON `working` becomes a silent determinism leak." **Load-bearing.** Enumerates the three failure modes in order of how quickly they would be noticed, names the warning signs (`readFileSync`, `import … from '../package.json'`, `process.env`, `Date.now()`, `execSync` — *none of which exist anywhere in `src/` today*, so any appearing in a PKG-02 diff is itself the signal), and prescribes the reviewed-rebase discipline. Note this pitfall also recommends a `PACKAGE_VERSION` constant; that is **not** PKG-02's scope — see Deferred Ideas.
- `src/data/kamea.js:1-45` — the D-01/D-04 source-lineage block. The honest-provenance narrative and the `2026-08-04` sign-off date that D-57 adopts as the version value.

### MAINT-01 — what actually broke
- `.planning/milestones/v1.0-research/PITFALLS.md` — the **archived v1.0** pitfalls. This is where `src/data/kamea.js:26`'s "Pitfall 1" (Kamea Orientation Ambiguity) now lives.
- `.planning/research/PITFALLS.md` — the **current v1.1** pitfalls, which replaced the v1.0 file at the same path. Its Pitfall 1 is "Scoped package publishes private (or fails outright) on first publish." Every unqualified `Pitfall N` citation in `src/` now resolves against this document and means something else entirely.
- `.planning/milestones/v1.0-phases/03-themeable-embeddable-layers/03-RESEARCH.md` — where `03-RESEARCH.md` moved. Cited by `src/render/glyphs.js:17` and `src/render/curve.js:119`.

### Contract surfaces that constrain the work
- `README.md` § the fifteen-field working table (~line 294) and the `title` documentation (~lines 32-33, 489-490) — both move with this phase
- `.planning/STATE.md` § Blockers/Concerns — carried v1.0 state, including why the suite needs a browser

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`src/data/kamea.js:75`** — `DEFAULT_KAMEA_SET = 'agrippa'`. `KAMEA_SET_VERSIONS` (D-60) goes directly beside it.
- **`src/data/kamea.js:89`** — `KAMEA_SETS`, a plain name→grids map. Indexed directly by `resolveSet` (`:182-187`), `kameaGrid`, and `cellForNumber` (`:256`). D-60 deliberately leaves this shape untouched.
- **`src/generate.js:280`** — `kameaSet: DEFAULT_KAMEA_SET` is already threaded into the result object. `kameaVersion` follows the identical path.
- **`src/render/json.js:78-94`** — the working's fixed key order, destructured then re-emitted. The single place D-58's new key is inserted.
- **`bin/sigil-spinner.js:114-122`** — the `parseArgs` options block. Six flags today: `planet`, `json`, `output`, `glyph`, `curve`, `id-prefix`. INT-05 adds a seventh.
- **`src/render/escapeXml.js`** — already applied to `<title>` content at `svg.js:636`. Any INT-06 id derivation from user-supplied `idPrefix` must go through it (the D-44 attribute-injection threat is already closed this way).
- **`test/browser/theming-resolution.test.js`** — the only test in the suite that renders in a real browser. If INT-06's accessible name needs verification beyond markup shape, this is the established pattern.

### Established Patterns

- **No runtime I/O in `src/`, at all.** Zero `node:` imports; every Node import lives in `bin/`. This is what makes `src/` browser-safe for Phase 7 and is a milestone-wide constraint, not a preference.
- **Byte-pinned snapshots as the determinism contract** — 48 committed snapshots, 1,453 tests across 18 files.
- **Hardcoded key-order assertions exist in two places** and are not derived from the working itself: `test/determinism.test.js:243` and `test/render/json.test.js:27`. Both need hand-edits for D-58. The roadmap flags this explicitly.
- **Errors are the library's alone (INT-04).** CLI-syntax failures use CLI-local codes (`E_CLI_USAGE`, `E_CLI_STDIN`) that deliberately stay out of `src/errors.js` per D-53.

### Integration Points

- **PKG-02 blast radius, confirmed by scout:** `src/data/kamea.js` (new constant), `src/generate.js:280` (thread it), `src/render/json.js:78-94` (emit it), 2 of 48 snapshots (`test/render/__snapshots__/json.test.js.snap:39`, `test/__file_snapshots__/worked-example.working.json:4`), 2 hardcoded key-order assertions, README's working table. The 46 SVG-shaped snapshots are untouched by PKG-02.
- **MAINT-01 is larger than the one line the requirement names.** The scout found **10 pitfall citations across `src/`**, not one: `src/data/kamea.js:26`, `src/path/buildPath.js:45` and `:75`, `src/render/coords.js:3`, `src/render/glyphs.js:17` and `:40`, `src/render/svg.js:13` and `:516`, `src/text/fold.js:160` and `:164`, `src/render/curve.js:119`. Two distinct rot mechanisms: (a) `.planning/research/PITFALLS.md` was replaced wholesale by v1.1 research, so every unqualified `Pitfall N` now resolves to a different document saying something else; (b) `03-RESEARCH.md` moved into `.planning/milestones/v1.0-phases/03-themeable-embeddable-layers/`, so the two citations naming it point at a path that no longer exists. Success criterion 4 says *every* citation must resolve — planning should scope to all 10, not to the one MAINT-01 names as an example.
- **INT-06 touches `src/render/svg.js:636` and `:651`** — `<title>` is emitted bare (no id), and the `<svg>` element carries `xmlns`, `viewBox`, `class`, and a conditional `id`, with no `role`.
- **PKG-02 and MAINT-01 both edit `src/data/kamea.js`** — the roadmap rides them together as one track rather than racing them. INT-05 (`bin/sigil-spinner.js`) and INT-06 (`src/render/svg.js`) form a second track with zero file overlap.

</code_context>

<specifics>
## Specific Ideas

- The version reads as provenance, not release cadence: *"these cells, verified this much, as of this date."* The value's job is to point a future reader at a specific citation state in `src/data/kamea.js`, not to sort against other versions.
- The parity test (D-61) is framed as the same discipline as D-55 — the mechanism should fail at the moment the mistake is introduced, on whoever introduced it, rather than surfacing downstream in a consumer's artifact.

</specifics>

<deferred>
## Deferred Ideas

- **`PACKAGE_VERSION` as a second in-source constant, and a CI assertion that it matches `package.json`'s `version`.** Recommended by Pitfall 10, but out of PKG-02's scope: success criterion 1 asks only that a working "names both the kamea set and its version." Adding the package version to the working is a second contract field and a separate decision. Revisit if Phase 6 wants published artifacts to name the emitting package version.
- **A mechanical citation drift check** — a test that fails when a `Pitfall N` or `D-NN` citation in `src/` no longer resolves. Structurally the same instrument as Phase 8's SKILL-03 drift check. Not deferred *out* of Phase 5 — it was simply not discussed. Planning may fold it into MAINT-01 if it is the cheapest way to satisfy success criterion 4 durably rather than once.
- **The three v1.0 items deferred with written reopen conditions** (`E_CLI_STDIN` test coverage, the `perpendicularUnit` doc comment, the `D-12` ID collision) remain deferred. Note the `D-12` condition: it reopens if any of `src/errors.js:20`, `src/generate.js:163`, `src/generate.js:238`, or `bin/sigil-spinner.js:20` is edited for another reason — **INT-05 edits `bin/sigil-spinner.js`**, so planning should check whether line 20 is in the diff.

</deferred>

---

*Phase: 5-Publish-Ready Source*
*Context gathered: 2026-08-08*
