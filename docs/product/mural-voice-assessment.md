# Mural voice conversation — feasibility assessment (2026-11-19)

Evaluated against `https://github.com/Chuloo/mural`

| | |
| --- | --- |
| License | MIT (already noted in `docs/decisions`); third-party components retain their own licenses |
| Platform | Native SwiftUI on iOS, Jetpack Compose on Android; WebRTC; local persistence |
| Model surface | OpenAI Realtime/voice ("GPT-Live") with a user-supplied API key |
| Cost | Direct OpenAI usage; Mural's hosted minutes/purchase flows are disabled |
| Account model | Key in device Keychain (iOS) / Android Keystore; no Mural account required; optional account service |
| Speech targets | Spanish (Spain), English, French, German, Italian, Portuguese (BR), Standard Mandarin, Serbian, Greek, Tagalog/Filipino, Dutch, Russian, Norwegian — **none of Speeko's ten Indian languages are shipped as complete modules** |
| Privacy posture | On-device record of vocabulary/progress; session audio/text sent to OpenAI; no Mural cloud sync; abuse-monitoring/provider retention still applies |

## Executive recommendation

**Do not integrate Mural itself, and do not promise voice conversation for M1.**

Mural is a native app, not a library; its `SwiftUI`/`Jetpack Compose` clients,
Keychain persistence and custom WebRTC plumbing cannot be dropped into Speeko's
Next.js/React-Native code. The one reusable piece is the **pattern**: a
provider-direct Realtime voice session that adapts to evidence from the user
reply, plus local persistence and an honest voice UI. That pattern must be
rebuilt in Speeko's stack.

As it stands, Speeko does not have a configured AI provider:

- `apps/api/src/routes/ai.ts` exposes `/api/ai/status` and `/api/ai/conversation`.
  Without `AI_API_KEY` and `AI_API_URL`, every conversation request is rejected
  with a `503` and an `available: false` response.
- Even with those variables set, the route is intentionally a stub and still
  returns `503`; the honest state is what the web `/conversation` page reports
  today ("Conversation practice is unavailable until an AI provider is
  configured").
- The mobile app does not ship a conversation screen or voice runtime.

That honest behaviour must not become a fake demo for the marketing site.

## If voice conversation is ever built for Speeko

Preferred shape:

1. **Server-only provider connection.** A Fastify/`/api` route mints a short-lived
   provider session or ephemeral token; no raw OpenAI key should ship in the
   client bundle; device audio is never written to Speeko logs.
2. **Explicit consent for audio.** Mic permission, a short modal that says audio
   goes to the configured provider and nowhere else, and a visible stop/end path.
3. **Provider fallback.** Without a provider, `/conversation` continues to show
   the same honest `503` with the practice/learn links; the landing page never
   speaks on behalf of a voice session that does not exist.
4. **Adaptivity by evidence.** Store per-language recall observations
   (`known/unknown/do not say yet`) locally and server-side after auth.
5. **Evaluation gate.** Technical acceptance requires ASR robustness in all ten
   target languages, not just Hindi — local volunteers or native reviewers are a
   hard prerequisite for quality claims.

## Effort and blockers

| Option | Effort | Blocker | Shipped now? |
| --- | --- | --- | --- |
| Borrow Mural's name/design | None | Avoid trademark issues; Mural is not a Speeko dependency | No |
| Pragmatic rebuild: OpenAI Realtime-style loop (listen, detect target language, gentle correction, evidence-based adaptation, recall) | 4–8 weeks | Provider key, per-second billing, moderation/safety, mic permission, ASR quality gate, store-review of microphone/data collection | No |
| Rebuild Mural's native clients and rename them | Not sensible | Swift/Kotlin code cannot be used in React Native web parity; two more platforms of maintenance; Mimo license and trademark confusion | No |
| Keep `/conversation` and honest `503` | Already done | None | Yes |

## Risks to record

- **Privacy gap:** audio goes to the provider, unlike text lists of lesson
  answers; the privacy data inventory must be extended before any activation.
- **Cost:** voice sessions are metered; without a proxy cap and budget alerts
  this cannot go open-to-guests.
- **ASR reality check:** many Indic ASR models struggle with low-resource
  contexts; English and Hindi are plausible, several others are not known to be
  reliable.
- **Moderation and safety:** for minors and general users, the product must
  moderate the assistant, not just the learner.
- **Scope creep:** conversation is the largest feature from the spec; adding it
  before audio quality and certification would lower the quality of M1.

## Decision

Voice conversation is **post-M1/reopen only if the owner configures a provider
and accepts the cost and privacy exposure.** The existing `/conversation` page
is sufficient for the alpha and should stay honest. No remote voice dependency
was added, so no new secrets, containers, store permissions or data flows are
in use.

Mural's useful "what not to do" lessons are: don't ship hosted minutes before
budget/usage controls exist, don't advertise a voice flow before it is actually
configured, and don't let "Mandarin pinyin" slip in unreviewed. Speeko keeps the
same boundaries.
