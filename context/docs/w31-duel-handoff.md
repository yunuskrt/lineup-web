# W31 handoff: the live duel socket

From `lineup-backend`, `main` at `f056b66`, phases B36–B43. For the `lineup-web` session that wires `DuelClient` to the real Socket.IO server in W31.

The backend is the source of truth. The machine-readable copy of everything below is the `x-socket` key of `GET /docs/openapi.json`: every command, its payload and ack components, its refusal codes, and every event's payload component. Check the web's transcription against that. `PROTOCOL_VERSION` is **1**, and nothing in B37–B43 changed a payload shape.

---

## 1. Connecting

| Item | Value |
| --- | --- |
| URL | the backend origin (port 8080 locally), default Socket.IO path `/socket.io` |
| Handshake auth | `{ token, protocolVersion: 1 }` |
| Token | `GET /auth/token`, using the session cookie. It returns `{ token, expiresAt }`, a JWT that lasts 5 minutes. The route is limited to 30 per minute per user |
| Origin | a browser's `Origin` must be `WEB_APP_URL`. Any other origin is refused at the upgrade ("Request refused.") |
| Heartbeat | ping every 10 s, 5 s timeout, so a dead connection is noticed within about 15 s |
| Frame limit | 16 KB |

- **Pass `auth` as a callback**, `auth: (cb) => fetchToken().then((token) => cb({ token, protocolVersion: 1 }))`, so every reconnect gets a fresh token. A token held from page load will have expired by the first reconnect after 5 minutes.
- **A refused handshake arrives as `connect_error`.** `err.message` is the code and `err.data` is the failure envelope `{ success: false, error }`:

| `err.message` | `error.message` | What the web does |
| --- | --- | --- |
| `protocol_refused` | "This version of Lineup is out of date. Update to keep playing." | the update screen |
| `unauthorized` | "Sign in or continue as a guest first." | sign-in, or a new guest |

- **Only one socket per user.** A second connection takes the seat over while the first is still open; a reload usually closes the old one first (§ 6). The old socket gets `error` `{ code: 'forbidden', message: "You're connected somewhere else." }` and is then disconnected by the server. Socket.IO doesn't auto-reconnect after a server-side disconnect, so the old tab should show that message and stop.

## 2. Commands

Every command is acked with the envelope. On success it is `{ success: true, data: null }`, and the result arrives as events. If a command is sent **without** an ack callback, its failure arrives as an `error` event instead. An unknown command name sent with an ack gets `invalid_input` "Unknown command.".

| Command | Payload | Refusals in the ack (code: message) |
| --- | --- | --- |
| `queue:enter` | none | `forbidden`: "You're already in the queue." · `forbidden`: "You're already in a duel." · `rate_limited` |
| `queue:leave` | none | `forbidden`: "You're not in the queue." · `rate_limited` |
| `filters:submit` | `Filters` | `forbidden`: "Filters are not open right now." · `empty_pool`: "No match fits those filters. Try widening them." (with `emptyBecause`) · `invalid_input` · `rate_limited` |
| `duel:guess` | `{ sessionId, guess }`, guess trimmed, 1–64 characters | `forbidden`: "Wait for your turn." · `session_over`: "That round had already ended." · `session_over`: "This duel is not running." · `invalid_input`: "That guess is for another duel." · `rate_limited` |
| `duel:forfeit` | none | `forbidden`: "There is no duel to forfeit." · `rate_limited` |

- **Every command can also fail with `server_error`.** A payload that fails validation gets `invalid_input` "Check these fields: <paths>.", or "The request was not valid." if there are no paths.
- **Filters are submitted once per player.** A second submit gets "Filters are not open right now.". The exception is an `empty_pool` refusal: that submission was never stored, so the player can widen the filters and submit again.
- **`duel:forfeit` works on either player's turn.**

## 3. Events

`you` and `opponent` are always from the receiving client's seat.

| Event | Payload | When |
| --- | --- | --- |
| `queued` | `{ phase: 'queued', since }` | after every accepted `queue:enter`, **including** one that pairs at once (`queued` always comes before `paired`) |
| `queueTimedOut` | `{ phase: 'queued', waitedMs }` | 60 s alone in the queue. The player is no longer queued |
| `paired` | `{ phase: 'paired', opponent }` | an opponent is found. The 30 s filter window opens now |
| `filtersUpdated` | `{ yours, theirs }` (`pending` / `submitted`) | after each submission by either player, and once more when the window closes |
| `coinFlip` | `{ winner, filters }` | both sets are in, or the window closed (a missing set counts as no preference). One set wins whole |
| `matchReady` | `DuelSession` | the 2 s reveal after `coinFlip` is over, and round 1 is running. Also the **resume snapshot** (§ 6) |
| `guessResolved` | `GuessResult` | to the guesser only |
| `playerRevealed` | `DuelFoundPlayer` | to both, on a correct new name |
| `lifeLost` | `{ who, lives }` | a round ran out |
| `turnChanged` | `DuelSession` | a handover |
| `roundStarted` | `DuelSession` | the next round, always right after `turnChanged` |
| `finished` | `DuelResult` | the duel is over |
| `opponentConnection` | `{ status, reconnectDeadline }` | the opponent dropped, came back, or forfeited by staying away |
| `disconnected` | `{ status: 'connected', reconnectDeadline: null }` | your own socket came back inside the window (§ 6) |
| `error` | `ApiError` | failures outside an ack (§ 5) |

- **The player who loses the coin flip names first.**
- **`matchReady`, `turnChanged` and `roundStarted` are authoritative:** replace the whole duel state with what they carry.

## 4. Event order in play

These are pinned by `test/duel/duel-harness.e2e-spec.ts`, which plays four whole games with two clients. If the web and that suite disagree, the suite is right.

| What happened | The player who acted | The other player |
| --- | --- | --- |
| A correct, new name | `guessResolved`, `playerRevealed`, `turnChanged`, `roundStarted` | `playerRevealed`, `turnChanged`, `roundStarted` |
| An already-found name, or a name not in the XI | `guessResolved` | nothing |
| A round runs out | `lifeLost`, `turnChanged`, `roundStarted` | the same |
| The 11th name | `guessResolved`, `playerRevealed`, `finished` (draw) | `playerRevealed`, `finished` |
| The last life lost | `lifeLost`, `finished` | the same |
| `duel:forfeit` | `finished` | `finished` |

- **Nothing follows `finished`.**
- **Outcomes pair up:** `win` with `loss`, `draw` with `draw`, and `forfeit_win` with `loss`. The player who forfeits gets a plain `loss`, with `isForfeit: true` on both sides.

## 5. The `error` event

| When | Code: message |
| --- | --- |
| The opponent leaves before `matchReady` (in filters or the coin flip) | `session_over`: "Your opponent left." The pre-match room is gone, so go back to the lobby |
| The winning filters' pool emptied between the flip and the load | `empty_pool`: "No match fits the winning filters." (with `emptyBecause`). The room is gone |
| Another tab took the seat | `forbidden`: "You're connected somewhere else." (old socket only) |
| A server fault, or an event that failed its own contract check | `server_error` |
| Any command sent without an ack, then refused | that command's refusal |

## 6. Disconnects, reloads and resuming

- **The clock never stops.** A dropped player's rounds keep running and can cost lives while they're away.
- **The opponent drops:** you get `opponentConnection` `{ status: 'reconnecting', reconnectDeadline }`, 20 s ahead.
  - If they come back: `{ status: 'connected', reconnectDeadline: null }`.
  - If they don't: `{ status: 'forfeited', reconnectDeadline: null }`, then `finished` with `forfeit_win`.
  - If the clock ends the duel first, there's no `forfeited` notice, only the clock's `finished`.
- **You drop and come back within 20 s:** the new socket gets `disconnected` `{ status: 'connected', reconnectDeadline: null }`, then `matchReady` with the current state.
- **A reload mid-duel** usually closes the old socket before the new one connects, so it plays as a drop and a return. The new socket gets `disconnected` `connected`, then `matchReady`, and the opponent sees `reconnecting`, then `connected`.
- **A second tab mid-duel,** with the first still open, is a takeover. The new socket gets `matchReady` straight away, with no `disconnected` first, because the seat was never marked away. The opponent hears nothing. The old tab gets the "connected somewhere else" error from § 1.
- **The server never sends your own `disconnected` `reconnecting`.** Your socket is down when it would. Show your own "reconnecting" state from Socket.IO's own events (`disconnect`, then `io.on('reconnect_attempt')`). A 20 s countdown from the drop is fine as presentation.
- **Coming back after the window, or after the duel ended while you were away:** there is no `matchReady` and no replay. Socket.IO doesn't buffer server events for a closed socket. Treat "connected, and no `matchReady` shortly after" as "the duel is over", then show the result from `GET /profile/history`.
- **Skip the automatic `queue:enter` on a resumed connection.** `matchReady` arrives before any ack. If the web enters the queue on connect anyway, it gets `forbidden` "You're already in a duel.". Either wait briefly for a `matchReady` before queueing, or drop that refusal when one has arrived.
- **A second tab during filters or the flip** ends that pre-match room, and the opponent gets "Your opponent left.". Only a duel in play is handed over to the new tab.

## 7. Timings

| What | Value |
| --- | --- |
| Queue timeout | 60 s |
| Filter window | 30 s from `paired`. A player with no set gets no preference |
| Coin-flip reveal | 2 s from `coinFlip` to `matchReady` |
| Round | 15 000 ms (`endsAt - startedAt`) |
| Grace | 400 ms after `endsAt`. A guess received later is refused with "That round had already ended." |
| Expiry | the server's own timer fires at `endsAt` + 400 ms, so `lifeLost` arrives about 0.4 s after the countdown hits zero. The web never asks for it; there's no sync call in a duel |
| Reconnect window | 20 s |
| Heartbeat | 10 s interval, 5 s timeout |
| Gateway token | 5 minutes |

## 8. Rate limits

Counted per **user**, not per socket, so a reconnect or a second tab doesn't reset them. Each command has its own count, and refused calls count too.

| Command | Limit |
| --- | --- |
| `duel:guess` | 12 per 3 s |
| `queue:enter` | 10 per minute |
| `filters:submit` | 10 per minute |
| `queue:leave`, `duel:forfeit` | 120 per minute |

- **The refusal:** `{ code: 'rate_limited', message: 'Too many attempts. Try again in N seconds.', retryAfterMs }`, where `retryAfterMs` is in whole seconds times 1000. It arrives in the ack, or as `error` if no ack was asked.
- **A refused guess isn't judged,** and the round clock keeps running.
- **Every command can now return this,** not only `duel:guess`, so the web's cooldown handling should be general.

## 9. After the duel

- **A finished duel is saved in the background,** just after `finished` goes out. It can trail `finished` by one database write, about 100 ms, so refetch the history once rather than expect it instantly.
- **`GET /profile/history`** lists it as `mode: 'duel'` with this player's outcome and their own `livesRemaining`. `foundCount` is the shared pool, as in the mock.
- **`GET /profile`:** `played` +1, and `wins`, `losses` or `draws` +1 (`forfeit_win` counts as a win). Accuracy counts this player's own guesses only, and a duel never raises `bestStreak`.
- **A pair who part before `matchReady` leave no history entry.**

## 10. Where the real server differs from the mock

- **Pairing:** FIFO and immediate when someone is waiting, not after 2 s. `queued` still comes first.
- **The opponent:** a real player, with no 6 s think time and no 65% hit rate.
- **Rate limits:** per user, at 12 guesses per 3 s. The mock's `rateLimited` scenario uses 2 per 3 s and sends both the ack and an `error`; the server sends only the ack when there is one.
- **Message wording:** the start-phase messages keep the mock's wording. The rest are listed in § 2 and § 5.
- **Images:** the seeded data has no images yet, so `crestUrl` and `imageUrl` arrive as `null` until B23 and B24 (the bucket and the image ingest). The web's placeholders for `null` are what players will see.

## 11. Checklist for W31

1. Replace the mock `DuelClient` with a Socket.IO implementation of the same interface. Fetch the token in an `auth` callback.
2. Map `connect_error`: `protocol_refused` goes to the update screen, `unauthorized` to sign-in.
3. Treat `matchReady` as authoritative from any phase, and skip or ignore the automatic `queue:enter` when one arrives (§ 6).
4. Show your own reconnecting state from transport events. After the window, fall back to the history (§ 6).
5. Handle `rate_limited` with `retryAfterMs` on every command.
6. Never decide an expiry. Render the countdown from `round`, and wait for `lifeLost`.
7. Check the web's socket schemas against `x-socket` in `/docs/openapi.json`.
8. To try it locally, run the backend with `npm run start:dev` (port 8080) and the web on 3000. The backend's `npm run test:harness` runs the two-client suites.
