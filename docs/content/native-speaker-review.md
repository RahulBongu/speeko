# Speeko — native-speaker content review packet

**Status: NOT REVIEWED BY A NATIVE SPEAKER.** This packet was generated mechanically from the shipped course JSON so a qualified human reviewer can do the work. Nothing in this file is a claim of linguistic correctness, and no review result has been recorded.

## Why this exists

The course files in `content/dist/` carry `reviewStatus: "automated_reviewed"`. That label means structural/automated validation only (schema, answer-index bounds, audio reference presence, uniqueness). It does **not** mean a native speaker checked script accuracy, naturalness, pronunciation or translation quality. The source files in `content/<locale>/` are marked `draft`. To claim native-speaker review, a human must complete the tables below and the result must be recorded in content metadata by the owner.

## Scope generated from source

- 11 starter courses, 107 lessons, 321 exercises.
- 9 exercises reference bundled listening audio; the remaining exercises are text only.
- Exercise kinds present: chooseMeaning (225), typeTranslation (67), matchPairs (20), listenChoose (9).
- Structural validation on 2026-11-24: all 321 exercise IDs are unique; 10 distinct locales (bn, gu, hi, kn, ml, mr, or, pa, ta, te) across 11 course entries and 107 lessons; every required field, answer key, option set and bundled audio reference resolves; 0 structural problems found. Structural validity is **not** linguistic approval.
- Original script is shown verbatim from the course JSON. **Transliteration is not present in the source data** — a transliteration column is provided only as a blank field for the reviewer to supply if the product later wants it. Do not treat an empty cell as "correct".

## Course inventory

| Code | Language | File | Lessons | Exercises | Audio items | reviewStatus |
|---|---|---|---:|---:|---:|---|
| bn | Bengali | `content/dist/bn-starter.json` | 8 | 24 | 1 | automated_reviewed |
| gu | Gujarati | `content/dist/gu-starter.json` | 8 | 24 | 1 | automated_reviewed |
| hi-pilot | Hindi (pilot course) | `content/dist/hi-pilot.json` | 25 | 75 | 0 | automated_reviewed |
| hi | Hindi | `content/dist/hi-starter.json` | 10 | 30 | 1 | automated_reviewed |
| kn | Kannada | `content/dist/kn-starter.json` | 8 | 24 | 1 | automated_reviewed |
| ml | Malayalam | `content/dist/ml-starter.json` | 8 | 24 | 1 | automated_reviewed |
| mr | Marathi | `content/dist/mr-starter.json` | 8 | 24 | 1 | automated_reviewed |
| or | Odia | `content/dist/or-starter.json` | 8 | 24 | 0 | automated_reviewed |
| pa | Punjabi | `content/dist/pa-starter.json` | 8 | 24 | 1 | automated_reviewed |
| ta | Tamil | `content/dist/ta-starter.json` | 8 | 24 | 1 | automated_reviewed |
| te | Telugu | `content/dist/te-starter.json` | 8 | 24 | 1 | automated_reviewed |

## Grading behaviour reviewers must keep in mind

Extracted from `packages/core/src/grading.ts` — do not change expected answers without a source-of-truth reason and regression tests.

- Choice exercises (`chooseMeaning`, `listenChoose`, `matchPairs`) grade against `answerIndex` / mismatch count; a wrong option is never accepted.
- `typeTranslation` uses NFC normalization (Indic diacritics and conjuncts are **never** stripped), collapses whitespace/quotes, drops trailing punctuation including danda `।`/`॥`, lowercases, accepts a documented romanized Latin reading, and allows a one-character typo only when the answer is at least 4 characters and `acceptTypos` is set.
- `typeWhatYouHear` uses the same normalization but disables typo tolerance.
- `matchPairs` is correct only with zero mismatches; word-bank/arrange tasks require the canonical token order.
- The server regrades every attempt against this authoritative content; client-supplied correctness is never trusted.

## Audio / pronunciation source

- Listening audio files ship locally at `apps/web/public/courses/audio/<exercise-id>.mp3`, `apps/mobile/assets/audio/<exercise-id>.mp3` and `content/audio/<exercise-id>.mp3`. All 9 `audioUrl` references were checked and resolve to an existing file in both apps.
- The audio is bundled/pre-recorded; **no TTS voice, speaker identity, recording date or studio source is documented in the repository**. A reviewer must assess pronunciation from the file itself and flag anything unclear in the Notes column.
- Mascot reaction audio (`apps/{web,mobile}/.../mascot/*.mp3`) is separate from lesson content and is out of scope for linguistic review.

## Reviewer guide

1. **Qualification.** Work only in languages you read and speak natively or at professional proficiency, plus English. Record a reviewer alias and qualification level in the header fields; never include private contact details.
2. **Assignment.** Each section is one locale. Assign whole locale sections to one qualified reviewer where possible; do not split a locale across reviewers unless necessary. Record the reviewer alias per row.
3. **Checks per row.**
   - `Script`: spelling, diacritics/matras, conjuncts, script correctness, no mojibake or replacement characters.
   - `Meaning`: the English prompt and the target answer actually correspond; distractors are plausible but unambiguously wrong; answer key index/expected value is correct.
   - `Natural`: idiomatic and natural for a learner at the stated A1 level; not a word-for-word calque.
   - `Cultural`: appropriate register, no regional form presented as the only correct answer unless the course explicitly teaches that variety.
   - `Audio`: for `listenChoose` rows only, listen to the bundled MP3 and confirm the pronunciation matches the displayed correct option.
4. **Regional variation.** If more than one form is valid, do not silently approve one as exclusive. Mark severity `medium`, add the alternatives in `Suggested correction`, and escalate for a product decision about accepted answers.
5. **Severity.** `critical` = wrong meaning, offensive/inappropriate content, or unusable audio; `medium` = wrong/nonstandard spelling, unnatural phrasing, ambiguous distractor, regionally exclusive answer; `low` = style, punctuation, capitalization preference.
6. **Disposition.** `APPROVE` = correct as-is; `CORRECT` = a bounded fix is proposed in `Suggested correction`; `REJECT` = the item should be replaced; `ABSTAIN` = insufficient expertise or context, escalate to another reviewer. Blank means not yet reviewed.
7. **Status.** `pending` → `in_review` → `approved` / `corrected` / `rejected` / `escalated`. A row is not approved until every applicable check is filled and the disposition is recorded.
8. **Corrections and approvals.** Never edit the course JSON yourself. Write proposed corrections in the row and return a signed/versioned copy. The owner applies changes, re-runs `pnpm sync:content`, records a dated `reviewStatus`, and archives the signed review artifact.
9. **No fabrication.** Do not invent reviewer names, approvals, sources, or audio. If a source/pronunciation cannot be verified, set `ABSTAIN` and explain.

## Decision and status legend

Disposition: `APPROVE` · `CORRECT` · `REJECT` · `ABSTAIN` (blank = not reviewed). Status: `pending` · `in_review` · `approved` · `corrected` · `rejected` · `escalated`.

---

## Bengali (`bn`) — বাংলা — Starter

Starter course for বাংলা (Tier 1: greetings, numbers, essentials).

### Unit 1: Greetings

#### Lesson: Hello & Thanks (`bn-starter-u1-l1`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| bn | `bn-starter-u1-l1-e1` | chooseMeaning | Hello | হ্যালো / ধন্যবাদ / হ্যাঁ / না |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| bn | `bn-starter-u1-l1-e2` | chooseMeaning | Thank you | ধন্যবাদ / হ্যালো / অনুগ্রহ করে / দুঃখিত |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| bn | `bn-starter-u1-l1-e3` | typeTranslation | Type "hello" | হ্যালো |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### Lesson: Yes & No (`bn-starter-u1-l2`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| bn | `bn-starter-u1-l2-e1` | chooseMeaning | Yes | হ্যাঁ / না / অনুগ্রহ করে / দুঃখিত |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| bn | `bn-starter-u1-l2-e2` | chooseMeaning | No | না / হ্যাঁ / ধন্যবাদ / হ্যালো |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| bn | `bn-starter-u1-l2-e3` | matchPairs | Match the pairs | — |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

### Unit 2: Numbers

#### Lesson: Numbers 1-3 (`bn-starter-u2-l1`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| bn | `bn-starter-u2-l1-e1` | chooseMeaning | One | এক / দুই / তিন / চার |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| bn | `bn-starter-u2-l1-e2` | chooseMeaning | Two | দুই / এক / পাঁচ / তিন |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| bn | `bn-starter-u2-l1-e3` | chooseMeaning | Three | তিন / দুই / চার / এক |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### Lesson: Numbers 4-5 (`bn-starter-u2-l2`) — 2 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| bn | `bn-starter-u2-l2-e1` | chooseMeaning | Four | চার / পাঁচ / এক / দুই |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| bn | `bn-starter-u2-l2-e2` | chooseMeaning | Five | পাঁচ / চার / তিন / এক |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

### Unit 3: Essentials

#### Lesson: Polite words (`bn-starter-u3-l1`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| bn | `bn-starter-u3-l1-e1` | chooseMeaning | Please | অনুগ্রহ করে / দুঃখিত / হ্যালো / ধন্যবাদ |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| bn | `bn-starter-u3-l1-e2` | chooseMeaning | Sorry | দুঃখিত / অনুগ্রহ করে / হ্যাঁ / না |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| bn | `bn-starter-u3-l1-e3` | typeTranslation | Type "please" | অনুগ্রহ করে |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### Lesson: Good morning (`bn-starter-u3-l2`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| bn | `bn-starter-u3-l2-e1` | chooseMeaning | Good morning | সুপ্রভাত / হ্যালো / ধন্যবাদ / অনুগ্রহ করে |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| bn | `bn-starter-u3-l2-e2` | typeTranslation | Type "good morning" | সুপ্রভাত |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| bn | `bn-starter-u3-l2-e3` | listenChoose | Listen and choose | সুপ্রভাত / হ্যালো / দুঃখিত |  | bn-starter-u3-l2-e3.mp3 |  |  |  |  |  |  |  |  |  |  |  |  |  |

### Unit 4: Beyond Five

#### Lesson: Six to Eight (`bn-starter-u4-l1`) — 4 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| bn | `bn-starter-u4-l1-e1` | chooseMeaning | Six | ছয় / সাত / আট / নয় |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| bn | `bn-starter-u4-l1-e2` | chooseMeaning | Seven | সাত / ছয় / আট / দশ |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| bn | `bn-starter-u4-l1-e4` | chooseMeaning | Eight | আট / ছয় / সাত / নয় |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| bn | `bn-starter-u4-l1-e3` | typeTranslation | Type "six" | ছয় |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### Lesson: Nine & Ten (`bn-starter-u4-l2`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| bn | `bn-starter-u4-l2-e1` | chooseMeaning | Nine | নয় / দশ / ছয় / সাত |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| bn | `bn-starter-u4-l2-e2` | chooseMeaning | Ten | দশ / নয় / আট / ছয় |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| bn | `bn-starter-u4-l2-e3` | matchPairs | Match the pairs | — |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

---

## Gujarati (`gu`) — ગુજરાતી — Starter

Starter course for ગુજરાતી (Tier 1: greetings, numbers, essentials).

### Unit 1: Greetings

#### Lesson: Hello & Thanks (`gu-starter-u1-l1`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| gu | `gu-starter-u1-l1-e1` | chooseMeaning | Hello | નમસ્તે / આભાર / હા / ના |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| gu | `gu-starter-u1-l1-e2` | chooseMeaning | Thank you | આભાર / નમસ્તે / કૃપા કરીને / માફ કરો |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| gu | `gu-starter-u1-l1-e3` | typeTranslation | Type "hello" | નમસ્તે |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### Lesson: Yes & No (`gu-starter-u1-l2`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| gu | `gu-starter-u1-l2-e1` | chooseMeaning | Yes | હા / ના / કૃપા કરીને / માફ કરો |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| gu | `gu-starter-u1-l2-e2` | chooseMeaning | No | ના / હા / આભાર / નમસ્તે |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| gu | `gu-starter-u1-l2-e3` | matchPairs | Match the pairs | — |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

### Unit 2: Numbers

#### Lesson: Numbers 1-3 (`gu-starter-u2-l1`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| gu | `gu-starter-u2-l1-e1` | chooseMeaning | One | એક / બે / ત્રણ / ચાર |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| gu | `gu-starter-u2-l1-e2` | chooseMeaning | Two | બે / એક / પાંચ / ત્રણ |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| gu | `gu-starter-u2-l1-e3` | chooseMeaning | Three | ત્રણ / બે / ચાર / એક |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### Lesson: Numbers 4-5 (`gu-starter-u2-l2`) — 2 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| gu | `gu-starter-u2-l2-e1` | chooseMeaning | Four | ચાર / પાંચ / એક / બે |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| gu | `gu-starter-u2-l2-e2` | chooseMeaning | Five | પાંચ / ચાર / ત્રણ / એક |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

### Unit 3: Essentials

#### Lesson: Polite words (`gu-starter-u3-l1`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| gu | `gu-starter-u3-l1-e1` | chooseMeaning | Please | કૃપા કરીને / માફ કરો / નમસ્તે / આભાર |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| gu | `gu-starter-u3-l1-e2` | chooseMeaning | Sorry | માફ કરો / કૃપા કરીને / હા / ના |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| gu | `gu-starter-u3-l1-e3` | typeTranslation | Type "please" | કૃપા કરીને |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### Lesson: Good morning (`gu-starter-u3-l2`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| gu | `gu-starter-u3-l2-e1` | chooseMeaning | Good morning | સુપ્રભાત / નમસ્તે / આભાર / કૃપા કરીને |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| gu | `gu-starter-u3-l2-e2` | typeTranslation | Type "good morning" | સુપ્રભાત |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| gu | `gu-starter-u3-l2-e3` | listenChoose | Listen and choose | સુપ્રભાત / નમસ્તે / માફ કરો |  | gu-starter-u3-l2-e3.mp3 |  |  |  |  |  |  |  |  |  |  |  |  |  |

### Unit 4: Beyond Five

#### Lesson: Six to Eight (`gu-starter-u4-l1`) — 4 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| gu | `gu-starter-u4-l1-e1` | chooseMeaning | Six | છ / સાત / આઠ / નવ |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| gu | `gu-starter-u4-l1-e2` | chooseMeaning | Seven | સાત / છ / આઠ / દસ |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| gu | `gu-starter-u4-l1-e4` | chooseMeaning | Eight | આઠ / છ / સાત / નવ |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| gu | `gu-starter-u4-l1-e3` | typeTranslation | Type "six" | છ |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### Lesson: Nine & Ten (`gu-starter-u4-l2`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| gu | `gu-starter-u4-l2-e1` | chooseMeaning | Nine | નવ / દસ / છ / સાત |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| gu | `gu-starter-u4-l2-e2` | chooseMeaning | Ten | દસ / નવ / આઠ / છ |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| gu | `gu-starter-u4-l2-e3` | matchPairs | Match the pairs | — |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

---

## Hindi (pilot course) (`hi-pilot`) — Hindi — Pilot (draft)

A draft pilot course used to grow the Hindi path. Not reviewed by a native speaker.

### Unit 1: Greetings

#### Lesson: Hello (`hi-pilot-u1-l1`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| hi | `hi-pilot-u1-l1-e1` | chooseMeaning | Hello | नमस्ते / धन्यवाद / कृपया / माफ कीजिए |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-pilot-u1-l1-e2` | chooseMeaning | नमस्ते | Hello / Thank you / Please / Sorry |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-pilot-u1-l1-e3` | typeTranslation | Type "hello" | नमस्ते |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### Lesson: Thank you (`hi-pilot-u1-l2`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| hi | `hi-pilot-u1-l2-e1` | chooseMeaning | Thank you | धन्यवाद / नमस्ते / कृपया / माफ कीजिए |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-pilot-u1-l2-e2` | chooseMeaning | धन्यवाद | Thank you / Hello / Please / Sorry |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-pilot-u1-l2-e3` | typeTranslation | Type "thank you" | धन्यवाद |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### Lesson: Please (`hi-pilot-u1-l3`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| hi | `hi-pilot-u1-l3-e1` | chooseMeaning | Please | कृपया / नमस्ते / धन्यवाद / माफ कीजिए |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-pilot-u1-l3-e2` | chooseMeaning | कृपया | Please / Hello / Thank you / Sorry |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-pilot-u1-l3-e3` | typeTranslation | Type "please" | कृपया |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### Lesson: Sorry (`hi-pilot-u1-l4`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| hi | `hi-pilot-u1-l4-e1` | chooseMeaning | Sorry | माफ कीजिए / नमस्ते / धन्यवाद / कृपया |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-pilot-u1-l4-e2` | chooseMeaning | माफ कीजिए | Sorry / Hello / Thank you / Please |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-pilot-u1-l4-e3` | typeTranslation | Type "sorry" | माफ कीजिए |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### Lesson: Goodbye (`hi-pilot-u1-l5`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| hi | `hi-pilot-u1-l5-e1` | chooseMeaning | Goodbye | अलविदा / नमस्ते / धन्यवाद / कृपया |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-pilot-u1-l5-e2` | chooseMeaning | अलविदा | Goodbye / Hello / Thank you / Please |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-pilot-u1-l5-e3` | typeTranslation | Type "goodbye" | अलविदा |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

### Unit 2: Numbers

#### Lesson: One (`hi-pilot-u2-l1`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| hi | `hi-pilot-u2-l1-e1` | chooseMeaning | One | एक / दो / तीन / चार |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-pilot-u2-l1-e2` | chooseMeaning | एक | One / Two / Three / Four |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-pilot-u2-l1-e3` | typeTranslation | Type "one" | एक |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### Lesson: Two (`hi-pilot-u2-l2`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| hi | `hi-pilot-u2-l2-e1` | chooseMeaning | Two | दो / एक / तीन / चार |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-pilot-u2-l2-e2` | chooseMeaning | दो | Two / One / Three / Four |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-pilot-u2-l2-e3` | typeTranslation | Type "two" | दो |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### Lesson: Three (`hi-pilot-u2-l3`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| hi | `hi-pilot-u2-l3-e1` | chooseMeaning | Three | तीन / एक / दो / चार |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-pilot-u2-l3-e2` | chooseMeaning | तीन | Three / One / Two / Four |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-pilot-u2-l3-e3` | typeTranslation | Type "three" | तीन |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### Lesson: Four (`hi-pilot-u2-l4`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| hi | `hi-pilot-u2-l4-e1` | chooseMeaning | Four | चार / एक / दो / तीन |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-pilot-u2-l4-e2` | chooseMeaning | चार | Four / One / Two / Three |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-pilot-u2-l4-e3` | typeTranslation | Type "four" | चार |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### Lesson: Five (`hi-pilot-u2-l5`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| hi | `hi-pilot-u2-l5-e1` | chooseMeaning | Five | पाँच / एक / दो / तीन |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-pilot-u2-l5-e2` | chooseMeaning | पाँच | Five / One / Two / Three |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-pilot-u2-l5-e3` | typeTranslation | Type "five" | पाँच |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

### Unit 3: Family

#### Lesson: Mother (`hi-pilot-u3-l1`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| hi | `hi-pilot-u3-l1-e1` | chooseMeaning | Mother | माँ / पिता / भाई / बहन |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-pilot-u3-l1-e2` | chooseMeaning | माँ | Mother / Father / Brother / Sister |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-pilot-u3-l1-e3` | typeTranslation | Type "mother" | माँ |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### Lesson: Father (`hi-pilot-u3-l2`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| hi | `hi-pilot-u3-l2-e1` | chooseMeaning | Father | पिता / माँ / भाई / बहन |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-pilot-u3-l2-e2` | chooseMeaning | पिता | Father / Mother / Brother / Sister |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-pilot-u3-l2-e3` | typeTranslation | Type "father" | पिता |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### Lesson: Brother (`hi-pilot-u3-l3`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| hi | `hi-pilot-u3-l3-e1` | chooseMeaning | Brother | भाई / माँ / पिता / बहन |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-pilot-u3-l3-e2` | chooseMeaning | भाई | Brother / Mother / Father / Sister |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-pilot-u3-l3-e3` | typeTranslation | Type "brother" | भाई |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### Lesson: Sister (`hi-pilot-u3-l4`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| hi | `hi-pilot-u3-l4-e1` | chooseMeaning | Sister | बहन / माँ / पिता / भाई |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-pilot-u3-l4-e2` | chooseMeaning | बहन | Sister / Mother / Father / Brother |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-pilot-u3-l4-e3` | typeTranslation | Type "sister" | बहन |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### Lesson: Child (`hi-pilot-u3-l5`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| hi | `hi-pilot-u3-l5-e1` | chooseMeaning | Child | बच्चा / माँ / पिता / भाई |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-pilot-u3-l5-e2` | chooseMeaning | बच्चा | Child / Mother / Father / Brother |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-pilot-u3-l5-e3` | typeTranslation | Type "child" | बच्चा |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

### Unit 4: Food

#### Lesson: Water (`hi-pilot-u4-l1`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| hi | `hi-pilot-u4-l1-e1` | chooseMeaning | Water | पानी / चाय / चावल / रोटी |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-pilot-u4-l1-e2` | chooseMeaning | पानी | Water / Tea / Rice / Bread |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-pilot-u4-l1-e3` | typeTranslation | Type "water" | पानी |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### Lesson: Tea (`hi-pilot-u4-l2`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| hi | `hi-pilot-u4-l2-e1` | chooseMeaning | Tea | चाय / पानी / चावल / रोटी |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-pilot-u4-l2-e2` | chooseMeaning | चाय | Tea / Water / Rice / Bread |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-pilot-u4-l2-e3` | typeTranslation | Type "tea" | चाय |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### Lesson: Rice (`hi-pilot-u4-l3`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| hi | `hi-pilot-u4-l3-e1` | chooseMeaning | Rice | चावल / पानी / चाय / रोटी |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-pilot-u4-l3-e2` | chooseMeaning | चावल | Rice / Water / Tea / Bread |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-pilot-u4-l3-e3` | typeTranslation | Type "rice" | चावल |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### Lesson: Bread (`hi-pilot-u4-l4`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| hi | `hi-pilot-u4-l4-e1` | chooseMeaning | Bread | रोटी / पानी / चाय / चावल |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-pilot-u4-l4-e2` | chooseMeaning | रोटी | Bread / Water / Tea / Rice |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-pilot-u4-l4-e3` | typeTranslation | Type "bread" | रोटी |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### Lesson: Milk (`hi-pilot-u4-l5`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| hi | `hi-pilot-u4-l5-e1` | chooseMeaning | Milk | दूध / पानी / चाय / चावल |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-pilot-u4-l5-e2` | chooseMeaning | दूध | Milk / Water / Tea / Rice |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-pilot-u4-l5-e3` | typeTranslation | Type "milk" | दूध |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

### Unit 5: Places

#### Lesson: Home (`hi-pilot-u5-l1`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| hi | `hi-pilot-u5-l1-e1` | chooseMeaning | Home | घर / स्कूल / बाजार / स्टेशन |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-pilot-u5-l1-e2` | chooseMeaning | घर | Home / School / Market / Station |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-pilot-u5-l1-e3` | typeTranslation | Type "home" | घर |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### Lesson: School (`hi-pilot-u5-l2`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| hi | `hi-pilot-u5-l2-e1` | chooseMeaning | School | स्कूल / घर / बाजार / स्टेशन |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-pilot-u5-l2-e2` | chooseMeaning | स्कूल | School / Home / Market / Station |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-pilot-u5-l2-e3` | typeTranslation | Type "school" | स्कूल |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### Lesson: Market (`hi-pilot-u5-l3`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| hi | `hi-pilot-u5-l3-e1` | chooseMeaning | Market | बाजार / घर / स्कूल / स्टेशन |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-pilot-u5-l3-e2` | chooseMeaning | बाजार | Market / Home / School / Station |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-pilot-u5-l3-e3` | typeTranslation | Type "market" | बाजार |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### Lesson: Station (`hi-pilot-u5-l4`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| hi | `hi-pilot-u5-l4-e1` | chooseMeaning | Station | स्टेशन / घर / स्कूल / बाजार |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-pilot-u5-l4-e2` | chooseMeaning | स्टेशन | Station / Home / School / Market |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-pilot-u5-l4-e3` | typeTranslation | Type "station" | स्टेशन |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### Lesson: Road (`hi-pilot-u5-l5`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| hi | `hi-pilot-u5-l5-e1` | chooseMeaning | Road | सड़क / घर / स्कूल / बाजार |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-pilot-u5-l5-e2` | chooseMeaning | सड़क | Road / Home / School / Market |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-pilot-u5-l5-e3` | typeTranslation | Type "road" | सड़क |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

---

## Hindi (`hi`) — हिन्दी — Starter

Starter course for हिन्दी (Tier 1: greetings, numbers, essentials).

### Unit 1: Greetings

#### Lesson: Hello & Thanks (`hi-starter-u1-l1`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| hi | `hi-starter-u1-l1-e1` | chooseMeaning | Hello | नमस्ते / धन्यवाद / हाँ / नहीं |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-starter-u1-l1-e2` | chooseMeaning | Thank you | धन्यवाद / नमस्ते / कृपया / माफ़ कीजिये |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-starter-u1-l1-e3` | typeTranslation | Type "hello" | नमस्ते |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### Lesson: Yes & No (`hi-starter-u1-l2`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| hi | `hi-starter-u1-l2-e1` | chooseMeaning | Yes | हाँ / नहीं / कृपया / माफ़ कीजिये |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-starter-u1-l2-e2` | chooseMeaning | No | नहीं / हाँ / धन्यवाद / नमस्ते |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-starter-u1-l2-e3` | matchPairs | Match the pairs | — |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

### Unit 2: Numbers

#### Lesson: Numbers 1-3 (`hi-starter-u2-l1`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| hi | `hi-starter-u2-l1-e1` | chooseMeaning | One | एक / दो / तीन / चार |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-starter-u2-l1-e2` | chooseMeaning | Two | दो / एक / पाँच / तीन |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-starter-u2-l1-e3` | chooseMeaning | Three | तीन / दो / चार / एक |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### Lesson: Numbers 4-5 (`hi-starter-u2-l2`) — 2 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| hi | `hi-starter-u2-l2-e1` | chooseMeaning | Four | चार / पाँच / एक / दो |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-starter-u2-l2-e2` | chooseMeaning | Five | पाँच / चार / तीन / एक |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

### Unit 3: Essentials

#### Lesson: Polite words (`hi-starter-u3-l1`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| hi | `hi-starter-u3-l1-e1` | chooseMeaning | Please | कृपया / माफ़ कीजिये / नमस्ते / धन्यवाद |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-starter-u3-l1-e2` | chooseMeaning | Sorry | माफ़ कीजिये / कृपया / हाँ / नहीं |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-starter-u3-l1-e3` | typeTranslation | Type "please" | कृपया |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### Lesson: Good morning (`hi-starter-u3-l2`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| hi | `hi-starter-u3-l2-e1` | chooseMeaning | Good morning | सुप्रभात / नमस्ते / धन्यवाद / कृपया |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-starter-u3-l2-e2` | typeTranslation | Type "good morning" | सुप्रभात |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-starter-u3-l2-e3` | listenChoose | Listen and choose | सुप्रभात / नमस्ते / माफ़ कीजिये |  | hi-starter-u3-l2-e3.mp3 |  |  |  |  |  |  |  |  |  |  |  |  |  |

### Unit 4: Beyond Five

#### Lesson: Six to Eight (`hi-starter-u4-l1`) — 4 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| hi | `hi-starter-u4-l1-e1` | chooseMeaning | Six | छह / सात / आठ / नौ |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-starter-u4-l1-e2` | chooseMeaning | Seven | सात / छह / आठ / दस |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-starter-u4-l1-e4` | chooseMeaning | Eight | आठ / छह / सात / नौ |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-starter-u4-l1-e3` | typeTranslation | Type "six" | छह |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### Lesson: Nine & Ten (`hi-starter-u4-l2`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| hi | `hi-starter-u4-l2-e1` | chooseMeaning | Nine | नौ / दस / छह / सात |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-starter-u4-l2-e2` | chooseMeaning | Ten | दस / नौ / आठ / छह |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-starter-u4-l2-e3` | matchPairs | Match the pairs | — |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

### Unit 5: Family

#### Lesson: Parents (`hi-starter-u5-l1`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| hi | `hi-starter-u5-l1-e1` | chooseMeaning | Mother | माँ / पिता / बहन / भाई |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-starter-u5-l1-e2` | chooseMeaning | Father | पिता / माँ / बहन / भाई |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-starter-u5-l1-e3` | typeTranslation | Type "mother" | माँ |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### Lesson: Siblings (`hi-starter-u5-l2`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| hi | `hi-starter-u5-l2-e1` | chooseMeaning | Sister | बहन / भाई / माँ / पिता |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-starter-u5-l2-e2` | chooseMeaning | Brother | भाई / बहन / माँ / पिता |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| hi | `hi-starter-u5-l2-e3` | typeTranslation | Type "brother" | भाई |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

---

## Kannada (`kn`) — ಕನ್ನಡ — Starter

Starter course for ಕನ್ನಡ (Tier 1: greetings, numbers, essentials).

### Unit 1: Greetings

#### Lesson: Hello & Thanks (`kn-starter-u1-l1`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| kn | `kn-starter-u1-l1-e1` | chooseMeaning | Hello | ನಮಸ್ಕಾರ / ಧನ್ಯವಾದಗಳು / ಹೌದು / ಇಲ್ಲ |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| kn | `kn-starter-u1-l1-e2` | chooseMeaning | Thank you | ಧನ್ಯವಾದಗಳು / ನಮಸ್ಕಾರ / ದಯವಿಟ್ಟು / ಕ್ಷಮಿಸಿ |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| kn | `kn-starter-u1-l1-e3` | typeTranslation | Type "hello" | ನಮಸ್ಕಾರ |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### Lesson: Yes & No (`kn-starter-u1-l2`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| kn | `kn-starter-u1-l2-e1` | chooseMeaning | Yes | ಹೌದು / ಇಲ್ಲ / ದಯವಿಟ್ಟು / ಕ್ಷಮಿಸಿ |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| kn | `kn-starter-u1-l2-e2` | chooseMeaning | No | ಇಲ್ಲ / ಹೌದು / ಧನ್ಯವಾದಗಳು / ನಮಸ್ಕಾರ |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| kn | `kn-starter-u1-l2-e3` | matchPairs | Match the pairs | — |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

### Unit 2: Numbers

#### Lesson: Numbers 1-3 (`kn-starter-u2-l1`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| kn | `kn-starter-u2-l1-e1` | chooseMeaning | One | ಒಂದು / ಎರಡು / ಮೂರು / ನಾಲ್ಕು |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| kn | `kn-starter-u2-l1-e2` | chooseMeaning | Two | ಎರಡು / ಒಂದು / ಐದು / ಮೂರು |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| kn | `kn-starter-u2-l1-e3` | chooseMeaning | Three | ಮೂರು / ಎರಡು / ನಾಲ್ಕು / ಒಂದು |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### Lesson: Numbers 4-5 (`kn-starter-u2-l2`) — 2 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| kn | `kn-starter-u2-l2-e1` | chooseMeaning | Four | ನಾಲ್ಕು / ಐದು / ಒಂದು / ಎರಡು |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| kn | `kn-starter-u2-l2-e2` | chooseMeaning | Five | ಐದು / ನಾಲ್ಕು / ಮೂರು / ಒಂದು |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

### Unit 3: Essentials

#### Lesson: Polite words (`kn-starter-u3-l1`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| kn | `kn-starter-u3-l1-e1` | chooseMeaning | Please | ದಯವಿಟ್ಟು / ಕ್ಷಮಿಸಿ / ನಮಸ್ಕಾರ / ಧನ್ಯವಾದಗಳು |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| kn | `kn-starter-u3-l1-e2` | chooseMeaning | Sorry | ಕ್ಷಮಿಸಿ / ದಯವಿಟ್ಟು / ಹೌದು / ಇಲ್ಲ |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| kn | `kn-starter-u3-l1-e3` | typeTranslation | Type "please" | ದಯವಿಟ್ಟು |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### Lesson: Good morning (`kn-starter-u3-l2`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| kn | `kn-starter-u3-l2-e1` | chooseMeaning | Good morning | ಶುಭೋದಯ / ನಮಸ್ಕಾರ / ಧನ್ಯವಾದಗಳು / ದಯವಿಟ್ಟು |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| kn | `kn-starter-u3-l2-e2` | typeTranslation | Type "good morning" | ಶುಭೋದಯ |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| kn | `kn-starter-u3-l2-e3` | listenChoose | Listen and choose | ಶುಭೋದಯ / ನಮಸ್ಕಾರ / ಕ್ಷಮಿಸಿ |  | kn-starter-u3-l2-e3.mp3 |  |  |  |  |  |  |  |  |  |  |  |  |  |

### Unit 4: Beyond Five

#### Lesson: Six to Eight (`kn-starter-u4-l1`) — 4 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| kn | `kn-starter-u4-l1-e1` | chooseMeaning | Six | ಆರು / ಏಳು / ಎಂಟು / ಒಂಬತ್ತು |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| kn | `kn-starter-u4-l1-e2` | chooseMeaning | Seven | ಏಳು / ಆರು / ಎಂಟು / ಹತ್ತು |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| kn | `kn-starter-u4-l1-e4` | chooseMeaning | Eight | ಎಂಟು / ಆರು / ಏಳು / ಒಂಬತ್ತು |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| kn | `kn-starter-u4-l1-e3` | typeTranslation | Type "six" | ಆರು |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### Lesson: Nine & Ten (`kn-starter-u4-l2`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| kn | `kn-starter-u4-l2-e1` | chooseMeaning | Nine | ಒಂಬತ್ತು / ಹತ್ತು / ಆರು / ಏಳು |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| kn | `kn-starter-u4-l2-e2` | chooseMeaning | Ten | ಹತ್ತು / ಒಂಬತ್ತು / ಎಂಟು / ಆರು |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| kn | `kn-starter-u4-l2-e3` | matchPairs | Match the pairs | — |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

---

## Malayalam (`ml`) — മലയാളം — Starter

Starter course for മലയാളം (Tier 1: greetings, numbers, essentials).

### Unit 1: Greetings

#### Lesson: Hello & Thanks (`ml-starter-u1-l1`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ml | `ml-starter-u1-l1-e1` | chooseMeaning | Hello | നമസ്കാരം / നന്ദി / അതെ / ഇല്ല |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| ml | `ml-starter-u1-l1-e2` | chooseMeaning | Thank you | നന്ദി / നമസ്കാരം / ദയവായി / ക്ഷമിക്കണം |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| ml | `ml-starter-u1-l1-e3` | typeTranslation | Type "hello" | നമസ്കാരം |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### Lesson: Yes & No (`ml-starter-u1-l2`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ml | `ml-starter-u1-l2-e1` | chooseMeaning | Yes | അതെ / ഇല്ല / ദയവായി / ക്ഷമിക്കണം |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| ml | `ml-starter-u1-l2-e2` | chooseMeaning | No | ഇല്ല / അതെ / നന്ദി / നമസ്കാരം |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| ml | `ml-starter-u1-l2-e3` | matchPairs | Match the pairs | — |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

### Unit 2: Numbers

#### Lesson: Numbers 1-3 (`ml-starter-u2-l1`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ml | `ml-starter-u2-l1-e1` | chooseMeaning | One | ഒന്ന് / രണ്ട് / മൂന്ന് / നാല് |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| ml | `ml-starter-u2-l1-e2` | chooseMeaning | Two | രണ്ട് / ഒന്ന് / അഞ്ച് / മൂന്ന് |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| ml | `ml-starter-u2-l1-e3` | chooseMeaning | Three | മൂന്ന് / രണ്ട് / നാല് / ഒന്ന് |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### Lesson: Numbers 4-5 (`ml-starter-u2-l2`) — 2 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ml | `ml-starter-u2-l2-e1` | chooseMeaning | Four | നാല് / അഞ്ച് / ഒന്ന് / രണ്ട് |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| ml | `ml-starter-u2-l2-e2` | chooseMeaning | Five | അഞ്ച് / നാല് / മൂന്ന് / ഒന്ന് |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

### Unit 3: Essentials

#### Lesson: Polite words (`ml-starter-u3-l1`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ml | `ml-starter-u3-l1-e1` | chooseMeaning | Please | ദയവായി / ക്ഷമിക്കണം / നമസ്കാരം / നന്ദി |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| ml | `ml-starter-u3-l1-e2` | chooseMeaning | Sorry | ക്ഷമിക്കണം / ദയവായി / അതെ / ഇല്ല |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| ml | `ml-starter-u3-l1-e3` | typeTranslation | Type "please" | ദയവായി |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### Lesson: Good morning (`ml-starter-u3-l2`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ml | `ml-starter-u3-l2-e1` | chooseMeaning | Good morning | സുപ്രഭാതം / നമസ്കാരം / നന്ദി / ദയവായി |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| ml | `ml-starter-u3-l2-e2` | typeTranslation | Type "good morning" | സുപ്രഭാതം |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| ml | `ml-starter-u3-l2-e3` | listenChoose | Listen and choose | സുപ്രഭാതം / നമസ്കാരം / ക്ഷമിക്കണം |  | ml-starter-u3-l2-e3.mp3 |  |  |  |  |  |  |  |  |  |  |  |  |  |

### Unit 4: Beyond Five

#### Lesson: Six to Eight (`ml-starter-u4-l1`) — 4 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ml | `ml-starter-u4-l1-e1` | chooseMeaning | Six | ആറ് / ഏഴ് / എട്ട് / ഒമ്പത് |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| ml | `ml-starter-u4-l1-e2` | chooseMeaning | Seven | ഏഴ് / ആറ് / എട്ട് / പത്ത് |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| ml | `ml-starter-u4-l1-e4` | chooseMeaning | Eight | എട്ട് / ആറ് / ഏഴ് / ഒമ്പത് |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| ml | `ml-starter-u4-l1-e3` | typeTranslation | Type "six" | ആറ് |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### Lesson: Nine & Ten (`ml-starter-u4-l2`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ml | `ml-starter-u4-l2-e1` | chooseMeaning | Nine | ഒമ്പത് / പത്ത് / ആറ് / ഏഴ് |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| ml | `ml-starter-u4-l2-e2` | chooseMeaning | Ten | പത്ത് / ഒമ്പത് / എട്ട് / ആറ് |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| ml | `ml-starter-u4-l2-e3` | matchPairs | Match the pairs | — |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

---

## Marathi (`mr`) — मराठी — Starter

Starter course for मराठी (Tier 1: greetings, numbers, essentials).

### Unit 1: Greetings

#### Lesson: Hello & Thanks (`mr-starter-u1-l1`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mr | `mr-starter-u1-l1-e1` | chooseMeaning | Hello | नमस्कार / धन्यवाद / हो / नाही |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| mr | `mr-starter-u1-l1-e2` | chooseMeaning | Thank you | धन्यवाद / नमस्कार / कृपया / माफ करा |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| mr | `mr-starter-u1-l1-e3` | typeTranslation | Type "hello" | नमस्कार |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### Lesson: Yes & No (`mr-starter-u1-l2`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mr | `mr-starter-u1-l2-e1` | chooseMeaning | Yes | हो / नाही / कृपया / माफ करा |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| mr | `mr-starter-u1-l2-e2` | chooseMeaning | No | नाही / हो / धन्यवाद / नमस्कार |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| mr | `mr-starter-u1-l2-e3` | matchPairs | Match the pairs | — |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

### Unit 2: Numbers

#### Lesson: Numbers 1-3 (`mr-starter-u2-l1`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mr | `mr-starter-u2-l1-e1` | chooseMeaning | One | एक / दोन / तीन / चार |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| mr | `mr-starter-u2-l1-e2` | chooseMeaning | Two | दोन / एक / पाच / तीन |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| mr | `mr-starter-u2-l1-e3` | chooseMeaning | Three | तीन / दोन / चार / एक |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### Lesson: Numbers 4-5 (`mr-starter-u2-l2`) — 2 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mr | `mr-starter-u2-l2-e1` | chooseMeaning | Four | चार / पाच / एक / दोन |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| mr | `mr-starter-u2-l2-e2` | chooseMeaning | Five | पाच / चार / तीन / एक |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

### Unit 3: Essentials

#### Lesson: Polite words (`mr-starter-u3-l1`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mr | `mr-starter-u3-l1-e1` | chooseMeaning | Please | कृपया / माफ करा / नमस्कार / धन्यवाद |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| mr | `mr-starter-u3-l1-e2` | chooseMeaning | Sorry | माफ करा / कृपया / हो / नाही |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| mr | `mr-starter-u3-l1-e3` | typeTranslation | Type "please" | कृपया |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### Lesson: Good morning (`mr-starter-u3-l2`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mr | `mr-starter-u3-l2-e1` | chooseMeaning | Good morning | शुभ सकाळ / नमस्कार / धन्यवाद / कृपया |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| mr | `mr-starter-u3-l2-e2` | typeTranslation | Type "good morning" | शुभ सकाळ |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| mr | `mr-starter-u3-l2-e3` | listenChoose | Listen and choose | शुभ सकाळ / नमस्कार / माफ करा |  | mr-starter-u3-l2-e3.mp3 |  |  |  |  |  |  |  |  |  |  |  |  |  |

### Unit 4: Beyond Five

#### Lesson: Six to Eight (`mr-starter-u4-l1`) — 4 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mr | `mr-starter-u4-l1-e1` | chooseMeaning | Six | सहा / सात / आठ / नऊ |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| mr | `mr-starter-u4-l1-e2` | chooseMeaning | Seven | सात / सहा / आठ / दहा |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| mr | `mr-starter-u4-l1-e4` | chooseMeaning | Eight | आठ / सहा / सात / नऊ |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| mr | `mr-starter-u4-l1-e3` | typeTranslation | Type "six" | सहा |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### Lesson: Nine & Ten (`mr-starter-u4-l2`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mr | `mr-starter-u4-l2-e1` | chooseMeaning | Nine | नऊ / दहा / सहा / सात |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| mr | `mr-starter-u4-l2-e2` | chooseMeaning | Ten | दहा / नऊ / आठ / सहा |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| mr | `mr-starter-u4-l2-e3` | matchPairs | Match the pairs | — |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

---

## Odia (`or`) — ଓଡ଼ିଆ — Starter

Starter course for ଓଡ଼ିଆ (Tier 1: greetings, numbers, essentials).

### Unit 1: Greetings

#### Lesson: Hello & Thanks (`or-starter-u1-l1`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| or | `or-starter-u1-l1-e1` | chooseMeaning | Hello | ନମସ୍କାର / ଧନ୍ୟବାଦ / ହଁ / ନା |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| or | `or-starter-u1-l1-e2` | chooseMeaning | Thank you | ଧନ୍ୟବାଦ / ନମସ୍କାର / ଦୟାକରି / କ୍ଷମା କରନ୍ତୁ |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| or | `or-starter-u1-l1-e3` | typeTranslation | Type "hello" | ନମସ୍କାର |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### Lesson: Yes & No (`or-starter-u1-l2`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| or | `or-starter-u1-l2-e1` | chooseMeaning | Yes | ହଁ / ନା / ଦୟାକରି / କ୍ଷମା କରନ୍ତୁ |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| or | `or-starter-u1-l2-e2` | chooseMeaning | No | ନା / ହଁ / ଧନ୍ୟବାଦ / ନମସ୍କାର |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| or | `or-starter-u1-l2-e3` | matchPairs | Match the pairs | — |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

### Unit 2: Numbers

#### Lesson: Numbers 1-3 (`or-starter-u2-l1`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| or | `or-starter-u2-l1-e1` | chooseMeaning | One | ଏକ / ଦୁଇ / ତିନି / ଚାରି |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| or | `or-starter-u2-l1-e2` | chooseMeaning | Two | ଦୁଇ / ଏକ / ପାଞ୍ଚ / ତିନି |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| or | `or-starter-u2-l1-e3` | chooseMeaning | Three | ତିନି / ଦୁଇ / ଚାରି / ଏକ |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### Lesson: Numbers 4-5 (`or-starter-u2-l2`) — 2 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| or | `or-starter-u2-l2-e1` | chooseMeaning | Four | ଚାରି / ପାଞ୍ଚ / ଏକ / ଦୁଇ |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| or | `or-starter-u2-l2-e2` | chooseMeaning | Five | ପାଞ୍ଚ / ଚାରି / ତିନି / ଏକ |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

### Unit 3: Essentials

#### Lesson: Polite words (`or-starter-u3-l1`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| or | `or-starter-u3-l1-e1` | chooseMeaning | Please | ଦୟାକରି / କ୍ଷମା କରନ୍ତୁ / ନମସ୍କାର / ଧନ୍ୟବାଦ |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| or | `or-starter-u3-l1-e2` | chooseMeaning | Sorry | କ୍ଷମା କରନ୍ତୁ / ଦୟାକରି / ହଁ / ନା |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| or | `or-starter-u3-l1-e3` | typeTranslation | Type "please" | ଦୟାକରି |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### Lesson: Good morning (`or-starter-u3-l2`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| or | `or-starter-u3-l2-e1` | chooseMeaning | Good morning | ଶୁଭ ସକାଳ / ନମସ୍କାର / ଧନ୍ୟବାଦ / ଦୟାକରି |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| or | `or-starter-u3-l2-e2` | typeTranslation | Type "good morning" | ଶୁଭ ସକାଳ |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| or | `or-starter-u3-l2-e3` | chooseMeaning | ଶୁଭ ସକାଳ | Good morning / Hello / Sorry |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

### Unit 4: Beyond Five

#### Lesson: Six to Eight (`or-starter-u4-l1`) — 4 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| or | `or-starter-u4-l1-e1` | chooseMeaning | Six | ଛଅ / ସାତ / ଆଠ / ନଅ |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| or | `or-starter-u4-l1-e2` | chooseMeaning | Seven | ସାତ / ଛଅ / ଆଠ / ଦଶ |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| or | `or-starter-u4-l1-e4` | chooseMeaning | Eight | ଆଠ / ଛଅ / ସାତ / ନଅ |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| or | `or-starter-u4-l1-e3` | typeTranslation | Type "six" | ଛଅ |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### Lesson: Nine & Ten (`or-starter-u4-l2`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| or | `or-starter-u4-l2-e1` | chooseMeaning | Nine | ନଅ / ଦଶ / ଛଅ / ସାତ |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| or | `or-starter-u4-l2-e2` | chooseMeaning | Ten | ଦଶ / ନଅ / ଆଠ / ଛଅ |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| or | `or-starter-u4-l2-e3` | matchPairs | Match the pairs | — |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

---

## Punjabi (`pa`) — ਪੰਜਾਬੀ — Starter

Starter course for ਪੰਜਾਬੀ (Tier 1: greetings, numbers, essentials).

### Unit 1: Greetings

#### Lesson: Hello & Thanks (`pa-starter-u1-l1`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| pa | `pa-starter-u1-l1-e1` | chooseMeaning | Hello | ਸਤ ਸ੍ਰੀ ਅਕਾਲ / ਧੰਨਵਾਦ / ਹਾਂ / ਨਹੀਂ |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| pa | `pa-starter-u1-l1-e2` | chooseMeaning | Thank you | ਧੰਨਵਾਦ / ਸਤ ਸ੍ਰੀ ਅਕਾਲ / ਕਿਰਪਾ ਕਰਕੇ / ਮਾਫ਼ ਕਰਨਾ |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| pa | `pa-starter-u1-l1-e3` | typeTranslation | Type "hello" | ਸਤ ਸ੍ਰੀ ਅਕਾਲ |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### Lesson: Yes & No (`pa-starter-u1-l2`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| pa | `pa-starter-u1-l2-e1` | chooseMeaning | Yes | ਹਾਂ / ਨਹੀਂ / ਕਿਰਪਾ ਕਰਕੇ / ਮਾਫ਼ ਕਰਨਾ |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| pa | `pa-starter-u1-l2-e2` | chooseMeaning | No | ਨਹੀਂ / ਹਾਂ / ਧੰਨਵਾਦ / ਸਤ ਸ੍ਰੀ ਅਕਾਲ |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| pa | `pa-starter-u1-l2-e3` | matchPairs | Match the pairs | — |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

### Unit 2: Numbers

#### Lesson: Numbers 1-3 (`pa-starter-u2-l1`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| pa | `pa-starter-u2-l1-e1` | chooseMeaning | One | ਇੱਕ / ਦੋ / ਤਿੰਨ / ਚਾਰ |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| pa | `pa-starter-u2-l1-e2` | chooseMeaning | Two | ਦੋ / ਇੱਕ / ਪੰਜ / ਤਿੰਨ |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| pa | `pa-starter-u2-l1-e3` | chooseMeaning | Three | ਤਿੰਨ / ਦੋ / ਚਾਰ / ਇੱਕ |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### Lesson: Numbers 4-5 (`pa-starter-u2-l2`) — 2 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| pa | `pa-starter-u2-l2-e1` | chooseMeaning | Four | ਚਾਰ / ਪੰਜ / ਇੱਕ / ਦੋ |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| pa | `pa-starter-u2-l2-e2` | chooseMeaning | Five | ਪੰਜ / ਚਾਰ / ਤਿੰਨ / ਇੱਕ |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

### Unit 3: Essentials

#### Lesson: Polite words (`pa-starter-u3-l1`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| pa | `pa-starter-u3-l1-e1` | chooseMeaning | Please | ਕਿਰਪਾ ਕਰਕੇ / ਮਾਫ਼ ਕਰਨਾ / ਸਤ ਸ੍ਰੀ ਅਕਾਲ / ਧੰਨਵਾਦ |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| pa | `pa-starter-u3-l1-e2` | chooseMeaning | Sorry | ਮਾਫ਼ ਕਰਨਾ / ਕਿਰਪਾ ਕਰਕੇ / ਹਾਂ / ਨਹੀਂ |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| pa | `pa-starter-u3-l1-e3` | typeTranslation | Type "please" | ਕਿਰਪਾ ਕਰਕੇ |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### Lesson: Good morning (`pa-starter-u3-l2`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| pa | `pa-starter-u3-l2-e1` | chooseMeaning | Good morning | ਸ਼ੁਭ ਸਵੇਰ / ਸਤ ਸ੍ਰੀ ਅਕਾਲ / ਧੰਨਵਾਦ / ਕਿਰਪਾ ਕਰਕੇ |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| pa | `pa-starter-u3-l2-e2` | typeTranslation | Type "good morning" | ਸ਼ੁਭ ਸਵੇਰ |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| pa | `pa-starter-u3-l2-e3` | listenChoose | Listen and choose | ਸ਼ੁਭ ਸਵੇਰ / ਸਤ ਸ੍ਰੀ ਅਕਾਲ / ਮਾਫ਼ ਕਰਨਾ |  | pa-starter-u3-l2-e3.mp3 |  |  |  |  |  |  |  |  |  |  |  |  |  |

### Unit 4: Beyond Five

#### Lesson: Six to Eight (`pa-starter-u4-l1`) — 4 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| pa | `pa-starter-u4-l1-e1` | chooseMeaning | Six | ਛੇ / ਸੱਤ / ਅੱਠ / ਨੌਂ |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| pa | `pa-starter-u4-l1-e2` | chooseMeaning | Seven | ਸੱਤ / ਛੇ / ਅੱਠ / ਦਸ |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| pa | `pa-starter-u4-l1-e4` | chooseMeaning | Eight | ਅੱਠ / ਛੇ / ਸੱਤ / ਨੌਂ |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| pa | `pa-starter-u4-l1-e3` | typeTranslation | Type "six" | ਛੇ |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### Lesson: Nine & Ten (`pa-starter-u4-l2`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| pa | `pa-starter-u4-l2-e1` | chooseMeaning | Nine | ਨੌਂ / ਦਸ / ਛੇ / ਸੱਤ |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| pa | `pa-starter-u4-l2-e2` | chooseMeaning | Ten | ਦਸ / ਨੌਂ / ਅੱਠ / ਛੇ |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| pa | `pa-starter-u4-l2-e3` | matchPairs | Match the pairs | — |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

---

## Tamil (`ta`) — தமிழ் — Starter

Starter course for தமிழ் (Tier 1: greetings, numbers, essentials).

### Unit 1: Greetings

#### Lesson: Hello & Thanks (`ta-starter-u1-l1`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ta | `ta-starter-u1-l1-e1` | chooseMeaning | Hello | வணக்கம் / நன்றி / ஆம் / இல்லை |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| ta | `ta-starter-u1-l1-e2` | chooseMeaning | Thank you | நன்றி / வணக்கம் / தயவுசெய்து / மன்னிக்கவும் |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| ta | `ta-starter-u1-l1-e3` | typeTranslation | Type "hello" | வணக்கம் |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### Lesson: Yes & No (`ta-starter-u1-l2`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ta | `ta-starter-u1-l2-e1` | chooseMeaning | Yes | ஆம் / இல்லை / தயவுசெய்து / மன்னிக்கவும் |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| ta | `ta-starter-u1-l2-e2` | chooseMeaning | No | இல்லை / ஆம் / நன்றி / வணக்கம் |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| ta | `ta-starter-u1-l2-e3` | matchPairs | Match the pairs | — |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

### Unit 2: Numbers

#### Lesson: Numbers 1-3 (`ta-starter-u2-l1`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ta | `ta-starter-u2-l1-e1` | chooseMeaning | One | ஒன்று / இரண்டு / மூன்று / நான்கு |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| ta | `ta-starter-u2-l1-e2` | chooseMeaning | Two | இரண்டு / ஒன்று / ஐந்து / மூன்று |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| ta | `ta-starter-u2-l1-e3` | chooseMeaning | Three | மூன்று / இரண்டு / நான்கு / ஒன்று |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### Lesson: Numbers 4-5 (`ta-starter-u2-l2`) — 2 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ta | `ta-starter-u2-l2-e1` | chooseMeaning | Four | நான்கு / ஐந்து / ஒன்று / இரண்டு |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| ta | `ta-starter-u2-l2-e2` | chooseMeaning | Five | ஐந்து / நான்கு / மூன்று / ஒன்று |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

### Unit 3: Essentials

#### Lesson: Polite words (`ta-starter-u3-l1`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ta | `ta-starter-u3-l1-e1` | chooseMeaning | Please | தயவுசெய்து / மன்னிக்கவும் / வணக்கம் / நன்றி |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| ta | `ta-starter-u3-l1-e2` | chooseMeaning | Sorry | மன்னிக்கவும் / தயவுசெய்து / ஆம் / இல்லை |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| ta | `ta-starter-u3-l1-e3` | typeTranslation | Type "please" | தயவுசெய்து |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### Lesson: Good morning (`ta-starter-u3-l2`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ta | `ta-starter-u3-l2-e1` | chooseMeaning | Good morning | காலை வணக்கம் / வணக்கம் / நன்றி / தயவுசெய்து |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| ta | `ta-starter-u3-l2-e2` | typeTranslation | Type "good morning" | காலை வணக்கம் |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| ta | `ta-starter-u3-l2-e3` | listenChoose | Listen and choose | காலை வணக்கம் / வணக்கம் / மன்னிக்கவும் |  | ta-starter-u3-l2-e3.mp3 |  |  |  |  |  |  |  |  |  |  |  |  |  |

### Unit 4: Beyond Five

#### Lesson: Six to Eight (`ta-starter-u4-l1`) — 4 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ta | `ta-starter-u4-l1-e1` | chooseMeaning | Six | ஆறு / ஏழு / எட்டு / ஒன்பது |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| ta | `ta-starter-u4-l1-e2` | chooseMeaning | Seven | ஏழு / ஆறு / எட்டு / பத்து |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| ta | `ta-starter-u4-l1-e4` | chooseMeaning | Eight | எட்டு / ஆறு / ஏழு / ஒன்பது |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| ta | `ta-starter-u4-l1-e3` | typeTranslation | Type "six" | ஆறு |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### Lesson: Nine & Ten (`ta-starter-u4-l2`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ta | `ta-starter-u4-l2-e1` | chooseMeaning | Nine | ஒன்பது / பத்து / ஆறு / ஏழு |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| ta | `ta-starter-u4-l2-e2` | chooseMeaning | Ten | பத்து / ஒன்பது / எட்டு / ஆறு |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| ta | `ta-starter-u4-l2-e3` | matchPairs | Match the pairs | — |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

---

## Telugu (`te`) — తెలుగు — Starter

Starter course for తెలుగు (Tier 1: greetings, numbers, essentials).

### Unit 1: Greetings

#### Lesson: Hello & Thanks (`te-starter-u1-l1`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| te | `te-starter-u1-l1-e1` | chooseMeaning | Hello | నమస్కారం / ధన్యవాదాలు / అవును / కాదు |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| te | `te-starter-u1-l1-e2` | chooseMeaning | Thank you | ధన్యవాదాలు / నమస్కారం / దయచేసి / క్షమించండి |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| te | `te-starter-u1-l1-e3` | typeTranslation | Type "hello" | నమస్కారం |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### Lesson: Yes & No (`te-starter-u1-l2`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| te | `te-starter-u1-l2-e1` | chooseMeaning | Yes | అవును / కాదు / దయచేసి / క్షమించండి |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| te | `te-starter-u1-l2-e2` | chooseMeaning | No | కాదు / అవును / ధన్యవాదాలు / నమస్కారం |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| te | `te-starter-u1-l2-e3` | matchPairs | Match the pairs | — |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

### Unit 2: Numbers

#### Lesson: Numbers 1-3 (`te-starter-u2-l1`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| te | `te-starter-u2-l1-e1` | chooseMeaning | One | ఒకటి / రెండు / మూడు / నాలుగు |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| te | `te-starter-u2-l1-e2` | chooseMeaning | Two | రెండు / ఒకటి / ఐదు / మూడు |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| te | `te-starter-u2-l1-e3` | chooseMeaning | Three | మూడు / రెండు / నాలుగు / ఒకటి |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### Lesson: Numbers 4-5 (`te-starter-u2-l2`) — 2 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| te | `te-starter-u2-l2-e1` | chooseMeaning | Four | నాలుగు / ఐదు / ఒకటి / రెండు |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| te | `te-starter-u2-l2-e2` | chooseMeaning | Five | ఐదు / నాలుగు / మూడు / ఒకటి |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

### Unit 3: Essentials

#### Lesson: Polite words (`te-starter-u3-l1`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| te | `te-starter-u3-l1-e1` | chooseMeaning | Please | దయచేసి / క్షమించండి / నమస్కారం / ధన్యవాదాలు |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| te | `te-starter-u3-l1-e2` | chooseMeaning | Sorry | క్షమించండి / దయచేసి / అవును / కాదు |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| te | `te-starter-u3-l1-e3` | typeTranslation | Type "please" | దయచేసి |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### Lesson: Good morning (`te-starter-u3-l2`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| te | `te-starter-u3-l2-e1` | chooseMeaning | Good morning | శుభోదయం / నమస్కారం / ధన్యవాదాలు / దయచేసి |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| te | `te-starter-u3-l2-e2` | typeTranslation | Type "good morning" | శుభోదయం |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| te | `te-starter-u3-l2-e3` | listenChoose | Listen and choose | శుభోదయం / నమస్కారం / క్షమించండి |  | te-starter-u3-l2-e3.mp3 |  |  |  |  |  |  |  |  |  |  |  |  |  |

### Unit 4: Beyond Five

#### Lesson: Six to Eight (`te-starter-u4-l1`) — 4 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| te | `te-starter-u4-l1-e1` | chooseMeaning | Six | ఆరు / ఏడు / ఎనిమిది / తొమ్మిది |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| te | `te-starter-u4-l1-e2` | chooseMeaning | Seven | ఏడు / ఆరు / ఎనిమిది / పది |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| te | `te-starter-u4-l1-e4` | chooseMeaning | Eight | ఎనిమిది / ఆరు / ఏడు / తొమ్మిది |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| te | `te-starter-u4-l1-e3` | typeTranslation | Type "six" | ఆరు |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### Lesson: Nine & Ten (`te-starter-u4-l2`) — 3 exercises

| Locale | Exercise ID | Kind | Intended meaning / prompt | Options / expected answer | Transliteration (optional) | Audio | Reviewer alias | Qualification | Date | Script OK | Meaning OK | Natural OK | Cultural OK | Audio OK | Severity | Suggested correction | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| te | `te-starter-u4-l2-e1` | chooseMeaning | Nine | తొమ్మిది / పది / ఆరు / ఏడు |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| te | `te-starter-u4-l2-e2` | chooseMeaning | Ten | పది / తొమ్మిది / ఎనిమిది / ఆరు |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| te | `te-starter-u4-l2-e3` | matchPairs | Match the pairs | — |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |

---

## Recording a completed review

Once a qualified reviewer finishes, the owner should: (1) apply any corrections to the source course JSON under `content/<locale>/`; (2) re-run `pnpm sync:content`; (3) replace `reviewStatus` with a dated, attributable value such as `native_reviewed_YYYY-MM-DD` plus a reviewer alias; (4) add the signed-off packet to version control; (5) update `docs/design/speeko-all-phases-progress.md`. Until then, no content in this app may be described as native-speaker reviewed.
