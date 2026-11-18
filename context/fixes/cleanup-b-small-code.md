# Fix — Cleanup B: Small Code Changes

## Status

Completed

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
  - **B5 (run by Claude in the main session, as the guide says):** against the baseline for `/`, `/dev/ring`, `/dev/lives` and two game states (`/play/solo?state=warning`, `/play/duel?state=opponent-reconnecting`);
  - **B8, the user, with reduced motion off:** the home page marquee scrolls at the same speed as before and pauses when scrolled out of view (the baseline was taken with reduced motion on, so it can't show this);
  - `/dev/ring`'s live ring still runs 15 seconds.

- **Deviations recorded during implementation:**
  - **Item 12–13, one more user:** `src/lib/dev/canvas-states.ts` also imported `ROUND_MS` from `@/lib/canvas`; it now takes it from `@/lib/api/schemas/common`, merged into its `SQUAD_SIZE` import.
  - **Item 12–13 comment:** the duel cap's comment ("A duel caps elapsed time at one round") moved from `player.ts` to `elapsedMs` in `duelNamedPlayerSchema`, where the cap now is.
  - **Item 14 check:** with reduced motion off, both marquee tracks compute to `40s` and read `paused` out of view and `running` in view, as before (`animate-marquee` sets no duration, so the class wins).
  - **B5 on live clocks:** `/dev/ring` and the two game states show a running clock, so no shot matches the baseline, nor even its own re-take. They were shot with the browser clock frozen, branch against `main` (changes stashed): all six byte-identical. The guide's B5 now says so.
  - **Mock round length:** `lib/api/mock/clock.ts` keeps its own `ROUND_DURATION_MS = 15_000` on purpose, like the reconnect window: the mock stands in for the backend and stays independent of the client's copy.
  - **`ROUND_MS` comment:** it names the constant as the client's copy of the server's round (ring, cues, duel cap), not the server's clock (review).
  - **Follow-ups, not this batch:**
    - the duel `elapsedMs` cap is exactly `ROUND_MS`, but a guess can land in the ~400 ms grace window; check with the backend contract whether it clamps `elapsedMs` to 15,000 (unchanged here: the cap was 15,000 before).
    - the marquee classes beat the `animate-marquee` shorthand by Tailwind's output order; putting the duration in `--animate-marquee` would remove that dependency.
