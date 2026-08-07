---
phase: 3
slug: themeable-embeddable-layers
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: 2026-08-07
---

# Phase 3 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

Register authored at plan time (all four PLAN.md files carry parseable `<threat_model>` blocks), so the audit verified declared mitigations rather than building a retroactive STRIDE register. Verified by `gsd-security-auditor` against the implemented code, not against the plans' own assertions.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Caller → library | `generateSigil(statement, planet, options)` — the only public entry point (`src/index.js` exports just `generateSigil` and `SigilError`) | Intention statement (untrusted text), planet name, and the option object including the caller-controlled `idPrefix` string |
| Library → generated markup | The emitted SVG string, which a build tool embeds directly into a page | `idPrefix` is the only caller-controlled value that reaches markup as an **attribute**; the statement reaches markup only as `<title>` text and only when `title: true` (D-16, off by default) |
| CLI → filesystem | `--output <path>` write; `-` stdin read | Artifact bytes out; statement text in |

There is no network boundary. The package declares no runtime dependencies and opens no socket.

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-03-01 | Tampering | `src/render/glyphs.js` glyph map | low | accept | Closed literal map; five-reserved-char assertion `test/render/glyphs.test.js:20` | closed |
| T-03-02 | Info disclosure | glyph layer / working `render` block | medium | mitigate | `svg.js:281-295` reads only `pathModel.planet`; `generate.js:265-270` emits option values only; leak guard `theming.test.js:353-364` | closed |
| T-03-03 | Tampering | statement shadowing via options | medium | mitigate | `generate.js:253` spread order; probe confirmed a caller-supplied `statement` key is not honored | closed |
| T-03-04 | DoS | statement length | low | accept | Cost linear in kept letters; viewBox fixed | closed |
| T-03-05 | Tampering | `--output` write | low | accept | Non-atomic write documented `README.md:68-71` | closed |
| T-03-06 | Tampering | kamea substitution via options | medium | mitigate | Spread order confirmed last (`generate.js:253`); **defense in depth** — `resolveOptions` iterates only `KNOWN_OPTIONS`, so `kamea` never enters `resolvedOptions`. Probe: a forged 3×3 of all 9s was ignored, output byte-identical, canonical Lo Shu intact | closed |
| T-03-07 | Tampering | grid-number text nodes | low | accept | ASCII-digits-only assertion `test/render/grid.test.js:155` | closed |
| T-03-08 | Spoofing | planet resolution | low | accept | `canonicalPlanet` resolved once `generate.js:239`, reused downstream | closed |
| T-03-09 | Info disclosure | grid layer inputs | low | accept | `svg.js:221-229` reads only `options.kamea` + `gridSize` | closed |
| T-03-10 | DoS | grid element count | low | accept | Bounded at order² ≤ 81 | closed |
| T-03-11 | Tampering | curve degenerate input | medium | mitigate | Exact-zero knot guard `curve.js:156-164`; finite-token assertion 7 planets × 2 fixtures `curve.test.js:260`; no-exponent `:190` | closed |
| T-03-12 | Tampering | `curve` option type | low | accept | Type-checked `generate.js:126` | closed |
| T-03-13 | DoS | curve command count | low | accept | One command per segment, no recursion `curve.js:197-201` | closed |
| T-03-14 | Repudiation | determinism of curved output | medium | mitigate | Single shared `roundGeometry` `coords.js:51-54`; each control point rounded exactly once `curve.js:169-172`; endpoints re-emitted from already-rounded points, never re-rounded; multiplication-not-accumulation `svg.js:170,174`. **Cross-process probe:** three separate `node` invocations produced identical SHAs for venus (100/7) and moon (100/9) curved output | closed |
| T-03-15 | Tampering | construction pipeline drift | medium | mitigate | `git diff` over `src/path`, `src/text`, `src/data` across the entire phase is **empty**; construction-field invariance `svg.test.js:247-255` | closed |
| **T-03-16** | **Tampering** | **`idPrefix` → root `id` attribute, `src/render/svg.js`** | **high** | **mitigate** | **See dedicated section below — all four required conditions verified** | **closed** |
| T-03-17 | Spoofing | id collision across embeds | medium | mitigate | Sole id route `svg.js:646-649`; cross-product guard `theming.test.js:301-316`; D-45 paired tests `determinism.test.js:287-316` including the documented same-prefix collision | closed |
| T-03-18 | Repudiation | non-deterministic source reaching the artifact | medium | mitigate | Grep of `src/` + `bin/` for `Math.random`, `Date.now`, `new Date`, `performance.now`, `crypto`, `randomUUID`, `hrtime`, `process.pid` → **zero matches** | closed |
| T-03-19 | Info disclosure | statement leaking into the artifact | medium | mitigate | 4+ char statement-run guard across 128 renders `theming.test.js:353-364` | closed |
| T-03-20 | Tampering | text-node escaping | low | accept | `glyphs.test.js:20` + `grid.test.js:155` | closed |
| T-03-21 | Tampering | output path handling | low | accept | Unchanged this phase; documented `README.md:68-71` | closed |
| T-03-22 | DoS | combined layer cost | low | accept | Linear + grid ≤ 81 + ≤ 1 glyph, fixed viewBox | closed |
| T-03-SC | Tampering | supply chain | low | accept | `package.json` has **no `dependencies` key at all**; `npm ls --omit=dev` → empty; only bare specifiers in `src/`+`bin/` are `node:fs` and `node:util` | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Only open threats at or above `workflow.security_block_on` (high) count toward `threats_open`.*

---

## T-03-16 — the phase's one high-severity threat

`idPrefix` is the first and only caller-controlled string this project has ever emitted into SVG **markup** as an attribute value. Until this phase the sole untrusted input was the intention statement, which is escaped and omitted by default (D-16). The generated SVG is embedded directly into pages a build tool constructs, so an attribute break-out is arbitrary markup injection into a real page.

Verified against all four required conditions:

| # | Condition | Result | Evidence |
|---|---|---|---|
| 1 | `escapeXml` applied on **every** emission path, not just the tested one | PASS | `id="` appears exactly once in all of `src/` (`svg.js:646-649`), escaped. `src/index.js:7-8` exports only `generateSigil` and `SigilError` — `renderSvg` is not public, so no caller-reachable second path exists. Pinned by `svg.test.js:302-309`, which asserts exactly two non-comment `escapeXml(` invocations. |
| 2 | All five reserved characters, **both** quote forms | PASS | `escapeXml.js:13-19` maps `& < > " '`; regex `/[&<>"']/g` at `:26`. Live probe of `idPrefix = "&<>\"'"` returned fully entity-encoded output. No single-quote gap. |
| 3 | Hostile-prefix test exists, runs, asserts the right things | PASS | `svg.test.js:284-290` (no injected element, `&quot;` present, exactly one `id`) and `:292-296` (exact entity forms). Both green. |
| 4 | Validation in the **library**, not the CLI | PASS | `generate.js:117-147` `resolveOptions`, called at `:192`. Probe via the public API: `123`, `true`, `{}`, `[]`, `''`, `null` all throw `E_INVALID_OPTION`. `bin/sigil-spinner.js:119-122` explicitly defers (ARCHITECTURE.md Anti-Pattern 3). |

Independent live probe with `x" onload="alert(1)"><script>bad()</script><a b='` produced a single, fully entity-encoded `id` on the root element: no `<script>`, no raw `"` inside the attribute value, no second attribute.

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| R-03-01 | T-03-05, T-03-21 | `--output` writes are non-atomic: a concurrent writer or a process killed mid-write can leave a partial file. Documented in README rather than made atomic; the consumer owns the output path and the failure is visible, not silent. Unchanged this phase. | Matt Stine | 2026-08-07 |
| R-03-02 | T-03-04, T-03-10, T-03-13, T-03-22 | Resource cost is linear in kept letters, with the grid bounded at order² ≤ 81 and at most one glyph inside a fixed viewBox. There is no unbounded amplification and no server to exhaust. | Matt Stine | 2026-08-07 |
| R-03-03 | T-03-SC | Supply chain accepted on the basis that this phase installs zero packages and the published package declares no runtime dependencies at all. Verified against `package.json` and `npm ls --omit=dev`, not asserted. | Matt Stine | 2026-08-07 |
| R-03-04 | T-03-17 | Two sigils given the **same** caller-supplied `idPrefix` do collide, by design (D-44). Determinism forbids the library inventing a per-call unique value, so uniqueness under identical prefixes is the caller's documented responsibility. | Matt Stine | 2026-08-07 |

---

## Audit Trail

## Security Audit 2026-08-07

| Metric | Count |
|--------|-------|
| Threats found | 26 register entries (23 unique IDs; T-03-SC declared once per plan) |
| Closed | 26 |
| Open | 0 |

Verification depth: ASVS L1, block on `high`. The L1 short-circuit (skip the auditor when preliminary classification shows zero open threats) was **deliberately declined** — `T-03-16` is the sole `high` and sits exactly at the block threshold, so closing it on a grep-level classification would have made the gate ceremonial. The auditor ran with live probes against the public API.

### Findings beyond the register

1. **Code review WR-02 is a false positive and should be reclassified as invalid, not carried as debt.** `03-REVIEW.md:61-66` claims `formatCoord` can emit a `-0` token because `String(-0) === '-0'`. That premise is factually wrong: ECMAScript `Number::toString` (§6.1.6.1.20) maps `-0𝔽` to `"0"`. Independently confirmed — `roundGeometry(-1e-13)` does produce a `-0` *value* (`Object.is` agrees), but it formats as `"0"`. A `-0` value can occur; a `-0` token cannot. T-03-14's determinism contract is not opened by it.

2. **No `## Threat Flags` section exists in any of the four SUMMARY.md files.** Absence was not treated as an all-clear: the auditor independently enumerated the caller-reachable surface (`idPrefix`, `kamea`/`statement` option shadowing, `--output`, determinism) and every element maps to a registered threat. Worth fixing the executor template so the section is emitted explicitly rather than inferred — otherwise a future phase's silence is indistinguishable from a clean bill of health.

### Scope note

Threat verification covers the security surface only. It is **independent of** UAT gap `G-03-1` (the two `font-size` custom properties resolving to `inherit`), which is a correctness and theming-contract defect with no security dimension — an inert style hook grants no capability and leaks nothing.
