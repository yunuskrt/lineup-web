# Phase W06c — Mock Duel Adapter

## Status

Completed

## Goals

- Create `src/lib/api/mock/emitter.ts`, a small typed event emitter over `DuelEventMap`:
  - `on<E>(event, handler): Unsubscribe` and an internal `emit<E>(event, payload)`.
  - No dependency, no `EventTarget` — a `Map<DuelEvent, Set<handler>>` is enough and keeps it testable in Node.
- Create `src/lib/api/mock/duel-client.ts`, implementing `DuelClient` over the W06a engine:
  - `connect` / `disconnect` — resolve immediately; `disconnect` clears all subscriptions and any pending timers.
  - `enterQueue` → emits `queued`, then after a short scripted delay either `paired` or, on the timeout path, `queueTimedOut`.
  - `submitFilters` → emits `filtersUpdated` as each side submits, then `coinFlip` naming the winner, then `matchReady` with the resolved `DuelSession`.
  - `guess` → acks receipt only, then emits `guessResolved`, plus `playerRevealed` and `roundStarted` when the answer was new (HC 10).
  - `forfeit` → emits `finished` with `isForfeit: true`.
  - Round expiry emits `lifeLost` and `roundStarted` for the next turn; the terminal states emit `finished`.
- Build the **simulated opponent** as scripted behaviour, not intelligence:
  - A configurable think-time and hit-rate, driving the opponent's turn off the same engine and the same shared found-pool.
  - Deterministic under test: the random draw and the clock are injected, never read internally, so a seeded run replays exactly.
- Create `src/lib/api/mock/scenarios.ts`, the named situations W22–W25 have to render and cannot reach by playing:
  - `opponentDisconnects` → `opponentConnection` with a real `reconnectDeadline`, then either recovery or `finished` as a forfeit.
  - `youDisconnect` → `disconnected` with your clock still running.
  - `queueTimeout`, `drawOnEleven`, `rateLimited`, `protocolRefused`.
  - Selected by a dev-only mechanism, not by a query string here — the `?state=` override is W16's job and should consume these rather than reinvent them.
- Register the duel adapter alongside the REST one in `src/lib/api/register.ts`, behind the same `API_MODE`.
- Add `src/lib/api/mock/duel-client.test.ts` using Vitest fake timers, driven **only through the `DuelClient` interface**:
  - A full duel to a win, and one to a loss.
  - A draw when all eleven are named — asserting the outcome is `draw` and that lives are **not** a tiebreak (HC 18).
  - A forfeit win via `forfeit()` and via the reconnect window closing.
  - `queueTimedOut` firing on the timeout path.
  - Event-order assertions for a correct-and-new guess: `guessResolved` → `playerRevealed` → `roundStarted`, with the turn flipped.
  - A named case asserting no emitted payload carries an unrevealed player (HC 2).

## Notes

- Scope: the realtime half of the mock. Out of scope:
  - Real Socket.IO, reconnect/backoff policy and `PROTOCOL_VERSION` → W30.
  - The Zustand store and how events reduce into it → W23.
  - Duel UI of any kind → W22/W23.
  - Real fixtures → W07.
- **This is the phase that decides whether the duel screens are buildable.** W22 and W23 are written against these events and nothing else, so an event this adapter never emits is a state those screens will never render. The `theme.md` § Duel and § Lobby tables are the checklist — if a row there has no path through this adapter, the adapter is incomplete, not the design.
- **Scripted, not smart.** The opponent exists to produce believable event sequences and timing pressure. Any effort spent making it play well is effort not spent on the screens, and it is thrown away the moment a real opponent connects at W31.
- **Determinism is a requirement, not a nicety.** Injected clock and injected randomness are what make a duel test assert an exact event order. A test that sometimes passes is worse here than no test, because the sequences it covers are the ones that are hardest to reproduce by hand.
- **Scenarios are the reason the error states will exist at all.** `theme.md` § States is explicit that every state must be reachable in dev without playing a real game — build the seam now or half these states ship unseen.
- Depends on: W06a (engine, clock, seed), W06b (`register.ts`, store, identity), W05b (`DuelClient`, `DuelEventMap`).
- Constraints:
  - **The squad is never sent to the client** (HC 2). `DuelSession.found` carries revealed players only, in both directions, and the draw case is the one point all eleven are legitimately present.
  - **Server owns the timer, lives and turn order** (HC 1, 11). The adapter *is* the stand-in server, so it owns them — and the interface still never lets a caller assert expiry.
  - **Exactly 3 lives each, lost only to the clock** (HC 9); **all eleven named is a draw** with no tiebreak (HC 18); **filters are a coin flip**, applied whole, winner named (HC 19).
  - **Never fail silently on a game action.** A rejected guess emits `error` with a real `ApiError`; the input must never simply go quiet.
  - Nothing under `src/lib/api/mock/` may be imported by a component, hook or route.
  - No `any`; `@/` imports only; no `socket.io-client` dependency in this phase either.
- **State trace — the acceptance test for this phase.** Every `theme.md` § Duel and § Lobby row, and the duel-reachable § System rows, mapped to what produces it:

  | `theme.md` row | Produced by |
  | --- | --- |
  | Your turn — idle | `roundStarted` → `RoundTiming` |
  | Your turn — warning (7s) / critical (3s) | Derived from `RoundTiming` in the component; presentation, not an event |
  | Your turn — pending | Local state between `guess()` and its ack |
  | Correct, new | `guessResolved` (`correct_new`) then `playerRevealed` |
  | Already found | `guessResolved` (`already_found`) |
  | Not in XI | `guessResolved` (`not_in_xi`) |
  | Life lost | `lifeLost` |
  | Their turn — waiting | `turnChanged` + `roundStarted` with `turn: 'opponent'` |
  | Their reveal | `playerRevealed` with `foundBy: 'opponent'` |
  | Their life lost | `lifeLost` with `who: 'opponent'` |
  | Opponent disconnected | `opponentConnection` (`reconnecting` + deadline) — scenario `opponentDisconnects`. Their expiry timer stays armed, so their clock keeps running as `theme.md` requires |
  | Opponent forfeited | `finished` (`forfeit_win`) — scenarios `opponentDisconnects` (after the window) and `opponentForfeits` (immediate) |
  | Win / loss | `finished` (`win` / `loss`) |
  | Draw | `finished` (`draw`) — scenario `drawOnEleven` |
  | Forfeit win | `finished` (`forfeit_win`, `isForfeit: true`) |
  | Lobby — searching | `queued` |
  | Lobby — opponent found | `paired` |
  | Lobby — filters you submitted | `filtersUpdated` (`yours: 'submitted'`) |
  | Lobby — coin flip | `coinFlip`, winner named |
  | Lobby — match retrieved | `matchReady` |
  | Lobby — no opponent | `queueTimedOut` — scenario `queueTimeout` |
  | Lobby — cancelled | `leaveQueue()` ack |
  | System — protocol refused | `connect()` → `forbidden` — scenario `protocolRefused` |
  | System — you reconnecting | `disconnected` + deadline — scenario `youDisconnect` |
  | System — connection lost | `finished` as a forfeit |
  | System — rate limited | `error` + failed ack — scenario `rateLimited` |

  **One gap, recorded rather than closed:** § System "Empty filter result" has no duel path. The coin flip applies one player's filters whole, and this adapter never checks the winning set against the pool, so a duel cannot reach an empty pool. The REST adapter covers `empty_pool` for solo. **The real backend must decide what a duel does when the winning filters match nothing — raise at B38.**

- **Deviations recorded during implementation:**
  - **`turnChanged` is emitted between `playerRevealed` and `roundStarted`**, so the asserted sequence is four events, not the three the spec named. Dropping it would have made a contract event dead; emitting it keeps the contract honest. It remains redundant with `roundStarted` — **the removal proposal for B39 now covers `turnChanged` as well as the `connectionChanged` rename.**
  - **Command rejections return `fail`; they do not also emit `error`.** Double-signalling one failure would have the screen render it twice. `error` is emitted only for the `rateLimited` scenario, which models a server-side rejection arriving after the ack — which is the case W25's rate-limit screen actually needs.
  - **`forfeit()` produces `outcome: 'loss'` with `isForfeit: true`.** The spec said only "`isForfeit: true`". You leaving is your loss; the opponent leaving is your `forfeit_win`. Both paths are tested.
  - **Scenarios are a factory option, not a runtime setter.** `DuelClient` has no method to select one and adding one would break the interface for the real client. W16 constructs a client with a scenario instead.
  - **Added an `opponentForfeits` scenario** beyond the spec's list — `opponentDisconnects` only reaches the terminal after a 20s window, and the "Opponent left" result card needs a direct path.
  - **`foundWithActor` restored to `engine.ts`**, as W06a's deviation note said it would be.
  - **`sessionId` is the constant `duel-1`** — one duel per client instance, and the mock has no matchmaking service to allocate ids.
  - **The Pro tier override is still unaddressed.** W06b noted it belonged with these scenarios, but on implementation the duel client holds no identity at all — tier lives in the REST adapter's store. **It belongs in `createMockApiClient` options, and W21 needs it before the Pro summary view can be built.**
  - **A guess landing after the deadline charged the life silently** (found in the combined review — a real desync bug). The engine returned `expired`, but the adapter emitted `guessResolved: not_in_xi`, emitted no `lifeLost`, and skipped the terminal check, so the client showed three lives while the authoritative state held two — and a duel could continue past zero. `guess()` now settles the expiry first, exactly as the REST adapter does, so `lifeLost` fires, the terminal check runs, and the late guess returns `forbidden` because the turn has moved. Regression test: "charges the life when a guess lands after the deadline".
  - **`toGuessResult` can no longer lie.** It accepts only the three outcomes the contract can express; `isGuessable` narrows, and passing `expired` or `ignored` is now a type error rather than a silent `not_in_xi`.
  - **Shared helpers extracted to `src/lib/api/mock/shared.ts`** — `ok`, `fail`, `ACK`, `maskedMatchFor` and `toGuessResult` existed twice, once per adapter. That duplication is the direct cause of the bug above: the REST adapter ticked first and the duel adapter did not.
  - **`SEED_MASKED_MATCH` replaced by `SEED_FORMATION`.** The export was dead — both adapters built their own masked match, each with its own `'4-4-2'` literal.
- Verification:
  - `npm test` passes, fake timers throughout, every case above named and asserting real sequences.
  - Two consecutive runs of the duel suite produce identical event orders — determinism proven, not assumed.
  - `npm run lint`, `npm run format:check`, `npx tsc --noEmit` and `npm run build` all pass.
  - Every row of `theme.md` § Duel (your turn / their turn / terminal) and § Lobby is traced to an event this adapter emits, or to a scenario. Record the trace in this file's Notes when done — it is the acceptance test for the phase.
  - Grep confirms `socket.io` still appears nowhere in `src/` or `package.json`.

## History
