# Private Rooms A: Create, Join and Wait, on the Mock

## Status

Completed

## Goals

- **Play a friend, not only a stranger.** A player creates a room and gets a code; their friend joins with the code; the two play today's duel. The public queue ("Find an opponent") stays exactly as it is.
  - **Built on the mock first,** like Guess Suggestions A. Backend R6 builds the real side; B wires it.
- **The contract, transcribed from backend request R6** (`context/docs/backend-requests.md` § R6).
  - **New schemas** (`src/lib/api/schemas/duel.ts`, types from `z.infer` in `src/types/duel.ts`):
    - `roomCodeSchema`: 6 characters from `ABCDEFGHJKMNPQRSTUVWXYZ23456789`, uppercase.
    - `roomStateSchema = { code, filters, expiresAt }` and `roomExpirySchema = { code }`.
  - **Changed:** `coinFlipResultSchema` gains `source: 'coin' | 'room'`; the duel variant of `historyEntrySchema` gains `isPrivate: boolean`.
    - **Until R6 ships, both default** (`'coin'` and `false`), so the real backend's current payloads still parse. B removes the defaults.
  - **`DuelClient`** (`src/lib/api/duel-client.ts`) gains `createRoom(filters)`, `joinRoom(code)` and `leaveRoom()`, and the event map gains `roomCreated` and `roomExpired`.
  - **The socket client** (`src/lib/api/socket/`) sends `room:create`, `room:join` and `room:leave` and parses the two events, with R6's names. Until R6 is on the backend they fail like any unanswered command, and the room screens show that error.
- **The mock duel adapter plays rooms.**
  - `createRoom` answers `roomCreated` with a fresh code from the alphabet and `expiresAt` 10 minutes ahead. A scripted friend ("Rival") joins after a few seconds, then `paired` → `coinFlip` (`source: 'room'`, you won) → `matchReady`, and the scripted duel runs as today.
  - `joinRoom` with any well-formed code joins a scripted creator: `paired` → `coinFlip` (`source: 'room'`, they won) → `matchReady`.
  - **Scenarios** (`?scenario=`, `src/lib/api/mock/scenarios.ts`): `room-not-found`, `room-full`, `room-own`, and `room-expires` (the creator's room expires after a short delay instead of being joined).
  - Errors follow R6: `not_found` for a wrong or closed code, `forbidden` for full, your own, or already queued, hosting or in a duel.
- **`/play`: a "Play a friend" row under the duel start.** Shown only when Duel is selected.
  - **Create room:** a secondary button. It uses the filters above, ensures a session (guests welcome, as the Start button does) and goes to `/play/duel?room=create` with the filters in the URL.
  - **Join:** a code box and a Join button.
    - The box uppercases as you type, drops spaces, and holds at most 6 characters; Join is disabled until it's 6 characters of the alphabet. This is a convenience; the server decides.
    - Join goes to `/play/duel?room=<CODE>`.
  - Copy: a small heading "Play a friend", then `Create room`, "or", the code box (placeholder `Room code`) and `Join`.
- **`/play/duel` runs rooms in the same route** (`project-overview.md` § Routes: one route for the whole realtime session).
  - `?room=create` → connect → `createRoom(filters)`. `?room=<CODE>` → connect → `joinRoom(code)`. No `room` param → the queue, as today.
  - **A shared link** (`/play/duel?room=K7QM2X`) works for a signed-out friend too: the session is ensured first (a guest), then the join.
- **Lobby gate, new steps** (`DuelLobbyView` in `src/types/duel-lobby.ts`, `lobbyGate` in `src/lib/lobby.ts`, the duel session reducer).
  - **`roomWaiting`** (the creator, after `roomCreated`):
    - Title "Waiting for your friend". The code large, in the display face with tabular figures, letter-spaced.
    - **Copy code** and **Copy link** (the full `/play/duel?room=<CODE>` URL). Each confirms in place ("Copied") for a moment; if the clipboard is refused, the code stays selectable.
    - A quiet line "Closes in 9:41", counting to `expiresAt` (presentation only: the server expires the room). The filters in use, as the lobby's filter summary shows them.
    - **Cancel** sends `leaveRoom()` and goes back to `/play` with the filters kept.
    - **No countdown ring** (`theme.md` § Lobby: the ring means "you are losing time").
  - **`roomExpired`** (after the event): "No one joined", with **Create a new room** (same filters) and **Back to play**.
  - **`joining`** (the friend, while `joinRoom` is pending): "Joining room K7QM2X…". The canvas stays gated, never a spinner on an empty panel.
  - **Join refused:** a gate with the reason and **Back to play** (filters and code kept on `/play`):
    - `not_found`: "No open room has that code. Check it, or ask your friend for a new one."
    - `forbidden`, full: "That room already has two players."
    - `forbidden`, your own: "That's your own room. Send the code to a friend."
    - `invalid_input`: "That code isn't valid. Room codes are 6 letters and numbers."
  - **The filters beat** (the existing `coinFlip` step, `source: 'room'`): "Playing {creator}'s room", or "Playing your room" for the creator, with the filter summary. No coin-flip wording. Then `matchReady` as today.
- **The result screen in a room game.**
  - The primary action is **New room**: it creates a room with the same filters (the creator's), so either player can host the next one and share a new code. The secondary is **Back to play**.
  - "Find a new opponent" (`searchAgain`) doesn't show after a room game.
- **Profile history: "vs friend".** A duel row with `isPrivate: true` shows a small "vs friend" tag beside "Duel" (`src/components/profile/HistoryRow.tsx`), in `fg-muted`, not a colour.
- **Dev snapshots** (`?state=` on `/play/duel`, and `/dev/canvas`): `room-waiting`, `room-expired`, `room-joining`, `room-not-found`, `room-full`, `room-own`, `room-filters` (the beat), and `room-result` (a finished room game with New room).
- **Tests (pure):**
  - **Schemas:** the code alphabet and length; `roomState` and `roomExpiry`; `coinFlip` with and without `source` (the default); history with and without `isPrivate`.
  - **Code input helper** (`src/lib/room-code.ts`): uppercasing, dropping spaces and characters outside the alphabet, the 6-character limit, `isRoomCode`.
  - **Reducer:** create → waiting → joined → filters beat → playing; expiry; each join refusal; Cancel; a room result offers New room and not searchAgain.
  - **Mock adapter:** create gives a valid code and `expiresAt`; the scripted friend joins; join pairs with a scripted creator; each scenario's error.
  - **Socket client:** the three commands' event names and payloads, and the two events parsed.
- **Docs:**
  - **`context/docs/contract.md` § 5:** the three commands, the two events, `RoomState`, `RoomExpiry`, `coinFlip.source`, history `isPrivate`, and the room behaviour (creator's filters, 10-minute wait, the joiner names first).
  - **`context/theme.md` § Lobby & matchmaking:** rows for Room waiting, Joining, Room expired, Join refused and the room filters beat.
  - **`context/design.md` § Page shape:** `/play` gains the "Play a friend" row under the duel start; `/play/duel` also hosts rooms.

## Shared spec: `project-overview.md` (all three repos)

The file must stay identical in every repo. These edits land here in A, and the backend session applies the same text for R6 (its prompt says so). Mobile picks them up when its repo starts.

- **§ D (Multiplayer Duel):** a new bullet after FIFO matchmaking: "**Private rooms.** A player can create a room and share its 6-character code (or a link); a friend joins with it. A room holds two players and waits 10 minutes. The creator's filters are applied whole, with no coin flip. Everything after the pairing is the duel above."
- **§ B (Filters & Match Selection), Duel bullet:** append "In a private room, the creator's filters are used instead."
- **Hard Constraint 19:** "**Duel filter conflicts are settled by a coin flip** — one player's set is applied whole, and both players are told whose. Never merged, never intersected. **In a private room the creator's set is applied, and both are told.**"
- **§ MVP Scope:** Game gains "private rooms (create, join by code)"; Postponed changes "friend invites / private lobbies" to "friend invites, rematch".
- **Free vs Pro, "Private lobbies" row:** unchanged, with a note under the table: "Private rooms are open to everyone at launch; hosting as a Pro feature is a later decision."
- **§ Route Architecture, `/play/duel`:** "Lobby → matchmaking **or a private room** → live duel → result".

## Layout

`/play`, Duel selected:

```text
[ Solo ]  [ Duel ✓ ]

Filters: Competition · Club · Era

[ Find an opponent ]

Play a friend
[ Create room ]   or   [ Room code ][ Join ]
```

`/play/duel?room=create`, the gate over the canvas:

```text
┌──────────────────────────────────┐
│ Waiting for your friend          │
│                                  │
│        K 7 Q M 2 X               │
│  [ Copy code ]  [ Copy link ]    │
│                                  │
│ Crown League · 2003–2010         │
│ Closes in 9:41                   │
│                         Cancel   │
└──────────────────────────────────┘
```

## Out of Scope

- **The real backend.** That's B, after R6.
- **Rematch** (both tap Rematch, the same pair plays again). A later request and spec.
- **Pro gating** of hosting. A later decision; the Free vs Pro row stays as written.
- **Previewing a room before joining,** inviting by handle, friend lists, and spectating.
- **Mobile.**

## Open Questions

Defaults stand unless changed at load:

- **`project-overview.md` holds your uncommitted source-table edits** (Transfermarkt as primary, Mackolik superseded). Committing A's shared-spec edits would commit those too. Default: commit them together in A, since they're already the scraper's decision (2026-10-26).
- **The URL keeps the filters for `?room=create`,** so a reload while waiting creates a new room with the same filters (the old one closed when the socket did).
- **"New room" after a room game** uses the finished game's filters, whichever player taps it.

## Notes

- **Source:** user request (2026-11-08): "we should add a new functionality: Create Room and Join Room. This way, users can play against their friends… a unique code should be generated for the room. Another user may enter the room only by entering the valid code… The capacity of the room is 2. Gameplay logic is the same as duel." The UI will be redone later, so this follows today's UI simply.
- **Decisions (user, 2026-11-08):**
  - **Who hosts:** everyone, guests included; Pro gating later.
  - **Filters:** the creator's, fixed at creation; no filter window, no coin flip.
  - **After the game:** no rematch now ("New room"); rematch is a later spec.
  - **Stats:** room games count; history marks them "vs friend".
  - **Placement:** a "Play a friend" row under the duel start on `/play`.
  - **Code:** 6 characters without look-alikes; Copy code, Copy link; the link joins directly.
  - **Wait:** 10 minutes, then the room closes.
  - **Join:** at once, then a short beat naming the creator's filters.
- **Deviations recorded during implementation:**
  - **Scenario names** are camelCase (`roomNotFound`, `roomFull`, `roomOwn`, `roomExpires`), like the existing `queueTimeout`.
  - **Scenarios only work in a dev build** (`scenarioFrom` is off in production), and Next refuses a second dev server beside 3000. So the three refusals and expiry were checked with unit tests and the `?state=` snapshots; the live flows ran on a mock production build on 3100.
  - **History reads "Friend", not "Duel · vs friend":** a history row's first column is 3rem wide, so the mode tag becomes Friend (Solo / Duel / Friend), with "Duel with a friend" for screen readers.
  - **`forbidden` join refusals show the server's message:** full and own room share the code, so the web can't tell them apart. The mock's messages are the spec's words. `not_found` and `invalid_input` keep the web's own copy.
  - **Look-alikes stay visible in the code box,** with the hint "Room codes don't use 0, O, 1, I or L." Dropping them silently would make a typed O vanish.
  - **The creator's dropped connection is handled here, not in B:** it's pure reducer logic. The gate says "Your room closed" with New room.
  - **The joining gate shows from the first frame,** before the session and catalogue load, not after.
  - **`retry`, `playAgain` and `newRoom` return the new URL** when they open a room, so `?room=create` and the filters follow and a reload keeps the room.
  - **New failure steps** `createRoom` and `joinRoom`; widening an empty-pool room retries `createRoom` with the wider set.
  - **Mock timings:** the friend joins after 3 s, a join pairs after 0.8 s, and `roomExpires` closes the room after 3 s.
  - **Review (2026-11-08):** a reload mid-room-game resends `room:create` or `room:join` from the URL; the server resumes the duel first, then refuses the command. That refusal is now ignored while a duel is live, as the queue's already was. The "Closes in" line reads `serverClock`, like the other server deadlines.
  - **Real mode before R6 merged:** the backend session's in-progress R6a (branch `feature/r6a-private-rooms`, running on 8080) already answered `room:create` with a waiting room and a wrong code with `not_found` in the web's words. The full two-browser check stays in B.
- **Hard constraints:**
  - **1, 7:** the room's lifecycle, its expiry and who names first are the server's; the web renders them.
  - **2:** a room changes how two players meet, nothing about what the client receives.
  - **12:** guests can create and join, including from a shared link.
  - **15:** nothing about a room is purchasable or changes the rules.
  - **19:** amended in § Shared spec for rooms.
- **Constraints:**
  - Colours from tokens only; no new hex.
  - `@/` imports, no `any`, single-line comments of at most 50 characters.
  - Motion through Motion only, and only where a lobby step already animates.
- **Verification:**
  - `npm test`, `npm run lint`, `npm run build`.
  - **Mock (3100), at 1440, 390 and 360:**
    - **Create:** on `/play` with filters set, Create room → the waiting gate shows a code, the filters and "Closes in"; Copy code and Copy link put the right text on the clipboard; the scripted friend joins → "Playing your room" → the duel plays.
    - **Join:** a valid code in the box → Join → "Playing Rival's room" → the duel. The box uppercases, drops spaces, and keeps Join disabled until 6 valid characters.
    - **Link:** opening `/play/duel?room=K7QM2X` signed out creates a guest and joins.
    - **Errors:** each `?scenario=` shows its message and Back to play keeps the filters and the code.
    - **Expiry:** `room-expires` → "No one joined" → Create a new room gives a new code.
    - **Cancel:** back to `/play`, filters kept.
    - **Result:** a room game ends with New room (a new code, same filters) and Back to play; no "Find a new opponent".
    - **Profile:** a room game's history row reads "Duel · vs friend".
    - **The queue is unchanged:** Find an opponent still queues, flips and plays as before.
  - **Real mode before R6:** the queue duel still works (the defaults parse today's payloads); Create room and Join show an error, nothing hangs.
