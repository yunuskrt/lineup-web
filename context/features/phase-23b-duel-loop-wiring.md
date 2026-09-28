# Phase W23b — Duel Loop Wiring

## Status

Completed

## Goals

- Extend the duel session state past the lobby, in `src/types/duel-lobby.ts` and `src/lib/duel-lobby.ts` (or a renamed `duel-session` pair, see Open Questions):
  - New phases: `playing` (from `matchReady`) and `finished`.
  - The state gains `isGuessing`, `toast`, `pulse`, `shakeKey`, `lifeLostKey`, `opponentConnection` and `result` (a `DuelResult`).
  - Events:
    - `roundStarted` and `turnChanged` replace the held `DuelSession`. These are the only authoritative events.
    - `guessSubmitted`, and `guessResolved` (a `GuessResult`) routed through W14's `guessFeedback` into toast, pulse or shake.
    - `guessFailed` (an `ApiError`) and `lifeLost`.
    - `opponentConnection` and `finished`.
  - `lifeLostKey` bumps only when `lifeLost.who` is `you`. Their lost life empties their pip with no screen flash (`theme.md` § Their turn).
  - `playerRevealed` is a cue, not state. The grid reads `found` from the latest session, which arrives in the same tick, so the reveal spring plays from that.
  - An `error` event while `playing` becomes a toast and unlocks the input, for example the rate limiter. It doesn't raise a failure gate. In the lobby phases, it still gates.
- Update `duelCanvasView`:
  - While `playing`:
    - `clock.round` and `turn` come from the session, which brings back the turn chip W22b held off.
    - The input is `live` on your turn, `pending` while a guess is in flight, and locked otherwise. On their turn it's hidden, with "Waiting for `<handle>`".
    - `opponentConnection` passes through.
  - At `finished`, `end` is the result and `turn` is `null`.
  - The temporary "Match found" gate is removed.
- Extend `src/hooks/use-duel-lobby.ts`, renamed to `use-duel.ts` if the Open Question lands that way:
  - It subscribes to the loop events alongside the lobby ones, under the same release rules.
  - `submitGuess(text)` goes through `prepareGuess` (W13) and then `guess({ sessionId, guess })`. One guess is in flight at a time. The input clears on `correct_new` and `already_found` only.
  - A rejected ack (`forbidden` "Wait for your turn", `session_over`, `rate_limited`) surfaces as a toast. It never fails silently.
  - `forfeit()` calls `forfeit()` once and waits for `finished`. A rejection opens a gate with "Try again".
  - `playAgain()` releases the client and runs the lobby again, on the same filters and the same route.
  - **The client never turns a 0 into a lost life.** The server pushes `lifeLost`, `turnChanged` and `roundStarted`, and the client only renders them. No sync-at-0 is needed, unlike solo.
- Update `QuitDialog` to take its copy as props, so solo keeps "Quit this run?" and duel says:
  - Title: "Forfeit this duel?"
  - Detail: "Leaving counts as a loss. Your clock keeps running while you decide."
  - Buttons: "Keep playing" (focused first) and "Forfeit".
  - In the lobby phases the chip still leaves straight away, since there's nothing to forfeit.
- Update `DuelGame`:
  - It owns the guess text and wires `onGuessSubmit`.
  - The quit chip opens the forfeit dialog while `playing`.
  - The result's "Play again" calls `playAgain` and clears the text. "Change filters" leads to `/play?mode=duel` with the filters kept.

## States

What the player sees on `/play/duel`, off the mock adapter, after the coin flip.

| State                 | Trigger                                  | Canvas                                                                                                   |
| --------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Your turn             | `matchReady`/`roundStarted`, turn `you`  | Your ring runs from the server's `endsAt`, the input is live and focused, and the turn chip shows yours  |
| Warning / critical    | 7s / 3s left                             | Ring colour shift, derived from the server timing (W10)                                                  |
| Pending               | Guess sent                               | Input locked with the spinner, ring **still sweeping**                                                   |
| Correct, new          | `guessResolved` then `turnChanged`       | Slot fills with a `turf` flash, input clears, the turn hands over (240ms)                                |
| Already found         | `already_found`                          | The existing slot pulses, the toast reads "Already named", the input clears and stays live               |
| Not in XI             | `not_in_xi`                              | The input shakes, the text stays, the toast reads "Not in this XI"                                       |
| Life lost             | `lifeLost` (`you`)                       | Pip empties, `red-card` flash 480ms, the turn passes                                                     |
| Their turn            | `roundStarted`, turn `opponent`          | Your ring dims, theirs runs in `away`, the input is hidden with "Waiting for `<handle>`"                  |
| Their reveal          | `roundStarted` with a new `opponent` find | Slot fills with the `away`-tinted `turf` flash                                                          |
| Their life lost       | `lifeLost` (`opponent`)                  | Their pip empties, no screen flash                                                                       |
| Opponent disconnected | `opponentConnection` (`reconnecting`)    | W23a's badge counting down from the server deadline. Their clock keeps running                           |
| Forfeit confirm       | Quit chip while playing                  | "Forfeit this duel?" dialog over the running canvas, one tap to cancel                                   |
| Win / loss / draw     | `finished`                               | W23a's result panel, the identity revealed, focus on the title                                           |
| Opponent left         | `finished` (`forfeit_win`)               | Win card marked as a forfeit                                                                             |

## Open Questions

Defaults stand unless changed at `/feature start`.

- **Session store:** by default the state stays in `useReducer`, extending W22b's pure reducer, which is renamed to `duel-session.ts` since it now covers the whole duel. The alternative is Zustand, which `project-overview.md` names for the live session store: "realtime events fan out to many components". Here, events reduce into one view that `DuelGame` passes down as props, so there's no fan-out yet. The pure reducer would be the store's logic either way, so a later move is mechanical. **Choose Zustand if you want the stack table honoured now.**
- **Play again:** by default it re-runs the lobby on the same filters, on the same route: searching, pairing, the flip. The alternative is a rematch against the same opponent, but FIFO matchmaking has no rematch and the contract has no such command.
- **Opponent disconnected, live:** by default this is reached with a temporary patch (the `opponentDisconnects` scenario in `register.ts`), reverted after, like W22b's timeout. The dev seam stays with W25.

## Out of Scope

- Your own reconnect overlay, "Connection lost", protocol refused and the rate-limit lockout screen → W25. W23b toasts a rate-limit rejection so it's never silent, but the designed lockout is W25's.
- The real Socket.IO client, server/client clock skew and `PROTOCOL_VERSION` → W30/W31.
- Duel history and stats → W24.

## Notes

- Scope: `/play/duel` plays a whole duel off the mock duel adapter, from the coin flip to the result: alternating 15s turns, the shared found pool, lives, both no-penalty outcomes, forfeit and every terminal state.
- Depends on: W23a (result panel, reconnect badge, `end`/`opponentConnection` on the view), W22b (the lobby reducer, hook and `DuelGame`), W14 (`guessFeedback`), W13 (`prepareGuess`), W06c (the mock duel adapter and its event order).
- References:
  - `DuelEventMap` in `src/lib/api/duel-client.ts`, and its note that only `matchReady`, `roundStarted` and `turnChanged` carry state.
  - W06c's state trace, which maps every duel row to an event or scenario.
- Constraints:
  - **The server is authoritative** (HC 1): timer, lives, turn order and validation. The client renders `RoundTiming` and never decides expiry, a lost life, a turn or an outcome.
  - **A correct, not-yet-found answer ends the turn. Already-found and not-in-XI leave the timer running and the turn unchanged** (HC 10). Already-found speaks through the grid, and not-in-XI through the input (`theme.md`).
  - **Exactly 3 lives, lost only to the clock** (HC 9). **All 11 named is a draw with no tiebreak** (HC 18).
  - **The squad never reaches the client** (HC 2). Only `found` from server events is rendered, and nothing imports from `src/lib/api/mock/` outside the API layer.
  - **Nothing purchasable affects a duel** (HC 15). No tier check anywhere in the loop.
  - **One route for the whole session**, including "Play again".
  - **Never fail silently** on a guess, an ack or an event.
  - The ring sweeps linearly and keeps running under reduced motion. `@/` imports, token colours, comments of at most 50 characters.
- Verification:
  - `npm run lint`, `npm run format:check`, `npm test` and `npm run build` pass.
  - Reducer tests cover:
    - Each loop event.
    - The flash only for your lost life.
    - Pending on and off.
    - Each guess outcome's view keys.
    - A late event after `finished` being ignored.
    - `error` as a toast while playing.
    - The turn and clock from the session.
  - Drive tests against the mock adapter (fake timers, wired as the hook wires it) cover: a win, a loss, the `drawOnEleven` draw with lives untouched, your forfeit, and the opponent's forfeit via the reconnect window.
  - In the browser, from `/play` through the lobby into a full duel:
    - Name a correct player and see the handover. Try a repeat and a made-up name, and tell apart the grid pulse and the input shake.
    - Let your clock run out, and see exactly one flash and one pip.
    - Watch their turn in blue, with the input hidden.
    - Play to a result both ways. Forfeit through the dialog, where "Keep playing" and Esc cancel.
    - "Play again" queues on the same filters.
  - With temporary patches, reverted after:
    - The `drawOnEleven` scenario reaches the draw card.
    - The `opponentDisconnects` scenario shows the badge counting down, then "Opponent left".
  - StrictMode subscribes once. Leaving mid-duel disconnects, and no events arrive after the page is gone.
  - At 1440×900, 834×1194 and 390×844: no horizontal scroll, and the quit chip is reachable.
- **Deviations recorded during implementation**
  - **Open Questions:** every default stood. The state stays in `useReducer`; Play again re-runs the lobby; the scenarios were reached with temporary patches.
  - **Renames, as the default said:**
    - `duel-lobby.ts` (and its test) became `duel-session.ts`, and `use-duel-lobby.ts` became `use-duel.ts`.
    - The session types moved to a new `src/types/duel-session.ts`: `DuelSessionState`, `DuelSessionEvent`, `DuelSessionPhase`, `DuelFailureStep`, `DuelFailure` and `DuelGateAction`.
    - `src/types/duel-lobby.ts` keeps only W22a's view types.
    - The reducer is `duelSessionReducer`, starting from `INITIAL_DUEL_SESSION`, and the hook is `useDuel`.
  - **`ready` became `playing`,** and the handoff copy (`matchFound`, `backToFilters`) left `DUEL_GATE_COPY`.
  - **Clearing the input is a `clearKey`.** The verdict arrives as a `guessResolved` event, not from the guess ack, so the reducer bumps `clearKey` when the feedback says to clear. `DuelGame` clears its text when the key changes, adjusting state during render as `Lives` does.
  - **Event payloads:**
    - `lifeLost` carries the `cue`, and `opponentConnection` carries the `connection`.
    - `connected` and `forfeited` both clear the badge; `finished` follows a forfeit.
  - **Match events are gated by `isLive`** (a session and no result yet). Anything after `finished` leaves the state untouched, and a test asserts it.
  - **Added, all tested:**
    - `canGuess` and `canForfeit`.
    - An `isForfeiting` flag that locks the input while the forfeit is in flight.
    - A `forfeit` failure step: "Couldn't forfeit the duel" with "Try again", with the match still held underneath.
    - A `handover` that ends any guess still in flight.
    - `restart()` in the hook, shared by `retry` and `playAgain`.
  - **`QuitDialog` takes a `copy` prop.** `SOLO_QUIT_COPY` is the default, so solo is unchanged. `DUEL_FORFEIT_COPY` has a "Forfeiting…" pending label beside the spec's lines.
  - **CountdownRing fix (W10).** A stopped ring read the clock only once, ever. After a handover the waiting ring kept its last number: your ring still read "3" through their turn, and theirs "9" through yours. It now re-reads whenever it's handed a new round, so a handed-over ring resets to a dimmed 15, as `theme.md` says ("Freezes, then resets on handover"). The frozen state keeps the same round object, so it still holds.
  - **Mock limitation, as in W22b:** your handle reads "You" once the match starts, because the mock duel adapter holds no identity.
  - **Temporary test aids, both reverted:** the `drawOnEleven` and `opponentDisconnects` scenarios in `register.ts`.
  - **Browser checks:**
    - A full duel as FC Weerdam, with Yıldırımspor as the club filter:
      - "Nobody Anybody" shook the input, kept the text and toasted "Not in this XI".
      - A correct name filled the slot and handed the turn over: "Their turn.", "Waiting for Rival", the input hidden.
      - Their reveal tinted blue.
      - A repeat pulsed the slot, cleared the input and toasted "Already named".
    - My clock running out took me to 2 lives, handed the turn over and reset my ring to 15.
    - A loss showed "Yıldırımspor 2–1 FC Weerdam, The Rain Final".
    - The forfeit dialog focused "Keep playing", and Esc and "Keep playing" both cancelled. "Forfeit" ended on "You left", with focus on the title and the quit chip gone.
    - Play again searched again on the same URL, and Change filters led to `/play?club=…&mode=duel`.
    - Draw patch: "Draw" with 11/11 and both players on 3 lives.
    - Disconnect patch: the badge counted down from 20s, the announcement changed at the handover, and "Opponent left" came at about 21s.
    - No horizontal scroll at 834 and 390, the quit chip was visible, and the console was clean. The solo quit dialog still reads "Quit this run?" and "Quit run".
  - **Tests:** `duel-session.test.ts` has 55. Among them:
    - Every loop event.
    - The flash only for your lost life.
    - Pending on and off, and each outcome's view keys.
    - A mid-match `error` as a toast.
    - Late events ignored after the result.
    - Forfeit and its failure.
    - Drive tests against the mock: a win after three of their expiries, a loss after three of yours, a miss-then-correct handover, the draw with lives untouched, your forfeit, and their reconnect ending in a forfeit win.
    - That makes 503 in total.
  - **Review fixes:**
    - **Bug: "Forfeiting…" never showed.** The dialog stayed open only while `canForfeit` held, and that turns false the moment the forfeit is in flight. So the dialog closed on click, focus jumped back to the quit chip, and on a real network the only sign was a locked input. The new `canConfirmForfeit(state)` (playing and live) keeps the dialog open through the pending forfeit; the result or a failure closes it.
    - **Bug: a retried forfeit stayed stuck in `failed`.** "Try again" cleared the gate but left the phase `failed`, which kept the input locked and made the quit chip leave instead of confirming. `forfeiting` during a live match now returns the phase to `playing`.
    - **Exhaustiveness:** `lobbyReducer` takes a typed `LobbyEvent` subset, and the main reducer lists every lobby event and ends in a `never` check, so an unhandled new event is a type error again.
    - **Checked with a temporary patch, since reverted:** the first forfeit failed and later ones waited 1.5s.
      - The first forfeit showed "Couldn't forfeit the duel", and "Try again" returned to the match with the input locked, then "You left".
      - On the next duel the dialog stayed open reading "Forfeiting…" with both buttons disabled, then closed on "You left" with focus on the title.
    - Two tests added (the confirm staying open while pending, and the retry resuming play), for 505 in total.
    - **Known and left:** a rate-limited guess toasts twice (the `error` event and the failed ack). W06c double-signals that scenario on purpose, and the second toast replaces the first. The designed lockout is W25's.
  - **Tests (`/feature test`):** 5 more, for 510 in total:
    - A `forfeited` connection clears the badge.
    - No guess is allowed while one is pending or a forfeit is in flight.
    - A forfeit started during the lobby leaves the lobby phase alone.
    - Two tests drive the reducer from the real mock adapter:
      - A guess made on their turn ends on the adapter's "Wait for your turn." toast, with the input unlocked.
      - The `rateLimited` scenario toasts "Try again in 2 seconds" and keeps the match `playing` with the input live, with no failure gate.
    - `CountdownRing`, `QuitDialog`, the hook and `DuelGame` stay browser-verified, per the standards.

## History
