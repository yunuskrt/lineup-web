# Phase W18a — Session Layer

## Status

Completed

## Goals

- Install `@tanstack/react-query` (v5). It's the stack's choice for all server data (`coding-standards-web.md` § Data Fetching), and this is the first phase that reads any.
- Create `src/components/providers/QueryProvider.tsx`, a client component that holds one `QueryClient` per browser tab (created in `useState`, never at module scope on the server). Mount it in `src/app/layout.tsx` around `{children}`. The root layout stays a server component.
- Create `src/lib/api/unwrap.ts`, tested in `src/lib/api/unwrap.test.ts`:
  - `ApiRequestError`, an `Error` subclass that carries the `ApiError` it came from.
  - `unwrap(result)` returns `data` on success and throws `ApiRequestError` on failure. This is how an `ApiResult` becomes a TanStack Query error, instead of every hook checking `success` by hand.
- Create `src/lib/auth.ts`, pure and tested in `src/lib/auth.test.ts`:
  - `authErrorMessage(error: ApiError)` returns the copy a form shows.
    - `network`: "Couldn't reach Lineup. Check your connection and try again."
    - `server_error`: "Something went wrong on our side. Try again in a moment."
    - `rate_limited`: "Too many attempts. Try again in N seconds.", with N rounded up from `retryAfterMs`. If `retryAfterMs` is `null`, it says "shortly" instead.
    - Any other code shows the backend's `message`, which the contract writes as player-facing copy.
  - `authFieldErrors(schema, values)` runs one of the auth request schemas with `safeParse`. It returns `{ email?, password?, handle? }` with one plain message per field, e.g. "Enter a valid email address.", "Use at least 8 characters.", "Use 3 to 24 characters." It never returns zod's own wording.
  - `signUpTarget(session)` returns `'upgradeGuest'` when the current user is a guest, and `'signUp'` otherwise. Signing up as a guest has to keep the guest's history (Hard Constraint 12), and `upgradeGuest` is the call that does that.
- Create `src/hooks/use-auth.ts` for the TanStack Query hooks, all under one `SESSION_QUERY_KEY`:
  - `useSession()` wraps `auth.getSession()`. It returns `Session | null` and uses a `staleTime` long enough that the nav doesn't refetch on every navigation.
  - `useSignIn()`, `useSignUp()`, `useContinueAsGuest()` and `useSignOut()` are mutations over the matching `AuthApi` calls, run through `unwrap`.
    - On success, the first three write the returned `Session` into the session query with `setQueryData`. `useSignOut` writes `null`. None of them refetch.
    - `useSignUp()` uses `signUpTarget` to choose between `auth.signUp` and `auth.upgradeGuest`.
  - Every hook gets the client from `@/lib/api`, whose import is what registers the adapter.
- Add two deterministic rejections to the mock adapter in `src/lib/api/mock/api-client.ts`, so the forms' error paths can be seen in the browser. Export both constants and cover them in `src/lib/api/mock/api-client.test.ts`:
  - `MOCK_REJECTED_PASSWORD` (`'wrong-password'`): `signIn` fails with `unauthorized`, "Email or password is incorrect."
  - `MOCK_TAKEN_HANDLE` (`'taken'`): `signUp` and `upgradeGuest` fail with `invalid_input`, "That handle is taken."

## Contract

Nothing in `src/lib/api/client.ts` or `src/lib/api/schemas/` changes. W18a only consumes what W05a transcribed:

| Call                        | Returns              | Notes                                         |
| --------------------------- | -------------------- | --------------------------------------------- |
| `auth.getSession()`         | `Session \| null`    | `null` means signed out; it isn't an error    |
| `auth.signIn(request)`      | `Session`            |                                               |
| `auth.signUp(request)`      | `Session`            | A new identity                                |
| `auth.upgradeGuest(request)`| `Session`            | Same id, so history survives                  |
| `auth.continueAsGuest()`    | `Session`            | `user.isGuest: true`                          |
| `auth.signOut()`            | `void`               |                                               |

## Out of Scope

- **Every screen and nav change** → W18b. W18a renders nothing new.
- **Creating a guest automatically on the way into a game** → W19 and W20, which call `useContinueAsGuest` when `useSession` is `null`. This keeps the home page's "No sign-up needed" promise.
- **Google and Apple sign-in.** `AuthApi` has no provider calls, so they arrive with Better Auth in W28.
- **Keeping the mock session across a reload.** The mock store is in memory, so a reload signs you out. Real cookies arrive in W28.
- Zustand. Auth state is server data, and TanStack Query holds it.

## Notes

- Scope: the data layer every auth-aware screen reads. The provider, the result unwrap, error and field copy, the auth hooks, and two mock rejection triggers.
- Depends on: W05a (`AuthApi`, auth schemas, `ApiResult`) and W06b/W07b (mock adapter, store).
- Constraints:
  - **Client-side validation is a convenience, never a control.** `authFieldErrors` only saves a round trip. The adapter parses every request again.
  - **The client never asserts its tier or identity.** Hooks store the `Session` the adapter returns and never build one.
  - **No component calls `getApiClient()` directly** from W18b onward. It goes through these hooks.
  - `z.infer` types only, `@/` imports, no `any`. Comments of at most 50 characters, and only for the non-obvious.
  - Check the current `layout.md` in `node_modules/next/dist/docs/` before editing the root layout.
- Verification:
  - `npm test`: new tests for `unwrap`, `authErrorMessage` (every code, including `rate_limited` with and without `retryAfterMs`), `authFieldErrors` (valid, each invalid field, whitespace-only handle), `signUpTarget`, and both mock rejections. That includes `upgradeGuest` with the taken handle leaving the guest's handle unchanged.
  - `npm run lint`, `npm run format:check` and `npm run build` pass.
  - In the browser, every route renders as before, the console has no hydration warnings, and the React Query provider appears in React DevTools under the root layout.
- **Deviations recorded during implementation**
  - **New types in `src/types/auth.ts`:** `AuthField`, `AuthFieldErrors` and `SignUpTarget`, per the standard that types live in `src/types/`. The spec didn't name them.
  - **A password that's too long gets its own message:** "Use at most 128 characters." The spec only gave the too-short copy. All copy is exported as `AUTH_FIELD_MESSAGES` and `AUTH_ERROR_MESSAGES`, so W18b and the tests share it.
  - **Rate-limit copy:** it uses "1 second" for one, and never shows fewer than 1 second, so a `retryAfterMs` of 0 doesn't read "0 seconds".
  - **The mock's taken handle is matched case-insensitively** on the trimmed handle, so " Taken " is rejected too.
  - **Values:** the session `staleTime` is 5 minutes (`SESSION_STALE_TIME_MS`). `QueryClient` uses the library defaults, with no custom `defaultOptions`.
  - **One shared `useSessionWriter`** does the `setQueryData` for all four mutations.
  - **After review:** `AuthRequestSchema` moved to `src/types/auth.ts`, and `authFieldErrors` now takes `AuthFieldValues` instead of `unknown`. A non-object passed in would have failed without naming a field and come back as no errors.

## History
