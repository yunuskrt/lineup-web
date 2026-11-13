# Fix — Pro Polish E: The Last Show More and the Gates at the Cap

## Status

Completed

## Goals

Two items from the final Pro browser review (2026-11-13, items 5 and 7). Web only.

- **5. Focus after the last Show more.** When Show more loads the final page, the button goes away and focus falls to `<body>`. With more pages left, focus stays on the button, as today.
  - When the last page arrives and the button is removed **while it had focus**, focus moves to the first row that page added. In `/archive` that is the row's Play button. Tab then carries on through the new rows.
  - The fix lives in the shared `HistoryMore` (`src/components/profile/HistoryMore.tsx`), so `/profile` history gets it too. Its rows have no control, so the row itself takes focus (`tabIndex={-1}`, the usual focus ring).
  - Focus never moves if it was somewhere else when the page arrived (for example, the player clicked away while it loaded).
  - The `role="status"` line ("Showing 22 matches") stays as it is.
- **7. The pick and practice gates at the cap.** For a Free player with no solo runs left today, the practice gate says "A timed run from your filters is still free.", but they can't start one until the reset. The picked-match gate's "A random match from your filters is still free." has the same problem.
  - At the cap, both gates show the cap line instead: "You've played your 5 solo runs today. More at 03:00." (`capLine`, the same line `/play` and the cap gate show).
  - Titles and actions stay as they are: "Practice is part of Pro" or "Picking a match is part of Pro", then Back to play and See Pro.
  - With runs left, or while the allowance is still loading, the "still free" lines stay as today.
  - The decision goes in `failedGate` in `src/lib/solo-run.ts`, which already gets `capLine`.

## Notes

- **Source:** the final Pro browser review (2026-11-13), items 5 and 7. Not chosen: 1–4, 6, 8–12.
- **Found while writing the spec:** `HistoryMore` is shared with `/profile`, so its history list had the same focus drop. It is fixed in the same place.
- **Hard constraints:** 1 and 16. The server still decides the cap and the tier; the line is only the copy.
- **Constraints:** tokens only; `@/` imports; no `any`; comments of at most 50 characters; animation stays in Motion.
- **Tests (pure):** `failedGate` through the exported view builder: a practice refusal and a pick refusal, each with and without a cap line.
- **Docs:** `context/theme.md` § Solo, rows "Picked match" and "Practice": at the cap the gate shows the cap line in place of the "still free" line.
- **Verification:**
  - `npm test`, `npm run lint`, `npm run build`.
  - **Live, Pro, `/archive?q=milan+2005`:** Tab to Show more and press Enter. Focus lands on the Play button of row 21, and Tab reaches row 22's actions. A search with three or more pages keeps focus on Show more until the last one.
  - **Live, `/profile`:** the same check on the last page of history, where row-level focus is visible.
  - **Live, Free at the cap (switch on):** `/play/solo?practice=1` and `/play/solo?match=<id>` show the cap line, with Back to play and See Pro. A Free player with runs left still sees the "still free" lines.

**Deviations recorded during implementation**

- 5: `HistoryMore` takes a `listRef` and notes the row count at Show more; a layout effect focuses row `children[count]` only if focus fell to `<body>`.
- 5: the target is the row's first live `a[href]` or button, else the row. History rows get `tabIndex={-1}` and an inset brand ring (`-outline-offset-2`), so the panel's edge doesn't clip it.
- 5: Try again after a failed page takes the same path, so its last page also keeps focus.
- 7: theme.md's Practice row had no Free gate line; it gains one, the cap line included.
