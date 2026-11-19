# Speeko — Native-speaker review tracker

Generated from `review/review-package.json` (315 items, 10 locales). Update as reviews arrive. Status: `pending` until a reviewer returns a completed CSV with at least one decided item.

| Locale | Label | Items | Kinds | Reviewer | Status | Decided | Notes |
| --- | --- | ---: | --- | --- | --- | ---: | --- |
| bn | Bengali | 24 | chooseMeaning 17, typeTranslation 4, matchPairs 2, listenChoose 1 | (unassigned) | pending | 0 | 1 transliteration; runtime romanization also available |
| gu | Gujarati | 24 | chooseMeaning 17, typeTranslation 4, matchPairs 2, listenChoose 1 | (unassigned) | pending | 0 | 1 transliteration; runtime romanization also available |
| hi | Hindi | 99 | chooseMeaning 67, typeTranslation 29, matchPairs 2, listenChoose 1 | (unassigned) | pending | 0 | 76 transliterations; 2 flagged needs_further_review (R-010) |
| kn | Kannada | 24 | chooseMeaning 17, typeTranslation 4, matchPairs 2, listenChoose 1 | (unassigned) | pending | 0 | 1 transliteration; runtime romanization also available |
| ml | Malayalam | 24 | chooseMeaning 17, typeTranslation 4, matchPairs 2, listenChoose 1 | (unassigned) | pending | 0 | 1 transliteration; runtime romanization also available |
| mr | Marathi | 24 | chooseMeaning 17, typeTranslation 4, matchPairs 2, listenChoose 1 | (unassigned) | pending | 0 | 1 transliteration; runtime romanization also available |
| or | Odia | 24 | chooseMeaning 18, typeTranslation 4, matchPairs 2 | (unassigned) | pending | 0 | 1 transliteration; the audio-converted item is now a reverse-direction choice |
| pa | Punjabi | 24 | chooseMeaning 17, typeTranslation 4, matchPairs 2, listenChoose 1 | (unassigned) | pending | 0 | 1 transliteration; runtime romanization also available |
| ta | Tamil | 24 | chooseMeaning 17, typeTranslation 4, matchPairs 2, listenChoose 1 | (unassigned) | pending | 0 | 1 transliteration; runtime romanization also available |
| te | Telugu | 24 | chooseMeaning 17, typeTranslation 4, matchPairs 2, listenChoose 1 | (unassigned) | pending | 0 | 1 transliteration; runtime romanization also available |
| **Total** | | **315** | | | **0/10 complete** | **0** | |

## How to update this tracker

1. When a reviewer returns a completed CSV, run `node scripts/import-review.mjs`.
2. Update the **Reviewer**, **Status**, and **Decided** columns above.
3. Status values: `pending` → `in review` → `complete` → `imported`.
4. A locale is `complete` only when every item has a non-blank `reviewDecision` and `reviewer`.
5. `Decided` = number of rows with a valid decision and reviewer (per import-review output).

## Import validation

`node scripts/import-review.mjs` validates returned CSVs against the current
`review-package.json`: unknown IDs, invalid decisions, missing reviewers, and
missing rows are reported. Run it before applying any decisions.
