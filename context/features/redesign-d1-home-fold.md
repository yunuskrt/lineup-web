# Redesign D1 — Home Bands, Fold and Demo Frame

## Status

Completed

## Goals

The first part of redesign stage D (`/`, `context/docs/ui-redesign-references.md` § 6): the page's band structure, the first screen and the demo's frame. Builds on stages A–C. **Behaviour, the demo's playback, the data and accessible names don't change.** D2 restyles the sections below the fold. Copy changes only where listed: the new tagline (decided 2026-11-16) and open question 3.

The B1 rule carries over: **united, not carded.** The page reads as **full-width colour bands divided by 2px ink rules** (`landing/00-page-a`), not cards floating on cream.

- **The band structure** (`landing/00-page-a`):
  - every home section is a full-bleed band, its content inside `SITE_CONTAINER`, the bands divided by edge-to-edge 2px ink rules;
  - band order and fills (D2 builds the ones below the fold): **fold** cream → **archive** lavender → **rules** cream → **modes** mint → **inside** ink marquee strip → **closing** butter;
  - a shared `HOME_BAND` class (or similar) in `classes.ts` for the rule, padding and fill, so D2 reuses it.
- **The new tagline, everywhere in the app** (decided 2026-11-16): "Know the XI. Beat the Clock." becomes **"Know the XI. Guess the Squad."**
  - `HomeFold`'s `h1`;
  - the inline footer line in `SiteFooter` ("Lineup — Know the XI. Guess the Squad.");
  - the site description in `src/app/layout.tsx` metadata;
  - the `/dev/theme` type sample in `src/app/dev/theme/theme-preview.ts`.
- **`HomeFold`** (`landing/01-hero-a`, layout only):
  - a full-width band on the cream page (open question 1), the headline and line on the left, the demo on the right from `lg`, stacked on phones;
  - **the headline** in `TYPE_DISPLAY` (Archivo 800, width 125 / 112 below `md`), sentence case, not uppercase (uppercase is kept for stickers, as in C1). Two lines: "Know the XI." / "Guess the Squad.";
  - **one highlight block** behind "Guess the Squad.": butter, 2px ink outline, slightly tilted, like the sticker words in `00-page-a` (open question 2). It is decoration only; the `h1` text stays one plain heading for screen readers;
  - the line under it, the large primary **Play** button and "No sign-up needed. Have an account? Sign in" stay as they are.
- **`ShowcaseFrame`** (`landing/02-demo-frame-a`, layout only):
  - the demo `Stage` sits in an **outlined browser window**: a top bar with three small ink-outlined dots and a short address pill, then the existing match header, pitch and guess input;
  - the window: white bar, 2px ink outline, `rounded-lg`, the hard shadow; the window itself is **not** tilted, so the live demo stays readable;
  - a small tilted sticker overlapping the window's top corner (open question 3);
  - the caption, the Pause / Play control, the still frame for reduced motion and the screen-reader sentence are unchanged; the skeleton keeps the new frame's shape.
- **Phones:** the bands stay full-bleed; the headline fits 320px in `TYPE_DISPLAY` at 34px; nothing scrolls sideways.

## Out of Scope

- The archive tiles, rules, modes, marquee and the closing band (D2).
- The demo's timeline, playback, pause rules and data (`use-demo-playback`, `landing-demo`).
- New motion: the existing entrances and the demo stay as they are.

## Open Questions

1. **The hero's frame.** `01-hero-a` puts the hero inside a thick ink frame on a colour band; `00-page-a` lets it run as a band. **Default: a full-width band**, matching "united" and the rest of the page.
2. **The highlight block.** **Default: one butter block, on "Guess the Squad." only**, so the headline stays readable and the effect stays special. The alternative is no block.
3. **A sticker on the demo.** **Default: a small "Demo" sticker** (our `Badge`, sticker variant, tilted) on the window's corner, the only new copy on the page, so visitors know it plays by itself. The alternative is no sticker; the caption already says what it shows.

## Notes

- **References:** `context/screenshots/landing/00-page-a`, `01-hero-a`, `02-demo-frame-a`, and their lines in `context/screenshots/notes.md`.
- **Re-measure the headline:** notes.md's width figures used "Beat the Clock."; check "Guess the Squad." at 34px on a 320px phone and at 72px on desktop (no wrap inside a line on `lg`).
- **Contrast:** ink on butter is `on-accent` on `block-butter` (tested). Add a pair to `contrast.ts` if any muted text lands on a band fill.
- **Old copy stays in history:** older specs and prompt docs quote the old tagline; don't edit them.
- **Check:**
  - `/` at 320px, 360px, `sm`, `lg`, `xl`;
  - the demo playing, paused, hidden tab, out of view, and reduced motion (the still frame);
  - the footer line on other pages and the page description;
  - keyboard: Play, Sign in, the Pause / Play control.
- **Dev server:** the dev cache is off (`next.config.ts`), so `npm run build` can run while the user's dev server is up.
- Then D2.

- **Deviations recorded during implementation:**
  - **Open questions:** all three defaults, as the user gave no other answer: a full-width band, one butter block on "Guess the Squad.", a "Demo" sticker (butter, tilted right) on the window's top-right corner.
  - **Headline sizes:** `TYPE_DISPLAY`'s 34 / 72px don't fit "Guess the Squad." in its block (10.9em at width 125: 784px at 72px against a 576px column). The headline uses `TYPE_DISPLAY` with **28px on phones, 34 from `sm`, 64 from `md` (one column), 40 from `lg` and 48 from `xl`** (two columns), so the block never wraps; measured at 320, 360, 640, 768, 1024 and 1280.
  - **`cn` and line height:** tailwind-merge treats a font-size class as overriding `leading-*`, so `leading-none` is repeated after the sizes.
  - **Block padding:** `px-1` on phones (`sm:px-2`), so the block fits a 288px column at 28px.
  - **`HOME_BAND` is the rule only** (`border-t-2 border-line`); each band keeps its `py-16` inside `SITE_CONTAINER`, and D2 adds the fills. The four sections below the fold already use it, so their dividers are 2px ink now.
  - **The window bar:** three empty ink-outlined dots (no traffic-light colours) and an empty address pill, so no fake URL or new copy. The window isn't clipped (`overflow` visible), so the suggestion row can still rise above the input; the bar takes the window's radius with `rounded-t-[inherit]`.
