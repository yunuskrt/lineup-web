# Fix — Conventions E: Archive and Pro

## Status

Not Started

## Goals

Phase 3 of `context/docs/code-cleanup-guide.md`, batch conventions-e. Items approved by the user on 2026-11-19 (convention-auditor report, "Approve all"). **Mechanical: design and behaviour don't change.** Folder: `components/archive`, `components/pro`.

- **42.** `archive/ArchiveFilters.tsx`: template; `type ArchiveFilterState` stays named. Importer: ArchiveView (mixed).
- **43.** `archive/ArchiveRow.tsx`: template. Importer: ArchiveView.
- **44.** `archive/ArchiveSkeleton.tsx`: template; the component keeps its name `ArchiveSkeletonRows`. Importer: ArchiveView.
- **45.** `archive/ArchiveScreen.tsx`: template. Importer: `archive/page.tsx`.
- **46.** `archive/ArchiveView.tsx`: split Header, Results → `archive/archive-view/<Name>.tsx`; template. Importers: ArchiveScreen, ArchiveStatePreview.
- **47.** `pro/GetProButton.tsx`: template. Importer: ProView.
- **48.** `pro/ProLock.tsx`: split ProLockButton, ProLockCaption → `pro/pro-lock/<Name>.tsx`; template; `type ProLockSize` stays named. Importers: ResultActions, MissedReveal, ArchiveView, ProPreview (mixed); ModeChoice and CreateRoom (path and style).
- **49.** `pro/ProPlanTable.tsx`: split Value → `pro/pro-plan-table/Value.tsx`; template. Importer: ProView.
- **50.** `pro/ProView.tsx`: template; `type ProPlan` stays named. Importers: ProScreen, ProPreview (mixed).
- **51.** `pro/ProScreen.tsx`: template. Importer: `pro/page.tsx`.

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
  - B5: `/archive` and every `/archive?state=` view at 320 and 1280 (and `/archive` at 768), `/pro` at 320, 768 and 1280, `/dev/pro`; by hand: Play from the archive as a guest.
- **B7 scope:** only findings inside these goals are fixed; anything else is a follow-up note.
