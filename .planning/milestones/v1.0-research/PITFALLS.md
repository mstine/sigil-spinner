# Pitfalls Research

**Domain:** Planetary kamea sigil generator — Node CLI + library, CSS-stylable SVG output
**Researched:** 2026-08-04
**Confidence:** HIGH (kamea orientation, SVG styling, Node packaging — corroborated by multiple independent sources); MEDIUM-HIGH (text-processing edge cases — domain reasoning + standard software patterns, not a directly citable "sigil generator gotchas" corpus)

## Critical Pitfalls

### Pitfall 1: Kamea Orientation Ambiguity — Mathematically Valid, Traditionally Wrong

**What goes wrong:**
Every planetary kamea has 8 dihedral variants (4 rotations × mirror) that are all mathematically valid magic squares — identical row/column/diagonal sums, identical magic constant — but place the digits 1–9 in *different cells*. Since sigil shape is determined entirely by cell position (not just cell value), tracing the same number sequence across two orientation-variants of "the same" Saturn square produces two different-looking sigils. Both will "work" in the sense that nothing crashes and nothing looks obviously broken — the sigil is just traditionally wrong, silently. Confirmed directly: French esoteric source Aeternum states plainly that "several possible arrangements... correspond to the form transmitted in the old editions of Agrippa's work, but other versions may appear in some more modern books: these simply result from a rotation or inversion of the square." Modern web sources (chaostarot.com, learnreligions.com, Golden Dawn material, Skinner reprints) do not all agree on orientation.

**Why it happens:**
The magic-square *math* (row/col/diagonal sums = constant) is the only thing most sources bother to verify, because it's the only thing that's checkable at a glance. Orientation is treated as a cosmetic afterthought by most publishers reproducing the squares, so scanned/OCR'd/redrawn tables drift from the original silently across centuries of reprints. There is no single "the" canonical Agrippa layout that's universally agreed — there are canonical-*per-lineage* layouts (Agrippa's own woodcuts, Golden Dawn's redrawing, modern chaos-magic reprints), and they don't all match.

**How to avoid:**
- Pick ONE explicit primary source for all seven kameas (e.g., a specific verified edition/translation of *De Occulta Philosophia* Book II, or a single well-regarded secondary compilation like Skinner's *Complete Magician's Tables*) and hard-code all seven grids as literal 2D array data from that one source — never mix sources between planets.
- Document the source and orientation convention explicitly in the README/JSON metadata (e.g., "Saturn kamea, top row 4-9-2, per [source]") so downstream disagreement is falsifiable, not guessed at.
- Do not "derive" squares from a generic magic-square-generation algorithm (see Pitfall 2) — always start from the literal published grid.
- Cross-check the chosen source's Saturn 3×3 against at least one independent source before locking it in — Saturn is small enough to eyeball-verify, and disagreement here is the canary for the whole set.

**Warning signs:**
- Kamea data defined inline in rendering code rather than as a separate, named, sourced data module.
- No code comment or doc citing where each grid came from.
- Any planet's grid pulled from a different website/book than the others.
- Nobody can answer "why does Saturn's 5 sit in the center?" with a citation.

**Phase to address:**
Core algorithm / data phase (must be locked before SVG rendering work begins — rendering built on a wrong grid means every visual/CSS decision has to be redone once the grid is corrected).

---

### Pitfall 2: Generating Magic Squares Algorithmically Instead of Hard-Coding Agrippa's Specific Squares

**What goes wrong:**
For orders 4 and above, a given magic constant does not correspond to a unique magic square — there are 880 distinct normal 4×4 magic squares alone, and vastly more for 5×5–9×9. A generic magic-square construction algorithm (Siamese/De la Loubère method for odd orders, LUX method for singly-even, doubly-even swap method) will produce *a* valid magic square of the right order and constant, but there is no guarantee it reproduces Agrippa's specific historical square, because different construction methods and different starting corners yield different — still mathematically valid — squares.

**Why it happens:**
It's tempting to implement "the algorithm for generating an N×N magic square" once and parameterize it by order, since that's a well-known, satisfying CS exercise, and it *looks* like it solves the whole kamea problem in one function. It solves "produce a magic square," not "produce the kamea."

**How to avoid:**
Treat kamea data as a fixed lookup table (7 literal grids), never as generated output. If generation is used at all, use it only as a *verification* tool — confirm the hard-coded grid actually sums correctly — never as the source of the shipped values.

**Warning signs:**
- Any function named like `generateMagicSquare(order)` feeding directly into sigil rendering.
- Tests that only assert "rows/cols/diagonals sum to the constant" without also asserting exact cell values against the sourced reference grid.

**Phase to address:**
Core algorithm / data phase.

---

### Pitfall 3: Chaldean/Pythagorean Table Conflation

**What goes wrong:**
The project's stated method is the modern cycling Pythagorean table (A=1…I=9, J=1…R=9, S=1…Z=8). Chaldean numerology is a *different, incompatible* system: it uses 1–8 only (9 is sacred and unassigned), and letters are NOT assigned sequentially by alphabet position — they're grouped by claimed "vibration" (e.g., A=1, B=2, C=3, D=4, E=5, U=6, O=7, F=8, P=8, G=3 — note the non-alphabetical order and repeated values). Because so much numerology content on the open web blends terminology loosely ("numerology letter values" pages frequently present Chaldean and Pythagorean tables side by side or don't name which is which), it's easy to accidentally copy Chaldean-order values into what's supposed to be a Pythagorean table, or to build a table generator that silently produces neither system consistently.

**Why it happens:**
Both systems get called "the numerology table" colloquially. Reference material online is inconsistent about labeling. A developer skimming for "the letter-to-number table" can grab the wrong one without realizing two systems exist.

**How to avoid:**
- Generate the Pythagorean table programmatically from the cycling formula (`((charCode - 'A'.charCode) % 9) + 1`), not by copying a table off a webpage — this makes the "wrong system" class of bug structurally impossible, since Chaldean's non-alphabetical letter groupings cannot be produced by a cycling formula.
- Bake explicit test vectors into the test suite: A=1, I=9, J=1, R=9, S=1, Z=8 (the digits that most sharply distinguish "cycling every 9" from any Chaldean variant).
- Name the exported table/function unambiguously (`pythagoreanTable`, not `numerologyTable`) so a future contributor can't accidentally swap in a Chaldean table without the name lying to them.

**Warning signs:**
- A hard-coded 26-entry letter→number lookup object copy-pasted from a numerology website rather than derived from the cycling formula.
- Any letter mapped to 0 or left undefined (Chaldean's "9 is unassigned" pattern leaking in).
- Table values that don't increase monotonically with alphabet position within each 1–9 cycle.

**Phase to address:**
Core algorithm / data phase.

---

### Pitfall 4: Legacy I/J and U/V Table Contamination

**What goes wrong:**
Historically, Latin lacked distinct letters for I/J and U/V (J and V are medieval-and-later graphical variants of I and U). Some older esoteric/gematria-adjacent letter-number correspondence tables — the kind that show up when researching "traditional" numerology sources — collapse I/J and U/V into shared values as a result. If reference material for this project is drawn from those older/mixed-lineage tables instead of the specific modern-cycling Pythagorean system the project has committed to, I and J (or U and V) could silently end up sharing a value, which is wrong for the system actually specified in `PROJECT.md`.

**Why it happens:**
"Traditional" and "historical" are seductive words when researching an esoteric-correctness domain, and it's easy to reach for genuinely older sources that don't match the specific (comparatively modern, early-20th-century) Pythagorean cycling convention the project has already chosen.

**How to avoid:**
Same fix as Pitfall 3: derive the table from the cycling formula, don't transcribe it from a scanned/historical table. This makes I≠J and U≠V (I=9, J=1, U=3, V=4 under the cycling formula) a structural guarantee rather than a fact someone has to remember to preserve.

**Warning signs:**
Same as Pitfall 3 — this is really the same root cause (transcription vs. derivation) wearing a different hat.

**Phase to address:**
Core algorithm / data phase.

---

### Pitfall 5: Degenerate Text-Processing Inputs Producing Empty or Single-Node Sigils

**What goes wrong:**
A statement composed entirely of vowels and/or repeated letters (e.g., "I Owe Awe", "A A A A", "Aeaeaeaeae") reduces to zero unique consonant-bearing letters after the strike-vowels-and-repeats step. A statement with exactly one unique kept letter reduces to a single number and thus a single point — no line segments exist to trace. Both are edge cases the "happy path" implementation won't hit during normal development/testing, but real users *will* hit them (test statements especially — "I am" is a completely plausible affirmation fragment that reduces to nothing).

**Why it happens:**
The core algorithm is naturally developed and tested against statements that behave well ("I will succeed" → plenty of consonants). Nobody writes the zero-consonant or one-consonant test case unless they deliberately think to.

**How to avoid:**
- Explicitly define and implement behavior for both cases before shipping: empty sequence should raise a clear, actionable error (not emit a blank/invalid SVG) telling the user their statement reduced to nothing; single-node sequence should render a single point/dot marker as valid, intentional output — not a broken empty `<path d="">`.
- Add both cases as first-class test fixtures, not just incidental coverage.
- Since determinism is a stated project value, both behaviors need to be documented as part of the contract, not left as accidental implementation details.

**Warning signs:**
- No test statement in the suite that strikes down to 0 or 1 unique letters.
- Path-drawing code assumes `sequence.length >= 2` without an explicit guard.
- CLI silently exits 0 on an empty sequence instead of a nonzero exit code + stderr message.

**Phase to address:**
Core algorithm phase (input validation); verified again in SVG rendering phase (degenerate path rendering).

---

### Pitfall 6: Non-ASCII / Accented Letters and Ambiguous "Y" Handling

**What goes wrong:**
Two related text-normalization gaps: (1) accented Latin letters ("café", "naïve", "résumé") aren't in a bare A–Z table lookup, and without explicit normalization they either crash on an undefined table key, get silently dropped (changing the letter sequence and therefore the sigil in a way the user can't predict), or throw an unhelpful error deep in the number-mapping step; (2) "Y" is phonetically a vowel in some words (myth, sky) and a consonant in others (yellow, yes) — most vowel-stripping implementations hard-code AEIOU and treat Y as always-consonant, which is a defensible traditional convention but is a *choice*, not a fact, and if left implicit/undocumented, different contributors (or Claude Code, generating sigils on Matt's behalf) may reason about it inconsistently.

**Why it happens:**
English-centric AEIOU vowel lists are the default mental model; accented characters and Y's dual nature are the kind of edge case that only surfaces once someone tries a non-trivial real-world statement.

**How to avoid:**
- Normalize accented Latin letters to their base ASCII form (e→é, etc. via Unicode NFD decomposition + diacritic stripping) before table lookup, so "café" behaves as "cafe."
- Explicitly reject or clearly document behavior for non-Latin script input (Cyrillic, CJK, etc.) — the kamea/Pythagorean lineage is Latin-alphabet-specific by design (per `PROJECT.md`'s "Out of Scope"), so silently mangling non-Latin input is worse than a clear upfront rejection.
- Pick one explicit rule for Y (recommend: always consonant, matching the majority of published sigil-crafting tutorials) and state it in both code comments and user-facing docs. Do not attempt phonetic/contextual vowel detection — it's out of scope for a traditional method that was never phonetic to begin with.

**Warning signs:**
- No normalization step visible before letter-to-number lookup.
- No test statement containing an accented character.
- No doc sentence anywhere that says what Y does.

**Phase to address:**
Core algorithm phase (text processing).

---

### Pitfall 7: Consecutive-Repeat Detection Misses Cross-Letter Number Collisions

**What goes wrong:**
`PROJECT.md` requires "traditional repeat-number loop/notch markers where the sequence hits the same number consecutively." The letter-dedup step (strike repeated *letters*, keep first occurrence) does NOT prevent two *different* letters from mapping to the *same number* consecutively — e.g., "B" (2) followed by "K" (2) are different letters, both survive dedup, and both map to number 2, producing a legitimate consecutive-repeat in the number sequence that must trigger the loop/notch marker. An implementation that only checks "did this letter equal the previous letter" (rather than "does this number equal the previous number") will silently miss these cases and under-render the traditional repeat markers.

**Why it happens:**
It's natural to conflate "letter repeat" and "number repeat" since the letter-dedup step already exists earlier in the pipeline — but repeat-marker logic operates on the *number* sequence, a separate and later stage, and needs its own explicit equality check.

**How to avoid:**
Implement repeat-detection as a pass over the final number sequence, checking `sequence[i] === sequence[i-1]`, independent of and after the letter-dedup step. Add a test case using two different letters that map to the same digit (e.g., B→2, K→2) to prove the marker fires on cross-letter collisions, not just literal letter repeats. Also test 3+ consecutive repeats (not just exactly 2) and repeats at the very start/end of the sequence, since marker geometry (a loop needs an entry and exit direction) is easy to get wrong at sequence boundaries.

**Warning signs:**
- Repeat-marker logic implemented inside or right next to the letter-dedup function rather than as its own pass over numbers.
- No test with two different letters producing the same digit.
- No test with 3+ consecutive identical numbers.

**Phase to address:**
Core algorithm phase (repeat detection) + SVG rendering phase (marker geometry at boundaries and for 3+ repeats).

---

### Pitfall 8: CSS-Styleability Killed by Inline `style` Attributes or Hardcoded Presentation-Attribute Values

**What goes wrong:**
`PROJECT.md` requires the SVG be "fully CSS-stylable... via CSS classes and custom properties," but two common SVG-generation shortcuts quietly defeat that: (1) emitting an inline `style="..."` attribute on elements — inline styles win over *all* external/embedding-site CSS, including `!important` rules, so a consumer trying to theme the sigil from their own stylesheet simply can't; (2) emitting presentation attributes with hardcoded literal color/stroke values (`stroke="black"`) instead of CSS custom-property references (`stroke="var(--sigil-stroke, currentColor)"`) — presentation attributes *do* lose to external CSS class rules (confirmed: presentation attributes carry zero specificity and any author CSS rule overrides them), so this specific mistake is recoverable by the embedding site's CSS but still means the tool's own custom-property theming contract (`--sigil-*` hooks) isn't actually wired up, silently breaking the "CSS custom-property hooks" requirement.

**Why it happens:**
Inline `style=""` is often the fastest way to get a working demo rendering ("just set the color and ship it"), and it's easy to forget that the very thing that makes it fast (highest-specificity, guaranteed to render) is exactly what makes it unstylable later. Hardcoding attribute values is similarly the path of least resistance when first wiring up rendering.

**How to avoid:**
- Never emit a `style=""` attribute anywhere in generated SVG. Enforce this with a snapshot/regex test on generated output (`expect(svg).not.toContain('style=')`).
- Every visually-themeable value (stroke color, fill, stroke-width, node radius, marker size) must be expressed either as a bare CSS class hook (`class="sigil-path"`) with no attribute value at all, or as `attribute="var(--sigil-x, <sane-default>)"` — never as a bare literal color/size.
- Remember the inheritance asymmetry: `fill`/`stroke` inherit as CSS properties, but SVG *geometry* properties (`cx`, `r`, `x`, `width`, etc.) do NOT have CSS-styleable equivalents at all — anything the project wants to be CSS-controllable must be a paint/stroke property or explicitly modeled as a custom property consumed via `var()` inside an attribute that *does* accept it (e.g., stroke-width does, raw path `d` coordinates do not).

**Warning signs:**
- Any `style="` substring in generated output.
- Any bare color name or hex value (`black`, `#000`, `currentColor` used as a literal rather than `var(--x, currentColor)`) baked into a presentation attribute.
- No documented list of `--sigil-*` custom property names anywhere.

**Phase to address:**
SVG rendering phase.

---

### Pitfall 9: ID Collisions When Multiple Sigils Are Embedded on One Page

**What goes wrong:**
If generated SVG uses fixed/predictable element ids (`id="sigil-path"`, `<marker id="repeat-notch">`, `id="start-marker"`) and two or more sigils are embedded in the same HTML document — the exact "Claude Code embeds sigils into pages it builds" use case this tool exists for — the ids collide. Since ids must be document-unique in HTML, any `url(#repeat-notch)` reference resolves to whichever instance appears first in the DOM, silently corrupting the *second* sigil's markers/gradients while looking fine in isolation during development (where only one sigil is ever tested at a time).

**Why it happens:**
Single-sigil manual testing during development never surfaces this — it only appears once a real page embeds 2+ sigils, which is exactly the primary intended use case (a site with, say, a Saturn sigil and a Venus sigil on the same page) and exactly the kind of bug that ships invisibly because the dev-loop never exercises it.

**How to avoid:**
- Namespace every internal id with a per-instance-unique prefix. Because determinism is a hard project requirement, the prefix must be *deterministic given identical inputs* and *distinct given different inputs* — not random. A hash of `(statement, planet, options)` is the natural choice, or an optional caller-supplied `idPrefix` option so embedding code can guarantee uniqueness explicitly.
- Add a test that renders two sigils with different inputs and asserts zero id overlap between their markup.
- Add a test that renders the *same* input twice and asserts byte-identical output (proves determinism isn't broken by the id-namespacing fix).

**Warning signs:**
- Any literal, non-parameterized `id="..."` string in the SVG template.
- No test exercising two simultaneously-embedded sigils.

**Phase to address:**
SVG rendering phase.

---

### Pitfall 10: Coordinate-Scaling / viewBox Inconsistency Across Seven Different Kamea Sizes

**What goes wrong:**
Kamea grids range from 3×3 (Saturn) to 9×9 (Moon). If cell size is a fixed pixel constant, the seven planets' output SVGs end up with wildly different physical/viewBox dimensions (Saturn's canvas a fraction of the Moon's), which (a) looks inconsistent when multiple planet sigils are displayed together on one page and (b) makes CSS sizing rules that assume a fixed aspect ratio or dimension behave differently per planet. Separately, off-by-one errors mapping kamea `(row, col)` indices to SVG `(x, y)` pixel coordinates are easy to introduce and don't crash — they just quietly trace the wrong path, which looks like a plausible sigil and is very hard to catch by eye without a reference image to diff against.

**Why it happens:**
Development naturally starts with one planet (often Saturn, the smallest/simplest) and a fixed cell-size constant that "just works" — the inconsistency across sizes only becomes visible once all seven are implemented and compared side by side, which tends to happen late.

**How to avoid:**
- Derive cell size from a fixed total canvas dimension divided by grid order, so all seven outputs share a consistent viewBox scale (e.g., always a 100×100 unit viewBox regardless of 3×3 or 9×9 order, with the grid layer subdividing that fixed space by `100/order`).
- Write the row/col → x/y coordinate transform as one single, tested, reused function — never inline arithmetic duplicated across the grid-layer renderer, the sigil-path renderer, and the marker renderer, since duplicated coordinate math is where the three implementations silently drift apart.
- Test coordinate mapping against known reference points (e.g., "cell (0,0) of the Saturn grid maps to viewBox coordinate X,Y") rather than only testing that *a* path is produced.

**Warning signs:**
- Cell-size or coordinate-transform logic duplicated in more than one rendering function.
- No side-by-side visual comparison of all seven planets ever performed during development.
- No unit test asserting a specific, known (row,col) → (x,y) mapping.

**Phase to address:**
SVG rendering phase.

---

### Pitfall 11: Dual ESM/CJS Package Export Hazards

**What goes wrong:**
Node's `exports` field in `package.json` lets a package define different entry points for `import` vs `require`. Two failure modes are common: (1) if `exports` is defined without a `main` fallback, older tooling/bundlers that predate `exports`-field support fail to resolve the package at all, even though it works fine in modern Node; (2) the "dual package hazard" — if both a CJS and an ESM build exist and get loaded via both code paths in the same process (e.g., one dependency `require()`s the CJS build while another `import`s the ESM build), you get two separate module instances. For a stateless, pure-function sigil generator this is lower-stakes than for a package with shared singleton state, but it still means any module-level constants (e.g., cached kamea data structures) could be duplicated rather than shared, and — more importantly for this project — it's the kind of subtle bug that manifests specifically in Claude Code's build-tooling context (mixed CJS/ESM consumer codebases), exactly where this package is meant to be most reliable.

**Why it happens:**
The `exports` field's conditional-resolution behavior is genuinely non-obvious, and it's easy to configure it correctly for "my own test import" while leaving edge cases (bundler compat, `main` fallback, `.mjs`/`.cjs` extension discipline) unverified.

**How to avoid:**
- Ship a `main` field alongside `exports` as a fallback for older tooling, and keep `exports` conditions (`import`/`require`/`default`) all pointing at build artifacts of a single build step (not hand-maintained parallel source trees) so they can never drift out of sync with each other.
- Prefer authoring in one module format (commonly ESM as source) and compiling both output flavors via a build tool (tsup, esbuild, unbuild) rather than hand-writing both a `.mjs` and `.cjs` version of the same logic.
- Test both `require('sigil-spinner')` and `import 'sigil-spinner'` from clean, separate scratch consumer projects (not just the package's own internal test suite) before considering packaging done — this is the class of bug that a package's own tests never catch, because the package's own tests use one module system consistently.

**Warning signs:**
- Hand-maintained duplicate CJS and ESM source files instead of one source + a build step.
- `exports` field present with no `main` fallback.
- Never tested a plain `require()` from a fresh CJS-only scratch project.

**Phase to address:**
Packaging/distribution phase.

---

### Pitfall 12: bin Script Cross-Platform Breakage (CRLF Shebangs, Missing Executable Bit)

**What goes wrong:**
If the CLI entry script (`#!/usr/bin/env node` shebang) is authored or committed with CRLF line endings — which happens by default on Windows if `core.autocrlf` or `.gitattributes` aren't configured correctly — the shebang line becomes `#!/usr/bin/env node\r`, and Bash treats the trailing `\r` as part of the interpreter name, producing `/usr/bin/env: 'node\r': No such file or directory` on any Linux/Mac consumer. This is a real, repeatedly-reported issue across `npm`, `pnpm`, and `nodejs/node` themselves. Separately, forgetting to set the executable bit on the bin script (or relying on a build step that doesn't preserve it) breaks direct invocation even with correct line endings.

**Why it happens:**
It works perfectly for the author on their own machine (their editor/git config already normalizes line endings for them), and standard `npm publish`/`npm install` flows *do* auto-normalize bin-script line endings in most cases — but this is not guaranteed across all package managers or all git/editor configurations, so it's a "works until it doesn't, on someone else's machine" class of bug.

**How to avoid:**
- Add a `.gitattributes` entry forcing LF line endings specifically for the bin script (`bin/* text eol=lf`), independent of any global git config.
- Verify the executable bit is set and committed (`git update-index --chmod=+x`) and re-verified after any build step that regenerates the bin file.
- Smoke-test via `npm pack && npm install <tarball-path> -g` (or `npx`) in a clean environment as part of pre-release verification — not just `npm link`, which bypasses the packaging/tarball path where line-ending and permission issues actually surface.

**Warning signs:**
- No `.gitattributes` file, or one that doesn't explicitly cover the bin script.
- Only ever tested via `npm link` or running the script directly with `node ./bin/cli.js`, never via an installed global/npx invocation.
- Repo was ever cloned/edited on Windows without explicit LF enforcement.

**Phase to address:**
Packaging/distribution phase.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|-----------------|------------------|
| Hardcoding cell-size pixel constants instead of deriving from a fixed viewBox/order ratio | Faster to get first (Saturn) sigil rendering | Seven inconsistent-scale outputs discovered late, requires touching every renderer to fix | Never past the first planet's implementation |
| Copy-pasting a numerology table off a webpage instead of deriving from the cycling formula | Faster than writing/testing the formula | Risk of silently importing a Chaldean or legacy I/J-U/V table (Pitfalls 3–4) | Never |
| Testing only via `npm link` / direct `node script.js` invocation | Fast dev loop | Cross-platform bin-script breakage (Pitfall 12) ships undetected | Fine during active development; must add a real install-based smoke test before any release |
| Skipping the two-sigils-on-one-page test scenario | Nothing extra to build for single-sigil dev/testing | ID collisions (Pitfall 9) ship invisibly since the primary intended use case (multi-sigil embed) is never dev-tested | Never once packaging begins — this is the actual target use case, not an edge case |

## Integration Gotchas

This tool has no external service integrations by design (no runtime dependencies, no network I/O). The closest analog is "integration" with the consuming build pipeline (Claude Code) and with arbitrary embedding-site CSS.

| Integration | Common Mistake | Correct Approach |
|-------------|-----------------|-------------------|
| Consuming build pipeline (CLI invoked by Claude Code / scripts) | Writing non-JSON diagnostic/log output to stdout, polluting the SVG/JSON the caller expects to pipe | Keep stdout reserved strictly for the requested artifact (SVG or JSON); send all logs/errors/warnings to stderr, and use a nonzero exit code on failure |
| Embedding-site CSS | Assuming the embedding site's CSS reset/framework won't touch SVG internals (e.g., a Tailwind preflight zeroing out default SVG stroke behavior) | Ship sane, explicit defaults via `var(--sigil-x, <default>)` fallbacks so the sigil renders correctly with *zero* external CSS present, and is *only* themed when the embedding site opts in |

## Performance Traps

This is an inherently small-scale, synchronous, local-compute tool (max grid: 9×9, max statement length: a sentence). No performance trap rises to "critical" — noted for completeness:

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|-----------------|
| Rendering the optional 9×9 grid-number layer as 81 individual `<text>` + 81 `<rect>` elements with no reuse | Larger-than-necessary SVG output size, slightly heavier DOM if many sigils embed the grid layer simultaneously | Use `<use>` references against a small set of shared cell/number templates, or only construct the grid layer's DOM when the toggle is actually enabled (default hidden per spec) | Only a concern if many Moon (9×9) sigils with grid layers visible are embedded on the same page — unlikely at this tool's scale, but cheap to avoid |

## Security Mistakes

Local CLI/library, no network I/O — surface area is narrow, but XML well-formedness and downstream HTML-embedding safety still matter:

| Mistake | Risk | Prevention |
|---------|------|------------|
| Embedding the raw, unprocessed user statement into SVG (e.g., in a `<title>` or `<desc>` element, or a `data-statement` attribute) without XML-escaping | A statement containing `<`, `&`, `"`, or `'` breaks XML well-formedness of the generated SVG, or — if the SVG is later rendered in a context that doesn't parse it as strict XML — could enable markup injection | XML-escape any raw text that gets embedded verbatim in output (title/desc/data attributes); the letter-stripped/numerology-mapped internal sequence itself is already safe (numbers only), so this only matters if/when the original statement text is echoed back into the artifact |
| Treating the JSON "working" output's `statement` field as safe to interpolate directly into HTML on the consuming side without documentation | Downstream consumer (e.g., a generated webpage showing "the working behind this sigil") could introduce an XSS vector by rendering the raw statement unescaped | Document in the JSON schema/README that the `statement` field is untrusted user input and must be HTML-escaped by any consumer that displays it |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-------------------|
| Silent empty/degenerate output on a vowel-only or all-repeated-letter statement (Pitfall 5) | User gets a blank or broken SVG with no explanation, has to guess why | Fail loudly with a specific error naming which rule triggered ("statement reduced to zero unique consonants after striking vowels and repeats") |
| Case-sensitive or exact-string planet-name matching in the CLI ("Saturn" works, "saturn" or "SATURN" doesn't) | Frustrating trial-and-error for a CLI meant to be scriptable/composable | Normalize planet-name input case-insensitively; validate against the fixed 7-planet enum with a clear error listing valid options on mismatch |
| No indication in output/docs of which kamea source/orientation was used | Silently undermines the "traditionally correct, not approximated" value proposition for the one audience (practitioners) who would actually check | Cite the source in README and optionally in the JSON metadata output itself |

## "Looks Done But Isn't" Checklist

- [ ] **Kamea correctness:** "Matches Agrippa" is often asserted from memory/vibes rather than verified — confirm every one of the seven grids was cell-by-cell diffed against the single chosen primary source, with the source cited in a comment or data-file header.
- [ ] **"Fully CSS-stylable" claim:** Often tested only by eyeballing the generated SVG's markup, never by actually loading it in a browser and overriding colors/stroke-width from an external stylesheet with zero markup edits — verify this end-to-end, including the multi-sigil-on-one-page scenario (Pitfall 9).
- [ ] **Determinism claim:** Often verified only by "ran it twice, looked the same" — verify with an actual byte-equality assertion in tests, across both the SVG and JSON outputs, and re-verify after any id-namespacing fix (Pitfall 9) that touches per-instance uniqueness.
- [ ] **Repeat-number markers:** Often tested only with the simplest "two identical consecutive letters" case — verify against cross-letter number collisions (Pitfall 7), 3+ consecutive repeats, and repeats at the sequence's first/last position.
- [ ] **Dual CLI/library packaging:** Often tested only via the package's own internal test runner (which uses one module system consistently) — verify with a real `require()` from a fresh CJS scratch project AND a real `import` from a fresh ESM scratch project.
- [ ] **bin script portability:** Often tested only via `npm link` or direct `node` invocation during dev — verify via an actual `npm pack && npm install <tarball> -g` (or `npx`) smoke test.
- [ ] **Degenerate input handling:** Often untested because the dev's own test statements are all well-behaved — verify explicitly against a vowel-only/all-duplicate-letters statement and a single-unique-letter statement.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|----------------|------------------|
| Wrong kamea orientation shipped and already in use (sigils embedded on live sites) | HIGH | Because determinism is a stated contract, silently correcting the grid changes output for identical inputs that users may have already embedded/committed to. Ship the fix under an explicit new "kamea-set version" flag/parameter (default to the corrected version for new calls, but allow pinning to the old version for reproducibility of anything already generated) rather than mutating existing behavior silently. |
| Numerology table conflation (Chaldean values leaked in) discovered post-release | MEDIUM | Same versioning approach as above — this changes output for identical inputs, so needs an explicit fix-version boundary, not a silent patch, if any real sigils have already been generated and embedded. |
| ID collisions discovered after multi-sigil pages already shipped | LOW–MEDIUM | Namespacing ids doesn't change the *visual* sigil (path/marker geometry), only internal element ids — safe to patch without a version bump, since it doesn't break the determinism-of-appearance contract, only fixes a correctness bug in multi-embed scenarios. |
| Inline `style=` attributes or hardcoded presentation-attribute values discovered late | LOW | Purely a rendering-implementation fix; doesn't change the *coordinates* users may have referenced, only how paint properties are expressed — safe to patch without a version bump. |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|-------------------|----------------|
| Kamea orientation ambiguity | Core algorithm/data phase | All 7 grids cell-by-cell diffed against one cited source; source documented in data module and README |
| Algorithmic (vs. hard-coded) magic square generation | Core algorithm/data phase | Kamea data lives as literal arrays, not generator output; any generation code used only as a test-time cross-check |
| Chaldean/Pythagorean conflation | Core algorithm/data phase | Table derived from cycling formula; test vectors for A/I/J/R/S/Z pass |
| Legacy I/J, U/V contamination | Core algorithm/data phase | Same formula-derivation fix as above; I≠J and U≠V asserted in tests |
| Degenerate empty/single-node sequences | Core algorithm phase | Explicit test fixtures for zero-consonant and one-consonant statements; clear error vs. valid single-point output respectively |
| Accented letters / Y-handling ambiguity | Core algorithm phase (text processing) | Normalization step tested against an accented-character statement; Y's rule documented and tested |
| Cross-letter number-repeat detection | Core algorithm phase + SVG rendering phase | Test with two different letters mapping to the same digit; test 3+ consecutive repeats and boundary repeats |
| Inline style / hardcoded presentation attributes | SVG rendering phase | Automated check that output never contains `style=`; documented list of `--sigil-*` custom properties, each with a working fallback |
| ID collisions across multiple embedded sigils | SVG rendering phase | Test rendering two different-input sigils together, assert zero id overlap; test same-input rendered twice for byte-identical output |
| viewBox/coordinate-scaling inconsistency across kamea sizes | SVG rendering phase | Single shared coordinate-transform function; unit test on known (row,col)→(x,y) mappings; visual side-by-side check of all 7 planets |
| Dual ESM/CJS export hazards | Packaging/distribution phase | Real `require()` and `import` smoke tests from separate fresh scratch consumer projects; `main` fallback present alongside `exports` |
| bin script cross-platform breakage | Packaging/distribution phase | `.gitattributes` enforcing LF for bin script; `npm pack && npm install <tarball>`-based smoke test, not just `npm link` |

## Sources

- [Magic Squares and Planetary Powers | Les Carnets d'Aeternum](https://aeternum.fr/en/blogs/les-carnets-daeternum/carres-magiques-et-pouvoirs-planetaires) — explicit confirmation that Agrippa-attributed squares circulate in multiple rotated/mirrored variants across editions (HIGH confidence, directly on-point)
- [Further Light: Agrippa's Magic Squares - Part 1](http://furtherlight.blogspot.com/2009/11/agrippas-magic-squares-part-1.html) — planet-to-order assignment (Saturn 3×3 ... Moon 9×9) (MEDIUM — confirms assignment, not full grid data)
- [Talismanic Magic and the Architecture of Planetary Squares](https://tsmm.substack.com/p/talismanic-magic-and-the-architecture) — construction methods per order
- Wikipedia-adjacent / general magic-square construction method background (De la Loubère/Siamese method for odd orders, LUX method for singly-even, doubly-even swap method) — standard combinatorics background used for Pitfall 2 (HIGH confidence, well-established math)
- [Chaldean Numerology Chart | jcchaudhry.com](https://www.jcchaudhry.com/article/chaldean-numerology-chart-understanding-its-meaning-origin-calculations) and [Real and Imagined Differences Between Pythagorean and Chaldean Numerology](https://bostjanlovrat.com/2024/08/12/real-and-imagined-differences-between-pythagorean-and-chaldean-numerology/) — confirms Chaldean's 1–8 range, non-alphabetical letter grouping, sacred/unassigned 9 (HIGH confidence)
- [dcode.fr Pythagorean Numerology](https://www.dcode.fr/pythagorean-numerology) — confirms modern cycling table (A=1...I=9,J=1...Z=8) and its 20th-century origin, distinct from any I/J or U/V merging (HIGH confidence)
- [SVG Styles in Aspose.SVG – CSS vs Inline vs Attributes](https://docs.aspose.com/svg/net/svg-styles-css-vs-inline-vs-attributes/), [SVG Properties in CSS Guide | CSS-Tricks](https://css-tricks.com/svg-properties-and-css/), [MDN: fill CSS property](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/fill) — confirms specificity order (inline style > CSS rules > presentation attributes), inheritance asymmetry for geometry vs. paint properties (HIGH confidence, MDN + CSS-Tricks are authoritative)
- [Prevent problems when including the same SVG multiple times | site-kit-wp #6146](https://github.com/google/site-kit-wp/issues/6146), [Fix duplicate SVG ID collision in React | Anton Ball](https://antonball.dev/blog/2020-06-15-svg-id-collision/) — confirms multi-embed id-collision failure mode and prefixing as the standard fix (HIGH confidence)
- [CRLF in bin-scripts with bangs break *nix usage · npm/npm#4607](https://github.com/npm/npm/issues/4607), [Line endings of npm bash scripts is CRLF instead of LF · nodejs/node#43860](https://github.com/nodejs/node/issues/43860) — confirms real, repeatedly-reported cross-platform shebang breakage (HIGH confidence, primary-source GitHub issues)
- [Building and Publishing a Dual-Package NPM Module | Leapcell](https://leapcell.io/blog/building-and-publishing-a-dual-package-npm-module), [Node.js Dual Package: ESM & CJS Exports Guide](https://www.technetexperts.com/nodejs-dual-cjs-esm-exports-config/) — confirms dual-package hazard and `exports`/`main` fallback pattern (MEDIUM-HIGH confidence, secondary sources but consistent with Node.js's own documented `exports` semantics)
- Project context: `/Users/falkensmage/RitualSync/sigil-spinner/.planning/PROJECT.md` — grounding for which requirements/scope decisions these pitfalls map against (e.g., repeat-markers requirement, CSS custom-property requirement, dual CLI/library requirement)

---
*Pitfalls research for: Planetary kamea sigil generator (Node CLI + library)*
*Researched: 2026-08-04*
