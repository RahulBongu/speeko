# Attribution

Speeko's own code and content are licensed as follows (2026-11-18):

| Part | License | File |
| --- | --- | --- |
| Source code | Apache License 2.0 | `LICENSE` |
| Course content, brand, design, docs | All Rights Reserved | `LICENSE-CONTENT` |
| Bundled fonts | SIL Open Font License 1.1 | `apps/web/public/fonts/OFL.txt` |

Third-party attributions are also collected in `NOTICE`.

## Fonts

Bundled in `apps/web/public/fonts/` under the SIL Open Font License 1.1:

- **Baloo 2** — Copyright 2019 The Baloo 2 Project Authors
  (https://github.com/EkType/Baloo2)
- **Nunito** — Copyright 2014 The Nunito Project Authors
  (https://github.com/googlefonts/nunito)

The full license text is in `apps/web/public/fonts/OFL.txt`.

## Imported phrases

**No imported third-party phrases are present in the current curriculum.**
If phrases are imported later:

- Every imported item keeps its source sentence ID so attribution can be
  traced, and is stored with `reviewStatus: "draft"` until a native speaker
  reviews it.
- **Tatoeba** (https://tatoeba.org/) content is CC BY 2.0 FR unless a
  sentence states otherwise; attribution: "Tatoeba contributors". It must be
  listed here with the imported IDs before it ships.

## Brand assets

Speeko wordmark, app icon, fox mascot, and the brand board in `design/` and
`apps/web/public/brand/` are original Speeko artwork. They are All Rights
Reserved (`LICENSE-CONTENT`) and are not licensed for reuse by third parties
without permission from the owner.

## Deliberately unused

No Tatoeba, unDraw, Rive, or Duolingo assets have been imported. The
`listenChoose` exercises ship with an empty `audioUrl`; audio licensing must
be settled before audio can be added (see
`docs/decisions/2026-11-16-license.md`).

## Course authoring

Original Speeko lessons are authored in this repository and are not copied from
any third-party language-learning product. Imported phrases are rewritten into
Speeko's own exercise shapes and remain draft until reviewed.
