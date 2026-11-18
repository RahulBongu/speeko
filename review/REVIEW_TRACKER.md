# Speeko — Native-speaker review tracker

Generated from `review/review-package.json` (305 items, 10 locales). Update as reviews arrive. Status: `pending` until a reviewer returns a completed CSV with at least one decided item.

| Locale | Label | Items | Kinds | Reviewer | Status | Decided | Notes |
| --- | --- | ---: | --- | --- | --- | ---: | --- |
| bn | Bengali | 23 | chooseMeaning 16, typeTranslation 4, matchPairs 2, listenChoose 1 | (unassigned) | pending | 0 | 1 item blocked on missing audio |
| gu | Gujarati | 23 | chooseMeaning 16, typeTranslation 4, matchPairs 2, listenChoose 1 | (unassigned) | pending | 0 | 1 item blocked on missing audio |
| hi | Hindi | 98 | chooseMeaning 66, typeTranslation 29, matchPairs 2, listenChoose 1 | (unassigned) | pending | 0 | 75 items with transliteration; 2 flagged needs_further_review |
| kn | Kannada | 23 | chooseMeaning 16, typeTranslation 4, matchPairs 2, listenChoose 1 | (unassigned) | pending | 0 | 1 item blocked on missing audio |
| ml | Malayalam | 23 | chooseMeaning 16, typeTranslation 4, matchPairs 2, listenChoose 1 | (unassigned) | pending | 0 | 1 item blocked on missing audio |
| mr | Marathi | 23 | chooseMeaning 16, typeTranslation 4, matchPairs 2, listenChoose 1 | (unassigned) | pending | 0 | 1 item blocked on missing audio |
| or | Odia | 23 | chooseMeaning 16, typeTranslation 4, matchPairs 2, listenChoose 1 | (unassigned) | pending | 0 | 1 item blocked on missing audio |
| pa | Punjabi | 23 | chooseMeaning 16, typeTranslation 4, matchPairs 2, listenChoose 1 | (unassigned) | pending | 0 | 1 item blocked on missing audio |
| ta | Tamil | 23 | chooseMeaning 16, typeTranslation 4, matchPairs 2, listenChoose 1 | (unassigned) | pending | 0 | 1 item blocked on missing audio |
| te | Telugu | 23 | chooseMeaning 16, typeTranslation 4, matchPairs 2, listenChoose 1 | (unassigned) | pending | 0 | 1 item blocked on missing audio |
| **Total** | | **305** | | | **0/10 complete** | **0** | |

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
