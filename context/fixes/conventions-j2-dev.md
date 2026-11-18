# Fix — Conventions J2: Dev Previews Template

## Status

Not Started

## Goals

Phase 3 of `context/docs/code-cleanup-guide.md`, batch conventions-j2. Items approved by the user on 2026-11-19 (convention-auditor report, "Approve all"). **Mechanical: design and behaviour don't change.** Folder: `components/dev` (template only, no split, named exports kept).

- **114.** `ArchiveStatePreview.tsx`.
- **115.** `CanvasStatePreview.tsx`.
- **116.** `ComponentsPreview.tsx` and its section helpers (`<Name>Props` each).
- **117.** `DevPreviewShell.tsx`.
- **118.** `FeedbackPreview.tsx`.
- **119.** `GuessPreview.tsx`.
- **120.** `LandingStatePreview.tsx`.
- **121.** `LivesPreview.tsx` and helper Specimen.
- **122.** `LoadingPreview.tsx`.
- **123.** `ProPreview.tsx` and helpers Specimen, SoloStartSample, PracticeSample.
- **124.** `ProfileStatePreview.tsx`.
- **125.** `ResolvedValue.tsx`.
- **126.** `RevealPreview.tsx`.
- **127.** `RingPreview.tsx` and helper Specimen.
- **128.** `SoundPreview.tsx`.

Each file gets `import React from 'react'`, arrow consts and a props type (`<Name>Props` where several components share a file). Exports stay named.

## Out of Scope

- Anything beyond the template, the splits and their imports: no renames (e.g. `ArchiveSkeletonRows` keeps its name), no copy, class or logic changes.
- Other folders' files, except updating their imports of a component changed here.

## Notes

- **Source:** `convention-auditor` report, step 3.1 of the guide; numbers are its item numbers.
- **Rules:**
  - **The template** (`coding-standards-web.md`): `import React from 'react'` (after `'use client'` when present), `type Props = {…}` (even empty), `const Name = ({…}: Props) => {…}`, `export default Name`. Non-component exports (constants, types) stay named beside the default.
  - **A split moves code unchanged** into `<parent-kebab>/<Name>.tsx` beside the parent. No change to copy, classes, markup order, ARIA, refs, hooks or behaviour.
  - **Decisions (guide, user 2026-11-19):** shared class constants of split parts go to a sibling `styles.ts` in the new subfolder; exported props types that other files import stay exported with a local `type Props = <thatType>`; union or generic props keep a single `props` parameter; single-line `{/* … */}` JSX comments stay.
  - **Importers:** every file importing a changed component switches from `import { X }` to `import X` (mixed: `import X, { CONST } from …`). Importers outside the batch are edited here too; their own batch converts them later.
- **Verification:**
  - `npm run lint`, `npx tsc --noEmit`, `npm test` and `npm run build`;
  - a search finds no named import left for a component this batch made default;
  - B5: every `/dev/*` page at 1280, plus the `?state=` previews they back (`/profile?state=populated`, `/archive?state=open`, `/play/solo?state=warning`).
- **B7 scope:** only findings inside these goals are fixed; anything else is a follow-up note.
