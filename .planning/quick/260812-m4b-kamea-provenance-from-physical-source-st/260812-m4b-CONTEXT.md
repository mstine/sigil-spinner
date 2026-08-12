# 260812-m4b — Verified Reference Data

**This file is machine-generated. The grids below are authoritative for this task.
Copy them verbatim. Do NOT retype, re-derive, or "correct" any digit.**

## Source

Rankine, David & d'Este, Sorita. *Practical Planetary Magick*. Appendix 2, "The Kameas",
pp. 177-181. Classical seven: pp. 177-179. Trans-Saturnian: through p. 181.
(Page 177 is legible in the photograph; the remaining page numbers are per Matt's
reading of the physical copy.)

Photographs: ~/Inbox/IMG_9450-9455.heic (2026-08-12).

## Verification performed 2026-08-12

Every classical grid in `src/data/kamea.js` was diffed cell-by-cell against the
printed appendix, and each grid was tested for four structural properties:
permutation of 1..n^2; all rows/columns/both diagonals equal to the magic
constant; and associativity (v(r,c) + v(n-1-r,n-1-c) === n^2+1).

| Planet  | Order | M    | Result |
|---------|-------|------|--------|
| Saturn  | 3     | 15   | identical to repo |
| Jupiter | 4     | 34   | identical to repo |
| Mars    | 5     | 65   | identical to repo |
| Sun     | 6     | 111  | identical to repo |
| Venus   | 7     | 175  | identical to repo |
| Mercury | 8     | 260  | **book differs in 4 cells — repo is correct** |
| Moon    | 9     | 369  | identical to repo |

### Mercury — the repo is correct, the book is defective

The book prints, at rows 3-4, columns 5 and 8:

    row 3:  41 23 22 44 [48] 19 18 [45]     repo has 45 ... 48
    row 4:  32 34 35 29 [25] 38 39 [28]     repo has 28 ... 25

Two value-pairs swapped between columns. The swap preserves every row sum AND
every column sum, which is exactly why the original magic-sum-only verification
could not have caught it. Two harder tests catch it:

- The book's anti-diagonal sums **257**, not 260. As printed it is not a magic square.
- It breaks associativity at those 4 cells and their 4 central-symmetry partners.

The repo's Mercury is magic on all rows, columns and both diagonals, and is
associative in all 64 cells. **No cell values change in this task.** D-02 (add a
new KAMEA_SETS key rather than mutate) does not fire; determinism is preserved.

### Sun — non-associativity is expected, not a defect

Neither the book's Sun nor the repo's Sun is associative. This is correct: order 6
is singly-even and the traditional Sun kamea genuinely lacks central symmetry.
Both agree exactly. The associativity invariant test MUST exempt the Sun with a
comment explaining this, or it will fail on correct data.

## Construction rules (empirically fitted, NOT cited to Agrippa)

**There is no "Agrippa formula" to cite.** Agrippa presents the kameas in *De
Occulta Philosophia* Book II as finished tables, not as algorithms. The named
construction methods postdate him: Agrippa wrote c.1510 (published 1531-33), while
the odd-order "Siamese method" is named for Simon de la Loubere, who published it
after his 1687 embassy to Siam. Rankine's claim (p.179) that he used "the same
mathematical formula used to create the classical kameas" is his own assertion;
the book does not publish the formula.

The rules below therefore derive their authority from **fit, not lineage**:

- **Odd order** — start 1 at row (n+3)/2, col (n+1)/2 (1-based); step down-right
  with modular wrap; on collision drop two rows in the same column.
  Reproduces Saturn, Mars, Venus, Moon with zero deviation.
- **Doubly-even order (n % 4 === 0)** — fill 1..n^2 row-major; complement
  (n^2+1-v) where (r%4 in {0,3}) === (c%4 in {0,3}); then reverse row order.
  Reproduces Jupiter and Mercury with zero deviation.

## Attestation of the three trans-Saturnian squares

Per the book (p.179), David Rankine created these in the 1980s so kamea
sigilisation could extend to the outer planets. They are **not traditional**.
They require finer labelling than a single `traditional: false` flag:

| Planet  | Order | M    | attestation | Basis |
|---------|-------|------|-------------|-------|
| Uranus  | 11    | 671  | `attested` | book AND generated rule agree, **zero** differing cells |
| Pluto   | 13    | 1105 | `attested` | book AND generated rule agree, **zero** differing cells |
| Neptune | 12    | 870  | `derived`  | **generated only — contradicts the printed book** |

### Neptune — why the printed square was rejected

The book's printed Neptune is defective on its own terms:

- It prints `34` twice (35 absent) and `69` twice (68 absent) — visible in the photo.
- **Even after repairing both typos** it still fails: columns 8 and 9 sum 869 and 871
  against a magic constant of 870, and 4 cells break associativity.

The generated square is clean on every test: full permutation of 1..144, all rows,
columns and both diagonals at 870, and fully associative.

Neptune is nonetheless the **weakest link in the whole chain** and must be labelled
honestly. It extrapolates a rule fitted at n=4 and n=8 out to n=12, and it disagrees
structurally with the sole printed source (a column-block swap, over and above the
typos). The preference for the generated form is a sound inference, **not provenance**.
A future reader comparing the data against p.181 WILL notice the difference and must
find this reason recorded at the point of divergence.

## Authoritative grids — copy verbatim

```js
  uranus: [
    [56, 117, 46, 107, 36, 97, 26, 87, 16, 77, 6],
    [7, 57, 118, 47, 108, 37, 98, 27, 88, 17, 67],
    [68, 8, 58, 119, 48, 109, 38, 99, 28, 78, 18],
    [19, 69, 9, 59, 120, 49, 110, 39, 89, 29, 79],
    [80, 20, 70, 10, 60, 121, 50, 100, 40, 90, 30],
    [31, 81, 21, 71, 11, 61, 111, 51, 101, 41, 91],
    [92, 32, 82, 22, 72, 1, 62, 112, 52, 102, 42],
    [43, 93, 33, 83, 12, 73, 2, 63, 113, 53, 103],
    [104, 44, 94, 23, 84, 13, 74, 3, 64, 114, 54],
    [55, 105, 34, 95, 24, 85, 14, 75, 4, 65, 115],
    [116, 45, 106, 35, 96, 25, 86, 15, 76, 5, 66],
  ],

  neptune: [
    [12, 134, 135, 9, 8, 138, 139, 5, 4, 142, 143, 1],
    [121, 23, 22, 124, 125, 19, 18, 128, 129, 15, 14, 132],
    [109, 35, 34, 112, 113, 31, 30, 116, 117, 27, 26, 120],
    [48, 98, 99, 45, 44, 102, 103, 41, 40, 106, 107, 37],
    [60, 86, 87, 57, 56, 90, 91, 53, 52, 94, 95, 49],
    [73, 71, 70, 76, 77, 67, 66, 80, 81, 63, 62, 84],
    [61, 83, 82, 64, 65, 79, 78, 68, 69, 75, 74, 72],
    [96, 50, 51, 93, 92, 54, 55, 89, 88, 58, 59, 85],
    [108, 38, 39, 105, 104, 42, 43, 101, 100, 46, 47, 97],
    [25, 119, 118, 28, 29, 115, 114, 32, 33, 111, 110, 36],
    [13, 131, 130, 16, 17, 127, 126, 20, 21, 123, 122, 24],
    [144, 2, 3, 141, 140, 6, 7, 137, 136, 10, 11, 133],
  ],

  pluto: [
    [79, 164, 67, 152, 55, 140, 43, 128, 31, 116, 19, 104, 7],
    [8, 80, 165, 68, 153, 56, 141, 44, 129, 32, 117, 20, 92],
    [93, 9, 81, 166, 69, 154, 57, 142, 45, 130, 33, 105, 21],
    [22, 94, 10, 82, 167, 70, 155, 58, 143, 46, 118, 34, 106],
    [107, 23, 95, 11, 83, 168, 71, 156, 59, 131, 47, 119, 35],
    [36, 108, 24, 96, 12, 84, 169, 72, 144, 60, 132, 48, 120],
    [121, 37, 109, 25, 97, 13, 85, 157, 73, 145, 61, 133, 49],
    [50, 122, 38, 110, 26, 98, 1, 86, 158, 74, 146, 62, 134],
    [135, 51, 123, 39, 111, 14, 99, 2, 87, 159, 75, 147, 63],
    [64, 136, 52, 124, 27, 112, 15, 100, 3, 88, 160, 76, 148],
    [149, 65, 137, 40, 125, 28, 113, 16, 101, 4, 89, 161, 77],
    [78, 150, 53, 138, 41, 126, 29, 114, 17, 102, 5, 90, 162],
    [163, 66, 151, 54, 139, 42, 127, 30, 115, 18, 103, 6, 91],
  ],
```

## Additional surface that enumerates planets

- `src/data/kamea.js` — PLANET_ORDER, KAMEA_SETS, planetNames(), gridSize() JSDoc
  ("3 for saturn through 9 for moon" is now through 13 for pluto)
- `src/render/glyphs.js` — PLANET_GLYPHS needs Uranus U+2645, Neptune U+2646,
  Pluto U+2647, each with the same U+FE0E variation selector as the existing seven.
  The comment saying the selector "is a no-op on the other five glyphs" needs
  re-checking against the new count.
- `src/render/coords.js` — order-generic (100/order); **no change required**.
- CLI validation and --help; JSDoc types; README.
- `test/data/kamea.test.js` — home for the new invariant tests.

## Design decisions

Provenance of the decisions themselves matters as much as provenance of the grids,
so each is marked with who actually settled it.

**Confirmed by Matt this session (locked — do not revisit):**

1. The three are **first-class**: `--planet uranus` works like any other planet.
   No gating flag, no separate kamea set.
2. The traditional/non-traditional distinction is carried by a `traditional: false`
   field in the data — not by gating and not by a separate kamea set.
3. The enumeration surface separates them: "Classical: saturn jupiter mars sun
   venus mercury moon" / "Modern: uranus neptune pluto (non-traditional)".

4. **`attestation` applies to the three non-traditional planets only.** No classical
   planet carries it. Proposed by Claude — because `traditional: false` alone cannot
   distinguish Uranus and Pluto, which two independent sources agree on, from
   Neptune, which rests on a single derivation contradicting the only printed
   source — and then confirmed by Matt, who additionally ruled out tagging mercury.
   `attestation` answers "how do we know this non-traditional grid is right", a
   question that only arises where no traditional source answers it. Mercury's
   divergence from the book belongs in the citation prose, which can be accurate
   about it in full sentences; a one-word enum cannot.

5. **Neptune ships**, labelled `derived`, with the divergence from the printed book
   recorded at the point of divergence. Confirmed by Matt after being shown that
   Uranus and Pluto each have two independent confirmations while Neptune has one
   derivation and a printed source that disagrees with it.

**Follows from the existing published contract (not a new decision):**

6. Purely additive — output for the existing seven is byte-identical, so the
   determinism contract holds and existing snapshots must not change.
