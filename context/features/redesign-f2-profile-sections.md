# Redesign F2 — Profile Record, Stats and History

## Status

Not Started

## Goals

The second part of redesign stage F (`/profile`, `context/docs/ui-redesign-references.md` § 8): the page sections from F1 (no box since `context/fixes/play-profile-layout.md`) that hold the duel record, the stats and the history. **Behaviour, copy, `lib/profile.ts`, paging, Show more focus, the row layout by width and accessible names don't change.**

- **`DuelRecord`** (`profile/03-record-a`, `03-record-b`, layout only):
  - a **lavender block** (`bg-block-lavender`, 2px ink outline, the hard shadow) with "Duel record" and the duel count on top (open question 1);
  - **three big numbers in a row** in `TYPE_NUMBER`, each with its small label **above** it (Won, Drawn, Lost), no box around each, as `03-record-a`;
  - **letter tiles** beside each label, as `03-record-b`: **W** in `you`, **D** split you / opponent, **L** in `danger`, each outlined, decorative (`aria-hidden`), the label still read. Colour sits in the tiles, so the numbers stay ink on lavender (open question 2);
  - the won / drawn / lost bar stays below (a draw shows both colours), now with a 2px ink outline;
  - zero duels: the numbers and tiles muted, as today. **No "last five" strip:** the history may not hold the last five duels, so that would be new information, not a new look.
- **`ProfileStats`** (decided 2026-11-16, reuse B3):
  - the `RunSummary` stat tiles: a small uppercase label above a `TYPE_NUMBER` value at 28px, tiles divided by 2px ink rules;
  - Solo runs, Perfect clears, Best streak and Accuracy in a 2 × 2 grid; no favourite club (removed by the user, 2026-11-16, `context/fixes/play-profile-layout.md`);
  - beside the record from `lg`, below it on phones and tablets.
- **`HistoryList`, `HistoryRow`, `HistoryMore`** (decided 2026-11-16, reuse B3):
  - "History" in `TYPE_SECTION`; the list is white (`bg-surface-card`) in a 2px ink outline with 2px ink rules between rows, as `00-page-a` / `00-page-b`;
  - the **mode** as a sticker `Badge`, untilted so the column stays calm: Solo `mint`, Duel `purple`, Friend `butter` (open question 3); Friend keeps its "Duel with a friend" reading;
  - the outcome keeps its tone text and the draw's two-colour mark; scoreline, match line, "N of 11", `LivesLeft` and the date stay;
  - **`HISTORY_ROW` keeps its grid and heights** (two lines on phones, one from `sm`, the lives column from `lg`). It stays an `ol`, not a `<table>`;
  - **Show more** stays the secondary Button, with its loading, failed (`StateNotice`) and end states and its focus rule.
- **Empty history:** `ui/empty` (dashed outline, a Lucide `History` icon in the butter tile), today's "No games yet" copy and **Play** as the primary Button (A3's empty look).
- **`ProfileSkeleton`:** the record, stats and history placeholders follow the new sections at the same heights (the lavender block's numbers and bar, the 2 × 2 tiles, three history rows in the outlined list).

## Out of Scope

- The board, header, guest prompt and notices (F1).
- History filters or tabs (`00-page-a` has them; ours would be a new feature).
- New motion.

## Open Questions

1. **The record's block.** `00-page-b` makes one lavender block the phone's hero. **Default: the record is the lavender block on every width**, so it reads as the page's main piece on desktop too. The alternative is lavender on phones only and a plain board section from `lg`.
2. **Number colours.** Today Won is blue and Lost red. **Default: ink numbers on lavender, the colour in the W / D / L tiles**: blue and red text on lavender would fail contrast. The alternative is coloured numbers on a white block instead of lavender.
3. **Mode tag tones.** **Default: Solo `mint`, Duel `purple`, Friend `butter`**, none of them the you / opponent colours, so a mode never reads as a side. The alternative is all three neutral.

## Notes

- **References:** `context/screenshots/profile/00-page-a`, `00-page-b`, `03-record-a`, `03-record-b`, and their lines in `context/screenshots/notes.md`.
- **Contrast:** text on lavender, mint, butter and the tile fills uses `on-accent` (tested pairs in `src/styles/contrast.ts`); add a pair if a new one appears.
- **New copy:** only the W / D / L letters, which are decorative.
- **Check:** `/profile?state=` `populated`, `guest`, `empty` (zero duels, no games), `loading`, `loading-more`, `more-failed`, `end`; Show more to the end with focus kept; 320, 640, 1024 and 1280px; screen-reader names for the record, stats and rows; loading and loaded heights.
- **Dev server:** the dev cache is off (`next.config.ts`), so `npm run build` can run while the user's dev server is up.
- Then stage G (`/archive`, § 9).
