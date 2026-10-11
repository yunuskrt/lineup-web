# Phase W27 — Real API Client

## Status

Completed

## Goals

- **Env config**, in `src/lib/api/config.ts`:
  - `NEXT_PUBLIC_API_URL` sits beside `NEXT_PUBLIC_API_MODE`. It's the backend's origin: `http://localhost:8080` in dev.
  - It's validated with Zod when the mode is `real`:
    - it must be an `http(s)` origin, with no path, query or trailing slash
    - in production it must be `https`, as the backend's own env schema requires
  - A missing or bad value throws at startup, naming the variable. A request never goes to a guessed URL.
  - In `mock` mode it's ignored and may be absent.
- **`.env.example`**, committed: both variables with comments. `.gitignore` gains `!.env.example`, since `.env*` currently ignores it.
- **HTTP transport**, in `src/lib/api/http/transport.ts`: one `request(method, path, options)` with a body or query and the response's data schema. It always returns an `ApiResult` and never throws.
  - **Credentials:** every request is sent with `credentials: 'include'`, so the session cookie goes with it.
  - **Headers:** `Content-Type: application/json` only when there's a body. No other header, since the backend's CORS allows only `Content-Type` and `Authorization`.
  - **Body-less POSTs:** guest, sign-out and quit send no body.
  - **Envelope:** the response is parsed with `apiResultSchema(dataSchema)`, trusting the envelope rather than the HTTP status. A `success: false` envelope is returned as it is, including `retryAfterMs` and `emptyBecause`.
  - **Failures:** the four cases are in the table under Transport failures.
  - **Paths:** path params go through `encodeURIComponent`. Query params skip `null` and `undefined`.
- **Real `ApiClient`**, in `src/lib/api/http/api-client.ts`: `createHttpApiClient(baseUrl)` implements all 15 REST calls on the paths in `context/docs/contract.md` §4.
  - Each call parses its response with the existing schema from `src/lib/api/schemas/`. No new schema; the types still come from `z.infer`.
  - `getSession` uses `sessionSchema.nullable()`.
  - `signOut` reads `data: null` and returns `undefined`, matching `ApiResult<void>`.
  - `getHistory` sends `limit`, and `cursor` only when it's set.
- **Placeholder duel client**, in `src/lib/api/http/duel-client.ts`, until W30. Every command returns a failure with "Live duels aren't connected yet." Its `on` never fires. `/play/duel` shows its existing failed-connect gate instead of a scripted opponent.
- **Registration**, in `src/lib/api/register.ts`:
  - `real` builds the HTTP client and the placeholder duel client, instead of throwing.
  - `mock` is unchanged, `?scenario=` included.
  - The mock store is only created in `mock` mode.
- **Query retries**, in `src/components/providers/QueryProvider.tsx`:
  - queries retry only on `network` and `server_error`, at most twice
  - mutations never retry, so a guess or a sign-up is never sent twice
  - every other code fails at once. Today the default retries a 401 three times before the screen sees it.
- **Docs:** `CLAUDE.md` § Commands puts the backend on `http://localhost:8080`, not 3001, matching the backend's B01.
- **Tests**, colocated, in Node with `fetch` stubbed (no network):
  - `src/lib/api/config.test.ts`:
    - a good URL is accepted
    - missing, with a path, with a trailing slash and not `http(s)` are refused
    - `http` is refused in production
    - `mock` mode needs no URL
  - `src/lib/api/http/transport.test.ts`:
    - the URL, method and `credentials: 'include'`
    - `Content-Type` only with a body
    - success and failure envelopes passed through
    - `null` data for void calls
    - each row of Transport failures
  - `src/lib/api/http/api-client.test.ts`: table-driven, one row per REST call, checking its method, path, body or query
  - `src/lib/api/register.test.ts`: `real` with a valid URL registers without throwing; `mock` behaves as before
  - the retry predicate gets its own unit test, if it's extracted to `src/lib/api/retry.ts`

## Transport failures

| Case | Returned error | Message |
| --- | --- | --- |
| `fetch` rejects: offline, DNS, CORS block | `network` | "Can't reach Lineup. Check your connection." |
| No answer within 10s (`AbortSignal.timeout`) | `network` | same |
| Body isn't JSON | `server_error` | "Something went wrong. Try again." |
| JSON that fails the envelope or data schema | `server_error` | same |

All four have `retryAfterMs: null`. In development, the last two also log the method, path and Zod issue paths to the console, never the body. A parse failure is most likely drift in this repo's copy of the contract (`ai-interaction.md` § Working Across Repos).

## What the backend serves today

Built through B14 (`lineup-backend/context/current-feature.md`).

| Area | Calls | Backend | Real mode in W27 |
| --- | --- | --- | --- |
| Auth | 1–6 | B10b, B11a | Works end to end |
| Profile | 14–15 | B14a, B14b | Works. Stats are zero and history is empty until B34/B41 write them |
| Catalog | 7 | B25b, not built | `not_found` from the backend; `/play` shows its error state |
| Solo | 8–13 | B33, not built | `not_found` |
| Duel | sockets | B36+, not built | Placeholder client; failed-connect gate |

## Open Questions

All three settled at `/feature load`, each as recommended.

1. **What does real mode do for areas the backend doesn't serve yet?** **Recommended: real everywhere, failing honestly.** Catalog and solo calls go to their contract paths and get the backend's `not_found`. Duels get the placeholder client.
   - **The alternative is per-area mixing:** real auth and profile, mock solo and duel. It fails because the mock's solo and duel read the mock store's own identity (`requireIdentity`). That identity is never set while auth is real, so `findMatch` answers `unauthorized`. Fixing that means faking a session inside the mock, which is the kind of code W29 would have to rip out.
   - `mock` stays the default, so day-to-day work on the unbuilt areas is unaffected.
2. **Keep the mock adapter?** `context/docs/mock-to-backend-map.md` leaves this to W27. **Recommended: keep it, as the default mode.** It's what the unit tests, `?state=`, `?scenario=` and offline dev run on. Retiring it, and requiring `real` in a production build, is W35's decision.
3. **Request timeout.** **Recommended: 10s for every call, surfaced as `network`.** No call today is long-running. A guess that times out is never resent (mutations don't retry); W29 decides what the solo screen does with it.

## Out of Scope

These are W28's, W30's and W32's. Each one is drift found in the backend's contract, recorded here so those phases pick it up:

- **`User.emailVerified`** (B11b). This is an additive field. The web's `userSchema` strips it today, which is harmless. W28 transcribes it, along with any "verify your email" note.
- **Handle character rule** (B10a): `^[A-Za-z0-9_.-]+$`. The backend refuses other characters with `invalid_input`, and the web form doesn't check for them yet. W28.
- **Guarded-route 401 message.** The backend's 401 reads "Sign in or continue as a guest first.", not the mock's "Sign in to see your profile.". Global `unauthorized` handling, such as a session expiring mid-visit, is W28's.
- **`GET /auth/token` and `GatewayToken`** (B12b), the socket handshake's credential: W30.
- **History cursors.** A bad history cursor is `invalid_input` on the backend, where the mock restarts from page one. W32.
- **`imageUrlSchema` stays the union.** The mock still serves root-relative SVGs, and the backend sends `crestUrl: null` until B23. It gets tightened when the mock stops serving images, not before.
- **Real solo, catalog and duel behaviour:** W29, W27's not-found rows above, and W30–W31.
- **Server-side calls from Next.js.** Every API call stays in the browser. The Next server never holds the session cookie.

## Notes

- Scope: the transport layer behind `ApiClient`. Real mode works for auth and profile; the screens are unchanged.
- Depends on: W06 (the `ApiClient`/`DuelClient` interfaces and registry), and backend B14.
  - **Backend facts this phase relies on:**
    - port 8080
    - envelope on every route (B03b)
    - CORS allows only `WEB_APP_URL`, with credentials, GET and POST, and the `Content-Type` and `Authorization` headers (B13a)
    - writes from any other `Origin` get `403 forbidden` (B13a)
    - cookie `lineup.session_token`: `HttpOnly`, `SameSite=Lax`, host-only (B10b, B13a)
- **Dev origins must match exactly.** The backend's `WEB_APP_URL` is `http://localhost:3000`. Opening the web app on `127.0.0.1:3000` makes it another origin: CORS blocks reads and the origin check refuses writes. `localhost:3000` and `localhost:8080` are the same site, so the `Lax` cookie is sent.
- **`set-auth-token`.** The backend sends it on auth responses for mobile (B13b). CORS doesn't expose it, so the web never reads it. Never add an `Authorization` header in this repo.
- Constraints:
  - **No game logic in any client:** the transport moves bytes; it never interprets a guess, a timer or lives.
  - **The squad never reaches the browser:** no call asks for it, and the parse schemas have no field to hold it.
  - Validate every response at the boundary with this repo's own Zod schemas; no type is hand-written beside a schema.
  - **Never fail silently on a game action:** every failure becomes an `ApiResult` error that the screens already show.
  - `NEXT_PUBLIC_` values are public: the URL and the mode only, never a secret.
  - No `any`; `@/` imports; comments single-line, at most 50 characters.
  - Read `node_modules/next/dist/docs/` on environment variables before wiring `NEXT_PUBLIC_*` (`AGENTS.md`).
- Verification:
  - `npm test`, `npm run lint` and `npm run build` pass, in `mock` mode and again with `NEXT_PUBLIC_API_MODE=real`.
  - **In the browser.** Run the backend (`npm run start:dev` in `lineup-backend`). Put `NEXT_PUBLIC_API_MODE=real` and `NEXT_PUBLIC_API_URL=http://localhost:8080` in `.env.local`, then open `http://localhost:3000`:
    - continue as guest; the nav shows the guest
    - **reload, and the guest is still signed in.** That's the cookie travelling, which the mock could never show.
    - `/profile` shows zero stats and an empty history
    - sign-up, sign-out, and sign-in all work. A wrong password shows "Email or password is incorrect."
    - DevTools: requests carry the cookie, and there are no CORS errors
  - **What isn't built yet:**
    - `/play` shows its catalog error state, not a crash
    - `/play/duel` shows the failed-connect gate
    - with the backend stopped, an action shows the `network` message
  - **Mock mode:** unset the vars and confirm that `/play/solo`, `/play/duel`, `?state=` and `?scenario=` behave exactly as before.
  - **Clean up:** delete the test users in Prisma Studio, from the backend repo.

**Deviations recorded during implementation**

- **The https rule exempts loopback hosts** (`localhost`, `127.0.0.1`, `[::1]`).
  - `next build` always runs with `NODE_ENV=production`, so the rule as written refused a local real-mode build against `http://localhost:8080`, and the Verification step asks for that build to pass.
  - Browsers treat loopback as a secure context, and a deployed build can't usefully point at loopback anyway.
  - A lookalike host (`localhost.evil.example`) is still refused, and a test pins it.
- **Config is split in two:** `resolveApiUrl(raw, isProduction)` is pure and unit tested; `apiUrl()` reads `process.env.NEXT_PUBLIC_API_URL` directly so Next inlines it (a destructured read would not be). The origin refinement guards with `URL.canParse`, because Zod runs `.refine` even after the URL check fails.
- **Every request is `cache: 'no-store'`.** Session and profile reads must never come from the browser's HTTP cache.
- **The 10s timeout covers reading the body as well as the request.** A body that can't be read is `network`; a body that isn't JSON is `server_error`.
- **Drift logging:** a bad response logs `[api] <METHOD> <path>: bad response` with the failing Zod issue paths (or `not JSON`), outside production only. It never logs the body, and a test pins that.
- **`/play/duel` in real mode shows "Couldn't start the duel" with the catalog's "Not found."**, not the placeholder's message. The duel loads filter options before it calls `connect`, so the placeholder's "Live duels aren't connected yet." surfaces only once B25b serves the catalog. Either way it's the existing failed gate, with no scripted opponent.
- **Screens keep their own copy for `network`.** `/play` showed "Couldn't reach Lineup. Check your connection and try again." when the backend was down, not the transport's message. The screen's mapping wins, which is the intended layering.
- **`.env.example` is unformatted by Prettier,** which has no parser for it. It isn't in any format check.
- **Tests:** 838 in total, 65 of them new.
  - `config.test.ts`, 17: origins accepted; missing, path, trailing slash, query and non-http refused; https in production with a loopback exemption and a lookalike refused; `API_MODE` defaults to mock
  - `http/transport.test.ts`, 15: the request shape, the JSON body and header, the query, success, null data, failure envelopes (`retryAfterMs`, `emptyBecause`), the network, timeout and unreadable-body cases, non-JSON, drift with paths only, a bad error envelope, and no logging in production
  - `http/api-client.test.ts`, 21: the 15 contract rows, the cursor, path encoding, a null session, a parsed session, and a void sign-out
  - `retry.test.ts`, 11: retry codes up to the limit, never the others, and an unknown throw
  - `register.test.ts`, 4 new: real mode registers the HTTP client; duels are refused; a missing URL stops startup; mock mode needs no URL
- **Checked in the browser.** The developer's own servers already held 3000 and 8080, and Next 16 allows only one `next dev` per project. So the check ran on a real-mode `next start` build on **3200**, against a second backend on **8081** started with `WEB_APP_URL=http://localhost:3200`. Node's `--env-file` keeps shell values over `.env`, so `.env` itself didn't change.
  - **Guest:** continue as guest showed `guest-…` in the nav. **A full reload kept the guest signed in.**
  - **Profile:** `/profile` showed the guest strip, zero stats and "No games yet".
  - **Upgrade:** Create account upgraded the guest in place (`POST /auth/upgrade` 200), and the nav showed the new handle.
  - **Sign-in:** sign-out worked; a wrong password showed "Email or password is incorrect."; the right one signed in and went to `/play`.
  - **Unbuilt areas:** `/play` showed "Not found." with Try again. The 404 was requested once, not retried.
  - **Network:** with the backend stopped, Try again showed the network message after the two allowed retries.
  - **Console:** only the expected 404 and 401 statuses and an unrelated missing favicon. No CORS errors and no drift logs.
  - **Mock mode:** the mock-mode build passed, and the developer's dev server on 3000 still served `/play/solo?state=idle`, `/play/duel?scenario=youReconnect`, `/profile` and `/play`.
  - **Clean up:** the test user (`test-w27@lineup.test`, the upgraded guest) was deleted, and 0 test users remain. Both test servers were stopped and the build was redone in mock mode.
- **Review fixes:**
  - **Unused exports:** `API_URL_VAR` and `REQUEST_TIMEOUT_MS` are no longer exported, since nothing outside their module reads them.
  - **`context/docs/mock-to-backend-map.md` updated**, since this phase made three of its lines wrong:
    - real mode no longer throws; it plugs in the HTTP client
    - the `imageUrlSchema` tightening is deferred until the mock stops serving images
    - the mock adapter is kept as the default
- **Observations left for later phases:**
  - **The mock modules ship in a real-mode bundle.** `register.ts` imports both adapters statically, so the fixtures are bundled even when unused. W35 decides whether to retire the mock or load it lazily.
  - **A session id of `.` or `..` would resolve to another path.** `encodeURIComponent` leaves dots alone, and the URL parser also folds `%2E`. Ids come only from the server as UUIDs (B08), so nothing reaches this today. W29 can check ids with `z.uuid()` if it wants that guarantee.
  - **Drift is retried as a `server_error`,** so one bad response logs three times in dev. It's harmless, and it keeps the retry rule a single list of codes.
- **`/feature test`:** 3 new tests, 841 in total.
  - `http/duel-client.test.ts`, 2: every command refuses with the placeholder error; `on` never fires, and unsubscribe and `disconnect` are safe. The goal names both, but only `connect` was covered.
  - `register.test.ts`, 1: in real mode, a second `registerApiClient` call keeps the first client.
  - **Coverage, traced by hand.** `@vitest/coverage-v8` isn't installed, and adding a dependency wasn't part of this phase. Every branch is covered:
    - `config.ts`: both mode values; missing, non-http, non-origin and unparseable values; https, loopback and a lookalike host in production; and `apiUrl()` through the register suite
    - `http/transport.ts`: query skipping, with and without a body, a rejected fetch, an unreadable body, non-JSON, drift, and logging off in production
    - `http/api-client.ts`: all 15 calls, both branches of `toVoid`, and `soloPath` with and without a suffix
    - `http/duel-client.ts`: every member
    - `retry.ts`: every code, and the limit
    - `register.ts`: the real branch, the mock branch, and the run-once guard
  - `QueryProvider.tsx` is a component, so it has no unit test, per the standards. Its retry predicate is tested in `retry.test.ts`.

## History
