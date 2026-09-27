# Phase W22a — Lobby Panels

## Status

Completed

## Goals

- Add `src/types/duel-lobby.ts`, the presentational lobby view. It renders what the lobby looks like and decides nothing:
  - `DuelLobbyView` is a union on `step`:
    - `searching`
    - `paired`, with `opponent: DuelPlayer`
    - `filters`, with `yours: FilterSummary` and `submission: FilterSubmission`
    - `coinFlip`, with `winner: DuelActor`, `applied: FilterSummary` and `opponent: DuelPlayer`
    - `noOpponent`
  - `FilterSummary` is a list of `{ label, value }` lines, for example `{ label: 'Competition', value: 'Any' }`, so the panels never see ids.
- Extend `DuelCanvasView` in `src/types/canvas.ts`:
  - Add `lobby: DuelLobbyView | null`, set while the duel is still being arranged.
  - Make `opponent` a `DuelPlayer | null`. There is no opponent until pairing, and a placeholder handle would be a lie.
- Create `src/lib/lobby.ts`, pure and tested in `src/lib/lobby.test.ts`:
  - `filterSummary(filters, options)` turns `Filters` into `FilterSummary` lines using the catalog names:
    - An empty group reads "Any".
    - One or two picks are named. Three or more read as the first name plus a count, for example "Premier League + 2 more".
    - The era reads as a range with `seasonLabel`, for example "2004–05 to 2010–11". The full catalog range reads "Any season". A single season reads as that one season.
  - `coinFlipTitle(winner, opponent)` gives "Your filters won" or "`<handle>`'s filters won". It always names the winner (HC 19).
- Update `src/components/game/TurnIndicator.tsx` for an unknown opponent:
  - With `opponent: null`, the opponent panel keeps its box. It shows a skeleton bar at the handle's height and empty pips at the lives' height, so nothing shifts when the handle arrives.
  - No turn chip and no live-region announcement are shown until there is a turn.
- Update `src/components/game/CanvasGate.tsx`, which gets an optional wide panel:
  - The panel takes a `body?: ReactNode` rendered under the detail, and a `size?: 'narrow' | 'wide'`. The default is `narrow`, which leaves every existing gate untouched.
  - The wide panel holds the two filter cards side by side on `sm+` and stacked on phones, inside the canvas bounds with no page scroll at 390px.
  - Focus behaviour is unchanged: the first focusable control in the panel takes focus on open.
- Create `src/components/duel/LobbyPanel.tsx`, which renders one `DuelLobbyView` as the gate's content:
  - **Searching:** the title is "Finding an opponent", the detail is "You'll be matched with the next player who's searching." It shows an ambient opacity pulse and **no countdown ring and no elapsed timer**, because the ring means you're losing time (`theme.md` § Lobby). The action is "Cancel".
  - **Paired:** the title is "Opponent found". It shows both handles, yours in `you` and theirs in `opponent`, each with its label.
  - **Filters:** there are two cards, `FilterCard` for you and for them.
    - Yours lists your `FilterSummary` with one primary "Lock in filters". Once submitted, the card locks and shows a `you`-coloured check with "Locked in".
    - Theirs shows "Choosing…" until their status is `submitted`, then "Locked in". Their filter values are never shown before the flip; the contract doesn't carry them.
  - **Coin flip:** the title is `coinFlipTitle`. The winning side's colour marks the card, and it lists the `applied` summary. Both colours stay visible, and the result is never shown by colour alone.
  - **No opponent:** the title is "No opponent found", the detail is "Nobody else is searching right now." The one primary action is "Play solo with these filters", with "Search again" as a text link. Never a dead end.
- Add lobby snapshots to `DUEL_CANVAS_STATES` in `src/lib/dev/canvas-states.ts`, reachable at `/play/duel?state=…` and on `/dev/canvas`:
  - `searching`, `paired`, `filters`, `filters-locked` (yours submitted, theirs pending), `filters-both` (both submitted), `coin-flip-won`, `coin-flip-lost` and `no-opponent`.
  - Each one sits over the duel loading canvas: header and grid skeletons, stopped clocks, input locked.
  - `canvas-states.test.ts` checks that:
    - Each lobby snapshot has a `lobby` view and a gate.
    - Only `searching` and `no-opponent` have a null opponent.
    - The coin flip snapshots name both winners.
    - The live-play duel snapshots have `lobby: null`.

## States

The lobby rows from `context/theme.md` § Lobby & matchmaking that this spec draws. W22b wires them.

| State                   | View step                                    | Treatment                                                                                        |
| ----------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Searching               | `searching`                                  | Gate over the loading canvas, ambient pulse, no ring, "Cancel". Opponent panel is a skeleton     |
| Opponent found          | `paired`                                     | Both handles shown in their colours. The opponent panel fills in                                 |
| Filters — you submitted | `filters`, `yours: 'submitted'`              | Your card locks with a `you` check. Theirs shows "Choosing…" until they submit                  |
| Filters — coin flip     | `coinFlip`                                   | Names whose filters won, explicitly, and shows the applied set                                   |
| No opponent             | `noOpponent`                                 | "Play solo with these filters" as the one primary action, "Search again" as a link              |
| Match retrieved         | none (`lobby: null`)                         | The existing masked header and empty grid. W22b adds its temporary gate                         |
| Cancelled               | none                                         | Navigation back to `/play`, wired in W22b                                                        |

## Out of Scope

- The reducer, the hook, the `DuelClient` subscription and the `/play/duel` wiring → W22b.
- The duel loop: rounds, guesses, reveals, lives and results → W23.
- Protocol refused, rate limited and connection lost screens → W25.
- Editing filters inside the lobby. See W22b's Open Questions.

## Notes

- Scope: every lobby state as a static, presentational view with a `?state=` snapshot, like W21a did for the summary. Nothing here talks to the duel client.
- Depends on: W16 (`GameCanvas`, `DuelCanvasView`, snapshots), W11 (`TurnIndicator`), W15 (`CanvasGate`), W19 (`seasonLabel`, the catalog in `FilterOptions`), W05b (`DuelPlayer`, `FilterSubmission`, `DuelActor`).
- References:
  - `context/theme.md` § Lobby & matchmaking, the source of the States table.
  - `context/design.md` § Gate the canvas, which names matchmaking as a gated state: the canvas stays visible and inert, the overlay carries the reason and the action.
- Constraints:
  - **Amber is you, blue is the opponent, never red and green.** Pair every colour with a label or position (`theme.md` § Three rules).
  - **The lobby never shows a countdown ring.** The ring means "you are losing time".
  - **Filter conflicts are a coin flip, and the winner is always named** (HC 19). No merged or intersected set is ever shown.
  - **One primary action per view** (`design.md`). The filter step's only primary is "Lock in filters". No opponent's is "Play solo with these filters".
  - **Identical space.** The opponent skeleton and the filled panel share a box, and every lobby snapshot sits over the same loading canvas.
  - Motion through Motion only, with transform and opacity only. The searching pulse respects `useReducedMotion` and holds still when it's set.
  - Colours from tokens only, with no hex. `@/` imports and comments of at most 50 characters.
- Verification:
  - `npm run lint`, `npm run format:check`, `npm test` and `npm run build` pass.
  - Searching `src/` for `#[0-9a-fA-F]{3,6}` still matches only `tokens.css`.
  - `lobby.test.ts` covers "Any" groups, one, two and three-plus picks, the full, partial and single-season era, and both coin-flip titles.
  - In the browser, open every new `/play/duel?state=…` snapshot at 1440×900, 834×1194 and 390×844:
    - Nothing scrolls horizontally, and the wide gate stays inside the canvas.
    - Moving from `searching` to `paired` doesn't shift the turn indicator.
    - Focus lands on the gate's first control, and Tab order runs yours before theirs.
  - The existing duel and solo snapshots and `/dev/canvas` are unchanged.
- **Deviations recorded during implementation**
  - **`DuelCanvasView.turn` is nullable too**, not only `opponent`: there's no turn before the first round, so no chip shows. `ringSetups` takes a null turn and stops both rings; one test was added in `canvas.test.ts`.
  - **Added `lobbyGate(lobby)`** in `src/lib/lobby.ts`, which gives each step's gate title and detail. The view carries the gate as usual. `GameCanvas` renders `LobbyPanel` as the gate's `body`, takes its size from `LOBBY_GATE_SIZE` and takes a new `onLobbyAction` (a `LobbyAction`: `cancel`, `lock`, `solo`, `searchAgain`). Lobby gates never carry `actionLabel` or `choices`; the panel owns its buttons.
  - **Paired uses the wide panel.** At 390 the narrow panel cut the opponent's handle off. Wide also keeps the width steady going into the filter step.
  - **Copy the spec left open:**
    - Paired detail: "Filters are next."
    - Filters: "Lock in your filters", detail "A coin flip picks one set, and the match uses it whole."
    - Coin flip detail: "The match comes from these filters."
    - Their card before the flip: "Hidden until the coin flip."
    - The era row is labelled "Era", matching `/play`. Two picks join with a comma.
  - **Summary values wrap** rather than truncate. "2003–04 to 2008–09" was cut off in a half-width card.
  - **Player marks:**
    - The lobby reuses `/play`'s short player bars. Searching shows your amber bar next to a dim, pulsing bar for the opponent who isn't there yet; paired shows the blue one.
    - "Cancel" is a secondary button, since leaving isn't the view's primary action.
    - The coin-flip card springs in with the reveal spring (scale dropped under reduced motion). The winner's bar is long, and the loser's stays visible at 40%.
  - **The stopped rings stay under the gate.** The loading canvas behind the lobby still shows both clocks, stopped and dimmed by the scrim, as the solo side pick does. "No ring in the lobby" was read as the lobby's own content; `design.md` § Gate the canvas keeps the canvas as it is.
  - **Samples:** `SAMPLE_FILTER_OPTIONS`, `SAMPLE_FILTERS` and `SAMPLE_OPEN_FILTERS` in `samples.ts`. `LOBBY_STATES` is exported for the tests.
  - **Tests:** `lobby.test.ts` (13), 7 lobby cases in `canvas-states.test.ts` and 1 in `canvas.test.ts`, for 416 in total.
  - **Browser checks:**
    - All 8 snapshots at 1440, 834 and 390: no horizontal scroll, and the gate stays inside the canvas.
    - The opponent panel keeps its height (112px, or 140px at 390) from searching to paired.
    - Focus lands on the first control, or on the panel when there is none.
    - Under reduced motion the pulse holds at opacity 1.
    - Existing snapshots are unchanged: the solo pre-match gate is still 256px wide, and `/dev/canvas` lists 20 duel states.
  - **Review fixes:**
    - The lock-in announcements now come from one screen-reader status region that stays mounted: "Your filters are locked in." and "`<handle>` locked in." The "Lock in filters" button is no longer inside a status region, and neither are the visible "Locked in" / "Choosing…" lines. A status region added only when "Locked in" appears is often not announced.
    - The "Lock in filters" button is pinned to `h-8`, the "Locked in" row's height. Locking in shifted the card by 1px.
    - `DUEL_ACTOR_TEXT` and `DUEL_ACTOR_BORDER` joined `DUEL_ACTOR_BG` in `classes.ts`. `TurnIndicator` and `LobbyPanel` both read them, and `SIDES` lost its `border` and `text` fields.
    - `REVEAL_SPRING` now lives in `motion.ts`. `RevealCard` and the coin-flip card share it.
    - Braces added to the no-turn `if` in `ringSetups`.
  - **Tests (`/feature test`):** 4 more, for 420 in total:
    - `REVEAL_SPRING` springs over the 320ms reveal.
    - Each `DUEL_ACTOR_*` map gives each actor its own token, guarding against an amber/blue swap.
    - The flip-lost snapshot applies the opponent's set whole, with every row different from yours and nothing merged.
    - Components stay browser-verified, per the standards.

## History
