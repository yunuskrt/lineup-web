# Fix — Conventions F: Pitch

## Status

Not Started

## Goals

Phase 3 of `context/docs/code-cleanup-guide.md`, batch conventions-f. Items approved by the user on 2026-11-19 (convention-auditor report, "Approve all"). **Mechanical: design and behaviour don't change.** Folder: `components/pitch`.

- **52.** `Pitch.tsx`: split PitchEnd → `pitch/pitch/PitchEnd.tsx`; template. Importer: SquadGrid.
- **53.** `PlayerHeadshot.tsx`: template; `HEADSHOT_SIZE` stays named. Importers: SquadSlot (mixed), NamedOrder, SuggestionList.
- **54.** `RevealCard.tsx`: template. Importer: SquadGrid.
- **55.** `SquadGrid.tsx`: split GridSlot → `pitch/squad-grid/GridSlot.tsx`; template; `discSizeClass` and `slotWidthClass` stay named (`squad-grid.test.ts` unaffected). Importers: RevealPreview, `app/dev/pitch/page.tsx`, FeedbackPreview, LoadingPreview, ShowcaseFrame, GameCanvas.
- **56.** `SquadSlot.tsx`: split EmptyDisc → `pitch/squad-slot/EmptyDisc.tsx`; template; union props keep `props`. Importers: SquadGrid, RevealCard.

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
  - B5: `/dev/pitch`, `/dev/reveal`, `/` (showcase) and game states with found players (`/play/solo?state=warning`, `/play/duel?state=their-reveal`, frozen-clock rule).
- **B7 scope:** only findings inside these goals are fixed; anything else is a follow-up note.
