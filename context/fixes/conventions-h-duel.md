# Fix — Conventions H: Duel Lobby

## Status

Completed

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
  - **Decisions (guide, user 2026-11-19):** shared class constants of split parts go to a sibling `styles.ts` in the new subfolder; exported props types that other files import stay exported with a local `type Props = <thatType>`; union or generic props keep a single `props` parameter; single-line `{/* … */}` JSX comments stay; only split parts that use hooks, events, browser APIs or `motion` keep `'use client'`, and a part never gains a directive its parent lacked; a part other files also import goes top-level in the folder, not into the parts subfolder (2026-11-20); shared non-class values go to a sibling `shared.ts`; `import React` is always the first import, merged with any other `react` names.
  - **Importers:** every file importing a changed component switches from `import { X }` to `import X` (mixed: `import X, { CONST } from …`). Importers outside the batch are edited here too; their own batch converts them later.
- **Verification:**
  - `npm run lint`, `npx tsc --noEmit`, `npm test` and `npm run build`;
  - a search finds no named import left for a component this batch made default;
  - every moved component body, helper, constant and comment appears verbatim in the new files (script check);
  - B5: every lobby and room state (`/play/duel?state=` searching, paired, filters, coin flip, no opponent, room waiting, room expired, room filters) at 320 and 1280 (frozen-clock rule); by hand: a mock duel from Find an opponent to the first turn, and Create room.
- **B7 scope:** only findings inside these goals are fixed; anything else is a follow-up note.

### Deviations recorded during implementation

- **`STATUS_ROW`** also goes to `duel/lobby-panel/styles.ts` beside `CARD` and `ACTIONS`: LockedIn and Filters both use it.
- **Values used by one part only move with it:** `AMBIENT_PULSE` (Searching), `ROOM_TICK_MS` (ClosesIn), `COPIED_MS`, `CopyTarget` and the `useCopy` hook (RoomWaiting), and each part's props type.
- **`'use client'`:** LobbyPanel drops it, as it now only picks a step and has no hooks or events (GameCanvas, a client component, imports it). The parts with hooks, events or `motion` keep it: Searching, ClosesIn, CopyButton, RoomWaiting, RoomExpired, Filters, CoinFlip, NoOpponent; ActorBar, SummaryList, PlayerCard, Paired, FilterCard and LockedIn are markup only.
- **B5 ran in real mode** (`NEXT_PUBLIC_API_MODE=real`, the local backend on :8080) instead of the mock the guide names; the branch-vs-main shots share that mode, so the comparison holds. The duel hand check ran as two browsers paired through the real queue, as one browser can't pair there.

### Follow-ups (code review, outside this batch)

- **Copy confirmation restarts:** `useCopy`'s 2 s reset is keyed on `copied`, so copying the same target twice doesn't restart the "Copied" window (RoomWaiting).
- **Refused-clipboard line sticks:** `isRefused` clears only on a later successful copy, so "Copying isn't allowed here…" can stay for the room's life.
- **Copy after unmount:** `copy()` sets state after the clipboard promise even if RoomWaiting has gone; harmless in React 18+, but unguarded.
- **Two opponent sources:** Paired reads `lobby.opponent`, Filters the `opponent` prop; both come from GameCanvas's view today, but one source would rule out a mismatch.
- **`useCopy` location:** a self-contained clipboard hook inside RoomWaiting; it belongs in `src/hooks/use-copy.ts` if another surface needs it.
- **Not a finding:** the joining step does show the code, through the gate title "Joining room K7QM2X…" (`lib/lobby.ts`).
