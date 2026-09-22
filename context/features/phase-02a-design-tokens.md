# Phase W02a — Design Tokens

## Status

Not Started

## Goals

- Create `src/styles/tokens.css`, a transcription of `theme.md` that declares plain CSS custom properties on `:root`:
  - All 13 colour primitives, with names and hex values copied exactly from the `theme.md` CSS block: `--pitch-950` … `--pitch-600`, `--bone`, `--muted`, `--dim`, `--floodlight`, `--away`, `--turf`, `--ember`, `--red-card`.
  - Type scale (1.25 ratio): `12 14 16 20 24 32 48 64`, in `px`.
  - Spacing scale (4px base): `4 8 12 16 24 32 48 64`.
  - Radius: `sm` 4px, `md` 8px, `lg` 12px, `full`.
  - Border width: 1px.
- Create `src/styles/motion.ts` with the `theme.md` § Motion table as typed `as const` constants (SCREAMING_SNAKE_CASE):
  - Durations in ms: reveal 320, turn handover 240, life lost 480, timer colour shift 200, skeleton pulse 1600.
  - Easing name per event: ring sweep `linear`, handover `easeOut`, colour shift `ease`, skeleton pulse `easeInOut`, reveal `spring`.
  - Skeleton pulse opacity keyframes `1 → 0.6 → 1`.
- Import `tokens.css` into `src/app/globals.css` so every primitive resolves on `:root` at runtime. **Leave the rest of `globals.css` as it is.** Rewiring `@theme`, dropping the CNA `--background`/`--foreground` hex values and swapping fonts all belong to W03.

## Notes

- Scope: primitives only. Out of scope:
  - Tailwind `@theme` mapping, semantic role tokens (surface, text, you/opponent) and dark-mode globals → W03.
  - Fonts (Archivo, Inter via `next/font`) → W03.
  - Component-level derived tokens such as `--ring-stroke-critical` and `--squad-slot-empty-border` → added with their components (W09+), per `design.md` § Token architecture.
- Why CSS for colours rather than the `tokens/colors.js` sketch in `theme.md`:
  - Tailwind v4 is configured in CSS and cannot read a TS module without a build step.
  - Making `tokens.css` the colour source keeps it as the **only file in the repo containing a hex value**.
  - JS/SVG that needs a colour references `var(--token)`. Motion resolves CSS variables, so no JS copy of the palette is needed.
- Why `motion.ts` is separate: motion values are consumed by Motion in JS, not by CSS. The file must contain no colours.
- Ring sweep duration is **not** a token. The ring runs from the server's round timestamps (W10); a hardcoded 15000 would be client-side timing. Only its `linear` easing is a token.
- Palette swappability: keep the `pitch-*` ramp at the OKLCH hue-158 rule from `theme.md`. Name variables for the primitive, not the use. A future light theme overrides these same names under a selector, so nothing else changes.
- Depends on: W01.
- Constraints:
  - Never hardcode a colour outside `tokens.css`.
  - Dark mode only at MVP, but no naming that blocks a light theme later.
  - Constants use SCREAMING_SNAKE_CASE; no `any`.
  - CSS `@import` of the tokens file: check how Next 16 + Tailwind v4 resolve it (`node_modules/next/dist/docs/`) and prefer the `@/` alias if the pipeline supports it.
- Verification:
  - `npm run lint`, `npm run format:check` and `npm run build` all pass.
  - With `npm run dev` running, DevTools shows all 13 colour primitives and the scales on `:root` with values matching `theme.md`.
  - Searching for `#[0-9a-fA-F]{3,6}` under `src/` finds hex values only in `tokens.css` and the existing CNA lines in `globals.css`, which W03 removes.

## History
