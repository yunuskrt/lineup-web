# Phase W22b — Lobby Wiring

## Status

Completed

## Goals

- Update the mock duel adapter in `src/lib/api/mock/duel-client.ts` so the server owns the coin-flip beat:
  - Add `COIN_FLIP_REVEAL_MS` (about 2,000) between `coinFlip` and `matchReady`. Today both fire in the same tick, and `matchReady` starts the first round's clock.
  - Update `duel-client.test.ts` to advance past the beat before expecting `matchReady`. Add one test asserting that no round starts during the reveal.
- Add the lobby state and events to `src/types/duel-lobby.ts`:
  - `DuelLobbyPhase`: `connecting`, `searching`, `paired`, `filters`, `coinFlip`, `ready`, `noOpponent` and `failed`.
  - The state holds `opponent`, `submission`, `coinFlip` (a `CoinFlipResult`), `session` (the `DuelSession` from `matchReady`), `isLocking` and `failure: { step, error }`.
  - Events, one per `DuelEventMap` entry the lobby reads: `queued`, `queueTimedOut`, `paired`, `filtersUpdated`, `coinFlip`, `matchReady`, `error`. Add command outcomes (`locking`, `failed`) and `searchedAgain`.
- Create `src/lib/duel-lobby.ts`, pure and tested in `src/lib/duel-lobby.test.ts`:
  - `duelLobbyReducer(state, event)` moves through the phases on server events only. `paired` moves to `paired`, and the first `filtersUpdated` or a lock moves to `filters`. `coinFlip` stores the result, `matchReady` moves to `ready`, and `queueTimedOut` moves to `noOpponent`.
  - `duelCanvasView(state, options)` builds the `DuelCanvasView`:
    - `lobby` is set from the phase through W22a's view, using `filterSummary` for your filters and for the applied set.
    - From `ready` on, `lobby` is `null`, and `match`, `you` and `opponent` come from the session. The turn comes from the session too, but no clock runs until W23.
    - `input` is locked in every lobby phase.
  - A gate action map, like `soloGateAction`: `cancel`, `lock`, `solo`, `searchAgain`, `leave` and `retry`.
- Create `src/hooks/use-duel-lobby.ts`, which drives the reducer from `getDuelClient()` and nothing else:
  - On mount:
    - It runs `useEnsureSession`, so a direct visit starts as a guest.
    - It loads the catalog through `filterOptionsQuery` and reads your filters with `filtersFromParams`.
    - Then it calls `connect()`, subscribes to the lobby events and calls `enterQueue()`. StrictMode's double effect must not queue twice.
  - `lockFilters()` calls `submitFilters(filters)` once, guarded while it's in flight.
  - `searchAgain()` re-enters the queue from `noOpponent`.
  - `leave()` calls `leaveQueue()` while searching and `disconnect()` in every case. Unmounting disconnects too, so a closed tab or back button never leaves the mock's timers running.
  - Every unsubscribe runs on cleanup.
- Create `src/components/game/DuelGame.tsx`, a client component:
  - It runs `useDuelLobby` and renders `GameCanvas` with `duelCanvasView`.
  - It maps gate actions to the hook, and the quit chip to `leave`, then back to `/play`.
  - **The paired beat:** `paired` holds for `PAIRED_BEAT_MS` (about 1,200) before the filter step shows. It's presentational, and nothing is timed during pairing, so no clock is spent.
- Update `src/app/(game)/play/duel/page.tsx`:
  - Outside production, `?state=` still renders `CanvasStatePreview`.
  - Every other visit renders `DuelGame`.
  - Retire the comment "Loading canvas until the duel loop is wired".
- **Temporary handoff until W23.** At `ready`, the canvas shows the masked match (team, side and formation, with empty slots) under a gate:
  - The title is "Match found" and the detail says whose filters were used.
  - The one action is "Back to filters", which disconnects and leaves.
  - The adapter's round runs behind it unseen. W23 replaces this gate with the loop.

## States

What the player sees on `/play/duel`, off the mock adapter. There are no snapshots here; W22a has those.

| State                   | Trigger                                  | Canvas                                                                                             |
| ----------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Connecting              | Page load                                | The loading canvas with no gate. The skeleton is the wait                                          |
| Searching               | `queued`                                 | W22a's searching gate. "Cancel" leaves the queue and returns to `/play`                            |
| Opponent found          | `paired`                                 | Both handles, held for the paired beat                                                              |
| Filters                 | The beat ends                            | Your card with "Lock in filters". Theirs shows "Choosing…"                                          |
| Filters — you submitted | `filtersUpdated` (`yours: 'submitted'`)  | Your card locks. Theirs flips to "Locked in" on their `filtersUpdated`                             |
| Coin flip               | `coinFlip`                               | The winner named, with the applied set, for the adapter's reveal beat                              |
| Match retrieved         | `matchReady`                             | The masked header and empty grid, under the temporary handoff gate                                 |
| No opponent             | `queueTimedOut`                          | "Play solo with these filters" opens `/play/solo` with the same filters. "Search again" re-queues  |
| Cancelled               | "Cancel", the quit chip or leaving       | Back to `/play?mode=duel` with the filters kept                                                    |
| Failed                  | `connect`, `enterQueue` or `submitFilters` rejects, or an `error` event arrives | A gate naming the step, with the message from `authErrorMessageOf`. `empty_pool` offers "Change filters"; anything else offers "Try again" |

## Open Questions

Defaults stand unless changed at `/feature start`.

- **Filter step:** by default your card shows the filters carried from `/play` read-only, with one "Lock in filters". Changing them means cancelling back to `/play`, before pairing. The alternatives:
  - An editable `FilterPanel` inside the lobby. It's large for a gate, and a real opponent would be waiting while you edit.
  - Auto-submitting on pairing. That drops the "you submitted" state `theme.md` names.
- **Coin-flip beat:** by default the (mock) server pauses between `coinFlip` and `matchReady`. The alternative is the client holding `matchReady` back for a beat. That spends the first player's clock on an animation, because the round starts at `matchReady`, so it's rejected. **B38 must pause the same way.**
- **Run state:** by default the lobby state lives in `useReducer` inside `useDuelLobby`, like solo. Zustand, which the project overview names for the live session store, joins at W23, where the loop's events fan out to many components. W23 decides whether the lobby moves into that store.
- **Leaving after pairing:** by default "Cancel" after pairing calls `disconnect()`, because the contract has no leave-lobby command and `leaveQueue()` only works while queued. What the opponent sees then is a backend decision. **Raise at B37/B38.**
- **Scenario states live:** by default `queueTimeout` is reached in the browser with a temporary mock patch, reverted after, as in W20 and W21. A dev-only `?scenario=` seam in `register.ts` is left to W25, which needs it for protocol refused and rate limited.

## Out of Scope

- The duel loop: rounds, turns, guesses, reveals, lives, terminal states and the result card → W23. W22b's handoff gate is a placeholder.
- Protocol refused, rate limited, connection lost and the reconnect overlay → W25. W22b surfaces their errors plainly, never silently.
- The real Socket.IO client, reconnect and `PROTOCOL_VERSION` → W30.
- Filter editing inside the lobby, unless the Open Question above changes.

## Notes

- Scope: `/play/duel` runs the lobby off the mock duel adapter, from the filters in the URL to a matched, retrieved match. W22a's panels do the drawing.
- Depends on:
  - W22a for `DuelLobbyView`, `LobbyPanel`, `filterSummary`, the wide gate and the unknown-opponent `TurnIndicator`.
  - W06c for the mock duel adapter and its event order.
  - W19 for `useEnsureSession`, `filterOptionsQuery`, `filtersFromParams`, `withMode` and `withQuery`.
  - W20 for the patterns: `apiErrorOf`, failure gates, StrictMode-safe start.
- References:
  - `DuelClient` and `DuelEventMap` in `src/lib/api/duel-client.ts`.
  - W06c's state trace in `context/features/phase-06c-mock-duel-adapter.md`, which maps each lobby row to an event.
- Constraints:
  - **No game logic in the client.** Pairing, submission status, the coin flip, the applied filters and the match all come from server events. The client never picks a winner, merges filters or starts a round.
  - **Filter conflicts are a coin flip, applied whole, and the winner is named** (HC 19).
  - **The squad never reaches the client** (HC 2). The handoff shows only the `MaskedMatch`. Nothing imports from `src/lib/api/mock/` except the adapter's own tests and `register.ts`.
  - **One route for the whole session.** Connecting, searching, filters, the flip and the handoff all render inside `/play/duel`. No step navigates until the player leaves (`project-overview.md` § Route Architecture).
  - **Never fail silently** (`coding-standards.md` § Error Handling). A rejected command and an `error` event both reach the player.
  - **Free duels are never gated.** Nothing here checks a tier.
  - Colours from tokens only, `@/` imports and comments of at most 50 characters.
- Verification:
  - `npm run lint`, `npm run format:check`, `npm test` and `npm run build` pass.
  - `duel-lobby.test.ts` covers:
    - Each phase transition from its event.
    - The first `filtersUpdated` moving to `filters`.
    - The coin flip storing the winner and the applied set.
    - `matchReady` clearing `lobby`.
    - `queueTimedOut`, then "Search again".
    - A failed lock releasing `isLocking`, and each failure step's gate title and action.
  - The adapter test proves the reveal beat and that no round starts during it.
  - In the browser, from `/play` with Duel and filters set, press "Find an opponent":
    - Searching shows no ring. The paired beat shows both handles, and the filter step follows.
    - Lock in, see their card flip to "Locked in", then the coin flip. Across several runs, see both winners, and check that "Your filters won" shows your set.
    - The handoff shows the masked match. The header's team and formation match the session, and no squad name appears.
    - "Cancel" while searching and after pairing both return to `/play?mode=duel` with the filters kept.
    - With the temporary `queueTimeout` patch, "No opponent found" appears. "Play solo with these filters" starts a solo run on the same filters, and "Search again" re-queues. Revert the patch after.
  - Signed out, visit `/play/duel?club=…` directly and check that a guest is created and the flip shows that club when you win.
  - StrictMode in dev calls `enterQueue` once per visit. Leaving and returning queues again cleanly, with no stale events from the last visit.
  - The Network tab and React DevTools show no squad data.
  - At 1440×900, 834×1194 and 390×844, nothing scrolls horizontally, and the quit chip is reachable in every phase.
- **Deviations recorded during implementation**
  - **The paired beat's timer lives in `useDuelLobby`, not `DuelGame`.** It dispatches a `filtersOpened` reducer event, which is only honoured while still `paired`. `DuelGame` stays a pure mapping from actions to the hook. A `filtersUpdated` that arrives during the beat opens the filters early.
  - **The handoff shows no turn.** The spec took the turn from the session, but a "Your turn" chip with no clock running reads as live time being spent. `turn` stays `null` until W23 wires the clock.
  - **Mock limitation: the handoff shows the session's `you`, whose handle is "You".** The mock duel adapter holds no identity (W06c), so the lobby's "Guest 1" becomes "You" at `matchReady`. The session is authoritative, and the real server sends the real handle.
  - **Event set:**
    - Added `started` (a restart that keeps the filters read), `prepared` (filters and catalog), `filtersOpened` and `error`.
    - A server `error` becomes `failed`, with the step inferred from the phase: `queue` before pairing, `match` after.
    - `searchedAgain` is `started` followed by `enterQueue`.
    - There's no `retried` event: `locking` doubles as the retry after a failed lock and returns the lobby to `filters`.
  - **Failure steps are `connect`, `queue`, `lock` and `match`.** Their titles are "Couldn't start the duel", "Couldn't join the queue", "Couldn't lock in your filters" and "Couldn't set up the match". `empty_pool` gets "No match found" with "Change filters".
  - **Added helpers, all tested:**
    - `canLockFilters(state)` and `youFrom(user)`, which uses the signed-in handle, or "You" before the session loads.
    - `DuelGateAction` (`leave` | `retry`) for the gates. The lobby's own buttons still go through W22a's `LobbyAction`.
    - The state holds `filters` and `options` from `prepared`, so the view can summarise both sets.
  - **The filter view gained an optional `isLocking`.** The button disables and reads "Locking in…" while the submission is in flight. The mock confirms instantly, but a real network won't.
  - **StrictMode and restarts:**
    - The start is deferred one tick (`setTimeout`), so StrictMode's first mount never starts. Running `useEnsureSession` twice could otherwise create two guests.
    - Each start carries a run token, and cleanup cancels it, so late replies land nowhere.
    - "Try again" (other than after a failed lock) releases everything, resubscribes and starts again. It has to, because the mock's `disconnect()` drops every handler.
  - **Leaving** awaits `leaveQueue()` while searching, then unsubscribes and disconnects, and only then navigates.
  - **`filterSummary`: an era that covers the whole catalog reads "Any season".** The mock opponent's 2000–2025 range is wider than the catalog's, and it read "2000–01 to 2025–26". One test was added.
  - **Mock:**
    - `COIN_FLIP_REVEAL_MS = 2_000`, with `beginMatch` guarded by the adapter phase.
    - Two tests: the flip holds with no `matchReady` or `roundStarted` until the beat ends, and the round's clock starts only then. A disconnect mid-flip drops the pending match.
  - **Copy:** the handoff detail is "Your filters picked this match." or "`<handle>`'s filters picked this match."
  - **Open Questions:** every default stood. The filters are read-only with "Lock in filters", the server owns the flip beat, the state stays in `useReducer`, "Cancel" after pairing disconnects, and the timeout was reached with a temporary patch.
  - **Measured on the mock:** searching, then paired at 2.0s, filters 1.2s later, the flip 1.2s after the lock, and Match found 2.0s after the flip.
  - **Temporary test aids, all reverted:**
    - An `enterQueue` log: one call per visit, under StrictMode and across five in-app returns to `/play`.
    - The `queueTimeout` scenario in `register.ts`.
    - A failure on the first `submitFilters`.
    - A failure on the first `connect`.
  - **Browser checks:**
    - Both coin-flip winners appeared across runs. "Your filters won" showed the URL's filters (a Yıldırımspor club pick), and the match came from them.
    - Cancel while searching and the quit chip after pairing both returned to `/play?…&mode=duel` with the filters kept.
    - No opponent: focus lands on "Play solo with these filters", which opened `/play/solo` on the same club. "Search again" searched again.
    - A failed lock and a failed connect each showed their titled gate, with focus on "Try again", and recovered.
    - No horizontal scroll at 1440, 834 or 390, and the quit chip was visible throughout. The console stayed clean, and `?state=` previews still render.
  - **Tests:** `duel-lobby.test.ts` (30), 2 in the mock adapter and 1 in `lobby.test.ts`, for 453 in total.
  - **Review fixes:**
    - **Bug:** unmounting cancelled only the run started on mount. A run from "Try again" kept going if you left with Back or a link while it was starting. It then connected and joined the queue on the shared adapter after the page had gone, so the next visit would get "Already in a duel". Cleanup now cancels `run.current` through a `stopLobby` effect event.
      - Checked with a temporary patch, since reverted: the first `connect` failed and later ones waited 1.5s. I pressed "Try again", went Back mid-retry, then ran "Find an opponent" again. The abandoned run never called `enterQueue`, and the new visit queued cleanly.
    - The connect-step title is now "Couldn't start the duel". That step also covers creating the guest and loading the catalog, not only `connect()`.
    - The `send` wrapper in `subscribe` is gone; the handlers call `dispatch` directly.
    - `goTo` types its mode as `PlayMode`.
  - **Tests (`/feature test`):** 4 more, for 457 in total:
    - A late `filtersUpdated` leaves the coin flip on screen.
    - Three tests drive the reducer from the real mock adapter under fake timers, wired the way the hook wires it:
      - The phases run connecting → searching → paired → filters → coinFlip → ready, with no session until the reveal ends.
      - The timeout scenario offers solo and times out again after "Search again".
      - A refused narrow submission ends on "Change filters" (`leave`).
    - The hook and components stay browser-verified, per the standards.

## History
