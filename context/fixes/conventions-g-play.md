# Fix — Conventions G: Play

## Status

Not Started

## Goals

Phase 3 of `context/docs/code-cleanup-guide.md`, batch conventions-g (merged batches, user 2026-11-19). Items approved by the user on 2026-11-19 (convention-auditor report, "Approve all"). **Mechanical: design and behaviour don't change.** Folders: `components/play`.

### Filter family (was conventions-g1)

- **57.** `FilterChipImage.tsx`: split ClubChipImage, CompetitionChipImage → `play/<Name>.tsx` (top-level: FilterPanel imports them; rule of 2026-11-20); template. Importer: FilterPanel (new paths).
- **59.** `FilterSkeleton.tsx`: split SkeletonRow → `play/filter-skeleton/SkeletonRow.tsx`; template. Importers: FiltersStep, ArchiveFilters.
- **66.** `FilterPanel.tsx`: split FilterRow, Chip, CompetitionGroup, CompetitionFilter, ClubFilter, SeasonSelect, EraFilter → `play/filter-panel/<Name>.tsx`; template; its props keep `props`. `FILTER_ROW`, `FILTER_LABEL`, `FILTER_NOTE` and `CLUB_HINT` move to `play/filter-panel/styles.ts` (decision); FilterSkeleton's import of them follows. Importers: FiltersStep, ArchiveFilters.
- **68.** `FiltersStep.tsx`: template. Importer: PlayScreen.

### The rest (was conventions-g2)

- **58.** `SoloAllowanceNote.tsx`: template. Importers: PlayScreen, ProPreview.
- **60.** `ModeChoice.tsx`: split CardIcon, PlayerBars, LockedCard → `play/mode-choice/<Name>.tsx`; template. Importers: ModeStep, ProPreview.
- **61.** `ModeStep.tsx`: template. Importer: PlayScreen.
- **62.** `PlayScreen.tsx`: template. Importer: `play/page.tsx`.
- **63.** `PlaySteps.tsx`: template. Importer: PlayScreen.
- **64.** `PlaySummary.tsx`: split Rows → `play/play-summary/Rows.tsx`; template. Importer: StartStep.
- **65.** `StartStep.tsx`: template. Importer: PlayScreen.
- **67.** `CreateRoom.tsx`: template. Importer: StartStep.
- **69.** `JoinRoom.tsx`: template. Importer: ModeStep.
- **70.** `PlayStart.tsx`: template. Importers: StartStep, ProPreview.

## Out of Scope

- Anything beyond the template, the splits and their imports: no renames (`ArchiveSkeletonRows` in `components/archive` keeps its name), no copy, class or logic changes.
- Other folders' files, except updating their imports of a component changed here.

## Notes

- **Source:** `convention-auditor` report, step 3.1 of the guide; numbers are its item numbers.
- **Rules:**
  - **The template** (`coding-standards-web.md`): `import React from 'react'` (after `'use client'` when present), `type Props = {…}` (even empty), `const Name = ({…}: Props) => {…}`, `export default Name`. Non-component exports (constants, types) stay named beside the default.
  - **A split moves code unchanged** into `<parent-kebab>/<Name>.tsx` beside the parent. No change to copy, classes, markup order, ARIA, refs, hooks or behaviour.
  - **Decisions (guide, user 2026-11-19):** shared class constants of split parts go to a sibling `styles.ts` in the new subfolder; exported props types that other files import stay exported with a local `type Props = <thatType>`; union or generic props keep a single `props` parameter; single-line `{/* … */}` JSX comments stay; only split parts that use hooks, events or browser APIs keep `'use client'`; `import React` is always the first import, merged with any other `react` names.
  - **Importers:** every file importing a changed component switches from `import { X }` to `import X` (mixed: `import X, { CONST } from …`). Importers outside the batch are edited here too; their own batch converts them later.
- **Verification:**
  - `npm run lint`, `npx tsc --noEmit`, `npm test` and `npm run build`;
  - a search finds no named import left for a component this batch made default;
  - every moved component body, helper, constant and comment appears verbatim in the new files (script check);
  - B5 (Filter family (was conventions-g1)): `/play?mode=solo&step=filters` at 320, 768 and 1280 (the page that flips renders: A/B rule), `/archive?state=open` with filters open; by hand: pick a competition, search a club, set seasons.
  - B5 (The rest (was conventions-g2)): `/play`, `/play?mode=duel` (join row), `/play?mode=solo&step=start`, `/play?mode=duel&step=start` at 320, 768 and 1280; by hand: the three steps with Back/Forward, Start, Create room, Join.
- **B7 scope:** only findings inside these goals are fixed; anything else is a follow-up note.
