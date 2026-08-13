---
name: sigil
scope: personal
description: >-
  Generates traditional Western esoteric planetary sigils — traced across a
  planet's kamea (magic square) from a struck-and-encoded intention
  statement — as embeddable, fully CSS-stylable inline SVG. Fires on
  requests like "make me a sigil", "sigilize this intention", "planetary
  sigil", "kamea", or "sigil for a page"; whenever a sigil needs to be
  embedded into a page or site being built; and whenever choosing which
  planet suits an intention. Does not cover tarot spreads, dream
  interpretation, natal charts, transits, or general symbolic/astrological
  synthesis — use oracle for those — and does not cover decision framing —
  use decide.
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Sigil

Generates a traditional Western esoteric planetary sigil from an intention statement: vowels and repeated letters are struck, the remainder is encoded through the Pythagorean Number Table, and the resulting number sequence is traced across the chosen planet's kamea. Output is a self-contained, viewBox-based inline SVG, fully stylable via CSS classes and custom properties — no build step, no external references.

## Invocation

Run the published CLI via `npx`. Never reference a local filesystem path or this repository's checkout location — this skill runs globally, from any directory, on any machine, including one that has never cloned this repo.

```bash
printf '%s' "$STATEMENT" | npx -y @falkensmage/sigil-spinner@latest - --planet <planet>
```

**Use this form.** The `-` sentinel makes the CLI read the statement from stdin, so shell quoting never applies to it at all. An intention statement is free-form prose and can contain a quote character, a backtick, or a `$(...)` sequence — passing it as an argument means getting the quoting exactly right every time, and passing it on stdin means never having to.

- `-y` — skips npx's interactive install-confirmation prompt, which would otherwise stall a non-interactive session waiting for a keypress that never comes.
- `@latest` — a dist-tag, not a version pin: it forces a real registry lookup for what `latest` currently resolves to. A bare package name without a tag could instead be served from a stale local npx cache — an invisible failure in a tool whose entire contract is determinism.
- `-` — the stdin sentinel. Without it the CLI expects the statement as a positional argument.

**If you must pass the statement as an argument** — an interactive one-off you are typing by hand, not assembling — single-quote it and escape any embedded single quote with the standard shell idiom, so `it's time` becomes `'it'\''s time'`:

```bash
npx -y @falkensmage/sigil-spinner@latest 'I WILL FINISH THIS' --planet saturn
```

Do not substitute untrusted or unexamined prose into that argument form. A statement containing a single quote closes the quoting and the remainder is executed as shell commands — with whatever privileges the session holds. The stdin form above has no such failure mode, which is why it is the default here.

**Library form**, for build scripts that already carry the dependency:

```js
import { generateSigil } from '@falkensmage/sigil-spinner';
const { svg, working } = generateSigil(statement, planet, { curve: true, idPrefix: 'hero' });
```

## Flags

This CLI has no `--help` flag (`sigil-spinner --help` exits with `E_CLI_USAGE: Unknown option '--help'`) — the table below is the mechanical reference. It is kept honest by an in-repo drift check (`test/skill-cli-parity.test.js`) that fails if this table and the CLI's real option keys diverge; do not delete this table in favor of delegating to `--help`.

| Flag | Type | Purpose |
|------|------|---------|
| `--planet` | string, required | the seven classical planets (saturn, jupiter, mars, sun, venus, mercury, moon) work on every published version; uranus, neptune and pluto arrived in 1.2.0 and are available from that release onward |
| `--json` | boolean | write the JSON working to stdout instead of the raw SVG |
| `--output` | string | write the selected artifact to a file instead of stdout |
| `--glyph` | boolean | render the optional planetary glyph layer |
| `--curve` | boolean | curved/smoothed path instead of straight segments |
| `--id-prefix` | string | namespace the root `<svg>` element's id, for co-embedding more than one sigil on a page |
| `--title` | boolean | embed the statement in the SVG's `<title>` element |

## Planet Selection

The table and the heuristic below are what to reach for at the moment of choosing — they load with the rest of this file because that is when they are needed. Worked examples for the ambiguous two-planet case, plus the attribution and capture date, live one hop away in `references/correspondences.md`.

| Planet | Domains of intent | Reach for this when… |
|---|---|---|
| **Saturn** | Structure, limits, boundaries, endings, time, discipline, public standing, memory, binding — and stability. Both poles at once: the structure that constrains is the same structure that steadies | The intention is about holding a line — ending something, setting a boundary, committing to a long form, making a thing durable. Which pole is active depends on what the working needs; do not collapse it to one |
| **Jupiter** | Expansion, meaning, truth, teaching, travel, philosophy, abundance | The intention wants to get bigger or truer — growth, opportunity, learning, saying the thing publicly |
| **Mars** | Action, courage, conflict, drive, protection, cutting through | The intention needs force applied — starting, defending, severing, moving something that will not move |
| **Sun** | Vitality, visibility, creative expression, sovereignty, recognition, joy | The intention is about being seen as yourself — creative work, taking the stage, health, coming back to life |
| **Venus** | Love, beauty, relationship, desire, worth, resources, fairness | The intention concerns what you are drawn to and what you are worth — connection, art, money as value, repair between people |
| **Mercury** | Communication, writing, thought, learning, commerce, travel, cleverness | The intention lives in language or transit — a piece of writing, a conversation, a negotiation, a launch |
| **Moon** | Emotion, intuition, home, ancestry, cycles, dreams, nurture | The intention is interior or ancestral — grief, dream work, rest, family, anything that moves in cycles rather than lines |
| **Uranus** | Revolution, rule-breaking, breaking down barriers, liberation, sudden change, social justice — the pattern broken rather than forced | The intention is about getting free of a shape that won't yield to pressure — refusing a role, a sudden break, revolutionizing a rule you've been living under |
| **Neptune** | Diffusion of boundaries, dream, intuition, the mystical, compassion and faith, transcendence — and fog. Neptune isn't clear, and the unclarity *is* the planet, not a shadow of it | The intention is imaginal or dissolving — dreamwork, artistic vision, spiritual contact, releasing something that cannot be cut and must instead be let go |
| **Pluto** | Transformation, power, shadow, death and rebirth, burning down and rebuilding, the irreversible — and taboo: sex, death, money, religion | The intention requires something to actually die — deep change, shadow work, reclaiming power that was taken, or a working that touches what isn't spoken |

**Selection heuristic — the case a flat table cannot cover.** When a statement reads as two planets at once, ask which one names the verb rather than the subject matter. "I WILL FINISH THIS BOOK" is Mercury by subject (writing) and Saturn by verb (finish, complete, hold the line) — take Saturn. "I WILL BE PAID WHAT I AM WORTH" is Venus by subject (worth) and Mars by verb (demand, take) — take Venus, because the working is about establishing the value, not about the confrontation. The rule: the planet that governs the change being asked for wins over the planet that governs the territory it happens in.

**Three more axes, for the modern three against their nearest classical neighbor:**

- **Pluto vs. Saturn** — both end things. Saturn ends by holding a line to completion; Pluto burns it down and rebuilds. Saturn: the structure ends. Pluto: the self is remade. Take Saturn when the intention wants a thing finished and durable; take Pluto when it wants something to actually die.
- **Neptune vs. Moon** — both interior. The Moon feels; Neptune dissolves. Moon is emotion, cycles, ancestry, nurture — it moves in cycles rather than lines. Neptune is the boundary itself going soft. Take the Moon for grief, rest, family, dream *content*; take Neptune when the working is about the edge between things coming apart.
- **Uranus vs. Mars** — both disruptive. Mars applies force to move a thing that will not move. Uranus breaks the rule the thing sits under. Take Mars when the intention needs a blow struck; take Uranus when the intention needs the game changed.

**State the reasoning out loud, every time.** Name the chosen planet and the domain of intent it was matched on in the reply. When the statement was genuinely ambiguous, name the axis that decided it (subject vs. verb, or whichever axis applied) and what the runner-up was. Never bounce the choice back to the user as a question — "which planet should I use?" is exactly the failure mode this table exists to remove. A stated, reasoned choice the user can correct in one sentence is the deliverable; an interrogation is not.

See `references/correspondences.md` for worked examples of the ambiguous cases and the full attribution record.

## Embedding Checklist

Five operational facts a session would otherwise learn by shipping a broken page. Treat these as instructions, not trivia.

1. **Supply a distinct `--id-prefix` per co-embedded sigil.** Two sigils sharing the same prefix collide by design — the library never derives an id from a hash of its inputs (that would produce identical ids for identical sigils, the exact collision it would claim to prevent). Uniqueness across multiple sigils on one page is the caller's documented responsibility, not a bug to discover.
2. **The grid layer is present and hidden, not absent.** Every generated sigil already carries the kamea's lattice lines and cell numbers in its markup, on every planet, with no flag to add or remove them. They start at zero opacity. One CSS declaration from the embedding page reveals both together — there is no generation-time toggle.
3. **The glyph layer is opt-in and depends on the viewer's font.** `--glyph` renders the planetary character, but it only displays correctly if the viewer's font stack covers the Miscellaneous Symbols block, U+2600 to U+26FF — an uncovered stack renders a missing-glyph box instead. There is no code-level fallback by design (an embedded font would violate the zero-runtime-dependency constraint). Override `--sigil-glyph-font` with a symbol-covering stack (for example `"Noto Sans Symbols"`) when the embedding site's default font doesn't cover that range.
4. **Numeric `--sigil-*` theming values are unitless user units**, interpreted against the fixed `0 0 100 100` viewBox — not pixels, not ems. Write the bare number.
5. **Curve mode can overshoot the viewBox on a reversal-heavy statement.** The documented instance is the `sun` kamea traced from the statement about succeeding, where a centripetal Catmull-Rom control point lands just past the viewBox's top edge. This is real curve behavior on a sharp (near-180-degree) direction reversal in the traced path, deliberately not clamped — expect it as a possibility on statements whose letter sequence reverses direction sharply, not as a defect to file.

## Going Deeper

This file carries invocation mechanics plus the judgment needed to choose a planet and embed a sigil correctly — not everything the package can do. Four bodies of depth are deliberately not restated here, because every line restated here is a line that can drift from the code that actually governs it:

- The full fifteen-property `--sigil-*` theming surface — every custom property, its default, and the element it targets
- The complete error-code and CLI exit-status tables
- The letter-handling and folding rules — which characters strike, which fold to a base letter, and why
- The JSON working's full field-by-field description

Read either of these, and only when the task actually needs that depth — one hop, never through an intermediate file:

- The installed package's own README, at `node_modules/@falkensmage/sigil-spinner/README.md`, once the consuming project has installed the package or run it via `npx`
- The project repository, at `https://github.com/mstine/sigil-spinner`

## Published-Surface Boundary

The published package resolves to version `1.2.0` as of 2026-08-13 (this line is written at release-prep time for the 1.2.0 release, before publish — run `npm view @falkensmage/sigil-spinner version` to confirm what `latest` actually resolves to right now). Its `exports` map exposes three entry points: `.` (the library), `./element` (a browser custom element), and `./package.json`.

**Two embedding paths now exist, and this skill's checklist above covers the first one.**

1. **Inline SVG** — call the CLI or the library, put the returned markup straight in the page. This is the default and the one the checklist above describes. It needs no JavaScript at runtime and works in any HTML context.
2. **The `<sigil-spinner>` custom element** — `@falkensmage/sigil-spinner/element`, loaded as plain ESM, no build step. Useful when the page needs the statement or planet to change after load, since the element re-renders on attribute change. It renders into light DOM, so page CSS reaches it through both `--sigil-*` custom properties and the semantic class selectors, exactly as with inline SVG. It requires a DOM — importing it in Node throws, because `HTMLElement` and `customElements` do not exist there.

Do not restate the element's attribute table here. It is documented in the package's own README (see Going Deeper above) and mechanically bound to the element's `observedAttributes` by a drift guard in the repository; a copy in this file would have no such guard and would be free to go stale. Read the README when a task actually calls for the element.

Prior to `1.1.0` the published `exports` map exposed only `.`, and this section correctly warned against instructing a session to import an element entry point. That warning no longer applies to `1.1.0` or later. It still applies to anyone pinned to `1.0.0`.

**Planet-list skew.** The classical seven (saturn, jupiter, mars, sun, venus, mercury, moon) are valid on every published version. Uranus, neptune and pluto arrived in `1.2.0` and are available from that release onward — a consumer pinned below `1.2.0` gets `E_UNKNOWN_PLANET` for any of the three. This is a fact about which release added them, not a skew that moves when a later version publishes: it holds at `1.2.0` and stays true at every version after. Re-check `npm view @falkensmage/sigil-spinner version` if a session needs to confirm what `@latest` currently resolves to, and therefore what a bare `npx ...@latest` invocation will actually run.
