---
phase: 02
slug: every-planet-every-statement
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
block_on: high
register_authored_at_plan_time: true
created: 2026-08-06
---

# Phase 02 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

Register assembled from the `<threat_model>` blocks of all four Phase 2 plans (02-01, 02-02, 02-03, 02-04) plus the `## Threat Flags` sections of their SUMMARYs. All four plans authored a threat model at plan time, so this audit **verifies mitigations** rather than constructing a retroactive STRIDE register.

Verified at **ASVS Level 1** (grep-depth plus live behavioral probes), block threshold `high`.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| shell argv / stdin → `bin/sigil-spinner.js` | Arbitrary untrusted bytes from the invoking user's command line or pipe. Phase 2 changed how *failures* on this boundary are reported (02-04 Task 4). | Raw statement text, flag tokens |
| caller → `generateSigil(statement, planet, options)` | Arbitrary untrusted string reaches the text layer. Phase 2 changed how that string is folded (02-04 Task 3) and how a total-strike failure is described (02-04 Task 1). | Statement text |
| library → emitted SVG string on stdout | Untrusted text reaches markup only through the optional `<title>` element. Unchanged across Phase 2. | Escaped statement text (opt-in only) |
| library / CLI → stderr diagnostic | Error messages echo fragments derived from the user's own input. Widened slightly by 02-04 Tasks 1 and 4. | Struck characters, reasons, offending flag token |

No new trust boundary was introduced in Phase 2. Two existing boundaries changed their transformation or their reporting.

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-02-01 | Denial of Service | `src/text/fold.js` regexes | medium | mitigate | Every text-layer regex is a bare character class — `/[̀-ͯ]/g`, `/[AEIOU]/`, `/[^A-Z]/`. No nested quantifier, no alternation, no backtracking path. | closed |
| T-02-02 | Denial of Service | `foldStatement` under stacked combining marks ("Zalgo") | low | mitigate | Live probe: 5,000 stacked marks folded to `["B"]` in 1 ms — linear, one bounded pass per base character. | closed |
| T-02-03 | Tampering | `renderSvg` `<title>` path, `src/render/escapeXml.js` | high | mitigate | `escapeXml` replaces `[&<>"']` on the only text-into-markup path (`svg.js:391`). Live injection probe confirms zero raw metacharacters survive. Regression test at `test/render/svg.test.js:65`. | closed |
| T-02-04 | Information Disclosure | JSON working `keptTrail` / struck entries | low | accept | See Accepted Risks AR-1. | closed (accepted) |
| T-02-05 | Repudiation | Unicode confusables folding distinct inputs alike | low | accept | See Accepted Risks AR-2. | closed (accepted) |
| T-02-06 *(02-02)* | Information Disclosure | `SigilError.details.struck`, enriched `E_EMPTY_SEQUENCE` | medium | mitigate | Payload limited to struck characters and their reasons; the raw statement is not added to `.details`. Delivered to the same caller who supplied it, via a thrown exception — no log or network sink. | closed |
| T-02-06 *(02-03)* ⚠ | Denial of Service | `loopLayer` output size | low | accept | See Accepted Risks AR-3. **ID collides with the 02-02 entry above — see Register Defects.** | closed (accepted) |
| T-02-07 *(02-02)* | Denial of Service | `foldStatement` Zalgo stress | low | mitigate | Fifty-mark stress vector committed in `test/text/fold.test.js`; independently reprobed at 5,000 marks. | closed |
| T-02-07 *(02-03)* ⚠ | Tampering | Loop geometry as a determinism surface | medium | mitigate | Seven `matrix-repeat-*.svg` snapshots pin loop geometry at every kamea order; all values pass the single `roundGeometry` point. **ID collides with the 02-02 entry above — see Register Defects.** | closed |
| T-02-08 | Denial of Service | Regex backtracking in the text layer | medium | mitigate | Same evidence as T-02-01. Phase 2 added exactly one regex (`COMBINING_MARKS`), a single global character class. | closed |
| T-02-09 | Tampering | `<title>` element, `escapeXml` | high | mitigate | Duplicate control of T-02-03; same live probe evidence. Title is opt-in — default output embeds no statement text (probe: statement absent when `title` unset). | closed |
| T-02-10 | Repudiation | Committed snapshots under `test/__file_snapshots__/` | low | mitigate | 26 snapshots committed and byte-pinned. Output drift fails the suite loudly rather than silently altering embedded sigils. | closed |
| T-02-SC | Tampering | npm installs | high | mitigate | `dependencies: {}`. `package.json` last modified by `a50c88e` (Phase 1 scaffold); zero changes across every Phase 2 commit. No Package Legitimacy Audit triggered. | closed |
| T-02-04-01 | Tampering | `renderSvg` `<title>` path, `escapeXml` | high | mitigate | Duplicate control of T-02-03. 02-04 opened no renderer file; `git diff --exit-code -- src/render` clean across all four plans. `TRANSLITERATION_MAP` values constrained A-Z by test, so no table entry can inject a character into markup. | closed |
| T-02-04-02 | Tampering | `TRANSLITERATION_MAP` as a homoglyph surface | medium | mitigate | Widened folding is the *intended* fix for the `Đ`/`Ð` confusable, made deliberate rather than accidental: 84 keys, every value A-Z-only, case-pair completeness asserted, equivalence byte-pinned on all seven planets, excluded classes carry negative pins (`Ĳ`, `Ǝ`, `Ɓ`). Table is a source literal, never loaded at runtime. | closed |
| T-02-04-03 | Tampering | Fold classification as a determinism surface | medium | mitigate | Seven new `matrix-stroke-*.svg` snapshots pin fold behavior at kamea orders 3 through 9; all 19 pre-existing snapshots verified byte-identical. | closed |
| T-02-04-04 | Information Disclosure | `E_EMPTY_SEQUENCE` message, `.details.struck`, CLI stderr | low | accept | See Accepted Risks AR-4. | closed (accepted) |
| T-02-04-05 | Tampering | Terminal escape sequences in argv reflected to stderr | low | accept | See Accepted Risks AR-5. | closed (accepted) |
| T-02-04-06 | Denial of Service | `readFileSync(0, 'utf-8')` unbounded stdin read | low | accept | See Accepted Risks AR-6. | closed (accepted) |
| T-02-04-SC | Tampering | npm/pip/cargo installs | high | mitigate | Same evidence as T-02-SC. 02-04 installed zero packages; `package.json` absent from its `files_modified`. | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above `high` count toward `threats_open`*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

**20 register entries · 20 closed · 0 open.** Five high-severity entries reduce to two distinct controls: XML escaping on the `<title>` path (T-02-03 / T-02-09 / T-02-04-01) and the zero-runtime-dependency guarantee (T-02-SC / T-02-04-SC).

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-1 | T-02-04 | The JSON working intentionally echoes the caller's own statement and its derivation back to that caller. Never persisted, never transmitted. `src/render/json.js` documents that consumers must escape `working.statement` before rendering it into HTML. | Plan 02-01 (planner), ratified at audit | 2026-08-06 |
| AR-2 | T-02-05 | Not a security boundary for this tool. Deterministic, documented folding is the intended contract (D-22) — identical folded input producing an identical sigil is the feature. 02-04 made this *more* deliberate by closing the stroke/bar class and pinning the opt-out boundary. | Plan 02-01 (planner), ratified at audit | 2026-08-06 |
| AR-3 | T-02-06 *(02-03)* | Loop element count is bounded by extra visits, bounded by kept letters, bounded by statement length — strictly linear, no nested iteration. A caller can only inflate their own returned string. | Plan 02-03 (planner), ratified at audit | 2026-08-06 |
| AR-4 | T-02-04-04 | Both surfaces echo fragments of input the invoking user themselves supplied, over a local process boundary to that same user's stderr. No second principal, no network, no log sink, no stored artifact. Correct at ASVS L1 for a local dependency-free CLI. | Plan 02-04 (planner), ratified at audit | 2026-08-06 |
| AR-5 | T-02-04-05 | **Confirmed by live probe:** raw ESC bytes in a malformed flag do reach stderr verbatim (`E_CLI_USAGE: Unknown option '--x^[[31mRED^[[0m'…`). This is a strict *reduction* of prior exposure — Node's own uncaught-exception handler printed the same bytes plus a stack trace. Attacker and victim are the same shell user. Control-character sanitization for terminal output is a canon hardening item (pairs with review finding WR-07 on XML-invalid control characters), not a phase-scoped mitigation. | Plan 02-04 (planner), ratified at audit | 2026-08-06 |
| AR-6 | T-02-04-06 | The read has no size bound, so a very large pipe can exhaust process memory. The caller owns the process; no multi-tenant surface; failure is confined to their own invocation. 02-04 strictly improved the failure mode — a read error now yields one `E_CLI_STDIN` diagnostic and exit 2 instead of an unhandled exception (`bin/sigil-spinner.js:117-121`). A byte cap would be a new product constraint, not a defect fix. | Plan 02-04 (planner), ratified at audit | 2026-08-06 |

---

## Verification Evidence

Live probes run at audit time, not inherited from plan claims:

| Check | Command / probe | Result |
|-------|-----------------|--------|
| XML escaping (high) | `generateSigil('AB<script>alert(1)</script>&"\'', 'saturn', {title:true})` | `<title>AB&lt;script&gt;alert(1)&lt;/script&gt;&amp;&quot;&apos;</title>` — zero raw `<`, `>`, `"`, `'`; zero unescaped `&` |
| Title opt-in (high) | same statement, `title` unset | statement absent from output entirely |
| Zero installs (high) | `package.json` `dependencies`; `git log -- package.json package-lock.json` | `{}`; last touched `a50c88e` (Phase 1), zero Phase 2 changes |
| Regex safety (medium) | enumerate all text-layer regexes | `/[̀-ͯ]/g`, `/[AEIOU]/`, `/[^A-Z]/` — all bare character classes |
| Zalgo DoS (low) | 5,000 stacked combining marks through `generateSigil` | folded to `["B"]` in 1 ms |
| Homoglyph determinism (medium) | `generateSigil('ĐHT',p).svg === generateSigil('ÐHT',p).svg` ∀ 7 planets | `true`; 84 keys, all values A-Z, zero case-pair gaps |
| Opt-out boundary (medium) | `normalize('Ĳ')`, `normalize('Ǝ')`, `normalize('Ɓ')` | all struck, reason `non-letter` — class closed, not widened indefinitely |
| Snapshot integrity (medium) | `git diff --exit-code` over 19 pre-existing snapshots | exits 0 |
| CLI/library boundary (INT-04) | `grep 'E_CLI_USAGE\|E_CLI_STDIN' src/errors.js` | 0 matches — CLI-local codes never entered the library taxonomy |
| stdin exception safety | `bin/sigil-spinner.js:117-121` | `readFileSync(0)` inside `try`, catch routes to `diagnose(E_CLI_STDIN, …, 2)` |

---

## Register Defects (planning-artifact findings, non-blocking)

Recorded so they do not silently recur. Neither affects `threats_open`.

1. **Threat-ID collision across plans.** `T-02-06` and `T-02-07` were each independently minted by plan 02-02 and plan 02-03 for *different* threats with different categories, components, and severities:
   - `T-02-06` = Information Disclosure / `SigilError.details.struck` (02-02) **vs.** Denial of Service / `loopLayer` output size (02-03)
   - `T-02-07` = Denial of Service / Zalgo (02-02) **vs.** Tampering / loop geometry determinism (02-03)

   Plans within a phase mint threat IDs from a per-plan counter with no phase-wide registry, so parallel-wave plans collide. Plan 02-04 avoided this by using the `T-02-04-NN` plan-qualified form. **Recommendation:** adopt the plan-qualified form (`T-{phase}-{plan}-{NN}`) phase-wide, or allocate IDs from a phase-level register. Both colliding pairs are disambiguated in this document by plan attribution.

2. **`T-02-03` / `T-02-09` / `T-02-04-01` are the same control restated three times.** Not an error — each plan correctly re-declared the inherited Phase 1 mitigation as a regression guard — but the register reads as five high-severity threats when there are two distinct controls. Noted so a future reader does not overcount the surface.

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-08-06 | 20 | 20 | 0 | orchestrator (ASVS L1 short-circuit — register authored at plan time, `threats_open: 0`, live probes) |

**Audit method.** Per `secure-phase.md` Step 3, the short-circuit rule applied: `threats_open: 0` AND `register_authored_at_plan_time: true` AND `asvs_level == 1` → L1 grep-depth is sufficient and no `gsd-security-auditor` spawn was required. Classification was not taken on the plans' word — every high- and medium-severity mitigation was independently reprobed against the built code, and the two accepted CLI risks introduced by 02-04 were exercised live to confirm the acceptance is factually accurate rather than assumed.

**Escalation note.** If `workflow.security_asvs_level` is raised to 2 or 3, this short-circuit no longer applies — L2 boundary-placement and L3 end-to-end trace checks require a full auditor pass. Re-run `/gsd-secure-phase 02` after any level change.

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-08-06
