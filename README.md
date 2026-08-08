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
- `working` — the full JSON derivation trail. See
  [The JSON Working](#the-json-working) below for every field it carries,
  and Worked Example for a hand-checkable walkthrough of how it's derived.

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

`options.curve`, when `true`, renders the `sigil-path` element's `d` as a
curved/smoothed line (hand-rolled centripetal Catmull-Rom converted to cubic
Bezier) instead of straight segments — see Curve Rendering below. Defaults
to `false`; default output is byte-identical whether the option is present-
and-false or absent entirely.

`options.idPrefix`, when a non-empty string, names the root `<svg>` element's
`id` attribute (XML-escaped) — see Multi-Embed Safety below. Absent by
default, which emits zero `id` attributes anywhere in the output. An empty
string is rejected the same as a wrong-typed value (`E_INVALID_OPTION`),
since it would emit a valueless `id=""` attribute.

### CLI

```
sigil-spinner <statement> --planet <name> [--json] [--output <file>] [--glyph] [--curve] [--id-prefix <string>]
```

- `<statement>` — the intention statement, as a positional argument. Exactly
  one statement positional is accepted; a second (or later) positional is a
  usage error (`E_CLI_USAGE`, exit 2 — see Errors and Exit Codes below).
  Pass `-` to read the statement from stdin instead (e.g.
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
- `--curve` — render the `sigil-path` element with a curved/smoothed `d`
  instead of straight segments (see Curve Rendering below). Absent by
  default.
- `--id-prefix <string>` — name the root `<svg>` element's `id` attribute
  (see Multi-Embed Safety below). Absent by default; a non-empty string is
  required — an empty string exits 2 with `E_INVALID_OPTION`.

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
with byte-equality checks (not "ran it twice, looked the same") and
committed file snapshots — including `test/__file_snapshots__/worked-example.svg`,
`worked-example.working.json`, and (as of curve rendering) fourteen
`matrix-curve-<planet>.svg` / `matrix-curve-repeat-<planet>.svg` snapshots,
one pair per planet — that fail loudly on any drift in coordinate rounding,
attribute ordering, or field ordering.

## Curve Rendering

`--curve` (CLI) / `options.curve` (library) render the `sigil-path`
element's `d` as a smoothed curve instead of straight line segments.
Straight segments are the **default** — passing no options, or explicitly
`{ curve: false }`, produces output byte-identical to what shipped before
this option existed.

The curve math is **hand-rolled centripetal Catmull-Rom (alpha = 0.5),
converted to cubic Bezier control points**, computed entirely in-repo with
no runtime dependency (`src/render/curve.js`). Centripetal parameterization
specifically avoids the cusps and self-intersecting loops that uniform
Catmull-Rom produces on the sharp direction changes kamea traversal
routinely creates.

Curve mode changes **only** the `sigil-path` element's `d` attribute — the
start circle, end crossbar, per-visit nodes, and repeat-loop markers all
keep deriving their geometry from the same straight-segment travel vectors
they always have, byte-identical between curve modes. This is also what
makes the construction-invariance claim below checkable, not just asserted:
`generateSigil(statement, planet, { curve: true }).working` and
`generateSigil(statement, planet).working` are identical in every
construction field (`lettersKept`, `numbers`, `cells`, `segments`, and so
on) — curve is a rendering choice about how the traced path is _drawn_, not
a claim that a different construction was performed. A reader can verify
this directly against the JSON working.

**Known finding — a single documented viewBox overshoot.** For the
`saturn`..`moon` x `I WILL SUCCEED`/`BKT RISES` determinism-matrix
combinations, one combination (`sun` + `"I WILL SUCCEED"`) produces a
Bezier control point at `y = -0.916` — just past the fixed `0 0 100 100`
viewBox's top edge — because the traced path reverses direction by roughly
180 degrees at its third point, and a centripetal Catmull-Rom curve can
legitimately bulge outside the convex hull of its own traced polyline on a
reversal that sharp. This is documented, not silently clamped (clamping
would be a design decision about curve shape, not an implementation
detail) — see `03-03-SUMMARY.md` for the full finding and what a fix would
cost.

## CSS Custom Properties (`--sigil-*` Theming Surface)

Every `--sigil-*` custom property this tool emits is documented here — this
table is the tool's public statement of its own theming surface, and it is
what the enforcement guard in `test/render/theming.test.js` reads to verify
code and docs cannot silently diverge (D-42). All values carry an inline sane
default, so a bare embedded `<svg>` with zero CSS still renders correctly;
theming happens entirely from the embedding page's own stylesheet, which
this library never sees.

| Property                        | Default                            | Element                                                    | Controls                                                                                                                                          |
| ------------------------------- | ---------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--sigil-stroke`                | `currentColor`                     | `.sigil-path`                                              | Path stroke color                                                                                                                                 |
| `--sigil-stroke-width`          | `2`                                | `.sigil-path`, `.sigil-start`, `.sigil-end`, `.sigil-loop` | Shared stroke width                                                                                                                               |
| `--sigil-marker-stroke`         | `currentColor`                     | `.sigil-start`, `.sigil-end`, `.sigil-loop`                | Marker stroke color                                                                                                                               |
| `--sigil-node-fill`             | `currentColor`                     | `.sigil-node`                                              | Node fill color                                                                                                                                   |
| `--sigil-node-opacity`          | `0`                                | `.sigil-node`                                              | Node visibility                                                                                                                                   |
| `--sigil-grid-opacity`          | `0`                                | `.sigil-grid`                                              | Whole grid layer visibility (lines + numbers together)                                                                                            |
| `--sigil-grid-stroke`           | `currentColor`                     | `.sigil-grid-lines`                                        | Lattice line color                                                                                                                                |
| `--sigil-grid-stroke-width`     | order-dependent, `0.02 × cellSize` | `.sigil-grid-lines`                                        | Lattice line thickness                                                                                                                            |
| `--sigil-grid-number-fill`      | `currentColor`                     | `.sigil-grid-number`                                       | Cell-number text color                                                                                                                            |
| `--sigil-grid-number-font-size` | order-dependent, `0.4 × cellSize`  | `.sigil-grid-number`                                       | Cell-number text size                                                                                                                             |
| `--sigil-grid-number-font`      | `sans-serif`                       | `.sigil-grid-number`                                       | Cell-number font family                                                                                                                           |
| `--sigil-glyph-fill`            | `currentColor`                     | `.sigil-glyph`                                             | Glyph text color                                                                                                                                  |
| `--sigil-glyph-opacity`         | `1`                                | `.sigil-glyph`                                             | Glyph visibility (the layer itself is opt-in via the `glyph` option)                                                                              |
| `--sigil-glyph-size`            | order-dependent, `0.9 × cellSize`  | `.sigil-glyph`                                             | Glyph font size                                                                                                                                   |
| `--sigil-glyph-font`            | `sans-serif`                       | `.sigil-glyph`                                             | Glyph font family — override with a symbol-covering stack (e.g. `"Noto Sans Symbols"`, `"Segoe UI Symbol"`, `sans-serif`) for guaranteed coverage |

**All numeric values are unitless and are interpreted as viewBox user units.**
The viewBox is fixed at `0 0 100 100` for every planet, so `--sigil-stroke-width: 3`
and `--sigil-grid-number-font-size: 7` both mean "3 user units" and "7 user units"
regardless of the kamea's order or the rendered pixel size. Do **not** add `px`,
`em`, or any other unit — write the bare number.

The two font-size properties (`--sigil-grid-number-font-size`, `--sigil-glyph-size`)
are emitted as `calc(var(--property, <default>) * 1px)` rather than a plain `var()`.
That is deliberate and load-bearing, not a stylistic quirk. A presentation attribute
whose value contains `var()` is parsed as a **CSS declaration**, not by the SVG
attribute grammar, so the substituted value must be valid for that CSS property.
`stroke-width` and `opacity` accept a bare `<number>`; `font-size` requires a
`<length>`. Emitting `font-size="var(--x, 13.333)"` therefore fails at
computed-value time and silently falls back to `inherit` — for the default as well
as for every override, which makes the property completely inert while still looking
correctly wired in the markup. The `calc(… * 1px)` wrapper supplies the unit so a
bare number stays valid, keeping these two consistent with every other numeric
property on this surface.

`test/browser/theming-resolution.test.js` guards this at the level that matters: it
drives a real browser engine and compares **computed** styles, asserting both that
each property changes what renders when overridden and that each documented default
is genuinely in effect. Every other theming test asserts against the SVG _string_ —
that the `var()` is present — which is necessary and, as the above shows, not
sufficient. Running it needs a one-time `npx playwright install chromium`; the suite
fails loudly rather than skipping if the browser is missing, because a guard that
quietly opts out of running is the same failure class it exists to catch.

This table carries exactly these **fifteen** properties — the five frozen
from Phase 1/2 plus the ten added in Phase 3 — and no more. `test/render/theming.test.js` reads this exact table, matched on backtick-delimited
property names (never on substring containment), and fails if the renderer
ever emits a `--sigil-*` custom property this table doesn't list, or if a
row is removed while the code still emits the property it named. The table
cannot silently fall behind the code.

**Revealing the grid (D-32).** The kamea grid — the lattice and the actual
magic-square numbers the sigil was traced on — is _always present_ in every
generated SVG, on every planet, with no flag and no library option to turn
it off. It starts hidden (`--sigil-grid-opacity` defaults to `0`) purely
through CSS, so one declaration from the embedding page reveals it:

```css
.sigil-grid {
  --sigil-grid-opacity: 0.3;
}
```

That single rule is sufficient — it reveals both the lattice lines and the
cell numbers together, since they share one opacity toggle. There is no
`--grid` CLI flag: the grid is unconditional markup, and its visibility is
purely a CSS decision, not a generation-time one.

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

## Multi-Embed Safety

The generated SVG contains **no `id` attributes at all by default**, which is
what makes any number of sigils safe to embed in one page — there is nothing
to collide. Two sigils with different statements and planets, concatenated
into one document string with no `idPrefix` supplied, contain zero `id`
attributes between them; this is the primary REND-06 guarantee, proven by
`test/determinism.test.js`'s Success Criterion 5 suite across every planet.

`options.idPrefix` (`--id-prefix` on the CLI) is the **only** route to an
emitted id — it names the root `<svg>` element only, is XML-escaped before
emission (D-44), and a prefix containing markup characters (`"`, `'`, `<`,
`>`, `&`) cannot break the artifact or inject an element (T-03-16).

**This library deliberately does NOT derive an id from a hash of the
inputs.** A deterministic-hash-based id namespace looks like an obvious fix
for id collisions — `PITFALLS.md` Pitfall 9 names it directly — but this
library's whole determinism contract is that identical inputs produce
identical bytes. Hashing `(statement, planet, options)` into an id would
therefore produce **identical ids for two identical sigils on the same
page** — the exact collision it would claim to prevent, just dressed up as a
fix. Uniqueness under a caller-supplied `idPrefix` is the **caller's**
responsibility: pass a different prefix for each sigil instance if more than
one on a page needs an id (e.g. one per statement, or an incrementing
counter the _embedding site_ owns — not this library). Two sigils rendered
with the SAME `idPrefix` **do** collide, by design, and that's asserted as
documented behavior rather than left unstated (see the "same idPrefix
collides" test in `test/determinism.test.js`).

## The JSON Working

`working` is the full JSON derivation trail returned alongside `svg`. Every
field below is transcribed from the `SigilWorking` JSDoc typedef in
`src/render/json.js` — the single source of truth this table tracks, in the
exact key order `toWorking` emits them.

| Field           | Type                                | Description                                                                                                                                                                                                                     |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `statement`     | `string`                            | The original, untrusted intention statement.                                                                                                                                                                                    |
| `planet`        | `string`                            | Canonical lowercase planet name.                                                                                                                                                                                                |
| `kameaSet`      | `string`                            | The kamea set name that produced this sigil (D-02).                                                                                                                                                                             |
| `kameaVersion`  | `string`                            | The kamea set's provenance sign-off date (D-57) — names the verification state of the cells as of that date. Not a correctness warranty: see `src/data/kamea.js`'s source-lineage block for exactly what was and wasn't independently cross-checked. |
| `gridSize`      | `number`                            | The planet's kamea order (3-9).                                                                                                                                                                                                 |
| `lettersKept`   | `string[]`                          | Kept letters, in statement order.                                                                                                                                                                                               |
| `lettersStruck` | `StruckEntry[]`                     | Every struck character, with its reason. Each entry carries `char`, `index`, `reason`, `original`, `folded`.                                                                                                                    |
| `letterNumbers` | `LetterNumberPair[]`                | Each kept letter paired with its Pythagorean digit, same order as `lettersKept`. Each entry carries `letter`, `number`.                                                                                                         |
| `numbers`       | `number[]`                          | The Pythagorean digit sequence, one per kept letter.                                                                                                                                                                            |
| `cells`         | `WorkingCell[]`                     | One entry per traced number: row/col AND the viewBox x/y the SVG path was drawn from. Each entry carries `row`, `col`, `x`, `y`.                                                                                                |
| `segments`      | `PathSegment[]`                     | Line segments between consecutive cells. Each entry carries `from`, `to`.                                                                                                                                                       |
| `start`         | `number`                            | Index into `cells` of the cell the sigil-start marker was drawn on.                                                                                                                                                             |
| `end`           | `number`                            | Index into `cells` of the cell the sigil-end marker was drawn on.                                                                                                                                                               |
| `keptTrail`     | `KeptEntry[] \| undefined`          | Kept letters with full fold/origin provenance (D-25); `undefined` when the pipeline result did not supply `keptEntries`. Each entry carries `char`, `index`, `original`, `folded`. The one field above that can be `undefined`. |
| `repeats`       | `RepeatEvent[]`                     | Consecutive-repeat events from the traced number sequence (PATH-02, D-18, D-20). Each entry carries `atPoint`, `count`.                                                                                                         |
| `render`        | `{ curve, glyph, idPrefix, title }` | Resolved option values (D-48), appended last. See below.                                                                                                                                                                        |

### The `render` block

`working.render` carries the four resolved option values, in this fixed key
order: `curve` (`boolean`), `glyph` (`boolean`), `idPrefix` (`string \|
null`), `title` (`boolean`). `idPrefix` always serializes as JSON `null`
when absent, rather than being dropped from the object, so the block's key
set is invariant across every option combination (D-48).

`working.render` can be passed straight back in as the third argument to
`generateSigil` to reproduce the exact same SVG (D-49):

```js
const first = generateSigil('I will succeed', 'saturn');
const second = generateSigil('I will succeed', 'saturn', first.working.render);
second.svg === first.svg; // true
```

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
   | --------- | -------- |
   | `ß`       | `SS`     |
   | `ẞ`       | `SS`     |
   | `æ`       | `AE`     |
   | `Æ`       | `AE`     |
   | `œ`       | `OE`     |
   | `Œ`       | `OE`     |
   | `ø`       | `O`      |
   | `Ø`       | `O`      |
   | `þ`       | `TH`     |
   | `Þ`       | `TH`     |
   | `ð`       | `D`      |
   | `Ð`       | `D`      |

   The second class — ratified as a D-23 amendment at the Task 2
   `checkpoint:decision` of plan 02-04 — is the **Latin stroke/bar class**:
   any Latin letter whose Unicode name identifies a single A-Z base letter
   plus a stroke or bar overlay. It is case-complete (every character's
   upper/lower partner is also a table entry mapping to the identical base
   letter) and every value is a plain A-Z letter. Grouped by base letter:

   | Base letter | Stroke/bar characters           |
   | ----------- | ------------------------------- |
   | `A`         | `Ⱥ` `ⱥ`                         |
   | `B`         | `ƀ` `Ƃ` `ƃ` `Ƀ`                 |
   | `C`         | `Ȼ` `ȼ` `Ꞓ` `ꞓ`                 |
   | `D`         | `Đ` `đ` `Ƌ` `ƌ`                 |
   | `E`         | `Ɇ` `ɇ`                         |
   | `F`         | `Ꞙ` `ꞙ`                         |
   | `G`         | `Ǥ` `ǥ` `Ꞡ` `ꞡ`                 |
   | `H`         | `Ħ` `ħ`                         |
   | `I`         | `Ɨ` `ɨ`                         |
   | `J`         | `Ɉ` `ɉ`                         |
   | `K`         | `Ꝁ` `ꝁ` `Ꝃ` `ꝃ` `Ꝅ` `ꝅ` `Ꞣ` `ꞣ` |
   | `L`         | `Ł` `ł` `ƚ` `Ƚ` `Ⱡ` `ⱡ` `Ꝉ` `ꝉ` |
   | `N`         | `Ꞥ` `ꞥ`                         |
   | `P`         | `ᵽ` `Ᵽ`                         |
   | `Q`         | `Ꝙ` `ꝙ`                         |
   | `R`         | `Ɍ` `ɍ` `Ꞧ` `ꞧ`                 |
   | `S`         | `Ꞩ` `ꞩ` `Ꟍ` `ꟍ`                 |
   | `T`         | `Ŧ` `ŧ` `Ⱦ` `ⱦ`                 |
   | `U`         | `Ʉ` `ʉ` `Ꞹ` `ꞹ`                 |
   | `V`         | `Ꝟ` `ꝟ`                         |
   | `Y`         | `Ɏ` `ɏ`                         |
   | `Z`         | `Ƶ` `ƶ`                         |

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
_consecutive_ steps, the SVG gains one `<path class="sigil-loop">` element
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

| Code                  | Meaning                                                                                                                                                                                                                                                                                                                                                            | CLI exit status |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------- |
| `E_MISSING_STATEMENT` | The statement argument was missing, empty, or not a string.                                                                                                                                                                                                                                                                                                        | 2               |
| `E_MISSING_PLANET`    | `--planet`/the planet argument was missing, empty, or not a string — there is no default planet.                                                                                                                                                                                                                                                                   | 2               |
| `E_UNKNOWN_PLANET`    | The planet name wasn't one of the seven classical planets. The message lists all seven.                                                                                                                                                                                                                                                                            | 2               |
| `E_EMPTY_SEQUENCE`    | The statement reduced to zero kept letters after striking vowels and repeats. The message names the total struck count and a per-reason breakdown (e.g. "all 5 characters struck (5 vowels)"), and `.details.struck` carries the full structured struck list.                                                                                                      | 3               |
| `E_INVALID_OPTION`    | A known option (e.g. `glyph`, `title`, `curve`, `idPrefix`) was supplied with the wrong type, or `idPrefix` was an empty string. The message names the offending option; `.details` carries `{ option, value, expected }` so a program can introspect exactly what was passed. Unknown option keys are never an error — they're ignored for forward compatibility. | 2               |

Usage-class errors (`E_MISSING_STATEMENT`, `E_MISSING_PLANET`,
`E_UNKNOWN_PLANET`, `E_INVALID_OPTION`) exit with status `2`; the
derivation-class error (`E_EMPTY_SEQUENCE`) exits with status `3` — a
calling script can branch on exit status alone, without parsing stderr text.
Any other error exits with status `1`.

### CLI-local diagnostic codes

The two codes below are emitted only by the CLI (`bin/sigil-spinner.js`) —
they are never thrown as `SigilError` and therefore never reach a library
consumer. They share the same `CODE: message` stderr format as the table
above, so a calling script can treat them uniformly, but they have no
library analog.

| Code          | Meaning                                                                                                                | CLI exit status |
| ------------- | ---------------------------------------------------------------------------------------------------------------------- | --------------- |
| `E_CLI_USAGE` | Malformed argv: an unrecognized flag, a flag missing its required value, or more than one statement positional (D-51). | 2               |
| `E_CLI_STDIN` | Failure reading the statement from stdin under the `-` sentinel.                                                       | 2               |

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
planetary glyph layer, the always-present CSS-revealable kamea grid layer,
configurable curve/straight path rendering, the full `--sigil-*` theming
surface, and multi-embed id safety all shipped in Phase 3 (see CSS Custom
Properties, Curve Rendering, and Multi-Embed Safety above) — the phase's
closing goal ("a site can embed several sigils on one page and restyle every
one of them entirely from CSS... without touching the generated markup") is
now fully shipped and guard-tested.

## Kamea Source Lineage

The seven classical planetary kameas (magic squares) ship under the `agrippa`
kamea set — `KAMEA_SETS.agrippa` in `src/data/kamea.js`, selected by default
via `DEFAULT_KAMEA_SET`. The data layer is kamea-set-aware from day one so a
future independently-verified set (e.g. a Skinner-sourced set) can be added
under a new key without reshaping the API; only `agrippa` ships in this
phase.

**Primary source (named by the project's locked decision, D-01):**
Agrippa, Henry Cornelius. _Three Books of Occult Philosophy._ Donald Tyson,
ed. Llewellyn Publications.

**Independent cross-check source (named by D-01):**
Skinner, Stephen. _The Complete Magician's Tables._ Golden Hoard Press.

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
