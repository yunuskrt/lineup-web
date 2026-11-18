# Fix — Refactor E: Cooldown End Hook

## Status

Completed

## Goals

Phase 2 of `context/docs/code-cleanup-guide.md`, batch refactor-e. Item approved by the user on 2026-11-18 (refactor-scanner report, item 7). **The input unlocks at the same moment as today.**

- `src/hooks/use-cooldown-end.ts` exports `useCooldownEnd(cooldownUntil: number | null, onEnd: () => void)`: the `setTimeout` to `cooldownUntil`, cleared on change, with the existing comment "The server set the time; this only unlocks".
- `hooks/use-solo-run.ts` and `hooks/use-duel.ts` replace their identical effects with `useCooldownEnd(state.cooldownUntil, () => dispatch({ type: 'cooldownEnded' }))`. `onEnd` is read through `useEffectEvent`, so it isn't a dependency.

## Out of Scope

- The `fail()` and `beginRun()` plumbing (report item 2, not approved). The `useNow` tick hook (item 6, not approved).

## Notes

- **Source:** `refactor-scanner` report, step 2.1 of the guide.
- **Constraints:** presentation only: the server's `retryAfterMs` decides the time, the client only unlocks.
- **Verification:**
  - `npm run lint`, `npx tsc --noEmit`, `npm test` and `npm run build`;
  - by hand in mock mode with `?scenario=rateLimited`: spam guesses in solo and in a duel; the input locks with the reason and unlocks when the countdown ends;
  - B5: `/play/solo?state=rate-limited` and `/play/duel?state=duel-rate-limited` (frozen-clock rule).
- **B7 scope:** only findings inside these goals are fixed; anything else is a follow-up note.

- **Deviations recorded during implementation:**
  - **Hand check (mock, `?scenario=rateLimited`, 2 guesses per 3 s):** solo locked with "Too many guesses. Try again in 3 seconds." and unlocked 2.6 s later; a duel, on my turn, locked with "…in 2 seconds." and unlocked 1.3 s later. Both unlock when the cooldown ends, as before.
  - **Effect Event call (review):** the timer calls `end()` from an arrow, as React documents for `useEffectEvent`, instead of passing the event itself to `setTimeout`.
  - **Follow-ups, not this batch (review):**
    - the cooldown `setTimeout` delay isn't capped at the browser maximum (2^31-1 ms, about 24.8 days), so a huge `retryAfterMs` would fire at once and unlock early. The old inline effects had the same gap.
    - two timers watch the same deadline: `GuessInput`'s countdown line and announcement, and `useCooldownEnd`. They can end a frame apart; one clock could drive both.
