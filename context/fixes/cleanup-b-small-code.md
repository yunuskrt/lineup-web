# Fix — Cleanup B: Small Code Changes

## Status

Not Started

## Goals

Phase 1 of `context/docs/code-cleanup-guide.md`, batch cleanup-b. Items approved by the user on 2026-11-17 (merged report, items 10–14). **Design and behaviour don't change.**

- **10.** Delete 9 unused `z.infer` type aliases. Their schemas stay, as they're in use:
  - `src/types/api.ts`: `ErrorReason`
  - `src/types/solo.ts`: `SoloSessionStatus`
  - `src/types/profile.ts`: `GameMode`
  - `src/types/duel.ts`: `DuelPhase`, `RoomJoinRequest`, `ConnectionStatus`
  - `src/types/catalog.ts`: `OverviewCounts`, `OverviewHighlights`
  - `src/lib/api/mock/types.ts`: `MockLineupEntry`

  Re-check each with a search across `src/` before deleting. If a schema becomes unused by this, keep it anyway (the contract transcription).
- **11.** [src/components/dev/LivesPreview.tsx:15](src/components/dev/LivesPreview.tsx#L15) imports `RECONNECT_WINDOW_MS` from `@/lib/duel-session` instead of declaring its own. The mock's copy (`lib/api/mock/duel-client.ts`) stays, as the mock is independent by design.
- **12 and 13. One source for the 15-second round:**
  - `ROUND_MS = 15_000` moves to `src/lib/api/schemas/common.ts`, beside `SQUAD_SIZE`, as a contract constant with a one-line comment. (Not `schemas/game.ts`: it imports `schemas/player.ts`, which would make a cycle.)
  - `NAMED_ELAPSED_MAX_MS` in [schemas/player.ts:26](src/lib/api/schemas/player.ts#L26) becomes `ROUND_MS`.
  - [lib/canvas.ts:15](src/lib/canvas.ts#L15) stops declaring it. `canvas.ts`, `sound-cues.ts`, `canvas.test.ts` and `dev/RingPreview.tsx` (whose own copy at line 10 goes) import it from `@/lib/api/schemas/common`.
- **14.** [src/components/ui/marquee.tsx:34-44](src/components/ui/marquee.tsx#L34-L44) loses its inline `style`:
  - the duration becomes a literal class (`[animation-duration:40000ms]`), named in `src/styles/classes.ts` with a test checking it against `MOTION_DURATION_MS.marqueeLoop`, as `LIFE_LOST_FILL_SHIFT` is;
  - the pause becomes a class applied when out of view (`[animation-play-state:paused]`).

## Out of Scope

- `CountdownRing` and `DuelRecord` inline styles: they stay, under the exception added in cleanup-a.
- Splitting files, hooks or modules: phases 2 and 3.

## Notes

- **Source:** `code-scanner` items 8–11 and `/cleanup check` item 8, merged at step 1.3.
- **Constraints:** `@/` imports; no `any`; comments at most 75 characters.
- **Verification:**
  - `npm run lint`, `npx tsc --noEmit`, `npm test` (with the new class test) and `npm run build`;
  - **B5:** `ui-reviewer` against the baseline for `/`, `/dev/ring`, `/dev/lives` and two game states (`/play/solo?state=warning`, `/play/duel?state=opponent-reconnecting`);
  - **B8, the user, with reduced motion off:** the home page marquee scrolls at the same speed as before and pauses when scrolled out of view (the baseline was taken with reduced motion on, so it can't show this);
  - `/dev/ring`'s live ring still runs 15 seconds.
