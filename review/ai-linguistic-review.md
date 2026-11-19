# Speeko - AI-assisted linguistic review (305 items) - 2026-11-16

> Historical 2026-11-16 pass; it covered 305 items and does not include the ten "Eight" items added on 2026-11-19. It is not native-speaker review; every item remains `reviewStatus: automated_reviewed`.

**This is not native-speaker review.** Nothing here is certified or approved.
Both passes ran on the same model; they are not statistically independent.
Every item remains `reviewStatus: automated_reviewed` (not human-certified) in the built package.

## What was checked

- Meaning: does each target expression convey the English source meaning as far as
  this reviewer can judge? (item by item over every exercise)
- Grammar and morphology: plausible standard-form construction for each language.
- Naturalness: attested expressions; no obvious word-for-word generation artifacts.
- Orthography: script block, nuktas, diacritics, spacing.
- Transliteration: hi-pilot romanizations are internally consistent; no other
  items carry romanizations (starters do not), so there was nothing to cross-check.
- Vocabulary: register matches the English source (`hello` as greeting, etc.).
- Ambiguity: single intended answer per item; no accidental dual-valid options.
- Exercise correctness: prompt/options/key/lesson agree; matchPairs splittable.
- Pedagogy: topics are beginner-appropriate and scoped; nothing misleading.
- Consistency: reused vocab spelled identically across exercises, plus two
  documented cross-course spellings of "Sorry" in Hindi (preserved).

## Actual findings

| Area | Count | Disposition |
| --- | --- | --- |
| Corrected in source: Tamil vowel ಐ (U+0B90) used in the Kannada word for five ("ಐದು") | 3 items: kn-starter-u2-l1-e2 (options[2]), kn-starter-u2-l2-e1 (options[1]), kn-starter-u2-l2-e2 (key) | correction_applied (rebuilt, regression-checked) |
| Cross-course spelling spread of "Sorry" (preserved both spellings) | 2 items: hi-starter-u3-l1-e2, hi-pilot-u1-l4-e1 | needs_further_review |
| listenChoose with empty audioUrl (missing licensed audio) | 10 items (R-006, carried over from the deterministic audit) | blocked |
| Items with no findings under any rule in this pass | 300 items | no_issue_detected (still unreviewed by humans) |

## What was NOT corrected and why

- Both spellings of "sorry" (माफ़ कीजिये vs maaf-kanji): both attested; unifying
  would silently pick a dialect/standard for the course. Preserved for a Hindi
  reviewer. No text was changed.
- The hi-pilot transliterations (namaste, dhanyavaad, kripya, maaf kijiye,
  alvida, ek, do, teen, chaar, paanch, maa, pita, bhai, behen, bachcha,
  paani, chai, chaawal, roti, doodh, ghar, school, bazaar, station,
  sadak): internally consistent informal romanization style; consistent
  enough for a learner UI; not verified by a native speaker, so no
  claims of correctness are made.
- Transliteration absence in hi-starter: proposal only, no content authored.

## Per-locale confidence

hi / mr / bn: medium-high (very standard high-frequency items).
gu / ta / te / kn / ml / or / pa: medium (high coverage of basic vocabulary;
exact regional conventions not verified by a native speaker).
Every locale above is still `reviewStatus: draft` and must be signed off by a
native speaker before any "reviewed" claim.

Reproduce: `node scripts/ai-review-content.mjs && node scripts/audit-content.mjs`
