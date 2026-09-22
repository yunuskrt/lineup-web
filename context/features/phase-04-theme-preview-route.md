# Phase W04 — Theme Preview Route

## Status

Not Started

## Goals

- Create `src/app/dev/theme/theme-preview.ts`, the typed data the page renders. Every class name is a complete literal string, never built by concatenation, so Tailwind's scanner sees it:
  - `COLOR_PRIMITIVES`: the 13 `tokens.css` colours as `{ name, variable, className }` in `theme.md` order (`pitch-950` … `pitch-600`, `bone`, `muted`, `dim`, `floodlight`, `away`, `turf`, `ember`, `red-card`). Swatches use the Tailwind v4 variable shorthand, e.g. `bg-(--pitch-950)`.
  - `COLOR_ROLES`: the 15 `theme.css` roles as `{ role, primitive, className }`. Swatches use the role utilities (`bg-surface`, `bg-you`…), never the shorthand.
  - `TYPE_SCALE`: `text-12` … `text-64`, each with its rem value and its `theme.md` use. `64` is labelled "countdown only".
  - `SPACING_SCALE`: `4 8 12 16 24 32 48 64` mapped to `w-1 w-2 w-3 w-4 w-6 w-8 w-12 w-16`.
  - `RADIUS_SCALE`: `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-full`, each with its `theme.md` use.
- Create `src/components/dev/ResolvedValue.tsx`, a client component that takes a CSS variable name and renders its computed value from `:root` after mount. This shows real hex values on the page without a hex appearing outside `tokens.css`, and proves the role → primitive chain resolves. It renders a fixed-width placeholder before mount, so there's no layout shift.
- Create `src/app/dev/theme/page.tsx`, a server component:
  - Calls `notFound()` when `process.env.NODE_ENV === 'production'`, so the route exists only under `npm run dev`.
  - Exports `metadata` with the title `Theme` and `robots: { index: false }`.
  - Renders five sections in one column, in this order:
    - **Primitives**: one swatch per `COLOR_PRIMITIVES` entry, with the name, variable and `ResolvedValue`.
    - **Roles**: one swatch per `COLOR_ROLES` entry, with the role, the primitive it maps to and `ResolvedValue`. Adds text samples of `fg`, `fg-muted` and `fg-dim` on `surface`, and an `on-accent` sample on `brand` and on `found` (`theme.md` § Contrast). Adds a `you` / `opponent` pair shown together, since telling the two players apart is the palette's second job.
    - **Type**: every `TYPE_SCALE` step in Inter (`font-sans`) and in Archivo (`font-display`), using the sample "İbrahimović Şahin Özil Łukasz Čech". Adds one Archivo line with `font-stretch-expanded` (the `wdth` axis loaded in W03), one Inter Medium line (the player-name style), and a `tabular-nums` `font-display text-64` numeral row showing `15` to `0`.
    - **Spacing**: one bar per `SPACING_SCALE` step in `bg-marking`, labelled in px.
    - **Radius**: one `bg-surface-card border border-line` box per `RADIUS_SCALE` step.

## Notes

- Scope: a read-only dev page that renders what W02a and W03 defined. Out of scope:
  - Motion tokens and any animation preview → W10 onwards, when the first animated component exists. Motion isn't installed yet.
  - Component-level derived tokens (`--ring-stroke-critical` and similar) → added with their components (W09+).
  - Site nav and footer → W08. This page has neither.
  - A theme switcher or light theme → post-MVP.
  - The `?state=` override → W16.
- **Why the page uses primitives directly.** The rule is that components use role utilities only, and W03 exposes only roles as colour utilities. This page's job is to show the primitives themselves, so it is the one place allowed to reference them, through the `bg-(--pitch-950)` shorthand. That keeps the palette reset intact: no `bg-pitch-950` utility is added to `@theme`.
- **Why read values at runtime.** Printing hex strings in the page would put a second copy of the palette in the repo and break the "only `tokens.css` holds hex" rule. `ResolvedValue` reads `getComputedStyle(document.documentElement).getPropertyValue(name)`, so the page always shows what the browser actually resolved.
- **Why gate with `notFound()` instead of a `_dev` private folder.** A private folder isn't routable at all, even in dev. `notFound()` keeps `/dev/theme` reachable under `npm run dev` and makes it a 404 in `next build` / `next start`. Per `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/not-found.md`, `notFound()` must be called in the render path, and Next injects `noindex` automatically.
- **Tailwind class detection.** Tailwind v4 only generates classes it finds as complete strings in source files. A template like `` `bg-(--${name})` `` produces no CSS. That's why every class is written in full in `theme-preview.ts`.
- The page is a server component. Only `ResolvedValue` is a client component (`'use client'`), because it reads the DOM.
- Depends on: W02a (`tokens.css`), W03 (`theme.css`, `@theme` utilities, fonts).
- Constraints:
  - No hex values, `rgb()` or named colours anywhere except `tokens.css`.
  - No inline `style` props. Use Tailwind classes only.
  - `@/` imports only (`@/components/dev/ResolvedValue`, `@/app/dev/theme/theme-preview`).
  - Constants use SCREAMING_SNAKE_CASE, and entries have explicit types. No `any`.
  - Borders and background lifts for separation, no shadows (`theme.md` § Form).
  - Works at a 375px viewport width without horizontal scroll. Wide rows (the `text-64` samples) wrap or clip inside their own container.
  - No comments beyond short single-line ones where genuinely needed.
- Verification:
  - `npm run lint`, `npm run format:check` and `npm run build` all pass. The build output lists `/dev/theme`.
  - Searching for `#[0-9a-fA-F]{3,6}` under `src/` still matches only `tokens.css`.
  - In the browser (`npm run dev`, `/dev/theme`):
    - All 13 primitives show resolved values matching `theme.md` exactly.
    - All 15 roles resolve to their mapped primitive (`surface` shows `#0a0f0c`, `you` and `brand` both show `#ffc043`).
    - The Latin Extended-A names render in Inter and in Archivo with no fallback glyphs.
    - The expanded Archivo line is visibly wider than the normal one.
    - The numerals `15` to `0` don't shift horizontally between steps.
    - Setting `--surface` to `var(--pitch-600)` in DevTools recolours the `surface` role swatch and the page background, but not the `pitch-950` primitive swatch.
    - At 375px wide, there's no horizontal page scroll.
  - `npm run build && npm run start`, then `/dev/theme` returns 404.

## History
