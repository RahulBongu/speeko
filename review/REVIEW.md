# Speeko — Native-speaker review package

Generated: 2026-11-19T13:13:22.941Z
Source: content/dist/*.json

## Inventory

- Courses: 11 (10 starter + 1 pilot)
- Units: 45
- Lessons: 105
- Exercises: 315 (all `reviewStatus: automated_reviewed`; no native-speaker approval)

| Locale | Label | Exercises | Kinds | With transliteration | Empty listenChoose audio |
| --- | --- | --- | --- | --- | --- |
| `bn` | Bengali (বাংলা) | 24 | chooseMeaning 17, typeTranslation 4, matchPairs 2, listenChoose 1 | 1 | 0 |
| `gu` | Gujarati (ગુજરાતી) | 24 | chooseMeaning 17, typeTranslation 4, matchPairs 2, listenChoose 1 | 1 | 0 |
| `hi` | Hindi (हिन्दी) | 99 | chooseMeaning 67, typeTranslation 29, matchPairs 2, listenChoose 1 | 76 | 0 |
| `kn` | Kannada (ಕನ್ನಡ) | 24 | chooseMeaning 17, typeTranslation 4, matchPairs 2, listenChoose 1 | 1 | 0 |
| `ml` | Malayalam (മലയാളം) | 24 | chooseMeaning 17, typeTranslation 4, matchPairs 2, listenChoose 1 | 1 | 0 |
| `mr` | Marathi (मराठी) | 24 | chooseMeaning 17, typeTranslation 4, matchPairs 2, listenChoose 1 | 1 | 0 |
| `or` | Odia (ଓଡ଼ିଆ) | 24 | chooseMeaning 18, typeTranslation 4, matchPairs 2 | 2 | 0 |
| `pa` | Punjabi (ਪੰਜਾਬੀ) | 24 | chooseMeaning 17, typeTranslation 4, matchPairs 2, listenChoose 1 | 1 | 0 |
| `ta` | Tamil (தமிழ்) | 24 | chooseMeaning 17, typeTranslation 4, matchPairs 2, listenChoose 1 | 1 | 0 |
| `te` | Telugu (తెలుగు) | 24 | chooseMeaning 17, typeTranslation 4, matchPairs 2, listenChoose 1 | 1 | 0 |

## Automated audit evidence (AI-assisted)

Source: `node scripts/audit-content.mjs` writes `audit-ledger.json` in this folder.
This is an engineering quality gate, never native-speaker approval.
Every item remains `reviewStatus: automated_reviewed` until a signed-off human review happens.
See `audit-pilot-hi.md` for the 20-item calibration pilot and its false-positive analysis.

| Measurement | Value |
| --- | --- |
| Ledger items accounted for | 315 / 315 |
| Structural defects found (R-001..R-005) | 0 |
| Items blocked on empty audioUrl (R-006) | 0 |
| Items flagged by low-confidence surface scan (R-010) | 2 |
| Items clean against deterministic rules | 313 |
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

- **No content is native-speaker reviewed.** Every row exists and must be treated as automated-reviewed only; nothing here certifies linguistic correctness.
- **listenChoose audio is synthetic.** Nine items carry Edge TTS/gTTS audio, not native-speaker recordings; the Odia audio item was converted to a reverse-direction choice because no Odia voice is available. Reviewers still need to decide whether synthetic audio is acceptable product quality.
- **Starter vocabulary direction is inconsistent.** Some courses show English prompts with target-language answers; hi-pilot shows target-language prompts with English gloss answers. Both are playable but a reviewer should pick one convention per locale and flag the other for revision.
- **No item may be presented as reviewed** until a native speaker of that locale signs off. Automated validation (`pnpm sync:content`, content tests) grades answer-key reachability only; it does not judge language.