# Fix — Conventions D: Profile

## Status

Not Started

## Goals

Phase 3 of `context/docs/code-cleanup-guide.md`, batch conventions-d. Items approved by the user on 2026-11-19 (convention-auditor report, "Approve all"). **Mechanical: design and behaviour don't change.** Folder: `components/profile`.

- **29.** `ProfileScreen.tsx`: template. Importer: `profile/page.tsx`.
- **30.** `LivesLeft.tsx`: template (inline → `Props`); `livesLeftLabel` stays named. Importer: HistoryRow (mixed).
- **31.** `HistoryMore.tsx`: template. Importers: ArchiveView, HistoryList.
- **32.** `GuestUpgrade.tsx`: template. Importer: ProfileView.
- **33.** `ProfileHeader.tsx`: template (inline → `Props`). Importer: ProfileView.
- **34.** `ProfilePlan.tsx`: template (inline → `Props`). Importer: ProfileHeader.
- **35.** `ProfileView.tsx`: template. Importers: ProfileScreen, ProfileStatePreview.
- **36.** `DuelRecord.tsx`: split LetterTile → `profile/duel-record/LetterTile.tsx`; template. Importer: ProfileView.
- **37.** `HistoryList.tsx`: split EmptyHistory → `profile/history-list/EmptyHistory.tsx`; template. Importer: ProfileView.
- **38.** `HistoryRow.tsx`: split ModeTag, Outcome → `profile/history-row/<Name>.tsx`; template. Importer: HistoryList.
- **39.** `ProfileSkeleton.tsx`: template (inline → `Props`). Importer: ProfileView.
- **40.** `ProfileStats.tsx`: template (inline → `Props`). Importer: ProfileView.
- **41.** `ProfileNotice.tsx`: template; its union props keep the single `props` parameter. Importer: ProfileView.

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
  - B5: `/profile` and every `/profile?state=` view at 320 and 1280 (and `/profile` at 768).
- **B7 scope:** only findings inside these goals are fixed; anything else is a follow-up note.
