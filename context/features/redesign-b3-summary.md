# Redesign B3 — Gate, Side Pick and Run Summary

## Status

Completed

## Goals

The last part of redesign stage B: what covers or replaces the live rail. That's the gate overlay, picking a side, and the end of a solo run. Depends on B1 and B2. **Behaviour, copy, focus handling and accessible names don't change.**

**Adapted to B1 and B2 as built (2026-11-15).** The game is one board: dark scoreboard strip, turf pane, peach rail pane (`surface-raised`). The user's rule from the B1 review applies here too: **united, not carded, no white panels.**
- The summary's pieces are sections of the rail pane, divided by edge-to-edge ink rules (`RAIL_SECTION`), not white boxes.
- Controls stay white as fields and buttons: the side-pick tiles, Buttons, and `ProLock`.
- B1 already made the summary's and the gates' secondary actions full-width secondary Buttons, and rounded the gate scrim to the board's corners.
- B2 already made lost lives dashed shirts in the summary.

- **`CanvasGate`**, accepted as the Alert Dialog look (2026-11-15):
  - the scrim stays `gate-scrim`;
  - the panel takes the accepted Alert Dialog shape on the board's peach (`surface-raised`), not white: 2px ink outline, hard shadow, `rounded-lg`;
  - the title in `TYPE_TITLE_LONG` (gate titles run long: "Hosting a room needs Pro"), the detail in `fg-muted`, the actions as A2 Buttons;
  - sizes (narrow, wide, the lobby sizes) and the focus trap, focus return and live status are unchanged.
  - Every gate gets the look: side pick, empty pool, cap, picked match, practice, lost run and reconnecting.
- **`SidePickCard`**, as in `game/12-pick-side-a` (layout only):
  - the context line (competition logo and name, date) and the score in `TYPE_NUMBER` between the two choices, as today;
  - each side is a choice tile: the crest in a round 2px ink frame on a white disc, the club name under it in `TYPE_CARD_TITLE`;
  - the tile is a button with the A2 press (hard shadow, sinks on press). Hover lifts the crest, as today.
  - **One tap picks**, with no Next step. While the pick is in flight (`isChoosing`) both tiles mute, lose the press and go inert. If the view knows which side was tapped, that tile keeps its outline and strong label, as the reference's chosen option does.
  - The slide-in entrance and the reduced-motion rules are unchanged.
- **`RunSummary`**, as in `game/15-results-a` (layout only): a title block, then a results table, then the actions at the bottom.
  - **The title block** (a rail section with an ink rule under it):
    - "Run ended" or "Perfect clear" in `TYPE_TITLE`, with "You named 7 of 11." under it;
    - lives remaining on the right: our shirts, or for a perfect clear the big number with "lives left";
    - a perfect clear keeps its `found` takeover: a green block, never white. Otherwise the block sits on the pane with no fill;
    - practice shows a "Practice" sticker `Badge` where the lives were.
  - **Stats** (open question 1): a rail section with the values side by side, each a `TYPE_NUMBER` value with a label, split by a vertical ink rule. No filled tiles.
  - **The results table: `NamedOrder`**, in the neobrutalism.dev [Item](https://www.neobrutalism.dev/docs/item) / [Table](https://www.neobrutalism.dev/docs/table) look (accepted 2026-11-15):
    - rows on the pane (no white rows) divided by `rule` lines, with the totals row set off by an ink rule;
    - each row: the order number, the A2 `Avatar` (size-6), the name, the find time and a check icon (Lucide `CircleCheck` in `found-text`);
    - the fastest find stays marked, bold with its screen-reader word;
    - a **totals row** at the bottom, like the reference's "Total score": named and missed counts (`found.length`, `missedCount`);
    - the empty copy ("You didn't name anyone this time.") is unchanged;
    - from `lg` the table scrolls inside the rail, as today.
    - The duel variant (finder colour and name per row) keeps working, since `DuelResultPanel` uses it. Its full redesign is stage E.
  - **`MissedReveal`**: a full-width secondary Button, or the `ProLock` locked state, as today. The missed slots on the pitch use B1's missed style and keep their stagger.
  - **`ResultActions`**: the primary action full width at the bottom, the others under it, as in the reference. B1 already made the secondary a full-width secondary Button. B3 only sets them off with an ink rule above. The labels and the cap, picked-match and practice variants are unchanged.
  - **The summary skeleton** takes the same boxes (title block, stats, table rows, actions).
  - Focus still lands on the title when the summary is ready.

## Out of Scope

- `DuelResultPanel`, the lobby and the room screens (stage E). The reference's you-vs-opponent columns are kept for the duel result there.
- New motion.
- Any new summary data.

## Open Questions

1. **Accuracy and best streak.** theme.md § States (Solo, Run over) lists the summary as "named vs missed, time per round, accuracy, streak". The summary payload already carries `accuracy` and `bestStreak`, but today's summary doesn't show them. **Default: a stats section with Accuracy (as a percentage) and Best streak**, between the title block and the table, so the summary matches theme.md. The alternative is leaving them out, as today.

## Notes

- **References:** `context/screenshots/game/12-pick-side-a` and `15-results-a`; guide § 4 (`CanvasGate`, `SidePickCard`, `RunSummary`, `NamedOrder`, `MissedReveal`).
- **No "Clock ran out" rows.** Guide § 4 suggested a row for each round lost to the clock. The summary's `roundTimesMs` gives the round times but not which rounds were lost, so the table lists named players only, with the totals row. Showing lost rounds needs a backend change (a separate backend phase first).
- **Check:**
  - every gate through `?state=` and `?scenario=`: side pick, busy pick, empty pool, cap, picked match, practice, reconnecting;
  - the summary: run over, perfect clear, practice, free with missed locked, Pro with missed revealed, nobody named;
  - the summary skeleton;
  - focus on the title;
  - 320px and `lg` with a long list scrolling.
- **Dev server:** don't run `npm run build` while the user's dev server is up (the stale-CSS issue). Ask them to stop it for the final build.
- **With B3 done, stage B is complete.** The next collection is stage C (`/play`, guide § 5).
- **Deviations recorded during implementation:**
  - **Open question took its default:** a stats section with Accuracy (`accuracyLabel`) and Best streak, split by a vertical ink rule.
  - **Summary title:**
    - sized `text-24`, then `text-30` from 360px, in Archivo 800 at width 112. `TYPE_TITLE`'s 40px at `md` is too big for the 352px rail.
    - The title block is pulled to the pane's top edge (`-mt`), so a perfect clear's green runs edge to edge.
  - **Practice tag:** a mint sticker `Badge` (neutral on the green perfect-clear block).
  - **Gate:** `TYPE_TITLE_LONG` for every gate title, narrow ones included.
  - **Side pick:**
    - a shared `CHOICE_TILE` class (secondary button look with the press, flat while busy);
    - the crest frame is 96px, 112px from `sm`;
    - the view doesn't say which side was tapped, so both tiles mute while the pick is in flight. The spec allowed this.
  - **Table:**
    - 40px rows with a 24px avatar; the check icon shows in the duel result too, since it shares `NamedOrder`;
    - the totals row is solo only, through a new `missedCount` prop and the `namedTotalsLabel` helper.
  - **Actions rule:** only `RunSummary` wraps `ResultActions` in a rail section with an ink rule above. The duel result is unchanged until stage E.
  - **Production build** ran and passed with the user's dev server stopped, before completion.
