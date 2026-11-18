# Fix — Conventions I1: Game Display Parts

## Status

Not Started

## Goals

Phase 3 of `context/docs/code-cleanup-guide.md`, batch conventions-i1. Items approved by the user on 2026-11-19 (convention-auditor report, "Approve all"). **Mechanical: design and behaviour don't change.** Folder: `components/game` (leaf display parts).

- **72.** `ClubCrest.tsx`: template; `type CrestSize` stays named. Importers: ArchiveRow, HomeInside parts, MatchHeader, SidePickCard.
- **73.** `CompetitionLogo.tsx`: template. Importers: FilterChipImage parts, ArchiveRow, HomeInside parts, MatchHeader, SidePickCard.
- **74.** `CountdownRing.tsx`: template. Importers: GameCanvas, RingPreview.
- **75.** `FeedbackToast.tsx`: template. Importers: FeedbackPreview, ShowcaseFrame parts, GameCanvas.
- **76.** `FoundCount.tsx`: template (inline → `Props`). Importers: ShowcaseFrame parts, GameCanvas.
- **77.** `LifeLostFlash.tsx`: template. Importers: LivesPreview, GameCanvas.
- **78.** `Lives.tsx`: template. Importers: LivesPreview, RunSummary, LivesCard, DuelResultPanel.
- **79.** `MatchHeader.tsx`: split Team → `game/match-header/Team.tsx`; template. Importers: ShowcaseFrame parts, GameCanvas.
- **80.** `PracticeCard.tsx`: template. Importer: GameCanvas.
- **81.** `ReconnectChip.tsx`: template (inline → `Props`). Importer: LivesCard.
- **82.** `SoundToggle.tsx`: template. Importers: SoundPreview, GameCanvas.
- **83.** `SuggestionList.tsx`: template. Importer: GuessInput.

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
  - B5: `/dev/ring`, `/dev/lives`, `/dev/sound`, `/dev/feedback`, the solo and duel `warning`, `practice`, `opponent-reconnecting` states (frozen-clock rule), `/archive?state=open` and `/` (crests and logos).
- **B7 scope:** only findings inside these goals are fixed; anything else is a follow-up note.
