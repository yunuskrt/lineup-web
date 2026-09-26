# Phase W10 — Countdown Ring

## Status

Completed

## Goals

- Create `src/lib/countdown.ts`, pure and framework-free. Every function takes `now` as an argument and never reads the clock itself.
  - `remainingMs(round, now)` returns `round.endsAt - now`, clamped to `0 … endsAt - startedAt`.
  - `displaySeconds(remainingMs)` returns `Math.ceil(remainingMs / 1000)`, so the numeral reads 15 at the start and reaches 0 only when time is up.
  - `sweepFraction(remainingMs, round)` returns the remaining share of the round, from 1 to 0, linear and clamped.
  - `countdownStage(seconds)` returns `'calm' | 'warning' | 'critical'`. It is `warning` at 7 or less and `critical` at 3 or less. The thresholds are named constants in this file.
- Create `src/lib/countdown.test.ts` covering:
  - the numeral boundaries: 15000 → 15, 14001 → 15, 14000 → 14, 7001 → 8, 7000 → 7, 3001 → 4, 3000 → 3, 1 → 1, 0 → 0;
  - clamping when `now` is before `startedAt` or past `endsAt`;
  - linearity: the fraction at the round's midpoint is 0.5, and equal time steps give equal fraction steps;
  - stage boundaries at 8 / 7 and 4 / 3, with the stage always agreeing with the numeral shown;
  - durations other than 15s, so nothing depends on a hard-coded 15.
- Create `src/components/game/CountdownRing.tsx`, a client component:
  - Props: `round: RoundTiming`, `mode: 'running' | 'frozen' | 'waiting'`, and `owner: 'you' | 'opponent'` (default `'you'`).
  - Draws an SVG track circle in `stroke-line` and a progress circle on top of it. The progress starts at 12 o'clock and depletes clockwise.
  - The numeral is 64px (`text-64`), Archivo (`font-display`), `tabular-nums`, and centred in the ring. The box is fixed at `size-36` (144px).
  - The sweep is recomputed every frame from `Date.now()` and `round` inside Motion's `useAnimationFrame`. It is written to a motion value that drives the progress circle's `pathLength`. It is never a tween, so it is linear by construction and can never drift from the numeral.
  - The numeral re-renders only when `displaySeconds` changes, not once per frame.
  - A critical-stage opacity pulse on the progress stroke (1 → 0.6 → 1 over 1s, repeating), dropped when `useReducedMotion()` is true. The sweep ignores reduced motion entirely.
  - The colour shift between stages is a CSS transition on the named properties `stroke` and `color` only, at `MOTION_DURATION_MS.timerColorShift` with `MOTION_EASING.timerColorShift`. Motion never animates those properties.
  - Accessible as `role="timer"` with the label "Time left". The SVG is `aria-hidden`.
- Create a dev route at `src/app/dev/ring/page.tsx`, outside every route group like `/dev/theme` and `/dev/pitch`. It renders:
  - one live ring with controls to restart the round, freeze it and switch it to waiting;
  - a live opponent ring;
  - static specimens: calm at 12s, warning at 6s, critical at 2s, empty at 0s, and a waiting ring.
  - Rounds are built client-side after mount. The route never imports from `src/lib/api/mock/`.

## States

| Mode      | Trigger (supplied by W16 and later) | Ring                                                   | Numeral                     |
| --------- | ----------------------------------- | ------------------------------------------------------ | --------------------------- |
| `running` | Your round is live, including while a guess is pending | Sweeps; stroke `fg` → `warning` → `danger` by stage, pulse at critical | Same colour as the stroke   |
| `running` at 0 | Time is up, but the server hasn't ruled yet | Empty, `danger`                               | `0`, `danger`, held until the server moves on |
| `frozen`  | The server confirmed a correct new answer | Holds the value it had when it stopped; stage colour kept, pulse stops | Held                        |
| `waiting` | It's the opponent's turn            | Holds the value it had when it stopped, in `fg-dim`   | Held, `fg-dim`              |
| `owner: 'opponent'`, `running` | The opponent's round is live | Sweeps in `opponent` at every stage, with no pulse    | `opponent`                  |

- **Reset:** a new `round` with `mode="running"` snaps straight to full. There's no reverse sweep, because a ring filling back up reads as time running backwards.
- **Mount while stopped:** a ring that mounts `frozen` or `waiting` shows the value computed from its `round` once, at mount.
- **Pending** isn't a ring mode. `theme.md` says the ring keeps sweeping, so the ring doesn't know a guess is in flight.

## Open Questions

Defaults stand unless changed at `/feature start`.

- **Solo base colour:** `theme.md` § Solo says "One ring, `floodlight` throughout", but its palette rule and the duel table say the ring escalates from `bone`. Default: calm is `fg` (`bone`) in both modes, which matches the prototype prompt's "cream (15–8s)". The solo line is read as "only one ring, and never `away`".
- **Opponent escalation:** default is none. The opponent's ring stays `opponent` throughout, because `warning` and `danger` mean _you_ are losing time. That leaves the amber/blue identity pair readable during their turn.
- **Critical pulse under reduced motion:** dropped. The colour and numeral already carry the stage, and `theme.md` keeps only the sweep as information.
- **Clock skew:** default is to compare `endsAt` with the browser's `Date.now()`. That's exact against the mock, which shares the browser clock. Against the real server, a skewed device clock shifts the ring. Anchoring on receipt time fixes skew but breaks mid-round snapshots on reconnect, so the real fix is a server `now` in round payloads for a clock offset. That's a backend contract decision (B31 / B39), wired in W30. Until then, the ring takes `round` as the contract shapes it and adds no offset prop.

## Out of Scope

- **Placing the ring** beside the grid, the two-ring duel arrangement and the mobile compact row → W16 and W23. Unlike the prototype's mobile frame, the ring doesn't shrink: the numeral stays 64px everywhere, per the prototype prompt.
- **The life-lost flash and pip** → W11. The ring never decides a life is lost.
- **Screen-reader announcements** at the 7s and 3s thresholds → W26.
- **The `?state=` override** → W16. `/dev/ring` is a component preview, not the game screen.

## Notes

- Scope: a presentation-only countdown ring driven by a server round timing, with pure tested helpers and a dev preview route.
- Depends on: W02a (`MOTION_DURATION_MS`, `MOTION_EASING`), W03 (the `fg`, `fg-dim`, `line`, `warning`, `danger` and `opponent` role utilities, plus `font-display` and `text-64`), W05 (`RoundTiming`) and W09 (Motion installed).
- References: `context/theme.md` § Motion and § States (the linear-sweep rule, the thresholds and the per-mode treatment); `context/docs/prompt-solo-game-screen.md` § Countdown ring for the stage ranges.
- Constraints:
  - **Presentation, not game logic.** The ring renders a server timestamp. It exposes no `onExpire`, never locks input, never costs a life and never starts a round. Reaching 0 changes only what's drawn. The server's grace window means the ruling can arrive after 0 is shown.
  - **Linear, non-negotiable.** No easing, spring or tween on the sweep, and no transition on `pathLength`. Position is a pure function of `now`.
  - **No hard-coded 15.** The duration is `endsAt - startedAt`. The client must not import `ROUND_DURATION_MS` from the mock.
  - **No `Date.now()` during render.** Time is read only inside the frame loop or an effect, so SSR and hydration can't disagree.
  - **Reduced motion is a scalpel.** Only the pulse checks `useReducedMotion()`. No global media-query kill-switch.
  - **Motion and CSS never share a property.** Motion owns `pathLength` (the dash properties) and the pulse's `opacity`. CSS transitions `stroke` and `color` by name. No `transition: all`.
  - **Colours from role utilities only** (`stroke-fg`, `stroke-warning`, `stroke-danger`, `stroke-fg-dim`, `stroke-opponent`, `stroke-line` and their `text-*` pairs). No hex and no `stroke="#…"`.
  - `@/` imports only. The component takes a typed `CountdownRingProps`, and comments are only for the non-obvious.
- Verification:
  - `npm run lint`, `npm run format:check`, `npm test` and `npm run build` pass. The build output lists `/dev/ring`.
  - Searching for `#[0-9a-fA-F]{3,6}` under `src/` still matches only `tokens.css`.
  - In the browser at `/dev/ring`:
    - The live ring counts 15 → 0. It turns `warning` as 7 appears and `danger` as 3 appears, and the ring and numeral always share a colour.
    - Sampling `pathLength` against elapsed time (in Playwright) stays linear within one frame's worth of error.
    - The numeral has `font-variant-numeric: tabular-nums`, and single-digit values don't shift horizontally tick to tick.
    - Freeze holds the value. Waiting dims and holds it. Restart snaps to full.
    - With `prefers-reduced-motion: reduce` emulated, the ring keeps sweeping and the critical pulse is gone.
    - After switching tabs for a few seconds and coming back, the ring shows the correct remaining time, not where it left off.
    - The console shows no hydration warnings.
  - A screen reader finds a timer labelled "Time left" and doesn't announce every second.
- **Deviations recorded during implementation**
  - **Types:** `CountdownStage` and `RingMode` live in `src/types/countdown.ts`, per the rule that types sit in the types directory. The owner prop reuses `DuelActor`.
  - **Extra helper:** `roundDurationMs(round)` is exported from `src/lib/countdown.ts`, because the ring needs the full duration for its first render.
  - **Sweep direction:** `pathLength` is paired with `pathOffset`, so the gap opens at 12 o'clock and grows clockwise like a clock hand. The prototype draws the reverse, with the arc anchored at 12 and shrinking back.
  - **Colour shift:** applied as an inline `style` built from `MOTION_DURATION_MS.timerColorShift` and `MOTION_EASING.timerColorShift`. Tailwind `duration-200 ease-[ease]` classes would have duplicated those values.
  - **Pulse values:** opacity 1 → 0.6 → 1 over 1s with `easeInOut`. `theme.md` gives only "1s pulse".
  - **Reduced motion is read at mount:** Motion's `useReducedMotion()` doesn't re-render when the OS setting changes mid-session, so a ring already mounted keeps pulsing until it remounts. Emulating `reduce` before load drops the pulse, and the sweep keeps running.
  - **Ring geometry:** radius 46 and stroke 5 in a 100-unit viewBox (about 7px at 144px), with a `font-semibold` numeral.
  - **Preview split:** the page stays a server component with the `notFound()` guard. The live and static rings live in the client component `src/components/dev/RingPreview.tsx`, which takes its page-open time from `useSyncExternalStore`, so there's no rendering on the server and no setState in an effect.
  - **Static critical specimen is `frozen`,** so it doesn't pulse. The pulse is shown on the live ring.
  - **Tab-switch check:** Playwright's headless page never became hidden (`visibilityState` stayed `visible`). The ring was correct after 4s away, but real background throttling wasn't exercised. Correctness there follows from recomputing from the clock every frame.
  - **Superseded in the 2026-09-26 cleanup (no inline styles):**
    - The colour shift is now the Tailwind constant `TIMER_COLOR_SHIFT` in `src/styles/classes.ts`. `classes.test.ts` keeps its duration and curve in step with `motion.ts`, which answers the duplication concern above.
    - The sweep binds `stroke-dasharray` ("f 1") and `stroke-dashoffset` (f − 1) as Motion-value SVG props, with `pathLength={1}`, instead of passing `pathLength` and `pathOffset` through `style`. The rendered attributes are unchanged, as measured before and after.

## History
