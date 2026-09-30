# Phase W24b — Profile Wiring

## Status

Completed

## Goals

- Make the mock record every finished game, the way B34 and B41 will on the server:
  - `src/lib/api/register.ts` creates one `MockStore` and passes it to both `createMockApiClient({ store })` and `createMockDuelClient({ store })`. Each keeps a private store when none is passed, so the existing tests are unchanged.
  - When a duel finishes, `src/lib/api/mock/duel-client.ts` writes to `store.identity`, if there is one:
    - A `mode: 'duel'` history entry with the outcome, `foundCount` set to the whole found pool, and `livesRemaining` set to your lives.
    - `played + 1`, plus a win, loss or draw. `forfeit_win` counts as a win. Your own forfeit counts as a loss.
    - The team you named is added to `playedAs`, so it counts toward the favourite club.
  - Lifetime accuracy becomes honest. `MockIdentity` carries `guessCount` and `hitCount` across all games, and `accuracy` is their ratio. Today `finalize` overwrites it with the last run's figure. Only your own guesses count in a duel.
  - Tests go in `api-client.test.ts`, `duel-client.test.ts` and `store.test.ts`:
    - A solo run and a duel both land in history, newest first.
    - Win, loss, draw, forfeit win and your forfeit each move the right counter.
    - Accuracy spans runs.
    - Guest upgrade keeps the history and stats.
    - Paging walks every entry exactly once.
- Add `src/hooks/use-profile.ts`:
  - `useProfile()` is a query on `['profile', userId]`, enabled only when the session has a user.
  - `useHistory()` is an infinite query on `['history', userId]`:
    - `initialPageParam: null`.
    - `limit: DEFAULT_HISTORY_LIMIT`.
    - `getNextPageParam` reads `nextCursor`.
  - Keying by user id means signing out, signing in or starting a new guest never shows another identity's numbers.
  - The default `staleTime` of 0 is kept, so opening `/profile` after a game refetches it.
- Add `profileScreenView(input)` to `src/lib/profile.ts`, pure and tested. It turns the session, profile and history query states into a `ProfileScreenView`:
  - A pending session, or a pending first profile or history page, gives `loading`.
  - No session user gives `signedOut`. Visiting `/profile` never creates a guest, because a guest is created by playing.
  - A failed profile or first history page gives `error`, with `authErrorMessage`.
  - Otherwise it gives `ready`, with the flattened pages. `more` is:
    - `loading` while fetching the next page;
    - `failed` after that fetch errors;
    - `end` when there is no next page;
    - `idle` otherwise.
- Add `src/components/profile/ProfileScreen.tsx`, the wired client component:
  - It reads the session and both hooks and renders `ProfileView` with `profileScreenView`.
  - "Try again" refetches the failed query or queries. "Show more" and its retry call `fetchNextPage`.
  - Focus stays on the "Show more" button while rows append, and the sr-only status announces "N more games".
- Update `src/app/(site)/(pages)/profile/page.tsx`. It renders `ProfileScreen` unless there is a dev `?state=`, and drops the W24a placeholder.

## Flows

| Flow                        | Expected                                                                                              |
| --------------------------- | ----------------------------------------------------------------------------------------------------- |
| Signed out, open `/profile` | `signedOut` notice. No guest created. "Play" goes to `/play`                                          |
| Guest after one solo run    | Guest tag and upgrade strip. One solo row. Solo runs at 1, duel record empty                          |
| Guest after a duel          | A duel row with the right outcome. The record and bar update                                          |
| Create account from strip   | `/sign-in?mode=sign-up` upgrades the guest. Back on `/profile`: no Guest tag, same history and stats |
| Sign out, then open again   | `signedOut`. No stale numbers from the previous identity                                              |
| More than 20 games          | "Show more" appends the next page with no duplicates, then disappears at the end                      |
| Profile request fails       | Error notice. "Try again" recovers                                                                    |

## Out of Scope

- Pro breakdowns, handle editing, crest images and per-row summaries, as in W24a.
- The mock duel handle still reads "You" rather than your handle. It's fixed with the real session in W30/W31.
- Returning to `/profile` after upgrading. The sign-in page's signed-in panel and the nav handle already link back.
- Protocol refused, rate limited and connection lost → W25.

## Notes

- Scope: data and wiring only. Every visual state already exists from W24a, so this spec changes no component's look.
- Prototypes: the three profile screenshots in `context/screenshots/` are referenced in W24a, along with the choices it overruled. Check the wired page against them at the same widths. `theme.md` and `design.md` still win any conflict.
- Depends on: W24a (`ProfileView`, `profile.ts`, snapshots), W18a (`useSession`, `unwrap`, `authErrorMessage`), W23b (the mock duel result).
- Recording in the mock is the stand-in for server persistence. The client still decides nothing, and no app code imports `src/lib/api/mock/`, only `register.ts`.
- Constraints:
  - **Guest upgrade never destroys history** (HC 12). The mock already keeps the same identity object; the tests pin it.
  - **Never fail silently.** A failed page of history surfaces inline with a retry. It doesn't just stop.
  - `@/` imports, single-line comments of at most 50 characters, no hex outside tokens.
- Backend asks, to note for B14/B34/B41:
  - History entries don't carry the side or team the player named, so rows show both clubs.
  - `played` mixes solo and duel.
  - Your own forfeit is stored as a plain `loss`.
- Deviations recorded during implementation:
  - Both mocks record through one `recordGame(identity, record)` helper in `src/lib/api/mock/store.ts`, so solo and duel counters can't drift. Solo `finalize` now calls it too. The duel mock keeps a per-match `tally` of your guesses and hits.
  - A duel records a best streak of 0: a correct name ends the turn, so there's no in-turn streak.
  - `useProfile()` and `useHistory()` read the session themselves, rather than taking a user id, so callers can't pass the wrong one.
  - A failed session query also gives `error`, a case the spec didn't list. A failed background refetch keeps the data it already has, so only a query with no data shows the error page.
  - TanStack's default three retries are kept, like every other query. A failing profile shows the skeleton for about 7 seconds before the error notice.
  - The sr-only status reads "Showing N games" (W24a's `HistoryMore`), not "N more games". It announces the total, which also reads correctly after a retry.
  - Paging was checked in the browser with the page size temporarily set to 1, then reverted.
  - Creating an account from the guest strip lands on `/play` (W18b's existing redirect). The nav handle leads back to the profile, as the Out of Scope list expected.
  - With games played but no guesses, accuracy reads "0%", because the contract only carries the ratio.
  - The ready view takes `user` from the session, not the cached profile. After a guest upgrades, the sign-up writes the session at once, but the profile cache would show the Guest tag and strip until the refetch.
  - Signing out removes the cached profile and history, so a previous identity's data doesn't stay in memory. The keys live in `src/lib/query-keys.ts`, since `use-auth` importing `use-profile` would be a cycle.
- Verification:
  - `npm test`.
  - In the browser, at 1440, 834 and 390, walk every row of the Flows table on the mock. For paging, temporarily lower the limit, then revert.
  - `npm run build`.

## History
