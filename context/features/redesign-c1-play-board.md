# Redesign C1 — Play Board and Mode Choice

## Status

Completed

## Goals

The first part of redesign stage C (`/play`, `context/docs/ui-redesign-references.md` § 5): the page's layout and the Solo / Duel choice. Builds on stages A and B. **Behaviour, copy, URL syncing and accessible names don't change.** C2 restyles the controls inside the filter, practice and room sections.

The B1 rule carries over: **united, not carded, no white panels.** Controls (option cards, fields, buttons) stay white; surfaces don't.

- **One board**, as in `play/00-page-a` (layout only):
  - the page's content sits in one outlined board on the cream page: 2px ink outline, `rounded-lg`, the A2 hard shadow, the peach `surface-raised` fill, centred at a comfortable reading width (about `max-w-4xl`);
  - its sections are divided by edge-to-edge 2px ink rules, like the game board's: **Mode**, then **Match filters**, then **Start**, then **Play a friend** (duel only);
  - each section opens with a small label in the sticker / caption style, as `play/00-mobile-a` does ("Mode", "Match filters", and so on). "Match filters" keeps its heading and line;
  - the filters' loading skeleton, error notice and Try again stay inside the filters section.
- **`ModeChoice`**, as in `play/01-mode-cards-a` (layout only):
  - two option cards side by side from `sm`, stacked on phones;
  - each card: a Lucide icon in an outlined tile (`User` for Solo, `Swords` for Duel), the title in the display type, the existing line under it, and the existing you / opponent colour bars;
  - **unselected:** white, ink outline, flat, a quiet hover;
  - **selected:** a solid fill (open question 1), the hard shadow, and a small "Selected" check sticker, so the choice never rests on colour alone;
  - still a radio group: the `fieldset`, the hidden legend, keyboard arrows and the focus ring are unchanged.
- **The Start section:**
  - the practice row (solo), the runs-left line, the Start button (the large primary Button) and the archive line, in today's order;
  - the cap state is unchanged: the line, **Play a duel** and **See Pro**, never a dead end;
  - the practice warning dialog and the guest-session start are unchanged.
- **Phones** (`play/00-mobile-a`): the sections stack inside the board with their labels; the mode cards stack; nothing scrolls sideways at 320px.

## Out of Scope

- The controls inside the sections: filter chips, club search, season selects, the practice checkbox and the room code. That's C2.
- The duel lobby and rooms after Start (stage E).
- New motion.

## Open Questions

1. **The selected mode's colour.** **Default: lavender (`brand`)**, like every primary action, so "selected" reads as the main choice. The alternative is butter yellow (`block-butter`), closer to the reference's solid highlight, which keeps lavender only for buttons.

## Notes

- **References:** `context/screenshots/play/00-page-a`, `00-mobile-a`, `01-mode-cards-a`, and the per-image notes in `context/screenshots/notes.md`.
- **No illustrations:** the mode reference uses 3D characters; ours get a Lucide icon tile.
- **Shared classes:** reuse `RAIL_SECTION`-style edge sections from B2, or a matching `BOARD_SECTION` class if the padding differs.
- **Check:**
  - `/play` in solo and duel;
  - Free at the cap, with runs left, and unlimited;
  - practice on and off, Free with practice locked;
  - the filters loading and failing (`?scenario=` where it exists);
  - keyboard through the mode radios;
  - 320px, 360px, `sm`, `lg`.
- **Dev server:** don't run `npm run build` while the user's dev server is up (the stale-CSS issue). Ask them to stop it for the final build.
- Then C2.

- **Deviations recorded during implementation:**
  - **Visible legend:** the Mode label is the `fieldset` legend made visible, not a second label beside an sr-only legend. The accessible name is still "Mode", and readers don't hear it twice.
  - **Start leaves the filters `section`:** Start and Play a friend are board sections of their own, no longer nested in the "Match filters" landmark. Headings and names are unchanged.
  - **Filter rows, the minimum for the board:** the panel and skeleton lose their outer bottom border (it doubled the section rule), and the last row loses its bottom padding. Everything else about the rows stays for C2.
  - **The mode title:** `TYPE_TITLE` instead of the old uppercase display type, since uppercase is kept for stickers (notes.md type table).
  - **"Selected" sticker:** hidden from readers (`aria-hidden`), because the radio's own checked state already says it.
  - **Classes:** `BOARD`, `BOARD_SECTION` (full-width padded rows with `not-first` rules, no negative margins needed) and `SECTION_LABEL` (the rail's Lives label look) in `classes.ts`.
  - **Selected colour:** lavender (`brand`), the default; the user gave no other answer.
  - **Archive keeps its look (found in review):** `/archive` reuses `FilterPanel` and `FilterSkeleton`, so its folded panel wrapper now carries the bottom line and 20px padding the panel dropped. The archive renders as before.
  - **Dev cache off (user request):** `experimental.turbopackFileSystemCacheForDev: false` in `next.config.ts` stops the stale CSS after restarts. Next 16 builds into `.next`, apart from dev's `.next/dev`, so the final build ran with the dev server up.
