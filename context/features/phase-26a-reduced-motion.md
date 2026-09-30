# Phase W26a — Reduced Motion

## Status

Completed

## Goals

- A reduced-motion policy in `src/styles/motion.ts`:
  - `MotionEffect`: one name per animated effect in the app (see Policy).
  - `REDUCED_MOTION_POLICY: Record<MotionEffect, 'keep' | 'drop'>`. It's the single record of what reduced motion does, transcribed from `theme.md` § Motion.
  - `motionFor(effect, isReduced)`: `true` when the effect should run. A `keep` effect ignores `isReduced`.
- Every component that animates reads the policy instead of branching on `useReducedMotion()` ad hoc:
  - `src/components/game/`: `CountdownRing`, `Lives`, `GuessInput`, `FeedbackToast`, `TurnIndicator`, `LifeLostFlash`, `CanvasGate`, `RunSummary`.
  - `src/components/pitch/`: `RevealCard`, `SquadGrid`.
  - `src/components/duel/LobbyPanel.tsx` and `src/components/profile/ProfileSkeleton.tsx`.
  - A dropped effect lands on its end state at once, with no `duration: 0` flicker: a revealed card shows full size, a toast shows in place, a skeleton holds at full opacity.
- `LifeLostFlash` and `CanvasGate` take part. Both animate today without reading the preference.
- Guard tests in `src/styles/motion.test.ts`:
  - Every effect has a policy entry, and `ringSweep` is `keep`.
  - Every shake, spring, slide and ambient pulse is `drop`.
  - No stylesheet under `src/` holds a `prefers-reduced-motion` rule that sets `animation` or `transition` to `none`. It reads the CSS files, so a global kill-switch can never land.
- `/dev/*` previews stay as they are. Reduced motion is checked by emulating the media query, not with a new toggle.

## Policy

From `context/theme.md` § Motion: drop the shake and the spring, keep the ring. Opacity and colour changes that carry game information stay. Movement and decorative loops go.

| Effect              | Component                 | Reduced | Why                                                    |
| ------------------- | ------------------------- | ------- | ------------------------------------------------------ |
| `ringSweep`         | CountdownRing             | keep    | Carries the time left. Never stops (`theme.md`)        |
| `ringCriticalPulse` | CountdownRing             | drop    | Decorative; the red colour already says critical       |
| `timerColorShift`   | CountdownRing             | keep    | A 200ms colour change, not movement                    |
| `revealSpring`      | RevealCard                | drop    | A spring (`theme.md`)                                  |
| `revealFlash`       | RevealCard                | keep    | The `turf` flash is the "new player" signal            |
| `alreadyFoundPulse` | SquadGrid                 | keep    | The already-found channel (`theme.md` § States)        |
| `skeletonPulse`     | SquadGrid, RunSummary, ProfileSkeleton | drop | Decorative loop                          |
| `lifeShake`         | Lives                     | drop    | A shake (`theme.md`)                                   |
| `lifeFill`          | Lives                     | keep    | The pip emptying is the information                    |
| `lifeLostFlash`     | LifeLostFlash             | keep    | One opacity flash, never repeated; says a life went    |
| `inputShake`        | GuessInput                | drop    | A shake (`theme.md`)                                   |
| `inputRejectTint`   | GuessInput                | keep    | The not-in-XI channel once the shake is gone           |
| `inputSpinner`      | GuessInput                | keep    | Says the guess is being checked                        |
| `toastRise`         | FeedbackToast             | drop    | Movement                                               |
| `toastFade`         | FeedbackToast             | keep    | Opacity only                                           |
| `turnChipSlide`     | TurnIndicator             | drop    | Movement                                               |
| `turnBorderShift`   | TurnIndicator             | keep    | A colour change                                        |
| `gateFade`          | CanvasGate                | keep    | A 240ms opacity fade; nothing moves                    |
| `lobbyPulse`        | LobbyPanel                | drop    | Ambient loop                                           |
| `coinFlipScale`     | LobbyPanel                | drop    | Movement                                               |

## Out of Scope

- Focus order and contrast → W26b.
- New animations, or retuning any duration or easing. Values stay as `motion.ts` has them.
- A user-facing motion setting. The OS preference is the only input.

## Open Questions

Defaults stand unless changed at load:

- **`lifeLostFlash` under reduced motion.** `theme.md` names only the shake as dropped. Default: keep the single red flash. It's opacity only, never strobes, and reinforces a lost life alongside the pip.
- **`inputSpinner`.** A continuous rotation. Default: keep, since it's the only busy signal and it lasts only as long as the request.

## Notes

- Scope: reduced motion across every animated component, and a guard against a global kill-switch. W26b covers focus and contrast.
- Depends on: W10–W25, which built every component listed.
- Constraints:
  - **Reduced motion is a scalpel, never a kill-switch** (`theme.md`, `design.md` § Do not build). The ring ignores the preference entirely.
  - Animate `transform` and `opacity` only. Motion owns what it animates; no CSS transition on the same property.
  - Tokens only, `@/` imports, single-line comments of at most 50 characters.
- Verification:
  - `npm test`.
  - In the browser with `prefers-reduced-motion: reduce` emulated, at 1440 and 390:
    - `/dev/ring`: the sweep runs; the critical pulse doesn't.
    - `/dev/reveal`, `/dev/lives`, `/dev/feedback`, `/dev/loading`: springs, shakes, slides and pulses are gone; flashes and fades remain.
    - A solo run: a correct guess, a miss, a lost life.
    - A duel lobby through to the first turn.
  - The same pages without emulation look as they do today.
  - `npm run build`.
- **Deviations recorded during implementation**
  - Added `slotMove` (drop) for the grid's slot slide into formation, which the spec's table missed. It was animating `x`/`y` with no reduced-motion check. The policy now has 21 effects.
  - `useMotionPolicy()` in `src/hooks/use-motion-policy.ts` wraps `useReducedMotion` + `motionFor`, and treats the preference as unknown (animate) until hydration. Server markup still matches, so components can branch `initial` safely.
  - Dropped entrances branch `initial` (reveal scale, coin-flip scale, turn-chip offset, toast rise), so an element mounted after hydration starts on its end state. Their `transition` still branches too, so an element present at hydration snaps within one frame. Before this, the coin flip and turn chip showed their start offset for a frame under reduced motion.
  - `keep` effects read the policy too (`lifeFill`, `revealFlash`, `alreadyFoundPulse`, `lifeLostFlash`, `inputRejectTint`, `turnBorderShift`, `gateFade`), so flipping one entry is the only change needed.
  - The spinner stays rendered when `inputSpinner` is off; it only stops rotating, so the busy cue never disappears.
  - The kill-switch guard splits each stylesheet on `@media` and fails on any reduced-motion block that sets `animation` or `transition` to `none`. Mutation-checked with the classic `*` kill-switch.
  - Motion reads the preference once per page load. Emulation in the browser checks needs a reload after switching.
  - `ringSweep`, `timerColorShift` and `toastFade` are kept by design and not read: the sweep must never consult the preference, and the fade is what hides the toast when its time is up (review fix).

## History
