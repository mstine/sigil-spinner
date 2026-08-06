---
phase: 01
slug: first-sigil-end-to-end
status: secured
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: 2026-08-06
---

# Phase 01 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| npm registry → local dev environment | Third-party package tarballs execute install-time and test-time code | Package code (dev-only; zero runtime deps) |
| Published source text → shipped data claims | A citation in code asserts provenance a consumer cannot independently check | Kamea grid values + citation text |
| CLI argv / stdin → library | Untrusted, arbitrary-length user text and an untrusted `--output` path cross into the pipeline | Intention statement, planet name, file path |
| library → generated SVG artifact | The artifact is embedded verbatim into third-party HTML pages | Generated markup |
| library → JSON working → consuming page | The working carries the raw statement into whatever renders it | Raw user statement (untrusted) |
| CLI stdout → consuming build pipeline | The pipeline treats the stream as a trusted artifact | SVG / JSON artifact |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-01-SC | Tampering | npm installs (vitest, typescript, @types/node, eslint, prettier) | high | mitigate | Package Legitimacy Audit (01-RESEARCH.md) + blocking human checkpoint approved before `npm install`; `package-lock.json` committed (enforcing pin — note: `package.json` uses caret ranges, the lockfile is the actual control) | closed |
| T-01-01 | Tampering | `src/render/svg.js` optional title element | medium | mitigate | `escapeXml()` five-entity transform applied to statement (svg.js:174); title emitted only under explicit `title` option (D-16); well-formedness test covers angle brackets/ampersands | closed |
| T-01-02 | Tampering | `bin/sigil-spinner.js` stdout stream | high | mitigate | stdout carries only the selected artifact; all diagnostics to stderr with nonzero exit; subprocess tests assert empty stdout on every error path (test/cli/cli.test.js) | closed |
| T-01-03 | Denial of Service | `src/text/normalize.js` regexes | low | mitigate | Simple non-nested character classes only (`NON_LETTER`, `VOWELS`); no nested quantifiers, no catastrophic backtracking surface | closed |
| T-01-04 | Information Disclosure | `working.statement` rendered by a downstream consumer | medium | transfer | Documented as untrusted input requiring consumer-side HTML-escaping in README "Data Handling" and JSDoc; library returns data, not markup | closed |
| T-01-05 | Information Disclosure | Generated SVG embedded on a public page | medium | mitigate | Statement omitted from artifact by default (D-16); no title/desc/data attribute carries it without opt-in; acceptance test asserts absence; confirmed in UAT Test 2 | closed |
| T-01-06 | Repudiation | `src/data/kamea.js` module header citation | medium | mitigate | Header records what was actually verified and how (D-01/D-04 honest provenance); human-confirmed in UAT Test 1 | closed |
| T-01-07 | Tampering | Kamea grid literals | high | mitigate | Exact-value tests for every cell of all seven grids plus magic-sum tests (test/data/kamea.test.js); no generator in `src/`; verifier independently re-summed all grids | closed |
| T-01-08 | Tampering | stdout artifact stream consumed by a build pipeline | high | mitigate | Same control as T-01-02 — artifact-only stdout, stderr diagnostics (bin/sigil-spinner.js) | closed |
| T-01-09 | Tampering | `--output <file>` path | low | accept | See Accepted Risks Log R-01 | closed |
| T-01-10 | Denial of Service | stdin read via fd 0 on dash positional | low | accept | See Accepted Risks Log R-02 | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| R-01 | T-01-09 | `--output` path comes from the invoking user's own shell and is written with that user's own privileges; no privilege boundary is crossed — path restriction would only constrain the user against themselves | Plan 01-03 threat model (plan-time disposition) | 2026-08-04 |
| R-02 | T-01-10 | Synchronous stdin read of an unbounded pipe can block or exhaust memory, but input is supplied by the invoking user in their own process; documented rather than bounded | Plan 01-03 threat model (plan-time disposition) | 2026-08-04 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-08-06 | 11 | 11 | 0 | gsd-secure-phase L1 grep-depth verification (short-circuit: plan-time register, threats_open 0, ASVS L1) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
