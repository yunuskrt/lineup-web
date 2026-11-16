# Fix — Play and Profile Layout: No Box, a Practice Mode, No Favourite Club

## Status

Completed

## Goals

Three changes from the user's review (2026-11-16). Web only. Behaviour, copy (except where named) and the server's checks don't change.

- **1. No box on `/play` and `/profile`.** The content sits in one outlined peach box in the middle of the screen. The layouts stay; the box goes.
  - `BOARD` keeps only its width and centring (`mx-auto w-full max-w-4xl`): no outline, no peach fill, no hard shadow, no rounded corners. The page's cream shows through.
  - `BOARD_SECTION` keeps its ink rules between sections, now running the content's width, and drops its side padding (the box is gone, so nothing to inset from).
  - Both pages, their skeletons and `RoomControls` follow, as they all use the two classes.
- **2. Practice as a mode card on `/play`.** Practice becomes a third big card beside **Solo** and **Duel**, not a checkbox. Same functionality:
  - picking it starts a solo practice run: Start reads "Start practice", the cap line hides, the open-run warning stays, and the URL keeps `mode=solo&practice=1`;
  - Solo and Duel clear practice; the route stays `/play/solo` for practice;
  - **locked for Free while the split is on:** the card is shown, not hidden, but inert (a disabled radio), with the Pro lock badge and today's caption ("Practice is part of Pro: no clock, no lives, not saved.") and **See Pro**; **pending:** shown locked, no caption; **switch off:** an ordinary card;
  - a practice link opened by a player who can't use it falls back to Solo selected, as the checkbox did;
  - card copy: "Practice", "No clock and no lives. Name all eleven, or quit when you like. Practice runs aren't saved.", a Lucide `Dumbbell` icon, your colour bar.
  - `PracticeToggle` goes; the `/dev/pro` preview shows the card's three states instead.
- **3. No favourite club on `/profile`.** The "Favourite club" stat row goes. The four number stats stay. The field stays in the contract (`UserStats.favouriteClub`); the page just doesn't show it.

## Notes

- **Source:** the user's review, 2026-11-16, after F1.
- **Hard constraints:** 15 and 16. Practice stays Pro-only by the server's check (R14); the card only asks for it.
- **Constraints:** tokens only; `@/` imports; no `any`; comments of at most 50 characters.
- **Tests (pure):** the card choice from mode and practice, and back (`lib/practice.ts`). `favouriteClubStat` and its tests go, as nothing uses it.
- **Docs:**
  - `context/theme.md` § Solo, row "Practice": a Practice mode card, not a checkbox;
  - `context/features/redesign-f2-profile-sections.md`: no favourite club tile; `context/docs/ui-redesign-references.md` § 8 likewise;
  - memory: the "united, not carded" idea now means an open page with ruled sections, no box.
- **Not changed:** `project-overview.md` still lists favourite-club stats as stored per user; that's the shared spec and data, not this page.
- **Verification:** `/play` solo, duel and practice (switch off, locked with `NEXT_PUBLIC_MOCK_TIER=free`, pending); Start's label and the cap line; the URL after each pick; keyboard arrows through the three cards; `/profile?state=` `populated`, `guest`, `loading`, `empty`; 320, 768 and 1280px; `npm run build`.

- **Deviations recorded during implementation:**
  - **Section ends:** `BOARD_SECTION` also drops the first section's top padding and the last one's bottom (`first:pt-0`, `last:pb-0`): without the box, the page's own padding already sits there.
  - **Card order and grid:** Solo, Duel, Practice. Two columns from `sm` with Practice full width below, three from `lg`: at 768 a third-width card let "Practice" run past its padding.
  - **The locked card** is a `div` with a disabled radio named by its title; it shows the Pro caption with See Pro in place of the card's text (the caption already says it). Pending shows neither.
  - **Radio group name** comes from `useId`, so the three samples on `/dev/pro` don't share one group.
  - **Helpers:** `modeOptionOf` and `modeOf` in `lib/practice.ts`, with tests; `ModeOption` in `types/play.ts`.
  - **Stats rows:** with four rows, the `sm` two-column grid's bottom pair both drop their rule (`STAT_ROW_PAIRED`); the skeleton matches.
  - **URL:** practice reads `?practice=1` with no `mode` param, as `solo` is the default and `withMode` never writes it (unchanged from the checkbox).
  - **Not checked in the browser:** the locked card on `/play` itself with `NEXT_PUBLIC_MOCK_TIER=free` (the user's step); its three states were checked on `/dev/pro`.
