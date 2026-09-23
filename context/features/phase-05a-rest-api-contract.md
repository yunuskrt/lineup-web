# Phase W05a — REST API Client Interface

## Status

Not Started

## Goals

- Create `src/lib/api/schemas/result.ts`, the envelope every call resolves to:
  - `apiErrorCodeSchema`: `'unauthorized' | 'forbidden' | 'not_found' | 'invalid_input' | 'empty_pool' | 'rate_limited' | 'session_over' | 'network' | 'server_error'`. Every code maps to a state `theme.md` § States already names — `empty_pool` is "Empty filter result", `rate_limited` is "Rate limited", which carries `retryAfterMs` so the input can say why it locked.
  - `apiErrorSchema`: `{ code, message, retryAfterMs: number | null }`. `message` is display-safe text from the backend; nothing else is ever shown to a player.
  - `apiResultSchema<T>(dataSchema)`: a helper returning the discriminated union `{ success: true, data } | { success: false, error }`, so a response can be parsed at the boundary.
- Create `src/types/api.ts`:
  - `ApiResult<T>` written by hand as a generic union — `z.infer` cannot express a generic, so this is the one type in the repo declared alongside a schema rather than derived from it.
  - `ApiErrorCode` and `ApiError` via `z.infer`.
- Create `src/lib/api/schemas/auth.ts`:
  - `signInRequestSchema`: email + password, password length bounded only (the backend owns the real policy).
  - `signUpRequestSchema`: email, password, handle.
  - `upgradeGuestRequestSchema`: the same three fields, used to convert the current guest identity in place.
  - `sessionSchema`: `{ user: User }`. A guest session is a real session — `user.isGuest` is the only difference, never a null user.
- Create `src/lib/api/schemas/catalog.ts`, the data the filter screen (W19) needs:
  - `filterOptionsSchema`: `{ competitions: CompetitionRef[], clubs: ClubRef[], era: EraRange }`, where `era` is the full range the pool actually covers. **No counts, no difficulty, no memorability signal.**
- Create `src/lib/api/schemas/solo.ts`, modelling the flow in `project-overview.md` § Game Flow — filters → match retrieved → pick side → guessing loop:
  - `soloMatchOfferSchema`: `{ sessionId, home: ClubRef, away: ClubRef }` — the two sides to choose between, and nothing else. Competition and date stay hidden until the summary.
  - `soloSessionSchema`: `{ sessionId, match: MaskedMatch, lives: Lives, found: RevealedPlayer[], round: RoundTiming }`. This one shape is what every solo response returns, so the screen always renders server state rather than patching its own.
  - `soloGuessRequestSchema`: `{ sessionId, guess: string }` — trimmed, length-bounded, nothing normalized client-side.
  - `soloGuessResponseSchema`: `{ result: GuessResult, session: SoloSession }`.
  - `soloSummarySchema`: `{ match: MatchIdentity, found: RevealedPlayer[], missedCount: number, missed: RevealedPlayer[] | null, livesRemaining: Lives, endReason: SoloEndReason, accuracy: number, bestStreak: number, roundTimesMs: number[] }`. `missed` is `null` for a free user and populated for Pro — the backend decides which, the client only renders what arrived.
- Create `src/lib/api/schemas/profile.ts`:
  - `userStatsSchema`: played, wins, losses, draws, accuracy, best streak, perfect clears, favourite club (`ClubRef | null`).
  - `historyEntrySchema`: `{ id, playedAt, mode: 'solo' | 'duel', match: MatchIdentity, outcome: SoloEndReason | DuelOutcome, foundCount, livesRemaining }`.
  - `historyPageSchema`: `{ entries: HistoryEntry[], nextCursor: string | null }`, plus `historyQuerySchema` with `cursor` and a bounded `limit`.
  - `profileSchema`: `{ user: User, stats: UserStats }`.
- Add the matching `z.infer` types under `src/types/`: `auth.ts`, `catalog.ts`, `solo.ts`, `profile.ts`.
- Create `src/lib/api/client.ts`, the interface itself — method signatures only, no implementation:
  - `AuthApi`: `getSession`, `signIn`, `signUp`, `continueAsGuest`, `upgradeGuest`, `signOut`.
  - `CatalogApi`: `getFilterOptions`.
  - `SoloApi`: `findMatch(filters)`, `chooseSide(sessionId, side)`, `guess(request)`, `quit(sessionId)`, `getSummary(sessionId)`.
  - `ProfileApi`: `getProfile`, `getHistory(query)`.
  - `ApiClient`: `{ auth, catalog, solo, profile }`. **Every method returns `Promise<ApiResult<T>>` and none of them throws** — a transport failure resolves to `{ success: false, error: { code: 'network' } }`, so no caller has a silent path.
  - `getApiClient()` / `setApiClient(client)`: a module-level accessor that throws a developer-facing error until an adapter registers. W06 is what registers one behind the env flag.

## Notes

- Scope: the REST half of the contract — auth, catalog, solo and profile — plus the shared result envelope. Out of scope:
  - The duel transport → W05b, which builds on the envelope and error codes defined here.
  - Any implementation, mock or real → W06 (mock adapter), W07 (fixtures), W27 (real client).
  - TanStack Query hooks, caching and retry policy → the screens that need them (W19 onward).
  - `PROTOCOL_VERSION` → W30. It belongs to the socket handshake, not to REST.
  - Auth cookie and cross-origin config → W27/W28.
- **Why an interface before an implementation.** `project-overview.md` § Status is explicit: the web app is written against an API client interface from its first commit, and going live is swapping the implementation rather than rewriting screens. A screen that reaches into fixtures directly cannot be wired up later without being taken apart.
- **Why `ApiResult` instead of thrown errors.** `coding-standards.md` § Error Handling requires structured results and forbids failing silently on a game action. A union the caller must narrow makes the failure branch unskippable; an exception can be swallowed by a `catch` that logs and returns.
- **This is a provisional transcription.** The backend owns the contract and does not exist yet. W27 reconciles every schema here against the real OpenAPI document, and where they differ the backend wins.
- Contract decisions to make deliberately, and record here when made:
  - Solo is two calls, not one, because the player picks the side. `findMatch` reserves a session and offers two clubs; `chooseSide` returns the first round. Collapsing them would force the client to hold un-started session state.
  - `soloSessionSchema` is returned whole by every mutating call rather than a delta. The client re-renders from it, which keeps lives and the found-pool authoritative on every response.
  - `accuracy` is a server-computed ratio, not something the summary screen derives from `found.length`.
- Depends on: W02b (`common`, `match`, `player`, `game`, `user` schemas). No code dependency on W03/W04.
- Constraints:
  - **The squad is never sent to the client** (HC 2). No request or response type may carry the XI, an unrevealed name, an alias set or a slot-to-name map. `soloSessionSchema` carries only what has already been revealed; `soloSummarySchema` may carry the full XI because the run is over.
  - **No game logic in the client** (HC 7). The interface exposes no method that decides anything — no local guess check, no lives arithmetic, no timer-expiry call. Timer expiry is observed through the next server response, never asserted by the client.
  - **Starting XI only** (HC 17) — slots stay 0–10, no substitute field anywhere.
  - **`memorability_score` is never exposed** (HC 20) — no score, rating, difficulty or "hardness" field, including on `filterOptionsSchema`.
  - **Tier resolves server-side** (HC 16). `missed: RevealedPlayer[] | null` is the whole mechanism — the client never branches on `user.tier` to decide what it is allowed to show.
  - Types come from `z.infer`, with `ApiResult<T>` the single documented exception. No `any`, no `unknown` leaking out of a public signature.
  - `@/` imports only. Schema constants camelCase `*Schema`, types PascalCase, constants SCREAMING_SNAKE_CASE.
  - No comments beyond short single-line ones where a rule is genuinely non-obvious.
- **Deviations recorded during implementation:**
  - **`SoloApi.syncSession(sessionId)` added.** The spec said timer expiry is observed through the next server response, but over REST there is no such response when a player runs out of time without guessing. The client re-reads when its rendered countdown hits zero; the server still decides whether a life was lost, so HC 7 holds.
  - **`soloSessionSchema` gained `status: 'active' | 'over'`, and `round` became nullable.** Without a terminal flag the client would infer the end from `lives === 0`, which is lives arithmetic. `round` is `null` once over, since `roundTimingSchema` requires `endsAt > startedAt`.
  - **`historyEntrySchema` is a discriminated union on `mode`**, not the flat `outcome: SoloEndReason | DuelOutcome` the spec described. Same information, but a solo entry can no longer carry `'draw'`. Matches the existing pattern in `game.ts`.
  - **`SQUAD_SIZE = 11` added to `common.ts`** and used to replace the literal `10` in `player.ts` — a one-line touch of W02b code, taken because leaving a second source of the squad size was worse.
  - **Review cleanups:** `gameModeSchema` dropped as dead code (`GameMode` now derives as `HistoryEntry['mode']`); `ratioSchema` and `squadCountSchema` hoisted to `common.ts` after the same bounds appeared in two files.
- Verification:
  - `npm run lint`, `npm run format:check` and `npm run build` all pass; `npx tsc --noEmit` is clean.
  - A throwaway type-level check confirms the interface is implementable: write a `const stub: ApiClient` whose methods all return rejected-free `{ success: false, error }` results, confirm it type-checks, then delete it. Do not commit it — W06 builds the real one.
  - A throwaway parse check shows `apiResultSchema(userSchema)` accepting both branches and rejecting `{ success: true, error }`. Do not commit it; Vitest arrives with W06.
  - Grep confirms no new file outside `tokens.css` contains a hex value, and that nothing under `src/lib/api/` imports from `src/app/` or a component.

## History
