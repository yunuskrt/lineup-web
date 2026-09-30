# Phase W25b — Connection States

## Status

Completed

## Goals

- Contract:
  - Add `'protocol_refused'` to `apiErrorCodeSchema` in `src/lib/api/schemas/result.ts`. It's what `connect()` returns when the server refuses this build (HC 8).
  - The `protocolRefused` scenario in `src/lib/api/mock/duel-client.ts` returns it instead of `forbidden`.
- Mock scenarios, in `src/lib/api/mock/scenarios.ts` and `src/lib/api/mock/duel-client.ts`:
  - `youDisconnect`:
    - 1s into the match, it emits `disconnected` with `reconnecting` and a 20s deadline, while the round clock keeps running.
    - When the window closes, it emits `disconnected` with `forfeited`, then `finish('loss', true)`.
  - A new `youReconnect` scenario emits `reconnecting` at 1s, then `connected` with a null deadline 5s later, and play goes on.
  - Both are reachable with W25a's `?scenario=`.
- Duel session, in `src/lib/duel-session.ts` and `src/types/duel-session.ts`:
  - `DuelSessionState` gains `yourConnection: ConnectionState | null` and `isConnectionLost: boolean`.
  - A new `disconnected` event, subscribed in `use-duel.ts`: `reconnecting` sets `yourConnection`, `connected` clears it, and `forfeited` sets `isConnectionLost`. The reducer ignores it outside a live match.
  - `finished` while `yourConnection` is set, or `isConnectionLost` is true, marks the result as connection lost.
  - A connect failure with `protocol_refused` goes to a new `refused` phase instead of the failed gate.
  - `canGuess` is false while reconnecting.
- Reconnect overlay, in `duelCanvasView`:
  - While `yourConnection` is `reconnecting`, the gate is:
    - Title: "Reconnecting". The title stays stable, as W15 asked.
    - Detail: "The clock keeps running. If you're not back in 18s, you forfeit the duel." The seconds come from `reconnectSecondsLeft` (W23a) and tick every 250ms.
    - No action.
  - The canvas and rail stay visible under the dim; the ring keeps sweeping (`theme.md`: "your clock shown still running"). Input is `locked`.
  - `DuelCanvasView` gains `yourConnection`, so the snapshot and the live view share it.
- Connection lost:
  - `duelResultTitle` and `duelResultDetail` in `src/lib/duel-result.ts` take `{ isConnectionLost }`. It reads "Connection lost" and "You couldn't reconnect in time, so the duel was forfeited."
  - The Forfeit tag stays. Play again and Change filters work as in W23b.
  - `DuelCanvasView.end` gains the flag through a new `endReason?: 'connectionLost'`, so `DuelResultPanel` stays presentational.
- Protocol refused, in a new `src/components/game/ProtocolRefused.tsx`:
  - A full-screen page on the game frame, not a gate: no canvas and no chrome (`design.md`).
  - The `h1` is "Update Lineup to keep playing". The detail is "This version is out of date, so the duel server turned it away. Reload to get the latest version."
  - One primary "Reload" runs `window.location.reload()`, since web deploys land on reload. "Back to Play" is a text link to `/play` with the filters kept.
  - Focus goes to the heading on mount.
  - `DuelGame` renders it when the phase is `refused`.
- Snapshots:
  - `DUEL_CANVAS_STATES` gains `you-reconnecting` (your turn, ring sweeping under the gate) and `connection-lost` (the result panel).
  - `/play/duel?state=protocol-refused` renders `ProtocolRefused` directly in dev.
  - `canvas-states.test.ts` covers the new pair.
- Tests in `duel-session.test.ts`, driven by the real mock under fake timers as in W23b:
  - Reconnecting, then connected, resumes play.
  - Reconnecting until the window closes ends as "Connection lost".
  - A guess while reconnecting is refused locally.
  - `protocol_refused` on connect gives `refused`.
  - `duel-result.test.ts` covers the new titles.

## States

From `context/theme.md` § System:

| State            | Trigger                         | Treatment                                                                                         |
| ---------------- | ------------------------------- | ------------------------------------------------------------------------------------------------- |
| Protocol refused | `connect()` → `protocol_refused` | Full-screen upgrade prompt on the game frame. "Reload" as the one action; "Back to Play" as a link |
| You reconnecting | `disconnected` → `reconnecting` | Gate over the canvas, stable title, countdown in the detail, **your clock shown still running**  |
| Connection lost  | Reconnect window closes         | Result screen, "Connection lost", marked as a forfeit                                             |

## Out of Scope

- Real socket reconnection, buffering and the `PROTOCOL_VERSION` handshake → W30. This phase renders what the server reports.
- Solo network failures. They keep W20's "Couldn't reach Lineup" gates with "Try again"; REST has no reconnect window.
- A mobile "Update in the store" variant → the mobile repo.

## Open Questions

Defaults stand unless changed at load:

- **`protocol_refused` code.** It's a web-side addition to the contract. B36 adopts it, or the refused page can't be told apart from other connect failures.
- **Connection lost is inferred.** The result carries only `isForfeit`, so the client marks "Connection lost" from the `disconnected` events it saw. Backend ask for B40: put a `forfeitReason` of `'left' | 'disconnected'` on `DuelResult`, and the inference goes away.

## Notes

- Scope: the other two system states, both duel-only, plus your own reconnect window. The duel is the only socket path.
- Depends on: W25a (`?scenario=`), W23a (`reconnectSecondsLeft`, `DuelResultPanel`, the Forfeit tag), W23b (the duel reducer and hook), W15 (`CanvasGate`), W08 (the game frame).
- Constraints:
  - **The server is authoritative.** The client never decides a forfeit. The countdown shows `reconnectDeadline`, and the loss arrives as `finished`.
  - **The ring is never stopped by an overlay**, and never by reduced motion (`theme.md` § Motion).
  - **Every socket handshake is version-checked** (HC 8). A refusal is a full-screen prompt, never a desync.
  - Tokens only, `@/` imports, single-line comments of at most 50 characters.
- Verification:
  - `npm test`.
  - In the browser, at 1440, 834 and 390:
    - `/play/duel?scenario=youReconnect`: the overlay counts down with the ring sweeping, then clears.
    - `/play/duel?scenario=youDisconnect`: it ends on "Connection lost".
    - `/play/duel?scenario=protocolRefused`: the full-screen prompt; "Reload" reloads.
    - The new `?state=` snapshots.
  - `npm run build`.
- **Deviations recorded during implementation**
  - Connection-lost copy is "Disconnected" / "You didn't reconnect in time." (user's pick). The spec's "Connection lost" and its longer detail overflowed the fixed 96px result box beside the Forfeit tag at 1440 and 390. `endReason: 'connectionLost'` keeps the state's name.
  - The gate's ticking detail is a `countdown: { deadline, label }` on `CanvasGateView`, rendered by a `GateCountdown` in `GameCanvas`. The pure view has no clock to tick with; `CanvasGate.detail` now takes a node.
  - `reconnectingGate`, `reconnectingDetail` and `RECONNECTING_TITLE` live in `system-states.ts`, so the snapshot and `duelCanvasView` share one gate. Without a deadline, the gate keeps only its title.
  - Connection lost is marked only on your own forfeit loss, and never when you forfeited yourself (`isForfeiting`), so a quit during the reconnect still reads "You left". A reconnect-time win stays a win.
  - `isYourForfeit` is exported from `duel-result.ts` for the reducer's inference.
  - `connection-lost` sits in `RESULT_STATES`, so the existing result checks cover it; `resultState` takes an optional `endReason`.
  - The `protocol-refused` dev state is handled in the duel page itself, since it isn't a canvas state.
  - Mock timings are named: `DISCONNECT_AFTER_MS` (1s) and `RECONNECT_AFTER_MS` (5s).
  - The server's `forfeited` event keeps your connection state until `finished` clears it, so the gate and the locked input hold through any gap before the result (review fix).

## History
