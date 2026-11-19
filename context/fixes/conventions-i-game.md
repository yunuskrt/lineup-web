# Fix — Conventions I: Game

## Status

Not Started

## Goals

Phase 3 of `context/docs/code-cleanup-guide.md`, batch conventions-i (merged batches, user 2026-11-19). Items approved by the user on 2026-11-19 (convention-auditor report, "Approve all"). **Mechanical: design and behaviour don't change.** Folders: `components/game`.

### Leaf display parts (was conventions-i1)

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

### Input, dialogs and results (was conventions-i2)

- **84.** `CanvasGate.tsx`: split GatePanel → `game/canvas-gate/GatePanel.tsx`; template; `type GateSize` stays named. Importers: GameCanvas, LoadingPreview.
- **85.** `GuessInput.tsx`: split Spinner, CooldownLine, CooldownAnnouncement → `game/guess-input/<Name>.tsx`; template; `type GuessInputStatus` stays named. Importers: GameCanvas, LoadingPreview, GuessPreview, FeedbackPreview, ShowcaseFrame parts.
- **86.** `MissedReveal.tsx`: template. Importer: RunSummary.
- **87.** `NamedOrder.tsx`: split Row → `game/named-order/Row.tsx`; template; exported union `NamedOrderProps` stays, with a local `type Props`, and keeps `props`. Importers: RunSummary, DuelResultPanel.
- **88.** `ProtocolRefused.tsx`: template; `PROTOCOL_REFUSED_COPY` stays named. Importers: `play/duel/page.tsx`, DuelGame.
- **89.** `QuitDialog.tsx`: template; `type QuitDialogCopy`, `SOLO_QUIT_COPY`, `DUEL_FORFEIT_COPY` stay named. Importers: ArchiveScreen, SoloGame, PlayStart, DuelGame, ComponentsPreview.
- **90.** `ResultActions.tsx`: template; exported `ResultActionsProps` stays, with a local `type Props`. Importers: RunSummary, DuelResultPanel (mixed).
- **91.** `RunSummary.tsx`: split Outcome, Stat, Stats, SummarySkeleton → `game/run-summary/<Name>.tsx`; template. `OUTCOME_BOX` and `OUTCOME_TITLE` move to `game/run-summary/styles.ts` (decision); DuelResultPanel's import of them follows. Importer: GameCanvas.
- **92.** `DuelResultPanel.tsx`: split Outcome, Tally → `game/duel-result-panel/<Name>.tsx`; template. Importer: GameCanvas.
- **93.** `SidePickCard.tsx`: split Tile → `game/side-pick-card/Tile.tsx`; template. Importer: GameCanvas.

### Assembly (was conventions-i3)

- **94.** `DuelGame.tsx`: template. Importer: `play/duel/page.tsx`.
- **95.** `GameCanvas.tsx`: split ClockBlock, RailLives, GateCountdown, GateSeconds, GateAction, ActiveRail → `game/game-canvas/<Name>.tsx`; template; `HEADINGS` moves to `game/game-canvas/styles.ts` if parts share it (decision). Importers: CanvasStatePreview, SoloGame, DuelGame.
- **96.** `LivesCard.tsx`: split CardFrame, Tally, Dot → `game/lives-card/<Name>.tsx`, and DuelLivesCard → `game/DuelLivesCard.tsx` (top-level: GameCanvas and LivesPreview import it; rule of 2026-11-20); template. Importers: LivesPreview, GameCanvas (DuelLivesCard: path and style).
- **97.** `SoloGame.tsx`: template. Importer: `play/solo/page.tsx`.

## Out of Scope

- Anything beyond the template, the splits and their imports: no renames (`ArchiveSkeletonRows` in `components/archive` keeps its name), no copy, class or logic changes.
- Other folders' files, except updating their imports of a component changed here.

## Notes

- **Source:** `convention-auditor` report, step 3.1 of the guide; numbers are its item numbers.
- **Rules:**
  - **The template** (`coding-standards-web.md`): `import React from 'react'` (after `'use client'` when present), `type Props = {…}` (even empty), `const Name = ({…}: Props) => {…}`, `export default Name`. Non-component exports (constants, types) stay named beside the default.
  - **A split moves code unchanged** into `<parent-kebab>/<Name>.tsx` beside the parent. No change to copy, classes, markup order, ARIA, refs, hooks or behaviour.
  - **Decisions (guide, user 2026-11-19):** shared class constants of split parts go to a sibling `styles.ts` in the new subfolder; exported props types that other files import stay exported with a local `type Props = <thatType>`; union or generic props keep a single `props` parameter; single-line `{/* … */}` JSX comments stay; only split parts that use hooks, events, browser APIs or `motion` keep `'use client'`, and a part never gains a directive its parent lacked; a part other files also import goes top-level in the folder, not into the parts subfolder (2026-11-20); shared non-class values go to a sibling `shared.ts`; `import React` is always the first import, merged with any other `react` names.
  - **Importers:** every file importing a changed component switches from `import { X }` to `import X` (mixed: `import X, { CONST } from …`). Importers outside the batch are edited here too; their own batch converts them later.
- **Verification:**
  - `npm run lint`, `npx tsc --noEmit`, `npm test` and `npm run build`;
  - a search finds no named import left for a component this batch made default;
  - every moved component body, helper, constant and comment appears verbatim in the new files (script check);
  - B5 (Leaf display parts (was conventions-i1)): `/dev/ring`, `/dev/lives`, `/dev/sound`, `/dev/feedback`, the solo and duel `warning`, `practice`, `opponent-reconnecting` states (frozen-clock rule), `/archive?state=open` and `/` (crests and logos).
  - B5 (Input, dialogs and results (was conventions-i2)): solo and duel states for side pick, pending, rate-limited, run over, perfect clear, practice summary, duel win/loss/draw/forfeit, protocol refused (frozen-clock rule), `/dev/guess`, `/dev/loading`, `/dev/components`; by hand: a solo run to the summary and Quit.
  - B5 (Assembly (was conventions-i3)): every `/dev/canvas` state at 320 and 1280 (frozen-clock rule); by hand: a full mock solo run and a mock duel to a result.
- **B7 scope:** only findings inside these goals are fixed; anything else is a follow-up note.
