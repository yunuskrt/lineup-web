# Phase W21a — Summary Panel

## Status

Completed

## Goals

- Create `src/lib/summary.ts`, pure and tested in `src/lib/summary.test.ts`. These are presentation mappings over `SoloSummary` and decide nothing:
  - `summaryTitle(endReason)`: "Perfect clear", "Run over" or "Run ended". The last one is for `quit`.
  - `scoreline(identity)`: "Real Solvara 3–3 Northgate United", with an en dash.
  - `matchContext(identity)`: a plain sentence built from competition, stage and date, for example "Continental Cup final, 25 May 2005". A null stage is left out. The date is formatted with a fixed `en-GB` locale and `UTC`, so the server and client render the same text.
  - `accuracyLabel(ratio)`: `0.667` gives "67%".
  - `roundSecondsLabel(ms)`: `4230` gives "4.2s".
  - `roundTimeBars(roundTimesMs)`: each round's share of the 15s round, clamped to 0–1, for the round strip.
- Extend `SoloCanvasView` in `src/types/canvas.ts` with `end: SoloEndView | null`, where `SoloEndView` is `{ status: 'loading' } | { status: 'ready'; summary: SoloSummary }`. The duel view is unchanged.
- Create `src/components/game/RunSummary.tsx`, the panel that takes the rail's place when `end` is set:
  - **Outcome:** an `h2` from `summaryTitle`, lives remaining, and "You named N of 11."
  - **Stats:** a `dl` with accuracy, best streak and missed count.
  - **Round strip:** one bar per round from `roundTimeBars`. Each bar has an sr-only line with its time, plus a visible average and fastest round.
  - **Missed:** if `summary.missed` is a list (Pro), the names are listed by position. If it's `null` (free), only the count shows. The client reads the field and never the tier.
  - **Actions:** one primary "Play again" and one text link, "Change filters". They're wired in W21b; here they're callbacks.
  - **`loading`:** a skeleton of the same panel at the same size, with no spinner.
- **Perfect clear gets the `turf` takeover** (`theme.md` § Solo): the outcome band is `bg-found` with `text-on-accent` (never `bone` on turf), lives remaining are shown large, and the canvas card's border turns `found`. Add a component token only if a role utility can't express it.
- Update `MatchHeader` with an `identity` prop. When it's set, the header shows `scoreline` as the title and `matchContext` (plus the nickname, if any) as the subtitle, in the **same box** as the masked header. The found count stays.
- Update `SquadGrid` and `SquadSlot` with an optional `missed: RevealedPlayer[]`. Missed players render in their slots as muted names (`text-fg-muted` on an outlined slot), with no reveal flash or spring. That makes named vs missed readable on the pitch. With no list (free), the slots stay empty outlines.
- Update `GameCanvas` for a solo view with `end` set:
  - The rail renders `RunSummary` in place of the clock row, toast and input. The rail keeps its box on `lg`, and stays below the canvas on narrower screens.
  - The header gets `identity`, and the grid gets `missed`.
  - `GameCanvas` takes `onPlayAgain` and `onChangeFilters` for the panel.
- Add summary snapshots to `src/lib/dev/canvas-states.ts` for `/play/solo?state=`:
  - `summary-loading`.
  - `run-over` (free, 4 found).
  - `run-over-pro` (4 found, missed list).
  - `perfect-clear` (11 found, 2 lives).
  - `quit` (free, 6 found).
- Extend `canvas-states.test.ts` so every summary snapshot keeps `found.length + missedCount === 11`, and so `missed`, when present, has no slot that's also found. List the new states on `/dev/canvas` with their descriptions.

## States

| `?state=`         | Rail                                                                               | Pitch                           | Header                  |
| ----------------- | ---------------------------------------------------------------------------------- | ------------------------------- | ----------------------- |
| `summary-loading` | Summary skeleton, same box as the ready panel                                      | Found players, others outlined  | Masked                  |
| `run-over`        | "Run over", 0 lives, stats, round strip, "7 missed". Play again, Change filters    | 4 named, 7 outlined             | Scoreline and context   |
| `run-over-pro`    | As `run-over`, plus the missed names                                               | 4 named, 7 muted missed names   | Scoreline and context   |
| `perfect-clear`   | `turf` band "Perfect clear", 2 lives shown large, stats, round strip. No missed row | 11 named, `found` card border   | Scoreline and nickname  |
| `quit`            | "Run ended", stats, "5 missed"                                                     | 6 named, 5 outlined             | Scoreline and context   |

## Open Questions

Defaults stand unless changed at `/feature start`.

- **Where the summary lives:** by default it replaces the rail and the pitch stays, so named vs missed reads on the pitch itself and nothing moves. The alternative is a full-width result card in place of the canvas. That's more of a moment, but it drops the pitch and breaks the identical-space rule.
- **Round times:** by default a bar strip with a visible average and fastest. The alternative is a plain list, one row per round. That's more precise, but it runs to 14 rows.
- **Missed for Pro:** by default the muted names go on the pitch only, in formation. The alternative is also listing them in the rail. That duplicates, but it scans faster on phones, where the pitch is small.

## Out of Scope

- **Fetching the summary, quit → summary, Play again, focus on arrival and removing the W20 end gate** → W21b.
- **Duel result cards** (win, loss, draw, forfeit) → W23.
- **Profile stats** → W24.
- **Motion on the summary's arrival:** a single opacity fade at most. The W26 motion pass decides more.

## Notes

- Scope: the presentational summary for solo, driven by `SoloCanvasView.end`, and checked through `?state=` snapshots. Nothing calls the API.
- Depends on:
  - W16 for `GameCanvas`, `MatchHeader`, `SquadGrid` and the snapshot harness.
  - W20 for the solo view the snapshots extend.
- References:
  - `context/theme.md` § Solo (perfect clear and run over) and § Loading.
  - `context/project-overview.md` § E) Singleplayer: the summary shows the match revealed in full, named vs missed, time per round, accuracy and streak.
  - The Free vs Pro table: post-game review is "Missed count only" for free, and "Full XI + every player missed" for Pro.
- Constraints:
  - **The tier is never checked on the client.** `missed` arriving as a list or as `null` is the server's decision, and the panel only reads it (`project-overview.md` § Hard Constraint 16).
  - **The squad still isn't sent early.** Missed players appear only once the summary arrives, and only if the server sent them.
  - **Identical space:** the revealed header uses the same box as the masked header, the summary skeleton uses the same box as the ready panel, and the rail keeps its width on `lg`.
  - **One primary action:** Play again. Change filters is a text link.
  - **Copy:** no dot-joined meta strings, no all-caps eyebrow labels, and no invented praise. Say what happened.
  - Text on `found` (turf) is `on-accent`. Colours come from tokens only. Transform and opacity only.
  - `@/` imports, typed props, and comments of at most 50 characters.
- Verification:
  - `npm run lint`, `npm run format:check`, `npm test` and `npm run build` pass. The hex search still matches only `tokens.css`.
  - `summary.test.ts` covers:
    - Each end reason's title.
    - A scoreline with a two-digit score.
    - Context with and without a stage.
    - The date rendering the same under any `TZ`.
    - Accuracy rounding at 0, 1 and 2/3.
    - Round seconds to one decimal.
    - Bars clamped past 15s.
  - Go through each summary state on `/dev/canvas` at 1440×900, 834×1194 and 390×844:
    - No horizontal scroll.
    - The header and rail boxes match between `summary-loading` and `run-over`.
    - `perfect-clear` reads as a takeover.
    - `run-over-pro` shows the muted names in the right slots.
  - The existing `/play/solo?state=…` and duel snapshots are unchanged.

**Deviations recorded during implementation**

- Missed for Pro: the open-question default won over the RunSummary goal. Names go on the pitch only, and the rail shows the count for both tiers.
- Helpers added to `summary.ts`:
  - `matchDateLabel`, `matchSubtitle` (nickname first, then a colon) and `roundTimeStats` (average and fastest).
  - `scoreline` takes an optional `nameKey`, so phones get short names.
  - The types live in `src/types/summary.ts`.
- `matchContext` lowercases the stage's first letter: "final", "matchday 34".
- Round strip:
  - Bars use `scaleY`.
  - The fastest bar is `bg-fg`, the rest `bg-fg-muted`.
  - With no rounds it reads "No rounds played".
- Perfect clear shows lives as a large numeral with "lives left", since floodlight pips would sit on turf. Other outcomes keep the `Lives` pips.
- `GameCanvas`:
  - The live rail moved into `ActiveRail`.
  - The border colour left `PANEL`, so `border-found` applies.
  - The canvas grid got `grid-cols-1`: the unwrapping subtitle pushed it to 412px at 390.
- `MatchHeader`: the revealed title is `text-16` on phones, with the same leading, so the scoreline fits in the box.
- `onPlayAgain` and `onChangeFilters` are optional no-ops until W21b wires them.
- The summary skeleton pulses opacity (theme § Loading) and holds still under reduced motion.
- The quit chip still shows at the end of a run. Left for W21b.
- Review fix: `STRIP_BOX` lost `items-end`, which beat `items-center` and sank "No rounds played". The section is now labelled by its `h2`.
- Sample data: `SAMPLE_IDENTITY` was added to `samples.ts`.
- Tests: 19 in `summary.test.ts` and 8 new in `canvas-states.test.ts`, for 385 in total.
- Verified at 1440, 834 and 390:
  - No horizontal scroll.
  - The rail and header boxes are equal between `summary-loading` and ready.
  - The duel snapshots are unchanged.

## History
