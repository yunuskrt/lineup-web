# Fix — Conventions G: Play

## Status

Completed

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
  - **Decisions (guide, user 2026-11-19):** shared class constants of split parts go to a sibling `styles.ts` in the new subfolder; exported props types that other files import stay exported with a local `type Props = <thatType>`; union or generic props keep a single `props` parameter; single-line `{/* … */}` JSX comments stay; only split parts that use hooks, events, browser APIs or `motion` keep `'use client'`; a part other files also import goes top-level in the folder, not into the parts subfolder (2026-11-20); shared non-class values go to a sibling `shared.ts`; `import React` is always the first import, merged with any other `react` names.
  - **Importers:** every file importing a changed component switches from `import { X }` to `import X` (mixed: `import X, { CONST } from …`). Importers outside the batch are edited here too; their own batch converts them later.
- **Verification:**
  - `npm run lint`, `npx tsc --noEmit`, `npm test` and `npm run build`;
  - a search finds no named import left for a component this batch made default;
  - every moved component body, helper, constant and comment appears verbatim in the new files (script check);
  - B5 (Filter family (was conventions-g1)): `/play?mode=solo&step=filters` at 320, 768 and 1280 (the page that flips renders: A/B rule), `/archive?state=open` with filters open; by hand: pick a competition, search a club, set seasons.
  - B5 (The rest (was conventions-g2)): `/play`, `/play?mode=duel` (join row), `/play?mode=solo&step=start`, `/play?mode=duel&step=start` at 320, 768 and 1280; by hand: the three steps with Back/Forward, Start, Create room, Join.
- **B7 scope:** only findings inside these goals are fixed; anything else is a follow-up note.

### Deviations recorded during implementation

- **FilterPanel** keeps `export type FilterPanelProps` with `type Props = FilterPanelProps`: CompetitionFilter, ClubFilter and EraFilter take the same props.
- **ModeChoice:** the shared `ModeCard` type goes to `mode-choice/shared.ts`, `CARD` and `LAST_CARD` to `mode-choice/styles.ts`; `PRACTICE_CAPTION` moves with LockedCard, `PICKABLE` stays.
- **PlaySummary:** `type Row` goes with Rows and is exported, as PlaySummary's rows still use it.
- **Constants used by one part only move with it:** `FILTER_GROUP_LABEL` (CompetitionGroup), `countLabel` (ClubFilter), `SeasonSelectProps` (SeasonSelect).
- **`'use client'`:** FilterPanel and ModeChoice have none, so their parts get none either (their importers are client components); FilterChipImage keeps its own, and ClubChipImage and CompetitionChipImage use no hooks. `coding-standards-web.md` now says so (code review 5, 6).
- **ClubChipImage and CompetitionChipImage** go to `play/filter-panel/`, not top-level: after the split only ClubFilter and CompetitionFilter import them (code review 1). FilterChipImage stays top-level as its own file.
- **Shared filter constants:** `FILTER_ROW`, `FILTER_LABEL` and `FILTER_NOTE` go to `play/styles.ts` and the copy `CLUB_HINT` to `play/shared.ts`, not `play/filter-panel/styles.ts`: FilterPanel's and FilterSkeleton's parts both use them (code review 2, 4).
- **Review notes, no change:** the filter parts import `FilterPanelProps` back from FilterPanel (type-only, as with `ArchiveViewProps`). Follow-up: CompetitionChipImage only passes `className="size-5"` to CompetitionLogo and could be inlined in CompetitionFilter; a simplification, out of this batch's scope.
- **CompetitionChipImage** imports `CompetitionLogo` by name: batch I makes it a default export.
