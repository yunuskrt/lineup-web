# Phase W05b — Duel Transport Contract

## Status

Completed

## Goals

- Create `src/lib/api/schemas/duel.ts`, covering every state `theme.md` § Duel and § Lobby name:
  - `duelPlayerSchema`: `{ id, handle, lives: Lives }`. The duel screen addresses the two players as `you` and `opponent`, never by index, because confusing them is the worst failure the UI can have.
  - `duelPhaseSchema`: `'queued' | 'paired' | 'filters' | 'match_ready' | 'playing' | 'finished'`. One route holds the whole session, so the phase is data, not a route segment.
  - `queueStateSchema`: `{ phase: 'queued', since: number }` and `pairedStateSchema`: `{ phase: 'paired', opponent: DuelPlayer }`.
  - `filterSubmissionSchema`: `{ yours: 'pending' | 'submitted', theirs: 'pending' | 'submitted' }`.
  - `coinFlipResultSchema`: `{ winner: 'you' | 'opponent', filters: Filters }`. The winner is named explicitly — without it the player whose filters lost assumes the app ignored them (HC 19).
  - `duelFoundPlayerSchema`: `RevealedPlayer` plus `foundBy: 'you' | 'opponent'`, which is what tints the slot.
  - `duelSessionSchema`: `{ sessionId, match: MaskedMatch, you: DuelPlayer, opponent: DuelPlayer, turn: 'you' | 'opponent', round: RoundTiming, found: DuelFoundPlayer[] }` — the one shape the duel screen renders, returned whole on every state change.
  - `opponentConnectionSchema`: `{ status: 'connected' | 'reconnecting' | 'forfeited', reconnectDeadline: number | null }`. The deadline is a server timestamp, so the client can say "Reconnecting, 18s" while making clear their clock keeps running.
  - `duelResultSchema`: `{ outcome: DuelOutcome, match: MatchIdentity, found: DuelFoundPlayer[], you: DuelPlayer, opponent: DuelPlayer, isForfeit: boolean }`. A loss reveals the full match identity too — never hide the answers from the loser.
  - `duelGuessRequestSchema`: `{ sessionId, guess: string }`, trimmed and length-bounded. Nothing normalized client-side.
- Add `src/types/duel.ts` with the matching `z.infer` types.
- Create `src/lib/api/duel-client.ts`, the transport interface — signatures only, no implementation and **no `socket.io-client` import**:
  - `DuelEventMap`, the server-pushed events the screen subscribes to: `queued`, `paired`, `filtersUpdated`, `coinFlip`, `matchReady`, `roundStarted`, `guessResolved`, `playerRevealed`, `lifeLost`, `turnChanged`, `opponentConnection`, `finished`, `disconnected`, `error`. Each carries exactly one payload type from `duel.ts` or `ApiError`.
  - `DuelClient`: `connect()`, `disconnect()`, `enterQueue()`, `leaveQueue()`, `submitFilters(filters)`, `guess(request)`, `forfeit()`, and `on<E>(event, handler): Unsubscribe` — a typed subscription returning its own unsubscribe function.
  - Commands that expect a server acknowledgement return `Promise<ApiResult<void>>` using W05a's envelope; everything else about the game arrives as an event. **No command returns game state directly** — state comes from the server's push, so there is one path into the store and no chance of two disagreeing.
  - `getDuelClient()` / `setDuelClient(client)`, matching the accessor pair in `src/lib/api/client.ts` and throwing until an adapter registers.

## Notes

- Scope: the realtime half of the contract. Out of scope:
  - Any implementation — the faked duel is W22/W23, the real Socket.IO client is W30.
  - The Zustand session store and how events reduce into it → W23.
  - Countdown rendering from `RoundTiming` → W10.
  - `PROTOCOL_VERSION` and the handshake → W30, with the refused-protocol screen at W25. Leave a single named seam in `connect()` for it rather than inventing the constant now.
  - Reconnect and backoff policy → W30.
- **Why this is separate from `ApiClient`.** REST is request/response and duel is server-push; folding a socket into a promise-per-call interface would mean either polling or a fake request for every event. Keeping them as two interfaces also means W30 can swap the transport without touching solo, auth or profile.
- **Why the interface is transport-agnostic.** Nothing here names Socket.IO. W22/W23 implement `DuelClient` over timers and local state to build the screens before the backend exists, and W30 implements the same interface over a real socket. If the interface leaked socket types, the mock would have to fake a socket.
- **This resolves the deferral in W02b**, which pushed duel-specific payloads (turn owner, `foundBy`, opponent state, coin flip) to W22/W23. They land here instead, because W06's adapter needs something to implement and the shapes are contract, not screen detail.
- **Still a provisional transcription.** Socket payloads are not covered by OpenAPI and are maintained by hand in each repo — `coding-standards.md` names them the most likely thing to drift, which is exactly what `PROTOCOL_VERSION` exists to catch at W30.
- Depends on: W05a (`ApiResult`, `ApiError`) and W02b (`match`, `player`, `game`, `user` schemas).
- Constraints:
  - **The squad is never sent to the client** (HC 2). `duelSessionSchema` carries revealed players only; the draw case is the one moment all 11 are legitimately present, because they were each revealed in turn.
  - **The server owns the timer, lives and turn order** (HC 1, 11). `RoundTiming` is a pair of server timestamps the client renders from; no method asks the client what time it is, and no event is emitted by the client to claim a round expired.
  - **No client-side round resolution** (HC 10). `guess()` returns an ack that the guess was received, never an outcome — the outcome arrives as `guessResolved`. The three outcomes stay distinct in the payload so W14 can route already-found to the grid and not-in-XI to the input.
  - **Exactly 3 lives, lost only to the clock** (HC 9). `lifeLost` exists as an event; nothing in the interface lets the client decrement a life itself.
  - **All 11 named is a draw** (HC 18). `duelOutcomeSchema` already covers it; no tiebreak, no sudden-death and no lives comparison appears anywhere.
  - **Filter conflicts are a coin flip** (HC 19), never merged or intersected. There is no intersection helper, and `coinFlipResultSchema` always names the winner.
  - **Never fail silently on a game action.** Every command resolves to a result the caller must narrow, and `error` is a first-class event so a server-side rejection reaches the player rather than stalling the input.
  - Types from `z.infer`; no `any`; `@/` imports only; no `socket.io-client` dependency added in this phase.
- **Deviations recorded during implementation:**
  - **`connect()` takes no arguments.** The spec asked for a named seam for `PROTOCOL_VERSION`, but the version is a repo-local constant the *adapter* sends on handshake and never needs to cross the interface. Inventing a `DuelConnectOptions` would have meant guessing cookie-vs-bearer, which is a W28/W30 decision.
  - **`queueTimedOut` event added** (found on the second review). `theme.md` § Lobby names "No opponent / Queue timeout → offer solo, never a dead end" and the event set had no path to it. It is a designed flow, not an `error`, so routing it through `error: ApiError` would have been wrong. The map is 15 events, not 14.
  - **Not every event is authoritative.** `matchReady`, `roundStarted` and `turnChanged` carry a whole `DuelSession`; `lifeLost` and `playerRevealed` carry small cue payloads for the flash and the spring and are documented in-file as non-authoritative. Emitting state through several channels would invite the client to reduce it twice from sources that can disagree.
  - **`disconnected` and `opponentConnection` share one `connectionStateSchema`.** Both need status plus a server deadline. It means `disconnected` can carry `status: 'connected'`, which is load-bearing — there is no `reconnected` event, so recovery reports through this channel. **The name is the imprecise part; propose `connectionChanged` at B39.**
  - **`guessTextSchema` + `MAX_GUESS_LENGTH` hoisted to `common.ts`, `epochMsSchema` exported from `game.ts`.** A shared input bound is not solo-specific, and duel importing from solo would be the wrong direction.
  - Supporting schemas the spec did not name were added where a shape repeated: `duelActorSchema` (the `'you' | 'opponent'` pair used in three places), `filterSubmissionStatusSchema`, `connectionStatusSchema`, `duelLifeLostSchema`.
- Verification:
  - `npm run lint`, `npm run format:check` and `npm run build` all pass; `npx tsc --noEmit` is clean.
  - A throwaway check confirms `on('roundStarted', handler)` infers the handler's payload without annotation, and that `on('roundStarted', (p: DuelResult) => {})` is a type error. Delete it after — the typed event map is the whole point of the file, and it is worth proving before three screens depend on it.
  - A throwaway `const stub: DuelClient` type-checks with no-op methods, then is deleted.
  - Grep confirms `socket.io` appears nowhere in `src/` and in no dependency in `package.json`.

## History
