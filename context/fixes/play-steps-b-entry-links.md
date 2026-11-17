# Fix — Play Steps B: Which Step Each Link Opens

## Status

Not Started

## Goals

Follows **Play Steps A**. Every link into `/play` now opens a step. Each one opens the step that fits where the player comes from (decided 2026-11-17, "by origin"). Web only. Button copy, the game routes and the server's checks don't change.

- **A fresh start opens step 1** with nothing picked. Plain `/play` stays the link for:
  - the nav's Play button (still hidden on `/play`);
  - the home fold's Play button and the site footer;
  - the 404 page;
  - the empty profile history and `ProfileNotice`;
  - the signed-in panel;
  - the redirects after sign-in, sign-up and Continue as guest;
  - the quit chip's bare fallback link.
- **Home mode links open step 2**, as the mode is already chosen:
  - "Play solo" opens `/play?mode=solo&step=filters`;
  - "Find a duel" opens `/play?mode=duel&step=filters`;
  - **"Play a friend"** opens `/play?mode=duel#play-a-friend`: step 1 with Duel selected and the join row in view. A line under the row says how to host: "To host, choose your filters and create a room at the last step." (new copy).
- **Back to play from a game opens step 3**, with mode, practice and filters kept, so the player can replay in one tap:
  - **solo** (`SoloGame` `leave`): the summary's Back to play, the cap gate, the practice-closed gate, the Free-with-a-picked-link and Free-with-a-practice-link gates; `mode=solo` is now written, and practice stays when it's kept today;
  - **duel** (`DuelGame` `leavingParams` / `goTo`): leaving the queue (cancel), the lobby's and the result's Back to play, the room gates' Back to play, and `ProtocolRefused`'s Back to Play; `/play/duel`'s own refused page links to `/play?mode=duel&step=start`.
- **A refused join opens step 1** with Duel selected and the code kept in the join box (`keepsJoinCode`), as the code is what the player needs to fix. The page scrolls to the join row.
- **A capped Free player** arriving on step 3 sees the cap line, Start disabled and Play a duel, as today. Play a duel switches to Duel in place and focuses Start.
- **Old links still work:** `/play?mode=duel` with filters and no `step` opens step 1 with Duel picked. A practice link the player can't use falls back to Solo selected.

## Out of Scope

- The stepper itself: **Play Steps A**.
- Archive Play links (`/play/solo?match=`), room share links (`/play/duel?room=`) and "Play solo with the same filters" after no opponent: they go straight to a game route, unchanged.

## Notes

- **Source:** the user's review and answers, 2026-11-17.
- **Helpers:** links are built with `withStep` and `withMode` from Play Steps A, never as hand-written query strings, except the home page's constants. Add `/play` link builders to `lib/play-steps.ts` if two or more callers share one. Test any builder.
- **Hash on a client-side arrival:** check that `#play-a-friend` scrolls to the join row both from the home page's `Link` and on a fresh load. Scroll it in an effect if Next doesn't.
- **Constraints:** `@/` imports; no `any`; comments of at most 50 characters.
- **Docs:** `context/theme.md`:
  - § Lobby "Cancelled": back to step 3 of `/play`, filters preserved;
  - "Join refused": back to step 1 with the code kept;
  - the "Play setup" table from A gets the entry links.
- **Verification:**
  - each link above in the browser, as a guest and signed in, checking the step it lands on, the mode and filters it carries, and the focus;
  - the solo summary's Back to play;
  - a cancelled queue;
  - a refused join (wrong code);
  - the cap gate (`NEXT_PUBLIC_MOCK_TIER=free` with the mock API, the user's step);
  - Back in the browser from a game route to `/play`;
  - 320 and 1280px; `npm run build`.
