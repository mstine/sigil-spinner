# Sigil Spinner

A Node CLI + importable library that generates planetary sigils from intention
statements using the traditional Western esoteric method: strike vowels and
repeating letters, encode the remainder through the Pythagorean Number Table,
and trace the resulting number sequence across the chosen planet's kamea
(magic square). Output is fully CSS-stylable inline SVG plus a JSON "working"
describing the full derivation.

## Usage

### Library

```js
import { generateSigil } from 'sigil-spinner';

const { svg, working } = generateSigil('I will succeed', 'saturn');
```

`generateSigil(statement, planet, options)` is a pure, synchronous function —
no I/O, no module-level mutable state. It returns a plain object with two
keys:

- `svg` — a self-contained, `viewBox`-based inline SVG string, fully
  CSS-stylable via classes and `var(--sigil-*, <fallback>)` custom properties.
- `working` — the full JSON derivation trail (see Worked Example below):
  `statement`, `planet`, `kameaSet`, `gridSize`, `lettersKept`,
  `lettersStruck`, `letterNumbers`, `numbers`, `cells`, `segments`, `start`,
  `end`.

`planet` is required — one of `saturn`, `jupiter`, `mars`, `sun`, `venus`,
`mercury`, `moon`, matched case-insensitively. There is no default planet
(choosing it is part of the working, not a fallback). `options.title`, when
`true`, embeds the XML-escaped statement in the SVG's `<title>` element —
omitted by default (see Data Handling below). `options.glyph`, when `true`,
renders the optional planetary glyph layer (`<text class="sigil-glyph">`,
themed via the `--sigil-glyph-*` properties below) — omitted by default, so
the string `sigil-glyph` never appears in default output. An unknown option
key is silently ignored (forward compatibility); a known option supplied
with the wrong type throws `SigilError` with code `E_INVALID_OPTION` (see
Errors and Exit Codes below).

### CLI

```
sigil-spinner <statement> --planet <name> [--json] [--output <file>] [--glyph]
```

- `<statement>` — the intention statement, as a positional argument. Pass
  `-` to read the statement from stdin instead (e.g.
  `echo "I will succeed" | sigil-spinner - --planet saturn`), which is what
  lets the tool compose in a shell pipeline.
- `--planet <name>` — required, case-insensitive, one of the seven names
  above.
- `--json` — write the JSON working to stdout instead of the raw SVG.
- `--output <file>` — write the selected artifact to a file instead of
  stdout; stdout is left completely empty. `--output`'s write is **not
  atomic** — a process killed mid-write, or two concurrent invocations
  writing the same path, can leave a partially-written file at that path.
- `--glyph` — render the optional planetary glyph layer (see CSS Custom
  Properties below). Absent by default.

Getting both artifacts from the CLI means two invocations (once plain, once
with `--json`) — there is no dual-file flag. The determinism contract below
is what guarantees the two invocations describe the same sigil.

All diagnostics (errors, usage messages) go to `stderr`; `stdout` carries
only the requested artifact, so a build pipeline can pipe it directly.

## Determinism

The same statement, planet, and options always produce **byte-identical**
SVG and byte-identical JSON, across repeated calls, across processes, and
whether invoked through the library or the CLI. Sigils are reproducible
design elements, not random art — this is what makes them safe to embed in
a page and commit to source control. `test/determinism.test.js` asserts this
with byte-equality checks (not "ran it twice, looked the same") and two
committed file snapshots (`test/__file_snapshots__/worked-example.svg` and
`worked-example.working.json`) that fail loudly on any drift in coordinate
rounding, attribute ordering, or field ordering.

## CSS Custom Properties (`--sigil-*` Theming Surface)

Every `--sigil-*` custom property this tool emits is documented here — this
table is the tool's public statement of its own theming surface, and it is
what the enforcement guard in `test/render/svg.test.js` reads to verify code
and docs cannot silently diverge (D-42). All values carry an inline sane
default, so a bare embedded `<svg>` with zero CSS still renders correctly;
theming happens entirely from the embedding page's own stylesheet, which
this library never sees.

| Property | Default | Element | Controls |
|----------|---------|---------|----------|
| `--sigil-stroke` | `currentColor` | `.sigil-path` | Path stroke color |
| `--sigil-stroke-width` | `2` | `.sigil-path`, `.sigil-start`, `.sigil-end`, `.sigil-loop` | Shared stroke width |
| `--sigil-marker-stroke` | `currentColor` | `.sigil-start`, `.sigil-end`, `.sigil-loop` | Marker stroke color |
| `--sigil-node-fill` | `currentColor` | `.sigil-node` | Node fill color |
| `--sigil-node-opacity` | `0` | `.sigil-node` | Node visibility |
| `--sigil-grid-opacity` | `0` | `.sigil-grid` | Whole grid layer visibility (lines + numbers together) |
| `--sigil-grid-stroke` | `currentColor` | `.sigil-grid-lines` | Lattice line color |
| `--sigil-grid-stroke-width` | order-dependent, `0.02 × cellSize` | `.sigil-grid-lines` | Lattice line thickness |
| `--sigil-grid-number-fill` | `currentColor` | `.sigil-grid-number` | Cell-number text color |
| `--sigil-grid-number-font-size` | order-dependent, `0.4 × cellSize` | `.sigil-grid-number` | Cell-number text size |
| `--sigil-grid-number-font` | `sans-serif` | `.sigil-grid-number` | Cell-number font family |
| `--sigil-glyph-fill` | `currentColor` | `.sigil-glyph` | Glyph text color |
| `--sigil-glyph-opacity` | `1` | `.sigil-glyph` | Glyph visibility (the layer itself is opt-in via the `glyph` option) |
| `--sigil-glyph-size` | order-dependent, `0.9 × cellSize` | `.sigil-glyph` | Glyph font size |
| `--sigil-glyph-font` | `sans-serif` | `.sigil-glyph` | Glyph font family — override with a symbol-covering stack (e.g. `"Noto Sans Symbols"`, `"Segoe UI Symbol"`, `sans-serif`) for guaranteed coverage |

**Font coverage (D-38).** Glyph rendering depends on the viewer's font stack
covering the Miscellaneous Symbols block, U+2600 to U+26FF. An uncovered
stack renders a missing-glyph box (tofu) instead of the planetary character.
No code-level fallback is implemented, and none is planned: an embedded font
or hand-authored vector outlines would violate the zero-runtime-dependency
constraint and this tool's rejection of hand-drawn glyph outlines on
font-licensing grounds (D-37). `--sigil-glyph-font` is the documented route —
point it at a symbol-covering stack the embedding site already ships.

**Geometry theming (D-41).** Only presentation attributes that map onto a
real CSS property (`fill`, `stroke`, `stroke-width`, `opacity`, `font-size`,
`font-family`) carry a `var(--sigil-*, <fallback>)` reference. Geometry
attributes — `x`, `y`, `r`, `cx`, `cy`, and the `d` path data — stay literal,
derived from `cellSize`, because `var()` silently does nothing inside an
attribute that isn't CSS-mapped. SVG 2 defines `x`, `y`, `r`, `cx`, and `cy`
as real CSS Geometry Properties, settable directly from a stylesheet in
modern browsers — a site that wants different node geometry sets it in CSS
directly, rather than this tool faking a custom-property hook that would not
resolve.

## Worked Example

Statement: `"I WILL SUCCEED"`, planet: `saturn`.

1. **Strike vowels (A, E, I, O, U):** `I`, `W`, `I`, `L`, `L`, `S`, `U`, `C`,
   `C`, `E`, `E`, `D` → consonants in order: `W, L, L, S, C, C, D`.
2. **Strike repeats, keep first occurrence:** the second `L` and the second
   `C` are struck → kept letters: `W L S C D`.
3. **Encode via the Pythagorean cycling table:** `W=5, L=3, S=1, C=3, D=4`.
4. **Number sequence:** `5, 3, 1, 3, 4`.
5. **Look up each digit's cell on the Saturn kamea** (`cellForNumber`,
   zero-indexed row/col): `5→(1,1)`, `3→(1,0)`, `1→(2,1)`, `3→(1,0)`,
   `4→(0,0)`.
6. **Trace the path:** `(1,1) → (1,0) → (2,1) → (1,0) → (0,0)` — start
   marker at `(1,1)`, end marker at `(0,0)`. Cell `(1,0)` is revisited but
   not consecutively, so no repeat marker fires (Phase 2 scope).

A practitioner can check this by hand against the committed working
snapshot at `test/__file_snapshots__/worked-example.working.json`.

## Letter Handling Rules

This is the tool's public statement of its own method — a practitioner
should be able to read this section and predict what the tool does to any
statement, in the same citable-lineage posture as
[Kamea Source Lineage](#kamea-source-lineage) below.

1. **Vowels are struck; Y is always a consonant (D-21).** `A`, `E`, `I`, `O`,
   `U` are struck as vowels. `Y` is never treated as a vowel — it is kept
   unless it is struck as a repeat — with no contextual or phonetic
   detection of Y's dual nature in English (e.g. "rhythm" vs. "yes").
   `normalize('RHYTHM')` keeps `R H Y T M` (the second `H` is struck as a
   repeat); `normalize('YES')` keeps `Y S` (`E` is struck as a vowel).

2. **Accents that are combining marks are ignored; the base letter is used
   (D-22).** Every character is folded via Unicode NFD (Normalization Form
   Canonical Decomposition) with combining marks stripped, so a letter whose
   accent decomposes into a base letter plus a combining mark contributes
   only its base Latin letter before classification. `É` folds to `E` and is
   then struck as a vowel; `Ñ` folds to `N` and is kept. Worked line:
   `normalize('ÑU')` folds `Ñ` → `N` (kept) and `U` is struck as a vowel, so
   the statement keeps only `N`. This covers accents NFD can decompose —
   letters whose diacritic is a stroke or bar cannot be decomposed this way
   and are handled by the explicit table in rule 3 instead.

3. **Non-decomposable Latin letters use an explicit table, covering two
   named classes (D-23).** NFD cannot resolve these letters via
   decomposition, so they are transliterated via a fixed, case-sensitive
   table before classification.

   The first class is the original six ligatures and accent-less letters:

   | Character | Folds to |
   |-----------|----------|
   | `ß` | `SS` |
   | `ẞ` | `SS` |
   | `æ` | `AE` |
   | `Æ` | `AE` |
   | `œ` | `OE` |
   | `Œ` | `OE` |
   | `ø` | `O` |
   | `Ø` | `O` |
   | `þ` | `TH` |
   | `Þ` | `TH` |
   | `ð` | `D` |
   | `Ð` | `D` |

   The second class — ratified as a D-23 amendment at the Task 2
   `checkpoint:decision` of plan 02-04 — is the **Latin stroke/bar class**:
   any Latin letter whose Unicode name identifies a single A-Z base letter
   plus a stroke or bar overlay. It is case-complete (every character's
   upper/lower partner is also a table entry mapping to the identical base
   letter) and every value is a plain A-Z letter. Grouped by base letter:

   | Base letter | Stroke/bar characters |
   |-------------|------------------------|
   | `A` | `Ⱥ` `ⱥ` |
   | `B` | `ƀ` `Ƃ` `ƃ` `Ƀ` |
   | `C` | `Ȼ` `ȼ` `Ꞓ` `ꞓ` |
   | `D` | `Đ` `đ` `Ƌ` `ƌ` |
   | `E` | `Ɇ` `ɇ` |
   | `F` | `Ꞙ` `ꞙ` |
   | `G` | `Ǥ` `ǥ` `Ꞡ` `ꞡ` |
   | `H` | `Ħ` `ħ` |
   | `I` | `Ɨ` `ɨ` |
   | `J` | `Ɉ` `ɉ` |
   | `K` | `Ꝁ` `ꝁ` `Ꝃ` `ꝃ` `Ꝅ` `ꝅ` `Ꞣ` `ꞣ` |
   | `L` | `Ł` `ł` `ƚ` `Ƚ` `Ⱡ` `ⱡ` `Ꝉ` `ꝉ` |
   | `N` | `Ꞥ` `ꞥ` |
   | `P` | `ᵽ` `Ᵽ` |
   | `Q` | `Ꝙ` `ꝙ` |
   | `R` | `Ɍ` `ɍ` `Ꞧ` `ꞧ` |
   | `S` | `Ꞩ` `ꞩ` `Ꟍ` `ꟍ` |
   | `T` | `Ŧ` `ŧ` `Ⱦ` `ⱦ` |
   | `U` | `Ʉ` `ʉ` `Ꞹ` `ꞹ` |
   | `V` | `Ꝟ` `ꝟ` |
   | `Y` | `Ɏ` `ɏ` |
   | `Z` | `Ƶ` `ƶ` |

   The visual confusables `Đ` (U+0110) and `Ð` (U+00D0) are deliberately
   equivalent under this table — both fold to `D` — so `generateSigil('ĐHT',
   planet)` and `generateSigil('ÐHT', planet)` produce byte-identical SVG on
   every planet.

   **What is deliberately excluded, and why.** Three further Latin classes
   remain struck with reason `non-letter` rather than folded: digraphs
   beyond the original six (e.g. `Ĳ`), reversed or turned letters (e.g.
   `Ǝ`), and hooked or tailed phonetic letters (e.g. `Ɓ`). None of these has
   an unambiguous single base letter, so folding them would be invention
   rather than transliteration — the table only ever performs a lookup that
   is already settled, never a judgment call. `normalize('Ĳ')`,
   `normalize('Ǝ')`, and `normalize('Ɓ')` each strike their character with
   reason `non-letter`, unchanged by this amendment.

4. **Non-Latin script characters are struck as non-letters (D-24).** A
   character from a non-Latin script (Greek, Cyrillic, Hebrew, CJK, etc.) is
   struck with reason `non-letter` and recorded in the struck trail, exactly
   like punctuation or whitespace. A wholly non-Latin statement therefore
   reduces to zero kept letters and produces the `E_EMPTY_SEQUENCE` error
   below — there is no dedicated non-Latin error code.

### Consecutive-repeat loops

When the traced number sequence hits the same kamea cell on two or more
*consecutive* steps, the SVG gains one `<path class="sigil-loop">` element
per extra visit — hidden by default like the other markers, revealable via
`var(--sigil-marker-stroke, ...)`. A cell visited non-consecutively (the
same digit appears again later in the sequence, but not back-to-back) gets
no loop — see the worked example above, where `(1,0)` repeats but not
consecutively. A repeat landing on the start or end cell renders its loop
alongside the boundary marker, offset so neither obscures the other, rather
than suppressing either one.

## Errors and Exit Codes

Every library error is a `SigilError` with a stable `.code` — consumers
branch on `.code`, **never on message text**, which is free-form and can
change without notice. `SigilError` instances may also carry an optional
`.details` structured payload (D-26) — still never branched on, purely for
programmatic introspection.

| Code | Meaning | CLI exit status |
|------|---------|------------------|
| `E_MISSING_STATEMENT` | The statement argument was missing, empty, or not a string. | 2 |
| `E_MISSING_PLANET` | `--planet`/the planet argument was missing, empty, or not a string — there is no default planet. | 2 |
| `E_UNKNOWN_PLANET` | The planet name wasn't one of the seven classical planets. The message lists all seven. | 2 |
| `E_EMPTY_SEQUENCE` | The statement reduced to zero kept letters after striking vowels and repeats. The message names the total struck count and a per-reason breakdown (e.g. "all 5 characters struck (5 vowels)"), and `.details.struck` carries the full structured struck list. | 3 |
| `E_INVALID_OPTION` | A known option (e.g. `glyph`, `title`) was supplied with the wrong type. The message names the offending option; `.details` carries `{ option, value, expected }` so a program can introspect exactly what was passed. Unknown option keys are never an error — they're ignored for forward compatibility. | 2 |

Usage-class errors (`E_MISSING_STATEMENT`, `E_MISSING_PLANET`,
`E_UNKNOWN_PLANET`, `E_INVALID_OPTION`) exit with status `2`; the
derivation-class error (`E_EMPTY_SEQUENCE`) exits with status `3` — a
calling script can branch on exit status alone, without parsing stderr text.
Any other error exits with status `1`.

## Data Handling

`working.statement` is **untrusted user input**. This library returns data,
not markup, and does not escape it — any consumer that renders
`working.statement` into HTML (e.g. a teaching page narrating the
derivation) **must HTML-escape it first**.

The intention statement is deliberately absent from the SVG artifact by
default — no `<title>`, no `<desc>`, no data attribute carries it unless the
caller opts in via `{ title: true }` — honoring the release-the-intention
posture of classic sigil practice (D-16). When opted in, the statement is
XML-escaped before being embedded.

## What This Tool Does Not Yet Do

All seven kameas are locked, tested, and byte-stable end to end as of
Phase 2 (see `test/determinism.test.js`'s seven-planet matrix). The optional
planetary glyph layer shipped in Phase 3 (see CSS Custom Properties above).
Curved/smoothed path rendering, the toggleable grid layer, and multi-embed
id namespacing remain later Phase 3 plans.

## Kamea Source Lineage

The seven classical planetary kameas (magic squares) ship under the `agrippa`
kamea set — `KAMEA_SETS.agrippa` in `src/data/kamea.js`, selected by default
via `DEFAULT_KAMEA_SET`. The data layer is kamea-set-aware from day one so a
future independently-verified set (e.g. a Skinner-sourced set) can be added
under a new key without reshaping the API; only `agrippa` ships in this
phase.

**Primary source (named by the project's locked decision, D-01):**
Agrippa, Henry Cornelius. *Three Books of Occult Philosophy.* Donald Tyson,
ed. Llewellyn Publications.

**Independent cross-check source (named by D-01):**
Skinner, Stephen. *The Complete Magician's Tables.* Golden Hoard Press.

**What was actually verified (honest provenance):** both sources above are
physical books not available to research or execution tooling. The seven
grids below were sourced from a single secondary web source
(furtherlight.blogspot.com, "Agrippa's Magic Squares - Part 2"), verified
cell-by-cell for internal magic-square correctness (every row, column, and
both diagonals sum to the correct magic constant for all seven grids), and
Saturn's full grid plus Jupiter's opening row were independently corroborated
against a second, separate web source. Mars, Sun, Venus, Mercury, and Moon
rest on the single furtherlight source only. This candidate set was signed
off via the project's D-04 checkpoint (decision: approve-candidate) on
2026-08-04 — it is not a claim that any grid was checked cell-by-cell against
the physical Tyson/Llewellyn or Skinner editions named above. See the module
header in `src/data/kamea.js` for the full citation.

**Ordering convention:** every grid is row-major, top row first, left to
right — `grid[0][0]` is the top-left cell.

**Grid order and magic constants:** Saturn (3×3, 15), Jupiter (4×4, 34), Mars
(5×5, 65), Sun (6×6, 111), Venus (7×7, 175), Mercury (8×8, 260), Moon (9×9,
369).
