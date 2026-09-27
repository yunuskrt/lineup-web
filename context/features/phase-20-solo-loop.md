# Phase W20 — Solo Loop (Mock)

## Status

Completed

## Goals

- Create `src/lib/solo-run.ts`, pure and tested in `src/lib/solo-run.test.ts`, which turns server responses into the canvas view and decides nothing:
  - `SoloRunState` covers the run's phases: `finding`, `choosing` (with the `SoloMatchOffer`), `playing` and `over` (with the last `SoloSession`), `failed` (with the `ApiError`), plus the view keys `toastId`, `shakeKey`, `pulseKey` and `lifeLostKey`.
  - `soloRunReducer(state, event)` handles these events:
    - `offerReceived` and `sessionReceived` (from `chooseSide`).
    - `guessSubmitted` and `guessResolved` (a `SoloGuessResponse`).
    - `guessFailed` (an `ApiError`), `synced` (a `SoloSession`) and `failed`.
  - A resolved guess goes through `guessFeedback` (W14) and bumps `shakeKey` or the pulse, or raises a toast. The session in the response always replaces the one held.
  - `lifeLostKey` bumps only when a server session shows **fewer** lives than the one held. The client never decides that a life was lost; it only notices that the server says so.
  - A status of `over` from any response moves the run to `over`.
  - `soloCanvasView(state)` returns a `SoloCanvasView` (W16):
    - `match` is `null` until a side is chosen.
    - `input` is `locked` outside `playing`, and `pending` while a guess is in flight.
    - `clock.round` comes straight from the server session.
  - `needsResync(held, synced)` is true while a synced session still shows the same round as `active`. Because the server grants a grace window after `endsAt`, the first sync at 0 can come back unchanged.
- Create `src/hooks/use-solo-run.ts`, which drives the reducer from the API client and nothing else:
  - On mount, it runs `useEnsureSession` (W19) so a direct visit starts as a guest, then calls `solo.findMatch(filters)`. React StrictMode's double effect must not create two runs.
  - `chooseSide(side)` calls `solo.chooseSide`. The round starts on the server at that moment, so picking a side **is** the start and there's no separate Start gate.
  - `submitGuess(text)` goes through `prepareGuess` (W13) and then `solo.guess`. Only one guess is in flight at a time.
  - When the countdown reaches 0, it asks the server with `solo.syncSession`. It re-syncs every `SYNC_RETRY_MS` (250) while `needsResync` holds. If a guess is in flight at 0, its response settles the round first. The client never turns a 0 into a lost life.
  - `quit()` calls `solo.quit` once a side has been chosen. Before that there's no server run to end, and it just leaves.
  - Every rejected call surfaces (see States). None of them fails silently.
- Create `src/components/game/QuitDialog.tsx`, a client component built on native `<dialog>` with `showModal()` for the focus trap and Esc:
  - Title: "Quit this run?" Detail: "Your run ends here and counts as played. The clock keeps running while you decide."
  - "Keep playing" is focused first and closes the dialog in one tap. "Quit run" confirms. There's never a double confirm.
  - No new animation. W26 revisits the motion.
- Update `GameCanvas` and the game layout so the canvas owns the quit control at every width:
  - `GameCanvas` takes an optional `onQuit`. With it, the chip is a button that calls it. Without it, the chip stays the W08 link to `/play`.
  - The layout's `sm+` quit row moves into `GameCanvas`, so a page-level handler can reach it.
  - The duel preview keeps the plain link until W23.
- Extend `CanvasGateView` with an optional `choices: { id: string; label: string }[]`, as an alternative to `actionLabel`:
  - `onGateAction` receives the chosen id.
  - Choices render as equal-weight buttons, because two sides are one decision, not two primary actions.
  - W16's single-action snapshots keep working unchanged.
- Create `src/components/game/SoloGame.tsx`, a client component:
  - It reads the filters from `useSearchParams()` through `filtersFromParams` and `useFilterOptions` (W19), runs `useSoloRun` and renders `GameCanvas` with `soloCanvasView` and `QuitDialog`.
  - It owns the guess text.
- Update `src/app/(game)/play/solo/page.tsx`:
  - Outside production, `?state=` still renders `CanvasStatePreview`.
  - Every other visit renders `SoloGame`.
  - Retire the "Loading canvas until the solo loop is wired" comment.

## States

Each row is what the player sees on `/play/solo`. The data comes from the mock adapter; nothing is a snapshot.

| State             | Trigger                                   | Canvas                                                                                                                                                     |
| ----------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Finding           | Page load (and guest creation if needed)  | Header and grid skeletons, stopped ring, input locked. No gate: the skeleton is the wait                                                                   |
| Choosing          | `findMatch` resolves                      | The loading canvas under a gate: "Pick your side", detail "You'll name the starting XI of the team you pick.", with one button per club (home first)      |
| Playing           | `chooseSide` resolves                     | The gate lifts, the header and formation arrive, the ring runs from the server's `endsAt` and focus lands on the input                                     |
| Pending           | Guess sent                                | Input locked with the spinner, text kept, and the ring **still sweeping**                                                                                  |
| Correct, new      | `correct_new`                             | The slot reveals, the input clears, and the next round's ring starts straight away, with no handover pause                                                 |
| Already found     | `already_found`                           | The existing slot pulses and the toast reads "Already named". The input clears and stays live                                                              |
| Not in XI         | `not_in_xi`                               | The input shakes, the text stays, and the toast reads "Not in this XI"                                                                                     |
| Life lost         | A sync shows fewer lives                  | A pip empties with the flash, and the new round's ring starts                                                                                               |
| Guess rejected    | `guess` fails                             | The toast carries the server's message, the input returns to live with the text kept. `session_over` triggers a sync instead                               |
| Quit confirm      | Quit chip                                 | `QuitDialog` over the running canvas                                                                                                                       |
| Run over          | A response shows `status: 'over'`         | Temporary gate until W21: "Perfect clear" or "Run over", detail "You named N of 11.", with one action, "Back to filters". It leads to `/play` with the filters kept |
| No match          | `findMatch` fails with `empty_pool`       | Temporary gate until W25: the server's message, with "Change filters" leading to `/play` with the filters kept                                             |
| Failed            | Any other rejected call                   | Gate with the message from `authErrorMessageOf` and "Try again", which restarts the step that failed                                                      |

## Open Questions

Defaults stand unless changed at `/feature start`.

- **Run state:** by default the run state lives in `useReducer` inside `useSoloRun`. Solo is REST with one consumer tree. Zustand, which the project overview names for the live session store, joins at W23, where socket events fan out to many components. The alternative is to add Zustand now, so W23 has a store to extend.
- **Side pick:** by default the choice sits in a gate over the loading canvas, and the club names are the buttons. The alternative is a separate pre-canvas panel, which breaks `design.md` § Gate the canvas.
- **Quit control:** by default `GameCanvas` renders the chip at every width and the layout keeps only the frame. The alternative is a quit context read by the layout's chip. The page sits below the layout, so that would need a client provider in the layout.
- **After quitting, before W21:** by default the player goes back to `/play` with the filters kept. W21 replaces this with the summary.
- **Reload mid-run:** by default a reload starts a new run with the same filters. The mock store lives in memory, so the old run is gone anyway. Resuming would need the session id in the URL, which is left to W29.

## Out of Scope

- **The summary screen:** named vs missed, accuracy, streak, and the perfect clear and run over treatments → W21. W20's end gate is a placeholder.
- **Designed system states:** empty filter pool, rate limited, connection lost → W25. W20 surfaces them plainly and never silently.
- **Duel** → W22 and W23. The duel route keeps its preview.
- **Real endpoints and server/client clock skew** → W29. The mock runs on the browser's own clock.
- **Page-level reduced motion and focus order audit** → W26.

## Notes

- Scope: `/play/solo` plays a full run off the mock adapter, from the filters in the URL to the end of the run, including side pick, the 15s loop, lives, reveals, both no-penalty outcomes and quit.
- Depends on:
  - W16 for `GameCanvas`, `SoloCanvasView` and the `?state=` override.
  - W19 for `useEnsureSession`, `useFilterOptions`, `filtersFromParams` and `withQuery`.
  - W06b and W07b for the mock solo adapter. Its grace window of 400ms past `endsAt` is why `needsResync` exists.
- References:
  - `context/theme.md` § Solo, the source of the States table.
  - `context/project-overview.md` § E) Singleplayer.
  - `SoloApi` in `src/lib/api/client.ts` for the calls: `findMatch`, `chooseSide`, `guess`, `syncSession`, `quit`.
- Constraints:
  - **No game logic in the client.** Whether a guess is right, whether a round expired, the lives, the found pool and whether the run is over all come from server responses. A ring reaching 0 only prompts a `syncSession`. No part of the client knows the grace window's length.
  - **The squad never reaches the client.** The canvas shows only `found` from the session. Nothing here imports from `src/lib/api/mock/`; everything goes through `getApiClient()`.
  - **One route per run.** Finding, choosing, playing and the end gate all render inside `/play/solo`. No step navigates until the player leaves.
  - **Never fail silently on a game action** (`coding-standards.md` § Error Handling). A dropped guess or a rejected sync surfaces to the player.
  - Identical space: the choosing gate sits over the same loading canvas, and the skeleton → loaded swap keeps the W16 boxes.
  - Transform and opacity only. No new animation beyond what the composed components already do.
  - Colours come from tokens only, with no hex. `@/` imports, typed props, and comments of at most 50 characters, only for the non-obvious.
- Verification:
  - `npm run lint`, `npm run format:check`, `npm test` and `npm run build` pass.
  - Searching for `#[0-9a-fA-F]{3,6}` under `src/` still matches only `tokens.css`.
  - `solo-run.test.ts` covers:
    - Each guess outcome's view keys.
    - `lifeLostKey` bumping only on a drop in lives.
    - `over` from a guess and from a sync.
    - `needsResync` with the same round, a new round and an over session.
    - The locked and pending input per phase.
  - In the browser, from `/play` with filters set, press Start solo run and play through:
    - Pick each side on separate runs, and check that the header matches the side.
    - A correct name, a repeat and a made-up name, telling apart the grid pulse and the input shake.
    - Let a round run out and check that exactly one life drops after the grace window, with one flash.
    - Lose all three lives, and reach 11 found for a perfect clear (the mock's alias sets make this possible).
    - Quit mid-run: "Keep playing" cancels in one tap or with Esc, and "Quit run" returns to `/play` with the filters kept.
  - Signed out, visit `/play/solo?club=…` directly and check that a guest is created and the run uses that club.
  - Set filters that no match satisfies and check the No match gate and its link back.
  - The Network tab and React DevTools show no squad data outside `found`.
  - StrictMode in dev creates one run per visit, not two.
  - Viewports 1440×900, 834×1194 and 390×844 keep the W16 layout, with the quit chip reachable at each.
  - `/play/solo?state=…` snapshots and `/dev/canvas` are unchanged, apart from the quit chip's new place on `sm+`.
- **Deviations recorded during implementation**
  - **The hook reads the filters, not `SoloGame`.** `useSoloRun(params)` loads the catalog with `queryClient.query(filterOptionsQuery)` and applies `filtersFromParams` itself. That makes finding one async step, from guest to catalog to `findMatch`, and a retry repeats the whole step. `use-filter-options.ts` now exports `filterOptionsQuery` (`queryOptions`), and `useFilterOptions` wraps it.
  - **`needsResync(held: RoundTiming, synced)`** takes the held round, not the held session. The sync effect keeps only the round's primitives in its deps.
  - **Reducer shape:**
    - The view keys are `toast.id` and `pulse.key`, not separate `toastId` and `pulseKey`.
    - The state adds `isGuessing` and `failure: { step, error }`.
    - Two events were added: `finding`, which restarts, and `retried`, which returns to the phase the failure interrupted.
  - **Added:**
    - `soloGateAction(state)`, which maps each gate to `choose`, `leave` or `retry`, and is tested.
    - The `SOLO_GATE_COPY` constants.
    - `apiErrorOf(error)` in `src/lib/api/unwrap.ts`, tested.
    - `CHOICE_BUTTON` in `classes.ts`, the `CanvasGateChoice` type, and `self-stretch` on `CanvasGate`'s action wrapper so the choices fill the panel.
  - **Failure copy:**
    - The gate title names the step: "Couldn't find a match", "Couldn't start the run", "Couldn't update the run", "Couldn't end the run".
    - `not_found` leads back to the filters like `empty_pool`, because a retry can't bring back a lost run.
    - Guess errors reuse `authErrorMessage`, for example "Too many attempts. Try again in 2 seconds."
  - **Quit only confirms an active run.** Before a side is picked, or after the run is over, the chip leaves straight away. A failed `quit` opens the failed gate.
  - **Quit chip on `sm+`:** it now sits at the right edge of the `max-w-6xl` column, not the viewport's.
  - **Measured:** a life drops about 516ms after the ring shows 0, which is the 400ms server grace plus a 250ms re-sync.
  - **Left for later phases:**
    - Dismissing `QuitDialog` returns focus to the Quit chip (the native behaviour), not the input → W26.
    - At run over the ring stays on 0, because a stopped ring reads the clock once → W21 replaces the end gate.
    - The end gate focuses "Back to filters". A single Enter on the final guess was checked not to carry over, but a quick second Enter would leave → W21.
  - **Temporary test aids, both reverted:** a mock patch that failed the first `syncSession`, and a log that counted `findMatch` calls under StrictMode (one per visit).
  - **Review fix:** "Try again" after a failed `quit` now re-runs the quit and leaves on success. Before, it only returned to the game, which didn't restart the step that failed. Checked with a temporary mock patch, since reverted. Three comments over 50 characters were shortened.
  - **Known for W29:** if `chooseSide` fails on a real network after the server has applied it, "Try again" returns to the side gate, and a second pick gets `forbidden`. W29 should re-sync instead of re-picking. The mock can't produce this.
  - **Review nit left as is:** `syncNow` and the sync effect's `attempt` repeat the same call, but `attempt` needs its own cancel check.
  - **Tests (`/feature test`):** five reducer tests were added: a retry after a failed find, a failure dropping a guess in flight, a sync resuming play after a failure, a guess response showing a lost life, and the failed-step gate title. The "fresh key" test now checks the pulse key too. `solo-run.test.ts` has 28 tests. The hook and components stay browser-verified, per the standards.
  - **Open Questions:** every default stood: `useReducer`, the side pick as a gate, the quit chip in `GameCanvas`, back to `/play` after quitting, and a reload starts a new run.

## History
