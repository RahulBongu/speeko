# Speeko — listenChoose audio decision analysis (2026-11-16)

**Status:** recommendation only. **No audio exists; nothing is verified or
claimed to be working.** Every `listenChoose` item still ships `audioUrl: ""`.

## What the 10 items are (all blocked)

One per starter course, ids `*-u3-l2-e3` (u3 = politeness unit,
"Listen and choose" near Good morning). Course → prompt → target answer:

| id | Course | Target |
|---|---|---|
| bn-starter-u3-l2-e3 | Bengali | সুপ্রভাত |
| gu-starter-u3-l2-e3 | Gujarati | સુપ્રભાત |
| hi-starter-u3-l2-e3 | Hindi | सुप्रभात |
| kn-starter-u3-l2-e3 | Kannada | ಶುಭೋದಯ |
| ml-starter-u3-l2-e3 | Malayalam | സുപ്രഭാതം |
| mr-starter-u3-l2-e3 | Marathi | शुभ सकाळ |
| or-starter-u3-l2-e3 | Odia | ଶୁଭ ସକାଳ |
| pa-starter-u3-l2-e3 | Punjabi | ਸ਼ੁਭ ਸਵੇਰ |
| ta-starter-u3-l2-e3 | Tamil | காலை வணக்கம் |
| te-starter-u3-l2-e3 | Telugu | శుభోదయం |

Exactly one listening exercise per starter course; `hi-pilot` has none.

## Environment check (local, today)

`System.Speech` (Windows SAPI 5) exposes **only
`Microsoft David Desktop (en-US)`** and **`Microsoft Zira Desktop (en-US)`** on
this machine. An `hi-IN`/`bn-IN`/`ta-IN`/etc. voice is **not installed**.
Playing any Indic text with these voices produces gibberish — not usable,
not honest, and worse than silence.

## Options, evaluated

### (a) Locally generated synthetic speech — NOT VIABLE TODAY

- No Indic voice installed on this machine. Adding one would require a
  licensed Indic voice package or online TTS — see (b)/(c).
- Windows SAPI synthesize-files for Indic scripts are not available.
  `System.Speech` export of non-English text was not exercised because no
  language pack exists.
- Quality cannot be asserted without native sign-off; and the delivery flag
  (owner decision) is untouched.

### (b) Properly licensed native/studio recordings per locale

- **The only honest path** that matches the linguistically reviewed goal.
  A speaker or voice talent records each prompt once with a simple pack
  (≈10 files, ≤1 minute total).
- Same review gate as the dictionary text: recordings ship only after a
  native/fluent-speaker reviewer of that locale listens, signs off, and signs
  off the IPA reference.
- Cost: near-zero for hobbyist level (friend or community volunteer), low
  single digits ($) per locale otherwise.
- Requires: script, license note, files placed under `apps/web/public/courses/audio/`
  (or API `/api/audio/*`), `audioUrl` wired per item (never guessed), plus the
  same validator already in place (SR-1–R-008 check URL format on non-empty).

### (c) Cloud TTS (paid) — NOT AUTHORIZED

Would be suitable (Bhashini, Google Cloud TTS, Azure) but costs money and
accounts; also raises licensing questions that belong to the owner. Not
acted on.

### (d) Exclude `listenChoose` from starters entirely

- Honest; zero risk of a misleading "Listen and choose" with no sound.
- Loses real listening practice that native sign-off can supply anyway.
- If the owner prefers this now: remove the 10 items from starters, or hide
  them from the published bundle until audio exists — rebuild from source.

## What changed in this pass (2026-11-16, post-decision)

**Delivered behavior:** listenChoose items with an empty `audioUrl` are
**excluded from every playable queue** — web lesson player, web review,
mobile lesson runner, mobile practice, SRS index, and unit practice index —
via the shared `eligibleExercises()` helper in `@speeko/core`. The content
files are untouched: IDs, order, review status, and `audioUrl: ""` remain
exactly as they are. The exclusion is symmetric between clients and server,
so a lesson behaves identically on web, mobile, and the grading API.

**Tests:** `packages/core/src/eligibility.test.ts` (new, 4 tests) and
`packages/core/src/practice.test.ts` (updated with an ineligible-audio fixture)
assert that ineligible items are absent from due/trouble/unit plans, the review
queue, and SRS skill index. Mobile integration tests exercise both flows: a
no-audio item is skipped, and an item with a URL is still played.

**This is a play-time safeguard, not an audio solution.** The 10 source items
still exist, still carry `audioUrl: ""`, and still block in the audit ledger.
Nothing has been recorded, licensed, or fabricated.

The owner still needs to choose between:

1. **Record or license native audio** for the ten prompts (the only path that
   restores real listening practice). Requires a native/fluent speaker to check
   the recordings; wire `audioUrl` per item only after the asset exists.
2. **Keep the exclusion for launch** and revisit listening practice later.
   This is what the current tree does; the lesson drops from 3 to 2 questions.
3. **License a local or cloud TTS voice per locale** — chosen and paid for by
   the owner; voices must be verified by a native speaker before any claim of
   "listening practice".

The exclusion is reversible per item: adding a valid `audioUrl` to a source
`listenChoose` and rebuilding puts it back in every queue with no code change.
The audit ledger will still show it as `blocked` until the audio is verified.
