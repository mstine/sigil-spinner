# Phase 2: Every Planet, Every Statement - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-06
**Phase:** 2-Every Planet, Every Statement
**Areas discussed:** Repeat marker convention, Y-handling rule, Non-ASCII / accents, Degenerate-input UX

---

## Repeat marker convention

### Q1: What shape marks a consecutive repeat at a cell?

| Option | Description | Selected |
|--------|-------------|----------|
| Small loop (Recommended) | Circular curl at the cell — most commonly depicted modern convention, reads at small sizes, own semantic class | ✓ |
| Notch / chevron | Sharp out-and-back jab — fully angular, but can read as a direction change | |
| Both, configurable | Loop default with notch option — more surface; Phase 3 owns render configurability | |

**User's choice:** Small loop

### Q2: How should 3+ consecutive repeats render (e.g. 5,5,5)?

| Option | Description | Selected |
|--------|-------------|----------|
| One loop per repeat (Recommended) | Two loops for a triple — every number has a visible consequence; nested/offset so countable | ✓ |
| Single loop regardless | Cleaner but drawn form diverges from the number sequence | |
| You decide | Settle against traditional depictions via research | |

**User's choice:** One loop per repeat

### Q3: When a repeat lands on the start or end cell, how do markers coexist?

| Option | Description | Selected |
|--------|-------------|----------|
| Draw both, geometry offsets (Recommended) | Boundary marker and loop both render, offset for legibility — nothing suppressed | ✓ |
| Boundary marker wins | Loop suppressed at boundary cells — cleaner, but a repeat disappears from the drawn sigil | |
| You decide | Leave coexistence rule to planner/executor | |

**User's choice:** Draw both, geometry offsets

### Q4: How does the loop live in the SVG markup?

| Option | Description | Selected |
|--------|-------------|----------|
| Own element + class (Recommended) | Independently stylable like sigil-start/sigil-end; repeats recorded as data in PathModel/working | ✓ |
| Baked into the path | One continuous stroke, but loops can't be styled separately | |

**User's choice:** Own element + class

---

## Y-handling rule

### Q1: What is the Y rule?

| Option | Description | Selected |
|--------|-------------|----------|
| Always consonant (Recommended) | Matches current behavior, common modern stance, trivially deterministic, richer sigils | ✓ |
| Always vowel | Deterministic, leaner sigils, atypical for the method | |
| Positional rule | Closer to phonetics but harder to state and eyeball-verify | |

**User's choice:** Always consonant — area resolved in one question; user moved on.

---

## Non-ASCII / accents

### Q1: How should accented Latin letters (É, Ñ, Ü, Ç…) be handled?

| Option | Description | Selected |
|--------|-------------|----------|
| Fold to base letter (Recommended) | Unicode-decompose, strip diacritics — matches hand derivation; one-sentence rule | ✓ |
| Strike as non-letter (current) | Zero new code but JOSÉ silently loses a letter a human would keep | |
| Reject with error | Maximally explicit, hostile to names/borrowed words | |

**User's choice:** Fold to base letter

### Q2: What about non-decomposable letters — ß, Æ, Œ, Ø, Þ, Ð?

| Option | Description | Selected |
|--------|-------------|----------|
| Small transliteration map (Recommended) | ß→SS, Æ→AE, Œ→OE, Ø→O, Þ→TH, Ð→D — documented citable table in code + README | ✓ |
| Strike as non-letter | Simpler rule, drops letters from Norse/German/French names | |

**User's choice:** Small transliteration map

### Q3: How are non-Latin script letters handled?

| Option | Description | Selected |
|--------|-------------|----------|
| Strike as non-letter (Recommended) | Recorded in struck trail; fully non-Latin statements hit E_EMPTY_SEQUENCE | ✓ |
| Dedicated error | Louder, but partial cases hard-fail instead of using the Latin letters | |

**User's choice:** Strike as non-letter

### Q4: Should the working record the fold itself?

| Option | Description | Selected |
|--------|-------------|----------|
| Record both (Recommended) | Original char + folded form — derivation trail stays fully narratable | ✓ |
| Folded form only | Simpler schema, breaks narratability | |

**User's choice:** Record both

---

## Degenerate-input UX

### Q1: What should the empty-reduction error carry to "name the cause"?

| Option | Description | Selected |
|--------|-------------|----------|
| Message + struck breakdown (Recommended) | Strike-count message + structured struck list on the error object | ✓ |
| Message only | Richer message, no structured data | |
| You decide | Planner picks shape within D-15 | |

**User's choice:** Message + struck breakdown

### Q2: How does a single-letter sigil render at its one cell?

| Option | Description | Selected |
|--------|-------------|----------|
| Both markers, offset (Recommended) | Start circle + end crossbar both render, offset — uniform anatomy | ✓ |
| Start circle only | Cleaner mark, but end marker silently vanishes | |
| You decide | Planner settles geometry within D-05 vocabulary | |

**User's choice:** Both markers, offset

---

## Claude's Discretion

- Exact loop geometry (radius, offset, nesting spacing) within the 100×100 viewBox
- Exact semantic class name for the loop element (D-08 taxonomy)
- Working field names for repeat/fold data (D-14-style discretion)
- Structure of fold/transliteration logic within `src/text/`
- Determinism snapshot matrix design (all seven planets covered)
- Whitespace-only / empty-string statement boundary handling

## Deferred Ideas

None — discussion stayed within phase scope.
