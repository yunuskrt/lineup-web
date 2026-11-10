# Pro B: Pro-Only Room Hosting

## Status

Not Started

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
- **Verification:**
  - `npm test`, `npm run lint`, `npm run build`.
  - **Mock, switch on, Free:** the locked Create room; Join with a code plays; `?room=create` shows the refusal gate.
  - **Mock, Pro, or the switch off:** Create room works as before.
  - **Real, backend `PRO_ENABLED=true`, two browsers:** a Pro creator (set with the backend's tier script) and a Free joiner play a room game to the result. The Free player sees the locked New room; the Pro player sees New room.
  - **Real, `PRO_ENABLED=false`:** a fresh guest creates a room.
