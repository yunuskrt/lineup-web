# Phase W21b — Summary Wiring

## Status

Not Started

## Goals

- Extend `src/lib/solo-run.ts` and `src/types/solo-run.ts`, keeping the tests in `solo-run.test.ts`:
  - The state holds `summary: SoloSummary | null`.
  - New events:
    - `summaryReceived`, from `getSummary` or `quit`.
    - `quitting`, which locks the input while `quit` is in flight.
  - A new failed step, `summary`, whose "Try again" fetches the summary again.
  - `soloCanvasView` maps the `over` phase to `end: { status: 'loading' }` until the summary arrives, then to `end: { status: 'ready', summary }`. The W20 end gate ("Perfect clear" / "Run over" with "Back to filters") goes, along with its `SOLO_GATE_COPY` entries.
  - `soloGateAction` stops returning `leave` for `over`. The summary panel owns those actions.
- Extend `src/hooks/use-solo-run.ts`:
  - When the run reaches `over` from a guess or a sync, it calls `solo.getSummary(sessionId)` once.
  - `quit()` dispatches `summaryReceived` with the summary `solo.quit` returns, so a quit ends on the summary like any other run.
  - Before a side is picked, quit still leaves straight away.
  - `playAgain()` starts a new run with the same filters **in place**: it resets and runs the find step again, with no navigation and no remount.
- Update `SoloGame`:
  - Quitting no longer navigates. The dialog closes and the summary shows.
  - `onPlayAgain` calls `playAgain()`, and the guess text is cleared.
  - `onChangeFilters` goes to `/play` with the filters kept.
- **Focus on arrival:** when the summary becomes ready, focus moves to its `h2` (`tabIndex={-1}`), not to Play again. A stray Enter or Space from the last guess then can't start a new run. This fixes the W20 known item.
- The ring stays hidden once the run is over, because the rail shows the summary. This closes the W20 "ring stays on 0" item without changing `CountdownRing`.

## States

| State             | Trigger                                      | Canvas                                                                  |
| ----------------- | -------------------------------------------- | ----------------------------------------------------------------------- |
| Summary loading   | A guess or a sync shows `over`               | The rail shows the summary skeleton. Input and ring gone                |
| Summary           | `getSummary` resolves                        | `RunSummary`, the revealed header, and Pro missed names if sent. Focus on the title |
| Quit summary      | "Quit run" confirmed, and `quit` resolves    | The dialog closes, then the summary with "Run ended"                    |
| Summary failed    | `getSummary` rejects                         | Gate "Couldn't load the summary" with "Try again", which fetches it again |
| Play again        | Play again pressed                           | Back to Finding, then Choosing, on the same route with the same filters |

## Open Questions

Defaults stand unless changed at `/feature start`.

- **Play again:** by default it resets in place, on the same route and the same mounted tree. The alternative is `router.replace` to the same URL. That's simpler state-wise, but it relies on a remount the App Router doesn't guarantee for the same URL.
- **Focus on arrival:** by default focus goes to the summary title. The alternative is focusing Play again after a short delay. That's faster for keyboard players, but it reintroduces the stray-Enter risk.

## Out of Scope

- **Summary visuals** → W21a.
- **Streak or stats persistence in the profile** → W24. The mock already records history on finalize.
- **Designed system states** → W25. **Real endpoints** → W29.

## Notes

- Scope: wires W21a's panel to real runs. It fetches the summary when a run ends, makes quitting end on the summary, adds Play again in place, and sets focus on arrival.
- Depends on:
  - W21a for `RunSummary`, `SoloCanvasView.end`, the revealed `MatchHeader` and missed slots.
  - W20 for `useSoloRun` and the reducer.
- References:
  - `SoloApi.getSummary` and `SoloApi.quit` in `src/lib/api/client.ts`.
  - `context/theme.md` § Solo.
  - W20's known items in `context/features/phase-20-solo-loop.md`.
- Constraints:
  - **No game logic.** The client doesn't compute accuracy, streak, missed or lives. Everything shown comes from `SoloSummary`. The client never decides a run is over; it reacts to `status: 'over'`.
  - **One route per run.** Summary and Play again both stay on `/play/solo`. Only Change filters navigates.
  - **Never fail silently.** A rejected `getSummary` shows a gate with a retry.
  - A StrictMode remount must not fetch the summary twice or start two runs on Play again.
  - `@/` imports, typed props, and comments of at most 50 characters.
- Verification:
  - `npm run lint`, `npm run format:check`, `npm test` and `npm run build` pass.
  - `solo-run.test.ts` covers:
    - `over` mapping to the summary skeleton, then to ready.
    - The summary from `quit`.
    - A `summary` failure and its retry.
    - `playAgain` resetting to `finding`.
    - No gate at `over`.
  - In the browser (Yıldırımspor: `/play/solo?club=club-yildirimspor`):
    - Lose all lives and see the summary with the revealed scoreline.
    - Name all 11 and see the perfect clear takeover.
    - Quit mid-run and see "Run ended".
    - Play again starts a new run with the same filters, and Change filters returns to `/play` with them.
    - Press Enter straight after the final guess, and check that it doesn't start a new run.
    - With a temporary mock patch, since reverted, a failed `getSummary` shows the retry gate.
    - StrictMode fetches the summary once per run.

## History
