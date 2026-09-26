# Phase W16 — Game Canvas Shell

## Status

Completed

## Goals

- Create `src/types/canvas.ts` for the view model the shell renders. It holds data only, with no handlers:
  - The shared fields:
    - `match: MaskedMatch | null`, where `null` means loading.
    - `found: FoundPlayer[]`.
    - `clock: { round: RoundTiming | null; isFrozen: boolean }`.
    - `input: GuessInputStatus`.
    - `toast: ToastMessage | null`, `pulse?: GridPulse`, `shakeKey`, `lifeLostKey`.
    - `gate: { title; detail?; actionLabel? } | null`.
  - `SoloCanvasView` adds `mode: 'solo'` and `lives`.
  - `DuelCanvasView` adds `mode: 'duel'`, `you`, `opponent` (`DuelPlayer`) and `turn`.
  - `CanvasView` is the union of the two.
- Create `src/lib/canvas.ts` for pure presentation mappings, tested in `src/lib/canvas.test.ts`:
  - `duelRingModes(turn, isFrozen)` returns a `RingMode` for each side. The side whose turn it is gets `running`, or `frozen` if the round is frozen. The other side gets `waiting`.
  - `foundCountLabel(found)` returns `4/11` and its spoken form, "4 of 11 found".
  - These map what the server sent. They decide nothing.
- Create `src/components/game/MatchHeader.tsx`, a server-safe component that sits **inside** the canvas card, above the grid:
  - It shows the team name (`shortName` below `sm`), the side label ("Home XI" or "Away XI"), the formation and the found count. Competition, opponent and date stay hidden, as they aren't in `MaskedMatch`.
  - It has a `loading` variant: two `bg-skeleton-fill` bars at the title and subtitle heights, in the same outer box. This is the header skeleton W15 deferred.
- Create `src/components/game/GameCanvas.tsx`, a client component. It takes a `CanvasView` plus `guessValue`, `onGuessChange`, `onGuessSubmit` and `onGateAction`, and composes:
  - **Canvas card:** `rounded-lg border-line bg-surface-raised`, holding `MatchHeader` and then `SquadGrid`. The grid gets the rest of the height, with a floor of `20rem`. Below that floor the page scrolls vertically instead of squashing slots. While `match` is `null`, the grid shows `isLoading` on `LOADING_FORMATION`.
  - **Control rail:** a column to the right of the canvas from `lg` up, collapsing **below** it on narrower screens. It is never a hamburger or a toolbar. Top to bottom:
    - Solo: the clock row with one `CountdownRing` beside `Lives`.
    - Duel: the clock row with two rings, yours on the left and theirs on the right, matching the turn indicator's sides. Modes come from `duelRingModes`, and the opponent's ring has `owner="opponent"`.
    - Then `FeedbackToast`, then `GuessInput` last, so it sits thumb-side on phones.
    - The ring stays `size-36` with the 64px numeral at every width, per W10.
  - **Duel:** `TurnIndicator` spans the full width above the canvas and rail, at every width.
    - On their turn, the input is replaced by a muted "Waiting for {handle}" line **at the same height**, so nothing shifts on handover.
  - **No round yet** (`clock.round === null`): each ring renders as a stopped `waiting` ring at the full round length, so the rail keeps its shape.
  - **Gate:** `CanvasGate` wraps the canvas and the rail together. `gate.actionLabel` renders one button that calls `onGateAction`.
  - **Flash:** `LifeLostFlash` is keyed by `lifeLostKey` and is only ever driven by *your* lives. The opponent losing a life never flashes the screen.
  - **Heading:** a sr-only `h1` ("Solo game" / "Duel"), because `design.md` puts no visible heading above the canvas.
- Add the dev fixtures to `src/lib/dev/samples.ts`: a fictional `SAMPLE_MATCH: MaskedMatch` and two `DuelPlayer` samples. Nothing is imported from `src/lib/api/mock/`.
- Create `src/lib/dev/canvas-states.ts`, tested in `src/lib/dev/canvas-states.test.ts`:
  - `SOLO_CANVAS_STATES` and `DUEL_CANVAS_STATES` map names to a snapshot builder `(now: number) => { view; next? }`.
  - `next` is the view that replaces `view` after `SNAPSHOT_EVENT_DELAY_MS` (600). One-shot effects only fire when a key changes after mount, so any state with a flash, shake, pulse or reveal needs the swap to show it.
  - `resolveCanvasState(mode, param)` returns the named snapshot. An unknown name or a missing value returns `loading`.
  - The tests check that every name resolves for its mode, and that every view keeps `found` at or under 11 with unique slots and lives between 0 and 3.
  - They also check that each `next` changes exactly the key its state demonstrates, and that each round's `endsAt` is after its `startedAt`.
- Create `src/components/dev/CanvasStatePreview.tsx`, a client component:
  - It builds the snapshot once on mount from `Date.now()`, applies `next` after the delay and owns the guess text.
  - Submitting a guess is ignored, because a snapshot has no server behind it.
  - The pending snapshot pre-fills the text, so the locked input shows what was "sent".
- Update `src/app/(game)/play/solo/page.tsx` and `src/app/(game)/play/duel/page.tsx`:
  - Each page awaits `searchParams`. Outside production, `?state=<name>` renders `CanvasStatePreview` for that mode.
  - Otherwise the page renders `GameCanvas` in its loading view, until W20 and W23 wire the real loops. Check the current `searchParams` / `PageProps` API in `node_modules/next/dist/docs/` first.
- Create `src/app/dev/canvas/page.tsx`, a server page with `requireDevEnv()` in `DevPreviewShell`. It lists every solo and duel state as a link to `/play/solo?state=…` or `/play/duel?state=…`, each with a one-line description. It also notes that guesses are ignored in snapshots.

## States

Each row is one `?state=` value. "→" marks a `next` swap after 600ms.

| Mode | `?state=`         | Shows                                                                                        |
| ---- | ----------------- | -------------------------------------------------------------------------------------------- |
| both | `loading`         | Header and grid skeletons, stopped rings, input locked. This is also the default              |
| solo | `pre-match`       | Grid visible under the gate: "Match ready", with a Start action                               |
| both | `idle`            | 4 of 11 found, 12s left, input live                                                           |
| both | `warning`         | 7s left (`ember`)                                                                             |
| both | `critical`        | 3s left (`red-card`, pulsing)                                                                 |
| both | `pending`         | Input locked with the spinner, text kept, and the ring **still sweeping**                     |
| both | `correct`         | → the slot reveals. Solo: the next round starts right away. Duel: the ring freezes, input locks |
| both | `already-found`   | → the existing slot pulses and the toast reads "Already named". Input clears and stays live    |
| both | `not-in-xi`       | → the input shakes, the text stays, and the toast reads "Not in this XI"                       |
| both | `life-lost`       | → a pip empties with the flash. Solo: a new round. Duel: the turn passes                        |
| duel | `their-turn`      | Your ring `waiting`, theirs running in `away`, and the waiting line in place of the input      |
| duel | `their-reveal`    | → a slot fills with the `away`-tinted flash                                                    |
| duel | `their-life-lost` | → their pip empties, with **no** screen flash                                                  |

Snapshot rings run from their stated time down to 0 and then stay there. The shell never turns a 0 into a lost life.

## Open Questions

Defaults stand unless changed at `/feature start`.

- **Duel clock:** by default there are two rings, each under its side of the turn indicator. On their turn yours is `waiting`, as in `theme.md` § Duel — their turn. The alternative is one ring that changes owner. It saves 144px of width, but loses "your ring dims, theirs is live".
- **Quit chip:** by default it stays in the game layout's top row from W08. The alternative is to move it into the rail or the match header, as in the prototype, which frees the row.
- **Gate extent:** by default the gate covers the canvas and the rail, so the input can't be tabbed to while gated, and only the quit chip stays reachable. The alternative is to gate the grid only and lock the input, which leaves a locked input reachable by focus.
- **Adapter scenarios** (`DUEL_SCENARIOS`, W06c): by default W16 doesn't use them. They drive a live mock duel, which needs W23's loop, so W22, W23 and W25 pick them up. Record this against W06c's note that W16 would build the client with a scenario.
- **Replaying a one-shot:** by default you reload the page. The alternative is a dev-only Replay control, which would put chrome on a game route.

## Out of Scope

- **Driving the canvas from the adapter** → W20 (solo) and W23 (duel). W16 renders views; it never calls `getApiClient()` or `getDuelClient()`.
- **Terminal states** (perfect clear, run over, win, loss, draw, forfeit) → W21 and W23.
- **Lobby and matchmaking states**, including the lobby row skeleton → W22.
- **Opponent reconnecting, you reconnecting, rate limited, protocol refused** → W25.
- **Page-level reduced-motion and focus-order audit** → W26. The components keep their own per-component handling from W10–W15.

## Notes

- Scope:
  - The composed game screen for both modes: the header, grid, rail, gate and flash.
  - The match header and its skeleton.
  - A dev-only `?state=` override on the real game routes, and an index of states.
- Depends on:
  - W08 for the game frame and quit chip.
  - W09 for `SquadGrid`.
  - W10 for `CountdownRing`.
  - W11 for `Lives`, `TurnIndicator` and `LifeLostFlash`.
  - W13 for `GuessInput`.
  - W14 for `FeedbackToast` and `guessFeedback`.
  - W15 for skeletons, `CanvasGate` and `LOADING_FORMATION`.
- References:
  - `context/theme.md` § States (every row above comes from there) and § Loading.
  - `context/design.md`:
    - § Game routes carry no chrome.
    - § The canvas is the fold.
    - § Control rail, not a toolbar.
    - § Gate the canvas.
  - `context/screenshots/game-screen-prototype.png` for composition only: pitch left and rail right on desktop, a stacked band on tablet and phone, and the input at the bottom.
- Constraints:
  - **No game logic.** The shell renders the view it's given. It never decides that a round expired, a life was lost, a guess was right or whose turn it is. A ring reaching 0 does nothing.
  - **The squad never reaches the client.** Views only carry revealed players, as they're revealed. Snapshots are built from `lib/dev/samples`, never from `src/lib/api/mock/`.
  - **One route per realtime session.** Every state renders inside `/play/solo` or `/play/duel`. None of them navigates.
  - **Identical space:**
    - The loading header and loaded header are the same box, and so are the loading grid and loaded grid.
    - The waiting line takes the same height as the input.
    - Switching states never moves the rail.
  - **Transform and opacity only.** No new animation goes past what the composed components already do. There's no CSS transition on a property Motion animates.
  - **Colours come from tokens only.** Add a component-state token (named per `design.md` § Token architecture) only if a role utility can't express it. No hex.
  - The `?state=` override is ignored when `NODE_ENV === 'production'`.
  - `@/` imports, typed props, and comments of at most 50 characters, only for the non-obvious.
- Verification:
  - `npm run lint`, `npm run format:check`, `npm test` and `npm run build` pass. The build lists `/dev/canvas`.
  - Searching for `#[0-9a-fA-F]{3,6}` under `src/` still matches only `tokens.css`.
  - In the browser, go through every link on `/dev/canvas` and check each row of the States table.
  - `already-found` speaks through the grid and `not-in-xi` through the input, and the two are told apart at a glance.
  - `pending` keeps the ring sweeping, and `their-life-lost` doesn't flash the screen.
  - Loading → loaded boxes: the header, the grid and the rail have identical bounding boxes in `loading` and `idle`.
  - Duel handover: the rail's height is the same in `idle` and `their-turn`.
  - Gate: with `pre-match`, Tab reaches only the Start button and the quit chip.
  - Viewports:
    - At 1440×900 the pitch is on the left and the rail on the right, with no page scroll.
    - At 834×1194 and 390×844 the layout stacks as canvas, then clock row, then toast, then input. There's no page scroll at 390×844, and never a horizontal scroll.
    - At 375×667 the grid holds its `20rem` floor and the page scrolls vertically.
  - With `prefers-reduced-motion: reduce` emulated before load, the ring still sweeps, there's no shake or spring, and the console has no hydration warnings.
  - `/play/solo` and `/play/duel` with no `?state=` show the loading canvas.
  - `/dev/loading`, `/dev/feedback` and the other `/dev/*` previews are unchanged.
- **Deviations recorded during implementation**
  - **`ringSetups(clock, turn)` replaces `duelRingModes(turn, isFrozen)`.** One mapping serves both modes and returns each ring's round as well as its mode.
    - A waiting ring gets `UNSTARTED_ROUND`, a timing set far in the future, so it reads a full 15 without reading the client clock.
  - **Snapshots carry the guess text:** `{ frame: { view, guess }, next?: { view, guess } }` instead of `{ view; next? }`. That's how `pending` and `not-in-xi` keep their text while `correct` and `already-found` clear it.
  - **The pages always render `CanvasStatePreview`,** and production passes it no state, so it resolves to `loading`. `GameCanvas` needs client handlers, which a server page can't pass. W20 and W23 replace this.
  - **The snapshot gate's Start moves to `idle`** (`AFTER_GATE_STATE`), so the gate closes and focus lands on the input. The spec left the action unspecified.
  - **`PRIMARY_BUTTON` moved** from `LoadingPreview` to `src/styles/classes.ts`, because the gate action in the real canvas needs it too.
  - **`devOnlyParam`** was added to `src/lib/dev/route.ts` for the production guard.
  - **Values used:**
    - Composition capped at `max-w-6xl`.
    - Rail `lg:w-88` (352px), so two 144px rings fit.
    - Header `h-14`.
    - Grid floor `min-h-80` (20rem).
  - **Copy, driven by the frontend-design pass:**
    - The header subtitle is "Home XI in a 4-4-2", not a dot-joined meta string. No new all-caps labels.
    - The pre-match detail reads "Name all eleven starters. Your clock starts when you press Start."
  - **Open Questions:** every default stands: two rings, the quit row stays, the gate covers canvas and rail, adapter scenarios wait for W22, W23 and W25, and you reload to replay.
  - **Phone height (below `sm`):** at 390×844 the duel was 952px tall, because the turn indicator, the 144px rings and the 20rem floor don't fit. Reclaimed at the user's choice:
    - **Quit moves into the canvas header row.** It renders inside `GameCanvas` but outside the gate, so it stays reachable while gated. The layout's quit row is `hidden sm:flex`, and the header reserves `max-sm:pr-18` for the chip. This overrides the "quit row stays" default on phones only.
    - **The toast floats** over the bottom of the clock row, so it no longer takes its own row. At most it touches the ends of the rings' bottom arcs, for its 1.6s.
    - **Rail spacing:** `p-3 gap-2` on phones, `p-4 gap-3` from `sm`.
    - **Grid floor:** `min-h-72` (18rem) on phones, `min-h-80` from `sm`.
    - **Result:** both modes fit 390×844 with no scroll (duel grid 308px, solo grid 464px). At 375×667 the floor holds at 288px and the page scrolls vertically.

## History
