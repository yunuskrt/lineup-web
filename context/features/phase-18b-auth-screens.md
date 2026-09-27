# Phase W18b — Auth Screens

## Status

Not Started

## Goals

- Replace the placeholder `src/app/(site)/(pages)/sign-in/page.tsx`:
  - It's a server page that awaits `searchParams` and reads `mode` as `'sign-in' | 'sign-up'`. Anything else counts as `sign-in`.
  - It renders the `h1` and passes `mode` to `AuthPanel`, keeping `metadata.title: 'Sign in'`.
  - Check the current `searchParams` / `PageProps` API in `node_modules/next/dist/docs/` first.
- Create the auth components in `src/components/auth/`:
  - `AuthPanel.tsx` (client) reads `useSession()` and renders the state from the States table below.
    - While the session is pending it renders a skeleton in the same box as the form, so nothing shifts when the session resolves.
  - `ModeSwitch.tsx` is two links, "Sign in" (`/sign-in`) and "Create account" (`/sign-in?mode=sign-up`), with `aria-current="page"` on the active one. They're links rather than tabs, so each mode can be linked to and needs no extra library.
  - `SignInForm.tsx` has email (`autocomplete="email"`) and password (`autocomplete="current-password"`) fields, and submits through `useSignIn()`.
  - `SignUpForm.tsx` has handle (`autocomplete="username"`), email and password (`autocomplete="new-password"`) fields, and submits through `useSignUp()`. For a guest, that call is `upgradeGuest`, via `signUpTarget` from W18a.
  - `AuthField.tsx` is a label, an input and an error line. It sets `aria-invalid` and links the error with `aria-describedby`, and the label is always visible. Placeholders are never used as labels.
  - `SignedInPanel.tsx` says "Signed in as {handle}". Its primary action is Play (`/play`), and a secondary "Sign out" button calls `useSignOut()`.
- Form behaviour:
  - On submit, `authFieldErrors` runs first. If any field fails, it shows the errors, moves focus to the first invalid field and sends nothing.
  - Editing a field clears that field's error.
  - While a request is pending:
    - The submit button is disabled and its label changes to "Signing in…" or "Creating account…".
    - The inputs are `readOnly`.
    - There's no spinner, because `theme.md` § Loading keeps the spinner inside the guess input only.
  - A failed request shows `authErrorMessage(error)` in one `role="alert"` line above the submit button, and the typed values stay.
  - After sign in, sign up or continue-as-guest succeeds, `router.push('/play')`.
- **Continue as guest** is a secondary button under the sign-in and sign-up forms. It calls `useContinueAsGuest()`, then goes to `/play`. It's hidden when the session is already a guest.
- Create `src/components/shell/NavAccount.tsx`, a client component placed in `SiteNav` to the left of `NavCta`:
  - While pending, it shows a skeleton bar at the width and height of the link.
  - Signed out, it shows a "Sign in" text link to `/sign-in`, and renders nothing on `/sign-in` itself.
  - Signed in, guest or not, it shows the handle as a link to `/profile`, truncated at a max width so the nav never wraps at 375px.
- Add shared `TEXT_INPUT` and `SECONDARY_BUTTON` class strings to `src/styles/classes.ts`, matching the existing input look (`rounded-sm border-line bg-surface-card`) and the outlined button look. Don't write the strings out in each form.

## States

| Session         | `mode`    | Shows                                                                                                                  |
| --------------- | --------- | ---------------------------------------------------------------------------------------------------------------------- |
| Pending         | any       | A skeleton in the form's box: flat `bg-skeleton-fill` bars, no shimmer                                                 |
| Signed out      | `sign-in` | Mode switch, then the sign-in form, then "Continue as guest"                                                           |
| Signed out      | `sign-up` | Mode switch, then the sign-up form, then "Continue as guest"                                                           |
| Guest           | `sign-in` | The line "You're playing as {handle}.", then the mode switch and sign-in form. No guest button                          |
| Guest           | `sign-up` | The line "You're playing as {handle}. Create an account to keep your history.", then the sign-up form (upgrade). No guest button |
| Registered      | any       | `SignedInPanel`                                                                                                        |
| Submit pending  | —         | The button disabled with its "…ing" label, and the inputs read-only                                                    |
| Field invalid   | —         | Error text under the field in `text-danger`, and the field marked invalid                                              |
| Request failed  | —         | One alert line above submit, and the values kept                                                                       |

Mock triggers from W18a, so the failure rows can be reached: password `wrong-password` on sign in, and handle `taken` on sign up.

## Open Questions

Defaults stand unless changed at `/feature start`.

- **After success:** by default every success goes to `/play`. The alternative honours a `?next=` param, so a later sign-in prompt on `/profile` could return there. No route asks for that yet.
- **Guest signing in to an existing account:** by default the client just calls `signIn`, and nothing on the page says what happens to the guest's history. Whether the backend merges it (Better Auth account linking, B11) isn't decided. The alternative warns that the guest's history stays behind, which could be wrong once B11 lands.
- **Home page:** by default `/` stays fully static, and its "Have an account? Sign in" line shows even when signed in. The link still lands somewhere sensible (`SignedInPanel`). The alternative makes that line a client component and adds JS to `/`.

## Out of Scope

- **The guest → account upgrade on `/profile`** → W24. This phase only upgrades when a guest uses the sign-up form.
- **Creating a guest automatically when entering `/play`** → W19 and W20.
- **Google and Apple buttons, forgot password, email verification and password rules beyond length.** The contract has none of them yet, and the backend owns the password policy (W28, B10, B11).
- **A show-password toggle and shadcn/ui.** No primitive here needs a library.
- **Entrance motion** → W26 if it's wanted.

## Notes

- Scope: the `/sign-in` route in all its session states, and the nav's account entry.
- Depends on: W18a (hooks, `authErrorMessage`, `authFieldErrors`, `signUpTarget`, mock triggers), W17 (the `/sign-in` placeholder and home link) and W08 (`SiteNav`, `(pages)` layout).
- References:
  - `context/project-overview.md` § Accounts, Guests & Progression, and Hard Constraint 12.
  - `context/design.md` § One primary action per view and § Every wait has a known shape.
  - `context/theme.md` § Loading, § Contrast.
- Constraints:
  - **One primary action per view.** Submit is the only `bg-brand` button in each form state, and Play is the only one in `SignedInPanel`. Continue-as-guest and Sign out are secondary.
  - **Forms render only after `useSession` resolves.** `useSignUp` reads the cached session to choose between sign-up and upgrade, so a form shown before it loads would sign a guest up instead of upgrading them.
  - **Never fail silently.** Every rejected request surfaces as the alert line, and no submit does nothing without saying why.
  - **Colours come from role utilities only.** Errors use `text-danger` (red-card, AA on `surface`), and text on `bg-brand` is `text-on-accent`. No hex.
  - Tight corners (`rounded-sm`), borders and no shadows. Labels in sentence case, not all caps.
  - Visible `FOCUS_RING` on every input, link and button. The tab order follows the visual order.
  - `@/` imports, named-export components, and client components only where hooks require them. The page itself stays a server component.
  - Don't install shadcn/ui or a form library.
- Verification:
  - `npm run lint`, `npm run format:check`, `npm test` and `npm run build` pass.
  - Searching for `#[0-9a-fA-F]{3,6}` under `src/` still matches only `tokens.css`.
  - In the browser (`npm run dev`), go through every row of the States table:
    - Submitting empty forms shows field errors and focuses the first invalid field.
    - `wrong-password` shows "Email or password is incorrect." and keeps the email.
    - Handle `taken` shows "That handle is taken."
    - A valid sign in goes to `/play`, and the nav then shows the handle.
    - Continue as guest goes to `/play` with a "Guest N" handle in the nav.
    - Back on `/sign-in?mode=sign-up` as a guest, the upgrade line shows. Signing up keeps the same user id (checked in React DevTools, in the session query data) and changes the handle.
    - As a registered user, `/sign-in` shows `SignedInPanel`. Sign out returns the page to the sign-in form, and the nav shows "Sign in" again.
    - The nav's "Sign in" link doesn't appear on `/sign-in`.
  - At 375, 834 and 1440 wide there's no horizontal scroll, the nav doesn't wrap with a 24-character handle, and the skeleton-to-form swap doesn't shift the layout.
  - Tabbing covers the mode switch, the fields, submit and continue-as-guest in order, each with a focus ring. Password managers offer to fill the fields (autocomplete attributes are present).

## History
