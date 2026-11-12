# Pro B: Pro-Only Room Hosting

## Status

Completed

## Goals

With the switch on, only Pro creates private rooms; anyone joins (`project-overview.md` § Free vs Pro, "Private lobbies"). Needs **Pro A** and backend **R10** on `main`.

- **`/play`, "Play a friend" row** (`RoomControls`):
  - **Locked** (`proAccess` is `'locked'`): Create room becomes a `ProLock` with the caption "Pro hosts rooms. Anyone can join." The "or", the code box and Join are unchanged.
  - **Open:** today's row, unchanged.
- **`/play/duel?room=create` refused** (a Free player with an old link, or a tier that just changed):
  - The server answers `forbidden` with `reason: 'pro_required'`.
  - The lobby gate shows "Hosting a room needs Pro", the line "Anyone can join a room with its code.", **See Pro**, and **Back to play** (filters kept).
  - A new failure in the duel session reducer, keyed by `reason`. Other `forbidden` refusals keep today's copy.
- **The result of a room game** (`DuelResultPanel`):
  - **Open:** New room and Back to play, as today.
  - **Locked:** New room becomes a `ProLock` ("Pro hosts rooms."), and Back to play becomes the primary action.
- **The mock:** `createRoom` refuses a mock user whose effective tier is `free` with `forbidden` + `pro_required` and R10's message. Join is unchanged.
- **Dev snapshots** (`?state=` on `/play/duel`, `/dev/canvas`): `room-pro-required` (the refusal gate) and `room-result-free` (the locked New room).
- **Tests (pure):**
  - The reducer: a `pro_required` create refusal → the new failure; a `forbidden` without `reason` → today's failure.
  - The result actions for a room game, open and locked.
  - The mock: Free create refused; Pro create opens; Free join works.
- **Docs:**
  - `context/theme.md` § Lobby & matchmaking: a "Hosting locked" row.
  - `context/docs/contract.md` § 5: `room:create`'s `pro_required` refusal.
  - `context/docs/pro-features.md`: #7 marked done.

## Layout

```text
/play, Duel, Free (switch on)

Play a friend
[ Create room ]  (disabled)   or   [ Room code ][ Join ]
Pro hosts rooms. Anyone can join. See Pro
```

## Out of Scope

- Rooms themselves (built in Private Rooms A and B).
- The landing page's "Play a friend" button: it goes to `/play#play-a-friend`, where Join is always open.

## Open Questions

Defaults stand unless changed at load:

- **A Free player's result after a room game** keeps the locked New room visible (so they learn hosting exists), with Back to play as the primary.

## Notes

- **Source:** user request (2026-11-10), item #7 of the Pro features.
- **Order:** second of six. Needs A.
- **Hard constraints:**
  - **15:** hosting decides only who opens a room. Inside the duel both players face identical rules.
  - **16:** the server refuses; the web's lock is presentation.
- **Constraints:** tokens only; `@/` imports; no `any`; comments of at most 50 characters.
- **Deviations recorded during implementation:**
  - **`ProLock` is split into `ProLockButton` and `ProLockCaption`** (`ProLock` still composes them). On `/play` the caption sits under the whole "Play a friend" row: inside the lock, its width pushed "or" away from the button.
  - **See Pro is the refusal gate's secondary action,** a text link under Back to play (the gate's existing two-action shape). It leaves the duel socket, then opens `/pro` (`isProRequired` in `src/lib/duel-session.ts`, handled in `DuelGame`).
  - **The result's hosting state rides on the canvas view** (`DuelCanvasView.hostAccess`, set by `DuelGame` from `useProAccess()`), so snapshots can force it. The buttons come from a pure `resultActionsLayout(isPrivate, hostAccess)` in `src/lib/result-actions.ts`; `pending` locks like `locked`, with no caption.
  - **`ProAccess` moved to `src/types/pro.ts`,** now that a type file (`canvas.ts`) uses it.
  - **The mock's tier check is the first one on `createRoom`,** as R10 built it, and the mock's room tests now sign in a Pro guest.
  - **Checked live** (2026-11-12, 3000 against 8080, dev database, `PRO_ENABLED=true`): Pro creator `guest-38aulr2z` opened room `FSF7B8`; a fresh Free guest (`guest-s82v5rrk`) saw Create room locked with the caption under the row, joined by code, and the match started. After the Free player forfeited, their result led with Back to play and showed New room locked ("Pro hosts rooms. See Pro"); the Pro creator's result showed New room open. The Free guest opening `/play/duel?room=create` got "Hosting a room needs Pro" with Back to play and See Pro, and See Pro landed on `/pro`. The row at 1440 and 375: aligned, no sideways scroll.
  - **Checked live with `PRO_ENABLED=false`:** a fresh guest's Create room is open and opens a waiting room; "Pro" appears nowhere on `/play` or the waiting screen. Build passes.
- **Verification:**
  - `npm test`, `npm run lint`, `npm run build`.
  - **Mock, switch on, Free:** the locked Create room; Join with a code plays; `?room=create` shows the refusal gate.
  - **Mock, Pro, or the switch off:** Create room works as before.
  - **Real, backend `PRO_ENABLED=true`, two browsers:** a Pro creator (set with the backend's tier script) and a Free joiner play a room game to the result. The Free player sees the locked New room; the Pro player sees New room.
  - **Real, `PRO_ENABLED=false`:** a fresh guest creates a room.
