---
phase: 07
slug: the-sigil-spinner-element
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
block_on: high
created: 2026-08-09
audit_type: retroactive
register_authored_at_plan_time: true
---

# Phase 07 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

**Audit type:** retroactive, run after the v1.1 milestone shipped. The register was authored at plan time across all four plans; what was missing was verification of it.

**Result: SECURED.** 11 threats, 9 mitigations closed, 2 accepted, 0 open. T-07-01 was verified at ASVS L3 depth — end-to-end data-flow trace plus live browser exploitation attempts — rather than at the declared L1, because this is the only browser-executed code in the project and `innerHTML` is the highest-consequence sink in the codebase.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| page HTML → element → `innerHTML` | A page author's attributes become a live DOM subtree in that page's origin | Untrusted attribute text into a markup sink |
| page → registered custom element | `customElements.define` is global and irreversible within a page; there is no unregister API | Tag-name ownership |
| element → browser console | The D-92 error path logs a `SigilError` that can carry statement text | Diagnostic content |
| repo working tree → published tarball | `examples/` and everything outside `files` must not reach the registry | Repo-only artifacts |
| `exports` map → consumer bind surface | Every key is a public API commitment; a wildcard would promise every internal module | API compatibility surface |
| test fixture HTTP server → local filesystem | The Playwright fixture serves over a real `http://` origin so module imports resolve | Local files, while the suite runs |

---

## Threat Register

11 threats across the four plans' `<threat_model>` blocks.

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| **T-07-01** | Tampering | **the element's `innerHTML` write path** (D-86) | **high** | mitigate | Exactly three `innerHTML` sites (`sigil-spinner-element.js:87, 113, 123`) with right-hand sides `''`, `svg`, `''` — no template literal, no concatenation. The element authors zero markup itself; its only DOM authoring is `setAttribute('data-sigil-error', err.code)` over a closed five-value code set. **Empirically attacked:** 31 hostile-attribute cases in real Chromium 151 — 0 executions, 0 injected `script`/`foreignObject`/`img`/`a`/`style`, 0 `on*` attributes, 0 URL-bearing attributes created. Standing regression guard: byte-identity against a live `generateSigil` oracle (`element.test.js:241-252`) | closed |
| T-07-02 | Denial of Service | module-scope `customElements.define` — `NotSupportedError` on a duplicate tag is unrecoverable, no unregister API exists | medium | mitigate | Guarded by `customElements.get(TAG_NAME)` (`:141-143`); behaviourally proven by the double-load test (`element.test.js:386-412`) | closed |
| T-07-03 | Information Disclosure | `console.error` in the D-92 error path can carry statement text | low | **accept** | See Accepted Risks R-07-01 | closed — accepted risk |
| T-07-04 | Tampering | `examples/element.html` must stay repo-only | low | mitigate | `files` array byte-unchanged across the whole phase (the only `package.json` diff is the two `exports` keys); guard at `pack-install.test.js:149-153`. **Verified against the real published tarball**, not a dry run: `1.1.0` ships 19 files, zero under `examples/` | closed |
| T-07-05 | Elevation of Privilege | path traversal against the browser test's local HTTP fixture | medium | mitigate | Guard extracted **verbatim from the fixture** and hammered over real HTTP with 16 traversal payloads (`../`, `%2e%2e%2f`, double-encoded `%252e`, `....//`, backslash, `%00`, `//../`, absolute `/etc/passwd`) against a canary planted outside the root: **0 leaks, all 404**; well-formed controls still 200 | closed |
| T-07-07 | Tampering | `examples/element.html` script block must build no markup by string assignment | medium | mitigate | Grep count for `innerHTML|outerHTML|insertAdjacentHTML|document.write|eval(|new Function` is **0**. Sole live control is `setAttribute('planet', event.target.value)` sourced from a closed seven-`<option>` select. Zero `http(s)://` references, zero `@font-face`; the only `src=` is the relative module | closed |
| T-07-08 | Spoofing | `exports` map — a wildcard `"./*"` would promote every internal module to public API | medium | mitigate | `exports` is exactly `[".", "./element", "./package.json"]`, no wildcard — in the repo **and** in the published 1.1.0 tarball. See residual R-1 | closed (state verified; no standing guard) |
| T-07-09 | Tampering | the `./element` pack probe — `import.meta.resolve` alone has not proven file existence since Node 20.6.0 | medium | mitigate | The probe pairs `import.meta.resolve` with `existsSync(fileURLToPath(...))` exactly as declared (`pack-install.test.js:202-237`), and runs in CI via `npm run test:pack` (`release.yml:61`) | closed |
| **T-07-10** | Tampering | the npm registry — D-98: this phase must not publish | **high** | mitigate | At the phase-close commit `8ec3f82`: `version` is `1.0.0`, `git log 31f4356..8ec3f82 -- .github/workflows/` is empty, and no plan contains a publish task. **The mitigation held at phase scope.** See note P-1 on the later, deliberate publish | closed |
| T-07-11 | Information Disclosure | `python3 -m http.server` from the repo root serves the whole tree during the manual look | low | **accept** | See Accepted Risks R-07-02 | closed — accepted risk |
| T-07-SC | Tampering | package-manager installs | **high** | mitigate | The only `package.json` change across the entire phase is the two `exports` keys; `package-lock.json` untouched; playwright predates the phase. Published 1.1.0 has no `dependencies`, `peerDependencies`, `optionalDependencies`, or `bundleDependencies`. `pack-install.test.js:190` asserts installed top-level `node_modules === ['@falkensmage']` | closed |

*Note: `T-07-06` is unallocated — see Findings. It is a drafting artifact, not a suppressed threat.*

---

## T-07-01 — the detail, because it is the whole phase

`innerHTML` parses in **HTML** context, not XML, so escaping that is correct for a standalone `.svg` file is not automatically sufficient for inline SVG. That concern was the audit's primary line of attack, and the mitigation holds.

Only three caller-controlled strings reach markup, and the mapping is closed:

| Input | Reaches | Control |
|---|---|---|
| `statement` | `<title>` content, only when `show-title` is present | `escapeXml` (`svg.js:683`) |
| `id-prefix` | `id`, `<title id>`, `aria-labelledby` — all double-quoted | one hoisted `escapeXml` (`svg.js:655`) |
| `planet` | `class="sigil sigil--X"` | `resolvePlanetKey` (`kamea.js:187`) rejects anything outside a closed seven-name list *before* the value can reach the class |

`escapeXml` covers `& < > " '`. In a double-quoted HTML attribute value only `"` terminates and `&` opens a reference — both escaped. Inside SVG foreign content the tokenizer stays in Data state (SVG `<title>` is not on the foreign-content breakout list), so `<` would start a real tag — and it is escaped. `&apos;` is a valid HTML5 named reference, so the `'` escape round-trips. Nothing emits `<script>`, `<foreignObject>`, any `on*` attribute, or any URL-bearing attribute. The element passes exactly four fixed camelCase keys, and `generate.js:346` spreads `statement`/`kamea` **last**, so neither can be smuggled through the options bag.

**One result worth recording precisely, because it looks alarming in a log and is not.** The payload `id-prefix='x" xlink:href="javascript:...'` landed as the literal *value* of `id` and `aria-labelledby`. Attribute enumeration on the rendered root returned `["xmlns","viewBox","class","id","role","aria-labelledby"]` — no `xlink:href` was created, `id` is not URL-bearing, and `window.__pwned` stayed `0`. The escaping held; the string merely *contains* text that reads like an attribute.

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| R-07-01 | T-07-03 | The logged `SigilError` can carry statement text — `E_EMPTY_SEQUENCE.details.struck` carries every struck character, and `E_MISSING_STATEMENT.message` carries the JSON-stringified value. Accepted because the statement is **already present in the page's own DOM as an attribute** and readable by anyone with devtools, so the console adds no exposure beyond what the page already holds; and the intact diagnostic is the entire point of D-92. *Wording correction to the plan's rationale: it said the statement is "already rendered visibly in the page's own DOM." It is present as an attribute and inspectable, but only rendered at all when `show-title` is set, and even then into `<title>` — a tooltip/AT surface, not visible text. The load-bearing claim holds; the phrasing overstated it.* | Plan-time (07-01), re-verified and reworded 2026-08-09 | 2026-08-09 |
| R-07-02 | T-07-11 | The documented human-check command (`python3 -m http.server` from the repo root) serves the whole working tree including `.planning/` on localhost for the duration of a one-off visual check. Accepted: localhost-bound, started and stopped by hand, and it ships nowhere — verified, the instruction appears only in `.planning/` artifacts, never in `README.md` or any file inside `files`. The alternative, a bespoke hardened server for a manual look, is machinery serving nothing | Plan-time (07-04), re-verified 2026-08-09 | 2026-08-09 |
| R-07-03 | T-07-11 (second instance) | **The Playwright test fixture has the same exposure as R-07-02 and was not separately registered.** `GET /.planning/STATE.md` returns 200 from the fixture (17,668 bytes). This is inherent to its stated design — serving the repository root over a real `http://` origin is the only way the element's relative module imports resolve. Same rationale as R-07-02: localhost, ephemeral port, only while the suite runs, ships nowhere. Logged separately so the two instances of one risk are both visible rather than one being invisible | Auditor-identified, 2026-08-09 | 2026-08-09 |

---

## Audit Findings Beyond the Register

### WARNING — the reporting channel was silent, not the surface

No `## Threat Flags` section exists in any of `07-01-SUMMARY.md` through `07-04-SUMMARY.md`. All four carry an identical heading set that omits it.

The audit compensated by enumerating the attack surface directly rather than trusting the summaries: all six `observedAttributes`, every attribute read, all three `innerHTML` sites, both `escapeXml` call sites, the full `exports` map, the real published tarball manifest, the example page's two script blocks, and the fixture HTTP server. **Every one maps to an existing register row. No unmapped attack surface was found.**

So the register was complete — but that was established by the audit, not by the channel designed to establish it. An empty threat-flag section on the phase that introduced the project's only browser-executed code cannot be read as evidence that nothing new was introduced.

(Same gap in Phases 5 and 6. Phase 8 is the only v1.1 phase whose summaries carry the section.)

### T-07-06 is a drafting artifact, not a suppressed threat

Zero occurrences of the string anywhere in `.planning/`. IDs were allocated phase-globally across four plans authored in one batch — 07-01 defines 01/02/03/05/SC and skips 04, which 07-02 and 07-03 then claim; 06 simply went unclaimed. A dropped threat would normally leave a cross-reference or a deferral note, and there is none. Confirmed harmless by the surface enumeration above: there is no orphan surface a T-07-06 would have covered. Recorded only because Phase 3's register is contiguous, making this phase the convention outlier.

### P-1 — published state versus phase scope

These are separate questions and are kept separate. The phase's claim was that *this phase* would not publish, and it held. The later `1.1.0` publish (commit `99b6f82`) is the deliberate milestone-close action named in ROADMAP D-98 and is **not** a violation of this threat.

And the audited artifact is the shipped artifact: `src/element/sigil-spinner-element.js` in the published tarball is **byte-identical** to both repo HEAD and the phase-close commit. A full `diff -r` of the published `src/` and `bin/` against HEAD shows exactly one difference anywhere — a doc-comment citation path in `src/data/kamea.js:86`, changed after publish by `6f6d95e`, non-functional.

---

## Residuals — none blocking

**R-1 — T-07-08 has no standing guard.** The plan claimed enforcement "by the exact-three-keys acceptance criterion," but an acceptance criterion is a plan-time check, not a persisted test. `grep -rn exports test/` finds no assertion on the key set; `test/package-identity.test.js` covers only name and import specifier. The *state* is correct and verified in both the repo and the published tarball, which is why the threat is closed — but a future `"./*"` addition would fail no gate. Cheap fix: assert `Object.keys(pkg.exports)` in `test/pack-install.test.js`.

**R-2 — T-07-01's source-assertion half is likewise not persisted.** The behavioural half *is* standing and *is* discriminating — byte-identity against a live oracle goes red the moment any element-local string is added to the output — which is why this threat is closed. But no test reads the element source and asserts the `.innerHTML =` right-hand-side rule, so D-86 itself is guarded only indirectly.

**R-4 — incidental, test-only, adjacent to T-07-05 but not its declared vector.** A single malformed percent-encoded request (`GET /%`) crashes the fixture's host process: `decodeURIComponent` (`element.test.js:81`) throws `URIError: URI malformed` inside the async request handler with no try/catch, surfacing as an unhandled rejection under Node's default throw mode. Reproduced. Availability only, test-only code, localhost, ephemeral port, and unreachable from the suite's own well-formed requests — not a register threat, not blocking. One-line fix if it ever matters: wrap the decode.

**Prior code-review finding WR-01 is not a security gap.** A non-`SigilError` throw rethrows without clearing `innerHTML`, leaving stale content. The stale content is the element's own prior `generateSigil` output — already escaped, never attacker-authored. Correctness and robustness, already dispositioned by the phase's own verification process.

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Accepted | Open | Run By |
|------------|---------------|--------|----------|------|--------|
| 2026-08-09 | 11 | 9 | 2 (+1 auditor-identified second instance) | 0 | Claude (gsd-security-auditor, retroactive State B) |

Suites re-run independently during the audit: `npm test` 25 files / 1,532 tests; `npm run test:browser` 3 files / 38 tests; `npm run test:pack` 1 file / 2 tests. All green. The audit wrote nothing to the repository.

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-08-09

**Carried forward, not blocking:** two guard-coverage residuals (R-1, R-2) where correct state is verified but not defended by a standing test, and one test-only availability nit (R-4).
