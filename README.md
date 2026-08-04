# Sigil Spinner

A Node CLI + importable library that generates planetary sigils from intention
statements using the traditional Western esoteric method: strike vowels and
repeating letters, encode the remainder through the Pythagorean Number Table,
and trace the resulting number sequence across the chosen planet's kamea
(magic square). Output is fully CSS-stylable inline SVG plus a JSON "working"
describing the full derivation.

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
