# Fix — Pro Polish C: Narrow Screens

## Status

Not Started

## Goals

Three layout problems from the Pro browser review (2026-11-12, items 6, 8 and 21). Web only.

- **6. Archive rows keep the stage readable.** The event text ("Champions League quarter-final") is cut off at 1440 despite spare space ("…quarter-…"), shrinks to "Crown Le…" at 390, and at 320 only the logo is left. Final vs quarter-final is the point of that column.
  - **From `sm`:** the event column takes the room it needs. The two club columns are capped (for example `minmax(0,16rem)`) and the event column gets the spare width, so the full event fits at 1440. At 768 it may still truncate, with its `title`.
  - **Phones:** the row gets three lines. The fixture; the date and the event (the full width, truncating only at the very end); then Play and Practise, right-aligned. The row height grows to fit (about 6.5rem), and the nickname stays hidden below `sm`.
  - `ArchiveSkeletonRows` matches the new rows exactly at each width (`theme.md` § Loading). `ARCHIVE_ROW` and the foot and action classes live in `src/components/archive/styles.ts`.
- **8. Gated game screens fit at 320.** The side pick, the daily-cap gate and the match, practice and room gates are 326px wide in a 320px screen. The Lives card's third shirt is cut off outside the dimmed overlay.
  - The cause is the rail's phone band (ring plus Lives card side by side, `ActiveRail` in `src/components/game/GameCanvas.tsx`, `LivesCard`), which can't shrink below its content.
  - Below about 340px, the Lives card's tiles shrink or the band wraps, so nothing overflows. The ring keeps its size: it carries information.
  - Check every `/play/solo` and `/play/duel` snapshot at 320, not just the gated ones.
- **21. The nav at 320 names the player.** The guest handle shows as "gue…" since the Archive link was added.
  - Below `sm`, the account link shows a person icon instead of the handle. The handle stays its accessible name (`aria-label`) and its `title`. From `sm`, the handle as today. Signed out, "Sign in" is unchanged.
  - The icon is an inline SVG in `currentColor`, about 20px, inside the existing 24px-plus hit area (`NavAccount`).

## Notes

- **Source:** the Pro browser review (2026-11-12), items 6, 8 and 21.
- **Order:** any; independent of A, B and D.
- **Constraints:** tokens only; `@/` imports; no `any`; comments of at most 50 characters; animate nothing new; skeletons match the loaded layout.
- **Tests:** layout, checked in the browser; no new pure logic expected.
- **Docs:** `context/design.md` § Page shape, the `/archive` row: three lines on phones. If the nav changes, the nav note: the icon below `sm`.
- **Verification:**
  - `npm run lint`, `npm run build`.
  - `/archive?state=open`, `long` and `loading` at 320, 390, 768 and 1440: the event readable, no sideways scroll, and the skeleton rows the same height as the loaded ones.
  - Every `/play/solo?state=…` and `/play/duel?state=…` snapshot at 320: `document.documentElement.scrollWidth <= innerWidth`.
  - `/profile` and `/archive` at 320 signed in: the icon shows, and a screen reader reads the handle.
