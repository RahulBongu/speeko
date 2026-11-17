# Speeko — AI-assisted audit pilot (hi) — 2026-11-16

**This is not native-speaker review.** Nothing here is approved. It is an
internal calibration run of the deterministic audit rules plus surface-level
AI-assisted observations on a representative Hindi pilot.

## Pilot selection (20 items, kind-balanced, both courses)

`hi-starter`: `hi-starter-u1-l1-e1`, `hi-starter-u1-l2-e3` (matchPairs),
`hi-starter-u2-l1-e3`, `hi-starter-u2-l2-e1`, `hi-starter-u3-l1-e3`,
`hi-starter-u3-l2-e1`, `hi-starter-u3-l2-e3` (listenChoose),
`hi-starter-u4-l1-e3`.

`hi-pilot`: `hi-pilot-u1-l1-e1`, `hi-pilot-u1-l1-e2`, `hi-pilot-u1-l1-e3`,
`hi-pilot-u1-l2-e3`, `hi-pilot-u1-l4-e1`, `hi-pilot-u1-l4-e2`,
`hi-pilot-u1-l4-e3`, `hi-pilot-u2-l2-e2`, `hi-pilot-u2-l2-e3`,
`hi-pilot-u3-l1-e2`, `hi-pilot-u4-l1-e2`, `hi-pilot-u5-l1-e1`.

Selection covers chooseMeaning (12), typeTranslation (6), matchPairs (1),
listenChoose (1) — every kind present in the curriculum — and both
exercise directions in hi-pilot (`hi-pilot-u1-l1-e1` = EN→HI, `-e2` = HI→EN).

## Commands actually run

```
node scripts/audit-content.mjs
node C:\Users\rahul\AppData\Local\Temp\opencode\pilot-hi.mjs
node C:\Users\rahul\AppData\Local\Temp\opencode\scan-01.mjs .. scan-05.mjs (calibration)
node C:\Users\rahul\AppData\Local\Temp\opencode\crosscheck.mjs
```

## Pilot outcomes (verbatim from the ledger)

| Bucket | Count | Items |
|---|---|---|
| no_issue_detected (deterministic rules pass) | 18 | everything except the two below |
| `blocked` (R-006, empty `audioUrl`) | 1 | `hi-starter-u3-l2-e3` |
| `needs_further_review` (R-010, low confidence) | 1 | `hi-pilot-u1-l4-e1` |

Full ledger: `review/audit-ledger.json` — 305 items; 293 clean, 10 blocked on
`audioUrl`, 2 flagged by R-010.

## Calibration notes and false-positive analysis

- **R-001..R-005 found zero defects**, matching the manual scans run during
  discovery (schema bounds, duplicates, NFC, invisible characters). No
  false positives were produced by these rules; no false negatives are
  claimed either — several defect classes (word choice, grammar, register)
  are intentionally not checked.
- **R-010** fired on exactly the two items that teach
  "Sorry" with two different spellings across the same locale:
  `hi-starter-u3-l1-e2` = "माफ़ कीजिये" vs `hi-pilot-u1-l4-e1` = "माफ कीजिए".
  Both forms are attested Devanagari spellings for "please excuse (me)".
  This is exactly the class of thing R-010 is designed to surface for a
  reviewer — not to decide.
- **R-006** (10 items, one per starter, id `*-u3-l2-e3`) blocks on licensed
  audio. No placeholder was introduced; nothing was marked available.
- **No item was auto-corrected.** Every "flag" is a hypothesis for a human
  reviewer of Hindi.

## What the audit does NOT check (recorded limits)

- Grammar, word order, register, and homograph selection within Hindi text.
- Transliteration accuracy of hi-pilot items (`namaste`, `dhanyavaad`,
  `maaf kijiye`, `maa`, `paani`, `ghar`) — all plausible, none verified by
  a native speaker.
- Whether the lesson teaches Devanagari pronunciation policy or a regional
  standard.
- Audio quality/existence for listenChoose items (all blocked, R-006).

## Proposals pending a Hindi reviewer (applied: none)

1. **Unify the "Sorry" spelling.** Actual content: `hi-starter-u3-l1-e2` uses
   `माफ़ कीजिये`; `hi-pilot-u1-l4-e1` (and `-e2`, `-e3`) uses `माफ कीजिए`.
   Proposal: pick one form (recommended: nukta `माफ़` + standard imperative
   `कीजिए`, i.e. `माफ़ कीजिए`) and unify across both courses; do not change
   without a Hindi reviewer signing off.
2. **Keep empty `listenChoose` or exclude it.** Product choice: either record
   licensed audio, or hide `listenChoose` from starters until it exists. The
   current tree hides it at play time (`eligibleExercises()`, D71) without
   deleting the record. Never fake the asset.
3. **Missing transliteration in hi-starter.** 23 exercises carry no
   `transliteration`; hi-pilot has them for all 75. Native reviewers should
   supply romanized forms before any promoted use.

## Verdict

18 of 20 items show nothing detectable by the deterministic rules; two items
carry findings: `hi-starter-u3-l2-e3` (blocked — no licensed audio for
`listenChoose`) and `hi-pilot-u1-l4-e1` (needs_further_review — cross-course
spelling spread of "Sorry"). **No correction was applied to source content.**
Zero native-speaker approval exists in this pilot.
