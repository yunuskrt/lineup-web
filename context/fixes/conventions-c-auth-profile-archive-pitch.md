# Fix — Conventions C: Auth, Profile, Archive, Pro and Pitch

## Status

Completed

## Goals

Phase 3 of `context/docs/code-cleanup-guide.md`, batch conventions-c (merged batches, user 2026-11-19). Items approved by the user on 2026-11-19 (convention-auditor report, "Approve all"). **Mechanical: design and behaviour don't change.** Folders: `components/auth`, `components/profile`, `components/archive`, `components/pro`, `components/pitch`.

### Auth (was conventions-c)

- **19.** `AuthError.tsx`: template (`AuthErrorProps` → `Props`). Importers: SignedInPanel, AuthField, ContinueAsGuest.
- **20.** `AuthField.tsx`: template; `type AuthFieldConfig` stays named. Importer: AuthForm (mixed).
- **21.** `AuthForm.tsx`: template with the generic: `type Props<S extends z.ZodType>`, `const AuthForm = <S extends z.ZodType,>(props: Props<S>) => …` (generic props keep `props`). Importers: SignInForm, SignUpForm.
- **22.** `AuthPanel.tsx`: split Header → `auth/auth-panel/Header.tsx`; template. Importer: `sign-in/page.tsx`.
- **23.** `AuthSkeleton.tsx`: split FieldSkeleton → `auth/auth-skeleton/FieldSkeleton.tsx`; template. Importer: AuthPanel.
- **24.** `ContinueAsGuest.tsx`: template (Props none). Importer: AuthPanel.
- **25.** `ModeSwitch.tsx`: template. Importer: AuthPanel.
- **26.** `SignedInPanel.tsx`: template. Importer: AuthPanel.
- **27.** `SignInForm.tsx`: template (Props none); `SIGN_IN_FIELDS` stays named. Importer: AuthPanel.
- **28.** `SignUpForm.tsx`: template (Props none); `SIGN_UP_FIELDS` stays named. Importer: AuthPanel.

### Profile (was conventions-d)

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

### Archive and Pro (was conventions-e)

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

### Pitch (was conventions-f)

- **52.** `Pitch.tsx`: split PitchEnd → `pitch/pitch/PitchEnd.tsx`; template. Importer: SquadGrid.
- **53.** `PlayerHeadshot.tsx`: template; `HEADSHOT_SIZE` stays named. Importers: SquadSlot (mixed), NamedOrder, SuggestionList.
- **54.** `RevealCard.tsx`: template. Importer: SquadGrid.
- **55.** `SquadGrid.tsx`: split GridSlot → `pitch/squad-grid/GridSlot.tsx`; template; `discSizeClass` and `slotWidthClass` stay named (`squad-grid.test.ts` unaffected). Importers: RevealPreview, `app/dev/pitch/page.tsx`, FeedbackPreview, LoadingPreview, ShowcaseFrame, GameCanvas.
- **56.** `SquadSlot.tsx`: split EmptyDisc → `pitch/squad-slot/EmptyDisc.tsx`; template; union props keep `props`. Importers: SquadGrid, RevealCard.

### React import order (review of conventions-b)

- `import React` becomes the first import in `home/CountUp.tsx`, `home/LandingSkeleton.tsx`, `home/HomeRules.tsx`, `home/HomeFold.tsx`, `providers/QueryProvider.tsx` and `shell/StateNotice.tsx`, merged with their other `react` names.

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
  - B5 (Auth (was conventions-c)): `/sign-in` and `/sign-in?mode=sign-up` at 320, 768 and 1280; by hand: sign up, sign in, continue as guest and a field error in mock mode.
  - B5 (Profile (was conventions-d)): `/profile` and every `/profile?state=` view at 320 and 1280 (and `/profile` at 768).
  - B5 (Archive and Pro (was conventions-e)): `/archive` and every `/archive?state=` view at 320 and 1280 (and `/archive` at 768), `/pro` at 320, 768 and 1280, `/dev/pro`; by hand: Play from the archive as a guest.
  - B5 (Pitch (was conventions-f)): `/dev/pitch`, `/dev/reveal`, `/` (showcase) and game states with found players (`/play/solo?state=warning`, `/play/duel?state=their-reveal`, frozen-clock rule).
- **B7 scope:** only findings inside these goals are fixed; anything else is a follow-up note.

### Deviations recorded during implementation

- **ProLockButton and ProLockCaption** go top-level as `pro/ProLockButton.tsx` and `pro/ProLockCaption.tsx`, not `pro/pro-lock/`: CreateRoom and ModeChoice import them (code review). `coding-standards-web.md` and the auditor now say so; the later specs' ChipImage parts and DuelLivesCard follow it.
- **Review notes, no change:** ProLockButton and Results import a type back from their parent (`ProLockSize`, `ArchiveViewProps`); type-only, erased at runtime, as the exported-props rule allows. The standards now name `shared.ts` for non-class values and count `motion` parts as needing `'use client'`.
- **LetterTile** takes `Tile`, `TILE_LETTERS` and `TILE_FILLS` with it and exports `type Tile`, which DuelRecord's counts still use.
- **ArchiveView** keeps `export type ArchiveViewProps` with `type Props = ArchiveViewProps`, as Results picks its props from it.
- **Shared values of split parts:** Pitch's `STROKE` and `SPOT` go to `pitch/pitch/styles.ts`; SquadGrid's `INSTANT` to `pitch/squad-grid/shared.ts`.
- **Constants used by one part only move with it:** `LOCKED_LINE` and `LINE` (archive Header), `MODE_LABELS`, `MODE_TONES`, `modeKind` (ModeTag), `TONE_TEXT` (Outcome), `lockedControl` (ProLockButton), `missedEntrance` (GridSlot).
