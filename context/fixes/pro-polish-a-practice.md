# Fix — Pro Polish A: Practice

## Status

Completed

## Goals

Five practice details from the Pro browser review (2026-11-12, items 1, 2, 11, 12 and 13). Web only; no backend change.

- **1. A practice quit dialog.** Quitting practice today says the run "counts as played" and "the clock keeps running", and neither is true.
  - `PRACTICE_QUIT_COPY` beside `SOLO_QUIT_COPY` in `src/components/game/QuitDialog.tsx`:

    | Field | Copy |
    | --- | --- |
    | Title | End this practice run? |
    | Detail | You'll see the summary. Practice runs aren't saved. |
    | Confirm | End practice |
    | Pending | Ending… |
    | Dismiss (focused) | Keep practising |

  - `SoloGame` passes it when `state.session?.practice` is true. The server's flag decides, as everywhere in practice.
- **2. The Practice card from the side pick on.** Behind the side pick the rail still shows the 15-second ring and the Lives card, then jumps to the Practice card once the session arrives.
  - While no session exists yet and the run asked for practice (`isPracticeAsked`), the rail draws the Practice card. Once the session arrives, `session.practice` decides, as today.
  - This is presentation of the request: the server still decides, and a session without `practice` puts the ring back. Record the trade-off under Notes.
  - Affects `soloCanvasView` (`src/lib/solo-run.ts`): `isPractice` becomes "the summary's flag, else the session's flag, else the request while there's no session".
- **11. The practice summary at 320.** The "Practice" tag pushes "Run ended" onto two lines, and "You named 6 of 11." touches the card's edge.
  - Below `sm` the tag sits under the title, beside the "You named…" line, or the outcome card wraps cleanly. From `sm`, as today.
  - The outcome card's fixed height (`h-24`, `RunSummary` `OUTCOME_BOX`) must still hold every state at 320, with no text touching an edge.
- **12. "Practise now?" wording.** "Starting practice ends it, and it counts as a quit." is wrong when the left run had already run out of lives (it's saved as `lives_out`).
  - The detail becomes "You left a run in play. Starting practice ends it." (`PRACTICE_OVER_RUN_COPY`, `src/lib/practice.ts`).
- **13. A practice run on a picked match leads back to the archive.** Its summary offers Practise again and Back to play, while a picked timed run offers Back to the archive.
  - `resultActionsLayout`: practice keeps Practise again as the primary, with Back to the archive as the secondary when the run was picked, and Back to play otherwise.
  - `SoloGame` routes the secondary to `/archive` for any picked run, practice or not.

## Notes

- **Source:** the Pro browser review (2026-11-12), items 1, 2, 11, 12 and 13.
- **Order:** any; independent of B, C and D.
- **Hard constraints:** 1 and 7 (the server runs practice; the web draws from the session, and from the request only until the session answers).
- **Constraints:** tokens only; `@/` imports; no `any`; comments of at most 50 characters.
- **Tests (pure):** `soloCanvasView` for a practice request with no session (Practice card) and a session that says no (ring); the practice quit copy chosen from the session; `resultActionsLayout` for picked practice (Practise again plus Back to the archive).
- **Docs:** `context/theme.md` § Solo, "Practice" row: the quit dialog copy and the summary's secondary.
- **Verification:**
  - `npm test`, `npm run lint`, `npm run build`.
  - Snapshots `practice` and `practice-summary` at 320, 390 and 1440. A new `practice-side-pick` snapshot shows the Practice card behind the side pick.
  - **Live, Pro:** start practice; the side pick shows the Practice card; Quit shows the practice dialog; a practice run started from an archive row ends on Back to the archive.

**Deviations recorded during implementation**

- 1: `PRACTICE_QUIT_COPY` lives in `src/lib/practice.ts` beside `PRACTICE_OVER_RUN_COPY`, not in `QuitDialog.tsx`, so a test can import it without JSX; `soloQuitCopy(state)` in `solo-run.ts` picks it from `session.practice`.
- 2: the ask also stands down when the start is refused for Pro (`pro_required`), so Free never sees the Practice card behind "Practice is part of Pro".
- 2, trade-off: until the session answers, the rail draws the request; a session without `practice` puts the ring and lives back.
- 11: below `sm` the tag is 12px, inline after "You named…"; from `sm` it stays at the right, 14px.
- 11, added: below 360px the outcome title is 24px (32px from 360px). At 320, "Perfect clear" wrapped to two lines and spilled past the 96px card in every perfect clear, practice or not.
