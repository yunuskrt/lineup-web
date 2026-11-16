# Redesign E2 — Duel Result, Reconnecting and Join Refused

## Status

Completed

## Goals

The second part of redesign stage E: the end of a duel and its connection states. Depends on E1. **Behaviour, copy, the result data, the server deadlines and accessible names don't change.** Focus still lands on the result title, never on Play again.

- **`DuelResultPanel`** (decided 2026-11-16, reusing B3):
  - the same rail sections as the solo `RunSummary`, divided by edge-to-edge ink rules (`RAIL_SECTION`): the outcome section, the tally, the named list, the actions;
  - **outcome:** win and forfeit win in **your colour** (`you` fill), loss on white with a danger accent, draw with **both colours** and neither leading (a split top band, as today); the title in the display type; **Forfeit** as a sticker `Badge`;
  - **tally** as two stat tiles in the B3 stats look, one per side: the owner's `ACTOR_BAR`, the label ("You named", "{handle} named"), the count in `TYPE_NUMBER` and that side's `Lives`;
  - the named list is the B3 `NamedOrder` in duel mode (finder colours, unchanged); the actions are today's `ResultActions` (B1 secondary Buttons).
- **`ReconnectChip`** (decided 2026-11-16, reusing A2): our sticker `Badge` in the warning tone with a Lucide `WifiOff` icon, "Reconnecting, 18s", ticking from the server deadline as today. It stays next to the opponent's lives and turn label.
- **The reconnecting overlay** (decided 2026-11-16, reusing B3): the existing `CanvasGate` peach panel with a `WifiOff` icon in an outlined tile and the countdown in `TYPE_NUMBER`; the line that **your clock keeps running** stays, so it never reads as a freeze.
- **Join refused** (decided 2026-11-16): the gate's detail line becomes the neobrutalism.dev [Alert](https://www.neobrutalism.dev/docs/alert), copied into `src/components/ui/alert.tsx` and adjusted to our theme: a Lucide `CircleAlert` icon, the existing message for the case (wrong code, full room, your own room), the warning tone, 2px ink outline. **Back to play** and the code kept in the `/play` box are unchanged.

## Out of Scope

- The lobby, room and versus screens (E1).
- The connection logic, the reconnect window and the forfeit rules.
- New motion.

## Open Questions

None.

## Notes

- **References:** `context/screenshots/game/15-results-a` (the you vs opponent columns, kept for the duel result), the B3 `RunSummary` and its spec.
- **Contrast:** the warning tone's text uses `on-accent` on `warning` (tested); the outcome on the `you` fill uses `on-accent` (tested).
- **Check:** `/play/duel?state=` for win, loss, draw, forfeit win, connection lost, opponent reconnecting (chip), you reconnecting (overlay), and each join refusal; focus on the result title; reduced motion; 320px and `lg`.
- **Dev server:** the dev cache is off (`next.config.ts`), so `npm run build` can run while the user's dev server is up.
- **With E2 done, stage E is complete.** The next collection is stage F (`/profile`, guide § 8).

- **Deviations recorded during implementation:**
  - **A `notice` hint on the gate view:** `CanvasGateView` gains `notice?: 'connection' | 'refused'`, set by `reconnectingGate` (both branches) and by the join-refusal branch of `roomFailedGate`. It only says how to draw the gate; no behaviour reads it. `system-states.test.ts` and `duel-session.test.ts` now assert it (the no-deadline reconnect gate's `toEqual` includes it).
  - **`CanvasGate` gains an `icon` slot** above the title (decorative), used for the `WifiOff` tile on the reconnecting overlay.
  - **Reconnecting countdown:** the sentence stays as the gate's detail (it names the seconds for screen readers), and a big `TYPE_NUMBER` "17s" (`aria-hidden`) sits under it in the gate's body, ticking from the same server deadline.
  - **Join refused:** the detail moves out of the gate's `<p>` (a `div` can't sit in a `p`) into the body as the Alert. The Alert has **no `role="alert"`**: the registry's live role would announce the message on top of the gate's announced title, which today is the only announcement.
  - **`ui/alert.tsx`:** only `Alert` and `AlertDescription` (no `AlertTitle`, unused); tones `warning` (default) and `neutral`.
  - **Badge `warning` tone** added (`bg-warning`, `on-accent` text, tested). The reconnect chip keeps the sticker look in **normal case**, since the sticker's uppercase would turn "18s" into "18S".
  - **Outcome box:** reuses the solo `OUTCOME_BOX` / `OUTCOME_TITLE` (now exported from `RunSummary`), but grows (`min-h-24`, `py-3`) because the duel result has no skeleton to match and "Opponent left" wraps beside the Forfeit sticker. A loss gets a red top band; a draw keeps the split you / opponent band.
  - **Actions** sit in their own ruled rail section at the bottom (`lg:mt-auto`), as in the solo summary.
  - **Tests:** the create-refusal tests (Pro required and plain) now assert there is no `notice`, so only a refused join draws the Alert.
  - **Review fixes:** the two gate countdowns share one `useSecondsLeft` hook (they had copied the tick), and `noticeParts` builds the gate's icon, detail and body before the JSX instead of a nested ternary.
