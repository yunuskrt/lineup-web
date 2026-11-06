# Fix — Gameplay Visuals C: Named Order

## Status

Completed

## Goals

- **Solo summary: the middle becomes the named order.** `RunSummary` drops the Accuracy / Best streak / Missed row and the "Time per round" chart. Between the outcome box and the actions it shows **the players you named, in the order you named them, with the seconds each took.**
- **Duel result: the tally stays, and the list joins it.** `DuelResultPanel` keeps the outcome box and the tally (You named N / opponent named N, with lives), then shows the same list for both players. **Each row carries its finder's colour:** `you` (amber) for yours, `opponent` (blue) for theirs.
- **One shared component:** `NamedOrder` in `src/components/game/`, used by both panels.
  - **Heading:** "Named in order" (14px medium, sentence case), linked to the list with `aria-labelledby`.
  - **An `<ol>` of rows, one card each:** `surface-card` with a 1px `line` border, `rounded-sm`, 32px tall, 4px apart. Each row holds:
    - **The order number,** 12px tabular `fg-muted`, in a fixed 20px column. The content really is a sequence, so the number earns its place.
    - **The player's name,** 14px medium `fg`, truncating.
    - **The duel only, the finder:** "You" or the opponent's handle, 12px semibold, in `DUEL_ACTOR_TEXT`. The row's left border is 2px in `DUEL_ACTOR_BORDER`. **The label and the colour always go together, never colour alone** (`theme.md`, amber vs blue).
    - **The seconds,** 14px tabular `fg-muted`, right-aligned, from `roundSecondsLabel` ("4.2s").
  - **Solo, the fastest row:** its seconds are in `fg`, semibold, with sr-only text "fastest". That keeps the one highlight the old chart had. A duel marks no fastest: the two players' times aren't a contest.
  - **Empty:**
    - solo: "You didn't name anyone this time."
    - duel: "Nobody named a player."
    - Either one is 14px `fg-muted`, in place of the list.
- **Order comes from the server.** A pure helper `namedOrder(found)` in `src/lib/summary.ts` returns the rows sorted by `order`, plus the fastest index (solo), with unit tests:
  - unsorted input
  - a tie for fastest (the first one wins)
  - an empty list
  - a full 11
  - It's presentation only: it neither decides nor counts anything.
- **Fitting the rail.**
  - **From `lg`:** the actions stay pinned at the rail's foot, as today (`lg:mt-auto`). If eleven rows plus the duel tally don't fit the rail's height, the list scrolls inside its own box (`min-h-0 overflow-y-auto`), and the outcome and actions never scroll away.
  - **Phones:** the rail sits below the canvas, so the list just runs on.
- **Skeleton.**
  - The solo `SummarySkeleton` drops its stat and chart blocks, and draws the outcome box, a heading bar and three 32px row bars.
  - The row count isn't known until the summary arrives, so the list can grow on load. From `lg` the actions are pinned and nothing visible moves. On phones the list grows below the outcome box, under the fold.
- **Contract (needs backend R4 Part 2).**
  - `SoloSummary.found` items become `namedPlayerSchema` = `revealedPlayerSchema` + `order` (integer 1–11) + `elapsedMs` (integer 0–15000).
  - `DuelResult.found` items become `duelNamedPlayerSchema` = `duelFoundPlayerSchema` + the same two fields. The names follow the backend's `NamedPlayer` and `DuelNamedPlayer`.
  - **Unchanged:** `RevealedPlayer` and the live `found` payloads (`SoloSession`, `DuelSession`, `correct_new`).
  - **Kept in the schema:** `accuracy`, `bestStreak` and `roundTimesMs`. The backend still sends them and the mock still computes them, but nothing renders them.
  - **Types:** from `z.infer`.
  - **Schema tests:**
    - `order` 0 and 12 are rejected
    - a negative or fractional `elapsedMs` is rejected
    - 15000 is accepted
    - a summary without `order` is rejected
- **Mock.**
  - The solo engine records each correct new answer's order and its elapsed time from the round's start, on the mock clock, capped at 15000.
  - The duel mock does the same for both players, including the scripted opponent.
  - **Mock tests:**
    - the orders run 1…n
    - `elapsedMs` matches the mock clock
    - a lost life between two names doesn't shift the orders
- **A duel whose ending the server couldn't send (added after R4b).**
  - **The case:** since R4b, if the backend can't build a step's events, both players get an `error` event (`server_error`) in their place. When that step ends the duel, it replaces `finished`, and nothing else follows.
  - **Today:** `duelSessionReducer` turns a mid-match `error` into a toast (`rejectGuess`), and the duel stays on screen with nothing more to come.
  - **Fix:** a mid-match `server_error` event keeps its toast and also re-syncs through the existing resume path (W31b). If the server still has the duel, play goes on. If not, the existing ended-away path reads the result from history.
  - The client never decides that the duel ended; the server's answer to the resume does.
  - **Tests** (reducer, pure): a `server_error` mid-match asks to re-sync; other error codes don't; an `error` after `finished` changes nothing.
- **Dead code.**
  - `roundTimeBars` and `roundTimeStats` go, with their tests. Their only user was the chart.
  - `accuracyLabel` and `roundSecondsLabel` stay: the profile uses the first, and the list uses the second.
- **Dev:**
  - The `/dev/canvas` summary and duel-result snapshots gain orders and times.
  - New states:
    - a solo run quit before any name (the empty line)
    - a duel draw with the 11 names alternating between the two players
- **Docs:** `context/docs/contract.md`: `SoloSummary.found` and `DuelResult.found` gain `order` and `elapsedMs`. The summary row notes which fields the web no longer shows.

## Layout

Solo (rail):

```text
┌ Run over ────────────────────── ▪ ▪ ▪ ┐
│ You named 9 of 11.                    │
└───────────────────────────────────────┘
Named in order
┌ 1  Petr Čech                    2.1s ┐
┌ 2  Frank Lampard                1.7s ┐   ← fastest, in fg
┌ 3  Didier Drogba                6.4s ┐
  …
[ Play again ]
  Change filters
```

Duel (rail):

```text
┌ You win ──────────────────────────────┐
You named 6   ▪ ▪ ▫      rival named 5   ▪ ▫ ▫
Named in order
▌1  Petr Čech             You      3.0s     ▌ amber border, "You" in amber
▌2  Ricardo Carvalho      rival    5.2s     ▌ blue border, handle in blue
  …
[ Play again ]
```

## Out of Scope

- The profile's stats and history rows, which keep their own accuracy and streak.
- Pro's missed-player list, which stays on the pitch's missed slots, as today.
- Headshots in the rows: the pitch beside the rail already shows each named player's face.
- The side-pick card (Gameplay Visuals B) and the scoreboard (Gameplay Visuals A).

## Open Questions

Defaults stand unless changed at load:

- **"Named in order"** as the heading.
- **No fastest mark in a duel.**
- **Re-sync on a mid-match `server_error`** rather than ending the duel on the client. Check at load that the resume path answers correctly for a room the server has already closed.

## Notes

- **Deviations recorded during implementation:**
  - **The finder's colour is a 2px bar, not a border.** Each duel row carries an inner 2px bar in `DUEL_ACTOR_BG`. A `DUEL_ACTOR_BORDER` class sets all four sides and would fight the row's 1px `line` border. The look is the one specified.
  - **The rail fits by size containment.** `min-h-0` and `overflow-y-auto` alone didn't stop the rail's content from sizing the row, so the page grew instead of the list scrolling. From `lg` the result `<section>` is `contain-size` and the rows are `shrink-0`, so the pitch sets the height. At 1024×700 the page now fits the window and the list scrolls; at 1440×900 all 11 rows fit.
  - **The draw state was reworked, not added.** The existing `result-draw` now names its 11 in turn order (you, them, you…). A new `quit-empty` state shows the empty line.
  - **`namedOrder` returns `{ rows, fastestIndex }`,** generic over `NamedTiming` in `types/summary.ts`, which replaces `RoundTimeStats`.
  - **`NAMED_ELAPSED_MAX_MS` (15000) lives in the player schema.** Schemas don't import the UI's `ROUND_MS`.
  - **The re-sync is a duel-state flag.** A mid-duel `server_error` sets `isResyncing` (unless a rejoin is already under way); the hook then runs the existing `resume()`, and `resuming` clears it.
  - **Real-mode duel checked with an empty list only.** Two browsers paired and both parsed the result, but none of the guessed names matched the drawn XIs in three tries. Non-empty duel rows were checked on the mock duel and the dev states.
- **Source:** user request (2026-11-06), screenshot `context/screenshots/gameplay-result-bar.png`: "remove the informations at the middle (between play again button and result(lives) section)".
- **Decisions (user, 2026-11-06):**
  - **Solo:** the named order list.
  - **Duel:** the named order list too, the opponent's rows in a different colour. That holds only if it needs no new database writes; otherwise both go compact (nothing in the middle).
  - **Duel tally:** kept.
- **The no-new-writes condition holds.** The backend already persists every round's start and every guess's player and arrival time (`game_rounds.started_at`, `guesses.received_at`, `guesses.player_id`). The summary is built from the run's in-memory effects, which carry the same facts. R4 Part 2 only adds two fields to two payloads; nothing new is written (`context/docs/backend-requests.md` § R4).
- **Resume check (done at load, 2026-11-06):** the resume path ends a closed duel correctly. The backend's `rejoin` sends nothing for a room it has closed. After `RESUME_WAIT_MS` (2s) with no snapshot, the web's `applyResumeMissed` moves to `endedAway` and reads the result from history. The backend saves the duel (`persistence.record`) before building the step's events, so the result is in history even when those events failed.
- **R4b is merged** (2026-11-06, backend `57d45e8`), so this fix is unblocked. It also brought the `server_error` case above.
- **Depends on backend R4 Part 2.** Load this fix only once R4b is merged on the backend's `main`. The web parses `order` and `elapsedMs` as required, so a web build ahead of the backend would refuse every summary and duel result in real mode.
- **`DuelResult` is a socket payload,** but R4b only adds fields, so there's no `PROTOCOL_VERSION` change on either side.
- **Constraints:**
  - The finder's colour comes from `DUEL_ACTOR_*`, never from a hex.
  - Colour is never the only channel.
  - No client logic decides or counts anything: the order and time come from the server.
  - `@/` imports, no `any`, single-line comments of at most 50 characters.
- **Verification:**
  - `npm test`, `npm run lint`, `npm run build`.
  - **Mock, at 1440, 390 and 360:**
    - **Solo:** the list matches the order you named in, the fastest is marked, and the empty state shows on a quit before any name.
    - **Duel:** every row has the right colour and label, and the tally still shows.
    - At 1440, a full 11-row duel list scrolls inside the rail, and Play again stays visible.
  - **Screen reader:** the list is announced as a numbered list under its heading. Each duel row reads its finder, and the fastest row says so.
  - **Real mode (after R4b):** a solo run and a two-browser duel both show the list with server times.
