# Phase W28 — Auth Wiring

## Status

Completed

## Goals

- **Contract sync: `User.emailVerified`** (backend B11b).
  - `src/lib/api/schemas/user.ts`: `userSchema` gains `emailVerified: z.boolean()`. The type follows through `z.infer`.
  - The mock sets it, so both states stay reachable without a backend:
    - `false` for a guest and after sign-up or upgrade
    - `true` after sign-in, which models an account confirmed earlier
  - Every fixture and test that builds a `User` includes it.
- **Contract sync: the handle character rule** (B10a), `^[A-Za-z0-9_.-]+$`:
  - `handleSchema` in `src/lib/api/schemas/auth.ts` gains the regex, applied after `trim`, as on the backend.
  - `src/lib/auth.ts`: `AUTH_FIELD_MESSAGES` gains `handleCharacters`: "Use letters, digits, _ . or - only." `fieldMessage` picks it for a format issue, and keeps the length message for a length issue.
  - The mock's guest handle changes from `Guest N` (which has a space, so the backend would refuse it) to the backend's shape: `guest-` plus 8 lowercase base-36 characters.
- **A lost session signs the player out everywhere** (Open Questions 2). The rule lives in `src/lib/api/session-loss.ts`, in a pure `isSessionLost(error, meta)`:
  - `unauthorized` from any query, or from any mutation not marked as a credential check, means the session is gone: expired, signed out in another tab, or deleted on the server.
  - **`useSignIn` is marked** (`meta: { isCredentialCheck: true }`), because its `unauthorized` means a wrong password. A guest who mistypes stays a guest.
  - `QueryProvider` wires it through `QueryCache.onError` and `MutationCache.onError`. On a lost session it writes `null` to the session query and removes the profile and history queries, as `useSignOut` does.
  - The screens already render signed out. `/profile` shows its `signedOut` notice, instead of the backend's "Sign in or continue as a guest first." with a Try again that can never succeed.
- **The guest start rechecks the server** (Open Questions 3). `useEnsureSession` fetches the session fresh (`staleTime: 0`) instead of trusting a cache that's up to 5 minutes old.
  - Today a cached `null` while another tab has signed in would call `POST /auth/guest`, which the backend answers with `forbidden` ("Sign out first.").
  - Today a cached guest whose session has since expired would start a run as nobody.
  - The decision moves into a plain `ensureSession(queryClient)` in `src/hooks/use-auth.ts`, which the hook wraps, so it can be unit tested.
- **Tests:**
  - `src/lib/api/session-loss.test.ts`:
    - `unauthorized` from a query → lost
    - from a marked mutation → not lost
    - from an unmarked mutation → lost
    - every other code → not lost
  - `src/lib/auth.test.ts`: the handle character message, with length still winning for a too-short handle of bad characters
  - `src/hooks/use-auth.test.ts`, on a real `QueryClient` with a stub `ApiClient`:
    - `ensureSession` asks the server even when a session is cached
    - it returns the server's session without creating a guest
    - it creates a guest only when the server says `null`
  - mock tests:
    - `emailVerified` on guest, sign-up, sign-in and upgrade
    - the guest handle passes `^guest-[a-z0-9]{8}$`
    - a handle with a space is refused with `invalid_input`

## States

| Where        | Condition                                        | Shows                                                                                   |
| ------------ | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| Any          | A query or unmarked mutation gets `unauthorized` | The session becomes `null`; nav shows "Sign in"; `/profile` shows its signed-out notice |
| `/sign-in`   | Wrong password, signed in as a guest             | "Email or password is incorrect."; still the guest                                      |
| Sign-up form | Handle with a space or `!`                       | "Use letters, digits, _ . or - only." under the field; nothing sent                     |

## Open Questions

All three settled at `/feature load`: 2 and 3 as recommended; 1 the other way, so the verification UI is left out (see Out of Scope).

1. **How much verification UI?** The backend sends the mail and the link lands on `/profile`, but there's no resend endpoint.
   - **Recommended: the note and the link-failure notice only.** Without them, the `?error=` the backend adds is a silent failure, and an unverified player has no idea a mail was sent.
   - **The alternative is to transcribe the field only, with no UI** until a resend endpoint exists. It's smaller, but the redirect lands on a page that ignores why it was sent there.

   **Decided: field only, no UI.** `emailVerified` is transcribed and the mock sets it; nothing reads it yet.

2. **Where does a lost session get handled?**
   - **Recommended: once, in `QueryProvider`,** for every query and every mutation except sign-in. Every screen gets it for free, including W29's solo endpoints and W32's history.
   - **The alternative is per screen.** It's more explicit, but each new screen has to remember, and `/profile` is already wrong today.
3. **`useEnsureSession` freshness.**
   - **Recommended: always refetch before deciding.** It's one cheap `GET /auth/session`, made only when a run starts.
   - **The alternative keeps the cache and recovers from `forbidden`** by refetching. It saves the GET but needs an error branch the recommended version doesn't.

## Out of Scope

- **Verification UI** (Open Questions 1): no "confirm your email" note, and no notice for `/profile?error=` after a failed link. It waits for a resend endpoint, which would give it something to offer.
- **Resend verification, password reset, email change:** none is in the contract (B11b Out of Scope).
- **A guest signing in to an existing account leaves the guest's games behind** (B11a Open Questions 2). Guests have no history until B34, so no warning yet. B34 decides about merging, and W32 shows the outcome.
- **Reserving the `guest-` prefix** for generated handles. A registered player can pick one; changing that is a contract change (B11a observation).
- **`GET /auth/token`:** W30.
- **Rate-limit copy for auth** (`rate_limited` with `retryAfterMs`) already exists in `authErrorMessage`. The backend starts sending it at B35.
- **Cross-tab sync** (e.g. `BroadcastChannel`). A stale tab learns about a sign-out on its next request, through the lost-session rule.

## Notes

- Scope: the web's auth against the real Better Auth backend. Contract sync, session loss and a fresher guest start.
- Depends on: W27 (real HTTP client), W18a/W18b (auth hooks and screens), W24 (profile screen), backend B10–B14.
- **Backend behaviour this phase relies on:**
  - `POST /auth/guest`:
    - when already a guest: returns the same guest
    - when registered: `forbidden` "Sign out first."
  - `POST /auth/upgrade`:
    - keeps the user id
    - issues a new cookie and deletes the guest's old sessions
    - refusals, in order: `unauthorized` "Sign in or continue as a guest first.", `forbidden` "This account is already registered.", `invalid_input` (handle taken, email in use)
  - **Wrong credentials:** "Email or password is incorrect." (`unauthorized`), for an unknown email too.
  - **Sessions:** 30 days, renewed on use (`GET /auth/session` re-issues the cookie after a day).
  - **Guarded routes:** answer `unauthorized` with "Sign in or continue as a guest first."
  - **Verification:** `GET /api/auth/verify-email` redirects to `${WEB_APP_URL}/profile`, with `?error=INVALID_TOKEN` or `?error=TOKEN_EXPIRED` on failure (links last 24 hours).
- Constraints:
  - **The tier and `isGuest` come from the server** (Hard Constraint 16). `emailVerified` too; the client never sets it.
  - **Guest play needs no signup** (Hard Constraint 12): the lost-session rule signs a player out, and the next Play starts a fresh guest through `useEnsureSession`.
  - **Never fail silently:** a lost session changes what the screen shows; it's never a dead Try again.
  - Colours from role utilities only; no hex.
  - No `any`; `@/` imports; comments single-line, at most 50 characters.
- Verification:
  - `npm test`, `npm run lint`, `npm run format:check` and `npm run build` pass.
  - **In mock mode:**
    - a handle with a space shows the character message
    - a guest's nav shows `guest-…`
  - **In real mode** (`.env.local` per `.env.example`, backend on 8080, app on `localhost:3000`):
    - **Upgrade:** continue as guest, then upgrade on `/sign-in?mode=sign-up`. The session reads `emailVerified: false` (React Query devtools or the network tab), and nothing breaks.
    - **Lost session:** on `/profile`, delete your row from `auth_sessions` in Prisma Studio, then go to `/play` and back. The nav shows "Sign in" and `/profile` shows its signed-out notice, with no error line.
    - **Wrong password as a guest:** the error shows and the nav still shows the guest.
    - **Stale guest start:** this can't be clicked through yet. In real mode `/play` disables Start until B25b serves the catalog. The unit tests cover it, and W29 checks it in the browser.
    - **Clean up:** delete the test users in Prisma Studio.

**Deviations recorded during implementation**

- **`clearSession(queryClient)`** is a new export in `src/hooks/use-auth.ts`. It writes `null` to the session and removes the profile and history queries. `useSignOut` and `QueryProvider` both call it, so the two ways of signing out can't drift.
- **`meta` is typed.** `src/types/query.ts` registers `MutationMeta` (`isCredentialCheck?: boolean`) on TanStack's `Register`, so `useSignIn`'s `meta` and the cache's `mutation.meta` share one type.
- **`isSessionLost` only trusts `ApiRequestError`.** A thrown non-API error never signs the player out, even if its message says "unauthorized".
- **`ensureSession` uses `queryClient.query({ ...sessionQuery, staleTime: 0 })`.** `fetchQuery` is deprecated in this TanStack version.
- **`HANDLE_PATTERN` is exported** from `src/lib/api/schemas/auth.ts`, so the mock test can check that a generated guest handle passes the backend's rule.
- **The mock's `guestHandle(random)`** lives in `src/lib/api/mock/api-client.ts`. It uses the client's injected `random`, so tests are deterministic (`0.99` gives `guest-zzzzzzzz`).
- **Test fixtures:** `Guest 1` handles became `guest-1abc2def`, and every `User` fixture gained `emailVerified`. `SAMPLE_USER` is `true`, a verified account; guests are `false`.
- **W27's `http/api-client.test.ts` "parses a session" fixture gained `emailVerified`.** The stricter schema now reports its absence as drift (`server_error`), which is the intended behaviour.
- **Tests:** 864 in total, 23 of them new.
  - `session-loss.test.ts`, 13: a query 401 and an unmarked mutation 401 are lost; a marked one isn't; the 9 other codes and a non-API error aren't
  - `hooks/use-auth.test.ts`, 4:
    - `ensureSession` asks the server despite a cached `null`
    - it returns the server's account over a cached guest, without creating a guest
    - it creates a guest only when the server says `null`
    - `clearSession` drops the session, profile and history
  - `auth.test.ts`, 3: bad characters (space, `!`, `ç`, `/`), allowed characters around trimmed space, and length named before characters
  - `mock/api-client.test.ts`, 3: the guest handle shape; `emailVerified` across guest, upgrade, sign-up and sign-in; a handle with a space refused, leaving no session
- **Checked in the browser.**
  - **Mock mode,** on the developer's dev server on 3000, which reloaded the new code:
    - the handle `two words` showed "Use letters, digits, _ . or - only.", was marked invalid, got focus, and nothing was sent
    - continue as guest showed `guest-rfrt0ko1` in the nav
    - Start solo run still reached `/play/solo` through `ensureSession`
  - **Real mode,** on a real-mode `next start` build on 3200, against a second backend on 8081 with `WEB_APP_URL=http://localhost:3200`, as in W27:
    - **Guest:** continue as guest showed `guest-i7gn55uu`.
    - **Wrong password as a guest:** "Email or password is incorrect.", and the page still said "You're playing as guest-i7gn55uu.". The credential-check exemption works.
    - **Upgrade:** as `test-w28`, the nav changed, and `GET /auth/session` returned `emailVerified: false`, parsed with no drift.
    - **Lost session:** on `/profile`, the user's `auth_sessions` rows were deleted, then Play → Profile in the nav. `/profile` and `/profile/history` each answered 401 once, with no retries. The nav switched to "Sign in", and `/profile` showed its signed-out notice ("No profile yet…") with no error line.
    - **Console:** only the expected 401 and 404 statuses and the missing favicon.
  - **Clean up:**
    - the test account and guest were deleted, and 0 test users remain
    - both test servers were stopped, and the build was redone in mock mode
    - the developer's servers on 3000 and 8080 were untouched
- **Observations left for later phases:**
  - **The mock's `continueAsGuest` always makes a new guest.** The backend returns the existing guest when one is signed in (B11a Open Questions 3). Nothing in the web calls it twice today; align the mock if a screen ever does.
  - **The mock's upgrade without a session says "Start a session before upgrading.",** where the backend says "Sign in or continue as a guest first." Both are `unauthorized`, which now clears the session either way.
- **Review:**
  - **Every goal is met.** One change: `guestHandle` was exported but only used inside its own file, so it's private now.
  - **An upgrade that gets a 401 keeps its message.** The session is cleared, but `AuthPanel` keeps `SignUpForm` in the same slot, so it stays mounted:
    - its alert still reads "Sign in or continue as a guest first."
    - "Continue as guest" reappears below it
    - the next submit is a plain sign-up
  - **The lost-session rule can't loop.** `GET /auth/session` answers `null`, never 401. A 401 isn't retried, and clearing the session disables the profile and history queries (their key's user id becomes `null`).
  - **`QueryProvider` now imports `@/hooks/use-auth`,** which registers the API client when it loads. Registration was already happening on the first page that used a hook, so a bad `NEXT_PUBLIC_API_URL` still fails at startup, just as early.
- **`/feature test`:** 5 new tests, 869 in total.
  - **The gap:** `isSessionLost` and `clearSession` were each tested, but not the wiring that joins them. If `mutation.meta` stopped reaching the check, a guest who mistyped a password would be signed out.
  - **The fix:** `createQueryClient` moved out of `QueryProvider.tsx` into `src/components/providers/query-client.ts`, a plain module beside it, so it can be tested on a real `QueryClient`. `QueryProvider` only renders now.
  - `providers/query-client.test.ts`, 5:
    - a query 401 signs out and removes the profile, with no retry
    - a `not_found` query keeps the session
    - a sign-in-marked mutation 401 keeps the guest
    - an unmarked mutation 401 signs out
    - a failed mutation runs once
  - **The tests are proven to fail:** with `mutation.meta` removed from the call, "keeps a guest who gets a wrong password" failed. The line was then restored.
  - **Coverage, traced by hand** (no coverage tool is installed, as in W27):
    - `session-loss.ts`: every code, both meta states and a non-API error
    - `ensureSession`: cached `null`, cached guest and server `null`
    - `clearSession`: directly and through both caches
    - `fieldMessage`'s handle branch: format, length, and length before format
    - the mock's `guestHandle` and each `emailVerified` assignment, through the mock client
  - Components (`AuthPanel`, `QueryProvider`) get no unit tests, per the standards. They were checked in the browser.

## History
