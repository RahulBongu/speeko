# Language content review — 10 starter courses and the Hindi pilot (2026-11-19)

Purpose: judge the shipped starter curricula on accuracy, coverage, structure,
English-keyboard usability, romanization consistency, and the known audio and
review limitations before the next content or polish pass.

## Totals (from `content/dist`, 11 bundles)

| Scope | Units | Lessons | Exercises | Exercise mix |
| --- | ---: | ---: | ---: | --- |
| 10 starters | 40 | 80 | 240 | chooseMeaning 171, typeTranslation 40, matchPairs 20, listenChoose 9 |
| Hindi pilot | 5 | 25 | 75 | chooseMeaning 50, typeTranslation 25 |
| **Total** | **45** | **105** | **315** | **chooseMeaning 221, typeTranslation 65, matchPairs 20, listenChoose 9** |

Each starter course: 4 units x 2 lessons, 24 exercises.

Starter balance after the 2026-11-19 fix: the former "Six to Eight" lesson now
teaches Six, Seven and Eight (the missing word, with a stored romanization for
the new item). Odia has one more `chooseMeaning` than the other starters
because its audio item was previously converted to a reading choice; the Odia
"Good morning" item is now a reverse-direction choice (prompt in script, English
options) rather than a second identical copy of the first.

## Quality judgment

### What is good

- **Accuracy is strong for the taught material.** Manual review of every starter
  exercise (fresh dump, `review/dump-content.txt`-style extract built with the
  built course bundle) found the scripts, answers and expected readings
  consistent with standard A1 vocabulary for all ten languages. The
  deterministic audit is clean except for two human-only flags.
- **English-keyboard use works.** Starters need no native-script keyboard.
  Typing exercises accept the native script or an English spelling. The shared
  typing check accepts even common variants such as `school` for स्कूल,
  `station` for स्टेशन and doubled consonants such as `atth` for ਅੱਠ.
- **Hindi pilot is coherent.** The pilot covers greetings, numbers 1-5 and family
  words in three-exercise lessons. It deliberately has 75 production-style
  exercises and no audio; the docs already frame it as a draft with no
  certification.
- **Known review status is honest.** Every course ships `automated_reviewed`,
  and the audit ledger says native certification has not happened. The two Hindi
  "Sorry" spellings are intentionally preserved variants and are flagged for
  human judgment, not silently changed.

### Limitations that matter

1. **Audio is thin on the path.** Only 9 `listenChoose` starter items have
   synthetic audio (8 edge-tts, 1 gTTS). One Odia item was converted from
   listening to a reverse-direction choice when no Odia voice was available. The
   other items are not in the audio workflow.
2. **Starters are thin, not richer.** A lesson is mostly isolated vocabulary —
   `chooseMeaning`, sometimes `typeTranslation`, `matchPairs` or one
   `listenChoose`. There are no sentences, phrases in context, or listening items
   beyond the single `listenChoose` per course. The Hindi pilot has no audio
   either.
3. **Identical templates.** The ten starter courses share the same exercise mix,
   and the data shows the structure was built first and translations were filled
   in later. This is normal for draft A1 content, but it caps the "lively" goal.
4. **Stored transliterations are sparse.** Only `hi-pilot` ships 75 stored
   `transliteration` fields; the starters have one each (the new "Eight" item).
   This is acceptable because the runtime romanizer covers the gap, but reviewers
   cannot see the accepted reading in the data itself for the starters.
5. **No native certification yet.** Some Hindi pilot items read like arbitrary
   English loanwords ("School", "Station"), and the audit is only automated. A
   native pass is the remaining quality gate, per the review status contract.

## Romanization quality (2026-11-19 fixes)

The romanizer now has practical spellings and a small alias table:

- **Dravidian scripts:** Malayalam word-final virama reads as `onnu`, `rantu`,
  `moonnu`, `naalu`, `anchu`, `aaru`, `elu`, `ettu`, `ompatu`, `pattu` instead of
  dropping the final vowel; Telugu and Kannada assimilate nasal marks before
  consonants (`rendu`, `kshaminchandi`, `ondu`, `entu`, `ombattu`); Dravidian
  words keep their final vowels (`illa`, `kannada`).
- **Odia ୟ:** now read correctly (`dayaakari`, `dhanyabaad`) instead of being
  dropped.
- **Aliases and spelling variants:** common English spellings and doubled
  consonants are folded before comparison (`school` → `skool`, `station` →
  `steshan`, `kripya` → `kripaya`, `behen` → `bahan`, `alvida` → `alavida`,
  `kijiye` → `kijie`, `chai` → `chay`, `atth` → `ath`).
- **Coverage:** every stored `transliteration` in the starters and pilot is
  accepted by the shared grader, and every romanized typing answer produced by
  the runtime hint is accepted (checked across all 65 typed exercises; zero
  failures).

Remaining awkwardness is minor and lossy on purpose: practical readings such as
`chaawal`, `sadak`, `sree akaal`, and `aath` are simple and usable, and the
grader accepts alternative Latin spellings within the documented fold rules.

## Recommended next steps for content

1. **Add audio for the starter path.** Regenerate synthetic clips for the
   remaining learner-facing listening items or convert more `listenChoose` to
   practice items where live speech is available.
2. **Add one listener-oriented lesson per starter.** Either add synthesis clips
   for the current lesson items or define an explicit "listening via speech
   synthesis" path standard.
3. **Add context sentences** to the four starter lessons (greetings, thanks,
   yes/no, numbers) — this is the biggest "richer exercises" win.
4. **Continue native review.** The Linguistic-review CSV/checklist is ready for
   the two Hindi "Sorry" merge issues; reviewers should also weigh the length of
   the pilot.

## Generated artifacts this review relies on

- `review/audit-ledger.json` — 315 items, 0 blocked audio, 2 R-010 items.
- `review/REVIEW.md` — 315 items, all `reviewStatus: draft`.
- `review/REVIEW_TRACKER.md` — starter totals of 24 per locale; the note for Odia
  says its former audio item became a reverse-direction choice.

Before the 2026-11-19 "Eight" additions, the dist had 305 exercises; the gap is
entirely the ten added items (one per starter).
