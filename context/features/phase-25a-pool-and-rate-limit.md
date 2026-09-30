# Phase W25a — Empty Pool & Rate Limit

## Status

Completed

## Goals

- Contract, in `src/lib/api/schemas/result.ts`:
  - Add `emptyPoolReasonSchema`: `'competition' | 'club' | 'era' | 'combination'`.
  - Add `emptyBecause: emptyPoolReasonSchema.optional()` to `apiErrorSchema`, set only with `code: 'empty_pool'`, so the client can offer a one-tap widen.
  - The mock's `EmptyPoolReason` becomes `z.infer` of it. `emptyPool(reason)` in `src/lib/api/mock/shared.ts` sets both the message and `emptyBecause`.
- Add a dev scenario switch in `src/lib/api/register.ts`:
  - Outside production, a full page load of any route with `?scenario=<name>` registers the mocks with that scenario. It's checked with `isDuelScenario`, and an unknown name is ignored.
  - `register.ts` stays the only app file that imports the mock. This replaces the temporary patches W22b and W23b used.
- Mock rate limit for solo:
  - Under the `rateLimited` scenario, `createMockApiClient` lowers its guess limit to 2 per 3s window, so the lockout is reachable by typing.
  - The limit comes from options: `rateLimit?: { max, windowMs }`. The default stays 12 per 3s, and the existing tests are unchanged.
- Pure helpers, tested:
  - `widenFilters(filters, reason, options)` in `src/lib/filters.ts`:
    - `competition` clears `competitionIds`.
    - `club` clears `clubIds`.
    - `era` resets to `options.era`.
    - `combination` returns `null`, because no single group is to blame.
  - In a new `src/lib/system-states.ts`:
    - `emptyPoolGate(error)` returns the empty-pool gate view (see States).
    - `cooldownUntil(error, now)` returns `now + retryAfterMs`, with a 1s floor when `retryAfterMs` is null.
    - `cooldownLabel(msLeft)` reads "Too many guesses. Try again in 3s".
- `CanvasGateView` gains `secondaryActionLabel?: string`. `CanvasGate` renders it as a text link under the primary action, like the lobby's "Search again", and routes it through a new `onGateSecondaryAction`.
- Empty pool, solo (`src/lib/solo-run.ts`, `src/hooks/use-solo-run.ts`, `src/components/game/SoloGame.tsx`):
  - The failed-find gate comes from `emptyPoolGate`.
  - The primary action widens: `SoloGame` replaces the URL with `withQuery('/play/solo', …)` and the widened filters, then restarts the run, with no dead end.
  - The secondary action "Change filters" goes to `/play` with the current filters kept.
- Empty pool, duel (`src/lib/duel-session.ts`, `src/hooks/use-duel.ts`, `src/components/game/DuelGame.tsx`):
  - A refused lock shows the same gate.
  - The primary action widens the held filters, through a new `filtersWidened` event, and locks again.
  - "Change filters" leaves for `/play`, as in W23b.
- Rate-limit lockout, as a new `cooldown` input state:
  - `GuessInputStatus` gains `'cooldown'`: the field is locked and keeps its text. Under it, a `warning`-toned line reads `cooldownLabel`, ticking every 250ms from a `cooldownUntil` timestamp. The line is `aria-hidden`; one polite announcement, "Too many guesses. Try again in 3 seconds.", is read once.
  - Solo: a `rate_limited` guess failure sets `cooldownUntil` in the reducer instead of a toast. Past the deadline, the input goes back to `live` on the next render, with no timer in the reducer.
  - Duel: both the `error` event and the failed ack with `rate_limited` set the same `cooldownUntil`, idempotently. This ends W23b's double toast.
  - The ring keeps sweeping throughout. The server owns the clock, and a lockout never pauses it.
- Snapshots:
  - `SOLO_CANVAS_STATES` gains `empty-pool-competition`, `empty-pool-club`, `empty-pool-era`, `empty-pool-combination` and `rate-limited`.
  - `DUEL_CANVAS_STATES` gains `duel-empty-pool` and `duel-rate-limited`.
  - `canvas-states.test.ts` checks that each empty-pool snapshot names its filter in the title, that only `combination` lacks a widen action, and that the rate-limited ones have a live ring and a `cooldown` input.

## States

From `context/theme.md` § System:

| State               | Trigger                                   | Treatment                                                                                                                              |
| ------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Empty filter result | `empty_pool` on solo find or duel lock    | Gate over the loading canvas. The title names the filter; the detail is the server's message; one primary widen, then "Change filters" |
| Rate limited        | `rate_limited` on a guess                 | Input locks with its text kept, and a `warning` line counts down to the server's retry time. Ring keeps sweeping. No toast            |

Empty-pool gate copy:

| `emptyBecause` | Title                                | Primary action             | Secondary      |
| -------------- | ------------------------------------ | -------------------------- | -------------- |
| `competition`  | "No match in those competitions"     | "Include every competition" | Change filters |
| `club`         | "No match for those clubs"           | "Include every club"       | Change filters |
| `era`          | "No match in those seasons"          | "Include every season"     | Change filters |
| `combination`  | "No match for these filters together" | "Change filters"           | none           |
| missing        | as `combination`                     | "Change filters"           | none           |

## Out of Scope

- Protocol refused, your reconnect overlay and "Connection lost" → W25b.
- Rate limits on auth forms. W18b already words `rate_limited` with its retry time.
- Pre-checking the pool on `/play`. The client can't know the pool (W19).
- The backend's own empty-pool behaviour after a duel coin flip, which is still a B38 question. The mock refuses before the flip, so the widen acts on your own filters.

## Open Questions

Defaults stand unless changed at load:

- **`emptyBecause` on the error.** It's a web-side addition to the contract, like W05a's. The backend adopts it in B25, or the widen falls back to "Change filters", which the missing-reason row already covers.
- **Widen versus the server's advice.** The mock's messages say "Try adding another one", while the widen includes the whole group. Default: keep the server's message as the detail, since it names the filter, and let the button say exactly what it does.

## Notes

- Scope: two of the four system states, in both modes, plus the dev scenario switch W25b also needs.
- Depends on: W19 (URL filters, `withQuery`, `withMode`), W20 and W23b (the failed gates and toasts this replaces), W13 (`GuessInput`), W15 (`CanvasGate`), W06c (`DUEL_SCENARIOS`).
- Constraints:
  - **No game logic in the client.** The cooldown only shows the server's `retryAfterMs`; the server still enforces the limit. Widening builds a request, and the server decides whether anything matches.
  - **Never fail silently** (coding standards). A lockout carries its reason, and an empty pool is never just "no results" (`theme.md` § System).
  - **Reduced motion is a scalpel:** the cooldown line has no animation, and the ring is untouched.
  - Tokens only (`warning` for the cooldown line), `@/` imports, single-line comments of at most 50 characters.
- Verification:
  - `npm test`.
  - In the browser, at 1440, 834 and 390:
    - Each empty-pool snapshot.
    - A real empty pool from `/play`: pick a club and a competition that never meet. Widen, and the run starts.
    - `/play/solo?scenario=rateLimited` and `/play/duel?scenario=rateLimited`, locking and unlocking with the ring still sweeping.
    - A production build ignores `?scenario=`.
  - `npm run build`.
- **Deviations recorded during implementation**
  - Cooldown end: the hooks dispatch `cooldownEnded` from a timeout at the deadline. The canvas view has no clock, so "live on the next render" had nothing to re-render it; the reducers stay timer-free.
  - `guessFailed` (both modes) and the duel `error` event carry `at: number`, so `cooldownUntil(error, now)` runs inside a pure reducer.
  - Added helpers beyond the spec: `widenReasonOf`, `heldCooldown` (keeps the first of the duel's event and ack reports), `cooldownAnnouncement` in `system-states.ts`, and `withFilters` in `filters.ts`, which swaps only the filter params so `mode` and the like survive.
  - `cooldownLabel` never counts below 1s; a static snapshot rests on "1s".
  - `CanvasViewBase.cooldownUntil` is optional, and `GuessInput` takes it as a prop. The cooldown field gets a `warning` border.
  - `SOLO_GATE_COPY.noMatch`/`changeFilters` and `DUEL_GATE_COPY.noMatch`/`changeFilters` removed; the copy lives in `system-states.ts`.
  - Duel widen also replaces the URL with the wider set. Without it, Play again restarted on the narrow filters and hit the empty pool again.
  - Snapshot empty-pool details are copied into `canvas-states.ts`, since `lib/dev` may not import the mock. `duel-empty-pool` blames the club filter.
  - The duel offers the widen only on a refused lock (`emptyPoolGate(error, canWiden)`). An empty pool after the flip gets "Change filters" alone, since widening your set can't re-lock it (review fix).

## History
