# Private Rooms B: Real Rooms over the Socket

## Status

Completed

## Goals

- **Real private rooms on the backend's R6**, on top of Private Rooms A.
  - **Needs:** backend R6a (`e7a722b`, rooms) and R6b (`0542a71`, history `isPrivate`) on `main`, both done 2026-11-08, and Private Rooms A merged (`63a879a`).
- **Transcribe what the backend built.**
  - Read R6's Built note in `context/docs/backend-requests.md` and the backend's `context/api-contract.md`.
  - Check A's transcription against it: the three commands, `roomCreated`, `roomExpired`, `RoomState`, `RoomExpiry`, `CoinFlipResult.source`, history `isPrivate`, and the code alphabet.
  - Change anything that differs, and record it as a deviation.
- **Drop A's temporary defaults.** `coinFlip.source` and history `isPrivate` become required, as the backend always sends them now.
- **Line A up with what R6 built** (`context/docs/backend-requests.md` § R6 › Built):
  - **A full room answers `not_found`, not `forbidden`.** The `not_found` copy covers it: "No open room has that code. It may have closed or filled up; ask your friend for a new one." The mock's `roomFull` scenario answers `not_found` too, and the `room-full` snapshot follows.
  - **`forbidden` on join** now means only your own room, or you're queued, hosting or in a duel; the server's message stays.
  - **`room:create` is rate-limited too** (10 a minute, like `room:join`): a rate-limited create shows the same cooldown on its gate.
  - **Codes in any case** are accepted by the backend; the web keeps uppercasing what it sends, so nothing changes. Record it.
- **Errors as the backend sends them.** Map each `room:create` and `room:join` refusal to A's messages: `not_found` (wrong, expired, left or full), `forbidden` (own room, queued, hosting, in a duel), `invalid_input`, `empty_pool` + `emptyBecause` on create, and `rate_limited` + `retryAfterMs` on both.
  - **A rate-limited join** shows the existing cooldown treatment ("Try again in 4s") on the join gate, never a silent stop.
  - **`empty_pool` on create** goes back to `/play` with the existing widen treatment (W25a), naming the filter to widen.
- **The creator's connection.** If the creator's socket drops while waiting, the room is gone (R6). The waiting gate shows "Your room closed when the connection dropped" with Create a new room, never a code nobody can use.
- **Docs:**
  - **`context/docs/contract.md` § 5:** matches what was built.
  - **`context/docs/backend-requests.md`:** mark R6 Done, with anything the real-mode check finds.

## Out of Scope

- Anything in A's UI, unless the real backend shows a problem. Record it as a deviation, or open a fix.
- Rematch, Pro gating, mobile.

## Open Questions

Defaults stand unless changed at load:

- **None yet.** Anything R6's Built note changes from the request is decided at load.

## Notes

- **Source:** the split decided with the user (2026-11-08). A builds rooms on the mock; B wires them once backend R6 exists.
- **Deviations recorded during implementation:**
  - **Transcription:** A matched R6 exactly (alphabet, length, `RoomState`, `RoomExpiry`, `RoomJoinRequest`, `CoinFlipSource`, history `isPrivate`). Only the two defaults were dropped.
  - **Full room:** the `not_found` copy now reads "No open room has that code. It may have closed or filled up; ask your friend for a new one."; the mock's `roomFull` scenario and the `room-full` snapshot answer `not_found`.
  - **Rate-limited create and join** needed no new code: A's shared cooldown gate already covers both steps. Tests added.
  - **The creator's dropped connection** was built in A; B only checks it, and the live check wasn't possible (see below).
  - **`empty_pool` on create keeps A's in-place widen** on the room's gate (the same pattern as a refused lock), not a return to `/play`.
  - **Own code in a second tab** answers `not_found`, not "your own room": one connection per user, so the second tab takes over and the room closes. The `forbidden` copy stays for any other way it's reached.
  - **Not checked live:** expiry (the backend's `ROOM_WAIT_MS` is a constant, 10 minutes, with no env override), the rate limits (`RATE_LIMITS_ENABLED` off on the dev backend), and a real creator drop (Chromium's offline mode keeps an open WebSocket). Each is covered by unit tests.
- **Verification:**
  - `npm test`, `npm run lint`, `npm run build`.
  - **Real mode (3000 against 8080), two browsers (or a normal and a private window):**
    - **Create and join by code:** A creates a room → B types the code on `/play` → both see the room beat with A's filters → the duel plays to a result. B names first (or as R6 decided).
    - **Join by link:** A's Copy link opened in B, signed out → a guest is created and joins.
    - **Errors:** a wrong code → `not_found`; A's own code in A → own room; a third window joining a full room → `not_found`, with the "closed or filled up" copy.
    - **Leaving:** A cancels → B's join with that code is `not_found`. A closes the tab while waiting → the room is gone.
    - **Expiry:** with the backend's room wait shortened for the test (its injectable constant), the creator gets "No one joined".
    - **History:** both players' profile history shows the game as "Friend" (A's tag; the row has no room for "Duel · vs friend"); a queue duel shows "Duel".
    - **The queue is unchanged:** Find an opponent pairs two browsers, flips and plays as before.
    - **Rate limit:** a burst of joins with wrong codes shows the cooldown, then works again.
