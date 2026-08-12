# Sigil Spinner

A Node CLI + importable library that generates planetary sigils from intention
statements using the traditional Western esoteric method: strike vowels and
repeating letters, encode the remainder through the Pythagorean Number Table,
and trace the resulting number sequence across the chosen planet's kamea
(magic square). Output is fully CSS-stylable inline SVG plus a JSON "working"
describing the full derivation.

This package is **ESM-only** — it ships no CommonJS build. A synchronous
`require('@falkensmage/sigil-spinner')` throws `ERR_REQUIRE_ESM`; the
consuming file must itself be ESM (a `.mjs` file, or a package with
`"type": "module"` in its own `package.json`).

## Installation

```sh
npm install @falkensmage/sigil-spinner
```

## Usage

### Library

```js
import { generateSigil } from '@falkensmage/sigil-spinner';

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

`planet` is required — one of the seven classical planets (`saturn`,
`jupiter`, `mars`, `sun`, `venus`, `mercury`, `moon`) or the three
trans-Saturnian modern additions (`uranus`, `neptune`, `pluto`; see Kamea
Source Lineage below for their attestation), matched case-insensitively.
There is no default planet (choosing it is part of the working, not a
fallback). `options.title`, when
`true`, embeds the XML-escaped statement in the SVG's `<title>` element —
omitted by default (see Data Handling below). `options.glyph`, when `true`,
renders the optional planetary glyph layer (`<text class="sigil-glyph">`,
themed via the `--sigil-glyph-*` properties below) — omitted by default, so
the string `sigil-glyph` never appears in default output. An unknown option
key is silently ignored (forward compatibility); a known option supplied
with the wrong type throws `SigilError` with code `E_INVALID_OPTION` (see
Errors and Exit Codes below). The third argument itself accepts three
equivalent shapes when no option needs setting — omitted, `null`, or `{}` —
so `generateSigil(statement, planet, opts || null)` is a safe caller idiom;
anything else (a string, number, boolean, or other non-object value) throws
`E_INVALID_OPTION`.

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
sigil-spinner <statement> --planet <name> [--json] [--output <file>] [--glyph] [--curve] [--id-prefix <string>] [--title]
```

- `<statement>` — the intention statement, as a positional argument. Exactly
  one statement positional is accepted; a second (or later) positional is a
  usage error (`E_CLI_USAGE`, exit 2 — see Errors and Exit Codes below).
  Pass `-` to read the statement from stdin instead (e.g.
  `echo "I will succeed" | sigil-spinner - --planet saturn`), which is what
  lets the tool compose in a shell pipeline.
- `--planet <name>` — required, case-insensitive, one of the ten names
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
- `--title` — the CLI face of the library's `options.title` (see above):
  embeds the XML-escaped statement in the SVG's `<title>` element, giving
  the generated SVG an accessible name. Absent by default. Supplying
  `--id-prefix` alongside `--title` is what wires that accessible name for
  assistive technology (see Multi-Embed Safety below) — `--title` alone
  emits a bare `<title>` with no guarantee it resolves.

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

**Accessible name (INT-06).** When both `options.title` and a non-empty
`idPrefix` are supplied, the root `<svg>` additionally carries `role="img"`
and an `aria-labelledby` reference to the `<title>` element's own `id`
(derived as the escaped `idPrefix` plus the literal suffix `-title`) — so
assistive technology resolves the sigil's accessible name from the intention
statement with no ARIA written by the embedder. This is a deliberate,
documented limit, not an oversight: **with a title and no `idPrefix`, the
output is a bare `<title>` element — no `role`, no `aria-labelledby`, no
synthesized id** (D-44 keeps the artifact id-free by construction; `idPrefix`
is the sole route to an emitted id). Native browser support for a bare
`<title>` element's accessible-name mapping on `<svg>` is inconsistent across
engines — supplying an `idPrefix` alongside `--title`/`options.title` is what
*guarantees* the name, proven by a real browser's accessibility tree in
`test/browser/accessible-name.test.js` rather than by markup shape alone.

## The `<sigil-spinner>` Custom Element

`<sigil-spinner>` is a value-neutral convenience wrapper around the raw-SVG
embed path documented above — not a second, safer, different embedding
model. It reads attributes, calls the library's own `generateSigil`, and
writes the whole, unmodified result into its own light-DOM children. If its
output or theming reach ever differed from a hand-pasted `<svg>` for the
same inputs, that would be a defect in the element, not an acceptable
variation.

Load it as plain ESM — no build step, no runtime dependency beyond the
library itself:

```html
<script
  type="module"
  src="./node_modules/@falkensmage/sigil-spinner/src/element/sigil-spinner-element.js"
></script>

<sigil-spinner statement="I will succeed" planet="saturn"></sigil-spinner>
```

This is a **client-JS-required convenience**. Anyone needing a no-JS or SSR
guarantee should call `generateSigil` at build time (see Library above) and
paste the resulting static SVG directly — that is what this library already
is; the element is just a thinner way to reach the same output when the page
can load a module.

### Attributes

| Attribute    | Maps to                            | Type                     | Notes                                                                 |
| ------------ | ----------------------------------- | ------------------------ | ---------------------------------------------------------------------- |
| `statement`  | `generateSigil`'s first argument    | string, required         | Absent → inert, see below                                              |
| `planet`     | `generateSigil`'s second argument   | string, required         | Absent → inert; an unknown value throws `SigilError`, see below        |
| `curve`      | `options.curve`                     | boolean, presence-based  | See the footgun below — `curve="false"` still enables curves           |
| `glyph`      | `options.glyph`                     | boolean, presence-based  | Same presence semantics as `curve`                                     |
| `id-prefix`  | `options.idPrefix`                  | string, optional         | See Multi-Embed Safety above — the caller-owned uniqueness rule applies identically here |
| `show-title` | `options.title`                     | boolean, presence-based  | The sole exception to the naming convention below                      |

Every attribute is the CLI's long-flag name with the leading `--` dropped,
kebab-case preserved — `id-prefix` maps to `options.idPrefix` at the call
boundary, exactly as the CLI does. `--json`/`--output` are CLI transport
concerns with no element analog and are deliberately absent.

**The one naming exception.** `show-title` is the SOLE attribute that does
not simply drop the CLI's leading `--` from `--title` — it is deliberately
named differently, because `title` is a global HTML attribute present on
every element, rendering a browser tooltip, and it means something entirely
different from `options.title` (which embeds the XML-escaped statement in
the SVG's own `<title>` element). Reusing `title` would mean a consumer who
sets `title="My sigil"` expecting a tooltip silently triggers sigil-specific
behavior instead — this element uses `show-title` here, and nowhere else.

**The presence-semantics footgun.** `curve`, `glyph`, and `show-title` use
HTML boolean-attribute presence semantics, exactly like the platform's own
`disabled`/`hidden` — they are true when the attribute is present,
regardless of its value. **`curve="false"` still enables curves.** The only
way to disable a boolean attribute is to remove it entirely:
`<sigil-spinner curve="false">` and `<sigil-spinner curve>` are identical.

### Sizing

A `<sigil-spinner>` with no author stylesheet rule computes to `display:
inline` — the platform default for any unstyled element, custom elements
included, since this element attaches no shadow root and ships no default
stylesheet of its own. The inner `<svg>` carries a fixed `viewBox="0 0 100
100"` and no `width`/`height` attributes, so an unstyled, populated element
sitting in ordinary inline flow is not guaranteed to occupy the square area
you expect. Close this with a documented CSS recipe rather than discovering
it by accident:

```css
sigil-spinner {
  display: inline-block;
}
```

That one line is the floor every embed needs, regardless of final size. For
a typical fixed, square presentation (matches the fixed 100×100 viewBox
aspect ratio exactly — no distortion):

```css
sigil-spinner {
  display: inline-block;
  width: 240px;
  aspect-ratio: 1 / 1;
}
```

`240px` is a documentation convention, not a library default — choose
whatever width you need. `aspect-ratio: 1 / 1` is the load-bearing half of
the recipe: it is what keeps the fixed viewBox from stretching.

### Theming reach (light DOM, no shadow root — ever)

`<sigil-spinner>` attaches no shadow root, ever. The generated SVG is
written directly into the element's own light-DOM children, so page CSS
reaches it through **both** theming mechanisms documented above — the
`--sigil-*` custom properties (which inherit across a shadow boundary
anyway) **and** the seven semantic class selectors (`.sigil-path`,
`.sigil-grid`, and so on, which do NOT cross a shadow boundary) — with
identical reach to a hand-pasted `<svg>`. The accepted, symmetric cost: a
careless global rule like `path { stroke: red }` on the host page can break
a `<sigil-spinner>` exactly as it can break a hand-pasted `<svg>` today.
That openness is the value proposition, not a new risk.

### Inert and error states

A `<sigil-spinner>` missing `statement` or `planet` renders nothing and
throws nothing. This is the expected inert state, not an error — set both
attributes to render.

A thrown error clears the element, logs the full error to the console, and
reflects `data-sigil-error="<code>"` on the host element — style it with
`sigil-spinner[data-sigil-error] { … }` if you want a visible signal on the
page:

```css
/* Documentation example only — never shipped as library CSS */
sigil-spinner[data-sigil-error] {
  outline: 2px dashed #dc2626;
  outline-offset: 4px;
}
```

### Multi-instance ids

The element synthesizes nothing — no derived `id-prefix`, no hash, no
counter. Two elements with identical `statement` and `planet` and NO
`id-prefix` render byte-identical SVG and emit zero `id` attributes between
them, so identical content cannot collide. **The converse is the caller's
responsibility, identical to the raw-SVG embed path above: two elements
given the SAME `id-prefix` DO produce duplicate ids in the document.** Pass
a different prefix per instance if more than one on a page needs one.

### Node and server use

`./element` requires a DOM — `HTMLElement` and `customElements` do not exist
in Node, and the element's module dereferences them at class-definition
time. For Node or server-side use, import `.` directly and call
`generateSigil` yourself (see Library above); `./element` is a browser-only
subpath, deliberately without a `browser`/`node` condition in `exports` to
pick between — there is no Node-compatible alternative element to fall back
to, so this paragraph is the correct place for that signal, not the
manifest.

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
| `E_UNKNOWN_PLANET`    | The planet name wasn't one of the ten known planets (the seven classical plus the three trans-Saturnian modern additions). The message lists all ten, classical and modern separated.                                                                                                                                                                             | 2               |
| `E_EMPTY_SEQUENCE`    | The statement reduced to zero kept letters after striking vowels and repeats. The message names the total struck count and a per-reason breakdown (e.g. "all 5 characters struck (5 vowels)"), and `.details.struck` carries the full structured struck list.                                                                                                      | 3               |
| `E_INVALID_OPTION`    | A known option (e.g. `glyph`, `title`, `curve`, `idPrefix`) was supplied with the wrong type, or `idPrefix` was an empty string — OR the `options` argument itself was present but not an object (a string, number, boolean, BigInt, Symbol, or function). The message names the offending option; `.details` carries `{ option, value, expected }` so a program can introspect exactly what was passed — for the whole-bag case, `.details.option` is `null` since no single named option is at fault. Unknown option keys are never an error — they're ignored for forward compatibility, and `null`/omitted/`{}` for the whole `options` argument are equivalent, all resolving to every option's default. | 2               |

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
caller opts in via `{ title: true }` (`--title` on the CLI) — honoring the
release-the-intention posture of classic sigil practice (D-16). When opted
in, the statement is XML-escaped before being embedded.

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

All ten planetary kameas (magic squares) — the seven classical planets plus
the three trans-Saturnian modern additions — ship under the `agrippa` kamea
set — `KAMEA_SETS.agrippa` in `src/data/kamea.js`, selected by default via
`DEFAULT_KAMEA_SET`. The data layer is kamea-set-aware from day one so a
future independently-verified set (e.g. a Skinner-sourced set) can be added
under a new key without reshaping the API; only `agrippa` ships currently.

**Primary source (named by the project's locked decision, D-01):**
Agrippa, Henry Cornelius. _Three Books of Occult Philosophy._ Donald Tyson,
ed. Llewellyn Publications.

**Independent cross-check source (named by D-01):**
Skinner, Stephen. _The Complete Magician's Tables._ Golden Hoard Press.

**What was actually verified (honest provenance):** neither source above has
been read directly. On 2026-08-12, every classical grid was diffed
cell-by-cell against a physical printed source — Rankine, David & d'Este,
Sorita. _Practical Planetary Magick._ Appendix 2, "The Kameas," pp. 177-181
(classical seven: pp. 177-179) — and tested for four structural properties:
permutation of 1..n², all rows/columns/both diagonals equal to the magic
constant, and associativity. Six of the seven — Saturn, Jupiter, Mars, Sun,
Venus, Moon — are identical to the book. **Mercury** diverges: the book
swaps two value-pairs between columns in a way that preserves every row AND
column sum (which is why magic-sum-only verification could not have caught
it), but its anti-diagonal sums 257 (not the magic constant 260) and it
breaks associativity at 8 cells — two independent proofs the repo's Mercury
is correct and the book's is defective. No cell values changed as a result.
The **Sun** is non-associative in both the book and the repo — expected, not
a defect, since order 6 is singly-even and the traditional Sun kamea
genuinely lacks central symmetry. See the module header in
`src/data/kamea.js` for the full citation, including why the construction
rules that reproduce every grid are empirically fitted rather than
attributable to Agrippa.

**Ordering convention:** every grid is row-major, top row first, left to
right — `grid[0][0]` is the top-left cell.

**Grid order and magic constants:** Saturn (3×3, 15), Jupiter (4×4, 34), Mars
(5×5, 65), Sun (6×6, 111), Venus (7×7, 175), Mercury (8×8, 260), Moon (9×9,
369), Uranus (11×11, 671), Neptune (12×12, 870), Pluto (13×13, 1105).

**The three trans-Saturnian planets are not traditional.** Rankine created
these in the 1980s (p.179) so kamea sigilisation could extend to the outer
planets. `PLANET_ATTESTATION` in `src/data/kamea.js` carries a finer label
for each: Uranus and Pluto are `attested` — the printed book and the
empirically-fitted construction rule agree, zero differing cells. Neptune is
`derived` — generated by the construction rule only, contradicting the
printed book (which has its own uncorrectable defects), and is the weakest
link in this whole chain: it extrapolates a rule fitted at smaller orders out
to n=12. See the divergence note immediately above Neptune's grid literal in
`src/data/kamea.js` for the full account.
