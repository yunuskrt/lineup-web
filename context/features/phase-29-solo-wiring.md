# Phase W29 — Solo Wiring

## Status

Completed

## Goals

- **A server clock for the countdown** (Open Questions 1), in `src/lib/server-clock.ts`:
  - `createServerClock(localNow = Date.now)` returns `{ now(), sample(serverInstant, sentAt, receivedAt) }`.
    - `sample` estimates `offset = serverInstant − (sentAt + receivedAt) / 2`, and keeps the sample with the **shortest round trip**, the most accurate one.
    - `now()` returns `localNow() + offset`. It's `0` until a sample arrives, so mock mode, whose clock is the browser's, is unchanged.
  - A shared `serverClock` instance for the app.
  - **What it's for:** the backend's `startedAt`/`endsAt` are server epoch times. Today every countdown compares them with `Date.now()`, so a laptop clock that's 4 s fast would show 4 s less and sync 4 s early. The server still decides lives, so it's a display bug, not a fairness one, but it makes the clock lie.
- **Every read of a server time uses `serverClock.now()`:**
  - `CountdownRing` (`remainingMs(round, …)`)
  - the solo sync-at-0 timer in `use-solo-run.ts`
  - `GameCanvas`'s `GateCountdown` and `ReconnectChip`, which count down duel reconnect deadlines; they get samples from W31
  - **not** the cooldown timers: `cooldownUntil` is built locally from `retryAfterMs`, so it's already on the browser's clock
- **Sampling, in `use-solo-run.ts`.** Only responses whose round started **on the server's receipt** give a sample:
  - `chooseSide`: round 1 starts on receipt
  - a `guess` whose outcome is `correct_new`: the next round starts on receipt (B31)
  - **not** `syncSession`: a caught-up round starts at an old deadline, not on receipt
  - Each call reads `Date.now()` before sending and after the response.
- **A run that's gone ends the run screen** (Open Questions 2). `src/lib/solo-run.ts`:
  - A guess that fails with `not_found` (the backend lost or evicted the run) or `unauthorized` moves to `failed`, with a new step `guess`: "Couldn't send your guess". Today it shows a toast and leaves the input live, so every later guess fails the same way.
  - `unauthorized` joins `LEAVING_ERRORS`, so the gate offers **Back to filters**, not a retry that can't succeed.
- **Solo honours W28's lost-session rule.** Solo calls go straight to `getApiClient()`, not through TanStack, so `QueryProvider` never sees their 401s.
  - `use-solo-run.ts` calls `isSessionLost(error)`, then `clearSession(queryClient)`, in each catch.
  - The next Play then starts a fresh guest through `ensureSession`.
- **`context/docs/mock-to-backend-map.md`:** the Solo and Catalog rows marked live from W29, and Watch-out 1 (catalog) resolved by B25b.
- **Tests:**
  - `src/lib/server-clock.test.ts`, with a fake `localNow`:
    - offset `0` before any sample
    - a sample sets the offset to the server instant minus the midpoint
    - a slower sample doesn't replace a faster one; a faster one does
    - a negative offset (the browser ahead of the server) works the same
  - `src/lib/solo-run.test.ts`:
    - `guessFailed` with `not_found` or `unauthorized` goes to `failed`, step `guess`, and is a leaving error
    - `session_over` still syncs with no toast
    - `not_in_xi`-style failures (e.g. `invalid_input`) still toast and stay live

## What the backend does (B25–B33)

| Call | Backend behaviour the web now meets |
| --- | --- |
| `getFilterOptions` | Public. Lists only what's in the playable pool; `crestUrl` is always `null` until B23 |
| `findMatch` | **Ends the player's open run** (it becomes `quit`), then offers a match. `empty_pool` + `emptyBecause` when nothing fits |
| `chooseSide` | Starts round 1 on receipt. A second call gets `forbidden` |
| `guess` | `session_over` if the round had already expired (15 s + 400 ms, on receipt). A `correct_new` starts the next round on receipt |
| `syncSession` | Catches up every expired round first. The clock never pauses, so being away costs lives |
| `quit` | Returns the summary, even for a run that has already ended |
| `getSummary` | `forbidden` while the run is still active. `missed` is `null`, since every player is `free` |
| any | `not_found` for an unknown or evicted run (runs live in memory until B34) |

## Open Questions

Both settled at `/feature load`, each as recommended.

1. **The countdown's clock.**
   - **Recommended: estimate the offset from round starts** (Goals). No contract change, and its error is half a round trip, a few tens of milliseconds locally.
   - **Trust the device clock**, as today. It costs nothing, but a skewed laptop shows a wrong ring and syncs at the wrong moment. The server stays fair either way.
   - **Add a `serverNow` field to responses.** It's exact and covers duels too, but it's a contract change: backend first, then web and mobile (`ai-interaction.md` § Working Across Repos).
2. **A guess that fails because the run is gone.**
   - **Recommended: end the run screen,** with "Couldn't send your guess", the backend's message, and Back to filters.
   - **The alternative keeps today's toast.** The input stays live, but every guess fails until the player quits.

## Out of Scope

- **History and stats after a run:** B34 writes them, and W32 shows them. Until then `/profile` stays at zero after a real run.
- **Rate limits** (`rate_limited` on guesses): B35. The cooldown input from W25a is ready for it.
- **Real crests and headshots:** B23–B24. Today every `crestUrl` and `imageUrl` is `null`, so the initials fallbacks show.
- **The daily solo cap for free players and Pro's `missed` list:** monetization is Deferred.
- **Duel sampling of the server clock:** W31. Duel rounds read `serverClock.now()` from this phase, but with no samples yet the offset stays `0`.
- **Two tabs, one player.** Starting a run in a second tab ends the first tab's run as `quit` (the backend's one-open-run rule). The first tab's next guess gets `session_over`, syncs, and shows the summary. That's correct, so nothing is added.

## Notes

- Scope: the solo loop against B33, a server clock for countdowns, and lost-run and lost-session handling during a run. No contract change.
- Depends on: W27 (HTTP client), W28 (session-loss rule, `ensureSession`), W20/W21 (solo loop and summary), backend B25, B25b and B27–B33.
- **The backend needs `MATCH_POOL_INCLUDE_UNSCORED=true` in its `.env` for real-mode play.** The seeded matches have no memorability score, so without it the pool is empty: `/play` lists no competitions, and every run is `empty_pool`.
- **Runs live in the backend's memory** until B34. Restarting the backend loses every run in progress; the web shows the `not_found` failure (Goals).
- Constraints:
  - **No game logic in the client** (HC 1, HC 7). The offset only moves the drawing of the countdown. Lives, expiry and round order stay the server's; the client's 0 still only asks (`syncSession`).
  - **The squad never reaches the browser** (HC 2). Only revealed players arrive. The summary's `missed` is `null` for free players, so even after a run nobody sees the unnamed starters.
  - **The ring sweeps linearly**, and reduced motion never stops it (`theme.md` § Motion). Only its time source changes.
  - **Never fail silently on a game action:** a guess against a lost run ends the run screen; it never toasts forever.
  - No `any`; `@/` imports; comments single-line, at most 50 characters.
- Verification:
  - `npm test`, `npm run lint`, `npm run format:check` and `npm run build` pass.
  - **Real mode:**
    - **Setup:** the backend runs with `MATCH_POOL_INCLUDE_UNSCORED=true`, `.env.local` is on `real`, and the app is open on `localhost:3000`.
    - **Filters:** `/play` lists the seeded competitions and clubs. Start solo run leads to the side pick, then round 1 with the ring sweeping.
    - **Guesses:** use the mock fixtures in `src/lib/api/mock/data/` to know the XI. A right name fills a slot and restarts the ring; a repeated name pulses the slot; a wrong name shakes the input.
    - **Expiry:** wait out a round. At 0 a life goes and a new round starts, with no double life loss and no request storm.
    - **Endings:** the run ends on three expiries (summary "Run over"), on 11 names ("Perfect clear"), or on Quit ("Run ended"). The summary shows the missed **count** only.
    - **The squad stays hidden:** in DevTools, search every response for a starter's name you haven't typed yet. There's no match.
    - **A lost run:** mid-run, restart the backend, then guess. "Couldn't send your guess", with Back to filters, and no endless toasts.
    - **Stale guest start** (from W28): sign in in a second tab, then press Start in the first. The run starts as the signed-in account.
    - **Empty pool:** filter to a club with no match in an era. The widen gate names the filter.
  - **Mock mode:** `/play/solo`, `?state=` and `?scenario=rateLimited` behave as before.

**Deviations recorded during implementation**

- **`sample` ignores a reply that arrived before its request** (a negative round trip, from a local clock stepping back). It keeps the last good offset.
- **`failureOf(queryClient, error)` is a module-level helper in `use-solo-run.ts`.** It runs the session-loss rule, then `apiErrorOf`. Every solo catch uses it, eight in all.
  - As a function inside the hook, it tripped `react-hooks/exhaustive-deps` in the sync and summary effects.
  - Hoisted, those two effects list `queryClient` instead, which never changes.
- **`sampleRoundStart(session, sentAt)`** is a module-level helper. It reads `Date.now()` for the reply time and samples only when the session has a round. A `correct_new` that completes the XI has no next round, so it gives no sample.
- **`RUN_GONE_ERRORS`** (`not_found`, `unauthorized`) in `solo-run.ts` decides which guess failures end the run screen. `guessFailed` sends those through the existing `failed` branch with step `guess`.
- **`unauthorized` joins `LEAVING_ERRORS`** for every step, not just guesses. A 401 on find, sync, quit or the summary now offers Back to filters instead of a retry. That's correct: the session is gone, and the next Play starts a fresh guest.
- **Dev previews** (`/dev/ring`, `?state=`) build rounds from `Date.now()`, and the ring now reads `serverClock.now()`. In a tab where a real run already took a sample, a preview is off by that offset, which is tens of milliseconds locally. It's dev-only, and a fresh tab is exact.
- **Tests:** 879 in total, 10 of them new.
  - `server-clock.test.ts`, 7:
    - the local clock before any sample
    - the midpoint offset
    - following the local clock afterwards
    - a browser ahead of the server
    - a fast sample kept over a slow one, and a slow one replaced by a fast one
    - a negative round trip ignored
  - `solo-run.test.ts`, 3:
    - `not_found` and `unauthorized` on a guess each end the run screen: the gate is "Couldn't send your guess" with the backend's message and Back to filters, with no toast and the input locked
    - `invalid_input` still toasts and stays live
- **Checked in the browser,** in real mode: a real-mode `next start` build on 3200, against a second backend on 8081 with `WEB_APP_URL=http://localhost:3200`. The backend's `.env` already had `MATCH_POOL_INCLUDE_UNSCORED=true`, and its build matched B33.
  - **Filters:** `/play` loaded the real catalog, and Start was enabled.
  - **Start:** Start made a fresh `GET /auth/session`, then `POST /auth/guest`, then `POST /solo/sessions`. The offer was Valdoria v Ostrenia (Global Nations Cup, 5 July 2006).
  - **Round 1:** picking Valdoria started round 1, with the ring at 14 s and the full match header.
  - **Guesses** (the XI read from `src/lib/api/mock/data/matches.ts`):
    - "Montesinos" filled the GK slot as "Álvaro Montesinos" and reset the ring to 14 s
    - "Montesinos" again showed "Already named"
    - "Ronaldinho" showed "Not in this XI" and kept the text
  - **Expiry:** each sync at 0 made one `GET` plus one or two 250 ms retries while the 400 ms grace window ran. There was no storm.
  - **Endings:** three expiries ended the run: "Run over", "You named 1 of 11", accuracy 33%, "Missed 10" as a count only, and the time per round.
  - **The squad stays hidden:** the session and summary bodies were fetched again, and none of the 10 unnamed surnames appeared. Montesinos did, and `missed` was `null`.
  - **A lost run:** mid-run, the backend was restarted (2 s) and a guess sent. The gate showed "Couldn't send your guess", "That run no longer exists." and Back to filters, with no toast.
  - **Stale guest start:** on `/play` as `guest-2j9gi6mf`, the session was signed out with a direct `POST /auth/sign-out`, standing in for another tab. Start then made a fresh `GET /auth/session` (`null`), then `POST /auth/guest`, then `POST /solo/sessions`, and the run started as `guest-sknx511j`.
  - **Empty pool:** `/play/solo?club=<Kaltmark>&from=2002&to=2002` showed "No match for those clubs", "No match fits those filters. Try widening them." and **Include every club**.
  - **Console:** only the expected 404s (the lost run's guess, and the missing favicon).
  - **Mock mode,** on the developer's dev server on 3000: Start, then a side, then the ring counting down 14 s to 12 s two seconds later.
  - **Clean up:**
    - the two test guests were deleted (no `game_sessions` rows exist before B34)
    - both test servers were stopped, and the build was redone in mock mode
    - the developer's servers on 3000 and 8080 were untouched
- **Observations left for later phases:**
  - **The first run of a session can lose lives while the player reads.** The backend's clock starts on `chooseSide`, and the selector is random. That's the rules working, not a bug. B34 and W32 will show it in history.
  - **The skew correction was only seen at ~0 locally.** A skewed clock can't be faked in the browser without changing the OS clock. The unit tests cover the arithmetic, including negative offsets.
- **Review:**
  - **Every goal is met.** One change: two comments over the 50-character limit were shortened, in `server-clock.ts` and its test.
  - **Sample accuracy:**
    - The midpoint estimate assumes the server read its clock halfway through the round trip. `chooseSide` reads it **on receipt**, then loads the squad from the database before replying, so its sample is early by half that load time. The ring then shows a little extra time.
    - A `correct_new` guess runs in memory, so its round trip is short. The shortest-round-trip rule then replaces the `chooseSide` sample with it.
    - Either error is far below the 400 ms grace window, and the server decides expiry either way.
  - **`ServerClock` stays in `src/lib/server-clock.ts`.** Other `lib` modules (`duel-status`, `match-header`, `system-states`) export their own small types inline too.
  - **The rules stay on the server:** the client still only syncs at its 0, and the server's catch-up decides every life.
- **`/feature test`:** 3 new tests, 882 in total.
  - **The gap:** the choice of which guess responses may sample the clock sat inline in the hook, untested. An `already_found` or `not_in_xi` response carries the round that started **earlier**, so sampling it would shift the clock by up to 15 s.
  - **The fix:** `receiptRoundOf(response)` in `src/lib/solo-run.ts`, a pure function that returns the new round only for `correct_new`. The hook's `sampleRoundStart` now takes a `RoundTiming | null`:
    - `chooseSide` passes `session.round`
    - a guess passes `receiptRoundOf(response)`
  - `solo-run.test.ts`, 3:
    - a `correct_new` gives the next round
    - a `correct_new` that completes the XI gives `null`
    - `already_found` and `not_in_xi` give `null`
  - **The tests are proven to fail:** with `receiptRoundOf` returning `session.round` for every outcome, "ignores the running round on any other outcome" failed. The line was then restored.
  - **The refactor wasn't re-run in the browser.** It only changes how the round reaches `sampleRoundStart`. The type check, the reducer tests and the earlier real-mode run cover it.
  - **Coverage, traced by hand:**
    - `server-clock.ts`: no sample, midpoint, follow, browser ahead, fast kept, slow replaced, negative round trip
    - `receiptRoundOf`: all three outcomes, plus the finished XI
    - the `guessFailed` branches: run gone (`not_found`, `unauthorized`), `session_over`, `rate_limited` and a plain toast
    - `failureOf` composes `isSessionLost` and `clearSession`, which W28 tests directly and through both caches
  - Components (`CountdownRing`, `GameCanvas`, `ReconnectChip`) only swapped their time source. They get no unit tests, per the standards, and were checked in the browser.

## History
