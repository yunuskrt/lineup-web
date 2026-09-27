# Phase W17 — Home Page

## Status

Completed

## Goals

- Create `src/components/home/HomeFold.tsx`, a server component and the statement fold:
  - The statement _Know the XI. Beat the Clock._ is the page's only `h1`, in `font-display`, expanded and uppercase. It uses `text-32` on phones and `text-48` from `sm` up, and never `text-64`, which belongs to the countdown only (`theme.md` § Typography).
  - One short line under it says what the game is: a real match, one team, name its starting XI against the clock.
  - **Play** is the fold's one primary action, a large link to `/play` styled as the brand button (`bg-brand text-on-accent`, `rounded-sm`).
  - Under Play, one muted line carries the guest promise and the sign-in entry, e.g. "No sign-up needed — play as a guest. Have an account? **Sign in**". "Sign in" is a text link to `/sign-in`, not a second button.
  - The fold fills the viewport height left below the 64px nav at every width. Play stays above the fold at 375×667.
- Create `src/components/home/HomeRules.tsx`, a server component with a short strip below the fold that says how a round works:
  - Three beats, each a numeral in Archivo with `tabular-nums` and one line beside it: **11** starters to name, **15** seconds a turn, **3** lives, lost only to the clock.
  - One closing sentence says it's playable solo or as a live 1v1 duel.
  - It's a list (`<ol>` or `<dl>`) separated by `border-line` rules. It isn't a row of feature cards with icons.
- Update `src/app/(site)/(landing)/page.tsx` to compose `HomeFold`, then `HomeRules`. It stays a server component with no data fetching, so `/` builds as static (○).
- Update the statement variant of `src/components/shell/SiteFooter.tsx` so the closing line no longer repeats the fold's `h1` word for word (see Open Questions). The inline variant is unchanged.
- Create `src/app/(site)/(pages)/sign-in/page.tsx`, a placeholder in the W08 pattern. It exports `metadata.title: 'Sign in'` and renders one short line, so the home link never 404s before W18 fills it.
- If the fold's Play button needs a size `PRIMARY_BUTTON` doesn't cover, add one shared class to `src/styles/classes.ts` instead of writing the class string inline twice.

## Page Shape

| Band    | Content                                             | Height                        |
| ------- | --------------------------------------------------- | ----------------------------- |
| Nav     | Wordmark left, "Play" right (unchanged from W08)    | 64px                          |
| Fold    | Statement `h1`, one-line explainer, Play, sign-in   | Rest of the viewport          |
| Rules   | 11 / 15 / 3 strip, the solo-or-duel line            | Content height                |
| Footer  | Statement closing line                              | Content height                |

## Open Questions

Defaults stand unless changed at `/feature start`.

- **Where sign-in lives:** by default it's a dedicated `/sign-in` route, with a placeholder here that W18 fills.
  - It's deep-linkable and a plain link from `/`.
  - But `/sign-in` isn't in the route table in `project-overview.md`, and that file must stay identical across all three repos. Adopting it means adding one row there, in every repo.
  - The alternative is an auth dialog on `/` itself, which keeps the route table untouched. It pulls in shadcn's Dialog in W18 and can't be linked to directly.
- **The repeated line:** by default the fold leads with _Know the XI. Beat the Clock._ and the footer closes on a different statement, e.g. _Eleven names. Fifteen seconds._ That way the page doesn't say the same sentence twice with nothing between. The alternative keeps the footer as is and gives the fold a different headline, but the tagline is the strongest line the product has, and it belongs on the fold.
- **Nav "Play" on `/`:** by default it stays. It's the same action as the fold's Play, not a second one, so `design.md` § One primary action per view still holds. The alternative is to hide it on `/` the way W08 hides it on `/play`.
- **A visual in the fold:** by default there isn't one; the type is the composition. The alternative is an inert `Pitch` with 11 empty outlined slots behind or beside the statement. It's on-brand, but it competes with a one-line fold.

## Out of Scope

- **Auth behaviour:** the sign-in and sign-up forms, continue-as-guest and guest session creation → W18. W17's "play as a guest" is copy plus a link to `/play`, and it calls nothing on the API client.
- **Session-aware home or nav** (hiding "Sign in" when signed in, showing a handle) → W18.
- **Entrance animation.** The fold is static. If W26 wants motion, it adds it with a reduced-motion variant.
- Open Graph images, social cards and SEO beyond the root `metadata` (social sharing is post-MVP).
- Any mention of Pro, pricing, leaderboards or difficulty. `memorability_score` never surfaces (Hard Constraint 20).

## Notes

- Scope: the `/` body (fold and rules strip), the footer's closing line, and a `/sign-in` placeholder so the entry resolves.
- Depends on: W08 for the `(landing)` group, `SiteNav`, `SiteFooter` and `SITE_CONTAINER`, and W03 for the fonts and role utilities.
- References:
  - `context/design.md` § Page shape per route (statement fold, nav, closing statement) and § The home page owes the references nothing.
  - `context/project-overview.md` § Route Architecture ("what the game is, Play CTA, sign in / continue as guest") and § Accounts (guest play is first-class, with no signup wall).
- Constraints:
  - **Server components only.** Nothing on `/` needs `'use client'`, and the page ships no page-specific client JS.
  - **Copy states rules the product actually has:** exactly 11 starters, 15 seconds, and 3 lives lost only to the clock. No real match, score or player is named as if it were playable, because the MVP dataset is fictional.
  - **Colours come from role utilities only** (`text-fg`, `text-fg-muted`, `bg-brand`, `text-on-accent`, `border-line`). No hex, and no primitives outside `tokens.css`. Text on `brand` is `on-accent`, never `fg`.
  - **Form:** no shadows, `rounded-sm` for the button, never pill-shaped. No four-column footer and no social row.
  - Visible `FOCUS_RING` on Play and Sign in. The tab order runs wordmark, nav Play, fold Play, Sign in.
  - `@/` imports, typed props (`type Props`) and the existing named-export component style of `src/components/shell/`. Comments only for the non-obvious, 50 characters max.
- Verification:
  - `npm run lint`, `npm run format:check`, `npm test` and `npm run build` pass. The build lists `/` as static and lists `/sign-in`.
  - Searching for `#[0-9a-fA-F]{3,6}` under `src/` still matches only `tokens.css`.
  - In the browser (`npm run dev`):
    - `/` shows the statement fold filling the viewport under the nav, then the rules strip, then the closing footer.
    - Play leads to `/play`, and Sign in leads to the `/sign-in` placeholder.
    - The page has exactly one `h1`, and the footer line isn't identical to it.
    - At 375×667, Play is visible without scrolling. At 375, 834 and 1440 wide there's no horizontal scroll, and the statement doesn't break mid-word.
    - Tabbing reaches the wordmark, nav Play, fold Play and Sign in in that order, each with a visible focus ring.
    - `/play`, `/profile`, the game routes and `/dev/*` are unchanged.
- **Deviations recorded during implementation**
  - **No empty `Props` type.** `type Props = {}` fails `@typescript-eslint/no-empty-object-type`, because `eslint.config.mjs` doesn't set the `allowObjectTypes` option that `coding-standards-web.md` says it does. Both home components follow `src/components/shell/` instead: named exports with no props parameter.
  - **The heading gets one line per sentence below `lg`.** Each sentence is a `block lg:inline` span. Left to wrap naturally, it broke as "KNOW THE / XI. BEAT / THE CLOCK." at 375. From `lg` up it's one 48px line.
  - **Rules are stacked ruled rows at every width**, not three columns, following the frontend-design pass (it avoids the big-number stats row). The numerals sit in a right-aligned `w-12` column. The section heading is an sr-only `h2`, "How it plays".
  - **No shared button class added.** The fold's Play (`px-8 py-3 text-16`) is used once, so its classes stay inline.
  - **Values:** the fold is `min-h-[calc(100svh_-_var(--spacing)_*_16)]` with its content centred vertically, and the explainer is capped at `max-w-xl` with `text-pretty`.
  - **Copy:**
    - Explainer: "You get one team from a real match. Name its starting eleven before the clock runs down."
    - Guest line: "No sign-up needed. Have an account? Sign in".
    - Rules: "Starters to name, from one team in one real match." / "Seconds a turn. Name a new player to end it." / "Lives. Only the clock takes one. A wrong name just costs time."
    - Closing line: "Play solo, or take someone on live in a 1v1 duel."
    - Footer: "Eleven names. Fifteen seconds."
  - **Open Questions:** every default stands: a `/sign-in` route, a new footer line, the nav's Play kept on `/`, and no visual in the fold.
    - After review, `/sign-in` was added to the route table in `project-overview.md`, at the user's request. The backend and mobile copies still need the same row.
  - **No `Rule` type in `HomeRules`.** It was dropped after review; `RULES` is inferred instead.

## History
