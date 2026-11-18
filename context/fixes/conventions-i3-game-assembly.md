# Fix — Conventions I3: Game Assembly

## Status

Not Started

## Goals

Phase 3 of `context/docs/code-cleanup-guide.md`, batch conventions-i3. Items approved by the user on 2026-11-19 (convention-auditor report, "Approve all"). **Mechanical: design and behaviour don't change.** Folder: `components/game` (assembly).

- **94.** `DuelGame.tsx`: template. Importer: `play/duel/page.tsx`.
- **95.** `GameCanvas.tsx`: split ClockBlock, RailLives, GateCountdown, GateSeconds, GateAction, ActiveRail → `game/game-canvas/<Name>.tsx`; template; `HEADINGS` moves to `game/game-canvas/styles.ts` if parts share it (decision). Importers: CanvasStatePreview, SoloGame, DuelGame.
- **96.** `LivesCard.tsx`: split CardFrame, Tally, Dot, DuelLivesCard → `game/lives-card/<Name>.tsx`; template. Importers: LivesPreview, GameCanvas (DuelLivesCard: path and style).
- **97.** `SoloGame.tsx`: template. Importer: `play/solo/page.tsx`.

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
  - B5: every `/dev/canvas` state at 320 and 1280 (frozen-clock rule); by hand: a full mock solo run and a mock duel to a result.
- **B7 scope:** only findings inside these goals are fixed; anything else is a follow-up note.
