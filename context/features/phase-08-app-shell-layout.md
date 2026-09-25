# Phase W08 — App Shell & Layout

## Status

Not Started

## Goals

- Update `src/app/layout.tsx`, the single root layout. It stays the only root layout, so moving between `/play` and `/play/solo` never triggers a full page reload. Its `metadata.title` becomes `{ template: '%s · Lineup', default: 'Lineup' }`. Fonts, `<html>` and `<body>` are unchanged.
- Create the shell components in `src/components/shell/`:
  - `SiteNav.tsx`: a server component in `<header>` / `<nav aria-label="Primary">`. The wordmark sits on the left and links to `/`. `NavCta` sits on the right. There's no hamburger at any width, because the site has only a handful of routes.
  - `NavCta.tsx`: a client component, since it needs `usePathname`. It renders a "Play" link to `/play` styled as the primary button (`bg-brand text-on-accent`), and renders nothing on `/play` itself, so that view keeps one primary action (`design.md` § One primary action per view).
  - `SiteFooter.tsx`: a `<footer>` with `variant: 'statement' | 'inline'`.
    - `statement`: the closing line _Know the XI. Beat the Clock._ in `font-display`, used on `/`.
    - `inline`: one small line in `text-fg-muted`, used on `/play` and `/profile`.
    - Never a link-column sitemap or a social row.
  - `QuitChip.tsx`: a small chip labelled "Quit" that links to `/play`, `rounded-sm`, with a `border-line` outline and `text-fg-muted`.
- Create the route groups, all under the one root layout:
  - `src/app/(site)/layout.tsx`: `SiteNav`, then its children.
  - `src/app/(site)/(landing)/layout.tsx`: children in `<main>`, then `SiteFooter variant="statement"`.
  - `src/app/(site)/(landing)/page.tsx`: the `/` placeholder. It moves the current `src/app/page.tsx` content here; nothing new is added.
  - `src/app/(site)/(pages)/layout.tsx`: children in `<main>`, then `SiteFooter variant="inline"`.
  - `src/app/(site)/(pages)/play/page.tsx` and `src/app/(site)/(pages)/profile/page.tsx`: placeholders.
  - `src/app/(game)/layout.tsx`: no nav and no footer. A full-viewport frame (`min-h-dvh`) holds children in `<main>`, and `QuitChip` sits in the top-right corner.
  - `src/app/(game)/play/solo/page.tsx` and `src/app/(game)/play/duel/page.tsx`: placeholders. `/play/duel` is the one route for the whole duel session.
- Each placeholder page exports `metadata` with its title (`Play`, `Profile`, `Solo`, `Duel`) and renders one short line naming the page. Game placeholders fill the frame with an outlined `border-line` region where the canvas will go, and never scroll.

## Layout Contract

| Route                      | Group               | Nav                         | Footer      | Quit chip |
| -------------------------- | ------------------- | --------------------------- | ----------- | --------- |
| `/`                        | `(site)/(landing)`  | Wordmark + "Play"           | `statement` | —         |
| `/play`                    | `(site)/(pages)`    | Wordmark only (CTA hidden)  | `inline`    | —         |
| `/profile`                 | `(site)/(pages)`    | Wordmark + "Play"           | `inline`    | —         |
| `/play/solo`, `/play/duel` | `(game)`            | **None**                    | **None**    | Top-right |
| `/dev/theme`               | outside all groups  | None                        | None        | —         |

## Open Questions

Resolved: `/feature start` was run with no changes, so the defaults below stand.

- **Wordmark:** plain text "Lineup" in `font-display`, expanded and uppercase. The prototype's "XI" badge isn't adopted, because a mark is a brand decision this phase shouldn't make.
- **Nav CTA:** "Play" everywhere except `/play`, where it's hidden. W18 may add a sign-in entry beside it.
- **Inline footer copy:** "Lineup — Know the XI. Beat the Clock."

## Out of Scope

- **Page bodies:** home → W17, auth → W18, `/play` diptych and filters → W19, profile → W24.
- **What quitting does:** the solo confirm modal → W20, duel leave and forfeit → W23. In this phase the chip is a plain link to `/play`, and those phases will intercept it.
- **Auth state in the nav** (signed in, guest, sign-in link) → W18.
- **The pitch/rail split inside the game frame**, i.e. the canvas composition → W16.
- **Motion:** no animation in the shell. Motion isn't installed yet.
- A custom `not-found.tsx`, `/leaderboard` (post-MVP) and a light theme.

## Notes

- Scope: every route's frame and chrome, with placeholder bodies, so the whole route map can be clicked through.
- Depends on: W03 (role utilities, fonts) and W04 (`/dev/theme` stays outside the groups).
- **Why nested route groups.** `/play` carries site chrome but `/play/solo` must carry none, so a `/play/layout.tsx` can't be used: it would wrap `/play/solo` too. Splitting into `(site)` and `(game)` gives each its own layout without changing any URL. Splitting `(site)` again into `(landing)` and `(pages)` keeps both footer variants in layouts rather than repeated in pages. Per `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route-groups.md`, paths in different groups must not collide, and only multiple _root_ layouts cause full reloads. There's one root here.
- **Types:** use the global `LayoutProps` / `PageProps` helpers (`layout.md`). Confirm the generated route keys for the group layouts after `next dev` or `next build` has run type generation.
- **Prototype reference:** `context/screenshots/game-screen-prototype.png` (see `design.md` § Scope).
  - Taken for this phase: the quit chip in the top-right corner, away from the input; no site chrome on game routes at any size; the game frame fills the viewport without scrolling.
  - Not adopted: the "LINEUP · SOLO RUN" label bar on tablet and mobile (game routes carry no chrome), and the "XI" badge wordmark.
  - The rest of the image belongs to W09–W16.
- Constraints:
  - `design.md` § Page shape per route is the contract. Game routes ship no `<header>`, `<nav>` or `<footer>` elements at all, not a reduced version.
  - Colours come from role utilities only (`bg-surface`, `text-fg-muted`, `border-line`, `bg-brand`, `text-on-accent`). No hex, `rgb()` or primitives outside `tokens.css`.
  - Borders and background lifts, no shadows. Tight corners: `rounded-sm` for chips and buttons, never pill-shaped.
  - Visible keyboard focus on the wordmark, the CTA and the quit chip (a `brand` outline).
  - `@/` imports only. Server components by default; `NavCta` is the only client component.
  - No `transition: all`.
  - Works at 375px, 834px and 1440px without horizontal scroll.
- Verification:
  - `npm run lint`, `npm run format:check`, `npm test` and `npm run build` pass. The build output lists `/`, `/play`, `/profile`, `/play/solo`, `/play/duel` and `/dev/theme`.
  - Searching for `#[0-9a-fA-F]{3,6}` under `src/` still matches only `tokens.css`.
  - In the browser (`npm run dev`):
    - `/` shows the nav with "Play" and the statement footer.
    - `/play` shows the wordmark with no CTA, and the inline footer.
    - `/profile` shows the nav with "Play" and the inline footer.
    - `/play/solo` and `/play/duel` have no `header`, `nav` or `footer` in the DOM, only the quit chip in the top-right, which leads to `/play`.
    - `/dev/theme` is unchanged.
    - Going from `/play` to `/play/solo` and back is a client-side navigation, not a full reload (the Network tab shows no new document request).
    - Tabbing reaches the wordmark, the CTA and the quit chip with a visible focus ring.
    - At 375px, 834px and 1440px there's no horizontal scroll, and game placeholders don't scroll vertically.
- **Deviations recorded during implementation**
  - Added `src/styles/classes.ts` with `FOCUS_RING` and `SITE_CONTAINER`. The focus ring and page gutter repeat across the shell and every later component, so they're shared rather than copied.
  - The quit chip sits in its own right-aligned row at the top of the game frame, not overlaid on the canvas corner. An overlay would cover the canvas header W16 puts there. W16 may reclaim the row.
  - The moved home placeholder wraps its content in a `<div>`, not `<main>`, because the group layouts now own `<main>`.
  - `LayoutProps<'/'>` is the generated key for every group layout (`(site)`, `(landing)`, `(pages)`, `(game)`), confirmed by `next build`.
