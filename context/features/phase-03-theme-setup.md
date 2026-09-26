# Phase W03 — Theme Setup

## Status

Completed

## Goals

- Create `src/styles/theme.css`, the **semantic role layer**. It declares role variables on `:root` for the dark theme, each resolving to a `tokens.css` primitive and never to a hex:
  - Surfaces: `surface` → `pitch-950`, `surface-raised` → `pitch-900`, `surface-card` → `pitch-800`.
  - Lines: `line` → `pitch-700` (borders, dividers), `marking` → `pitch-600` (pitch markings, empty slot outlines).
  - Text: `fg` → `bone`, `fg-muted` → `muted`, `fg-dim` → `dim`, `on-accent` → `pitch-950` (text on `floodlight`/`turf`, per `theme.md` § Contrast).
  - Semantic: `brand` and `you` → `floodlight`, `opponent` → `away`, `found` → `turf`, `warning` → `ember`, `danger` → `red-card`.
- Rewrite `src/app/globals.css`:
  - Keep `@import 'tailwindcss';` and the `tokens.css` import (relative, see Notes), then import `theme.css`.
  - Remove the CNA `:root` hex values, the `@theme inline` block and the `prefers-color-scheme` media query.
  - Add an `@theme inline` block, pointed at the role variables, that:
    - Resets Tailwind's default palette (`--color-*: initial`) and exposes **only the semantic roles** as colours (`bg-surface`, `text-fg`, `border-line`, `text-you`…).
    - Resets and replaces the type scale (`--text-*: initial`) with `text-12` … `text-64`, fed from `--font-size-*`.
    - Sets `--spacing` to `var(--space-4)`, so the 4px base drives every spacing utility.
    - Resets and replaces radius (`--radius-*: initial`) with `sm`/`md`/`lg`/`full`, fed from `--corner-radius-*`.
    - Sets `--font-sans` (Inter) and `--font-display` (Archivo) from the `next/font` variables, each ending in `ui-sans-serif, system-ui, sans-serif`.
  - Base styles in `@layer base`, reading role variables and never `--color-*`:
    - `color-scheme: dark` on `:root`.
    - Default border colour `line`. Preflight's fallback is `currentColor`; `theme.md` specifies `pitch-700`.
    - `body` background `surface`, text `fg`.
    - The font family comes from preflight via `--font-sans`, and antialiasing from the existing `antialiased` class. No stray hex.
- Update `src/app/layout.tsx`:
  - Replace Geist with `next/font/google` **Inter** and **Archivo**, each with subsets `latin` + `latin-ext`.
  - Load Archivo with `axes: ['wdth']` so the expanded display cut is available without a second family.
  - Expose them as `--font-inter` / `--font-archivo` on `<html>`.
- Convert the type scale in `src/styles/tokens.css` from `px` to `rem`: `0.75rem` … `4rem`, identical at the default 16px root. This makes text respect the user's browser font size. Carried over from the W02a review.
- Update the `src/app/page.tsx` placeholder to use the new scale, so it doesn't reference any removed utility (`text-2xl` goes away with the reset). The heading uses `font-display text-24`, which exercises Archivo. No new content.

## Notes

- Scope: theme wiring only. Out of scope:
  - The `/dev/theme` preview route → W04.
  - Component-level derived tokens (`--ring-stroke-critical`, `--squad-slot-empty-border`) → with their components (W09+).
  - shadcn/ui install and theming → when the first shadcn component is needed.
  - A light theme → post-MVP. This phase only makes it cheap.
- **Why a semantic layer, and why only roles become utilities.** CLAUDE.md requires the palette to be swappable and a light theme easy to add.
  - If components used `bg-pitch-950` directly, a light theme would mean redefining `pitch-950` as a light colour, which is nonsense.
  - With roles, a light theme is one `[data-theme='light']` block remapping ~15 role variables to new primitives, and no component changes.
  - Primitives stay available as plain CSS variables so component tokens (W09+) can resolve from them, per `design.md` § Token architecture.
- **`@theme inline`, pointed at role variables** (the Tailwind v4 documented theming pattern):
  - `@theme inline { --color-surface: var(--surface) }` makes `bg-surface` output `var(--surface)`, so a light theme overrides the role and every utility follows. That includes a scoped `[data-theme]` on a subtree.
  - Never map `@theme` straight to primitives (`var(--pitch-950)`); utilities would then bypass the role layer.
  - Custom CSS reads role variables (`var(--surface)`), not `--color-*`. A `--color-*` variable resolves once at `:root`, so a scoped theme wouldn't reach it.
- **Font stacks end in a generic family.** `next/font`'s fallback face is built from `local("Arial")`. Without `sans-serif` at the end, a device with neither the web font nor Arial (some Android/Linux) renders serif.
- **Only font families are overridden** (`--font-sans`, `--font-display`). `--font-*` is not reset, so Tailwind's mono stack and other font defaults stay untouched.
- **Resetting the default palette is deliberate.** With `--color-*: initial`, `bg-red-500` no longer exists, so a colour off the token list can't be reached for by accident. Same for type and radius: only `theme.md` values are available.
- **Spacing caveat:** `--spacing: 4px` still allows off-scale multiples (`p-5` = 20px). The scale is `4 8 12 16 24 32 48 64`; review catches off-scale use rather than tooling.
- **CSS imports stay relative** (`../styles/tokens.css`, `../styles/theme.css`). Tailwind's resolver ignores tsconfig `paths` (found in W02a); the `@/` rule covers TS imports only.
- **Fonts:** check `node_modules/next/dist/docs/01-app/03-api-reference/02-components/font.md` for the `axes` option. `latin-ext` is required: player names include İbrahimović, Şahin, Łukasz, Čech (`theme.md` § Typography).
- **No reduced-motion rules in globals.** `theme.md` forbids a global kill-switch because it would stop the countdown ring. Reduced motion is handled per component.
- **Dark mode only.** No `prefers-color-scheme` branching; `:root` is the dark theme.
- Depends on: W02a (`tokens.css` primitives and scale names).
- Constraints:
  - After this phase `tokens.css` is the only file under `src/` containing a hex value.
  - No inline styles, no `tailwind.config.*` file.
  - No `transition: all` in globals.
  - Tabular figures belong to the countdown (W10), not to globals.
- Verification:
  - `npm run lint`, `npm run format:check` and `npm run build` all pass.
  - Searching for `#[0-9a-fA-F]{3,6}` under `src/` matches only `tokens.css`.
  - In the built CSS, colour utilities read role variables (`bg-surface-card` → `var(--surface-card)`).
  - In the browser (`npm run dev`), the placeholder page renders on `pitch-950` with a `bone` heading in Archivo, and the Network tab shows Inter and Archivo loading.
  - In DevTools, `--surface` resolves through `--pitch-950` to `#0a0f0c` on `:root`.
  - Temporarily adding `bg-red-500`, `text-2xl` or `rounded-xl` to the page produces no rule; remove them after checking.
  - Temporarily setting `--surface` to another primitive in DevTools repaints the page. That proves the role override a light theme will rely on.

## History
