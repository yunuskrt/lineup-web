# Fix — Conventions H: Duel Lobby

## Status

Not Started

## Goals

Phase 3 of `context/docs/code-cleanup-guide.md`, batch conventions-h. Items approved by the user on 2026-11-19 (convention-auditor report, "Approve all"). **Mechanical: design and behaviour don't change.** Folder: `components/duel`.

- **71.** `LobbyPanel.tsx`: split ActorBar, SummaryList, Searching, ClosesIn, CopyButton, RoomWaiting, RoomExpired, PlayerCard, Paired, FilterCard, LockedIn, Filters, CoinFlip, NoOpponent → `duel/lobby-panel/<Name>.tsx`; template. `LOBBY_GATE_SIZE` stays named; `CARD` and `ACTIONS` move to `duel/lobby-panel/styles.ts` (decision). Importer: GameCanvas (mixed).

## Out of Scope

- Anything beyond the template, the splits and their imports: no renames (e.g. `ArchiveSkeletonRows` keeps its name), no copy, class or logic changes.
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
  - B5: every lobby and room state (`/play/duel?state=` searching, paired, filters, coin flip, no opponent, room waiting, room expired, room filters) at 320 and 1280 (frozen-clock rule); by hand: a mock duel from Find an opponent to the first turn, and Create room.
- **B7 scope:** only findings inside these goals are fixed; anything else is a follow-up note.
