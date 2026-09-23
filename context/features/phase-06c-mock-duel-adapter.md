# Phase W06c — Mock Duel Adapter

## Status

Not Started

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
- Verification:
  - `npm test` passes, fake timers throughout, every case above named and asserting real sequences.
  - Two consecutive runs of the duel suite produce identical event orders — determinism proven, not assumed.
  - `npm run lint`, `npm run format:check`, `npx tsc --noEmit` and `npm run build` all pass.
  - Every row of `theme.md` § Duel (your turn / their turn / terminal) and § Lobby is traced to an event this adapter emits, or to a scenario. Record the trace in this file's Notes when done — it is the acceptance test for the phase.
  - Grep confirms `socket.io` still appears nowhere in `src/` or `package.json`.

## History
