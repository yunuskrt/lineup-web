# Phase W31b — Duel Reconnect

## Status

Not Started

## Goals

- **The adapter reports its own transport.**
  - **`DuelClient.onConnection(handler: (status: 'dropped' | 'restored') => void): Unsubscribe`**, for a drop Socket.IO will retry, and for the reconnect that follows.
  - **Socket** (`src/lib/api/socket/duel-client.ts`):
    - `dropped` on a `disconnect` whose reason is a network drop. Not `io server disconnect` (a takeover, which W30 closes), and not `io client disconnect`.
    - `restored` on every `connect` after the first.
    - The server never sends your own `reconnecting` (handoff §6), so this is the only source.
  - **Mock:**
    - The `youDisconnect` and `youReconnect` scenarios fire `dropped` and `restored` instead of the server-style `disconnected` `reconnecting`, which the real server never sends.
    - `youReconnect` then sends `disconnected` `connected` and `matchReady`, as the server does on a return.
- **Your reconnecting state, mid-duel.**
  - `dropped` while live sets `yourConnection` to `reconnecting`, with a deadline of `serverClock.now() + RECONNECT_WINDOW_MS`.
  - `RECONNECT_WINDOW_MS` is 20 000, the server's window (handoff §7). The deadline is presentation only.
  - W25b's overlay shows it, with the countdown to forfeit and your clock still running.
  - The server's `disconnected` `connected`, then `matchReady`, clear it.
- **No resume means the duel is over.**
  - On `restored` while live, wait `RESUME_WAIT_MS` for `matchReady`; the server sends it straight after the handshake.
  - If none comes, the duel ended while you were away: the window closed, or the clock finished it.
  - Read the result from `GET /profile/history`: the newest entry whose `match.id` is this duel's.
  - Show it as Open Questions 1 decides, with **Play again**.
  - If no entry matches, say the duel ended and offer Play again. The backend saves a duel about 100 ms after `finished`, so read once more after a short wait before giving up.
- **Try again after a mid-duel close resumes, never queues.**
  - "Duel connection closed" from a network give-up while live is W30's `connection` step.
  - Its Try again reconnects **without** `queue:enter`, then waits for `matchReady` as above.
  - A takeover's Try again does the same, since the server hands a duel in play to the newest socket.
- **A drop in the lobby** (Open Questions 2):
  - **Searching:** the server dropped you from the queue. On `restored`, enter the queue again; the `queued` event resets the search.
  - **Paired, filters or the flip:** the server ended the room and told only the opponent. On `restored`, show the called-off gate from W31a, whose action searches again.
- **Tests:**
  - **Socket client** (`socket/duel-client.test.ts`):
    - a network drop reports `dropped`, then `restored` on reconnect
    - a takeover or `disconnect()` reports neither
  - **`duel-session.test.ts`:**
    - `dropped` while live sets the deadline
    - `dropped` in the lobby changes nothing until `restored`
    - `restored` in each lobby phase
    - a `matchReady` within the wait clears the overlay
    - the ended-away state from a history entry, and from none
  - **The resume wait** in `use-duel`: no `queue:enter` on a resume, and the ended-away state after the wait.
  - **Mock:** `youReconnect` sends `dropped`, `restored`, `disconnected` `connected`, then `matchReady`.
- **Docs:** `context/docs/mock-to-backend-map.md` marks your own reconnect live from W31b.

## States after W31b

| Situation | Screen |
| --- | --- |
| Your connection drops mid-duel | Overlay: "Reconnecting", a 20 s countdown, your clock still running |
| It comes back within 20 s | The overlay clears; the duel goes on from the server's state |
| It comes back after 20 s | The ended-away state (Open Questions 1) |
| It never comes back | "Duel connection closed"; Try again resumes or shows the ended-away state |
| A drop while searching | Silent; the search starts again on reconnect |
| A drop during filters or the flip | "The match was called off", with Search again |

## Open Questions

To settle at `/feature load`.

1. **A duel that ended while you were away.** History has the outcome, the match, the found count and your lives, but not the found players or the opponent's lives.
   - **Recommended: a gate, "The duel ended while you were away".** It names the outcome from history ("You lost", "You won") and offers **Play again**, with the profile as the quieter link. It shows only what the server said.
   - **Rebuild the result card** from history plus the last state seen. It looks complete, but the found pool and the opponent's lives may be stale. `theme.md` says state is server-pushed, never inferred.
2. **A drop in the lobby.**
   - **Recommended: as in the goals.** Searching re-enters the queue silently; later phases show the called-off gate.
   - **Show a gate for every lobby drop.** It's simpler, but a two-second blip while searching would stop the search.

## Out of Scope

- **A local "offline" banner** outside the duel route.
- **Changing Socket.IO's attempts.** W30's 5 attempts take about 20 s, close to the window. If the browser run shows they end well before it, tune them and record the value.
- **Duel analytics events:** W33.

## Notes

- Scope: your own connection during a duel and after one, on top of W31a. Nothing here changes a payload.
- Depends on: W31a (the authoritative `matchReady`, the called-off gate), W30 (`onClose`, the reconnect policy), W25b (the reconnecting overlay, the `connectionLost` result), W32 (`getHistory`).
- **Backend context:** `context/docs/w31-duel-handoff.md`, mainly §6:
  - "The server never sends your own `disconnected` `reconnecting`." The web shows it from Socket.IO's own events.
  - "Coming back after the window, or after the duel ended while you were away: there is no `matchReady` and no replay." The result is read from `GET /profile/history`.
  - "Skip the automatic `queue:enter` on a resumed connection."
- **What the backend does on a drop** (`duel.gateway.ts`, `matchmaking.service.ts` at `f056b66`):
  - A queued player is dropped from the queue.
  - A pre-match room ends, and only the other player is told.
  - A duel in play keeps its clock, and the seat waits 20 s.
- **Mid-duel reconnects (`theme.md` § System):**
  - "You reconnecting": an overlay, the countdown to forfeit, and your clock shown still running.
  - "Connection lost": the result, marked as a forfeit. W25b built this for the mock. In real mode a lost connection can't receive the result, so the ended-away state reads it from history once the player is back.
- Constraints:
  - **No game logic in the client.** The 20 s countdown is presentation. The server decides the forfeit; the web never ends a duel itself.
  - **Never invent state.** The overlay rests on a real transport drop. The result after a return comes only from the server, through history.
  - **Never fail silently.** A drop, a called-off room and an ended duel each get a screen that says so.
  - No `any`; `@/` imports; single-line comments of at most 50 characters; no hardcoded colours.
- Verification:
  - `npm test`, `npm run lint`, `npm run format:check` and `npm run build` pass.
  - **Real mode,** two identities (a normal window and an Incognito window).
    - **Drop mid-duel:** DevTools → Network → Offline in one window. It shows the overlay and countdown; the other shows the `ember` chip. Online within 20 s: both clear and play goes on.
    - **Check first that Offline closes an open WebSocket** in this Chrome; older versions left it open. If it doesn't, find another way to cut one window's connection and record it.
    - **Away too long:** Offline for over 20 s, then Online. The dropped window shows the ended-away state with "You lost"; the other shows the forfeit win.
    - **Backend restart mid-duel:** the in-memory duel is gone. Both windows reconnect, get no `matchReady`, and show the ended state. Record what history shows here: a duel the server never finished has no entry.
    - **Drop while searching:** Offline, then Online. The search goes on, and a second player can still pair.
    - **Drop during filters:** the dropped window shows the called-off gate; the other shows "Your opponent left."
  - **Mock mode:** `?scenario=youDisconnect` and `?scenario=youReconnect`.
  - **Manual testing:** one guide for W31a and W31b together, `context/docs/w31-manual-testing.md`, written after this phase with `/feature manual`. It covers W31a's two-player flows (pairing, play, endings, reload, opponent leaving, rate limits, profile) as well as this phase's reconnects.

## History
