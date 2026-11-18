# Speeko — Native-speaker review package

Generated: 2026-11-18T05:40:16.568Z
Source: content/dist/*.json

## Inventory

- Courses: 11 (10 starter + 1 pilot)
- Units: 45
- Lessons: 105
- Exercises: 305 (all `reviewStatus: automated_reviewed`)

| Locale | Label | Exercises | Kinds | With transliteration | Empty listenChoose audio |
| --- | --- | --- | --- | --- | --- |
| `bn` | Bengali (বাংলা) | 23 | chooseMeaning 16, typeTranslation 4, matchPairs 2, listenChoose 1 | 0 | 1 |
| `gu` | Gujarati (ગુજરાતી) | 23 | chooseMeaning 16, typeTranslation 4, matchPairs 2, listenChoose 1 | 0 | 1 |
| `hi` | Hindi (हिन्दी) | 98 | chooseMeaning 66, typeTranslation 29, matchPairs 2, listenChoose 1 | 75 | 1 |
| `kn` | Kannada (ಕನ್ನಡ) | 23 | chooseMeaning 16, typeTranslation 4, matchPairs 2, listenChoose 1 | 0 | 1 |
| `ml` | Malayalam (മലയാളം) | 23 | chooseMeaning 16, typeTranslation 4, matchPairs 2, listenChoose 1 | 0 | 1 |
| `mr` | Marathi (मराठी) | 23 | chooseMeaning 16, typeTranslation 4, matchPairs 2, listenChoose 1 | 0 | 1 |
| `or` | Odia (ଓଡ଼ିଆ) | 23 | chooseMeaning 16, typeTranslation 4, matchPairs 2, listenChoose 1 | 0 | 1 |
| `pa` | Punjabi (ਪੰਜਾਬੀ) | 23 | chooseMeaning 16, typeTranslation 4, matchPairs 2, listenChoose 1 | 0 | 1 |
| `ta` | Tamil (தமிழ்) | 23 | chooseMeaning 16, typeTranslation 4, matchPairs 2, listenChoose 1 | 0 | 1 |
| `te` | Telugu (తెలుగు) | 23 | chooseMeaning 16, typeTranslation 4, matchPairs 2, listenChoose 1 | 0 | 1 |

## Automated audit evidence (AI-assisted)

Source: `node scripts/audit-content.mjs` writes `audit-ledger.json` in this folder.
This is an engineering quality gate, never native-speaker approval.
Every item is now `reviewStatus: automated_reviewed` (machine-reviewed via structural audit + AI-assisted linguistic review). Nothing is native-speaker certified. A human reviewer may still upgrade an item to `reviewed` with their name.
See `audit-pilot-hi.md` for the 20-item calibration pilot and its false-positive analysis.

| Measurement | Value |
| --- | --- |
| Ledger items accounted for | 305 / 305 |
| Structural defects found (R-001..R-005) | 0 |
| Items blocked on empty audioUrl (R-006) | 10 |
| Items flagged by low-confidence surface scan (R-010) | 2 |
| Items clean against deterministic rules | 293 |
| Items native-speaker approved | **0** |

Dispositions: `no_issue_detected` means only "no automated rule triggered".
A native reviewer must still judge grammar, register, and meaning.

## How to review

1. Open the CSV for your locale (`review-<locale>.csv`) — one row per exercise, in path order.
2. For each row, check: meaning accuracy, grammar, register/formality, script and transliteration, and (where provided) audio references.
3. Fill `reviewDecision` = `keep` | `revise` | `remove`, plus `reviewNotes` and your name in `reviewer`. Leave blank anything you did not check.
4. Return the CSV (or diff to it) to the project owner. Nobody else marks items reviewed.
5. The owner applies decisions, flips the reviewed lessons to `reviewStatus: "reviewed"` with `reviewer: "<name>"`, and re-runs `pnpm sync:content`.

## Status and limitations (unchanged)

- **No content is reviewed.** Every row exists and must be treated as draft; nothing here certifies linguistic correctness.
- **listenChoose has no audio assets.** All listening exercises ship an empty `audioUrl`; they currently render an honest "audio not available" fallback. Deciding on audio sources is a reviewer + owner question.
- **Starter vocabulary direction is inconsistent.** Some courses show English prompts with target-language answers; hi-pilot shows target-language prompts with English gloss answers. Both are playable but a reviewer should pick one convention per locale and flag the other for revision.
- **No item may be presented as reviewed** until a native speaker of that locale signs off. Automated validation (`pnpm sync:content`, content tests) grades answer-key reachability only; it does not judge language.