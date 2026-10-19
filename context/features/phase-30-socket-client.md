# Phase W30 — Socket Client

## Status

Completed

## Goals

- **The protocol version.** `src/lib/api/protocol.ts`: `PROTOCOL_VERSION = 1`, the web's own constant, never imported from the backend.
- **`socket.io-client` 4.8** as a dependency, matching the server's `socket.io` 4.8.
- **The gateway token.**
  - `src/lib/api/schemas/auth.ts`: `gatewayTokenSchema` `{ token, expiresAt }`, with its type from `z.infer`.
  - `ApiClient.auth.getGatewayToken()`:
    - HTTP: `GET /auth/token`, with the cookie like any call.
    - Mock: a fake token while a session exists, `unauthorized` otherwise.
- **The socket duel client,** `src/lib/api/socket/duel-client.ts`: `createSocketDuelClient(baseUrl, getToken)` implements `DuelClient`.
  - **Connection:**
    - the default path and namespace, and the default transports
    - no `withCredentials`
    - `autoConnect: false`
    - `auth` is a function that fetches a **fresh token for every attempt**, then sends `{ token, protocolVersion: PROTOCOL_VERSION }`. A cached token is never reused.
  - **`connect()`:**
    - A fresh socket per call.
    - It resolves `success` on `connect`.
    - On `connect_error` it resolves with the refusal below.
    - A 10 s timeout, the same as REST, gives `network`.
  - **Refusals**, read from `connect_error` `err.data` (the failure envelope) by a pure `refusalOf(err)`:
    - `protocol_refused`: returned at once. The duel screen's existing `refused` phase shows the update page (W25b).
    - `unauthorized`: retried **once** with a fresh token, then returned.
    - `server_error`: retried twice with backoff (1 s, then 2 s), then returned.
    - No `data`, such as a refused origin or the backend being down: `network`.
    - If fetching the token fails, its error is returned as is, so a 401 there reaches the session-loss rule.
  - **Commands:**
    - `enterQueue`, `leaveQueue`, `submitFilters`, `guess` and `forfeit` emit `queue:enter`, `queue:leave`, `filters:submit`, `duel:guess` and `duel:forfeit`.
    - Every command is sent **with an ack**: `socket.timeout(10 s).emitWithAck(...)`.
    - The three with no payload send **no argument**, not `{}`: the server's schema is `undefined`.
    - A pure `ackResultOf(response)` parses the envelope (`data` `null`). A timeout or a bad shape gives `network` or `server_error`.
  - **Events:**
    - `on(event, handler)` forwards the server's events, whose names match `DuelEventMap` one to one.
    - Each payload is checked against its schema in `src/lib/api/schemas/duel.ts`.
    - A payload that fails is dropped and logged as drift outside production, with paths only, as the transport does.
    - Handlers live on the adapter's own emitter, so they survive a new socket.
  - **The connection closing:** a new `DuelClient.onClose(handler: (error: ApiError) => void): Unsubscribe` reports a connection that **won't come back by itself**:
    - `io server disconnect`: another tab or device took over. The handler gets the server's preceding `error` payload: `forbidden`, "You're connected somewhere else."
    - Reconnection giving up after a network drop (Open Questions 1): `network`.
    - The adapter **never reconnects on its own after `io server disconnect`**.
    - `disconnect()` closes the socket and fires nothing.
- **Wiring:**
  - `src/lib/api/register.ts`: in real mode, `setDuelClient(createSocketDuelClient(apiUrl(), () => api.auth.getGatewayToken()))`.
  - `createUnavailableDuelClient` and `DUEL_UNAVAILABLE_ERROR` go (Open Questions 2).
- **`use-duel.ts`:**
  - Every catch runs the session-loss rule first, like solo's `failureOf` (W29): `isSessionLost`, then `clearSession`. The next Try again starts a fresh guest through `ensureSession`.
  - It subscribes to `onClose` and dispatches `failed` with a new step `connection`.
  - Try again is the only way back in. It's an explicit action, so it may take the connection back from the other tab.
- **`duel-session.ts`:** `DuelFailureStep` gains `connection`, titled "Duel connection closed", with the error's message and Try again. A `failed` gate already showing is replaced, so a takeover never reads as "Couldn't set up the match".
- **Mock parity:**
  - The mock duel client implements `onClose`.
  - A new `?scenario=connectedElsewhere` (Open Questions 3) fires it after the queue, with the server's copy.
- **Docs:**
  - `context/docs/mock-to-backend-map.md`: the duel connection rows are marked live from W30, and the "`PROTOCOL_VERSION` doesn't exist in web yet" note is closed.
  - `context/docs/contract.md` §5 Handshake: refusal is a `connect_error` carrying the envelope in `err.data`, not an ack.
- **Tests:**
  - `refusalOf`: each code from `err.data`, no `data` gives `network`, and a malformed `data` gives `server_error`.
  - `ackResultOf`: success with `data` `null`, a failure envelope, and a bad shape.
  - Event parsing: a valid payload passes; an invalid one is dropped.
  - `duel-session.test.ts`: a `connection` failure gives the "Duel connection closed" gate and replaces an existing failure.
  - Mock: `getGatewayToken` with and without a session; the `connectedElsewhere` scenario fires `onClose` once.

## What the duel screen shows after W30

The backend refuses every duel command until B37–B41. In real mode, `/play/duel` therefore ends at a gate, which is correct:

| Situation | Screen |
| --- | --- |
| Normal | Connects, then `queue:enter` is refused: "Couldn't join the queue", "Duels aren't open yet.", Try again |
| Old build (`PROTOCOL_VERSION` 0) | The update page from W25b, with no retry |
| A second tab opens a duel | The first tab: "Duel connection closed", "You're connected somewhere else.", Try again. It doesn't reconnect by itself |
| Backend stopped mid-lobby | Socket.IO retries with a fresh token each time; once the backend is back the socket reconnects. If it never comes back: "Duel connection closed" with `network`'s message |
| Session gone | The token call returns 401, the session clears, and Try again starts a fresh guest |

## Open Questions

All three settled at `/feature load`, each as recommended.

1. **A network drop before backend B40.** B40 brings the server's `disconnected` event and the 20 s window; until then there's no duel state to resume.
   - **Recommended: reconnect silently, with a cap.** Socket.IO's backoff, up to 5 attempts. If they all fail, `onClose` fires with `network`. No client-made "Reconnecting" state, since `theme.md` says connection state is server-pushed.
   - **Show a local "Reconnecting…" status at once.** It's more visible, but the client would be inventing state that B40 will send properly.
2. **The placeholder duel client** (`src/lib/api/http/duel-client.ts`) is dead code once the socket client is registered.
   - **Recommended: delete it,** per the no-dead-code rule. `ai-interaction.md` asks before deleting files, hence this question.
   - **Keep it** as a fallback switch. Nothing would use it.
3. **A mock scenario for the takeover.** `theme.md` says every state must be reachable in dev without a real game.
   - **Recommended: add `?scenario=connectedElsewhere`.** It's small and mirrors the real copy.
   - **Skip it.** The state is then only reachable with two real tabs.

## Out of Scope

- **Matchmaking, filters, the coin flip and the duel loop on real events:** W31, after backend B37–B41. The adapter already forwards those events; their names may change at backend B39.
- **The reconnect window, opponent connection and resuming a duel:** backend B40, wired in W31.
- **Socket rate limits:** backend B42.
- **Sampling the server clock from duel events:** W31, as noted in W29.
- **The mobile bearer flow:** mobile only.

## Notes

- Scope: the socket connection, the version gate, refusals, takeover and reconnect with fresh tokens. Duel play itself stays refused by the server.
- Depends on: W05b (`DuelClient`, `DuelEventMap`), W22b/W23b (`use-duel`, the reducer), W25b (the update page), W27 (config), W28 (session-loss rule), W29 (`failureOf` pattern), backend B12b (`GET /auth/token`), B13 and B36.
- **The contract changed at B36:** a refused handshake is a `connect_error` with the envelope in `err.data`, not an ack as `contract.md` §5 says. The backend is right.
- Constraints:
  - **No game logic in the client** (HC 1, HC 7). The adapter transmits commands and renders events; it decides nothing.
  - **Every handshake is version-checked** (HC 8). The web sends `PROTOCOL_VERSION`, and a refusal shows the update page, never a desync.
  - **Validate every socket payload** at the boundary (`coding-standards.md` § Validation), with the web's own schemas.
  - **Never fail silently.** A refusal, a takeover, a lost connection and a refused command each end at a gate with a reason.
  - **The client never asserts who it is.** It sends only the token and the version.
  - No `any`; `@/` imports; comments single-line, at most 50 characters.
- Verification:
  - `npm test`, `npm run lint`, `npm run format:check` and `npm run build` pass.
  - **Real mode:** backend on 8080 with `WEB_APP_URL=http://localhost:3000`, and `.env.local` on `real`.
    - **Guest:** `/play/duel` as a guest. Network shows `GET /auth/token`, then the socket upgrade. The gate reads "Couldn't join the queue", "Duels aren't open yet."
    - **Registered user:** the same as a guest.
    - **Old build:** `PROTOCOL_VERSION` temporarily `0` shows the update page, with no retries in Network. Revert.
    - **Takeover:** a second tab opens `/play/duel`. The first shows "Duel connection closed", "You're connected somewhere else." and makes no new socket until Try again.
    - **Backend restart:** stop the backend for a few seconds, then start it. A new `GET /auth/token` precedes each reconnect attempt, and the socket comes back.
    - **Bad command:** the queue refusal shows as a gate, not a toast or silence.
  - **Mock mode:** the W23b duel flows, `?scenario=protocolRefused` and the new `?scenario=connectedElsewhere`.

**Deviations recorded during implementation**

- **The emitter moved** from `src/lib/api/mock/emitter.ts` to `src/lib/api/duel-emitter.ts`, with its test. The socket client needs it, and no app code may import from `mock/`. The mock now imports it from there.
- **`failureOf(queryClient, error)` moved** from `use-solo-run.ts` (W29) to `use-auth.ts`, next to `clearSession`. Solo and duel share it instead of keeping two copies.
- **`reportDrift` is exported** from the transport and takes a label (`"GET /profile"`, `"socket queued"`). Its output is unchanged.
- **The pure helpers live in `src/lib/api/socket/messages.ts`:** `refusalOf`, `ackResultOf`, `parseEvent`, `handshakeRetryDelay` and `DUEL_EVENTS`.
  - `handshakeRetryDelay` holds the tuned values: one immediate retry for `unauthorized`; 1 s, then 2 s for `server_error`.
  - A malformed refusal is `server_error`, so it gets the same two retries.
- **`use-duel` dispatches a new `closed` event,** not `failed` directly.
  - The reducer ignores it once a result is in, so a close after a finished duel never covers the result card.
  - Otherwise it becomes `failed` with step `connection`.
  - `protocol_refused` on a reconnect (step `connection`) also shows the update page, like on `connect`.
- **How the socket is built:**
  - `forceNew: true` gives each `connect()` its own manager.
  - The adapter's own 10 s timer covers the whole first connect.
  - On the first connect, a failed attempt drops the socket, so Socket.IO doesn't keep retrying in the background. Only `handshakeRetryDelay` retries.
  - After a successful connect, Socket.IO's reconnection takes over: 5 attempts, then `onClose` with `network`.
- **The token is fetched after the transport opens,** because Socket.IO calls `auth` then. With the backend down, the attempt fails before any `GET /auth/token`.
- **The `register.test.ts` case** "refuses duels in real mode" became "registers the socket duel client without connecting". It checks that no token is fetched until a duel connects.
- **Tests:** 911 in total. 2 placeholder tests went; 21 are new:
  - `messages.test.ts`, 16
  - `duel-session.test.ts`, 4: an old build on reconnect, a takeover over an existing gate, the result card kept, and the mock `connectedElsewhere` flow
  - the mock gateway token, 1
- **Checked in the browser,** in real mode:
  - **Setup:** a real-mode `next start` build on 3200, against a second backend on 8081 with `WEB_APP_URL=http://localhost:3200`. Its build matched B36.
  - **Guest:**
    - polling, then a WebSocket upgrade
    - `GET /auth/token` 200, then the handshake with the token and `protocolVersion`
    - `420["queue:enter"]` with no payload, answered `forbidden`, "Duels aren't open yet."
    - The gate read "Couldn't join the queue", "Duels aren't open yet.", Try again.
  - **Takeover:**
    - A second tab opened `/play/duel`. The first showed "Duel connection closed", "You're connected somewhere else.", Try again.
    - It opened no socket and fetched no token in the next 10 s.
    - Try again took it back with one fresh token, and the second tab then showed the same takeover gate.
  - **Backend restart, 4 s:**
    - Socket.IO's attempts failed at 0.8 s and 3.5 s.
    - At 8.6 s the WebSocket opened, a **new** `GET /auth/token` returned 200, and the handshake was accepted.
    - The gate didn't change: the reconnect was silent.
  - **Session lost:**
    - A direct `POST /auth/sign-out`, then a backend restart.
    - The reconnect's `GET /auth/token` got 401, and the page showed "Duel connection closed", "Sign in or continue as a guest first."
    - The player label went back to "You": the session had cleared.
    - Try again made `GET /auth/session`, then `POST /auth/guest` (a fresh guest), then connected.
  - **Backend down for good:** after 5 failed attempts (about 19 s), "Duel connection closed", "Couldn't reach Lineup. Check your connection and try again."
  - **Old build:**
    - With `PROTOCOL_VERSION` temporarily `0`, the handshake sent `"protocolVersion":0`.
    - The server answered `connect_error` with `protocol_refused`, and the page showed "Update Lineup to keep playing", Reload, Back to Play.
    - There was one attempt and no retries in 12 s. The constant was then set back to `1`.
  - **Mock mode,** on a mock-mode build on 3200: no backend requests; searching, filters, "Your filters won", then the match on your turn.
  - **Not checked in the browser:** `?scenario=connectedElsewhere` and `?scenario=protocolRefused`.
    - `?scenario=` works only in a dev build, and the developer's dev server on 3000 runs in real mode. Only one `next dev` may run per project.
    - The `connectedElsewhere` flow is covered by the test that drives the mock adapter through the reducer to the gate's title and copy.
  - **Console:** the favicon 404, refused polling requests while the backend was down, and the intended 401. One warning: a WebSocket closed mid-upgrade when the 401 dropped the socket.
  - **Clean up:**
    - the two test guests were deleted (`guest-ywzd3xsa`, `guest-8rsq0gzg`, no games)
    - both test servers were stopped
    - the developer's servers on 3000 and 8080 were untouched
- **Review:**
  - **Every goal is met,** with the deviations above.
  - **Bug fixed: a stale token callback could close a newer connection.**
    - The `auth` callback's token call is a promise, not a listener, so `drop()` doesn't detach it.
    - The race: during a reconnect, the player presses Try again while the token call is in flight, and the old call then fails. Its `end()` would drop the **new** socket and fire `onClose`.
    - The callback now returns unless its socket is still the current one.
  - **Seven new comments were over 50 characters** and were shortened. `CONNECTED_ELSEWHERE_ERROR` is no longer exported, since only the mock uses it.
  - **Left as is: a refused handshake's `unauthorized` also clears the session cache.**
    - `failureOf` can't tell it from a token call's 401.
    - It needs two refused handshakes in a row, the second with a freshly fetched token. That's rare, and the next Try again refetches the session through `ensureSession`, so the real session comes back.
    - Until then the nav reads "Sign in".
  - **Left as is: a takeover may briefly show "Couldn't set up the match"** before "Duel connection closed". The server's `error` event and its disconnect can arrive in separate frames. The browser run only ever saw the final gate.
  - **No scope creep beyond the recorded deviations:** the emitter move, the shared `failureOf` and the exported `reportDrift` each avoid a second copy.
  - **The rules stay on the server.** The adapter only sends commands and passes events on, and the client sends nothing about the user beyond the token.
- **`/feature test`:** 23 new tests, 934 in total.
  - **The gap:** the socket client itself (`createSocketDuelClient`) had no unit tests; only the browser run covered it. Neither did `failureOf` after its move.
  - **`src/lib/api/socket/duel-client.test.ts`, 21.**
    - **Setup:** `socket.io-client` is replaced with a small fake socket the test drives. The fake runs the client's `auth` callback the way Socket.IO does once the transport opens, then fires `connect`, `connect_error`, `disconnect`, manager or server events.
    - **Connect, 9:**
      - the token and version sent, with no `withCredentials`
      - an auth refusal retried once with a new token, giving up or succeeding
      - a server error backed off at 1 s, then 2 s, then given up
      - an out-of-date build never retried
      - a failed token call returned as is
      - a transport failure as network
      - the 10 s timeout
      - no more retries after `disconnect()`
    - **Closing, 6:**
      - a takeover passed on once, with no reconnect
      - a dropped transport quiet until give-up
      - a refused reconnect
      - a reconnect without a token
      - a stale token call ignored after a newer connect
      - nothing fired when the player disconnects
    - **Events, 2:** a bad payload dropped and logged with paths only; handlers kept across a new socket.
    - **Commands, 4:** the five event names, with no argument for the empty ones; an ack refusal; a missing ack as network; no socket as network.
  - **`src/hooks/use-auth.test.ts`, 2:** `failureOf` signs out on a 401, and keeps the session for other failures.
  - **Manual testing:** the guide is `context/docs/w30-manual-testing.md`.
    - Part 1 checks the server's refusals from the terminal (`protocol_refused`, `unauthorized`), with no code edit.
    - **Claude ran it,** unedited, on the developer's servers for Parts 0–4 and 9, and on test ports (3200, 8081) for the restarts in Parts 5–7. Every step passed.
    - Part 8 (mock `?scenario=`) was skipped by choice: it needs a mock dev server.
    - Two guests created before the run (`guest-nlndlwgg`, `guest-y2alu5yv`) weren't Claude's and were left in the database.
  - **Mutation checks,** each restored afterwards:
    - Without the stale-callback guard, "ignores a stale token call" fails.
    - Without the handshake retry, the four retry tests fail.
    - Without the takeover close, "passes on a takeover" fails.
    - With every drop closing, "stays quiet on a dropped transport" fails.

### Backend context for W30 (Socket Client)

The backend (lineup-backend, B36) now has a live Socket.IO gateway. Matchmaking and the duel
itself aren't built yet (B37–B41), so W30 can wire the connection, the version gate, refusals
and reconnects, but every duel command is still refused.

#### Where to connect
- Same origin and port as the REST API (http://localhost:8080 locally), Socket.IO's default
  path `/socket.io`, default namespace. Server is `socket.io` 4.8; use `socket.io-client` 4.8.
- Default transports (long-polling, then upgrade to WebSocket) are fine.
- No cookies on the socket: don't set `withCredentials`. The socket's CORS allows only the
  backend's `WEB_APP_URL` (http://localhost:3000 locally), without credentials.
- The browser's `Origin` must be `WEB_APP_URL`. Any other origin is refused before the
  handshake: `connect_error` with **no** `data` (a transport error). Treat that like `network`.

#### Handshake
```ts
io(API_URL, { auth: { token, protocolVersion: PROTOCOL_VERSION } })
```
- `PROTOCOL_VERSION` doesn't exist in the web yet: add your own constant, value **1**. Never
  import it from the backend. The server accepts N and N-1 (only 1 today). Anything else,
  older, newer, missing or not an integer, is refused.
- `token` comes from `GET /auth/token`, sent with the session cookie like any REST call. The
  response is `GatewayToken`: `{ token, expiresAt }` (epoch ms, server clock). It lives
  5 minutes; get a fresh one for **every** connect and reconnect, never a cached one.
  Easiest: pass `auth` as a function, so each reconnect attempt fetches a new token:
  `auth: (cb) => getToken().then((t) => cb({ token: t.token, protocolVersion: PROTOCOL_VERSION }))`.
- `GET /auth/token` is limited to 30/min per user (429 `rate_limited` with `retryAfterMs`).
  A tight reconnect loop can hit that, so keep Socket.IO's backoff.
- The server loads the user fresh on every handshake. Tier and guest status come from the
  server; the client sends nothing about the user.

#### Accepted and refused
- **Accepted:** the normal `connect` event. There's no ack on connect, so `connect()` resolves
  on `connect`.
- **Refused:** a `connect_error` whose `err.message` is the error code and whose `err.data` is
  the failure envelope `{ success: false, error: ApiError }`. **This differs from
  api-contract.md §5,** which says "an ack". The backend is right.

  | `error.code` | Why | What the web does |
  | --- | --- | --- |
  | `protocol_refused` | Build too old (or too new) | Show the update screen. Don't retry. Message: "This version of Lineup is out of date. Update to keep playing." |
  | `unauthorized` | Token missing, bad, expired, or its user was deleted | Get a fresh token and retry once. If `GET /auth/token` itself says `unauthorized`, the session is gone: send the player to sign in. Message: "Sign in or continue as a guest first." |
  | `server_error` | Backend failure during the handshake (e.g. the database) | Retry with backoff; show it if it keeps failing |

- **Socket.IO doesn't auto-reconnect after a server refusal** (`socket.active` is `false`).
  Retrying is up to the client, per the table.
- The version is checked first, so an old build always sees `protocol_refused`, whatever else
  is wrong with its handshake.

#### One connection per user (latest wins)
- If the same user connects again (another tab, another device), the **new** socket gets in.
  The **old** one receives an `error` event
  `{ code: 'forbidden', message: "You're connected somewhere else.", retryAfterMs: null }`,
  then is disconnected with reason `io server disconnect`.
- Socket.IO doesn't auto-reconnect after `io server disconnect`. **The web must not reconnect
  by itself in that case either,** or two tabs would keep taking over from each other. Show
  the message. Reconnect only on an explicit user action.
- Other disconnect reasons (`transport close`, `ping timeout`, `transport error`) are network
  drops. Socket.IO's own reconnection handles them; each attempt needs a fresh token (see
  above). Server heartbeat: ping every 25 s, 20 s timeout (B40 may tune this).
- The 20 s duel reconnect window and the `disconnected` / `opponentConnection` events arrive
  with B40. Until then there's no duel state to resume after a reconnect.

#### Commands and acks
- The five commands exist: `queue:enter`, `queue:leave`, `filters:submit` (`Filters`),
  `duel:guess` (`{ sessionId, guess }`), `duel:forfeit`. Event names are provisional until
  backend B39.
- Every command sent **with an ack** is answered with the envelope `{ success, data, error }`;
  `data` is `null` on success. Use `socket.timeout(ms).emitWithAck(...)` and map a timeout to
  `network`.
- **Today every valid command is refused:** `forbidden`, "Duels aren't open yet." Show it like
  any `ApiError`.
- A bad payload → `invalid_input`, "Check these fields: …" (field names only).
- An unknown event name sent with an ack → `invalid_input`, "Unknown command."
- A failed command sent **without** an ack → the server sends an `error` event with a plain
  `ApiError`. Always send commands with an ack.
- Server → client events (`error` today; `queued` onwards from B37) carry plain payloads, not
  envelopes, as in `DuelEventMap`.
- Frames over 16 KB close the connection. Guesses are ≤ 64 characters, so this never applies
  in normal use.

#### Other things W30 will see
- No socket rate limits yet (backend B42). REST limits from B35 still apply to `/auth/token`.
- OpenAPI (http://localhost:8080/docs/openapi.json) now has a `SocketHandshake` component
  (`token`, `protocolVersion`). Socket events themselves aren't in OpenAPI; they're
  transcribed by hand, as before.
- Mobile sends no `Origin` and is accepted; that doesn't affect the web.

#### Testing W30 locally
- Run the backend with `npm run start:dev` (port 8080); its `.env` `WEB_APP_URL` must be the
  web's dev origin (http://localhost:3000).
- What can be exercised now: connect as a guest or a registered user; an old
  `PROTOCOL_VERSION` (set it to 0) shows the update screen; a second tab takes over and the
  first shows "connected somewhere else" without reconnecting; stopping and restarting the
  backend reconnects with a fresh token; any duel command shows "Duels aren't open yet."

## History
