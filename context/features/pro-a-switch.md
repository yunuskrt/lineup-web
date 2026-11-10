# Pro A: The Tier, the Switch and the Lock

## Status

Not Started

## Goals

The groundwork every Pro feature (B–F) stands on. Nothing new is gated yet except what already is (the post-game reveal). Needs backend **R9** on `main` (`context/docs/backend-requests.md` § R9). Overview: `context/docs/pro-features.md`.

- **The contract, transcribed from R9:**
  - `appConfigSchema = { proEnabled: boolean }` (`src/lib/api/schemas/config.ts`, type in `src/types/config.ts`).
  - `apiErrorSchema` gains an optional `reason`: `errorReasonSchema = z.enum(['pro_required', 'daily_cap'])`.
  - `User.tier` is now real: the backend sends the effective tier. No schema change.
  - **`ApiClient` gains `config.getConfig()`** → `GET /config` (public, no session), in the HTTP client and the mock.
- **`useAppConfig()`** (TanStack Query, public, `staleTime` 5 minutes): the one place the web reads the switch.
- **A pure access helper** (`src/lib/pro.ts`):
  - `proAccess(config, user)` returns `'pending'` (config not loaded), `'open'` (the switch is off, or the user is Pro), or `'locked'` (the switch is on and the user is Free, or there's no session yet: a new guest starts Free).
  - `showsPro(config)` is `true` only while the switch is on. With it off, the web never shows the word Pro, a price or a lock.
  - **Presentation only:** the server enforces every gate. A wrong answer here shows the wrong lock; it never grants anything.
- **`useProAccess()`** combines `useAppConfig()` and `useSession()`.
- **`ProLock`** (`src/components/pro/ProLock.tsx`), the one locked look B–F reuse:
  - The control drawn disabled (the existing disabled button styles), a 12px `fg-muted` caption under it, and a **See Pro** link to `/pro`.
  - Props: the control's label, the caption, and the size (default or large).
  - While `'pending'`, it renders the control disabled with no caption, so no lock flashes in.
- **`MissedReveal` adopts `ProLock`:** the locked button keeps the caption "Pro shows every player you missed." and gains See Pro. Whether it's locked still comes only from `missed` being `null` (the server decides).
- **`/pro`** (site shell, `src/app/(site)/(pages)/pro/page.tsx`):
  - **With the switch off,** it renders the app's not-found page.
  - **Content:** the heading "Lineup Pro", one line ("More solo: pick any match, practise it, play without a daily limit."), then a Free vs Pro table of the seven rows from `project-overview.md` (duels, solo runs, exact match, archive, practice, post-game review, private rooms), in the profile's table style.
  - **Get Pro:** a `PRIMARY_BUTTON_LARGE` in its own component, `GetProButton`, the one place the payments work plugs in. Until then it is disabled, with "Checkout comes with payments." under it.
  - **A Pro user** sees "You have Pro." instead of the button.
- **Profile:** with the switch on, a plan line in `ProfileHeader`: "Free plan · See Pro" (link) or "Pro". Nothing with the switch off.
- **The mock copies the backend:**
  - A new mock-only `NEXT_PUBLIC_MOCK_PRO_ENABLED`, read in `src/lib/api/config.ts` beside `MOCK_TIER`. **Unset means `true`** (the split on), so the mock develops against the split, as the backend's dev `.env` does. `false` shows the launch state.
  - `MOCK_TIER` (`free` by default) is now the mock's *stored* tier. Every mock `User` carries the effective tier: `proEnabled ? stored : 'pro'`. The mock summary's `missed` follows it.
  - The mock `getConfig()` returns the switch.
  - Both variables are read only by the mock adapter. Real mode never reads them.
- **Dev page `/dev/pro`:** `ProLock` pending, locked and open, default and large; `/pro` as Free, as Pro, and not found.
- **Tests (pure):**
  - Schemas: `appConfig`; an error with and without `reason`.
  - `proAccess` and `showsPro` for every combination (pending, off, on + Free, on + Pro, on + signed out).
  - The mock's effective tier for both switch values, and its `missed` following it.
- **Docs:**
  - `context/docs/contract.md`: `GET /config` and `AppConfig`, `ApiError.reason`, the `User.tier` rule (effective tier, server only).
  - `context/design.md` § Page shape: a `/pro` row (site shell, a statement and a table).
  - `context/theme.md` § States: a short "Pro lock" table (pending, locked, open).
  - `context/docs/pro-features.md`: A marked done.

## Layout

```text
/pro (switch on, Free)

Lineup Pro
More solo: pick any match, practise it, play without a daily limit.

                     Free              Pro
1v1 duels            Unlimited         Unlimited
Solo runs            5 a day           Unlimited
Exact match          —                 ✓
Archive              —                 ✓
Practice mode        —                 ✓
Post-game review     Missed count      Every player missed
Private rooms        Join              Host and join

[ Get Pro ]
Checkout comes with payments.

A ProLock

[ Reveal the full XI ]   (disabled)
Pro shows every player you missed. See Pro
```

## Out of Scope

- **Payments and checkout.** `GetProButton` is the hook point; the user wires it.
- **Every other gate:** B (rooms), C (cap), D (archive), E (exact match), F (practice).
- A nav link to `/pro`. The locks and the profile lead there.

## Open Questions

Defaults stand unless changed at load:

- **The mock defaults to the split on** (`NEXT_PUBLIC_MOCK_PRO_ENABLED` unset = `true`).
- **Signed out counts as Free** while the switch is on: the visitor's guest will start Free.
- **`/pro` copy:** "Lineup Pro" and the one line above.

## Notes

- **Source:** user request (2026-11-10): build every Pro feature behind `PRO_ENABLED`, developed with the switch on; at launch production runs it off and everyone is Pro.
- **Order:** first of six (A → B → C → D → E → F). Every later spec needs A.
- **Hard constraints:**
  - **16:** the tier and the switch come from the backend; the web only reads them. The mock variables are dev-only and never read in real mode.
  - **15:** nothing here touches a duel.
- **Constraints:** tokens only, no new hex; `@/` imports; no `any`; single-line comments of at most 50 characters.
- **Verification:**
  - `npm test`, `npm run lint`, `npm run build`.
  - **Mock, switch on (default):** a fresh guest sees the locked reveal with See Pro; `/pro` shows the table and the disabled Get Pro; the profile shows "Free plan · See Pro". With `NEXT_PUBLIC_MOCK_TIER=pro`, the reveal works, `/pro` says "You have Pro.", and the profile says "Pro".
  - **Mock, `NEXT_PUBLIC_MOCK_PRO_ENABLED=false`:** the reveal works for a fresh guest, `/pro` is not found, and no Pro wording shows anywhere (`/play`, profile, summary).
  - **Real, backend `PRO_ENABLED=true`:** a fresh guest is Free. After `npm run user:tier -- <handle> pro` in the backend, a reload shows Pro.
  - **Real, backend `PRO_ENABLED=false`:** a fresh guest is Pro, and nothing says Pro.
  - **Widths:** `/pro` at 320, 390, 768 and 1440 with no sideways scroll.
