# Phase W06b — Mock REST Adapter

## Status

Not Started

## Goals

- Create `src/lib/api/mock/store.ts`, the in-memory state the adapter owns:
  - A session registry keyed by `sessionId`, holding the engine state for each solo run.
  - A current identity (guest or account) and an accumulating `UserStats` + history list, so `/profile` has something true to report after a few runs.
  - Module-scoped and deliberately non-persistent — a reload resets it. Say so in the module, because it will otherwise read as a bug during W20.
- Create `src/lib/api/mock/api-client.ts`, implementing `ApiClient` over the W06a engine:
  - **auth** — `continueAsGuest` mints a guest identity; `signIn` / `signUp` accept any well-formed credentials; `upgradeGuest` converts the current guest **in place, preserving history** (HC 12); `getSession` returns `null` before any of them; `signOut` clears.
  - **catalog** — `getFilterOptions` returns the competitions, clubs and era range present in the seed.
  - **solo** — `findMatch` applies the filters, picks a match and returns a `SoloMatchOffer`; `chooseSide` starts round one; `guess` drives `resolveRound`; `syncSession` re-reads and lets the engine apply expiry; `quit` and `getSummary` return the summary.
  - **profile** — `getProfile` and `getHistory` read the store, with real cursor paging.
  - Every method resolves; none throws. Failures come back as `ApiResult` errors with the right code.
- Make the failure branches reachable, because the screens that render them are built against this adapter:
  - `empty_pool` when the filters match nothing in the seed.
  - `session_over` on a guess against a finished session.
  - `not_found` on an unknown `sessionId`, `unauthorized` when no identity exists.
  - `invalid_input` when the request fails its own schema.
  - A simple guess-rate counter producing `rate_limited` with a real `retryAfterMs`.
- Create `src/lib/api/config.ts` and `src/lib/api/register.ts`:
  - `API_MODE` read from `NEXT_PUBLIC_API_MODE` (`'mock'` | `'real'`), defaulting to `'mock'` while no backend exists.
  - `register.ts` selects the adapter and calls `setApiClient` once, idempotently.
- **Amend the W05a accessor** so `getApiClient()` resolves through `register.ts` on first use instead of throwing:
  - Keep the throw as the final fallback for a genuinely unresolvable mode.
  - This is a deliberate change to W05a, not a drift: module state is per-environment in Next, so requiring an explicit bootstrap call would mean registering separately in the server and client bundles and would fail as a confusing runtime throw the first time a screen called it.
- Add `src/lib/api/mock/api-client.test.ts`:
  - A full solo run driven **only through the `ApiClient` interface** — `continueAsGuest` → `findMatch` → `chooseSide` → correct guess → already-found guess → not-in-XI guess → expiry via `syncSession` → summary.
  - Assertions that lives fall only on expiry, that the turn-ending rules hold through the interface, and that `getProfile` reflects the finished run.
  - A named case asserting **no response body carries an unrevealed player** (HC 2).

## Notes

- Scope: the REST half of the mock. Out of scope:
  - `MockDuelClient` → W06c.
  - Real fixture content → W07; this runs on W06a's placeholder seed.
  - TanStack Query, hooks, caching → the screens that need them.
  - Any UI.
- **Why the accessor changes here.** W05a's throw-until-registered was the right shape for a phase with no implementation. Now that one exists, lazy resolution is what makes it usable from a server component and a client component without two bootstraps. The failure mode stays honest: an unknown mode still throws a developer-facing error.
- **`NEXT_PUBLIC_API_MODE` is public by definition.** That is fine — it names a mode, never a secret (`coding-standards.md` § Security). No key, token or URL belonging to a real backend may join it in this phase.
- **The mock must not become a fallback.** When W27 adds the real client, `API_MODE` selects one or the other and a failed real request surfaces as an error. A silent fall-back to mock data would mean a player seeing fabricated squads during an outage.
- **Guest upgrade preserving history is a real assertion, not a formality.** It is Hard Constraint 12 and the one auth behaviour the mock can actually prove before Better Auth exists.
- Depends on: W06a (engine, matcher, clock, seed), W05a (`ApiClient`, `ApiResult`).
- Constraints:
  - **The squad is never sent to the client** (HC 2). `SoloSession.found` carries revealed players only; the engine's XI stays inside the store. The named test exists because this is the easiest constraint in the repo to break by accident.
  - **No game logic outside the mock module** (HC 7). The adapter translates and delegates; it does not re-decide anything the engine already decides.
  - **Client validation is a convenience, never a control** — the adapter still validates its inputs, because it is standing in for the server that would.
  - Nothing under `src/lib/api/mock/` may be imported by a component, hook or route. Screens reach it only through `getApiClient()`.
  - No `any`; `@/` imports only; structured `ApiResult` returns everywhere; no silent catch.
- **Deviations recorded during implementation:**
  - **The accessor was not amended; a barrel module does the registration instead.** `client.ts` importing `register.ts` would have made a cycle (`register` → `client` → `register`), which works in ESM only by accident of hoisting and is fragile under bundlers. `src/lib/api/index.ts` calls `registerApiClient()` as an import side effect and re-exports `getApiClient`, so screens `import { getApiClient } from '@/lib/api'` and never bootstrap anything. `client.ts` is untouched and its throw remains the honest fallback if someone imports it directly.
  - **The store is per-adapter, not a module singleton.** `createMockApiClient({ now })` closes over a fresh store and an injectable clock. `register.ts` creates one instance, so it is still module-scoped in the app, but tests get isolation with no reset hook and determinism with no fake timers.
  - **`chooseSide` on an already-started session returns `forbidden`**, not an idempotent re-read. The spec did not say; a second side choice is a client bug worth surfacing rather than silently ignoring.
  - **`getSummary` on a live run returns `forbidden`.** `ApiError` has no "not finished yet" code, and `invalid_input` would misdescribe a well-formed request.
  - **A guess arriving after expiry settles the expiry first, then evaluates in the fresh round.** The three `GuessResult` outcomes cannot express "your round had already ended", so the alternatives were to lie with `not_in_xi` or to drop the guess silently. If the expiry also ended the run, the call returns `session_over`. **The real backend must define this properly at B31/B33.**
  - **Pro-only summary fields are unreachable.** `missed` is populated only when `user.tier === 'pro'` and the mock mints every identity as `free`, so W21 cannot build the Pro summary view against this adapter. A tier override belongs with the W06c scenarios; note it there rather than special-casing here.
  - **`favouriteClub` is always the seed home club** and `wins`/`losses`/`draws` stay zero — there is one match in the seed and no duels yet. W07 and W06c make these real.
  - **A guess whose round had already ended returns `session_over`** (found in the combined review). `toGuessResult` used to fall through to `not_in_xi` for the engine's `expired` and `ignored` outcomes. The REST path ticks first so it could not reach that in practice, but the conversion was unsound — `isGuessable` now narrows it and the fallthrough is a type error.
  - **Shared helpers moved to `src/lib/api/mock/shared.ts`** — `ok`, `fail`, `ACK`, `maskedMatchFor` and `toGuessResult` were duplicated in both adapters, which is what let the two drift on expiry handling.
- Verification:
  - `npm test` passes, including the full-run interface test and the HC 2 case.
  - `npm run lint`, `npm run format:check`, `npx tsc --noEmit` and `npm run build` all pass.
  - A throwaway script (or a temporary dev route, deleted after) drives `getApiClient().solo` end to end with `NEXT_PUBLIC_API_MODE=mock` and prints the summary — proving registration works in a real Next runtime, not only under Vitest.
  - Setting `NEXT_PUBLIC_API_MODE=real` produces a clear developer-facing throw, not a silent mock.
  - Grep confirms no component, hook or route imports `@/lib/api/mock/*`.

## History
