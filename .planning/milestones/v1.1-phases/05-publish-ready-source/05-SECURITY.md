---
phase: 05
slug: publish-ready-source
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
block_on: high
created: 2026-08-09
audit_type: retroactive
register_authored_at_plan_time: true
---

# Phase 05 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

**Audit type:** retroactive, run after the v1.1 milestone shipped. Phase 5 executed and closed without a `/gsd-secure-phase` pass despite `workflow.security_enforcement: true` and an active `verify:post` step hook. The register itself *was* authored at plan time across all four plans — what was missing was verification of it.

**Result: SECURED.** 16 threats, 13 mitigations closed, 3 accepted, 0 open. Verification for the two high-severity injection threats went beyond ASVS L1 grep depth to empirical data-flow probing in a real browser, because those are the phase's actual attack surface.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| caller → emitted SVG markup | `--title` writes the user's intention statement into markup destined for a page; `idPrefix` writes a caller-supplied string into three attribute values | Untrusted text into a markup document |
| caller → assistive technology | `role="img"` plus `aria-labelledby` makes a claim to a screen reader about what the artifact is and what it is called | Accessibility semantics |
| source tree → shipped doc comments | Comments in `src/` carry security-relevant reasoning (the no-bare-paint-literals discipline); they ship in the tarball and a contributor follows them | Reasoning a future author relies on |
| research documents → source citations | 34 citation sites in `src/` and `bin/` point at documents that can move or change under them | Claim-to-evidence linkage |
| kamea data → published JSON working | `kameaVersion` becomes a permanent, public provenance claim in every saved working | Provenance assertion |

---

## Threat Register

16 threats across the four plans' `<threat_model>` blocks.

**ID disambiguation is load-bearing here.** Plans 05-02 and 05-04 independently minted `T-05-04`, `T-05-05`, `T-05-06`, and `T-05-07` for unrelated threats — see Findings. This register suffixes them `a` (from 05-02) and `b` (from 05-04). **The suffixed IDs are canonical; the raw plan IDs are ambiguous and must not be used to key anything.**

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-05-01 | Information Disclosure | Security-relevant doc comments in `src/`, notably `svg.js:13` (the no-bare-paint-literals, CSS-injection-adjacent discipline) | medium | mitigate | Discipline verified **in the code**, not merely documented: every paint attribute uses `var(--sigil-*, currentColor)` (svg.js:239, 250, 293, 336, 356, 374, 436, 586); zero emitted `style=` attributes. Bare `fill="none"` is a paint keyword, not a colour literal, so it does not violate the rule. The `svg.js:13` citation itself resolves under the committed checker | closed |
| T-05-02 | Tampering | `test/citations.test.js` satisfiable by *deleting* citations rather than repairing them | medium | mitigate | `MINIMUM_CITATION_SITE_COUNT = 34` (citations.test.js:43), asserted `toBeGreaterThanOrEqual` at :511. Removing a citation fails the check | closed |
| T-05-03 | Spoofing | A repair repointing a citation at a same-numbered but semantically unrelated section | medium | mitigate | `excerptMatchesHeading` (:291-295) requires the excerpt be a prefix of a real heading **in that specific file**; the failure message names the file-scoped requirement. A wrong-document repair cannot satisfy it | closed |
| **T-05-04a** | Tampering | `kameaVersion` derived at build time or run time rather than being a static literal | **high** | mitigate | `FORBIDDEN_CONSTRUCTS` guard in `test/determinism.test.js:99-124` over exactly the three producing files, covering filesystem reads, `process.env`, `Date.now()`/`new Date(`, subprocess, and manifest import — with comment lines stripped before matching so the prohibition's own doc comment cannot self-trip. Plus a byte-identity assertion on repeat runs. **The absence is enforced, not incidental** | closed |
| T-05-05a | Repudiation | A provenance stamp not tied to the data it versions — a set with no version, or a version for no set | medium | mitigate | `KAMEA_SET_VERSIONS = Object.freeze({…})` (kamea.js:95); D-61 key-parity assertion against `KAMEA_SETS` in `test/data/kamea.test.js:152-158` | closed |
| T-05-06a | Spoofing | The version read as a correctness warranty when five of seven grids are single-source verified | medium | mitigate | `kamea.js:80-83` states verbatim that a value here is **NOT** a correctness warranty and cites the source-lineage block; `README.md:465` carries identical framing | closed |
| T-05-07a | Information Disclosure | Adding a field must not widen what is emitted — the working already carries the untrusted statement verbatim | low | **accept** | See Accepted Risks R-05-01 | closed — accepted risk |
| **T-05-08** | Tampering | **Attribute-value injection via `idPrefix` reaching the title `id` and `aria-labelledby` attribute values** | **high** | mitigate | `escapedIdPrefix` computed once (svg.js:655) and reused for the root `id`, the title `id`, and `aria-labelledby`. `escapeXml` covers all five reserved characters **including both quote forms**, which is what makes it correct in attribute context rather than only in element content. **Empirically attacked:** 18 hostile payloads × 2 vectors, zero breakout, quote parity exact in every case; real-Chromium `DOMParser` and `innerHTML` both yield `scriptNodes = 0` | closed |
| T-05-09 | Information Disclosure | `--title` writes the user's intention statement into page-destined markup | medium | mitigate | Opt-in only and absent by default (preserving D-16); `escapeXml(options.statement ?? '')` on the real path (svg.js:683). Probe: `A</title><script>alert(1)</script>` emits one `<title>` pair, fully entity-encoded, `scriptNodes = 0`. Consequence documented in README § Data Handling (:664-669) | closed |
| T-05-10 | Spoofing | An SVG announcing a graphic role to assistive technology with an unresolvable or empty accessible name | medium | mitigate | Gating matrix proven live — `role`/`aria` emitted **only** when a title and a non-empty id prefix are both present (title-only → false, idPrefix-only → false, `idPrefix: ''` → false, both → true). Empty statement rejected at entry with `SigilError` before render. `test/browser/accessible-name.test.js` proves the name resolves in a real browser's accessibility tree | closed |
| T-05-11 | Denial of Service | A pathological `idPrefix` inflating the emitted markup | low | **accept** | See Accepted Risks R-05-02 | closed — accepted risk |
| **T-05-04b** | Tampering | `citations.test.js` R1 excerpt rule — a blank or single-character excerpt recorded as verified | **high** | mitigate | `trimmed.length === 0 → return false` executes **before** any `startsWith` (:292-294), closing the vacuity. Three fail-first fixtures (whitespace-only, single-character, mid-heading substring) plus a clean control | closed |
| **T-05-05b** | Spoofing | Excerpt-to-token pairing — one citation's excerpt evidencing a different citation's path token | **high** | mitigate | `MAX_EXCERPT_TOKEN_DISTANCE = 20` (:61) filters candidates; `candidates.sort` orders nearest-first (:336-341). Borrowed-neighbour fixture pins the rejection; a chained-citation control pins that legitimate dense citations still resolve | closed |
| T-05-06b | Repudiation | The floor or `SOURCE_DIRS` lowered to make a citation-rot regression disappear | medium | mitigate | Floor still `34`, `SOURCE_DIRS` still `['src', 'bin']` — neither weakened | closed |
| T-05-07b | Tampering | The guard satisfied by rewriting a citation in `src/` or `bin/` to dodge it | medium | mitigate | `git diff --name-only 1595a82~1 57d3e13 -- src bin` is **empty**. Plan 05-04 repaired the guard, not the citations | closed |
| T-05-SC | Tampering | Package-manager installs | low | **accept** | See Accepted Risks R-05-03 | closed — accepted risk |

*Status: open · closed · closed — accepted risk*
*Severity: critical > high > medium > low — only open threats at or above `block_on` count toward `threats_open`*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| R-05-01 | T-05-07a | `kameaVersion` is a frozen source constant carrying no user input, so the field this phase added widens nothing. The pre-existing `statement` field does carry the untrusted statement verbatim into the JSON working — that is documented behaviour under README § Data Handling (:664) and is unchanged by this phase | Plan-time (05-02), re-verified 2026-08-09 | 2026-08-08 |
| R-05-02 | T-05-11 | `idPrefix` is validated as a non-empty string with no length ceiling; the new attributes add a bounded constant plus copies of an already-emitted value. Growth measured at **3.00× the prefix length**, linear and bounded, with no super-linear blowup. Correction to the plan's own arithmetic: the plan said "one copy," but the escaped prefix now appears **three** times (root `id`, title `id`, `aria-labelledby`), up from one pre-phase. Disposition unchanged; the stated multiplier was wrong | Plan-time (05-03), corrected and re-verified 2026-08-09 | 2026-08-08 |
| R-05-03 | T-05-SC | No package-manager supply-chain surface exists. `package.json` has **no `dependencies` key at all** — only `devDependencies`, untouched by this phase. Recorded as not-applicable in `05-RESEARCH.md` § Package Legitimacy Audit rather than skipped silently | Plan-time (all four plans) | 2026-08-08 |

---

## Audit Findings Beyond the Register

### WARNING — register ID collision

Plans 05-02 and 05-04 both mint `T-05-04`, `T-05-05`, `T-05-06`, and `T-05-07` for unrelated threats. Two of the four collisions pair different severities:

| Raw ID | 05-02 meaning (severity) | 05-04 meaning (severity) |
|---|---|---|
| T-05-04 | kameaVersion derived at build/run time (**high**) | R1 excerpt rule accepts a blank excerpt (**high**) |
| T-05-05 | provenance stamp untied to its data (medium) | excerpt-to-token pairing borrowed across citations (**high**) |
| T-05-06 | version read as a correctness warranty (medium) | citation floor lowered to hide a regression (medium) |
| T-05-07 | new field widening what is emitted (low) | guard dodged by rewriting a citation (medium) |

A register keyed by raw ID silently loses a threat on merge, and the statement "T-05-05 is medium" is true or false depending on which plan you happen to be holding. **The `a`/`b` suffixes in this document are canonical.** This is a register-integrity defect, not a security defect — no threat went unmitigated because of it — but it would have become one at the first merge.

### WARNING — the executor threat-flag channel was empty

`grep -rn -i "threat flag"` across the entire phase directory returns nothing. None of the four summaries carries a `## Threat Flags` section.

Phase 5 is the phase that introduced `--title` — the first mechanism putting arbitrary user text into shipped markup — and the `aria-labelledby` wiring. That is precisely a new-attack-surface event, and the channel designed to surface it produced zero signal. The surface turned out to be correctly handled, so this is a **process gap rather than a security gap**. The consequence worth recording: an empty threat-flag section cannot be read as evidence that no new surface was introduced.

(The same gap was found in Phases 6 and 7. Phase 8 is the only v1.1 phase whose summaries carry the section.)

### Resolved since phase verification

`05-REVIEW.md`'s out-of-scope Critical — `generateSigil(statement, planet, null)` throwing a raw `TypeError` — **no longer reproduces**; the call now returns a valid sigil. Closed by quick task `260808-lu1`, which made `resolveOptions` the single owner of options-bag normalization. No backlog item needed.

### Confirmed clean, deliberately not flagged

- **`glyphLayer` bypasses `escapeXml` on purpose** (svg.js:271-278) and is safe: `glyphFor(pathModel.planet)` reads a closed in-repo literal map keyed by an already-canonicalized planet, and an unknown planet throws `E_UNKNOWN_PLANET` before reaching it. No caller-controlled string arrives.
- **`options.kamea` likewise bypasses escaping** and is overwritten internally (T-03-06, a prior phase).
- **`escapeXml` call-site count in `svg.js` is exactly 2**, matching the committed guard.

---

## ESCALATE — incidental, unregistered, non-blocking

**Control characters and lone surrogates pass through `escapeXml` unescaped**, into both the `<title>` text and the `id`/`aria-labelledby` attribute values, producing an SVG that a strict XML parser rejects outright.

Reproduced independently (statement `A<char>B`, `{ title: true, idPrefix: 'p' }`):

| Input codepoint | Reaches `<title>` raw? | Real-Chromium `DOMParser("image/svg+xml")` |
|---|---|---|
| `U+0000` (NUL) | yes | `wellFormed = false` — "Invalid character" |
| `U+001B` (ESC) | yes | `wellFormed = false` — "PCDATA invalid Char" |
| `U+D800` (lone high surrogate) | yes | `wellFormed = false` — "Invalid bytes in char" |

`escapeXml` handles only the five reserved characters; the XML 1.0 `Char` production additionally excludes NUL, most C0 controls, and lone surrogates.

**This is not injection.** `scriptNodes = 0`, no attribute breakout, and the output parses fine through `innerHTML` in HTML context. It is an **artifact-integrity defect**: a statement containing a stray control byte yields a `.svg` file that standalone XML consumers refuse to open. Self-inflicted by the caller, no trust boundary crossed, and it does not touch any registered threat (T-05-11 is size inflation; T-05-09 is disclosure).

**Suggested severity: low. Recommend a backlog item, not a Phase 5 gap** — it was never in scope for this phase's must-haves, and folding it in retroactively would be scope drift of exactly the kind the phase's own out-of-scope assessment refused.

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Accepted | Open | Run By |
|------------|---------------|--------|----------|------|--------|
| 2026-08-09 | 16 | 13 | 3 | 0 | Claude (gsd-security-auditor, retroactive State B) |

Full suite re-run independently during the audit: **1,532/1,532 passing, 25 files.** Working tree clean — the audit wrote nothing to the repository.

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-08-09

**Carried forward, not blocking:** one incidental low-severity finding (control characters and lone surrogates producing XML-invalid output) is recorded in the ESCALATE section above for backlog triage.
