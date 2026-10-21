# Phase W31a — Duel Play Live

## Status

Completed

## Goals

- **Check the contract first.** Compare every schema in `src/lib/api/schemas/duel.ts`, and the `GuessResult`, `ApiError`, `Filters` and match schemas the socket uses, against `x-socket` in `GET /docs/openapi.json`. Fix any drift in the web's copy and record it under Notes. A spot-check at spec time found none.
- **A duel the server resumes after a reload.**
  - `matchReady` is authoritative from **any** phase that has no result. It replaces the session and clears `failure`, `yourConnection`, `isGuessing` and the lobby's `isLocking`. It also sets `opponent` from the session, since a reloaded page never saw `paired`.
  - The automatic `queue:enter` stays. A refusal of it is ignored once a live session is in the state (the reducer's `failed` with step `queue` while live). The server sends `matchReady` before the ack, so the order is fixed.
- **Rate limits on every command.**
  - Every command can now be refused with `rate_limited`, not only `duel:guess`.
  - A rate-limited `queue:enter`, `filters:submit` or `duel:forfeit` sets `cooldownUntil` from `retryAfterMs`, the same way guesses already do.
  - Its gate shows the wait as a countdown. **Try again appears only once the wait is over** (Open Questions 1).
  - The `cooldownEnded` timer already in `use-duel.ts` clears it.
- **Errors before the match.**
  - **"Your opponent left."** (`session_over`) and a takeover during filters or the flip both end the pre-match room.
  - The gate is titled for what happened (Open Questions 2). Its action starts a **new search** through `restart()`, never a resend of the filters.
  - **"No match fits the winning filters."** (`empty_pool`) keeps W25a's empty-pool gate, with Leave: the set may not be yours to widen.
- **Sample the server clock from the queue.**
  - `queued.since` is a server instant read when `queue:enter` arrived.
  - `use-duel.ts` notes when it sends `queue:enter`, then calls `serverClock.sample(since, sentAt, receivedAt)` when `queued` arrives, as solo does with `startedAt` (W29).
  - The countdown ring and the reconnect chip already read `serverClock.now()`.
- **Mock parity.**
  - The mock's `rateLimited` scenario answers in the ack **only**, as the server does (handoff §10). It drops the extra `error` event.
  - The mock's `queued` carries `since` from its own clock, as it does today.
- **The handoff joins the repo.** `context/docs/w31-duel-handoff.md` is committed with this phase.
- **Docs:**
  - `context/docs/mock-to-backend-map.md`: the matchmaking, filters, coin flip, play, result and opponent-connection rows are marked live from W31a.
  - `context/docs/contract.md`: the event order from handoff §4, the `error` cases from §5, and the timings from §7.
- **Tests:**
  - `duel-session.test.ts`:
    - `matchReady` taking over from `connecting`, `failed` and `searching`, setting the opponent and clearing the failure
    - a queue refusal ignored while live, and still shown while not
    - a rate-limited queue, lock or forfeit: the countdown first, Try again only after `cooldownEnded`
    - the pre-match `session_over` gate and its action
  - **The clock:** a `queued` event samples the clock with its send and receive times.
  - **Mock:** `rateLimited` sends no `error` event.

## What the duel screen does after W31a

| Situation | Screen |
| --- | --- |
| Two players search | Both pair at once; each sees the other's handle, then filters, the coin flip, then the match |
| A correct name | The guesser and the opponent see the slot fill; the turn passes |
| A wrong or found name | Only the guesser sees it, through the input or the grid; the clock keeps running |
| A round runs out | Both see the life lost about 0.4 s after zero; the turn passes |
| The 11th name, the last life, or a forfeit | Both see the result card |
| A reload mid-duel | The page resumes on the current turn, with no gate |
| The opponent closes their tab | The `ember` "Reconnecting" chip; after 20 s, the forfeit win |
| The opponent leaves during filters | "The match was called off" (Open Questions 2); the action searches again |
| Too many attempts at queue, lock or forfeit | The gate counts down; Try again appears after it ends |

## Open Questions

Both settled at `/feature load`, each as recommended.

1. **A rate-limited queue, lock or forfeit.**
   - **Recommended: count the wait down, then offer Try again.** The gate already supports a countdown (W25b). It stops a Try again that would only be refused, and refused calls count too.
   - **Keep the plain gate.** "Too many attempts. Try again in N seconds." with Try again at once. A press within the wait is refused again.
2. **The opponent leaving before the match.**
   - **Recommended: a gate titled "The match was called off",** with the server's "Your opponent left." and **Search again**. Today it reads "Couldn't set up the match", which suggests something broke.
   - **Keep today's gate.** "Couldn't set up the match" with Try again, which already searches again.

## Out of Scope

- **Your own dropped connection,** the lobby after a drop, and a duel that ended while you were away: **W31b.** In W31a, a drop mid-duel keeps W30's behaviour: a silent reconnect or "Duel connection closed".
- **`playerRevealed`.** The state events and the result carry the found pool, including the 11th name in `finished`, so the web needs no handler. It is still parsed and forwarded.
- **A forced history refetch after `finished`.** History and profile queries have no stale time, so `/profile` refetches on every visit. The 100 ms save lag only matters within 100 ms of the result.
- **Duel analytics events:** W33.
- **A two-browser Playwright suite:** W34.

## Notes

- Scope: real duels between two browsers on the B37–B43 backend. Reconnects beyond the reload are W31b.
- Depends on: W30 (the socket client), W22b and W23b (`use-duel`, the reducer), W25a and W25b (empty pool, cooldown, reconnect chip), W29 (`serverClock`). Backend B37–B43, at `lineup-backend` `f056b66`.
- **Backend context:** `context/docs/w31-duel-handoff.md`, the backend's handoff for the live duel socket. The parts this spec rests on:
  - **§2:** every command is acked with `{ success: true, data: null }`, and the result comes as events. Filters are submitted once, except after `empty_pool`. `duel:forfeit` works on either turn.
  - **§4:** the event order is pinned by the backend's two-client harness. Nothing follows `finished`. Outcomes pair up, and the player who forfeits gets a plain `loss`, with `isForfeit` on both sides.
  - **§6:** a reload mid-duel plays as a drop and a return. The new socket gets `disconnected` `connected`, then `matchReady`; a `queue:enter` sent anyway gets `forbidden` "You're already in a duel.".
  - **§7:** a 60 s queue, a 30 s filter window, a 2 s flip reveal, 15 000 ms rounds, 400 ms grace, and `lifeLost` about 0.4 s after zero.
  - **§8:** per-user rate limits; `rate_limited` carries `retryAfterMs`, in the ack when there is one.
- **The code already handles most events** (W23b, W25b): opponent connection, `finished`, `lifeLost`, guess verdicts, a rate-limited guess, `queueTimedOut` with Search again, and a forfeit on either turn. W31a fixes the gaps the live server exposes.
- **The backend's own drop handling** (`duel.gateway.ts`, `matchmaking.service.ts`):
  - A drop while queued leaves the queue silently.
  - A drop before `matchReady` ends the room. Only the **other** player hears "Your opponent left."; the one who dropped hears nothing.
  - W31b builds on this.
- Constraints:
  - **No game logic in the client** (HC 1, HC 7). Lives, turns, expiry and the result come from events. The web never decides an expiry; it waits for `lifeLost`.
  - **The squad never reaches the client** (HC 2). Only revealed players arrive.
  - **State is server-pushed** (`theme.md` § States). `matchReady`, `turnChanged` and `roundStarted` replace the state whole.
  - **Never fail silently.** Every refusal ends at a gate or speaks through the input.
  - **The clock is presentation.** The sample sets the ring's offset; it decides nothing.
  - No `any`; `@/` imports; single-line comments of at most 50 characters; no hardcoded colours.
- Verification:
  - `npm test`, `npm run lint`, `npm run format:check` and `npm run build` pass.
  - **Two players need two identities.** Tabs in one browser share a cookie, so they're one user and the second takes over. Use a normal window and an Incognito window, both on `http://localhost:3000`.
  - **Real mode,** backend on 8080 with `RATE_LIMITS_ENABLED=false` except for the rate-limit check:
    - **Pairing and filters:** both search; the coin flip names the same winner on both sides.
    - **Play:** a correct name, a found name, a wrong name and a timed-out round, each seen from both windows as in the table above.
    - **Endings:** a win and loss by lives, a forfeit (`forfeit_win` and `loss`), and a draw if the seeded XI allows naming all 11.
    - **Reload mid-duel:** the page resumes on the right turn and lives, with no gate. The other window shows "Reconnecting", then clears.
    - **The opponent leaves:** during filters gives the called-off gate; mid-duel gives the chip, then the forfeit win after 20 s.
    - **Rate limits:** with limits on, 11 queue entries in a minute hit the countdown gate.
    - **Profile:** after a duel, `/profile` lists it as `duel` with the right outcome.
  - **Mock mode:** the W23b flows and every duel `?scenario=`.
- **Clean up:** delete the test users and their game sessions after the run. A user's sessions go first, since `game_participants.user_id` is `ON DELETE RESTRICT`.

**Deviations recorded during implementation**

- **The contract check found one drift: `formation`.**
  - **Method:** the web's schemas were turned into JSON Schema with `z.toJSONSchema`, then compared field by field with `x-socket` and its components in `GET /docs/openapi.json` at `f056b66`.
  - **The drift:** the web allowed `^\d(-\d){2,4}$`; the backend allows `^[1-9](-[1-9]){2,4}$`. The web's copy now matches, and `contract.md` says digits 1–9.
  - **No other difference.** `GuessResult` is written `enum` on the backend and `const` on the web; both accept the same values.
- **`failed` and `closed` carry `at`,** the time they happened. A rate-limited failure needs it to start its wait, as `guessFailed` and `error` already do.
- **The rate-limit countdown covers every failed step,** not only queue, lock and forfeit. A rate-limited `GET /auth/token` during a connect or reconnect gets the same countdown.
- **The gate's countdown names its clock.**
  - `CanvasGateCountdown.clock` is `'server'` (the default, for the reconnect window) or `'local'`.
  - A rate limit's wait is held on this device's clock (`cooldownUntil`), as the guess cooldown always was, so its gate counts with `Date.now()`.
- **The copy:** "Too many attempts. Try again in N seconds." while it counts, then "Too many attempts. You can try again now." with Try again.
- **`matchReady` clears a gate's wait, never a guess cooldown.** A cooldown set from a failure gate is dropped; one from a rate-limited guess stays, since the server still holds it.
- **The clock sample lives in `createRoundTrip`** (`src/lib/server-clock.ts`), so it's unit-tested without rendering the hook. `use-duel.ts` starts it on `queue:enter` and finishes it on `queued`.
- **The called-off gate needed no hook change.** Its action is `retry`, and a `match` failure's retry is already `restart()`, a new search.
- **Tests:** 956 in total, 22 new:
  - `duel-session.test.ts`, 18: the resume (9), the rate limit (6), the called-off gate (3)
  - `server-clock.test.ts`, 3: `createRoundTrip`
  - the mock: `rateLimited` sends no `error` event (renamed, not new)
- **Checked in the browser, in real mode:**
  - **Setup:**
    - The developer's servers: 3000 (dev, real mode) and the 8080 backend at `f056b66`, with rate limits off.
    - Two identities: Playwright's default context and a second browser context, each a fresh guest.
    - The squads came from the database, so the run could name real players.
  - **Pairing:** both pages paired in about 3 s. The flip read "guest-dhkmvnlw's filters won" on one page and "Your filters won" on the other, and the loser of the flip named first.
  - **Play:**
    - A wrong name: "Not in this XI", and nothing reached the opponent.
    - A correct name: the turn passed, and both pages showed the name.
    - A found name: "Already named", and the turn stayed.
    - A timed-out round: the life went 15.3 s after the handover.
  - **Reload mid-duel:** the page resumed on the right turn and lives with no gate; the queue refusal was ignored. The opponent got `opponentConnection` twice: reconnecting, then connected.
  - **Draw:** naming all 11 ended in `draw` on both pages; history shows "11 of 11".
  - **Forfeit:** on the opponent's turn, it gave `forfeit_win` and `loss`, both with `isForfeit`.
  - **Opponent left during filters:** "The match was called off", "Your opponent left.", Search again. Search again paired the two again.
  - **Opponent closed the tab mid-duel:**
    - "Reconnecting, 20s" in the Lives card, and the clock kept running: a life was lost meanwhile.
    - The forfeit win came 20.0 s after the close.
  - **Win by lives:** five rounds ran out 15.4 s apart (15 s plus the 0.4 s grace). The result was `win` 1–0 and `loss`.
  - **Profile:** 4 duels: 3 won (one by lives, two by forfeit) and 1 drawn, each listed as Duel.
  - **Rate limit:**
    - Run on test ports: a real-mode `next start` on 3200, against a second backend on 8081 with `RATE_LIMITS_ENABLED=true`.
    - A terminal client used up the guest's 10 `queue:enter` for the minute.
    - The page's 11th showed "Couldn't join the queue" and "Try again in 60 seconds", then 57, with no Try again.
    - After the wait it read "You can try again now." with Try again, and Try again went back to searching.
  - **Console:** only the favicon 404; no `[api]` drift line.
  - **Not checked in the browser:** mock mode and its `?scenario=`. That needs a mock dev server, and the developer's 3000 runs in real mode. The mock flows are covered by the reducer tests that drive the mock adapter.
  - **Clean up:**
    - Both test guests (`guest-j64ppy6a`, `guest-dhkmvnlw`) and their 4 duels were deleted, sessions first. The counts are back to 11 users and 6 sessions.
    - The test servers were stopped, and `.next` was rebuilt with the default env.
- **Review:**
  - **Every goal is met,** with the deviations above. The handoff file is committed with the phase at `/feature complete`.
  - **No bugs found.** The client still decides nothing: expiry comes from `lifeLost`, the result from `finished`.
  - **A gate's wait and a guess cooldown share `cooldownUntil` safely.**
    - The gate counts down only while its failure is a rate limit.
    - `matchReady` drops a gate's wait but keeps a guess cooldown.
    - The timer and the countdown both read the local clock.
  - **A rate-limited lock that outlasts the 30 s filter window** still reaches the match: the server's flip and `matchReady` clear the gate.
  - **Left as is: a rate-limited forfeit gates the board** while the clock runs, like W23b's failed forfeit. It needs 120 forfeits a minute, so it's unreachable in play.
  - **Left as is (from W30): a takeover during filters may briefly show "Couldn't set up the match"** before "Duel connection closed".
  - **No scope creep beyond the recorded deviations:**
    - the countdown's `clock`, which the local wait needs
    - `createRoundTrip`, for testing
    - the countdown on every step, so no rate limit falls back to a plain retry
- **`/feature test`:** 10 new tests, 966 in total.
  - **The gap:** `formationSchema`, tightened by the contract check, had no test. `src/lib/api/schemas/match.test.ts` covers it, 10 tests:
    - accepted: `4-4-2`, `3-5-2`, `4-2-3-1`, `4-1-2-1-2`
    - refused: an empty line (`0-4-6`), two lines, six lines, a two-digit line, spaces and an empty string
  - **Already covered:** the reducer changes, the gate copy and `createRoundTrip` were tested in `/feature start`. The `use-duel` wiring and `GateCountdown`'s clock are hook and component code, checked in the browser run.
  - **`createRoundTrip`'s "once per start" test** now uses a stand-in clock that records every sample. The real clock's shortest-round-trip rule hid a second sample, so the old test passed with the guard removed.
  - **Mutation checks,** each restored afterwards; every one now fails a test:
    - without the queue-refusal guard while live
    - with Try again offered during the wait
    - without the opponent from `matchReady`
    - without the called-off gate
    - without `matchReady` clearing the failure
    - without it dropping a gate's wait
    - without `createRoundTrip` clearing its send time
    - with the old `formation` pattern
    - with the mock's extra `error` event back
  - **Manual testing:** no guide for W31a alone. One guide covering W31a and W31b, `context/docs/w31-manual-testing.md`, follows W31b.

## History
