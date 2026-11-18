# Content

All course data in this directory is **All Rights Reserved**. See
[`../LICENSE-CONTENT`](../LICENSE-CONTENT). The generator and validation
tooling is Apache-2.0 (see [`../LICENSE`](../LICENSE)).

Layout:

- `<locale>/*.json` — Zod-validated course bundles, compiled into `dist/` by
  `pnpm sync:content`.
- `_config/phrases.json` — the in-house phrase table used by the authoring
  tools.
- `_config/audio-manifest.json` — the audio plan; every `listenChoose`
  exercise currently ships `audioUrl: ""` and is excluded from play.

Every lesson ships with `reviewStatus: "draft"` until a native speaker has
reviewed it. Setting `reviewStatus: "reviewed"` requires a named `reviewer`;
do not mark content reviewed on the basis of automated checks alone.

No imported third-party text is present in the current curriculum. If content
is imported later, it keeps its source license and is listed in
[`../ATTRIBUTIONS.md`](../ATTRIBUTIONS.md).
