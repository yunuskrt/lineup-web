# Phase W32 — Profile Wiring

## Status

Completed

## Goals

- **A stale history cursor restarts from the first page.** Today a failed "Show more" retries `fetchNextPage` with the same cursor, so a cursor the backend refuses (`invalid_input`, "That history page is not available. Start again.") fails forever.
  - `src/lib/profile.ts`: a pure `isStaleCursor(error)`, true only for an `ApiRequestError` with code `invalid_input`.
  - `src/components/profile/ProfileScreen.tsx`: when the next-page error is a stale cursor, the retry resets the history query (`queryClient.resetQueries` on `[...HISTORY_QUERY_KEY, userId]`), which refetches from page one. Any other next-page error keeps today's `fetchNextPage` retry.
  - The failure still shows inline first ("Couldn't load more games." and the retry), so it never fails silently.
- **The mock's streak follows the backend** (Open Questions 1). `src/lib/api/mock/api-client.ts`: a life lost to the clock in `tick` resets `currentStreak`, as `lineup-backend/src/game/summary.ts` does. The solo summary's best streak and the profile's `bestStreak` then match real mode.
- **Guest sign-in copy** (Open Questions 2). `src/components/auth/AuthPanel.tsx`: a guest on the **sign-in** tab reads that signing in to another account leaves this guest's games behind. Sign-up keeps "Create an account to keep your history."
- **`context/docs/mock-to-backend-map.md`:** the Profile and persistence rows are marked live from W32 (B14, B34). Duel history stays on B41/W31.
- **Tests:**
  - `src/lib/profile.test.ts`: `isStaleCursor` is true for `invalid_input`, and false for `network`, `server_error`, `rate_limited`, `unauthorized` and a non-API error.
  - `src/lib/api/mock/api-client.test.ts`: a correct name, then an expired round, then a correct name gives a best streak of 1, not 2. Three correct names in a row still give 3.

## What the web already does

Nothing below needs code, but each item gets checked in real mode (Verification).

| Backend behaviour | Web today |
| --- | --- |
| `GET /profile`, `GET /profile/history` | Called by the W27 HTTP client. The shapes match the OpenAPI document (`Profile`, `UserStats`, `HistoryPage`, `HistoryEntry`) |
| A run saved when it ends | `useProfile` and `useHistory` keep `staleTime: 0`, so opening `/profile` after a summary refetches both |
| A run that appears late | No error state for a missing newest entry. The next mount or window focus picks it up |
| All zeros for a new user | `accuracyStat` shows "—" for 0 played, `favouriteClubStat` shows "None yet", and the history shows "No games yet" |
| `wins`, `losses`, `draws` at 0 | The duel record shows its empty state; `soloRunCount` is `played` minus duels |
| Upgrade keeps the user id | Both queries are keyed by user id; the ready view takes `user` from the session, so the Guest tag goes at once (W24b) |
| Signing in to a different account | A new user id means new query keys, so the guest's numbers never show |
| A 401 | W28's `QueryCache` `onError` clears the session; `/profile` shows `signedOut` |
| A 429 on any call | The transport parses the envelope for any status. `authErrorMessage` turns `rate_limited` into "Too many attempts. Try again in N seconds." on every surface that shows errors. `shouldRetryQuery` doesn't retry it |
| `crestUrl` and `imageUrl` are `null` | History rows show club names only; the favourite club is its name |

## Open Questions

Both settled at `/feature load`, each as recommended.

1. **The mock's streak rule.** The backend breaks a streak on a life lost to the clock too, both in the solo summary (B33) and in `bestStreak` (B34). The mock breaks it only on a wrong or repeated name.
   - **Recommended: align the mock** (Goals). The mock is the server's stand-in, so mock mode stays a faithful preview. It's a one-line rule change plus a test.
   - **Leave the mock as it is.** Mock and real mode then show different streaks for the same play.
2. **A guest signing in to another account.** The backend doesn't merge the guest's history into it yet (deferred). Today the sign-in tab doesn't say so.
   - **Recommended: say so on the sign-in tab** (Goals), in one line. Nothing is destroyed, since the guest's games stay on the guest, but a player shouldn't expect them to follow.
   - **Add nothing.** The sign-up tab already points guests to the path that keeps history.

## Out of Scope

- **Duel history and the win/loss/draw record:** B41 writes them, and W31 wires duels.
- **Merging a guest into an existing account:** deferred on the backend.
- **Crests and headshots:** B23–B24.
- **Pro breakdowns and the `missed` list:** monetization is Deferred; `tier` is always `free`.
- **Retrying a 429 automatically:** the message names the wait, and "Try again" is the player's choice.

## Notes

- Scope: the profile screen against the real B14 and B34 endpoints, the stale-cursor restart, and the mock's streak rule. No contract change.
- Depends on: W24a/W24b (profile panels, hooks, `profileScreenView`), W27 (HTTP client), W28 (session-loss rule), W29 (real solo runs), backend B14, B34 and B35.
- Constraints:
  - **The server computes every stat** (HC 1). The web formats `accuracy` and the counts; it never recomputes them from history.
  - **Guest upgrade never destroys history** (HC 12). The real upgrade is in place, so the same id carries everything.
  - **Never fail silently.** A failed or stale history page shows inline with a retry; a 429 names its wait.
  - No `any`; `@/` imports; comments single-line, at most 50 characters.
- Verification:
  - `npm test`, `npm run lint`, `npm run format:check` and `npm run build` pass.
  - **Real mode setup:** the backend runs with `MATCH_POOL_INCLUDE_UNSCORED=true`, and with `RATE_LIMITS_ENABLED=false` while testing the upgrade flow. `.env.local` is on `real`.
  - **New guest:** play nothing, then open `/profile`. `signedOut` with no guest created. Start a solo run, quit it, then open `/profile`: the Guest tag, the upgrade strip, one solo row ("Run ended"), Solo runs 1, accuracy and best streak from that run, and the favourite club set to the side picked.
  - **Each ending:** a lives-out run and a perfect clear each add a row with the right label and `foundCount`. Perfect clears goes up by one.
  - **Streak:** name one, let a round expire, name another. Best streak is 1 in the summary and on `/profile`, in both modes.
  - **Upgrade:** create an account from the strip. Back on `/profile`, the Guest tag is gone and the history and stats are the same.
  - **Different account:** as a new guest with one run, sign in to an existing account. `/profile` shows that account's own history, and the sign-in tab had shown the note.
  - **Paging:** temporarily set `DEFAULT_HISTORY_LIMIT` to 1. "Show more" walks every run once, newest first, then stops. Revert.
  - **Stale cursor:** with the limit at 1, block or rewrite the next-page request in DevTools to send a random UUID. "Couldn't load more games." shows, and the retry reloads from the first page.
  - **429:** exhaust `/profile`'s 120/min with a curl loop on the session cookie, then reload `/profile`. The error notice names the wait, and "Try again" recovers after it.
  - **401:** sign out in another tab, then refocus `/profile`. It shows `signedOut`.
  - **Mock mode:** `/profile`, `?state=` snapshots and the W24b flows behave as before.

**Deviations recorded during implementation**

- **The stale-cursor retry calls `history.refetch()`, not `resetQueries`.** In TanStack v5 a refetch walks the pages from page one and recomputes every cursor from the fresh pages, so a refused cursor is never sent again.
  - `resetQueries` would empty the cache first, and the whole profile would fall back to its skeleton.
  - With `refetch`, the rows on screen stay while the restart runs.
- **`moreState` shows `loading` during a refetch.** `ProfileScreenInput['history']` gains `isRefetching`.
  - Without it, the button read "Show more" again during the restart, and a click would cancel the refetch.
  - It applies only while there is a next page (review fix, below). At the end of the list a background refetch leaves `end` alone; with a next page, the button reads "Loading…" for that refetch, in the same space.
- **The mock resets the streak in `tick`** when `lives.you` drops, the only place a life goes to the clock.
- **The guest note** replaces the `null` that the sign-in tab rendered after "You're playing as …": " Signing in to another account leaves this guest's games behind."
- **Tests:** 890 in total, 8 new.
  - `profile.test.ts`, 7: `isStaleCursor` for `invalid_input`, for four other codes and for a non-API error; `more: loading` while refetching.
  - `api-client.test.ts`, 1: three names, an expiry, then a name give a best streak of 3, not 4; a name, an expiry, then a name give 1.
  - **The streak test is proven to fail:** without the `tick` reset it got 4, not 3. The line was then restored.
- **Paging and the stale cursor were checked without editing `DEFAULT_HISTORY_LIMIT`.** Playwright rewrote `limit=20` to `limit=1` on each history request, and for the stale case also put a random UUID in as the cursor.
- **Checked in the browser,** in real mode: a real-mode `next start` build on 3200, against a second backend on 8081 with `WEB_APP_URL=http://localhost:3200`. The backend's `.env` already had `MATCH_POOL_INCLUDE_UNSCORED=true` and `RATE_LIMITS_ENABLED=false`, and its build matched B35.
  - **New guest:** signed out, `/profile` showed "No profile yet" and created no guest.
  - **First run:** a Valdoria run of name, name, expiry, name, then Quit. The summary showed best streak 2.
    - `/profile` showed the Guest tag, the strip, Solo runs 1, best streak 2, accuracy 100% and favourite club Valdoria.
    - It had one "Run ended" row with 3 of 11.
  - **Each ending:**
    - A perfect clear (Yıldırımspor, 11 of 11, 3 lives) and a lives-out run (Serevia, three expiries) each added a row.
    - Perfect clears became 1 and best streak 11.
    - Accuracy stayed 100%, 14 of 14 judged.
    - The favourite club became Serevia: one game each, and the tie goes to the most recent.
  - **Paging at limit 1:** three pages, every run once, newest first, then "Show more" was gone. Focus stayed on the button while rows appended.
  - **Stale cursor:**
    - The backend returned `invalid_input`, "That history page is not available. Start again."
    - The row showed "Couldn't load more games." and Try again.
    - The retry requested page one with no cursor, and "Show more" worked after it.
  - **Upgrade:** Create account from the strip. The form named the guest, then landed on `/play` (W18b). `/profile` showed the new handle, no Guest tag, and the same 3 runs and stats.
  - **Different account:**
    - A new guest played and quit twice. The first run was an interrupted attempt, ended as `quit` when the next run started.
    - The sign-in tab showed the new line.
    - After signing in, `/profile` showed the account's own 3 runs, and none of the guest's.
  - **401:** `POST /auth/sign-out` sent straight from the page, then a `visibilitychange`. `/profile` and `/profile/history` returned 401, and the page and nav switched to signed out.
  - **429:** with the test backend restarted on `RATE_LIMITS_ENABLED=true` (an env var; the `.env` file was untouched):
    - 125 `/profile` calls gave 120 × 200 and 5 × 429.
    - `/profile` then showed "Couldn't load your profile", "Too many attempts. Try again in 60 seconds." and Try again.
    - No request went out during the wait. After 61 s, Try again recovered with one request.
  - **Mock mode,** on a mock-mode `next start` build on 3200:
    - The same play gave best streak 2 in the summary and on `/profile` (3 under the old rule).
    - The sign-in tab showed the guest line.
  - **`?state=` snapshots** (`more-failed`, `loading`, `guest`) were checked on the developer's dev server on 3000. They are dev-only and call no API.
  - **Console:** only the expected errors: the missing favicon, the stale cursor's 400, the 401s and the 429s.
- **The developer's dev server on 3000 runs in real mode** (`.env.local`: `real`, `http://localhost:8080`).
  - Cookies on localhost are shared across ports, so it picked up the test account's session.
  - One mock-mode check run there was in fact a real run on the 8080 backend, under the test account. Both backends share the database, and the cleanup removed it.
  - Neither of the developer's servers was restarted or changed.
- **Clean up:**
  - The two test users were deleted (`w32_mvdvmjur`, the upgraded first guest, and `guest-tsvc2kfg`).
  - `game_participants.user_id` is `ON DELETE RESTRICT`, so their 6 solo sessions were deleted first, in one transaction. Each had only that user as a player, and the sessions cascade to participants, rounds and guesses.
  - No other user was created in that window.
  - Both test servers were stopped. The review's `npm run build` then rebuilt `.next` from `.env.local`, as a plain build does.
- **Review:**
  - **Every goal is met,** with the two deviations above (`refetch` over `resetQueries`, and `isRefetching`).
  - **Bug fixed: a "Loading…" flash at the end of the list.**
    - `moreState` returned `loading` for any `isRefetching`, and TanStack also sets it for background refetches on mount and window focus.
    - At the end of the history, `end` renders nothing, so each refocus would have popped a "Loading…" button under the last row and then removed it.
    - `loading` now needs `hasNextPage` too. During the restart the old pages still end in the refused cursor, so `hasNextPage` stays true and the restart still reads as loading.
    - One more case in `profile.test.ts`: refetching with no next page stays `end`. Tests: 891 in total, 9 new.
  - **One comment was 51 characters,** over the limit. It was shortened in `ProfileScreen.tsx`.
  - **Left as is:** if the restart's refetch itself fails (say, offline), the rows stay and the button reads "Show more" again, with no error line. The next click resends the refused cursor, gets `invalid_input`, and shows "Couldn't load more games." again, so the player always gets an answer.
  - **No scope creep.** `isRefetching` is the one addition, and it exists for the restart.
  - **The rules stay on the server:** the web formats `accuracy` and the counts, and the mock's streak change sits in the mock adapter, the server's stand-in.
- **`/feature test`:** 1 new test, 892 in total.
  - **The gap:** the streak test only reached the expiry through `syncSession`. A guess that arrives after an expiry, with no sync first, also catches up through `tick`, before the guess counts. If the reset ever moved after the increment, nothing would catch it.
  - `api-client.test.ts`, 1:
    - two names, then an expiry with no sync, then two names
    - both late names are `correct_new`, a life is gone, and the best streak is 2
  - **Mutation checks:**
    - Without the `tick` reset, both streak tests fail: 4, not 3, and 4, not 2.
    - With `moreState`'s refetch rule loosened to any `isRefetching`, "refetching with no next page stays `end`" fails.
    - With the rule removed, "refetching with a next page is `loading`" fails.
    - Each line was then restored.
  - **Coverage, traced by hand:**
    - `isStaleCursor`: `invalid_input`, four other codes, and a non-API error
    - `moreState`: idle, loading on a next page, loading on a refetch with a next page, `end` on a refetch without one, failed, end
    - the mock streak: a run of three, expiry through sync, expiry through a guess, and a fresh run
- **Manual testing:** the guide is `context/docs/w32-manual-testing.md`.
  - Step 3.5 was corrected after a developer run: keep a second Incognito tab open, since closing the last one deletes the guest's cookie.
  - **Claude ran it** on the developer's servers (3000, 8080) without editing it:
    - Parts 0–7 and 10 passed; 8 and 9 were skipped by choice.
    - Part 5 used a Playwright response rewrite in place of Chrome's override.
  - **Observation, from W24a/W24b:** when "Show more" disappears at the end of the list, keyboard focus falls back to the page. Left for a later fix.
  - **`ProfileScreen.showMore`** picks between `refetch` and `fetchNextPage` from two flags, both tested above. It's a component, so it gets no unit test, per the standards. The real-mode run covered both branches: the stale cursor, then "Show more" after the restart.

### Backend context for W32 (Profile Wiring)

The backend (lineup-backend, http://localhost:8080) now has real history and stats.
The contract source of truth is http://localhost:8080/docs/openapi.json; shapes are
unchanged from api-contract.md §4 (`GET /profile`, `GET /profile/history?cursor=&limit=`).

#### When entries appear
- A solo run is saved when it ends (perfect clear, lives out, quit), before that call's
  response returns. Re-fetching history after the summary shows the run.
- If that save fails, the backend retries within ~1 minute, so a just-finished run can
  appear late. Don't treat a missing newest entry as an error.
- A run the player abandons mid-play is saved within ~1 minute as `lives_out`.
  `playedAt` is when the run really ended, not when it was saved.
- An offer with no side chosen never appears.
- Duel entries: none until backend B41. `wins`, `losses` and `draws` stay 0 until then.

#### Stats rules (the server computes them; the web never recomputes)
- `played`: every finished solo run, quit included.
- `accuracy`: lifetime correct new names ÷ all judged guesses. A guess refused as late
  or rate limited doesn't count.
- `bestStreak`: the best single run, never a sum. **It differs from the mock:** a streak
  also breaks on a life lost to the clock, not only on a wrong or repeated name.
- `perfectClears`: count of perfect clears.
- `favouriteClub`: the club the user played as most often, with a tie going to the most
  recent game. It's `null` for a new user.
- A user with no finished game gets all zeros (not an error).

#### History paging
- Newest first by `playedAt`. `limit` is 1–50, default 20. `nextCursor` is opaque (it's a
  session id); pass it back as-is. `null` means no more pages.
- A bad or stale cursor → `invalid_input`, "That history page is not available. Start again."
  Restart from the first page.
- `foundCount` = the number of correct new names in that run.

#### Guest → account
- `POST /auth/upgrade` upgrades in place: the user id stays the same, so history and stats carry over.
- A guest who signs in to a **different, existing** account does not bring the guest's
  history along (deferred). That account's own history shows instead.

#### Other things W32 will see
- `tier` is always `free` for now. The solo summary's `missed` is `null` for free users.
- `crestUrl` and player `imageUrl` are `null` until backend B23. Render the fallback.
- `User` includes `emailVerified` (since B11b).

#### Rate limits (B35)
- Every route is limited. `/profile` and `/profile/history` get 120/min per user each.
  Any call can return 429 `rate_limited` with `retryAfterMs`, a `Retry-After` header and
  a message like "Too many attempts. Try again in 42 seconds." Handle it generically,
  even where api-contract.md doesn't list it.
- Auth limits that matter when testing the upgrade flow:
  - `POST /auth/guest`: 10/hour per IP
  - `POST /auth/sign-up`: 5/hour per IP
  - `POST /auth/upgrade`: 5/hour per user
  - `POST /auth/sign-in`: 10 per 15 min per IP, plus 5 per 15 min per email
- To test the upgrade flow locally without hitting these, set `RATE_LIMITS_ENABLED=false`
  in the backend's `.env` and restart it. Never do this in production; the backend
  refuses to boot with it off there.

## History
