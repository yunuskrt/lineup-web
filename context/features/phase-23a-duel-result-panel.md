# Phase W23a — Duel Result Panel

## Status

Completed

## Goals

- Extend `DuelCanvasView` in `src/types/canvas.ts`:
  - `end: DuelResult | null`, set once the server sends `finished`. A duel result arrives whole in one event, so unlike solo there is no loading state.
  - `opponentConnection: ConnectionState | null`, set while the server reports the opponent `reconnecting`.
- Create `src/lib/duel-result.ts`, pure and tested in `src/lib/duel-result.test.ts`:
  - `duelResultTitle(result)`: "You won", "You lost", "Draw", and "Opponent left" for `forfeit_win`. A loss with `isForfeit` (you forfeited) reads "You left".
  - `duelResultDetail(result)`: one plain sentence on why it ended:
    - win: "`<handle>` ran out of lives."
    - loss: "You ran out of lives."
    - draw: "All eleven named. Neither side lost."
    - forfeit win: "`<handle>` left the duel."
    - your forfeit: "You left the duel."
  - `foundTally(found)` gives `{ you, opponent }` counts from `foundBy`.
  - `reconnectSecondsLeft(deadline, now)` gives whole seconds left from the server's `reconnectDeadline`, floored at 0. It's presentation only; the server decides the forfeit.
- Create `src/components/game/DuelResultPanel.tsx`, which replaces the rail when `end` is set, like W21a's `RunSummary`:
  - **Outcome card** per `theme.md` § Duel — terminal:
    - **Win:** the `you` (floodlight) card, with `text-on-accent`.
    - **Loss:** a `surface-card` card with a `danger` accent. The answers are never hidden from the loser.
    - **Draw:** both player colours present, neither dominant. It's rare and should feel it.
    - **Forfeit win:** the win card, marked "Forfeit". A forfeit doesn't count toward streaks, and the mark is what says so.
    - Your forfeit: the loss card, marked "Forfeit".
  - **Tally:** who named how many, with both colours and the handles, for example "You named 5" and "deadball_dan named 4". Each player's lives left use the existing `Lives` pips with their owner colour.
  - **Actions:** "Play again" is the one primary action (`design.md` § One primary action per view), with "Change filters" as a text link.
  - The title takes focus when the result appears, never "Play again", so a held Enter from the last guess can't start a new duel. This is the W21b lesson.
- Update `GameCanvas`:
  - With `end` set, the header reveals the match identity in full through W21a's `MatchHeader` `identity` prop, and the grid shows `end.found` with each slot's finder tint.
  - The quit chip is hidden while the result shows; its own links take over, as in solo.
- Update `TurnIndicator` for a reconnecting opponent:
  - The opponent badge turns `warning` (ember), reading "Reconnecting, `<n>`s", with "Their clock keeps running" underneath. Without that line, the pause reads as a freeze (`theme.md` § Their turn).
  - The countdown ticks from the server deadline, and the panel keeps its box.
- Add snapshots to `DUEL_CANVAS_STATES`, reachable at `/play/duel?state=…` and on `/dev/canvas`:
  - `result-win`, `result-loss`, `result-draw` (all 11 found, split between both players), `result-forfeit-win`, `result-forfeit-loss` and `opponent-reconnecting`.
  - `canvas-states.test.ts` checks that:
    - Every result snapshot parses against `duelResultSchema`.
    - The draw snapshot has 11 found.
    - The canvas `found` matches the result.
    - Only the forfeit snapshots carry `isForfeit`.
    - Live duel states have `end: null`.

## States

The `theme.md` rows this spec draws. W23b wires them.

| State                 | Treatment                                                                                           |
| --------------------- | --------------------------------------------------------------------------------------------------- |
| Win                   | `you` result card, match identity revealed in full                                                  |
| Loss                  | `surface-card` card with a `danger` accent, the same full reveal                                    |
| Draw                  | Both colours present, neither dominant. The full XI is already on the grid; the card names the match |
| Forfeit win           | Win card, marked as a forfeit                                                                       |
| Opponent disconnected | Opponent badge in `warning`, "Reconnecting, 18s", and "Their clock keeps running"                   |

## Out of Scope

- The loop itself: rounds, guesses, turns, lives, the forfeit dialog and wiring `finished` → W23b.
- Your own reconnect overlay and "Connection lost" → W25 (§ System).
- **A missed-player list.** `DuelResult` carries only the players that were found; the reveal is the match identity. Post-game review of every missed player is a solo Pro feature, and nothing purchasable touches a duel (HC 15).
- Duel stats and streaks → W24 (profile).

## Notes

- Scope: every duel terminal state and the opponent-reconnecting badge, as static views with `?state=` snapshots. Nothing here talks to the duel client. This mirrors W21a.
- Depends on: W21a (`MatchHeader` identity, `scoreline`/`matchSubtitle`, the rail swap pattern), W11 (`TurnIndicator`, `Lives`), W22a (`DUEL_ACTOR_*` classes), W05b (`DuelResult`, `ConnectionState`).
- References: `context/theme.md` § Duel — terminal and § Duel — their turn.
- Constraints:
  - **All 11 named is a draw, with no tiebreak** (HC 18). Lives remaining never decide it or appear as a margin.
  - **Amber is you, blue is the opponent**, always paired with a label or handle, never colour alone.
  - **The server decides the forfeit.** The reconnect countdown is rendered from the server's deadline and decides nothing.
  - **Identical space.** The result panel keeps the rail's box, and the reconnecting badge keeps the opponent panel's.
  - Motion through Motion only, transform and opacity only, respecting `useReducedMotion`. Colours from tokens, `@/` imports, comments of at most 50 characters.
- Verification:
  - `npm run lint`, `npm run format:check`, `npm test` and `npm run build` pass. The hex search still matches only `tokens.css`.
  - `duel-result.test.ts` covers every title and detail, the tally, and the countdown floor.
  - In the browser, open each new snapshot at 1440×900, 834×1194 and 390×844:
    - There's no horizontal scroll.
    - The rail doesn't change size between live and result.
    - Focus lands on the result title.
    - The loss card reads as a loss without relying on red alone.
- **Deviations recorded during implementation**
  - **"Their clock keeps running" lives in the rail, not under the badge.** The opponent panel has no spare line, and adding one would grow every duel's header. The badge takes the turn-chip slot, "Reconnecting, `<n>`s" in `warning`, and the panel border turns `warning`. On their turn, the rail's "Waiting for `<handle>`" cell reads "`<handle>` is reconnecting. Their clock keeps running." It shares that grid cell with the input, so nothing shifts, and it's visible on phones too. The turn indicator's live region announces the reconnect.
  - **The rail keeps its box on `lg+` only.** On stacked layouts (834 and 390) the result panel is taller than the live rail, as W21a's solo summary is. It's a terminal swap, not something the player is mid-read on.
  - **`GameCanvas` reads the result's own `found`** (`end.found`) for the header count and the grid, and the result's `match` for the identity. W23b's view doesn't have to copy them across.
  - **Outcome card:**
    - It reuses the solo summary's fixed `h-24` box.
    - Win and forfeit win use `bg-you`. Loss uses a `border-danger` card whose title says "You lost", so red isn't the only signal. Draw has a split amber and blue bar across the top.
    - Forfeits carry a bordered "Forfeit" tag on the right.
  - **Tally:** two columns, each with the player bar, "You named" or "`<handle>` named", a numeral and that player's pips.
  - **The reconnect countdown ticks every 250ms** from the server deadline. The number is marked `suppressHydrationWarning`, because the server render and the client render read clocks a moment apart.
  - **Snapshots:**
    - `RESULT_STATES` is exported for the tests.
    - The win and loss snapshots put the side that ran out on 0 lives.
    - The draw splits all 11 (6 and 5).
    - `opponent-reconnecting` is a live their-turn state with an 18s deadline.
  - **Tests:** `duel-result.test.ts` (13) and 7 result cases in `canvas-states.test.ts`, for 477 in total.
  - **Browser checks:**
    - All 6 snapshots at 1440, 834 and 390: no horizontal scroll.
    - The player panels keep their height (112px, or 140px at 390).
    - Focus lands on the result title, and the quit chip is hidden on results.
    - The header shows the full scoreline and the grid shows each finder's tint. The console is clean.
  - **Review fixes:**
    - **Bug:** the reconnect announcement said "Their clock keeps running" on your turn too, and replaced "Your turn". `announcement(turn, isReconnecting)` now names the turn first, and adds the clock line only on their turn. For example: "Your turn. Your opponent is reconnecting." or "Their turn. Your opponent is reconnecting. Their clock keeps running." A plain turn now reads "Your turn." with a full stop.
    - **Markup:** the tally's player bar moved inside the `<dt>`, because a `dl` group may only hold `dt`/`dd`. It looks the same.
    - **Shared actions:** "Play again" and "Change filters" are now one `ResultActions` component, used by `RunSummary` and `DuelResultPanel`.
    - **Naming:** in `GameCanvas`, `end` is now `soloEnd`, next to the duel's `result`.
    - Browser-checked afterwards: the draw tally groups read `DT,DD,DD`, the reconnect live text is as above, and the solo run-over still shows both actions with focus on its title.
  - **Tests (`/feature test`):** the live-duel wording the review fixed moved out of the components into a new `src/lib/duel-status.ts`, so it can be unit-tested:
    - `TURN_LABELS`, `turnAnnouncement(turn, isReconnecting)` and `waitingLine(handle, isReconnecting)`.
    - `reconnectSecondsLeft` moved there from `duel-result.ts`; it's live-duel status, not result copy.
    - `TurnIndicator` and `GameCanvas` now read from it, and `SIDES` lost its `turnLabel`.
    - `duel-status.test.ts` has 7 tests: the countdown's round-up and floor, every announcement combination (the clock line only on their turn), and both waiting lines. That makes 482 in total.
    - Browser-checked afterwards: the live region, the badge, the rail line and the plain "Waiting for deadball_dan" all read as before.
    - Components stay browser-verified, per the standards.

## History
